// ============================================================
//  👹 МОНСТРЫ И БОССЫ — 100+ монстров, 10 уникальных боссов
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
//  ❤️ HP-БАРЫ МОНСТРОВ
// ============================================================

function createHPBar(mob) {
  if (mob.isBoss && mob.size < 2) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  // Фон
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, 128, 16);
  
  // HP
  const hpPercent = mob.hp / mob.maxHp;
  const hpColor = hpPercent > 0.6 ? '#44FF44' : hpPercent > 0.3 ? '#FFAA00' : '#FF4444';
  ctx.fillStyle = hpColor;
  ctx.fillRect(2, 2, 124 * hpPercent, 12);
  
  // Текст HP
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(mob.hp)} / ${mob.maxHp}`, 64, 12);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(mob.size * 1.5, 0.5, 1);
  sprite.position.y = mob.size + 1.5;
  sprite.userData.isHPBar = true;
  
  mob.group.add(sprite);
  mob.hpBar = sprite;
  mob.hpBarCanvas = canvas;
  mob.hpBarCtx = ctx;
  mob.hpBarTexture = texture;
}

function updateHPBar(mob) {
  if (!mob.hpBar || mob.dead || mob.hpBarCtx === undefined) return;
  const ctx = mob.hpBarCtx;
  const canvas = mob.hpBarCanvas;
  
  const hpPercent = Math.max(0, mob.hp / mob.maxHp);
  const hpColor = hpPercent > 0.6 ? '#44FF44' : hpPercent > 0.3 ? '#FFAA00' : '#FF4444';
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, 128, 16);
  ctx.fillStyle = hpColor;
  ctx.fillRect(2, 2, 124 * hpPercent, 12);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(Math.max(0, mob.hp))} / ${mob.maxHp}`, 64, 12);
  
  if (mob.hpBarTexture) mob.hpBarTexture.needsUpdate = true;
}

// ============================================================
//  📋 ВСЕ ТИПЫ МОНСТРОВ
// ============================================================

const KINDS = {
  // ---- ОБЫЧНЫЕ МОНСТРЫ ----
  goblin: { hp: 35, dmg: 5, speed: 2.7, aggro: 8, reach: 1.5, cool: 1.2,
    drop: 'goldOre', dropN: 1, name: 'Гоблин', hitMsg: '😈 Гоблин цапнул!', color: 0x7AB84A, size: 0.7 },
  spider: { hp: 25, dmg: 4, speed: 3.2, aggro: 9, reach: 1.3, cool: 1.5,
    drop: 'mushroom', dropN: 1, name: 'Паук', hitMsg: '🕷️ Паук укусил!', color: 0x2A2430, size: 0.8 },
  orc: { hp: 50, dmg: 8, speed: 2.5, aggro: 10, reach: 1.8, cool: 1.8,
    drop: 'goldOre', dropN: 2, name: 'Орк', hitMsg: '👹 Орк ударил!', color: 0x5A4A38, size: 1.2 },
  skeleton: { hp: 40, dmg: 7, speed: 2.0, aggro: 12, reach: 2.0, cool: 2.0,
    drop: 'diamondOre', dropN: 1, name: 'Скелет', hitMsg: '💀 Скелет ударил!', color: 0xD4C9B8, size: 1.0 },
  wolf: { hp: 30, dmg: 5, speed: 3.5, aggro: 10, reach: 1.5, cool: 1.2,
    drop: 'goldOre', dropN: 1, name: 'Волк', hitMsg: '🐺 Волк укусил!', color: 0x8A7A6A, size: 0.7 },
  troll: { hp: 80, dmg: 12, speed: 1.8, aggro: 11, reach: 2.5, cool: 2.5,
    drop: 'diamondOre', dropN: 2, name: 'Тролль', hitMsg: '🧌 Тролль огрёл!', color: 0x8FA08A, size: 1.8 },
  ghost: { hp: 60, dmg: 10, speed: 2.2, aggro: 14, reach: 2.0, cool: 1.8,
    drop: 'diamondOre', dropN: 2, name: 'Призрак', hitMsg: '👻 Призрак коснулся!', color: 0xC8D8E8, size: 1.0 },
  slime: { hp: 30, dmg: 3, speed: 1.5, aggro: 6, reach: 1.0, cool: 1.0,
    drop: 'mushroom', dropN: 1, name: 'Слизень', hitMsg: '👾 Слизень прыгнул!', color: 0x66DD66, size: 0.7 },
  bat: { hp: 20, dmg: 3, speed: 4.0, aggro: 5, reach: 1.0, cool: 0.8,
    drop: 'mushroom', dropN: 1, name: 'Летучая мышь', hitMsg: '🦇 Мышь укусила!', color: 0x4A3A3A, size: 0.4 },
  zombie: { hp: 45, dmg: 6, speed: 1.8, aggro: 10, reach: 1.5, cool: 2.0,
    drop: 'goldOre', dropN: 1, name: 'Зомби', hitMsg: '🧟 Зомби ударил!', color: 0x4A6A3A, size: 1.0 }
};

