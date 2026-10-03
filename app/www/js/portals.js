// ============================================================
//  🔵 ПОРТАЛЫ (как в Diablo 2):
//  Светящиеся площадки по всему миру. Подошёл — активировал
//  навсегда. Тапнул по кристаллу — меню телепортации между
//  всеми активированными порталами. Портал в деревне у
//  фонтана активен с самого начала.
// ============================================================

import * as THREE from 'three';
import { on, emit } from './bus.js';
import { hillH, groundHeight } from './world.js';
import { showToast } from './ui.js';
import { sfx } from './audio.js';

let G = null;

// 🗺️ Все порталы мира: поселения, Хогвартс, Кащей, Яга
export const PORTALS = [
  { id: 'village',  name: 'Деревня (старт)',  icon: '⛲', x: 1,    z: -1   },
  { id: 'steel',    name: 'Город Стальной',   icon: '⚙️', x: 135,  z: 110  },
  { id: 'gold',     name: 'Город Золотой',    icon: '💰', x: -120, z: -130 },
  { id: 'ancient',  name: 'Город Древний',    icon: '🏛️', x: 150,  z: -80  },
  { id: 'north',    name: 'Город Северный',   icon: '❄️', x: -80,  z: 150  },
  { id: 'under',    name: 'Город Подземный',  icon: '⛏️', x: 0,    z: -120 },
  { id: 'hogwarts', name: 'Хогвартс',         icon: '🏰', x: 250,  z: 226  },
  { id: 'kaschey',  name: 'Замок Кащея',      icon: '💀', x: -350, z: 296  },
  { id: 'yaga',     name: 'Избушка Яги',      icon: '🧹', x: 350,  z: -256 },
];

// ---------- Активация (живёт в сохранении мира) ----------
const active = new Set(['village']); // стартовый портал открыт сразу
export function getActivePortals() { return [...active]; }
export function setActivePortals(ids) { for (const id of ids || []) active.add(id); }
export function isPortalActive(id) { return active.has(id); }

function activatePortal(p) {
  active.add(p.id);
  showToast(`🔵 Портал активирован: ${p.icon} ${p.name}! Теперь сюда можно телепортироваться.`);
  sfx.quest();
  emit('dirty');
  refreshBeams();
}

// ---------- 🌍 Штамп площадки в мире (при генерации чанка) ----------
// Кладём/убираем блок, только если он внутри ЭТОГО чанка
const key = (x, y, z) => x + ',' + y + ',' + z;
function put(data, x0, z0, x, y, z, t) {
  if (x < x0 || x > x0 + 15 || z < z0 || z > z0 + 15) return;
  data.set(key(x, y, z), t);
}
function del(data, x0, z0, x, y, z) {
  if (x < x0 || x > x0 + 15 || z < z0 || z > z0 + 15) return;
  data.delete(key(x, y, z));
}

export function stampPortals(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  for (const p of PORTALS) {
    if (p.x + 2 < x0 || p.x - 2 > x0 + 15 || p.z + 2 < z0 || p.z - 2 > z0 + 15) continue;
    const h = hillH(p.x, p.z);
    // Площадка 3×3 из каменного кирпича, светокамень в центре
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      for (let y = h + 1; y <= h + 4; y++) del(data, x0, z0, p.x + dx, y, p.z + dz); // расчистить воздух
      put(data, x0, z0, p.x + dx, h, p.z + dz, 'stoneBricks');
    }
    put(data, x0, z0, p.x, h, p.z, 'glowstone'); // светящееся сердце портала
    // 4 световых столбика по углам
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      put(data, x0, z0, p.x + dx, h + 1, p.z + dz, 'fence');
      put(data, x0, z0, p.x + dx, h + 2, p.z + dz, 'glowstone');
    }
  }
}

// ---------- 💠 Кристаллы и лучи (3D) ----------
const group = new THREE.Group();
const markers = []; // { p, crystal, beam, baseY }

export function portalMeshes() { return [group]; }

