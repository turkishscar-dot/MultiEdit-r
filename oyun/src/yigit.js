// Yiğit Kartları (SMU'daki kahraman kartları): Ölümsüz Oğuz, Kam'ın davuluyla farklı çağların Türk yiğitlerinin
// ruhlarını çağırır; koşan yiğit onların görünüşüne ve gücüne bürünür.
// Ordu: 1 lider (koşan, yetenekleri etkin) + 3 yardımcı; dördünün gücü koşu puanı çarpanı olur.
import { COSTUMES, wallet } from './costumes.js';
import { addSource } from './bonus.js';
import { clock } from './tore.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Nadirlik: yıldız -> ad ve en yüksek seviye. Rütbe atlatılarak 8 yıldıza (Destan) kadar çıkılır.
export const RANKS = { 3: ['ER', 30], 4: ['ALP', 50], 5: ['BEY', 70], 6: ['KAHRAMAN', 90], 7: ['EFSANE', 100], 8: ['DESTAN', 110] };
const BASE_POWER = { 3: 100, 4: 150, 5: 220, 6: 300, 7: 400, 8: 520 };

// Yetenekler: bonus.js anahtarları
const A = {
  kp1: { key: 'nearMiss', v: 1, text: '+1 kıl payı' }, kp2: { key: 'nearMiss', v: 2, text: '+2 kıl payı' },
  kt2: { key: 'comboTime', v: 2, text: 'Kombo süresi +2 sn' }, kt3: { key: 'comboTime', v: 3, text: 'Kombo süresi +3 sn' },
  kt4: { key: 'comboTime', v: 4, text: 'Kombo süresi +4 sn' }, kt5: { key: 'comboTime', v: 5, text: 'Kombo süresi +5 sn' }, kt7: { key: 'comboTime', v: 7, text: 'Kombo süresi +7 sn' },
  kp20: { key: 'comboPts', v: 0.2, text: '+%20 kombo puanı' }, kp25: { key: 'comboPts', v: 0.25, text: '+%25 kombo puanı' }, kp30: { key: 'comboPts', v: 0.3, text: '+%30 kombo puanı' },
  kp40: { key: 'comboPts', v: 0.4, text: '+%40 kombo puanı' }, kp50: { key: 'comboPts', v: 0.5, text: '+%50 kombo puanı' },
  bp30: { key: 'bossPts', v: 0.3, text: "Boss'a %30 fazla puan" }, bp40: { key: 'bossPts', v: 0.4, text: "Boss'a %40 fazla puan" }, bp50: { key: 'bossPts', v: 0.5, text: "Boss'a %50 fazla puan" }, bp65: { key: 'bossPts', v: 0.65, text: "Boss'a %65 fazla puan" },
  ku15: { key: 'kutPct', v: 0.15, text: 'Kut %15 fazla' }, ku20: { key: 'kutPct', v: 0.2, text: 'Kut %20 fazla' }, ku30: { key: 'kutPct', v: 0.3, text: 'Kut %30 fazla' }, ku50: { key: 'kutPct', v: 0.5, text: 'Kut %50 fazla' },
  fk: { key: 'foeKut', v: 2, text: 'Düşmanlar iki kat kut düşürür' }, fk1: { key: 'foeKut', v: 1, text: 'Düşmanlar kut düşürür' },
};

// Görünüş: parts (Oğuz modelindeki başlık parçaları) + renkler. Kostümü olanlar kostümünü kullanır.
const look = (parts, kaftan, trouser, boot, extra = {}) => ({ parts, colors: { M_Kaftan: kaftan, M_Trouser: trouser, M_Boot: boot }, ...extra });

