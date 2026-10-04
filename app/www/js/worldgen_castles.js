// ============================================================
//  ⚡ ДОСТУП К СЦЕНЕ (переиспользуем из первого скрипта)
// ============================================================

// Функция для создания кубов
function makeCube2(x, y, z, w, h, d, color, tag = '') {
  const scene = __scene || window.scene;
  if (!scene) return null;
  try {
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.tag = tag;
    scene.add(mesh);
    return mesh;
  } catch(e) {
    return null;
  }
}

// ============================================================
//  🏰 1. ЛЕСНОЙ ЗАМОК (40, 40)
// ============================================================
function createForestCastle() {
  const cx = 40, cz = 40;
  const colors = { wall: 0x5D8A3C, roof: 0x2E5A1E, tower: 0x4A7A2A };

  // Стены (квадрат 12x12)
  for (let x = -6; x <= 6; x += 2) {
    for (let z = -6; z <= 6; z += 2) {
      if (Math.abs(x) === 6 || Math.abs(z) === 6) {
        makeCube2(cx + x, 2, cz + z, 0.5, 4, 0.5, colors.wall, 'forest_wall');
      }
    }
  }

  // Башни по углам
  const towers = [[-6, -6], [6, -6], [-6, 6], [6, 6]];
  towers.forEach(([tx, tz]) => {
    for (let h = 0; h < 6; h++) {
      makeCube2(cx + tx, 2 + h, cz + tz, 1.5, 0.5, 1.5, colors.tower, 'forest_tower');
    }
    // Шпиль
    makeCube2(cx + tx, 8, cz + tz, 0.3, 1.5, 0.3, 0xFFD75E, 'forest_spire');
  });

  // Ворота
  makeCube2(cx, 1.5, cz - 7, 3, 3, 0.5, 0x6B4A2B, 'forest_gate');

  console.log('🏰 Лесной замок создан! Координаты: (40, 40)');
  return { x: cx, z: cz };
}

// ============================================================
//  🏰 2. КАМЕННЫЙ ЗАМОК (-40, 40)
// ============================================================
function createStoneCastle() {
  const cx = -40, cz = 40;
  const colors = { wall: 0x6B6B6B, roof: 0x4A4A4A, tower: 0x7A7A7A };

  // Стены (квадрат 14x14)
  for (let x = -7; x <= 7; x += 2) {
    for (let z = -7; z <= 7; z += 2) {
      if (Math.abs(x) === 7 || Math.abs(z) === 7) {
        makeCube2(cx + x, 2.5, cz + z, 0.5, 5, 0.5, colors.wall, 'stone_wall');
      }
    }
  }

  // Башни по углам (выше)
  const towers = [[-7, -7], [7, -7], [-7, 7], [7, 7]];
  towers.forEach(([tx, tz]) => {
    for (let h = 0; h < 8; h++) {
      makeCube2(cx + tx, 2.5 + h, cz + tz, 2, 0.5, 2, colors.tower, 'stone_tower');
    }
    // Шпиль
    makeCube2(cx + tx, 10.5, cz + tz, 0.4, 2, 0.4, 0xCCCCCC, 'stone_spire');
  });

  // Ворота с аркой
  makeCube2(cx, 1.5, cz - 8, 4, 3, 0.5, 0x6B4A2B, 'stone_gate');
  makeCube2(cx, 4.5, cz - 8, 4.5, 0.5, 0.5, 0x8B8B8B, 'stone_arch');

  console.log('🏰 Каменный замок создан! Координаты: (-40, 40)');
  return { x: cx, z: cz };
}

