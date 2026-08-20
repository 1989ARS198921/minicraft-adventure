// ============================================================
//  🧍 ЖИТЕЛИ (NPC) — друзья в нашем мире!
//  Гуляют около старта, качают руками-ногами. Тапнул на жителя —
//  он поздоровается и предложит обмен: «принеси 5 камня —
//  дам 3 кирпича!». Это наши первые RPG-задания от персонажей.
// ============================================================

import * as THREE from 'three';
import { groundHeight, blockAt, solidAt } from './world.js';
import { bodyPart } from './playermodel.js';
import { makeSkinTexture, classicFigure } from './skins.js';
import { showToast, updateInvUI, NAMES } from './ui.js';
import { openShop, SHOP_ITEMS, WIZARD_ITEMS, ELF_ITEMS } from './shop.js';
import { SKILLS, RANKS, skillRank, costNext, train } from './skills.js';
import { VILLAGE_HOMES, ELF_HOMES, settlementAt, SETTLEMENTS } from './village.js';
import { sfx } from './audio.js';
import { emit } from './bus.js';
import { QUESTS, questState } from './quests.js';

let G = null;
const NPCS = []; // все жители

// ============================================================
//  🧑 30 NPC С КВЕСТАМИ
// ============================================================

const DEFS = [
  // ============================================================
  //  1. ЦЕНТРАЛЬНАЯ ДЕРЕВНЯ (5 NPC)
  // ============================================================
  { name: 'Борис', role: 'trainer', style: 'cap', trains: 'sword',
    outfit: { skin: '#F1C27D', hair: '#2B2B2B', eye: '#4A6741',
              shirt: '#3FA33F', pants: '#4A4A6A', shoes: '#5A3A22' },
    hi: 'Привет! Я мастер меча. Хочешь, научу рубить как следует? Приноси очки навыков — их дают за уровни!' },
  
  { name: 'Мария', role: 'trade', style: 'bun',
    outfit: { skin: '#FFD7B0', hair: '#D35400', eye: '#8A5A2B',
              shirt: '#E86AA0', pants: '#E86AA0', shoes: '#C94F7C' },
    want: 'dirt', wantN: 10, give: 'torch', giveN: 5,
    hi: 'Привет! Я делаю грядки для цветов. Принеси земли — дам факелы!' },
  
  { name: 'Тихон', role: 'merchant', style: 'merchant',
    outfit: { skin: '#E8B88A', hair: '#777777', eye: '#3A3A4A',
              shirt: '#7A7A8C', pants: '#4A4A6A', shoes: '#3A2A1A' },
    hi: 'Добро пожаловать в мою лавку! Плачу товаром за уголь и золото.' },
  
  { name: 'Степан', role: 'trade', style: 'long',
    outfit: { skin: '#F1C27D', hair: '#E8C76A', eye: '#2B6CB0',
              shirt: '#E8853B', pants: '#2F4F8F', shoes: '#6B4A2B' },
    want: 'planks', wantN: 8, give: 'glass', giveN: 3,
    hi: 'Здорово! Пилю доски для крыши. Принеси досок — отблагодарю стеклом!' },
  
  { name: 'Василий', role: 'trade', style: 'cap',
    outfit: { skin: '#F1C27D', hair: '#3A2A1A', eye: '#4A6741',
              shirt: '#8B5A2B', pants: '#4A4A6A', shoes: '#5A3A22' },
    want: 'coalOre', wantN: 5, give: 'goldOre', giveN: 1,
    hi: 'Привет! Нужен уголь для кузницы. Принеси 5 угля — дам золото!' },

  // ============================================================
  //  2. ЛЕСНАЯ ДЕРЕВНЯ (5 NPC)
  // ============================================================
  { name: 'Лея', role: 'trainer', style: 'elf', trains: 'bow',
    outfit: { skin: '#FFE0C0', hair: '#F4D03F', eye: '#27AE60',
              shirt: '#2ECC71', pants: '#1E8A4C', shoes: '#8A5A2B' },
    hi: 'Приветик! Я лучший стрелок деревни. Научу попадать в белку в глаз... то есть в монстра!' },
  
  { name: 'Эарон', role: 'merchant', style: 'elf',
    outfit: { skin: '#FFE8D0', hair: '#E8E8F0', eye: '#3A7BD5',
              shirt: '#7BAE7F', pants: '#4A6A50', shoes: '#6B4A2B' },
    items: ELF_ITEMS, shopTitle: '🏹 Мастерская эльфов',
    hi: 'Мир тебе, путник! Я мастер луков. Хороший лук бьёт монстра издалека!' },
  
  { name: 'Линия', role: 'trade', style: 'elf',
    outfit: { skin: '#FFE0C0', hair: '#B04AC9', eye: '#27AE60',
              shirt: '#A8D8A0', pants: '#5A8A60', shoes: '#8A6A3B' },
    want: 'mushroom', wantN: 4, give: 'torch', giveN: 6,
    hi: 'Здравствуй! Я собираю грибы для эльфийского супа. Поможешь?' },
  
  { name: 'Эрик', role: 'trainer', style: 'elf', trains: 'bow',
    outfit: { skin: '#FFE8D0', hair: '#4A7A2A', eye: '#27AE60',
              shirt: '#2ECC71', pants: '#1E8A4C', shoes: '#8A5A2B' },
    hi: 'Хочешь стать лучником? Я научу тебя стрелять!' },
  
  { name: 'Лина', role: 'trade', style: 'elf',
    outfit: { skin: '#FFE0C0', hair: '#D4A060', eye: '#3A7BD5',
              shirt: '#7BAE7F', pants: '#4A6A50', shoes: '#6B4A2B' },
    want: 'leaf', wantN: 10, give: 'apple', giveN: 3,
    hi: 'Принеси 10 листвы, я дам тебе сладкие яблоки!' },

  // ============================================================
  //  3. ГОРНАЯ ДЕРЕВНЯ (5 NPC)
  // ============================================================
  { name: 'Торбьорн', role: 'trainer', style: 'dwarf', trains: 'sword',
    outfit: { skin: '#E8B88A', hair: '#CC6633', eye: '#3A3A4A',
              shirt: '#7A7A8C', pants: '#4A4A6A', shoes: '#3A2A1A' },
    hi: 'Лучшее оружие куётся в горах! Хочешь научиться владеть мечом?' },
  
  { name: 'Гуннар', role: 'trade', style: 'dwarf',
    outfit: { skin: '#E8B88A', hair: '#8B4513', eye: '#3A3A4A',
              shirt: '#7A7A8C', pants: '#4A4A6A', shoes: '#3A2A1A' },
    want: 'stone', wantN: 10, give: 'goldOre', giveN: 2,
    hi: 'Камень — наша жизнь! Принеси 10 камня — получишь золото!' },
  
  { name: 'Торг', role: 'merchant', style: 'dwarf',
    outfit: { skin: '#E8B88A', hair: '#CC6633', eye: '#3A3A4A',
              shirt: '#7A7A8C', pants: '#4A4A6A', shoes: '#3A2A1A' },
    hi: 'Лучшие товары в горах! Покупай, не пожалеешь!' },
  
  { name: 'Олаф', role: 'trade', style: 'dwarf',
    outfit: { skin: '#E8B88A', hair: '#5A3A2A', eye: '#3A3A4A',
              shirt: '#7A7A8C', pants: '#4A4A6A', shoes: '#3A2A1A' },
    want: 'goldOre', wantN: 3, give: 'swordStone', giveN: 1,
    hi: 'Золото на меч! Принеси 3 золотой руды — получишь каменный меч!' },
  
  { name: 'Брунгильда', role: 'trainer', style: 'dwarf', trains: 'defense',
    outfit: { skin: '#E8B88A', hair: '#D4A060', eye: '#3A3A4A',
              shirt: '#7A7A8C', pants: '#4A4A6A', shoes: '#3A2A1A' },
    hi: 'Защита — основа выживания! Научу тебя защищаться от врагов!' },

  // ============================================================
  //  4. МАГИЧЕСКАЯ ДЕРЕВНЯ (5 NPC) — ИСПРАВЛЕНА!
  // ============================================================
  { name: 'Мерлин', role: 'wizard', style: 'wizard', trains: 'learning',
    outfit: { skin: '#F1C9A0', hair: '#EEEEEE', eye: '#7B4BC9',
              shirt: '#7B4BC9', pants: '#5A34A0', shoes: '#2B1B4B' },
    hi: 'Ага, гость! Могу сварить зелье, а могу научить мудрости — с ней любой опыт усваивается быстрее!' },
  
  { name: 'Моргана', role: 'trade', style: 'wizard',
    outfit: { skin: '#F1C9A0', hair: '#4A2A5A', eye: '#7B4BC9',
              shirt: '#7B4BC9', pants: '#5A34A0', shoes: '#2B1B4B' },
    want: 'diamondOre', wantN: 1, give: 'potionHealth', giveN: 3,
    hi: 'Алмаз — редкий камень. Принеси один, я дам тебе три зелья здоровья!' },
  
  { name: 'Эльмира', role: 'trainer', style: 'wizard', trains: 'magic',
    outfit: { skin: '#F1C9A0', hair: '#8B6B9B', eye: '#7B4BC9',
              shirt: '#7B4BC9', pants: '#5A34A0', shoes: '#2B1B4B' },
    hi: 'Магия — великая сила! Я научу тебя основам волшебства!' },
  
  { name: 'Фея Искорка', role: 'trade', style: 'elf',
    outfit: { skin: '#FFE8D0', hair: '#FFD75E', eye: '#27AE60',
              shirt: '#A8D8A0', pants: '#5A8A60', shoes: '#8A6A3B' },
    want: 'flower', wantN: 5, give: 'potionSpeed', giveN: 1,
    hi: 'Цветы для зелья скорости! Принеси 5 цветов — получишь зелье!' },
  
  { name: 'Хранитель Арканум', role: 'merchant', style: 'wizard',
    outfit: { skin: '#F1C9A0', hair: '#2A1A3A', eye: '#7B4BC9',
              shirt: '#7B4BC9', pants: '#5A34A0', shoes: '#2B1B4B' },
    items: WIZARD_ITEMS, shopTitle: '🧙 Свитки и зелья',
    hi: 'Древние знания ждут тебя! Покупай свитки и зелья!' },

  // ============================================================
  //  5. РЫБАЦКАЯ ДЕРЕВНЯ (5 NPC)
  // ============================================================
  { name: 'Олаф', role: 'trade', style: 'fisher',
    outfit: { skin: '#F1C27D', hair: '#5A3A2A', eye: '#2B6CB0',
              shirt: '#4A8A8A', pants: '#2F4F4F', shoes: '#6B4A2B' },
    want: 'fish', wantN: 3, give: 'goldOre', giveN: 1,
    hi: 'Рыба — наша жизнь! Поймай 3 рыбы — получишь золото!' },
  
  { name: 'Сигурд', role: 'merchant', style: 'fisher',
    outfit: { skin: '#F1C27D', hair: '#3A2A1A', eye: '#2B6CB0',
              shirt: '#4A8A8A', pants: '#2F4F4F', shoes: '#6B4A2B' },
    hi: 'Лучшая рыба в мире! Покупай свежий улов!' },
  
  { name: 'Астрид', role: 'trainer', style: 'fisher', trains: 'sword',
    outfit: { skin: '#F1C27D', hair: '#D4A060', eye: '#2B6CB0',
              shirt: '#4A8A8A', pants: '#2F4F4F', shoes: '#6B4A2B' },
    hi: 'Научу тебя морскому бою! С мечом в руках ты не пропадёшь!' },
  
  { name: 'Эрик Рыбак', role: 'trade', style: 'fisher',
    outfit: { skin: '#F1C27D', hair: '#8B4513', eye: '#2B6CB0',
              shirt: '#4A8A8A', pants: '#2F4F4F', shoes: '#6B4A2B' },
    want: 'apple', wantN: 5, give: 'fish', giveN: 3,
    hi: 'Яблоки — редкое лакомство! Принеси 5 яблок — получишь 3 рыбы!' },
  
  { name: 'Ларс', role: 'trade', style: 'fisher',
    outfit: { skin: '#F1C27D', hair: '#5A3A2A', eye: '#2B6CB0',
              shirt: '#4A8A8A', pants: '#2F4F4F', shoes: '#6B4A2B' },
    want: 'coalOre', wantN: 3, give: 'potionJump', giveN: 1,
    hi: 'Уголь для костра! Принеси 3 угля — получишь зелье прыжков!' },

  // ============================================================
  //  6. ЭЛЬФЫ (дополнительные)
  // ============================================================
  { name: 'Эарон', role: 'merchant', style: 'elf',
    outfit: { skin: '#FFE8D0', hair: '#E8E8F0', eye: '#3A7BD5',
              shirt: '#7BAE7F', pants: '#4A6A50', shoes: '#6B4A2B' },
    items: ELF_ITEMS, shopTitle: '🏹 Мастерская эльфов',
    hi: 'Мир тебе, путник! Я мастер луков.' },
  
  { name: 'Линия', role: 'trade', style: 'elf',
    outfit: { skin: '#FFE0C0', hair: '#B04AC9', eye: '#27AE60',
              shirt: '#A8D8A0', pants: '#5A8A60', shoes: '#8A6A3B' },
    want: 'mushroom', wantN: 4, give: 'torch', giveN: 6,
    hi: 'Помоги собрать грибы для супа!' },

  // ============================================================
  //  7. ОРКИ (5 NPC)
  // ============================================================
  { name: 'Громила', role: 'trade', style: 'orc',
    outfit: { skin: '#6A9A4A', hair: '#1A1A1A', eye: '#C03030',
              shirt: '#5A4A38', pants: '#3A3228', shoes: '#2A1F14' },
    want: 'swordWood', wantN: 1, give: 'goldOre', giveN: 3,
    hi: 'Меч на золото! Принеси деревянный меч — дам 3 золота!' },
  
  { name: 'Клыкастый', role: 'trade', style: 'orc',
    outfit: { skin: '#6A9A4A', hair: '#1A1A1A', eye: '#C03030',
              shirt: '#5A4A38', pants: '#3A3228', shoes: '#2A1F14' },
    want: 'diamondOre', wantN: 1, give: 'swordGold', giveN: 1,
    hi: 'Алмаз на меч! Принеси алмаз — получишь золотой меч!' },
  
  { name: 'Вожак Урук', role: 'trainer', style: 'orc', trains: 'sword',
    outfit: { skin: '#6A9A4A', hair: '#1A1A1A', eye: '#C03030',
              shirt: '#5A4A38', pants: '#3A3228', shoes: '#2A1F14' },
    hi: 'Ха! Хочешь научиться биться как орк? Я научу тебя!' },
  
  { name: 'Шаман Грим', role: 'wizard', style: 'orc', trains: 'magic',
    outfit: { skin: '#6A9A4A', hair: '#1A1A1A', eye: '#C03030',
              shirt: '#5A4A38', pants: '#3A3228', shoes: '#2A1F14' },
    hi: 'Оркская магия сильна! Хочешь научиться колдовать?' },
  
  { name: 'Глашатай', role: 'merchant', style: 'orc',
    outfit: { skin: '#6A9A4A', hair: '#1A1A1A', eye: '#C03030',
              shirt: '#5A4A38', pants: '#3A3228', shoes: '#2A1F14' },
    hi: 'Лучшие товары у орков! Покупай, не пожалеешь!' }
];

