// ============================================================
//  🔊 ЗВУКИ — синтезируем прямо в браузере, без файлов!
//  Web Audio API умеет «пищать» осциллятором и шуметь —
//  из этих кирпичиков собираем все звуки игры.
// ============================================================

let AC = null; // аудио-контекст (создаётся по первому жесту пользователя)

function audio() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

// ⚡ Не чаще 20 звуков в секунду: в свалке боя удары и писки
// накладываются десятками — и уху не разобрать, и телефону лишняя работа
let lastSfx = 0;
function sfxGate(ms = 50) {
  const now = performance.now();
  if (now - lastSfx < ms) return false;
  lastSfx = now;
  return true;
}

// Короткий «бип»: частота плавно скользит от f1 к f2
function tone(f1, f2, dur, type = 'square', vol = 0.12) {
  const ac = audio(); if (!ac || !sfxGate()) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur);
}

// Шумовой «хруст» — для ломания блоков
// ⚡ Один общий шумовой буфер на все звуки: в бою удары сыплются
// десятками, и выделять память под новый буфер каждый раз — расточительно!
let noiseBuf = null;
function noiseBurst(dur = 0.15, vol = 0.2) {
  const ac = audio(); if (!ac || !sfxGate()) return;
  if (!noiseBuf) {
    const len = Math.floor(ac.sampleRate * 0.6); // самый длинный хруст
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); // затихающий шум
  }
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(ac.destination);
  s.start();
  s.stop(ac.currentTime + dur); // буфер общий и длинный — обрезаем под нужную длину
}

// Вибрация на телефоне (если поддерживается)
// ⚡ Не чаще раза в 300 мс — при быстрой ломке блоков моторчик
// и без того жужжит не переставая
let lastBuzz = 0;
function buzz(ms) {
  if (!navigator.vibrate) return;
  const now = performance.now();
  if (now - lastBuzz < 300) return;
  lastBuzz = now;
  navigator.vibrate(ms);
}

// 🎵 Все звуки игры — одним списком
export const sfx = {
  place: () => tone(180, 90, 0.09, 'square', 0.12),   // стук установки блока
  brk:   () => { noiseBurst(0.15, 0.22); buzz(40); }, // хруст разрушения + вибрация
  quest: () => { tone(660, 660, 0.09, 'sine', 0.12);
                 setTimeout(() => tone(880, 880, 0.14, 'sine', 0.12), 110); }, // «дзинь!»
  fly:   () => tone(300, 700, 0.25, 'sine', 0.1),     // свист взлёта
  jump:  () => tone(280, 420, 0.07, 'sine', 0.05),    // пружинка прыжка
  torch: () => tone(500, 320, 0.08, 'triangle', 0.1), // чирк факела
  no:    () => tone(150, 100, 0.12, 'sawtooth', 0.08), // «нельзя!»
  // 🐾 Голоса зверей!
  hoot:   () => { tone(340, 300, 0.15, 'sine', 0.1);           // 🦉 сова: «у-ху!»
                  setTimeout(() => tone(320, 270, 0.22, 'sine', 0.1), 200); },
  roar:   () => { tone(95, 45, 0.6, 'sawtooth', 0.13);         // 🐉 рык дракона
                  noiseBurst(0.5, 0.1); },
  boing:  () => tone(150, 620, 0.18, 'sine', 0.11),            // 👾 пружинка слизня
  squeak: () => tone(900, 1400, 0.08, 'sine', 0.07),           // 🐰 писк зверька
  shoot:  () => { noiseBurst(0.1, 0.15); tone(700, 200, 0.12, 'triangle', 0.1); }, // 🏹 свист стрелы
  boom:   () => { noiseBurst(0.3, 0.25); tone(120, 40, 0.3, 'sawtooth', 0.15); }, // 🔥 взрыв огненного шара
  chime:  () => tone(660, 990, 0.25, 'sine', 0.1) // 💚 волшебный перезвон лечения
};

// Браузер разрешает звук только после жеста пользователя —
// поэтому подслушиваем первый клик/тап/клавишу
export function initAudio() {
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
    document.addEventListener(ev, () => audio(), { once: true }));
}
