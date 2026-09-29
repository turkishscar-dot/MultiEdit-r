// Meshy (görselden 3B) için yiğidin T-pozunda önden görüntüsü: kostüm parçaları açık, sallanan parçalar (pelerin, örgü) gizli.
//   node tools/meshy-referans.mjs [yiğit...]  -> ai-kaynak/meshy/<id>-girdi.png
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const DIR = 'ai-kaynak/meshy'; mkdirSync(DIR, { recursive: true });
const N = 1024;
const ids = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: N, height: N } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
for (const id of ids) {
  await p.evaluate(id => window.__game.EK.openYigit(id), id);
  await p.waitForTimeout(600); await p.click('#ypbtns > button'); await p.waitForTimeout(2500);
  await p.evaluate(() => {
    for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = 'hidden';
    const bk = window.__game.book, a = bk.current, C = bk.scene.background.constructor;
    bk.pedestal(false); for (const k of ['halo', 'flashS', 'motes']) if (bk[k]) bk[k].visible = false;
    bk.hold = 1e9; a.mixer.stopAllAction(); a.mixer.timeScale = 0;
    bk.scene.background = new C(0xe4e2dc);
    a.root.position.set(0, 0, 0); a.root.scale.setScalar(1); a.root.rotation.set(0, 0, 0);
    a.root.traverse(o => { if (o.name?.includes('_Sway') || o.name?.startsWith('orgu_')) o.visible = false; if (o.isSkinnedMesh) o.skeleton.pose(); });
    a.root.updateMatrixWorld(true);
    const V = a.root.position.constructor, mn = new V(1e9, 1e9, 1e9), mx = new V(-1e9, -1e9, -1e9), v = new V();
    a.root.traverse(o => { if (!o.isSkinnedMesh || !o.visible) return; const ps = o.geometry.attributes.position; for (let i = 0; i < ps.count; i += 3) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); mn.min(v); mx.max(v); } });
    const cx = (mn.x + mx.x) / 2, H0 = Math.max(mx.x - mn.x, mx.y - mn.y), cy = (mn.y + mx.y) / 2 + 0.05 * H0, H = H0 * 1.22;  // başlıklar iskeletli değil: üstte pay
    const cam = bk.camera; cam.clearViewOffset(); cam.fov = 10; cam.aspect = 1; cam.near = 1; cam.far = 300;
    const d = (H / 2) / Math.tan((cam.fov / 2) * Math.PI / 180);
    cam.position.set(cx, cy, d); cam.lookAt(cx, cy, 0); cam.updateProjectionMatrix();
  });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${DIR}/${id}-girdi.png` });
  await p.evaluate(() => { for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = ''; window.__game.toMenu(); });
}
await b.close();
