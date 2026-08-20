// ============================================================
//  🎨 АТЛАС ТЕКСТУР — у каждого блока свой рисунок!
//  Все картинки рисуются на одном холсте 5×5 плиток.
//  Грань блока смотрит на свою плитку по UV-координатам,
//  а «цвета вершин» теперь несут только тень/свет (AO).
//  Одна текстура на весь мир = один вызов видеокарты на чанк!
// ============================================================

import * as THREE from 'three';

const T = 32;      // размер плитки в пикселях
const COLS = 5, ROWS = 5;

// Номера плиток в атласе (строка за строкой):
//  0 трава-верх   1 трава-бок   2 земля      3 камень      4 песок
//  5 снег         6 ствол-бок   7 ствол-торец 8 листва     9 доски
// 10 кирпич      11 стекло     12 вода      13 уголь     14 золото
// 15 алмазы      16 кактус     17 ступень   18 дверь      19 цветок красный
// 20 цветок жёлтый 21 гриб     22 куст
export const FLOWER_RED = 19, FLOWER_YELLOW = 20;

// Какая плитка на верх / бок / низ каждого блока
export const TILES = {
  grass: [0, 1, 2],  dirt: [2, 2, 2],   stone: [3, 3, 3],  sand: [4, 4, 4],
  snow: [5, 5, 5],   trunk: [7, 6, 7],  leaf: [8, 8, 8],   planks: [9, 9, 9],
  brick: [10, 10, 10], glass: [11, 11, 11], water: [12, 12, 12],
  coalOre: [13, 13, 13], goldOre: [14, 14, 14], diamondOre: [15, 15, 15],
  cactus: [16, 16, 16], stair: [17, 17, 17], door: [18, 18, 18], doorTop: [18, 18, 18],
  flower: [19, 19, 19], mushroom: [21, 21, 21], bush: [22, 22, 22]
};

