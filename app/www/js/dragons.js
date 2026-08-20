// ============================================================
//  🐉 ДРАКОНЫ — целых десять, и у каждого своё гнездо!
//  Драконы гнездятся на горных пиках по всему миру.
//  У дракона три настроения: посидеть в гнезде, полетать
//  кругами над горой и поохотиться — стремительно спикировать
//  на зверя и распугать всех вокруг (никого не обижаем
//  по-настоящему — это же сказка!). Подлети близко — дракон
//  подарит золотую руду из своей сокровищницы 🎁
// ============================================================

import * as THREE from 'three';
import { biomeAt, hillH, addBlock } from './world.js';
import { bodyPart } from './playermodel.js';
import { makePatternTexture } from './skins.js';
import { makeNameTag } from './npc.js';
import { showToast, updateInvUI } from './ui.js';
import { sfx } from './audio.js';
import { emit } from './bus.js';
import { spawnParticles } from './particles.js';
import { getPrey } from './fairy.js';

let G = null;
const DRAGONS = []; // все драконы мира

// Имена и окраски десяти драконов 🐲
const DRAGON_DEFS = [
  { name: 'Феникс',  tint: 0xFFFFFF, eye: 0xB266FF }, // фиолетовые глаза — старший!
  { name: 'Горыныч', tint: 0xFFB0A0, eye: 0xFF6040 },
  { name: 'Игнис',   tint: 0xFFC890, eye: 0xFFAA00 },
  { name: 'Смауг',   tint: 0xD0B0FF, eye: 0xFFD75E },
  { name: 'Гроза',   tint: 0xA0C8FF, eye: 0x60D0FF },
  { name: 'Янтарь',  tint: 0xFFE0A0, eye: 0xFF8000 },
  { name: 'Огньо',   tint: 0xFF9090, eye: 0xFF4040 },
  { name: 'Перун',   tint: 0xC0D8FF, eye: 0xFFFFFF },
  { name: 'Туча',    tint: 0xB0B0C8, eye: 0x80FFAA },
  { name: 'Змей',    tint: 0xA0E8B0, eye: 0x40FF80 }
];

