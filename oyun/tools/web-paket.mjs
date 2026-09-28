// Telefonda (claude.ai yayını ya da herhangi bir barındırma) açılacak web paketi:
// 1) vite build --config vite.web.config.js → dist-web/
// 2) Her .glb, gömülü veriyle .gltf JSON'a çevrilir (adı .json): bazı barındırmalar .glb türünü sunmuyor.
//    GLTFLoader içeriğe bakarak ikisini de okur; kod değişmez, yalnız paketteki dosya adları değişir.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
execSync('npx vite build --config vite.web.config.js', { stdio: 'inherit' });
const dir = 'dist-web/assets';
const js = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let n = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  const b = fs.readFileSync(path.join(dir, f));
  let off = 12, json = null, bin = null;
  while (off < b.length) {
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    const chunk = b.subarray(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(chunk.toString('utf8'));
    else if (type === 0x004E4942) bin = chunk;
    off += 8 + len;
  }
  if (bin) json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
  const out = f.replace(/\.glb$/, '.gltf.json');
  fs.writeFileSync(path.join(dir, out), JSON.stringify(json));
  fs.unlinkSync(path.join(dir, f));
  for (const j of js) { const p = path.join(dir, j); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(f).join(out)); }
  n++;
}
const size = d => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`${n} model JSON'a çevrildi · paket ${(size('dist-web') / 1e6).toFixed(1)} MB`);