// ---------- Маляры: маленькие функции, рисующие узоры ----------
function makeAtlas() {
  const c = document.createElement('canvas');
  c.width = COLS * T; c.height = ROWS * T;
  const g = c.getContext('2d');

  const px = i => (i % COLS) * T;      // x плитки на холсте
  const py = i => Math.floor(i / COLS) * T; // y плитки
  const base = (i, color) => { g.fillStyle = color; g.fillRect(px(i), py(i), T, T); };
  // Пятнышки-шум: мозаика из квадратиков 4×4
  const dots = (i, colors, n = 16, s = 4) => {
    for (let k = 0; k < n; k++) {
      g.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      g.fillRect(px(i) + Math.floor(Math.random() * (T / s)) * s,
                 py(i) + Math.floor(Math.random() * (T / s)) * s, s, s);
    }
  };
  const hline = (i, y, color, h = 2) => { g.fillStyle = color; g.fillRect(px(i), py(i) + y, T, h); };
  const vline = (i, x, color, w = 2) => { g.fillStyle = color; g.fillRect(px(i) + x, py(i), w, T); };
  // Тёмная рамка по краю плитки — кубики читаются отдельно (совсем тонкая)
  const frame = i => {
    g.strokeStyle = 'rgba(0,0,0,0.13)'; g.lineWidth = 2;
    g.strokeRect(px(i) + 1, py(i) + 1, T - 2, T - 2);
  };

  // 0 — верх травы: сочная зелень
  base(0, '#4FCB24'); dots(0, ['#43B81F', '#5DDA2E', '#3AA818'], 22);
  // 1 — бок травы: земля с зелёной «чёлкой» сверху
  base(1, '#8B5A2B'); dots(1, ['#7A4A22', '#9C6A33'], 14);
  g.fillStyle = '#4FCB24'; g.fillRect(px(1), py(1), T, 7);
  g.fillStyle = '#43B81F';
  for (let k = 0; k < 8; k++) g.fillRect(px(1) + k * 4, py(1) + 7, 4, k % 2 ? 2 : 4);
  // 2 — земля
  base(2, '#8B5A2B'); dots(2, ['#7A4A22', '#9C6A33', '#6E4019'], 18);
  // 3 — камень
  base(3, '#9A9A9A'); dots(3, ['#8A8A8A', '#ABABAB', '#7E7E7E'], 18);
  // 4 — песок
  base(4, '#E8D78A'); dots(4, ['#DBC877', '#F2E39B'], 16);
  // 5 — снег
  base(5, '#F4F8FF'); dots(5, ['#E2ECF8', '#FFFFFF'], 12);
  // 6 — ствол сбоку: вертикальные полосы коры
  base(6, '#B5651D');
  for (let k = 0; k < 5; k++) vline(6, k * 7 + 1, '#9A4F14', 3);
  dots(6, ['#8A4512'], 6);
  // 7 — торец ствола: годовые кольца
  base(7, '#C89058');
  g.strokeStyle = '#9A6A34'; g.lineWidth = 2;
  g.strokeRect(px(7) + 5, py(7) + 5, 22, 22);
  g.strokeRect(px(7) + 11, py(7) + 11, 10, 10);
  // 8 — листва: густая зелень
  base(8, '#2E8B22'); dots(8, ['#257A1B', '#3AA32C', '#1E6B15'], 26);
  // 9 — доски: горизонтальные планки
  base(9, '#C89B5A');
  for (let k = 0; k < 4; k++) hline(9, k * 8, '#A87E42', 2);
  dots(9, ['#B98D4E'], 8);
  // 10 — кирпич: кладка со швами
  base(10, '#B7422F');
  g.fillStyle = '#D8C9B8';
  for (let k = 0; k < 4; k++) hline(10, k * 8, '#D8C9B8', 2);
  for (let k = 0; k < 4; k++)
    for (let j = 0; j < 2; j++)
      g.fillRect(px(10) + ((k % 2) ? 8 : 16) + j * 16, py(10) + k * 8, 2, 8);
  // 11 — стекло: почти невидимое, белая рамка и блик
  base(11, 'rgba(220,240,250,0.18)');
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 3;
  g.strokeRect(px(11) + 1.5, py(11) + 1.5, T - 3, T - 3);
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  g.beginPath(); g.moveTo(px(11) + 6, py(11) + 26); g.lineTo(px(11) + 26, py(11) + 6); g.stroke();
  // 12 — вода: волны
  base(12, '#3D8BDD');
  g.strokeStyle = '#6FB2F0'; g.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    for (let x = 0; x <= T; x += 4)
      g.lineTo(px(12) + x, py(12) + 6 + k * 10 + Math.sin(x / 5) * 2);
    g.stroke();
  }
  // 13-15 — руды: камень + цветные вкрапления
  const ore = (i, c1, c2) => {
    base(i, '#9A9A9A'); dots(i, ['#8A8A8A', '#7E7E7E'], 10);
    dots(i, [c1, c2], 9, 4);
  };
  ore(13, '#2B2B2B', '#404040');   // уголь
  ore(14, '#FFD75E', '#E8B73C');   // золото
  ore(15, '#7DF9FF', '#5CE8E0');   // алмазы
  // 16 — кактус: полосатый
  base(16, '#3E9B4F');
  for (let k = 0; k < 4; k++) vline(16, k * 8 + 2, '#2E7A3B', 2);
  vline(16, 14, '#5CC06E', 2);
  // 17 — ступенька: как камень, потемнее
  base(17, '#8C8C8C'); dots(17, ['#7C7C7C', '#9C9C9C'], 16);
  // 18 — дверь: дерево с рамой и ручкой
  base(18, '#A5682A'); dots(18, ['#8F5622', '#B97A38'], 10);
  g.strokeStyle = '#7A4A1C'; g.lineWidth = 2;
  g.strokeRect(px(18) + 5, py(18) + 5, 22, 10);
  g.strokeRect(px(18) + 5, py(18) + 18, 22, 9);
  g.fillStyle = '#FFD75E'; g.fillRect(px(18) + 23, py(18) + 15, 4, 4); // ручка
  // 19-20 — цветы: стебелёк и головка
  const flower = (i, col) => {
    base(i, '#4FCB24');
    g.fillStyle = '#2E8B22'; g.fillRect(px(i) + 14, py(i) + 14, 4, 18);
    g.fillStyle = col; g.fillRect(px(i) + 9, py(i) + 4, 14, 12);
    g.fillStyle = '#FFF3B0'; g.fillRect(px(i) + 13, py(i) + 7, 6, 6);
  };
  flower(19, '#E84C4C');  // красный тюльпан
  flower(20, '#F4D03F');  // жёлтый одуванчик
  // 21 — гриб: белая ножка, красная шляпка в горошек
  base(21, '#8B5A2B');
  g.fillStyle = '#F0E6D2'; g.fillRect(px(21) + 12, py(21) + 16, 8, 16);
  g.fillStyle = '#C0392B'; g.fillRect(px(21) + 5, py(21) + 4, 22, 13);
  g.fillStyle = '#FFFFFF';
  g.fillRect(px(21) + 8, py(21) + 7, 4, 4); g.fillRect(px(21) + 18, py(21) + 10, 4, 4);
  // 22 — куст: плотная зелень
  base(22, '#3FA33F'); dots(22, ['#339034', '#4CB54B', '#2A7A2E'], 24);

  // Рамки поверх всех плиток (кроме стекла — у него своя)
  for (let i = 0; i < COLS * ROWS; i++) if (i !== 11) frame(i);

  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; // пиксели остаются чёткими квадратиками
  return t;
}

// Общий материал всех чанков: атлас × свет/тень вершин
export const chunkMat = new THREE.MeshLambertMaterial({
  map: makeAtlas(),
  vertexColors: true
});

// Стекло — полупрозрачное, рисуется отдельной сеткой
export const chunkMatGlass = new THREE.MeshLambertMaterial({
  map: chunkMat.map,
  vertexColors: true,
  transparent: true,
  opacity: 0.55,
  depthWrite: false // чтобы стекло не «съедало» блоки за собой
});

// Вода — свой материал и СВОЯ копия текстуры: ей мы крутим
// UV-координаты туда-сюда, и волны на озёрах колышутся! 🌊
export const waterTex = new THREE.CanvasTexture(chunkMat.map.image);
waterTex.magFilter = THREE.NearestFilter;
export const chunkMatWater = new THREE.MeshLambertMaterial({
  map: waterTex,
  vertexColors: true,
  transparent: true,
  opacity: 0.62,
  depthWrite: false,
  emissive: 0x0A1A33 // ночью озёра чуть светятся — видно, куда нырять!
});

// Чёткие квадратики вместо мыльного размытия вдали:
// без мипмапов плитки атласа не «протекают» друг в друга
for (const t of [chunkMat.map, waterTex]) {
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
}
