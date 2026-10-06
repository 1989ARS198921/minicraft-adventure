// ============================================================
//  👹 МОНСТРЫ И БОССЫ — 100+ монстров, 10 уникальных боссов
// ============================================================

import { addBlobShadow } from './shadows.js';
import * as THREE from 'three';
import { groundHeight, solidAt, biomeAt, hillH, blockAt } from './world.js';
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
import { giveArtifact, hasArtifact, BOSS_ARTIFACTS } from './artifacts.js';
import { QUEST_SITES } from './quest_locations.js';
import { DUNGEON } from './dungeon.js';
import { scatterCamps } from './scatter.js';
import { lairSpawns } from './lairs.js';

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
    drop: 'goldOre', dropN: 1, name: 'Зомби', hitMsg: '🧟 Зомби ударил!', color: 0x4A6A3A, size: 1.0 },
  vampire: { hp: 55, dmg: 9, speed: 3.0, aggro: 12, reach: 1.6, cool: 1.4,
    drop: 'diamondOre', dropN: 1, name: 'Вампир', hitMsg: '🧛 Вампир укусил!', color: 0x2A0A2A, size: 1.1 }
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
    hitMsg: '🔥 Элементаль обжёк тебя!',
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

// 💀 ФИНАЛЬНЫЙ БОСС — Кащей Бессмертный.
// Не в общем списке: появляется у своего замка только после того,
// как герой принёс ему 6 печатей силы (квест «Легенда»).
const KASCHEY_BOSS = {
  id: 'kaschey',
  name: '💀 Кащей Бессмертный',
  hp: 600, dmg: 32, speed: 2.3, aggro: 30, reach: 4.5, cool: 2.4,
  drop: 'diamondOre', dropN: 20,
  color: 0x1A1025, size: 3.4,
  desc: 'Финальный босс — предатель Кащей',
  hitMsg: '💀 Кащей испепелил тебя!',
  x: -350, z: 300 // центр замка Кащея
};

