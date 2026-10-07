@echo off
rem Masaustu uygulama olarak ac (ilk seferde oyunu derler). F11: tam ekran.
cd /d "%~dp0"
if not exist dist-web\index.html call npm run build:web
start "" "node_modules\electron\dist\electron.exe" .
