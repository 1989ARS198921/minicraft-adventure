// ============================================================
//  🗺️ КВЕСТОВЫЕ ЛОКАЦИИ — привязка заданий к миру!
//  У каждого задания «иди туда-то» теперь есть настоящее место:
//  кладбище с вампирами, волчье логово, проклятые руины,
//  орочий лагерь и алтарь некроманта. Компас в углу экрана
//  показывает, куда бежать. В сундуках локаций — артефакты!
// ============================================================

import { hillH, blockAt } from './world.js';
import { on, emit } from './bus.js';
import { showToast, updateInvUI } from './ui.js';
import { giveArtifact } from './artifacts.js';

// ---- ЛОКАЦИИ (места подобраны вдали от деревень и городов) ----
export const QUEST_SITES = [
  { id: 'graveyard', name: '🪦 Заброшенное кладбище', x: -40, z: 180, r: 16,
    mobs: [['vampire', 5], ['zombie', 3], ['ghost', 2]], artifact: 'artiVampFang' },
  { id: 'wolfden', name: '🐺 Волчье логово', x: 170, z: -140, r: 14,
    mobs: [['wolf', 8]] },
  { id: 'ruins', name: '🏚️ Проклятые руины', x: -210, z: 190, r: 14,
    mobs: [['ghost', 6]], artifact: 'artiSunIdol' },
  { id: 'orccamp', name: '👹 Орочий лагерь', x: 55, z: 130, r: 14,
    mobs: [['orc', 6]] },
  { id: 'darkaltar', name: '💀 Алтарь Некроманта', x: -80, z: -70, r: 10,
    mobs: [['skeleton', 4]] }
];

// ---- СТРОИТЕЛЬСТВО (вызывает world.js при генерации чанка) ----
export function stampQuestSites(data, cx, cz) {
  const key = (x, y, z) => x + ',' + y + ',' + z;
  const set = (x, y, z, t) => data.set(key(x, y, z), t);
  const del = (x, y, z) => data.delete(key(x, y, z));

  for (const s of QUEST_SITES) {
    // Пересекается ли локация с этим чанком?
    if (s.x + s.r < cx * 16 || s.x - s.r > cx * 16 + 15) continue;
    if (s.z + s.r < cz * 16 || s.z - s.r > cz * 16 + 15) continue;

    for (let x = s.x - s.r; x <= s.x + s.r; x++) {
      for (let z = s.z - s.r; z <= s.z + s.r; z++) {
        if (Math.floor(x / 16) !== cx || Math.floor(z / 16) !== cz) continue;
        const dx = x - s.x, dz = z - s.z;
        const h = hillH(x, z);
        const edge = Math.max(Math.abs(dx), Math.abs(dz));
        const decor = (dx * 7 + dz * 13 + 101) % 11;

        // Убираем цветы/кусты — тут строим!
        del(x, h + 1, z);

        if (s.id === 'graveyard') {
          // Могилы ровными рядами: плита + крест
          if (edge < s.r - 2 && (dx + dz) % 5 === 0 && dx % 2 === 0 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) {
            set(x, h + 1, z, 'stoneBricks');
            if (decor < 5) set(x, h + 2, z, 'obsidian');
          }
          // Ограда из обсидиановых столбиков
          if (edge === s.r && (dx + dz) % 3 === 0) {
            set(x, h + 1, z, 'obsidian');
            set(x, h + 2, z, 'obsidian');
          }
          // Мёртвые деревья
          if (decor === 7 && edge < s.r - 3) {
            set(x, h + 1, z, 'trunk');
            set(x, h + 2, z, 'trunk');
            set(x, h + 3, z, 'trunk');
          }
        } else if (s.id === 'wolfden') {
          // Кости (белые груды) и яма-логово в центре
          if (decor === 3) set(x, h + 1, z, 'whiteWool');
          if (edge <= 2) { del(x, h, z); set(x, h - 1, z, 'dirt'); }
        } else if (s.id === 'ruins') {
          // Мостовая из каменных кирпичей + разбитые колонны по углам
          if ((dx + dz) % 3 === 0) set(x, h, z, 'stoneBricks');
          const corn = (Math.abs(Math.abs(dx) - 8) <= 0 && Math.abs(Math.abs(dz) - 8) <= 0);
          if (corn) {
            const colH = 2 + ((dx + dz + 16) % 3);
            for (let y = 1; y <= colH; y++) set(x, h + y, z, 'stoneBricks');
          }
        } else if (s.id === 'orccamp') {
          // Кострище в центре, «черепа на кольях» по кругу
          if (edge <= 1) set(x, h + 1, z, 'glowstone');
          if (edge === 6 && (dx + dz) % 4 === 0) {
            set(x, h + 1, z, 'trunk');
            set(x, h + 2, z, 'whiteWool');
          }
        } else if (s.id === 'darkaltar') {
          // Обсидиановый помост с колоннами и светильниками
          if (edge <= 4) set(x, h + 1, z, 'obsidian');
          if (edge === 4 && (Math.abs(dx) === 4) === (Math.abs(dz) === 4)) {
            set(x, h + 2, z, 'obsidian');
            set(x, h + 3, z, 'obsidian');
            set(x, h + 4, z, 'glowstone');
          }
        }
      }
    }
    // Сундук с артефактом — в самом центре локации
    if (s.artifact && Math.floor(s.x / 16) === cx && Math.floor(s.z / 16) === cz) {
      set(s.x, hillH(s.x, s.z) + 1, s.z, 'chest');
    }
  }
}

