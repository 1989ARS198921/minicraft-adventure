// skyworld.js — небесный мир для MiniCraft Adventure
// ПРОМПТ: Создать систему генерации небесного мира (облачный уровень)
// с летающими островами, облачными городами, хрустальными пещерами,
// обелисками силы, золотыми куполами и мостами между островами.
// Облачные города поднять с 30/38 до 80-100 блоков.
// Добавить порталы между небесными городами.
// КОММИТ: feat: add sky world generation (60..120 blocks)
// floating islands, cloud cities, crystal caves, obelisks, bridges, portals

function generateSkyWorld(data, cx, cz) {
    const chunkSize = 16;
    const baseHeight = 80;

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const worldX = cx * chunkSize + x;
            const worldZ = cz * chunkSize + z;

            // Шум для облаков и островов
            const islandNoise = simplex2D(worldX * 0.02, worldZ * 0.02);
            const detailNoise = simplex2D(worldX * 0.05 + 100, worldZ * 0.05 + 100);

            // Летающие острова
            if (islandNoise > 0.55) {
                const islandHeight = baseHeight + Math.floor(detailNoise * 15);
                const thickness = 3 + Math.floor(Math.random() * 4);

                // Основание острова (облачный камень)
                for (let y = 0; y < thickness; y++) {
                    setBlock(data, worldX, islandHeight - y, worldZ, 'cloud_stone');
                }

                // Трава/мох сверху
                setBlock(data, worldX, islandHeight + 1, worldZ, 'sky_grass');

                // Хрустальные образования
                if (detailNoise > 0.7 && Math.random() < 0.1) {
                    setBlock(data, worldX, islandHeight + 2, worldZ, 'crystal');
                    setBlock(data, worldX, islandHeight + 3, worldZ, 'crystal');
                }

                // Золотые купола (редкие структуры)
                if (detailNoise > 0.85 && Math.random() < 0.02) {
                    generateGoldenDome(data, worldX, islandHeight + 2, worldZ);
                }
            }

            // Облака (визуальные, проходимые)
            if (islandNoise > 0.3 && islandNoise < 0.55) {
                const cloudY = 70 + Math.floor(detailNoise * 10);
                setBlock(data, worldX, cloudY, worldZ, 'cloud');
            }
        }
    }

    // Облачные города (большие структуры)
    if (Math.random() < 0.008) {
        generateSkyCity(data, cx, cz);
    }

    // Хрустальные пещеры
    if (Math.random() < 0.015) {
        generateCrystalCave(data, cx, cz);
    }

    // Обелиски силы
    if (Math.random() < 0.01) {
        generateObelisk(data, cx, cz);
    }

    // Мосты между близкими островами
    generateSkyBridges(data, cx, cz);
}

function generateSkyCity(data, cx, cz) {
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const baseY = 90 + Math.floor(Math.random() * 10);
    const size = 5 + Math.floor(Math.random() * 4);

    // Платформа города
    for (let x = -size; x <= size; x++) {
        for (let z = -size; z <= size; z++) {
            setBlock(data, centerX + x, baseY, centerZ + z, 'cloud_stone');
            setBlock(data, centerX + x, baseY - 1, centerZ + z, 'cloud_stone');
        }
    }

    // Здания
    const buildings = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < buildings; i++) {
        const bx = centerX + Math.floor(Math.random() * (size * 2 - 2)) - size + 1;
        const bz = centerZ + Math.floor(Math.random() * (size * 2 - 2)) - size + 1;
        const height = 4 + Math.floor(Math.random() * 6);
        const bw = 2 + Math.floor(Math.random() * 2);
        const bd = 2 + Math.floor(Math.random() * 2);

        for (let x = 0; x < bw; x++) {
            for (let z = 0; z < bd; z++) {
                for (let y = 0; y < height; y++) {
                    const block = y === height - 1 ? 'gold_block' : 'white_wool';
                    setBlock(data, bx + x, baseY + 1 + y, bz + z, block);
                }
            }
        }
    }

    // Портал в центре
    setBlock(data, centerX, baseY + 1, centerZ, 'portal');

    // Фонари
    setBlock(data, centerX - size, baseY + 1, centerZ - size, 'glowstone');
    setBlock(data, centerX + size, baseY + 1, centerZ - size, 'glowstone');
    setBlock(data, centerX - size, baseY + 1, centerZ + size, 'glowstone');
    setBlock(data, centerX + size, baseY + 1, centerZ + size, 'glowstone');
}

