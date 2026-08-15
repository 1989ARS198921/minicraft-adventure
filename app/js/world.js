// ============================================================
//  🌍 МИР: чанки, биомы, руды, вода, пещеры, изменение блоков
//  Мир бесконечный: кусочки 16×16 (чанки) создаются по мере
//  ходьбы из «зерна» генератора, а постройки игрока хранятся
//  отдельным списком изменений (дельтами).
// ============================================================

import * as THREE from 'three';
import { CONFIG, TRANSPARENT, SMALL, WALKTHROUGH } from './config.js';
import { chunkMat, chunkMatGlass, chunkMatWater, TILES, FLOWER_RED, FLOWER_YELLOW } from './textures.js';
import { stampSettlements, inAnyVillage } from './village.js';
import { stampDungeon } from './dungeon.js';
import { emit } from './bus.js';

let G = null; // игровой контекст (даёт main.js при инициализации)
export function initWorld(gameContext) { G = gameContext; }

const CHUNK = CONFIG.CHUNK;
const BEDROCK_Y = CONFIG.BEDROCK_Y;
const WATER_Y = CONFIG.WATER_Y;

const chunks = new Map();  // "cx,cz" -> {data: Map("x,y,z"->type), mesh, meshGlass}
const deltas = {};         // изменения игрока: "cx,cz" -> {"x,y,z": тип или 'X'}

export const key = (x, y, z) => x + ',' + y + ',' + z;
export const ckey = (cx, cz) => cx + ',' + cz;

// Доступ к данным для модуля сохранения
export function getDeltas() { return deltas; }
export function setDeltas(obj) { Object.assign(deltas, obj); }

// ---------- СЛУЧАЙНОСТЬ С «ЗЕРНЕМ» ----------
// Одно зерно = всегда один и тот же мир. «Новый мир» = новое зерно.
let seedOffX = 0, seedOffZ = 0;
export function setSeed(s) {
  G.seed = s;
  seedOffX = (s % 1000) * 0.7;
  seedOffZ = ((s >> 8) % 1000) * 0.9;
}


