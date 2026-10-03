// ============================================================
//  ⛏️🧱 ДЕЙСТВИЯ: прицел, ломать и ставить блоки, подсветка
// ============================================================

import * as THREE from 'three';
import { CONFIG, PLACEABLE, DROPS } from './config.js';
import { emit } from './bus.js';
import { sfx } from './audio.js';
import { showToast, updateInvUI } from './ui.js';
import { blockAt, addBlock, removeBlockAt, chunkMeshes, isDelta } from './world.js';
import { openStorage } from './gameplay.js';
import { portalMeshes, openPortalMenu } from './portals.js';
import { getTorches, addTorch, removeTorch } from './torches.js';
import { npcGroups, interactNPC } from './npc.js';
import { fairyGroups, petFairy } from './fairy.js';
import { dragonGroups, petDragon } from './dragons.js';
import { mobGroups, attackMob, shootArrow } from './mobs.js';
import { gear } from './equip.js';
import { spawnParticles } from './particles.js';
import { updatePlayerCamera } from './playermodel.js';

let G = null;
let highlight; // жёлтая рамка вокруг блока в прицеле

export function initActions(gameContext) {
  G = gameContext;
  highlight = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
    new THREE.LineBasicMaterial({ color: 0xFFE14D })
  );
  highlight.visible = false;
  G.scene.add(highlight);
}

const raycaster = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0); // смотрим ровно в центр экрана

function updateCamera() {
  updatePlayerCamera(); // та же функция, что и в главном цикле
}

// «Луч зрения»: ближайший объект в прицеле (чанки + факелы + жители + звери)
function aim() {
  updateCamera();
  raycaster.setFromCamera(CENTER, G.camera);
  raycaster.far = CONFIG.REACH;
  const meshes = chunkMeshes();
  for (const t of getTorches()) meshes.push(t.mesh);
  for (const g of npcGroups()) meshes.push(g);
  for (const g of fairyGroups()) meshes.push(g);
  for (const g of dragonGroups()) meshes.push(g);
  for (const g of mobGroups()) meshes.push(g);
  for (const g of portalMeshes()) meshes.push(g); // 🔵 порталы
  const hits = raycaster.intersectObjects(meshes, true); // true = смотрим и внутрь групп
  return hits.length ? hits[0] : null;
}

// 👆 Тап по экрану: луч из ТОЧКИ ПАЛЬЦА (не из центра) — только по персонажам
const TAP_PT = new THREE.Vector2();
export function doTapAt(cx, cy) {
  updateCamera();
  // NDC считаем от РЕАЛЬНЫХ границ canvas, а не от innerHeight —
  // иначе при схлопнутой строке адреса Chrome луч уезжает вниз!
  const rect = (G.renderer && G.renderer.domElement.getBoundingClientRect)
    ? G.renderer.domElement.getBoundingClientRect()
    : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  TAP_PT.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(TAP_PT, G.camera);
  raycaster.far = CONFIG.REACH + 2; // чуть дальше, чтобы не тянуться вплотную
  const meshes = [];
  for (const g of npcGroups()) meshes.push(g);
  for (const g of fairyGroups()) meshes.push(g);
  for (const g of dragonGroups()) meshes.push(g);
  for (const g of mobGroups()) meshes.push(g);
  for (const g of portalMeshes()) meshes.push(g); // 🔵 порталы
  const hits = raycaster.intersectObjects(meshes, true);
  if (!hits.length) return false;
  const u = hits[0].object.userData;
  if (u.portal) { openPortalMenu(u.portal); return true; }
  if (u.npc) { interactNPC(u.npc); return true; }
  if (u.fairy) { petFairy(u.fairy); return true; }
  if (u.dragon) { petDragon(u.dragon); return true; }
  if (u.mob) { G.swingT = 0.3; attackMob(u.mob); return true; }
  return false;
}

// Клетка блока в прицеле + сторона грани, в которую уперлись
function aimBlockCell() {
  const hit = aim();
  if (!hit || hit.object.userData.torch || hit.object.userData.npc || hit.object.userData.portal ||
      hit.object.userData.fairy || hit.object.userData.dragon || hit.object.userData.mob) return null;
  const n = hit.face.normal;
  // Шаг назад от точки попадания — внутрь блока
  return {
    x: Math.floor(hit.point.x - n.x * 0.5),
    y: Math.floor(hit.point.y - n.y * 0.5),
    z: Math.floor(hit.point.z - n.z * 0.5),
    normal: n
  };
}