// ---- ДОМА ДЛЯ НОВЫХ NPC (с правильной высотой) ----
// ---- ДОМА ДЛЯ НОВЫХ NPC (с правильной высотой) ----
const NEW_HOMES = [
  // Лесная деревня
  { x: 74, z: 54, y: 4.5 },
  { x: 80, z: 50, y: 4.5 },
  { x: 84, z: 58, y: 4.5 },
  { x: 90, z: 52, y: 4.5 },
  // Горная деревня
  { x: -66, z: -50, y: 4.5 },
  { x: -60, z: -54, y: 4.5 },
  { x: -54, z: -48, y: 4.5 },
  { x: -48, z: -52, y: 4.5 },
  // ===== МАГИЧЕСКАЯ ДЕРЕВНЯ (ПОДНЯТА!) =====
  { x: 118, z: -102, y: 5.5 },   // Мерлин
  { x: 114, z: -106, y: 5.5 },   // Моргана
  { x: 120, z: -100, y: 5.5 },   // Эльмира
  { x: 124, z: -108, y: 5.5 },   // Фея Искорка
  { x: 128, z: -104, y: 5.5 },   // Хранитель Арканум
  // Рыбацкая деревня
  { x: -86, z: 104, y: 4.5 },
  { x: -80, z: 110, y: 4.5 },
  { x: -74, z: 102, y: 4.5 },
  { x: -68, z: 108, y: 4.5 },
  // Орки
  { x: -148, z: -98, y: 4.5 },
  { x: -140, z: -90, y: 4.5 },
  { x: -132, z: -82, y: 4.5 },
  { x: -124, z: -76, y: 4.5 },
  { x: -118, z: -70, y: 4.5 }
];