// ---------- 🐉 МОДЕЛЬ ДРАКОНА (парадная!) ----------
// Шея, лапы с когтями, гребень в цвет глаз, крылья с косточками-
// «пальцами» и длинный хвост с плавником. Каждый дракон — свой
// окрас чешуи, брюшка и украшений!
function makeDragon(def) {
  const g = new THREE.Group();
  const dark = 0x2B2B3B;
  const scaleTex = makePatternTexture('dragon'); // 🐉 настоящая чешуя!
  const scaled = m => {
    m.material = new THREE.MeshLambertMaterial({ map: scaleTex, color: def.tint });
    return m;
  };
  // Украшения (гребень, плавник, когти на крыльях) — в цвет глаз дракона
  const fancyMat = new THREE.MeshLambertMaterial({ color: def.eye });

  // Тело, шея и голова с челюстью
  const body = scaled(bodyPart(1.4, 0.7, 2.2, dark, 0, 0, 0));
  const neck = scaled(bodyPart(0.55, 0.55, 0.8, dark, 0, 0.32, -1.3));
  neck.rotation.x = 0.3; // шея гордо тянется вверх
  const head = scaled(bodyPart(0.7, 0.6, 0.9, dark, 0, 0.66, -1.85));
  const jaw  = scaled(bodyPart(0.5, 0.2, 0.7, dark, 0, 0.36, -1.95));
  // Ноздри — из них идёт дымок, когда дракон сидит в гнезде
  const noseMat = new THREE.MeshLambertMaterial({ color: 0x16161F });
  const nosL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), noseMat);
  nosL.position.set(-0.14, 0.62, -2.31);
  const nosR = nosL.clone(); nosR.position.x = 0.14;

  // Брюшко из пластин — в оттенок чешуи дракона
  const bellyColor = new THREE.Color(0x8B6BBB).multiply(new THREE.Color(def.tint));
  const bellyMat = new THREE.MeshLambertMaterial({ color: bellyColor });
  for (let i = 0; i < 4; i++) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0 - i * 0.13, 0.14, 0.55), bellyMat);
    plate.position.set(0, -0.38, -1.0 + i * 0.65);
    g.add(plate);
  }

  // 🐾 ЧЕТЫРЕ ЛАПЫ С КОГТЯМИ — видно, когда дракон сидит в гнезде!
  for (const [lx, lz] of [[-0.55, -0.7], [0.55, -0.7], [-0.55, 0.7], [0.55, 0.7]]) {
    const leg = scaled(bodyPart(0.3, 0.42, 0.3, dark, lx, -0.3, lz));
    g.add(leg);
    const claw = spike(0.06, 0.16, 0xFFF8E0, lx, -0.55, lz - 0.16);
    claw.rotation.x = -Math.PI / 2; // коготь смотрит вперёд
    g.add(claw);
  }

  // Рога, загнутые назад, и гребень из шипов в цвет глаз — по голове,
  // шее и спине. Красавцы!
  const hornL = spike(0.09, 0.45, def.eye, -0.2, 1.02, -1.7);
  const hornR = spike(0.09, 0.45, def.eye,  0.2, 1.02, -1.7);
  hornL.rotation.x = hornR.rotation.x = 0.5; // назад, как у антилопы
  const crest = [[0.98, -1.9, 0.16], [0.85, -1.3, 0.14], [0.42, -0.7, 0.13],
                 [0.42, -0.15, 0.12], [0.42, 0.4, 0.1]];
  for (const [y, z, r] of crest) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(r, r * 2.4, 4), fancyMat);
    s.position.set(0, y, z);
    s.rotation.x = -0.25; // шипы гребня чуть назад
    g.add(s);
  }

  // Глаза светятся — у каждого дракона свой цвет!
  const eyeMat = new THREE.MeshBasicMaterial({ color: def.eye });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.05), eyeMat);
  eyeL.position.set(-0.2, 0.72, -2.31);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.2;

  // 🪽 КРЫЛЬЯ: перепонка в жилку + косточки-«пальцы» спереди
  // и коготь на сгибе — как у настоящего дракона!
  const wingGeo = new THREE.BoxGeometry(2.6, 0.08, 1.2);
  const wingMat = new THREE.MeshLambertMaterial({ map: makePatternTexture('wing'), color: def.tint });
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(side * 1.5, 0.35, -0.3);
    for (let f = 0; f < 3; f++) { // пальцы-косточки по передней кромке
      const finger = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.07), fancyMat);
      finger.position.set(0, 0.05, -0.5 + f * 0.45);
      finger.rotation.y = (f - 1) * 0.18;
      wing.add(finger);
    }
    const tipClaw = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), fancyMat);
    tipClaw.position.set(side * 1.28, 0.05, -0.55); // коготь на конце сгиба
    wing.add(tipClaw);
    g.add(wing);
    if (side < 0) g.userData.wingL = wing; else g.userData.wingR = wing;
  }
  const wingL = g.userData.wingL, wingR = g.userData.wingR;

  // Хвост: три звена поменьше, парус-плавник и стрела-наконечник
  const tail1 = scaled(bodyPart(0.5, 0.4, 1.0, dark, 0, 0, 1.6));
  const tail2 = scaled(bodyPart(0.32, 0.26, 0.9, dark, 0, 0.02, 2.4));
  const tail3 = scaled(bodyPart(0.18, 0.16, 0.6, dark, 0, 0.04, 3.0));
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.5), fancyMat);
  fin.position.set(0, 0.24, 2.4); // плавник-парус на хвосте!
  const arrow = spike(0.14, 0.4, def.eye, 0, 0.04, 3.4);
  arrow.rotation.x = Math.PI / 2; // смотрит назад, как стрела

  const tag = makeNameTag('🐉 ' + def.name); tag.position.y = 2.1;
  g.add(body, neck, head, jaw, nosL, nosR, hornL, hornR, eyeL, eyeR,
        tail1, tail2, tail3, fin, arrow, tag);
  return { group: g, wingL, wingR, jaw, neck };
}

// Конус-шип (рога, шипы на спине)
function spike(r, h, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(r, h, 4),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  return m;
}

// ---------- 🏔️ ИЩЕМ ДЕСЯТЬ ГОРНЫХ ПИКОВ ----------
function findPeaks(n) {
  const peaks = [];
  for (let r = 60; r <= 320 && peaks.length < n; r += 7)
    for (let a = 0; a < 6.28 && peaks.length < n; a += 0.22) {
      const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
      if (biomeAt(x, z) !== 'mountains') continue;
      const h = hillH(x, z);
      if (h < 5) continue; // только настоящие горы!
      // Пики не толкутся: ближайший сосед минимум в 45 блоках
      if (peaks.some(p => Math.hypot(p.x - x, p.z - z) < 45)) continue;
      // Берём самую высокую точку поблизости
      let best = h, bx = x, bz = z;
      for (let dx = -4; dx <= 4; dx += 2)
        for (let dz = -4; dz <= 4; dz += 2) {
          const hh = hillH(x + dx, z + dz);
          if (hh > best) { best = hh; bx = x + dx; bz = z + dz; }
        }
      peaks.push({ x: bx, z: bz, h: Math.round(best) });
    }
  // Запасной вариант (если гор мало): кольцо вокруг мира
  while (peaks.length < n) {
    const a = peaks.length / n * 6.28, r = 130 + peaks.length * 14;
    const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
    peaks.push({ x, z, h: Math.round(hillH(x, z)) });
  }
  return peaks;
}

