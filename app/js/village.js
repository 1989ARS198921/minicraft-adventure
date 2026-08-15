// ============================================================
//  🏘️ ПОСЕЛЕНИЯ — деревни и стойбища на карте
//  Три поселения: наша деревня (люди) у старта,
//  цветочная деревня эльфов в лесу и грозное стойбище орков.
//  Земля под поселением выравнивается, а дома «штампуются»
//  прямо в данные чанков — их можно ломать и перестраивать!
// ============================================================

// Районы поселений: прямоугольники на карте
export const SETTLEMENTS = [
  { id: 'human', name: 'Деревня', x0: -18,  z0: -14,  x1: 22,   z1: 18  }, // у старта
  { id: 'elf',   name: 'Эльфы',   x0: 88,   z0: 66,   x1: 122,  z1: 96  }, // далеко в лесу 🧝
  { id: 'orc',   name: 'Орки',    x0: -150, z0: -100, x1: -116, z1: -72 },  // стойбище орков 👹
  // ===== НОВЫЕ ДЕРЕВНИ =====
  { id: 'forest_village', name: 'Лесная', x0: 70, z0: 50, x1: 90, z1: 70 },
  { id: 'mountain_village', name: 'Горная', x0: -70, z0: -50, x1: -50, z1: -30 },
  { id: 'fishing_village', name: 'Рыбацкая', x0: -90, z0: 100, x1: -70, z1: 120 },
  { id: 'magic_village', name: 'Магическая', x0: 110, z0: -110, x1: 130, z1: -90 },
  { id: 'mining_village', name: 'Шахтёрская', x0: 40, z0: -130, x1: 60, z1: -110 }
];
// Старый короткий псевдоним для нашей деревни
export const VILLAGE = SETTLEMENTS[0];

const BASE = 3; // верхний блок земли в поселении (гуляем на BASE+1)

// Точка внутри НАШЕЙ деревни?
export function inVillage(x, z) {
  return x >= VILLAGE.x0 - 2 && x <= VILLAGE.x1 + 2 &&
         z >= VILLAGE.z0 - 2 && z <= VILLAGE.z1 + 2;
}
// Точка внутри ЛЮБОГО поселения? (там не сажаем дикие деревья)
export function inAnyVillage(x, z, m = 2) {
  return SETTLEMENTS.some(s =>
    x >= s.x0 - m && x <= s.x1 + m && z >= s.z0 - m && z <= s.z1 + m);
}
// В каком поселении мы стоим? (null = в дикой местности)
export function settlementAt(x, z) {
  return SETTLEMENTS.find(s =>
    x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) || null;
}

// ---------- ⛲ ФОНТАН ЖИВОЙ ВОДЫ ----------
// Сердце нашей деревни! Вода в нём волшебная: рядом с ним
// сердечки растут сами, а если героя совсем разбили — он
// очнётся именно здесь, целый и невредимый 💫
export const FOUNTAIN = { x: 1.5, z: -1.5, y: BASE + 1 };
export const RESPAWN  = { x: 1.5, z: -5.5 }; // просыпаемся у фонтана

// ---------- ПЛАН НАШЕЙ ДЕРЕВНИ ----------
// Три домика, лавка купца, башня волшебника, цветник и фонтан
const HOUSES = [
  { x: -10, z: -6 },  // домик Бори
  { x: 12,  z: -8 },  // домик Маши
  { x: -8,  z: 12 }   // домик Степана
];
const SHOP  = { x: 6,  z: -9 };  // лавка Тихона
const TOWER = { x: 14, z: 10 };  // башня Мерлина
const GARDEN = { x0: -2, z0: 6, x1: 4, z1: 10 }; // цветник Леи

// Уличные факелы и огоньки в домах (ставятся один раз в новом мире)
export const VILLAGE_TORCHES = [
  [1, 4, -6], [1, 4, 6], // уличные, вдоль главной улицы
  ...HOUSES.map(h => [h.x + 2, 4, h.z + 2]), // по факелу в каждом домике
  [TOWER.x + 2, 4, TOWER.z + 2]              // и в башне волшебника
];

