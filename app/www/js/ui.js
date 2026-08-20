// ============================================================
//  🖼️ ИНТЕРФЕЙС: всплывающие сообщения и инвентарь
// ============================================================

import { PLACEABLE, COLORS } from './config.js';
import { EQUIPPABLE, equipItem, isEquipped, gear } from './equip.js';

// Подписи и трофеи для рюкзака (и для диалогов с жителями!)
export const NAMES = {
  dirt: 'Земля', planks: 'Доски', stone: 'Камень', brick: 'Кирпич', sand: 'Песок',
  glass: 'Стекло', leaf: 'Листва', stair: 'Ступенька', door: 'Дверь', torch: 'Факел',
  coalOre: 'Уголь', goldOre: 'Золото', diamondOre: 'Алмазы',
  apple: 'Яблоко', firewood: 'Дрова', matches: 'Спички',
  flower: 'Цветок', mushroom: 'Гриб',
  potionHealth: 'Зелье здоровья', potionSpeed: 'Зелье скорости', potionJump: 'Зелье прыжков',
  sword: 'Меч',
  // ⚔️ Этап 1: снаряжение героя (как в «Мече и Магии»!)
  swordWood: 'Деревянный меч', swordStone: 'Каменный меч',
  swordGold: 'Золотой меч', swordDiamond: 'Алмазный меч',
  bow: 'Лук', arrows: 'Стрелы',
  armorLeather: 'Кожаная броня', armorChain: 'Кольчуга',
  // 🔮 Этап 3: свитки заклинаний (выученные живут в кнопках 🔮 справа)
  spellFire: 'Свиток огненного шара', spellHeal: 'Свиток лечения'
};
const TROPHIES = ['coalOre', 'goldOre', 'diamondOre']; // добытые руды — гордость!
// Всякое в рюкзаке: еда, припасы для костра, ингредиенты, зелья и снаряжение
const GOODIES = ['apple', 'firewood', 'matches', 'flower', 'mushroom',
                 'potionHealth', 'potionSpeed', 'potionJump', 'sword',
                 'swordWood', 'swordStone', 'swordGold', 'swordDiamond',
                 'bow', 'arrows', 'armorLeather', 'armorChain'];
const ICONS = { // у предметов вместо цвета — весёлый значок
  apple: '🍎', firewood: '🪵', matches: '🔥', flower: '🌸', mushroom: '🍄',
  potionHealth: '🧪', potionSpeed: '⚡', potionJump: '🦘', sword: '🗡️',
  swordWood: '🗡️', swordStone: '🗡️', swordGold: '⚔️', swordDiamond: '⚔️',
  bow: '🏹', arrows: '➶', armorLeather: '🦺', armorChain: '🛡️'
};

let G = null;
export function initUI(gameContext) { G = gameContext; }

// Всплывающее сообщение сверху экрана (награды, подсказки)
let toastTimer = null;
export function showToast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.style.opacity = 1;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.style.opacity = 0, 2000);
}

// Выбрать слот инвентаря и подсветить его
export function selectSlot(i) {
  G.slot = i;
  // Взяли блок в руки — оружие убираем (нельзя махать мечом и ставить блоки разом)
  if (G.equip) G.equip.weapon = null;
  for (let s = 0; s < PLACEABLE.length; s++)
    document.getElementById('slot' + s).classList.toggle('active', s === i);
}

// Обновить счётчики блоков в слотах: число или ∞.
// Пустой слот приглушаем — видно, что блоки кончились!
export function updateInvUI() {
  for (let s = 0; s < PLACEABLE.length; s++) {
    const el = document.getElementById('slot' + s);
    const cnt = G.inv[PLACEABLE[s]];
    el.querySelector('.cnt').textContent = cnt === Infinity ? '∞' : cnt;
    el.classList.toggle('empty', cnt !== Infinity && cnt <= 0);
  }
  renderBackpackIfOpen(); // если рюкзак открыт — обновим и его
}

// На телефоне слоты можно тыкать пальцем
export function initHotbar() {
  for (let s = 0; s < PLACEABLE.length; s++)
    document.getElementById('slot' + s).addEventListener('click', () => selectSlot(s));
}

// ---------- 🎒 РЮКЗАК ----------
const bp = () => document.getElementById('backpack');
// Что можно «употребить» прямо из рюкзака тапом
const USABLE = new Set(['apple', 'potionHealth', 'potionSpeed', 'potionJump']);
let onUseItem = null; // функцию пришлёт shop.js/health.js через init
export function setUseItemHandler(fn) { onUseItem = fn; }

// Одна карточка в рюкзаке: цветной квадратик, имя, сколько штук
function bpCell(type, count, slotIdx) {
  const hex = COLORS[type].toString(16).padStart(6, '0');
  const cnt = count === Infinity ? '∞' : (count || 0);
  return `<div class="bpItem ${slotIdx !== undefined ? '' : 'trophy'}" data-slot="${slotIdx ?? ''}">
    <div class="bpIcon" style="background:#${hex}">${cnt}</div>
    <div class="bpName">${NAMES[type]}</div>
  </div>`;
}

// Карточка предмета-«всякого»: значок-эмодзи, тап = использовать.
// Снаряжение (мечи, лук, броня) НАДЕВАЕТСЯ тапом — надетое светится золотом!
function goodieCell(type) {
  const n = G.inv[type] || 0;
  const usable = USABLE.has(type);
  const equipable = EQUIPPABLE.has(type) && n > 0;
  const on = equipable && isEquipped(G, type);
  return `<div class="bpItem ${usable ? 'usable' : 'trophy'} ${n ? '' : 'zero'} ${on ? 'equipped' : ''}"
    data-use="${usable ? type : ''}" data-equip="${equipable ? type : ''}">
    <div class="bpIcon goodie">${ICONS[type]}<span class="goodieCnt">${n}</span></div>
    <div class="bpName">${NAMES[type]}${on ? ' ✅' : ''}</div>
  </div>`;
}

// Перерисовать содержимое рюкзака
export function renderBackpack() {
  document.getElementById('bpGrid').innerHTML =
    PLACEABLE.map((t, i) => bpCell(t, G.inv[t], i)).join('');
  document.getElementById('bpGoodies').innerHTML =
    GOODIES.map(goodieCell).join('');
  document.getElementById('bpTrophies').innerHTML =
    '🏆 Трофеи: ' + TROPHIES.map(t => bpCell(t, G.inv[t])).join('');
}

// Перерисовать рюкзак, только если он открыт (не дёргаем зря)
export function renderBackpackIfOpen() {
  if (bp().style.display !== 'none') renderBackpack();
}

// Открыть/закрыть рюкзак
export function toggleBackpack() {
  const el = bp();
  const open = el.style.display === 'none';
  el.style.display = open ? 'flex' : 'none';
  if (open) renderBackpack();
}

// Собрать рюкзак и повесить клики: тап по блоку = взять в руку,
// тап по яблоку/зелью = съесть или выпить!
export function initBackpack() {
  bp().addEventListener('click', e => {
    const item = e.target.closest('.bpItem');
    if (item && item.dataset.equip) { // ⚔️ надеть/снять снаряжение
      showToast(equipItem(G, item.dataset.equip, NAMES));
      renderBackpack();
    } else if (item && item.dataset.use) { // употребляемый предмет
      if (onUseItem) onUseItem(item.dataset.use);
    } else if (item && item.dataset.slot) { // выбрали блок — в руку!
      selectSlot(+item.dataset.slot);
      toggleBackpack();
    } else if (!e.target.closest('#bpWindow')) toggleBackpack(); // тап мимо окна — закрыть
  });
}