// ============================================================
//  🎁 СУНДУКИ: ломаешь — получаешь сокровище!
// ============================================================

let G = null;

export function initQuestSites(gameContext) {
  G = gameContext;
  makeCompass();

  on('blockBrokenAt', (type, x, y, z) => {
    if (type !== 'chest') return;
    // Сундук квестовой локации — внутри артефакт!
    const site = QUEST_SITES.find(s => s.artifact && Math.hypot(x - s.x, z - s.z) <= s.r);
    if (site) {
      giveArtifact(G, site.artifact);
      return;
    }
    // Небесный сундук (на островах выше 60) — облачное перо или хрусталь
    if (y > 60) {
      if (!(G.inv.artiCloudFeather > 0)) { giveArtifact(G, 'artiCloudFeather'); return; }
      G.inv.crystal = (G.inv.crystal || 0) + 3;
      showToast('💠 В сундуке — 3 хрусталя!');
    } else {
      // 🗺️ Чем дальше сундук от центра — тем богаче добыча!
      const r = Math.hypot(x, z);
      if (r < 150) {
        G.inv.goldOre = (G.inv.goldOre || 0) + 3;
        showToast('🪙 В сундуке — 3 золотые руды!');
      } else if (r < 300) {
        G.inv.goldOre = (G.inv.goldOre || 0) + 4;
        G.inv.diamondOre = (G.inv.diamondOre || 0) + 1;
        showToast('🪙 Богатый сундук: 4 золотых и алмаз! 💎');
      } else {
        G.inv.goldOre = (G.inv.goldOre || 0) + 5;
        G.inv.diamondOre = (G.inv.diamondOre || 0) + 2;
        G.inv.crystal = (G.inv.crystal || 0) + 1;
        showToast('💎 Сказочный сундук: 5 золота, 2 алмаза и хрусталь!');
      }
    }
    updateInvUI();
    emit('dirty');
  });
}

// ============================================================
//  🧭 КОМПАС + ЗАСЧИТЫВАНИЕ ВИЗИТОВ (каждый кадр из main.js)
// ============================================================

const visited = {};
let compassEl = null, acc = 0;

function makeCompass() {
  compassEl = document.createElement('div');
  compassEl.id = 'questCompass';
  // На маленьком экране компас — над хотбаром по центру (слева джойстик!)
  const smallScr = window.matchMedia('(max-width: 560px)').matches;
  compassEl.style.cssText = (smallScr
    ? 'position:fixed;left:50%;transform:translateX(-50%);bottom:54px;text-align:center;'
    : 'position:fixed;left:8px;bottom:120px;') +
    'z-index:12;background:rgba(10,14,10,.72);color:#ffe;border-radius:10px;padding:5px 9px;' +
    'font:11px/1.3 monospace;display:none;max-width:70vw;pointer-events:none';
  document.body.appendChild(compassEl);
}

export function updateQuestSites(dt) {
  acc += dt;
  if (acc < 0.5) return; // обновляем два раза в секунду — достаточно
  acc = 0;
  const p = G.player;

  // Зашёл в локацию? Отмечаем визит (квесты слушают событие 'visit')
  for (const s of QUEST_SITES) {
    if (visited[s.id]) continue;
    if (Math.hypot(p.x - s.x, p.z - s.z) <= s.r) {
      visited[s.id] = true;
      showToast(`${s.name} — место найдено!`);
      emit('visit', s.id);
    }
  }

  // Небо: стоим на парящем острове / в облачном городе?
  if (p.feet > 60) {
    const under = blockAt(Math.floor(p.x), Math.floor(p.feet - 1), Math.floor(p.z));
    if (under === 'skyGrass' || under === 'cloudStone') {
      if (!visited.sky_island) { visited.sky_island = true; emit('visit', 'sky_island'); }
      if (p.feet > 85 && !visited.cloud_city) { visited.cloud_city = true; emit('visit', 'cloud_city'); }
    }
  }

  // Компас: ведём к ближайшей неоткрытой локации
  let best = null, bestD = 1e9;
  for (const s of QUEST_SITES) {
    if (visited[s.id]) continue;
    const d = Math.hypot(p.x - s.x, p.z - s.z);
    if (d < bestD) { bestD = d; best = s; }
  }
  if (!compassEl) return;
  if (!best) { compassEl.style.display = 'none'; return; }
  const ang = Math.atan2(-(best.x - p.x), -(best.z - p.z)) - p.yaw; // куда смотреть
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const a = arrows[Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8];
  compassEl.innerHTML = `🧭 ${a} ${best.name}<br>📏 ${Math.round(bestD)} м`;
  compassEl.style.display = 'block';
}
