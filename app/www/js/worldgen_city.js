// ============================================================
//  ⚡ ПОЛУЧАЕМ ДОСТУП К ГЛОБАЛЬНЫМ ОБЪЕКТАМ
// ============================================================
let __scene = window.scene || window.__scene || (window.G && window.G.scene);
let __camera = window.camera || window.__camera || (window.G && window.G.camera);

// Функция для показа сообщений (без showToast)
function showMsg(text) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = text;
    toast.style.opacity = 1;
    clearTimeout(window._msgTimer);
    window._msgTimer = setTimeout(() => { toast.style.opacity = 0; }, 3000);
  } else {
    console.log('💬 ' + text);
  }
}

// Функция для создания кубов
function makeCube(x, y, z, w, h, d, color, tag = '') {
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
//  🏙️ ГЕНЕРАЦИЯ ГОРОДА
// ============================================================
function generateCity() {
  const cityCenter = { x: -100, z: -80 };
  const colors = [0x8B5A2B, 0x5D9B42, 0x9B59B6, 0xE67E22, 0x3498DB, 0xE74C3C, 0x2ECC71, 0xF1C40F];

  // Центральная площадь
  for (let dx = -6; dx <= 6; dx++) {
    for (let dz = -6; dz <= 6; dz++) {
      if (Math.hypot(dx, dz) < 6) {
        makeCube(cityCenter.x + dx, 0.01, cityCenter.z + dz, 1, 0.04, 1, 0x8b5a35);
      }
    }
  }

  // Фонтан
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const r = Math.hypot(dx, dz);
      if (r < 2) {
        makeCube(cityCenter.x + dx, 0.5, cityCenter.z + dz, 1, 0.3, 1, r < 1 ? 0xd7a52b : 0x777777);
      }
    }
  }
  makeCube(cityCenter.x, 0.8, cityCenter.z, 0.8, 0.3, 0.8, 0x3D8BDD);

  // Дома
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 7 + Math.random() * 14;
    const x = cityCenter.x + Math.cos(angle) * r;
    const z = cityCenter.z + Math.sin(angle) * r;
    const color = colors[i % colors.length];
    const roofColor = i % 2 === 0 ? 0x8B3E2E : 0x4A2E1A;

    makeCube(x, 1, z, 3, 2, 3, color);
    makeCube(x, 2.5, z, 3.5, 1, 3.5, roofColor);
    for (const [wx, wz] of [[-0.8, 1.1], [0.8, 1.1], [-0.8, -1.1], [0.8, -1.1]]) {
      makeCube(x + wx, 1.4, z + wz, 0.3, 0.4, 0.1, 0xDFF4FA);
    }
    makeCube(x, 0.5, z + 1.6, 0.6, 0.8, 0.1, 0x6B4A2B);
  }

  // Фонари
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const r = 6 + Math.random() * 16;
    const x = cityCenter.x + Math.cos(angle) * r;
    const z = cityCenter.z + Math.sin(angle) * r;
    makeCube(x, 2, z, 0.2, 2, 0.2, 0x777777);
    makeCube(x, 3.2, z, 0.6, 0.4, 0.6, 0xFFD75E);
  }

  console.log('🏙️ Город создан! Координаты: -100, -80');
  return cityCenter;
}

