// ============================================================
//  🧭 ПРОСТАЯ НАВИГАЦИЯ К ГОРОДУ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Проверяем, есть ли уже компас
  if (document.getElementById('compass')) return;

  // Создаём компас
  const compass = document.createElement('div');
  compass.id = 'compass';
  compass.style.cssText = `
    position: fixed; bottom: 80px; left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    background: rgba(0,0,0,0.7);
    border-radius: 16px;
    padding: 8px 16px;
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.2);
    pointer-events: none;
  `;
  compass.innerHTML = `
    <span id="compassArrow" style="font-size:22px;">⬆️</span>
    <span style="opacity:0.7;">К:</span>
    <span id="compassTarget">🏙️ Город</span>
    <span id="compassDist" style="color:#ffe14d;">0 м</span>
  `;
  document.body.appendChild(compass);

  // Функция обновления компаса
  function updateNav() {
    const arrow = document.getElementById('compassArrow');
    const distEl = document.getElementById('compassDist');
    const targetEl = document.getElementById('compassTarget');

    if (!arrow || !distEl) return;

    const cam = window.camera || window.__camera;
    if (!cam) return;

    const targetX = -100;
    const targetZ = -80;
    const dx = targetX - cam.position.x;
    const dz = targetZ - cam.position.z;
    const dist = Math.hypot(dx, dz);

    distEl.textContent = dist > 100 ? `${Math.round(dist)} м` : `${Math.round(dist)} м`;

    // Стрелка всегда показывает вверх (упрощённо)
    // Если цель близко — зелёная
    if (dist < 20) {
      arrow.style.color = '#7CFC00';
      targetEl.textContent = '🏙️ Город (рядом!)';
    } else if (dist < 50) {
      arrow.style.color = '#FFD75E';
      targetEl.textContent = '🏙️ Город';
    } else {
      arrow.style.color = '#fff';
      targetEl.textContent = '🏙️ Город';
    }
  }

  // Обновляем каждые 200ms
  setInterval(updateNav, 200);

  console.log('🧭 Навигация к городу включена!');
  console.log('📍 Город: -100, -80');
  console.log('💡 Введи в консоли: camera.position.set(-100, 2, -80)');
});