function generateChunk(data, cx, cz) {
    generateUnderground(data, cx, cz);  // Уровень -30..-10
    generateSurface(data, cx, cz);       // Уровень 0..40 (уже есть)
    generateSkyWorld(data, cx, cz);     // Уровень 60..120
}
// Детерминированный генератор по координатам чанка
function chunkRand(cx, cz, i) {
  let h = G.seed ^ Math.imul(cx, 374761393) ^ Math.imul(cz, 668265263) ^ Math.imul(i, 974634211);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Детерминированный генератор по координатам одного блока (для руд!)
function blockRand(x, y, z) {
  let h = G.seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 974634211);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// БИОМЫ: целые «страны» по двум шумам — горность и температура.
// Горы высокие, пустыня жёлтая, снег белый, в лесу деревьев толпа!
// (export — сказочные существа ищут по биомам свои домики)
export function biomeAt(x, z) {
  const m = Math.sin((x + seedOffX) * 0.008) * Math.cos((z + seedOffZ) * 0.009)
          + Math.sin((x - z + seedOffZ) * 0.004) * 0.5; // «горность»
  const t = Math.sin((x + seedOffX) * 0.017) * Math.cos((z + seedOffZ) * 0.021); // «температура»
  if (m > 0.85) return 'mountains';
  if (t > 0.55) return 'desert';
  if (t < -0.55) return 'snow';
  // в умеренной полосе — лесные пятна среди равнин
  return Math.sin((x + seedOffZ) * 0.03) * Math.cos((z + seedOffX) * 0.026) > 0.25
    ? 'forest' : 'plains';
}

// Высота земли в колонке (x, z): плавные волны из синусов.
// В горах — крутые пики до 12 блоков. Реки режут мир извилистыми каналами!
// (export — дракон ищет самую высокую гору для своего гнезда)
export function hillH(x, z) {
  const b = biomeAt(x, z);
  let h;
  if (b === 'mountains') {
    h = 5 + Math.sin((x + seedOffX) * 0.30) * Math.cos((z + seedOffZ) * 0.27) * 4
          + Math.sin((x + z) * 0.11) * 2;
    h = Math.max(4, Math.min(12, Math.round(h)));
  } else {
    h = 3 + Math.sin((x + seedOffX) * 0.13) * Math.cos((z + seedOffZ) * 0.11) * 2.2
          + Math.sin((x + z + seedOffX) * 0.045) * 1.6;
    h = Math.max(0, Math.min(6, Math.round(h))); // 0 = котлован, там будет вода!
  }
  // Реки: там, где две волны «гасят» друг друга, земля проседает до воды
  const rv = Math.sin((x + seedOffX) * 0.05) + Math.sin((z + seedOffZ) * 0.043);
  if (Math.abs(rv) < 0.12) h = Math.min(h, 1);
  if (Math.hypot(x, z) < 6) h = 3; // ровная площадка на старте
  return h;
}

// Пещеры: где шум громче порога — там воздух (подземные туннели!)
function isCave(x, y, z) {
  return Math.sin(x * 0.35 + seedOffX) + Math.cos(z * 0.31 + seedOffZ)
       + Math.sin(y * 0.8 + (x + z) * 0.09) > 1.8;
}

// РУДЫ в камне: чем глубже, тем ценнее. Уголь повсюду,
// золото пониже, алмазы — почти у самого дна мира!
function oreAt(x, y, z) {
  if (y >= -1) return null; // выше — обычный камень
  const r = blockRand(x, y, z);
  if (y <= -3 && r < 0.010) return 'diamondOre'; // редкость!
  if (y <= -2 && r < 0.015) return 'goldOre';
  if (r < 0.025) return 'coalOre';
  return null;
}

// Растения чанка: до 4 штук. Сколько их — зависит от биома:
// в лесу почти полный набор, в горах — редко, на равнине — средне
function treeSpots(cx, cz) {
  const CHANCE = { plains: 0.35, forest: 0.9, desert: 0.3, snow: 0.4, mountains: 0.15 };
  const spots = [];
  for (let i = 0; i < 4; i++) {
    const tx = cx * CHUNK + 2 + Math.floor(chunkRand(cx, cz, i * 3 + 1) * 12);
    const tz = cz * CHUNK + 2 + Math.floor(chunkRand(cx, cz, i * 3 + 2) * 12);
    if (chunkRand(cx, cz, i * 3) < CHANCE[biomeAt(tx, tz)] && Math.hypot(tx, tz) > 6
        && !inAnyVillage(tx, tz)) // в деревне деревьям не расти — там домики!
      spots.push([tx, tz]);
  }
  return spots;
}

// Все блоки одного растения: в пустыне — кактус,
// в снегу — ёлка со снежной шапкой, в остальных местах — дуб!
function treeBlocks(tx, tz) {
  const base = hillH(tx, tz);
  const out = [];
  if (base <= WATER_Y) return out; // под водой ничего не растёт
  const biome = biomeAt(tx, tz);
  if (biome === 'desert') {
    // Кактус: зелёная колонка 2-3 блока высотой
    const ch = 2 + Math.floor(chunkRand(tx, tz, 77) * 2);
    for (let h = 1; h <= ch; h++) out.push([tx, base + h, tz, 'cactus']);
    return out;
  }
  if (biome === 'snow') {
    // Ёлка: высокий ствол, узкая крона, на макушке — снег
    const trunkH = 4 + Math.floor(chunkRand(tx, tz, 99) * 2);
    for (let h = 1; h <= trunkH; h++) out.push([tx, base + h, tz, 'trunk']);
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = trunkH - 2; dy <= trunkH - 1; dy++)
          if (!(dx === 0 && dz === 0)) out.push([tx + dx, base + dy, tz + dz, 'leaf']);
    out.push([tx, base + trunkH + 1, tz, 'leaf']);
    out.push([tx, base + trunkH + 2, tz, 'snow']); // снежная шапка!
    return out;
  }
  // Дуб: ствол + пышная крона + листик на макушке
  const trunkH = 3 + Math.floor(chunkRand(tx, tz, 99) * 2);
  for (let h = 1; h <= trunkH; h++) out.push([tx, base + h, tz, 'trunk']);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      for (let dy = trunkH; dy <= trunkH + 1; dy++)
        if (!(dx === 0 && dz === 0 && dy === trunkH))
          out.push([tx + dx, base + dy, tz + dz, 'leaf']);
  out.push([tx, base + trunkH + 2, tz, 'leaf']);
  return out;
}

