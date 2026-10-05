// ============================================================
//  🖥️ UI-ЭКСТРАС: кнопки скрытия HUD/квестов, Esc для диалога
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // Кнопки скрытия
  const toggleHud = document.getElementById('toggleHud');
  const toggleQuest = document.getElementById('toggleQuest');
  const quests = document.getElementById('quests');
  const minimap = document.getElementById('minimap');
  const timeBadge = document.getElementById('timeBadge');
  const lvlBadge = document.getElementById('lvlBadge');
  const flyBadge = document.getElementById('flyBadge');

  let hudVisible = true, questVisible = true;

  // 📱 На телефоне панель заданий сразу свёрнута — не занимает экран
  if (window.matchMedia('(pointer: coarse)').matches && quests)
    quests.classList.add('collapsed');

  if (toggleHud) {
    toggleHud.onclick = function() {
      hudVisible = !hudVisible;
      if (minimap) minimap.classList.toggle('hidden', !hudVisible);
      if (timeBadge) timeBadge.classList.toggle('hidden', !hudVisible);
      if (lvlBadge) lvlBadge.classList.toggle('hidden', !hudVisible);
      if (flyBadge) flyBadge.classList.toggle('hidden', !hudVisible);
      this.textContent = hudVisible ? '📋 HUD' : '📋 Показать HUD';
    };
  }

  if (toggleQuest) {
    toggleQuest.onclick = function() {
      questVisible = !questVisible;
      if (quests) quests.classList.toggle('hidden', !questVisible);
      this.textContent = questVisible ? '📜 Квест' : '📜 Показать квест';
    };
  }

  // ===== ДИАЛОГИ: закрытие по Esc =====
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const d = document.getElementById('dlg');
      if (d && d.style.display === 'flex') d.style.display = 'none';
    }
  });
});