// ============================================================
//  👑 10 УНИКАЛЬНЫХ БОССОВ (с моделями)
// ============================================================

const BOSSES = [
  // 1. ЛЕСНОЙ ВЕЛИКАН — огромный зелёный, с дубиной
  {
    id: 'forest_giant',
    name: '🌳 Лесной великан',
    hp: 350, dmg: 22, speed: 1.5, aggro: 16, reach: 4.0, cool: 2.8,
    drop: 'diamondOre', dropN: 8,
    color: 0x2E5A1E, size: 3.0,
    desc: 'Огромный лесной великан с дубиной',
    hitMsg: '🌳 Великан ударил дубиной!',
    x: 65, z: 55 // Лесная зона
  },
  // 2. КАМЕННЫЙ ГОЛЕМ — серый, квадратный, с молотом
  {
    id: 'stone_golem',
    name: '🗿 Каменный голем',
    hp: 400, dmg: 25, speed: 1.2, aggro: 18, reach: 3.5, cool: 3.5,
    drop: 'diamondOre', dropN: 10,
    color: 0x6B6B6B, size: 3.2,
    desc: 'Огромный каменный голем',
    hitMsg: '🗿 Голем раздавил тебя!',
    x: -55, z: -45 // Горная зона
  },
  // 3. ЛЕДЯНОЙ ДРАКОН — сине-белый, с крыльями
  {
    id: 'ice_dragon',
    name: '❄️ Ледяной дракон',
    hp: 500, dmg: 30, speed: 2.0, aggro: 22, reach: 5.0, cool: 3.2,
    drop: 'diamondOre', dropN: 15,
    color: 0x8EC8E8, size: 3.5,
    desc: 'Ледяной дракон с огромными крыльями',
    hitMsg: '❄️ Дракон заморозил тебя!',
    x: 0, z: -75 // Север
  },
  // 4. ПАУЧИХА — фиолетовая, с ногами
  {
    id: 'spider_queen',
    name: '🕷️ Паучиха',
    hp: 280, dmg: 18, speed: 2.8, aggro: 14, reach: 3.0, cool: 2.2,
    drop: 'diamondOre', dropN: 6,
    color: 0x4A1A5A, size: 2.5,
    desc: 'Огромная паучиха с восемью ногами',
    hitMsg: '🕷️ Паучиха укусила!',
    x: 80, z: -60 // Юг
  },
  // 5. НЕКРОМАНТ — чёрный, с посохом
  {
    id: 'necromancer',
    name: '💀 Некромант',
    hp: 300, dmg: 22, speed: 2.0, aggro: 18, reach: 4.0, cool: 2.5,
    drop: 'diamondOre', dropN: 9,
    color: 0x3A2A5A, size: 2.0,
    desc: 'Тёмный маг с посохом',
    hitMsg: '💀 Некромант проклял тебя!',
    x: -80, z: -70 // Запад
  },
  // 6. ОГНЕННЫЙ ЭЛЕМЕНТАЛЬ — красный, светится
  {
    id: 'fire_elemental',
    name: '🔥 Огненный элементаль',
    hp: 250, dmg: 24, speed: 2.5, aggro: 18, reach: 3.5, cool: 2.0,
    drop: 'diamondOre', dropN: 7,
    color: 0xFF6633, size: 2.2,
    desc: 'Пылающий огненный элементаль',
    hitMsg: '🔥 Элементаль обжёг тебя!',
    x: 90, z: 70 // Юго-восток
  },
  // 7. ТЁМНЫЙ РЫЦАРЬ — чёрный, с мечом
  {
    id: 'dark_knight',
    name: '⚔️ Тёмный рыцарь',
    hp: 380, dmg: 28, speed: 2.2, aggro: 20, reach: 4.5, cool: 2.8,
    drop: 'diamondOre', dropN: 11,
    color: 0x2A2A3A, size: 2.8,
    desc: 'Тёмный рыцарь с огромным мечом',
    hitMsg: '⚔️ Тёмный рыцарь ударил мечом!',
    x: -85, z: 80 // Северо-запад
  },
  // 8. КОРПУС КРАКЕНА — синий, с щупальцами
  {
    id: 'kraken',
    name: '🐙 Кракен',
    hp: 450, dmg: 26, speed: 1.8, aggro: 20, reach: 5.0, cool: 3.0,
    drop: 'diamondOre', dropN: 14,
    color: 0x3A4A7A, size: 3.8,
    desc: 'Огромный кракен с щупальцами',
    hitMsg: '🐙 Кракен ударил щупальцем!',
    x: -90, z: -90 // Юго-запад
  },
  // 9. КОРОЛЬ ГОБЛИНОВ — зелёный, с короной
  {
    id: 'goblin_king',
    name: '👑 Король гоблинов',
    hp: 220, dmg: 16, speed: 2.5, aggro: 15, reach: 3.0, cool: 2.0,
    drop: 'diamondOre', dropN: 5,
    color: 0x4A8A2A, size: 2.0,
    desc: 'Король всех гоблинов с золотой короной',
    hitMsg: '👑 Король гоблинов ударил!',
    x: 40, z: -40 // Юго-восток
  },
  // 10. ЛЕДЯНОЙ ТРОЛЛЬ — синий, огромный
  {
    id: 'ice_troll',
    name: '🧊 Ледяной тролль',
    hp: 320, dmg: 20, speed: 1.5, aggro: 16, reach: 3.5, cool: 3.0,
    drop: 'diamondOre', dropN: 8,
    color: 0x6AA8C8, size: 3.0,
    desc: 'Ледяной тролль с дубиной изо льда',
    hitMsg: '🧊 Ледяной тролль заморозил тебя!',
    x: -40, z: 40 // Северо-восток
  }
];

