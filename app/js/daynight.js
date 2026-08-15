// ============================================================
//  🌞🌙 ДЕНЬ И НОЧЬ
//  Солнце ходит по кругу, небо меняет цвет (день -> закат ->
//  ночь), ночью появляются звёзды. Сутки длятся 4 минуты.
// ============================================================

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { emit } from './bus.js';
import { chunkMatWater, waterTex } from './textures.js';

let G = null;
let stars, starMat, sun, ambient;
let sunSprite, moonSprite; // видимые солнышко и луна в небе
let dome, domeGeo;         // 🌈 купол неба с градиентом
let timeBadge;

// Палитры неба: [зенит, горизонт] для дня, заката и ночи
const SKY = {
  day:    [new THREE.Color(0x3E7BD0), new THREE.Color(0xBFE8F7)],
  sunset: [new THREE.Color(0x4B3B70), new THREE.Color(0xFF9A4C)],
  night:  [new THREE.Color(0x05070F), new THREE.Color(0x101A33)]
};
const zenNow = new THREE.Color(), horNow = new THREE.Color();
const skyNow = new THREE.Color(); // цвет горизонта — для тумана

// 🌞 Рисуем солнышко: яркая середина и мягкое свечение по краям
function makeSunTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, '#FFF9C4');      // бело-жёлтое ядро
  grad.addColorStop(0.55, '#FFD54F');   // золотая середина
  grad.addColorStop(0.8, 'rgba(255, 170, 50, 0.5)');
  grad.addColorStop(1, 'rgba(255, 140, 30, 0)'); // прозрачный край
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// 🌙 Рисуем луну: светлый круг с кратериками
function makeMoonTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 56);
  grad.addColorStop(0, '#FDFEFF');
  grad.addColorStop(0.85, '#DCE4F2');
  grad.addColorStop(1, 'rgba(200, 210, 235, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  // Кратеры — тёмные пятнышки
  g.fillStyle = 'rgba(160, 172, 200, 0.7)';
  const craters = [[48, 44, 9], [78, 58, 7], [58, 82, 6], [86, 34, 5]];
  for (const [x, y, r] of craters) {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return new THREE.CanvasTexture(c);
}

export function initDayNight(gameContext, sunLight, ambientLight) {
  G = gameContext;
  sun = sunLight;
  ambient = ambientLight;
  timeBadge = document.getElementById('timeBadge');

  // Туман прячет край видимого мира
  const viewDist = (G.IS_TOUCH ? CONFIG.VIEW_TOUCH : CONFIG.VIEW_DESKTOP) * CONFIG.CHUNK;
  G.scene.fog = new THREE.Fog(0xBFE8F7, 20, viewDist + 24);

  // 🌈 Купол неба: огромный шар вокруг игрока, цвет плавно
  // перетекает от светлого горизонта к глубокому зениту
  domeGeo = new THREE.SphereGeometry(320, 24, 14);
  const cols = new Float32Array(domeGeo.attributes.position.count * 3);
  domeGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  dome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false
  }));
  dome.renderOrder = -1; // рисуем небо первым — мир поверх него
  dome.frustumCulled = false; // купол гигантский, пусть рисуется всегда
  G.scene.add(dome);
  G.scene.background = null; // плоский фон больше не нужен — есть купол!

  // Звёзды — точки на большой сфере над игроком
  const pos = [];
  for (let i = 0; i < 350; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
    const r = 250;
    pos.push(r * Math.cos(b) * Math.cos(a), Math.abs(r * Math.sin(b)) + 5, r * Math.cos(b) * Math.sin(a));
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0, fog: false });
  stars = new THREE.Points(starGeo, starMat);
  G.scene.add(stars);

  // Солнышко и луна — плоские картинки-спрайты, парящие далеко в небе.
  // Они ездят по кругу вслед за игроком и никогда не «прилетают» близко.
  sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSunTexture(), transparent: true, fog: false, depthWrite: false
  }));
  sunSprite.scale.set(30, 30, 1);
  moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeMoonTexture(), transparent: true, fog: false, depthWrite: false
  }));
  moonSprite.scale.set(18, 18, 1);
  G.scene.add(sunSprite, moonSprite);
}

