// ============================================================
//  🗺️ МИНИКАРТА — вид мира сверху в правом верхнем углу
//  Каждые полсекунды перерисовываем квадрат вокруг игрока:
//  цвет точки = цвет верхнего блока колонки, чем выше — светлее.
//  Белая стрелочка посередине — это ты! Куда смотришь, туда и нос.
// ============================================================

import { CONFIG, COLORS } from './config.js';
import { blockAt } from './world.js';

let G = null, cv = null, ctx = null;
const R = 44;          // радиус карты в блоках (видим 88×88 блоков!)
const SCAN_TOP = 22;   // выше этого блоков на карте почти не бывает

export function initMinimap(gameContext) {
  G = gameContext;
  cv = document.getElementById('minimap');
  cv.width = cv.height = R * 2; // одна точка = один блок
  ctx = cv.getContext('2d');
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
