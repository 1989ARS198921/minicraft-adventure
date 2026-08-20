// ============================================================
//  🧍 МОДЕЛЬ ИГРОКА + КАМЕРА ОТ ТРЕТЬЕГО ЛИЦА
//  Блочный человечек: голова, тело, руки и ноги. При беге
//  руки и ноги качаются! Клавиша F5 (или кнопка 🎥) переключает
//  вид: от первого лица ↔ камера летит за спиной.
// ============================================================

import * as THREE from 'three';
import { CONFIG, WALKTHROUGH, COLORS, PLACEABLE } from './config.js';
import { blockAt } from './world.js';
import { makeSkinTexture, classicFigure } from './skins.js';
import { gear, SWORD_COLOR } from './equip.js';

let G = null;
let model = null;               // вся фигурка целиком
let armL, armR, legL, legR;     // качающиеся части
let held3rd, heldMat3rd;        // предмет в руке (вид за спиной)
let sword3rd, bow3rd;           // 🗡️🏹 оружие в руке (вид за спиной)
let hand, heldMat1st, sword1st, bow1st; // рука с предметом (вид из глаз)
let lastBlade = null;           // какой меч уже покрашен (чтобы не красить каждый кадр)
let walkCycle = 0;              // фаза шага (для качания рук/ног)
let bobPhase = 0, bobAmp = 0;   // 🎥 покачивание камеры при ходьбе
const CAM_DIST = 4;             // как далеко камера за спиной

// Коробочка части тела: размер, цвет, куда прикреплена.
// Экспортируем — жители деревни собираются из тех же деталей!
export function bodyPart(w, h, d, color, x, y, z, pivotY) {
  const geo = new THREE.BoxGeometry(w, h, d);
  // Сдвигаем геометрию так, чтобы часть крутилась вокруг «сустава»
  if (pivotY !== undefined) geo.translate(0, pivotY, 0);
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  return mesh;
}

export function initPlayerModel(gameContext) {
  G = gameContext;
  model = new THREE.Group();

  // 🎨 Наш герой: голубая футболка, джинсы, каштановые волосы.
  // Лицо, одежда и причёска нарисованы в скине 64×64 (skins.js)!
  const skin = makeSkinTexture({
    skin: '#F1C27D', hair: '#5B3A1A', eye: '#2B6CB0',
    shirt: '#3B7BD4', pants: '#2F4F8F', shoes: '#6B4A2B', style: 'player'
  });

  // 🧍 Классические пропорции Minecraft (как у Стива!): собираем фигурку
  const fig = classicFigure(skin);
  legL = fig.legL; legR = fig.legR; armL = fig.armL; armR = fig.armR;
  model.add(fig.group);

  model.visible = false; // от первого лица себя не видно!
  G.scene.add(model);

  // 🖐 Предмет в руке (вид от третьего лица): кубик в правой руке
  heldMat3rd = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
  held3rd = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), heldMat3rd);
  held3rd.position.set(0, -0.82, -0.12); // в кулачке, чуть вперёд
  armR.add(held3rd);

  // 🗡️ МЕЧ: светлое лезвие, золотая гарда, коричневая рукоять.
  // Виден, когда меч куплен (появляется вместо кубика на время замаха).
  sword3rd = makeSword();
  sword3rd.position.set(0, -0.84, -0.18);
  sword3rd.rotation.x = -1.75; // клинок смотрит вперёд из кулака, как в Minecraft
  armR.add(sword3rd);
  bow3rd = makeBow(); // 🏹 лук тоже живёт в правой руке
  bow3rd.position.set(0, -0.84, -0.18);
  bow3rd.rotation.x = -1.75;
  armR.add(bow3rd);

  // ✋ Рука с предметом (вид от первого лица): коробочки приклеены к камере
  hand = new THREE.Group();
  const armMat = new THREE.MeshLambertMaterial({ color: 0xF1C27D }); // кожа
  const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.4), armMat);
  armMesh.position.set(0, -0.04, 0.14);
  heldMat1st = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
  const held1st = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), heldMat1st);
  held1st.position.set(0, 0.02, -0.16);
  sword1st = makeSword();
  sword1st.position.set(0, 0.02, -0.34);
  sword1st.rotation.x = 0.3; // лезвие смотрит вперёд-вверх
  bow1st = makeBow();
  bow1st.position.set(0, 0.02, -0.3);
  bow1st.rotation.x = 0.15;
  hand.add(armMesh, held1st, sword1st, bow1st);
  hand.userData.held = held1st; // чтобы прятать кубик во время замаха мечом
  hand.position.set(0.38, -0.32, -0.6); // справа внизу экрана
  hand.rotation.set(0.25, -0.35, 0);
  hand.scale.set(0.7, 0.7, 0.7); // поменьше, чтобы не закрывала обзор
  G.camera.add(hand); // рука ездит вместе с камерой!
}

