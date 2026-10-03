// ============================================================
//  🗺️ МИНИКАРТА — вид мира сверху в правом верхнем углу
//  Каждые полсекунды перерисовываем квадрат вокруг игрока:
//  цвет точки = цвет верхнего блока колонки, чем выше — светлее.
//  Белая стрелочка посередине — это ты! Куда смотришь, туда и нос.
// ============================================================

import { CONFIG, COLORS } from './config.js';
import { blockAt } from './world.js';
import { CITIES as SURFACE_CITIES } from './surface_cities.js';
import { VILLAGES_DATA } from './villages_extended.js';
import { CITIES as SKY_CITIES } from './cities.js';
import { QUEST_SITES } from './quest_locations.js';
import { HOGWARTS } from './hogwarts.js';
import { LAIRS } from './lairs.js';
import { PORTALS, isPortalActive } from './portals.js';
import { KASCHEY, YAGA } from './fairytale.js';

let G = null, cv = null, ctx = null;
const R = 44;          // радиус карты в блоках (видим 88×88 блоков!)
const SCAN_TOP = 22;   // выше этого блоков на карте почти не бывает

export function initMinimap(gameContext) {
  G = gameContext;
  cv = document.getElementById('minimap');
  cv.width = cv.height = R * 2; // одна точка = один блок
  ctx = cv.getContext('2d');
  // 🖐️ Тап по миникарте — открыть БОЛЬШУЮ карту!
  cv.style.pointerEvents = 'auto';
  cv.style.cursor = 'pointer';
  cv.addEventListener('click', openBigMap);
}

// ============================================================
//  🗺️ БОЛЬШАЯ КАРТА — на полэкрана, с городами и игроком
// ============================================================
let bigMapEl = null, bigCtx = null;
const BIG_R = 150, BIG_STEP = 2, BIG_N = BIG_R * 2 / BIG_STEP; // 150×150 точек

export function openBigMap() {
  if (bigMapEl) { closeBigMap(); return; }
  bigMapEl = document.createElement('div');
  bigMapEl.id = 'bigMap';
  bigMapEl.style.cssText =
    'position:fixed;inset:0;z-index:30;background:rgba(0,0,0,0.55);' +
    'display:flex;align-items:center;justify-content:center';
  const px = Math.floor(G.player.x), pz = Math.floor(G.player.z);
  bigMapEl.innerHTML =
    '<div style="background:rgba(18,24,18,0.95);border:3px solid rgba(255,255,255,0.4);' +
    'border-radius:16px;padding:12px;text-align:center;max-width:94vw">' +
    `<div style="color:#ffe14d;font-weight:bold;margin-bottom:8px;font-size:15px">` +
    `🗺️ Карта мира — ты здесь: (${px}, ${pz})</div>` +
    '<canvas id="bigMapCv" width="600" height="600" style="width:min(86vw,52vh);' +
    'image-rendering:pixelated;border-radius:10px;background:#0a0f0a"></canvas>' +
    '<div style="margin-top:10px"><button id="bigMapClose" style="background:#c0392b;' +
    'color:#fff;border:2px solid rgba(255,255,255,0.5);border-radius:10px;' +
    'padding:8px 26px;font-size:15px;font-weight:bold;cursor:pointer">❌ Закрыть карту</button></div></div>';
  document.body.appendChild(bigMapEl);
  document.getElementById('bigMapClose').onclick = closeBigMap;
  bigMapEl.addEventListener('click', e => { if (e.target === bigMapEl) closeBigMap(); });
  bigCtx = document.getElementById('bigMapCv').getContext('2d');
  drawBigMap();
}

function closeBigMap() {
  if (bigMapEl) { bigMapEl.remove(); bigMapEl = null; }
}