// Вызывается из main.js по событию 'kascheyFight' (или при загрузке,
// если игрок вышел посреди финальной битвы).
export function spawnKaschey() {
  if (MOBS.some(m => m.kind === 'kaschey' && !m.dead)) return null; // уже на сцене
  const m = spawnMob('kaschey', KASCHEY_BOSS.x, KASCHEY_BOSS.z, KASCHEY_BOSS.hp, true, KASCHEY_BOSS);
  if (m) { m.angry = true; sfx.roar(); }
  return m;
}

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
  const s = bossData.size;
  const id = bossData.id;
  const base = bossData.color;
  const shadeC = (c, f) => new THREE.Color(c).multiplyScalar(f).getHex();
  const mat  = new THREE.MeshLambertMaterial({ color: base });
  const matD = new THREE.MeshLambertMaterial({ color: shadeC(base, 0.55) });
  const matL = new THREE.MeshLambertMaterial({ color: shadeC(base, 1.4) });
  const glow = (c, i = 0.8) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: i });
  const box = (parent, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); parent.add(q); return q;
  };
  const cone = (parent, r, h, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); parent.add(q); return q;
  };
  // Конечность с шарниром СВЕРХУ — красиво шагает и замахивается
  const limb = (w, h, d, m, x, y, z) => {
    const p = new THREE.Group(); p.position.set(x, y, z);
    const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    q.position.y = -h / 2; p.add(q); g.add(p); return p;
  };
  const eyes = (parent, y, z, dx, c, w = 0.1 * s, h = 0.08 * s) => {
    const m = glow(c, 0.9);
    box(parent, w, h, 0.05 * s, m, -dx, y, z);
    box(parent, w, h, 0.05 * s, m, dx, y, z);
  };
  let armL = null, armR = null, legL = null, legR = null, head = null;
  let tagY = s * 1.8;

  if (id === 'forest_giant') { // 🌳 зелёный великан с дубиной
    legL = limb(s * 0.32, s * 0.55, s * 0.36, matD, -s * 0.28, s * 0.55, 0);
    legR = limb(s * 0.32, s * 0.55, s * 0.36, matD, s * 0.28, s * 0.55, 0);
    box(g, s * 1.25, s * 0.9, s * 0.85, mat, 0, s * 1.0, 0);              // торс
    box(g, s * 0.85, s * 0.65, s * 0.12, matL, 0, s * 0.92, s * 0.42);    // живот
    box(g, s * 1.3, s * 0.18, s * 0.9, matD, 0, s * 1.42, 0);             // поясница-кора
    for (const sd of [-1, 1]) box(g, s * 0.42, s * 0.3, s * 0.5, matD, sd * s * 0.62, s * 1.42, 0); // плечи
    armL = limb(s * 0.3, s * 0.9, s * 0.32, mat, -s * 0.82, s * 1.38, 0);
    armR = limb(s * 0.3, s * 0.9, s * 0.32, mat, s * 0.82, s * 1.38, 0);
    const clubM = new THREE.MeshLambertMaterial({ color: 0x5A3A1E });
    box(armR, s * 0.16, s * 0.55, s * 0.16, clubM, 0, -s * 1.1, 0);       // дубина: рукоять
    box(armR, s * 0.4, s * 0.34, s * 0.4, clubM, 0, -s * 1.45, 0);        // дубина: била
    box(armR, s * 0.44, s * 0.1, s * 0.44, matD, 0, -s * 1.3, 0);
    head = new THREE.Group(); head.position.set(0, s * 1.72, 0); g.add(head);
    box(head, s * 0.62, s * 0.55, s * 0.55, mat, 0, 0, 0);
    box(head, s * 0.66, s * 0.14, s * 0.58, matD, 0, s * 0.18, 0);        // брови
    box(head, s * 0.14, s * 0.16, s * 0.12, matL, 0, -s * 0.04, s * 0.3); // нос
    eyes(head, s * 0.06, s * 0.28, s * 0.16, 0xFFCC33);
    const leafM = new THREE.MeshLambertMaterial({ color: 0x4FCB24 });
    box(head, s * 0.5, s * 0.16, s * 0.5, leafM, 0, s * 0.34, 0);         // листва на макушке
    for (const sd of [-1, 1]) box(g, s * 0.3, s * 0.2, s * 0.3, leafM, sd * s * 0.55, s * 1.55, 0); // мох на плечах
    box(g, s * 0.3, s * 0.25, s * 0.14, leafM, 0, s * 1.25, s * 0.43);    // борода-мох
    tagY = s * 2.15;
  }

  else if (id === 'stone_golem') { // 🗿 голем из плит с жарким ядром
    legL = limb(s * 0.36, s * 0.42, s * 0.4, matD, -s * 0.3, s * 0.42, 0);
    legR = limb(s * 0.36, s * 0.42, s * 0.4, matD, s * 0.3, s * 0.42, 0);
    box(g, s * 1.35, s * 0.45, s * 0.9, mat, 0, s * 0.65, 0);             // плита 1
    box(g, s * 1.18, s * 0.4, s * 0.84, matL, 0, s * 1.06, 0);            // плита 2
    box(g, s * 1.0, s * 0.34, s * 0.78, mat, 0, s * 1.42, 0);             // плита 3
    box(g, s * 0.3, s * 0.3, s * 0.1, glow(0xFF8833, 1), 0, s * 1.05, s * 0.44); // 🔥 ядро
    box(g, s * 0.36, s * 0.36, s * 0.04, matD, 0, s * 1.05, s * 0.42);    // рамка ядра
    box(g, s * 0.5, s * 0.06, s * 0.02, matD, -s * 0.3, s * 0.85, s * 0.46, 0, 0, 0.5);  // трещины
    box(g, s * 0.4, s * 0.06, s * 0.02, matD, s * 0.35, s * 1.2, s * 0.43, 0, 0, -0.4);
    const mossM = new THREE.MeshLambertMaterial({ color: 0x4A8A3A });
    box(g, s * 0.3, s * 0.14, s * 0.3, mossM, -s * 0.45, s * 1.62, 0);    // мох
    box(g, s * 0.24, s * 0.12, s * 0.24, mossM, s * 0.5, s * 0.9, s * 0.3);
    armL = limb(s * 0.4, s * 0.85, s * 0.42, mat, -s * 0.85, s * 1.35, 0);
    armR = limb(s * 0.4, s * 0.85, s * 0.42, mat, s * 0.85, s * 1.35, 0);
    box(armL, s * 0.46, s * 0.3, s * 0.48, matD, 0, -s * 0.85, 0);        // кулаки
    box(armR, s * 0.46, s * 0.3, s * 0.48, matD, 0, -s * 0.85, 0);
    box(armR, s * 0.14, s * 0.6, s * 0.14, matD, 0, -s * 1.2, 0);         // молот: рукоять
    box(armR, s * 0.6, s * 0.32, s * 0.34, matL, 0, -s * 1.55, 0);        // молот: бойок
    head = new THREE.Group(); head.position.set(0, s * 1.72, 0); g.add(head);
    box(head, s * 0.52, s * 0.42, s * 0.5, mat, 0, 0, 0);
    box(head, s * 0.56, s * 0.1, s * 0.54, matD, 0, s * 0.14, 0);         // надбровие
    eyes(head, 0, s * 0.26, s * 0.13, 0x66EEFF);
    tagY = s * 2.05;
  }

  else if (id === 'ice_dragon') { // ❄️ дракон: морда, рога, крылья, хвост, шипы
    const boneM = new THREE.MeshLambertMaterial({ color: 0xE8F4FF });
    const wingM = new THREE.MeshLambertMaterial({ color: 0xAAEEFF, transparent: true, opacity: 0.65 });
    box(g, s * 0.85, s * 0.65, s * 1.3, mat, 0, s * 0.6, -s * 0.15);      // туловище
    box(g, s * 0.6, s * 0.4, s * 1.1, matL, 0, s * 0.42, -s * 0.15);      // брюхо
    box(g, s * 0.4, s * 0.55, s * 0.4, mat, 0, s * 0.95, s * 0.45, -0.35);// шея
    head = new THREE.Group(); head.position.set(0, s * 1.25, s * 0.62); g.add(head);
    box(head, s * 0.5, s * 0.38, s * 0.5, mat, 0, 0, 0);
    box(head, s * 0.3, s * 0.2, s * 0.4, matL, 0, -s * 0.06, s * 0.4);    // морда
    box(head, s * 0.32, s * 0.06, s * 0.3, matD, 0, -s * 0.16, s * 0.38); // челюсть
    cone(head, s * 0.06, s * 0.3, boneM, -s * 0.14, s * 0.28, -s * 0.1, -0.4); // рога
    cone(head, s * 0.06, s * 0.3, boneM, s * 0.14, s * 0.28, -s * 0.1, -0.4);
    eyes(head, s * 0.06, s * 0.26, s * 0.15, 0x44EEFF);
    for (const sd of [-1, 1]) {                                           // крылья
      const w = new THREE.Group(); w.position.set(sd * s * 0.35, s * 0.85, -s * 0.2); g.add(w);
      box(w, s * 0.9, s * 0.06, s * 0.1, boneM, sd * s * 0.45, s * 0.15, 0, 0, 0, sd * 0.35);
      box(w, s * 0.85, s * 0.03, s * 0.55, wingM, sd * s * 0.48, -s * 0.02, -s * 0.2, 0.15, 0, sd * 0.3);
      box(w, s * 0.5, s * 0.03, s * 0.4, wingM, sd * s * 0.75, -s * 0.12, -s * 0.25, 0.2, 0, sd * 0.45);
    }
    let tx = 0, tz = -s * 0.85, tw = s * 0.4;                             // хвост: 3 звена
    for (let i = 0; i < 3; i++) { box(g, tw, tw * 0.8, s * 0.4, mat, tx, s * 0.5 - i * s * 0.1, tz, 0.2 * i); tz -= s * 0.32; tw *= 0.7; }
    cone(g, s * 0.1, s * 0.3, boneM, 0, s * 0.28, tz + s * 0.1, 1.2);     // стрела на хвосте
    for (let i = 0; i < 4; i++) cone(g, s * 0.07, s * 0.22, boneM, 0, s * (0.95 - i * 0.06), s * (0.1 - i * 0.3), 0); // шипы на спине
    legL = limb(s * 0.28, s * 0.5, s * 0.3, matD, -s * 0.35, s * 0.5, -s * 0.5);  // задние лапы
    legR = limb(s * 0.28, s * 0.5, s * 0.3, matD, s * 0.35, s * 0.5, -s * 0.5);
    armL = limb(s * 0.2, s * 0.42, s * 0.22, mat, -s * 0.32, s * 0.55, s * 0.35); // передние лапы
    armR = limb(s * 0.2, s * 0.42, s * 0.22, mat, s * 0.32, s * 0.55, s * 0.35);
    for (const p of [legL, legR, armL, armR]) box(p, s * 0.16, s * 0.08, s * 0.2, boneM, 0, -s * 0.42, s * 0.05); // когти
    tagY = s * 1.6;
  }

  else if (id === 'spider_queen') { // 🕷️ брюшко, 8 сегментных ног, жвала
    box(g, s * 0.95, s * 0.8, s * 0.95, mat, 0, s * 0.55, -s * 0.6);      // брюшко
    box(g, s * 0.7, s * 0.5, s * 0.7, matD, 0, s * 0.5, -s * 0.68);
    box(g, s * 0.99, s * 0.12, s * 0.5, glow(0xCC44FF, 0.5), 0, s * 0.72, -s * 0.6); // узор
    box(g, s * 0.12, s * 0.5, s * 0.12, matD, 0, s * 0.4, -s * 1.12, 0.5);// пряльные бородавки
    box(g, s * 0.6, s * 0.4, s * 0.5, matD, 0, s * 0.45, s * 0.05);       // головогрудь
    head = new THREE.Group(); head.position.set(0, s * 0.45, s * 0.38); g.add(head);
    box(head, s * 0.45, s * 0.3, s * 0.3, mat, 0, 0, 0);
    eyes(head, s * 0.06, s * 0.16, s * 0.1, 0xFF2222, s * 0.09, s * 0.09);
    eyes(head, -s * 0.05, s * 0.16, s * 0.14, 0xFF2222, s * 0.06, s * 0.06);
    const fangM = new THREE.MeshLambertMaterial({ color: 0xF0E8D8 });
    box(head, s * 0.06, s * 0.18, s * 0.06, fangM, -s * 0.1, -s * 0.18, s * 0.12, 0.4); // жвала
    box(head, s * 0.06, s * 0.18, s * 0.06, fangM, s * 0.1, -s * 0.18, s * 0.12, 0.4);
    const legPivots = [];
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {               // 8 ног
      const p = new THREE.Group(); p.position.set(sd * s * 0.28, s * 0.5, s * 0.25 - i * s * 0.22); g.add(p);
      box(p, s * 0.5, s * 0.07, s * 0.07, matD, sd * s * 0.25, s * 0.12, 0, 0, 0, sd * 0.55);
      box(p, s * 0.06, s * 0.45, s * 0.06, matD, sd * s * 0.48, -s * 0.15, 0, 0, 0, sd * 0.15);
      legPivots.push(p);
    }
    legL = legPivots[2]; legR = legPivots[3]; armL = legPivots[0]; armR = legPivots[1];
    tagY = s * 1.25;
  }

  else if (id === 'necromancer') { // 💀 мантия, капюшон, череп, посох
    const robeM = mat, trimM = glow(0x9B59B6, 0.6), boneM = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });
    box(g, s * 0.95, s * 0.5, s * 0.7, robeM, 0, s * 0.25, 0);            // подол
    box(g, s * 0.75, s * 0.55, s * 0.55, robeM, 0, s * 0.72, 0);          // ряса
    box(g, s * 0.99, s * 0.08, s * 0.74, trimM, 0, s * 0.06, 0);          // светящийся подол
    box(g, s * 0.1, s * 0.6, s * 0.02, trimM, 0, s * 0.6, s * 0.29);      // отделка спереди
    box(g, s * 0.85, s * 0.25, s * 0.65, matD, 0, s * 0.95, 0);           // плечи-накидка
    armL = limb(s * 0.24, s * 0.55, s * 0.26, robeM, -s * 0.45, s * 0.95, 0);
    armR = limb(s * 0.24, s * 0.55, s * 0.26, robeM, s * 0.45, s * 0.95, 0);
    box(armL, s * 0.14, s * 0.12, s * 0.14, boneM, 0, -s * 0.58, 0);      // кисти-кости
    box(armR, s * 0.14, s * 0.12, s * 0.14, boneM, 0, -s * 0.58, 0);
    box(armR, s * 0.08, s * 1.1, s * 0.08, matD, 0, -s * 0.55, s * 0.12); // посох
    box(armR, s * 0.2, s * 0.2, s * 0.2, trimM, 0, s * 0.05, s * 0.12);   // сфера
    cone(armR, s * 0.05, s * 0.18, boneM, -s * 0.1, s * 0.02, s * 0.12, 0, 0, 0.6);
    cone(armR, s * 0.05, s * 0.18, boneM, s * 0.1, s * 0.02, s * 0.12, 0, 0, -0.6);
    head = new THREE.Group(); head.position.set(0, s * 1.18, 0); g.add(head);
    box(head, s * 0.55, s * 0.5, s * 0.55, matD, 0, s * 0.05, -s * 0.03); // капюшон
    box(head, s * 0.6, s * 0.15, s * 0.6, matD, 0, s * 0.3, 0);           // поля капюшона
    box(head, s * 0.36, s * 0.32, s * 0.1, boneM, 0, 0, s * 0.26);        // лицо-череп
    box(head, s * 0.1, s * 0.08, s * 0.06, matD, 0, -s * 0.04, s * 0.3);  // нос-пустота
    eyes(head, s * 0.05, s * 0.3, s * 0.1, 0xBB66FF, s * 0.08, s * 0.07);
    legL = limb(s * 0.2, s * 0.3, s * 0.22, matD, -s * 0.2, s * 0.3, 0);  // под рясой
    legR = limb(s * 0.2, s * 0.3, s * 0.22, matD, s * 0.2, s * 0.3, 0);
    tagY = s * 1.6;
  }

  else if (id === 'fire_elemental') { // 🔥 столб пламени, парящие угли
    const rockM = new THREE.MeshLambertMaterial({ color: 0x2A1A14 });
    const emberM = glow(0xFF4400, 0.7), flameM = glow(0xFF8833, 0.9), coreM = glow(0xFFCC44, 1);
    box(g, s * 0.7, s * 0.4, s * 0.6, rockM, 0, s * 0.2, 0);              // базальт
    box(g, s * 0.6, s * 0.45, s * 0.5, emberM, 0, s * 0.6, 0);            // угли
    box(g, s * 0.48, s * 0.45, s * 0.42, flameM, 0, s * 1.0, 0);          // пламя
    box(g, s * 0.2, s * 0.5, s * 0.06, coreM, 0, s * 0.85, s * 0.22);     // жаркое сердце
    box(g, s * 0.5, s * 0.06, s * 0.02, rockM, -s * 0.12, s * 0.62, s * 0.26, 0, 0, 0.6); // трещины
    armL = limb(s * 0.24, s * 0.6, s * 0.26, emberM, -s * 0.45, s * 1.1, 0);
    armR = limb(s * 0.24, s * 0.6, s * 0.26, emberM, s * 0.45, s * 1.1, 0);
    cone(armL, s * 0.14, s * 0.3, flameM, 0, -s * 0.72, 0);               // руки-факелы
    cone(armR, s * 0.14, s * 0.3, flameM, 0, -s * 0.72, 0);
    head = new THREE.Group(); head.position.set(0, s * 1.32, 0); g.add(head);
    cone(head, s * 0.3, s * 0.55, flameM, 0, s * 0.15, 0);                // голова-пламя
    cone(head, s * 0.18, s * 0.4, coreM, 0, s * 0.22, 0);
    eyes(head, s * 0.02, s * 0.14, s * 0.09, 0xFFFF88, s * 0.07, s * 0.09);
    legL = limb(s * 0.22, s * 0.35, s * 0.24, flameM, -s * 0.18, s * 0.35, 0); // огненные струи
    legR = limb(s * 0.22, s * 0.35, s * 0.24, flameM, s * 0.18, s * 0.35, 0);
    box(g, s * 0.14, s * 0.14, s * 0.14, emberM, -s * 0.6, s * 1.3, s * 0.2, 0.5, 0.3); // парящие угли
    box(g, s * 0.1, s * 0.1, s * 0.1, emberM, s * 0.62, s * 0.9, -s * 0.25, 0.3, 0.6);
    box(g, s * 0.12, s * 0.12, s * 0.12, emberM, s * 0.3, s * 1.55, s * 0.1, 0.7, 0.2);
    tagY = s * 1.6;
  }

  else if (id === 'dark_knight') { // ⚔️ латник: пластрон, наплечники, плащ, меч
    const steelM = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });
    const steelD = new THREE.MeshLambertMaterial({ color: 0x22222E });
    const capeM = new THREE.MeshLambertMaterial({ color: 0x5A0A14 });
    legL = limb(s * 0.26, s * 0.55, s * 0.3, steelM, -s * 0.24, s * 0.55, 0);
    legR = limb(s * 0.26, s * 0.55, s * 0.3, steelM, s * 0.24, s * 0.55, 0);
    box(legL, s * 0.3, s * 0.12, s * 0.38, steelD, 0, -s * 0.52, s * 0.03); // сабатоны
    box(legR, s * 0.3, s * 0.12, s * 0.38, steelD, 0, -s * 0.52, s * 0.03);
    box(g, s * 0.85, s * 0.75, s * 0.55, steelM, 0, s * 0.95, 0);         // кираса
    box(g, s * 0.5, s * 0.5, s * 0.08, steelD, 0, s * 1.0, s * 0.28);     // пластрон
    box(g, s * 0.12, s * 0.12, s * 0.06, glow(0xDD1133, 0.9), 0, s * 1.05, s * 0.32); // рубин
    box(g, s * 0.9, s * 0.12, s * 0.6, steelD, 0, s * 0.6, 0);            // пояс
    box(g, s * 0.7, s * 0.9, s * 0.05, capeM, 0, s * 0.95, -s * 0.32, 0.08); // плащ
    for (const sd of [-1, 1]) {                                            // наплечники с шипами
      box(g, s * 0.4, s * 0.3, s * 0.45, steelD, sd * s * 0.55, s * 1.32, 0);
      cone(g, s * 0.07, s * 0.22, steelM, sd * s * 0.55, s * 1.55, 0);
    }
    armL = limb(s * 0.22, s * 0.65, s * 0.26, steelM, -s * 0.6, s * 1.28, 0);
    armR = limb(s * 0.22, s * 0.65, s * 0.26, steelM, s * 0.6, s * 1.28, 0);
    box(armR, s * 0.1, s * 0.25, s * 0.1, steelD, 0, -s * 0.7, 0);        // рукоять
    box(armR, s * 0.4, s * 0.08, s * 0.12, steelD, 0, -s * 0.85, 0);      // гарда
    box(armR, s * 0.16, s * 0.9, s * 0.05, new THREE.MeshLambertMaterial({ color: 0xAAB4C8 }), 0, -s * 1.35, 0); // клинок
    box(armR, s * 0.04, s * 0.9, s * 0.06, glow(0xDD1133, 0.4), 0, -s * 1.35, 0); // кровавый дол
    head = new THREE.Group(); head.position.set(0, s * 1.52, 0); g.add(head);
    box(head, s * 0.48, s * 0.48, s * 0.48, steelM, 0, 0, 0);             // шлем
    box(head, s * 0.4, s * 0.08, s * 0.06, steelD, 0, s * 0.02, s * 0.24);// прорезь
    eyes(head, s * 0.02, s * 0.26, s * 0.1, 0xFF2233, s * 0.08, s * 0.04);
    box(head, s * 0.52, s * 0.1, s * 0.52, steelD, 0, s * 0.26, 0);       // гребень-основа
    box(head, s * 0.08, s * 0.3, s * 0.4, capeM, 0, s * 0.42, -s * 0.02); // плюмаж
    tagY = s * 1.95;
  }

  else if (id === 'kraken') { // 🐙 купол, клюв, 8 двухсегментных щупалец
    box(g, s * 0.75, s * 0.7, s * 0.75, mat, 0, s * 0.95, 0);             // мантия
    box(g, s * 0.55, s * 0.4, s * 0.55, matL, 0, s * 1.45, 0);            // купол
    box(g, s * 0.6, s * 0.15, s * 0.6, matD, 0, s * 0.62, 0);             // воротник
    box(g, s * 0.2, s * 0.12, s * 0.14, matL, -s * 0.2, s * 1.3, s * 0.3);// пятна
    box(g, s * 0.14, s * 0.1, s * 0.12, matL, s * 0.22, s * 1.1, s * 0.32);
    head = new THREE.Group(); head.position.set(0, s * 0.95, 0); g.add(head);
    box(head, s * 0.16, s * 0.22, s * 0.16, new THREE.MeshLambertMaterial({ color: 0x1A2A3A }), 0, -s * 0.28, s * 0.36); // клюв
    for (const sd of [-1, 1]) {                                            // глаза по бокам
      box(head, s * 0.16, s * 0.2, s * 0.06, glow(0xFFDD44, 0.8), sd * s * 0.3, s * 0.05, s * 0.28);
      box(head, s * 0.22, s * 0.06, s * 0.08, matD, sd * s * 0.3, s * 0.18, s * 0.28);
    }
    const tentPivots = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = new THREE.Group(); p.position.set(Math.cos(a) * s * 0.32, s * 0.6, Math.sin(a) * s * 0.32); g.add(p);
      const dx = Math.cos(a), dz = Math.sin(a);
      box(p, s * 0.16, s * 0.14, s * 0.5, mat, dx * s * 0.22, 0, dz * s * 0.22, 0, -a + Math.PI / 2, 0); // верхний сегмент
      box(p, s * 0.13, s * 0.5, s * 0.13, matD, dx * s * 0.42, -s * 0.25, dz * s * 0.42, 0, 0, dx * 0.15); // нижний
      cone(p, s * 0.06, s * 0.18, matL, dx * s * 0.44, -s * 0.55, dz * s * 0.44, Math.PI); // присоска-кончик
      tentPivots.push(p);
    }
    legL = tentPivots[6]; legR = tentPivots[2]; armL = tentPivots[5]; armR = tentPivots[3];
    tagY = s * 1.55;
  }

  else if (id === 'goblin_king') { // 👑 уши, нос, корона с рубином, скипетр
    const skinM = mat, pantM = new THREE.MeshLambertMaterial({ color: 0x3A2A1A });
    const goldM = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.25 });
    const capeM = new THREE.MeshLambertMaterial({ color: 0x8A1428 });
    legL = limb(s * 0.2, s * 0.35, s * 0.22, pantM, -s * 0.18, s * 0.35, 0);
    legR = limb(s * 0.2, s * 0.35, s * 0.22, pantM, s * 0.18, s * 0.35, 0);
    box(legL, s * 0.22, s * 0.1, s * 0.3, pantM, 0, -s * 0.32, s * 0.04);
    box(legR, s * 0.22, s * 0.1, s * 0.3, pantM, 0, -s * 0.32, s * 0.04);
    box(g, s * 0.7, s * 0.55, s * 0.5, skinM, 0, s * 0.62, 0);            // пузо
    box(g, s * 0.74, s * 0.3, s * 0.54, capeM, 0, s * 0.82, 0);           // мантия-верх
    box(g, s * 0.74, s * 0.12, s * 0.54, goldM, 0, s * 0.42, 0);          // золотой пояс
    box(g, s * 0.5, s * 0.7, s * 0.05, capeM, 0, s * 0.65, -s * 0.28, 0.06); // плащ
    armL = limb(s * 0.17, s * 0.45, s * 0.19, skinM, -s * 0.42, s * 0.85, 0);
    armR = limb(s * 0.17, s * 0.45, s * 0.19, skinM, s * 0.42, s * 0.85, 0);
    box(armR, s * 0.07, s * 0.6, s * 0.07, goldM, 0, -s * 0.6, s * 0.05); // скипетр
    box(armR, s * 0.16, s * 0.16, s * 0.16, glow(0xDD1133, 0.7), 0, -s * 0.28, s * 0.05); // рубин
    head = new THREE.Group(); head.position.set(0, s * 1.18, 0); g.add(head);
    box(head, s * 0.58, s * 0.5, s * 0.52, skinM, 0, 0, 0);
    box(head, s * 0.14, s * 0.12, s * 0.2, matL, 0, -s * 0.05, s * 0.32); // нос
    box(head, s * 0.2, s * 0.24, s * 0.06, skinM, -s * 0.36, s * 0.05, 0, 0, 0, 0.5); // уши
    box(head, s * 0.2, s * 0.24, s * 0.06, skinM, s * 0.36, s * 0.05, 0, 0, 0, -0.5);
    box(head, s * 0.2, s * 0.06, s * 0.08, matD, 0, s * 0.14, s * 0.27);  // брови
    eyes(head, s * 0.02, s * 0.27, s * 0.14, 0xFFDD33, s * 0.09, s * 0.06);
    box(head, s * 0.5, s * 0.12, s * 0.46, goldM, 0, s * 0.3, 0);         // корона
    for (let i = 0; i < 5; i++) cone(head, s * 0.05, s * 0.16, goldM, (i - 2) * s * 0.11, s * 0.42, s * 0.1 * (i % 2 ? 1 : -0.6));
    box(head, s * 0.1, s * 0.1, s * 0.06, glow(0xDD1133, 0.8), 0, s * 0.3, s * 0.24); // рубин короны
    tagY = s * 1.75;
  }

  else if (id === 'ice_troll') { // 🧊 мохнатый, клыки, ледяные шипы и дубина
    const furM = new THREE.MeshLambertMaterial({ color: 0xE8F4FF });
    const iceM = new THREE.MeshLambertMaterial({ color: 0xAAEEFF, transparent: true, opacity: 0.75, emissive: 0x66CCFF, emissiveIntensity: 0.2 });
    legL = limb(s * 0.3, s * 0.5, s * 0.34, matD, -s * 0.28, s * 0.5, 0);
    legR = limb(s * 0.3, s * 0.5, s * 0.34, matD, s * 0.28, s * 0.5, 0);
    box(g, s * 1.15, s * 0.85, s * 0.8, mat, 0, s * 0.92, 0);             // туловище
    box(g, s * 0.8, s * 0.6, s * 0.12, furM, 0, s * 0.85, s * 0.4);       // мех на груди
    for (const sd of [-1, 1]) box(g, s * 0.4, s * 0.24, s * 0.45, furM, sd * s * 0.55, s * 1.32, 0); // меховые плечи
    cone(g, s * 0.09, s * 0.3, iceM, -s * 0.25, s * 1.45, -s * 0.3, -0.5);// ледяные шипы
    cone(g, s * 0.11, s * 0.38, iceM, 0, s * 1.5, -s * 0.32, -0.5);
    cone(g, s * 0.09, s * 0.3, iceM, s * 0.25, s * 1.45, -s * 0.3, -0.5);
    armL = limb(s * 0.3, s * 0.85, s * 0.32, mat, -s * 0.72, s * 1.28, 0);
    armR = limb(s * 0.3, s * 0.85, s * 0.32, mat, s * 0.72, s * 1.28, 0);
    box(armL, s * 0.34, s * 0.2, s * 0.36, furM, 0, -s * 0.78, 0);        // меховые кулаки
    box(armR, s * 0.34, s * 0.2, s * 0.36, furM, 0, -s * 0.78, 0);
    box(armR, s * 0.18, s * 0.5, s * 0.18, iceM, 0, -s * 1.1, 0);         // ледяная дубина
    box(armR, s * 0.42, s * 0.36, s * 0.42, iceM, 0, -s * 1.45, 0);
    cone(armR, s * 0.07, s * 0.2, iceM, s * 0.15, -s * 1.68, 0, Math.PI); // сосульки
    cone(armR, s * 0.07, s * 0.2, iceM, -s * 0.12, -s * 1.68, s * 0.1, Math.PI);
    head = new THREE.Group(); head.position.set(0, s * 1.52, 0); g.add(head);
    box(head, s * 0.55, s * 0.5, s * 0.5, mat, 0, 0, 0);
    box(head, s * 0.59, s * 0.16, s * 0.53, furM, 0, s * 0.24, 0);        // меховая шапка
    box(head, s * 0.5, s * 0.12, s * 0.08, matD, 0, s * 0.1, s * 0.24);   // бровь
    cone(head, s * 0.06, s * 0.2, furM, -s * 0.16, -s * 0.2, s * 0.24, 0.5); // клыки вверх
    cone(head, s * 0.06, s * 0.2, furM, s * 0.16, -s * 0.2, s * 0.24, 0.5);
    box(head, s * 0.12, s * 0.14, s * 0.1, matL, 0, -s * 0.02, s * 0.27); // нос
    eyes(head, s * 0.04, s * 0.26, s * 0.15, 0xCCFFFF);
    tagY = s * 1.95;
  }

  else if (id === 'kaschey') { // 💀 финальный босс: тёмный владыка с косой
    const boneM = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });
    const robeM = new THREE.MeshLambertMaterial({ color: 0x2A1A3A });
    const trimM = glow(0x8AFF5A, 0.8); // ядовито-зелёное свечение
    legL = limb(s * 0.22, s * 0.4, s * 0.24, matD, -s * 0.2, s * 0.4, 0);
    legR = limb(s * 0.22, s * 0.4, s * 0.24, matD, s * 0.2, s * 0.4, 0);
    box(g, s * 0.9, s * 0.45, s * 0.65, mat, 0, s * 0.42, 0);             // подол робы
    box(g, s * 0.94, s * 0.08, s * 0.69, trimM, 0, s * 0.2, 0);           // светящийся край
    box(g, s * 0.7, s * 0.6, s * 0.5, robeM, 0, s * 0.95, 0);             // ряса
    for (let i = 0; i < 3; i++) box(g, s * 0.5, s * 0.05, s * 0.04, boneM, 0, s * (0.82 + i * 0.14), s * 0.26); // рёбра
    box(g, s * 0.85, s * 0.2, s * 0.6, mat, 0, s * 1.22, 0);              // плечи
    for (const sd of [-1, 1]) cone(g, s * 0.08, s * 0.3, boneM, sd * s * 0.42, s * 1.42, 0, 0, 0, -sd * 0.5); // костяные шипы
    armL = limb(s * 0.2, s * 0.55, s * 0.22, robeM, -s * 0.45, s * 1.2, 0);
    armR = limb(s * 0.2, s * 0.55, s * 0.22, robeM, s * 0.45, s * 1.2, 0);
    box(armL, s * 0.14, s * 0.14, s * 0.14, boneM, 0, -s * 0.6, 0);       // кисти-скелет
    box(armR, s * 0.14, s * 0.14, s * 0.14, boneM, 0, -s * 0.6, 0);
    box(armR, s * 0.07, s * 1.3, s * 0.07, matD, 0, -s * 0.7, s * 0.1);   // коса: древко
    box(armR, s * 0.55, s * 0.1, s * 0.04, new THREE.MeshLambertMaterial({ color: 0xC8D8E8 }), s * 0.26, -s * 1.32, s * 0.1); // лезвие
    box(armR, s * 0.55, s * 0.03, s * 0.05, trimM, s * 0.26, -s * 1.36, s * 0.1); // светящаяся кромка
    head = new THREE.Group(); head.position.set(0, s * 1.5, 0); g.add(head);
    box(head, s * 0.5, s * 0.45, s * 0.45, boneM, 0, 0, 0);               // череп
    box(head, s * 0.3, s * 0.12, s * 0.1, matD, 0, -s * 0.24, s * 0.2);   // челюсть
    eyes(head, s * 0.05, s * 0.24, s * 0.12, 0x8AFF5A, s * 0.1, s * 0.1); // зелёные глаза
    box(head, s * 0.56, s * 0.1, s * 0.5, mat, 0, s * 0.26, 0);           // корона-основа
    for (let i = 0; i < 3; i++) cone(head, s * 0.05, s * 0.22, trimM, (i - 1) * s * 0.16, s * 0.4, 0); // зубцы
    box(g, s * 0.8, s * 1.0, s * 0.06, mat, 0, s * 0.85, -s * 0.3, 0.06); // плащ-тьма
    tagY = s * 1.85;
  }

  const tag = makeNameTag(bossData.name);
  tag.position.y = tagY;
  tag.scale.set(s * 0.65, s * 0.165, 1); // табличка в масштабе босса
  g.add(tag);

  return { group: g, armL, armR, legL, legR, head };
}

