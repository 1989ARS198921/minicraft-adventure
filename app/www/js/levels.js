// ============================================================
//  ⭐ ОПЫТ И УРОВНИ (мини-RPG!)
//  Опыт дают за задания, добычу руд и сделки с жителями.
//  Каждые 5 XP — новый уровень. Бейдж уровня — справа вверху.
// ============================================================

import { on, emit } from './bus.js';
import { showToast } from './ui.js';
import { sfx } from './audio.js';
import { skillRank } from './skills.js';

let G = null;
let badge;

export function initLevels(gameContext) {
  G = gameContext;
  badge = document.getElementById('lvlBadge');
  renderBadge();
  // Шина сообщает: «игрок получил опыт!»
  on('xp', n => {
    // 📖 Мудрость Мерлина: +50% опыта за каждую ступень навыка!
    n += Math.round(n * 0.5 * skillRank(G, 'learning'));
    G.xp += n;
    const lvl = Math.floor(G.xp / 5) + 1;
    if (lvl > G.level) { // 🎉 новый уровень! +1 очко навыков
      G.level = lvl;
      G.sp = (G.sp || 0) + 1;
      showToast(`⭐ Новый уровень: ${lvl}! +1 очко навыков 📚 — ищи тренера!`);
      sfx.quest();
    }
    renderBadge();
    emit('dirty');
  });
}

export function renderBadge() {
  badge.textContent = `⭐ Ур. ${G.level} · ${G.xp} XP` +
    (G.sp ? ` · 📚 ${G.sp}` : ''); // очки навыков видно сразу!
}
