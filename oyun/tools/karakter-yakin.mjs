// Karakter ayrıntısı önce/sonra: vitrinde yiğit, ayrıntılar kapalı ve açık. node tools/karakter-yakin.mjs [yiğit...]
// Çıktı: test-out/yakin-<yiğit>.png (solda önce, sağda sonra; üstte tüm boy, altta yakın)
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
const BOYA = process.argv.includes('--boya'), ids0 = process.argv.slice(2).filter(a => a !== '--boya');
const ids = ids0.length ? ids0 : ['oguz'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1.5 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.unlockAll?.(); window.__game.toMenu(); });
for (const id of ids) {
  const model = id.startsWith('model:') ? id.slice(6) : null;
  await p.evaluate(id => { window.__game.EK.openYigit(id); }, model ? 'oguz' : id);
  await p.waitForTimeout(600);
  await p.click('#ypbtns > button');
  await p.waitForTimeout(1800);
  if (model) { // düşman/boss: vitrine doğrudan model koy
    await p.evaluate(m => { const bk = window.__game.book; bk.show({ id: m, model: m, scale: 1, h: 2 }); bk.resize(innerWidth, innerHeight, { left: 0, top: 0, width: innerWidth, height: innerHeight }); }, model);
    await p.waitForTimeout(1500);
  }
  const cek = async (ac, ad, yakin) => {
    await p.evaluate(([ac, yakin, process_boya]) => {
      const g = window.__game, A = g.AYR, bk = g.book;
      if (process_boya) { A.detay.value = A.parlak.value = 1; A.ao.value = 0.75; A.boya.value = ac ? 1 : 0; } else { A.detay.value = A.parlak.value = ac ? 1 : 0; A.ao.value = ac ? 0.75 : 0; A.boya.value = ac ? 0.7 : 0; }
      bk.hold = 1e9; bk.current.root.rotation.y = 0.55;
      if (yakin) { const h = bk.h; bk.camera.clearViewOffset(); bk.camera.position.set(0.18 * h, h * 0.78, h * 0.85); bk.camera.lookAt(0, h * 0.68, 0); bk.camera.updateProjectionMatrix(); }
    }, [ac, yakin, BOYA]);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `test-out/yk-${ad}${yakin ? 'z' : ''}.png` });
  };
  await cek(false, 'once', false); await cek(true, 'sonra', false); await cek(false, 'once', true); await cek(true, 'sonra', true);
  execFileSync('python3', ['-c', `
from PIL import Image
a=Image.open('test-out/yk-once.png').convert('RGB'); b=Image.open('test-out/yk-sonra.png').convert('RGB')
W,H=a.size; za=Image.open('test-out/yk-oncez.png').convert('RGB'); zb=Image.open('test-out/yk-sonraz.png').convert('RGB')
o=Image.new('RGB',(W*2+10,H*2+10),'white'); o.paste(a,(0,0)); o.paste(b,(W+10,0)); o.paste(za,(0,H+10)); o.paste(zb,(W+10,H+10))
o.resize((o.width//2,o.height//2)).save('test-out/yakin-${id.replace(':', '-')}.png')`]);
  await p.keyboard.press('Escape'); await p.evaluate(() => window.__game.toMenu());
  console.log('yiğit', id);
}
console.log('hata:', errs.length ? errs.slice(0, 4) : 'yok');
await b.close();
