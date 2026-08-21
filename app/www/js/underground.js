// underground.js — генерация подземелья для MiniCraft Adventure
// Подключается к world.js: genChunkData вызывает generateUnderground(data, cx, cz)
// Уровень -30..-6: пещеры, лавовые озёра, руды, руины, шахты, алтари, входы.
// Все «случайности» детерминированы координатами — мир одинаков при каждом визите!

// ---------- ШУМ (детерминированный, от координат) ----------
function _nhash(x, y, z) {
    let h = 987654321 ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 974634211);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}
function _sm(t) { return t * t * (3 - 2 * t); }
function _vnoise2(x, z) {
    const xi = Math.floor(x), zi = Math.floor(z);
    const u = _sm(x - xi), v = _sm(z - zi);
    const a = _nhash(xi, 0, zi), b = _nhash(xi + 1, 0, zi);
    const c = _nhash(xi, 0, zi + 1), d = _nhash(xi + 1, 0, zi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function _vnoise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const u = _sm(x - xi), v = _sm(y - yi), w = _sm(z - zi);
    const n000 = _nhash(xi, yi, zi),     n100 = _nhash(xi + 1, yi, zi);
    const n010 = _nhash(xi, yi + 1, zi), n110 = _nhash(xi + 1, yi + 1, zi);
    const n001 = _nhash(xi, yi, zi + 1),     n101 = _nhash(xi + 1, yi, zi + 1);
    const n011 = _nhash(xi, yi + 1, zi + 1), n111 = _nhash(xi + 1, yi + 1, zi + 1);
    const x00 = n000 + (n100 - n000) * u, x10 = n010 + (n110 - n010) * u;
    const x01 = n001 + (n101 - n001) * u, x11 = n011 + (n111 - n011) * u;
    const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
}
// «simplex»-совместимые функции (их ждали старые модули и main.js): диапазон ~-1..1
function simplex2D(x, z) {
    return (_vnoise2(x, z) * 0.7 + _vnoise2(x * 2.7 + 13.7, z * 2.7 + 13.7) * 0.3) * 2 - 1;
}
function simplex3D(x, y, z) {
    return (_vnoise3(x, y, z) * 0.7 + _vnoise3(x * 2.9 + 7.3, y * 2.9 + 7.3, z * 2.9 + 7.3) * 0.3) * 2 - 1;
}

// Блок в данных чанка ('air' = убрать блок)
function setBlock(data, x, y, z, t) {
    const k = (x | 0) + ',' + (y | 0) + ',' + (z | 0);
    if (t === 'air') data.delete(k); else data.set(k, t);
}

// Детерминированный ГСЧ чанка: один и тот же чанк = одни и те же структуры
function _ugrng(cx, cz) {
    let s = (_nhash(cx, 555, cz) * 4294967296) >>> 0 || 1;
    return function () {
        s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
        return s / 4294967296;
    };
}

function generateUnderground(data, cx, cz) {
    const rng = _ugrng(cx, cz);

    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            const worldX = cx * 16 + x;
            const worldZ = cz * 16 + z;

            for (let y = -30; y <= -6; y++) {
                // Пещеры — пустое пространство (туннели по 3D-шуму)
                const caveNoise = simplex3D(worldX * 0.08, y * 0.12, worldZ * 0.08);
                if (caveNoise > 0.3) {
                    // Пол пещеры (снизу твёрдо) — иногда светящийся гриб
                    const below = simplex3D(worldX * 0.08, (y - 1) * 0.12, worldZ * 0.08);
                    if (below <= 0.3 && _nhash(worldX, y * 7 + 2, worldZ) < 0.06)
                        setBlock(data, worldX, y, worldZ, 'glowshroom');
                    continue;
                }

                let block = 'stone';

                // Руды — чем глубже, тем ценнее
                const r = _nhash(worldX, y * 3 + 1, worldZ);
                if (y < -25 && r < 0.015) block = 'diamondOre';
                else if (y < -20 && r < 0.03) block = 'goldOre';
                else if (y < -12 && r < 0.02) block = 'obsidian';
                else if (r < 0.05) block = 'coalOre';

                // Лавовые озёра на самом дне
                if (y <= -29) {
                    const lavaNoise = simplex2D(worldX * 0.04, worldZ * 0.04);
                    if (lavaNoise > 0.35) block = 'lava';
                }

                // Подземные реки
                const riverNoise = simplex2D(worldX * 0.03 + 400, worldZ * 0.03 + 400);
                if (riverNoise > 0.55 && y > -20 && y < -14) block = 'water';

                setBlock(data, worldX, y, worldZ, block);
            }

            // Непробиваемое дно мира
            setBlock(data, worldX, -31, worldZ, 'obsidian');
        }
    }

    // Подземные структуры (редкие, детерминированные).
    // У старта — гарантированно: алтарь и вход (0,0), руины (0,-1), шахта (-1,0)
    if (rng() < 0.04 || (cx === 0 && cz === -1)) generateUndergroundRuins(data, cx, cz, rng);
    if (rng() < 0.06 || (cx === -1 && cz === 0)) generateMine(data, cx, cz, rng);
    if (rng() < 0.03 || (cx === 0 && cz === 0)) generateAltar(data, cx, cz, rng);
    if (rng() < 0.05 || (cx === 0 && cz === 0)) generateCaveEntrance(data, cx, cz, rng);
}

