// Animasyon kontrol sayfası: her klibin 6 karesi yan yana. node tools/anim-sheet.mjs çıktı ad1 ad2 ...
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
const [out, ...clips] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 360, height: 400 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => {
  const g = window.__game, { book } = g;
  g.toMenu(); g.EK.openYigit('oguz');
  document.getElementById('yigit').style.visibility = 'hidden';
  book.resize(innerWidth, innerHeight, { left: 0, top: 0, width: innerWidth, height: innerHeight });
  book.setRank(null); book.pedestal(false); book.hold = 1e9;
  const a = book.actors.oguz;
  a.parts.SwordHand.visible = true; a.parts.SwordSheath.visible = false;
});
const files = [];
for (const c of clips) {
  for (let k = 0; k < 6; k++) {
    await p.evaluate(([c, k]) => {
      const g = window.__game, a = g.book.actors.oguz;
      g.book.resize(innerWidth, innerHeight, { left: 0, top: 0, width: innerWidth, height: innerHeight });
      g.book.pedestal(false); g.book.frame();
      a.mixer.stopAllAction(); a.current = null; a.upper = null;
      a.play(c, { loop: true, fade: 0 });
      a.mixer.setTime(a.duration(c) * k / 6);
      a.root.rotation.set(0, [Math.PI * 0.8, Math.PI / 2][k % 2], 0);
      g.tick(0.0001);
    }, [c, k]);
    const f = `/tmp/claude-0/as-${files.length}.png`;
    await p.screenshot({ path: f });
    files.push(f);
  }
}
await b.close();
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[1:-2]; n=int(sys.argv[-2]); out=sys.argv[-1]
names=${JSON.stringify(clips)}
ims=[Image.open(f).resize((180,200)) for f in fs]
W=Image.new('RGB',(180*6,200*n),'white')
d=ImageDraw.Draw(W)
for i,im in enumerate(ims): W.paste(im,((i%6)*180,(i//6)*200))
for r,nm in enumerate(names): d.text((4,r*200+4),nm,fill=(200,0,0))
W.save(out)`, ...files, String(clips.length), out]);
console.log('ok', out);
