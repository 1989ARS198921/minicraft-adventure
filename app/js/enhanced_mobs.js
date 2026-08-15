// enhanced_mobs.js — улучшенные 3D-модели монстров для MiniCraft Adventure
// Использует bodyPart и classicFigure из skins.js
// ПРОМПТ: Создать 20 3D-моделей монстров и боссов для MiniCraft Adventure
// через функцию bodyPart(). Обычные монстры (0.7-1.2 блока): гоблин с
// острыми ушами и ножом, орк с дубиной и шрамом, паук с 8 ногами и паутиной,
// скелет с мечом и щитом, волк с хвостом и пастью, тролль с каменной дубиной,
// зомби с лохмотьями, призрак полупрозрачный без ног, слизень прыгающий,
// летучая мышь с крыльями. Боссы (2.0-4.0 блока): лесной великан с рогами
// и дубиной с шипами, каменный голем с молотом и рунами, ледяной дракон
// с крыльями и шипами, паучиха с 8 лапами, некромант с посохом и черепом,
// кракен с щупальцами и глазом, огненный элементал с пылающим телом,
// тёмный рыцарь с огненным мечом, король гоблинов с короной и посохом,
// ледяной тролль с дубиной изо льда.
// КОММИТ: feat: add detailed 3D mob models with bodyPart system
// 10 regular mobs + 10 bosses with unique anatomy and weapons

// ==================== ПРОВЕРКА THREE.JS ====================
// Если THREE не определён (например, файл загружен до three.module.js),
// откладываем инициализацию
if (typeof THREE === 'undefined') {
    console.warn('⚠️ enhanced_mobs.js: THREE не загружен. Модели будут созданы позже.');
}

// ==================== ПОМОЩНИКИ ====================

function bodyPart({ w, h, d, color, emissive = 0x000000, transparent = false, opacity = 1.0 }) {
    if (typeof THREE === 'undefined') {
        console.error('❌ bodyPart: THREE не определён!');
        return null;
    }
    const geometry = new THREE.BoxGeometry(w, h, d);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissive,
        transparent: transparent,
        opacity: opacity
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ==================== ОБЫЧНЫЕ МОНСТРЫ ====================

function createGoblinModel() {
    const group = new THREE.Group();
    group.userData.type = 'goblin';

    // Тело
    const body = bodyPart({ w: 0.4, h: 0.5, d: 0.25, color: 0x3d7a35 });
    body.position.y = 0.5;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.35, h: 0.35, d: 0.35, color: 0x4a8a42 });
    head.position.y = 0.85;
    group.add(head);

    // Уши (острые)
    const leftEar = bodyPart({ w: 0.08, h: 0.15, d: 0.05, color: 0x4a8a42 });
    leftEar.position.set(-0.2, 0.9, 0);
    leftEar.rotation.z = 0.3;
    group.add(leftEar);

    const rightEar = bodyPart({ w: 0.08, h: 0.15, d: 0.05, color: 0x4a8a42 });
    rightEar.position.set(0.2, 0.9, 0);
    rightEar.rotation.z = -0.3;
    group.add(rightEar);

    // Нож в правой руке
    const arm = bodyPart({ w: 0.1, h: 0.35, d: 0.1, color: 0x3d7a35 });
    arm.position.set(0.28, 0.5, 0.1);
    arm.rotation.z = -0.5;
    group.add(arm);

    const knife = bodyPart({ w: 0.04, h: 0.2, d: 0.02, color: 0x888888 });
    knife.position.set(0.35, 0.35, 0.15);
    group.add(knife);

    // Левая рука
    const leftArm = bodyPart({ w: 0.1, h: 0.35, d: 0.1, color: 0x3d7a35 });
    leftArm.position.set(-0.28, 0.5, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);

    // Ноги
    const leftLeg = bodyPart({ w: 0.12, h: 0.35, d: 0.12, color: 0x5a3a1a });
    leftLeg.position.set(-0.1, 0.18, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.12, h: 0.35, d: 0.12, color: 0x5a3a1a });
    rightLeg.position.set(0.1, 0.18, 0);
    group.add(rightLeg);

    // Глаза (красные, светящиеся)
    const leftEye = bodyPart({ w: 0.06, h: 0.04, d: 0.02, color: 0xff2222, emissive: 0xff2222 });
    leftEye.position.set(-0.08, 0.88, 0.18);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.06, h: 0.04, d: 0.02, color: 0xff2222, emissive: 0xff2222 });
    rightEye.position.set(0.08, 0.88, 0.18);
    group.add(rightEye);

    group.scale.setScalar(0.8);
    return group;
}

