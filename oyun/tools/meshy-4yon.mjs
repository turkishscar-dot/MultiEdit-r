// Meshy'ye verilecek 4 yönlü T-poz görüntüleri: ön, sağ, arka, sol (karakterin kendi sağı/solu).
//   node tools/meshy-4yon.mjs <yiğit...>   -> ai-kaynak/meshy/<id>/{on,sag,arka,sol}.png   (1024x1024, düz açık gri zemin)
// Pelerin / sırt örgüsü / saçak gizlenir (oyunda ayrı parça olarak eklenir). Kılıç kında, yay sırtta, ok kirişte değil.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const N = 1024, ids = process.argv.slice(2);
if (!ids.length) { console.log('kullanım: node tools/meshy-4yon.mjs altin mete ...'); process.exit(1); }
const YON = { on: 0, sag: Math.PI / 2, arka: Math.PI, sol: -Math.PI / 2 };
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: N, height: N } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
for (const id of ids) {
  const dir = `ai-kaynak/meshy/${id}`; mkdirSync(dir, { recursive: true });
  await p.evaluate(id => window.__game.EK.openYigit(id), id);
  await p.waitForTimeout(600); await p.click('#ypbtns > button'); await p.waitForTimeout(2500);
  await p.evaluate(() => {
    for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = 'hidden';
    const bk = window.__game.book, a = bk.current, C = bk.scene.background.constructor;
    bk.pedestal(false); for (const k of ['halo', 'flashS', 'motes']) if (bk[k]) bk[k].visible = false;
    bk.hold = 1e9; a.mixer.stopAllAction(); a.mixer.timeScale = 0;
    bk.scene.background = new C(0xe4e2dc);
    const P = a.parts; // silah düzeni: kılıç kında, yay sırtta
    P.SwordHand.visible = false; P.SwordSheath.visible = true; P.BowHand.visible = false; P.ArrowNock.visible = false; P.BowBack.visible = true;
    a.root.scale.setScalar(1); a.root.rotation.set(0, 0, 0); a.root.position.set(0, 0, 0);
    a.root.traverse(o => { if (o.name?.includes('_Sway') || o.name?.startsWith('orgu_') || o.name?.startsWith('Piv')) o.visible = false; if (o.isSkinnedMesh) o.skeleton.pose(); });
    // Kalpak'ın siyah kıvrık kenarları şapkadan kopuk durur (alnın üstünde kara bant gibi): Meshy kopyalamasın
    a.root.traverse(o => { if (o.isMesh && a.parts.Kalpak && a.parts.Kalpak.getObjectById(o.id) && (Array.isArray(o.material) ? o.material[0] : o.material).name === 'M_Black') o.visible = false; });
    a.root.updateMatrixWorld(true);
    const V = a.root.position.constructor, mn = new V(1e9, 1e9, 1e9), mx = new V(-1e9, -1e9, -1e9), v = new V();
    a.root.traverse(o => { if (!o.isSkinnedMesh || !o.visible) return; const ps = o.geometry.attributes.position; for (let i = 0; i < ps.count; i += 3) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); mn.min(v); mx.max(v); } });
    const cx = (mn.x + mx.x) / 2, H0 = Math.max(mx.x - mn.x, mx.y - mn.y), cy = (mn.y + mx.y) / 2 + 0.05 * H0, H = H0 * 1.22;
    const cam = bk.camera; cam.clearViewOffset(); cam.fov = 10; cam.aspect = 1; cam.near = 1; cam.far = 300;
    const d = (H / 2) / Math.tan((cam.fov / 2) * Math.PI / 180);
    cam.position.set(cx, cy, d); cam.lookAt(cx, cy, 0); cam.updateProjectionMatrix();
    window.__merkez = [cx, cy];
  });
  for (const [ad, ry] of Object.entries(YON)) {
    await p.evaluate(ry => { const a = window.__game.book.current; a.root.rotation.y = ry; a.root.updateMatrixWorld(true); }, ry);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${dir}/${ad}.png` });
  }
  await p.evaluate(() => { for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = ''; window.__game.toMenu(); });
  console.log('tamam', id);
}
await b.close();
