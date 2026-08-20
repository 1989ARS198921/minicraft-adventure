// mobs_integration.js — интеграция новых моделей монстров в MiniCraft Adventure
// ПРОМПТ: Интегрировать улучшенные 3D-модели и текстуры монстров в
// существующую систему mobs.js. Заменить старые кубы на детальные модели
// с оружием, крыльями, рогами и светящимися элементами. Для призраков
// и слизней настроить прозрачность. Боссы увеличить до 2.0-4.0 блоков.
// Добавить анимации: прыжки слизней, махание крыльями летучих мышей,
// парение призраков, дыхание драконов.
// КОММИТ: feat: integrate enhanced mob models into mobs.js
// detailed anatomy, weapons, transparency, boss scaling, animations

// Импорт (если ES Modules)
// import { createMobModel, bodyPart } from './enhanced_mobs.js';
// import { getMobSkin } from './enhanced_skins.js';

// ============ ЗАМЕНА СОЗДАНИЯ МОБА ============

function spawnMob(type, x, y, z) {
    const mob = {
        type: type,
        x: x, y: y, z: z,
        hp: getMobHP(type),
        maxHp: getMobHP(type),
        damage: getMobDamage(type),
        speed: getMobSpeed(type),
        ai: getMobAI(type),
        level: getMobLevel(type),
        model: null,
        animation: {
            frame: 0,
            state: 'idle'
        }
    };

    // Создаём 3D-модель
    mob.model = createMobModel(type);

    // Применяем текстуру (если есть)
    const skin = getMobSkin(type);
    if (skin && mob.model) {
        applySkinToModel(mob.model, skin);
    }

    // Позиционируем
    mob.model.position.set(x, y, z);

    // Добавляем в сцену
    scene.add(mob.model);

    // Регистрируем в списке мобов
    mobs.push(mob);

    return mob;
}

// ============ ПРИМЕНЕНИЕ ТЕКСТУРЫ К МОДЕЛИ ============

function applySkinToModel(model, skinTexture) {
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            // Клонируем материал, чтобы не менять общий
            child.material = child.material.clone();
            child.material.map = skinTexture;
            child.material.needsUpdate = true;
        }
    });
}

// ============ ХАРАКТЕРИСТИКИ МОБОВ ============

function getMobHP(type) {
    const hpTable = {
        // Обычные монстры
        goblin: 30, orc: 50, spider: 25, skeleton: 35,
        wolf: 40, troll: 80, zombie: 45, ghost: 30,
        slime: 20, bat: 15,
        // Боссы
        forest_giant: 500, stone_golem: 400, ice_dragon: 600,
        spider_queen: 350, necromancer: 300, kraken: 450,
        fire_elemental: 380, dark_knight: 420, goblin_king: 320, ice_troll: 480
    };
    return hpTable[type] || 30;
}

function getMobDamage(type) {
    const damageTable = {
        goblin: 8, orc: 15, spider: 10, skeleton: 12,
        wolf: 14, troll: 20, zombie: 12, ghost: 10,
        slime: 5, bat: 6,
        forest_giant: 40, stone_golem: 35, ice_dragon: 50,
        spider_queen: 30, necromancer: 25, kraken: 38,
        fire_elemental: 32, dark_knight: 35, goblin_king: 28, ice_troll: 42
    };
    return damageTable[type] || 10;
}

function getMobSpeed(type) {
    const speedTable = {
        goblin: 3.5, orc: 2.5, spider: 4.0, skeleton: 2.0,
        wolf: 5.0, troll: 1.8, zombie: 1.5, ghost: 3.0,
        slime: 2.0, bat: 4.5,
        forest_giant: 1.5, stone_golem: 1.2, ice_dragon: 3.0,
        spider_queen: 3.5, necromancer: 2.0, kraken: 2.5,
        fire_elemental: 2.8, dark_knight: 2.5, goblin_king: 3.0, ice_troll: 1.8
    };
    return speedTable[type] || 2.5;
}

