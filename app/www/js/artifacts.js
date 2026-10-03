// ============================================================
//  ✨ АРТЕФАКТЫ — волшебные вещицы с постоянными чудесами!
//  Артефакты живут в рюкзаке (как обычные предметы) и работают
//  сами, пока лежат там. Добыча: сундуки квестовых локаций,
//  сундуки на парящих островах и победы над боссами!
// ============================================================

import { emit, on } from './bus.js';
import { showToast, updateInvUI } from './ui.js';
import { heal } from './health.js';

// Каталог артефактов: значок, имя и что чудит
export const ARTIFACTS = {
  artiVampFang:    { icon: '🦷', name: 'Клык вампира',
                     desc: 'каждая победа над монстром лечит +1 ❤️' },
  artiSunIdol:     { icon: '☀️', name: 'Идол солнца',
                     desc: 'твои удары по монстрам сильнее на +1' },
  artiDragonHeart: { icon: '💗', name: 'Сердце дракона',
                     desc: 'само лечит +1 ❤️ каждые 8 секунд' },
  artiWindBoots:   { icon: '👢', name: 'Сапоги ветра',
                     desc: 'бег быстрее на треть' },
  artiLifeRing:    { icon: '💍', name: 'Кольцо жизни',
                     desc: '+2 сердца к запасу здоровья' },
  artiShadowCloak: { icon: '🌫️', name: 'Плащ теней',
                     desc: 'монстры замечают тебя вдвое позже' },
  artiGolemCore:   { icon: '🗿', name: 'Ядро голема',
                     desc: '+2 к защите от ударов' },
  artiPhoenix:     { icon: '🪶', name: 'Перо феникса',
                     desc: 'раз в 2 минуты спасает от смертельного удара' },
  artiFrostShard:  { icon: '❄️', name: 'Осколок мерзлоты',
                     desc: '+3 к урону меча' },
  artiSeaPearl:    { icon: '🫧', name: 'Жемчужина глубин',
                     desc: 'можно дышать под водой' },
  artiCloudFeather:{ icon: '🎐', name: 'Облачное перо',
                     desc: 'падения не ранят и прыжки выше' }
};

// Какой босс какой артефакт роняет
export const BOSS_ARTIFACTS = {
  ice_dragon: 'artiDragonHeart',
  kraken: 'artiSeaPearl',
  dark_knight: 'artiShadowCloak',
  necromancer: 'artiPhoenix',
  stone_golem: 'artiGolemCore',
  ice_troll: 'artiFrostShard',
  fire_elemental: 'artiSunIdol',
  spider_queen: 'artiWindBoots',
  forest_giant: 'artiLifeRing'
  // goblin_king — особый: даёт +2 очка навыков (в mobs.js)
};

// Есть ли артефакт в рюкзаке?
export function hasArtifact(G, id) {
  return !!(G && G.inv && G.inv[id] > 0);
}

// 🎁 Вручить артефакт герою
export function giveArtifact(G, id) {
  const a = ARTIFACTS[id];
  if (!a) return;
  const first = !(G.inv[id] > 0);
  G.inv[id] = (G.inv[id] || 0) + 1;
  updateInvUI();
  showToast(`${a.icon} АРТЕФАКТ: ${a.name}! ${a.desc}`);
  emit('artifact', id);   // квесты слушают
  if (first) emit('artifactFirst', id);
  emit('dirty');
}

// Подписки и таймеры (вызывается один раз из main.js)
let G = null, heartAcc = 0;

export function initArtifacts(gameContext) {
  G = gameContext;

  // 🦷 Клык вампира: победа лечит
  on('mobkill', () => {
    if (hasArtifact(G, 'artiVampFang') && G.hp > 0) heal(1);
  });
}

// Каждый кадр (из main.js): сердце дракона тикает
export function updateArtifacts(dt) {
  if (hasArtifact(G, 'artiDragonHeart') && G.hp > 0) {
    heartAcc += dt;
    if (heartAcc >= 8) { heartAcc = 0; heal(1); }
  }
}

// 🪶 Перо феникса: шанс пережить смертельный удар (раз в 2 минуты)
let phoenixReadyAt = 0;
export function tryPhoenixSave(G2) {
  if (!hasArtifact(G2, 'artiPhoenix')) return false;
  const now = performance.now() / 1000;
  if (now < phoenixReadyAt) return false;
  phoenixReadyAt = now + 120;
  showToast('🪶 Перо феникса вспыхнуло — ты выжил!');
  emit('dirty');
  return true;
}
