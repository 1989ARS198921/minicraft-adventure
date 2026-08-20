# Скрипт генерации ключа подписи для подписания APK в RuStore
# Запустите: powershell -ExecutionPolicy Bypass -File generate-keystore.ps1

$ErrorActionPreference = "Stop"

$keystoreName = "minicraft-release.keystore"
$keystorePath = Join-Path $PSScriptRoot $keystoreName

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Генерация ключа подписи APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверяем, существует ли уже ключ
if (Test-Path $keystorePath) {
    Write-Host "[!] Ключ уже существует: $keystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Перегенерировать? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "[✓] Отменено." -ForegroundColor Green
        exit 0
    }
}

# Запрашиваем данные
Write-Host "`nВведите данные для ключа:" -ForegroundColor White
Write-Host "(Нажмите Enter для значений по умолчанию)" -ForegroundColor Gray

$storePassword = Read-Host "  Пароль хранилища (мин. 6 символов)"
if ([string]::IsNullOrEmpty($storePassword)) { $storePassword = "Minicraft2026" }

$keyPassword = Read-Host "  Пароль ключа"
if ([string]::IsNullOrEmpty($keyPassword)) { $keyPassword = "Minicraft2026" }

$dnName = Read-Host "  Distinguished Name (например: CN=MiniCraft, OU=Dev, O=ARS, L=Moscow, C=RU)"
if ([string]::IsNullOrEmpty($dnName)) { $dnName = "CN=MiniCraft Adventure, OU=Development, O=ARS1989, L=Moscow, ST=Moscow, C=RU" }

$keyAlias = "minicraft"
$keySize = 2048
$validity = 10000  # лет

Write-Host "`n[>] Генерация ключа..." -ForegroundColor Cyan

keytool -genkey -v `
    -keystore $keystorePath `
    -alias $keyAlias `
    -keyalg RSA `
    -keysize $keySize `
    -validity $validity `
    -storepass $storePassword `
    -keypass $keyPassword `
    -dname $dnName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[✓] Ключ успешно создан!" -ForegroundColor Green
    Write-Host "    Путь: $keystorePath" -ForegroundColor White
    Write-Host "    Алиас: $keyAlias" -ForegroundColor White
    Write-Host "    Срок действия: $validity лет" -ForegroundColor White
    
    Write-Host "`n----------------------------------------" -ForegroundColor White
    Write-Host "СЛЕДУЮЩИЕ ШАГИ:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Создайте файл gradle.properties (в папке android/):" -ForegroundColor White
    Write-Host "   MYAPP_RELEASE_STORE_FILE=$keystoreName" -ForegroundColor Cyan
    Write-Host "   MYAPP_RELEASE_KEY_ALIAS=$keyAlias" -ForegroundColor Cyan
    Write-Host "   MYAPP_RELEASE_STORE_PASSWORD=$storePassword" -ForegroundColor Cyan
    Write-Host "   MYAPP_RELEASE_KEY_PASSWORD=$keyPassword" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Соберите релиз: gradlew.bat assembleRelease" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  ВАЖНО: Сохраните ключ в надёжном месте!" -ForegroundColor Red
    Write-Host "   Без него невозможно обновить приложение в RuStore!" -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host "`n[✗] Ошибка генерации ключа!" -ForegroundColor Red
    exit 1
}
