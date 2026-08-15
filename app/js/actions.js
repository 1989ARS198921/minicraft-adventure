// ============================================================
//  ⛏️🧱 ДЕЙСТВИЯ: прицел, ломать и ставить блоки, подсветка
// ============================================================

import * as THREE from 'three';
import { CONFIG, PLACEABLE, DROPS } from './config.js';
import { emit } from './bus.js';
import { sfx } from './audio.js';
import { showToast, updateInvUI } from './ui.js';
import { blockAt, addBlock, removeBlockAt, chunkMeshes } from './world.js';
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
  const hits = raycaster.intersectObjects(meshes, true); // true = смотрим и внутрь групп
  return hits.length ? hits[0] : null;
}

// Клетка блока в прицеле + сторона грани, в которую уперлись
function aimBlockCell() {
  const hit = aim();
  if (!hit || hit.object.userData.torch || hit.object.userData.npc ||
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

  if (addBlock(nx, ny, nz, what)) {
    sfx.place();
    spendFromInv(what);
    emit('blockPlaced');
    updateHighlight();
  }
}

// Обновить жёлтую рамку подсветки
export function updateHighlight() {
  const cell = aimBlockCell();
  if (cell) {
    highlight.position.set(cell.x + 0.5, cell.y + 0.5, cell.z + 0.5);
    highlight.visible = true;
  } else highlight.visible = false;
}