// ============================================================
//  🧍 ПИКСЕЛЬНЫЕ МОДЕЛИ ОБЫЧНЫХ МОНСТРОВ
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

// ============================================================
//  🏰 МОДЕЛИ БОССОВ (уникальные)
// ============================================================

function makeBossModel(bossData) {
  const g = new THREE.Group();
  const color = bossData.color;
  const size = bossData.size;
  const id = bossData.id;
  
  const mat = new THREE.MeshLambertMaterial({ color: color });
  
  // ---- ТЕЛО (большое) ----
  const body = new THREE.Mesh(new THREE.BoxGeometry(size * 1.2, size * 1.0, size * 0.8), mat);
  body.position.y = size * 0.5;
  g.add(body);
  
  // ---- ГОЛОВА ----
  const headMat = new THREE.MeshLambertMaterial({ color: color });
  const head = new THREE.Mesh(new THREE.BoxGeometry(size * 0.7, size * 0.6, size * 0.5), headMat);
  head.position.y = size * 1.1;
  g.add(head);
  
  // ---- ГЛАЗА (светятся) ----
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 });
  for (const ex of [-0.18, 0.18]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), eyeMat);
    eye.position.set(ex * size, size * 1.15, size * 0.28);
    g.add(eye);
  }
  
  // ---- СПЕЦИАЛЬНЫЕ ДЕТАЛИ ДЛЯ КАЖДОГО БОССА ----
  
  // 1. ЛЕСНОЙ ВЕЛИКАН — дубина
  if (id === 'forest_giant') {
    const clubMat = new THREE.MeshLambertMaterial({ color: 0x4A2A1A });
    const club = new THREE.Mesh(new THREE.BoxGeometry(0.2, size * 0.8, 0.2), clubMat);
    club.position.set(size * 1.0, size * 0.5, 0);
    g.add(club);
    const headClub = new THREE.Mesh(new THREE.BoxGeometry(size * 0.4, size * 0.25, size * 0.4), clubMat);
    headClub.position.set(size * 1.0, size * 0.9, 0);
    g.add(headClub);
  }
  
  // 2. КАМЕННЫЙ ГОЛЕМ — молот
  if (id === 'stone_golem') {
    const hammerMat = new THREE.MeshLambertMaterial({ color: 0x8B8B8B });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, size * 0.7, 0.15), hammerMat);
    handle.position.set(size * 1.1, size * 0.5, 0);
    g.add(handle);
    const headHammer = new THREE.Mesh(new THREE.BoxGeometry(size * 0.6, size * 0.3, size * 0.6), hammerMat);
    headHammer.position.set(size * 1.1, size * 0.9, 0);
    g.add(headHammer);
  }
  
  // 3. ЛЕДЯНОЙ ДРАКОН — крылья
  if (id === 'ice_dragon') {
    const wingMat = new THREE.MeshLambertMaterial({ color: 0xAAEEFF, transparent: true, opacity: 0.6 });
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(size * 1.0, 0.05, size * 0.6), wingMat);
      wing.position.set(side * size * 0.9, size * 0.7, 0);
      wing.rotation.z = side * 0.5;
      wing.rotation.x = 0.3;
      g.add(wing);
    }
  }
  
  // 4. ПАУЧИХА — дополнительные ноги
  if (id === 'spider_queen') {
    const legMat2 = new THREE.MeshLambertMaterial({ color: 0x3A1A4A });
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(size * 0.5, 0.04, 0.04), legMat2);
        leg.position.set(side * size * 0.7, size * 0.3 + i * 0.15, size * 0.1);
        leg.rotation.z = side * 0.4 + i * 0.05;
        g.add(leg);
      }
    }
  }
  
  // 5. НЕКРОМАНТ — посох
  if (id === 'necromancer') {
    const staffMat = new THREE.MeshLambertMaterial({ color: 0x2A1A3A });
    const staff = new THREE.Mesh(new THREE.BoxGeometry(0.06, size * 0.9, 0.06), staffMat);
    staff.position.set(size * 0.7, size * 0.7, 0);
    g.add(staff);
    const topStaff = new THREE.Mesh(new THREE.SphereGeometry(size * 0.08, 8, 8), 
      new THREE.MeshLambertMaterial({ color: 0x9B59B6, emissive: 0x9B59B6, emissiveIntensity: 0.3 }));
    topStaff.position.set(size * 0.7, size * 1.15, 0);
    g.add(topStaff);
  }
  
  // 6. ОГНЕННЫЙ ЭЛЕМЕНТАЛЬ — светящийся шар
  if (id === 'fire_elemental') {
    const glowMat = new THREE.MeshLambertMaterial({ color: 0xFF6633, emissive: 0xFF4400, emissiveIntensity: 0.5 });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(size * 0.3, 8, 8), glowMat);
    glow.position.set(0, size * 1.2, 0);
    g.add(glow);
  }
  
  // 7. ТЁМНЫЙ РЫЦАРЬ — меч
  if (id === 'dark_knight') {
    const swordMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, size * 0.6, 0.06), swordMat);
    blade.position.set(size * 0.6, size * 0.8, 0);
    g.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(size * 0.3, 0.04, 0.08), swordMat);
    guard.position.set(size * 0.6, size * 0.5, 0);
    g.add(guard);
  }
  
  // 8. КРАКЕН — щупальца
  if (id === 'kraken') {
    const tentMat = new THREE.MeshLambertMaterial({ color: 0x3A5A7A });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, size * 0.6, 6), tentMat);
      tent.position.set(Math.cos(angle) * size * 0.6, size * 0.2, Math.sin(angle) * size * 0.6);
      tent.rotation.z = Math.cos(angle) * 0.3;
      tent.rotation.x = Math.sin(angle) * 0.3;
      g.add(tent);
    }
  }
  
  // 9. КОРОЛЬ ГОБЛИНОВ — корона
  if (id === 'goblin_king') {
    const crownMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(size * 0.5, size * 0.15, size * 0.4), crownMat);
    crown.position.y = size * 1.2;
    g.add(crown);
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, size * 0.15, 4), crownMat);
      spike.position.set((i - 1) * size * 0.18, size * 1.3, 0);
      g.add(spike);
    }
  }
  
  // 10. ЛЕДЯНОЙ ТРОЛЛЬ — ледяная дубина
  if (id === 'ice_troll') {
    const iceMat = new THREE.MeshLambertMaterial({ color: 0xAAEEFF, transparent: true, opacity: 0.7 });
    const club = new THREE.Mesh(new THREE.BoxGeometry(0.2, size * 0.5, 0.2), iceMat);
    club.position.set(size * 0.7, size * 0.4, 0);
    g.add(club);
    const headClub2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.4, size * 0.3, size * 0.4), iceMat);
    headClub2.position.set(size * 0.7, size * 0.7, 0);
    g.add(headClub2);
  }
  
  // ---- РУКИ ДЛЯ АНИМАЦИИ ----
  const armMat2 = new THREE.MeshLambertMaterial({ color: color });
  const armL2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.2, size * 0.5, size * 0.2), armMat2);
  armL2.position.set(-size * 0.7, size * 0.5, 0);
  g.add(armL2);
  const armR2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.2, size * 0.5, size * 0.2), armMat2);
  armR2.position.set(size * 0.7, size * 0.5, 0);
  g.add(armR2);
  
  // ---- НОГИ ----
  const legMat2 = new THREE.MeshLambertMaterial({ color: color });
  const legL2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.25, size * 0.3, size * 0.25), legMat2);
  legL2.position.set(-size * 0.25, size * 0.15, 0);
  g.add(legL2);
  const legR2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.25, size * 0.3, size * 0.25), legMat2);
  legR2.position.set(size * 0.25, size * 0.15, 0);
  g.add(legR2);
  
  g.scale.set(1, 1, 1);
  g.add(makeNameTag(bossData.name));
  
  return { 
    group: g, 
    armL: armL2, 
    armR: armR2, 
    legL: legL2, 
    legR: legR2, 
    head: head 
  };
}

