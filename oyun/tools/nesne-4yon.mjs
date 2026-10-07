// Oyundaki HER nesnenin 4 yönlü (ön, sağ, arka, sol) referans görüntüleri; zemin/bölüm parçaları için ek olarak üst görünüş.
//   node tools/nesne-4yon.mjs              -> hepsi
//   node tools/nesne-4yon.mjs engel kut    -> adı ya da kategorisi bunlardan birini içerenler
// Çıktı: ai-kaynak/nesneler/<kategori>/<id>/{on,sag,arka,sol[,ust]}.png (1024x1024, düz açık gri zemin) + ai-kaynak/nesneler/liste.json
// Önce `npx vite --port 5173` çalışıyor olmalı; CHROME ortam değişkeni Chrome yolunu gösterir.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const N = 1024, filtre = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 640, height: 480 } });
const hatalar = []; p.on('pageerror', e => hatalar.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 240000 });
await p.evaluate(N => {
  const G = window.__game, { THREE, W, DEF, FOE, THEMES, A, Actor } = G;
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  r.setPixelRatio(1); r.setSize(N, N); r.setClearColor(0xe4e2dc);
  r.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe4e2dc);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9488, 1.6));
  const cam = new THREE.PerspectiveCamera(10, 1, 1, 4000);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2); scene.add(sun, sun.target);
  const YON = { on: 0, sag: Math.PI / 2, arka: Math.PI, sol: -Math.PI / 2 };
  const kutu = o => new THREE.Box3().setFromObject(o, true);
  function kare(o, ry, ust) {
    const pivot = new THREE.Group(); pivot.add(o); scene.add(pivot);
    o.traverse(c => { c.frustumCulled = false; });
    pivot.rotation.set(0, ry, 0); pivot.updateMatrixWorld(true);
    let bx = kutu(pivot), c = bx.getCenter(new THREE.Vector3()), s = bx.getSize(new THREE.Vector3());
    const H = Math.max(ust ? s.x : s.x, ust ? s.z : s.y) * 1.2 || 1;
    const d = (H / 2) / Math.tan(5 * Math.PI / 180);
    if (ust) { cam.position.set(c.x, c.y + d, c.z + 0.001); cam.up.set(0, 0, -1); } else { cam.position.set(c.x, c.y, c.z + d); cam.up.set(0, 1, 0); }
    cam.lookAt(c); cam.updateProjectionMatrix();
    sun.position.copy(cam.position).add(new THREE.Vector3(d * 0.3, d * 0.5, d * 0.2)); sun.target.position.copy(c);
    r.render(scene, cam);
    const url = r.domElement.toDataURL('image/png');
    pivot.remove(o); scene.remove(pivot);
    return url;
  }
  const hepsi = [], gor = (kat, id, yap, ust = false) => hepsi.push({ kat, id, yap, ust });
  const duz = o => { o.traverse(c => { if (c.isSkinnedMesh) c.skeleton.pose(); }); return o; };
  const aktor = (model, parcalar) => () => { const a = new Actor(A, model); a.root.updateMatrixWorld(true); if (parcalar) { for (const k of Object.keys(a.parts)) if (/^(Axe|Dao|Shield2?|Spear|Mace|Sword\w*|Bow\w*)$/.test(k)) a.parts[k].visible = parcalar.includes(k === 'Dao' ? 'Axe' : k) || parcalar.includes(k); } return duz(a.root); };

  // 1) engeller, eşyalar, koşu nesneleri (DEF)
  const DEFSET = new Set();
  for (const [k, d] of Object.entries(DEF)) {
    if (d.make) { DEFSET.add(d.make); gor(/^(barricade|cart|crates|rope|beam|boulder|spear|stump|boat|vine|log|snowrock|sled|fence|pine|bones|cage|lavarock|spikes|chain|jars|supply|lowgate|bannerbeam|caltrop|bolt|kaya|ice|wave|shock|pillar|cloud|feather|buzkule|ledge|roots|kutuk|rrock|girdap|catlak)$/.test(k) ? 'engel' : 'esya', k, () => d.make()); }
    else if (d.deer) gor('dusman', 'geyik', aktor('stag'));
    else if (d.beam) { gor('esya', k, () => W.makeIsin(0x66ccff, !!d.thick, 1)); }
  }
  // 2) world.js'teki geri kalan her makeXxx (parametresiz)
  const OZEL = new Set(['makeSegment', 'makeTerrain', 'makePit', 'makeMarker', 'makeActIcon', 'makeIsin', 'makeChips', 'makeSky']);
  for (const [k, f] of Object.entries(W)) if (/^make[A-Z]/.test(k) && typeof f === 'function' && !DEFSET.has(f) && !OZEL.has(k)) gor('esya', k.replace(/^make/, '').toLowerCase(), () => f());
  gor('esya', 'bayrak_500', () => W.makeMarker('500 METRE')); gor('esya', 'bayrak_rekor', () => W.makeMarker('REKOR', true));
  gor('esya', 'kirinti', () => W.makeChips(8));
  gor('esya', 'ikon_kay', () => W.makeActIcon('kay')); gor('esya', 'ikon_zipla', () => W.makeActIcon('zipla'));
  gor('esya', 'kus', () => G.makeBird()); gor('esya', 'kurt_cagrisi', () => G.makeWolfToken());
  gor('gok', 'gokyuzu', () => W.makeSky());
  // 3) bölüm parçaları (30 m'lik yol + çevre) ve zemin
  for (const th of Object.keys(THEMES)) gor('bolum', th, () => W.makeSegment(th), true);
  for (const st of ['sur', 'tahta', 'kar', 'kaya', 'bazalt']) {
    gor('zemin', 'rampa_' + st, () => W.makeTerrain(st, 12, 0, 3), true);
    gor('zemin', 'plato_' + st, () => W.makeTerrain(st, 12, 3, 3), true);
    gor('zemin', 'cukur_' + st, () => W.makePit(st, 12, 0), true);
  }
  // 4) çevre modelleri: ağaç, çalı, kule, sur, kale ...
  for (const [ad, o] of Object.entries(A.env)) gor('cevre', ad, () => o.clone(true));
  // 5) karakterler: tüm modeller (T-poz), düşman türleri, boss'lar
  for (const k of Object.keys(A.templates)) gor('model', k, aktor(k));
  for (const [k, f] of Object.entries(FOE)) gor('dusman', k, aktor(f.model || 'kormos', f.parts));
  for (const [k, d] of Object.entries(G.BOSSES_DEF)) if (d.model) gor('boss', k, aktor(d.model, d.parts || []));
  G.__ref = { hepsi, kare, YON };
}, N);
const liste = await p.evaluate(() => window.__game.__ref.hepsi.map(h => ({ kat: h.kat, id: h.id, ust: h.ust })));
const sec = liste.filter(h => !filtre.length || filtre.some(f => h.kat.includes(f) || h.id.includes(f)));
console.log(`toplam ${liste.length} nesne, işlenecek ${sec.length}`);
const sonuc = [], bozuk = [];
for (const h of sec) {
  const dir = `ai-kaynak/nesneler/${h.kat}/${h.id}`; mkdirSync(dir, { recursive: true });
  try {
    const yonler = await p.evaluate(({ kat, id }) => {
      const R = window.__game.__ref, h = R.hepsi.find(x => x.kat === kat && x.id === id), cikti = {};
      for (const [ad, ry] of Object.entries(R.YON)) cikti[ad] = R.kare(h.yap(), ry, false);
      if (h.ust) cikti.ust = R.kare(h.yap(), 0, true);
      return cikti;
    }, h);
    for (const [ad, url] of Object.entries(yonler)) writeFileSync(`${dir}/${ad}.png`, Buffer.from(url.split(',')[1], 'base64'));
    sonuc.push(h);
  } catch (e) { bozuk.push({ ...h, hata: String(e.message).slice(0, 120) }); console.log('HATA', h.kat, h.id, String(e.message).slice(0, 100)); }
}
if (!filtre.length) writeFileSync('ai-kaynak/nesneler/liste.json', JSON.stringify({ tamam: sonuc, hatali: bozuk }, null, 1));
console.log(`tamam ${sonuc.length}, hatalı ${bozuk.length}`, hatalar.slice(0, 3));
await b.close();
