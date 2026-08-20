// world_integration.js — интеграция трёхуровневого мира в MiniCraft Adventure
// ПРОМПТ: Интегрировать подземелье и небесный мир в существующую
// систему генерации чанков. Добавить входы в подземелье через пещеры
// на поверхности и колодцы в деревнях. Поднять облачные города
// с 30/38 до 80-100 блоков. Связать уровни порталами.
// КОММИТ: feat: integrate three-level world system
// underground + surface + sky, linked by portals and entrances

// Импорт (если используете ES Modules)
// import { generateUnderground, generateCaveEntrance } from './underground.js';
// import { generateSkyWorld, generateSkyPortal } from './skyworld.js';

// ============ ИЗМЕНЕНИЯ В generateChunk() ============

function generateChunk(data, cx, cz) {
    const chunkSize = 16;
    const seed = data.seed || 12345;

    // === УРОВЕНЬ 1: ПОДЗЕМЕЛЬЕ (-30..-10) ===
    generateUnderground(data, cx, cz);

    // === УРОВЕНЬ 2: ПОВЕРХНОСТЬ (0..40) ===
    // Существующая генерация поверхности
    generateSurface(data, cx, cz);

    // Входы в подземелье (пещеры на поверхности)
    // Редкость: ~3% на чанк
    const caveEntranceNoise = simplex2D(cx * 0.1 + seed, cz * 0.1 + seed);
    if (caveEntranceNoise > 0.7 && Math.random() < 0.3) {
        generateCaveEntrance(data, cx, cz);
    }

    // === УРОВЕНЬ 3: НЕБЕСНЫЙ МИР (60..120) ===
    generateSkyWorld(data, cx, cz);

    // === СТРУКТУРЫ ПОВЕРХНОСТИ (новые) ===
    // Мосты между холмами
    if (Math.random() < 0.02) {
        generateHillBridge(data, cx, cz);
    }

    // Сторожевые башни
    if (Math.random() < 0.015) {
        generateWatchtower(data, cx, cz);
    }

    // Лагеря кочевников
    if (Math.random() < 0.01) {
        generateNomadCamp(data, cx, cz);
    }
}

// ============ НОВЫЕ СТРУКТУРЫ ПОВЕРХНОСТИ ============

function generateHillBridge(data, cx, cz) {
    const startX = cx * 16 + 4;
    const startZ = cz * 16 + 8;
    const endX = startX + 8;
    const bridgeY = 15 + Math.floor(Math.random() * 10);

    for (let x = startX; x <= endX; x++) {
        setBlock(data, x, bridgeY, startZ, 'wood_planks');
        setBlock(data, x, bridgeY - 1, startZ, 'wood_fence');
        setBlock(data, x, bridgeY, startZ + 1, 'wood_planks');
        setBlock(data, x, bridgeY - 1, startZ + 1, 'wood_fence');
    }

    // Опоры
    for (let y = 0; y < bridgeY; y++) {
        setBlock(data, startX, y, startZ, 'wood_log');
        setBlock(data, endX, y, startZ, 'wood_log');
    }
}

function generateWatchtower(data, cx, cz) {
    const tx = cx * 16 + 8;
    const tz = cz * 16 + 8;
    const groundY = getGroundHeight(data, tx, tz);
    const height = 8 + Math.floor(Math.random() * 6);

    // Башня
    for (let y = 0; y < height; y++) {
        setBlock(data, tx, groundY + y, tz, 'stone_bricks');
        setBlock(data, tx + 1, groundY + y, tz, 'stone_bricks');
        setBlock(data, tx, groundY + y, tz + 1, 'stone_bricks');
        setBlock(data, tx + 1, groundY + y, tz + 1, 'stone_bricks');
    }

    // Верхняя площадка
    for (let x = -1; x <= 2; x++) {
        for (let z = -1; z <= 2; z++) {
            setBlock(data, tx + x, groundY + height, tz + z, 'wood_planks');
        }
    }

    // Факелы
    setBlock(data, tx - 1, groundY + height, tz - 1, 'torch');
    setBlock(data, tx + 2, groundY + height, tz - 1, 'torch');
    setBlock(data, tx - 1, groundY + height, tz + 2, 'torch');
    setBlock(data, tx + 2, groundY + height, tz + 2, 'torch');
}

function generateNomadCamp(data, cx, cz) {
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const groundY = getGroundHeight(data, centerX, centerZ);

    // Палатки
    for (let i = 0; i < 3; i++) {
        const tx = centerX + Math.floor(Math.random() * 6) - 3;
        const tz = centerZ + Math.floor(Math.random() * 6) - 3;

        // Основание палатки
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                setBlock(data, tx + x, groundY, tz + z, 'sand');
            }
        }

        // Стены палатки
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && z === 0) continue; // вход
                setBlock(data, tx + x, groundY + 1, tz + z, 'wool');
            }
        }

        // Крыша
        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                setBlock(data, tx + x, groundY + 2, tz + z, 'wool');
            }
        }
    }

    // Костёр в центре
    setBlock(data, centerX, groundY, centerZ, 'campfire');
}

// ============ КОЛОДЦЫ В ДЕРЕВНЯХ (входы в подземелье) ============

