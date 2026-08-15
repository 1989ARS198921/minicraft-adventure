// ============================================================
//  📋 ЗАДАНИЯ (квесты)
//  Модуль подписывается на события игры через шину 📮
//  и отмечает галочки. Выполнил все — получишь медаль!
// ============================================================

import { on, emit } from './bus.js';
import { sfx } from './audio.js';
import { showToast } from './ui.js';

// ============================================================
//  📜 ВСЕ КВЕСТЫ — 60+ заданий!
// ============================================================

export const QUESTS = [
  // ============================================================
  //  1. БАЗОВЫЕ КВЕСТЫ (обучение)
  // ============================================================
  { id: 'break1',  text: 'Сломай первый блок' },
  { id: 'place1',  text: 'Поставь первый блок' },
  { id: 'dig',     text: 'Выкопай траву' },
  { id: 'jump',    text: 'Подпрыгни' },
  { id: 'place10', text: 'Поставь 10 блоков', need: 10 },
  { id: 'fly',     text: 'Взлети! (двойной прыжок)' },
  { id: 'torch',   text: 'Поставь факел' },
  { id: 'night',   text: 'Дождись ночи' },
  { id: 'swim',    text: 'Искупайся в озере' },
  { id: 'cave',    text: 'Спустись под землю' },

  // ============================================================
  //  2. ДОБЫЧА РЕСУРСОВ
  // ============================================================
  { id: 'coal',     text: 'Добудь уголь в пещере' },
  { id: 'gold',     text: 'Найди золото' },
  { id: 'diamond',  text: 'Найди алмазы! 💎' },
  { id: 'collect_ore_50',  text: 'Собери 50 руды ⛏️', need: 50 },
  { id: 'collect_herbs_30', text: 'Собери 30 трав 🌿', need: 30 },
  { id: 'collect_flowers_20', text: 'Собери 20 цветов 🌸', need: 20 },
  { id: 'collect_mushrooms_20', text: 'Собери 20 грибов 🍄', need: 20 },

  // ============================================================
  //  3. ВЗАИМОДЕЙСТВИЕ С МИРОМ
  // ============================================================
  { id: 'apple',     text: 'Съешь яблоко 🍎' },
  { id: 'shop',      text: 'Купи товар в лавке Тихона 🏪' },
  { id: 'potion',    text: 'Выпей зелье Мерлина 🧪' },
  { id: 'fire',      text: 'Разведи костёр 🔥' },
  { id: 'fountain',  text: 'Искупайся в фонтане живой воды ⛲' },
  { id: 'sword',     text: 'Купи меч у Тихона 🗡️' },
  { id: 'bow',       text: 'Купи лук у эльфов 🏹' },
  { id: 'armor',     text: 'Надень броню 🛡️' },

  // ============================================================
  //  4. СКАЗОЧНЫЕ СУЩЕСТВА
  // ============================================================
  { id: 'unicorn',    text: 'Погладь единорога 🦄' },
  { id: 'dragon',     text: 'Увидеть дракона над горами 🐉' },
  { id: 'fox',        text: 'Покорми лису яблоком 🦊' },
  { id: 'rabbit',     text: 'Погладь зайчика 🐰' },
  { id: 'slime',      text: 'Пощекочи слизня у озера 👾' },
  { id: 'owl',        text: 'Найди сову в деревне 🦉' },
  { id: 'dragonGift', text: 'Получи подарок дракона 🎁' },
  { id: 'fairy',      text: 'Поймай ночную фею Искорку ✨' },

  // ============================================================
  //  5. ПОБЕДА НАД МОНСТРАМИ (обычные)
  // ============================================================
  { id: 'orcKill',     text: 'Победи орка! ⚔️' },
  { id: 'spiderKill',  text: 'Победи паука в лесу 🕷️' },
  { id: 'goblinKill',  text: 'Победи гоблина в лесу 😈' },
  { id: 'trollKill',   text: 'Победи тролля в горах 🧌' },
  { id: 'wolf_hunter', text: 'Победи 5 волков 🐺', need: 5 },
  { id: 'skeleton_killer', text: 'Победи 10 скелетов 💀', need: 10 },
  { id: 'ghost_hunter', text: 'Победи 5 призраков 👻', need: 5 },
  { id: 'slime_hunter', text: 'Победи 10 слизней 👾', need: 10 },
  { id: 'zombie_hunter', text: 'Победи 5 зомби 🧟', need: 5 },
  { id: 'bat_hunter', text: 'Победи 10 летучих мышей 🦇', need: 10 },

  // ============================================================
  //  6. ПОБЕДА НАД БОССАМИ
  // ============================================================
  { id: 'goblin_king_slayer', text: 'Победи Короля гоблинов 👑' },
  { id: 'spider_queen_slayer', text: 'Победи Паучиху 🕷️' },
  { id: 'ice_troll_slayer', text: 'Победи Ледяного тролля 🧊' },
  { id: 'necromancer_slayer', text: 'Победи Некроманта 💀' },
  { id: 'kraken_slayer', text: 'Победи Кракена 🐙' },
  { id: 'stone_golem_slayer', text: 'Победи Каменного голема 🗿' },
  { id: 'forest_giant_slayer', text: 'Победи Лесного великана 🌳' },
  { id: 'ice_dragon_slayer', text: 'Победи Ледяного дракона ❄️' },
  { id: 'fire_elemental_slayer', text: 'Победи Огненного элементаля 🔥' },
  { id: 'dark_knight_slayer', text: 'Победи Тёмного рыцаря ⚔️' },
  { id: 'all_bosses', text: 'Победи всех боссов! 🏆', need: 20 },

  // ============================================================
  //  7. ИССЛЕДОВАНИЕ МИРА
  // ============================================================
  { id: 'elfVillage', text: 'Найди деревню эльфов 🧝' },
  { id: 'orcVillage', text: 'Найди стойбище орков (осторожно!) 👹' },
  { id: 'find_forest_village', text: 'Найди лесную деревню 🌲' },
  { id: 'find_mountain_village', text: 'Найди горную деревню 🏔️' },
  { id: 'find_fishing_village', text: 'Найди рыбацкую деревню 🎣' },
  { id: 'find_magic_village', text: 'Найди магическую деревню 🔮' },
  { id: 'explore_all_villages', text: 'Посети все 7 деревень 🏘️' },
  { id: 'dungeon', text: 'Найди древнюю каменоломню 🕯️' },
  { id: 'kingKill', text: 'Победи Короля Гоблинов 👑' },

  // ============================================================
  //  8. НАВЫКИ И МАГИЯ
  // ============================================================
  { id: 'train',    text: 'Выучи навык у тренера 📚' },
  { id: 'master',   text: 'Стань мастером любого навыка 🎓' },
  { id: 'spell',    text: 'Выучи заклинание у Мерлина 🔮' },
  { id: 'fireHit',  text: 'Поджги монстра огненным шаром 🔥' },
  { id: 'healCast', text: 'Вылечись заклинанием 💚' },

  // ============================================================
  //  9. ДОПОЛНИТЕЛЬНЫЕ КВЕСТЫ (новые!)
  // ============================================================
  { id: 'bowHit',    text: 'Попади из лука в монстра 🎯' },
  { id: 'dragonHunt', text: 'Увидь охоту дракона 🐉🔥' },
  { id: 'elf_visit', text: 'Поговори с эльфийским мэром 🧝' },
  { id: 'dwarf_visit', text: 'Поговори с гномьим старейшиной ⛏️' },
  { id: 'mage_visit', text: 'Поговори с главой магов 🔮' }
];