// ---------- 🪹 ГНЕЗДО: кольцо из веток на макушке горы ----------
function stampNest(p) {
  for (const [dx, dz] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]])
    addBlock(p.x + dx, p.h + 1, p.z + dz, 'trunk');
}

// ---------- СОЗДАЁМ ДРАКОНОВ ----------
export function initDragons(gameContext) {
  G = gameContext;
  const peaks = findPeaks(DRAGON_DEFS.length);
  DRAGON_DEFS.forEach((def, i) => {
    const p = peaks[i];
    stampNest(p); // гнездо из веток ждёт хозяина!
    const parts = makeDragon(def);
    const d = {
      ...def, ...parts,
      peak: p, nestY: p.h + 1,             // гнездо на вершине
      state: 'perch',                      // сидим в гнезде
      stateT: 4 + Math.random() * 14,      // когда захочется летать
      ang: Math.random() * 6.28,           // угол на круге
      radius: 16 + Math.random() * 9,      // ширина круга
      flyY: p.h + 13 + Math.random() * 6,  // высота полёта
      giftT: Math.random() * 60,           // первый подарок не сразу
      breathT: 0, puffT: 0,
      prey: null, huntCoolT: 20 + Math.random() * 40
    };
    // Стартуем в гнезде (чуть выше — лапы стоят на земле, не тонут)
    d.group.position.set(p.x + 0.5, d.nestY + 0.55, p.z + 0.5);
    d.group.traverse(o => { o.userData.dragon = d; });
    G.scene.add(d.group);
    DRAGONS.push(d);
  });
}

// Модели драконов — для «луча зрения»
export function dragonGroups() { return DRAGONS.map(d => d.group); }
export function getDragons() { return DRAGONS; } // для тестов и отладки

// ---------- 👋 ТАП ПО ДРАКОНУ ----------
export function petDragon(d) {
  showToast(`🐉 ${d.name}: Гр-р-р! Подлети ближе — угощу огненным подарком!`);
  sfx.roar();
}

