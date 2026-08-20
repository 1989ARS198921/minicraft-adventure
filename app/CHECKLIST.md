# Чек-лист подготовки MiniCraft Adventure к публикации в RuStore

## ✅ Выполнено

- [x] Настроен Capacitor для Android
- [x] Package ID: `com.ars1989.minicraft`
- [x] Веб-файлы скопированы в `www/`
- [x] Выполнен `npx cap sync`
- [x] Созданы SVG-макеты для RuStore

## 📋 Чек-лист для завершения

### 1. Изображения для RuStore

| Файл | Размер | Что делать |
|------|--------|-----------|
| `icon_512.svg` | 512×512 | Конвертировать в PNG |
| `feature_graphic.svg` | 1024×500 | Конвертировать в PNG |
| Скриншот 1 | любой | Скриншот игры - деревня |
| Скриншот 2 | любой | Скриншот игры - бой |
| Скриншот 3 | любой | Скриншот игры - ночью |

**Как конвертировать SVG → PNG:**
1. Откройте https://cloudconvert.com/svg-to-png
2. Загрузите SVG
3. Скачайте PNG

### 2. Ключ подписи APK

Если ещё не создан:
```powershell
cd android
powershell -ExecutionPolicy Bypass -File generate-keystore.ps1
```

Или создайте вручную:
```powershell
keytool -genkey -v -keystore minicraft-release.keystore ^
    -alias minicraft -keyalg RSA -keysize 2048 -validity 10000
```

### 3. Сборка релизного APK/AAB

**В папке `android/`:**

```powershell
# Вариант 1: APK (простой формат)
gradlew.bat assembleRelease

# Вариант 2: AAB (Android App Bundle - рекомендуется для RuStore)
gradlew.bat bundleRelease
```

**Где найти файлы:**
- APK: `android\app\build\outputs\apk\release\app-release.apk`
- AAB: `android\app\build\outputs\bundle\release\app-release.aab`

### 4. Заполнение описания

Откройте `rustore_description.md` и заполните:
- [ ] Email разработчика
- [ ] Ссылка на GitHub (если есть)
- [ ] Контактная информация

### 5. Загрузка в RuStore

1. Перейдите: https://dev.rustore.ru/
2. Войдите в аккаунт разработчика
3. Нажмите "Добавить приложение"
4. Заполните поля:
   - **Название:** MiniCraft Adventure
   - **Категория:** Игры → Приключения
   - **Язык:** Русский
   - **Возраст:** 12+
5. Загрузите файлы:
   - [ ] APK или AAB
   - [ ] Иконка (PNG 512×512)
   - [ ] Feature graphic (1024×500)
   - [ ] Скриншоты (минимум 2)
6. Скопируйте описание из `rustore_description.md`
7. Отправьте на модерацию

## 🚀 Быстрый запуск

Запустите автоматический скрипт:
```powershell
powershell -ExecutionPolicy Bypass -File prepare-rustore.ps1
```

Он выполнит все шаги автоматически.

## ⚠️ Важно

1. **Сохраните ключ подписи!** Без него невозможно обновить приложение.
2. **versionCode** увеличивается с каждым релизом (сейчас: 1)
3. **AAB рекомендуется** RuStore — файл меньше, лучше оптимизация
4. Модерация RuStore занимает 1-7 дней

## 📞 Поддержка

- RuStore Help: https://rustore.ru/support
- Dev Portal: https://dev.rustore.ru/
