// ============================================================
//  🎨 СКИНЫ ПЕРСОНАЖЕЙ — пиксельные «костюмчики» 64×64
//  Рисуем лицо, одежду и причёску на одной картинке 64×64 —
//  точно как настоящий скин из Minecraft! Потом натягиваем
//  её на коробочки тела: голова 8×8×8, тело 8×12×4 и т.д.
//  Каждый житель получает свой наряд: у Мерлина — мантия
//  со звёздами, у Тихона — фартук, у Маши — платьице.
// ============================================================

import * as THREE from 'three';

const TW = 64, TH = 64; // размер холста-скина (как у настоящих скинов!)

// ---------- РАЗВЁРТКА: где лежит каждая грань на картинке ----------
// Формат: [x, y, ширина, высота] в пикселях холста.
// px = правая сторона, nx = левая, py = верх, ny = низ,
// pz = спина (наши человечки смотрят на -z!), nz = лицо/перед.
const RECTS = {
  head: { // голова 8×8×8
    px: [0, 8, 8, 8],  nx: [16, 8, 8, 8],
    py: [8, 0, 8, 8],  ny: [16, 0, 8, 8],
    pz: [24, 8, 8, 8], nz: [8, 8, 8, 8]
  },
  body: { // тело 8×12×4
    px: [16, 20, 4, 12], nx: [28, 20, 4, 12],
    py: [20, 16, 8, 4],  ny: [28, 16, 8, 4],
    pz: [32, 20, 8, 12], nz: [20, 20, 8, 12]
  },
  armR: { // правая рука 4×12×4
    px: [40, 20, 4, 12], nx: [48, 20, 4, 12],
    py: [44, 16, 4, 4],  ny: [48, 16, 4, 4],
    pz: [52, 20, 4, 12], nz: [44, 20, 4, 12]
  },
  armL: { // левая рука
    px: [32, 52, 4, 12], nx: [40, 52, 4, 12],
    py: [36, 48, 4, 4],  ny: [40, 48, 4, 4],
    pz: [44, 52, 4, 12], nz: [36, 52, 4, 12]
  },
  legR: { // правая нога
    px: [0, 20, 4, 12], nx: [8, 20, 4, 12],
    py: [4, 16, 4, 4],  ny: [8, 16, 4, 4],
    pz: [12, 20, 4, 12], nz: [4, 20, 4, 12]
  },
  legL: { // левая нога
    px: [16, 52, 4, 12], nx: [24, 52, 4, 12],
    py: [20, 48, 4, 4],  ny: [24, 48, 4, 4],
    pz: [28, 52, 4, 12], nz: [20, 52, 4, 12]
  }
};

// ---------- УМНАЯ РАСКЛАДКА UV НА КОРОБОЧКЕ ----------
// У BoxGeometry 24 вершины: по 4 на грань, порядок граней px,nx,py,ny,pz,nz.
// Проверено на скриншотах: вершины грани идут как (лево-верх, право-верх,
// лево-низ, право-низ) при взгляде снаружи — кладём картинку как есть.
const FACE_ORDER = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
function setBoxUV(geo, part) {
  const uv = geo.attributes.uv;
  const eps = 0.4; // отступ в полпикселя, чтобы не цеплять соседние области
  FACE_ORDER.forEach((f, fi) => {
    const [x, y, w, h] = RECTS[part][f];
    const cu0 = (x + eps) / TW, cu1 = (x + w - eps) / TW;
    const cv0 = 1 - (y + h - eps) / TH, cv1 = 1 - (y + eps) / TH;
    const corners = [cu0, cv1, cu1, cv1, cu0, cv0, cu1, cv0];
    for (let k = 0; k < 4; k++) uv.setXY(fi * 4 + k, corners[k * 2], corners[k * 2 + 1]);
  });
  uv.needsUpdate = true;
}

