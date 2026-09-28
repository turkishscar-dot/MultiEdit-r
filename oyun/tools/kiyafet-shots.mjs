// Kostüm parçaları vitrinde: her yiğit önden ve arkadan. node tools/kiyafet-shots.mjs [yiğit...] -> test-out/kiyafet.png
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
const YAKIN = process.argv.includes('--yakin'), argv = process.argv.slice(2).filter(a => a !== '--yakin');
const ids = argv.length ? argv : ['bilge', 'kultigin', 'fatih', 'geyiksaman', 'tonyukuk', 'tomris', 'gokhan', 'daghan'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 520, height: 640 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
const yollar = [];
for (const id of ids) {
  await p.evaluate(id => window.__game.EK.openYigit(id), id);
  await p.waitForTimeout(500);
  await p.click('#ypbtns > button');
  await p.waitForTimeout(1500);
  for (const [n, ry] of [['on', 0.35], ['arka', Math.PI + 0.45]]) {
    await p.evaluate(([ry, yakin]) => { const bk = window.__game.book; bk.hold = 1e9; bk.current.root.rotation.y = ry;
      if (yakin) { const h = bk.h; bk.camera.clearViewOffset(); bk.camera.position.set(0.1 * h, h * 0.62, h * 1.05); bk.camera.lookAt(0, h * 0.52, 0); bk.camera.updateProjectionMatrix(); } }, [ry, YAKIN]);
    await p.waitForTimeout(500);
    const yol = `test-out/ks-${id}-${n}.png`; await p.screenshot({ path: yol, clip: YAKIN ? { x: 0, y: 40, width: 520, height: 560 } : { x: 60, y: 90, width: 400, height: 420 } }); yollar.push(yol);
  }
  await p.keyboard.press('Escape'); await p.evaluate(() => window.__game.toMenu());
}
execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw
ys=${JSON.stringify(yollar)}; ids=${JSON.stringify(ids)}
ims=[Image.open(y).convert('RGB').resize((260,273)) for y in ys]
cols=4; rows=(len(ims)+cols-1)//cols
o=Image.new('RGB',(cols*262,rows*290),'white')
for i,im in enumerate(ims):
    x,y=(i%cols)*262,(i//cols)*290; o.paste(im,(x,16+y)); ImageDraw.Draw(o).text((x+4,y+2), ids[i//2]+(' on' if i%2==0 else ' arka'), fill='black')
o.save('test-out/kiyafet${YAKIN ? '-yakin' : ''}.png')`]);
console.log('hata:', errs.length ? errs.slice(0, 4) : 'yok');
await b.close();
