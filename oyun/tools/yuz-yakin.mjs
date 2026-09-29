// Yiğidin yüzü yakından (sakal, saç rengi kontrolü). node tools/yuz-yakin.mjs [id...] -> test-out/yuz-<id>.png
import { chromium } from 'playwright';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['tonyukuk', 'hizir'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 640 } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
for (const id of ids) {
  await p.evaluate(id => window.__game.EK.openYigit(id), id);
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = 'hidden';
    const bk = window.__game.book, C = bk.scene.background.constructor; bk.hold = 1e9; bk.pedestal(false); bk.scene.background = new C(0xd8d4c8);
    const a = bk.current, V = a.root.position.constructor, v = new V(); a.root.updateMatrixWorld(true);
    a.root.getObjectByName('Head').getWorldPosition(v);
    a.root.rotation.y = 0.0;
    const cam = bk.camera; cam.clearViewOffset(); cam.fov = 20; cam.aspect = 1; cam.position.set(0.1, v.y + 0.02, v.z + 1.05); cam.lookAt(0, v.y - 0.03, v.z); cam.updateProjectionMatrix();
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `test-out/yuz-${id}.png` });
  await p.evaluate(() => { for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = ''; window.__game.toMenu(); });
}
await b.close();