// Положить добычу в карман (если из блока что-то выпадает)
function collectDrop(type) {
  const drop = DROPS[type];
  if (drop) { G.inv[drop] = (G.inv[drop] || 0) + 1; updateInvUI(); }
  // Руды — не кладём в руку, а записываем в трофеи рюкзака 🏆
  if (type.endsWith('Ore')) G.inv[type] = (G.inv[type] || 0) + 1;
  // Ствол даёт и доски, и дрова для костра!
  if (type === 'trunk') {
    G.inv.firewood = (G.inv.firewood || 0) + 1;
    updateInvUI();
  }
  // Из листвы иногда падает яблоко! 🍎
  if (type === 'leaf' && Math.random() < 0.2) {
    G.inv.apple = (G.inv.apple || 0) + 1;
    updateInvUI();
    showToast('🍎 Яблоко! Съешь его из рюкзака, когда захочется');
  }
}

// 🏹 Дальний прицел для лука: ищем монстра аж на 30 блоков!
function aimMobFar() {
  updateCamera();
  raycaster.setFromCamera(CENTER, G.camera);
  raycaster.far = 30;
  const hits = raycaster.intersectObjects(mobGroups(), true);
  return hits.length ? hits[0].object.userData.mob : null;
}

// ============================================================
//  🚪 ДВЕРИ — тап открывает/закрывает, двойной тап ломает
// ============================================================
let lastDoorTap = { x: 0, y: 0, z: 0, t: 0 };
function handleDoorTap(cell, type) {
  const now = Date.now();
  const dbl = lastDoorTap.t && now - lastDoorTap.t < 400 &&
    lastDoorTap.x === cell.x && lastDoorTap.y === cell.y && lastDoorTap.z === cell.z;
  lastDoorTap = { x: cell.x, y: cell.y, z: cell.z, t: now };
  const by = type.includes('Top') ? cell.y - 1 : cell.y; // нижняя половинка
  if (dbl) { // 💥 двойной тап — дверь ломается и падает в карман
    removeBlockAt(cell.x, by, cell.z);
    removeBlockAt(cell.x, by + 1, cell.z);
    collectDrop('door');
    spawnParticles(cell.x, by, cell.z, 'door');
    sfx.brk();
    updateHighlight();
    return;
  }
  const b = blockAt(cell.x, by, cell.z);
  if (!b || !b.startsWith('door')) return;
  const opening = !b.includes('Open');
  removeBlockAt(cell.x, by, cell.z);
  addBlock(cell.x, by, cell.z, opening ? 'doorOpen' : 'door');
  removeBlockAt(cell.x, by + 1, cell.z);
  addBlock(cell.x, by + 1, cell.z, opening ? 'doorTopOpen' : 'doorTop');
  sfx.place();
  showToast(opening ? '🚪 Дверь открыта (двойной тап — сломать)' : '🚪 Дверь закрыта');
  updateHighlight();
}

// ============================================================
//  💥 ТРЕЩИНЫ — твёрдые блоки ломаются в несколько ударов,
//  и по ним ползут трещины! Число = сколько ударов нужно.
// ============================================================
const HARDNESS = {
  stone: 2, stoneBricks: 2, brick: 2, glowstone: 2, cloudStone: 2,
  coalOre: 3, goldOre: 3, crystal: 3, diamondOre: 4, obsidian: 6
};
let crackMesh = null, crackStage = 0, crackUntil = 0;
const crackCell = { x: 0, y: 0, z: 0, on: false };

