// ============================================================
//  🌟 ГЕЙМПЛЕЙ: то, что делает набор механик — ИГРОЙ!
//  🔮 Печати силы из логов (сквозная цель «Легенда о герое»)
//  🏅 Достижения (живут отдельно от мира — не сгорают при новом мире)
//  🛏️ Кровать = точка возрождения дома
//  📦 Домашний сундук = хранилище добра
// ============================================================

import { on, emit } from './bus.js';
import { showToast, updateInvUI, NAMES, ICONS } from './ui.js';
import { sfx } from './audio.js';
import { questProgress } from './quests.js';
import { removeBlockAt } from './world.js';
import { CONFIG } from './config.js';

let G = null;

// ============================================================
//  🏅 ДОСТИЖЕНИЯ
// ============================================================
export const ACHIEVEMENTS = [
  { id: 'firstBlock', icon: '👣', name: 'Первые шаги',      desc: 'Сломай первый блок' },
  { id: 'miner100',   icon: '⛏️', name: 'Старший шахтёр',  desc: 'Сломай 100 блоков' },
  { id: 'builder50',  icon: '🧱', name: 'Строитель',        desc: 'Поставь 50 блоков' },
  { id: 'firstKill',  icon: '⚔️', name: 'Первая победа',    desc: 'Победи монстра' },
  { id: 'hunter25',   icon: '🏹', name: 'Охотник',          desc: 'Победи 25 монстров' },
  { id: 'seal1',      icon: '🔮', name: 'Первая печать',    desc: 'Зачисти логово монстров' },
  { id: 'seal6',      icon: '🔮', name: 'Владыка печатей',  desc: 'Собери все 6 печатей силы' },
  { id: 'legend',     icon: '🌟', name: 'Легенда мира',     desc: 'Предъяви печати Кащею' },
  { id: 'kaschey',    icon: '💀', name: 'Конец Бессмертного', desc: 'Победи Кащея в финальной битве' },
  { id: 'diamond',    icon: '💎', name: 'Алмаз!',           desc: 'Найди алмазную руду' },
  { id: 'rich',       icon: '🪙', name: 'Богач',            desc: 'Собери 10 золотых руд разом' },
  { id: 'unicorn',    icon: '🦄', name: 'Друг единорога',   desc: 'Погладь единорога' },
  { id: 'dragonT',    icon: '🐉', name: 'Укротитель',       desc: 'Поздоровайся с драконом' },
  { id: 'fire',       icon: '🔥', name: 'Кочегар',          desc: 'Разведи костёр' },
  { id: 'pilot',      icon: '✈️', name: 'Лётчик',           desc: 'Научись летать' },
  { id: 'home',       icon: '🛏️', name: 'Дом, милый дом',   desc: 'Установи кровать' },
  { id: 'night',      icon: '🌙', name: 'Ночной житель',    desc: 'Встреть ночь' },
  { id: 'shopper',    icon: '🛒', name: 'Покупатель',       desc: 'Купи товар в лавке' },
  { id: 'quest10',    icon: '📋', name: 'Исполнитель',      desc: 'Выполни 10 заданий' },
];

const ACH_KEY = CONFIG.ACH_KEY; // достижения — навсегда, даже в новом мире!
const unlocked = new Set();
try { JSON.parse(localStorage.getItem(ACH_KEY) || '[]').forEach(id => unlocked.add(id)); } catch (e) {}

export function unlockAch(id) {
  if (unlocked.has(id)) return;
  const a = ACHIEVEMENTS.find(a => a.id === id);
  if (!a) return;
  unlocked.add(id);
  try { localStorage.setItem(ACH_KEY, JSON.stringify([...unlocked])); } catch (e) {}
  showToast(`🏅 Достижение: ${a.icon} ${a.name}!`);
  sfx.quest();
  renderAchPanel();
}

// Панель достижений в главном меню
export function renderAchPanel() {
  const el = document.getElementById('achList');
  if (!el) return;
  el.innerHTML = ACHIEVEMENTS.map(a => {
    const yes = unlocked.has(a.id);
    return `<div class="achItem ${yes ? 'on' : ''}">${yes ? a.icon : '❔'} <b>${a.name}</b><br><small>${a.desc}</small></div>`;
  }).join('');
  const t = document.getElementById('achTitle');
  if (t) t.textContent = `🏅 Достижения ${unlocked.size}/${ACHIEVEMENTS.length}`;
}

// ============================================================
//  🛏️ КРОВАТЬ: предмет из лавки. Применил — это точка дома!
//  Не тратится: кровать ставится «навсегда», пока не выберешь новое место.
// ============================================================
export function useBed() {
  const p = G.player;
  G.respawnPoint = { x: p.x, z: p.z };
  showToast('🛏️ Это теперь твой дом! Очнёшься здесь, если монстры победят.');
  sfx.quest();
  unlockAch('home');
  emit('dirty');
}

// ============================================================
//  📦 ДОМАШНИЙ СУНДУК: свой поставленный сундук — хранилище.
//  Тап по своему сундуку — открыть, Shift+клик — сломать.
//  Хранилище общее для всех твоих сундуков (домашний склад)!
// ============================================================
let chestPos = null; // какой сундук открыт (чтобы можно было забрать)