// ============================================================
//  🏙️ ЖИТЕЛИ ПЯТИ БОЛЬШИХ ГОРОДОВ (Этап 2)
//  В каждом городе: мэр (даёт цепочку заданий города),
//  торговец (своя лавка) и тренер (учит навыку).
//  У мэра поле city — по нему квесты понимают, чья цепочка.
// ============================================================
const CITY_DEFS = [
  // ⚙️ Город Стальной
  { name: 'Мэр Сталивар', role: 'mayor', style: 'cap', city: 'steel',
    outfit: { skin: '#F1C27D', hair: '#555560', eye: '#3A3A4A',
              shirt: '#6A7A8C', pants: '#3A4A5A', shoes: '#2A2A2A' },
    hi: 'Город Стальной держится на смельчаках! Орки у стен совсем обнаглели...' },
  { name: 'Торговка Мила', role: 'merchant', style: 'bun', city: 'steel',
    outfit: { skin: '#FFD7B0', hair: '#8A5A2B', eye: '#4A6741',
              shirt: '#7A8A9C', pants: '#5A6A7A', shoes: '#4A3A2A' },
    shopTitle: '🏪 Лавка Стального',
    hi: 'Инструменты и припасы для защитников города — заходи!' },
  { name: 'Тренер Гвоздь', role: 'trainer', style: 'cap', city: 'steel', trains: 'sword',
    outfit: { skin: '#E8B88A', hair: '#2B2B2B', eye: '#3A3A4A',
              shirt: '#4A5A6A', pants: '#3A3A4A', shoes: '#2A1F14' },
    hi: 'Меч — лучший друг защитника Стального! Покажу, как рубить по-настоящему.' },

  // 💰 Город Золотой
  { name: 'Мэр Златан', role: 'mayor', style: 'bun', city: 'gold',
    outfit: { skin: '#F1C9A0', hair: '#D4A017', eye: '#8A5A2B',
              shirt: '#C9A227', pants: '#8A6A17', shoes: '#5A3A22' },
    hi: 'Золотой город богат, но скелеты в пустыне не дают покоя караванам!' },
  { name: 'Торговец Карат', role: 'merchant', style: 'merchant', city: 'gold',
    outfit: { skin: '#E8B88A', hair: '#3A2A1A', eye: '#8A5A2B',
              shirt: '#E8C76A', pants: '#8A6A17', shoes: '#5A3A22' },
    shopTitle: '🏪 Лавка Золотого',
    hi: 'Золото течёт рекой! Лучшие товары пустыни — только у меня.' },
  { name: 'Тренер Сабля', role: 'trainer', style: 'long', city: 'gold', trains: 'bow',
    outfit: { skin: '#F1C27D', hair: '#5A3A2A', eye: '#8A5A2B',
              shirt: '#B8960F', pants: '#6A5A2A', shoes: '#4A3A2A' },
    hi: 'В пустыне близко к врагу не подходи — бей из лука! Научу.' },

  // 🏛️ Город Древний
  { name: 'Хранитель Стар', role: 'mayor', style: 'wizard', city: 'ancient',
    outfit: { skin: '#F1C9A0', hair: '#DDDDDD', eye: '#5A6A8A',
              shirt: '#8A8A7A', pants: '#5A5A4A', shoes: '#3A3228' },
    hi: 'Руины нашего города полны призраками... Поможешь старому городу?' },
  { name: 'Торговка Мозаика', role: 'merchant', style: 'bun', city: 'ancient',
    outfit: { skin: '#FFE0C0', hair: '#8A6A4A', eye: '#5A6A8A',
              shirt: '#A8A898', pants: '#6A6A5A', shoes: '#4A3A2A' },
    shopTitle: '🏪 Лавка Древнего',
    hi: 'Древние вещицы и редкости — выбирай, путник!' },
  { name: 'Мудрец Элл', role: 'trainer', style: 'wizard', city: 'ancient', trains: 'learning',
    outfit: { skin: '#F1C9A0', hair: '#EEEEEE', eye: '#5A6A8A',
              shirt: '#7A7A6A', pants: '#4A4A3A', shoes: '#2B1B1B' },
    hi: 'Знания древних сильнее любого меча. Хочешь мудрости?' },

  // ❄️ Город Северный
  { name: 'Мэр Морозко', role: 'mayor', style: 'cap', city: 'north',
    outfit: { skin: '#FFE8D0', hair: '#E8E8F0', eye: '#2B6CB0',
              shirt: '#4A7AB0', pants: '#2F4F8F', shoes: '#3A3A4A' },
    hi: 'На севере сурово: волчьи стаи подходят всё ближе к стенам...' },
  { name: 'Торговка Снежана', role: 'merchant', style: 'bun', city: 'north',
    outfit: { skin: '#FFE8D0', hair: '#D4A060', eye: '#2B6CB0',
              shirt: '#6A9AD0', pants: '#3A5A8A', shoes: '#4A4A6A' },
    shopTitle: '🏪 Лавка Северного',
    hi: 'Тёплые вещи и провизия для северных походов!' },
  { name: 'Тренер Вьюга', role: 'trainer', style: 'long', city: 'north', trains: 'bow',
    outfit: { skin: '#FFE8D0', hair: '#B0C0D0', eye: '#2B6CB0',
              shirt: '#5A8AC0', pants: '#2F4F8F', shoes: '#3A3A4A' },
    hi: 'Вьюга заметает следы, но моя стрела всегда находит цель. Научу!' },

  // ⛏️ Город Подземный
  { name: 'Старшина Кром', role: 'mayor', style: 'dwarf', city: 'under',
    outfit: { skin: '#E8B88A', hair: '#5A3A2A', eye: '#3A3A4A',
              shirt: '#6A5A4A', pants: '#4A3F2F', shoes: '#2A1F14' },
    hi: 'Наша шахта кормит весь город, но в штольнях завелись пауки...' },
  { name: 'Торговец Штык', role: 'merchant', style: 'dwarf', city: 'under',
    outfit: { skin: '#E8B88A', hair: '#3A2A1A', eye: '#3A3A4A',
              shirt: '#7A6A55', pants: '#4A4A3A', shoes: '#2A1F14' },
    shopTitle: '🏪 Лавка Подземного',
    hi: 'Кирки, факелы и всё для шахтёра — налетай!' },
  { name: 'Тренер Бур', role: 'trainer', style: 'dwarf', city: 'under', trains: 'sword',
    outfit: { skin: '#E8B88A', hair: '#CC6633', eye: '#3A3A4A',
              shirt: '#5A4A3A', pants: '#3A3228', shoes: '#2A1F14' },
    hi: 'В тесных штольнях размахнуться негде — учись бить коротко и точно!' }
];

