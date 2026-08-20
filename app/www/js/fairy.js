// ============================================================
//  🦄🦔 СКАЗОЧНЫЕ СУЩЕСТВА И ЖИВОТНЫЕ
//  В нашем мире живут: единорог Радужка, лиса Рыжик, зайчик
//  Пушок, слизень Хлюп, сова Ухта, ёжик Колючка и ночная
//  фея Искорка. С каждым можно по-дружески поиграть!
//  Осторожно: когда дракон пикирует — звери в панике бегут! 🏃
// ============================================================

import * as THREE from 'three';
import { biomeAt, hillH, groundHeight, blockAt } from './world.js';
import { bodyPart } from './playermodel.js';
import { makePatternTexture } from './skins.js';
import { makeNameTag } from './npc.js';
import { showToast, updateInvUI } from './ui.js';
import { sfx } from './audio.js';
import { emit } from './bus.js';
import { spawnParticles } from './particles.js';
import { inAnyVillage } from './village.js';
import { heal } from './health.js';
import { CONFIG } from './config.js';

let G = null;
let unicorn = null, fox = null, rabbit = null, slime = null, owl = null;
let hedgehog = null, spark = null;
const fairies = []; // все существа для «луча зрения»

// (Искорка днём спит и невидима — невидимых тапать нельзя!)
export function fairyGroups() { return fairies.filter(f => f.group.visible).map(f => f.group); }
// Драконы охотятся на этих зверей (пугают, но не обижают!)
export function getPrey() { return [unicorn, fox, rabbit]; }

// ---------- 🛠️ МАЛЕНЬКИЕ ПОМОЩНИКИ СБОРКИ ----------
// Конус-шип (рога, шипы на спине — острые и изящные!)
function spike(r, h, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(r, h, 4),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  return m;
}

// Ищем домик для зверя по кольцам от деревни: нужный биом и высота.
// avoid — список уже занятых мест: не селимся ближе 10 блоков к соседям!
function findHome(test, rMin, rMax, rStep = 6, aStep = 0.5, avoid = []) {
  for (let r = rMin; r <= rMax; r += rStep)
    for (let a = 0; a < 6.28; a += aStep) {
      const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
      if (inAnyVillage(x, z) || !test(x, z)) continue;
      if (avoid.some(h => Math.hypot(x - h.x, z - h.z) < 10)) continue;
      return { x, z };
    }
  return null; // не нашли — возьмём запасное место
}

// 🏃 ПАНИКА! Зверь убегает от пикирующего дракона (scareT секунд).
// Возвращает true, пока бежит в ужасе (тогда обычную прогулку пропускаем).
function fleeStep(a, dt, speed) {
  if (!a.scareT || a.scareT <= 0) return false;
  a.scareT -= dt;
  const dx = a.x - a.scareFrom.x, dz = a.z - a.scareFrom.z;
  const d = Math.hypot(dx, dz) || 1;
  a.x += dx / d * speed * dt;
  a.z += dz / d * speed * dt;
  a.group.rotation.y = Math.atan2(-dx, -dz); // носом прочь от дракона!
  a.phase += dt * 14; // ножки мельтешат от страха
  return true;
}

// Прогулка: идём к цели (tx, tz), дошли — выбираем новую рядом с домом.
// Возвращает true, если зверь сейчас идёт (для анимации ног).
function wanderStep(c, dt, speed, range) {
  const dx = c.tx - c.x, dz = c.tz - c.z;
  const dist = Math.hypot(dx, dz);
  if (c.wait > 0) { c.wait -= dt; return false; } // стоим, осматриваемся
  if (dist > 0.3) {
    c.x += dx / dist * speed * dt;
    c.z += dz / dist * speed * dt;
    c.group.rotation.y = Math.atan2(-dx, -dz); // носом по движению
    c.phase += dt * 8;
    return true;
  }
  c.wait = 2 + Math.random() * 5; // дошли — отдыхаем
  c.tx = c.home.x + Math.random() * range * 2 - range;
  c.tz = c.home.z + Math.random() * range * 2 - range;
  return false;
}

// Плавно встаём на землю (в незагруженных чанках — ждём)
function followGround(c, dt) {
  const gy = groundHeight(Math.floor(c.x), Math.floor(c.z));
  if (gy > 0) c.feet += (gy - c.feet) * Math.min(1, dt * 10);
  c.group.position.set(c.x, c.feet, c.z);
}

