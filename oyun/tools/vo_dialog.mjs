// Diyalog cümlelerini SESLENDIRME.md'ye ekler (dosya adları cine.js'teki voId ile aynı kuralla üretilir).
// Kullanım: node tools/vo_dialog.mjs   (bölüm varsa yeniden yazar)
import fs from 'node:fs';
import { SPEAKERS, DIALOGS } from '../src/diyalog-metin.js';

const voId = text => { let h = 5381; for (const ch of text) h = (h * 33 + ch.codePointAt(0)) >>> 0; return h.toString(36); }; // cine.js ile aynı
const START = '<!-- diyaloglar:başla -->', END = '<!-- diyaloglar:bitir -->';
const title = k => (k.startsWith('son:') ? `${k.slice(4)}. bölüm sonu` : `${k.split('-')[0]}. bölüm, ${+k.split('-')[1] + 1}. kısım`);
let md = `${START}\n## 5. Görev diyalogları (${Object.values(DIALOGS).flat().length} cümle)\n\n`;
md += 'Konuşanlar farklı seslerle okunmalı: **Uluğ Türük** yaşlı, bilge, sakin (anlatıcı sesine yakın ama daha yumuşak); **Oğuz** genç, kararlı erkek sesi; kötüler (Tepegöz, Erlik, Kerey Han, Matman, Yelbegen, General, Pehlivan) kalın ve alaycı, **Albastı** fısıltılı kadın sesi. Dosyalar aynı `vo/` klasörüne gider.\n\n';
for (const [k, lines] of Object.entries(DIALOGS)) {
  md += `### ${title(k)}\n\n| Dosya adı | Konuşan | Okunacak metin |\n|---|---|---|\n`;
  for (const [sp, t] of lines) md += `| \`${voId(t)}.mp3\` | ${SPEAKERS[sp].name} | ${t} |\n`;
  md += '\n';
}
md += END + '\n';
const f = 'SESLENDIRME.md';
let s = fs.readFileSync(f, 'utf8');
s = s.includes(START) ? s.replace(new RegExp(START + '[\\s\\S]*' + END + '\\n?'), md) : s.trimEnd() + '\n\n' + md;
fs.writeFileSync(f, s);
console.log('eklendi:', Object.values(DIALOGS).flat().length, 'cümle');