// ============================================================
//  🎮 СОЗДАНИЕ МОНСТРОВ
// ============================================================

// Гуманоидные монстры получают СКИНЫ — как жители городов:
// рисованное лицо, одежда, причёска + руки/ноги с суставами для анимации.
const SKINNED_KINDS = {
  orc:      { skin: '#6A9A4A', hair: '#1A1A1A', eye: '#C03030', shirt: '#5A4A38', pants: '#3A2E22', shoes: '#2A2018', style: 'orc' },
  goblin:   { skin: '#7AB84A', hair: '#223311', eye: '#FFD030', shirt: '#4A3A28', pants: '#33301E', shoes: '#241F12', style: 'goblin' },
  troll:    { skin: '#8FA08A', hair: '#4A4438', eye: '#FFCC33', shirt: '#6B6154', pants: '#4E463C', shoes: '#37312A', style: 'troll' },
  zombie:   { skin: '#6A8A5A', hair: '#2E3A26', eye: '#88FF88', shirt: '#3E4A6B', pants: '#4A3E32', shoes: '#2A241C', style: 'zombie' },
  skeleton: { skin: '#E8E0D0', hair: '#E8E0D0', eye: '#88FF88', shirt: '#D8D0C0', pants: '#C8C0B0', shoes: '#B0A898', style: 'skeleton' },
  vampire:  { skin: '#E8DDD0', hair: '#0A0A0A', eye: '#FF1A1A', shirt: '#1A0A1A', pants: '#120812', shoes: '#0A050A', style: 'vampire' }
};

