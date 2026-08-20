// ============================================================
//  🔥 ФАКЕЛЫ — маленькие светящиеся кубики
//  Ночью они светят по-настоящему! Но настоящих лампочек
//  всего 6 (ближайшим факелам) — иначе телефон задохнётся.
// ============================================================

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { sfx } from './audio.js';
import { emit } from './bus.js';
import { spawnParticles } from './particles.js';

let G = null;
export function initTorches(gameContext) { G = gameContext; }

const torches = []; // {x, y, z, mesh} — клетка, где стоит факел
export function getTorches() { return torches; }

const torchGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
const torchMat = new THREE.MeshBasicMaterial({ color: 0xFFCC66 }); // светится сам

export function addTorch(x, y, z, silent = false) {
  if (torches.some(t => t.x === x && t.y === y && t.z === z)) return false;
  const mesh = new THREE.Mesh(torchGeo, torchMat);
  mesh.position.set(x + 0.5, y + 0.225, z + 0.5);
  mesh.userData.torch = true; // метка для «луча зрения»
  G.scene.add(mesh);
  torches.push({ x, y, z, mesh });
  if (!silent) {
    sfx.torch();
    emit('torch'); // квест «Поставь факел»
    emit('dirty');
  }
  return true;
}

export function removeTorch(t) {
  G.scene.remove(t.mesh);
  torches.splice(torches.indexOf(t), 1);
  sfx.brk();
  spawnParticles(t.x, t.y, t.z, 'trunk');
  emit('dirty');
}

// Пул лампочек — отдаём ближайшим к игроку факелам
const torchLights = [];
export function initTorchLights() {
  for (let i = 0; i < CONFIG.TORCH_LIGHTS; i++) {
    const l = new THREE.PointLight(0xFFB347, 0, CONFIG.TORCH_RADIUS);
    G.scene.add(l);
    torchLights.push(l);
  }
}

export function updateTorchLights() {
  const sorted = [...torches].sort((a, b) =>
    Math.hypot(a.x - G.player.x, a.z - G.player.z) -
    Math.hypot(b.x - G.player.x, b.z - G.player.z));
  for (let i = 0; i < torchLights.length; i++) {
    const t = sorted[i];
    if (t) {
      torchLights[i].position.set(t.x + 0.5, t.y + 0.6, t.z + 0.5);
      torchLights[i].intensity = 1.2 * (1 - G.time.daylight * 0.6); // ночью ярче!
    } else torchLights[i].intensity = 0;
  }
}