// ============================================================
//  🎮 СОЗДАНИЕ МОНСТРОВ
// ============================================================

function spawnMob(type, x, y, z) {
    const mob = window.spawnMob(type, x, y, z); // mobs_integration.js
    mob.ai = createAIForMob(mob); // ai_mobs.js
    return mob;
}
// ============================================================
//  🏙️ ЗАПРЕТНЫЕ ЗОНЫ
// ============================================================

const FORBIDDEN_ZONES = [
  { x: 0, z: 0, radius: 25 },
  { x: -18, z: -14, radius: 25 }, { x: 22, z: 18, radius: 25 },
  { x: 65, z: 45, radius: 20 }, { x: 95, z: 75, radius: 20 },
  { x: -75, z: -55, radius: 20 }, { x: -45, z: -25, radius: 20 },
  { x: -95, z: 95, radius: 20 }, { x: -65, z: 125, radius: 20 },
  { x: 105, z: -115, radius: 20 }, { x: 135, z: -85, radius: 20 },
  { x: 88, z: 66, radius: 25 }, { x: 122, z: 96, radius: 25 },
  { x: -150, z: -100, radius: 25 }, { x: -116, z: -72, radius: 25 },
  { x: -100, z: -80, radius: 35 },
  { x: -100, z: 0, radius: 30 },
];

