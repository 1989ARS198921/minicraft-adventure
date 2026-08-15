// ============================================================
// 🎮 УПРАВЛЕНИЕ: клавиатура + мышь на ПК, Bedrock-style touch на телефоне
// ============================================================
import { doBreak, doPlace } from './actions.js';
import { toggleFly } from './player.js';
import { toggleCamera } from './playermodel.js';
import { selectSlot, showToast, toggleBackpack } from './ui.js';
import { tryMakeFire } from './campfire.js';

let G = null;
const overlay = () => document.getElementById('overlay');

export function initInput(gameContext) {
  G = gameContext;
  initKeyboard();
  initMouse();
  if (G.IS_TOUCH) initTouch();
}

function initKeyboard() {
  let lastSpaceTime = 0;
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        const now = performance.now();
        if (now - lastSpaceTime < 280) toggleFly(G);
        lastSpaceTime = now;
      }
    }
    if (e.code === 'F5') { e.preventDefault(); showToast(toggleCamera(G) ? '🎥 Вид из-за спины' : '👁️ Вид от первого лица'); }
    if (e.code === 'KeyE') toggleBackpack();
    if (e.code === 'KeyF') tryMakeFire();
    G.keys[e.code] = true;
    if (e.code.startsWith('Digit')) {
      const n = +e.code.slice(5);
      selectSlot(n === 0 ? 9 : n - 1);
    }
  });
  document.addEventListener('keyup', e => G.keys[e.code] = false);
}

function initMouse() {
  overlay().addEventListener('click', () => {
    if (G.IS_TOUCH) overlay().style.display = 'none'; else document.body.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    if (!G.IS_TOUCH) overlay().style.display = document.pointerLockElement ? 'none' : 'flex';
  });
  document.addEventListener('mousemove', e => {
    if (!document.pointerLockElement) return;
    G.player.yaw -= e.movementX * 0.0025;
    G.player.pitch -= e.movementY * 0.0025;
    G.player.pitch = Math.max(-1.5, Math.min(1.5, G.player.pitch));
  });
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('mousedown', e => {
    if (!document.pointerLockElement) return;
    if (e.button === 0) doBreak(); else if (e.button === 2) doPlace();
  });
  document.getElementById('btnNewWorld').addEventListener('click', e => {
    e.stopPropagation();
    if (confirm('Точно стереть мир и построить новый? Все постройки пропадут!')) { localStorage.clear(); location.reload(); }
  });
}

