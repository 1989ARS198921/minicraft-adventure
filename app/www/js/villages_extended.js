// ============================================================
//  🏘️ 7 ДЕРЕВЕНЬ — все на земле (исправлена магическая)
// ============================================================

import * as THREE from 'three';

let G = null;
let villagesCreated = false;

// ---- ВСЕ 7 ДЕРЕВЕНЬ ----
export const VILLAGES_DATA = [
  {
    id: 'central',
    name: '🏠 Центральная деревня',
    x: 0, z: 0,
    color: 0x8B5A2B,
    size: 15,
    houses: 5,
    type: 'human',
    groundY: 0
  },
  {
    id: 'elf',
    name: '🧝 Лесная эльфийская',
    x: 88, z: 66,
    color: 0x2ECC71,
    size: 14,
    houses: 4,
    type: 'elf',
    groundY: 0
  },
  {
    id: 'orc',
    name: '👹 Стойбище орков',
    x: -150, z: -100,
    color: 0x6A9A4A,
    size: 12,
    houses: 3,
    type: 'orc',
    groundY: 0
  },
  {
    id: 'forest',
    name: '🌲 Лесная деревня',
    x: 80, z: 60,
    color: 0x5D9B42,
    size: 13,
    houses: 4,
    type: 'forest',
    groundY: 0
  },
  {
    id: 'mountain',
    name: '🏔️ Горная деревня',
    x: -60, z: -40,
    color: 0x8B8B8B,
    size: 12,
    houses: 4,
    type: 'dwarf',
    groundY: 0
  },
  {
    id: 'fishing',
    name: '🎣 Рыбацкая деревня',
    x: -80, z: 110,
    color: 0x3498DB,
    size: 13,
    houses: 4,
    type: 'fisher',
    groundY: 0
  },
  {
    id: 'magic',
    name: '🔮 Магическая деревня',
    x: 120, z: -100,
    color: 0x9B59B6,
    size: 14,
    houses: 5,
    type: 'mage',
    groundY: 0  // ← ИСПРАВЛЕНО!
  }
];

// ---- СОЗДАНИЕ ДЕРЕВНИ ----
function createVillage(data) {
  const scene = G.scene;
  const { x, z, color, size, name, houses, type, groundY } = data;
  
  const group = new THREE.Group();
  
  // ---- ПОДНИМАЕМ ДЕРЕВНЮ НАД ЗЕМЛЁЙ ----
  const yOffset = (type === 'mage') ? 0.5 : 0.1;
  
  // ---- ЗЕМЛЯ (ПЛАТФОРМА) ----
  const groundMat = new THREE.MeshLambertMaterial({ 
    color: type === 'mage' ? 0x6A4A8A : 0x5D9B42 
  });
  
  // Создаём плотную платформу, чтобы не проваливаться
  for (let dx = -size/2; dx <= size/2; dx += 0.5) {
    for (let dz = -size/2; dz <= size/2; dz += 0.5) {
      if (Math.hypot(dx, dz) < size/2 - 0.5) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.3, 0.5),
          groundMat
        );
        mesh.position.set(x + dx, yOffset, z + dz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
      }
    }
  }
  
  // ---- МАГИЧЕСКАЯ ПОДСВЕТКА (для магической деревни) ----
  if (type === 'mage') {
    const glowMat = new THREE.MeshLambertMaterial({
      color: 0x9B59B6,
      emissive: 0x9B59B6,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.3
    });
    for (let dx = -size/2; dx <= size/2; dx += 2) {
      for (let dz = -size/2; dz <= size/2; dz += 2) {
        if (Math.hypot(dx, dz) < size/2 - 1) {
          const glow = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.05, 0.3),
            glowMat
          );
          glow.position.set(x + dx, yOffset + 0.2, z + dz);
          group.add(glow);
        }
      }
    }
  }
  
  // ---- ДОМА ----
  const houseColors = [
    0x8B5A2B, 0x5D9B42, 0x9B59B6, 0xE67E22, 0x3498DB,
    0xE74C3C, 0x2ECC71, 0xF1C40F
  ];
  
  const houseOffsets = [
    [-4, -4], [4, -4], [-4, 4], [4, 4],
    [0, -5], [0, 5], [-5, 0], [5, 0]
  ];
  
  for (let i = 0; i < Math.min(houses, houseOffsets.length); i++) {
    const [dx, dz] = houseOffsets[i];
    const hx = x + dx;
    const hz = z + dz;
    const col = houseColors[i % houseColors.length];
    
    const wallMat = new THREE.MeshLambertMaterial({ color: col });
    const roofMat = new THREE.MeshLambertMaterial({ 
      color: [0x8B3E2E, 0x4A2E1A, 0xCC6633][i % 3] 
    });
    
    // Стены
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.8, 2.5),
      wallMat
    );
    wall.position.set(hx, yOffset + 0.9, hz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    
    // Крыша
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.6, 3),
      roofMat
    );
    roof.position.set(hx, yOffset + 2.0, hz);
    roof.castShadow = true;
    group.add(roof);
    
    // Магическая крыша (светящаяся)
    if (type === 'mage') {
      const magicRoof = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.1, 2.8),
        new THREE.MeshLambertMaterial({
          color: 0x9B59B6,
          emissive: 0x9B59B6,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.3
        })
      );
      magicRoof.position.set(hx, yOffset + 2.3, hz);
      group.add(magicRoof);
    }
    
    // Окна
    const glassMat = new THREE.MeshLambertMaterial({ 
      color: 0xDFF4FA, 
      transparent: true, 
      opacity: 0.5 
    });
    for (const [wx, wz] of [[-0.7, 1.1], [0.7, 1.1], [-0.7, -1.1], [0.7, -1.1]]) {
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.35, 0.06),
        glassMat
      );
      windowMesh.position.set(hx + wx, yOffset + 1.0, hz + wz);
      group.add(windowMesh);
    }
    
    // Дверь
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x6B4A2B });
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.06),
      doorMat
    );
    door.position.set(hx, yOffset + 0.3, hz + 1.3);
    group.add(door);
  }
  
  // ---- КОЛОДЕЦ ----
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x3D8BDD });
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) {
        const water = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.15, 0.5),
          waterMat
        );
        water.position.set(x, yOffset + 0.1, z);
        group.add(water);
      } else {
        const stone = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.35, 0.25),
          stoneMat
        );
        stone.position.set(x + dx * 0.6, yOffset + 0.15, z + dz * 0.6);
        group.add(stone);
      }
    }
  }
  
  scene.add(group);
  console.log(`🏘️ ${name} создана! (${x}, ${z})${type === 'mage' ? ' ✨ магическая' : ''}`);
  return group;
}

// ---- ИНИЦИАЛИЗАЦИЯ ----
export function initVillages(gameContext) {
  G = gameContext;
  if (villagesCreated) return;
  
  console.log('🏘️ Создание всех деревень...');
  
  for (const village of VILLAGES_DATA) {
    createVillage(village);
  }
  
  villagesCreated = true;
  console.log(`✅ ${VILLAGES_DATA.length} деревень создано!`);
  console.log('📍 Магическая деревня поднята над землёй! ✨');
}

// ---- ПОЛУЧИТЬ КООРДИНАТЫ ДЕРЕВЕНЬ ----
export function getVillagePositions() {
  return VILLAGES_DATA.map(v => ({ x: v.x, z: v.z, name: v.name, type: v.type }));
}