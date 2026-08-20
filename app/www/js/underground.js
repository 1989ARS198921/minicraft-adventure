// underground.js — генерация подземелья для MiniCraft Adventure
// Подключается к world.js через generateUnderground(data, cx, cz)
// ПРОМПТ: Создать систему генерации подземного мира (глубинный уровень)
// с пещерами, лавовыми озерами, рудами, подземными городами-руинами,
// шахтами и алтарями. Входы через пещеры на поверхности и колодцы в деревнях.
// КОММИТ: feat: add underground world generation (-30..-10 blocks)
// caves, lava lakes, ores, ruins, mines, altars, entrances

function generateUnderground(data, cx, cz) {
    const chunkSize = 16;
    const seed = data.seed || Math.random() * 10000;

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const worldX = cx * chunkSize + x;
            const worldZ = cz * chunkSize + z;

            // Шум для пещер (3D simplex noise)
            for (let y = -30; y < -10; y++) {
                const caveNoise = simplex3D(worldX * 0.08, y * 0.12, worldZ * 0.08);
                const detailNoise = simplex3D(worldX * 0.15, y * 0.2, worldZ * 0.15);

                // Пещеры — пустое пространство
                if (caveNoise > 0.35) {
                    // Иногда размещаем светящиеся грибы на полу пещер
                    if (y === -11 && detailNoise > 0.6 && Math.random() < 0.15) {
                        setBlock(data, worldX, y, worldZ, 'glowshroom');
                    }
                    continue;
                }

                let block = 'stone';

                // Руды — чем глубже, тем реже
                const depthFactor = (y + 30) / 20; // 0..1

                if (y < -25 && Math.random() < 0.015 * depthFactor) {
                    block = 'diamond_ore';
                } else if (y < -20 && Math.random() < 0.03 * depthFactor) {
                    block = 'gold_ore';
                } else if (y < -15 && Math.random() < 0.05 * depthFactor) {
                    block = 'iron_ore';
                } else if (y < -12 && Math.random() < 0.02) {
                    block = 'obsidian';
                } else if (Math.random() < 0.01) {
                    block = 'coal_ore';
                }

                // Лавовые озёра на самой глубине
                if (y < -27) {
                    const lavaNoise = simplex2D(worldX * 0.04, worldZ * 0.04);
                    if (lavaNoise > 0.5 && y < -28 - lavaNoise * 4) {
                        block = 'lava';
                    }
                }

                // Подземные реки
                const riverNoise = simplex2D(worldX * 0.03 + seed, worldZ * 0.03 + seed);
                if (riverNoise > 0.6 && y > -20 && y < -14) {
                    block = 'water';
                }

                setBlock(data, worldX, y, worldZ, block);
            }

            // Бедрок на дне
            setBlock(data, worldX, -31, worldZ, 'bedrock');
        }
    }

    // Подземные структуры (редкие)
    if (Math.random() < 0.03) generateUndergroundRuins(data, cx, cz);
    if (Math.random() < 0.06) generateMine(data, cx, cz);
    if (Math.random() < 0.02) generateAltar(data, cx, cz);
}

function generateUndergroundRuins(data, cx, cz) {
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const centerY = -20 - Math.floor(Math.random() * 8);
    const radius = 4 + Math.floor(Math.random() * 4);

    // Основание руин
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            if (x*x + z*z <= radius*radius) {
                setBlock(data, centerX + x, centerY, centerZ + z, 'stone_bricks');
                // Стены
                if (x*x + z*z > (radius-1)*(radius-1)) {
                    for (let y = 1; y <= 3; y++) {
                        if (Math.random() > 0.3) {
                            setBlock(data, centerX + x, centerY + y, centerZ + z, 'stone_bricks');
                        }
                    }
                }
            }
        }
    }

    // Факелы
    setBlock(data, centerX - radius + 1, centerY + 1, centerZ, 'torch');
    setBlock(data, centerX + radius - 1, centerY + 1, centerZ, 'torch');

    // Сундук с сокровищами
    setBlock(data, centerX, centerY + 1, centerZ, 'chest');
}

function generateMine(data, cx, cz) {
    const startX = cx * 16 + Math.floor(Math.random() * 12) + 2;
    const startZ = cz * 16 + Math.floor(Math.random() * 12) + 2;
    const startY = -18 - Math.floor(Math.random() * 8);
    const length = 6 + Math.floor(Math.random() * 8);
    const dir = Math.random() < 0.5 ? 'x' : 'z';

    for (let i = 0; i < length; i++) {
        const x = dir === 'x' ? startX + i : startX;
        const z = dir === 'z' ? startZ + i : startZ;

        // Шахтная галерея 2x2
        for (let dy = 0; dy < 2; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const bx = x + dx, by = startY + dy, bz = z + dz;
                    // Проход
                    if (dx === 0 && (dir === 'z' || dz === 0) && dy < 2) {
                        // пусто — шахта
                    } else if (dx === 0 && dz === 0 && dy === 1) {
                        // пусто — проход
                    } else {
                        setBlock(data, bx, by, bz, 'wood_planks');
                    }
                }
            }
        }

        // Опорные балки
        if (i % 3 === 0) {
            setBlock(data, x, startY, z, 'wood_log');
            setBlock(data, x, startY + 1, z, 'wood_log');
        }

        // Рельсы
        setBlock(data, x, startY, z, 'rail');

        // Руда в стенах
        if (Math.random() < 0.2) {
            const ores = ['coal_ore', 'iron_ore', 'gold_ore'];
            const ore = ores[Math.floor(Math.random() * ores.length)];
            setBlock(data, x + (dir === 'x' ? 0 : 1), startY, z + (dir === 'z' ? 0 : 1), ore);
        }
    }
}

function generateAltar(data, cx, cz) {
    const ax = cx * 16 + 8;
    const az = cz * 16 + 8;
    const ay = -22;

    // Алтарь 3x3
    for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
            setBlock(data, ax + x, ay, az + z, 'obsidian');
        }
    }

    // Центральный блок — редкий ресурс
    setBlock(data, ax, ay + 1, az, 'diamond_block');

    // Факелы по углам
    setBlock(data, ax - 2, ay + 1, az - 2, 'torch');
    setBlock(data, ax + 2, ay + 1, az - 2, 'torch');
    setBlock(data, ax - 2, ay + 1, az + 2, 'torch');
    setBlock(data, ax + 2, ay + 1, az + 2, 'torch');
}

// Входы в подземелье
function generateCaveEntrance(data, cx, cz) {
    const ex = cx * 16 + Math.floor(Math.random() * 10) + 3;
    const ez = cz * 16 + Math.floor(Math.random() * 10) + 3;

    // Воронка вниз
    for (let y = 5; y >= -10; y--) {
        const radius = Math.max(1, Math.floor((5 - y) * 0.3));
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                if (x*x + z*z <= radius*radius) {
                    setBlock(data, ex + x, y, ez + z, 'air');
                }
            }
        }
    }

    // Факелы у входа
    setBlock(data, ex + 2, 1, ez, 'torch');
    setBlock(data, ex - 2, 1, ez, 'torch');
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = { generateUnderground, generateCaveEntrance };
}
