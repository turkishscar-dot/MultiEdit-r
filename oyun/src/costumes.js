// Kostümler: Oğuz'un modelindeki başlık/gövde parçalarını açıp kapatır, kaftan-şalvar-çizme renklerini değiştirir.
// ponytail: şimdilik kut ile açılır; gerçek satın alma telefona paketlerken mağaza ödemesine bağlanacak.
export const COSTUMES = [
  {
    id: 'oguz', name: 'Oğuz Kağan', title: 'Ölümsüz Akıncı', price: 0, parts: ['Bork'],
    colors: { M_Kaftan: 0x1c3f8a, M_Trouser: 0x5b2320, M_Boot: 0x3d2616 },
    text: 'Kürklü börkü, altın işlemeli gök mavisi kaftanıyla destanın kahramanı.',
  },
  {
    id: 'akoglan', name: 'Ak Oğlan', title: 'Hayat Ağacının çocuğu', price: 250, parts: ['Headband'], beard: false,
    colors: { M_Kaftan: 0xf2eee4, M_Trouser: 0xe2dac4, M_Boot: 0xb8a47a },
    text: "Yakut anlatısında Hayat Ağacı yarılır; içinden çıkan Ağaç Ana onu emzirir, ona su, ateş ve demir verir. Temiz ve saf gücün simgesi.",
  },
  {
    id: 'fatih', name: 'Fatih Sultan Mehmet', title: 'Çağ açan', price: 300, parts: ['Kavuk', 'Collar'],
    colors: { M_Kaftan: 0x9c1c24, M_Trouser: 0x1f2a4a, M_Boot: 0xc9a13a },
    text: "Osmanlı padişahı (1432–1481). 1453'te İstanbul'u fethederek Orta Çağ'ı kapatıp Yeni Çağ'ı açtı. Beyaz kavuğu, kürk yakalı kızıl kaftanı ve sarı çizmeleriyle.",
  },
  {
    id: 'geyik', name: 'Geyik Şaman', title: 'Ruhlar yolcusu', price: 350, parts: ['Antlers'],
    colors: { M_Kaftan: 0x7a5a3a, M_Trouser: 0x4a3422, M_Boot: 0x2e2016 },
    text: 'Altay ve Sibirya şamanlarının geyik tipi giysisi: demir çemberli, dallı boynuzlu başlık ve çıngıraklar. Şaman bu giysiyle ruhlar âlemine yolculuk ederdi.',
  },
  {
    id: 'babur', name: 'Babür Şah', title: 'Hindistan\'ın fatihi', price: 400, parts: ['Sarik'],
    colors: { M_Kaftan: 0x2f6e4a, M_Trouser: 0xe8dcc0, M_Boot: 0x6a2a1a },
    text: "Timur soyundan gelen Babür İmparatorluğu'nun kurucusu (1483–1530). Hindistan'da büyük bir Türk-İslam devleti kurdu; hatıratı Babürname Çağatay Türkçesiyle yazılmıştır. Yakut sorguçlu sarığıyla.",
  },
  {
    id: 'ayi', name: 'Ayı Şaman', title: 'Ormanın koruyucusu', price: 450, parts: ['BearHat', 'ClawL', 'ClawR'],
    colors: { M_Kaftan: 0x3a2c22, M_Trouser: 0x2a1f18, M_Boot: 0x1a1410 },
    text: 'Ayı tipi şaman giysisi: ayı kafası başlık, sırtta post ve demir pençeli eldivenler. Ayı, ormanın en güçlü koruyucu ruhu sayılırdı.',
  },
  {
    id: 'ismail', name: 'Şah İsmail', title: 'Hatayi', price: 500, parts: ['Taj'], beard: false,
    colors: { M_Kaftan: 0xb3202a, M_Trouser: 0x1a1414, M_Boot: 0x8a1a1a },
    text: "Safevi Devleti'nin kurucusu (1487–1524). \"Hatayi\" mahlasıyla Türkçe şiirler yazdı. Askerleri, on iki dilimli kızıl taçları yüzünden Kızılbaş diye anıldı.",
  },
  {
    id: 'kartal', name: 'Kartal Şaman', title: 'Gök elçisi', price: 550, parts: ['EagleHat', 'Feathers'],
    colors: { M_Kaftan: 0x5a3a22, M_Trouser: 0x3a2a1c, M_Boot: 0x241a12 },
    text: 'Altay şamanlarının kuş tipi giysisi: kolları kanat gibi saran kartal tüyleri ve kartal başlı başlık. Kartal, Tanrı\'nın elçisi ve ilk şamanın atası sayılırdı.',
  },
  {
    id: 'sogotoh', name: 'Er-Sogotoh', title: 'İlk insan', price: 600, parts: ['YakutHat'],
    colors: { M_Kaftan: 0xe9dfc8, M_Trouser: 0x6e5a44, M_Boot: 0x3a2c22 },
    text: "Yakut destanında yeryüzünün ilk insanı. Kolları kayın gövdesi kadar kalın, altı kişinin geremediği kemik yayı olan dev bir avcı. Hakan Ağacı'nın dibindeki hayat suyuyla güç bulur.",
  },
  {
    id: 'manas', name: 'Manas', title: 'Kırgız alpı', price: 700, parts: ['Kalpak'],
    colors: { M_Kaftan: 0x7a1a1a, M_Trouser: 0x2a2a2a, M_Boot: 0x1a1414 },
    text: 'Kırgızların büyük destan kahramanı. Beşikte konuşan, kırk yiğidiyle Kaşgar\'dan kuzeye akınlar yapan alp. Ak kalpağı Kırgız erinin simgesidir.',
  },
  {
    id: 'gokturk', name: 'Göktürk Kağanı', title: 'Bozkırın hükümdarı', price: 800, parts: ['KulTiginTac', 'Tug'],
    colors: { M_Kaftan: 0x1f4a38, M_Trouser: 0x3a2a1a, M_Boot: 0x1a1414 },
    text: "Kül Tigin'in başında görülen, önünde kanatlarını açmış kuş bulunan taç ve Göktürk sancağındaki altın kurt başı ile. Bu tuğ, kağanlığın simgesiydi.",
  },
  {
    id: 'attila', name: 'Attila', title: 'Tanrının Kılıcı', price: 1000, parts: ['HunCap'],
    colors: { M_Kaftan: 0x3a1f4a, M_Trouser: 0x241c2b, M_Boot: 0x3d2616 },
    text: "Avrupa Hun hükümdarı (ölümü 453). Rivayete göre topal bir düvenin kan izini süren çoban, toprağa gömülü kutsal kılıcı bulup ona getirdi; Attila bunu dünyaya hükmetme işareti saydı.",
  },
  {
    id: 'altin', name: 'Altın Elbiseli Adam', title: 'Saka prensi', price: 2500, parts: ['AltinBork', 'GoldPlates'], beard: false,
    colors: { M_Kaftan: 0x8e1a1a, M_Trouser: 0x6e1414, M_Boot: 0xd9a520 },
    text: "Kazakistan'daki Esik kurganında bulunan, MÖ 4.–3. yüzyıldan kalma Saka savaşçısı. Binlerce altın parçayla bezeli giysisi ve oklarla süslü sivri külahıyla bozkırın en görkemli kıyafeti.",
  },
];

