// skyworld.js — небесный мир для MiniCraft Adventure
// Подключается к world.js: genChunkData вызывает generateSkyWorld(data, cx, cz)
// Уровень 65..110: летающие острова, облачные города, хрустальные пещеры,
// обелиски силы, золотые купола, порталы. Облака — проходимые.
// Использует simplex2D/setBlock/_nhash/_ugrng из underground.js

function generateSkyWorld(data, cx, cz) {
    const rng = _ugrng(cx * 7 + 1, cz * 7 + 1);

    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            const worldX = cx * 16 + x;
            const worldZ = cz * 16 + z;

            const islandNoise = simplex2D(worldX * 0.02, worldZ * 0.02);
            const detailNoise = simplex2D(worldX * 0.05 + 100, worldZ * 0.05 + 100);
            const detail01 = detailNoise * 0.5 + 0.5; // 0..1

            // Летающие острова
            if (islandNoise > 0.45) {
                const top = 80 + Math.floor(detail01 * 14); // 80..94
                const thickness = 3 + Math.floor(_nhash(worldX, 90, worldZ) * 4);

                // Основание острова (облачный камень)
                for (let y = 0; y < thickness; y++)
                    setBlock(data, worldX, top - y, worldZ, 'cloudStone');

                // Небесная трава сверху
                setBlock(data, worldX, top + 1, worldZ, 'skyGrass');

                // Хрустальные образования
                if (detailNoise > 0.6 && _nhash(worldX, 91, worldZ) < 0.08) {
                    setBlock(data, worldX, top + 2, worldZ, 'crystal');
                    if (_nhash(worldX, 92, worldZ) < 0.5)
                        setBlock(data, worldX, top + 3, worldZ, 'crystal');
                }

                // Золотые купола (редкие)
                if (detailNoise > 0.75 && _nhash(worldX, 93, worldZ) < 0.02)
                    generateGoldenDome(data, worldX, top + 2, worldZ);
            }
            // Облака (визуальные, проходимые) — кольцом вокруг островов
            else if (islandNoise > 0.2) {
                const cloudY = 68 + Math.floor(detail01 * 10);
                setBlock(data, worldX, cloudY, worldZ, 'cloud');
            }
        }
    }

    // Структуры (редкие, детерминированные).
    // У старта — гарантированно: облачный город (0,0), обелиск (0,-1),
    // хрустальная пещера (3,3) — под квесты y 90..100
    if (rng() < 0.008 || (cx === 0 && cz === 0)) generateSkyCity(data, cx, cz, rng);
    if (rng() < 0.015 || (cx === 3 && cz === 3)) generateCrystalCave(data, cx, cz, rng);
    if (rng() < 0.01 || (cx === 0 && cz === -1)) generateObelisk(data, cx, cz, rng);
}

function generateSkyCity(data, cx, cz, rng) {
    rng = rng || _ugrng(cx, cz);
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const baseY = 90 + Math.floor(rng() * 10); // 90..99
    const size = 5 + Math.floor(rng() * 3);

    // Платформа города (2 слоя облачного камня)
    for (let x = -size; x <= size; x++) {
        for (let z = -size; z <= size; z++) {
            setBlock(data, centerX + x, baseY, centerZ + z, 'cloudStone');
            setBlock(data, centerX + x, baseY - 1, centerZ + z, 'cloudStone');
        }
    }

    // Здания: белые стены, золотая крыша
    const buildings = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < buildings; i++) {
        const bx = centerX + Math.floor(rng() * (size * 2 - 2)) - size + 1;
        const bz = centerZ + Math.floor(rng() * (size * 2 - 2)) - size + 1;
        const height = 4 + Math.floor(rng() * 5);
        const bw = 2 + Math.floor(rng() * 2);
        const bd = 2 + Math.floor(rng() * 2);

        for (let x = 0; x < bw; x++)
            for (let z = 0; z < bd; z++)
                for (let y = 0; y < height; y++)
                    setBlock(data, bx + x, baseY + 1 + y, bz + z,
                        y === height - 1 ? 'goldBlock' : 'whiteWool');
    }

    // Портал в центре города
    setBlock(data, centerX, baseY + 1, centerZ, 'portal');

    // Светильники по углам платформы
    setBlock(data, centerX - size, baseY + 1, centerZ - size, 'glowstone');
    setBlock(data, centerX + size, baseY + 1, centerZ - size, 'glowstone');
    setBlock(data, centerX - size, baseY + 1, centerZ + size, 'glowstone');
    setBlock(data, centerX + size, baseY + 1, centerZ + size, 'glowstone');
}

function generateCrystalCave(data, cx, cz, rng) {
    rng = rng || _ugrng(cx, cz);
    const cx_ = cx * 16 + 8;
    const cz_ = cz * 16 + 8;
    const cy = 85 + Math.floor(rng() * 10); // 85..94
    const radius = 3 + Math.floor(rng() * 3);

    // Полая хрустальная жеода, парящая в небе
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            for (let y = -radius; y <= radius; y++) {
                if (x * x + y * y + z * z <= radius * radius) {
                    const dist = Math.sqrt(x * x + y * y + z * z);
                    setBlock(data, cx_ + x, cy + y, cz_ + z,
                        dist > radius - 1 ? 'crystal' : 'air');
                }
            }
        }
    }
    // Светящееся сердце жеоды
    setBlock(data, cx_, cy, cz_, 'glowstone');
}

function generateGoldenDome(data, x, y, z) {
    const radius = 3;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            for (let dy = 0; dy <= radius; dy++) {
                if (dx * dx + dy * dy + dz * dz <= radius * radius)
                    setBlock(data, x + dx, y + dy, z + dz, 'goldBlock');
            }
        }
    }
    // Вход
    setBlock(data, x, y, z + radius, 'air');
    setBlock(data, x, y + 1, z + radius, 'air');
}

function generateObelisk(data, cx, cz, rng) {
    rng = rng || _ugrng(cx, cz);
    const ox = cx * 16 + 8;
    const oz = cz * 16 + 8;
    const oy = 88;
    const height = 8 + Math.floor(rng() * 6);

    for (let y = 0; y < height; y++) {
        setBlock(data, ox, oy + y, oz, 'obsidian');
        if (y === height - 1)
            setBlock(data, ox, oy + y + 1, oz, 'glowstone');
    }

    // Руны — светящиеся блоки по бокам
    setBlock(data, ox + 1, oy + 2, oz, 'glowstone');
    setBlock(data, ox - 1, oy + 4, oz, 'glowstone');
    setBlock(data, ox, oy + 3, oz + 1, 'glowstone');
    setBlock(data, ox, oy + 5, oz - 1, 'glowstone');
}

// Портал-рамка 3x3 (на будущее — для связи городов)
function generateSkyPortal(data, x, y, z) {
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 1) setBlock(data, x + dx, y + dy, z, 'portalActive');
            else setBlock(data, x + dx, y + dy, z, 'obsidian');
        }
    }
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = { generateSkyWorld, generateSkyPortal };
}