// 🗡️ Собрать мечик: лезвие + гарда + рукоять (одна группа)
function makeSword() {
  const s = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xD8E8F0 })); // сталь блестит
  blade.position.y = 0.36;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4),
    new THREE.MeshLambertMaterial({ color: 0xD8E8F0 }));
  tip.position.y = 0.67; // остриё
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.12),
    new THREE.MeshLambertMaterial({ color: 0xE8B73C })); // золотая гарда
  guard.position.y = 0.1;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x6B4A2B })); // рукоять
  s.add(blade, tip, guard, grip);
  s.visible = false; // появится, когда наденем меч
  // Запомним материалы клинка — перекрасим под уровень меча!
  s.userData.bladeMats = [blade.material, tip.material];
  return s;
}

// 🏹 Собрать лук: две дуги-плеча, рукоять и тетива
function makeBow() {
  const b = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.07), wood);
  top.position.set(0, 0.42, 0); top.rotation.x = 0.35; // плечи изогнуты назад
  const bot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.07), wood);
  bot.position.set(0, -0.02, 0); bot.rotation.x = -0.35;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.09),
    new THREE.MeshLambertMaterial({ color: 0x5A3A22 })); // за него держимся
  grip.position.y = 0.2;
  const string = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.72, 0.015),
    new THREE.MeshLambertMaterial({ color: 0xEEEEEE })); // тетива
  string.position.set(0, 0.2, 0.12);
  b.add(top, bot, grip, string);
  b.visible = false; // появится, когда наденем лук
  return b;
}

// Переключить вид: первое лицо ↔ третье лицо
export function toggleCamera(G0) {
  G0.cam3rd = !G0.cam3rd;
  return G0.cam3rd;
}