// ============================================================
//  📊 СОСТОЯНИЕ КВЕСТОВ
// ============================================================

export const questState = {};
QUESTS.forEach(q => questState[q.id] = { count: 0, done: false });

let celebrated = false; // поздравляли ли за ВСЕ задания

const qList = () => document.getElementById('qList');

// ============================================================
//  🖥️ ОТОБРАЖЕНИЕ КВЕСТОВ
// ============================================================

export function renderQuests() {
  const list = qList();
  if (!list) return;
  
  list.innerHTML = QUESTS.map(q => {
    const st = questState[q.id];
    const progress = q.need ? ` (${Math.min(st.count, q.need)}/${q.need})` : '';
    return `<li class="${st.done ? 'done' : ''}">${st.done ? '✅' : '⬜'} ${q.text}${progress}</li>`;
  }).join('');
  
  const done = QUESTS.filter(q => questState[q.id].done).length;
  const title = document.getElementById('qTitle');
  if (title) title.textContent = `📋 Задания ${done}/${QUESTS.length} ▾`;
}

// ============================================================
//  📈 ПРОГРЕСС КВЕСТА
// ============================================================

export function questProgress(id, n = 1) {
  const q = QUESTS.find(q => q.id === id);
  const st = questState[id];
  if (!q || st.done) return;
  
  st.count += n;
  if (st.count >= (q.need || 1)) {
    st.done = true;
    showToast('✅ Задание: ' + q.text);
    sfx.quest();
    emit('xp', 1);
    
    if (QUESTS.every(q => questState[q.id].done) && !celebrated) {
      celebrated = true;
      setTimeout(() => showToast('🏆 Все задания выполнены! Ты настоящий герой!'), 2200);
    }
  }
  renderQuests();
  emit('dirty');
}