function canSpawnAt(x, z) {
  if (Math.hypot(x, z) < 15) return false;
  for (const zone of FORBIDDEN_ZONES) {
    if (Math.hypot(x - zone.x, z - zone.z) < zone.radius) return false;
  }
  if (inAnyVillage(x, z, 10)) return false;
  return true;
}

// ============================================================
//  🚀 ИНИЦИАЛИЗАЦИЯ ВСЕХ МОНСТРОВ
// ============================================================

export function initMobs(gameContext) {
  G = gameContext;
  
  // ---- 100 ОБЫЧНЫХ МОНСТРОВ ----
  const monsterTypes = ['goblin', 'spider', 'orc', 'skeleton', 'wolf', 'troll', 'ghost', 'slime', 'bat', 'zombie'];
  let spawned = 0;
  let attempts = 0;
  
  while (spawned < 100 && attempts < 5000) {
    attempts++;
    const type = monsterTypes[spawned % monsterTypes.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 70;
    const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
    const z = Math.sin(angle) * dist + (Math.random() - 0.5) * 20;
    
    if (canSpawnAt(x, z)) {
      spawnMob(type, x, z);
      spawned++;
    }
  }
  console.log(`👹 ${spawned} обычных монстров создано!`);

  // ---- 10 БОССОВ (уникальные, разбросанные по карте) ----
  let bossSpawned = 0;
  for (const boss of BOSSES) {
    // Проверяем, что босс не в запретной зоне
    let canSpawn = true;
    for (const zone of FORBIDDEN_ZONES) {
      if (Math.hypot(boss.x - zone.x, boss.z - zone.z) < zone.radius + 15) {
        canSpawn = false;
        break;
      }
    }
    if (Math.hypot(boss.x, boss.z) < 40) canSpawn = false;
    
    if (canSpawn) {
      spawnMob(boss.id, boss.x, boss.z, boss.hp, true, boss);
      bossSpawned++;
      console.log(`👑 ${boss.name} создан! (${boss.x}, ${boss.z})`);
    } else {
      // Если место занято — ищем альтернативу
      let altX, altZ, found = false;
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        altX = Math.cos(angle) * dist;
        altZ = Math.sin(angle) * dist;
        let ok = true;
        for (const zone of FORBIDDEN_ZONES) {
          if (Math.hypot(altX - zone.x, altZ - zone.z) < zone.radius + 15) { ok = false; break; }
        }
        if (ok && Math.hypot(altX, altZ) > 40) { found = true; break; }
      }
      if (found) {
        spawnMob(boss.id, altX, altZ, boss.hp, true, boss);
        bossSpawned++;
        console.log(`👑 ${boss.name} создан! (${altX}, ${altZ})`);
      }
    }
  }
  
  console.log(`👑 ${bossSpawned} боссов создано!`);
  console.log(`✅ Всего монстров: ${MOBS.length}`);
}