const PARTS = ['Bork', 'Kavuk', 'Sarik', 'Taj', 'Collar', 'AltinBork', 'GoldPlates', 'Antlers', 'EagleHat', 'Feathers', 'BearHat',
  'ClawL', 'ClawR', 'YakutHat', 'Headband', 'Kalpak', 'HunCap', 'KulTiginTac', 'Tug'];

export function applyCostume(actor, id) {
  const c = COSTUMES.find(x => x.id === id) || COSTUMES[0];
  for (const p of PARTS) if (actor.parts[p]) actor.parts[p].visible = c.parts.includes(p);
  actor.root.traverse(o => {
    if (!o.isMesh) return;
    if (o.name === 'Hair_Beard') o.visible = c.beard !== false;
    const col = c.colors[o.material.name];
    if (col != null) o.material.color.setHex(col); // malzemeler kahraman ve önizleme arasında ortak
  });
}

// Kasa: her koşuda toplanan kut birikir; Gök Demir değerli ikinci paradır (gökten düşen meteor demiri).
// Tunç Davul: yiğit çağırma eşyası (Yiğit Kartları). Tarayıcı depolaması yoksa oturum boyunca bellekte kalır.
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const listeners = [];
export const wallet = {
  bank: load('oguz-bank', 0),
  gokdemir: load('oguz-gokdemir', 0),
  tuncdavul: load('oguz-tuncdavul', 0),
  owned: load('oguz-owned', ['oguz']),
  worn: load('oguz-costume', 'oguz'),
  onChange(fn) { listeners.push(fn); },
  changed(kind, n) { for (const fn of listeners) fn(kind, n); },
  deposit(n) { if (!n) return; this.bank += n; save('oguz-bank', this.bank); this.changed('kut', n); },
  spend(n) { if (this.bank < n) return false; this.bank -= n; save('oguz-bank', this.bank); this.changed('kut', -n); return true; },
  addGD(n) { if (!n) return; this.gokdemir += n; save('oguz-gokdemir', this.gokdemir); this.changed('gd', n); },
  spendGD(n) { if (this.gokdemir < n) return false; this.gokdemir -= n; save('oguz-gokdemir', this.gokdemir); this.changed('gd', -n); return true; },
  addDavul(n) { if (!n) return; this.tuncdavul += n; save('oguz-tuncdavul', this.tuncdavul); this.changed('davul', n); },
  spendDavul(n) { if (this.tuncdavul < n) return false; this.tuncdavul -= n; save('oguz-tuncdavul', this.tuncdavul); this.changed('davul', -n); return true; },
  buy(c) {
    if (this.owned.includes(c.id) || this.bank < c.price) return false;
    this.spend(c.price);
    this.owned.push(c.id);
    save('oguz-owned', this.owned);
    return true;
  },
  wear(id) { this.worn = id; save('oguz-costume', id); },
};