function getMobAI(type) {
    const aiTable = {
        goblin: 'aggressive', orc: 'aggressive', spider: 'aggressive',
        skeleton: 'ranged', wolf: 'pack', troll: 'defensive',
        zombie: 'aggressive', ghost: 'cautious', slime: 'passive',
        bat: 'flying',
        forest_giant: 'boss', stone_golem: 'boss', ice_dragon: 'boss',
        spider_queen: 'boss', necromancer: 'boss', kraken: 'boss',
        fire_elemental: 'boss', dark_knight: 'boss', goblin_king: 'boss', ice_troll: 'boss'
    };
    return aiTable[type] || 'aggressive';
}

function getMobLevel(type) {
    const levelTable = {
        // Подземелье
        spider: 3, skeleton: 4, goblin: 2, bat: 1,
        stone_golem: 15, spider_queen: 18, necromancer: 20,
        kraken: 22, goblin_king: 16,
        // Поверхность
        orc: 5, wolf: 6, troll: 8, zombie: 4,
        forest_giant: 25, fire_elemental: 19, dark_knight: 21,
        // Небеса
        ghost: 7, slime: 3,
        ice_dragon: 30, ice_troll: 24
    };
    return levelTable[type] || 1;
}

// ============ АНИМАЦИИ МОБОВ ============

function updateMobAnimations(delta) {
    mobs.forEach(mob => {
        if (!mob.model) return;

        mob.animation.frame += delta;

        switch (mob.type) {
            case 'slime':
                animateSlime(mob);
                break;
            case 'bat':
                animateBat(mob);
                break;
            case 'ghost':
                animateGhost(mob);
                break;
            case 'ice_dragon':
                animateDragon(mob);
                break;
            case 'spider':
            case 'spider_queen':
                animateSpider(mob);
                break;
            default:
                animateDefault(mob);
        }
    });
}

function animateSlime(mob) {
    const t = mob.animation.frame * 3;
    // Прыгающее движение
    mob.model.position.y = mob.y + Math.abs(Math.sin(t)) * 0.3;
    // Сжатие при приземлении
    const squash = 1 + Math.sin(t * 2) * 0.1;
    mob.model.scale.y = squash;
    mob.model.scale.x = 1 / Math.sqrt(squash);
    mob.model.scale.z = 1 / Math.sqrt(squash);
}

function animateBat(mob) {
    const t = mob.animation.frame * 8;
    // Махание крыльями
    mob.model.children.forEach(child => {
        if (child.userData && child.userData.isWing) {
            child.rotation.z = Math.sin(t) * 0.5;
        }
    });
    // Парение вверх-вниз
    mob.model.position.y = mob.y + Math.sin(t * 0.5) * 0.2;
}

function animateGhost(mob) {
    const t = mob.animation.frame * 2;
    // Парение
    mob.model.position.y = mob.y + Math.sin(t) * 0.15;
    // Покачивание
    mob.model.rotation.z = Math.sin(t * 0.5) * 0.05;
    // Пульсация прозрачности
    mob.model.traverse(child => {
        if (child.isMesh && child.material.transparent) {
            child.material.opacity = 0.4 + Math.sin(t * 2) * 0.2;
        }
    });
}

function animateDragon(mob) {
    const t = mob.animation.frame * 1.5;
    // Дыхание грудью
    mob.model.scale.x = 1 + Math.sin(t) * 0.02;
    // Махание крыльями (медленное)
    mob.model.children.forEach(child => {
        if (child.userData && child.userData.isWing) {
            child.rotation.z = Math.sin(t * 0.5) * 0.2;
        }
    });
}

function animateSpider(mob) {
    const t = mob.animation.frame * 4;
    // Движение ног
    mob.model.children.forEach((child, i) => {
        if (child.userData && child.userData.isLeg) {
            child.rotation.z += Math.sin(t + i) * 0.02;
        }
    });
}

function animateDefault(mob) {
    const t = mob.animation.frame * 2;
    // Лёгкое покачивание при ходьбе
    if (mob.animation.state === 'walking') {
        mob.model.rotation.z = Math.sin(t) * 0.05;
    }
}