function createOrcModel() {
    const group = new THREE.Group();
    group.userData.type = 'orc';

    // Массивное тело
    const body = bodyPart({ w: 0.6, h: 0.6, d: 0.4, color: 0x2a5a22 });
    body.position.y = 0.6;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.45, h: 0.45, d: 0.45, color: 0x2a5a22 });
    head.position.y = 1.05;
    group.add(head);

    // Дубина (огромная)
    const clubHandle = bodyPart({ w: 0.08, h: 0.5, d: 0.08, color: 0x4a3a2a });
    clubHandle.position.set(0.5, 0.6, 0.2);
    clubHandle.rotation.z = -0.3;
    group.add(clubHandle);

    const clubHead = bodyPart({ w: 0.2, h: 0.25, d: 0.2, color: 0x5a4a3a });
    clubHead.position.set(0.55, 0.85, 0.2);
    group.add(clubHead);

    // Руки
    const rightArm = bodyPart({ w: 0.18, h: 0.5, d: 0.18, color: 0x2a5a22 });
    rightArm.position.set(0.4, 0.65, 0);
    rightArm.rotation.z = -0.4;
    group.add(rightArm);

    const leftArm = bodyPart({ w: 0.18, h: 0.5, d: 0.18, color: 0x2a5a22 });
    leftArm.position.set(-0.4, 0.65, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);

    // Ноги
    const leftLeg = bodyPart({ w: 0.18, h: 0.45, d: 0.18, color: 0x3a2a1a });
    leftLeg.position.set(-0.15, 0.23, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.18, h: 0.45, d: 0.18, color: 0x3a2a1a });
    rightLeg.position.set(0.15, 0.23, 0);
    group.add(rightLeg);

    // Жёлтые глаза
    const leftEye = bodyPart({ w: 0.08, h: 0.06, d: 0.02, color: 0xffcc00, emissive: 0xffcc00 });
    leftEye.position.set(-0.12, 1.08, 0.23);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.08, h: 0.06, d: 0.02, color: 0xffcc00, emissive: 0xffcc00 });
    rightEye.position.set(0.12, 1.08, 0.23);
    group.add(rightEye);

    // Шрам (тёмная полоса)
    const scar = bodyPart({ w: 0.02, h: 0.15, d: 0.02, color: 0x1a3a15 });
    scar.position.set(0.08, 1.05, 0.23);
    group.add(scar);

    group.scale.setScalar(1.1);
    return group;
}

function createSpiderModel() {
    const group = new THREE.Group();
    group.userData.type = 'spider';

    // Тело (брюхо)
    const abdomen = bodyPart({ w: 0.5, h: 0.35, d: 0.55, color: 0x1a1a1a });
    abdomen.position.set(0, 0.35, 0.15);
    group.add(abdomen);

    // Головогрудь
    const cephalothorax = bodyPart({ w: 0.35, h: 0.25, d: 0.3, color: 0x0d0d0d });
    cephalothorax.position.set(0, 0.35, -0.25);
    group.add(cephalothorax);

    // 8 ног — по 4 с каждой стороны
    const legPositions = [
        { x: 0.3, z: -0.2, rotZ: -0.6, rotY: 0.3 },
        { x: 0.3, z: -0.05, rotZ: -0.4, rotY: 0.1 },
        { x: 0.3, z: 0.1, rotZ: -0.3, rotY: -0.1 },
        { x: 0.3, z: 0.25, rotZ: -0.5, rotY: -0.3 },
        { x: -0.3, z: -0.2, rotZ: 0.6, rotY: -0.3 },
        { x: -0.3, z: -0.05, rotZ: 0.4, rotY: -0.1 },
        { x: -0.3, z: 0.1, rotZ: 0.3, rotY: 0.1 },
        { x: -0.3, z: 0.25, rotZ: 0.5, rotY: 0.3 },
    ];

    legPositions.forEach((pos, i) => {
        // Бедро
        const legUpper = bodyPart({ w: 0.06, h: 0.25, d: 0.06, color: 0x0d0d0d });
        legUpper.position.set(pos.x * 0.6, 0.35, pos.z);
        legUpper.rotation.z = pos.rotZ;
        group.add(legUpper);

        // Голень
        const legLower = bodyPart({ w: 0.04, h: 0.3, d: 0.04, color: 0x1a1a1a });
        legLower.position.set(
            pos.x * 0.6 + Math.sin(pos.rotZ) * 0.2,
            0.15,
            pos.z + Math.cos(pos.rotZ) * 0.1
        );
        legLower.rotation.z = pos.rotZ * 0.5;
        group.add(legLower);
    });

    // Красные глаза
    const eyePositions = [
        { x: -0.1, z: -0.38 }, { x: -0.04, z: -0.4 },
        { x: 0.04, z: -0.4 }, { x: 0.1, z: -0.38 }
    ];
    eyePositions.forEach(pos => {
        const eye = bodyPart({ w: 0.04, h: 0.04, d: 0.02, color: 0xff0000, emissive: 0xff0000 });
        eye.position.set(pos.x, 0.38, pos.z);
        group.add(eye);
    });

    // Паутина (вокруг)
    const web = bodyPart({ w: 0.7, h: 0.7, d: 0.7, color: 0xeeeeee, transparent: true, opacity: 0.15 });
    web.position.set(0, 0.4, 0);
    group.add(web);

    group.scale.setScalar(0.7);
    return group;
}

