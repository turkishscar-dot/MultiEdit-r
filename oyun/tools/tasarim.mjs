// Tasarım kitapçığı: Destan Kitabı'ndaki her karakterin oyun içi (toon) çizimleri + mitolojik kaynak ve oyundaki güçleri.
// Görseller video/tasarim/<id>_a.jpg, <id>_b.jpg (oyunda __game.captureDesign() ile çekilir). Çıktı: video/tasarim.html
import fs from 'node:fs';
import { BOOK } from '../src/story.js';

const ROLE = {
  oguz: 'Kahraman', kurt: 'Yoldaş', at: 'Yoldaş', tulpar: 'Yoldaş', geyik: 'Yoldaş',
  tepegoz: 'Boss · 1. bölüm', albasti: 'Boss · 2. bölüm', yelbegen: 'Boss · 3. bölüm', karakus: 'Boss · 4. bölüm',
  kerey: 'Boss · 5. bölüm, 1. kat', demirhane: 'Boss · 5. bölüm, 2. kat', erlik: 'Boss · 5. bölüm, 3. kat',
  cin: 'Boss · 6. bölüm', boyali: 'Boss · 7. bölüm',
};
const img = f => fs.existsSync(f) ? 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64') : '';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const cards = BOOK.map(e => {
  const a = img(`video/tasarim/${e.id}_a.jpg`), b = img(`video/tasarim/${e.id}_b.jpg`);
  const role = ROLE[e.id] || 'Düşman';
  return `<article class="sheet ${role.startsWith('Boss') ? 'boss' : role === 'Düşman' ? 'foe' : 'ally'}">
  <div class="views">${a ? `<img src="${a}" alt="${esc(e.name)} önden">` : ''}${b ? `<img src="${b}" alt="${esc(e.name)} yandan">` : ''}</div>
  <div class="copy"><span class="role">${role}</span><h2>${esc(e.name)}</h2><p class="epi">${esc(e.title)}</p><p>${esc(e.text)}</p></div>
</article>`;
}).join('\n');
const tpl = fs.readFileSync('tools/tasarim_sablon.html', 'utf8');
fs.writeFileSync('video/tasarim.html', tpl.replace('{{KARTLAR}}', cards).replace('{{SAYI}}', BOOK.length));
console.log('video/tasarim.html', BOOK.length, 'karakter');