function drawBigMap() {
  const S = 4; // суперсэмплинг: рисуем в 4x разрешении — надписи чёткие
  const px = Math.floor(G.player.x), pz = Math.floor(G.player.z);
  const img = new ImageData(BIG_N, BIG_N);
  for (let dz = 0; dz < BIG_N; dz++)
    for (let dx = 0; dx < BIG_N; dx++) {
      const i = (dz * BIG_N + dx) * 4;
      const wx = px - BIG_R + dx * BIG_STEP, wz = pz - BIG_R + dz * BIG_STEP;
      let type = null, topY = CONFIG.BEDROCK_Y;
      for (let y = 30; y >= CONFIG.BEDROCK_Y; y--) {
        const t = blockAt(wx, y, wz);
        if (t) { type = t; topY = y; break; }
      }
      if (!type) { img.data[i + 3] = 255; continue; } // чёрное = неисследовано
      const c = COLORS[type] || 0x000000;
      const shade = 0.6 + Math.max(0, Math.min(topY, 13)) * 0.03;
      img.data[i]     = Math.min(255, (c >> 16) * shade);
      img.data[i + 1] = Math.min(255, ((c >> 8) & 255) * shade);
      img.data[i + 2] = Math.min(255, (c & 255) * shade);
      img.data[i + 3] = 255;
    }
  // Терраин — на маленький канвас, потом растягиваем БЕЗ сглаживания (пиксель-арт)
  const off = document.createElement('canvas');
  off.width = off.height = BIG_N;
  off.getContext('2d').putImageData(img, 0, 0);
  bigCtx.imageSmoothingEnabled = false;
  bigCtx.drawImage(off, 0, 0, BIG_N * S, BIG_N * S);

  // Метки: города, деревни, квестовые места (только те, что в кадре)
  const toPix = (x, z) => [(x - (px - BIG_R)) / BIG_STEP * S, (z - (pz - BIG_R)) / BIG_STEP * S];
  const mark = (x, z, icon, name, color) => {
    const [mx, my] = toPix(x, z);
    if (mx < 28 || my < 28 || mx > BIG_N * S - 28 || my > BIG_N * S - 28) return;
    bigCtx.font = '34px sans-serif';
    bigCtx.textAlign = 'center';
    bigCtx.fillText(icon, mx, my);
    bigCtx.font = 'bold 21px sans-serif';
    bigCtx.strokeStyle = 'rgba(0,0,0,0.95)'; bigCtx.lineWidth = 5;
    bigCtx.lineJoin = 'round';
    bigCtx.strokeText(name, mx, my + 27);
    bigCtx.fillStyle = color;
    bigCtx.fillText(name, mx, my + 27);
  };
  for (const c of SURFACE_CITIES) mark(c.cx, c.cz, '🏙️', c.name.replace(/^\S+ /, ''), '#FF8C42');
  for (const v of VILLAGES_DATA) mark(v.x, v.z, '🏠', v.name.replace(/^\S+ /, ''), '#7DD87D');
  for (const q of QUEST_SITES) mark(q.x, q.z, '⭐', q.name.replace(/^\S+ /, ''), '#FF7B7B');
  for (const c of SKY_CITIES) mark(c.x, c.z, '☁️', c.name.replace(/^\S+ /, ''), '#7DC4FF');
  mark(HOGWARTS.cx, HOGWARTS.cz, '🏰', 'Хогвартс', '#C9A0FF');
  mark(KASCHEY.cx, KASCHEY.cz, '💀', 'Замок Кащея', '#7A4A9A');
  mark(YAGA.cx, YAGA.cz, '🧹', 'Избушка Яги', '#8AD84A');
  for (const p of PORTALS) if (isPortalActive(p.id)) mark(p.x, p.z, '🔵', p.name, '#66CCFF');
  for (const l of LAIRS) mark(l.x, l.z, l.icon, l.name.replace(/^\S+ /, ''), '#FF5A5A');
  mark(0, 0, '🚩', 'Старт', 'gold');

  // Игрок — белая стрелочка с чёрной обводкой
  bigCtx.save();
  bigCtx.translate(BIG_N * S / 2, BIG_N * S / 2);
  bigCtx.rotate(-G.player.yaw);
  bigCtx.scale(S, S);
  bigCtx.beginPath();
  bigCtx.moveTo(0, -7); bigCtx.lineTo(5, 6); bigCtx.lineTo(0, 3); bigCtx.lineTo(-5, 6);
  bigCtx.closePath();
  bigCtx.fillStyle = '#ffffff'; bigCtx.strokeStyle = 'rgba(0,0,0,0.9)'; bigCtx.lineWidth = 1.5;
  bigCtx.fill(); bigCtx.stroke();
  bigCtx.restore();
}

// Перерисовать карту (вызываем не каждый кадр — бережём батарею)
export function updateMinimap() {
  if (!ctx) return;
  const px = Math.floor(G.player.x), pz = Math.floor(G.player.z);
  const img = ctx.createImageData(R * 2, R * 2);
  for (let dz = -R; dz < R; dz++)
    for (let dx = -R; dx < R; dx++) {
      const i = ((dz + R) * R * 2 + (dx + R)) * 4;
      // Круглая карта: за кругом — прозрачность
      if (dx * dx + dz * dz > R * R) { img.data[i + 3] = 0; continue; }
      // Ищем верхний блок колонки — его цвет и рисуем
      let type = null, topY = CONFIG.BEDROCK_Y;
      for (let y = SCAN_TOP; y >= CONFIG.BEDROCK_Y; y--) {
        const t = blockAt(px + dx, y, pz + dz);
        if (t) { type = t; topY = y; break; }
      }
      if (!type) { img.data[i + 3] = 0; continue; } // пусто (небо)
      const c = COLORS[type] || 0x000000;
      // Точки выше — светлее, ниже — темнее: видно горы и реки!
      const shade = 0.65 + Math.max(0, Math.min(topY, 13)) * 0.028;
      img.data[i]     = Math.min(255, (c >> 16) * shade);
      img.data[i + 1] = Math.min(255, ((c >> 8) & 255) * shade);
      img.data[i + 2] = Math.min(255, (c & 255) * shade);
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);

  // Стрелочка игрока: поворачивается вместе с головой
  ctx.save();
  ctx.translate(R, R);
  ctx.rotate(-G.player.yaw);
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 1.5;
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