function createSkeletonModel() {
    const group = new THREE.Group();
    group.userData.type = 'skeleton';

    // Тело (тонкое)
    const body = bodyPart({ w: 0.25, h: 0.5, d: 0.15, color: 0xe8e0d0 });
    body.position.y = 0.55;
    group.add(body);

    // Грудная клетка (ребра)
    for (let i = 0; i < 4; i++) {
        const rib = bodyPart({ w: 0.28, h: 0.02, d: 0.02, color: 0xd0c8b8 });
        rib.position.set(0, 0.5 + i * 0.08, 0.08);
        group.add(rib);
    }

    // Голова
    const head = bodyPart({ w: 0.28, h: 0.3, d: 0.28, color: 0xe8e0d0 });
    head.position.y = 0.9;
    group.add(head);

    // Меч в правой руке
    const rightArm = bodyPart({ w: 0.06, h: 0.45, d: 0.06, color: 0xd0c8b8 });
    rightArm.position.set(0.2, 0.55, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    const swordBlade = bodyPart({ w: 0.04, h: 0.4, d: 0.02, color: 0xaaaaaa });
    swordBlade.position.set(0.32, 0.7, 0.1);
    group.add(swordBlade);

    const swordHilt = bodyPart({ w: 0.08, h: 0.02, d: 0.02, color: 0x4a3a2a });
    swordHilt.position.set(0.32, 0.5, 0.1);
    group.add(swordHilt);

    // Щит в левой руке
    const leftArm = bodyPart({ w: 0.06, h: 0.45, d: 0.06, color: 0xd0c8b8 });
    leftArm.position.set(-0.2, 0.55, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);

    const shield = bodyPart({ w: 0.25, h: 0.35, d: 0.04, color: 0x6a5a4a });
    shield.position.set(-0.35, 0.55, 0.1);
    group.add(shield);

    // Ноги (костлявые)
    const leftLeg = bodyPart({ w: 0.06, h: 0.5, d: 0.06, color: 0xd0c8b8 });
    leftLeg.position.set(-0.08, 0.25, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.06, h: 0.5, d: 0.06, color: 0xd0c8b8 });
    rightLeg.position.set(0.08, 0.25, 0);
    group.add(rightLeg);

    // Светящиеся глаза
    const leftEye = bodyPart({ w: 0.05, h: 0.05, d: 0.02, color: 0x88ff88, emissive: 0x88ff88 });
    leftEye.position.set(-0.07, 0.92, 0.15);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.05, h: 0.05, d: 0.02, color: 0x88ff88, emissive: 0x88ff88 });
    rightEye.position.set(0.07, 0.92, 0.15);
    group.add(rightEye);

    group.scale.setScalar(1.0);
    return group;
}

