// ============================================================
//  ⚔️ ЛОГОВА МОНСТРОВ — 6 лairs по кольцу радиуса ~320 от центра.
//  В каждом: своя структура, сундук с лутом и 4 стража.
//  Разгромил сундук — логово зачищено (квест «Истребитель логов»)!
// ============================================================

import { hillH } from './world.js';
import { CONFIG } from './config.js';
import { on, emit } from './bus.js';
import { showToast } from './ui.js';

const WATER_Y = CONFIG.WATER_Y;

export const LAIRS = [
  { id: 'spider',   name: '🕷️ Логово пауков',   icon: '🕷️', x: 315,  z: 175,  mob: 'spider' },
  { id: 'orc',      name: '👹 Форт орков',      icon: '👹', x: 6,    z: 344,  mob: 'orc' },
  { id: 'skeleton', name: '💀 Склеп скелетов',  icon: '💀', x: -254, z: 152,  mob: 'skeleton' },
  { id: 'wolf',     name: '🐺 Волчья стая',     icon: '🐺', x: -302, z: -181, mob: 'wolf' },
  { id: 'ghost',    name: '👻 Призрачные камни', icon: '👻', x: -6,   z: -344, mob: 'ghost' },
  { id: 'troll',    name: '🧌 Пещера тролля',   icon: '🧌', x: 254,  z: -152, mob: 'troll' },
];

export function stampLairs(data, cx, cz) {
  const key = (x, y, z) => x + ',' + y + ',' + z;
  const set = (x, y, z, t) => data.set(key(x, y, z), t);
  const del = (x, y, z) => data.delete(key(x, y, z));

  for (const L of LAIRS) {
    if (L.x + 9 < cx * 16 || L.x - 9 > cx * 16 + 15) continue;
    if (L.z + 9 < cz * 16 || L.z - 9 > cz * 16 + 15) continue;
    const h = hillH(L.x, L.z);
    if (h <= WATER_Y + 1) continue; // в воде логова нет
    const S = (dx, dy, dz, t) => set(L.x + dx, h + dy, L.z + dz, t);

    if (L.id === 'spider') {
      S(0, 0, 0, 'dirt'); del(L.x, h, L.z); S(0, -0, 0, 'dirt');
      for (const [dx, dz] of [[2, 1], [-2, 2], [1, -2], [-3, -1], [3, -2], [-1, 3], [0, -4], [4, 1]]) {
        S(dx, 1, dz, 'whiteWool'); if ((dx + dz) % 2 === 0) S(dx, 2, dz, 'whiteWool');
      }
    } else if (L.id === 'orc') {
      S(0, 1, 0, 'glowstone');
      for (let a = 0; a < 8; a++) {
        const dx = Math.round(Math.cos(a / 8 * Math.PI * 2) * 5);
        const dz = Math.round(Math.sin(a / 8 * Math.PI * 2) * 5);
        S(dx, 1, dz, 'trunk'); S(dx, 2, dz, 'trunk'); if (a % 2 === 0) S(dx, 3, dz, 'whiteWool');
      }
    } else if (L.id === 'skeleton') {
      for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++)
        if ((dx + dz) % 2 === 0) S(dx, 0, dz, 'stoneBricks');
      for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]])
        for (let y = 1; y <= 3; y++) S(dx, y, dz, 'stoneBricks');
      S(2, 1, 2, 'whiteWool'); S(-2, 1, -1, 'whiteWool'); S(1, 1, -3, 'whiteWool');
    } else if (L.id === 'wolf') {
      S(0, 0, 0, 'dirt'); del(L.x, h, L.z); S(0, -0, 0, 'dirt');
      for (const [dx, dz] of [[2, 2], [-2, 1], [1, -2], [-1, -3], [3, 0], [-3, 2]]) S(dx, 1, dz, 'whiteWool');
    } else if (L.id === 'ghost') {
      for (let a = 0; a < 6; a++) {
        const dx = Math.round(Math.cos(a / 6 * Math.PI * 2) * 4);
        const dz = Math.round(Math.sin(a / 6 * Math.PI * 2) * 4);
        S(dx, 1, dz, 'obsidian'); S(dx, 2, dz, 'obsidian'); S(dx, 3, dz, 'obsidian');
      }
      S(0, 1, 0, 'glowstone');
    } else if (L.id === 'troll') {
      for (const [dx, dz, ht] of [[0, 0, 3], [2, 1, 2], [-2, 1, 2], [1, -2, 1], [-1, -2, 2], [3, 2, 1], [-3, -1, 1]])
        for (let y = 1; y <= ht; y++) S(dx, y, dz, 'stone');
    }
    S(0, 1, 2, 'chest'); // 🎁 сундук логова — разгроми его!
  }
}

// Монстры-стражи: 4 на логово, равномерно по углам
export function lairSpawns() {
  const out = [];
  for (const L of LAIRS)
    for (const [dx, dz] of [[4, 4], [-4, 4], [4, -4], [-4, -4]])
      out.push({ kind: L.mob, x: L.x + dx, z: L.z + dz, layer: 'surface' });
  return out;
}

// Сундук логова сломан — логово зачищено!
export function initLairs(gameContext) {
  on('blockBrokenAt', (type, x, y, z) => {
    if (type !== 'chest') return;
    const L = LAIRS.find(l => Math.hypot(x - l.x, z - l.z) <= 9);
    if (L) { emit('lairCleared', L.id); showToast(`⚔️ ${L.name} — зачищено!`); }
  });
}
