// ============================================================
//  🗡️ СНАРЯЖЕНИЕ ГЕРОЯ — мечи, лук и броня
//  Как в настоящей ролевой игре: оружие покупаем у Тихона,
//  лук — у эльфов, а надеваем тапом по вещи в рюкзаке.
//  Мечи бывают четырёх уровней: деревянный → каменный →
//  золотой → алмазный. Броня смягчает удары монстров!
// ============================================================

import { emit } from './bus.js';
import { skillRank } from './skills.js';

// Урон каждого оружия ('sword' — старый меч из прошлых сохранений)
export const WEAPON_DMG = {
  sword: 2,        // старый добрый меч = деревянный
  swordWood: 2,    // 🗡️ деревянный — первый меч героя
  swordStone: 3,   // ⚔️ каменный
  swordGold: 4,    // ⚔️ золотой
  swordDiamond: 5  // 💎 алмазный — легенда!
};
// Цвет клинка каждого меча (для модельки в руке)
export const SWORD_COLOR = {
  sword: 0x8B5A2B, swordWood: 0x8B5A2B,  // дерево — коричневое
  swordStone: 0x9A9A9A,                  // камень — серый
  swordGold: 0xFFD75E,                   // золото — сияет!
  swordDiamond: 0x5CE8E0                 // алмаз — бирюзовый
};
// Защита брони: на столько меньше бьют монстры
export const ARMOR_VAL = { armorLeather: 1, armorChain: 2 };

// Всё, что можно надеть (для рюкзака; старый 'sword' — тоже!)
export const EQUIPPABLE = new Set([
  ...Object.keys(WEAPON_DMG),
  'bow', 'armorLeather', 'armorChain'
]);

// Есть ли вещь в рюкзаке? (старый 'sword' считаем деревянным)
export function owns(G, type) {
  if (type === 'swordWood') return (G.inv.swordWood || G.inv.sword || 0) > 0;
  return (G.inv[type] || 0) > 0;
}

// Удобный доступ к надетому (создаём кармашек, если его ещё нет)
export function gear(G) {
  if (!G.equip) G.equip = { weapon: null, armor: null };
  return G.equip;
}

// Надето ли прямо сейчас?
export function isEquipped(G, type) {
  const e = gear(G);
  return e.weapon === type || e.armor === type;
}

// 🎽 Надеть / снять вещь (тап по ней в рюкзаке).
// Возвращает текст для всплывающего сообщения.
export function equipItem(G, type, NAMES) {
  const e = gear(G);
  if (!owns(G, type)) return null;
  const name = NAMES[type] || type;
  if (WEAPON_DMG[type] !== undefined || type === 'bow') {
    if (e.weapon === type) { // повторный тап — убрать в рюкзак
      e.weapon = null;
      emit('dirty');
      return `🎒 ${name} убран в рюкзак`;
    }
    e.weapon = type;
    emit('dirty');
    return type === 'bow'
      ? '🏹 Лук в руках! Тапай по монстрам издалека (нужны стрелы ➶)'
      : `🗡️ ${name} в руке! Урон: ${WEAPON_DMG[type]}`;
  }
  if (ARMOR_VAL[type] !== undefined) {
    if (e.armor === type) {
      e.armor = null;
      emit('dirty');
      return `🎒 ${name} снята`;
    }
    e.armor = type;
    emit('equip', type); // квест «Надень броню»
    emit('dirty');
    return `🛡️ ${name} надета! Удары монстров слабее на ${ARMOR_VAL[type]}`;
  }
  return null;
}

// Сила удара: рука = 1, меч = по уровню (лук бьёт по-своему).
// 📚 Навык «Меч» от Бори добавляет +1 за каждую ступень!
export function weaponDamage(G) {
  const w = gear(G).weapon;
  if (w && WEAPON_DMG[w] !== undefined && owns(G, w))
    return WEAPON_DMG[w] + skillRank(G, 'sword');
  return 1;
}

// Защита от ударов монстров
export function armorValue(G) {
  const a = gear(G).armor;
  return a && owns(G, a) ? ARMOR_VAL[a] : 0;
}
