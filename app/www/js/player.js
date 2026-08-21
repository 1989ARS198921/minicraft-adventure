// ============================================================
//  🏃 ИГРОК: ходьба, прыжки, гравитация и полёт
//  + поддержка блоков небесных городов!
// ============================================================
import { checkCityCollisions, getCityBlockAt, getCityGroundHeight } from './cities.js';
import { CONFIG } from './config.js';
import { emit } from './bus.js';
import { sfx } from './audio.js';
import { showToast } from './ui.js';
import { groundHeight, blockAt, solidAt } from './world.js';
import { spawnParticles } from './particles.js';

// Создать игрока на старте мира
export function createPlayer() {
  return {
    x: 1.5, z: -5.5,     // стартуем у фонтана живой воды ⛲
    feet: 5,             // высота ног (уточним после генерации мира)
    vy: 0,               // вертикальная скорость (прыжки и падения)
    onGround: false,
    fly: false,          // режим полёта
    yaw: 0, pitch: 0,    // поворот головы: влево-вправо и вверх-вниз
    sprint: false,        // бег
    crouch: false,        // присед
    autoJump: true        // авто-прыжок как в Bedrock
  };
}

// Включить/выключить полёт (двойной прыжок)
export function toggleFly(G) {
  G.player.fly = !G.player.fly;
  G.player.vy = 0;
  document.body.classList.toggle('flying', G.player.fly);
  showToast(G.player.fly ? '✈️ Полёт включён!' : '🚶 Полёт выключен');
  sfx.fly();
  if (G.player.fly) emit('fly');
  emit('dirty');
}

// ---- ПРОВЕРКА: ЕСТЬ ЛИ БЛОК В КЛЕТКЕ (ЗЕМЛЯ ИЛИ ГОРОД) ----
function isBlockAt(x, y, z) {
  // Проверяем блоки мира
  const worldBlock = blockAt(x, y, z);
  if (worldBlock) return true;
  
  // Проверяем блоки городов
  const cityBlock = getCityBlockAt(x, y, z);
  if (cityBlock) return true;
  
  return false;
}

// ---- ПРОВЕРКА: ТВЁРДЫЙ ЛИ БЛОК (ДЛЯ СТОЛКНОВЕНИЙ) ----
function isSolidAt(x, y, z) {
  // Проверяем блоки мира
  if (solidAt(x, y, z)) return true;
  
  // Проверяем блоки городов
  const cityBlock = getCityBlockAt(x, y, z);
  if (cityBlock && cityBlock.userData && cityBlock.userData.isSolid) {
    return true;
  }
  
  return false;
}

// ---- ВЫСОТА ЗЕМЛИ (с учётом городов) ----
function getGroundHeight(x, z, maxY = 40) {
  // Сначала проверяем блоки мира
  const worldGround = groundHeight(Math.floor(x), Math.floor(z), maxY);
  if (worldGround > -40) return worldGround;
  
  // Затем проверяем блоки городов сверху вниз
  for (let y = Math.floor(maxY); y >= -40; y--) {
    if (isBlockAt(Math.floor(x), y, Math.floor(z))) {
      return y + 1;
    }
  }
  
  return -40;
}