// ---------- 🦄 ЕДИНОРОГ ----------
function makeUnicorn() {
  const g = new THREE.Group();
  const white = 0xF8F4FF, pink = 0xFF9FD6;
  const spotTex = makePatternTexture('unicorn'); // 🎀 розовые пятнышки-звёздочки
  const spotted = m => { m.material = new THREE.MeshLambertMaterial({ map: spotTex }); return m; };
  const body = spotted(bodyPart(1.1, 0.55, 0.45, white, 0, 0.85, 0));
  const legs = [];
  for (const [lx, lz] of [[-0.4, -0.15], [0.4, -0.15], [-0.4, 0.15], [0.4, 0.15]]) {
    const leg = bodyPart(0.16, 0.6, 0.16, white, lx, 0.6, lz, -0.3);
    legs.push(leg);
    g.add(leg);
  }
  const neck = spotted(bodyPart(0.28, 0.5, 0.28, white, 0, 1.25, -0.55));
  neck.rotation.x = -0.35;
  const head = spotted(bodyPart(0.34, 0.34, 0.5, white, 0, 1.5, -0.75));
  const horn = spike(0.06, 0.34, 0xFFD75E, 0, 1.82, -0.85); // золотой рог-конус!
  const mane = bodyPart(0.14, 0.6, 0.5, pink, 0, 1.45, -0.42);      // розовая грива
  const tail = bodyPart(0.12, 0.5, 0.12, pink, 0, 0.95, 0.55, 0.25);
  const eyeL = bodyPart(0.06, 0.06, 0.02, 0x222233, -0.1, 1.55, -1.0);
  const eyeR = bodyPart(0.06, 0.06, 0.02, 0x222233,  0.1, 1.55, -1.0);
  const tag = makeNameTag('🦄 Радужка'); tag.scale.set(1.1, 0.28, 1); tag.position.y = 2.3;
  g.add(body, neck, head, horn, mane, tail, eyeL, eyeR, tag);
  return { group: g, legs, tail };
}

// ---------- 🦔 ЁЖИК КОЛЮЧКА ----------
function makeHedgehog() {
  const g = new THREE.Group();
  const body = bodyPart(0.4, 0.3, 0.5, 0x8A6A4A, 0, 0.22, 0); // тельце
  // Иголки! Маленькие тёмные конусы по спинке
  const spikesG = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const sx = (i % 4 - 1.5) * 0.1, sz = (Math.floor(i / 4) - 1) * 0.14;
    spikesG.add(spike(0.05, 0.14, 0x3A2E22, sx, 0.42, sz));
  }
  const nose = bodyPart(0.08, 0.08, 0.12, 0xE8B898, 0, 0.2, -0.3); // розовый носик
  const eyeL = bodyPart(0.04, 0.04, 0.02, 0x222233, -0.08, 0.3, -0.26);
  const eyeR = bodyPart(0.04, 0.04, 0.02, 0x222233,  0.08, 0.3, -0.26);
  const tag = makeNameTag('🦔 Колючка'); tag.scale.set(0.8, 0.2, 1); tag.position.y = 0.9;
  g.add(body, spikesG, nose, eyeL, eyeR, tag);
  return { group: g, spikesG };
}

// ---------- ✨ ИСКОРКА — НОЧНАЯ ФЕЯ ----------
// Светится над цветником Леи, когда стемнеет. Поймаешь —
// окружит живым светом и полечит сердечко!
function makeSpark() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18),
    new THREE.MeshBasicMaterial({ color: 0xFFE98A })); // золотое сердечко
  const halo = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xFFF3C0, transparent: true, opacity: 0.3 }));
  // Крылышки-лепестки, полупрозрачные
  const wingM = new THREE.MeshBasicMaterial({ color: 0xB8E8FF, transparent: true, opacity: 0.6 });
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.14), wingM);
  wingL.position.set(-0.22, 0.06, 0);
  const wingR = wingL.clone();
  wingR.position.x = 0.22;
  const tag = makeNameTag('✨ Искорка'); tag.scale.set(0.8, 0.2, 1); tag.position.y = 0.7;
  g.add(core, halo, wingL, wingR, tag);
  return { group: g, wingL, wingR };
}

