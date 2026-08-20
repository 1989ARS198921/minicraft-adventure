// utils.js — вспомогательные функции для MiniCraft Adventure
window.Utils = {
    rand:     (min, max) => Math.random() * (max - min) + min,
    randInt:  (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    clamp:    (val, min, max) => Math.max(min, Math.min(max, val)),
    lerp:     (a, b, t) => a + (b - a) * t,
    dist:     (x1, z1, x2, z2) => Math.sqrt((x2-x1)**2 + (z2-z1)**2),
    chance:   (p) => Math.random() < p,
    pick:     (arr) => arr[Math.floor(Math.random() * arr.length)],
    uuid:     () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                  const r = Math.random() * 16 | 0;
                  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
              })
};

// Глобальные алиасы
window.rand     = window.Utils.rand;
window.randInt  = window.Utils.randInt;
window.clamp    = window.Utils.clamp;
window.lerp     = window.Utils.lerp;
window.dist     = window.Utils.dist;
window.chance   = window.Utils.chance;
window.pick     = window.Utils.pick;
window.uuid     = window.Utils.uuid;

console.log('[utils.js] Утилиты загружены');