// Домики горожан: мэр у южной дороги площади,
// торговец — у западной, тренер — у восточной (BASE города = 3, ноги на 4.5)
const CITY_HOMES = [
  // cx, cz городов: steel 135,110 / gold -120,-130 / ancient 150,-80 / north -80,150 / under 0,-120
  { x: 135, z: 115, y: 4.5 }, { x: 130, z: 110, y: 4.5 }, { x: 140, z: 110, y: 4.5 },
  { x: -120, z: -125, y: 4.5 }, { x: -125, z: -130, y: 4.5 }, { x: -115, z: -130, y: 4.5 },
  { x: 150, z: -75, y: 4.5 }, { x: 145, z: -80, y: 4.5 }, { x: 155, z: -80, y: 4.5 },
  { x: -80, z: 155, y: 4.5 }, { x: -85, z: 150, y: 4.5 }, { x: -75, z: 150, y: 4.5 },
  { x: 0, z: -115, y: 4.5 }, { x: -5, z: -120, y: 4.5 }, { x: 5, z: -120, y: 4.5 }
];

// ============================================================
//  🏷️ ТАБЛИЧКА С ИМЕНЕМ
// ============================================================

export function makeNameTag(name) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(20, 20, 35, 0.6)';
  const rx = 28, ry = 6, rw = 200, rh = 52, rr = 14;
  g.beginPath();
  g.moveTo(rx + rr, ry);
  g.arcTo(rx + rw, ry, rx + rw, ry + rh, rr);
  g.arcTo(rx + rw, ry + rh, rx, ry + rh, rr);
  g.arcTo(rx, ry + rh, rx, ry, rr);
  g.arcTo(rx, ry, rx + rw, ry, rr);
  g.fill();
  g.font = 'bold 34px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#FFE98A';
  g.fillText(name, 128, 34);
  const t = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  sp.scale.set(1.3, 0.33, 1);
  sp.position.y = 2.1;
  return sp;
}