// ============================================================
//  ⚔️ АТАКА МОНСТРА
// ============================================================

export function attackMob(m, dmg = weaponDamage(G)) {
  if (!m || m.dead) return;
  m.hp -= dmg;
  m.flashT = 0.18;
  m.angry = true;
  
  const dx = m.x - G.player.x, dz = m.z - G.player.z;
  const d = Math.hypot(dx, dz) || 1;
  m.x += dx / d * 0.7;
  m.z += dz / d * 0.7;
  spawnParticles(m.x, m.feet + 1, m.z, m.kind === 'orc' ? 'leaf' : 'coalOre');
  
  if (m.isBoss) sfx.roar();
  else sfx.squeak();
  
  if (m.hp <= 0) killMob(m);
}

function killMob(m) {
  m.dead = true;
  m.group.visible = false;
  m.respawnT = m.isBoss ? 300 : 60;
  
  const booms = m.isBoss ? 12 : 3;
  for (let i = 0; i < booms; i++) {
    spawnParticles(m.x, m.feet + 0.5 + i * 0.4, m.z, i % 2 ? 'flower' : 'diamondOre');
  }
  
  G.inv[m.drop] = (G.inv[m.drop] || 0) + m.dropN;
  updateInvUI();
  
  const msg = m.isBoss
    ? `👑 ${m.name} ПОВЕРЖЕН! +${m.dropN} алмазов 💎`
    : `⚔️ ${m.name} побеждён! +${m.dropN} ${NAMES[m.drop].toLowerCase()}`;
  showToast(msg);
  sfx.quest();
  
  emit('mobkill', m.kind);
  if (m.isBoss) emit('bosskill', m.kind);
  emit('xp', m.isBoss ? 100 : 3);
}

// ============================================================
//  🏹 СТРЕЛЫ
// ============================================================

export function shootArrow(m) {
  const p = G.player;
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x8B5A2B })
  );
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.18, 6),
    new THREE.MeshLambertMaterial({ color: 0xDDDDDD })
  );
  tip.rotation.x = Math.PI / 2;
  tip.position.z = -0.42;
  g.add(shaft, tip);
  g.position.set(p.x, p.feet + 1.4, p.z);
  G.scene.add(g);
  ARROWS.push({ g, target: m, life: 2.5 });
  sfx.shoot();
  spawnParticles(p.x, p.feet + 1.4, p.z, 'leaf');
}