// 5 картинок трещин: от лёгких царапин до паутины разломов
const crackTexs = [];
function crackTex(stage) {
  if (crackTexs[stage]) return crackTexs[stage];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(10, 8, 6, 0.85)';
  let seed = 7 + stage * 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let l = 0; l < 2 + stage * 2; l++) {
    g.lineWidth = 1.5 + rnd() * 1.5;
    g.beginPath();
    let x = 8 + rnd() * 48, y = 8 + rnd() * 48;
    g.moveTo(x, y);
    for (let k = 0; k < 3 + stage; k++) {
      x += (rnd() - 0.5) * 28; y += (rnd() - 0.5) * 28;
      g.lineTo(Math.max(0, Math.min(64, x)), Math.max(0, Math.min(64, y)));
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  crackTexs[stage] = t;
  return t;
}

function showCracks(cell, frac) { // frac 0..1 — насколько блок потрёпан
  if (!crackMesh) {
    crackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.004, 1.004, 1.004),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
    );
    crackMesh.renderOrder = 2;
    G.scene.add(crackMesh);
  }
  crackMesh.material.map = crackTex(Math.min(4, Math.floor(frac * 4.99)));
  crackMesh.material.needsUpdate = true;
  crackMesh.visible = true;
  crackMesh.position.set(cell.x + 0.5, cell.y + 0.5, cell.z + 0.5);
}
function hideCracks() {
  if (crackMesh) crackMesh.visible = false;
  crackCell.on = false;
}

export function doBreak() { // ⛏️ сломать то, на что смотрим
  // 🏹 Лук в руках? Тап по монстру = выстрел даже издалека!
  if (gear(G).weapon === 'bow') {
    const m = aimMobFar();
    if (m) {
      if ((G.inv.arrows || 0) > 0) {
        G.inv.arrows--; updateInvUI();
        G.swingT = 0.3; // замах — натягиваем тетиву!
        shootArrow(m);
        emit('dirty');
      } else { showToast('➶ Стрелы кончились! Купи ещё у эльфов'); sfx.no(); }
      return;
    }
  }
  const hit = aim();
  if (!hit) return;
  if (hit.object.userData.npc) { // 🧍 тап по жителю — разговор, а не ломание!
    interactNPC(hit.object.userData.npc);
    return;
  }
  if (hit.object.userData.fairy) { // 🦄 тап по зверю — погладить!
    petFairy(hit.object.userData.fairy);
    return;
  }
  if (hit.object.userData.dragon) { // 🐉 тап по дракону — поздороваться!
    petDragon(hit.object.userData.dragon);
    return;
  }
  if (hit.object.userData.portal) { // 🔵 тап по порталу — меню телепорта!
    openPortalMenu(hit.object.userData.portal);
    return;
  }
  if (hit.object.userData.mob) { // ⚔️ тап по монстру — АТАКА!
    G.swingT = 0.3; // замах рукой/мечом (анимация в playermodel)
    attackMob(hit.object.userData.mob);
    return;
  }
  if (hit.object.userData.torch) { // факелы тоже ломаются!
    const t = getTorches().find(t => t.mesh === hit.object);
    if (t) { removeTorch(t); collectDrop('torch'); }
    updateHighlight();
    return;
  }
  const cell = aimBlockCell();
  if (!cell) return;
  if (cell.y <= CONFIG.BEDROCK_Y) { showToast('🪨 Это непробиваемая скала!'); sfx.no(); return; }
  const type = blockAt(cell.x, cell.y, cell.z);
  // 📦 Свой сундук: тап/клик — открыть склад! (Shift+клик — сломать)
  if (type === 'chest' && isDelta(cell.x, cell.y, cell.z) && !G.keys['ShiftLeft'] && !G.keys['ShiftRight']) {
    openStorage(cell.x, cell.y, cell.z);
    return;
  }
  // 🚪 Дверь: тап — открыть/закрыть, двойной тап — сломать
  if (type && type.startsWith('door')) { handleDoorTap(cell, type); return; }
  // 💥 Твёрдый блок? Ломаем в несколько ударов — трещины всё глубже!
  const hard = HARDNESS[type] || 1;
  if (hard > 1) {
    const same = crackCell.on && crackCell.x === cell.x && crackCell.y === cell.y && crackCell.z === cell.z;
    crackStage = same ? crackStage + 1 : 1;
    Object.assign(crackCell, { x: cell.x, y: cell.y, z: cell.z, on: true });
    crackUntil = Date.now() + 4000; // отвлёкся — блок «заживает»
    if (crackStage < hard) {
      showCracks(cell, crackStage / hard);
      spawnParticles(cell.x, cell.y, cell.z, type || 'stone');
      return;
    }
    hideCracks(); // последний удар — блок разваливается ниже
  }
  if (removeBlockAt(cell.x, cell.y, cell.z)) {
    // Дверь — две клетки высотой: убираем вторую половинку тоже
    if (type === 'door' && blockAt(cell.x, cell.y + 1, cell.z) === 'doorTop')
      removeBlockAt(cell.x, cell.y + 1, cell.z);
    if (type === 'doorTop' && blockAt(cell.x, cell.y - 1, cell.z) === 'door')
      removeBlockAt(cell.x, cell.y - 1, cell.z);
    sfx.brk();
    collectDrop(type); // добыча — в карман! 🎒
    spawnParticles(cell.x, cell.y, cell.z, type || 'stone'); // фейерверк из осколков!
    emit('blockBroken', type); // квесты слушают это событие
    emit('blockBrokenAt', type, cell.x, cell.y, cell.z); // сундуки с сокровищами!
    updateHighlight();
  }
}

