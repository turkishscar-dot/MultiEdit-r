@echo off
rem Chrome ve Edge'i Windows'ta "Yuksek performans" (RTX ekran karti) olarak isaretler. Yonetici gerekmez; oyunu kapatip tarayiciyi yeniden ac.
chcp 65001 >nul
for %%P in ("%~dp0node_modules\electron\dist\electron.exe" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe") do (
  if exist %%P (
    reg add "HKCU\Software\Microsoft\DirectX\UserGpuPreferences" /v %%P /t REG_SZ /d "GpuPreference=2;" /f >nul
    echo Yuksek performans yapildi: %%~P
  )
)
echo.
echo Tum tarayici pencerelerini kapatip yeniden ac. Dogrulama: chrome://gpu  ->  "GL_RENDERER" satirinda NVIDIA yazmali.
pause
