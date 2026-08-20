@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================
echo  MiniCraft Adventure - Сборка APK
echo ========================================
echo.

REM Проверяем Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не найден!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js найден:
node --version
echo.

REM Проверяем JDK
where javac >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: JDK не найден!
    echo Установите JDK 17+ и добавьте в PATH
    pause
    exit /b 1
)
echo [OK] JDK найден:
java -version
echo.

REM Проверяем Android SDK
if not defined ANDROID_HOME (
    echo ВНИМАНИЕ: ANDROID_HOME не установлен!
    echo Установите Android Studio и настройте ANDROID_HOME
    echo или добавьте Android SDK в PATH
    echo.
)

echo [1/5] Установка зависимостей...
cd /d "%~dp0app"
call npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)
echo.

echo [2/5] Синхронизация веб-файлов с Capacitor...
call npx cap sync
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось синхронизировать файлы!
    pause
    exit /b 1
)
echo.

echo [3/5] Сборка Android проекта...
cd android
set GRADLE_OPTS=-Xmx2048m
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать APK!
    pause
    exit /b 1
)
echo.

echo [4/5] Поиск APK файлов...
cd ..
for /r %%f in (*.apk) do (
    echo   %%f
)
echo.

echo [5/5] Готово!
echo.
echo Debug APK доступен в:
echo   app\android\app\build\outputs\apk\debug\
echo.
echo Для подписанного релизного APK (для RuStore) см. SIGNING.md
echo.
pause