// Kartlar. Tanıtımlar tarihî/destanî kaynaklara göre kısa tutuldu.
export const CARDS = [
  { id: 'oguz', name: 'Oğuz Kağan', title: 'Ölümsüz Akıncı', stars: 3, costume: 'oguz', ab: ['kt3', 'ku30'], group: 'oguz',
    text: "Uygurca Oğuz Kağan Destanı'nın kahramanı, Ay Kağan'ın oğlu. Gök yeleli bir kurdun rehberliğinde dört yöne seferler yaptı, Oğuz boylarını birleştirdi." },
  { id: 'gunhan', name: 'Gün Han', title: 'Bozok · Güneş', stars: 3, look: look(['Bork'], 0xd9901a, 0x6a2a14, 0x3a2410), ab: ['ku20', 'bp30'], group: 'ogullar',
    text: "Oğuz Kağan'ın büyük oğlu. Destanda Oğuz'un gökten inen ışığın içindeki kızdan doğan üç oğlundan biridir. Bulunan altın yayı kardeşleriyle üçe bölüştüler: soyları Bozok diye anıldı." },
  { id: 'ayhan', name: 'Ay Han', title: 'Bozok · Ay', stars: 3, look: look(['Bork'], 0xc8d2e0, 0x3a4a6a, 0x2a2a3a), ab: ['kp1', 'kt2'], group: 'ogullar',
    text: "Oğuz Kağan'ın ikinci oğlu, Bozok kolundan. Destanda üç büyük oğul doğuda altın bir yay bulur; Oğuz yayı onlara verir, onlar da yayı kırıp paylaşır." },
  { id: 'yildizhan', name: 'Yıldız Han', title: 'Bozok · Yıldız', stars: 3, look: look(['Kalpak'], 0x1f2a5a, 0xd9b04a, 0x1a1414), ab: ['kp30', 'kp1'], group: 'ogullar',
    text: "Oğuz Kağan'ın üçüncü oğlu, Bozok kolunun son büyüğü. Oğuz boylarının sağ kolu Bozok, Gün, Ay ve Yıldız Han'ın oğullarından gelir." },
  { id: 'gokhan', name: 'Gök Han', title: 'Üçok · Gök', stars: 3, look: look(['HunCap'], 0x3a7ac0, 0xe6e0d0, 0x2a3040), ab: ['kp25', 'ku15'], group: 'ogullar',
    text: "Oğuz Kağan'ın ağaç kovuğundaki kızdan doğan üç küçük oğlunun büyüğü. Batıda üç gümüş ok bulurlar; soyları Üçok (sol kol) diye anılır." },
  { id: 'daghan', name: 'Dağ Han', title: 'Üçok · Dağ', stars: 3, look: look(['BearHat'], 0x6a5a48, 0x3a3228, 0x241c14), ab: ['bp40', 'kt2'], group: 'ogullar',
    text: "Oğuz Kağan'ın beşinci oğlu, Üçok kolundan. Salur, Eymür, Ala-yuntlı ve Üregir boyları onun oğullarından gelir." },
  { id: 'denizhan', name: 'Deniz Han', title: 'Üçok · Deniz', stars: 3, look: look(['Headband'], 0x1f6a7a, 0xd8e8e8, 0x1a2a30), ab: ['kt4', 'kp20'], group: 'ogullar',
    text: "Oğuz Kağan'ın en küçük oğlu. İğdir, Bükdüz, Yıva ve Kınık boyları onun soyundan sayılır; Selçuklular Kınık boyundandır." },
  { id: 'mete', name: 'Mete Han', title: 'Asya Hun Tanhusu', stars: 5, look: look(['HunCap'], 0x8a1a1a, 0x1a1414, 0x2a1a10), ab: ['fk1', 'bp65'], group: 'hun',
    text: "Asya Hun hükümdarı (MÖ 209–174). Askerlerinden sorgusuz itaat bekleyen ıslıklı okuyla ünlüdür: ok nereye atılırsa bütün askerler oraya atardı. Orduyu onluk düzene göre kurduğu anlatılır." },
  { id: 'bumin', name: 'Bumin Kağan', title: 'Göktürk Kağanlığının kurucusu', stars: 5, costume: 'gokturk', ab: ['ku30', 'kt3'], group: 'gokturk',
    text: "552'de Juan-juan (Avar) egemenliğine son verip Göktürk Kağanlığı'nı kurdu ve 'İl Kağan' unvanını aldı. Aynı yıl ölünce yerine oğulları geçti; kardeşi İstemi batıyı yönetti." },
  { id: 'tonyukuk', name: 'Tonyukuk', title: 'Bilge vezir', stars: 4, look: look(['Kalpak'], 0xe8e2d0, 0x6a5a48, 0x3a2c22), ab: ['kt7', 'kp30'], group: 'gokturk',
    text: "Göktürklerin veziri ve komutanı; İlteriş Kutluk, Kapgan ve Bilge Kağan'a danışmanlık etti. Kendi ağzından yazdırdığı yazıt (720 dolayı) Türkçenin ilk yazılı metinlerindendir." },
  { id: 'alperTunga', name: 'Alp Er Tunga', title: 'Turan hükümdarı', stars: 5, look: look(['AltinBork'], 0x7a1a4a, 0x2a1a2a, 0xd9a520), ab: ['kp2', 'bp50'], group: 'destan',
    text: "Türk destan kahramanı; İran kaynaklarında Afrasiyab diye geçer. Kaşgarlı Mahmud'un Divanü Lugati't-Türk'ünde onun ölümüne yakılmış sagu yer alır: 'Alp Er Tunga öldü mü...'" },
  { id: 'attila', name: 'Attila', title: 'Tanrının Kılıcı', stars: 6, costume: 'attila', ab: ['bp65', 'kp50'], group: 'hun',
    text: "Avrupa Hun hükümdarı (434–453). Doğu ve Batı Roma'yı haraca bağladı. Rivayete göre bir çobanın bulduğu kutsal kılıcı dünyaya hükmetme işareti saydı." },
  { id: 'basat', name: 'Basat', title: 'Tepegöz\'ün yenicisi', stars: 4, look: look(['Kalpak', 'ClawL', 'ClawR'], 0x8a6a2a, 0x4a3a22, 0x2a1c12), ab: ['bp65', 'kp1'], group: 'dedekorkut',
    text: "Dede Korkut Kitabı'nda Aruz Koca'nın oğlu. Bebekken kaybolup aslan sütüyle büyüdü. Oğuz'u haraca bağlayan Tepegöz'ün tek gözünü kör edip onu kendi kılıcıyla öldürdü." },
  { id: 'beyrek', name: 'Bamsı Beyrek', title: 'Boz aygırlı', stars: 4, look: look(['Bork', 'Collar'], 0x2f6e4a, 0x8a1a1a, 0x3a2410), ab: ['kt5', 'kp30'], group: 'dedekorkut',
    text: "Dede Korkut Kitabı'nda Kam Püre'nin oğlu. Düğün gecesi tutsak düştü, on altı yıl sonra kaçıp ozan kılığında döndü ve nişanlısını kurtardı." },
  { id: 'dumrul', name: 'Deli Dumrul', title: 'Azrail\'e meydan okuyan', stars: 4, look: look(['HunCap'], 0x1a1a1a, 0x3a1a1a, 0x1a1414), ab: ['kp2', 'kt3'], group: 'dedekorkut',
    text: "Dede Korkut Kitabı'nda kuru çayın üstüne köprü kurup geçenden haraç alan yiğit. Azrail'e meydan okudu; eşi canını onun için vermeye razı olunca ikisine de yüz kırk yıl ömür verildi." },
  { id: 'sogotoh', name: 'Er-Sogotoh', title: 'İlk insan', stars: 6, costume: 'sogotoh', ab: ['ku30', 'fk1'], group: 'destan',
    text: "Yakut (Saha) destanında yeryüzünün ilk insanı, dev bir avcı. Hakan Ağacı'nın dibindeki hayat suyuyla güç bulur." },
  { id: 'altin', name: 'Altın Elbiseli Adam', title: 'Saka prensi', stars: 7, costume: 'altin', ab: ['ku50', 'kp30'], group: 'destan',
    text: "Kazakistan'daki Esik kurganında bulunan, MÖ 4.–3. yüzyıldan kalma Saka savaşçısı. Binlerce altın parçayla bezeli giysisiyle bozkırın en görkemli buluntusudur." },
  { id: 'babur', name: 'Babür Şah', title: 'Hindistan\'ın fatihi', stars: 6, costume: 'babur', ab: ['ku30', 'kp30'], group: 'devlet',
    text: "Babür İmparatorluğu'nun kurucusu (1483–1530). Çağatay Türkçesiyle yazdığı hatıratı Babürname ile de tanınır." },
  { id: 'ismail', name: 'Şah İsmail', title: 'Hatayi', stars: 6, costume: 'ismail', ab: ['kp50', 'kp1'], group: 'devlet',
    text: "Safevi Devleti'nin kurucusu (1487–1524). 'Hatayi' mahlasıyla Türkçe şiirler yazdı." },
  { id: 'akoglan', name: 'Ak Oğlan', title: 'Hayat Ağacının çocuğu', stars: 3, costume: 'akoglan', ab: ['kt3', 'ku20'], group: 'saman',
    text: 'Yakut anlatısında Hayat Ağacından doğan, Ağaç Ana\'nın emzirdiği çocuk. Temiz ve saf gücün simgesi.' },
  { id: 'geyiksaman', name: 'Geyik Şaman', title: 'Ruhlar yolcusu', stars: 3, costume: 'geyik', ab: ['kp1', 'ku15'], group: 'saman',
    text: 'Altay ve Sibirya şamanlarının geyik tipi giysisi: dallı boynuzlu başlık ve çıngıraklar.' },
  { id: 'ayisaman', name: 'Ayı Şaman', title: 'Ormanın koruyucusu', stars: 3, costume: 'ayi', ab: ['bp30', 'kt2'], group: 'saman',
    text: 'Ayı tipi şaman giysisi: ayı kafası başlık ve demir pençeli eldivenler.' },
  { id: 'kartalsaman', name: 'Kartal Şaman', title: 'Gök elçisi', stars: 3, costume: 'kartal', ab: ['kp30', 'kp1'], group: 'saman',
    text: 'Altay şamanlarının kuş tipi giysisi: kolları kanat gibi saran kartal tüyleri ve kartal başlı başlık.' },
  // Süreli bayram yiğitleri: yalnız bayram günlerinde Gök Demirle çağrılır ve davulda çıkar; alınan kalıcıdır
  { id: 'ergenekon', name: 'Ergenekon Demircisi', title: 'Nevruz · Demir dağı eriten', stars: 5, season: { name: 'NEVRUZ', ek: "'DA", from: [3, 14], to: [3, 28] },
    look: look(['Kalpak'], 0x2a6a3a, 0xc0302a, 0x3a2616, { desen: { M_Kaftan: 'kilim' } }), ab: ['kt5', 'ku30'], group: 'bayram',
    text: "Ergenekon Destanı'nda dağlarla çevrili bir vadide yüzyıllarca yaşayan Türkler, bir demircinin önerisiyle demir dağın önüne odun ve kömür yığıp körüklerle eritir, bozkurdun ardından dışarı çıkar. Çıkış günü bayram sayılır; Türkiye'de Nevruz'la birlikte anılır." },
  { id: 'hizir', name: 'Boz Atlı Hızır', title: 'Hıdırellez · Darda kalana yetişen', stars: 5, season: { name: 'HIDIRELLEZ', ek: "'DE", from: [5, 1], to: [5, 10] },
    look: look(['Sarik'], 0x3a8a5a, 0xe8e2d0, 0x5a5a5a, { desen: { M_Kaftan: 'rumi' } }), ab: ['kp40', 'kt4'], group: 'bayram',
    text: "Anadolu ve Balkan inanışında darda kalana yetişen ermiş; boz atıyla gelir. 5 Mayıs'ı 6'ya bağlayan gece Hızır ile İlyas'ın buluştuğuna inanılır; Hıdırellez bu buluşmanın bahar bayramıdır." },
];
export const ABILITY = A;