// Каждый кадр: двигаем фигурку, качаем руками-ногами, ставим камеру
export function updatePlayerModel(dt) {
  const p = G.player;

  // Фигурка стоит там, где игрок, и смотрит туда же
  model.position.set(p.x, p.feet, p.z);
  model.rotation.y = p.yaw;
  model.visible = !!G.cam3rd;

  // Качание рук и ног при ходьбе (в полёте — руки вверх, как супермен!)
  const moving = Math.abs(G.joy.x) + Math.abs(G.joy.y) > 0.1 ||
                 G.keys['KeyW'] || G.keys['KeyA'] || G.keys['KeyS'] || G.keys['KeyD'];
  // Камера «дышит» в такт шагам (только когда бежим по земле)
  const walking = moving && p.onGround && !p.fly;
  bobAmp += ((walking ? 1 : 0) - bobAmp) * Math.min(1, dt * 8);
  if (walking) bobPhase += dt * 9;
  if (p.fly) {
    armL.rotation.x = armR.rotation.x = 2.6; // руки вверх!
    legL.rotation.x = legR.rotation.x = 0.3; // ноги назад
  } else if (moving && p.onGround) {
    walkCycle += dt * 9;
    const s = Math.sin(walkCycle) * 0.7;
    legL.rotation.x = s;  legR.rotation.x = -s;
    armL.rotation.x = -s; armR.rotation.x = s;
  } else {
    // Плавно возвращаем руки-ноги в покой
    legL.rotation.x *= 0.8; legR.rotation.x *= 0.8;
    armL.rotation.x *= 0.8; armR.rotation.x *= 0.8;
  }

  // ⚔️ СНАРЯЖЕНИЕ В РУКАХ! (G.swingT ставится при ударе/выстреле)
  if (typeof G.swingT !== 'number') G.swingT = 0;
  G.swingT = Math.max(0, G.swingT - dt);
  const w = gear(G).weapon;            // что надето: меч, лук или пусто
  const isSword = !!w && w.startsWith('sword');
  const isBow = w === 'bow';
  const swinging = G.swingT > 0;
  if (swinging) {
    const t = 1 - G.swingT / 0.3;         // 0 → замах вверх, 1 → рубящий вниз
    if (!p.fly) armR.rotation.x = -2.4 + t * 1.9;
    hand.rotation.x = 0.25 - Math.sin(t * Math.PI) * 0.9; // рука рубит на экране
  } else {
    hand.rotation.x = 0.25;
  }
  // 🎨 Красим клинок под уровень меча: дерево/камень/золото/алмаз
  if (isSword && lastBlade !== w) {
    lastBlade = w;
    for (const s of [sword1st, sword3rd])
      for (const mt of s.userData.bladeMats) mt.color.setHex(SWORD_COLOR[w] || 0xD8E8F0);
  }
  // Надетое оружие видно всегда, а кубик блока — только с пустыми руками
  sword3rd.visible = isSword && G.cam3rd;
  sword1st.visible = isSword && !G.cam3rd;
  bow3rd.visible = isBow && G.cam3rd;
  bow1st.visible = isBow && !G.cam3rd;
  held3rd.visible = !w;
  hand.userData.held.visible = !w;

  // Предмет в руке = выбранный блок из инвентаря
  const heldColor = COLORS[PLACEABLE[G.slot]];
  heldMat3rd.color.setHex(heldColor);
  heldMat1st.color.setHex(heldColor);

  // Рука от первого лица: видна только «из глаз», пружинит при беге
  hand.visible = !G.cam3rd;
  hand.position.y = -0.32 + (moving && p.onGround ? Math.sin(walkCycle) * 0.02 : 0);
}

// Камера: от первого лица — в глазах, от третьего — за спиной
export function updatePlayerCamera() {
  const p = G.player, cam = G.camera;
  const eyeX = p.x, eyeY = p.feet + CONFIG.EYE, eyeZ = p.z;
  cam.rotation.order = 'YXZ';
  cam.rotation.y = p.yaw;
  cam.rotation.x = p.pitch;

  // ⚡ Зелье скорости чуть «раздвигает» обзор — чувствуешь рывок!
  const targetFov = G.fx && G.fx.speed > 0 ? 84 : 75;
  if (Math.abs(cam.fov - targetFov) > 0.05) {
    cam.fov += (targetFov - cam.fov) * 0.12;
    cam.updateProjectionMatrix();
  }

  if (!G.cam3rd) { // 👁️ первое лицо: камера = глаза + покачивание шага
    cam.position.set(eyeX, eyeY + Math.sin(bobPhase * 2) * 0.045 * bobAmp, eyeZ);
    cam.rotation.z = Math.sin(bobPhase) * 0.008 * bobAmp; // лёгкий наклон
    return;
  }
  cam.rotation.z = 0; // за спиной камера ровная
  // 🎥 третье лицо: отступаем назад по взгляду
  const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);
  const fx = -cp * Math.sin(p.yaw), fy = sp, fz = -cp * Math.cos(p.yaw);
  // Камера не должна нырять в блоки: идём назад, пока не упрёмся
  let dist = CAM_DIST;
  for (let d = 0.5; d <= CAM_DIST; d += 0.25) {
    const t = blockAt(Math.floor(eyeX - fx * d), Math.floor(eyeY - fy * d), Math.floor(eyeZ - fz * d));
    if (t && !WALKTHROUGH.has(t)) { dist = d - 0.3; break; }
  }
  cam.position.set(eyeX - fx * dist, eyeY - fy * dist + 0.2, eyeZ - fz * dist);
}
