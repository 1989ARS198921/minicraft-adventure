# ============================================================
# Fix-MiniCraft.ps1
# Исправляет ошибки запуска minicraft-adventure:
# 1. Скачивает three.module.js
# 2. Создаёт utils.js
# 3. Добавляет Import Map в index.html
# ============================================================

param(
    [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"

$AppPath = Join-Path $ProjectPath "app"
$JsPath  = Join-Path $AppPath "js"
$IndexPath = Join-Path $AppPath "index.html"

# --- Проверка структуры ---
if (-not (Test-Path $AppPath)) {
    Write-Error "Папка app не найдена в '$ProjectPath'. Запусти скрипт из корня репозитория minicraft-adventure."
    exit 1
}
if (-not (Test-Path $JsPath)) {
    New-Item -ItemType Directory -Path $JsPath | Out-Null
    Write-Host "Создана папка: $JsPath" -ForegroundColor Green
}
if (-not (Test-Path $IndexPath)) {
    Write-Error "Файл index.html не найден: $IndexPath"
    exit 1
}

# --- 1. Скачать three.module.js ---
$ThreeUrl = "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js"
$ThreeFile = Join-Path $JsPath "three.module.js"

Write-Host "Скачивание three.module.js..." -ForegroundColor Cyan
Write-Host "  Источник: $ThreeUrl" -ForegroundColor Gray
Write-Host "  Куда:     $ThreeFile" -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $ThreeUrl -OutFile $ThreeFile -UseBasicParsing
    $size = (Get-Item $ThreeFile).Length
    Write-Host "  OK ($size байт)" -ForegroundColor Green
} catch {
    Write-Error "Не удалось скачать three.module.js: $_"
    exit 1
}

# --- 2. Создать utils.js ---
$UtilsFile = Join-Path $JsPath "utils.js"
$UtilsContent = @"
// utils.js - вспомогательные функции для MiniCraft Adventure
window.Utils = {
    rand:     (min, max) => Math.random() * (max - min) + min,
    randInt:  (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    clamp:    (val, min, max) => Math.max(min, Math.min(max, val)),
    lerp:     (a, b, t) => a + (b - a) * t,
    dist:     (x1, z1, x2, z2) => Math.sqrt((x2-x1)**2 + (z2-z1)**2),
    chance:   (p) => Math.random() < p,
    pick:     (arr) => arr[Math.floor(Math.random() * arr.length)],
    uuid:     () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                  const r = Math.random() * 16 | 0;
                  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
              })
};

// Глобальные алиасы для обратной совместимости
window.rand     = window.Utils.rand;
window.randInt  = window.Utils.randInt;
window.clamp    = window.Utils.clamp;
window.lerp     = window.Utils.lerp;
window.dist     = window.Utils.dist;
window.chance   = window.Utils.chance;
window.pick     = window.Utils.pick;
window.uuid     = window.Utils.uuid;

console.log('[utils.js] Утилиты загружены');
"@

Set-Content -Path $UtilsFile -Value $UtilsContent -Encoding UTF8
Write-Host "Создан utils.js" -ForegroundColor Green

# --- 3. Пропатчить index.html (добавить Import Map) ---
Write-Host "Проверка index.html..." -ForegroundColor Cyan

$html = Get-Content -Path $IndexPath -Raw -Encoding UTF8

# Проверить, нет ли уже import map
if ($html -match 'importmap') {
    Write-Host "  Import map уже присутствует в index.html — пропускаем." -ForegroundColor Yellow
} else {
    $ImportMap = @"
  <!-- Import Map для разрешения модулей -->
  <script type="importmap">
  {
    "imports": {
      "three": "./js/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/"
    }
  }
  </script>

"@

    # Вставить сразу после <head>
    if ($html -match '(<head[^>]*>)\s*\n') {
        $html = $html -replace '(<head[^>]*>)\s*\n', "`$1`n`n$ImportMap"
        Set-Content -Path $IndexPath -Value $html -Encoding UTF8
        Write-Host "  Import map добавлен в <head>" -ForegroundColor Green
    } else {
        Write-Warning "Не удалось найти тег <head> для вставки import map. Добавь вручную."
    }
}

# --- 4. Проверить, что three.module.js подключён правильно ---
$html = Get-Content -Path $IndexPath -Raw -Encoding UTF8

# Если есть старая строка <script type="module" src="js/three.module.js"></script>
# оставляем её — она теперь будет работать, так как файл существует

# Проверить наличие script src="js/utils.js"
if ($html -notmatch 'src=["\']js/utils\.js["\']') {
    Write-Warning "В index.html не найдено подключение utils.js. Проверь вручную."
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ГОТОВО! Перезапусти сервер:" -ForegroundColor Green
Write-Host "  cd app" -ForegroundColor White
Write-Host "  python -m http.server 8080" -ForegroundColor White
Write-Host "  http://localhost:8080" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
