@echo off
REM ============================================================
REM  download-three.bat — скачивает Three.js r128 локально.
REM  Запусти ОДИН РАЗ перед сборкой APK (перед npx cap sync),
REM  чтобы игра работала в APK без интернета.
REM  Файл попадёт в app\www\js\three.min.js (~600 КБ).
REM  Закоммить его в git — тогда и GitHub Pages будет
REM  работать даже при заблокированном CDN.
REM ============================================================
echo Skachivayu three.min.js...
curl -L -o app\www\js\three.min.js https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js
if %errorlevel% neq 0 (
  echo Oshibka skachivaniya! Poprobuj: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
  curl -L -o app\www\js\three.min.js https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
)
echo.
echo Gotovo! Teper:
echo   1. git add app/www/js/three.min.js
echo   2. git commit -m "Add local three.min.js"
echo   3. git push
echo   4. cd app ^&^& npx cap sync ^&^& (sobiraem APK kak obychno)
pause