// ---------- ДОСТУП К БЛОКАМ ----------
// Какой блок стоит в клетке мира? (null = пусто/чанк не загружен)
export function blockAt(x, y, z) {
  const ch = chunks.get(ckey(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
  return ch ? (ch.data.get(key(x, y, z)) || null) : null;
}

// Твёрдый ли блок в клетке? (для мягких теней в углах)
function isOpaque(x, y, z) {
  const ch = chunks.get(ckey(Math.floor(x / CHUNK), Math.floor(z / CHUNK)));
  if (!ch) return false; // незагруженный край не затеняем — иначе чёрные полосы
  const t = ch.data.get(key(x, y, z));
  return !!t && !TRANSPARENT.has(t) && !SMALL.has(t);
}

// Прячет ли соседняя клетка грань блока type?
// Непрозрачный блок прячет любой сосед. Стекло/вода — только такие же.
// Маленькие фигурки (цветы, двери...) никого не прячут — они крошечные!
function neighborHides(type, nx, ny, nz) {
  const ch = chunks.get(ckey(Math.floor(nx / CHUNK), Math.floor(nz / CHUNK)));
  if (!ch) return true; // незагруженный чанк: не рисуем лишние грани на краях
  const nt = ch.data.get(key(nx, ny, nz)) || null;
  if (!nt || SMALL.has(nt)) return false;
  if (TRANSPARENT.has(type)) return nt === type || !TRANSPARENT.has(nt);
  return !TRANSPARENT.has(nt);
}

// Самая высокая ТВЁРДАЯ поверхность в столбике — на ней можно стоять.
// Вода, цветы и двери не считаются: сквозь них проходим!
// maxTop — «потолок поиска»: смотрим только на блоки НЕ ВЫШЕ этой высоты.
// Так герой в пещере не «всплывает» на крышу, а честно стоит на полу!
export function groundHeight(bx, bz, maxTop = Infinity) {
  const top = Math.min(CONFIG.GROUND_SCAN_TOP, Math.floor(maxTop - 1));
  for (let y = top; y >= BEDROCK_Y; y--) {
    const t = blockAt(bx, y, bz);
    if (t && !WALKTHROUGH.has(t)) return y + 1;
  }
  // 🔴 Fallback: если чианк не загружен, вычисляем высоту по формуле
  const calculatedH = hillH(bx, bz);
  if (calculatedH > WATER_Y) return calculatedH;
  return BEDROCK_Y + 1;
}

// Твёрдый ли блок в этой клетке? (стены и потолок пещеры — твёрдые!)
export function solidAt(x, y, z) {
  const t = blockAt(x, y, z);
  return !!t && !WALKTHROUGH.has(t);
}

// Список 3D-моделей чанков (для «луча зрения»): и обычные, и стеклянные
export function chunkMeshes() {
  const arr = [];
  for (const ch of chunks.values()) {
    if (ch.mesh) arr.push(ch.mesh);
    if (ch.meshGlass) arr.push(ch.meshGlass);
    if (ch.meshWater) arr.push(ch.meshWater);
  }
  return arr;
}

// ---------- ГЕНЕРАЦИЯ ЧАНКА ----------
function genChunkData(cx, cz) {
  const data = new Map();
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  for (let lx = 0; lx < CHUNK; lx++)
    for (let lz = 0; lz < CHUNK; lz++) {
      const x = x0 + lx, z = z0 + lz;
      const h = hillH(x, z);
      const biome = biomeAt(x, z);
      for (let y = BEDROCK_Y; y <= h; y++) {
        let type;
        if (y === BEDROCK_Y) type = 'stone'; // дно мира
        else if (biome === 'desert') type = y >= h - 2 ? 'sand' : 'stone'; // пустыня: песок
        else if (biome === 'mountains') // горы: камень, на вершинах — снег
          type = (y === h && h >= 9) ? 'snow' : 'stone';
        else if (biome === 'snow') type = y === h ? 'snow' : (y >= h - 2 ? 'dirt' : 'stone');
        else type = y === h ? 'grass' : (y >= h - 2 ? 'dirt' : 'stone'); // лес и равнина
        // В камне прячем руды
        if (type === 'stone' && y > BEDROCK_Y) {
          const ore = oreAt(x, y, z);
          if (ore) type = ore;
        }
        // Вырезаем пещеры (не в траве и не на самом дне)
        if (y <= h - 2 && y > BEDROCK_Y && isCave(x, y, z)) continue;
        data.set(key(x, y, z), type);
      }
      // Низина ниже уровня моря? Заливаем водой — получилось озеро!
      for (let y = h + 1; y <= WATER_Y; y++)
        if (!data.has(key(x, y, z))) data.set(key(x, y, z), 'water');
      // Декорации: цветы и кусты на лугах, грибы в тени леса
      if ((biome === 'plains' || biome === 'forest') && h > WATER_Y
          && !inAnyVillage(x, z) // в деревне цветы — только в цветнике Леи!
          && data.get(key(x, h, z)) === 'grass' && !data.has(key(x, h + 1, z))) {
        const r2 = blockRand(x, 100, z);
        if (r2 < 0.05) data.set(key(x, h + 1, z), 'flower');
        else if (r2 < 0.08) data.set(key(x, h + 1, z), 'bush');
        else if (biome === 'forest' && r2 < 0.11) data.set(key(x, h + 1, z), 'mushroom');
      }
    }
  // Растения: своего чанка и соседей (кроны залезают через границу!)
  for (let ax = cx - 1; ax <= cx + 1; ax++)
    for (let az = cz - 1; az <= cz + 1; az++)
      for (const [tx, tz] of treeSpots(ax, az))
        for (const [bx, by, bz, bt] of treeBlocks(tx, tz))
          if (bx >= x0 && bx < x0 + CHUNK && bz >= z0 && bz < z0 + CHUNK)
            data.set(key(bx, by, bz), bt);
  // 🏠 Штампуем деревню: ровная площадка, домики, лавка, башня
  stampSettlements(data, cx, cz);
  // 🕯️ Штампуем каменоломню гоблинов: яма, лестница, трон, руды
  stampDungeon(data, cx, cz);
  // Применяем то, что игрок наломал/настроил
  const d = deltas[ckey(cx, cz)];
  if (d) for (const k in d) {
    if (d[k] === 'X') data.delete(k); else data.set(k, d[k]);
  }
  return data;
}

// ---------- ПОСТРОЕНИЕ 3D-МОДЕЛИ ЧАНКА ----------
// Шесть граней кубика: направление + 4 угла (против часовой снаружи)
const FACES = [
  { n: [ 1, 0, 0], c: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]] },
  { n: [-1, 0, 0], c: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]] },
  { n: [ 0, 1, 0], c: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] }, // верх
  { n: [ 0,-1, 0], c: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, // низ
  { n: [ 0, 0, 1], c: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
  { n: [ 0, 0,-1], c: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] }
];

