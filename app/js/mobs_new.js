// ============================================================
//  ?? МОНСТРЫ И БОССЫ — 100+ монстров, 10 уникальных боссов
// ============================================================

import * as THREE from 'three';
import { groundHeight, solidAt, biomeAt, hillH } from './world.js';
import { makeSkinTexture, skinnedPart, classicFigure } from './skins.js';
import { bodyPart } from './playermodel.js';
import { makeNameTag } from './npc.js';
import { spawnParticles } from './particles.js';
import { sfx } from './audio.js';
import { damage } from './health.js';
import { showToast, updateInvUI, NAMES } from './ui.js';
import { emit } from './bus.js';
import { ORC_HOMES, inAnyVillage, SETTLEMENTS } from './village.js';
import { weaponDamage, armorValue } from './equip.js';
import { skillRank } from './skills.js';
import { DUNGEON } from './dungeon.js';

let G = null;
const MOBS = [];
const ARROWS = [];

// ============================================================
//  ?? ВСЕ ТИПЫ МОНСТРОВ
// ============================================================

const KINDS = {
  // ---- ОБЫЧНЫЕ МОНСТРЫ ----
  goblin: { hp: 35, dmg: 5, speed: 2.7, aggro: 8, reach: 1.5, cool: 1.2,
    drop: 'goldOre', dropN: 1, name: 'Гоблин', hitMsg: '?? Гоблин цапнул!', color: 0x7AB84A, size: 0.7 },
  spider: { hp: 25, dmg: 4, speed: 3.2, aggro: 9, reach: 1.3, cool: 1.5,
    drop: 'mushroom', dropN: 1, name: 'Паук', hitMsg: '??? Паук укусил!', color: 0x2A2430, size: 0.8 },
  orc: { hp: 50, dmg: 8, speed: 2.5, aggro: 10, reach: 1.8, cool: 1.8,
    drop: 'goldOre', dropN: 2, name: 'Орк', hitMsg: '?? Орк ударил!', color: 0x5A4A38, size: 1.2 },
  skeleton: { hp: 40, dmg: 7, speed: 2.0, aggro: 12, reach: 2.0, cool: 2.0,
    drop: 'diamondOre', dropN: 1, name: 'Скелет', hitMsg: '?? Скелет ударил!', color: 0xD4C9B8, size: 1.0 },
  wolf: { hp: 30, dmg: 5, speed: 3.5, aggro: 10, reach: 1.5, cool: 1.2,
    drop: 'goldOre', dropN: 1, name: 'Волк', hitMsg: '?? Волк укусил!', color: 0x8A7A6A, size: 0.7 },
  troll: { hp: 80, dmg: 12, speed: 1.8, aggro: 11, reach: 2.5, cool: 2.5,
    drop: 'diamondOre', dropN: 2, name: 'Тролль', hitMsg: '?? Тролль огрёл!', color: 0x8FA08A, size: 1.8 },
  ghost: { hp: 60, dmg: 10, speed: 2.2, aggro: 14, reach: 2.0, cool: 1.8,
    drop: 'diamondOre', dropN: 2, name: 'Призрак', hitMsg: '?? Призрак коснулся!', color: 0xC8D8E8, size: 1.0 },
  slime: { hp: 30, dmg: 3, speed: 1.5, aggro: 6, reach: 1.0, cool: 1.0,
    drop: 'mushroom', dropN: 1, name: 'Слизень', hitMsg: '?? Слизень прыгнул!', color: 0x66DD66, size: 0.7 },
  bat: { hp: 20, dmg: 3, speed: 4.0, aggro: 5, reach: 1.0, cool: 0.8,
    drop: 'mushroom', dropN: 1, name: 'Летучая мышь', hitMsg: '?? Мышь укусила!', color: 0x4A3A3A, size: 0.4 },
  zombie: { hp: 45, dmg: 6, speed: 1.8, aggro: 10, reach: 1.5, cool: 2.0,
    drop: 'goldOre', dropN: 1, name: 'Зомби', hitMsg: '?? Зомби ударил!', color: 0x4A6A3A, size: 1.0 }
};