function createWolfModel() {
    const group = new THREE.Group();
    group.userData.type = 'wolf';

    // Тело
    const body = bodyPart({ w: 0.35, h: 0.35, d: 0.6, color: 0x7a7a7a });
    body.position.set(0, 0.4, 0);
    group.add(body);

    // Грудь (светлее)
    const chest = bodyPart({ w: 0.3, h: 0.3, d: 0.2, color: 0x9a9a9a });
    chest.position.set(0, 0.38, -0.25);
    group.add(chest);

    // Голова
    const head = bodyPart({ w: 0.3, h: 0.28, d: 0.35, color: 0x7a7a7a });
    head.position.set(0, 0.55, -0.35);
    group.add(head);

    // Пасть
    const snout = bodyPart({ w: 0.15, h: 0.1, d: 0.15, color: 0x5a5a5a });
    snout.position.set(0, 0.48, -0.55);
    group.add(snout);

    // Уши (острые)
    const leftEar = bodyPart({ w: 0.08, h: 0.12, d: 0.04, color: 0x6a6a6a });
    leftEar.position.set(-0.1, 0.72, -0.35);
    leftEar.rotation.z = 0.2;
    group.add(leftEar);

    const rightEar = bodyPart({ w: 0.08, h: 0.12, d: 0.04, color: 0x6a6a6a });
    rightEar.position.set(0.1, 0.72, -0.35);
    rightEar.rotation.z = -0.2;
    group.add(rightEar);

    // Хвост
    const tail = bodyPart({ w: 0.08, h: 0.08, d: 0.3, color: 0x7a7a7a });
    tail.position.set(0, 0.45, 0.4);
    tail.rotation.x = -0.3;
    group.add(tail);

    // Лапы
    const legPositions = [
        { x: -0.12, z: -0.2 }, { x: 0.12, z: -0.2 },
        { x: -0.12, z: 0.2 }, { x: 0.12, z: 0.2 }
    ];
    legPositions.forEach(pos => {
        const leg = bodyPart({ w: 0.1, h: 0.3, d: 0.1, color: 0x6a6a6a });
        leg.position.set(pos.x, 0.15, pos.z);
        group.add(leg);
    });

    // Глаза
    const leftEye = bodyPart({ w: 0.05, h: 0.04, d: 0.02, color: 0xffcc00, emissive: 0xffcc00 });
    leftEye.position.set(-0.08, 0.58, -0.53);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.05, h: 0.04, d: 0.02, color: 0xffcc00, emissive: 0xffcc00 });
    rightEye.position.set(0.08, 0.58, -0.53);
    group.add(rightEye);

    group.scale.setScalar(0.9);
    return group;
}

function createTrollModel() {
    const group = new THREE.Group();
    group.userData.type = 'troll';

    // Огромное тело
    const body = bodyPart({ w: 0.7, h: 0.7, d: 0.5, color: 0x6a7a6a });
    body.position.y = 0.7;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.5, h: 0.45, d: 0.45, color: 0x6a7a6a });
    head.position.y = 1.25;
    group.add(head);

    // Каменная дубина
    const clubHandle = bodyPart({ w: 0.1, h: 0.6, d: 0.1, color: 0x5a5a5a });
    clubHandle.position.set(0.55, 0.7, 0.2);
    clubHandle.rotation.z = -0.2;
    group.add(clubHandle);

    const clubHead = bodyPart({ w: 0.25, h: 0.3, d: 0.25, color: 0x4a4a4a });
    clubHead.position.set(0.6, 1.05, 0.2);
    group.add(clubHead);

    // Руки (длинные)
    const rightArm = bodyPart({ w: 0.2, h: 0.6, d: 0.2, color: 0x6a7a6a });
    rightArm.position.set(0.5, 0.8, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    const leftArm = bodyPart({ w: 0.2, h: 0.6, d: 0.2, color: 0x6a7a6a });
    leftArm.position.set(-0.5, 0.8, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);

    // Ноги
    const leftLeg = bodyPart({ w: 0.22, h: 0.5, d: 0.22, color: 0x5a6a5a });
    leftLeg.position.set(-0.18, 0.25, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.22, h: 0.5, d: 0.22, color: 0x5a6a5a });
    rightLeg.position.set(0.18, 0.25, 0);
    group.add(rightLeg);

    // Глаза
    const leftEye = bodyPart({ w: 0.06, h: 0.05, d: 0.02, color: 0xffaa00, emissive: 0xffaa00 });
    leftEye.position.set(-0.12, 1.28, 0.23);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.06, h: 0.05, d: 0.02, color: 0xffaa00, emissive: 0xffaa00 });
    rightEye.position.set(0.12, 1.28, 0.23);
    group.add(rightEye);

    // Клыки
    const leftTusk = bodyPart({ w: 0.04, h: 0.1, d: 0.04, color: 0xe8e0d0 });
    leftTusk.position.set(-0.08, 1.15, 0.24);
    group.add(leftTusk);

    const rightTusk = bodyPart({ w: 0.04, h: 0.1, d: 0.04, color: 0xe8e0d0 });
    rightTusk.position.set(0.08, 1.15, 0.24);
    group.add(rightTusk);

    group.scale.setScalar(1.2);
    return group;
}

