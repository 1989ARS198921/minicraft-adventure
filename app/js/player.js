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
  if (worldGround > -10) return worldGround;
  
  // Затем проверяем блоки городов сверху вниз
  for (let y = Math.floor(maxY); y >= -10; y--) {
    if (isBlockAt(Math.floor(x), y, Math.floor(z))) {
      return y + 1;
    }
  }
  
  return -10;
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
    const headY = Math.floor(g + 1.5);
    const bodyY = Math.floor(g + 0.5);
    const headBlock = isBlockAt(Math.floor(nx), headY, Math.floor(nz));
    const bodyBlock = isBlockAt(Math.floor(nx), bodyY, Math.floor(nz));
    
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
    
    if (up > 0 && isBlockAt(Math.floor(p.x), Math.floor(p.feet + 1.75), Math.floor(p.z))) {
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
    
    // Проверка потолка
    if (p.vy > 0 && isBlockAt(Math.floor(p.x), Math.floor(p.feet + 1.75), Math.floor(p.z))) {
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
  if (p.feet < -10) {
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