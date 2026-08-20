# ============================================================
# Fix-MiniCraft.ps1
# Автоматически исправляет все ошибки запуска minicraft-adventure
# ============================================================

param(
    [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"

$AppPath   = Join-Path $ProjectPath "app"
$JsPath    = Join-Path $AppPath "js"
$IndexPath = Join-Path $AppPath "index.html"
$MainPath  = Join-Path $JsPath "main.js"
$WorldPath = Join-Path $JsPath "world.js"

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

# ============================================================
# 1. Скачать three.module.js (Three.js r128)
# ============================================================
$ThreeUrl  = "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js"
$ThreeFile = Join-Path $JsPath "three.module.js"

Write-Host "`n[1/6] Скачивание three.module.js..." -ForegroundColor Cyan
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

# ============================================================
# 2. Создать utils.js
# ============================================================
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
Write-Host "`n[2/6] Создан utils.js" -ForegroundColor Green

# ============================================================
# 3. Пропатчить index.html
# ============================================================
Write-Host "`n[3/6] Патчинг index.html..." -ForegroundColor Cyan

$html = Get-Content -Path $IndexPath -Raw -Encoding UTF8

# 3a. Добавить Import Map (если ещё нет)
if ($html -match 'importmap') {
    Write-Host "  Import map уже есть — пропускаем" -ForegroundColor Yellow
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
    if ($html -match '(<head[^>]*>)\s*\n') {
        $html = $html -replace '(<head[^>]*>)\s*\n', "`$1`n`n$ImportMap"
        Write-Host "  Import map добавлен в <head>" -ForegroundColor Green
    } else {
        Write-Warning "  Не удалось найти <head>. Добавь import map вручную."
    }
}

# 3b. Добавить window.THREE для non-module скриптов (если ещё нет)
if ($html -match 'window\.THREE\s*=\s*THREE') {
    Write-Host "  window.THREE уже есть — пропускаем" -ForegroundColor Yellow
} else {
    # Найти строку <script type="module" src="js/three.module.js"></script>
    # и заменить на inline-модуль, который загружает THREE и кладёт в window
    $oldThreeScript = '<script type="module" src="js/three.module.js"></script>'
    $newThreeScript = @"
  <script type="module">
    import * as THREE from 'three';
    window.THREE = THREE;
    console.log('[index.html] THREE экспортирован в window');
  </script>
"@
    if ($html -contains $oldThreeScript) {
        $html = $html -replace [regex]::Escape($oldThreeScript), $newThreeScript
        Write-Host "  three.module.js заменён на inline-модуль с window.THREE" -ForegroundColor Green
    } else {
        # Если не нашли точное совпадение, вставим после </title>
        $threeInjector = @"

  <script type="module">
    import * as THREE from 'three';
    window.THREE = THREE;
    console.log('[index.html] THREE экспортирован в window');
  </script>
"@
        if ($html -match '(</title>\s*\n)') {
            $html = $html -replace '(</title>\s*\n)', "`$1$threeInjector"
            Write-Host "  window.THREE инжектор добавлен после </title>" -ForegroundColor Green
        }
    }
}

Set-Content -Path $IndexPath -Value $html -Encoding UTF8

# ============================================================
# 4. Пропатчить main.js — добавить blockAt в импорт и G.getBlock
# ============================================================
Write-Host "`n[4/6] Патчинг main.js..." -ForegroundColor Cyan

$main = Get-Content -Path $MainPath -Raw -Encoding UTF8

# 4a. Добавить blockAt в импорт world.js
if ($main -match "import\s*\{\s*initWorld,\s*setSeed,\s*streamChunks,\s*groundHeight\s*\}\s*from\s*['\"]\.\/world\.js['\"];?") {
    $main = $main -replace "import\s*\{\s*initWorld,\s*setSeed,\s*streamChunks,\s*groundHeight\s*\}\s*from\s*['\"]\.\/world\.js['\"];?",
        "import { initWorld, setSeed, streamChunks, groundHeight, blockAt } from './world.js';"
    Write-Host "  Добавлен blockAt в импорт world.js" -ForegroundColor Green
} elseif ($main -match "blockAt") {
    Write-Host "  blockAt уже в импортах — пропускаем" -ForegroundColor Yellow
} else {
    Write-Warning "  Не удалось найти импорт world.js. Проверь вручную."
}

# 4b. Добавить G.getBlock = blockAt; после создания G
if ($main -match "G\.getBlock\s*=") {
    Write-Host "  G.getBlock уже есть — пропускаем" -ForegroundColor Yellow
} else {
    # Найти строку "window.G = G;" и добавить перед ней
    if ($main -match "(window\.G\s*=\s*G;)") {
        $main = $main -replace "(window\.G\s*=\s*G;)", "G.getBlock = blockAt;`n`$1"
        Write-Host "  Добавлен G.getBlock = blockAt" -ForegroundColor Green
    } else {
        Write-Warning "  Не удалось найти 'window.G = G;'. Добавь G.getBlock = blockAt вручную."
    }
}

Set-Content -Path $MainPath -Value $main -Encoding UTF8

# ============================================================
# 5. Пропатчить world.js — добавить getBlock как алиас (на всякий случай)
# ============================================================
Write-Host "`n[5/6] Патчинг world.js..." -ForegroundColor Cyan

$world = Get-Content -Path $WorldPath -Raw -Encoding UTF8

if ($world -match "export\s+function\s+getBlock") {
    Write-Host "  getBlock уже экспортирован — пропускаем" -ForegroundColor Yellow
} else {
    # Найти строку "export function blockAt(x, y, z) {" и добавить после неё getBlock
    if ($world -match "(export\s+function\s+blockAt\(x,\s*y,\s*z\)\s*\{)") {
        $getBlockAlias = "`n// Алиас для совместимости с ai_mobs.js`nexport function getBlock(x, y, z) { return blockAt(x, y, z); }`n"
        $world = $world -replace "(export\s+function\s+blockAt\(x,\s*y,\s*z\)\s*\{)", "`$1$getBlockAlias"
        Write-Host "  Добавлен export function getBlock()" -ForegroundColor Green
    } else {
        Write-Warning "  Не удалось найти blockAt. Добавь export function getBlock вручную."
    }
}

Set-Content -Path $WorldPath -Value $world -Encoding UTF8

# ============================================================
# 6. Проверка
# ============================================================
Write-Host "`n[6/6] Проверка файлов..." -ForegroundColor Cyan

$checks = @(
    @{ File = $ThreeFile; Name = "three.module.js" },
    @{ File = $UtilsFile; Name = "utils.js" },
    @{ File = $IndexPath; Name = "index.html" },
    @{ File = $MainPath;  Name = "main.js" },
    @{ File = $WorldPath; Name = "world.js" }
)

$allOk = $true
foreach ($c in $checks) {
    if (Test-Path $c.File) {
        $size = (Get-Item $c.File).Length
        Write-Host "  $($c.Name) — OK ($size байт)" -ForegroundColor Green
    } else {
        Write-Host "  $($c.Name) — НЕ НАЙДЕН!" -ForegroundColor Red
        $allOk = $false
    }
}

# ============================================================
# Готово!
# ============================================================
Write-Host "`n========================================" -ForegroundColor Green
if ($allOk) {
    Write-Host "  ВСЕ ФАЙЛЫ НА МЕСТЕ!" -ForegroundColor Green
} else {
    Write-Host "  ЧТО-ТО ПОШЛО НЕ ТАК" -ForegroundColor Red
}
Write-Host "`n  Перезапусти сервер:" -ForegroundColor White
Write-Host "  cd app" -ForegroundColor Yellow
Write-Host "  python -m http.server 8080" -ForegroundColor Yellow
Write-Host "  http://localhost:8080" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