// ============================================================
//  🏰 3. ЛЕДЯНОЙ ЗАМОК (0, -50)
// ============================================================
function createIceCastle() {
  const cx = 0, cz = -50;
  const colors = { wall: 0x8EC8E8, roof: 0x6AA8C8, tower: 0x9AD8F0 };

  // Стены (квадрат 10x10)
  for (let x = -5; x <= 5; x += 2) {
    for (let z = -5; z <= 5; z += 2) {
      if (Math.abs(x) === 5 || Math.abs(z) === 5) {
        makeCube2(cx + x, 2, cz + z, 0.5, 4, 0.5, colors.wall, 'ice_wall');
      }
    }
  }

  // Башни
  const towers = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
  towers.forEach(([tx, tz]) => {
    for (let h = 0; h < 7; h++) {
      makeCube2(cx + tx, 2 + h, cz + tz, 1.8, 0.5, 1.8, colors.tower, 'ice_tower');
    }
    // Ледяной шпиль
    makeCube2(cx + tx, 9, cz + tz, 0.3, 2, 0.3, 0xAAEEFF, 'ice_spire');
  });

  // Ворота
  makeCube2(cx, 1.5, cz - 6, 3, 3, 0.5, 0x6AA8C8, 'ice_gate');

  // Ледяные кристаллы вокруг
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 6;
    const x = cx + Math.cos(angle) * r;
    const z = cz + Math.sin(angle) * r;
    makeCube2(x, 1 + Math.random() * 2, z, 0.2, 0.5 + Math.random() * 1, 0.2, 0x88DDFF, 'ice_crystal');
  }

  console.log('🏰 Ледяной замок создан! Координаты: (0, -50)');
  return { x: cx, z: cz };
}

// ============================================================
//  👹 МОНСТРЫ В ЗАМКАХ
// ============================================================
function spawnCastleMonsters() {
  const scene = __scene || window.scene;
  if (!scene) return [];

  const monsterColors = [0x7b3f9e, 0x5a4a38, 0x2a2430, 0x8fa08a, 0xd4c9b8];
  const monsterData = [];

  // ---- ЛЕСНОЙ ЗАМОК (15 монстров) ----
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 12;
    const x = 40 + Math.cos(angle) * r;
    const z = 40 + Math.sin(angle) * r;
    const color = monsterColors[i % monsterColors.length];
    const size = 0.7 + Math.random() * 0.5;
    try {
      const mat = new THREE.MeshLambertMaterial({ color: color });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.8, size), mat);
      mesh.position.set(x, 1, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isMonster = true;
      mesh.userData.hp = 30 + Math.random() * 20;
      mesh.userData.type = 'forest_monster';
      scene.add(mesh);
      monsterData.push(mesh);
    } catch(e) {}
  }

  // ---- КАМЕННЫЙ ЗАМОК (18 монстров) ----
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 14;
    const x = -40 + Math.cos(angle) * r;
    const z = 40 + Math.sin(angle) * r;
    const color = monsterColors[(i + 2) % monsterColors.length];
    const size = 0.8 + Math.random() * 0.6;
    try {
      const mat = new THREE.MeshLambertMaterial({ color: color });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.8, size), mat);
      mesh.position.set(x, 1, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isMonster = true;
      mesh.userData.hp = 40 + Math.random() * 25;
      mesh.userData.type = 'stone_monster';
      scene.add(mesh);
      monsterData.push(mesh);
    } catch(e) {}
  }

  // ---- ЛЕДЯНОЙ ЗАМОК (20 монстров) ----
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 10;
    const x = 0 + Math.cos(angle) * r;
    const z = -50 + Math.sin(angle) * r;
    const color = 0x88DDFF;
    const size = 0.7 + Math.random() * 0.7;
    try {
      const mat = new THREE.MeshLambertMaterial({ color: color, emissive: 0x4488AA, emissiveIntensity: 0.1 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size * 1.8, size), mat);
      mesh.position.set(x, 1, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.isMonster = true;
      mesh.userData.hp = 50 + Math.random() * 30;
      mesh.userData.type = 'ice_monster';
      scene.add(mesh);
      monsterData.push(mesh);
    } catch(e) {}
  }

  console.log(`👹 ${monsterData.length} монстров создано в замках!`);
  return monsterData;
}