// ============================================================
//  👥 ЖИТЕЛИ ГОРОДА
// ============================================================
const CITY_NPCS = [
  { id: 'mayor', name: '🏛️ Мэр', x: -100, z: -80, color: 0x315f9b },
  { id: 'merchant1', name: '⚔️ Торговец оружием', x: -106, z: -85, color: 0xe67e22 },
  { id: 'merchant2', name: '🛡️ Торговец бронёй', x: -94, z: -75, color: 0xe67e22 },
  { id: 'merchant3', name: '🧪 Торговец зельями', x: -106, z: -75, color: 0xe67e22 },
  { id: 'smith', name: '🔨 Кузнец', x: -93, z: -86, color: 0x9b59b6 },
  { id: 'keykeeper', name: '🔑 Хранитель ключей', x: -100, z: -72, color: 0x2ecc71 },
  { id: 'citizen1', name: '🌱 Садовник', x: -108, z: -90, color: 0x5d9b42 },
  { id: 'citizen2', name: '🍞 Пекарь', x: -92, z: -92, color: 0xf1c40f },
  { id: 'citizen3', name: '🌿 Лекарь', x: -95, z: -68, color: 0x2ecc71 },
  { id: 'citizen4', name: '🐟 Рыбак', x: -110, z: -78, color: 0x3498db },
  { id: 'citizen5', name: '⚔️ Стражник', x: -105, z: -65, color: 0x8b5a2b }
];

function createCityNPCs() {
  const scene = __scene || window.scene;
  if (!scene) return;

  CITY_NPCS.forEach((npc) => {
    try {
      const mat = new THREE.MeshLambertMaterial({ color: npc.color || 0x315f9b });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), mat);
      mesh.position.set(npc.x, 1, npc.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.npc = npc;
      mesh.userData.isCityNPC = true;
      scene.add(mesh);
    } catch(e) {}
  });

  console.log(`👥 ${CITY_NPCS.length} жителей создано!`);
}

// ============================================================
//  🏰 НЕБЕСНЫЙ ЗАМОК
// ============================================================
function createSkyCastle() {
  const scene = __scene || window.scene;
  if (!scene) return null;

  const castleX = -100;
  const castleZ = 0;
  const baseY = 80;

  // Платформа
  for (let dx = -16; dx <= 16; dx++) {
    for (let dz = -16; dz <= 16; dz++) {
      if (Math.hypot(dx, dz) < 14) {
        try {
          const mat = new THREE.MeshLambertMaterial({ color: 0x8B8B8B });
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), mat);
          mesh.position.set(castleX + dx, baseY, castleZ + dz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
        } catch(e) {}
      }
    }
  }

  // Стены
  for (let x = -12; x <= 12; x += 2) {
    for (let z = -12; z <= 12; z += 2) {
      if (Math.abs(x) === 12 || Math.abs(z) === 12) {
        try {
          const mat = new THREE.MeshLambertMaterial({ color: 0x9A9A9A });
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), mat);
          mesh.position.set(castleX + x, baseY + 2, castleZ + z);
          mesh.castShadow = true;
          scene.add(mesh);
        } catch(e) {}
      }
    }
  }

  // Башни
  const towerPos = [[-12, -12], [12, -12], [-12, 12], [12, 12]];
  towerPos.forEach(([tx, tz]) => {
    try {
      const mat = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });
      for (let dy = 0; dy < 6; dy++) {
        const r = dy < 3 ? 2 : 1.5;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(r, 0.5, r), mat);
        mesh.position.set(castleX + tx, baseY + 2 + dy, castleZ + tz);
        scene.add(mesh);
      }
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1, 2, 4),
        new THREE.MeshLambertMaterial({ color: 0xFFD75E })
      );
      spire.position.set(castleX + tx, baseY + 8, castleZ + tz);
      scene.add(spire);
    } catch(e) {}
  });

  // Тронный зал
  try {
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xFFD75E });
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 1), goldMat);
        mesh.position.set(castleX + dx, baseY + 4, castleZ + dz);
        scene.add(mesh);
      }
    }

    const throne = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xFFD75E, emissive: 0xFFAA00, emissiveIntensity: 0.2 })
    );
    throne.position.set(castleX, baseY + 4.5, castleZ - 2);
    scene.add(throne);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2),
      new THREE.MeshLambertMaterial({ color: 0x00DDFF, emissive: 0x00AAFF, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 })
    );
    crystal.position.set(castleX, baseY + 7, castleZ);
    scene.add(crystal);
  } catch(e) {}

  // Облака
  for (let i = 0; i < 20; i++) {
    try {
      const angle = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 15;
      const x = castleX + Math.cos(angle) * r;
      const z = castleZ + Math.sin(angle) * r;
      const y = baseY + Math.random() * 8 - 4;
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 2, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.2 + Math.random() * 0.3 })
      );
      cloud.position.set(x, y, z);
      scene.add(cloud);
    } catch(e) {}
  }

  console.log('🏰 Небесный замок создан! Координаты: -100, 0, высота 80');
  return { x: castleX, z: castleZ, y: baseY };
}