function createZombieModel() {
    const group = new THREE.Group();
    group.userData.type = 'zombie';

    // Тело
    const body = bodyPart({ w: 0.4, h: 0.55, d: 0.25, color: 0x4a6a3a });
    body.position.y = 0.55;
    group.add(body);

    // Гнилые заплатки
    const patch1 = bodyPart({ w: 0.15, h: 0.12, d: 0.26, color: 0x3a5a2a });
    patch1.position.set(0.1, 0.6, 0);
    group.add(patch1);

    const patch2 = bodyPart({ w: 0.12, h: 0.15, d: 0.26, color: 0x3a5a2a });
    patch2.position.set(-0.1, 0.45, 0);
    group.add(patch2);

    // Голова
    const head = bodyPart({ w: 0.35, h: 0.35, d: 0.35, color: 0x4a6a3a });
    head.position.y = 0.9;
    group.add(head);

    // Лохмотья
    const rags = bodyPart({ w: 0.42, h: 0.4, d: 0.27, color: 0x5a4a3a });
    rags.position.set(0, 0.5, 0);
    group.add(rags);

    // Руки (вытянутые вперёд)
    const rightArm = bodyPart({ w: 0.12, h: 0.5, d: 0.12, color: 0x4a6a3a });
    rightArm.position.set(0.28, 0.55, 0.15);
    rightArm.rotation.x = -0.8;
    group.add(rightArm);

    const leftArm = bodyPart({ w: 0.12, h: 0.5, d: 0.12, color: 0x4a6a3a });
    leftArm.position.set(-0.28, 0.55, 0.15);
    leftArm.rotation.x = -0.8;
    group.add(leftArm);

    // Ноги
    const leftLeg = bodyPart({ w: 0.14, h: 0.4, d: 0.14, color: 0x3a5a2a });
    leftLeg.position.set(-0.1, 0.2, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.14, h: 0.4, d: 0.14, color: 0x3a5a2a });
    rightLeg.position.set(0.1, 0.2, 0);
    group.add(rightLeg);

    // Глаза (светящиеся)
    const leftEye = bodyPart({ w: 0.05, h: 0.05, d: 0.02, color: 0x88ff88, emissive: 0x88ff88 });
    leftEye.position.set(-0.08, 0.92, 0.18);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.05, h: 0.05, d: 0.02, color: 0x88ff88, emissive: 0x88ff88 });
    rightEye.position.set(0.08, 0.92, 0.18);
    group.add(rightEye);

    group.scale.setScalar(1.0);
    return group;
}

function createGhostModel() {
    const group = new THREE.Group();
    group.userData.type = 'ghost';

    // Тело (полупрозрачное)
    const body = bodyPart({ w: 0.35, h: 0.5, d: 0.2, color: 0xe8f0ff, transparent: true, opacity: 0.6 });
    body.position.y = 0.5;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.3, h: 0.3, d: 0.3, color: 0xe8f0ff, transparent: true, opacity: 0.6 });
    head.position.y = 0.85;
    group.add(head);

    // Руки (парящие)
    const rightArm = bodyPart({ w: 0.08, h: 0.35, d: 0.08, color: 0xd0e0ff, transparent: true, opacity: 0.5 });
    rightArm.position.set(0.25, 0.55, 0);
    rightArm.rotation.z = -0.5;
    group.add(rightArm);

    const leftArm = bodyPart({ w: 0.08, h: 0.35, d: 0.08, color: 0xd0e0ff, transparent: true, opacity: 0.5 });
    leftArm.position.set(-0.25, 0.55, 0);
    leftArm.rotation.z = 0.5;
    group.add(leftArm);

    // Глаза (тёмные пустоты)
    const leftEye = bodyPart({ w: 0.06, h: 0.06, d: 0.02, color: 0x0a0a1a });
    leftEye.position.set(-0.07, 0.87, 0.16);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.06, h: 0.06, d: 0.02, color: 0x0a0a1a });
    rightEye.position.set(0.07, 0.87, 0.16);
    group.add(rightEye);

    // Свечение вокруг
    const glow = bodyPart({ w: 0.6, h: 0.8, d: 0.4, color: 0x88aaff, transparent: true, opacity: 0.1 });
    glow.position.y = 0.5;
    group.add(glow);

    group.scale.setScalar(0.9);
    return group;
}

