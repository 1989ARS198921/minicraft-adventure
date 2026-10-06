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

// Короткий «бип»: частота плавно скользит от f1 к f2
function tone(f1, f2, dur, type = 'square', vol = 0.12) {
  if (!soundOn) return; // 🔕 звуки выключены тумблером
  const ac = audio(); if (!ac) return;
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
function noiseBurst(dur = 0.15, vol = 0.2) {
  if (!soundOn) return; // 🔕 звуки выключены тумблером
  const ac = audio(); if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); // затихающий шум
  const s = ac.createBufferSource(); s.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(ac.destination);
  s.start();
}

// Вибрация на телефоне (если поддерживается)
function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

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
    document.addEventListener(ev, () => { if (audio()) startMusic(); }, { once: true }));
}

// ============================================================
//  🎼 ПАК 5: ФОНОВАЯ МУЗЫКА + РАЗДЕЛЬНЫЕ ТУМБЛЕРЫ
//  Мелодия в духе «Меча и Магии VI/VII»: медленные аккорды-пэды
//  и неспешные «колокольные» ноты поверх. Всё синтезируется
//  осцилляторами — ни одного аудиофайла!
// ============================================================

// Тумблеры (выбор запоминается между запусками)
let soundOn = localStorage.getItem('mc_sound') !== '0';
let musicOn = localStorage.getItem('mc_music') !== '0';
export function isSoundOn() { return soundOn; }
export function isMusicOn() { return musicOn; }
export function toggleSound() {
  soundOn = !soundOn;
  localStorage.setItem('mc_sound', soundOn ? '1' : '0');
  return soundOn;
}
export function toggleMusic() {
  musicOn = !musicOn;
  localStorage.setItem('mc_music', musicOn ? '1' : '0');
  if (musicOn) startMusic(); else stopMusic();
  return musicOn;
}

// Саундтрек: аккорды Am – F – C – G, как таверна из M&M VI
const CHORDS = [
  [220.0, 261.63, 329.63],  // Am
  [174.61, 220.0, 261.63],  // F
  [196.0, 261.63, 329.63],  // C
  [196.0, 246.94, 293.66]   // G
];
// Колокольная мелодия (ля-минорная пентатоника)
const MELODY = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 329.63];
const CHORD_LEN = 4; // секунд на аккорд
let musicTimer = null, chordNo = 0;

// Мягкий пэд: медленно нарастает и тает
function pad(freq, t, dur, vol) {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.4);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
// Колокольчик: звенит и затухает
function bell(freq, t, vol) {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + 1.9);
}

function scheduleBar() {
  const ac = audio(); if (!ac || !musicOn) return;
  const t = ac.currentTime + 0.1;
  const chord = CHORDS[chordNo % CHORDS.length];
  for (const f of chord) { pad(f, t, CHORD_LEN, 0.045); pad(f / 2, t, CHORD_LEN, 0.03); }
  bell(MELODY[(chordNo * 2) % MELODY.length], t + 0.3, 0.05);
  bell(MELODY[(chordNo * 2 + 1) % MELODY.length], t + CHORD_LEN / 2, 0.045);
  chordNo++;
}

export function startMusic() {
  if (musicTimer || !musicOn) return;
  const ac = audio(); if (!ac) return;
  scheduleBar();
  musicTimer = setInterval(scheduleBar, CHORD_LEN * 1000);
}
export function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}