// Формы «не-кубиков»: список коробочек {от угла до угла} внутри клетки.
// Ступенька = полкуба внизу + половинка сверху сзади. Дверь = тонкая панель.
const SHAPES = {
  stair:   [{ x0: 0, y0: 0, z0: 0, x1: 1, y1: 0.5, z1: 1 },
            { x0: 0, y0: 0.5, z0: 0.5, x1: 1, y1: 1, z1: 1 }],
  door:    [{ x0: 0.4, y0: 0, z0: 0, x1: 0.6, y1: 1, z1: 1 }],
  doorTop: [{ x0: 0.4, y0: 0, z0: 0, x1: 0.6, y1: 1, z1: 1 }],
  flower:  [{ x0: 0.35, y0: 0, z0: 0.35, x1: 0.65, y1: 0.5, z1: 0.65 }],
  mushroom:[{ x0: 0.3, y0: 0, z0: 0.3, x1: 0.7, y1: 0.35, z1: 0.7 }],
  bush:    [{ x0: 0.15, y0: 0, z0: 0.15, x1: 0.85, y1: 0.6, z1: 0.85 }]
};
const CUBE = [{ x0: 0, y0: 0, z0: 0, x1: 1, y1: 1, z1: 1 }];

// Добавить грани блока в «корзинку» геометрии (свою для прозрачных!)
// skyTop — высота самого верхнего непрозрачного блока в этом столбике:
// всё, что глубже под ним, — в тени земли (пещеры тёмные!) 🕳️
function pushBlock(bag, x, y, z, type, skyTop) {
  // Какая плитка атласа на верх/бок/низ этого блока
  let [ti, ts, tb] = TILES[type];
  // Цветы бывают красные и жёлтые — сюрприз от генератора!
  if (type === 'flower' && blockRand(x, 777, z) >= 0.5) { ti = ts = tb = FLOWER_YELLOW; }
  const small = SMALL.has(type); // фигуркам рисуем все грани (они крошечные)
  const glassy = TRANSPARENT.has(type);
  // Блок под землёй/крышей/кроной? Небо его не освещает — темнее!
  const skyShade = (!small && !glassy && y < skyTop - 1) ? 0.55 : 1;
  for (const box of SHAPES[type] || CUBE) {
    for (const f of FACES) {
      if (!small && neighborHides(type, x + f.n[0], y + f.n[1], z + f.n[2])) continue;
      // Каждая сторона светит по-своему: верх яркий, низ тёмный — объём!
      const faceShade = f.n[1] === 1 ? 1.0 : f.n[1] === -1 ? 0.55 : (f.n[0] !== 0 ? 0.82 : 0.7);
      // Узор грани: номер плитки → прямоугольник в атласе (5×5)
      const tile = f.n[1] === 1 ? ti : f.n[1] === -1 ? tb : ts;
      const u0 = (tile % 5) / 5, v0 = 1 - (Math.floor(tile / 5) + 1) / 5;
      // Мягкая тень в углах (AO): если рядом с углом стоят блоки — затемняем
      const px = x + f.n[0], py = y + f.n[1], pz = z + f.n[2];
      const ax = [0, 1, 2].filter(a => f.n[a] === 0); // две оси вдоль грани
      for (const corner of f.c) {
        let shade = faceShade * skyShade; // сразу учитываем «тень земли»
        if (!small && !glassy) {
          const o1 = [0, 0, 0], o2 = [0, 0, 0];
          o1[ax[0]] = corner[ax[0]] ? 1 : -1;
          o2[ax[1]] = corner[ax[1]] ? 1 : -1;
          const s1 = isOpaque(px + o1[0], py + o1[1], pz + o1[2]) ? 1 : 0;
          const s2 = isOpaque(px + o2[0], py + o2[1], pz + o2[2]) ? 1 : 0;
          const cc = isOpaque(px + o1[0] + o2[0], py + o1[1] + o2[1], pz + o1[2] + o2[2]) ? 1 : 0;
          const ao = (s1 && s2) ? 0 : 3 - (s1 + s2 + cc);
          shade *= 0.45 + 0.55 * ao / 3; // от 45% в тёмном углу до 100%
        }
        // угол коробочки: растягиваем 0..1 кубика под размер фигурки
        bag.pos.push(
          x + box.x0 + corner[0] * (box.x1 - box.x0),
          y + box.y0 + corner[1] * (box.y1 - box.y0),
          z + box.z0 + corner[2] * (box.z1 - box.z0));
        bag.nor.push(f.n[0], f.n[1], f.n[2]);
        // Цвет вершины теперь несёт только свет/тень — узор даёт атлас!
        bag.col.push(shade, shade, shade);
      }
      // Растягиваем кусочек атласа на грань: размер кусочка = размер грани
      const w = box.x1 - box.x0, h = box.y1 - box.y0, d = box.z1 - box.z0;
      // Горизонталь и вертикаль грани зависят от того, куда она смотрит
      const uw = f.n[0] !== 0 ? d : w;          // бок по X меряем глубиной
      const vh = f.n[1] !== 0 ? d : h;          // верх/низ меряем глубиной
      bag.uv.push(u0, v0, u0 + 0.2 * uw, v0, u0 + 0.2 * uw, v0 + 0.2 * vh, u0, v0 + 0.2 * vh);
      bag.idx.push(bag.vc, bag.vc + 1, bag.vc + 2, bag.vc, bag.vc + 2, bag.vc + 3);
      bag.vc += 4;
    }
  }
}