// Детальные модели живут в enhanced_mobs.js — глобальная фабрика
// window.createMobModel (классический скрипт). Если она недоступна
// (не загрузилась), используем простые пиксельные модели ниже.
function buildMobModel(kind, boss) {
    const so = SKINNED_KINDS[kind];
    if (so) {
        try {
            const tex = makeSkinTexture(so);
            const fig = classicFigure(tex);
            const sc = (KINDS[kind] ? KINDS[kind].size : 1) * 0.85;
            fig.group.scale.setScalar(sc);
            return fig;
        } catch (e) {
            console.warn('[mobs] скин-модель не собралась для', kind, e);
        }
    }
    if (typeof window !== 'undefined' && typeof window.createMobModel === 'function') {
        try {
            const g = window.createMobModel(kind);
            if (g) return { group: g };
        } catch (e) {
            console.warn('[mobs] createMobModel не сработал для', kind, e);
        }
    }
    return boss ? makeBossModel(boss) : makePixelMob(kind);
}

// Спавн монстра. Два варианта вызова:
//   spawnMob(тип, x, z)                      — обычный монстр
//   spawnMob(босс.id, босс.x, босс.z, hp, true, босс) — босс
// layer: 'surface' | 'cave' | 'sky'; fixedFeet — фиксированная высота ног
function spawnMob(type, x, z, hp, isBoss, bossData, layer, fixedFeet) {
    const boss = (isBoss && bossData) ? bossData : null;
    const src = boss || KINDS[type];
    if (!src) return null;
    const kind = boss ? boss.id : type;
    // 🗺️ Кольца сложности: дальше от центра карты — монстры крепче и злее!
    // Кольцо 1 (0–150): обычные • Кольцо 2 (150–300): ×1.5 • Кольцо 3 (300+): ×2.2
    const ringMul = boss ? 1 : (Math.hypot(x, z) < 150 ? 1 : Math.hypot(x, z) < 300 ? 1.5 : 2.2);
    const built = buildMobModel(kind, boss);
    if (!built || !built.group) return null;

    // Ставим монстра ногами на землю
    const gy = groundHeight(Math.floor(x), Math.floor(z), 60);
    const feet = fixedFeet !== undefined ? fixedFeet : (gy > 0 ? gy : 5);

    const mob = {
        kind: kind,
        name: src.name || kind,
        x: x, z: z, feet: feet,
        layer: layer || 'surface',
        hp: Math.round((hp || src.hp) * ringMul), maxHp: Math.round((hp || src.hp) * ringMul),
        dmg: Math.round(src.dmg * ringMul), reach: src.reach || 1.8, cool: src.cool || 1.2,
        xpMul: ringMul, // опыт за крепкого монстра — больше!
        aggro: src.aggro || 12, speed: src.speed || 2.2, speedCur: 0,
        drop: src.drop || 'goldOre', dropN: src.dropN || 1,
        hitMsg: src.hitMsg || '👹 Монстр ударил!',
        size: src.size || 1, isBoss: !!boss, mat: true,
        group: built.group, armL: built.armL, armR: built.armR,
        legL: built.legL, legR: built.legR, head: built.head,
        home: { x: x, z: z }, tx: x, tz: z, wait: Math.random() * 2,
        phase: Math.random() * 6.28,
        swingT: 0, coolT: 0, flashT: 0, flashed: false,
        angry: false, growled: false, dead: false, respawnT: 0
    };

    built.group.position.set(x, feet, z);
    addBlobShadow(built.group, 0.5 * (src.size || 1)); // 🌑 тень под ногами
    if (G && G.scene) G.scene.add(built.group);
    createHPBar(mob);
    // Луч атаки (actions.js) узнаёт монстра по userData.mob —
    // помечаем модель и все её части (включая HP-бар и табличку)
    built.group.traverse(o => { o.userData.mob = mob; });
    MOBS.push(mob);
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
//  🗺️ РАСПРЕДЕЛЁННЫЙ СПАВН ПО ВСЕЙ КАРТЕ
//  Монстры «живут» как точки плана (PENDING), а модель создаётся
//  только когда игрок подошёл близко — производительность не падает.
// ============================================================

const PENDING = [];           // план спавна: { kind, x, z, layer }
const MAX_ACTIVE = 40;        // максимум одновременно активных монстров
const R_NEAR = 65;            // ближе — материализуем
const R_FAR = 95;             // дальше — возвращаем в план
const R_LAYER = 45;           // радиус материализации в пещерах и небе

// Разнообразие по биомам (и по заданиям: гоблин — в лесу, скелеты — в пустыне/горах)
const BIOME_MOBS = {
  forest:    ['wolf', 'spider', 'goblin', 'goblin', 'slime', 'bat'],
  plains:    ['orc', 'zombie', 'goblin', 'wolf', 'orc'],
  desert:    ['skeleton', 'skeleton', 'zombie', 'bat', 'spider'],
  snow:      ['ghost', 'troll', 'skeleton', 'skeleton', 'wolf'],
  mountains: ['troll', 'orc', 'skeleton', 'bat', 'vampire', 'skeleton']
};
const CAVE_MOBS = ['skeleton', 'zombie', 'spider', 'bat', 'slime', 'ghost', 'vampire'];
const SKY_MOBS  = ['ghost', 'bat', 'ghost', 'bat', 'skeleton', 'slime'];

function planSpawns() {
  // ---- ПОВЕРХНОСТЬ: равномерная СЕТКА по всей карте (±450) ----
  // Один монстр на клетку ~42 блока + небольшой случайный сдвиг:
  // нет ни пустых пустынь, ни скоплений — монстры везде понемногу.
  const STEP = 42;
  for (let gx = -450; gx <= 450; gx += STEP) {
    for (let gz = -450; gz <= 450; gz += STEP) {
      const x = gx + (Math.random() * 2 - 1) * 14;
      const z = gz + (Math.random() * 2 - 1) * 14;
      if (!canSpawnAt(x, z)) continue;
      const table = BIOME_MOBS[biomeAt(x, z)] || BIOME_MOBS.plains;
      PENDING.push({ kind: table[Math.floor(Math.random() * table.length)], x, z, layer: 'surface' });
    }
  }
  // ---- 🏰 СТРАЖА ХОГВАРТСА: призраки у башен, пауки в лесу к западу ----
  // (задания Гарри выполняются прямо у замка!)
  const HG = [
    [250, 212, 'ghost'], [236, 228, 'ghost'], [264, 228, 'ghost'], [250, 248, 'ghost'],
    [228, 230, 'spider'], [220, 240, 'spider'], [226, 218, 'spider'], [234, 250, 'spider'], [212, 244, 'spider'],
  ];
  for (const [x, z, kind] of HG) PENDING.push({ kind, x, z, layer: 'surface' });
  // ---- ⚔️ ЛОГОВА: по 4 стража у каждого (кольцо краёв карты) ----
  for (const s of lairSpawns()) PENDING.push(s);
  // ---- 💀🧹 Сказочные стражи: скелеты Кащея, волки Яги ----
  const FT = [
    [-358, 296, 'skeleton'], [-342, 296, 'skeleton'], [-358, 308, 'skeleton'], [-342, 308, 'skeleton'],
    [-350, 288, 'ghost'], [-350, 312, 'ghost'],
    [344, -254, 'wolf'], [356, -254, 'wolf'], [350, -268, 'wolf'],
  ];
  for (const [x, z, kind] of FT) PENDING.push({ kind, x, z, layer: 'surface' });
  // ---- 🏕️ ЛАГЕРЯ МОНСТРОВ «Живого мира»: группы у находок ----
  const CAMP_MOBS = { orccamp: 'orc', spidernest: 'spider', wolfden: 'wolf' };
  for (const c of scatterCamps()) {
    const kind = CAMP_MOBS[c.kind] || 'orc';
    for (let i = 0; i < 3; i++)
      PENDING.push({ kind, x: c.x + (Math.random() * 2 - 1) * 4, z: c.z + (Math.random() * 2 - 1) * 4, layer: 'surface' });
  }
  // ---- КОЛЬЦО ВОКРУГ СТАРТА: новичок сразу встречает монстров ----
  let ring = 0, guard2 = 0;
  while (ring < 60 && guard2++ < 3000) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * 45;
    const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
    if (!canSpawnAt(x, z)) continue;
    const table = BIOME_MOBS[biomeAt(x, z)] || BIOME_MOBS.plains;
    PENDING.push({ kind: table[ring % table.length], x, z, layer: 'surface' });
    ring++;
  }
  // ---- ПОДЗЕМЕЛЬЕ (пещеры, гроты, руины): появляются, когда игрок внизу ----
  for (let i = 0; i < 160; i++) {
    PENDING.push({ kind: CAVE_MOBS[i % CAVE_MOBS.length],
      x: (Math.random() * 2 - 1) * 400, z: (Math.random() * 2 - 1) * 400, layer: 'cave' });
  }
  // ---- НЕБЕСА (облачные острова): появляются, когда игрок наверху ----
  for (let i = 0; i < 70; i++) {
    PENDING.push({ kind: SKY_MOBS[i % SKY_MOBS.length],
      x: (Math.random() * 2 - 1) * 400, z: (Math.random() * 2 - 1) * 400, layer: 'sky' });
  }
  // ---- КВЕСТОВЫЕ ЛОКАЦИИ: монстры живут именно там, куда посылают задания ----
  for (const site of QUEST_SITES) {
    for (const [kind, n] of site.mobs) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        PENDING.push({ kind, layer: 'surface',
          x: site.x + Math.cos(a) * (3 + (i % 3) * 3),
          z: site.z + Math.sin(a) * (3 + (i % 3) * 3) });
      }
    }
  }
  console.log(`🗺️ Запланировано ${PENDING.length} монстров по всей карте`);
}