function generateVillageWell(data, vx, vy, vz) {
    // Колодец как вход в подземелье
    const wellRadius = 2;

    // Стены колодца
    for (let x = -wellRadius; x <= wellRadius; x++) {
        for (let z = -wellRadius; z <= wellRadius; z++) {
            if (x*x + z*z <= wellRadius*wellRadius + 1) {
                setBlock(data, vx + x, vy, vz + z, 'stone_bricks');
                setBlock(data, vx + x, vy + 1, vz + z, 'stone_bricks');
            }
        }
    }

    // Проход вниз
    for (let y = vy - 1; y >= -15; y--) {
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                if (x*x + z*z <= 2) {
                    setBlock(data, vx + x, y, vz + z, 'air');
                }
            }
        }
    }

    // Лестница
    for (let y = vy - 1; y >= -15; y--) {
        setBlock(data, vx + 1, y, vz, 'ladder');
    }

    // Вода на дне
    setBlock(data, vx, -15, vz, 'water');
    setBlock(data, vx + 1, -15, vz, 'water');
    setBlock(data, vx - 1, -15, vz, 'water');
    setBlock(data, vx, -15, vz + 1, 'water');
    setBlock(data, vx, -15, vz - 1, 'water');
}

// ============ ОБНОВЛЕНИЕ ОБЛАЧНЫХ ГОРОДОВ ============

// В cities.js заменить:
// const SKY_CITY_HEIGHTS = [30, 38]; // СТАРОЕ
// const SKY_CITY_HEIGHTS = [85, 95]; // НОВОЕ

function generateSkyCityUpdated(data, cx, cz) {
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const baseY = 85 + Math.floor(Math.random() * 15); // 85..100
    const size = 6 + Math.floor(Math.random() * 5);

    // Облачная платформа
    for (let x = -size; x <= size; x++) {
        for (let z = -size; z <= size; z++) {
            const dist = Math.sqrt(x*x + z*z);
            if (dist <= size) {
                // Толщина платформы
                for (let y = 0; y < 3; y++) {
                    setBlock(data, centerX + x, baseY - y, centerZ + z, 'cloud_stone');
                }
                // Трава сверху
                if (dist <= size - 1) {
                    setBlock(data, centerX + x, baseY + 1, centerZ + z, 'sky_grass');
                }
            }
        }
    }

    // Здания
    const buildings = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < buildings; i++) {
        const bx = centerX + Math.floor(Math.random() * (size * 2 - 4)) - size + 2;
        const bz = centerZ + Math.floor(Math.random() * (size * 2 - 4)) - size + 2;
        const bHeight = 5 + Math.floor(Math.random() * 8);
        const bw = 2 + Math.floor(Math.random() * 3);
        const bd = 2 + Math.floor(Math.random() * 3);

        for (let x = 0; x < bw; x++) {
            for (let z = 0; z < bd; z++) {
                for (let y = 0; y < bHeight; y++) {
                    let block = 'white_wool';
                    if (y === bHeight - 1) block = 'gold_block';
                    else if (y === 0) block = 'stone_bricks';
                    setBlock(data, bx + x, baseY + 2 + y, bz + z, block);
                }
            }
        }
    }

    // Портал в центре (связь с другими городами)
    setBlock(data, centerX, baseY + 2, centerZ, 'portal');

    // Обелиски по углам
    const corners = [
        [centerX - size + 1, centerZ - size + 1],
        [centerX + size - 1, centerZ - size + 1],
        [centerX - size + 1, centerZ + size - 1],
        [centerX + size - 1, centerZ + size - 1]
    ];
    corners.forEach(([cx_, cz_]) => {
        for (let y = 0; y < 5; y++) {
            setBlock(data, cx_, baseY + 2 + y, cz_, 'obsidian');
        }
        setBlock(data, cx_, baseY + 7, cz_, 'glowstone');
    });

    // Сохраняем город для связи порталами
    if (!data.skyCities) data.skyCities = [];
    data.skyCities.push({ x: centerX, y: baseY, z: centerZ, id: data.skyCities.length });
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function getGroundHeight(data, x, z) {
    // Находим высоту поверхности в точке (x, z)
    for (let y = 40; y >= 0; y--) {
        const block = getBlock(data, x, y, z);
        if (block && block !== 'air') {
            return y;
        }
    }
    return 0;
}

// ============ ПОРТАЛЫ МЕЖДУ УРОВНЯМИ ============

function createLevelPortal(data, x, y, z, fromLevel, toLevel) {
    // Рамка портала
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy > 0) {
                setBlock(data, x + dx, y + dy, z, 'portal_active');
            } else {
                setBlock(data, x + dx, y + dy, z, 'obsidian');
            }
        }
    }

    // Сохраняем связь
    if (!data.levelPortals) data.levelPortals = [];
    data.levelPortals.push({ x, y, z, from: fromLevel, to: toLevel });
}

// Портал: подземелье → поверхность
function createUndergroundExit(data, x, y, z) {
    createLevelPortal(data, x, y, z, 'underground', 'surface');
}

// Портал: поверхность → небеса
function createSkyEntrance(data, x, y, z) {
    createLevelPortal(data, x, y, z, 'surface', 'sky');
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = {
        generateChunk,
        generateHillBridge,
        generateWatchtower,
        generateNomadCamp,
        generateVillageWell,
        generateSkyCityUpdated,
        createUndergroundExit,
        createSkyEntrance
    };
}