// Одна сетка на весь чанк (+ вторая для стекла и третья для воды).
// Грани между двумя блоками не рисуем — их всё равно не видно.
// Главная оптимизация! А ещё считаем «свет неба»: для каждого
// столбика запоминаем высоту верхнего блока — что ниже, то в тени.
function buildChunk(cx, cz) {
  const ch = chunks.get(ckey(cx, cz));
  if (!ch) return;
  // Карта «небесной» высоты столбиков (прозрачное и мелочь не считаем)
  const skyMap = new Map(); // "x,z" -> y верхнего непрозрачного блока
  for (const [k, type] of ch.data) {
    if (TRANSPARENT.has(type) || SMALL.has(type)) continue;
    const [x, y, z] = k.split(',').map(Number);
    const kk = x + ',' + z;
    if ((skyMap.get(kk) ?? -99) < y) skyMap.set(kk, y);
  }
  const solid = { pos: [], nor: [], uv: [], col: [], idx: [], vc: 0 };
  const glass = { pos: [], nor: [], uv: [], col: [], idx: [], vc: 0 };
  const water = { pos: [], nor: [], uv: [], col: [], idx: [], vc: 0 };
  for (const [k, type] of ch.data) {
    const [x, y, z] = k.split(',').map(Number);
    const bag = type === 'water' ? water : TRANSPARENT.has(type) ? glass : solid;
    pushBlock(bag, x, y, z, type, skyMap.get(x + ',' + z) ?? y);
  }
  // Обычные блоки
  if (ch.mesh) {
    ch.mesh.geometry.dispose();
    ch.mesh.geometry = makeGeometry(solid);
  } else {
    ch.mesh = new THREE.Mesh(makeGeometry(solid), chunkMat);
    G.scene.add(ch.mesh);
  }
  // Прозрачные (стекло): если их нет — убираем лишнюю модель
  if (glass.pos.length) {
    if (ch.meshGlass) {
      ch.meshGlass.geometry.dispose();
      ch.meshGlass.geometry = makeGeometry(glass);
    } else {
      ch.meshGlass = new THREE.Mesh(makeGeometry(glass), chunkMatGlass);
      G.scene.add(ch.meshGlass);
    }
  } else if (ch.meshGlass) {
    G.scene.remove(ch.meshGlass);
    ch.meshGlass.geometry.dispose();
    ch.meshGlass = null;
  }
  // Вода — отдельной сеткой, чтобы колыхать волны её текстурой
  if (water.pos.length) {
    if (ch.meshWater) {
      ch.meshWater.geometry.dispose();
      ch.meshWater.geometry = makeGeometry(water);
    } else {
      ch.meshWater = new THREE.Mesh(makeGeometry(water), chunkMatWater);
      G.scene.add(ch.meshWater);
    }
  } else if (ch.meshWater) {
    G.scene.remove(ch.meshWater);
    ch.meshWater.geometry.dispose();
    ch.meshWater = null;
  }
}

