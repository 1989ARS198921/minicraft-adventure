// ============================================================
//  🏙️ НЕБЕСНЫЕ ГОРОДА (С ПОЛНОЙ ФИЗИКОЙ БЛОКОВ!)
// ============================================================

import * as THREE from 'three';

let G = null;
let citiesCreated = false;

// ---- ХРАНИЛИЩЕ БЛОКОВ ДЛЯ ФИЗИКИ ----
let cityBlocks = [];

// ---- ДАННЫЕ ГОРОДОВ ----
export const CITIES = [
  {
    id: 'sky_city_1',
    name: '☁️ Облачный город',
    x: 200,
    z: 0,
    height: 30,
    size: 20,
    color: 0xE8F0FF
  },
  {
    id: 'sky_city_2',
    name: '🌅 Город Рассвета',
    x: -200,
    z: 0,
    height: 38,
    size: 25,
    color: 0xFFD700
  }
];

// ============================================================
//  🔍 ФУНКЦИИ ДЛЯ ФИЗИКИ (экспортируются в player.js)
// ============================================================

// ---- ПОЛУЧИТЬ БЛОК ПО КООРДИНАТАМ ----
export function getCityBlockAt(x, y, z) {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  
  for (const block of cityBlocks) {
    const bx = Math.floor(block.position.x);
    const by = Math.floor(block.position.y);
    const bz = Math.floor(block.position.z);
    if (bx === fx && by === fy && bz === fz) {
      return block;
    }
  }
  return null;
}

// ---- ПРОВЕРКА СТОЛКНОВЕНИЯ С БЛОКАМИ ----
export function checkCityCollisions(position) {
  const fx = Math.floor(position.x);
  const fy = Math.floor(position.y);
  const fz = Math.floor(position.z);
  
  for (const block of cityBlocks) {
    if (!block.userData || !block.userData.isSolid) continue;
    const bx = Math.floor(block.position.x);
    const by = Math.floor(block.position.y);
    const bz = Math.floor(block.position.z);
    if (bx === fx && by === fy && bz === fz) {
      return true;
    }
  }
  return false;
}

// ---- ПОЛУЧИТЬ ВЫСОТУ БЛИЖАЙШЕГО БЛОКА СНИЗУ ----
export function getCityGroundHeight(x, z, maxY = 50) {
  const fx = Math.floor(x);
  const fz = Math.floor(z);
  
  for (let y = Math.floor(maxY); y >= -10; y--) {
    for (const block of cityBlocks) {
      if (!block.userData || !block.userData.isSolid) continue;
      const bx = Math.floor(block.position.x);
      const by = Math.floor(block.position.y);
      const bz = Math.floor(block.position.z);
      if (bx === fx && by === y && bz === fz) {
        return y + 1;
      }
    }
  }
  return -10;
}

// ---- ОЧИСТИТЬ БЛОКИ ----
export function clearCityBlocks() {
  cityBlocks = [];
}

// ============================================================
//  🏗️ СОЗДАНИЕ БЛОЧНОГО ГОРОДА
// ============================================================

