// ============================================================
//  🏙️ ПЯТЬ БОЛЬШИХ ГОРОДОВ НА ПОВЕРХНОСТИ
//  Каждый город — настоящие блоки мира: стены с башнями,
//  ворота, площадь с фонтаном, 12 домов, фонари и дороги.
//  Города «штампуются» при генерации чанка — как деревни
//  и пещера гоблинов. У каждого города свой характер!
// ============================================================

const BASE = 3;  // верхний блок земли в городе (гуляем на BASE+1)
const R = 16;    // стена стоит на |dx| = R или |dz| = R

// ---- ГОРОДА: центр, материалы, характер ----
export const CITIES = [
  { id: 'steel',   name: '⚙️ Город Стальной',   cx: 135,  cz: 110,
    ground: 'grass', wall: 'stone', house: 'planks', accent: 'brick',
    road: 'sand', plaza: 'brick' },
  { id: 'gold',    name: '💰 Город Золотой',    cx: -120, cz: -130,
    ground: 'sand',  wall: 'sand',  house: 'planks', accent: 'goldOre',
    road: 'brick', plaza: 'brick' },
  { id: 'ancient', name: '🏛️ Город Древний',   cx: 150,  cz: -80,
    ground: 'grass', wall: 'stone', house: 'stone',  accent: 'goldOre',
    road: 'sand', plaza: 'stone', ruins: true },
  { id: 'north',   name: '❄️ Город Северный',   cx: -80,  cz: 150,
    ground: 'snow',  wall: 'stone', house: 'trunk',  accent: 'brick',
    road: 'stone', plaza: 'stone' },
  { id: 'under',   name: '⛏️ Город Подземный',  cx: 0,    cz: -120,
    ground: 'stone', wall: 'stone', house: 'stone',  accent: 'coalOre',
    road: 'sand', plaza: 'brick', shaft: true },
];

// Прямоугольники городов — чтобы деревья и цветы не росли внутри
export const CITY_RECTS = CITIES.map(c => ({
  id: 'city_' + c.id, name: c.name,
  x0: c.cx - R - 1, z0: c.cz - R - 1, x1: c.cx + R + 1, z1: c.cz + R + 1
}));

// ---- ПОЗИЦИИ ФАКЕЛОВ (добавляются в main.js) ----
export const CITY_TORCHES = [];
for (const c of CITIES) {
  const spots = [[3, 3], [-3, 3], [3, -3], [-3, -3], [3, R - 2], [-3, R - 2]];
  for (const [dx, dz] of spots) CITY_TORCHES.push([c.cx + dx, BASE + 3, c.cz + dz]);
}

// Поставить блок, если клетка попадает в этот чанк
function put(data, x0, z0, x, y, z, type) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16)
    data.set(x + ',' + y + ',' + z, type);
}

// Убрать блок (для проёмов и развалин)
function cut(data, x0, z0, x, y, z) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16)
    data.delete(x + ',' + y + ',' + z);
}

// ---- РОВНАЯ ПЛОЩАДКА + ДОРОГИ ----
// Срезаем холмы, засыпаем ямы, кладём улицы и площадь.
function stampGround(data, x0, z0, c) {
  for (let x = Math.max(x0, c.cx - R - 1); x <= Math.min(x0 + 15, c.cx + R + 1); x++)
    for (let z = Math.max(z0, c.cz - R - 1); z <= Math.min(z0 + 15, c.cz + R + 1); z++) {
      for (let y = BASE + 1; y <= 48; y++) cut(data, x0, z0, x, y, z); // сносим всё лишнее
      for (let y = -2; y <= BASE; y++) {
        const dx = x - c.cx, dz = z - c.cz;
        let top = c.ground;
        // 🛣️ Дороги-крест: от ворот через площадь
        if (Math.abs(dx) <= 1 || Math.abs(dz) <= 1) top = c.road;
        // ⛲ Площадь в центре
        if (Math.abs(dx) <= 3 && Math.abs(dz) <= 3) top = c.plaza;
        const k = x + ',' + y + ',' + z;
        if (y === BASE) put(data, x0, z0, x, y, z, top);
        else if (!data.has(k)) put(data, x0, z0, x, y, z, y <= 0 ? 'stone' : 'dirt');
      }
    }
}

