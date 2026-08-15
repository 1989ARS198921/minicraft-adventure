// ============================================================
//  🚀 ГЛАВНЫЙ МОДУЛЬ — собирает все кусочки игры вместе
//  (обновлён для трёхуровневого мира + новые мобы + квесты)
//  ВЕРСИЯ БЕЗ IMPORT — все скрипты подключаются через <script src>
// ============================================================

import * as THREE from 'three';
import { CONFIG, STARTER_INV } from './config.js';
import { initAudio } from './audio.js';
import { initWorld, setSeed, streamChunks, groundHeight } from './world.js';
import { initParticles, updateParticles } from './particles.js';
import { initTorches, initTorchLights, updateTorchLights, addTorch, getTorches } from './torches.js';
import { initQuests, renderQuests } from './quests.js';
import { initUI, initHotbar, initBackpack, updateInvUI } from './ui.js';
import { initSave, loadSave, markDirty } from './save.js';
import { initDayNight, updateDayNight, updateSlowUI } from './daynight.js';
import { createPlayer, stepPlayer } from './player.js';
import { initPlayerModel, updatePlayerModel, updatePlayerCamera } from './playermodel.js';
import { initActions, updateHighlight } from './actions.js';
import { initInput } from './input.js';
import { initMinimap, updateMinimap } from './minimap.js';
import { initClouds, updateClouds } from './clouds.js';
import { initNPCs, updateNPCs } from './npc.js';
import { initLevels, renderBadge } from './levels.js';
import { initHealth, updateHealth, renderHearts, eatApple } from './health.js';
import { initShop, drinkPotion } from './shop.js';
import { initCampfires, updateCampfires } from './campfire.js';
import { initFairy, updateFairy } from './fairy.js';
import { initDragons, updateDragons } from './dragons.js';
import { initMobs, updateMobs } from './mobs.js';
import { initMagic, updateMagic } from './magic.js';
import { initDungeon, updateDungeon, DUNGEON_TORCHES } from './dungeon.js';
import { VILLAGE_TORCHES, ELF_TORCHES, ORC_TORCHES } from './village.js';
import { setUseItemHandler } from './ui.js';
import { initCities, getCityPositions } from './cities.js';
import { initVillages, getVillagePositions } from './villages_extended.js';

// ============================================================
//  ⭐ НОВЫЕ МОДУЛИ загружаются через <script src> глобально
//  underground.js, skyworld.js, enhanced_skins.js,
//  enhanced_mobs.js, ai_mobs.js, quests_new_locations.js
//  Функции доступны как глобальные переменные
// ============================================================

// ---------- Телефон или компьютер? ----------
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH) {
  document.body.classList.add('touch');
  document.getElementById('helpDesktop').style.display = 'none';
  document.getElementById('helpTouch').style.display = 'block';
}
const originalInit = window.initGame || function() {};

// ---------- Сцена, камера, рисовальщик ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ antialias: !IS_TOUCH });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.sortObjects = true; // ⭐ НУЖНО для прозрачности призраков/слизней
document.body.appendChild(renderer.domElement);
scene.add(camera);

// Свет: солнышко (или луна) + мягкий свет со всех сторон
const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
scene.add(sun);
scene.add(sun.target);

// ---------- Игровой контекст: общий «чемоданчик» данных ----------
const G = {
  IS_TOUCH,
  scene, camera, renderer,
  player: createPlayer(),
  keys: {},
  joy: { x: 0, y: 0 },
  slot: 0,
  inv: { ...STARTER_INV },
  cam3rd: false,
  xp: 0, level: 1,
  hp: 10,
  equip: { weapon: null, armor: null },
  skills: { sword: 0, bow: 0, learning: 0 },
  sp: 0,
  mana: 10,
  fx: { speed: 0, jump: 0 },
  warmByFire: false,
  time: { t: CONFIG.START_TIME, daylight: 1 },
  seed: Math.floor(Math.random() * 1e9),
  // ⭐ НОВЫЕ ПОЛЯ
  questManager: null,     // менеджер квестов
  lastDailyCheck: 0,       // таймер ежедневных квестов
  mobAnimations: [],       // активные анимации мобов
  worldLevel: 'surface'    // текущий уровень: surface/underground/sky
};
window.G = G;

