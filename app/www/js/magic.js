// ============================================================
//  🔮 МАГИЯ И МАНА — настоящие заклинания, как в «Мече и Магии»!
//  Свитки покупаем у Мерлина, и заклинание появляется кнопкой
//  рядом с сердечками. Заклинания тратят ману 💧 — она сама
//  восстанавливается, а у фонтана живой воды — втрое быстрее!
//  📖 Мудрость Мерлина даёт +4 маны и усиливает огненный шар.
// ============================================================

import * as THREE from 'three';
import { on, emit } from './bus.js';
import { skillRank } from './skills.js';
import { heal } from './health.js';
import { spawnParticles } from './particles.js';
import { sfx } from './audio.js';
import { showToast } from './ui.js';
import { getMobs, attackMob } from './mobs.js';
import { solidAt } from './world.js';
import { FOUNTAIN } from './village.js';

// Наши заклинания: свиток из лавки Мерлина -> кнопка на экране
export const SPELLS = {
  fire: { give: 'spellFire', icon: '🔥', name: 'Огненный шар', mana: 3 },
  heal: { give: 'spellHeal', icon: '💚', name: 'Лечение',      mana: 4 }
};

let G = null;
const bolts = []; // летящие огненные шары
let regenT = 0;   // секундомёт восстановления маны

// 📖 Максимум маны: 10 + 4 за каждую ступень Мудрости
export function maxMana() { return 10 + 4 * skillRank(G, 'learning'); }

// Рядом ли фонтан живой воды? (там мана бежит втрое быстрее)
function nearFountain() {
  return Math.hypot(G.player.x - FOUNTAIN.x, G.player.z - FOUNTAIN.z) < 4;
}

export function initMagic(gameContext) {
  G = gameContext;
  if (typeof G.mana !== 'number') G.mana = maxMana();
  renderMana();
  renderSpells();
  // Купили свиток в лавке Мерлина — заклинание выучено!
  on('buy', what => {
    const sp = Object.values(SPELLS).find(s => s.give === what);
    if (sp) {
      showToast(`🔮 Выучено: ${sp.name}! Ищи кнопку ${sp.icon} справа`);
      renderSpells();
    }
  });
  // Новая ступень Мудрости — вырос запас маны!
  on('train', () => { renderMana(); renderSpells(); });
  // Тап по кнопке заклинания — колдуем!
  document.getElementById('spells').addEventListener('click', e => {
    const b = e.target.closest('button[data-spell]');
    if (b) cast(b.dataset.spell);
  });
}

// ---------- 💧 РИСУЕМ КАПЕЛЬКИ МАНЫ ----------
export function renderMana() {
  const el = document.getElementById('mana');
  if (!el) return;
  const mx = maxMana();
  if (G.mana > mx) G.mana = mx;
  let s = '';
  for (let i = 0; i < mx / 2; i++) {
    const left = G.mana - i * 2;
    s += left >= 2 ? '💧' : left === 1 ? '🔹' : '▫️';
  }
  el.textContent = s;
}

// ---------- 🔮 КНОПКИ ВЫУЧЕННЫХ ЗАКЛИНАНИЙ ----------
export function renderSpells() {
  const el = document.getElementById('spells');
  if (!el) return;
  el.innerHTML = '';
  for (const [id, sp] of Object.entries(SPELLS)) {
    if ((G.inv[sp.give] || 0) <= 0) continue; // ещё не выучено
    const b = document.createElement('button');
    b.className = 'spellBtn';
    b.dataset.spell = id;
    b.title = sp.name;
    b.innerHTML = `${sp.icon}<span>${sp.mana}💧</span>`;
    b.disabled = G.mana < sp.mana; // маны мало — кнопка серая
    el.appendChild(b);
  }
}

// ---------- ✨ КОЛДУЕМ! ----------
export function cast(id) {
  const sp = SPELLS[id];
  if (!sp || (G.inv[sp.give] || 0) <= 0) return;
  if (G.mana < sp.mana) {
    showToast('💧 Мана кончилась! Подожди — или сходи к фонтану живой воды ⛲');
    sfx.no();
    return;
  }
  if (id === 'heal') {
    if (!heal(4)) { showToast('😊 Здоровье и так полное!'); return; }
    G.mana -= sp.mana;
    spawnParticles(G.player.x, G.player.feet + 1, G.player.z, 'flower');
    sfx.chime();
    showToast('💚 Лечение! +2 ❤️');
    emit('cast', 'heal'); // квест «Вылечись заклинанием»
  } else if (id === 'fire') {
    G.mana -= sp.mana;
    fireBolt();
    emit('cast', 'fire');
  }
  renderMana();
  renderSpells();
  emit('dirty');
}

// 🔥 Огненный шар: летит туда, куда смотрит герой
function fireBolt() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFF7722 })); // огонь светится сам!
  const dir = new THREE.Vector3();
  G.camera.getWorldDirection(dir); // направление взгляда
  mesh.position.set(G.player.x, G.player.feet + 1.4, G.player.z);
  G.scene.add(mesh);
  bolts.push({ mesh, vx: dir.x * 22, vy: dir.y * 22, vz: dir.z * 22, life: 1.6 });
  G.swingT = 0.3; // взмах рукой — колдовской жест!
  sfx.shoot();
}

// 💥 Бабах! Шар взрывается и жжёт всех монстров рядом
function explode(b) {
  const p = b.mesh.position;
  const dmg = 4 + skillRank(G, 'learning'); // мудрость усиливает огонь!
  let hit = false;
  for (const m of getMobs()) {
    if (m.dead) continue;
    const d = Math.hypot(m.x - p.x, (m.feet + 1) - p.y, m.z - p.z);
    if (d < 2.6) { attackMob(m, dmg); hit = true; }
  }
  // Фейерверк из огня и дыма
  for (let k = 0; k < 6; k++)
    spawnParticles(p.x, p.y + k * 0.2, p.z, k % 2 ? 'torch' : 'coalOre');
  sfx.boom();
  if (hit) emit('fireHit'); // квест «Поджги монстра»
  G.scene.remove(b.mesh);
}

// ---------- КАЖДЫЙ КАДР ----------
export function updateMagic(dt) {
  // 💧 Мана капает обратно: раз в 2 секунды, у фонтана — втрое скорее
  const mx = maxMana();
  if (G.mana < mx) {
    regenT += dt * (nearFountain() ? 3 : 1);
    if (regenT >= 2) {
      regenT = 0;
      G.mana = Math.min(mx, G.mana + 1);
      renderMana();
      renderSpells(); // вдруг кнопка заклинания зажглась!
    }
  }
  // 🔥 Полёт огненных шаров
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    b.life -= dt;
    b.mesh.position.x += b.vx * dt;
    b.mesh.position.y += b.vy * dt;
    b.mesh.position.z += b.vz * dt;
    spawnParticles(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 'torch'); // огненный хвост!
    // 🔥 Врезались в монстра?
    const hitMob = getMobs().some(m => !m.dead &&
      Math.hypot(m.x - b.mesh.position.x, (m.feet + 1) - b.mesh.position.y,
                 m.z - b.mesh.position.z) < 1.3);
    const px = Math.floor(b.mesh.position.x), pz = Math.floor(b.mesh.position.z);
    // 💥 Врезались в твёрдый блок: пол, стену или свод пещеры — бабах!
    const onGround = solidAt(px, Math.floor(b.mesh.position.y), pz);
    if (hitMob || b.life <= 0 || onGround) { // встретил монстра или землю — бабах!
      explode(b);
      bolts.splice(i, 1);
    }
  }
}