// ---------- 🦊 ЛИСА РЫЖИК ----------
function makeFox() {
  const g = new THREE.Group();
  const orange = 0xE8862B, white = 0xFFF3E0, black = 0x3A2A22;
  const body = bodyPart(0.72, 0.3, 0.3, orange, 0, 0.42, 0);
  const head = bodyPart(0.32, 0.3, 0.3, orange, 0, 0.58, -0.48);
  const snout = bodyPart(0.16, 0.12, 0.16, white, 0, 0.52, -0.68); // белая мордочка
  const nose = bodyPart(0.06, 0.05, 0.04, black, 0, 0.56, -0.77);  // нос-пуговка
  const earL = spike(0.08, 0.2, orange, -0.1, 0.8, -0.48); // острые ушки
  const earR = spike(0.08, 0.2, orange,  0.1, 0.8, -0.48);
  const eyeL = bodyPart(0.05, 0.05, 0.02, black, -0.09, 0.63, -0.63);
  const eyeR = bodyPart(0.05, 0.05, 0.02, black,  0.09, 0.63, -0.63);
  const legs = [];
  for (const [lx, lz] of [[-0.26, -0.1], [0.26, -0.1], [-0.26, 0.12], [0.26, 0.12]]) {
    const leg = bodyPart(0.09, 0.3, 0.09, black, lx, 0.3, lz, -0.15); // «чулочки»
    legs.push(leg);
    g.add(leg);
  }
  // Пушистый хвост с белым кончиком (качается целиком)
  const tailG = new THREE.Group();
  const tailB = bodyPart(0.16, 0.16, 0.42, orange, 0, 0, 0.2);
  const tip = bodyPart(0.12, 0.12, 0.12, white, 0, 0, 0.46);
  tailG.add(tailB, tip);
  tailG.position.set(0, 0.45, 0.18);
  const tag = makeNameTag('🦊 Рыжик'); tag.scale.set(0.9, 0.23, 1); tag.position.y = 1.25;
  g.add(body, head, snout, nose, earL, earR, eyeL, eyeR, tailG, tag);
  return { group: g, legs, tail: tailG };
}

// ---------- 🐰 ЗАЙЧИК ПУШОК ----------
function makeRabbit() {
  const g = new THREE.Group();
  const fur = 0xEDEDF2, pink = 0xFFB8C9, dark = 0x333344;
  const body = bodyPart(0.36, 0.3, 0.44, fur, 0, 0.3, 0);
  const head = bodyPart(0.26, 0.26, 0.26, fur, 0, 0.5, -0.32);
  // Длинные ушки — чуть наклонены назад
  const earL = bodyPart(0.07, 0.28, 0.04, fur, -0.07, 0.74, -0.3);
  const earR = bodyPart(0.07, 0.28, 0.04, fur,  0.07, 0.74, -0.3);
  earL.rotation.x = earR.rotation.x = 0.15;
  const innerL = bodyPart(0.03, 0.18, 0.02, pink, -0.07, 0.74, -0.33); // розовая серединка
  const innerR = bodyPart(0.03, 0.18, 0.02, pink,  0.07, 0.74, -0.33);
  innerL.rotation.x = innerR.rotation.x = 0.15;
  const eyeL = bodyPart(0.04, 0.04, 0.02, dark, -0.07, 0.53, -0.45);
  const eyeR = bodyPart(0.04, 0.04, 0.02, dark,  0.07, 0.53, -0.45);
  const nose = bodyPart(0.05, 0.04, 0.02, pink, 0, 0.45, -0.46); // розовый носик
  const tail = bodyPart(0.12, 0.12, 0.12, 0xFFFFFF, 0, 0.32, 0.26); // белый хвостик
  const tag = makeNameTag('🐰 Пушок'); tag.scale.set(0.9, 0.23, 1); tag.position.y = 1.15;
  g.add(body, head, earL, earR, innerL, innerR, eyeL, eyeR, nose, tail, tag);
  return { group: g };
}