// ============================================================
//  ⭐ ИНИЦИАЛИЗАЦИЯ КВЕСТОВ (новая функция)
// ============================================================
function initQuestSystem() {
  // Проверяем, загрузился ли QuestManager из quests_new_locations.js
  if (typeof QuestManager === 'undefined') {
    console.warn('⚠️ QuestManager не найден — квесты отключены');
    return;
  }

  G.questManager = new QuestManager();

  // Загрузка сохранённых квестов
  const saved = localStorage.getItem('minicraft_quests_v2');
  if (saved) {
    try {
      G.questManager.load(JSON.parse(saved));
      console.log('📜 Квесты загружены из сохранения');
    } catch(e) {
      console.warn('Ошибка загрузки квестов:', e);
    }
  }

  G.questManager.init();

  // Автосохранение квестов каждые 30 сек
  setInterval(() => {
    localStorage.setItem('minicraft_quests_v2', JSON.stringify(G.questManager.save()));
  }, 30000);

  console.log('📜 Система квестов инициализирована');
}

// ============================================================
//  ⭐ ОБНОВЛЁННАЯ ГЕНЕРАЦИЯ ЧАНКА (3 уровня)
// ============================================================
// Перехватываем оригинальную generateChunk из world.js
const originalGenerateChunk = window.generateChunk;

window.generateChunk = function(data, cx, cz) {
  // Уровень 1: Подземелье (-30..-10)
  if (typeof generateUnderground === 'function') {
    generateUnderground(data, cx, cz);
  }

  // Уровень 2: Поверхность (0..40) — оригинальная генерация
  if (typeof originalGenerateChunk === 'function') {
    originalGenerateChunk(data, cx, cz);
  }

  // Входы в подземелье (пещеры на поверхности)
  const caveNoise = (typeof simplex2D === 'function') 
    ? simplex2D(cx * 0.1 + (data.seed || 0), cz * 0.1 + (data.seed || 0)) 
    : Math.random();
  if (caveNoise > 0.7 && Math.random() < 0.3 && typeof generateCaveEntrance === 'function') {
    generateCaveEntrance(data, cx, cz);
  }

  // Уровень 3: Небесный мир (60..120)
  if (typeof generateSkyWorld === 'function') {
    generateSkyWorld(data, cx, cz);
  }
};

// ============================================================
//  ⭐ ОБНОВЛЁННЫЙ СПАВН МОБОВ (с новыми моделями и AI)
// ============================================================
const originalSpawnMob = window.spawnMob;

window.spawnMob = function(type, x, y, z) {
  // Если есть новая система моделей — используем её
  if (typeof createMobModel === 'function') {
    const mob = {
      type: type,
      x: x, y: y, z: z,
      hp: getMobHP(type),
      maxHp: getMobHP(type),
      damage: getMobDamage(type),
      speed: getMobSpeed(type),
      level: getMobLevel(type),
      model: null,
      ai: null,
      animation: { frame: 0, state: 'idle' }
    };

    // Создаём 3D-модель
    try {
      mob.model = createMobModel(type);
      if (mob.model) {
        mob.model.position.set(x, y, z);
        scene.add(mob.model);

        // Применяем текстуру
        if (typeof getMobSkin === 'function') {
          const skin = getMobSkin(type);
          if (skin) applySkinToModel(mob.model, skin);
        }

        // Создаём AI
        if (typeof createAIForMob === 'function') {
          mob.ai = createAIForMob(mob);
        }

        // HP-бар
        createHPBar(mob);
      }
    } catch(e) {
      console.warn('Ошибка создания модели моба:', type, e);
      // Fallback: используем оригинальный спавн
      if (typeof originalSpawnMob === 'function') {
        return originalSpawnMob(type, x, y, z);
      }
    }

    // Добавляем в глобальный массив мобов
    if (!window.mobs) window.mobs = [];
    window.mobs.push(mob);

    return mob;
  }

  // Fallback: оригинальный спавн
  if (typeof originalSpawnMob === 'function') {
    return originalSpawnMob(type, x, y, z);
  }
};