// Есть ли такой блок в кармане? (Infinity = бесконечный запас)
function hasInInv(what) {
  return G.inv[what] === Infinity || G.inv[what] > 0;
}
function spendFromInv(what) {
  if (G.inv[what] !== Infinity) G.inv[what]--;
  updateInvUI();
}

export function doPlace() { // 🧱 поставить рядом с тем, куда смотрим
  const cell = aimBlockCell();
  if (!cell) return;
  const n = cell.normal;
  const nx = cell.x + Math.round(n.x);
  const ny = cell.y + Math.round(n.y);
  const nz = cell.z + Math.round(n.z);
  if (ny > CONFIG.BUILD_MAX_Y) return; // не строим выше неба

  const what = PLACEABLE[G.slot];
  // ↩️ Ступенька поворачивается: поднимается ОТ игрока, как настоящая лестница
  let placeType = what;
  if (what === 'stair') {
    const dx = G.player.x - nx, dz = G.player.z - nz;
    placeType = Math.abs(dx) > Math.abs(dz)
      ? (dx < 0 ? 'stairE' : 'stairW')
      : (dz < 0 ? 'stair' : 'stairN'); // stair = высокая сторона на юге
  }
  // Карман пуст? Сначала добудь!
  if (!hasInInv(what)) {
    showToast('🎒 Нет таких блоков — сначала добудь!');
    sfx.no();
    return;
  }
  if (what === 'torch') { // факел — маленький, ставится только СВЕРХУ блока
    if (Math.round(n.y) !== 1) { showToast('🔥 Факел ставится сверху блока!'); sfx.no(); return; }
    if (addTorch(nx, ny, nz)) { spendFromInv(what); updateHighlight(); }
    return;
  }
  if (what === 'door') { // дверь стоит НА земле и занимает две клетки вверх
    if (Math.round(n.y) !== 1) { showToast('🚪 Дверь ставится на землю!'); sfx.no(); return; }
    if (blockAt(nx, ny + 1, nz)) { showToast('🚪 Над дверью нужно пустое место!'); sfx.no(); return; }
    if (addBlock(nx, ny, nz, 'door') && addBlock(nx, ny + 1, nz, 'doorTop')) {
      sfx.place();
      spendFromInv(what);
      emit('blockPlaced');
      updateHighlight();
    } else removeBlockAt(nx, ny, nz); // не вышло — убираем половинку
    return;
  }

  // Нельзя ставить блок внутрь самого себя!
  const pbx = Math.floor(G.player.x), pbz = Math.floor(G.player.z);
  const feetCell = Math.floor(G.player.feet);
  if (nx === pbx && nz === pbz && (ny === feetCell || ny === feetCell + 1)) return;

  if (addBlock(nx, ny, nz, placeType)) {
    sfx.place();
    spendFromInv(what);
    emit('blockPlaced');
    updateHighlight();
  }
}

// Обновить жёлтую рамку подсветки
export function updateHighlight() {
  if (crackCell.on && Date.now() > crackUntil) hideCracks(); // блок «зажил»
  const cell = aimBlockCell();
  if (cell) {
    highlight.position.set(cell.x + 0.5, cell.y + 0.5, cell.z + 0.5);
    highlight.visible = true;
  } else highlight.visible = false;
}
