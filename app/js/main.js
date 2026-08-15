// ============================================================
//  🚀 ГЛАВНЫЙ МОДУЛЬ — собирает все кусочки игры вместе
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

const renderer = new THREE.WebGLRenderer({ antialias: !IS_TOUCH }); // на телефоне быстрее без сглаживания
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); // экономим батарею
renderer.outputEncoding = THREE.sRGBEncoding; // цвета сочнее и правильнее
document.body.appendChild(renderer.domElement);
scene.add(camera); // камера в сцене — к ней приклеена рука с предметом

// Свет: солнышко (или луна) + мягкий свет со всех сторон
const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
scene.add(sun);
scene.add(sun.target); // солнце всегда «смотрит» на игрока

// ---------- Игровой контекст: общий «чемоданчик» данных ----------
const G = {
  IS_TOUCH,
  scene, camera, renderer,
  player: createPlayer(),
  keys: {},               // нажатые клавиши
  joy: { x: 0, y: 0 },    // виртуальный джойстик
  slot: 0,                // выбранный слот инвентаря
  inv: { ...STARTER_INV }, // 🎒 карман: сколько каких блоков несём
  cam3rd: false,          // 🎥 вид: false = от первого лица, true = за спиной
  xp: 0, level: 1,        // ⭐ опыт и уровень (мини-RPG!)
  hp: 10,                 // ❤️ здоровье (10 половинок = 5 сердечек)
  equip: { weapon: null, armor: null }, // ⚔️ что надето: оружие и броня
  skills: { sword: 0, bow: 0, learning: 0 }, // 📚 ступени навыков (0..3)
  sp: 0,                // очки навыков (даём за уровни, тратим у тренеров)
  mana: 10,             // 💧 мана для заклинаний (Этап 3!)
  fx: { speed: 0, jump: 0 }, // 🧪 действующие зелья (секунды осталось)
  warmByFire: false,      // 🔥 греемся ли у костра прямо сейчас
  time: { t: CONFIG.START_TIME, daylight: 1 }, // время суток
  seed: Math.floor(Math.random() * 1e9)        // зерно генератора мира
};
// Для юных программистов: открой консоль (F12) и напиши G — увидишь все секреты игры!
window.G = G;

// ---------- Инициализация всех модулей ----------
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
// Тап по яблоку/зелью в рюкзаке = съесть/выпить
setUseItemHandler(type => type === 'apple' ? eatApple() : drinkPotion(type));

// ---------- Загрузка или создание мира ----------
setSeed(G.seed);
const hadSave = loadSave();   // пробуем загрузить сохранённый мир
G.player.fly = false;         // при входе в игру стоим на земле
streamChunks(true);           // сразу строим чанки вокруг игрока
if (!hadSave) {
  G.player.feet = groundHeight(1, -6) + 0.5; // у фонтана живой воды
  // В новом мире зажигаем уличные факелы и огоньки в домиках
  for (const [x, y, z] of [...VILLAGE_TORCHES, ...ELF_TORCHES, ...ORC_TORCHES]) addTorch(x, y, z, true);
  markDirty();                // новый мир — сразу сохраним
} else {
  const g = groundHeight(Math.floor(G.player.x), Math.floor(G.player.z));
  if (G.player.feet < g) G.player.feet = g; // не застреваем в блоках
}
renderQuests();
// 🧹 Пещера перестроена! Убираем факелы старой каменоломни из прошлых
// сохранений (они висели бы в воздухе), потом зажигаем новые.
for (const t of [...getTorches()])
  if (t.x >= -75 && t.x <= -54 && t.z >= 45 && t.z <= 65) {
    G.scene.remove(t.mesh);
    getTorches().splice(getTorches().indexOf(t), 1);
  }
// 🕯️ Факелы пещеры зажигаем всегда (даже в старом сохранении) —
// addTorch сам пропускает те, что уже горят
for (const [x, y, z] of DUNGEON_TORCHES) addTorch(x, y, z, true);
updateTorchLights();
updateMinimap(); // карту рисуем сразу, не дожидаясь 45-го кадра
updateInvUI();   // и сразу показываем, что лежит в кармане
renderBadge();   // и уровень из сохранения
renderHearts();  // ❤️ и сердечки из сохранения
initNPCs(G);     // жители селятся в деревне (нужен готовый мир!)
initFairy(G);    // 🦄 единорог на лугу, 🦔 ёжик на опушке
initDragons(G);  // 🐉 десять драконов гнездятся на пиках
initMobs(G);     // 👹 орки в стойбище, 🕷️ пауки в лесу
initMagic(G);    // 🔮 мана и заклинания (Этап 3!)
initDungeon(G);  // 🕯️ каменоломня гоблинов (Этап 4!)

// ---------- Главный цикл игры (60 раз в секунду) ----------
const clock = new THREE.Clock();
let frameNo = 0; // счётчик кадров для периодических дел

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05); // сколько секунд прошло

  stepPlayer(G, dt);        // физика: ходьба, прыжки, полёт

  // Периодические дела (не каждый кадр — бережём силы телефона):
  frameNo++;
  if (frameNo % 6 === 0) streamChunks();      // подгружаем мир по мере ходьбы
  if (frameNo % 5 === 0) updateHighlight();   // жёлтая рамка в прицеле
  if (frameNo % 30 === 0) { updateTorchLights(); updateSlowUI(); }
  if (frameNo % 45 === 0) updateMinimap();      // карта обновляется ~раз в секунду

  updateDayNight(dt);       // солнце, небо, звёзды
  updateClouds(dt);         // облака плывут над миром
  updateParticles(dt);      // осколки летят и тают
  updatePlayerModel(dt);    // фигурка игрока: шагает, машет руками
  updateNPCs(dt);           // жители гуляют по округе
  updateFairy(dt);          // 🦄 звери гуляют (от драконов — бегут!)
  updateDragons(dt);        // 🐉 драконы: гнёзда, круги, охота
  updateMobs(dt);           // 👹 монстры гоняются за игроком
  updateCampfires(dt);      // 🔥 костры потрескивают и греют
  updateHealth(dt);         // ❤️ сердечки, воздух под водой, зелья
  updateMagic(dt);          // 🔮 мана капает, огненные шары летят
  updateDungeon();          // 🕯️ «ура, каменоломня найдена!»

  // Камера: в глазах (1-е лицо) или за спиной (3-е лицо)
  updatePlayerCamera();

  renderer.render(scene, camera); // рисуем кадр
  requestAnimationFrame(tick);    // и сразу просим следующий
}
tick(); // поехали!

// Подстраиваем картинку под размер окна (и поворот телефона)
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Переопределяем инициализацию
export function initGameWithCities() {
  // Вызываем оригинальную инициализацию
  if (typeof originalInit === 'function') {
    originalInit();
  }
  
  // Создаём города и деревни
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

// Запускаем
if (typeof G !== 'undefined') {
  initGameWithCities();
}
// ============================================================
//  🏙️ ЗАГРУЗКА НЕБЕСНЫХ ГОРОДОВ
// ============================================================

import { buildAllSkyCities } from './world.js';

// Строим города после генерации мира
setTimeout(() => {
  console.log('🏙️ Начинаем строительство небесных городов...');
  try {
    const total = buildAllSkyCities();
    console.log(`✅ Небесные города построены! Добавлено ${total} блоков`);
  } catch(e) {
    console.error('❌ Ошибка строительства городов:', e);
  }
}, 3000);
