// Kartal modeli ekran görüntüleri: vitrinde üç açı + kartal bölümü + boss
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 700, height: 500 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
for (const [n, ry, rx] of [['yan', Math.PI / 2, 0], ['ust', 0.4, 1.1], ['on', 0, 0.25]]) {
  await p.evaluate(([ry, rx]) => {
    const g = window.__game, bk = g.book;
    g.toMenu(); g.EK.openYigit('oguz'); document.getElementById('yigit').style.visibility = 'hidden';
    bk.pedestal(false); bk.setRank(null); bk.show({ id: 'karakus', model: 'karakus', scale: 1.4, h: 1.6 });
    bk.resize(innerWidth, innerHeight, { left: 0, top: 0, width: innerWidth, height: innerHeight });
    bk.hold = 1e9; bk.current.root.rotation.set(rx, ry, 0); bk.current.root.position.y = 0.8;
    bk.camera.position.set(0, 1.6, 5.2); bk.camera.lookAt(0, 0.8, 0); bk.camera.updateProjectionMatrix();
    g.tick(0.001);
  }, [ry, rx]);
  await p.screenshot({ path: `test-out/kartal-${n}.png` });
}
await p.setViewportSize({ width: 960, height: 540 });
await p.evaluate(() => { const g = window.__game; localStorage.setItem('oguz-test', '1'); document.getElementById('yigit').hidden = true; g.start('level', 1, true); g.frozen = true; for (let i = 0; i < 60; i++) g.tick(1 / 30); g.startSect('kartal'); for (let i = 0; i < 60; i++) { g.P.inv = 0; g.tick(1 / 30); } });
await p.screenshot({ path: 'test-out/kartal-bolum.png' });
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
