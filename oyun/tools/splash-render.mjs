// Splash art girdisi: her yiğidin vitrindeki 3B görüntüsü, düz açık zeminde, 16:9.
//   node tools/splash-render.mjs [yiğit...]   -> ai-kaynak/splash/<id>-girdi.png
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const DIR = 'ai-kaynak/splash'; mkdirSync(DIR, { recursive: true });
const W = 1280, H = 720;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: W, height: H } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
const argv = process.argv.slice(2);
const ids = argv.length ? argv : await p.evaluate(() => window.__game.Y.CARDS.map(c => c.id));
for (const id of ids) {
  await p.evaluate(id => window.__game.EK.openYigit(id), id);
  await p.waitForTimeout(500);
  await p.click('#ypbtns > button');
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = 'hidden';
    const bk = window.__game.book, h = bk.h, C = bk.scene.background.constructor;
    bk.hold = 1e9; bk.pedestal(false); for (const k of ['halo', 'flashS', 'motes']) if (bk[k]) bk[k].visible = false;
    bk.scene.background = new C(0xd8d4c8);
    bk.current.root.rotation.y = 0.4;
    const cam = bk.camera; cam.clearViewOffset(); cam.fov = 30; cam.aspect = 16 / 9;
    cam.position.set(0.55 * h, 0.6 * h, 2.4 * h); cam.lookAt(0, 0.47 * h, 0); cam.updateProjectionMatrix();
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${DIR}/${id}-girdi.png` });
  await p.evaluate(() => { for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = ''; window.__game.toMenu(); });
}
console.log(ids.length, 'görüntü; hata:', errs.length ? errs.slice(0, 3) : 'yok');
await b.close();