function generateCrystalCave(data, cx, cz) {
    const cx_ = cx * 16 + 8;
    const cz_ = cz * 16 + 8;
    const cy = 85 + Math.floor(Math.random() * 10);
    const radius = 3 + Math.floor(Math.random() * 3);

    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            for (let y = -radius; y <= radius; y++) {
                if (x*x + y*y + z*z <= radius*radius) {
                    const dist = Math.sqrt(x*x + y*y + z*z);
                    if (dist > radius - 1) {
                        setBlock(data, cx_ + x, cy + y, cz_ + z, 'crystal');
                    } else {
                        setBlock(data, cx_ + x, cy + y, cz_ + z, 'air');
                    }
                }
            }
        }
    }
}

function generateGoldenDome(data, x, y, z) {
    const radius = 3;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            for (let dy = 0; dy <= radius; dy++) {
                if (dx*dx + dy*dy + dz*dz <= radius*radius) {
                    setBlock(data, x + dx, y + dy, z + dz, 'gold_block');
                }
            }
        }
    }
    // Вход
    setBlock(data, x, y, z + radius, 'air');
    setBlock(data, x, y + 1, z + radius, 'air');
}

function generateObelisk(data, cx, cz) {
    const ox = cx * 16 + 8;
    const oz = cz * 16 + 8;
    const oy = 88;
    const height = 8 + Math.floor(Math.random() * 6);

    for (let y = 0; y < height; y++) {
        setBlock(data, ox, oy + y, oz, 'obsidian');
        if (y === height - 1) {
            setBlock(data, ox, oy + y + 1, oz, 'glowstone');
        }
    }

    // Руны (светящиеся блоки по бокам)
    setBlock(data, ox + 1, oy + 2, oz, 'glowstone');
    setBlock(data, ox - 1, oy + 4, oz, 'glowstone');
    setBlock(data, ox, oy + 3, oz + 1, 'glowstone');
    setBlock(data, ox, oy + 5, oz - 1, 'glowstone');
}

function generateSkyBridges(data, cx, cz) {
    // Мосты проверяют соседние чанки — упрощённая версия
    // В реальном проекте нужно хранить позиции островов и соединять их
    const chunkSize = 16;

    for (let x = 0; x < chunkSize; x++) {
        for (let z = 0; z < chunkSize; z++) {
            const worldX = cx * chunkSize + x;
            const worldZ = cz * chunkSize + z;

            // Проверяем, есть ли остров рядом
            const leftIsland = simplex2D((worldX - 8) * 0.02, worldZ * 0.02) > 0.55;
            const rightIsland = simplex2D((worldX + 8) * 0.02, worldZ * 0.02) > 0.55;

            if (leftIsland && rightIsland && Math.random() < 0.3) {
                const bridgeY = 92;
                setBlock(data, worldX, bridgeY, worldZ, 'cloud_stone');
                setBlock(data, worldX, bridgeY - 1, worldZ, 'cloud_stone');
            }
        }
    }
}

// Порталы между небесными городами
function generateSkyPortal(data, x, y, z, targetCityId) {
    // Рамка портала 2x3
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy > 0 && dy < 2) {
                setBlock(data, x + dx, y + dy, z, 'portal_active');
            } else {
                setBlock(data, x + dx, y + dy, z, 'obsidian');
            }
        }
    }

    // Сохраняем связь
    if (!data.portals) data.portals = [];
    data.portals.push({ x, y, z, target: targetCityId });
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = { generateSkyWorld, generateSkyPortal };
}
