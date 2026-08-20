// ============================================================
//  🏪 МАГАЗИН И ЗЕЛЬЯ
//  У купца Тихона — товары за уголь и золото.
//  У волшебника Мерлина — зелья за цветы и грибы.
//  Окошко одно на двоих: что продают — то и показываем.
// ============================================================

import { emit } from './bus.js';
import { sfx } from './audio.js';
import { showToast, updateInvUI, renderBackpackIfOpen, NAMES } from './ui.js';
import { heal } from './health.js';

let G = null;
export function initShop(gameContext) {
  G = gameContext;
  // Тап мимо окошка — закрыть лавку
  document.getElementById('shop').addEventListener('click', e => {
    if (!e.target.closest('#shopWindow')) closeShop();
  });
}

// Что продаёт купец Тихон (платим добытыми рудами!)
export const SHOP_ITEMS = [
  { icon: '🍎', give: 'apple',  n: 2, cost: { coalOre: 1 }, desc: 'Вкусные! Лечат +2 ❤️' },
  { icon: '🔥', give: 'matches', n: 3, cost: { coalOre: 1 }, desc: 'Чтобы разводить костёр' },
  { icon: '🧱', give: 'brick',  n: 5, cost: { goldOre: 1 }, desc: 'Красивые кирпичи для дома' },
  { icon: '🪟', give: 'glass',  n: 4, cost: { goldOre: 1 }, desc: 'Стёклышки для окон' },
  // ⚔️ Оружейная полка: мечи от простого к легендарному!
  { icon: '🗡️', give: 'swordWood',    n: 1, cost: { coalOre: 2 }, desc: 'Первый меч героя. Урон 2' },
  { icon: '⚔️', give: 'swordStone',   n: 1, cost: { goldOre: 2 }, desc: 'Крепкий каменный. Урон 3' },
  { icon: '⚔️', give: 'swordGold',    n: 1, cost: { goldOre: 4 }, desc: 'Сияющий золотой. Урон 4' },
  { icon: '💎', give: 'swordDiamond', n: 1, cost: { diamondOre: 2 }, desc: 'Легендарный! Урон 5' },
  // 🛡️ Броня: монстры бьют слабее!
  { icon: '🧥', give: 'armorLeather', n: 1, cost: { coalOre: 3 }, desc: 'Удары слабее на 1' },
  { icon: '🛡️', give: 'armorChain',   n: 1, cost: { goldOre: 2, diamondOre: 1 }, desc: 'Удары слабее на 2!' }
];

// 🏹 Мастерская эльфов: лук и стрелы (платим цветами и золотом)
export const ELF_ITEMS = [
  { icon: '🏹', give: 'bow',    n: 1, cost: { flower: 4, goldOre: 1 }, desc: 'Бей монстров издалека!' },
  { icon: '➶', give: 'arrows', n: 8, cost: { coalOre: 1 }, desc: 'Восемь острых стрел' },
  { icon: '🍎', give: 'apple', n: 3, cost: { flower: 2 }, desc: 'Эльфийские, сладкие! Лечат +2 ❤️' }
];

// Что варит волшебник Мерлин (платим цветами и грибами!)
// 📜 Свитки (once: правда) учат заклинания — покупаются один раз!
export const WIZARD_ITEMS = [
  { icon: '🧪', give: 'potionHealth', n: 1, cost: { flower: 3 }, desc: 'Вылечивает +2 ❤️' },
  { icon: '⚡', give: 'potionSpeed',  n: 1, cost: { mushroom: 2 }, desc: 'Бегаешь быстрее минуту!' },
  { icon: '🦘', give: 'potionJump',   n: 1, cost: { flower: 2, mushroom: 1 }, desc: 'Прыгаешь выше минуту!' },
  { icon: '📜', give: 'spellFire', n: 1, once: true, cost: { goldOre: 2, flower: 3 },
    desc: '🔮 Заклинание: огненный шар! Жжёт монстров. 3 маны 💧' },
  { icon: '📜', give: 'spellHeal', n: 1, once: true, cost: { flower: 2, mushroom: 2 },
    desc: '🔮 Заклинание: лечение +2 ❤️. 4 маны 💧' }
];

// Хватает ли добра в рюкзаке на покупку?
function canAfford(cost) {
  return Object.entries(cost).every(([t, n]) => (G.inv[t] || 0) >= n);
}

// Цена словами: «1 × Уголь + 2 × Цветок»
function costText(cost) {
  return Object.entries(cost).map(([t, n]) => `${n} × ${NAMES[t].toLowerCase()}`).join(' + ');
}

// Открыть окошко магазина: заголовок и список товаров
export function openShop(title, items) {
  document.getElementById('shopTitle').textContent = title;
  renderShopItems(items);
  document.getElementById('shop').style.display = 'flex';
}

function renderShopItems(items) {
  const list = document.getElementById('shopItems');
  list.innerHTML = '';
  for (const it of items) {
    // 📜 Свитки-заклинания (once) покупаются один раз — дальше «Выучено»
    const known = it.once && (G.inv[it.give] || 0) > 0;
    const ok = canAfford(it.cost) && !known;
    const row = document.createElement('div');
    row.className = 'shopRow';
    row.innerHTML = `
      <div class="shopIcon">${it.icon}</div>
      <div class="shopInfo">
        <b>${NAMES[it.give]} ×${it.n}</b>
        <div class="shopDesc">${it.desc}</div>
        <div class="shopCost">Цена: ${costText(it.cost)}</div>
      </div>
      <button class="shopBuy" ${ok ? '' : 'disabled'}>${known ? 'Выучено ✓' : 'Купить'}</button>`;
    row.querySelector('button').onclick = () => {
      if (known) return; // уже выучено — не тратим добро!
      // Оплата: забираем цену, выдаём товар
      for (const [t, n] of Object.entries(it.cost)) G.inv[t] -= n;
      G.inv[it.give] = (G.inv[it.give] || 0) + it.n;
      updateInvUI();
      renderBackpackIfOpen();
      showToast(`${it.icon} Куплено: ${NAMES[it.give]} ×${it.n}!`);
      sfx.quest();
      emit('xp', 1);   // опыт за покупку
      emit('buy', it.give); // квесты «Сходи в магазин» и «Купи меч»
      emit('dirty');
      renderShopItems(items); // перерисуем: вдруг что-то стало не по карману
    };
    list.appendChild(row);
  }
}

export function closeShop() {
  document.getElementById('shop').style.display = 'none';
}

// ---------- 🧪 ВЫПИТЬ ЗЕЛЬЕ (тап по зелью в рюкзаке) ----------
export function drinkPotion(type) {
  if ((G.inv[type] || 0) <= 0) return;
  if (type === 'potionHealth') {
    if (!heal(4)) { showToast('😊 Здоровье полное — прибереги зелье!'); return; }
    showToast('🧪 Ах! Здоровье +2 ❤️');
  } else if (type === 'potionSpeed') {
    G.fx.speed = 60; // минута быстрого бега
    showToast('⚡ Ноги сами бегут! Скорость на минуту');
  } else if (type === 'potionJump') {
    G.fx.jump = 60;  // минута высоких прыжков
    showToast('🦘 Боинг! Прыжки выше на минуту');
  }
  G.inv[type]--;
  updateInvUI();
  renderBackpackIfOpen();
  sfx.quest();
  emit('potion'); // квест «Выпей зелье»
  emit('dirty');
}