// ============================================================
//  📡 ПОДПИСКИ НА СОБЫТИЯ
// ============================================================

export function initQuests() {
  // ============================================================
  //  1. БЛОКИ И МИР
  // ============================================================
  
  on('blockBroken', type => {
    questProgress('break1');
    if (type === 'grass') questProgress('dig');
    if (type === 'coalOre') { questProgress('coal'); emit('xp', 1); }
    if (type === 'goldOre') { questProgress('gold'); emit('xp', 1); }
    if (type === 'diamondOre') { questProgress('diamond'); emit('xp', 1); }
    // Сбор ресурсов
    if (type === 'ore') questProgress('collect_ore_50');
    if (type === 'herb') questProgress('collect_herbs_30');
    if (type === 'flower') questProgress('collect_flowers_20');
    if (type === 'mushroom') questProgress('collect_mushrooms_20');
  });
  
  on('blockPlaced', () => {
    questProgress('place1');
    questProgress('place10');
  });
  
  on('jump',  () => questProgress('jump'));
  on('fly',   () => questProgress('fly'));
  on('torch', () => questProgress('torch'));
  on('night', () => questProgress('night'));
  on('swim',  () => questProgress('swim'));
  on('cave',  () => questProgress('cave'));
  on('eat',   () => questProgress('apple'));
  on('buy',   what => {
    questProgress('shop');
    if (typeof what === 'string' && what.startsWith('sword')) questProgress('sword');
    if (what === 'bow') questProgress('bow');
    if (what === 'spellFire' || what === 'spellHeal') questProgress('spell');
  });
  on('potion',() => questProgress('potion'));
  on('fire',  () => questProgress('fire'));
  on('fountain', () => questProgress('fountain'));
  
  // ============================================================
  //  2. СКАЗОЧНЫЕ СУЩЕСТВА
  // ============================================================
  
  on('pet',   () => questProgress('unicorn'));
  on('dragon',() => questProgress('dragon'));
  on('fox',   () => questProgress('fox'));
  on('rabbit',() => questProgress('rabbit'));
  on('slime', () => questProgress('slime'));
  on('owl',   () => questProgress('owl'));
  on('dragonGift', () => questProgress('dragonGift'));
  on('fairy', () => questProgress('fairy'));
  
  // ============================================================
  //  3. ПОБЕДА НАД МОНСТРАМИ (обычные)
  // ============================================================
  
  on('mobkill', kind => {
    if (kind === 'orc') questProgress('orcKill');
    if (kind === 'spider') questProgress('spiderKill');
    if (kind === 'goblin') questProgress('goblinKill');
    if (kind === 'troll') questProgress('trollKill');
    if (kind === 'wolf') questProgress('wolf_hunter');
    if (kind === 'skeleton') questProgress('skeleton_killer');
    if (kind === 'ghost') questProgress('ghost_hunter');
    if (kind === 'slime') questProgress('slime_hunter');
    if (kind === 'zombie') questProgress('zombie_hunter');
    if (kind === 'bat') questProgress('bat_hunter');
    if (kind === 'goblinKing') questProgress('kingKill');
  });
  
  // ============================================================
  //  4. ПОБЕДА НАД БОССАМИ
  // ============================================================
  
  on('bosskill', kind => {
    if (kind === 'goblin_king') questProgress('goblin_king_slayer');
    if (kind === 'spider_queen') questProgress('spider_queen_slayer');
    if (kind === 'ice_troll') questProgress('ice_troll_slayer');
    if (kind === 'necromancer') questProgress('necromancer_slayer');
    if (kind === 'kraken') questProgress('kraken_slayer');
    if (kind === 'stone_golem') questProgress('stone_golem_slayer');
    if (kind === 'forest_giant') questProgress('forest_giant_slayer');
    if (kind === 'ice_dragon') questProgress('ice_dragon_slayer');
    if (kind === 'fire_elemental') questProgress('fire_elemental_slayer');
    if (kind === 'dark_knight') questProgress('dark_knight_slayer');
    // Проверка на всех боссов
    checkAllBosses();
  });
  
  function checkAllBosses() {
    const bossQuests = [
      'goblin_king_slayer', 'spider_queen_slayer', 'ice_troll_slayer',
      'necromancer_slayer', 'kraken_slayer', 'stone_golem_slayer',
      'forest_giant_slayer', 'ice_dragon_slayer', 'fire_elemental_slayer',
      'dark_knight_slayer'
    ];
    const allDone = bossQuests.every(id => questState[id]?.done);
    if (allDone) questProgress('all_bosses');
  }
  
  // ============================================================
  //  5. ИССЛЕДОВАНИЕ МИРА
  // ============================================================
  
  on('visit', id => {
    if (id === 'elf') { questProgress('elfVillage'); questProgress('elf_visit'); }
    if (id === 'orc') questProgress('orcVillage');
    if (id === 'dwarf') questProgress('dwarf_visit');
    if (id === 'mage') questProgress('mage_visit');
    if (id === 'forest_village') questProgress('find_forest_village');
    if (id === 'mountain_village') questProgress('find_mountain_village');
    if (id === 'fishing_village') questProgress('find_fishing_village');
    if (id === 'magic_village') questProgress('find_magic_village');
    checkAllVillages();
  });
  
  function checkAllVillages() {
    const villageQuests = [
      'elfVillage', 'orcVillage', 'find_forest_village',
      'find_mountain_village', 'find_fishing_village', 'find_magic_village'
    ];
    const allDone = villageQuests.every(id => questState[id]?.done);
    if (allDone) questProgress('explore_all_villages');
  }
  
  on('dungeon', () => questProgress('dungeon'));
  // ============================================================
  //  6. СНАРЯЖЕНИЕ И НАВЫКИ
  // ============================================================
  
  on('bowHit', () => questProgress('bowHit'));
  on('equip', what => {
    if (what === 'armorLeather' || what === 'armorChain') questProgress('armor');
  });
  
  on('train', (id, rank) => {
    questProgress('train');
    if (rank >= 3) questProgress('master');
  });
  
  // ============================================================
  //  7. МАГИЯ
  // ============================================================
  
  on('fireHit', () => questProgress('fireHit'));
  on('cast', id => {
    if (id === 'heal') questProgress('healCast');
  });
  
  // ============================================================
  //  8. ДОПОЛНИТЕЛЬНЫЕ СОБЫТИЯ
  // ============================================================
  
  on('dragonHunt', () => questProgress('dragonHunt'));
  
  // ============================================================
  //  🖥️ ИНИЦИАЛИЗАЦИЯ UI
  // ============================================================
  
  const titleEl = document.getElementById('qTitle');
  if (titleEl) {
    titleEl.addEventListener('click', () => {
      document.getElementById('quests').classList.toggle('collapsed');
    });
  }
  
  // На телефоне экран маленький — стартуем со свёрнутым списком
  if (document.body.classList.contains('touch')) {
    const questsEl = document.getElementById('quests');
    if (questsEl) questsEl.classList.add('collapsed');
  }
  
  renderQuests();
}