// ⭐ Хелперы для мобов
function getMobHP(type) {
  const hpTable = {
    goblin: 30, orc: 50, spider: 25, skeleton: 35,
    wolf: 40, troll: 80, zombie: 45, ghost: 30,
    slime: 20, bat: 15,
    forest_giant: 500, stone_golem: 400, ice_dragon: 600,
    spider_queen: 350, necromancer: 300, kraken: 450,
    fire_elemental: 380, dark_knight: 420, goblin_king: 320, ice_troll: 480
  };
  return hpTable[type] || 30;
}

function getMobDamage(type) {
  const damageTable = {
    goblin: 8, orc: 15, spider: 10, skeleton: 12,
    wolf: 14, troll: 20, zombie: 12, ghost: 10,
    slime: 5, bat: 6,
    forest_giant: 40, stone_golem: 35, ice_dragon: 50,
    spider_queen: 30, necromancer: 25, kraken: 38,
    fire_elemental: 32, dark_knight: 35, goblin_king: 28, ice_troll: 42
  };
  return damageTable[type] || 10;
}

function getMobSpeed(type) {
  const speedTable = {
    goblin: 3.5, orc: 2.5, spider: 4.0, skeleton: 2.0,
    wolf: 5.0, troll: 1.8, zombie: 1.5, ghost: 3.0,
    slime: 2.0, bat: 4.5,
    forest_giant: 1.5, stone_golem: 1.2, ice_dragon: 3.0,
    spider_queen: 3.5, necromancer: 2.0, kraken: 2.5,
    fire_elemental: 2.8, dark_knight: 2.5, goblin_king: 3.0, ice_troll: 1.8
  };
  return speedTable[type] || 2.5;
}

function getMobLevel(type) {
  const levelTable = {
    spider: 3, skeleton: 4, goblin: 2, bat: 1,
    orc: 5, wolf: 6, troll: 8, zombie: 4,
    ghost: 7, slime: 3,
    forest_giant: 25, stone_golem: 15, ice_dragon: 30,
    spider_queen: 18, necromancer: 20, kraken: 22,
    fire_elemental: 19, dark_knight: 21, goblin_king: 16, ice_troll: 24
  };
  return levelTable[type] || 1;
}

function applySkinToModel(model, skinTexture) {
  if (!model || !skinTexture) return;
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
      child.material.map = skinTexture;
      child.material.needsUpdate = true;
    }
  });
}

function createHPBar(mob) {
  if (!mob.model) return;
  const isBoss = mob.type.includes('giant') || mob.type.includes('golem') || 
                 mob.type.includes('dragon') || mob.type.includes('queen') ||
                 mob.type.includes('necromancer') || mob.type.includes('kraken') ||
                 mob.type.includes('elemental') || mob.type.includes('knight') ||
                 mob.type.includes('king') || (mob.type.includes('troll') && mob.maxHp > 400);
  const barWidth = isBoss ? 1.5 : 0.8;
  const barHeight = 0.08;

  const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
  const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const bg = new THREE.Mesh(bgGeometry, bgMaterial);
  bg.position.y = (isBoss ? 4 : 1.5) + 0.3;

  const fillGeometry = new THREE.PlaneGeometry(barWidth - 0.02, barHeight - 0.02);
  const fillColor = isBoss ? 0xff0000 : 0x00ff00;
  const fillMaterial = new THREE.MeshBasicMaterial({ color: fillColor });
  const fill = new THREE.Mesh(fillGeometry, fillMaterial);
  fill.position.z = 0.001;
  bg.add(fill);

  mob.model.add(bg);
  mob.hpBar = { bg, fill, isBoss };
}