// Ищем пол с двумя пустыми клетками сверху (для пещер и небесных островов)
function scanFloor(x, z, yTop, yBottom) {
  const bx = Math.floor(x), bz = Math.floor(z);
  for (let y = yTop; y >= yBottom; y--) {
    if (blockAt(bx, y, bz) && !blockAt(bx, y + 1, bz) && !blockAt(bx, y + 2, bz)) {
      return y + 1;
    }
  }
  return null;
}

// Менеджер близости: материализует ближних, убирает далёких
let manageT = 0;
function manageSpawns(dt) {
  manageT -= dt;
  if (manageT > 0) return;
  manageT = 0.7;
  const p = G.player;

  // Убираем далёких и тех, чей слой игрок покинул
  for (let i = MOBS.length - 1; i >= 0; i--) {
    const m = MOBS[i];
    if (m.isBoss || m.dead) continue;
    const dist = Math.hypot(p.x - m.x, p.z - m.z);
    const wrongLayer = (m.layer === 'cave' && p.feet > 4) ||
                       (m.layer === 'sky' && p.feet < 20);
    if (dist > R_FAR || wrongLayer || (m.layer !== 'surface' && dist > 60)) {
      G.scene.remove(m.group);
      m.hp = m.maxHp; m.angry = false; m.growled = false;
      PENDING.push({ kind: m.kind, x: m.home.x, z: m.home.z, layer: m.layer });
      MOBS.splice(i, 1);
    }
  }

  // Материализуем ближних (не больше MAX_ACTIVE активных)
  let active = MOBS.reduce((n, m) => n + (m.dead ? 0 : 1), 0);
  for (let i = PENDING.length - 1; i >= 0 && active < MAX_ACTIVE; i--) {
    const s = PENDING[i];
    const dist = Math.hypot(p.x - s.x, p.z - s.z);
    let ok = false, feet;
    if (s.layer === 'surface') {
      ok = dist < R_NEAR;
    } else if (s.layer === 'cave') {
      // Пещеры/гроты живут от коренной скалы (-5) до поверхности
      if (p.feet < 3 && dist < R_LAYER) { feet = scanFloor(s.x, s.z, 2, -30); ok = feet !== null; }
    } else if (s.layer === 'sky') {
      // Небесные города на платформах ~30-38, острова — выше
      if (p.feet > 25 && dist < R_LAYER) { feet = scanFloor(s.x, s.z, 100, 28); ok = feet !== null; }
    }
    if (ok) {
      PENDING.splice(i, 1);
      if (spawnMob(s.kind, s.x, s.z, undefined, false, null, s.layer, feet)) active++;
    }
  }
}