// ---- СТЕНЫ, БАШНИ И ВОРОТА ----
function stampWalls(data, x0, z0, c) {
  for (let dx = -R - 1; dx <= R + 1; dx++)
    for (let dz = -R - 1; dz <= R + 1; dz++) {
      const onWall = Math.max(Math.abs(dx), Math.abs(dz)) === R;
      if (!onWall) continue;
      const isTower = Math.abs(dx) >= R - 1 && Math.abs(dz) >= R - 1; // угловая башня
      const isGate = dz === R && (dx === -1 || dx === 0);             // ворота на юге
      const isGatePost = dz === R && (dx === -2 || dx === 1);         // столбы у ворот
      const x = c.cx + dx, z = c.cz + dz;
      if (isGate) { // проём ворот: чисто, только перемычка сверху
        put(data, x0, z0, x, BASE + 4, z, c.accent);
        continue;
      }
      // 🏛️ В Древнем городе стены местами рухнули — проходы-развалины
      if (c.ruins && !isTower && ((x * 7 + z * 13) % 11 === 0)) continue;
      const top = isTower ? BASE + 5 : (isGatePost ? BASE + 4 : BASE + 3);
      for (let y = BASE + 1; y <= top; y++)
        put(data, x0, z0, x, y, z, isGatePost ? c.accent : c.wall);
      if (isTower) put(data, x0, z0, x, BASE + 6, z, c.accent); // зубец башни
    }
}

// ---- ФОНТАН НА ПЛОЩАДИ ⛲ ----
function stampFountain(data, x0, z0, c) {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const x = c.cx + dx, z = c.cz + dz;
      if (Math.max(Math.abs(dx), Math.abs(dz)) === 2)
        put(data, x0, z0, x, BASE + 1, z, 'stone'); // бортик
      else if (dx === 0 && dz === 0) {
        put(data, x0, z0, x, BASE + 1, z, 'stone'); // столбик
        put(data, x0, z0, x, BASE + 2, z, 'water'); // струя!
      } else put(data, x0, z0, x, BASE + 1, z, 'water'); // чаша
    }
}

// ---- ДОМА ВНУТРИ ГОРОДА 🏠 ----
// Маленькие домики 5×5 по периметру площади: стены, крыша, дверь.
function stampHouse(data, x0, z0, c, hx, hz) {
  for (let dx = 0; dx < 5; dx++)
    for (let dz = 0; dz < 5; dz++) {
      const x = hx + dx, z = hz + dz;
      const edge = dx === 0 || dx === 4 || dz === 0 || dz === 4;
      if (edge) {
        // дверь с южной стороны по центру
        const isDoor = dz === 4 && dx === 2;
        for (let y = BASE + 1; y <= BASE + 3; y++) {
          if (isDoor && y <= BASE + 2) cut(data, x0, z0, x, y, z);
          else put(data, x0, z0, x, y, z, c.house);
        }
      }
      // плоская крыша
      put(data, x0, z0, x, BASE + 4, z, c.accent);
    }
}

function stampHouses(data, x0, z0, c) {
  // 8 домов: по три с запада и востока, по одному у северной стены
  const spots = [
    [-12, -10], [-12, 0], [-12, 10],
    [8, -10], [8, 0], [8, 10],
    [-6, -13], [2, -13],
  ];
  for (const [dx, dz] of spots) {
    // в Древнем городе половина домов разрушена
    if (c.ruins && ((dx * 3 + dz * 5) % 2 === 0)) continue;
    stampHouse(data, x0, z0, c, c.cx + dx, c.cz + dz);
  }
}

// ---- ГЛАВНАЯ ФУНКЦИЯ: ШТАМПУЕМ ВСЕ ГОРОДА В ЧАНКЕ ----
// Вызывается из world.js при генерации каждого чанка.
// cx, cz — координаты чанка (не блоков!).
export function stampCities(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  for (const c of CITIES) {
    // Чанк вообще пересекается с городом? Если нет — пропускаем
    if (x0 + 15 < c.cx - R - 1 || x0 > c.cx + R + 1 ||
        z0 + 15 < c.cz - R - 1 || z0 > c.cz + R + 1) continue;
    stampGround(data, x0, z0, c);   // ровная площадка, дороги, площадь
    stampWalls(data, x0, z0, c);    // стены, башни, ворота
    stampFountain(data, x0, z0, c); // фонтан в центре
    stampHouses(data, x0, z0, c);   // домики
  }
}