// ---------- 👾 СЛИЗЕНЬ ХЛЮП ----------
function makeSlime() {
  const g = new THREE.Group();
  const jelly = new THREE.MeshLambertMaterial({ color: 0x66DD66, transparent: true, opacity: 0.72 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), jelly);
  body.position.y = 0.35;
  // Ядрышко внутри — полупрозрачное, светлее
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshLambertMaterial({ color: 0xAAFFAA, transparent: true, opacity: 0.5 }));
  core.position.y = 0.35;
  // Глазки и ротик прямо в желе
  const eyeL = bodyPart(0.09, 0.09, 0.03, 0x226622, -0.14, 0.45, -0.36);
  const eyeR = bodyPart(0.09, 0.09, 0.03, 0x226622,  0.14, 0.45, -0.36);
  const mouth = bodyPart(0.18, 0.05, 0.03, 0x226622, 0, 0.24, -0.36);
  const tag = makeNameTag('👾 Хлюп'); tag.scale.set(0.9, 0.23, 1); tag.position.y = 1.1;
  g.add(body, core, eyeL, eyeR, mouth, tag);
  return { group: g, body };
}

// ---------- 🦉 СОВА УХТА ----------
function makeOwl() {
  const g = new THREE.Group();
  const brown = 0x8A6A4A, light = 0xC9A876, dark = 0x5A4230;
  const body = bodyPart(0.34, 0.4, 0.3, brown, 0, 0.35, 0);
  const belly = bodyPart(0.24, 0.26, 0.03, light, 0, 0.32, -0.15); // светлая грудка
  // Большие круглые глаза — совиные!
  const eyeL = bodyPart(0.13, 0.13, 0.03, 0xFFFFFF, -0.09, 0.48, -0.16);
  const eyeR = bodyPart(0.13, 0.13, 0.03, 0xFFFFFF,  0.09, 0.48, -0.16);
  const pupL = bodyPart(0.05, 0.05, 0.02, 0x222233, -0.09, 0.48, -0.18);
  const pupR = bodyPart(0.05, 0.05, 0.02, 0x222233,  0.09, 0.48, -0.18);
  const beak = spike(0.04, 0.1, 0xE8A33B, 0, 0.38, -0.19); // носик-клюв
  beak.rotation.x = -Math.PI / 2;
  // Перья-«ушки» и сложенные крылышки по бокам
  const tuftL = spike(0.05, 0.14, dark, -0.13, 0.62, 0);
  const tuftR = spike(0.05, 0.14, dark,  0.13, 0.62, 0);
  const wingL = bodyPart(0.05, 0.3, 0.24, dark, -0.19, 0.32, 0);
  const wingR = bodyPart(0.05, 0.3, 0.24, dark,  0.19, 0.32, 0);
  // Лапки-цапки, чтобы сова не парила в воздухе
  const footL = bodyPart(0.07, 0.16, 0.07, 0xE8A33B, -0.08, 0.08, 0);
  const footR = bodyPart(0.07, 0.16, 0.07, 0xE8A33B,  0.08, 0.08, 0);
  const tag = makeNameTag('🦉 Ухта'); tag.scale.set(0.8, 0.2, 1); tag.position.y = 0.95;
  g.add(body, belly, eyeL, eyeR, pupL, pupR, beak, tuftL, tuftR, wingL, wingR, footL, footR, tag);
  return { group: g };
}