function makeGeometry(bag) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(bag.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(bag.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(bag.uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(bag.col, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(bag.idx), 1));
  return geo;
}

// Перестроить чанк и соседей, если блок на самом краю
function rebuildAround(x, z) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
  if (lx === 0 && chunks.has(ckey(cx - 1, cz))) buildChunk(cx - 1, cz);
  if (lx === CHUNK - 1 && chunks.has(ckey(cx + 1, cz))) buildChunk(cx + 1, cz);
  if (lz === 0 && chunks.has(ckey(cx, cz - 1))) buildChunk(cx, cz - 1);
  if (lz === CHUNK - 1 && chunks.has(ckey(cx, cz + 1))) buildChunk(cx, cz + 1);
}

function loadChunk(cx, cz) {
  const ck = ckey(cx, cz);
  if (chunks.has(ck)) return;
  chunks.set(ck, { data: genChunkData(cx, cz), mesh: null, meshGlass: null, meshWater: null });
  buildChunk(cx, cz);
  // Соседи могли «спрятать» грани в нашу сторону — перестраиваем их
  for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]])
    if (chunks.has(ckey(cx + dx, cz + dz))) buildChunk(cx + dx, cz + dz);
}

function unloadChunk(ck) {
  const ch = chunks.get(ck);
  if (!ch) return;
  if (ch.mesh) { G.scene.remove(ch.mesh); ch.mesh.geometry.dispose(); }
  if (ch.meshGlass) { G.scene.remove(ch.meshGlass); ch.meshGlass.geometry.dispose(); }
  if (ch.meshWater) { G.scene.remove(ch.meshWater); ch.meshWater.geometry.dispose(); }
  chunks.delete(ck); // не жалко: чанк восстановится из зерна + изменений
}