// Один кадр физики: движение + гравитация/полёт
let wasInWater = false; // чтобы «плюх» звучал один раз при входе в воду
export function stepPlayer(G, dt) {
  const p = G.player, keys = G.keys, joy = G.joy;

  // --- Ввод: клавиатура ИЛИ джойстик ---
  let ix = 0, iz = 0; // iz — вперёд/назад, ix — влево/вправо
  if (keys['KeyW']) iz += 1;
  if (keys['KeyS']) iz -= 1;
  if (keys['KeyD']) ix += 1;
  if (keys['KeyA']) ix -= 1;
  ix += joy.x; iz += joy.y;
  const ilen = Math.hypot(ix, iz);
  if (ilen > 1) { ix /= ilen; iz /= ilen; } // по диагонали не быстрее

  // --- Ходьба туда, куда повёрнута голова (в полёте — быстрее!) ---
  const sprintMul = (!p.fly && p.sprint && !p.crouch) ? 1.65 : 1;
  const crouchMul = (!p.fly && p.crouch) ? 0.48 : 1;
  const speed = p.fly ? CONFIG.FLY_SPEED : CONFIG.SPEED * (G.fx.speed > 0 ? 1.6 : 1) * sprintMul * crouchMul;
  const mx = (-Math.sin(p.yaw) * iz + Math.cos(p.yaw) * ix) * speed * dt;
  const mz = (-Math.cos(p.yaw) * iz - Math.sin(p.yaw) * ix) * speed * dt;

  // ---- СТОЛКНОВЕНИЯ С БЛОКАМИ (ВКЛЮЧАЯ ГОРОДА) ----
  const STEP = 1.2;
  
  // Проверяем, можно ли встать в клетке
  const canStand = (nx, nz) => {
    // Проверяем, есть ли блок под ногами
    const g = getGroundHeight(nx, nz, p.feet + STEP);
    const hasFloor = g <= p.feet + STEP;
    
    // Проверяем, есть ли место для головы
    // (isSolidAt: вода, цветы и двери — НЕ твёрдые, сквозь них можно!)
    const headY = Math.floor(g + 1.5);
    const bodyY = Math.floor(g + 0.5);
    const headBlock = isSolidAt(Math.floor(nx), headY, Math.floor(nz));
    const bodyBlock = isSolidAt(Math.floor(nx), bodyY, Math.floor(nz));
    
    return hasFloor && !bodyBlock && !headBlock;
  };

  // Авто-прыжок
  const movingForward = iz > 0.35 && ilen > 0.2;
  if (!p.fly && p.autoJump && p.onGround && movingForward) {
    const dirX = -Math.sin(p.yaw), dirZ = -Math.cos(p.yaw);
    const aheadX = Math.floor(p.x + dirX * 0.75), aheadZ = Math.floor(p.z + dirZ * 0.75);
    const hereG = getGroundHeight(p.x, p.z, p.feet + 3);
    const aheadG = getGroundHeight(aheadX, aheadZ, p.feet + 3);
    if (aheadG - hereG > 1.05 && aheadG - hereG <= 2.2) {
      p.vy = CONFIG.JUMP * 0.92;
      p.onGround = false;
      emit('jump');
      sfx.jump();
    }
  }

  // Пробуем идти по диагонали, а если стена — скользим вдоль неё
  if (canStand(p.x + mx, p.z + mz)) { p.x += mx; p.z += mz; }
  else if (canStand(p.x + mx, p.z)) p.x += mx;
  else if (canStand(p.x, p.z + mz)) p.z += mz;

  // ---- ВЫСОТА ЗЕМЛИ (с учётом городов) ----
  const ground = getGroundHeight(p.x, p.z, p.feet + STEP);

  // ---- ПРОВЕРКА ВОДЫ ----
  const bx = Math.floor(p.x), bz = Math.floor(p.z);
  const inWater = blockAt(bx, Math.floor(p.feet), bz) === 'water'
               || blockAt(bx, Math.floor(p.feet + 0.5), bz) === 'water';
  
  if (inWater && !wasInWater && p.vy < -1) {
    spawnParticles(bx, Math.floor(p.feet) + 1, bz, 'water');
  }
  wasInWater = inWater;
  if (inWater && !p.fly) emit('swim');
  if (p.feet <= -1 && !p.fly) emit('cave');

  // ---- ФИЗИКА ----
  if (p.fly) {
    // --- ПОЛЁТ ---
    let up = 0;
    if (keys['Space']) up += 1;
    if (keys['ShiftLeft'] || keys['ShiftRight']) up -= 1;
    p.feet += up * CONFIG.FLY_SPEED * dt;
    
    if (up > 0 && isSolidAt(Math.floor(p.x), Math.floor(p.feet + 1.75), Math.floor(p.z))) {
      p.feet = Math.floor(p.feet + 1.75) - 1.75;
    }
    p.vy = 0;
    p.onGround = false;
    if (p.feet < ground) p.feet = ground;
  } else if (inWater) {
    // --- ПЛАВАНИЕ ---
    p.vy -= CONFIG.GRAVITY * 0.15 * dt;
    if (p.vy < -2) p.vy = -2;
    if (keys['Space']) p.vy = 3.5;
    p.feet += p.vy * dt;
    if (p.feet <= ground) {
      p.feet = ground;
      p.vy = 0;
      p.onGround = true;
    } else p.onGround = false;
  } else {
    // --- ГРАВИТАЦИЯ ---
    p.vy -= CONFIG.GRAVITY * dt;
    p.feet += p.vy * dt;
    
    // Проверка потолка (только ТВЁРДЫЕ блоки — сквозь воду пролетаем!)
    if (p.vy > 0 && isSolidAt(Math.floor(p.x), Math.floor(p.feet + 1.75), Math.floor(p.z))) {
      p.feet = Math.floor(p.feet + 1.75) - 1.75;
      p.vy = 0;
    }
    
    // Проверка земли
    if (p.feet <= ground) {
      if (!p.onGround) emit('landed', p.vy);
      p.feet = ground;
      p.vy = 0;
      p.onGround = true;
    } else p.onGround = false;

    // Прыжок
    if (keys['Space'] && p.onGround) {
      p.vy = CONFIG.JUMP * (G.fx.jump > 0 ? 1.35 : 1);
      p.onGround = false;
      emit('jump');
      sfx.jump();
    }
  }

  // Страховка: если провалились под мир — телепортируем на ближайший безопасный блок
  if (p.feet < -40) {
    const safeX = Math.max(-CONFIG.WORLD_LIMIT, Math.min(CONFIG.WORLD_LIMIT, p.x));
    const safeZ = Math.max(-CONFIG.WORLD_LIMIT, Math.min(CONFIG.WORLD_LIMIT, p.z));
    const safeGround = getGroundHeight(safeX, safeZ);
    if (safeGround > 0) {
      p.x = safeX;
      p.z = safeZ;
      p.feet = safeGround + 0.5;
      p.vy = 0;
    } else {
      // Если нигде нет земли — возвращаем на старт
      p.x = 0.5; p.z = 0.5;
      p.feet = getGroundHeight(0, 0) + 0.5;
      p.vy = 0;
    }
  }
}