// ============================================================
//  👑 БОССЫ В ЗАМКАХ
// ============================================================
function spawnCastleBosses() {
  const scene = __scene || window.scene;
  if (!scene) return [];

  const bosses = [];

  // ---- 1. ЛЕСНОЙ ВЕЛИКАН (40, 40) ----
  try {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 2), new THREE.MeshLambertMaterial({ color: 0x2E5A1E }));
    body.position.y = 2.5;
    group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.5), new THREE.MeshLambertMaterial({ color: 0x3A6A2E }));
    head.position.y = 5;
    group.add(head);
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), new THREE.MeshLambertMaterial({ color: 0xFFAA00, emissive: 0xFFAA00, emissiveIntensity: 0.3 }));
    eyes.position.set(0, 5.2, 1);
    group.add(eyes);
    group.position.set(40, 2, 40);
    scene.add(group);
    bosses.push({ group, hp: 200, name: '🌳 Лесной великан', type: 'forest_boss' });
  } catch(e) {}

  // ---- 2. КАМЕННЫЙ ГОЛЕМ (-40, 40) ----
  try {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 2.5), new THREE.MeshLambertMaterial({ color: 0x6B6B6B }));
    body.position.y = 3;
    group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(2, 1.8, 1.8), new THREE.MeshLambertMaterial({ color: 0x7A7A7A }));
    head.position.y = 5.5;
    group.add(head);
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), new THREE.MeshLambertMaterial({ color: 0xFF4444, emissive: 0xFF4444, emissiveIntensity: 0.5 }));
    eyes.position.set(0, 5.7, 1.2);
    group.add(eyes);
    group.position.set(-40, 2, 40);
    scene.add(group);
    bosses.push({ group, hp: 300, name: '🗿 Каменный голем', type: 'stone_boss' });
  } catch(e) {}

  // ---- 3. ЛЕДЯНОЙ ДРАКОН (0, -50) ----
  try {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.5, 4), new THREE.MeshLambertMaterial({ color: 0x8EC8E8 }));
    body.position.y = 2.5;
    group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.8), new THREE.MeshLambertMaterial({ color: 0x9AD8F0 }));
    head.position.set(0, 3.5, 2.5);
    group.add(head);
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), new THREE.MeshLambertMaterial({ color: 0x00DDFF, emissive: 0x00DDFF, emissiveIntensity: 0.5 }));
    eyes.position.set(0, 3.7, 3.2);
    group.add(eyes);
    // Крылья
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), new THREE.MeshLambertMaterial({ color: 0x88DDFF, transparent: true, opacity: 0.6 }));
      wing.position.set(side * 2.2, 3, 0);
      wing.rotation.z = side * 0.5;
      group.add(wing);
    }
    group.position.set(0, 2, -50);
    scene.add(group);
    bosses.push({ group, hp: 400, name: '❄️ Ледяной дракон', type: 'ice_boss' });
  } catch(e) {}

  console.log(`👑 ${bosses.length} боссов создано!`);
  return bosses;
}

// ============================================================
//  🚀 ЗАПУСК
// ============================================================
try {
  console.log('🏰 Создание замков...');
  const forestCastle = createForestCastle();
  const stoneCastle = createStoneCastle();
  const iceCastle = createIceCastle();

  console.log('👹 Создание монстров...');
  const monsters = spawnCastleMonsters();

  console.log('👑 Создание боссов...');
  const bosses = spawnCastleBosses();

  console.log('✅ ВСЁ СОЗДАНО!');
  console.log('🏰 Лесной замок: (40, 40) — 15 монстров + босс');
  console.log('🏰 Каменный замок: (-40, 40) — 18 монстров + босс');
  console.log('🏰 Ледяной замок: (0, -50) — 20 монстров + босс');
  console.log('📜 Всего создано:', monsters.length, 'монстров и', bosses.length, 'боссов');
  console.log('💡 Введи в консоли: camera.position.set(40, 2, 40) чтобы попасть в лесной замок!');
} catch(e) {
  console.error('❌ Ошибка:', e);
}


// ============================================================
//  🔧 ФИКС: ВОЛШЕБНИКИ НА ЗЕМЛЕ, А НЕ В ВОДЕ
// ============================================================

// Исправляем высоту NPC в магической деревне
setTimeout(() => {
  const scene = window.scene || window.__scene;
  if (!scene) return;

  // Находим всех NPC
  scene.traverse((child) => {
    if (child.userData && child.userData.npc) {
      const npc = child.userData.npc;
      // Если NPC из магической деревни
      if (npc.x >= 116 && npc.x <= 124 && npc.z >= -110 && npc.z <= -96) {
        // Поднимаем на высоту 5 (над платформой)
        child.position.y = 5;
        npc.feet = 5;
        console.log(`🧙 ${npc.name} поднят на высоту 5`);
      }
    }
  });

  console.log('✅ Волшебники подняты из воды!');
}, 2000);