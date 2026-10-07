// Seslendirme listesi: oyundaki bütün anlatım cümlelerini ve dosya adlarını SESLENDIRME.md'ye yazar.
// Çalıştır: node tools/vo_list.mjs
import fs from 'node:fs';
import { PROLOG, levelIntro } from '../src/story.js';
import { voId } from '../src/cine.js';

const groups = [['Açılış hikâyesi (çizgi roman)', PROLOG]];
for (const lv of [1, 2, 3, 4, 5, 6, 7]) groups.push([`Bölüm ${lv} girişi`, levelIntro(lv)]);

let md = '';
let n = 0;
for (const [title, shots] of groups) {
  const lines = shots.filter(s => s.text);
  if (!lines.length) continue;
  md += `\n### ${title}\n\n| Dosya adı | Okunacak metin |\n|---|---|\n`;
  for (const s of lines) { md += `| \`${voId(s.text)}.mp3\` | ${s.text.replace(/\|/g, '/')} |\n`; n++; }
}
const doc = fs.readFileSync('tools/SESLENDIRME_sablon.md', 'utf8').replace('{{LISTE}}', md).replace('{{SAYI}}', n);
fs.writeFileSync('SESLENDIRME.md', doc);
console.log('SESLENDIRME.md yazıldı:', n, 'cümle');