// ============================================================
//  ⚔️ ТИТАН
// ============================================================
function createTitan() {
  const scene = __scene || window.scene;
  if (!scene) return null;

  const castleX = -100;
  const castleZ = 0;
  const baseY = 80;

  try {
    const group = new THREE.Group();

    // Тело
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2), new THREE.MeshLambertMaterial({ color: 0x4A4A6A }));
    body.position.y = 3;
    group.add(body);

    // Голова
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.5), new THREE.MeshLambertMaterial({ color: 0x3A3A5A }));
    head.position.y = 5.5;
    group.add(head);

    // Глаза
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), eyeMat);
    eyeL.position.set(-0.5, 5.6, 0.8);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.5;
    group.add(eyeR);

    // Руки
    const armMat = new THREE.MeshLambertMaterial({ color: 0x4A4A6A });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 0.6), armMat);
    armL.position.set(-2, 2.5, 0);
    group.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 0.6), armMat);
    armR.position.set(2, 2.5, 0);
    group.add(armR);

    // Молот
    const hammerMat = new THREE.MeshLambertMaterial({ color: 0x8B8B8B });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), hammerMat);
    handle.position.set(2.5, 1, 0);
    group.add(handle);
    const headHammer = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), new THREE.MeshLambertMaterial({ color: 0xCCCCCC }));
    headHammer.position.set(2.5, 3, 0);
    group.add(headHammer);

    // Ноги
    const legMat = new THREE.MeshLambertMaterial({ color: 0x3A3A5A });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.8), legMat);
    legL.position.set(-0.8, 0.5, 0);
    group.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.8), legMat);
    legR.position.set(0.8, 0.5, 0);
    group.add(legR);

    // Крылья
    const wingMat = new THREE.MeshLambertMaterial({ color: 0x2A2A3A, transparent: true, opacity: 0.7 });
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2), wingMat);
      wing.position.set(side * 2.5, 3, 0);
      wing.rotation.z = side * 0.5;
      wing.rotation.x = 0.3;
      group.add(wing);
    }

    group.position.set(castleX, baseY + 2, castleZ);
    scene.add(group);

    const titanData = {
      group: group,
      hp: 500,
      maxHp: 500,
      attack: 25,
      defense: 10,
      xp: 500,
      gold: 300,
      alive: true,
      name: '⚔️ ТИТАН'
    };

    window.titan = titanData;
    console.log('⚔️ Титан создан! HP: 500');
    return titanData;
  } catch(e) {
    console.error('❌ Ошибка создания Титана:', e);
    return null;
  }
}

// ============================================================
//  🚀 ЗАПУСК
// ============================================================
try {
  console.log('🏙️ Создание города...');
  const cityCenter = generateCity();

  console.log('👥 Создание жителей...');
  createCityNPCs();

  console.log('🏰 Создание небесного замка...');
  const castle = createSkyCastle();

  console.log('⚔️ Создание Титана...');
  const titan = createTitan();

  console.log('✅ ВСЁ СОЗДАНО!');
  console.log('🗺️ Город: (-100, -80)');
  console.log('🏰 Замок: (-100, 0, высота 80)');
  console.log('📜 Введи в консоль: camera.position.set(-100, 2, -80) чтобы попасть в город!');
} catch(e) {
  console.error('❌ Ошибка:', e);
}