// Boyalı ayrıntı için Oğuz gövdesinin T duruşunda önden/arkadan görüntüsü (başlıksız, silahsız, kostüm parçasız).
// node tools/boya-render.mjs -> ai-kaynak/boya/{on,arka}-{isik,duz}.png + cerceve.json
//   isik: oyundaki ışıkla (yapay zekâya girdi), duz: ışıksız düz renk (oran hesabı için, arka plan eflatun = maske)
// Kamera neredeyse dik izdüşüm (dar açı, uzak): piksel <-> model koordinatı cerceve.json'daki çerçeveyle eşlenir.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
const DIR = 'ai-kaynak/boya'; mkdirSync(DIR, { recursive: true });
const N = 1024;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: N, height: N } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); window.__game.EK.openYigit('oguz'); });
await p.waitForTimeout(600); await p.click('#ypbtns > button'); await p.waitForTimeout(1500);
await p.evaluate(() => { for (const e of document.querySelectorAll('#yigit, .yv, .yvnav, .yvacts, #ypbtns')) e.style.visibility = 'hidden'; document.body.style.background = 'transparent'; });
const cerceve = await p.evaluate(() => {
  const g = window.__game, bk = g.book, a = bk.current;
  bk.pedestal(false); for (const k of ['halo', 'flashS', 'motes']) if (bk[k]) bk[k].visible = false;
  bk.hold = 1e9; a.mixer.stopAllAction(); a.mixer.timeScale = 0;
  a.root.position.set(0, 0, 0); a.root.scale.setScalar(1); a.root.rotation.set(0, 0, 0);
  for (const o of Object.values(a.parts)) o.visible = false;
  a.root.traverse(o => { if (o.name === 'Hair_Beard') o.visible = false; if (o.isSkinnedMesh) o.skeleton.pose(); });
  a.root.updateMatrixWorld(true);
  const V = a.root.position.constructor, mn = new V(1e9, 1e9, 1e9), mx = new V(-1e9, -1e9, -1e9), v = new V();
  a.root.traverse(o => { if (!o.isSkinnedMesh || !o.visible) return; const ps = o.geometry.attributes.position; for (let i = 0; i < ps.count; i += 3) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); mn.min(v); mx.max(v); } });
  const cx = (mn.x + mx.x) / 2, cy = (mn.y + mx.y) / 2, H = Math.max(mx.x - mn.x, mx.y - mn.y) * 1.04;
  const cam = bk.camera; cam.fov = 3; cam.aspect = 1; cam.clearViewOffset(); cam.near = 1; cam.far = 200;
  const d = (H / 2) / Math.tan((cam.fov / 2) * Math.PI / 180);
  window.__boya = { cx, cy, H, d };
  return { cx, cy, H, zmin: mn.z, zmax: mx.z };
});
writeFileSync(`${DIR}/cerceve.json`, JSON.stringify(cerceve));
for (const [yon, ry] of [['on', 0], ['arka', Math.PI]]) {
  for (const tur of ['isik', 'duz']) {
    await p.evaluate(([ry, tur]) => {
      const g = window.__game, bk = g.book, a = bk.current, { cx, cy, H, d } = window.__boya, A = g.AYR;
      a.root.rotation.y = ry; a.root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.pose(); });
      const cam = bk.camera; cam.position.set(cx, cy, d); cam.lookAt(cx, cy, 0); cam.updateProjectionMatrix();
      const C = bk.scene.background.constructor;
      if (tur === 'duz') {
        bk.scene.background = new C(0xff00ff); A.detay.value = A.parlak.value = A.ao.value = 0;
        bk.scene.traverse(l => { if (l.isLight) { l.userData.i ??= l.intensity; l.intensity = 0; } });
        a.root.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { m.userData.em ??= [m.emissive?.getHex(), m.emissiveMap]; if (m.emissive) { m.emissive.copy(m.color); m.emissiveMap = m.map; m.needsUpdate = true; } } });
      } else {
        bk.scene.background = new C(0xffffff); A.detay.value = 0; A.parlak.value = 1; A.ao.value = 0.75;
        bk.scene.traverse(l => { if (l.isLight && l.userData.i != null) l.intensity = l.userData.i; });
        a.root.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m.userData.em && m.emissive) { m.emissive.setHex(m.userData.em[0]); m.emissiveMap = m.userData.em[1]; m.needsUpdate = true; } });
      }
    }, [ry, tur]);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${DIR}/${yon}-${tur}.png` });
  }
}
console.log(JSON.stringify(cerceve));
await b.close();