// Часть тела с натянутым скином (как bodyPart, но с картинкой!)
export function skinnedPart(w, h, d, tex, part, x, y, z, pivotY) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (pivotY !== undefined) geo.translate(0, pivotY, 0);
  setBoxUV(geo, part);
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex }));
  mesh.position.set(x, y, z);
  return mesh;
}

// ---------- МАЛЕНЬКИЕ ПОМОЩНИКИ ХУДОЖНИКА ----------
function P(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

// Сделать цвет темнее (f<1) или светлее (f>1)
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g2 = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g2},${b})`;
}

// ---------- ЛИЦО (передняя грань головы 8×8, начало в (8,8)) ----------
function drawFace(g, o) {
  const X = 8, Y = 8; // левый верх области лица на холсте
  if (o.style === 'orc') { // 👹 Злое лицо орка: без румянца и улыбки!
    P(g, X + 1, Y + 2, 2, 1, '#1A1A1A'); P(g, X + 5, Y + 2, 2, 1, '#1A1A1A'); // густые брови
    P(g, X + 2, Y + 3, 1, 1, '#1A1A1A'); P(g, X + 5, Y + 3, 1, 1, '#1A1A1A'); // сдвинуты к носу
    P(g, X + 1, Y + 3, 2, 2, '#C03030'); P(g, X + 5, Y + 3, 2, 2, '#C03030'); // красные глаза
    P(g, X + 2, Y + 4, 1, 1, '#300000'); P(g, X + 5, Y + 4, 1, 1, '#300000'); // зрачки
    P(g, X + 3, Y + 5, 2, 1, shade(o.skin, 0.7)); // нос
    P(g, X + 2, Y + 6, 4, 1, '#2A1A12'); // злая складка рта
    P(g, X + 2, Y + 5, 1, 1, '#FFF8E0'); P(g, X + 5, Y + 5, 1, 1, '#FFF8E0'); // клыки вверх!
    return;
  }
  if (o.style === 'goblin') { // 😈 худое хитрое лицо гоблина
    P(g, X + 1, Y + 2, 2, 1, '#223311'); P(g, X + 5, Y + 2, 2, 1, '#223311'); // тонкие бровки
    P(g, X + 1, Y + 3, 2, 2, '#FFD030'); P(g, X + 5, Y + 3, 2, 2, '#FFD030'); // жёлтые глаза
    P(g, X + 2, Y + 4, 1, 1, '#403000'); P(g, X + 5, Y + 4, 1, 1, '#403000'); // зрачки
    P(g, X + 3, Y + 5, 2, 1, shade(o.skin, 0.75)); // длинный нос
    P(g, X + 2, Y + 6, 4, 1, '#1F2A12');           // хитрая ухмылка
    P(g, X + 4, Y + 7, 1, 1, '#FFFFFF');           // один зубик торчит!
    return;
  }
  if (o.style === 'troll') { // 🧌 тяжёлая монобровь и маленькие глазки
    P(g, X + 1, Y + 2, 6, 1, '#2E2E2E');            // монобровь-лесенка
    P(g, X + 1, Y + 3, 1, 1, '#FFCC33'); P(g, X + 6, Y + 3, 1, 1, '#FFCC33'); // глазки-пуговки
    P(g, X + 3, Y + 4, 2, 2, shade(o.skin, 0.8));   // большой нос-картошка
    P(g, X + 6, Y + 5, 1, 1, shade(o.skin, 0.65));  // бородавка на щеке
    P(g, X + 2, Y + 7, 4, 1, '#2A2018');            // кривой рот
    return;
  }
  // Глазки: белки 2×2 + цветной зрачок у носа — получается мило!
  P(g, X + 1, Y + 3, 2, 2, '#FFFFFF'); P(g, X + 5, Y + 3, 2, 2, '#FFFFFF');
  P(g, X + 2, Y + 4, 1, 1, o.eye);     P(g, X + 5, Y + 4, 1, 1, o.eye);
  // Румянец на щёчках — полупрозрачный розовый
  P(g, X + 0, Y + 5, 1, 1, 'rgba(255,120,140,0.5)');
  P(g, X + 7, Y + 5, 1, 1, 'rgba(255,120,140,0.5)');
  if (o.style === 'wizard') {
    // 🧙 Борода! Усы + окладистая борода вместо улыбки
    P(g, X + 2, Y + 5, 4, 1, o.hair);            // усы
    P(g, X + 1, Y + 6, 6, 2, o.hair);            // борода
    P(g, X + 3, Y + 6, 2, 1, shade(o.skin, 0.8)); // ротик в бороде
  } else {
    // Улыбка ∪ : две точки внизу и уголки наверху
    P(g, X + 3, Y + 6, 2, 1, '#8A4A3A');
    P(g, X + 2, Y + 5, 1, 1, '#8A4A3A'); P(g, X + 5, Y + 5, 1, 1, '#8A4A3A');
  }
}

// ---------- ВОЛОСЫ НА ГОЛОВЕ ----------
function drawHair(g, o) {
  if (o.style === 'orc') { // 👹 Ирокез: тёмная полоса от лба к затылку
    P(g, 11, 0, 2, 8, o.hair);   // полоса по макушке
    P(g, 11, 8, 2, 1, o.hair);   // спускается на лоб
    P(g, 27, 8, 2, 4, o.hair);   // и на затылок
    P(g, 24, 8, 8, 3, shade(o.skin, 0.85)); // заросший затылок
    return;
  }
  if (o.style === 'goblin') { // 😈 лысый, только тёмные пятнышки на затылке
    P(g, 24, 8, 8, 3, shade(o.skin, 0.9));
    P(g, 26, 9, 1, 1, o.hair); P(g, 29, 10, 1, 1, o.hair);
    return;
  }
  if (o.style === 'troll') { // 🧌 косматая шапка сбоку и на затылке
    P(g, 9, 0, 6, 3, o.hair);              // клок на макушке
    P(g, 8, 8, 3, 2, o.hair);              // чёлка набок
    P(g, 24, 8, 8, 5, o.hair);             // лохматый затылок
    P(g, 25, 12, 1, 2, shade(o.hair, 0.8)); P(g, 30, 11, 1, 2, shade(o.hair, 0.8));
    return;
  }
  const longHair = (o.style === 'bun' || o.style === 'long' || o.style === 'elf');
  // Макушка — вся в волосах (пара тёмных «завитков» для объёма)
  P(g, 8, 0, 8, 8, o.hair);
  P(g, 10, 2, 2, 2, shade(o.hair, 0.8)); P(g, 13, 4, 2, 2, shade(o.hair, 0.8));
  P(g, 9, 5, 1, 1, shade(o.hair, 1.25)); // блик
  // Чёлка спереди (два верхних ряда лица)
  P(g, 8, 8, 8, 2, o.hair);
  P(g, 8, 10, 1, 1, o.hair); P(g, 15, 10, 1, 1, o.hair); // прядки по бокам
  // Виски: левая и правая стороны
  P(g, 0, 8, 8, 3, o.hair); P(g, 16, 8, 8, 3, o.hair);
  // Затылок
  if (longHair) { // длинные волосы закрывают затылок и шею целиком
    P(g, 24, 8, 8, 8, o.hair);
    P(g, 25, 12, 1, 3, shade(o.hair, 0.85)); // прядь темнее
    P(g, 30, 12, 1, 3, shade(o.hair, 0.85));
    P(g, 0, 11, 8, 5, o.hair); P(g, 16, 11, 8, 5, o.hair); // и виски длинные
  } else if (o.style === 'wizard') {
    P(g, 24, 8, 8, 3, o.hair); // тонзура под шляпой
    P(g, 24, 13, 8, 3, o.hair); // снизу седые пряди на шее
    P(g, 0, 13, 8, 3, o.hair); P(g, 16, 13, 8, 3, o.hair);
  } else { // короткая стрижка
    P(g, 24, 8, 8, 4, o.hair);
  }
}

// ---------- ТЕЛО: РУБАШКА / МАНТИЯ / ПЛАТЬЕ ----------
function drawBody(g, o) {
  const F = [20, 20], B = [32, 20]; // перед и спина (8×12)
  const dress = (o.style === 'bun');          // Маша в платьице
  const robe = (o.style === 'wizard');        // Мерлин в мантии
  const apron = (o.style === 'merchant');     // Тихон в фартуке
  // Перед
  if (dress) {
    P(g, F[0], F[1] + 0, 8, 12, o.shirt);
    P(g, F[0] + 2, F[1] + 0, 4, 1, '#FFFFFF'); // белый воротничок
    P(g, F[0], F[1] + 8, 8, 4, shade(o.shirt, 1.15)); // пышная юбка
    P(g, F[0] + 1, F[1] + 11, 1, 1, '#FFFFFF'); // кайма-горошек
    P(g, F[0] + 3, F[1] + 11, 1, 1, '#FFFFFF');
    P(g, F[0] + 5, F[1] + 11, 1, 1, '#FFFFFF');
  } else if (robe) {
    P(g, F[0], F[1], 8, 12, o.shirt);
    // ⭐ золотые звёздочки на мантии
    P(g, F[0] + 1, F[1] + 3, 1, 1, '#FFD75E'); P(g, F[0] + 6, F[1] + 5, 1, 1, '#FFD75E');
    P(g, F[0] + 2, F[1] + 7, 1, 1, '#FFD75E'); P(g, F[0] + 5, F[1] + 2, 1, 1, '#FFD75E');
    P(g, F[0], F[1] + 8, 8, 1, '#FFD75E');     // золотой пояс
    P(g, F[0] + 3, F[1] + 8, 2, 1, '#FFF3C0'); // пряжка
  } else if (o.style === 'goblin') { // 😈 рваная жилетка с верёвочкой
    P(g, F[0], F[1], 8, 12, o.shirt);
    P(g, F[0] + 1, F[1] + 2, 2, 3, shade(o.shirt, 0.75)); // заплатка
    P(g, F[0] + 5, F[1] + 6, 2, 2, shade(o.shirt, 0.75)); // ещё одна
    P(g, F[0], F[1] + 5, 8, 1, '#8A6A3B'); // верёвочный поясок
  } else if (o.style === 'troll') { // 🧌 мохнатая шкура с костяными бусами
    P(g, F[0], F[1], 8, 12, o.shirt);
    P(g, F[0], F[1], 8, 2, shade(o.shirt, 1.2)); // меховой ворот
    P(g, F[0] + 2, F[1] + 2, 1, 1, '#FFF8E0'); P(g, F[0] + 3, F[1] + 3, 1, 1, '#FFF8E0');
    P(g, F[0] + 4, F[1] + 2, 1, 1, '#FFF8E0'); // бусы из зубов
    P(g, F[0] + 1, F[1] + 7, 3, 4, shade(o.shirt, 0.8)); // набедренная повязка
  } else if (o.style === 'orc') { // 👹 кожаная броня с ремнём
    P(g, F[0], F[1], 8, 12, o.shirt);
    P(g, F[0] + 2, F[1] + 0, 4, 2, '#2A1A10');       // воротник брони
    P(g, F[0], F[1] + 5, 8, 1, '#2A1A10');           // ремень
    P(g, F[0] + 3, F[1] + 5, 2, 1, '#C0A040');       // пряжка
    P(g, F[0] + 1, F[1] + 2, 1, 1, '#8A8078');       // заклёпки
    P(g, F[0] + 6, F[1] + 2, 1, 1, '#8A8078');
    P(g, F[0] + 2, F[1] + 8, 4, 4, shade(o.shirt, 0.8)); // наколенник-фартук
  } else if (apron) {
    P(g, F[0], F[1], 8, 12, o.shirt);
    P(g, F[0] + 2, F[1] + 3, 4, 7, '#C89B6A'); // фартук
    P(g, F[0] + 2, F[1] + 0, 1, 3, '#A87F4F'); // лямки
    P(g, F[0] + 5, F[1] + 0, 1, 3, '#A87F4F');
    P(g, F[0] + 3, F[1] + 5, 2, 2, shade('#C89B6A', 0.85)); // карман фартука
  } else {
    P(g, F[0], F[1], 8, 12, o.shirt);
    P(g, F[0] + 3, F[1] + 0, 2, 1, shade(o.shirt, 0.8)); // воротник
    P(g, F[0] + 5, F[1] + 5, 2, 2, shade(o.shirt, 0.85)); // кармашек
    P(g, F[0] + 3, F[1] + 9, 2, 1, '#FFD75E'); // пряжка ремня
    P(g, F[0], F[1] + 9, 8, 1, shade(o.pants, 0.8)); // ремень
  }
  if (o.style === 'elf') { // 🧝 листик на тунике
    P(g, F[0] + 3, F[1] + 4, 2, 1, '#A8E6A1');
    P(g, F[0] + 4, F[1] + 5, 1, 1, '#A8E6A1');
    P(g, F[0] + 2, F[1] + 5, 1, 1, '#A8E6A1');
  }
  // Спина (почти без деталей, только шов)
  P(g, B[0], B[1], 8, 12, o.shirt);
  P(g, B[0] + 3, B[1] + 1, 2, 1, shade(o.shirt, 0.85));
  // Бока, плечи и пояс
  P(g, 16, 20, 4, 12, o.shirt); P(g, 28, 20, 4, 12, o.shirt);
  P(g, 20, 16, 8, 4, shade(o.shirt, 0.95)); // плечи (верх)
  P(g, 28, 16, 8, 4, o.pants);              // низ тела
}

// ---------- РУКИ: рукав + ладошка ----------
function drawArm(g, o, X, Y) {
  const sleeve = (o.style === 'bun') ? 3 : 5; // у Маши рукавчик короткий
  P(g, X, Y, 4, 12, o.skin);                  // вся рука — кожа
  P(g, X, Y, 4, sleeve, o.shirt);             // рукав
  P(g, X, Y + sleeve - 1, 4, 1, shade(o.shirt, 0.8)); // манжет
  if (o.style === 'wizard') {                 // мантия до запястий + звезда
    P(g, X, Y, 4, 10, o.shirt);
    P(g, X + 1, Y + 3, 1, 1, '#FFD75E'); P(g, X + 2, Y + 6, 1, 1, '#FFD75E');
  }
}

// ---------- НОГИ: штаны + ботинки ----------
function drawLeg(g, o, X, Y) {
  if (o.style === 'bun') { // под платьем — колготки и башмачки
    P(g, X, Y, 4, 12, o.skin);
    P(g, X, Y + 9, 4, 1, '#FFFFFF');          // гольфы
    P(g, X, Y + 10, 4, 2, o.shoes);
  } else if (o.style === 'wizard') { // под мантией — тёмные сапожки
    P(g, X, Y, 4, 12, shade(o.shirt, 0.9));
    P(g, X, Y + 10, 4, 2, o.shoes);
  } else {
    P(g, X, Y, 4, 12, o.pants);
    P(g, X, Y + 10, 4, 2, o.shoes);           // ботинки
    P(g, X, Y + 11, 4, 1, shade(o.shoes, 0.7)); // подошва
  }
}

// ---------- ГЛАВНАЯ ФАБРИКА СКИНОВ ----------
// o = {skin, hair, eye, shirt, pants, shoes, style}
export function makeSkinTexture(o) {
  const canvas = document.createElement('canvas');
  canvas.width = TW; canvas.height = TH;
  const g = canvas.getContext('2d');
  // База: вся голова — кожа, руки — кожа (детали дорисуем сверху)
  for (const f of FACE_ORDER) {
    const [x, y, w, h] = RECTS.head[f]; P(g, x, y, w, h, o.skin);
  }
  drawHair(g, o);
  drawFace(g, o);
  drawBody(g, o);
  // Руки и ноги: рисуем каждую грань одинаково (рукав + ладошка и т.д.)
  for (const part of ['armR', 'armL'])
    for (const f of FACE_ORDER) {
      const [x, y] = RECTS[part][f];
      drawArm(g, o, x, y);
    }
  for (const part of ['legR', 'legL'])
    for (const f of FACE_ORDER) {
      const [x, y] = RECTS[part][f];
      drawLeg(g, o, x, y);
    }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter; // чёткие пиксели!
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

// ---------- 🧍 КЛАССИЧЕСКАЯ ФИГУРКА MINECRAFT ----------
// Пропорции — как у настоящего Стива из Minecraft: голова 8×8×8,
// тело 8×12×4, руки и ноги 4×12×4 пикселя. Рост — ровно 2 блока!
// Руки крутятся в плечах, ноги — в бёдрах (суставы наверху).
export function classicFigure(tex) {
  const g = new THREE.Group();
  const legL = skinnedPart(0.25, 0.75, 0.25, tex, 'legL', -0.125, 0.75, 0, -0.375);
  const legR = skinnedPart(0.25, 0.75, 0.25, tex, 'legR',  0.125, 0.75, 0, -0.375);
  const body = skinnedPart(0.5, 0.75, 0.25, tex, 'body', 0, 1.125, 0);
  const armL = skinnedPart(0.25, 0.75, 0.25, tex, 'armL', -0.375, 1.5, 0, -0.375);
  const armR = skinnedPart(0.25, 0.75, 0.25, tex, 'armR',  0.375, 1.5, 0, -0.375);
  const head = skinnedPart(0.5, 0.5, 0.5, tex, 'head', 0, 1.75, 0);
  g.add(legL, legR, body, armL, armR, head);
  return { group: g, armL, armR, legL, legR, head, body };
}

// ---------- 🐉 ЧЕШУЯ ДРАКОНА И 🦄 ПЯТНЫШКИ ЕДИНОРОГА ----------
// Маленькие узоры 16×16: натягиваются на тело целиком, без развёртки.
export function makePatternTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d');
  if (kind === 'wing') {
    P(g, 0, 0, 16, 16, '#5B3B8B'); // перепонка крыла
    for (let i = 0; i < 4; i++) P(g, i * 4 + 3, 0, 1, 16, '#3B2B55'); // тёмные жилки-рёбра
    P(g, 0, 0, 16, 2, '#6B4B9B'); // верхняя кромка светлее
  } else if (kind === 'dragon') {
    P(g, 0, 0, 16, 16, '#2B2B3B'); // тёмная основа
    // чешуйки полукругом: тёмно-фиолетовые точки ровными рядами
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const ox = (y % 2) * 2; // шахматный порядок, как настоящая чешуя
        P(g, x * 4 + ox, y * 4, 3, 2, '#3B2B55');
        P(g, x * 4 + ox, y * 4, 3, 1, '#4B2B6B'); // блик чешуйки
      }
  } else { // unicorn — белоснежный с розовыми пятнышками-звёздочками
    P(g, 0, 0, 16, 16, '#F8F4FF');
    P(g, 3, 3, 2, 2, '#FFD6EE'); P(g, 10, 7, 2, 2, '#FFD6EE');
    P(g, 5, 11, 2, 2, '#FFD6EE'); P(g, 12, 13, 1, 1, '#FFD6EE');
    P(g, 4, 4, 1, 1, '#FFB8E0'); P(g, 11, 8, 1, 1, '#FFB8E0');
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}