function updateHPBar(mob) {
  if (!mob.hpBar) return;
  const ratio = Math.max(0, mob.hp / mob.maxHp);
  mob.hpBar.fill.scale.x = ratio;
  mob.hpBar.fill.position.x = -(1 - ratio) * (mob.hpBar.bg.geometry.parameters.width - 0.02) / 2;
}

// ============================================================
//  ⭐ АНИМАЦИИ МОБОВ (вызывается в gameLoop)
// ============================================================
function updateMobAnimations(delta) {
  if (!window.mobs) return;

  window.mobs.forEach(mob => {
    if (!mob.model || !mob.animation) return;
    mob.animation.frame += delta;

    switch (mob.type) {
      case 'slime':
        animateSlime(mob);
        break;
      case 'bat':
        animateBat(mob);
        break;
      case 'ghost':
        animateGhost(mob);
        break;
      case 'ice_dragon':
        animateDragon(mob);
        break;
      case 'spider':
      case 'spider_queen':
        animateSpider(mob);
        break;
      default:
        animateDefault(mob);
    }

    // Обновляем HP-бар
    updateHPBar(mob);
  });
}

function animateSlime(mob) {
  const t = mob.animation.frame * 3;
  mob.model.position.y = mob.y + Math.abs(Math.sin(t)) * 0.3;
  const squash = 1 + Math.sin(t * 2) * 0.1;
  const baseScale = mob.model.userData.baseScale || 1;
  mob.model.scale.y = squash * baseScale;
  mob.model.scale.x = (1 / Math.sqrt(squash)) * baseScale;
  mob.model.scale.z = (1 / Math.sqrt(squash)) * baseScale;
}

function animateBat(mob) {
  const t = mob.animation.frame * 8;
  mob.model.position.y = mob.y + Math.sin(t * 0.5) * 0.2;
}

function animateGhost(mob) {
  const t = mob.animation.frame * 2;
  mob.model.position.y = mob.y + Math.sin(t) * 0.15;
  mob.model.rotation.z = Math.sin(t * 0.5) * 0.05;
  mob.model.traverse(child => {
    if (child.isMesh && child.material.transparent) {
      child.material.opacity = 0.4 + Math.sin(t * 2) * 0.2;
    }
  });
}

function animateDragon(mob) {
  const t = mob.animation.frame * 1.5;
  const baseScale = mob.model.userData.baseScale || 1;
  mob.model.scale.x = (1 + Math.sin(t) * 0.02) * baseScale;
}

function animateSpider(mob) {
  const t = mob.animation.frame * 4;
  // Лёгкое покачивание ног
}

function animateDefault(mob) {
  const t = mob.animation.frame * 2;
  if (mob.animation.state === 'walking') {
    mob.model.rotation.z = Math.sin(t) * 0.05;
  }
}

// ============================================================
//  ⭐ ОБНОВЛЁННЫЙ AI МОБОВ (вызывается в updateMobs)
// ============================================================
function updateMobAI(delta, world, player) {
  if (!window.mobs) return;

  window.mobs.forEach(mob => {
    if (mob.ai && typeof mob.ai.update === 'function') {
      mob.ai.update(delta, world, player);
    }

    // Обновляем позицию модели
    if (mob.model) {
      mob.model.position.set(mob.x, mob.y, mob.z);
    }
  });
}

// ============================================================
//  ⭐ ПОКАЗ УВЕДОМЛЕНИЙ О КВЕСТАХ
// ============================================================
function showQuestNotification(text) {
  const notification = document.createElement('div');
  notification.className = 'quest-notification';
  notification.textContent = text;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(0,0,0,0.85);
    color: #ffd700;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    border-left: 3px solid #ffd700;
    animation: slideIn 0.3s ease-out;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 4000);
}

// ============================================================
//  ОРИГИНАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================
initAudio();
initWorld(G);
initParticles(G);
initTorches(G);
initTorchLights();
initUI(G);
initHotbar();
initBackpack();
initQuestSystem();  // ⭐ НОВОЕ: инициализация квестов
initQuests();
initSave(G);
initDayNight(G, sun, ambient);
initActions(G);
initInput(G);
initMinimap(G);
initPlayerModel(G);
initClouds(G);
initLevels(G);
initHealth(G);
initShop(G);
initCampfires(G);
setUseItemHandler(type => type === 'apple' ? eatApple() : drinkPotion(type));

