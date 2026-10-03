// ============================================================
//  💀🧙 ЗАМОК КАЩЕЯ и ИЗБУШКА БАБЫ ЯГИ — сказочные локации
//  на дальних краях карты. Оба дают цепочки заданий!
// ============================================================

export const KASCHEY = { id: 'kaschey', name: '💀 Замок Кащея', cx: -350, cz: 300 };
export const YAGA = { id: 'yaga', name: '🧹 Избушка Яги', cx: 350, cz: -260 };

const BASE = 3;

export const KASCHEY_TORCHES = [
  [-361, 8, 289], [-339, 8, 289], [-361, 8, 311], [-339, 8, 311], // башни
  [-351, 6, 312], [-349, 6, 312]                                   // у ворот
];
export const YAGA_TORCHES = [[348, 5, -255], [353, 5, -255]];

function put(data, x0, z0, x, y, z, t) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16) data.set(x + ',' + y + ',' + z, t);
}
function del(data, x0, z0, x, y, z) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16) data.delete(x + ',' + y + ',' + z);
}

// 💀 Замок Кащея: обсидиановые стены, лавовый ров, шпили
export function stampKaschey(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const C = KASCHEY, R = 14;
  if (x0 + 15 < C.cx - R - 4 || x0 > C.cx + R + 4 ||
      z0 + 15 < C.cz - R - 4 || z0 > C.cz + R + 4) return;
  const P = (dx, y, dz, t) => put(data, x0, z0, C.cx + dx, y, C.cz + dz, t);
  const D = (dx, y, dz) => del(data, x0, z0, C.cx + dx, y, C.cz + dz);

  // Платформа: тёмная земля
  for (let dx = -R - 2; dx <= R + 2; dx++) for (let dz = -R - 2; dz <= R + 2; dz++) {
    for (let y = BASE + 1; y <= 26; y++) D(dx, y, dz);
    P(dx, BASE, dz, 'stone');
    P(dx, BASE - 1, dz, 'stone');
    P(dx, BASE - 2, dz, 'stone');
  }
  // Лавовый ров по периметру (глубокая канава, мосты с севера и юга)
  for (let d = -R - 1; d <= R + 1; d++) {
    const bridge = Math.abs(d) <= 1; // мостики
    if (!bridge) {
      P(d, BASE, -R - 1, 'lava'); P(d, BASE, R + 1, 'lava');
      P(-R - 1, BASE, d, 'lava'); P(R + 1, BASE, d, 'lava');
    }
  }
  // Стены из обсидиана
  for (let d = -12; d <= 12; d++) for (let y = 4; y <= 8; y++) {
    const gate = Math.abs(d) <= 1 && y <= 6;
    P(d, y, -12, 'obsidian');
    if (!gate) P(d, y, 12, 'obsidian');
    P(-12, y, d, 'obsidian'); P(12, y, d, 'obsidian');
  }
  for (let d = -12; d <= 12; d += 2) {
    P(d, 9, -12, 'obsidian'); P(d, 9, 12, 'obsidian');
    P(-12, 9, d, 'obsidian'); P(12, 9, d, 'obsidian');
  }
  // 4 тёмные башни со шпилями
  for (const [tx, tz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
      for (let y = 4; y <= 13; y++)
        if (Math.abs(dx) === 1 || Math.abs(dz) === 1) P(tx + dx, y, tz + dz, 'obsidian');
    P(tx, 10, tz - 1, 'glowstone'); // недоброе зелёное... свечение
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) P(tx + dx, 14, tz + dz, 'obsidian');
    P(tx, 15, tz, 'obsidian'); P(tx, 16, tz, 'obsidian'); P(tx, 17, tz, 'glowstone');
  }
  // Тронный зал (север): помост и трон
  for (let dx = -3; dx <= 3; dx++) for (let dz = -9; dz <= -5; dz++) P(dx, 4, dz, 'obsidian');
  for (let dx = -3; dx <= 3; dx++) for (let y = 5; y <= 9; y++) P(dx, y, -9, 'obsidian');
  for (let dz = -9; dz <= -5; dz++) for (let y = 5; y <= 9; y++) { P(-3, y, dz, 'obsidian'); P(3, y, dz, 'obsidian'); }
  P(0, 5, -8, 'obsidian'); P(0, 6, -8, 'glowstone'); // трон
  // Могильные плиты во дворе — Кащей любит мрак
  for (const [dx, dz] of [[-6, 2], [6, 2], [-6, 6], [6, 6], [0, 4]]) {
    P(dx, 4, dz, 'stoneBricks'); P(dx, 5, dz, 'obsidian');
  }

}

// 🧹 Избушка Бабы Яги на курьих ножках, в глухом лесу
export function stampYaga(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const C = YAGA, R = 10;
  if (x0 + 15 < C.cx - R || x0 > C.cx + R || z0 + 15 < C.cz - R || z0 > C.cz + R) return;
  const P = (dx, y, dz, t) => put(data, x0, z0, C.cx + dx, y, C.cz + dz, t);
  const D = (dx, y, dz) => del(data, x0, z0, C.cx + dx, y, C.cz + dz);

  // Поляна: ровная трава
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
    for (let y = BASE + 1; y <= 20; y++) D(dx, y, dz);
    P(dx, BASE, dz, 'grass'); P(dx, BASE - 1, dz, 'dirt'); P(dx, BASE - 2, dz, 'stone');
  }
  // Глухой лес по кругу поляны
  for (let a = 0; a < 10; a++) {
    const dx = Math.round(Math.cos(a / 10 * Math.PI * 2) * 8);
    const dz = Math.round(Math.sin(a / 10 * Math.PI * 2) * 8);
    for (let y = 4; y <= 6; y++) P(dx, y, dz, 'trunk');
    for (let lx = -1; lx <= 1; lx++) for (let lz = -1; lz <= 1; lz++) P(dx + lx, 7, dz + lz, 'leaf');
    P(dx, 8, dz, 'leaf');
  }
  // Курьи ножки (сваи-лапы!)
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) P(dx, 4, dz, 'trunk');
  // Избушка 5×5 на сваях (пол на уровне 5)
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) P(dx, 5, dz, 'planks');
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let y = 6; y <= 8; y++) {
    const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
    if (!wall) continue;
    if (dz === 2 && dx === 0 && (y === 6 || y === 7)) continue; // дверь
    if (y === 7 && ((Math.abs(dx) === 2 && dz === 0) || (dz === -2 && dx === 0))) { P(dx, y, dz, 'glass'); continue; } // окна
    P(dx, y, dz, 'trunk');
  }
  P(0, 6, 2, 'door'); P(0, 7, 2, 'doorTop');
  // Крыша-ступеньки
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) P(dx, 9, dz, 'planks');
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) P(dx, 10, dz, 'planks');
  P(0, 11, 0, 'trunk'); P(0, 12, 0, 'glowstone'); // труба с огоньком
  // Ступеньки к двери
  P(0, 4, 3, 'slab'); P(0, 4, 4, 'slab');
  // Ступа рядом!
  P(4, 4, 0, 'trunk'); P(4, 5, 0, 'glowstone');
  // Грядки с грибами
  for (const [dx, dz] of [[-5, 3], [-5, 4], [-6, 3], [-6, 4]]) P(dx, 4, dz, 'mushroom');
}