// ---------- КАЖДЫЙ КАДР: жизнь драконов ----------
export function updateDragons(dt) {
  const now = performance.now();
  const pl = G.player;

  for (const d of DRAGONS) {
    d.stateT -= dt;
    d.huntCoolT -= dt;
    const flap = Math.sin(now / 300 + d.ang) * 0.5;
    const pos = d.group.position;

    if (d.state === 'perch') {
      // 🪹 СИДИМ В ГНЕЗДЕ: крылья сложены, осматриваем окрестности
      pos.set(d.peak.x + 0.5, d.nestY + 0.55, d.peak.z + 0.5);
      d.group.rotation.y += Math.sin(now / 1500 + d.ang) * 0.003; // вертим головой
      d.wingL.rotation.z += (1.05 - d.wingL.rotation.z) * Math.min(1, dt * 3);
      d.wingR.rotation.z += (-1.05 - d.wingR.rotation.z) * Math.min(1, dt * 3);
      // 💨 Дымок из ноздрей — дракон дремлет и попыхивает
      d.smokeT = (d.smokeT ?? 1) - dt;
      if (d.smokeT <= 0) {
        d.smokeT = 2.2 + Math.random() * 1.5;
        const sx = pos.x - Math.sin(d.group.rotation.y) * 2.3;
        const sz = pos.z - Math.cos(d.group.rotation.y) * 2.3;
        spawnParticles(Math.floor(sx), Math.floor(pos.y + 0.7), Math.floor(sz), 'coalOre');
      }
      if (d.stateT <= 0) { // пора размять крылья!
        d.state = 'circle';
        d.stateT = 18 + Math.random() * 20;
        d.ang = Math.random() * 6.28;
        sfx.roar();
      }
    } else if (d.state === 'circle') {
      // 🌀 КРУЖИМ НАД ГОРОЙ — крылья машут вовсю
      d.ang += dt * 0.35;
      const px = d.peak.x + Math.cos(d.ang) * d.radius;
      const pz = d.peak.z + Math.sin(d.ang) * d.radius;
      pos.set(px, d.flyY + Math.sin(d.ang * 3) * 1.5, pz);
      d.group.rotation.y = d.ang + Math.PI; // нос по касательной
      d.wingL.rotation.z = 0.15 + flap;
      d.wingR.rotation.z = -0.15 - flap;
      // Попробуем поохотиться? Ищем зверя неподалёку
      if (d.stateT < 14 && d.huntCoolT <= 0) {
        const prey = getPrey().find(a =>
          Math.hypot(a.x - px, a.z - pz) < 45 && a.scareT <= 0);
        if (prey) {
          d.prey = prey;
          d.state = 'hunt';
          d.stateT = 8; // охота недолгая
        }
      }
      if (d.state === 'circle' && d.stateT <= 0) { // домой, в гнездо!
        d.state = 'return';
        d.stateT = 12;
      }
    } else if (d.state === 'hunt') {
      // 🏹 ОХОТА! Стремительно пикируем на зверя
      const a = d.prey;
      if (!a || d.stateT <= 0) { d.state = 'return'; d.stateT = 12; continue; }
      const dx = a.x - pos.x, dz = a.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const targetY = dist > 8 ? a.feet + 7 : a.feet + 1.5; // низкий заход на цель!
      const speed = 13;
      if (dist > 2.2) {
        pos.x += dx / dist * speed * dt;
        pos.z += dz / dist * speed * dt;
        pos.y += (targetY - pos.y) * Math.min(1, dt * 3);
        d.group.rotation.y = Math.atan2(-dx, -dz);
      } else {
        // 💨 СВОП! Проносимся над зверем — он в ужасе убегает!
        a.scareT = 3.5;
        a.scareFrom = { x: pos.x, z: pos.z };
        d.breathT = 0.9; // огненная струя для страшности!
        d.huntCoolT = 60 + Math.random() * 40;
        d.state = 'return';
        d.stateT = 12;
        sfx.roar();
        // Если игрок рядом — засчитываем зрелище квесту
        if (Math.hypot(pos.x - pl.x, pos.z - pl.z) < 70) emit('dragonHunt');
      }
      d.wingL.rotation.z = 0.5 + flap; // крылья прижаты — пикирование!
      d.wingR.rotation.z = -0.5 - flap;
    } else { // 'return' — летим домой в гнездо
      const tx = d.peak.x + 0.5, tz = d.peak.z + 0.5;
      const dx = tx - pos.x, dz = tz - pos.z;
      const dist = Math.hypot(dx, dz);
      const dy = (d.nestY + 0.55) - pos.y;
      if (dist > 1.2 || Math.abs(dy) > 1) {
        pos.x += dx / (dist || 1) * 9 * dt;
        pos.z += dz / (dist || 1) * 9 * dt;
        pos.y += dy * Math.min(1, dt * 1.5);
        d.group.rotation.y = Math.atan2(-dx, -dz);
        d.wingL.rotation.z = 0.15 + flap;
        d.wingR.rotation.z = -0.15 - flap;
      } else { // сели!
        d.state = 'perch';
        d.stateT = 10 + Math.random() * 20;
      }
      if (d.stateT <= 0) { d.state = 'perch'; d.stateT = 10; }
    }

    // Зеваем и дышим (пасть чуть приоткрывается)
    d.jaw.rotation.x = Math.max(0, Math.sin(now / 900 + d.ang)) * 0.25;

    // 🎁 ПОДАРОК: подлети к дракону ближе — угостит золотом!
    const near = Math.hypot(pos.x - pl.x, pos.z - pl.z);
    if (near < 50) emit('dragon');
    if (d.giftT > 0) d.giftT -= dt;
    if (near < 14 && d.giftT <= 0 && d.state !== 'hunt') {
      d.giftT = 240; // следующий подарок через 4 минуты
      d.breathT = 1.2;
      G.inv.goldOre = (G.inv.goldOre || 0) + 1;
      updateInvUI();
      sfx.roar();
      showToast(`🐉 ${d.name} рад тебя видеть! Держи золотую руду! 🎁 +2 ⭐`);
      emit('xp', 2);
      emit('dragonGift');
      emit('dirty');
    }
    // 🔥 Струя огня из пасти (праздник или охота)
    if (d.breathT > 0) {
      d.breathT -= dt;
      d.puffT -= dt;
      if (d.puffT <= 0) {
        d.puffT = 0.15;
        const mx = pos.x - Math.sin(d.group.rotation.y) * 2.2;
        const mz = pos.z - Math.cos(d.group.rotation.y) * 2.2;
        spawnParticles(Math.floor(mx), Math.floor(pos.y), Math.floor(mz), 'torch');
      }
    }
  }
}