// ---------- ИНИЦИАЛИЗАЦИЯ: расселяем зверей по миру ----------
export function initFairy(gameContext) {
  G = gameContext;

  // 🦄 Единорог живёт на лугу недалеко от деревни
  const uparts = makeUnicorn();
  const uhome = findHome((x, z) => biomeAt(x, z) === 'plains' && hillH(x, z) > 2, 24, 60)
             || { x: -14, z: -12 }; // запасной лужок
  unicorn = {
    ...uparts, kind: 'unicorn',
    x: uhome.x + 0.5, z: uhome.z + 0.5, feet: 4, home: uhome,
    tx: uhome.x, tz: uhome.z, wait: 2, phase: 0,
    scareT: 0, scareFrom: { x: 0, z: 0 } // паника от дракона
  };

  // 🦊 Лиса — из леса (где деревья гуще)
  const fparts = makeFox();
  const fhome = findHome((x, z) => biomeAt(x, z) === 'forest' && hillH(x, z) > 2, 30, 70)
             || { x: -30, z: 20 };
  fox = {
    ...fparts, kind: 'fox',
    x: fhome.x + 0.5, z: fhome.z + 0.5, feet: 4, home: fhome,
    tx: fhome.x, tz: fhome.z, wait: 1, phase: 0,
    tamed: 0, // покормили яблоком? тогда идёт за нами!
    scareT: 0, scareFrom: { x: 0, z: 0 }
  };

  // 🐰 Зайчик — на равнине поближе к деревне
  const rparts = makeRabbit();
  const rhome = findHome((x, z) => biomeAt(x, z) === 'plains' && hillH(x, z) > 2, 12, 28)
             || { x: 20, z: 14 };
  rabbit = {
    ...rparts, kind: 'rabbit',
    x: rhome.x + 0.5, z: rhome.z + 0.5, feet: 4, home: rhome,
    tx: rhome.x, tz: rhome.z, wait: 0.5, phase: 0,
    hopT: 0, joy: 0, // joy — радостные прыжки после поглаживания!
    scareT: 0, scareFrom: { x: 0, z: 0 }
  };

  // 👾 Слизень — на берегу озерца (ищем низкий берег у воды)
  const sparts = makeSlime();
  const shome = findHome((x, z) => {
    const b = biomeAt(x, z);
    if (b !== 'plains' && b !== 'forest') return false; // живём на зелёном берегу!
    const h = hillH(x, z);
    if (h < CONFIG.WATER_Y + 0.6 || h > CONFIG.WATER_Y + 2.2) return false;
    // рядом обязательно вода: проверим соседей
    return hillH(x + 4, z) <= CONFIG.WATER_Y + 0.5 || hillH(x - 4, z) <= CONFIG.WATER_Y + 0.5
        || hillH(x, z + 4) <= CONFIG.WATER_Y + 0.5 || hillH(x, z - 4) <= CONFIG.WATER_Y + 0.5;
  }, 10, 50, 4, 0.5, [uhome, fhome, rhome]) || { x: -20, z: -30 };
  slime = {
    ...sparts, kind: 'slime',
    x: shome.x + 0.5, z: shome.z + 0.5, feet: 4, home: shome,
    tx: shome.x, tz: shome.z, wait: 1, phase: 0,
    hopT: 0, splitT: 0, mini: null // splitT>0 — раздвоен, mini — малыш
  };

  // 🦉 Сова — живёт на навесе лавки Тихона, два любимых насеста
  const oparts = makeOwl();
  owl = {
    ...oparts, kind: 'owl',
    perches: [{ x: 5.5, y: 8, z: -11.5 }, { x: 9.5, y: 8, z: -6.5 }],
    perch: 0,           // на каком насесте сидим
    flyT: 0,            // >0 — летим на другой насест
    from: null, hootT: 8
  };
  owl.group.position.set(owl.perches[0].x, owl.perches[0].y, owl.perches[0].z);

  // 🦔 Ёжик — на опушке леса (где лес встречается с лугом)
  const hparts = makeHedgehog();
  const hhome = findHome((x, z) => biomeAt(x, z) === 'forest' && hillH(x, z) > 2,
    20, 60, 6, 0.5, [uhome, fhome, rhome]) || { x: 30, z: 24 };
  hedgehog = {
    ...hparts, kind: 'hedgehog',
    x: hhome.x + 0.5, z: hhome.z + 0.5, feet: 4, home: hhome,
    tx: hhome.x, tz: hhome.z, wait: 2, phase: 0,
    rollT: 0 // >0 — катимся клубочком после поглаживания!
  };

  // ✨ Искорка — ночная фея, кружит над цветником Леи
  const kparts = makeSpark();
  spark = {
    ...kparts, kind: 'fairy',
    x: 1, z: 8, feet: 6, // центр цветника
    ang: 0, sparkleT: 0
  };

  // Регистрируем всех: помечаем детали и добавляем на сцену
  for (const f of [unicorn, fox, rabbit, slime, owl, hedgehog, spark]) {
    f.group.traverse(o => o.userData.fairy = f);
    G.scene.add(f.group);
    fairies.push(f);
  }
}