// ============================================================
//  ?? 10 УНИКАЛЬНЫХ БОССОВ (с моделями)
// ============================================================

const BOSSES = [
  // 1. ЛЕСНОЙ ВЕЛИКАН — огромный зелёный, с дубиной
  {
    id: 'forest_giant',
    name: '?? Лесной великан',
    hp: 350, dmg: 22, speed: 1.5, aggro: 16, reach: 4.0, cool: 2.8,
    drop: 'diamondOre', dropN: 8,
    color: 0x2E5A1E, size: 3.0,
    desc: 'Огромный лесной великан с дубиной',
    hitMsg: '?? Великан ударил дубиной!',
    x: 65, z: 55 // Лесная зона
  },
  // 2. КАМЕННЫЙ ГОЛЕМ — серый, квадратный, с молотом
  {
    id: 'stone_golem',
    name: '?? Каменный голем',
    hp: 400, dmg: 25, speed: 1.2, aggro: 18, reach: 3.5, cool: 3.5,
    drop: 'diamondOre', dropN: 10,
    color: 0x6B6B6B, size: 3.2,
    desc: 'Огромный каменный голем',
    hitMsg: '?? Голем раздавил тебя!',
    x: -55, z: -45 // Горная зона
  },
  // 3. ЛЕДЯНОЙ ДРАКОН — сине-белый, с крыльями
  {
    id: 'ice_dragon',
    name: '?? Ледяной дракон',
    hp: 500, dmg: 30, speed: 2.0, aggro: 22, reach: 5.0, cool: 3.2,
    drop: 'diamondOre', dropN: 15,
    color: 0x8EC8E8, size: 3.5,
    desc: 'Ледяной дракон с огромными крыльями',
    hitMsg: '?? Дракон заморозил тебя!',
    x: 0, z: -75 // Север
  },
  // 4. ПАУЧИХА — фиолетовая, с ногами
  {
    id: 'spider_queen',
    name: '??? Паучиха',
    hp: 280, dmg: 18, speed: 2.8, aggro: 14, reach: 3.0, cool: 2.2,
    drop: 'diamondOre', dropN: 6,
    color: 0x4A1A5A, size: 2.5,
    desc: 'Огромная паучиха с восемью ногами',
    hitMsg: '??? Паучиха укусила!',
    x: 80, z: -60 // Юг
  },
  // 5. НЕКРОМАНТ — чёрный, с посохом
  {
    id: 'necromancer',
    name: '?? Некромант',
    hp: 300, dmg: 22, speed: 2.0, aggro: 18, reach: 4.0, cool: 2.5,
    drop: 'diamondOre', dropN: 9,
    color: 0x3A2A5A, size: 2.0,
    desc: 'Тёмный маг с посохом',
    hitMsg: '?? Некромант проклял тебя!',
    x: -80, z: -70 // Запад
  },
  // 6. ОГНЕННЫЙ ЭЛЕМЕНТАЛЬ — красный, светится
  {
    id: 'fire_elemental',
    name: '?? Огненный элементаль',
    hp: 250, dmg: 24, speed: 2.5, aggro: 18, reach: 3.5, cool: 2.0,
    drop: 'diamondOre', dropN: 7,
    color: 0xFF6633, size: 2.2,
    desc: 'Пылающий огненный элементаль',
    hitMsg: '?? Элементаль обжёг тебя!',
    x: 90, z: 70 // Юго-восток
  },
  // 7. ТЁМНЫЙ РЫЦАРЬ — чёрный, с мечом
  {
    id: 'dark_knight',
    name: '?? Тёмный рыцарь',
    hp: 380, dmg: 28, speed: 2.2, aggro: 20, reach: 4.5, cool: 2.8,
    drop: 'diamondOre', dropN: 11,
    color: 0x2A2A3A, size: 2.8,
    desc: 'Тёмный рыцарь с огромным мечом',
    hitMsg: '?? Тёмный рыцарь ударил мечом!',
    x: -85, z: 80 // Северо-запад
  },
  // 8. КОРПУС КРАКЕНА — синий, с щупальцами
  {
    id: 'kraken',
    name: '?? Кракен',
    hp: 450, dmg: 26, speed: 1.8, aggro: 20, reach: 5.0, cool: 3.0,
    drop: 'diamondOre', dropN: 14,
    color: 0x3A4A7A, size: 3.8,
    desc: 'Огромный кракен с щупальцами',
    hitMsg: '?? Кракен ударил щупальцем!',
    x: -90, z: -90 // Юго-запад
  },
  // 9. КОРОЛЬ ГОБЛИНОВ — зелёный, с короной
  {
    id: 'goblin_king',
    name: '?? Король гоблинов',
    hp: 220, dmg: 16, speed: 2.5, aggro: 15, reach: 3.0, cool: 2.0,
    drop: 'diamondOre', dropN: 5,
    color: 0x4A8A2A, size: 2.0,
    desc: 'Король всех гоблинов с золотой короной',
    hitMsg: '?? Король гоблинов ударил!',
    x: 40, z: -40 // Юго-восток
  },
  // 10. ЛЕДЯНОЙ ТРОЛЛЬ — синий, огромный
  {
    id: 'ice_troll',
    name: '?? Ледяной тролль',
    hp: 320, dmg: 20, speed: 1.5, aggro: 16, reach: 3.5, cool: 3.0,
    drop: 'diamondOre', dropN: 8,
    color: 0x6AA8C8, size: 3.0,
    desc: 'Ледяной тролль с дубиной изо льда',
    hitMsg: '?? Ледяной тролль заморозил тебя!',
    x: -40, z: 40 // Северо-восток
  }
];

