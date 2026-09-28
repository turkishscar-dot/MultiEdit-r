// Telefonda (claude.ai yayını ya da herhangi bir barındırma) açılacak web paketi:
// 1) vite build --config vite.web.config.js → dist-web/
// 2) Her .glb base64 metne çevrilir (.glb.txt): claude.ai yayını .glb türünü sunmuyor ve data:/blob: adreslerini
//    engelliyor. src/assets.js metni bellekte çözer, dokuları adres kullanmadan (createImageBitmap) yükler.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
execSync('npx vite build --config vite.web.config.js', { stdio: 'inherit' });
const dir = 'dist-web/assets';
const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let n = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  // GLB olduğu gibi base64 metne çevrilir (.glb.txt); src/assets.js loadModel bunu bellekte çözer
  const out = f + '.txt';
  fs.writeFileSync(path.join(dir, out), fs.readFileSync(path.join(dir, f)).toString('base64'));
  fs.unlinkSync(path.join(dir, f));
  for (const j of js) { const p = path.join(dir, j); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(f).join(out)); }
  n++;
}
const size = d => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`${n} model metne çevrildi · paket ${(size('dist-web') / 1e6).toFixed(1)} MB`);
