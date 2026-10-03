// ============================================================
//  📚 НАВЫКИ 2.0 — адаптивная, но простая РПГ-система!
//  Два пути роста, и они дружат:
//  1) ТРЕНЕРЫ (как раньше): Боря учит мечу, Лея — луку,
//     Мерлин — мудрости. Платишь очки навыков за уровни.
//  2) ДЕЛОМ: чем чаще пользуешься — тем сильнее становишься!
//     Бьёшь мечом — растёт Меч, стреляешь — растёт Лук,
//     получаешь удары — растёт Защита, лечишься — Живучесть,
//     копаешь камень и руду — Шахтёр, получаешь опыт — Мудрость.
//  У каждого навыка три ступени: Ученик → Эксперт → Мастер.
// ============================================================

import { emit, on } from './bus.js';
import { showToast, updateInvUI } from './ui.js';

// Какие навыки бывают и что они дают
export const SKILLS = {
  sword:    { icon: '🗡️', name: 'Меч',
              desc: '+1 к урону мечом за ступень' },
  bow:      { icon: '🏹', name: 'Лук',
              desc: '+1 к урону стрелой за ступень' },
  learning: { icon: '📖', name: 'Мудрость',
              desc: 'больше опыта, +4 маны 💧 и сильнее огненный шар за ступень!' },
  defense:  { icon: '🛡️', name: 'Защита',
              desc: '-1 к урону от монстров за ступень (растёт, когда тебя бьют)' },
  vitality: { icon: '❤️', name: 'Живучесть',
              desc: '+1 сердце за ступень (растёт от еды, зелий и побед)' },
  mining:   { icon: '⛏️', name: 'Шахтёр',
              desc: 'шанс +25% за ступень добыть двойную руду!' }
};

// Ступени мастерства (0 — ещё не учил)
export const RANKS = ['Новичок', 'Ученик', 'Эксперт', 'Мастер'];

// Сколько «опыта дела» нужно для каждой ступени (накопительно)
const XP_NEED = [0, 15, 45, 100];

// Удобный доступ к навыкам (создаём табличку, если её ещё нет)
export function skillsOf(G) {
  if (!G.skills) G.skills = { sword: 0, bow: 0, learning: 0, defense: 0, vitality: 0, mining: 0 };
  return G.skills;
}

// «Опыт дела» каждого навыка
function xpOf(G) {
  if (!G.skillXP) G.skillXP = { sword: 0, bow: 0, learning: 0, defense: 0, vitality: 0, mining: 0 };
  return G.skillXP;
}

// Ступень навыка у героя (0..3)
export function skillRank(G, id) {
  return skillsOf(G)[id] || 0;
}

// Сколько очков стоит следующая ступень? (0 = уже мастер)
// Ученик — 1 очко, Эксперт — 2, Мастер — 3
export function costNext(G, id) {
  const r = skillRank(G, id);
  return r >= 3 ? 0 : r + 1;
}

// 🎓 УЧИТЬСЯ! Тратим очки навыков, растёт ступень.
// Возвращает текст для всплывающего сообщения (или null, если нельзя).
export function train(G, id) {
  const sk = SKILLS[id];
  const cost = costNext(G, id);
  if (!cost) return `🎓 ${sk.name}: ты уже МАСТЕР!`;
  if ((G.sp || 0) < cost) return null; // очков не хватает
  G.sp -= cost;
  const rank = skillsOf(G)[id] + 1;
  skillsOf(G)[id] = rank;
  emit('train', id, rank); // квесты слушают это событие
  emit('dirty');
  return `${sk.icon} ${sk.name}: теперь ты — ${RANKS[rank]}! Осталось очков: ${G.sp}`;
}

// 💪 РОСТ ДЕЛОМ: капля опыта за поступок. Набрал — ступень выросла!
function gainSkillXP(G, id, n) {
  const rank = skillRank(G, id);
  if (rank >= 3) return; // мастеру некуда расти
  const xp = xpOf(G);
  xp[id] = (xp[id] || 0) + n;
  if (xp[id] >= XP_NEED[rank + 1]) {
    skillsOf(G)[id] = rank + 1;
    const sk = SKILLS[id];
    showToast(`${sk.icon} ${sk.name} вырос сам собой: теперь ты — ${RANKS[rank + 1]}!`);
    emit('train', id, rank + 1); // квест «Стань мастером» тоже засчитается
    emit('dirty');
  }
}

// Подписки на события игры (вызывается один раз из main.js)
export function initSkills(G) {
  // 🗡️ Меч растёт от ударов по монстрам
  on('mobhit', () => gainSkillXP(G, 'sword', 2));
  // 🏹 Лук — от попаданий из лука
  on('bowHit', () => gainSkillXP(G, 'bow', 3));
  // 🛡️ Защита — от пережитых ударов (чем больнее, тем быстрее учишься)
  on('hurt', n => gainSkillXP(G, 'defense', Math.min(4, n)));
  // ❤️ Живучесть — от еды, зелий и побед
  on('eat', () => gainSkillXP(G, 'vitality', 3));
  on('potion', () => gainSkillXP(G, 'vitality', 3));
  on('mobkill', () => gainSkillXP(G, 'vitality', 1));
  // 📖 Мудрость — от любого опыта
  on('xp', () => gainSkillXP(G, 'learning', 1));
  // ⛏️ Шахтёр — от камня и руды; мастерство даёт двойную добычу!
  on('blockBroken', t => {
    const isOre = t === 'coalOre' || t === 'goldOre' || t === 'diamondOre' || t === 'crystal';
    if (t === 'stone' || isOre) gainSkillXP(G, 'mining', 1);
    const rank = skillRank(G, 'mining');
    if (isOre && rank > 0 && Math.random() < 0.25 * rank) {
      G.inv[t] = (G.inv[t] || 0) + 1;
      showToast('⛏️ Рука набита: добыта двойная руда!');
      updateInvUI();
      emit('dirty');
    }
  });
}