// Подгружаем чанки вокруг игрока, далёкие выгружаем
export function streamChunks(instant = false) {
  const VIEW = G.IS_TOUCH ? CONFIG.VIEW_TOUCH : CONFIG.VIEW_DESKTOP;
  const pcx = Math.floor(G.player.x / CHUNK), pcz = Math.floor(G.player.z / CHUNK);
  const need = [];
  for (let dx = -VIEW; dx <= VIEW; dx++)
    for (let dz = -VIEW; dz <= VIEW; dz++)
      need.push([pcx + dx, pcz + dz, dx * dx + dz * dz]);
  need.sort((a, b) => a[2] - b[2]); // ближние — первыми
  let done = 0;
  for (const [cx, cz] of need) {
    if (!chunks.has(ckey(cx, cz))) {
      if (!instant && done >= 2) break; // по два за раз — без фризов
      loadChunk(cx, cz);
      done++;
    }
  }
  for (const ck of [...chunks.keys()]) {
    const [cx, cz] = ck.split(',').map(Number);
    if (Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > VIEW + 1) unloadChunk(ck);
  }
}

// ---------- ИЗМЕНЕНИЕ МИРА (ломать/ставить) ----------
export function addBlock(x, y, z, type) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const ck = ckey(cx, cz);
  const ch = chunks.get(ck);
  if (!ch || ch.data.has(key(x, y, z))) return false;
  ch.data.set(key(x, y, z), type);
  if (!deltas[ck]) deltas[ck] = {};
  deltas[ck][key(x, y, z)] = type;
  buildChunk(cx, cz);
  rebuildAround(x, z);
  emit('dirty'); // мир изменился — надо сохранить
  return true;
}

export function removeBlockAt(x, y, z) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const ck = ckey(cx, cz);
  const ch = chunks.get(ck);
  if (!ch || !ch.data.has(key(x, y, z))) return false;
  ch.data.delete(key(x, y, z));
  if (!deltas[ck]) deltas[ck] = {};
  deltas[ck][key(x, y, z)] = 'X'; // запоминаем: тут сломали
  buildChunk(cx, cz);
  rebuildAround(x, z);
  emit('dirty');
  return true;
}
// ============================================================
//  🏙️ НЕБЕСНЫЕ ГОРОДА (через систему блоков world.js)
// ============================================================

// ---- ДАННЫЕ НЕБЕСНЫХ ГОРОДОВ ----
export const SKY_CITIES = [
  { id: 'sky_city_1', name: '☁️ Облачный город', x: 200, z: 0, height: 30, size: 20 },
  { id: 'sky_city_2', name: '🌅 Город Рассвета', x: -200, z: 0, height: 38, size: 25 }
];