// ============================================================
//  🧍 СОБРАТЬ ЖИТЕЛЯ (улучшенная версия!)
// ============================================================

function makeVillager(def) {
  const { style, outfit, name, role } = def;
  const g = new THREE.Group();
  const skin = makeSkinTexture(outfit);
  const fig = classicFigure(skin);
  g.add(fig.group);
  const { armL, armR, legL, legR, head, body } = fig;
  const hairColor = parseInt(outfit.hair.slice(1), 16);
  const robeColor = parseInt(outfit.shirt.slice(1), 16);
  const skinColor = parseInt(outfit.skin.slice(1), 16);
  const pantsColor = parseInt(outfit.pants.slice(1), 16);
  
  // ====== ОБЪЁМНАЯ ШЕЙКА И ПЛЕЧИ ======
  g.add(bodyPart(0.55, 0.15, 0.35, skinColor, 0, 1.42, 0));
  g.add(bodyPart(0.6, 0.06, 0.4, skinColor, 0, 1.48, 0));
  
  // ====== ГЛАЗА-БЛИКИ (добавить блеск) ======
  const eyeBlinkMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), eyeBlinkMat)).position.set(-0.18, 1.82, 0.27);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), eyeBlinkMat)).position.set(0.18, 1.82, 0.27);
  
  if (style === 'bun') g.add(bodyPart(0.2, 0.18, 0.2, hairColor, 0, 2.05, 0));
  if (style === 'long') g.add(bodyPart(0.48, 0.5, 0.12, hairColor, 0, 1.8, 0.2));
  
  // ====== ШЛЯПЫ И ПРИЧЁСКИ ======
  if (style === 'wizard') {
    // Широкая тулья
    g.add(bodyPart(0.65, 0.06, 0.65, robeColor, 0, 2.02, 0));
    // Конусная верхушка
    g.add(bodyPart(0.36, 0.35, 0.36, robeColor, 0, 2.22, 0));
    // Остриё
    g.add(bodyPart(0.18, 0.25, 0.18, robeColor, 0, 2.52, 0));
    // Золотая окантовка
    g.add(bodyPart(0.62, 0.03, 0.62, 0xFFD75E, 0, 2.0, 0));
    // Звёздочки на шляпе
    g.add(bodyPart(0.04, 0.04, 0.04, 0xFFD75E, -0.15, 2.28, 0.18));
    g.add(bodyPart(0.04, 0.04, 0.04, 0xFFD75E, 0.12, 2.35, 0.15));
  }
  
  // Эльф: ушки
  if (style === 'elf') {
    g.add(bodyPart(0.14, 0.08, 0.06, 0xFFE0C0, -0.3, 1.8, 0));
    g.add(bodyPart(0.14, 0.08, 0.06, 0xFFE0C0, 0.3, 1.8, 0));
    g.add(bodyPart(0.48, 0.4, 0.12, hairColor, 0, 1.85, 0.2));
  }
  
  // Орк: ирокез и броня
  if (style === 'orc') {
    g.add(bodyPart(0.2, 0.3, 0.2, hairColor, 0, 2.0, 0));
    g.add(bodyPart(0.1, 0.2, 0.1, hairColor, -0.12, 2.0, 0));
    g.add(bodyPart(0.1, 0.2, 0.1, hairColor, 0.12, 2.0, 0));
    // Кольцо в носу
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 8), 
      new THREE.MeshLambertMaterial({ color: 0xC0A040 }))).position.set(0, 1.72, 0.3);
  }
  
  if (style === 'elf') {
    g.add(bodyPart(0.14, 0.08, 0.06, 0xFFE0C0, -0.3, 1.8, 0));
    g.add(bodyPart(0.14, 0.08, 0.06, 0xFFE0C0, 0.3, 1.8, 0));
    g.add(bodyPart(0.48, 0.4, 0.12, hairColor, 0, 1.85, 0.2));
  }
  
  if (style === 'orc') {
    g.add(bodyPart(0.2, 0.3, 0.2, hairColor, 0, 2.0, 0));
    g.add(bodyPart(0.1, 0.2, 0.1, hairColor, -0.12, 2.0, 0));
    g.add(bodyPart(0.1, 0.2, 0.1, hairColor, 0.12, 2.0, 0));
  }
  
  // ====== ПРЕДМЕТЫ В РУКИ (по роли) ======
  // Меч
  if (role === 'trainer' || role === 'merchant') {
    g.add(bodyPart(0.05, 0.6, 0.05, 0xCCCCCC, 0.5, 1.0, 0.15));
    g.add(bodyPart(0.15, 0.04, 0.06, 0x8B5A2B, 0.5, 0.72, 0.15));
  }
  
  // Книга для мага
  if (style === 'wizard') {
    g.add(bodyPart(0.25, 0.3, 0.06, 0x4A2A6A, 0.5, 0.95, 0.2));
    g.add(bodyPart(0.23, 0.25, 0.01, 0xFFD75E, 0.5, 0.95, 0.23));
  }
  
  // Топор для орка
  if (style === 'orc') {
    g.add(bodyPart(0.06, 0.7, 0.06, 0x8B5A2B, 0.5, 1.1, 0.15));
    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.08), 
      new THREE.MeshLambertMaterial({ color: 0x6B6B6B }));
    axeHead.position.set(0.5, 1.5, 0.15);
    g.add(axeHead);
  }
  
  // Корзина для рыбака
  if (role === 'trade' && style === 'fisher') {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.2, 6), 
      new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
    basket.position.set(-0.4, 0.9, 0.15);
    g.add(basket);
  }
  
  // Мешок золота для торговца
  if (role === 'merchant') {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), 
      new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
    bag.position.set(-0.35, 0.85, 0.15);
    bag.scale.set(1, 0.8, 0.8);
    g.add(bag);
  }
  
  // ====== ФИНАЛИЗАЦИЯ ======
  g.add(makeNameTag(name));
  g.scale.set(0.95, 0.95, 0.95);
  return { group: g, armL, armR, legL, legR, head };
}