// ---------- Görünüş efektleri (kostüm takımı): koşu izi, kılıç parıltısı, at koşumu, vitrindeki duruş, zafer pozu ----------
// iz: arkada bırakılan parçacık rengi; kilic: kılıç parıltısı (6★ ve üstünde ya da elle verilmişse); at: eyer ve koşum rengi.
const GFX = {
  oguz: { iz: 0x6ab8ff, at: 0x1c3f8a, bekle: 'Idle_Loop', zafer: 'MX_GS_PowerUp' },
  ogullar: { iz: 0xffd060, at: 0x7a4a24, bekle: 'Idle_Loop', zafer: 'MX_GS_Draw' },
  hun: { iz: 0xff5a2a, at: 0x3a1a1a, bekle: 'Idle_Loop', zafer: 'MX_GS_PowerUp' },
  gokturk: { iz: 0x5ab0ff, at: 0x1f4a38, bekle: 'Idle_Loop', zafer: 'MX_GS_PowerUp' },
  destan: { iz: 0xffc040, at: 0x6a1a1a, bekle: 'Idle_Loop', zafer: 'MX_GS_PowerUp' },
  dedekorkut: { iz: 0x8adf6a, at: 0x5a3a1a, bekle: 'Idle_Loop', zafer: 'MX_GS_Draw' },
  devlet: { iz: 0xff4a4a, at: 0x8a1a1a, bekle: 'Idle_Loop', zafer: 'MX_Examine' },
  saman: { iz: 0xb07aff, at: 0x3a2a1a, bekle: 'Idle_Loop', zafer: 'MX_Cast' },
  bayram: { iz: 0x7affb0, at: 0x2a6a3a, bekle: 'Idle_Loop', zafer: 'MX_GS_PowerUp' },
};
const OWN_FX = { // karta özgü renkler
  gunhan: { iz: 0xffb020 }, ayhan: { iz: 0xdce6ff }, yildizhan: { iz: 0xfff6b0 }, gokhan: { iz: 0x6ab8ff }, daghan: { iz: 0xb09a78 }, denizhan: { iz: 0x4ad8e0 },
  sogotoh: { iz: 0x9aff9a }, altin: { iz: 0xffd23f, kilic: 0xffd23f }, babur: { iz: 0x2adf8a }, ismail: { iz: 0xd7263d },
  akoglan: { iz: 0xffffff }, attila: { kilic: 0xff3a2a },
};
export function cardFx(c) {
  const f = { ...GFX[c.group] ?? GFX.oguz, ...OWN_FX[c.id], ...c.fx };
  if (f.kilic == null && c.stars >= 6) f.kilic = f.iz; // yüksek nadirlikte kılıç parlar
  return f;
}
export const RANK_COLOR = { 3: 0xb09a80, 4: 0x3aba5a, 5: 0x3a7ae0, 6: 0xa04ae0, 7: 0xf09a2a, 8: 0xe8303d };
const byId = id => CARDS.find(c => c.id === id);
// Blender'da yapılacak kostüm parçaları (kostum/TASARIM.md). Model gelmeden de burada durur: olmayan parça yok sayılır.
// Yeni malzemeler (M_Cape pelerin, M_Sash kuşak, M_Kurk kürk yaka) kostüme göre boyanır.
// Beyaz sakallı yiğitlerde saç, kaş ve kısa sakal da sakalla aynı beyaz olur (M_BeardWhite = 0xefedea)
const BEYAZ_SAC = { MI_Hair_1: 0xe4e1da, 'MI_Hair_1.001': 0xefedea, MI_Hair_2: 0xefedea, MI_Hair_Braid: 0xefedea };
const DETAY = {
  oguz: { parts: ['C_Cape_Sway', 'C_Belt', 'C_BraidBack_Sway'], colors: { M_Cape: 0x1a2f66 } },
  gunhan: { parts: ['C_Sash', 'C_Belt'], colors: { M_Sash: 0xffc040 } },
  ayhan: { parts: ['C_Sash', 'C_Belt'], colors: { M_Sash: 0xdfe6f0 } },
  yildizhan: { parts: ['C_Sash', 'C_Belt'], colors: { M_Sash: 0xffe68a } },
  gokhan: { parts: ['C_Sash', 'C_BraidsSide'], colors: { M_Sash: 0x6ab8ff } },
  daghan: { parts: ['C_FurCollar', 'C_Belt'], colors: { M_Kurk: 0x6a5a48 } },
  denizhan: { parts: ['C_Sash', 'C_BraidsSide'], colors: { M_Sash: 0x4ad8e0 } },
  mete: { parts: ['C_Lamellar', 'C_Belt', 'C_Mustache', 'C_BraidBack_Sway', 'C_Cape_Sway'], colors: { M_Cape: 0x5a0e0e } },
  bumin: { parts: ['C_Lamellar', 'C_Belt', 'C_BraidBack_Sway', 'C_Cape_Sway'], colors: { M_Cape: 0x1f4a38 } },
  tonyukuk: { parts: ['C_KaftanLong', 'C_BeardLongWhite', 'C_Sash'], colors: { M_Sash: 0x6a5a48, ...BEYAZ_SAC } },
  alperTunga: { parts: ['C_Lamellar', 'C_Pauldrons', 'C_Cape_Sway', 'C_Belt'], colors: { M_Cape: 0x3a0a2a } },
  attila: { parts: ['C_Lamellar', 'C_FurCollar', 'C_Cape_Sway', 'C_Mustache'], colors: { M_Cape: 0x2a1030, M_Kurk: 0x3a2a1a } },
  basat: { parts: ['C_FurCollar', 'C_Belt'], colors: { M_Kurk: 0x8a6a48 } },
  beyrek: { parts: ['C_KaftanLong', 'C_Belt', 'C_Mustache'] },
  dumrul: { parts: ['C_Pauldrons', 'C_Belt', 'C_Cape_Sway'], colors: { M_Cape: 0x2a3a2a } },
  sogotoh: { parts: ['C_FurCollar', 'C_Belt', 'C_BraidBack_Sway'], colors: { M_Kurk: 0xe8e0d0 } },
  altin: { parts: ['C_KaftanLong', 'C_Belt', 'C_Pauldrons'] },
  babur: { parts: ['C_KaftanLong', 'C_Sash', 'C_BeardLong'], colors: { M_Sash: 0xd9b04a } },
  ismail: { parts: ['C_KaftanLong', 'C_Sash', 'C_Mustache'], colors: { M_Sash: 0x1a1414 } },
  akoglan: { parts: ['C_Sash', 'C_HairTop'], colors: { M_Sash: 0xffffff } },
  geyiksaman: { parts: ['C_ShamanMirror', 'C_Drum'] },
  ayisaman: { parts: ['C_ShamanMirror', 'C_FurCollar'], colors: { M_Kurk: 0x2a1f18 } },
  kartalsaman: { parts: ['C_ShamanMirror', 'C_Drum'] },
  ergenekon: { parts: ['C_FurCollar', 'C_Belt', 'C_Cape_Sway'], colors: { M_Cape: 0x8a1a1a, M_Kurk: 0x3a2a1a } },
  hizir: { parts: ['C_KaftanLong', 'C_Sash', 'C_BeardLongWhite', 'C_Cape_Sway'], colors: { M_Cape: 0x7a7a7a, M_Sash: 0x2a6a3a, ...BEYAZ_SAC } },
};
export const CPARTS = [...new Set(Object.values(DETAY).flatMap(d => d.parts))];
export const cardLook = c => {
  const b = c.costume ? COSTUMES.find(x => x.id === c.costume) : c.look, d = DETAY[c.id];
  return d ? { ...b, body: c.id, parts: [...b.parts, ...d.parts], colors: { ...b.colors, ...d.colors } } : { ...b, body: c.id };
};

