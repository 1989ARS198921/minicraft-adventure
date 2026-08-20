# MiniCraft Adventure - Android APK

Web-based Minecraft-like game wrapped as Android app using Capacitor.

## Быстрый старт

### Требования
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) с Android SDK
- JDK 17+

### Сборка Debug APK

```powershell
cd app
.\build.bat
```

APK будет в: `app\android\app\build\outputs\apk\debug\`

### Установка на устройство

```powershell
adb install app\android\app\build\outputs\apk\debug\app-debug.apk
```

### Открыть в Android Studio

```powershell
cd app\android
start .
```

## Структура проекта

```
app/
├── capacitor.config.json   # Конфигурация Capacitor
├── build.bat               # Скрипт сборки
├── index.html              # Главное приложение
├── manifest.webmanifest    # PWA manifest
├── js/                     # JavaScript файлы игры
└── android/                # Android проект
    ├── app/
    │   ├── src/main/
    │   │   ├── AndroidManifest.xml
    │   │   └── res/          # Иконки, splash screen
    │   └── build.gradle
    └── gradle/               # Gradle wrapper
```

## Публикация в RuStore

См. [SIGNING.md](SIGNING.md) — полная инструкция по подписыванию APK и загрузке.

Кратко:
1. Создайте ключ: `keytool -genkey -v -keystore minicraft-release.keystore ...`
2. Настройте `gradle.properties` с паролем от ключа
3. Соберите релиз: `.\gradlew.bat assembleRelease`
4. Загрузите APK в [RuStore Developer Portal](https://dev.rustore.ru/)

## Конфигурация приложения

### Имя и ID
- **App ID:** `com.ars1989.minicraft`
- **App Name:** `MiniCraft Adventure`

Измените в файлах:
- `capacitor.config.json` → `appId`, `appName`
- `android/app/build.gradle` → `namespace`, `applicationId`
- `android/app/src/main/res/values/strings.xml` → `app_name`, `package_name`

### Версия
- `versionCode` — числовая (увеличивайте при каждом релизе)
- `versionName` — строковая (например, "1.0", "1.1")

## Troubleshooting

### Error: SDK not found
Установите Android SDK через Android Studio или настройте `ANDROID_HOME`.

### Error: JDK not found
Установите JDK 17+ и добавьте в PATH, или настройте `JAVA_HOME`.

### Error: Gradle sync failed
Удалите папку `android/.gradle` и повторите сборку.

### Error: capacitor.config.json not found
Убедитесь, что файл существует в папке `app/`.
