# ============================================
# Скрипт подготовки к публикации в RuStore
# ============================================
# Запуск: powershell -ExecutionPolicy Bypass -File prepare-rustore.ps1
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Подготовка MiniCraft Adventure к RuStore" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Проверяем текущую директорию
$currentDir = Get-Location
Write-Host "[1/7] Проверка структуры проекта..." -ForegroundColor Yellow

$requiredFiles = @(
    "index.html",
    "manifest.webmanifest",
    "js/main.js",
    "capacitor.config.json"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $currentDir $file
    if (-not (Test-Path $fullPath)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "[✗] Не найдены файлы:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    Write-Host "`n[!] Убедитесь, что скрипт запущен из папки app/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[✓] Все необходимые файлы найдены" -ForegroundColor Green
Write-Host ""

# Синхронизируем веб-файлы
Write-Host "[2/7] Синхронизация веб-файлов с Capacitor..." -ForegroundColor Yellow
npx cap sync

if ($LASTEXITCODE -ne 0) {
    Write-Host "[✗] Ошибка синхронизации!" -ForegroundColor Red
    exit 1
}
Write-Host "[✓] Веб-файлы синхронизированы" -ForegroundColor Green
Write-Host ""

# Проверяем Android SDK
Write-Host "[3/7] Проверка Android SDK..." -ForegroundColor Yellow
$sdkPath = $env:ANDROID_HOME
if ([string]::IsNullOrEmpty($sdkPath)) {
    $sdkPath = $env:ANDROID_SDK_ROOT
}

if ([string]::IsNullOrEmpty($sdkPath)) {
    Write-Host "[!] ANDROID_HOME не установлен" -ForegroundColor Yellow
    Write-Host "    Установите Android Studio и настройте переменную окружения" -ForegroundColor Yellow
} else {
    Write-Host "[✓] Android SDK найден: $sdkPath" -ForegroundColor Green
}
Write-Host ""

# Проверяем JDK
Write-Host "[4/7] Проверка JDK..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "[✓] $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] JDK не найден в PATH" -ForegroundColor Yellow
}
Write-Host ""

# Проверяем ключ подписи
Write-Host "[5/7] Проверка ключа подписи..." -ForegroundColor Yellow
$keystorePath = Join-Path (Join-Path $currentDir "android") "minicraft-release.keystore"
$gradlePropsPath = Join-Path (Join-Path $currentDir "android") "gradle.properties"

if (Test-Path $keystorePath) {
    Write-Host "[✓] Ключ подписи найден" -ForegroundColor Green
} else {
    Write-Host "[!] Ключ подписи не найден" -ForegroundColor Yellow
    Write-Host "    Для сборки релизного APK нужен ключ подписи" -ForegroundColor Yellow
    Write-Host ""
    $generateKey = Read-Host "  Сгенерировать ключ сейчас? (y/n)"
    if ($generateKey -eq "y") {
        $androidDir = Join-Path $currentDir "android"
        Set-Location $androidDir
        powershell -ExecutionPolicy Bypass -File "generate-keystore.ps1"
        Set-Location $currentDir
    }
}
Write-Host ""

# Проверяем gradle.properties
Write-Host "[6/7] Проверка конфигурации подписи..." -ForegroundColor Yellow

if (Test-Path $gradlePropsPath) {
    Write-Host "[✓] gradle.properties найден" -ForegroundColor Green
} else {
    Write-Host "[!] gradle.properties не найден" -ForegroundColor Yellow
}
Write-Host ""

# Итоговое сообщение
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ИТОГОВЫЙ ЧЕКЛИСТ ДЛЯ RUSTORE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Веб-файлы скопированы в www/" -ForegroundColor Green
Write-Host "[ ] Сгенерирован ключ подписи (если ещё нет)" -ForegroundColor Yellow
Write-Host "[ ] Собран релизный APK (см. шаг 7)" -ForegroundColor Yellow
Write-Host "[ ] Созданы изображения (icon_512.svg, feature_graphic.svg)" -ForegroundColor Yellow
Write-Host "[ ] Заполнены контакты в rustore_description.md" -ForegroundColor Yellow
Write-Host ""

Write-Host "[7/7] СБОРКА РЕЛИЗНОГО APK" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor White
Write-Host "`nВыполните одну из команд (в папке android/):" -ForegroundColor White
Write-Host ""
Write-Host "  • APK (стандартный):" -ForegroundColor Cyan
Write-Host "    cd android" -ForegroundColor Gray
Write-Host "    gradlew.bat assembleRelease" -ForegroundColor Gray
Write-Host ""
Write-Host "  • AAB (рекомендуется для RuStore):" -ForegroundColor Cyan
Write-Host "    cd android" -ForegroundColor Gray
Write-Host "    gradlew.bat bundleRelease" -ForegroundColor Gray
Write-Host ""

$buildNow = Read-Host "  Собрать APK/AAB сейчас? (y/n)"

if ($buildNow -eq "y") {
    Write-Host "`n[>] Сборка релизного APK..." -ForegroundColor Cyan
    Set-Location (Join-Path $currentDir "android")
    
    $format = Read-Host "  Формат: 1) APK, 2) AAB"
    
    if ($format -eq "2") {
        Write-Host "[>] Сборка AAB..." -ForegroundColor Yellow
        gradlew.bat bundleRelease
    } else {
        Write-Host "[>] Сборка APK..." -ForegroundColor Yellow
        gradlew.bat assembleRelease
    }
    
    if ($LASTEXITCODE -eq 0) {
        Set-Location $currentDir
        Write-Host ""
        Write-Host "[✓] Сборка завершена успешно!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Файлы доступны по пути:" -ForegroundColor White
        if ($format -eq "2") {
            Write-Host "  android\app\build\outputs\bundle\release\" -ForegroundColor Cyan
        } else {
            Write-Host "  android\app\build\outputs\apk\release\" -ForegroundColor Cyan
        }
    } else {
        Set-Location $currentDir
        Write-Host "`n[✗] Ошибка сборки!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ДЛЯ ЗАГРУЗКИ В RUSTORE:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Перейдите на https://dev.rustore.ru/" -ForegroundColor White
Write-Host "2. Войдите в аккаунт разработчика" -ForegroundColor White
Write-Host "3. Создайте новое приложение" -ForegroundColor White
Write-Host "4. Загрузите APK или AAB файл" -ForegroundColor White
Write-Host "5. Заполните описание из rustore_description.md" -ForegroundColor White
Write-Host "6. Загрузите изображения:" -ForegroundColor White
Write-Host "    - icon_512.svg → конвертируйте в PNG 512×512" -ForegroundColor Gray
Write-Host "    - feature_graphic.svg → конвертируйте в PNG 1024×500" -ForegroundColor Gray
Write-Host "7. Приложите скриншоты (минимум 2)" -ForegroundColor White
Write-Host "8. Отправьте на модерацию" -ForegroundColor White
Write-Host ""
Write-Host "📋 Полная инструкция: app/rustore_description.md" -ForegroundColor Green
Write-Host "📝 Описание: app/SIGNING.md" -ForegroundColor Green
Write-Host ""