// ---------- 💞 ТАП ПО ЗВЕРЮ — ГЛАВНОЕ ВЗАИМОДЕЙСТВИЕ ----------
export function petFairy(f) {
  const bx = Math.floor(f.x ?? f.group.position.x);
  const by = Math.floor((f.feet ?? f.group.position.y)) + 1;
  const bz = Math.floor(f.z ?? f.group.position.z);

  switch (f.kind) {
    case 'unicorn':
      // Сердечки-искры вокруг — единорог счастлив!
      spawnParticles(bx, by, bz, 'flower');
      showToast('🦄 Радужка фыркает и машет гривой! +1 ⭐');
      sfx.quest();
      emit('xp', 1);
      emit('pet'); // квест «Погладь единорога»
      break;

    case 'fox':
      if (f.tamed > 0) { // уже ручная — просто играем
        spawnParticles(bx, by, bz, 'flower');
        showToast('🦊 Рыжик виляет хвостом! Она твой друг!');
        sfx.squeak();
      } else if ((G.inv.apple || 0) > 0) { // 🍎 угощаем яблоком!
        G.inv.apple--;
        updateInvUI();
        f.tamed = 90; // полторы минуты дружбы
        spawnParticles(bx, by, bz, 'flower');
        showToast('🦊 Рыжик съела яблоко и теперь бегает за тобой! +2 ⭐');
        sfx.quest();
        emit('xp', 2);
        emit('fox'); // квест «Покорми лису»
      } else {
        showToast('🦊 Лиса принюхивается... принеси ей яблоко! 🍎');
        sfx.squeak();
        sfx.no();
      }
      break;

    case 'rabbit':
      f.joy = 1.2; // зайчик прыгает от радости!
      spawnParticles(bx, by, bz, 'flower');
      showToast('🐰 Пушок радостно скачет! +1 ⭐');
      sfx.squeak();
      emit('xp', 1);
      emit('rabbit'); // квест «Погладь зайчика»
      break;

    case 'slime':
      if (f.splitT > 0) {
        showToast('👾 Хлюп уже раздвоился — жди, сольётся обратно!');
        sfx.boing();
      } else {
        f.splitT = 6; // ЩЕКОТКА! Слизень делится надвое
        spawnParticles(bx, by, bz, 'leaf');
        showToast('👾 Хлюп хихикает и раздваивается! +1 ⭐');
        sfx.boing();
        emit('xp', 1);
        emit('slime'); // квест «Пощекочи слизня»
      }
      break;

    case 'owl':
      // Сова удивлённо ухает и перелетает на другой насест
      f.flyT = 0.001;
      f.from = { ...f.perches[f.perch] };
      f.perch = (f.perch + 1) % f.perches.length;
      showToast('🦉 Ухта: «Ух-ух!» — и перелетела на другое место!');
      sfx.hoot();
      emit('owl'); // квест «Найди сову»
      emit('xp', 1);
      break;

    case 'hedgehog':
      // 🦔 Ёжик фыркнул и покатился клубочком!
      f.rollT = 1.4;
      spawnParticles(bx, by, bz, 'leaf');
      showToast('🦔 Колючка фыркнул и покатился клубочком! +1 ⭐');
      sfx.boing();
      emit('xp', 1);
      break;

    case 'fairy': {
      // ✨ Искорка лечит живым светом (ночная фея!)
      spawnParticles(bx, by, bz, 'diamondOre');
      if (heal(1)) showToast('✨ Искорка окутала тебя живым светом! +❤️');
      else showToast('✨ Искорка звенит: ты и так полон сил!');
      sfx.quest();
      emit('xp', 1);
      emit('fairy'); // квест «Поймай фею Искорку»
      break;
  }
  }
  emit('dirty');
}

