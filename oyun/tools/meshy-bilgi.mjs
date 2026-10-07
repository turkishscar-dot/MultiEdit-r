// Her yiğit için Meshy'ye verilecek ÖN / SAĞ / ARKA / SOL ayrıntılarını oyunun kendi verisinden üretir.
//   node tools/meshy-bilgi.mjs            -> ai-kaynak/meshy/karakterler.json  (+ ekrana özet)
// Amaç: Meshy'nin görmediği yüzü uydurmaması (sırt çantası vb.). Görselde olmayan şey metinde de "YOK" yazılır.
import fs from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
const Y = await import('../src/yigit.js');

// parça adı -> [görünen yer, İngilizce tarif]. yer: front | back | left | right | head | all
const PARCA = {
  C_Belt: ['front', 'Turkic belt set: dark leather belt with six small gold plates and a gold buckle at the front, two short leather straps hanging at the hips'],
  C_Sash: ['front', 'wide cloth sash wrapped twice around the waist, knot at the front with two short hanging ends'],
  C_KaftanLong: ['all', 'knee-length open-front caftan skirt with side slits and a thin gold hem trim'],
  C_FurCollar: ['front', 'broad fur collar lying on the shoulders'],
  C_Mustache: ['head', 'long mustache with drooping ends reaching the jaw line'],
  C_BraidsSide: ['head', 'two thin braids hanging in front of the ears down to the chest'],
  C_Lamellar: ['front', 'lamellar chest armor made of horizontal rows of dark iron plates joined by gold lacing'],
  C_Pauldrons: ['all', 'three-tier plate pauldrons on both shoulders'],
  C_BeardLong: ['head', 'long black beard ending on the chest, starting at the chin line (not covering the mouth)'],
  C_BeardLongWhite: ['head', 'long white beard ending on the chest, starting at the chin line (not covering the mouth)'],
  C_ShamanMirror: ['front', 'round bronze shaman mirror (kuezguen) on the center of the chest'],
  C_Drum: ['back', 'single-sided shaman frame drum with leather face and wooden rim carried on the back'],
  // modelde yapılıp Meshy'ye GÖRÜNMEYECEK parçalar (oyunda ayrı eklenir)
  C_Cape_Sway: ['none', null], C_BraidBack_Sway: ['none', null], C_Fringe_Sway: ['none', null],
  Bork: ['head', 'rounded red felt hat (bork) with a fur brim, a gold band and a small owl feather'],
  Kavuk: ['head', 'huge white turban (kavuk) with a small red top'],
  Sarik: ['head', 'white turban with a gold band, a ruby brooch and a feather plume at the front'],
  Taj: ['head', 'tall red twelve-grooved Qizilbash crown over a white turban'],
  AltinBork: ['head', 'very tall pointed gold cone hat with small gold animal figures on top and gold plates over the ears'],
  Antlers: ['head', 'iron band with branching deer antlers and small bells on thin cords'],
  EagleHat: ['head', 'eagle-head shaman hat with feathered crest'],
  BearHat: ['head', 'bear-head hat with fangs and a dark fur pelt hanging down the back'],
  YakutHat: ['head', 'round dark fur cap with ear flaps and a beaded forehead plate'],
  Headband: ['head', 'plain white headband with a gold sun disc on the forehead'],
  Kalpak: ['head', 'tall white Kyrgyz felt hat (ak kalpak) with curled-up black edges'],
  HunCap: ['head', 'pointed dark red felt Hun cap with a fur brim and gold forehead plates'],
  KulTiginTac: ['head', 'Gokturk gold crown with a bird with open wings at the front'],
  GoldPlates: ['all', 'rows of gold plates sewn on the clothes'],
  Collar: ['front', 'fur collar'], Feathers: ['none', null], ClawL: ['left', 'iron claw glove'], ClawR: ['right', 'iron claw glove'],
  Tug: ['back', 'Turkic tug standard: long wooden pole with a black pennant and a gold wolf head, carried behind the back'],
};
const RENK = [['black', 0x111111], ['dark brown', 0x4a2e18], ['brown', 0x8a5a2e], ['red', 0xb3202a], ['dark red', 0x6e1010], ['orange', 0xd9722a], ['gold yellow', 0xe3b02a], ['yellow', 0xffd23f],
  ['olive green', 0x5a6a2a], ['green', 0x2f8a4a], ['teal', 0x2f8a8a], ['light blue', 0x6ab8ff], ['blue', 0x1c3f8a], ['navy blue', 0x1a2f66], ['purple', 0x6a3a8a], ['white', 0xf0ece0], ['light gray', 0xc0c4c8], ['gray', 0x7a7a7a], ['beige', 0xd8c8a0]];