// ============================================================
//  🚀 ИНИЦИАЛИЗАЦИЯ ВСЕХ МОНСТРОВ
// ============================================================

export function initMobs(gameContext) {
  G = gameContext;

  // ---- ПЛАН СПАВНА ПО ВСЕЙ КАРТЕ (3 слоя мира) ----
  planSpawns();
  manageSpawns(1); // сразу материализуем тех, кто рядом со стартом

  // ---- 10 БОССОВ: 🟢 В ИГРЕ (Этап 10) ----
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
  emit('mobhit', m.kind); // прокачка навыка «Меч»
  if (hasArtifact(G, 'artiSunIdol')) dmg += 1; // ☀️ Идол солнца
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
  // ✨ Артефакт с босса!
  if (m.isBoss && BOSS_ARTIFACTS[m.kind]) giveArtifact(G, BOSS_ARTIFACTS[m.kind]);
  // 👑 Корона короля гоблинов: +2 очка навыков
  if (m.kind === 'goblin_king') { G.sp = (G.sp || 0) + 2; showToast('👑 Корона короля! +2 очка навыков'); }
  // 🦷 Вампиры иногда роняют клык (артефакт)
  if (m.kind === 'vampire' && Math.random() < 0.15) giveArtifact(G, 'artiVampFang');
  updateInvUI();
  
  const msg = m.isBoss
    ? `👑 ${m.name} ПОВЕРЖЕН! +${m.dropN} алмазов 💎`
    : `⚔️ ${m.name} побеждён! +${m.dropN} ${NAMES[m.drop].toLowerCase()}`;
  showToast(msg);
  sfx.quest();
  
  emit('mobkill', m.kind);
  if (m.isBoss) emit('bosskill', m.kind);
  emit('xp', Math.round((m.isBoss ? 100 : 3) * (m.xpMul || 1)));
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
  manageSpawns(dt); // подгрузка/выгрузка монстров по близости
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
        damage(Math.max(1, m.dmg - armorValue(G) - skillRank(G, 'defense')), m.hitMsg);
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
    const aggroR = hasArtifact(G, 'artiShadowCloak') ? m.aggro * 0.5 : m.aggro; // 🌫️ Плащ теней
    const seesPlayer = (dist < aggroR || m.angry) &&
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
    
    // Высота земли — только для наземных (пещерные и небесные
    // стоят на своём полу, иначе их «вытянет» на поверхность)
    if (!m.layer || m.layer === 'surface') {
      const gy = groundHeight(Math.floor(m.x), Math.floor(m.z), m.feet + 2.5);
      if (gy > 0) m.feet += (gy - m.feet) * Math.min(1, dt * 10);
    }
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
            ? -2.2 + ((t - 0.62) / 0.22) * 3.1
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
export function getPending() { return PENDING; } // для отладки спавна
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
