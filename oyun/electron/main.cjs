// Masaüstü kabuğu: dist-web/ klasörünü oyun:// adresinden sunar (file:// modül betiklerine izin vermez) ve ekran kartını zorlar.
const { app, BrowserWindow, protocol, net, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Ekran kartı: dizüstünde Intel yerine RTX seçilsin (Windows Grafik ayarı da gerekir: GPU-AYARLA.bat)
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('use-angle', 'd3d11');
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const KOK = path.join(__dirname, '..', 'dist-web');
protocol.registerSchemesAsPrivileged([{ scheme: 'oyun', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

app.whenReady().then(() => {
  protocol.handle('oyun', req => {
    let yol = decodeURIComponent(new URL(req.url).pathname);
    if (yol === '/' || yol === '') yol = '/index.html';
    const dosya = path.normalize(path.join(KOK, yol));
    if (!dosya.startsWith(KOK)) return new Response('yasak', { status: 403 });
    return net.fetch(pathToFileURL(dosya).toString());
  });
  const pencere = new BrowserWindow({ width: 1280, height: 720, backgroundColor: '#000', autoHideMenuBar: true, title: 'Oğuz Kağan', webPreferences: { backgroundThrottling: false } });
  pencere.loadURL('oyun://yerel/');
  pencere.webContents.on('before-input-event', (_, k) => { // F11: tam ekran, F12: geliştirici araçları
    if (k.type !== 'keyDown') return;
    if (k.key === 'F11') pencere.setFullScreen(!pencere.isFullScreen());
    if (k.key === 'F12') pencere.webContents.toggleDevTools();
  });
  if (process.env.OYUN_GPU_RAPOR) pencere.webContents.on('did-finish-load', async () => { // doğrulama: hangi ekran kartı kullanılıyor
    const gl = await pencere.webContents.executeJavaScript("(()=>{const g=document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance'});const e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL)})()");
    require('node:fs').writeFileSync(process.env.OYUN_GPU_RAPOR, gl);
  });
});
app.on('window-all-closed', () => app.quit());