// ---------- kayıt ----------
const st = load('oguz-yigit', null) || (() => { // ilk açılış: satın alınmış kostümler kart olur, giyilen lider olur
  const cards = {};
  for (const c of CARDS) if (c.costume && wallet.owned.includes(c.costume)) cards[c.id] = { lvl: 1, stars: c.stars, copies: 0 };
  cards.oguz ??= { lvl: 1, stars: 3, copies: 0 };
  const worn = CARDS.find(c => c.costume === wallet.worn && cards[c.id]);
  return { cards, leader: worn?.id || 'oguz', team: [] };
})();
const persist = () => save('oguz-yigit', st);
for (const id of Object.keys(st.cards)) if (!CARDS.some(c => c.id === id)) delete st.cards[id]; // kaldırılan yiğitler eski kayıttan silinir
st.team = st.team.filter(id => CARDS.some(c => c.id === id));
if (!st.cards[st.leader]) st.leader = 'oguz';
persist();
export const owned = id => !!st.cards[id];
export const cardState = id => st.cards[id];
export const leader = () => byId(st.leader);
export const team = () => st.team.map(byId).filter(Boolean);
export const ownedCount = () => Object.keys(st.cards).length;
export const maxLvl = id => RANKS[st.cards[id].stars][1];

export function power(id) {
  const s = st.cards[id];
  if (!s) return 0;
  return Math.round(BASE_POWER[s.stars] * (1 + (s.lvl - 1) * 0.04));
}
// Ordu gücü: lider + yardımcılar; puan çarpanı = 1 + toplam / 3000 (SMU'daki Team Power)
export const armyPower = (helpersOn = true) => power(st.leader) + (helpersOn ? st.team.reduce((s, id) => s + power(id), 0) : 0);
export const armyMult = (helpersOn = true) => Math.round((1 + armyPower(helpersOn) / 3000) * 10) / 10;
// Kademe için: en güçlü 4 yiğidin toplamı
export const top4 = () => Object.keys(st.cards).map(power).sort((a, b) => b - a).slice(0, 4).reduce((s, v) => s + v, 0);