// Домики жителей: где живёт каждый персонаж (гуляет рядом).
// ВАЖНО: точка стоит ПЕРЕД дверью, а не внутри дома —
// иначе житель появится на крыше! 😄
export const VILLAGE_HOMES = [
  { x: -7.5,  z: -7.5,  y: BASE + 1 }, // Боря — у своего домика
  { x: 14.5,  z: -9.5,  y: BASE + 1 }, // Маша
  { x: -5.5,  z: 10.5,  y: BASE + 1 }, // Степан
  { x: 6.5,   z: -11,   y: BASE + 1 }, // Тихон — за прилавком лавки
  { x: 16.5,  z: 8.5,   y: BASE + 1 }, // Мерлин — перед башней
  { x: 1,     z: 4.5,   y: BASE + 1 }  // Лея — у калитки цветника
];

// ---------- ПЛАН ДЕРЕВНИ ЭЛЬФОВ 🧝 ----------
// Домики с крышами из листвы, цветы повсюду, тихие факелы
const ELF_HOUSES = [
  { x: 98,  z: 77 },  // домик Эарона
  { x: 110, z: 84 }   // домик Линии
];
export const ELF_TORCHES = [
  ...ELF_HOUSES.map(h => [h.x + 2, 4, h.z + 2]),
  [105, 4, 75] // фонарик у цветочной полянки
];
export const ELF_HOMES = [
  { x: 100.5, z: 74.5, y: BASE + 1 }, // Эарон — перед своей дверью
  { x: 112.5, z: 81.5, y: BASE + 1 }  // Линия
];

// ---------- ПЛАН СТОЙБИЩА ОРКОВ 👹 ----------
// Грубые каменные хижины без окошек и «тотемы» с черепами.
// Орки злые: подходить близко без меча не стоит!
const ORC_HUTS = [
  { x: -139, z: -89 },
  { x: -129, z: -91 },
  { x: -133, z: -80 }
];
const ORC_TOTEMS = [
  [-146, -96], [-120, -96], [-146, -76], [-120, -76] // по углам лагеря
];
export const ORC_TORCHES = [
  [-134, 4, -85], [-134, 4, -95],
  [-131, 4, -84], [-137, 4, -93]
];
// Точки, где стоят орки (перед хижинами и в центре)
export const ORC_HOMES = [
  { x: -136.5, z: -91.5 },
  { x: -126.5, z: -93.5 },
  { x: -130.5, z: -82.5 },
  { x: -133.5, z: -86.5 },
  { x: -123.5, z: -85.5 }
];

// Поставить блок, если клетка попадает в этот чанк
function put(data, x0, z0, x, y, z, type) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16)
    data.set(x + ',' + y + ',' + z, type);
}

// Ровная площадка под поселение: срезаем холмы, засыпаем ямы.
// streets — функция «здесь улочка?» (песочек вместо травы)
function stampGround(data, x0, z0, s, streets) {
  for (let x = Math.max(x0, s.x0); x <= Math.min(x0 + 15, s.x1); x++)
    for (let z = Math.max(z0, s.z0); z <= Math.min(z0 + 15, s.z1); z++) {
      for (let y = BASE + 1; y <= 40; y++) data.delete(x + ',' + y + ',' + z);
      for (let y = -2; y <= BASE; y++) {
        const k = x + ',' + y + ',' + z;
        if (y === BASE)
          data.set(k, streets && streets(x, z) ? 'sand' : 'grass');
        else if (!data.has(k)) data.set(k, y <= 0 ? 'stone' : 'dirt');
      }
    }
}

// Один домик 5×5: углы — бревнышки, стены — доски,
// окна — стекло, дверь с юга, крыша — пирамидка.
// style: 'wood' — обычный, 'leaf' — эльфийский с лиственной крышей
function stampHouse(data, x0, z0, hx, hz, style = 'wood') {
  const roof = style === 'leaf' ? 'leaf' : 'planks';
  for (let dx = 0; dx < 5; dx++)
    for (let dz = 0; dz < 5; dz++) {
      put(data, x0, z0, hx + dx, BASE, hz + dz, 'planks'); // пол
      const edge = dx === 0 || dx === 4 || dz === 0 || dz === 4;
      if (!edge) continue;
      const corner = (dx === 0 || dx === 4) && (dz === 0 || dz === 4);
      for (let y = BASE + 1; y <= BASE + 3; y++) {
        // Дверной проём — посередине южной стены
        if (dz === 0 && dx === 2 && y <= BASE + 2) {
          put(data, x0, z0, hx + dx, y, hz + dz, y === BASE + 1 ? 'door' : 'doorTop');
          continue;
        }
        // Окошки-стёклышки на боковых стенах
        if (y === BASE + 2 && ((dz === 2 && (dx === 0 || dx === 4)) || (dz === 4 && (dx === 1 || dx === 3)))) {
          put(data, x0, z0, hx + dx, y, hz + dz, 'glass');
          continue;
        }
        put(data, x0, z0, hx + dx, y, hz + dz, corner ? 'trunk' : 'planks');
      }
    }
  // Крыша-пирамидка с «карнизом» (выпирает на блок со всех сторон)
  for (let dx = -1; dx <= 5; dx++)
    for (let dz = -1; dz <= 5; dz++)
      put(data, x0, z0, hx + dx, BASE + 4, hz + dz, roof);
  for (let dx = 1; dx <= 3; dx++)
    for (let dz = 1; dz <= 3; dz++)
      put(data, x0, z0, hx + dx, BASE + 5, hz + dz, roof);
}

