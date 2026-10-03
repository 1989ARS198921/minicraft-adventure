// ============================================================
//  🏰 ХОГВАРТС — школа магии на юго-востоке карты (250, 230)
//  Замок «штампуется» при генерации чанка, как города.
//  Здесь живут Гарри, Гермиона и Рон — они дают задания!
// ============================================================

export const HOGWARTS = { id: 'hogwarts', name: '🏰 Хогвартс', cx: 250, cz: 230 };

const BASE = 3;  // верхний блок земли замка (гуляем на BASE+1)
const R = 15;    // половина платформы

// Факелы на стенах (зажигаются в main.js)
export const HOGWARTS_TORCHES = [
  [237, 8, 217], [263, 8, 217], [237, 8, 243], [263, 8, 243], // угловые башни
  [249, 6, 244], [251, 6, 244]                                 // у ворот
];

function put(data, x0, z0, x, y, z, t) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16) data.set(x + ',' + y + ',' + z, t);
}
function del(data, x0, z0, x, y, z) {
  if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16) data.delete(x + ',' + y + ',' + z);
}

export function stampHogwarts(data, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const C = HOGWARTS;
  // Чанк вообще пересекается с замком?
  if (x0 + 15 < C.cx - R - 2 || x0 > C.cx + R + 2 ||
      z0 + 15 < C.cz - R - 2 || z0 > C.cz + R + 2) return;

  const P = (dx, y, dz, t) => put(data, x0, z0, C.cx + dx, y, C.cz + dz, t);
  const D = (dx, y, dz) => del(data, x0, z0, C.cx + dx, y, C.cz + dz);

  // ---- Платформа: сносим всё лишнее, ровный двор ----
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
    for (let y = BASE + 1; y <= 24; y++) D(dx, y, dz);
    const yard = Math.max(Math.abs(dx), Math.abs(dz)) <= 11;
    P(dx, BASE, dz, yard ? 'stoneBricks' : 'grass');
    P(dx, BASE - 1, dz, 'dirt');
    P(dx, BASE - 2, dz, 'stone');
  }

  // ---- Кольцевая стена, ворота с юга ----
  for (let d = -13; d <= 13; d++) for (let y = 4; y <= 7; y++) {
    const gate = Math.abs(d) <= 1 && y <= 6; // проём 3×3 в южной стене
    P(d, y, -13, 'stoneBricks');
    if (!gate) P(d, y, 13, 'stoneBricks');
    P(-13, y, d, 'stoneBricks');
    P(13, y, d, 'stoneBricks');
  }
  // Зубцы на стенах
  for (let d = -13; d <= 13; d += 2) {
    P(d, 8, -13, 'stoneBricks'); P(d, 8, 13, 'stoneBricks');
    P(-13, 8, d, 'stoneBricks'); P(13, 8, d, 'stoneBricks');
  }

  // ---- 4 угловые башни со шпилями ----
  for (const [tx, tz] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++)
      for (let y = 4; y <= 12; y++)
        if (Math.abs(dx) === 1 || Math.abs(dz) === 1) P(tx + dx, y, tz + dz, 'stoneBricks');
    P(tx, 9, tz - 1, 'glowstone'); // магическое окно
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) P(tx + dx, 13, tz + dz, 'brick');
    P(tx, 14, tz, 'brick'); P(tx - 1, 14, tz, 'brick'); P(tx + 1, 14, tz, 'brick');
    P(tx, 14, tz - 1, 'brick'); P(tx, 14, tz + 1, 'brick');
    P(tx, 15, tz, 'brick'); P(tx, 16, tz, 'glowstone'); // светящийся кончик шпиля!
  }

  // ---- Большой зал (северная часть двора) ----
  for (let dx = -5; dx <= 5; dx++) for (let dz = -11; dz <= -5; dz++)
    for (let y = 4; y <= 9; y++) {
      const wall = Math.abs(dx) === 5 || dz === -11 || dz === -5;
      if (!wall) continue;
      // дверь в южной стене зала
      if (dz === -5 && dx === 0 && (y === 4 || y === 5)) continue;
      // светящиеся окна
      if (y === 6 && ((Math.abs(dx) === 5 && dz % 2 === 0) || (dz === -11 && dx % 2 === 0))) {
        P(dx, y, dz, 'glowstone'); continue;
      }
      P(dx, y, dz, 'stoneBricks');
    }
  P(0, 4, -5, 'door'); P(0, 5, -5, 'doorTop'); // двойная дверь зала
  // Крыша и парапет
  for (let dx = -5; dx <= 5; dx++) for (let dz = -11; dz <= -5; dz++) P(dx, 10, dz, 'stoneBricks');
  for (let dx = -5; dx <= 5; dx++) { P(dx, 11, -11, 'fence'); P(dx, 11, -5, 'fence'); }
  for (let dz = -11; dz <= -5; dz++) { P(-5, 11, dz, 'fence'); P(5, 11, dz, 'fence'); }
  // Центральный шпиль Большого зала
  for (let dx = -1; dx <= 1; dx++) for (let dz = -9; dz <= -7; dz++) P(dx, 11, dz, 'brick');
  P(0, 12, -8, 'brick'); P(0, 13, -8, 'brick'); P(0, 14, -8, 'glowstone');

  // ---- Фонари во дворе ----
  for (const [lx, lz] of [[-4, 3], [4, 3], [-4, 9], [4, 9]]) {
    P(lx, 4, lz, 'fence'); P(lx, 5, lz, 'glowstone');
  }
}