// ============================================================
//  🏠 ИНИЦИАЛИЗАЦИЯ NPC (ИСПРАВЛЕНА!)
// ============================================================

export function initNPCs(gameContext) {
  G = gameContext;
  
  // Объединяем все дома
  const HOMES = [...VILLAGE_HOMES, ...ELF_HOMES, ...NEW_HOMES];
  
  // Логируем для отладки
  console.log(`🏠 Загружено ${HOMES.length} домов для NPC`);
  
  // Собираем одного жителя и ставим его у домика
  const spawnNPC = (def, home) => {
    const parts = makeVillager(def);
    home = home || { x: 0, z: 0, y: 4.5 };
    const npc = {
      ...def, ...parts,
      x: home.x, z: home.z, feet: home.y || 4.5,
      home,
      tx: home.x, tz: home.z,
      wait: Math.random() * 4,
      phase: Math.random() * 6,
      speed: 1.7 + Math.random() * 0.7,
      speedCur: 0
    };
    npc.group.traverse(o => o.userData.npc = npc);
    npc.group.position.set(npc.x, npc.feet, npc.z);
    G.scene.add(npc.group);
    NPCS.push(npc);

    // Логируем волшебников для проверки
    if (def.role === 'wizard' || def.trains === 'magic' || def.style === 'wizard') {
      console.log(`🧙 ${def.name} создан на высоте ${npc.feet} (${npc.x}, ${npc.z})`);
    }
  };

  DEFS.forEach((def, i) => spawnNPC(def, HOMES[i]));
  // 🏙️ Горожане: мэры, торговцы и тренеры пяти больших городов
  CITY_DEFS.forEach((def, i) => {
    spawnNPC(def, CITY_HOMES[i]);
    if (def.role === 'mayor') console.log(`👑 ${def.name} создан (${CITY_HOMES[i].x}, ${CITY_HOMES[i].z})`);
  });
  
  dlg().addEventListener('click', e => {
    if (!e.target.closest('#dlgWindow')) dlg().style.display = 'none';
  });
}

