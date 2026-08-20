// ============================================================
//  ☁️ ОБЛАКА — плоские белые «пуховки» плывут над миром
//  Десяток коробочек медленно летят и огибают игрока по кругу:
//  уплыло далеко вперёд — появится сзади. Бесконечный дрейф!
// ============================================================

import * as THREE from 'three';

let G = null;
let clouds = null;
let cloudMat = null; // материал один на всех — красим все облака разом
const NIGHT_CLOUD = new THREE.Color(0x2A3454); // цвет облаков глубокой ночью

export function initClouds(gameContext) {
  G = gameContext;
  clouds = new THREE.Group();
  const geo = new THREE.BoxGeometry(7, 0.6, 5);
  cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
  const mat = cloudMat;
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Mesh(geo, mat);
    c.position.set(Math.random() * 160 - 80, 33 + Math.random() * 6, Math.random() * 160 - 80);
    const s = 0.8 + Math.random() * 1.6; // облака разного размера
    c.scale.set(s, 1, s);
    clouds.add(c);
  }
  G.scene.add(clouds);
}

export function updateClouds(dt) {
  // Ночью облака темнеют и тают, чтобы не висеть чёрными плитами в небе
  const dl = G.time.daylight;
  cloudMat.color.setHex(0xFFFFFF).lerp(NIGHT_CLOUD, 1 - dl);
  cloudMat.opacity = 0.3 + dl * 0.45;
  for (const c of clouds.children) {
    c.position.x += dt * 1.2; // ветер дует на восток
    // Облако уплыло далеко? Перекидываем его на другую сторону неба
    if (c.position.x - G.player.x > 100) c.position.x -= 200;
    if (c.position.x - G.player.x < -100) c.position.x += 200;
    if (c.position.z - G.player.z > 100) c.position.z -= 200;
    if (c.position.z - G.player.z < -100) c.position.z += 200;
  }
}
