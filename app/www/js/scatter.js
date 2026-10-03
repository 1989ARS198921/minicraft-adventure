// ============================================================
//  🌍 ЖИВОЙ МИР — случайные находки между поселениями:
//  каменные круги, грибы-гиганты, ледяные шипы, обелиски,
//  лагеря монстров, сундуки с лутом, валуны и пни.
//  Всё детерминировано по номеру чанка — мир стабилен.
// ============================================================

import { hillH, biomeAt } from './world.js';
import { CONFIG } from './config.js';
import { SETTLEMENTS } from './village.js';
import { QUEST_SITES } from './quest_locations.js';
import { LAIRS } from './lairs.js';

const WATER_Y = CONFIG.WATER_Y;

// Детерминированный хеш чанка → [0..1)
function hash2(cx, cz, salt = 0) {
  let h = (cx * 374761393 + cz * 668265263 + salt * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Не строим в поселениях и квестовых локациях
function nearBusy(x, z) {
  if (SETTLEMENTS.some(s => x >= s.x0 - 6 && x <= s.x1 + 6 && z >= s.z0 - 6 && z <= s.z1 + 6)) return true;
  if (QUEST_SITES.some(s => Math.hypot(x - s.x, z - s.z) <= s.r + 6)) return true;
  return LAIRS.some(l => Math.hypot(x - l.x, z - l.z) <= 12);
}

// Какая находка (если есть) живёт в этом чанке?
export function poiAt(cx, cz) {
  if (hash2(cx, cz) > 0.085) return null; // ~1 находка на 12 чанков
  const x = cx * 16 + 4 + Math.floor(hash2(cx, cz, 1) * 8);
  const z = cz * 16 + 4 + Math.floor(hash2(cx, cz, 2) * 8);
  const h = hillH(x, z);
  if (h <= WATER_Y + 1) return null; // в воде не строим
  if (nearBusy(x, z)) return null;
  const biome = biomeAt(x, z);
  // Каждый шестой POI — лагерь монстров!
  if (hash2(cx, cz, 3) < 0.17) {
    const camps = { forest: 'wolfden', plains: 'orccamp', desert: 'orccamp', snow: 'orccamp', mountains: 'spidernest' };
    return { kind: camps[biome] || 'orccamp', x, z, h, camp: true, chest: hash2(cx, cz, 5) < 0.4 };
  }
  const table = {
    plains: ['circle', 'boulders', 'watchstone'],
    forest: ['mushroom', 'stumps', 'circle'],
    desert: ['arch', 'well', 'boulders'],
    snow: ['icespikes', 'campfire', 'boulders'],
    mountains: ['obelisk', 'boulders', 'arch'],
  };
  const kinds = table[biome] || table.plains;
  const kind = kinds[Math.floor(hash2(cx, cz, 4) * kinds.length)];
  return { kind, x, z, h, chest: hash2(cx, cz, 5) < 0.3 };
}

function buildPOI(p, set, del) {
  const { x, z, h } = p;
  const S = (dx, dy, dz, t) => set(x + dx, h + dy, z + dz, t);
  switch (p.kind) {
    case 'circle': // 🗿 каменный круг
      for (let a = 0; a < 8; a++) {
        const dx = Math.round(Math.cos(a / 8 * Math.PI * 2) * 4);
        const dz = Math.round(Math.sin(a / 8 * Math.PI * 2) * 4);
        S(dx, 1, dz, 'stone'); S(dx, 2, dz, 'stone');
      }
      S(0, 1, 0, 'glowstone');
      break;
    case 'watchstone': // 🪨 одинокий менгир
      for (let y = 1; y <= 5; y++) S(0, y, 0, 'stoneBricks');
      S(1, 1, 0, 'stoneBricks'); S(-1, 1, 0, 'stoneBricks');
      S(0, 1, 1, 'stoneBricks'); S(0, 1, -1, 'stoneBricks');
      break;
    case 'mushroom': // 🍄 гриб-гигант
      for (let y = 1; y <= 4; y++) S(0, y, 0, 'trunk');
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++)
        if (Math.abs(dx) + Math.abs(dz) <= 3) S(dx, 5, dz, 'brick');
      S(0, 6, 0, 'brick');
      break;
    case 'stumps': // 🪵 поляна пней
      for (const [dx, dz] of [[0, 0], [2, 1], [-1, 2], [1, -2]]) S(dx, 1, dz, 'trunk');
      break;
    case 'arch': // 🏛️ развалины арки
      for (let y = 1; y <= 5; y++) { S(-2, y, 0, 'stoneBricks'); S(2, y, 0, 'stoneBricks'); }
      for (let dx = -2; dx <= 2; dx++) S(dx, 6, 0, 'stoneBricks');
      S(-2, 7, 0, 'stoneBricks'); S(2, 7, 0, 'stoneBricks');
      break;
    case 'well': // 💧 древний колодец
      for (const [dx, dz] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]])
        S(dx, 1, dz, 'stoneBricks');
      del(x, h, z); set(x, h, z, 'water');
      break;
    case 'icespikes': // 🧊 ледяные шипы
      for (const [dx, dz, ht] of [[0, 0, 6], [2, 1, 4], [-2, 2, 5], [1, -2, 3], [-1, -2, 4]])
        for (let y = 1; y <= ht; y++) S(dx, y, dz, 'glass');
      break;
    case 'campfire': // ❄️ замёрзший лагерь
      S(0, 1, 0, 'glowstone');
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) S(dx, 1, dz, 'trunk');
      S(2, 1, 2, 'snow'); S(-2, 1, -1, 'snow');
      break;
    case 'obelisk': // ⬛ обсидиановый обелиск
      for (let y = 1; y <= 6; y++) S(0, y, 0, 'obsidian');
      S(0, 7, 0, 'glowstone');
      S(1, 1, 0, 'obsidian'); S(-1, 1, 0, 'obsidian');
      S(0, 1, 1, 'obsidian'); S(0, 1, -1, 'obsidian');
      break;
    case 'boulders': // 🪨 валуны
      for (const [dx, dz] of [[0, 0], [2, 1], [-2, 0], [1, -2], [-1, 2]]) {
        S(dx, 1, dz, 'stone');
        if ((dx + dz) % 2 === 0) S(dx, 2, dz, 'stone');
      }
      break;
    // ---- лагеря монстров ----
    case 'orccamp': // 👹 кострище и черепа на кольях
      S(0, 1, 0, 'glowstone');
      for (let a = 0; a < 6; a++) {
        const dx = Math.round(Math.cos(a / 6 * Math.PI * 2) * 4);
        const dz = Math.round(Math.sin(a / 6 * Math.PI * 2) * 4);
        S(dx, 1, dz, 'trunk'); S(dx, 2, dz, 'whiteWool');
      }
      break;
    case 'spidernest': // 🕷️ коконы паутины
      S(0, 1, 0, 'dirt');
      for (const [dx, dz] of [[1, 1], [-1, 2], [2, -1], [-2, -2], [0, 3], [3, 0], [-3, 1]])
        S(dx, 1, dz, 'whiteWool');
      break;
    case 'wolfden': // 🐺 кости и яма-логово
      S(0, 1, 0, 'dirt'); S(1, 1, 0, 'whiteWool');
      S(-1, 1, 1, 'whiteWool'); S(0, 1, -2, 'whiteWool');
      break;
  }
  if (p.chest) S(2, 1, -2, 'chest'); // 🎁 сундук с лутом!
}