const ad = h => RENK.map(([n, c]) => [n, Math.hypot((h >> 16) - (c >> 16), ((h >> 8) & 255) - ((c >> 8) & 255), (h & 255) - (c & 255))]).sort((a, b) => a[1] - b[1])[0][0];

const out = {};
for (const c of Y.CARDS) {
  const L = Y.cardLook(c), parts = L.parts, col = L.colors || {};
  const gor = parts.filter(p => PARCA[p]?.[1]);                 // Meshy'nin göreceği parçalar
  const yok = parts.filter(p => PARCA[p]?.[0] === 'none');       // bilerek çıkarılanlar
  const beden = `${ad(col.M_Kaftan ?? 0x1c3f8a)} caftan, ${ad(col.M_Trouser ?? 0x5b2320)} trousers, ${ad(col.M_Boot ?? 0x3d2616)} boots`;
  const yer = k => gor.filter(p => [k, 'all'].includes(PARCA[p][0])).map(p => PARCA[p][1]);
  const baslik = gor.filter(p => PARCA[p][0] === 'head').map(p => PARCA[p][1]);
  const sabit = {
    front: ['sword is sheathed on the LEFT hip (character\'s left)'],
    back: ['a quiver with three red-fletched arrows and a recurve bow strapped diagonally on the back'],
    left: ['sheathed sword hangs at the hip, scabbard visible'],
    right: ['nothing hangs on this side; plain hip'],
  };
  const sonuc = {
    id: c.id, ad: c.name, kostum: beden, giysiRenkleri: Object.fromEntries(Object.entries(col).filter(([k]) => /^M_/.test(k)).map(([k, v]) => [k, '#' + v.toString(16).padStart(6, '0')])),
    on: [...baslik, ...yer('front'), ...sabit.front], sag: [...yer('right'), ...sabit.right], arka: [...yer('back'), ...(parts.includes('Tug') ? [] : sabit.back)], sol: [...yer('left'), ...sabit.left],
    cikarildi: yok,
    yoktur: ['NO cape', 'NO backpack or bag of any kind', 'NO extra weapons, wings, tails or accessories beyond the listed ones', 'hair is dark brown-black (no green tint)'],
    sakal: L.beard === false ? 'sakal yok' : parts.some(p => /^C_Beard/.test(p)) ? 'uzun sakal çeneden başlar' : 'sakalsız ya da kısa',
  };
  // Meshy texture_prompt (en çok 800 karakter): bütün yüzlerin ayrıntısını kısa tutar
  const tekil = [...new Set([...baslik, ...gor.filter(p => PARCA[p][0] !== 'head').map(p => PARCA[p][1])])];
  sonuc.texture_prompt = (`Stylized hand-painted game character in ${beden}. Details to keep exactly: ${tekil.join('; ')}; sheathed sword on the left hip; ${parts.includes('Tug') ? 'tug standard on the back' : 'quiver with three red-fletched arrows and a bow on the back'}. `
    + `Do NOT add a cape, backpack or any item not listed. Dark brown-black hair, crisp cloth, leather and metal materials.`).slice(0, 800);
  out[c.id] = sonuc;
}
fs.mkdirSync('ai-kaynak/meshy', { recursive: true });
fs.writeFileSync('ai-kaynak/meshy/karakterler.json', JSON.stringify(out, null, 1));
for (const k of Object.values(out)) console.log(k.id.padEnd(11), k.ad.padEnd(26), k.texture_prompt.length, 'krkt');
