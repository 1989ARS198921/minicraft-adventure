// enhanced_skins.js — улучшенные текстуры монстров для MiniCraft Adventure
// Все текстуры 64×64, используют Canvas API
// ПРОМПТ: Создать 20 Canvas-текстур (64×64) для всех монстров и боссов
// MiniCraft Adventure. Обычные монстры: гоблин, орк, паук, скелет, волк,
// тролль, зомби, призрак, слизень, летучая мышь. Боссы: лесной великан,
// каменный голем, ледяной дракон, паучиха, некромант, кракен,
// огненный элементаль, тёмный рыцарь, король гоблинов, ледяной тролль.
// Использовать яркие различимые цвета, детали: рога, крылья, оружие,
// шрамы, светящиеся элементы. Для призраков и слизней — полупрозрачность.
// КОММИТ: feat: add enhanced 64x64 mob textures (20 skins)
// goblin, orc, spider, skeleton, wolf, troll, zombie, ghost, slime, bat
// + 10 boss skins with unique details
// ПРОМПТ: Создать 20 Canvas-текстур (64×64) для всех монстров и боссов
// MiniCraft Adventure. Обычные монстры: гоблин, орк, паук, скелет, волк,
// тролль, зомби, призрак, слизень, летучая мышь. Боссы: лесной великан,
// каменный голем, ледяной дракон, паучиха, некромант, кракен,
// огненный элементаль, тёмный рыцарь, король гоблинов, ледяной тролль.
// Использовать яркие различимые цвета, детали: рога, крылья, оружие,
// шрамы, светящиеся элементы. Для призраков и слизней — полупрозрачность.
// КОММИТ: feat: add enhanced 64x64 mob textures (20 skins)
// goblin, orc, spider, skeleton, wolf, troll, zombie, ghost, slime, bat
// + 10 boss skins with unique details

// ==================== ОБЫЧНЫЕ МОНСТРЫ ====================

function createGoblinSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // База — зелёная кожа
    ctx.fillStyle = '#3d7a35';
    ctx.fillRect(0, 0, 64, 64);

    // Красные глаза
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(18, 14, 8, 5);
    ctx.fillRect(38, 14, 8, 5);

    // Острые уши (верх текстуры)
    ctx.fillStyle = '#4a8a42';
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(12, 14); ctx.lineTo(0, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(58, 0); ctx.lineTo(64, 14); ctx.lineTo(52, 14); ctx.fill();

    // Нос-клюв
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(30, 18, 4, 6);

    // Зубы
    ctx.fillStyle = '#ffffcc';
    ctx.fillRect(26, 26, 4, 3);
    ctx.fillRect(34, 26, 4, 3);

    // Одежда (лохмотья)
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(8, 32, 48, 32);
    ctx.fillStyle = '#6b4a2a';
    ctx.fillRect(12, 36, 40, 24);

    return new THREE.CanvasTexture(canvas);
}

function createOrcSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Тёмно-зелёная кожа
    ctx.fillStyle = '#2a5a22';
    ctx.fillRect(0, 0, 64, 64);

    // Шрам на лице
    ctx.fillStyle = '#1a3a15';
    ctx.fillRect(22, 10, 2, 18);
    ctx.fillRect(20, 14, 6, 2);
    ctx.fillRect(20, 22, 6, 2);

    // Жёлтые глаза
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(16, 16, 10, 6);
    ctx.fillRect(38, 16, 10, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(19, 18, 4, 2);
    ctx.fillRect(41, 18, 4, 2);

    // Брови
    ctx.fillStyle = '#1a3a15';
    ctx.fillRect(14, 12, 14, 3);
    ctx.fillRect(36, 12, 14, 3);

    // Клыки
    ctx.fillStyle = '#e0e0c0';
    ctx.fillRect(24, 28, 4, 6);
    ctx.fillRect(36, 28, 4, 6);

    // Броня (грубая кожа)
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(8, 36, 48, 28);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(12, 40, 40, 20);

    return new THREE.CanvasTexture(canvas);
}

function createSpiderSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Чёрное тело
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 64, 64);

    // Красные глаза (светящиеся)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(16, 16, 10, 10);
    ctx.fillRect(38, 16, 10, 10);
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(18, 18, 6, 6);
    ctx.fillRect(40, 18, 6, 6);

    // Паутинный узор на спине
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, 8); ctx.lineTo(32, 56);
    ctx.moveTo(8, 32); ctx.lineTo(56, 32);
    ctx.moveTo(16, 16); ctx.lineTo(48, 48);
    ctx.moveTo(48, 16); ctx.lineTo(16, 48);
    ctx.stroke();

    // Тёмно-красные пятна
    ctx.fillStyle = '#330000';
    ctx.fillRect(24, 24, 16, 16);

    return new THREE.CanvasTexture(canvas);
}

function createSkeletonSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Белые кости
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(0, 0, 64, 64);

    // Глазницы (тёмные)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(16, 14, 12, 12);
    ctx.fillRect(36, 14, 12, 12);

    // Светящиеся глаза
    ctx.fillStyle = '#88ff88';
    ctx.fillRect(19, 17, 6, 6);
    ctx.fillRect(39, 17, 6, 6);

    // Носовая кость
    ctx.fillStyle = '#d0c8b8';
    ctx.fillRect(30, 28, 4, 8);

    // Зубы
    ctx.fillStyle = '#f0e8d8';
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(22 + i * 4, 38, 3, 4);
    }

    // Трещины на костях
    ctx.strokeStyle = '#c0b8a8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 8); ctx.lineTo(14, 14);
    ctx.moveTo(50, 10); ctx.lineTo(56, 18);
    ctx.moveTo(10, 50); ctx.lineTo(16, 44);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

function createWolfSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Серая шерсть
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, 64, 64);

    // Более тёмная спина
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, 0, 64, 20);

    // Светлый живот
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(8, 40, 48, 24);

    // Глаза (жёлтые)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(18, 18, 8, 6);
    ctx.fillRect(38, 18, 8, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 20, 4, 2);
    ctx.fillRect(40, 20, 4, 2);

    // Пасть
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(26, 30, 12, 8);
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(28, 32, 8, 4);

    // Уши (острые)
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(18, 14); ctx.lineTo(4, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(54, 0); ctx.lineTo(60, 14); ctx.lineTo(46, 14); ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function createTrollSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Серая кожа
    ctx.fillStyle = '#6a7a6a';
    ctx.fillRect(0, 0, 64, 64);

    // Морщины
    ctx.fillStyle = '#5a6a5a';
    ctx.fillRect(0, 20, 64, 4);
    ctx.fillRect(0, 32, 64, 4);
    ctx.fillRect(0, 44, 64, 4);

    // Маленькие глаза
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(20, 16, 8, 6);
    ctx.fillRect(36, 16, 8, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(22, 18, 4, 2);
    ctx.fillRect(38, 18, 4, 2);

    // Большой нос
    ctx.fillStyle = '#5a7a5a';
    ctx.fillRect(28, 24, 8, 10);

    // Клыки
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(22, 36, 5, 8);
    ctx.fillRect(37, 36, 5, 8);

    // Шкуры / лохмотья
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(8, 48, 48, 16);

    return new THREE.CanvasTexture(canvas);
}

function createZombieSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Гнилой зелёный
    ctx.fillStyle = '#4a6a3a';
    ctx.fillRect(0, 0, 64, 64);

    // Гнилые заплатки
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillRect(42, 30, 10, 14);
    ctx.fillRect(20, 48, 24, 8);

    // Кости видны
    ctx.fillStyle = '#d0c8b8';
    ctx.fillRect(14, 20, 4, 4);
    ctx.fillRect(46, 40, 4, 4);

    // Глаза (пустые)
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(18, 16, 10, 8);
    ctx.fillRect(36, 16, 10, 8);
    ctx.fillStyle = '#88ff88';
    ctx.fillRect(20, 18, 3, 3);
    ctx.fillRect(41, 18, 3, 3);

    // Лохмотья
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(8, 32, 48, 32);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(12, 40, 20, 20);
    ctx.fillRect(36, 36, 16, 24);

    return new THREE.CanvasTexture(canvas);
}

function createGhostSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Полупрозрачный белый (светящийся)
    ctx.fillStyle = '#e8f0ff';
    ctx.fillRect(0, 0, 64, 64);

    // Глаза (пустые, тёмные)
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(20, 18, 8, 8);
    ctx.fillRect(36, 18, 8, 8);

    // Рот (крик)
    ctx.fillStyle = '#0a0a1a';
    ctx.beginPath();
    ctx.ellipse(32, 36, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Контур призрака (волнистый низ)
    ctx.fillStyle = '#d0e0ff';
    ctx.fillRect(0, 50, 64, 14);
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#e8f0ff' : '#d0e0ff';
        ctx.fillRect(i * 8, 50 + (i % 2) * 6, 8, 14);
    }

    return new THREE.CanvasTexture(canvas);
}

function createSlimeSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Полупрозрачный зелёный
    ctx.fillStyle = '#66ff66';
    ctx.fillRect(0, 0, 64, 64);

    // Более тёмные пятна (глубина)
    ctx.fillStyle = '#44cc44';
    ctx.fillRect(12, 12, 16, 16);
    ctx.fillRect(36, 32, 16, 16);
    ctx.fillRect(20, 44, 12, 12);

    // Светлые блики
    ctx.fillStyle = '#99ff99';
    ctx.fillRect(8, 8, 10, 10);
    ctx.fillRect(44, 16, 8, 8);

    // Глаза
    ctx.fillStyle = '#000000';
    ctx.fillRect(22, 24, 6, 6);
    ctx.fillRect(36, 24, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 26, 2, 2);
    ctx.fillRect(38, 26, 2, 2);

    return new THREE.CanvasTexture(canvas);
}

function createBatSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Чёрное тело
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, 64, 64);

    // Крылья (текстура развёртки)
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 16, 64, 32);

    // Кости крыльев
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.lineTo(64, 32);
    ctx.moveTo(16, 16); ctx.lineTo(16, 48);
    ctx.moveTo(32, 16); ctx.lineTo(32, 48);
    ctx.moveTo(48, 16); ctx.lineTo(48, 48);
    ctx.stroke();

    // Глаза (светящиеся красные)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(24, 28, 6, 6);
    ctx.fillRect(34, 28, 6, 6);
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(25, 29, 2, 2);
    ctx.fillRect(35, 29, 2, 2);

    // Уши
    ctx.fillStyle = '#0d0d1a';
    ctx.beginPath(); ctx.moveTo(20, 8); ctx.lineTo(26, 20); ctx.lineTo(14, 20); ctx.fill();
    ctx.beginPath(); ctx.moveTo(44, 8); ctx.lineTo(50, 20); ctx.lineTo(38, 20); ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

// ==================== БОССЫ ====================

function createForestGiantSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Густая зелёная шерсть
    ctx.fillStyle = '#2a5a1a';
    ctx.fillRect(0, 0, 64, 64);

    // Тёмные пятна (мох)
    ctx.fillStyle = '#1a3a0a';
    ctx.fillRect(8, 8, 20, 20);
    ctx.fillRect(40, 32, 16, 16);

    // Рога (светлые)
    ctx.fillStyle = '#c8b898';
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(20, 12); ctx.lineTo(4, 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(52, 0); ctx.lineTo(60, 12); ctx.lineTo(44, 12); ctx.fill();

    // Глаза (ярко-зелёные)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(16, 18, 12, 8);
    ctx.fillRect(36, 18, 12, 8);
    ctx.fillStyle = '#000000';
    ctx.fillRect(19, 20, 6, 4);
    ctx.fillRect(39, 20, 6, 4);

    // Борода
    ctx.fillStyle = '#3a6a2a';
    ctx.fillRect(12, 32, 40, 20);

    return new THREE.CanvasTexture(canvas);
}

function createStoneGolemSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Фактурный камень
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, 64, 64);

    // Трещины (руны)
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 8); ctx.lineTo(20, 20); ctx.lineTo(16, 32);
    ctx.moveTo(56, 8); ctx.lineTo(44, 20); ctx.lineTo(48, 32);
    ctx.moveTo(32, 8); ctx.lineTo(32, 56);
    ctx.stroke();

    // Светящиеся руны
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(14, 14, 4, 4);
    ctx.fillRect(46, 14, 4, 4);
    ctx.fillRect(30, 40, 4, 4);

    // Глаза (светящиеся синие)
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(18, 20, 10, 6);
    ctx.fillRect(36, 20, 10, 6);

    return new THREE.CanvasTexture(canvas);
}

function createIceDragonSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Ледяная чешуя
    ctx.fillStyle = '#a0d0f0';
    ctx.fillRect(0, 0, 64, 64);

    // Чешуйчатый узор
    ctx.strokeStyle = '#80b0d0';
    ctx.lineWidth = 1;
    for (let y = 0; y < 64; y += 8) {
        for (let x = 0; x < 64; x += 8) {
            ctx.strokeRect(x, y, 8, 8);
        }
    }

    // Шипы на спине (тёмно-синие)
    ctx.fillStyle = '#205080';
    ctx.fillRect(28, 0, 8, 16);
    ctx.fillRect(24, 8, 16, 4);

    // Глаза (ледяные)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 18, 12, 8);
    ctx.fillRect(36, 18, 12, 8);
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(18, 20, 8, 4);
    ctx.fillRect(38, 20, 8, 4);

    return new THREE.CanvasTexture(canvas);
}

function createSpiderQueenSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Чёрный с фиолетовым отливом
    ctx.fillStyle = '#2a1a3a';
    ctx.fillRect(0, 0, 64, 64);

    // Фиолетовые пятна
    ctx.fillStyle = '#5a2a8a';
    ctx.fillRect(12, 12, 16, 16);
    ctx.fillRect(36, 28, 16, 16);
    ctx.fillRect(20, 44, 24, 12);

    // Глаза (много глаз — 6 штук)
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(14, 10, 6, 6);
    ctx.fillRect(24, 8, 6, 6);
    ctx.fillRect(34, 8, 6, 6);
    ctx.fillRect(44, 10, 6, 6);
    ctx.fillRect(20, 18, 6, 6);
    ctx.fillRect(38, 18, 6, 6);

    // Клыки
    ctx.fillStyle = '#cc00cc';
    ctx.fillRect(26, 30, 4, 10);
    ctx.fillRect(34, 30, 4, 10);

    return new THREE.CanvasTexture(canvas);
}

function createNecromancerSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Чёрный плащ
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 64, 64);

    // Капюшон
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(12, 0, 40, 20);

    // Светящиеся глаза (фиолетовые)
    ctx.fillStyle = '#aa00ff';
    ctx.fillRect(22, 14, 8, 6);
    ctx.fillRect(34, 14, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 15, 3, 2);
    ctx.fillRect(37, 15, 3, 2);

    // Посох (на текстуре руки)
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(52, 20, 8, 44);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(52, 16, 8, 8); // череп на посохе

    // Руны на плаще
    ctx.fillStyle = '#6600aa';
    ctx.fillRect(16, 36, 4, 4);
    ctx.fillRect(44, 40, 4, 4);
    ctx.fillRect(28, 52, 4, 4);

    return new THREE.CanvasTexture(canvas);
}

function createKrakenSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Тёмно-синяя чешуя
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(0, 0, 64, 64);

    // Чешуйчатый узор
    ctx.strokeStyle = '#0a1a3a';
    ctx.lineWidth = 1;
    for (let y = 0; y < 64; y += 6) {
        for (let x = 0; x < 64; x += 6) {
            ctx.strokeRect(x, y, 6, 6);
        }
    }

    // Огромный глаз (в центре)
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(32, 28, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(32, 28, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.arc(32, 28, 3, 0, Math.PI * 2); ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

function createFireElementalSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Пылающее тело (градиент от жёлтого к красному)
    for (let y = 0; y < 64; y++) {
        const ratio = y / 64;
        const r = 255;
        const g = Math.floor(200 * (1 - ratio));
        const b = 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, 64, 1);
    }

    // Ядро (белое)
    ctx.fillStyle = '#ffffaa';
    ctx.fillRect(20, 20, 24, 24);

    // Глаза (тёмные)
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(24, 28, 6, 6);
    ctx.fillRect(34, 28, 6, 6);

    // Искры
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(8, 8, 4, 4);
    ctx.fillRect(52, 12, 4, 4);
    ctx.fillRect(16, 52, 4, 4);
    ctx.fillRect(48, 48, 4, 4);

    return new THREE.CanvasTexture(canvas);
}

function createDarkKnightSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Чёрные доспехи
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 64, 64);

    // Металлические вставки
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(8, 8, 48, 20);
    ctx.fillRect(8, 40, 48, 16);

    // Шлем (закрытый)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(16, 4, 32, 16);

    // Глазницы (огненный свет)
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(22, 10, 6, 4);
    ctx.fillRect(36, 10, 6, 4);

    // Плащ (тёмно-красный)
    ctx.fillStyle = '#2a0a0a';
    ctx.fillRect(0, 32, 64, 32);

    return new THREE.CanvasTexture(canvas);
}

function createGoblinKingSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Зелёная кожа (ярче обычного гоблина)
    ctx.fillStyle = '#4a8a3a';
    ctx.fillRect(0, 0, 64, 64);

    // Корона (золотая)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(12, 0, 40, 8);
    ctx.fillRect(16, 8, 4, 6);
    ctx.fillRect(28, 8, 8, 6);
    ctx.fillRect(44, 8, 4, 6);

    // Глаза (злобные)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(18, 16, 10, 6);
    ctx.fillRect(36, 16, 10, 6);

    // Шкура медведя (на плечах)
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(4, 28, 16, 20);
    ctx.fillRect(44, 28, 16, 20);

    // Золотой посох (на текстуре)
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(52, 20, 8, 44);

    return new THREE.CanvasTexture(canvas);
}

function createIceTrollSkin() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Ледяная кожа
    ctx.fillStyle = '#80c0d0';
    ctx.fillRect(0, 0, 64, 64);

    // Ледяные кристаллы
    ctx.fillStyle = '#a0e0f0';
    ctx.fillRect(8, 8, 12, 12);
    ctx.fillRect(44, 16, 12, 12);
    ctx.fillRect(20, 44, 24, 12);

    // Глаза (ледяные)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 18, 10, 6);
    ctx.fillRect(36, 18, 10, 6);
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(20, 20, 6, 2);
    ctx.fillRect(38, 20, 6, 2);

    // Дубина изо льда (на текстуре)
    ctx.fillStyle = '#60a0c0';
    ctx.fillRect(52, 24, 8, 40);
    ctx.fillStyle = '#a0e0f0';
    ctx.fillRect(50, 20, 12, 8);

    return new THREE.CanvasTexture(canvas);
}

// ==================== РЕГИСТРАЦИЯ СКИНОВ ====================

const SKIN_REGISTRY = {
    // Обычные монстры
    goblin: createGoblinSkin,
    orc: createOrcSkin,
    spider: createSpiderSkin,
    skeleton: createSkeletonSkin,
    wolf: createWolfSkin,
    troll: createTrollSkin,
    zombie: createZombieSkin,
    ghost: createGhostSkin,
    slime: createSlimeSkin,
    bat: createBatSkin,
    // Боссы
    forest_giant: createForestGiantSkin,
    stone_golem: createStoneGolemSkin,
    ice_dragon: createIceDragonSkin,
    spider_queen: createSpiderQueenSkin,
    necromancer: createNecromancerSkin,
    kraken: createKrakenSkin,
    fire_elemental: createFireElementalSkin,
    dark_knight: createDarkKnightSkin,
    goblin_king: createGoblinKingSkin,
    ice_troll: createIceTrollSkin
};

function getMobSkin(mobType) {
    if (typeof THREE === 'undefined') {
        console.warn('⚠️ getMobSkin: THREE не загружен, текстуры не созданы');
        return null;
    }
    const factory = SKIN_REGISTRY[mobType];
    return factory ? factory() : null;
}

// Экспорт
if (typeof module !== 'undefined') {
    module.exports = { SKIN_REGISTRY, getMobSkin };
}