function initTouch() {
  const joyBase = document.getElementById('joyBase');
  const joyStick = document.getElementById('joyStick');
  const lookZone = document.getElementById('touchLookZone');
  const sprintBtn = document.getElementById('btnSprint');
  const crouchBtn = document.getElementById('btnCrouch');
  const autoJumpBtn = document.getElementById('btnAutoJump');
  const btnMode = document.getElementById('btnMode');
  const hotbar = document.getElementById('hotbar');
  let joyTouchId = null, lookTouchId = null;
  let joyCenter = null, lastLX = 0, lastLY = 0;
  let lookStartT = 0, lookStartX = 0, lookStartY = 0;
  let lookMoved = false;
  let tapMode = 'break';
  let holdTimer = null, breakLoop = null;
  let sprintOn = false, crouchOn = false;
  let autoJumpOn = true;
  let hotbarTouchId = null, hotbarStartX = 0, hotbarLastX = 0;

  function onUI(el) {
    return el.closest && el.closest('.btn, #hotbar, #quests, #overlay, #backpack, #dlg, #shop, #hearts, #minimap, #timeBadge, #lvlBadge, #flyBadge');
  }
  function setTouchAction() { document.body.style.touchAction = 'none'; }
  setTouchAction();

  // Левый джойстик: фиксированный, как в Bedrock. Перетаскивание не меняет его позицию.
  function moveJoy(t) {
    if (!joyCenter) return;
    let dx = t.clientX - joyCenter.x, dy = t.clientY - joyCenter.y;
    const max = 52, len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    G.joy.x = dx / max; G.joy.y = -dy / max;
  }
  function resetJoy() {
    joyTouchId = null; joyCenter = null; G.joy.x = G.joy.y = 0;
    joyStick.style.transform = 'translate(-50%, -50%)';
  }

  function startBreakHold() {
    doBreak();
    clearInterval(breakLoop);
    breakLoop = setInterval(() => doBreak(), 145);
  }
  function stopBreakHold() { clearInterval(breakLoop); breakLoop = null; }

  document.addEventListener('touchstart', e => {
    let handled = false;
    for (const t of e.changedTouches) {
      if (t.target.closest && (onUI(t.target) || t.target.closest('#btnBreak'))) continue;
      // Хотбар — свайп по слотам, а не обзор
      if (hotbar && hotbar.contains(t.target)) {
        hotbarTouchId = t.identifier; hotbarStartX = hotbarLastX = t.clientX; handled = true; continue;
      }
      // Левая нижняя зона — джойстик
      if (joyTouchId === null && t.clientX < innerWidth * 0.48 && t.clientY > innerHeight * 0.42) {
        joyTouchId = t.identifier;
        joyCenter = { x: innerWidth * 0.16, y: innerHeight * 0.78 };
        moveJoy(t); handled = true; continue;
      }
      // Правая половина — отдельная зона обзора
      if (lookTouchId === null && lookZone && lookZone.contains(t.target) || (lookTouchId === null && t.clientX >= innerWidth * 0.48)) {
        lookTouchId = t.identifier;
        lastLX = lookStartX = t.clientX; lastLY = lookStartY = t.clientY;
        lookStartT = performance.now(); lookMoved = false;
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => {
          if (lookTouchId === t.identifier && !lookMoved && overlay().style.display === 'none') startBreakHold();
        }, 500);
        handled = true;
      }
    }
    if (handled) e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    let handled = false;
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) { moveJoy(t); handled = true; }
      else if (t.identifier === lookTouchId) {
        const dx = t.clientX - lastLX, dy = t.clientY - lastLY;
        if (Math.hypot(t.clientX-lookStartX, t.clientY-lookStartY) > 10) { lookMoved = true; clearTimeout(holdTimer); stopBreakHold(); }
        G.player.yaw -= dx * 0.0052;
        G.player.pitch -= dy * 0.0052;
        G.player.pitch = Math.max(-1.5, Math.min(1.5, G.player.pitch));
        lastLX = t.clientX; lastLY = t.clientY; handled = true;
      }
      else if (t.identifier === hotbarTouchId) {
        hotbarLastX = t.clientX; handled = true;
      }
    }
    if (handled) e.preventDefault();
  }, { passive: false });

  function endTouch(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) resetJoy();
      if (t.identifier === lookTouchId) {
        clearTimeout(holdTimer); stopBreakHold();
        const dt = performance.now() - lookStartT;
        const moved = Math.hypot(t.clientX-lookStartX, t.clientY-lookStartY);
        if (dt < 260 && moved < 12 && overlay().style.display === 'none') {
          if (tapMode === 'break') doBreak(); else doPlace();
        }
        lookTouchId = null;
      }
      if (t.identifier === hotbarTouchId) {
        const dx = t.clientX - hotbarStartX;
        if (Math.abs(dx) > 24) {
          const dir = dx > 0 ? -1 : 1;
          const next = (G.slot + dir + 10) % 10;
          selectSlot(next);
        }
        hotbarTouchId = null;
      }
    }
  }
  document.addEventListener('touchend', endTouch);
  document.addEventListener('touchcancel', endTouch);

  // Режим тап/удержание
  function renderMode() {
    btnMode.innerHTML = (tapMode === 'break' ? '⛏️' : '🧱') + `<small>тап: ${tapMode === 'break' ? 'ломать' : 'ставить'}</small>`;
  }
  btnMode.addEventListener('touchstart', e => {
    tapMode = tapMode === 'break' ? 'place' : 'break'; renderMode();
    showToast(tapMode === 'break' ? '⛏️ Тап ломает' : '🧱 Тап ставит');
    e.preventDefault(); e.stopPropagation();
  }, { passive: false });

  function bindBtn(id, onDown, onUp) {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener('touchstart', e => { onDown(); e.preventDefault(); e.stopPropagation(); }, { passive:false });
    if (onUp) {
      ['touchend','touchcancel'].forEach(ev => el.addEventListener(ev, e => { onUp(); e.preventDefault(); e.stopPropagation(); }, {passive:false}));
    }
  }
  bindBtn('btnBreak', startBreakHold, stopBreakHold);
  bindBtn('btnPlace', doPlace);
  bindBtn('btnCam', () => showToast(toggleCamera(G) ? '🎥 Вид из-за спины' : '👁️ Вид от первого лица'));
  bindBtn('btnPack', () => toggleBackpack());
  bindBtn('btnFire', () => tryMakeFire());
  bindBtn('btnJump', () => { G.keys['Space'] = true; }, () => { G.keys['Space'] = false; });
  bindBtn('btnDown', () => { G.keys['ShiftLeft'] = true; }, () => { G.keys['ShiftLeft'] = false; });

  bindBtn('btnSprint', () => { sprintOn = true; G.player.sprint = true; sprintBtn.classList.add('active'); }, () => { sprintOn = false; G.player.sprint = false; sprintBtn.classList.remove('active'); });
  bindBtn('btnCrouch', () => { crouchOn = true; G.player.crouch = true; crouchBtn.classList.add('active'); }, () => { crouchOn = false; G.player.crouch = false; crouchBtn.classList.remove('active'); });
  bindBtn('btnAutoJump', () => { autoJumpOn = !autoJumpOn; G.player.autoJump = autoJumpOn; autoJumpBtn.classList.toggle('active', autoJumpOn); showToast(autoJumpOn ? '🦘 Авто-прыжок включён' : '🧍 Авто-прыжок выключен'); });

  // Кнопка прыжка: быстрый двойной тап включает полёт.
  let lastJumpTap = 0;
  const jump = () => {
    const now = performance.now();
    if (now - lastJumpTap < 280) toggleFly(G);
    lastJumpTap = now;
    G.keys['Space'] = true;
  };
  const oldJump = document.getElementById('btnJump');
  oldJump.replaceWith(oldJump.cloneNode(true));
  bindBtn('btnJump', jump, () => G.keys['Space'] = false);

  // Прямое нажатие слотов
  document.querySelectorAll('#hotbar .slot').forEach((el, i) => {
    el.addEventListener('touchstart', e => { selectSlot(i); e.preventDefault(); e.stopPropagation(); }, {passive:false});
  });
}