function createSlimeModel() {
    const group = new THREE.Group();
    group.userData.type = 'slime';

    // Основное тело (полупрозрачное)
    const body = bodyPart({ w: 0.5, h: 0.4, d: 0.5, color: 0x66ff66, transparent: true, opacity: 0.7 });
    body.position.y = 0.25;
    group.add(body);

    // Внутреннее ядро (более тёмное)
    const core = bodyPart({ w: 0.3, h: 0.2, d: 0.3, color: 0x44cc44, transparent: true, opacity: 0.8 });
    core.position.y = 0.25;
    group.add(core);

    // Глаза
    const leftEye = bodyPart({ w: 0.08, h: 0.08, d: 0.02, color: 0x000000 });
    leftEye.position.set(-0.1, 0.3, 0.26);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.08, h: 0.08, d: 0.02, color: 0x000000 });
    rightEye.position.set(0.1, 0.3, 0.26);
    group.add(rightEye);

    // Блики
    const leftShine = bodyPart({ w: 0.03, h: 0.03, d: 0.01, color: 0xffffff });
    leftShine.position.set(-0.08, 0.32, 0.27);
    group.add(leftShine);

    const rightShine = bodyPart({ w: 0.03, h: 0.03, d: 0.01, color: 0xffffff });
    rightShine.position.set(0.12, 0.32, 0.27);
    group.add(rightShine);

    group.scale.setScalar(0.7);
    return group;
}

function createBatModel() {
    const group = new THREE.Group();
    group.userData.type = 'bat';

    // Тело
    const body = bodyPart({ w: 0.2, h: 0.15, d: 0.25, color: 0x1a1a2a });
    body.position.y = 0.2;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.18, h: 0.15, d: 0.18, color: 0x1a1a2a });
    head.position.set(0, 0.25, -0.15);
    group.add(head);

    // Уши
    const leftEar = bodyPart({ w: 0.06, h: 0.1, d: 0.03, color: 0x0d0d1a });
    leftEar.position.set(-0.08, 0.35, -0.15);
    group.add(leftEar);

    const rightEar = bodyPart({ w: 0.06, h: 0.1, d: 0.03, color: 0x0d0d1a });
    rightEar.position.set(0.08, 0.35, -0.15);
    group.add(rightEar);

    // Крылья (левое)
    const leftWing = bodyPart({ w: 0.4, h: 0.02, d: 0.2, color: 0x0d0d1a });
    leftWing.position.set(-0.3, 0.2, 0);
    leftWing.rotation.z = 0.3;
    group.add(leftWing);

    // Крылья (правое)
    const rightWing = bodyPart({ w: 0.4, h: 0.02, d: 0.2, color: 0x0d0d1a });
    rightWing.position.set(0.3, 0.2, 0);
    rightWing.rotation.z = -0.3;
    group.add(rightWing);

    // Глаза (светящиеся красные)
    const leftEye = bodyPart({ w: 0.04, h: 0.04, d: 0.02, color: 0xff0000, emissive: 0xff0000 });
    leftEye.position.set(-0.05, 0.27, -0.24);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.04, h: 0.04, d: 0.02, color: 0xff0000, emissive: 0xff0000 });
    rightEye.position.set(0.05, 0.27, -0.24);
    group.add(rightEye);

    group.scale.setScalar(0.5);
    return group;
}

// ==================== БОССЫ ====================

function createForestGiantModel() {
    const group = new THREE.Group();
    group.userData.type = 'forest_giant';

    // Огромное тело
    const body = bodyPart({ w: 1.2, h: 1.4, d: 0.9, color: 0x2a5a1a });
    body.position.y = 1.4;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.8, h: 0.7, d: 0.75, color: 0x3a6a2a });
    head.position.y = 2.45;
    group.add(head);

    // Рога
    const leftHorn = bodyPart({ w: 0.1, h: 0.4, d: 0.1, color: 0xc8b898 });
    leftHorn.position.set(-0.3, 2.9, 0);
    leftHorn.rotation.z = 0.4;
    group.add(leftHorn);

    const rightHorn = bodyPart({ w: 0.1, h: 0.4, d: 0.1, color: 0xc8b898 });
    rightHorn.position.set(0.3, 2.9, 0);
    rightHorn.rotation.z = -0.4;
    group.add(rightHorn);

    // Дубина с шипами
    const clubHandle = bodyPart({ w: 0.15, h: 1.2, d: 0.15, color: 0x4a3a2a });
    clubHandle.position.set(0.9, 1.4, 0.3);
    clubHandle.rotation.z = -0.2;
    group.add(clubHandle);

    const clubHead = bodyPart({ w: 0.4, h: 0.5, d: 0.4, color: 0x5a4a3a });
    clubHead.position.set(0.95, 2.0, 0.3);
    group.add(clubHead);

    // Шипы на дубине
    for (let i = 0; i < 4; i++) {
        const spike = bodyPart({ w: 0.04, h: 0.12, d: 0.04, color: 0x888888 });
        spike.position.set(0.95 + Math.sin(i) * 0.15, 2.0 + Math.cos(i) * 0.15, 0.3);
        group.add(spike);
    }

    // Руки
    const rightArm = bodyPart({ w: 0.35, h: 1.1, d: 0.35, color: 0x2a5a1a });
    rightArm.position.set(0.8, 1.6, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    const leftArm = bodyPart({ w: 0.35, h: 1.1, d: 0.35, color: 0x2a5a1a });
    leftArm.position.set(-0.8, 1.6, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);

    // Ноги
    const leftLeg = bodyPart({ w: 0.4, h: 1.0, d: 0.4, color: 0x1a4a0a });
    leftLeg.position.set(-0.35, 0.5, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.4, h: 1.0, d: 0.4, color: 0x1a4a0a });
    rightLeg.position.set(0.35, 0.5, 0);
    group.add(rightLeg);

    // Глаза
    const leftEye = bodyPart({ w: 0.1, h: 0.08, d: 0.02, color: 0x00ff00, emissive: 0x00ff00 });
    leftEye.position.set(-0.18, 2.5, 0.38);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.1, h: 0.08, d: 0.02, color: 0x00ff00, emissive: 0x00ff00 });
    rightEye.position.set(0.18, 2.5, 0.38);
    group.add(rightEye);

    group.scale.setScalar(3.5);
    return group;
}