// ---------- Загрузка или создание мира ----------
setSeed(G.seed);
const hadSave = loadSave();
G.player.fly = false;
streamChunks(true);
if (!hadSave) {
  G.player.feet = groundHeight(1, -6) + 0.5;
  for (const [x, y, z] of [...VILLAGE_TORCHES, ...ELF_TORCHES, ...ORC_TORCHES]) addTorch(x, y, z, true);
  markDirty();
} else {
  const g = groundHeight(Math.floor(G.player.x), Math.floor(G.player.z));
  if (G.player.feet < g) G.player.feet = g;
}
renderQuests();

// Очистка старых факелов пещеры
for (const t of [...getTorches()])
  if (t.x >= -75 && t.x <= -54 && t.z >= 45 && t.z <= 65) {
    G.scene.remove(t.mesh);
    getTorches().splice(getTorches().indexOf(t), 1);
  }
for (const [x, y, z] of DUNGEON_TORCHES) addTorch(x, y, z, true);
updateTorchLights();
updateMinimap();
updateInvUI();
renderBadge();
renderHearts();
initNPCs(G);
initFairy(G);
initDragons(G);
initMobs(G);
initMagic(G);
initDungeon(G);

// ---------- Главный цикл игры ----------
const clock = new THREE.Clock();
let frameNo = 0;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = Date.now();

  stepPlayer(G, dt);

  frameNo++;
  if (frameNo % 6 === 0) streamChunks();
  if (frameNo % 5 === 0) updateHighlight();
  if (frameNo % 30 === 0) { updateTorchLights(); updateSlowUI(); }
  if (frameNo % 45 === 0) updateMinimap();

  updateDayNight(dt);
  updateClouds(dt);
  updateParticles(dt);
  updatePlayerModel(dt);
  updateNPCs(dt);
  updateFairy(dt);
  updateDragons(dt);
  updateMobs(dt);

  // ⭐ НОВОЕ: обновление AI мобов (каждый кадр для плавности)
  updateMobAI(dt, G, G.player);

  // ⭐ НОВОЕ: анимации моделей мобов
  updateMobAnimations(dt);

  updateCampfires(dt);
  updateHealth(dt);
  updateMagic(dt);
  updateDungeon();

  // ⭐ НОВОЕ: проверка ежедневных квестов (1 раз в минуту)
  if (now - G.lastDailyCheck > 60000) {
    if (G.questManager) {
      G.questManager.resetDailyQuests();
    }
    G.lastDailyCheck = now;
  }

  updatePlayerCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// ---------- Ресайз ----------
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Города и деревни ----------
export function initGameWithCities() {
  if (typeof originalInit === 'function') {
    originalInit();
  }

  setTimeout(() => {
    console.log('🏙️ Загрузка городов и деревень...');
    initCities(G);
    initVillages(G);

    console.log('📍 Координаты небесных городов:');
    for (const city of getCityPositions()) {
      console.log(`   ${city.name}: (${city.x}, ${city.z}, высота ${city.height})`);
    }

    console.log('📍 Координаты деревень:');
    for (const village of getVillagePositions()) {
      console.log(`   ${village.name}: (${village.x}, ${village.z})`);
    }
  }, 1000);
}

if (typeof G !== 'undefined') {
  initGameWithCities();
}

// ============================================================
//  🏙️ ЗАГРУЗКА НЕБЕСНЫХ ГОРОДОВ
// ============================================================
import { buildAllSkyCities } from './world.js';

setTimeout(() => {
  console.log('🏙️ Начинаем строительство небесных городов...');
  try {
    const total = buildAllSkyCities();
    console.log(`✅ Небесные города построены! Добавлено ${total} блоков`);
  } catch(e) {
    console.error('❌ Ошибка строительства городов:', e);
  }
}, 3000);