// Хижина орка: камень и брёвна, без окошек, плоская крыша —
// грубо и зловеще, как они любят 👹
function stampOrcHut(data, x0, z0, hx, hz) {
  for (let dx = 0; dx < 5; dx++)
    for (let dz = 0; dz < 5; dz++) {
      put(data, x0, z0, hx + dx, BASE, hz + dz, 'stone'); // пол
      const edge = dx === 0 || dx === 4 || dz === 0 || dz === 4;
      if (!edge) continue;
      const corner = (dx === 0 || dx === 4) && (dz === 0 || dz === 4);
      for (let y = BASE + 1; y <= BASE + 2; y++) { // низкий потолок!
        if (dz === 0 && dx === 2 && y <= BASE + 2) { // дверь
          put(data, x0, z0, hx + dx, y, hz + dz, y === BASE + 1 ? 'door' : 'doorTop');
          continue;
        }
        put(data, x0, z0, hx + dx, y, hz + dz, corner ? 'trunk' : 'stone');
      }
    }
  // Плоская крыша из досок
  for (let dx = 0; dx < 5; dx++)
    for (let dz = 0; dz < 5; dz++)
      put(data, x0, z0, hx + dx, BASE + 3, hz + dz, 'planks');
}

// Тотем орков: столб из брёвен со «черепом» (белым блоком) наверху 💀
function stampTotem(data, x0, z0, tx, tz) {
  for (let y = BASE + 1; y <= BASE + 3; y++)
    put(data, x0, z0, tx, y, tz, 'trunk');
  put(data, x0, z0, tx, BASE + 4, tz, 'snow');
}

// Лавка купца: прилавок из кирпича и навес на столбиках
function stampShop(data, x0, z0, sx, sz) {
  for (let dx = 0; dx < 4; dx++)
    put(data, x0, z0, sx + dx, BASE + 1, sz, 'brick'); // прилавок
  for (const [px, pz] of [[0, -2], [3, -2], [0, 1], [3, 1]])
    for (let y = BASE + 1; y <= BASE + 3; y++)
      put(data, x0, z0, sx + px, y, sz + pz, 'trunk'); // столбики
  for (let dx = -1; dx <= 4; dx++)
    for (let dz = -3; dz <= 2; dz++)
      put(data, x0, z0, sx + dx, BASE + 4, sz + dz, 'planks'); // навес
}

// Башня волшебника: каменная, высокая, с зелёным «колпаком»
// и золотым кристаллом на макушке ✨
function stampTower(data, x0, z0, tx, tz) {
  for (let dx = 0; dx < 5; dx++)
    for (let dz = 0; dz < 5; dz++) {
      put(data, x0, z0, tx + dx, BASE, tz + dz, 'stone'); // пол
      const edge = dx === 0 || dx === 4 || dz === 0 || dz === 4;
      if (!edge) continue;
      for (let y = BASE + 1; y <= BASE + 6; y++) {
        if (dz === 0 && dx === 2 && y <= BASE + 2) { // дверь
          put(data, x0, z0, tx + dx, y, tz + dz, y === BASE + 1 ? 'door' : 'doorTop');
          continue;
        }
        if (y === BASE + 4 && dz === 4 && dx === 2) { // окно повыше
          put(data, x0, z0, tx + dx, y, tz + dz, 'glass');
          continue;
        }
        put(data, x0, z0, tx + dx, y, tz + dz, 'stone');
      }
    }
  // «Колпак» из листвы — как шляпа волшебника!
  const roof = [[7, -1, 5], [8, 0, 4], [9, 1, 3], [10, 2, 2]];
  for (const [dy, a, b] of roof)
    for (let dx = a; dx <= b; dx++)
      for (let dz = a; dz <= b; dz++)
        put(data, x0, z0, tx + dx, BASE + dy, tz + dz, 'leaf');
  put(data, x0, z0, tx + 2, BASE + 11, tz + 2, 'goldOre'); // кристалл!
}