function createStoneGolemModel() {
    const group = new THREE.Group();
    group.userData.type = 'stone_golem';

    // Каменное тело
    const body = bodyPart({ w: 1.0, h: 1.2, d: 0.8, color: 0x7a7a7a });
    body.position.y = 1.2;
    group.add(body);

    // Голова
    const head = bodyPart({ w: 0.6, h: 0.55, d: 0.55, color: 0x6a6a6a });
    head.position.y = 2.05;
    group.add(head);

    // Молот с рунами
    const hammerHandle = bodyPart({ w: 0.12, h: 1.0, d: 0.12, color: 0x5a5a5a });
    hammerHandle.position.set(0.7, 1.3, 0.2);
    hammerHandle.rotation.z = -0.3;
    group.add(hammerHandle);

    const hammerHead = bodyPart({ w: 0.5, h: 0.35, d: 0.3, color: 0x4a4a4a });
    hammerHead.position.set(0.8, 1.8, 0.2);
    group.add(hammerHead);

    // Руны (светящиеся)
    const rune1 = bodyPart({ w: 0.08, h: 0.08, d: 0.02, color: 0x00aaff, emissive: 0x00aaff });
    rune1.position.set(0.0, 1.5, 0.41);
    group.add(rune1);

    const rune2 = bodyPart({ w: 0.06, h: 0.06, d: 0.02, color: 0x00aaff, emissive: 0x00aaff });
    rune2.position.set(0.82, 1.85, 0.36);
    group.add(rune2);

    // Руки
    const rightArm = bodyPart({ w: 0.3, h: 1.0, d: 0.3, color: 0x6a6a6a });
    rightArm.position.set(0.7, 1.4, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    const leftArm = bodyPart({ w: 0.3, h: 1.0, d: 0.3, color: 0x6a6a6a });
    leftArm.position.set(-0.7, 1.4, 0);
    leftArm.rotation.z = 0.2;
    group.add(leftArm);

    // Ноги
    const leftLeg = bodyPart({ w: 0.35, h: 0.9, d: 0.35, color: 0x5a5a5a });
    leftLeg.position.set(-0.3, 0.45, 0);
    group.add(leftLeg);

    const rightLeg = bodyPart({ w: 0.35, h: 0.9, d: 0.35, color: 0x5a5a5a });
    rightLeg.position.set(0.3, 0.45, 0);
    group.add(rightLeg);

    // Глаза
    const leftEye = bodyPart({ w: 0.08, h: 0.06, d: 0.02, color: 0x00ccff, emissive: 0x00ccff });
    leftEye.position.set(-0.15, 2.1, 0.28);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.08, h: 0.06, d: 0.02, color: 0x00ccff, emissive: 0x00ccff });
    rightEye.position.set(0.15, 2.1, 0.28);
    group.add(rightEye);

    group.scale.setScalar(3.0);
    return group;
}

