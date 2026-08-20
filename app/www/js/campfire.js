// ============================================================
//  🔥 КОСТЁР — разводим ночью из дров и спичек!
//  Нужно: 2 дрова (выпадают из стволов) + 1 спичка (лавка).
//  Костёр светит, потрескивает искрами и греет: рядом с ним
//  ночью сердечки возвращаются быстрее. Уют!
// ============================================================

import * as THREE from 'three';
import { groundHeight } from './world.js';
import { sfx } from './audio.js';
import { showToast, updateInvUI, renderBackpackIfOpen } from './ui.js';
import { emit } from './bus.js';

let G = null;
const fires = []; // {x, y, z, group, flame, embers[], light}
const MAX_FIRES = 6;

export function initCampfires(gameContext) { G = gameContext; }
export function getFires() { return fires; }

// Дровяные поленца крест-накрест + язычок пламени
function makeFireMesh() {
  const group = new THREE.Group();
  const logMat = new THREE.MeshLambertMaterial({ color: 0x8A5A2B });
  const logGeo = new THREE.BoxGeometry(0.8, 0.18, 0.18);
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.y = i * Math.PI / 3; // поленца звёздочкой
    log.position.y = 0.1 + i * 0.05;
    group.add(log);
  }
  // Пламя — яркий кубик, который будет «танцевать»
  const flame = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.5, 0.34),
    new THREE.MeshBasicMaterial({ color: 0xFF9933 }) // светится сам
  );
  flame.position.y = 0.5;
  group.add(flame);
  return { group, flame };
}

// Искорки: маленькие оранжевые квадратики, взлетают и тают
const emberGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
const emberMat = new THREE.MeshBasicMaterial({ color: 0xFFCC55 });
function makeEmbers(group) {
  const embers = [];
  for (let i = 0; i < 3; i++) {
    const e = new THREE.Mesh(emberGeo, emberMat);
    e.userData.t = Math.random(); // у каждой искорки свой ритм
    group.add(e);
    embers.push(e);
  }
  return embers;
}

// Развести костёр перед собой (кнопка 🔥 или клавиша F)
export function tryMakeFire() {
  if ((G.inv.firewood || 0) < 2) {
    showToast('🪵 Нужны 2 дрова! Наруби стволов деревьев');
    sfx.no(); return;
  }
  if ((G.inv.matches || 0) < 1) {
    showToast('🔥 Нужна спичка! Купи в лавке у Тихона');
    sfx.no(); return;
  }
  if (fires.length >= MAX_FIRES) {
    showToast('🔥 Костров уже много! Хватит греться 🙂');
    sfx.no(); return;
  }
  // Место: перед игроком на земле
  const p = G.player;
  const fx = Math.floor(p.x - Math.sin(p.yaw) * 1.6);
  const fz = Math.floor(p.z - Math.cos(p.yaw) * 1.6);
  addFire(fx, groundHeight(fx, fz), fz);
  // Тратим припасы: дрова сгорают в костре, спичка — чирк!
  G.inv.firewood -= 2;
  G.inv.matches -= 1;
  updateInvUI();
  renderBackpackIfOpen();
  showToast('🔥 Ура, костёр! Ночью рядом с ним тепло и здоровье растёт');
  sfx.torch();
  emit('fire'); // квест «Разведи костёр»
  emit('dirty');
}

// Поставить костёр в клетке (тихо — при загрузке сохранения)
export function addFire(x, y, z, silent = false) {
  if (fires.some(f => f.x === x && f.z === z)) return;
  const { group, flame } = makeFireMesh();
  group.position.set(x + 0.5, y, z + 0.5);
  const embers = makeEmbers(group);
  const light = new THREE.PointLight(0xFF8C33, 0, 14);
  light.position.set(0, 0.9, 0);
  group.add(light);
  G.scene.add(group);
  fires.push({ x, y, z, group, flame, embers, light });
  if (!silent) emit('dirty');
}

// Каждый кадр: пламя танцует, искорки взлетают, ночью светит ярче
export function updateCampfires(dt) {
  const night = 1 - G.time.daylight;
  G.warmByFire = false;
  for (const f of fires) {
    const t = performance.now() / 1000;
    // Пламя пружинит и покачивается — живой огонёк!
    f.flame.scale.set(1 + Math.sin(t * 11) * 0.12, 1 + Math.sin(t * 13) * 0.2, 1);
    f.flame.rotation.y = t * 2;
    // Ночью костёр светит сильнее, чуть-чуть мерцает
    f.light.intensity = (0.6 + night * 1.6) * (1 + Math.sin(t * 9) * 0.08);
    // Искорки взлетают над поленцами и гаснут
    for (const e of f.embers) {
      e.userData.t += dt * 0.7;
      if (e.userData.t > 1) { // новая искорка
        e.userData.t = 0;
        e.position.set((Math.random() - 0.5) * 0.3, 0.4, (Math.random() - 0.5) * 0.3);
      }
      e.position.y += dt * 0.8;
      e.scale.setScalar(Math.max(0.05, 1 - e.userData.t));
    }
    // Стоим рядом ночью? Нам тепло! ❤️
    if (night > 0.6 && Math.hypot(f.x + 0.5 - G.player.x, f.z + 0.5 - G.player.z) < 5)
      G.warmByFire = true;
  }
}