// ---------- КАЖДЫЙ КАДР: жизнь зверей ----------
export function updateFairy(dt) {
  const now = performance.now();

  // 🦄 Единорог: важно гуляет по лугу, диагональные ноги вместе
  const u = unicorn;
  if (fleeStep(u, dt, 4.2) || wanderStep(u, dt, 1.6, 8)) {
    const s = Math.sin(u.phase) * 0.5;
    u.legs[0].rotation.x = s;  u.legs[3].rotation.x = s;
    u.legs[1].rotation.x = -s; u.legs[2].rotation.x = -s;
  } else {
    for (const leg of u.legs) leg.rotation.x *= 0.8;
    u.tail.rotation.x = Math.sin(now / 400) * 0.3; // машет хвостиком
  }
  followGround(u, dt);

  // 🦊 Лиса: ручная — бежит за игроком, дикая — гуляет по лесу,
  // а от дракона — спасается бегством, даже ручная!
  const f = fox;
  if (fleeStep(f, dt, 4.5)) {
    const s = Math.sin(f.phase) * 0.65;
    f.legs[0].rotation.x = s;  f.legs[3].rotation.x = s;
    f.legs[1].rotation.x = -s; f.legs[2].rotation.x = -s;
    f.tail.rotation.y = Math.sin(now / 150) * 0.4;
  } else if (f.tamed > 0) {
    f.tamed -= dt;
    const dx = G.player.x - f.x, dz = G.player.z - f.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 2.5) { // не толкаемся — держимся в паре шагов
      f.x += dx / dist * 3.2 * dt;
      f.z += dz / dist * 3.2 * dt;
      f.group.rotation.y = Math.atan2(-dx, -dz);
      f.phase += dt * 12; // бежит быстро, ножки мельтешат
      const s = Math.sin(f.phase) * 0.6;
      f.legs[0].rotation.x = s;  f.legs[3].rotation.x = s;
      f.legs[1].rotation.x = -s; f.legs[2].rotation.x = -s;
    } else {
      for (const leg of f.legs) leg.rotation.x *= 0.8;
      f.tail.rotation.y = Math.sin(now / 200) * 0.5; // виляет от радости!
    }
    if (f.tamed <= 0) showToast('🦊 Рыжик помахала хвостом и убежала в лес');
  } else {
    // Дикая лиса осторожна: подойдёшь слишком близко — отбегает
    const pd = Math.hypot(G.player.x - f.x, G.player.z - f.z);
    if (wanderStep(f, dt, 2.0, 10)) {
      const s = Math.sin(f.phase) * 0.55;
      f.legs[0].rotation.x = s;  f.legs[3].rotation.x = s;
      f.legs[1].rotation.x = -s; f.legs[2].rotation.x = -s;
    } else {
      for (const leg of f.legs) leg.rotation.x *= 0.8;
      f.tail.rotation.y = Math.sin(now / 500) * 0.3;
    }
    if (pd < 3) f.wait = 0; // не дремлем, когда гость рядом
  }
  followGround(f, dt);

  // 🐰 Зайчик: скачет дугой! А после поглаживания — прыгает от радости
  const r = rabbit;
  const rFlee = fleeStep(r, dt, 4.8); // от дракона — очень быстрые скачки!
  const hopping = rFlee || wanderStep(r, dt, 2.2, 7) || r.joy > 0;
  if (r.joy > 0) r.joy -= dt;
  if (hopping) {
    r.hopT += dt * 7;
    const hop = Math.abs(Math.sin(r.hopT));
    r.group.position.set(r.x, r.feet + hop * (rFlee ? 0.5 : r.joy > 0 ? 0.55 : 0.3), r.z);
    r.group.rotation.x = -hop * 0.25; // наклон в прыжке
  } else {
    r.group.position.set(r.x, r.feet, r.z);
    r.group.rotation.x *= 0.8;
    // Стоит — трогает носик (чуть кивает головой)
    r.group.rotation.y += Math.sin(now / 900) * 0.002;
  }
  followGround(r, 0); // ноги уже посчитали выше — только высоту земли
  {
    const gy = groundHeight(Math.floor(r.x), Math.floor(r.z));
    if (gy > 0) r.feet += (gy - r.feet) * Math.min(1, dt * 10);
  }

  // 👾 Слизень: прыгает-плюхается, сжимаясь как желе
  const s2 = slime;
  if (s2.splitT > 0) { // Раздвоение! Главный миниатюрный + малыш рядом
    s2.splitT -= dt;
    if (!s2.mini) {
      s2.group.scale.setScalar(0.55);
      const m2 = makeSlime();
      m2.group.scale.setScalar(0.55);
      m2.group.position.set(s2.x + 1, s2.feet, s2.z + 1);
      m2.group.traverse(o => o.userData.fairy = s2); // малыш — тот же Хлюп
      G.scene.add(m2.group);
      s2.mini = m2;
    }
    s2.mini.group.rotation.y += dt * 2; // малыш кружится от восторга
    if (s2.splitT <= 0) { // время вышло — сливаемся обратно!
      G.scene.remove(s2.mini.group);
      s2.mini = null;
      s2.group.scale.setScalar(1);
      sfx.boing();
    }
  }
  if (wanderStep(s2, dt, 1.2, 5) || true) {
    s2.hopT += dt * 5;
    const hop = Math.abs(Math.sin(s2.hopT));
    // Сквош-стретч: в прыжке вытягивается, на земле расплющивается
    s2.group.scale.y = (s2.splitT > 0 ? 0.55 : 1) * (0.7 + hop * 0.5);
    s2.group.position.set(s2.x, s2.feet + hop * 0.35, s2.z);
  }
  {
    const gy = groundHeight(Math.floor(s2.x), Math.floor(s2.z));
    if (gy > 0) s2.feet += (gy - s2.feet) * Math.min(1, dt * 10);
  }

  // 🦉 Сова: днём дремлет на насесте, ночью ухает. Тапнули — перелетает!
  const o = owl;
  if (o.flyT > 0) { // перелёт дугой между насестами
    o.flyT += dt / 2; // 2 секунды полёта
    const t = Math.min(1, o.flyT);
    const a = o.from, b = o.perches[o.perch];
    o.group.position.set(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * 2, // дуга вверх
      a.z + (b.z - a.z) * t
    );
    o.group.rotation.y = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    if (t >= 1) o.flyT = 0;
  } else {
    // Ночью: ухаем, если игрок недалеко. Днём — спим (чуть покачиваемся)
    const night = G.time.daylight < 0.15;
    o.hootT -= dt;
    const pd = Math.hypot(G.player.x - o.group.position.x, G.player.z - o.group.position.z);
    if (night && pd < 25 && o.hootT <= 0) {
      sfx.hoot();
      o.hootT = 10 + Math.random() * 12;
      o.group.rotation.x = 0.12; // «у-ХУ!» — запрокинули голову
      setTimeout(() => o.group.rotation.x = 0, 400);
    }
    if (!night) o.group.rotation.x = Math.sin(now / 1200) * 0.05; // дремлем
  }

  // 🦔 Ёжик: неспешно снуёт по опушке, а рядом с игроком — шипит иголками
  const h = hedgehog;
  if (h.rollT > 0) {
    // Катимся клубочком! (после поглаживания)
    h.rollT -= dt;
    h.group.rotation.y += dt * 12;
    h.spikesG.scale.setScalar(1.35); // иголки дыбом!
    h.x += Math.sin(h.group.rotation.y) * 1.5 * dt;
    h.z += Math.cos(h.group.rotation.y) * 1.5 * dt;
  } else {
    h.spikesG.scale.setScalar(1);
    const pd = Math.hypot(G.player.x - h.x, G.player.z - h.z);
    if (pd < 2.5) {
      h.spikesG.scale.setScalar(1.25); // ш-ш-ш! Не подходи!
      h.wait = Math.max(h.wait, 0.5);  // замираем
    } else if (wanderStep(h, dt, 1.0, 6)) {
      h.group.rotation.z = Math.sin(h.phase) * 0.06; // семеним, вихляясь
    }
  }
  followGround(h, dt);

  // ✨ Искорка: кружит над цветником — но только ночью! Днём спит.
  const k = spark;
  const nightTime = G.time.daylight < 0.25;
  k.group.visible = nightTime;
  if (nightTime) {
    k.ang += dt * 0.9;
    k.x = 1 + Math.cos(k.ang) * 3;
    k.z = 8 + Math.sin(k.ang) * 3;
    k.feet = 6 + Math.sin(k.ang * 2.3) * 0.6; // порхаем вверх-вниз
    k.group.position.set(k.x, k.feet, k.z);
    k.group.rotation.y = -k.ang;
    // Крылышки трепещут быстро-быстро
    k.wingL.rotation.z = 0.4 + Math.sin(now / 60) * 0.5;
    k.wingR.rotation.z = -0.4 - Math.sin(now / 60) * 0.5;
    // Волшебная пыльца сыплется на цветы
    k.sparkleT -= dt;
    if (k.sparkleT <= 0) {
      k.sparkleT = 0.8;
      spawnParticles(Math.floor(k.x), Math.floor(k.feet - 0.5), Math.floor(k.z), 'diamondOre');
    }
  }
}
