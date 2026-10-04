// ============================================================
//  🏙️ ЗАГРУЗКА ГОРОДОВ И ДЕРЕВЕНЬ
// ============================================================
import { initCities, getCityPositions } from './js/cities.js';
import { initVillages, getVillagePositions } from './js/villages_extended.js';

// Ждём загрузки игры
const waitForGame = setInterval(() => {
  const G = window.G || window.__gameContext;
  if (G && G.scene) {
    clearInterval(waitForGame);

    console.log('🏙️ Загрузка городов и деревень...');

    try {
      initCities(G);
      initVillages(G);

      console.log('✅ Все города и деревни созданы!');
      console.log('📍 Небесные города:');
      for (const city of getCityPositions()) {
        console.log(`   ${city.name}: (${city.x}, ${city.z}) на высоте ${city.height}`);
      }
      console.log('📍 Деревни:');
      for (const village of getVillagePositions()) {
        console.log(`   ${village.name}: (${village.x}, ${village.z})`);
      }
    } catch(e) {
      console.error('❌ Ошибка создания городов:', e);
    }
  }
}, 500);

setTimeout(() => clearInterval(waitForGame), 10000);