// ============================================================
//  👁️ АДАПТАЦИЯ ИНТЕРФЕЙСА: кнопки и панели не загораживают вид
//  (стили внедряются из этого модуля — index.html не трогаем)
// ============================================================
(function adaptTouchUI() {
  const css = `
/* Сенсорные кнопки полупрозрачные в покое, яркие при нажатии */
body.touch .btn { opacity: .48; }
body.touch .btn:active { opacity: 1; }
body.touch #joyBase { opacity: .5; }
/* Левая колонка кнопок компактнее */
#btnCam  { bottom: 290px !important; }
#btnPack { bottom: 356px !important; }
#btnFire { bottom: 422px !important; }

/* На сенсорных экранах скрываем ДУБЛИРУЮЩИЕ панели V50 —
   те же действия уже есть на кнопках игры */
body.touch #v50touch, body.touch #v50hot, body.touch #v50hud,
body.touch #v50map { display: none !important; }

/* Панель «Приключение» — сверху по центру, мелкая, полупрозрачная */
#adv-v2 { right: auto !important; left: 50% !important; top: 6px !important;
  transform: translateX(-50%) scale(.75); transform-origin: top center;
  opacity: .7; z-index: 12 !important; }
#adv-v2:hover { opacity: 1; }

/* Квест V50 — под значками справа, не на миникарте */
#v50quest { min-width: 0 !important; max-width: 148px !important;
  font-size: 11px !important; padding: 6px !important;
  top: 292px !important; right: 8px !important;
  background: #101410b8 !important; }
#v50map { min-width: 0 !important; max-width: 148px !important;
  font-size: 10px !important; padding: 6px !important;
  top: 384px !important; background: #101410b8 !important; }
#v50hud .box { min-width: 150px !important; padding: 6px !important;
  font-size: 11px !important; }
#v50hud button { padding: 4px 6px !important; }

/* Кнопки 📋 HUD / 📜 Квест — мелкие, над панелью заданий */
#toggleHud, #toggleQuest { padding: 4px 8px !important; font-size: 11px !important; opacity: .7; }
body.touch #toggleHud { top: 8px !important; left: 8px !important; }
body.touch #toggleQuest { top: 8px !important; left: 92px !important; right: auto !important; }

/* Панель заданий на телефоне — ниже кнопок, мельче */
body.touch #quests { top: 42px !important; left: 8px !important;
  max-width: 200px !important; font-size: 11px !important; }

/* Сердечки и мана — по центру над хотбаром (как в Bedrock),
   чтобы не перекрывать джойстик */
body.touch #hearts { left: 50% !important; bottom: 56px !important;
  transform: translateX(-50%); }
body.touch #mana { left: 50% !important; bottom: 82px !important;
  transform: translateX(-50%); }
body.touch #fxBadge { left: 50% !important; bottom: 106px !important;
  transform: translateX(-50%); }

/* Заклинания повыше, чтобы не путаться с кнопками справа */
body.touch #spells { bottom: 345px !important; }

/* На узких экранах — ещё компактнее */
@media (max-width: 560px) {
  #v50quest { max-width: 120px !important; }
  #adv-v2 { transform: translateX(-50%) scale(.65); }
  body.touch .btn { opacity: .4; }
}
/* В альбомной ориентации телефона места совсем мало —
   прячем доп.панель квеста V50 (основная панель 📋 остаётся) */
@media (orientation: landscape) and (max-height: 520px) {
  body.touch #v50quest { display: none !important; }
}`;
  const style = document.createElement('style');
  style.id = 'touch-ui-adapt';
  style.textContent = css;
  document.head.appendChild(style);

  // На телефоне список заданий стартует свёрнутым — не закрывает обзор
  const collapseQuests = () => {
    const q = document.getElementById('quests');
    if (q && document.body.classList.contains('touch')) q.classList.add('collapsed');
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', collapseQuests);
  } else {
    collapseQuests();
  }
  // Страховка: класс .touch добавляется отдельным скриптом и может
  // появиться с задержкой — повторяем попытку
  setTimeout(collapseQuests, 1500);
})();