// Валуны, пни, цветы — лёгкий декор обычных чанков
function groundDecor(cx, cz, set) {
  if (hash2(cx, cz, 9) > 0.45) return;
  const n = 1 + Math.floor(hash2(cx, cz, 10) * 3);
  for (let i = 0; i < n; i++) {
    const x = cx * 16 + Math.floor(hash2(cx, cz, 11 + i * 2) * 16);
    const z = cz * 16 + Math.floor(hash2(cx, cz, 12 + i * 2) * 16);
    const h = hillH(x, z);
    if (h <= WATER_Y + 1 || nearBusy(x, z)) continue;
    const b = biomeAt(x, z);
    const t = hash2(cx, cz, 20 + i);
    if (b === 'forest') set(x, h + 1, z, t < 0.5 ? 'trunk' : 'mushroom');
    else if (b === 'desert') set(x, h + 1, z, 'cactus');
    else if (b === 'snow' || b === 'mountains') {
      set(x, h + 1, z, 'stone');
      if (t < 0.3) set(x, h + 2, z, 'stone');
    } else set(x, h + 1, z, t < 0.6 ? 'flower' : 'bush');
  }
}

export function stampScatter(data, cx, cz) {
  const key = (x, y, z) => x + ',' + y + ',' + z;
  const set = (x, y, z, t) => data.set(key(x, y, z), t);
  const del = (x, y, z) => data.delete(key(x, y, z));
  const poi = poiAt(cx, cz);
  if (poi) buildPOI(poi, set, del);
  else groundDecor(cx, cz, set);
}

// 🏕️ Лагеря монстров для mobs.js (считаем один раз, после setSeed)
let CAMPS = null;
export function scatterCamps() {
  if (CAMPS) return CAMPS;
  CAMPS = [];
  for (let cx = -28; cx <= 28; cx++)
    for (let cz = -28; cz <= 28; cz++) {
      const p = poiAt(cx, cz);
      if (p && p.camp) CAMPS.push(p);
    }
  return CAMPS;
}
