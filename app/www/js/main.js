// ============================================================
//  🚀 ГЛАВНЫЙ МОДУЛЬ — собирает все кусочки игры вместе
//  (обновлён для трёхуровневого мира + новые мобы + квесты)
//  ВЕРСИЯ БЕЗ IMPORT — все скрипты подключаются через <script src>
// ============================================================

import * as THREE from 'three';
import { CONFIG, STARTER_INV } from './config.js';
import { initAudio } from './audio.js';
import { initWorld, setSeed, streamChunks, groundHeight, blockAt } from './world.js';
import { initParticles, updateParticles } from './particles.js';
import { initTorches, initTorchLights, updateTorchLights, addTorch, getTorches } from './torches.js';
import { initQuests, renderQuests, questState } from './quests.js';
import { on } from './bus.js';
import { initUI, initHotbar, initBackpack, updateInvUI, showToast as showToast2 } from './ui.js';
import { initSave, loadSave, markDirty } from './save.js';
import { initDayNight, updateDayNight, updateSlowUI } from './daynight.js';
import { createPlayer, stepPlayer } from './player.js';
import { initPlayerModel, updatePlayerModel, updatePlayerCamera } from './playermodel.js';
import { initActions, updateHighlight } from './actions.js';
import { initInput } from './input.js';
import { initGameplay, useBed } from './gameplay.js';
import { initPortals, updatePortals } from './portals.js';
import { initMinimap, updateMinimap } from './minimap.js';
import { initClouds, updateClouds } from './clouds.js';
import { initNPCs, updateNPCs } from './npc.js';
import { initLevels, renderBadge } from './levels.js';
import { initHealth, updateHealth, renderHearts, eatApple } from './health.js';
import { initShop, drinkPotion } from './shop.js';
import { initCampfires, updateCampfires } from './campfire.js';
import { initFairy, updateFairy } from './fairy.js';
import { initDragons, updateDragons } from './dragons.js';
import { initMobs, updateMobs, spawnKaschey } from './mobs.js';
import { initMagic, updateMagic } from './magic.js';
import { initDungeon, updateDungeon, DUNGEON_TORCHES } from './dungeon.js';
import { CITY_TORCHES } from './surface_cities.js';
import { HOGWARTS_TORCHES } from './hogwarts.js';
import { KASCHEY_TORCHES, YAGA_TORCHES } from './fairytale.js';
import { initLairs } from './lairs.js';
import { VILLAGE_TORCHES, ELF_TORCHES, ORC_TORCHES } from './village.js';
import { setUseItemHandler } from './ui.js';
import { initCities, getCityPositions } from './cities.js';
import { initVillages, getVillagePositions } from './villages_extended.js';
import { initSkills } from './skills.js';
import { initArtifacts, updateArtifacts, ARTIFACTS } from './artifacts.js';
import { initQuestSites, updateQuestSites } from './quest_locations.js';

// ============================================================
//  ⭐ Глобальные скрипты (<script src> в index.html):
//  underground.js, skyworld.js, enhanced_mobs.js (модели мобов)
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
G.getBlock=blockAt;
window.G = G;

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
initGameplay(G); // 🌟 печати, достижения, кровать, склад
initPortals(G); // 🔵 порталы-телепорты
setUseItemHandler(type => {
  if (type === 'apple') return eatApple();
  if (type === 'bed') return useBed(); // 🛏️ установить точку дома
  if (ARTIFACTS[type]) { // ✨ артефакт: показываем, что он чудит
    const a = ARTIFACTS[type];
    showToast2(`${a.icon} ${a.name}: ${a.desc} (работает сам, пока в рюкзаке)`);
    return;
  }
  return drinkPotion(type);
});

// ---------- Загрузка или создание мира ----------
setSeed(G.seed);
const hadSave = loadSave();
G.player.fly = false;
streamChunks(true);
if (!hadSave) {
  G.player.feet = groundHeight(1, -6, 40) + 0.5;
  for (const [x, y, z] of [...VILLAGE_TORCHES, ...ELF_TORCHES, ...ORC_TORCHES]) addTorch(x, y, z, true);
  markDirty();
} else {
  const g = groundHeight(Math.floor(G.player.x), Math.floor(G.player.z), 60);
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
// 🏮 Фонари пяти больших городов
for (const [x, y, z] of CITY_TORCHES) addTorch(x, y, z, true);
for (const [x, y, z] of HOGWARTS_TORCHES) addTorch(x, y, z, true);
for (const [x, y, z] of KASCHEY_TORCHES) addTorch(x, y, z, true);
for (const [x, y, z] of YAGA_TORCHES) addTorch(x, y, z, true);
initLairs(G);
updateTorchLights();
updateMinimap();
updateInvUI();
renderBadge();
renderHearts();
initNPCs(G);
initFairy(G);
initDragons(G);
initMobs(G);

// 💀 ФИНАЛ (Этап 10): герой предъявил 6 печатей — Кащей предал и напал!
on('kascheyFight', () => {
  showToast2('💀 Кащей: Печати мои!.. Ты больше не нужен, герой. УМРИ!');
  setTimeout(() => showToast2('⚔️ ФИНАЛЬНАЯ БИТВА: победи Кащея Бессмертного!'), 2500);
  spawnKaschey();
});
// Если игрок вышел посреди финальной битвы — Кащей ждёт его снова
if (questState.legend_face && questState.legend_face.done &&
    !(questState.kaschey_boss && questState.kaschey_boss.done)) {
  spawnKaschey();
}
initSkills(G);
initArtifacts(G);
initQuestSites(G);
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

  updatePortals(dt); // 🔵 крутим кристаллы, ищем активации
  updateDayNight(dt);
  updateClouds(dt);
  updateParticles(dt);
  updatePlayerModel(dt);
  updateNPCs(dt);
  updateFairy(dt);
  updateDragons(dt);
  updateMobs(dt);

  updateCampfires(dt);
  updateHealth(dt);
  updateArtifacts(dt);
  updateQuestSites(dt);
  updateMagic(dt);
  updateDungeon();

  updatePlayerCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// ---------- Ресайз ----------
const onResize = () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
};
window.addEventListener('resize', onResize);
// 📱 Chrome Android: строка адреса меняет высоту БЕЗ resize — ловим visualViewport
if (window.visualViewport) visualViewport.addEventListener('resize', onResize);

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