export function openStorage(x, y, z) {
  chestPos = { x, y, z };
  renderStorage();
  document.getElementById('storage').style.display = 'flex';
}
export function closeStorage() {
  const st = document.getElementById('storage');
  if (st) st.style.display = 'none';
  chestPos = null;
}

function stCell(type, n, side) {
  return `<div class="stItem" data-side="${side}" data-type="${type}">${ICONS[type] || '📦'} ${NAMES[type] || type} ×${n}</div>`;
}

export function renderStorage() {
  const bp = [], hm = [];
  for (const [t, n] of Object.entries(G.inv)) if (n > 0 && n !== Infinity) bp.push(stCell(t, n, 'bp'));
  for (const [t, n] of Object.entries(G.homeInv)) if (n > 0) hm.push(stCell(t, n, 'hm'));
  document.getElementById('stBp').innerHTML =
    '<div class="stHead">🎒 Рюкзак — тап: в сундук</div>' + (bp.join('') || '<div class="stEmpty">пусто</div>');
  document.getElementById('stHome').innerHTML =
    '<div class="stHead">📦 Сундук — тап: в рюкзак</div>' + (hm.join('') || '<div class="stEmpty">пусто</div>');
}

function onStorageClick(e) {
  const it = e.target.closest('.stItem');
  if (it) { // перекладываем всю стопку туда-сюда
    const t = it.dataset.type;
    if (it.dataset.side === 'bp') {
      if ((G.inv[t] || 0) > 0 && G.inv[t] !== Infinity) {
        G.homeInv[t] = (G.homeInv[t] || 0) + G.inv[t];
        G.inv[t] = 0;
      }
    } else {
      G.inv[t] = (G.inv[t] || 0) + (G.homeInv[t] || 0);
      G.homeInv[t] = 0;
    }
    updateInvUI(); renderStorage(); emit('dirty');
    return;
  }
  if (e.target.closest('#stTake') && chestPos) { // забрать сундук себе в рюкзак
    removeBlockAt(chestPos.x, chestPos.y, chestPos.z);
    G.inv.chest = (G.inv.chest || 0) + 1;
    updateInvUI(); emit('dirty');
    showToast('📦 Сундук у тебя. Вещи из склада никуда не делись!');
    closeStorage();
    return;
  }
  if (e.target.closest('#stClose') || !e.target.closest('#storageWindow')) closeStorage();
}

// ============================================================
//  🚀 ИНИЦИАЛИЗАЦИЯ: подписки на события мира
// ============================================================
export function initGameplay(gameContext) {
  G = gameContext;
  if (!G.homeInv) G.homeInv = {};
  if (G.respawnPoint === undefined) G.respawnPoint = null;

  // Кнопка 🏅 в главном меню
  const btn = document.getElementById('btnAch');
  if (btn) btn.addEventListener('click', e => {
    e.stopPropagation(); btn.blur();
    const p = document.getElementById('achPanel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
    renderAchPanel();
  });
  renderAchPanel();

  const st = document.getElementById('storage');
  if (st) st.addEventListener('click', onStorageClick);

  // --- счётчики для достижений ---
  let broken = 0, placed = 0, kills = 0, questsDone = 0;
  const seals = new Set();

  on('blockBroken', t => {
    broken++;
    if (broken === 1) unlockAch('firstBlock');
    if (broken === 100) unlockAch('miner100');
    if (t === 'diamondOre') unlockAch('diamond');
    if ((G.inv.goldOre || 0) >= 10) unlockAch('rich');
  });
  on('blockPlaced', () => { placed++; if (placed === 50) unlockAch('builder50'); });
  on('mobkill', () => { kills++; if (kills === 1) unlockAch('firstKill'); if (kills === 25) unlockAch('hunter25'); });
  on('bosskill', kind => { if (kind === 'kaschey') unlockAch('kaschey'); }); // 💀 финал
  on('pet', () => unlockAch('unicorn'));
  on('dragon', () => unlockAch('dragonT'));
  on('fire', () => unlockAch('fire'));
  on('questDone', id => {
    questsDone++;
    if (questsDone === 10) unlockAch('quest10');
    if (id === 'fly') unlockAch('pilot');
    if (id === 'night') unlockAch('night');
    if (id === 'shop') unlockAch('shopper');
    if (id === 'legend_face') unlockAch('legend');
  });

  // 🔮 ПЕЧАТИ СИЛЫ: зачистил логово — получи печать и богатый лут!
  on('lairCleared', id => {
    if (seals.has(id)) return; // логово уже громили
    seals.add(id);
    G.inv.seal = (G.inv.seal || 0) + 1;
    G.inv.goldOre = (G.inv.goldOre || 0) + 4;
    G.inv.diamondOre = (G.inv.diamondOre || 0) + 2;
    updateInvUI();
    showToast(`🔮 Печать силы ${seals.size}/6! +4 золота, +2 алмаза 💎`);
    questProgress('legend_seals');
    unlockAch('seal1');
    if (seals.size >= 6) unlockAch('seal6');
    emit('dirty');
  });
}
