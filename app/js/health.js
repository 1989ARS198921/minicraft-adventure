// ============================================================
//  ❤️ ЗДОРОВЬЕ — сердечки героя
//  Больно бывает от падения с высоты, от укусов монстров и если
//  долго сидеть под водой без воздуха. Лечат: яблоки, зелья,
//  отдых, тёплый костёр и ⛲ фонтан живой воды в деревне!
//  Если сердечки кончились — герой очнётся у фонтана.
// ============================================================

import { emit, on } from './bus.js';
import { sfx } from './audio.js';
import { showToast } from './ui.js';
import { blockAt, groundHeight } from './world.js';
import { FOUNTAIN, RESPAWN } from './village.js';
import { spawnParticles } from './particles.js';

let G = null;
const MAX_HP = 10;              // 10 половинок = 5 сердечек
let lastDamage = -99;           // когда последний раз было больно (для отдыха)
let airLeft = 4;                // запас воздуха под водой (секунды)
let regenAcc = 0, warmAcc = 0, fountAcc = 0; // накопители лечения

export function initHealth(gameContext) {
  G = gameContext;
  if (typeof G.hp !== 'number') G.hp = MAX_HP;
  // Игрок приземлился? Проверяем, не больно ли было
  on('landed', vy => {
    if (vy > -14) return; // мягкое приземление
    const dmg = vy < -26 ? 6 : vy < -20 ? 4 : 2;
    damage(dmg, '😵 Ой, больно упал!');
  });
  renderHearts();
}

// Отнять здоровье (с вспышкой и звуком)
export function damage(n, msg) {
  if (G.hp <= 0) return; // уже и так лежим
  G.hp = Math.max(0, G.hp - n);
  lastDamage = performance.now() / 1000;
  renderHearts();
  flashRed();
  if (msg) showToast(msg);
  sfx.no();
  if (G.hp <= 0) respawn();
}

// Полечить (яблоко, зелье, костёр)
export function heal(n) {
  if (G.hp >= MAX_HP) return false;
  G.hp = Math.min(MAX_HP, G.hp + n);
  renderHearts();
  return true;
}

// Съесть яблоко из рюкзака 🍎
export function eatApple() {
  if ((G.inv.apple || 0) <= 0) { showToast('🍎 Яблок нет! Сорви с дерева (ломай листву)'); sfx.no(); return; }
  if (G.hp >= MAX_HP) { showToast('😊 Я и так полон сил!'); return; }
  G.inv.apple--;
  heal(4);
  showToast('🍎 Ням-ням! +2 ❤️');
  sfx.quest();
  emit('eat');
  emit('dirty');
}

// Сердечки кончились — живая вода фонтана подхватывает героя
// и возвращает его в деревню, целым и невредимым! 💫
function respawn() {
  const p = G.player;
  p.x = RESPAWN.x; p.z = RESPAWN.z;
  p.feet = groundHeight(Math.floor(RESPAWN.x), Math.floor(RESPAWN.z)) + 0.5;
  p.vy = 0;
  G.hp = MAX_HP;
  renderHearts();
  // Волшебные брызги — живая вода встречает героя!
  for (let i = 0; i < 4; i++)
    spawnParticles(Math.floor(p.x), Math.floor(p.feet + 0.5 + i * 0.4), Math.floor(p.z), 'diamondOre');
  sfx.quest();
  showToast('⛲ Живая вода подхватила тебя! Ты очнулся у фонтана, целый и невредимый 💫');
}

// Каждый кадр: задыхаемся ли под водой? отдыхаем ли? греемся ли?
export function updateHealth(dt) {
  const p = G.player;
  // Голова под водой? Воздух тает — пора всплывать!
  const headUnder = blockAt(Math.floor(p.x), Math.floor(p.feet + 1.4), Math.floor(p.z)) === 'water';
  if (headUnder && !p.fly) {
    airLeft -= dt;
    if (airLeft <= 0) { damage(1, '🫧 Хвать воздуха! Всплывай!'); airLeft = 2; }
  } else airLeft = 4;

  // Тихий отдых: если 6 секунд никто не обижал — сердечко растёт
  if (G.hp > 0 && G.hp < MAX_HP && performance.now() / 1000 - lastDamage > 6) {
    regenAcc += dt;
    if (regenAcc >= 5) { regenAcc = 0; heal(1); }
  }
  // У костра ночью греемся быстрее (костёр сам «поглаживает»)
  if (G.warmByFire && G.hp < MAX_HP) {
    warmAcc += dt;
    if (warmAcc >= 2.5) { warmAcc = 0; heal(1); }
  }

  // ⛲ ФОНТАН ЖИВОЙ ВОДЫ: рядом с ним сердечки растут сами!
  const fd = Math.hypot(p.x - FOUNTAIN.x, p.z - FOUNTAIN.z);
  if (fd < 4 && Math.abs(p.feet - FOUNTAIN.y) < 4) {
    fountAcc += dt;
    if (fountAcc >= 0.7) { // брызги живой воды — искорки над чашей
      fountAcc = 0;
      spawnParticles(Math.floor(FOUNTAIN.x), Math.floor(FOUNTAIN.y + 1),
        Math.floor(FOUNTAIN.z), 'diamondOre');
    }
    if (G.hp < MAX_HP) {
      warmAcc += dt; // у фонтана лечимся вдвое быстрее
      if (warmAcc >= 3) { warmAcc = 0; heal(1); }
    }
    // Купание = почти в центре чаши (мимо прошёл — не считается!)
    if (fd < 1.8) emit('fountain');
  }

  // Волшебные зелья тикают: скорость и прыжки действуют недолго
  if (G.fx.speed > 0) G.fx.speed = Math.max(0, G.fx.speed - dt);
  if (G.fx.jump > 0) G.fx.jump = Math.max(0, G.fx.jump - dt);
  renderFx();
}

// ---------- РИСУЕМ СЕРДЕЧКИ ----------
export function renderHearts() {
  const el = document.getElementById('hearts');
  if (!el) return;
  let s = '';
  for (let i = 0; i < MAX_HP / 2; i++) {
    const left = G.hp - i * 2;
    s += left >= 2 ? '❤️' : left === 1 ? '💔' : '🖤';
  }
  el.textContent = s;
  // Трясём, когда больно!
  el.classList.remove('shake');
  void el.offsetWidth; // перезапуск анимации
  if (G.hp < MAX_HP) el.classList.add('shake');
}

// Значки действующих зелий рядом с сердечками
function renderFx() {
  const el = document.getElementById('fxBadge');
  if (!el) return;
  const icons = (G.fx.speed > 0 ? '⚡' : '') + (G.fx.jump > 0 ? '🦘' : '');
  if (el.textContent !== icons) el.textContent = icons;
  el.style.display = icons ? 'block' : 'none';
}

// Красная вспышка по краям экрана — «ай!»
let flashTimer = null;
function flashRed() {
  const el = document.getElementById('hurtFlash');
  if (!el) return;
  el.style.opacity = 0.45;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.style.opacity = 0, 250);
}