// ---- СОЗДАНИЕ ГОРОДА ИЗ БЛОКОВ (через addBlock) ----
export function buildSkyCity(city) {
  const { x, z, height, size, name } = city;
  const blocks = [];
  
  // ---- ПЛАТФОРМА (камень + трава) ----
  for (let dx = -size; dx <= size; dx++) {
    for (let dz = -size; dz <= size; dz++) {
      if (Math.hypot(dx, dz) < size) {
        // Нижний слой — камень
        blocks.push([x + dx, height, z + dz, 'stone']);
        // Верхний слой — трава
        if (Math.hypot(dx, dz) < size - 0.5) {
          blocks.push([x + dx, height + 1, z + dz, 'grass']);
        }
      }
    }
  }
  
  // ---- СТЕНЫ ЗДАНИЙ ----
  const buildingPositions = [
    [-4, -4, 3, 3, 3], [4, -4, 3, 2.5, 3], [-4, 4, 2.5, 3.5, 2.5],
    [4, 4, 3, 2, 3], [-7, -2, 2, 3, 2], [7, -2, 2, 2.5, 2],
    [-7, 2, 2, 4, 2], [7, 2, 2, 2, 2], [-2, -7, 2, 3, 2],
    [2, -7, 2, 2.5, 2], [-2, 7, 2, 3.5, 2], [2, 7, 2, 2, 2]
  ];
  
  for (const [dx, dz, w, h, d] of buildingPositions) {
    const bx = x + dx;
    const bz = z + dz;
    const baseY = height + 1;
    
    // Стены
    for (let wx = -Math.floor(w/2); wx <= Math.floor(w/2); wx++) {
      for (let wz = -Math.floor(d/2); wz <= Math.floor(d/2); wz++) {
        const isWall = Math.abs(wx) === Math.floor(w/2) || Math.abs(wz) === Math.floor(d/2);
        if (isWall) {
          // Пропускаем дверь
          if (wx === 0 && wz === Math.floor(d/2)) continue;
          for (let wy = 0; wy < Math.floor(h); wy++) {
            // Окна
            if (wy === Math.floor(h/2) && (Math.abs(wx) === Math.floor(w/2) || Math.abs(wz) === Math.floor(d/2))) {
              blocks.push([bx + wx, baseY + wy + 0.5, bz + wz, 'glass']);
            } else {
              blocks.push([bx + wx, baseY + wy + 0.5, bz + wz, 'planks']);
            }
          }
        }
      }
    }
    
    // Крыша
    for (let wx = -Math.floor(w/2)-1; wx <= Math.floor(w/2)+1; wx++) {
      for (let wz = -Math.floor(d/2)-1; wz <= Math.floor(d/2)+1; wz++) {
        blocks.push([bx + wx, baseY + Math.floor(h) + 0.5, bz + wz, 'brick']);
      }
    }
    
    // Дверь
    blocks.push([bx, baseY, bz + Math.floor(d/2) + 1, 'door']);
  }
  
  // ---- ЦЕНТРАЛЬНАЯ БАШНЯ ----
  const towerX = x;
  const towerZ = z;
  const towerBase = height + 1;
  for (let wy = 0; wy < 5; wy++) {
    const tw = 2.5 - wy * 0.2;
    for (let wx = -Math.floor(tw/2); wx <= Math.floor(tw/2); wx++) {
      for (let wz = -Math.floor(tw/2); wz <= Math.floor(tw/2); wz++) {
        if (Math.abs(wx) === Math.floor(tw/2) || Math.abs(wz) === Math.floor(tw/2)) {
          blocks.push([towerX + wx, towerBase + wy * 0.6 + 0.3, towerZ + wz, 'stone']);
        }
      }
    }
  }
  // Шпиль (золото)
  blocks.push([towerX, towerBase + 3.5, towerZ, 'goldOre']);
  
  // ---- ФОНАРИ (столбы) ----
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const r = size - 1.5;
    const fx = x + Math.cos(angle) * r;
    const fz = z + Math.sin(angle) * r;
    blocks.push([fx, height + 1, fz, 'stone']);
    blocks.push([fx, height + 1.5, fz, 'stone']);
    blocks.push([fx, height + 2, fz, 'torch']);
  }
  
  // ---- ДОБАВЛЯЕМ ВСЕ БЛОКИ В МИР ----
  for (const [bx, by, bz, type] of blocks) {
    addBlock(bx, by, bz, type);
  }
  
  console.log(`🏙️ ${name} построен из блоков! (${x}, ${z}, высота ${height})`);
  console.log(`   📦 Добавлено ${blocks.length} блоков`);
  return blocks;
}

// ---- ПОСТРОИТЬ ВСЕ ГОРОДА ----
export function buildAllSkyCities() {
  console.log('🏙️ Строим небесные города из блоков...');
  let total = 0;
  for (const city of SKY_CITIES) {
    const blocks = buildSkyCity(city);
    total += blocks.length;
  }
  console.log(`✅ Всего добавлено ${total} блоков!`);
  return total;
}