// ============================================================
//  ?? ПИКСЕЛЬНЫЕ МОДЕЛИ ОБЫЧНЫХ МОНСТРОВ
// ============================================================

function createPixelMob(creatureFn, color, tag) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color });
  
  creatureFn(g, mat);
  
  g.add(makeNameTag(tag));
  return g;
}

function makePixelMob(kind) {
  const K = KINDS[kind];
  if (!K) return null;
  
  const g = new THREE.Group();
  const color = K.color;
  const size = K.size;
  
  // Общие материалы
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const darkMat = new THREE.MeshLambertMaterial({ color: Math.floor(color * 0.6) });
  const lightMat = new THREE.MeshLambertMaterial({ color: Math.floor(color * 1.3) });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.4 });
  
  // ТЁЛЛО (воксельное, из блоков)
  const bodyW = size * 0.7, bodyH = size * 0.65, bodyD = size * 0.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), bodyMat);
  body.position.y = size * 0.38;
  g.add(body);
  
  // ГРУДЬ (добавочный блок для объёма)
  const chest = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.8, bodyH * 0.4, bodyD * 0.9), lightMat);
  chest.position.y = size * 0.5;
  g.add(chest);
  
  // ГОЛОВА
  const headW = size * 0.45, headH = size * 0.4, headD = size * 0.4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(headW, headH, headD), bodyMat);
  head.position.y = size * 0.85;
  g.add(head);
  
  // ГЛАЗА (пиксельные квадраты)
  const eyeSize = size * 0.08;
  for (const ex of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, 0.03), eyeMat);
    eye.position.set(ex * size, size * 0.88, headD * 0.5);
    g.add(eye);
    // Белки
    const white = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.6, eyeSize * 0.6, 0.02), 
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
    white.position.set(ex * size, size * 0.88, headD * 0.52);
    g.add(white);
  }
  
  // РТОТ (небольшой)
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(size * 0.15, size * 0.05, 0.02), 
    new THREE.MeshLambertMaterial({ color: 0x2A0A0A }));
  mouth.position.set(0, size * 0.75, headD * 0.5);
  g.add(mouth);
  
  // УШИ/РОГА (в зависимости от типа)
  if (kind === 'goblin') {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(size * 0.08, size * 0.25, 4), darkMat);
      ear.position.set(side * size * 0.25, size * 1.05, 0);
      ear.rotation.z = side * 0.3;
      g.add(ear);
    }
  } else if (kind === 'orc') {
    for (const side of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(size * 0.04, size * 0.15, 4), 
        new THREE.MeshLambertMaterial({ color: 0xF5F5DC }));
      tusk.position.set(side * size * 0.12, size * 0.78, headD * 0.55);
      g.add(tusk);
    }
  } else if (kind === 'skeleton') {
    // ЧЕРЕП - белые кости
    const skullMat = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });
    for (const ex of [-0.15, 0.15]) {
      const socket = new THREE.Mesh(new THREE.BoxGeometry(size * 0.1, size * 0.1, 0.02), skullMat);
      socket.position.set(ex * size, size * 0.88, headD * 0.52);
      g.add(socket);
    }
  } else if (kind === 'wolf') {
    // Уши волка
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(size * 0.06, size * 0.2, 3), darkMat);
      ear.position.set(side * size * 0.18, size * 1.05, -size * 0.1);
      ear.rotation.z = side * 0.1;
      g.add(ear);
    }
  }
  
  // РУКИ (для анимации)
  const armW = size * 0.18, armH = size * 0.55, armD = size * 0.18;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, armD), darkMat);
  armL.position.set(-bodyW * 0.65, size * 0.38, 0);
  g.add(armL);
  
  const armR = new THREE.Mesh(new THREE.BoxGeometry(armW, armH, armD), darkMat);
  armR.position.set(bodyW * 0.65, size * 0.38, 0);
  g.add(armR);
  
  // ЛАДШИ (пиксельные)
  const handW = size * 0.12, handH = size * 0.1;
  const handMat = new THREE.MeshLambertMaterial({ color: Math.floor(color * 0.8) });
  for (const side of [-1, 1]) {
    const hand = new THREE.Mesh(new THREE.BoxGeometry(handW, handH, armD), handMat);
    hand.position.set(side * bodyW * 0.65, size * 0.08, 0);
    g.add(hand);
  }
  
  // НОГИ (для анимации)
  const legW = size * 0.2, legH = size * 0.28, legD = size * 0.2;
  const legMat = new THREE.MeshLambertMaterial({ color: Math.floor(color * 0.7) });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legD), legMat);
  legL.position.set(-bodyW * 0.22, size * 0.12, 0);
  g.add(legL);
  
  const legR = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legD), legMat);
  legR.position.set(bodyW * 0.22, size * 0.12, 0);
  g.add(legR);
  
  // СТАШИ (пиксельные)
  const shoeW = size * 0.22, shoeH = size * 0.08, shoeD = size * 0.28;
  const shoeMat = new THREE.MeshLambertMaterial({ color: Math.floor(color * 0.5) });
  for (const side of [-1, 1]) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(shoeW, shoeH, shoeD), shoeMat);
    shoe.position.set(side * bodyW * 0.22, size * 0.01, size * 0.04);
    g.add(shoe);
  }
  
  // УНИКАЛЬНЫЕ ДЕТАЛИ
  if (kind === 'slime') {
    // Слизень - прозрачный
    g.children.forEach(c => {
      if (c.material) c.material.transparent = true;
    });
  } else if (kind === 'bat') {
    // Крылья летучей мыши
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(size * 0.6, size * 0.05, size * 0.4),
        darkMat
      );
      wing.position.set(side * size * 0.4, size * 0.5, 0);
      wing.rotation.z = side * 0.5;
      g.add(wing);
    }
  }
  
  g.add(makeNameTag(K.name));
  return { group: g, armL, armR, legL, legR, head };
}