// Смешать две палитры: сначала ночь→закат, потом закат→день
function skyMix(dl, outZen, outHor) {
  if (dl < 0.3) {
    const t = dl / 0.3;
    outZen.lerpColors(SKY.night[0], SKY.sunset[0], t);
    outHor.lerpColors(SKY.night[1], SKY.sunset[1], t);
  } else {
    const t = Math.min(1, (dl - 0.3) / 0.5);
    outZen.lerpColors(SKY.sunset[0], SKY.day[0], t);
    outHor.lerpColors(SKY.sunset[1], SKY.day[1], t);
  }
}

// Перекрасить купол: каждой вершине — цвет по её высоте
function paintDome() {
  const pos = domeGeo.attributes.position;
  const col = domeGeo.attributes.color;
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const ny = Math.max(0, Math.min(1, pos.getY(i) / 320)); // 0 горизонт → 1 зенит
    tmp.lerpColors(horNow, zenNow, Math.pow(ny, 0.65));
    col.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  col.needsUpdate = true;
}

// Каждый кадр: двигаем время и перекрашиваем мир
export function updateDayNight(dt) {
  G.time.t = (G.time.t + dt / CONFIG.DAY_LENGTH) % 1;
  const ang = G.time.t * Math.PI * 2;
  const dl = Math.max(0, Math.sin(ang)); // 0 = ночь, 1 = полдень
  G.time.daylight = dl;

  // Небо: считаем палитру и красим купол градиентом
  skyMix(dl, zenNow, horNow);
  skyNow.copy(horNow);
  G.scene.fog.color.copy(skyNow);
  paintDome();
  dome.position.copy(G.camera.position); // купол ездит за нами

  // Солнце ходит по кругу над игроком
  sun.position.set(G.player.x + Math.cos(ang) * 80, G.player.feet + Math.sin(ang) * 80, G.player.z + 20);
  sun.target.position.set(G.player.x, G.player.feet, G.player.z);
  sun.intensity = 0.12 + dl * 0.6;
  sun.color.setHSL(0.1, 0.5, dl < 0.3 ? 0.65 : 0.95); // вечером свет рыжеет
  ambient.intensity = 0.22 + dl * 0.45;

  // Звёзды видны только ночью и следуют за игроком
  starMat.opacity = Math.max(0, 1 - dl * 3);
  stars.position.set(G.camera.position.x, 0, G.camera.position.z);

  // Солнышко и луна кружатся по небу: солнце — по своей орбите,
  // луна — ровно напротив (когда одно встаёт, другое садится)
  const p = G.player;
  sunSprite.position.set(p.x + Math.cos(ang) * 170, p.feet + Math.sin(ang) * 170, p.z - 60);
  moonSprite.position.set(p.x - Math.cos(ang) * 150, p.feet - Math.sin(ang) * 150, p.z - 40);
  // Под горизонтом прячемся — не светим из-под земли
  sunSprite.material.opacity = Math.min(1, Math.max(0, Math.sin(ang) * 4 + 0.4));
  moonSprite.material.opacity = Math.min(1, Math.max(0, -Math.sin(ang) * 4 + 0.4));

  // 🌊 Вода живая: текстура чуть ползёт туда-сюда — волны колышутся,
  // а прозрачность дышит, как рябь на озере
  const wt = performance.now() / 1000;
  waterTex.offset.set(Math.sin(wt * 0.5) * 0.02, Math.cos(wt * 0.35) * 0.02);
  chunkMatWater.opacity = 0.58 + Math.sin(wt * 1.2) * 0.04;

  if (dl < 0.08) emit('night'); // квест «Дождись ночи»
}

// Значок времени суток (вызывается периодически, не каждый кадр)
export function updateSlowUI() {
  timeBadge.textContent = G.time.daylight > 0.15 ? '🌞 День' : '🌙 Ночь';
}
