// ============================================================
//  ✨ ЧАСТИЦЫ — блок «рассыпается» на осколки при разрушении
// ============================================================

import * as THREE from 'three';
import { COLORS } from './config.js';

let G = null;
export function initParticles(gameContext) { G = gameContext; }

const partGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
const partMats = {}; // краска осколков для каждого типа блока
for (const t in COLORS) partMats[t] = new THREE.MeshBasicMaterial({ color: COLORS[t] });

const particles = [];
const MAX_PARTICLES = 150; // ограничение, чтобы телефон не задохнулся

// Фейерверк из 14 осколков в клетке (x, y, z)
export function spawnParticles(x, y, z, type) {
  if (particles.length > MAX_PARTICLES) return;
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(partGeo, partMats[type]);
    p.position.set(x + 0.5, y + 0.5, z + 0.5);
    p.userData = {
      vx: (Math.random() - 0.5) * 6,   // разлетаются в стороны
      vy: 2 + Math.random() * 5,       // и вверх
      vz: (Math.random() - 0.5) * 6,
      life: 0.6 + Math.random() * 0.3  // живут меньше секунды
    };
    G.scene.add(p);
    particles.push(p);
  }
}

// Каждый кадр: осколки летят, падают и тают
export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i], u = p.userData;
    u.vy -= 15 * dt; // осколки тоже подчиняются гравитации
    p.position.x += u.vx * dt;
    p.position.y += u.vy * dt;
    p.position.z += u.vz * dt;
    u.life -= dt;
    p.scale.setScalar(Math.max(0.05, u.life * 1.6)); // тают на глазах
    if (u.life <= 0) {
      G.scene.remove(p);
      particles[i] = particles[particles.length - 1]; // быстрое удаление
      particles.pop();
    }
  }
}