function updateArrows(dt) {
  for (let i = ARROWS.length - 1; i >= 0; i--) {
    const a = ARROWS[i];
    a.life -= dt;
    const m = a.target;
    if (a.life <= 0 || !m || m.dead) {
      G.scene.remove(a.g);
      ARROWS.splice(i, 1);
      continue;
    }
    const tx = m.x - a.g.position.x;
    const ty = (m.feet + 1) - a.g.position.y;
    const tz = m.z - a.g.position.z;
    const d = Math.hypot(tx, ty, tz);
    if (d < 0.7) {
      attackMob(m, 2 + skillRank(G, 'bow'));
      emit('bowHit');
      spawnParticles(m.x, m.feet + 1, m.z, 'goldOre');
      G.scene.remove(a.g);
      ARROWS.splice(i, 1);
      continue;
    }
    const sp = 20 * dt / d;
    a.g.position.x += tx * sp;
    a.g.position.y += ty * sp;
    a.g.position.z += tz * sp;
    a.g.rotation.y = Math.atan2(-tx, -tz);
  }
}

// ============================================================
//  🔄 ОБНОВЛЕНИЕ МОНСТРОВ
// ============================================================

function turnTo(cur, want, k) {
  let d = want - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * Math.min(1, k);
}

function mobCan(m, nx, nz) {
  const bx = Math.floor(nx), bz = Math.floor(nz);
  const g = groundHeight(bx, bz, m.feet + 1.2);
  return g <= m.feet + 1.2 &&
    !solidAt(bx, Math.floor(g + 0.5), bz) &&
    !solidAt(bx, Math.floor(g + 1.5), bz);
}

export function updateMobs(dt) {
  updateArrows(dt);
  const p = G.player;
  
  for (const m of MOBS) {
    if (m.dead) {
      m.respawnT -= dt;
      if (m.respawnT <= 0 && Math.hypot(p.x - m.home.x, p.z - m.home.z) > 25) {
        m.dead = false;
        m.hp = m.maxHp;
        m.x = m.home.x;
        m.z = m.home.z;
        m.angry = false;
        m.growled = false;
        m.group.visible = true;
        spawnParticles(m.x, m.feet + 1, m.z, 'coalOre');
        // Восстанавливаем HP-бар
        if (m.hpBarCtx) {
          m.hpBarCtx.fillStyle = '#44FF44';
          m.hpBarCtx.fillRect(2, 2, 124, 12);
          m.hpBarTexture.needsUpdate = true;
        }
      }
      continue;
    }
    
    // Обновляем HP-бар
    updateHPBar(m);
    
    m.coolT -= dt;
    m.swingT -= dt;
    m.flashT -= dt;
    
    if (m.hitT !== undefined && m.swingT <= m.hitT) {
      m.hitT = undefined;
      const dd = Math.hypot(p.x - m.x, p.z - m.z);
      if (dd < m.reach * 1.3 && Math.abs(p.feet - m.feet) < 3 && G.hp > 0) {
        damage(Math.max(1, m.dmg - armorValue(G)), m.hitMsg);
        spawnParticles(p.x, p.feet + 1.2, p.z, 'coalOre');
      }
    }
    
    if (m.mat !== false) {
      const flash = m.flashT > 0;
      if (flash !== m.flashed) {
        m.flashed = flash;
        m.group.traverse(o => {
          if (o.material && o.material.emissive) {
            o.material.emissive.setHex(flash ? 0xAA2222 : 0x000000);
          }
        });
      }
    }
    
    const dx = p.x - m.x, dz = p.z - m.z;
    const dist = Math.hypot(dx, dz);
    const farFromHome = Math.hypot(m.x - m.home.x, m.z - m.home.z) > 35;
    const seesPlayer = (dist < m.aggro || m.angry) &&
      Math.abs(p.feet - m.feet) < 3.5 && G.hp > 0;
    
    let walking = false;
    if (seesPlayer && !farFromHome) {
      if (!m.growled) {
        m.growled = true;
        if (m.kind === 'goblin' || m.kind === 'spider') sfx.squeak();
        else sfx.roar();
      }
      m.group.rotation.y = turnTo(m.group.rotation.y, Math.atan2(-dx, -dz), dt * 9);
      if (dist > m.reach * 0.85) {
        m.speedCur = Math.min(m.speed, (m.speedCur || 0) + dt * 7);
        const nx = m.x + dx / dist * m.speedCur * dt;
        const nz = m.z + dz / dist * m.speedCur * dt;
        if (mobCan(m, nx, nz)) { m.x = nx; m.z = nz; }
        walking = true;
      } else {
        m.speedCur = 0;
        if (m.coolT <= 0) {
          m.coolT = m.cool;
          m.swingT = 0.45;
          m.hitT = 0.45 - 0.28;
        }
      }
    } else {
      m.growled = false;
      if (m.angry && dist > 20) m.angry = false;
      const wx = m.tx - m.x, wz = m.tz - m.z;
      const wdist = Math.hypot(wx, wz);
      if (m.wait > 0) {
        m.wait -= dt;
        m.speedCur = Math.max(0, (m.speedCur || 0) - dt * 6);
      } else if (wdist > 0.3) {
        m.speedCur = Math.min(m.speed * 0.5, (m.speedCur || 0) + dt * 4);
        const nx = m.x + wx / wdist * m.speedCur * dt;
        const nz = m.z + wz / wdist * m.speedCur * dt;
        if (mobCan(m, nx, nz)) {
          m.x = nx; m.z = nz;
          m.group.rotation.y = turnTo(m.group.rotation.y, Math.atan2(-wx, -wz), dt * 6);
          walking = true;
        } else {
          m.tx = m.home.x + Math.random() * 10 - 5;
          m.tz = m.home.z + Math.random() * 10 - 5;
          m.wait = 1;
        }
      } else {
        m.wait = 2 + Math.random() * 5;
        m.tx = m.home.x + Math.random() * 10 - 5;
        m.tz = m.home.z + Math.random() * 10 - 5;
      }
    }
    
    const gy = groundHeight(Math.floor(m.x), Math.floor(m.z));
    if (gy > 0) m.feet += (gy - m.feet) * Math.min(1, dt * 10);
    m.group.position.set(m.x, m.feet, m.z);
    
    if (walking) m.phase += dt * 9;
    const s = walking ? Math.sin(m.phase) * 0.6 : 0;
    if (m.armL && m.armR && m.legL && m.legR) {
      m.legL.rotation.x = s;
      m.legR.rotation.x = -s;
      m.armL.rotation.x = -s;
      if (m.swingT > 0) {
        const t = 1 - m.swingT / 0.45;
        m.armR.rotation.x = t < 0.4
          ? -0.4 - (t / 0.4) * 1.8
          : t < 0.62
            ? -2.2 + ((t - 0.4) / 0.22) * 3.1
            : 0.9 * (1 - (t - 0.62) / 0.38);
      } else m.armR.rotation.x = s;
    }
    
    if (m.head) {
      let want = 0;
      if (dist < 6 && Math.abs(p.feet - m.feet) < 3 && G.hp > 0) {
        want = Math.atan2(-dx, -dz) - m.group.rotation.y;
        while (want > Math.PI) want -= Math.PI * 2;
        while (want < -Math.PI) want += Math.PI * 2;
        want = Math.max(-1, Math.min(1, want));
      }
      m.head.rotation.y += (want - m.head.rotation.y) * Math.min(1, dt * 5);
    }
  }
}