function createSkyCityBlocks(data) {
  const scene = G.scene;
  const { x, z, height, size, name } = data;

  const group = new THREE.Group();

  // ---- МАТЕРИАЛЫ БЛОКОВ ----
  const materials = {
    stone: new THREE.MeshLambertMaterial({ color: 0x8B8B8B }),
    grass: new THREE.MeshLambertMaterial({ color: 0x5D9B42 }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8B5A35 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x8B5A2B }),
    planks: new THREE.MeshLambertMaterial({ color: 0xC89B5A }),
    brick: new THREE.MeshLambertMaterial({ color: 0xB7422F }),
    glass: new THREE.MeshLambertMaterial({ color: 0xDFF4FA, transparent: true, opacity: 0.5 }),
    gold: new THREE.MeshLambertMaterial({ color: 0xFFD700 }),
    torch: new THREE.MeshLambertMaterial({ color: 0xFFCC66, emissive: 0xFFAA00, emissiveIntensity: 0.3 }),
    roof: new THREE.MeshLambertMaterial({ color: 0x8B3E2E })
  };

  const BLOCK = 1;

  // ============================================================
  //  1. ПЛАТФОРМА
  // ============================================================

  // ---- НИЖНИЙ СЛОЙ (КАМЕНЬ) ----
  for (let dx = -size; dx <= size; dx++) {
    for (let dz = -size; dz <= size; dz++) {
      if (Math.hypot(dx, dz) < size) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK, 0.8, BLOCK),
          materials.stone
        );
        block.position.set(x + dx, height, z + dz);
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData.isSolid = true;
        block.userData.blockType = 'stone';
        block.userData.cityBlock = true;
        group.add(block);
        cityBlocks.push(block);
      }
    }
  }

  // ---- ВЕРХНИЙ СЛОЙ (ТРАВА) ----
  for (let dx = -size; dx <= size; dx++) {
    for (let dz = -size; dz <= size; dz++) {
      if (Math.hypot(dx, dz) < size - 0.5) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK, 0.2, BLOCK),
          materials.grass
        );
        block.position.set(x + dx, height + 0.5, z + dz);
        block.receiveShadow = true;
        block.userData.isSolid = true;
        block.userData.blockType = 'grass';
        block.userData.cityBlock = true;
        group.add(block);
        cityBlocks.push(block);
      }
    }
  }

  // ---- БОРДЮР ----
  for (let dx = -size; dx <= size; dx++) {
    for (let dz = -size; dz <= size; dz++) {
      const dist = Math.hypot(dx, dz);
      if (dist > size - 1.5 && dist < size + 0.5) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK, 0.3, BLOCK),
          materials.stone
        );
        block.position.set(x + dx, height + 0.15, z + dz);
        block.userData.isSolid = true;
        block.userData.cityBlock = true;
        group.add(block);
        cityBlocks.push(block);
      }
    }
  }

  // ============================================================
  //  2. ЗДАНИЯ
  // ============================================================

  const buildingPositions = [
    { dx: -5, dz: -5, w: 3, h: 3, d: 3 },
    { dx: 5, dz: -5, w: 3, h: 2.5, d: 3 },
    { dx: -5, dz: 5, w: 2.5, h: 3.5, d: 2.5 },
    { dx: 5, dz: 5, w: 3, h: 2, d: 3 },
    { dx: -8, dz: -2, w: 2, h: 3, d: 2 },
    { dx: 8, dz: -2, w: 2, h: 2.5, d: 2 },
    { dx: -8, dz: 2, w: 2, h: 4, d: 2 },
    { dx: 8, dz: 2, w: 2, h: 2, d: 2 },
    { dx: -2, dz: -8, w: 2, h: 3, d: 2 },
    { dx: 2, dz: -8, w: 2, h: 2.5, d: 2 },
    { dx: -2, dz: 8, w: 2, h: 3.5, d: 2 },
    { dx: 2, dz: 8, w: 2, h: 2, d: 2 }
  ];

  const wallColors = [
    0xE8F0FF, 0xD4E8F8, 0xC0D8E8, 0xFFF8E8,
    0xE8E0D0, 0xD0D8E8, 0xE8D8C8, 0xF0E8D8
  ];

  for (let i = 0; i < Math.min(buildingPositions.length, 10); i++) {
    const b = buildingPositions[i];
    const wx = x + b.dx;
    const wz = z + b.dz;
    const color = wallColors[i % wallColors.length];
    const wallMat = new THREE.MeshLambertMaterial({ color: color });

    // ---- СТЕНЫ ----
    for (let bx = -Math.floor(b.w / 2); bx <= Math.floor(b.w / 2); bx++) {
      for (let by = 0; by < Math.floor(b.h); by++) {
        for (let bz = -Math.floor(b.d / 2); bz <= Math.floor(b.d / 2); bz++) {
          const isWall = Math.abs(bx) === Math.floor(b.w / 2) || Math.abs(bz) === Math.floor(b.d / 2);
          if (isWall) {
            if (bx === 0 && bz === Math.floor(b.d / 2) && by < 2) continue;
            if (by === Math.floor(b.h / 2) && (Math.abs(bx) === Math.floor(b.w / 2) || Math.abs(bz) === Math.floor(b.d / 2))) {
              const glass = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.5, 0.1),
                materials.glass
              );
              glass.position.set(wx + bx, height + 0.7 + by + 0.5, wz + bz);
              glass.userData.isSolid = false;
              glass.userData.cityBlock = true;
              group.add(glass);
            } else {
              const block = new THREE.Mesh(
                new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK),
                wallMat
              );
              block.position.set(wx + bx, height + 0.5 + by + 0.5, wz + bz);
              block.castShadow = true;
              block.receiveShadow = true;
              block.userData.isSolid = true;
              block.userData.blockType = 'planks';
              block.userData.cityBlock = true;
              group.add(block);
              cityBlocks.push(block);
            }
          }
        }
      }
    }

    // ---- ДВЕРЬ ----
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x6B4A2B });
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.8, 0.05),
      doorMat
    );
    door.position.set(wx, height + 0.3, wz + Math.floor(b.d / 2) + 0.05);
    door.userData.isSolid = false;
    door.userData.cityBlock = true;
    group.add(door);

    // ---- КРЫША ----
    for (let rx = -(Math.floor(b.w / 2) + 1); rx <= Math.floor(b.w / 2) + 1; rx++) {
      for (let rz = -(Math.floor(b.d / 2) + 1); rz <= Math.floor(b.d / 2) + 1; rz++) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(BLOCK, 0.3, BLOCK),
          materials.roof
        );
        block.position.set(wx + rx, height + 0.5 + Math.floor(b.h) + 0.15, wz + rz);
        block.castShadow = true;
        block.userData.isSolid = true;
        block.userData.cityBlock = true;
        group.add(block);
        cityBlocks.push(block);
      }
    }
  }

  // ============================================================
  //  3. ЦЕНТРАЛЬНАЯ БАШНЯ
  // ============================================================

  const towerMat = new THREE.MeshLambertMaterial({ color: 0xE8F0FF });
  for (let y = 0; y < 5; y++) {
    const tw = 2.5 - y * 0.2;
    for (let bx = -Math.floor(tw / 2); bx <= Math.floor(tw / 2); bx++) {
      for (let bz = -Math.floor(tw / 2); bz <= Math.floor(tw / 2); bz++) {
        if (Math.abs(bx) === Math.floor(tw / 2) || Math.abs(bz) === Math.floor(tw / 2)) {
          const block = new THREE.Mesh(
            new THREE.BoxGeometry(BLOCK, 0.5, BLOCK),
            towerMat
          );
          block.position.set(x + bx, height + 1.0 + y * 0.6 + 0.25, z + bz);
          block.castShadow = true;
          block.receiveShadow = true;
          block.userData.isSolid = true;
          block.userData.cityBlock = true;
          group.add(block);
          cityBlocks.push(block);
        }
      }
    }
  }

  // Шпиль
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1.2, 6),
    materials.gold
  );
  spire.position.set(x, height + 4.5, z);
  spire.castShadow = true;
  group.add(spire);

  // ============================================================
  //  4. ФОНАРИ
  // ============================================================

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const r = size - 1.5;
    const fx = x + Math.cos(angle) * r;
    const fz = z + Math.sin(angle) * r;

    for (let y = 0; y < 2; y++) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.5, 0.15),
        materials.stone
      );
      pillar.position.set(fx, height + 0.25 + y * 0.5, fz);
      pillar.userData.isSolid = true;
      pillar.userData.cityBlock = true;
      group.add(pillar);
      cityBlocks.push(pillar);
    }

    const lantern = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.4, 0.3),
      materials.torch
    );
    lantern.position.set(fx, height + 1.3, fz);
    group.add(lantern);
  }

  // ============================================================
  //  5. МАЛЫЕ БАШНИ
  // ============================================================

  const cornerPositions = [
    [-size + 2, -size + 2],
    [size - 2, -size + 2],
    [-size + 2, size - 2],
    [size - 2, size - 2]
  ];

  for (const [cx, cz] of cornerPositions) {
    const towerMat2 = new THREE.MeshLambertMaterial({ color: 0xC0D8E8 });
    for (let y = 0; y < 3; y++) {
      for (let bx = -1; bx <= 1; bx++) {
        for (let bz = -1; bz <= 1; bz++) {
          if (Math.abs(bx) === 1 || Math.abs(bz) === 1) {
            const block = new THREE.Mesh(
              new THREE.BoxGeometry(BLOCK, 0.5, BLOCK),
              towerMat2
            );
            block.position.set(x + cx + bx, height + 0.5 + y * 0.5 + 0.25, z + cz + bz);
            block.castShadow = true;
            block.receiveShadow = true;
            block.userData.isSolid = true;
            block.userData.cityBlock = true;
            group.add(block);
            cityBlocks.push(block);
          }
        }
      }
    }
    const spire2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.8, 6),
      materials.gold
    );
    spire2.position.set(x + cx, height + 2.5, z + cz);
    group.add(spire2);
  }

  // ============================================================
  //  6. ОБЛАКА
  // ============================================================

  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = size + 2 + Math.random() * 6;
    const cloudX = x + Math.cos(angle) * r;
    const cloudZ = z + Math.sin(angle) * r;
    const cloudY = height - 1 + Math.random() * 3;
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.2
    });
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(0.8 + Math.random() * 1.2, 6, 6),
      cloudMat
    );
    cloud.position.set(cloudX, cloudY, cloudZ);
    group.add(cloud);
  }

  // ============================================================
  //  7. ЛЕСТНИЦА
  // ============================================================

  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 0.6),
      materials.stone
    );
    const angle = Math.PI / 4;
    const sx = x + Math.cos(angle) * (size + i * 0.8);
    const sz = z + Math.sin(angle) * (size + i * 0.8);
    step.position.set(sx, height - i * 0.5 - 0.1, sz);
    step.castShadow = true;
    step.receiveShadow = true;
    step.userData.isSolid = true;
    step.userData.cityBlock = true;
    group.add(step);
    cityBlocks.push(step);
  }

  // ---- ДОБАВЛЯЕМ ВСЁ В СЦЕНУ ----
  scene.add(group);

  console.log(`🏙️ ${name} построен! (${x}, ${z}, высота ${height})`);
  console.log(`   📦 Всего блоков: ${group.children.length}`);
  console.log(`   📍 Стоять можно на высоте ${height + 0.5}`);
  
  return group;
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================

export function initCities(gameContext) {
  G = gameContext;
  if (citiesCreated) return;

  console.log('🏙️ Строим небесные города из блоков...');

  // Очищаем старые блоки
  clearCityBlocks();

  for (const city of CITIES) {
    createSkyCityBlocks(city);
  }

  citiesCreated = true;
  console.log(`✅ ${CITIES.length} небесных городов создано!`);
  console.log(`📦 Всего блоков в городах: ${cityBlocks.length}`);
  console.log('📌 Телепорт: camera.position.set(200, 31.5, 0) — Облачный город');
  console.log('📌 Телепорт: camera.position.set(-200, 39, 0) — Город Рассвета');
}

export function getCityPositions() {
  return CITIES.map(c => ({
    x: c.x,
    z: c.z,
    height: c.height,
    name: c.name,
    groundY: c.height + 0.5
  }));
}