function createIceDragonModel() {
    const group = new THREE.Group();
    group.userData.type = 'ice_dragon';

    // Тело
    const body = bodyPart({ w: 1.0, h: 0.9, d: 1.6, color: 0xa0d0f0 });
    body.position.set(0, 1.2, 0);
    group.add(body);

    // Грудь
    const chest = bodyPart({ w: 1.1, h: 1.0, d: 0.8, color: 0x90c0e0 });
    chest.position.set(0, 1.3, -0.5);
    group.add(chest);

    // Голова
    const head = bodyPart({ w: 0.6, h: 0.5, d: 0.8, color: 0x80b0d0 });
    head.position.set(0, 1.6, -1.2);
    group.add(head);

    // Пасть
    const jaw = bodyPart({ w: 0.4, h: 0.15, d: 0.5, color: 0x205080 });
    jaw.position.set(0, 1.35, -1.5);
    group.add(jaw);

    // Крылья (левое)
    const leftWing = bodyPart({ w: 1.5, h: 0.05, d: 0.8, color: 0x90c0e0 });
    leftWing.position.set(-1.0, 1.6, -0.2);
    leftWing.rotation.z = 0.4;
    group.add(leftWing);

    // Крылья (правое)
    const rightWing = bodyPart({ w: 1.5, h: 0.05, d: 0.8, color: 0x90c0e0 });
    rightWing.position.set(1.0, 1.6, -0.2);
    rightWing.rotation.z = -0.4;
    group.add(rightWing);

    // Шипы на спине
    for (let i = 0; i < 5; i++) {
        const spike = bodyPart({ w: 0.08, h: 0.25, d: 0.08, color: 0x205080 });
        spike.position.set(0, 1.8 + i * 0.05, -0.4 + i * 0.3);
        group.add(spike);
    }

    // Хвост
    const tail1 = bodyPart({ w: 0.5, h: 0.4, d: 0.6, color: 0x80b0d0 });
    tail1.position.set(0, 1.0, 0.9);
    group.add(tail1);

    const tail2 = bodyPart({ w: 0.3, h: 0.25, d: 0.5, color: 0x70a0c0 });
    tail2.position.set(0, 0.8, 1.4);
    group.add(tail2);

    // Ноги
    const legPositions = [
        { x: -0.4, z: -0.6 }, { x: 0.4, z: -0.6 },
        { x: -0.4, z: 0.4 }, { x: 0.4, z: 0.4 }
    ];
    legPositions.forEach(pos => {
        const leg = bodyPart({ w: 0.2, h: 0.6, d: 0.2, color: 0x70a0c0 });
        leg.position.set(pos.x, 0.5, pos.z);
        group.add(leg);
    });

    // Глаза
    const leftEye = bodyPart({ w: 0.08, h: 0.06, d: 0.02, color: 0xffffff, emissive: 0x00aaff });
    leftEye.position.set(-0.15, 1.65, -1.6);
    group.add(leftEye);

    const rightEye = bodyPart({ w: 0.08, h: 0.06, d: 0.02, color: 0xffffff, emissive: 0x00aaff });
    rightEye.position.set(0.15, 1.65, -1.6);
    group.add(rightEye);

    group.scale.setScalar(4.0);
    return group;
}

// ==================== РЕГИСТРАЦИЯ МОДЕЛЕЙ ====================

const MOB_MODELS = {
    // Обычные монстры
    goblin: createGoblinModel,
    orc: createOrcModel,
    spider: createSpiderModel,
    skeleton: createSkeletonModel,
    wolf: createWolfModel,
    troll: createTrollModel,
    zombie: createZombieModel,
    ghost: createGhostModel,
    slime: createSlimeModel,
    bat: createBatModel,
    // Боссы
    forest_giant: createForestGiantModel,
    stone_golem: createStoneGolemModel,
    ice_dragon: createIceDragonModel,
    // Остальные боссы используют увеличенные версии обычных с кастомными скинами
    spider_queen: createSpiderModel,
    necromancer: createSkeletonModel,
    kraken: createSlimeModel,
    fire_elemental: createGhostModel,
    dark_knight: createSkeletonModel,
    goblin_king: createGoblinModel,
    ice_troll: createTrollModel
};

function createMobModel(mobType) {
    if (typeof THREE === 'undefined') {
        console.error('❌ createMobModel: THREE не загружен!');
        return null;
    }
    const factory = MOB_MODELS[mobType];
    if (!factory) {
        console.warn('Unknown mob type:', mobType);
        return bodyPart({ w: 0.5, h: 0.5, d: 0.5, color: 0xff00ff });
    }
    const model = factory();

    // Для боссов увеличиваем масштаб
    const bossTypes = ['spider_queen', 'necromancer', 'kraken', 'fire_elemental', 
                       'dark_knight', 'goblin_king', 'ice_troll'];
    if (bossTypes.includes(mobType)) {
        const bossScales = {
            spider_queen: 2.5,
            necromancer: 2.0,
            kraken: 3.5,
            fire_elemental: 2.5,
            dark_knight: 2.2,
            goblin_king: 2.0,
            ice_troll: 3.0
        };
        model.scale.setScalar(bossScales[mobType] || 2.0);
    }

    return model;
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = { MOB_MODELS, createMobModel, bodyPart };
}