// ============================================================
//  📍 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export function npcGroups() { return NPCS.map(n => n.group); }
export function getNPCs() { return NPCS; }

const VISITED = {};
function checkVisit() {
  const s = settlementAt(G.player.x, G.player.z);
  if (s && !VISITED[s.id]) {
    VISITED[s.id] = true;
    emit('visit', s.id);
  }
}

function turnTo(cur, want, k) {
  let d = want - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * Math.min(1, k);
}

function npcCan(n, nx, nz) {
  const bx = Math.floor(nx), bz = Math.floor(nz);
  const g = groundHeight(bx, bz, n.feet + 1.2);
  return g <= n.feet + 1.2 &&
    !solidAt(bx, Math.floor(g + 0.5), bz) &&
    !solidAt(bx, Math.floor(g + 1.5), bz);
}

// ============================================================
//  🔄 ОБНОВЛЕНИЕ NPC (каждый кадр)
// ============================================================

export function updateNPCs(dt) {
  checkVisit();
  for (const n of NPCS) {
    const dx = n.tx - n.x, dz = n.tz - n.z;
    const dist = Math.hypot(dx, dz);
    if (n.wait > 0) {
      n.wait -= dt;
      n.speedCur = Math.max(0, (n.speedCur || 0) - dt * 6);
      n.armL.rotation.x *= 0.8; n.armR.rotation.x *= 0.8;
      n.legL.rotation.x *= 0.8; n.legR.rotation.x *= 0.8;
    } else if (dist > 0.3) {
      n.speedCur = Math.min(n.speed, (n.speedCur || 0) + dt * 5);
      const nx2 = n.x + dx / dist * n.speedCur * dt;
      const nz2 = n.z + dz / dist * n.speedCur * dt;
      if (npcCan(n, nx2, nz2)) {
        n.x = nx2; n.z = nz2;
        n.group.rotation.y = turnTo(n.group.rotation.y, Math.atan2(-dx, -dz), dt * 8);
        n.phase += dt * 8 * (n.speedCur / n.speed);
        const s = Math.sin(n.phase) * 0.6;
        n.legL.rotation.x = s; n.legR.rotation.x = -s;
        n.armL.rotation.x = -s; n.armR.rotation.x = s;
      } else {
        n.wait = 0.5 + Math.random();
        n.tx = n.home.x + Math.random() * 10 - 5;
        n.tz = n.home.z + Math.random() * 10 - 5;
      }
    } else {
      n.wait = 2 + Math.random() * 5;
      const nx = n.home.x + Math.random() * 10 - 5;
      const nz = n.home.z + Math.random() * 10 - 5;
      const gy = groundHeight(Math.floor(nx), Math.floor(nz));
      if (gy <= 5 && blockAt(Math.floor(nx), gy - 1, Math.floor(nz)) !== 'water') {
        n.tx = nx; n.tz = nz;
      }
    }
    if (n.head) {
      const hx = G.player.x - n.x, hz = G.player.z - n.z;
      const near = Math.hypot(hx, hz) < 5 && Math.abs(G.player.feet - n.feet) < 3;
      let want = 0;
      if (near) {
        want = Math.atan2(-hx, -hz) - n.group.rotation.y;
        while (want > Math.PI) want -= Math.PI * 2;
        while (want < -Math.PI) want += Math.PI * 2;
        want = Math.max(-1, Math.min(1, want));
      }
      n.head.rotation.y += (want - n.head.rotation.y) * Math.min(1, dt * 6);
    }
    const gy = groundHeight(Math.floor(n.x), Math.floor(n.z), n.feet + 1.2);
    n.feet += (gy - n.feet) * Math.min(1, dt * 10);
    n.group.position.set(n.x, n.feet, n.z);
  }
}

// ============================================================
//  💬 ДИАЛОГИ
// ============================================================

const dlg = () => document.getElementById('dlg');

function setupTrainButton(btn, npc) {
  const id = npc.trains;
  const sk = SKILLS[id];
  const rank = skillRank(G, id);
  const cost = costNext(G, id);
  const sp = G.sp || 0;
  if (!cost) {
    btn.textContent = `🎓 «${sk.name}»: ты уже МАСТЕР!`;
    btn.disabled = true;
  } else {
    btn.textContent = `📚 Учить «${sk.name}»: ${RANKS[rank + 1]} — ${cost} очк. (есть ${sp})`;
    btn.disabled = sp < cost;
  }
  btn.onclick = () => {
    showToast(train(G, id) || '📚 Не хватает очков навыков! Их дают за новые уровни ⭐');
    dlg().style.display = 'none';
  };
}