// ============ СПАВН МОБОВ ПО УРОВНЯМ МИРА ============

function spawnMobsForChunk(cx, cz, chunkData) {
    const surfaceMobs = ['goblin', 'orc', 'wolf', 'zombie', 'skeleton'];
    const undergroundMobs = ['spider', 'skeleton', 'bat', 'goblin'];
    const skyMobs = ['ghost', 'slime', 'bat'];

    // Поверхность
    if (Math.random() < 0.3) {
        const type = surfaceMobs[Math.floor(Math.random() * surfaceMobs.length)];
        const x = cx * 16 + Math.random() * 16;
        const z = cz * 16 + Math.random() * 16;
        const y = getGroundHeight(chunkData, x, z) + 1;
        spawnMob(type, x, y, z);
    }

    // Подземелье
    if (Math.random() < 0.2) {
        const type = undergroundMobs[Math.floor(Math.random() * undergroundMobs.length)];
        const x = cx * 16 + Math.random() * 16;
        const z = cz * 16 + Math.random() * 16;
        const y = -15 - Math.random() * 10;
        spawnMob(type, x, y, z);
    }

    // Небеса (редко)
    if (Math.random() < 0.1) {
        const type = skyMobs[Math.floor(Math.random() * skyMobs.length)];
        const x = cx * 16 + Math.random() * 16;
        const z = cz * 16 + Math.random() * 16;
        const y = 85 + Math.random() * 20;
        spawnMob(type, x, y, z);
    }

    // Боссы (очень редко)
    if (Math.random() < 0.005) {
        const bosses = ['forest_giant', 'stone_golem', 'ice_dragon', 'spider_queen', 'necromancer'];
        const type = bosses[Math.floor(Math.random() * bosses.length)];
        const x = cx * 16 + 8;
        const z = cz * 16 + 8;
        const y = type === 'ice_dragon' ? 90 : getGroundHeight(chunkData, x, z) + 1;
        spawnMob(type, x, y, z);
    }
}

// ============ HP БАР НАД МОБАМИ ============

function createHPBar(mob) {
    const barWidth = mob.type.includes('boss') ? 1.5 : 0.8;
    const barHeight = 0.08;

    // Фон
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.y = getMobHeight(mob) + 0.3;

    // Заполнение
    const fillGeometry = new THREE.PlaneGeometry(barWidth - 0.02, barHeight - 0.02);
    const fillColor = mob.type.includes('boss') ? 0xff0000 : 0x00ff00;
    const fillMaterial = new THREE.MeshBasicMaterial({ color: fillColor });
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    fill.position.z = 0.001;
    bg.add(fill);

    mob.model.add(bg);
    mob.hpBar = { bg, fill };
}

function updateHPBar(mob) {
    if (!mob.hpBar) return;
    const ratio = mob.hp / mob.maxHp;
    mob.hpBar.fill.scale.x = Math.max(0, ratio);
    mob.hpBar.fill.position.x = -(1 - ratio) * (mob.hpBar.bg.geometry.parameters.width - 0.02) / 2;
}

function getMobHeight(mob) {
    const heights = {
        goblin: 0.8, orc: 1.1, spider: 0.5, skeleton: 1.0,
        wolf: 0.7, troll: 1.2, zombie: 1.0, ghost: 0.7,
        slime: 0.4, bat: 0.3,
        forest_giant: 3.5, stone_golem: 3.0, ice_dragon: 4.0,
        spider_queen: 2.0, necromancer: 2.0, kraken: 2.5,
        fire_elemental: 2.0, dark_knight: 2.2, goblin_king: 2.0, ice_troll: 3.0
    };
    return heights[mob.type] || 1.0;
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = {
        spawnMob, applySkinToModel,
        getMobHP, getMobDamage, getMobSpeed, getMobAI, getMobLevel,
        updateMobAnimations, spawnMobsForChunk,
        createHPBar, updateHPBar
    };
}