export function mobGroups() {
  return MOBS.filter(m => !m.dead).map(m => m.group);
}
export function getMobs() { return MOBS; }
export function orcSettlement() { return SETTLEMENTS[2]; }
// ============================================================
//  🆕 НОВЫЕ МОНСТРЫ ДЛЯ НЕБЕСНЫХ ГОРОДОВ
// ============================================================

// ---- НЕБЕСНЫЕ МОНСТРЫ ----
const SKY_MONSTERS = [
  { name: 'Облачный дух', x: 190, z: 10, color: 0xE8F0FF, hp: 60, size: 1.2 },
  { name: 'Ветреный элементаль', x: 210, z: -10, color: 0x88CCEE, hp: 50, size: 1.0 },
  { name: 'Световой страж', x: -190, z: 10, color: 0xFFD700, hp: 70, size: 1.3 },
  { name: 'Теневой призрак', x: -210, z: -10, color: 0x6633CC, hp: 65, size: 1.1 }
];

export function spawnSkyMonsters() {
  for (const m of SKY_MONSTERS) {
    const mat = new THREE.MeshLambertMaterial({ 
      color: m.color,
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(m.size, m.size * 1.8, m.size),
      mat
    );
    mesh.position.set(m.x, 32, m.z);
    mesh.userData.isMonster = true;
    mesh.userData.hp = m.hp;
    mesh.userData.maxHp = m.hp;
    mesh.userData.name = m.name;
    G.scene.add(mesh);
    MOBS.push(mesh);
  }
  console.log(`☁️ ${SKY_MONSTERS.length} небесных монстров создано!`);
}