function buildMarkers() {
  for (const p of PORTALS) {
    const h = hillH(p.x, p.z);
    const y = h + 1;
    const holder = new THREE.Group();
    holder.position.set(p.x + 0.5, y, p.z + 0.5);
    // Парящий кристалл
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45),
      new THREE.MeshLambertMaterial({ color: 0x66CCFF, emissive: 0x2288CC })
    );
    crystal.position.y = 1.6;
    // Луч в небо — видно издалека у активного портала
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.35, 14, 8),
      new THREE.MeshBasicMaterial({ color: 0x66CCFF, transparent: true, opacity: 0.25 })
    );
    beam.position.y = 7.5;
    holder.add(crystal); holder.add(beam);
    holder.userData.portal = p;
    crystal.userData.portal = p;
    beam.userData.portal = p;
    group.add(holder);
    markers.push({ p, holder, crystal, beam, baseY: y });
  }
  refreshBeams();
}

function refreshBeams() {
  for (const m of markers) {
    const on = active.has(m.p.id);
    m.beam.visible = on;
    m.crystal.material.color.set(on ? 0x66CCFF : 0x777788);
    m.crystal.material.emissive.set(on ? 0x2288CC : 0x111118);
  }
}

// ---------- 🚪 Меню телепортации ----------
export function openPortalMenu(fromPortal) {
  if (!active.has(fromPortal.id)) { activatePortal(fromPortal); return; }
  const el = document.getElementById('portals');
  const list = document.getElementById('portalList');
  list.innerHTML = '';
  const here = fromPortal.id;
  for (const p of PORTALS) {
    if (!active.has(p.id)) continue; // Diablo-стиль: только открытые!
    const b = document.createElement('button');
    b.className = 'portalBtn';
    b.innerHTML = `${p.icon} ${p.name}${p.id === here ? ' <small>(ты здесь)</small>' : ''}`;
    b.disabled = p.id === here;
    b.onclick = () => teleportTo(p);
    list.appendChild(b);
  }
  el.style.display = 'flex';
  // На ПК освобождаем мышь, чтобы ткнуть в меню
  if (document.pointerLockElement) document.exitPointerLock();
}

export function closePortalMenu(relock = true) {
  const el = document.getElementById('portals');
  if (el) el.style.display = 'none';
  if (relock && !G.IS_TOUCH && !document.pointerLockElement) {
    try { document.body.requestPointerLock(); } catch (e) {}
  }
}

function teleportTo(p) {
  const pl = G.player;
  pl.x = p.x + 2.5; pl.z = p.z + 2.5;
  pl.feet = groundHeight(Math.floor(pl.x), Math.floor(pl.z), 60) + 0.5;
  pl.vy = 0;
  closePortalMenu();
  showToast(`🔵 Вжух! Ты у портала: ${p.icon} ${p.name}`);
  sfx.quest();
  emit('dirty');
}

// ---------- 🔄 Кадр: крутим кристаллы, следим за активацией ----------
let nearTimer = 0;
export function updatePortals(dt) {
  const t = performance.now() / 1000;
  for (const m of markers) {
    m.crystal.rotation.y += dt * 1.4;
    m.crystal.position.y = 1.6 + Math.sin(t * 2 + m.baseY) * 0.15;
  }
  // Подошёл близко — портал активируется сам (как waypoint в Diablo)
  nearTimer -= dt;
  if (nearTimer <= 0) {
    nearTimer = 0.5;
    const pl = G.player;
    for (const p of PORTALS) {
      if (active.has(p.id)) continue;
      if (Math.hypot(pl.x - p.x, pl.z - p.z) < 4) { activatePortal(p); break; }
    }
  }
}

// ---------- 🚀 Инициализация ----------
export function initPortals(gameContext) {
  G = gameContext;
  buildMarkers();
  G.scene.add(group);
  const el = document.getElementById('portals');
  if (el) el.addEventListener('click', e => {
    if (!e.target.closest('#portalWindow') || e.target.closest('#portalClose')) closePortalMenu();
  });
}