// Цветник эльфийки: живая изгородь из кустиков, внутри — цветы
function stampGarden(data, x0, z0) {
  for (let x = GARDEN.x0; x <= GARDEN.x1; x++)
    for (let z = GARDEN.z0; z <= GARDEN.z1; z++) {
      const edge = x === GARDEN.x0 || x === GARDEN.x1 || z === GARDEN.z0 || z === GARDEN.z1;
      if (edge && !(z === GARDEN.z0 && x === 1)) // калитка с юга
        put(data, x0, z0, x, BASE + 1, z, 'bush');
      else if (!edge && (x + z) % 2 === 0)
        put(data, x0, z0, x, BASE + 1, z, 'flower');
    }
}

// ⛲ Фонтан живой воды: каменная чаша, вода и алмазный
// кристалл посередине — он и делает воду волшебной!
function stampFountain(data, x0, z0) {
  const fx = 1, fz = -1; // центр чаши
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const ring = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
      if (ring) put(data, x0, z0, fx + dx, BASE + 1, fz + dz, 'stone'); // бортик
      else put(data, x0, z0, fx + dx, BASE + 1, fz + dz, 'water');      // живая вода
    }
  put(data, x0, z0, fx, BASE + 1, fz, 'stone');      // столбик посередине
  put(data, x0, z0, fx, BASE + 2, fz, 'diamondOre'); // 💎 кристалл живой воды!
}

// Цветочная поляна эльфов: цветы в шахматном порядке
function stampElfFlowers(data, x0, z0) {
  for (let x = 100; x <= 110; x++)
    for (let z = 72; z <= 78; z++)
      if ((x + z) % 3 === 0)
        put(data, x0, z0, x, BASE + 1, z, 'flower');
}

// ---------- ГЛАВНАЯ «ПЕЧАТЬ» ----------
// Вызывается из генератора чанков для каждого поселения.
// 1) Ровняем землю  2) Мостим улочки  3) Ставим постройки
export function stampVillage(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const s = VILLAGE;
  if (x0 > s.x1 + 6 || x0 + 16 < s.x0 - 6 ||
      z0 > s.z1 + 6 || z0 + 16 < s.z0 - 6) return;
  stampGround(data, x0, z0, s,
    (x, z) => (x >= 1 && x <= 2) || (z >= -2 && z <= -1)); // улочки-крест
  for (const h of HOUSES) stampHouse(data, x0, z0, h.x, h.z);
  stampShop(data, x0, z0, SHOP.x, SHOP.z);
  stampTower(data, x0, z0, TOWER.x, TOWER.z);
  stampGarden(data, x0, z0);
  stampFountain(data, x0, z0);
}

export function stampElfVillage(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const s = SETTLEMENTS[1];
  if (x0 > s.x1 + 6 || x0 + 16 < s.x0 - 6 ||
      z0 > s.z1 + 6 || z0 + 16 < s.z0 - 6) return;
  stampGround(data, x0, z0, s,
    (x, z) => z >= 74 && z <= 75); // песочная дорожка перед домами
  for (const h of ELF_HOUSES) stampHouse(data, x0, z0, h.x, h.z, 'leaf');
  stampElfFlowers(data, x0, z0);
}

export function stampOrcCamp(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const s = SETTLEMENTS[2];
  if (x0 > s.x1 + 6 || x0 + 16 < s.x0 - 6 ||
      z0 > s.z1 + 6 || z0 + 16 < s.z0 - 6) return;
  stampGround(data, x0, z0, s,
    x => x === -134); // одна утоптанная тропа
  for (const h of ORC_HUTS) stampOrcHut(data, x0, z0, h.x, h.z);
  for (const t of ORC_TOTEMS) stampTotem(data, x0, z0, t[0], t[1]);
}

// Штампуем все три поселения разом (генератор зовёт именно это)
export function stampSettlements(data, cx, cz) {
  stampVillage(data, cx, cz);
  stampElfVillage(data, cx, cz);
  stampOrcCamp(data, cx, cz);
}