function generateUndergroundRuins(data, cx, cz, rng) {
    rng = rng || _ugrng(cx, cz);
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    const centerY = -20 - Math.floor(rng() * 8);
    const radius = 4 + Math.floor(rng() * 3);

    // Основание и стены руин
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            if (x * x + z * z <= radius * radius) {
                setBlock(data, centerX + x, centerY, centerZ + z, 'stoneBricks');
                // Разрушенные стены по кругу
                if (x * x + z * z > (radius - 1) * (radius - 1)) {
                    for (let y = 1; y <= 3; y++) {
                        if (rng() > 0.35)
                            setBlock(data, centerX + x, centerY + y, centerZ + z, 'stoneBricks');
                    }
                }
            }
        }
    }

    // Светильники
    setBlock(data, centerX - radius + 1, centerY + 1, centerZ, 'glowstone');
    setBlock(data, centerX + radius - 1, centerY + 1, centerZ, 'glowstone');

    // Сундук с сокровищами в центре
    setBlock(data, centerX, centerY + 1, centerZ, 'chest');
}

function generateMine(data, cx, cz, rng) {
    rng = rng || _ugrng(cx, cz);
    const sx = cx * 16 + 2 + Math.floor(rng() * 12);
    const sz = cz * 16 + 2 + Math.floor(rng() * 12);
    const sy = -18 - Math.floor(rng() * 8);
    const len = 6 + Math.floor(rng() * 8);
    const dx = rng() < 0.5 ? 1 : 0, dz = 1 - dx;

    for (let i = 0; i < len; i++) {
        const x = sx + dx * i, z = sz + dz * i;
        // Не вылезаем за пределы чанка
        if (x < cx * 16 || x >= cx * 16 + 16 || z < cz * 16 || z >= cz * 16 + 16) break;

        setBlock(data, x, sy, z, 'rail');        // рельсы на полу
        setBlock(data, x, sy + 1, z, 'air');     // проход (2 блока высотой)
        setBlock(data, x, sy + 2, z, 'air');

        // Опорная рама из дерева каждые 3 блока
        if (i % 3 === 0) {
            setBlock(data, x + dz, sy + 1, z + dx, 'trunk');
            setBlock(data, x - dz, sy + 1, z - dx, 'trunk');
            setBlock(data, x + dz, sy + 2, z + dx, 'trunk');
            setBlock(data, x - dz, sy + 2, z - dx, 'trunk');
            setBlock(data, x, sy + 3, z, 'planks');
        }

        // Руда в стенах шахты
        if (rng() < 0.25) {
            const ores = ['coalOre', 'goldOre', 'diamondOre'];
            setBlock(data, x + dz, sy + 1, z + dx, ores[Math.floor(rng() * 3)]);
        }
    }

    // Светильник у входа в шахту
    setBlock(data, sx, sy + 2, sz, 'glowstone');
}

function generateAltar(data, cx, cz, rng) {
    const ax = cx * 16 + 8;
    const az = cz * 16 + 8;
    const ay = -22;

    // Алтарь 3x3 из обсидиана
    for (let x = -1; x <= 1; x++)
        for (let z = -1; z <= 1; z++)
            setBlock(data, ax + x, ay, az + z, 'obsidian');

    // Центральный блок — сокровище
    setBlock(data, ax, ay + 1, az, 'diamondBlock');

    // Светильники по углам
    setBlock(data, ax - 2, ay + 1, az - 2, 'glowstone');
    setBlock(data, ax + 2, ay + 1, az - 2, 'glowstone');
    setBlock(data, ax - 2, ay + 1, az + 2, 'glowstone');
    setBlock(data, ax + 2, ay + 1, az + 2, 'glowstone');
}

// Вход в подземелье: воронка с поверхности вниз
function generateCaveEntrance(data, cx, cz, rng) {
    rng = rng || _ugrng(cx, cz);
    const ex = cx * 16 + 3 + Math.floor(rng() * 10);
    const ez = cz * 16 + 3 + Math.floor(rng() * 10);

    // Воронка: узкое горлышко сверху, шире к пещерам
    for (let y = 5; y >= -14; y--) {
        const radius = Math.max(1, Math.floor((5 - y) * 0.25));
        for (let x = -radius; x <= radius; x++)
            for (let z = -radius; z <= radius; z++)
                if (x * x + z * z <= radius * radius)
                    setBlock(data, ex + x, y, ez + z, 'air');
    }

    // Светильник-маркер на глубине
    setBlock(data, ex + 2, -12, ez, 'glowstone');
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = { generateUnderground, generateCaveEntrance };
}