// Liderin yetenekleri (5 yıldızda ikinci yetenek açılır) ve ordu gücü koşu bonusuna yazılır
let helpersUnlocked = () => true;
export function setHelpersCheck(fn) { helpersUnlocked = fn; }
addSource(b => {
  const c = leader(), s = st.cards[c.id];
  const list = s.stars >= 5 ? c.ab : c.ab.slice(0, 1);
  for (const k of list) b[A[k].key] += A[k].v;
  b.scoreMult += armyMult(helpersUnlocked()) - 1;
});

// ---------- işlemler ----------
export const lvlCost = id => 50 + 25 * st.cards[id].lvl;
export const rankCostGD = id => 5 * (st.cards[id].stars - 2);
export function setLeader(id) { if (!owned(id)) return; st.team = st.team.filter(x => x !== id); st.leader = id; persist(); }
export function toggleTeam(id) {
  if (!owned(id) || id === st.leader) return;
  if (st.team.includes(id)) st.team = st.team.filter(x => x !== id);
  else if (st.team.length < 3) st.team.push(id);
  persist();
}
export function levelUp(id) {
  const s = st.cards[id];
  if (!s || s.lvl >= maxLvl(id) || !wallet.spend(lvlCost(id))) return false;
  s.lvl++;
  persist();
  return true;
}
// Rütbe: aynı kartın kopyasıyla ya da Gök Demir ile bir yıldız
export function rankUp(id, useGD) {
  const s = st.cards[id];
  if (!s || s.stars >= 8) return false;
  if (useGD ? !wallet.spendGD(rankCostGD(id)) : s.copies < 1) return false;
  if (!useGD) s.copies--;
  s.stars++;
  persist();
  return true;
}
export function grant(id) { // kart kazan: yoksa açılır, varsa kopya olur
  const s = st.cards[id];
  if (s) s.copies++;
  else st.cards[id] = { lvl: 1, stars: byId(id).stars, copies: 0 };
  persist();
  return !s;
}
// Tunç Davul: Kam'ın davulu bir yiğit ruhu çağırır. Olasılık nadirliğe göre; gerçek parayla şans kutusu yok.
export const DRAW = { 3: 0.55, 4: 0.28, 5: 0.12, 6: 0.045, 7: 0.005 };
export function drum(rnd = Math.random) {
  if (!wallet.spendDavul(1)) return null;
  let r = rnd(), stars = 3;
  for (const [s, p] of Object.entries(DRAW)) { if (r < p) { stars = +s; break; } r -= p; }
  const pool = CARDS.filter(c => c.stars === stars && inSeason(c));
  const c = pool[Math.floor(rnd() * pool.length)];
  return { card: c, isNew: grant(c.id) };
}
// Bayram penceresi (ay, gün): clock tore.js'ten, testte günler kaydırılabilir
const AY = ['', 'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
export function inSeason(c) {
  if (!c.season) return true;
  const d = clock.now(), v = (d.getMonth() + 1) * 100 + d.getDate();
  return v >= c.season.from[0] * 100 + c.season.from[1] && v <= c.season.to[0] * 100 + c.season.to[1];
}
export const buyable = c => inSeason(c);
export const visible = () => true;
export const seasonText = c => `${c.season.name}${c.season.ek} GELİR (${c.season.from[1]}–${c.season.to[1]} ${AY[c.season.to[0]]})`;
// Kostümü olan kartlar eski fiyatıyla kut ile alınabilir; nadir olanlar Gök Demir ile
export function buyPrice(c) {
  const cos = c.costume && COSTUMES.find(x => x.id === c.costume);
  if (cos) return { kut: cos.price };
  return { gd: { 3: 5, 4: 10, 5: 20, 6: 35, 7: 60 }[c.stars] };
}
export function buy(id) {
  const c = byId(id), p = buyPrice(c);
  if (owned(id) || !buyable(c) || (p.kut != null ? !wallet.spend(p.kut) : !wallet.spendGD(p.gd))) return false;
  grant(id);
  return true;
}

// ---------- Kağanlık Kademesi: en güçlü 4 yiğidin toplam gücüne göre; asla düşmez ----------
export const TIERS = [
  { name: 'OBA', need: 0, icon: '⛺' }, { name: 'BOY', need: 600, icon: '🏕', reward: { gd: 5, davul: 1 } },
  { name: 'BUDUN', need: 1500, icon: '🏘', reward: { gd: 10, davul: 1 } }, { name: 'İL', need: 3000, icon: '🏯', reward: { gd: 15, davul: 2 } },
  { name: 'KAĞANLIK', need: 6000, icon: '👑', reward: { gd: 25, davul: 2 } }, { name: 'GÖK KAĞANLIK', need: 10000, icon: '☀', reward: { gd: 40, davul: 3 } },
];
const kst = load('oguz-kademe', { tier: 0 });
export const tier = () => kst.tier;
// Yeni kademeye çıkıldıysa ödülleri verir, çıkılan kademeleri döner
export function checkTier() {
  const p = top4(), ups = [];
  while (kst.tier < TIERS.length - 1 && p >= TIERS[kst.tier + 1].need) {
    kst.tier++;
    const t = TIERS[kst.tier];
    wallet.addGD(t.reward.gd);
    wallet.addDavul(t.reward.davul);
    ups.push(t);
  }
  if (ups.length) save('oguz-kademe', kst);
  return ups;
}