function openTrainDialog(npc) {
  const sk = SKILLS[npc.trains];
  const rank = skillRank(G, npc.trains);
  const dlgEl = dlg();
  
  document.getElementById('dlgName').textContent = `${sk.icon} ${npc.name} — тренер`;
  document.getElementById('dlgText').textContent =
    `${npc.hi} Сейчас ты — ${RANKS[rank]}. «${sk.name}»: ${sk.desc}`;
  document.getElementById('dlgSecond').style.display = 'none';
  
  const btn = document.getElementById('dlgTrade');
  btn.disabled = false;
  btn.style.pointerEvents = 'auto';
  btn.style.cursor = 'pointer';
  setupTrainButton(btn, npc);
  
  dlgEl.style.display = 'flex';
  
  clearTimeout(window._dialogTimeout);
  window._dialogTimeout = setTimeout(() => {
    if (dlgEl.style.display === 'flex') dlgEl.style.display = 'none';
  }, 5000);
}

function openWizardDialog(npc) {
  document.getElementById('dlgName').textContent = `🧙 ${npc.name}`;
  document.getElementById('dlgText').textContent = npc.hi;
  const btn = document.getElementById('dlgTrade');
  btn.disabled = false;
  btn.textContent = '🧪 К полке зелий';
  btn.onclick = () => { dlg().style.display = 'none'; openShop('🧙 Зелья Мерлина', WIZARD_ITEMS); };
  const btn2 = document.getElementById('dlgSecond');
  btn2.style.display = '';
  setupTrainButton(btn2, npc);
  dlg().style.display = 'flex';
  
  clearTimeout(window._dialogTimeout);
  window._dialogTimeout = setTimeout(() => {
    if (dlg().style.display === 'flex') dlg().style.display = 'none';
  }, 5000);
}

// 👑 Диалог мэра: показывает следующий шаг цепочки заданий города
function openMayorDialog(npc) {
  // Все задания этой цепочки по порядку (steel1..steel5 и т.д.)
  const chain = QUESTS.filter(q => q.city === npc.city);
  // Первое невыполненное задание, которое уже открылось
  const next = chain.find(q => !questState[q.id].done && (!q.after || questState[q.after].done));
  document.getElementById('dlgName').textContent = `👑 ${npc.name} — глава города`;
  document.getElementById('dlgText').textContent = next
    ? `${npc.hi} Текущее поручение: «${next.text}»`
    : `${npc.hi} Все поручения выполнены — ты герой нашего города! 🏆`;
  const btn = document.getElementById('dlgTrade');
  btn.disabled = false;
  btn.style.pointerEvents = 'auto';
  btn.style.cursor = 'pointer';
  btn.textContent = '📜 Я готов помочь городу!';
  btn.onclick = () => {
    emit('cityTalk', npc.city); // квесты-разговоры слушают это событие
    sfx.quest();
    dlg().style.display = 'none';
  };
  document.getElementById('dlgSecond').style.display = 'none';
  dlg().style.display = 'flex';

  clearTimeout(window._dialogTimeout);
  window._dialogTimeout = setTimeout(() => {
    if (dlg().style.display === 'flex') dlg().style.display = 'none';
  }, 5000);
}

export function interactNPC(npc) {
  if (npc.role === 'mayor') { openMayorDialog(npc); return; }
  if (npc.role === 'merchant') { openShop(npc.shopTitle || '🏪 Лавка Тихона', npc.items || SHOP_ITEMS); return; }
  if (npc.role === 'wizard' && npc.trains) { openWizardDialog(npc); return; }
  if (npc.role === 'wizard') { openShop('🧙 Зелья Мерлина', WIZARD_ITEMS); return; }
  if (npc.role === 'trainer') { openTrainDialog(npc); return; }

  document.getElementById('dlgSecond').style.display = 'none';
  document.getElementById('dlgName').textContent = `🧍 ${npc.name}`;
  const have = G.inv[npc.want] || 0;
  const canTrade = have >= npc.wantN;
  document.getElementById('dlgText').textContent = canTrade
    ? `${npc.hi} У тебя есть ${NAMES[npc.want].toLowerCase()} — хватает на обмен!`
    : `${npc.hi} (Нужно: ${npc.wantN} × ${NAMES[npc.want].toLowerCase()}, у тебя: ${have})`;
  const btn = document.getElementById('dlgTrade');
  btn.textContent = canTrade
    ? `🤝 Отдать ${npc.wantN} → получить ${npc.giveN} (${NAMES[npc.give].toLowerCase()})`
    : `Нужно ещё ${npc.wantN - have}`;
  btn.disabled = !canTrade;
  btn.onclick = () => {
    G.inv[npc.want] -= npc.wantN;
    G.inv[npc.give] = (G.inv[npc.give] || 0) + npc.giveN;
    updateInvUI();
    sfx.quest();
    showToast(`🤝 ${npc.name}: Спасибо, держи!`);
    emit('xp', 2);
    emit('dirty');
    dlg().style.display = 'none';
  };
  dlg().style.display = 'flex';
  
  clearTimeout(window._dialogTimeout);
  window._dialogTimeout = setTimeout(() => {
    if (dlg().style.display === 'flex') dlg().style.display = 'none';
  }, 5000);
}
