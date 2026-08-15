// ============================================================
//  💾 СОХРАНЕНИЕ МИРА (localStorage браузера)
//  Храним не весь мир (он бесконечный!), а только:
//  зерно генератора + список изменений игрока + факелы +
//  позицию игрока + задания + время суток.
//  Из этого мир восстанавливается один в один!
// ============================================================

import { CONFIG } from './config.js';
import { on } from './bus.js';
import { getDeltas, setDeltas, setSeed } from './world.js';
import { getTorches, addTorch } from './torches.js';
import { getFires, addFire } from './campfire.js';
import { questState } from './quests.js';

let G = null;
let dirty = false; // флаг «есть несохранённые изменения»

export function initSave(gameContext) {
  G = gameContext;
  on('dirty', () => dirty = true);                 // шина сообщает об изменениях
  setInterval(saveWorld, CONFIG.SAVE_INTERVAL);    // сохраняем каждые 2 секунды
  window.addEventListener('beforeunload', saveWorld); // и при закрытии вкладки
}

export function markDirty() { dirty = true; }

export function saveWorld() {
  if (!dirty) return;
  const data = {
    seed: G.seed,
    deltas: getDeltas(),
    torches: getTorches().map(t => [t.x, t.y, t.z]),
    fires: getFires().map(f => [f.x, f.y, f.z]), // 🔥 костры тоже помним!
    hp: G.hp,                                    // ❤️ здоровье
    player: { x: G.player.x, z: G.player.z, feet: G.player.feet, yaw: G.player.yaw },
    quests: questState,
    time: G.time.t,
    xp: G.xp, level: G.level, // ⭐ прогресс героя
    gear: G.equip,            // ⚔️ надетое снаряжение (меч/лук + броня)
    skills: G.skills, sp: G.sp, // 📚 навыки и очки навыков
    // Карман: бесконечность (∞) не умеет в JSON — кодируем как -1
    inv: Object.fromEntries(Object.entries(G.inv).map(([k, v]) => [k, v === Infinity ? -1 : v]))
  };
  try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data)); }
  catch (e) { /* память кончилась — не страшно, играем дальше */ }
  dirty = false;
}

// Загрузить сохранение. Возвращает true, если мир был найден.
export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    setSeed(data.seed);
    setDeltas(data.deltas || {});
    if (data.player) Object.assign(G.player, data.player);
    if (data.quests) Object.assign(questState, data.quests);
    if (data.inv) for (const k in data.inv) // -1 обратно в бесконечность
      G.inv[k] = data.inv[k] === -1 ? Infinity : data.inv[k];
    if (typeof data.time === 'number') G.time.t = data.time;
    if (typeof data.xp === 'number') G.xp = data.xp;
    if (typeof data.level === 'number') G.level = data.level;
    if (data.torches) for (const [x, y, z] of data.torches) addTorch(x, y, z, true);
    if (data.fires) for (const [x, y, z] of data.fires) addFire(x, y, z, true);
    if (typeof data.hp === 'number') G.hp = data.hp;
    // ⚔️ Надетое снаряжение тоже восстанавливаем
    if (data.gear) G.equip = { weapon: data.gear.weapon || null, armor: data.gear.armor || null };
    // 📚 Навыки и очки навыков
    if (data.skills) Object.assign(G.skills, data.skills);
    if (typeof data.sp === 'number') G.sp = data.sp;
    return true;
  } catch (e) { return false; } // сохранение битое — начнём заново
}
