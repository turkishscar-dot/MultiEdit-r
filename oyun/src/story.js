// Hikâye: açılış jeneriği, prolog ara sahnesi, bölüm haritası ve Destan Kitabı metinleri.
// Çekimler Cine (cine.js) ile oynar; c = main.js'teki sahne bağlamı. Z = sahnenin başladığı konum.
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

export const JENERIK = [
  { // karanlıkta Göktürk harfleriyle ad
    dur: 3.2,
    enter(c) { c.fade(1); c.title([['𐰆𐰍𐰔 𐰴𐰍𐰣', 'rune']]); c.mood('day'); },
    update(c, k) { c.cam(0, 1.2, c.Z + 2, 0, 3, c.Z - 60); c.titleAlpha(Math.min(1, k * 2.5) * (k > 0.85 ? (1 - k) / 0.15 : 1)); },
  },
  { // şafakta surların üstünden yükselen kamera, logo çarpar
    dur: 5,
    enter(c) { c.fade(1); c.title([['OĞUZ KAĞAN', 'logo'], ['ÖLÜMSÜZ AKINCI', 'sub']]); c.titleAlpha(0); },
    update(c, k) {
      const e = ease(k);
      c.fade(Math.max(0, 1 - k * 3));
      c.cam(0, lerp(1.2, 8, e), c.Z + lerp(2, -12, e), 0, lerp(3, 1, e), c.Z - 70);
      c.titleAlpha(k > 0.25 ? 1 : 0, k > 0.25 && k < 0.3);
    },
  },
  { // şehrin üstünde yana kayan çekim, emeği geçenler
    dur: 4.5,
    enter(c) { c.title([['Karakter ve animasyonlar — Quaternius (CC0)', 'credit'], ['Modelleme — Blender · Oyun motoru — Three.js', 'credit']]); c.titleAlpha(0); },
    update(c, k) {
      c.cam(lerp(7, 5, k), 6, c.Z - lerp(18, 40, k), -14, -4, c.Z - lerp(30, 55, k));
      c.titleAlpha(Math.min(1, k * 3));
      c.fade(k > 0.8 ? (k - 0.8) / 0.2 : 0);
    },
  },
];

export const PROLOG = [
  {
    text: "Çok eski zamanlarda, Ötüken'in bozkırlarında Oğuz boyları özgür ve güçlüydü.",
    enter(c) { c.fade(1); c.mood('day'); },
    update(c, k) {
      c.fade(Math.max(0, 1 - k * 4));
      const e = ease(k);
      c.cam(lerp(8, 3, e), lerp(12, 7, e), c.Z + lerp(8, -25, e), 0, 1, c.Z - 50);
    },
  },
  {
    text: 'Ama yerin yedi kat altında, karanlıklar ülkesinin hükümdarı Erlik Han uyandı.',
    update(c, k, t, dt) {
      c.mood('day', 'blood', Math.min(1, k * 1.6));
      c.cam(0, lerp(0.5, 0.9, k), c.Z - lerp(2, 6, k), 0, 0.6, c.Z - 30);
      if (Math.random() < dt * 25) c.dust.emit((Math.random() - 0.5) * 8, 0, c.Z - 10 - Math.random() * 15, 2, 0x7a1010, 1, 6);
      if (k > 0.5) c.shake(0.05);
    },
  },
  {
    text: 'Kulları Körmösler yerden fırladı, Oğuz yurduna ölüm saçtılar.',
    enter(c) {
      c.mood('blood');
      this.f = [[-2.5, 12], [0, 14.5], [2.5, 12.8], [-1.2, 17]].map(([x, z], i) => {
        const a = c.foe(i, i === 1 ? 'kalkanli' : 'baltaci');
        return { a, x, z: c.Z - z, delay: i * 0.45, up: false };
      });
    },
    update(c, k, t) {
      c.cam(lerp(2.5, 1.5, k), lerp(2, 1.7, k), c.Z - lerp(4, 7, k), 0, 1.2, c.Z - 14);
      for (const f of this.f) {
        const r = Math.min(1, Math.max(0, (t - f.delay) / 0.35));
        c.show(f.a, f.x, lerp(-1.9, 0, r), f.z, 0);
        if (r > 0 && !f.up) { f.up = true; c.dust.emit(f.x, 0.2, f.z, 30, 0x3a2040, 4, 6); }
        if (r >= 1 && !f.roar) { f.roar = true; f.a.play('Zombie_Scratch', { speed: 0.8 }); }
      }
    },
  },
  {
    text: 'Dağlar kadar büyük Tepegöz boyları dağıttı, ocakları söndürdü.',
    enter(c) { c.mood('blood'); c.giant.play('Walk_Loop', { fade: 0 }); this.hit = false; },
    update(c, k, t) {
      const z = c.Z - 24 + Math.min(k, 0.6) * 12;
      c.show(c.giant, 0, 0, z, 0);
      c.cam(1.5, 0.6, c.Z - 3, 0, 5, z);
      if (k > 0.6 && !this.hit) {
        this.hit = true;
        c.giant.play('Punch_Cross', { loop: false, speed: 1.2 });
      }
      if (this.hit && k > 0.7 && k < 0.75) { c.shake(0.5); c.dust.emit(0, 0.3, z + 3, 40, 0x8a5a3a, 8, 4); }
    },
  },
  {
    text: "Umudun tükendiği gece, gök yeleli bir kurt belirdi ve Oğuz'a yol gösterdi.",
    enter(c) {
      c.mood('night');
      c.hero.play('Idle_Loop', { fade: 0 });
      c.wolf.play('Walk', { fade: 0 });
      this.stop = false;
    },
    update(c, k) {
      c.show(c.hero, 0, 0, c.Z - 8, Math.PI);
      const wz = c.Z - 17 + Math.min(k, 0.7) / 0.7 * 6;
      c.show(c.wolf, 0.2, 0, wz, 0);
      if (k > 0.7 && !this.stop) { this.stop = true; c.wolf.play('Idle_2', { fade: 0.3 }); }
      c.cam(lerp(2.2, 1.6, k), lerp(2.1, 1.8, k), c.Z - lerp(4.6, 5.6, k), 0, 0.8, c.Z - 11); // omuz üstünden kurda
    },
  },
  {
    text: 'Oğuz yayını kuşandı, kılıcını çekti...',
    enter(c) {
      c.swordMode(true);
      c.hero.play('Sword_Idle', { fade: 0 });
      this.slash = false;
    },
    update(c, k) {
      c.mood('night', 'day', Math.min(1, k * 1.5));
      c.show(c.hero, 0, 0, c.Z - 8, Math.PI);
      c.cam(lerp(1.1, 0.7, k), 1.7, c.Z - 10.6 + k * 0.4, 0, 1.5, c.Z - 8);
      if (k > 0.45 && !this.slash) {
        this.slash = true;
        c.hero.play('Sword_Regular_C', { loop: false, speed: 1.1 });
      }
      if (k > 0.55 && k < 0.58) c.sparks.emit(0.4, 1.5, c.Z - 8.6, 20, 0xffc040, 5, 2);
    },
    exit(c) { c.swordMode(false); },
  },
  {
    text: '...ve tek başına, düşmanın kalbine akın etti!',
    enter(c) {
      c.mood('day');
      c.hero.play('Sitting_Idle_Loop', { fade: 0 });
      c.horse.play('Gallop', { speed: 1.5, fade: 0 });
      c.wolf.play('Gallop', { speed: 1.3, fade: 0 });
      this.z0 = c.P.z;
    },
    update(c, k, t) {
      const z = this.z0 - 8 - t * 14;
      c.P.z = z + 8; // dünya parçaları bu konuma göre yenilenir
      c.show(c.horse, 0, 0, z + 0.15, Math.PI);
      c.show(c.hero, 0, 1.2, z, Math.PI);
      c.rideLegs();
      c.show(c.wolf, -1.8, 0, z - 0.6, Math.PI);
      c.cam(lerp(2.6, 1.4, k), lerp(1.2, 2.2, k), z - lerp(6, 9, k), 0, 1.5, z);
      if (Math.random() < 0.5) c.dust.emit((Math.random() - 0.5), 0.1, z + 1.2, 1, 0xc9a77a, 1.5, 1.5);
    },
  },
  {
    dur: 4,
    enter(c) { c.fade(0); c.title([['BİRİNCİ KISIM', 'sub'], ['KARANLIĞIN KULLARI', 'logo']]); c.titleAlpha(0); },
    update(c, k) {
      c.fade(Math.min(1, k * 3) * 0.85);
      c.titleAlpha(k > 0.2 ? 1 : 0, k > 0.2 && k < 0.25);
      c.cam(0, 9, c.P.z + 10, 0, 2, c.P.z - 60);
    },
  },
];

// Açılış hikâyesi çizgi roman sayfaları olarak: [çekim, [ses efekti, saniye]]
export const PROLOG_PAGES = [
  { layout: 'three', shots: [PROLOG[0], PROLOG[1], [PROLOG[2], ['HIRRR!', 0.9]]] },
  { layout: 'threeB', shots: [[PROLOG[3], ['GÜM!', 3.9]], [PROLOG[4], ['AUUU!', 2.2]], [PROLOG[5], ['ŞİNG!', 2]]] },
  { layout: 'splash', shots: [[PROLOG[6], ['DAT DAT DAT!', 1]]] },
  { layout: 'splash', shots: [PROLOG[7]] },
];

// Bölüm haritası. ready: oynanabilir mi.
export const PARTS = [
  {
    name: 'BİRİNCİ KISIM', sub: 'Türk Mitolojisinin Kötüleri', levels: [
      { id: 1, name: 'Ötüken Surları', boss: '3 kısım · Körmös Başı, Tepegöz', ready: true },
      { id: 2, name: 'Kara Bataklık', boss: '3 kısım · Bataklık Ağası, Albastı', ready: true },
      { id: 3, name: 'Altay', boss: '3 kısım · Almas Beyi, Yelbegen', ready: true },
      { id: 4, name: 'Gök Yolu', boss: '2 kısım · Dev Kara Kuş', ready: true },
      { id: 5, name: 'Yeraltı', boss: '4 kat · Kerey, Demirhane, Matman, Erlik', ready: true },
    ],
  },
  {
    name: 'İKİNCİ KISIM', sub: 'Çin Seferi', levels: [
      { id: 6, name: 'Esir Türkler', boss: '3 kısım · Tang Yüzbaşısı, Çin Generali', ready: true },
    ],
  },
  {
    name: 'ÜÇÜNCÜ KISIM', sub: 'Oğuz\'un Seferleri', levels: [
      { id: 7, name: 'Karanlık Ülke', boss: '3 kısım · İt-Barak Başbuğu, Pehlivan', ready: true },
      { id: 8, name: 'İdil Boyu', boss: 'Urum Kağan', ready: false },
      { id: 9, name: 'Buz Dağı', boss: 'Alaca Aygır', ready: false },
      { id: 10, name: 'Çürçet', boss: 'Çürçet Kağan', ready: false },
      { id: 11, name: 'Güney Akını', boss: 'Masar Kağan', ready: false },
      { id: 12, name: 'Başgurd', boss: 'Kara-Şit', ready: false },
    ],
  },
];

export const EPILOG = {
  1: 'Tepegöz yıkıldı; Ötüken yeniden nefes aldı. Ama Erlik Han\'ın gölgesi bataklıklara, dağlara ve göklere uzanıyordu... Sırada Albastı var.',
  2: 'Albastı sisle birlikte dağıldı; bataklığın üstünde ilk kez güneş doğdu. Ama Altay\'da yedi başlı bir gölge bekliyordu...',
  3: 'Yelbegen\'in başları birer birer karlara düştü. Erlik\'in kapısı yerin dibindeydi, ama oraya giden yol göklerden geçiyordu...',
  4: 'Dev Kara Kuş bulutların arasına düştü. Tulpar, Oğuz\'u yerin yedi kat altına açılan kapının önüne bıraktı.',
  6: 'Zincirler kırıldı; esir Türkler yurtlarına döndü. Kimse kurtarıcılarının kim olduğunu bilmedi. Oğuz her zamanki gibi sessizce kayboldu... Ne zaman Türk\'ün başı derde girse, o yine çıkagelecek. DEVAMI GELECEK...',
  7: 'İt-Barak pehlivanının boyası döküldü, sürüsü kuzeyin karanlığına çekildi. Obalar yeniden ateş yaktı. Oğuz yine kimseye görünmeden uzaklaştı... Seferler sürecek.',
  5: 'Erlik Han yenildi; karanlıklar ülkesi mühürlendi. Gök Tengri, Oğuz\'a ölümsüzlük bağışladı. O günden sonra Oğuz, kimseye söylemeden Türk\'ü gözetti... BİRİNCİ KISIM SONA ERDİ.',
};

// Bölüm girişi: başlık kartı + tek cümlelik hikâye, bölümün haritası üzerinde kamera süzülür
const LEVEL_TEXT = {
  1: { name: 'ÖTÜKEN SURLARI', text: "Erlik'in ilk kulu Tepegöz, Ötüken'in surlarına dayandı. Oğuz tek başına surlara çıktı." },
  2: { name: 'KARA BATAKLIK', text: "Oğuz, Erlik'in izini sisli Kara Bataklık'a kadar sürdü. Sisin içinden bir kadın çığlığı yükseldi: Albastı!" },
  3: { name: 'ALTAY', text: 'Karlı Altay geçidinde, köyleri yutan yedi başlı dev Yelbegen yolu kesmişti.' },
  4: { name: 'GÖK YOLU', text: "Erlik'e giden yol göklerden geçiyordu. Gök Tengri, Oğuz'a kanatlı at Tulpar'ı gönderdi.", fly: true },
  5: { name: 'YERALTI', text: "Erlik'e giden yol yerin katlarından geçiyordu: oğlu Kerey Han'ın Kara-Teş'i, Erlik'in demirhanesi, Haydut Matman'ın Tüpken Kara Tamu'su ve en dipte Erlik'in tahtı." },
  7: { name: 'KARANLIK ÜLKE', text: "Kuzeyin güneş doğmayan Karanlık Ülkesi'nden it başlı İt-Barak akıncıları indi; obaları yağmaladılar. Ölümsüz Oğuz yeniden atına bindi." },
};
// İkinci Kısım açılışı: yüzyıllar sonra, esaret ve Oğuz'un dönüşü
const PART2 = [
  {
    text: 'Yüzyıllar geçti. Ölümsüz Oğuz, kimseye görünmeden bozkırı gözetiyordu.',
    enter(c) { c.mood('night'); c.fade(1); c.title([['İKİNCİ KISIM', 'sub'], ['ÇİN SEFERİ', 'logo']]); c.titleAlpha(0); c.hero.play('Idle_Loop', { fade: 0 }); },
    update(c, k) {
      c.fade(Math.max(0, 1 - k * 3));
      c.titleAlpha(k < 0.5 ? 1 : Math.max(0, 1 - (k - 0.5) * 4), k < 0.03);
      c.show(c.hero, 0, 0, c.Z - 8, Math.PI);
      c.cam(lerp(3, 1.4, k), 2, c.Z - 12, 0, 1.5, c.Z - 8);
    },
  },
  {
    text: "Bir gün kara haber geldi: Oğuz'un yokluğunda Çin ordusu Türk boylarını esir almış, boyunduruğa vurmuştu.",
    enter(c) {
      c.mood('cin');
      this.e = [0, 1, 2].map(i => c.actor('esir', i));
      for (const e of this.e) e.play('Crouch_Idle_Loop', { fade: 0 });
      this.g = [0, 1].map(i => c.foe(i, 'mizrakci', 'cinli'));
    },
    update(c, k) {
      this.e.forEach((e, i) => c.show(e, -2.2 + i * 2.2, 0, c.Z - 12 - (i % 2) * 0.6, 0));
      this.g.forEach((g, i) => c.show(g, i ? 3.4 : -3.4, 0, c.Z - 14, 0));
      c.cam(lerp(-1.5, 1.5, k), 1.7, c.Z - lerp(4, 6, k), 0, 1, c.Z - 12.5);
    },
  },
  {
    text: "Orhun Yazıtları'nın ağıdı yankılandı: \"Beylik erkek evladın kul, hanımlık kız evladın cariye oldu.\"",
    update(c, k) { c.mood('night', 'cin', k); c.cam(0, lerp(9, 6, k), c.Z + 6, 0, 2, c.Z - 60); },
  },
  {
    text: 'Oğuz kılıcını kuşandı. Halkını kurtarmak için tek başına savaşa tutuştu!',
    enter(c) { c.mood('cin'); c.swordMode(true); c.hero.play('Sword_Idle', { fade: 0 }); this.slash = false; },
    update(c, k) {
      c.show(c.hero, 0, 0, c.Z - 8, Math.PI);
      c.cam(lerp(1.1, 0.7, k), 1.7, c.Z - 10.6 + k * 0.4, 0, 1.5, c.Z - 8);
      if (k > 0.4 && !this.slash) { this.slash = true; c.hero.play('Sword_Regular_C', { loop: false, speed: 1.1 }); }
    },
    exit(c) { c.swordMode(false); },
  },
];

export function levelIntro(lv) {
  if (lv === 6) return PART2;
  const L = LEVEL_TEXT[lv];
  const up = L.fly ? 4 : 0;
  return [{
    text: L.text,
    enter(c) { c.fade(1); c.title([[`BÖLÜM ${lv}`, 'sub'], [L.name, 'logo']]); c.titleAlpha(0); },
    update(c, k) {
      c.fade(Math.max(0, 1 - k * 3));
      c.titleAlpha(k < 0.5 ? 1 : Math.max(0, 1 - (k - 0.5) * 4), k < 0.03);
      const e = ease(k);
      c.cam(lerp(6, 2, e), lerp(8, 3.5, e) + up, c.Z + lerp(12, -2, e), 0, 1.5 + up, c.Z - 40);
    },
  }];
}

// Destan Kitabı. model: assets.js şablonu; locked: henüz oyunda değil.
export const BOOK = [
  {
    id: 'oguz', name: 'Oğuz Kağan', title: 'Ölümsüz Akıncı', model: 'oguz', anim: 'Sword_Idle', sword: true, h: 1.9,
    text: "Oğuz Kağan Destanı'na göre Ay Kağan'ın oğludur. Kırk günde büyüyüp yürümüş, halkını kıran Kıyant canavarını tek başına öldürmüş, gök yeleli bir kurdun rehberliğinde dört bir yana akın ederek Oğuz boylarını birleştirmiştir. Bu destanda Oğuz, Türk yurduna saldıran kötülükleri yenerek ölümsüzlük kazanır. Kimseye söylemeden yüzyıllar boyunca Türk'ü gözetir; başı derde girdiğinde savaşın ortasında çıkagelir.",
  },
  {
    id: 'kurt', name: 'Gök Yeleli Kurt', title: 'Yol gösteren', model: 'wolf', anim: 'Idle', scale: 0.34, h: 1.1,
    text: "Destanda bir ışığın içinden gök tüylü, gök yeleli büyük bir erkek kurt çıkar ve Oğuz'a: \"Ordunun önünde ben yürüyeceğim\" der. Türklerin kutlu yol göstericisidir; Ergenekon'dan çıkışta da yolu bir bozkurt gösterir.",
  },
  {
    id: 'at', name: 'Yağız At', title: "Türk'ün kanadı", model: 'horse', anim: 'Idle', scale: 0.48, h: 2.3,
    text: "\"At, Türk'ün kanadıdır.\" Bozkırda akınlar, göçler ve destanlar at sırtında yazıldı. Oyunda altın nalı toplayınca Oğuz ata biner: hızı artar, önündeki her şeyi çiğner. Ama at da yorulur; süresi dolunca Oğuz'u indirip geride kalır.",
  },
  {
    id: 'kormos', name: 'Körmösler', title: "Erlik Han'ın kulları", model: 'kormos', anim: 'Idle_Shield_Loop', parts: ['Axe', 'Shield'], h: 2,
    text: "Altay inanışında Körmösler, yeraltı hükümdarı Erlik Han'ın hizmetindeki kötü ruhlardır; ölülerin ruhlarını yeraltına sürükler, insanlara hastalık ve felaket getirirler. Beş türleri vardır: Baltacı · Kalkanlı (ok işlemez, önce kalkanını kılıçla kır) · Mızrakçı (mızrağın altından kay) · Pusucu (surlardan aniden atlar) · Yeraltı kulu (yerden fırlar).",
  },
  {
    id: 'tepegoz', name: 'Tepegöz', title: 'Tek gözlü dev', model: 'tepegoz', anim: 'Idle_Loop', h: 2.1,
    text: "Dede Korkut Kitabı'nda bir çoban ile peri kızının oğludur; yüzünde göz yoktur, tek gözü başının tepesindedir; ona ok da kılıç da işlemez. Oğuz yurdunu haraca bağlamış, her gün insan ve koyun istemiştir. Aruz Koca'nın oğlu Basat onu tek gözünü kör ederek yenmiştir. Oyunda da ona ok işlemez: topuzuyla yeri dövüp sersemlediğinde kılıçla vur!",
  },
  {
    id: 'albasti', name: 'Albastı', title: 'Al karısı', model: 'albasti', anim: 'Idle_Loop', h: 2,
    text: "Türk halk inanışında lohusa kadınlara ve yeni doğan bebeklere musallat olan, uzun sarı saçlı kötü ruhtur; Al Karısı da denir. Sisin içinde kılık değiştirir. Oyunda üç kopyaya bölünür: gerçeğinin gölgesi vardır, onu okla vur! Kılıç işlemez; çığlık dalgalarından şerit değiştirerek kaç.",
  },
  {
    id: 'yelbegen', name: 'Yelbegen', title: 'Çok başlı dev', model: 'yelbegen', anim: 'Sword_Idle', h: 2.1,
    text: 'Altay ve Türk masallarında çok başlı, insan yiyen devdir; Ak-Han masalında Sarı Yelbegen yedi başlıdır ve kahraman onu başlarını tek tek keserek yener (Ögel, s.315). Oyunda başları sırayla şeritlere saldırır. Sonra ekranda çıkan yöne kaydır ve o yandaki başları kes! Geç kalırsan ısırır.',
  },
  {
    id: 'tulpar', name: 'Tulpar', title: 'Kanatlı at', model: 'tulpar', anim: 'Idle', scale: 0.48, h: 2.4,
    text: 'Türk mitolojisinde kanatlı, yere basmadan koşan kutlu attır; kahramanları göklere taşır. Gök Yolu bölümünde Oğuz\'u sırtında taşır: sağa-sola ve yukarı-aşağı kaydırarak fırtına bulutlarından kaç, kara kuşları okla düşür.',
  },
  {
    id: 'karakus', name: 'Dev Kara Kuş', title: "Erlik'in kanadı", model: 'karakus', scale: 1.4, h: 1.6,
    text: 'Göklerde Erlik\'e hizmet eden dev kara kuş. Tüylerini ok gibi yağdırır, sürüler salar. Arada dönüp çığlık attığında gözü açıkta kalır: o an okla vur!',
  },
  {
    id: 'erlik', name: 'Erlik Han', title: 'Yeraltının hükümdarı', model: 'erlik', anim: 'Sword_Idle', h: 2.3,
    text: 'Türk-Altay inanışında yeraltı dünyasının ve ölümün hükümdarıdır. Kara sakalı dizine iner, boynuzları ağaç kökleri gibi kıvrıktır; kibri yüzünden yeraltına sürülmüş, oradan insanlara kötülük salar. Oyunda alevde kaybolup belirir, ateş sütunları ve balyoz dalgaları yollar. Diz çöktüğünde kılıçla vur, sonunda hızlı hızlı dokunarak bitir!',
  },
  {
    id: 'tang', name: 'Tang Askerleri', title: 'İmparatorluk ordusu', model: 'cinli', anim: 'Sword_Idle', parts: ['Dao', 'Shield'], h: 2,
    text: "630 yılında Doğu Göktürk Kağanlığı Tang İmparatorluğu'na yenildi; Türkler elli yıl Çin egemenliğinde yaşadı. Kutluk Kağan'ın 682'deki ayaklanmasıyla bağımsızlık yeniden kazanıldı; Orhun Yazıtları bu acıyı anlatır. Oyunda askerler kılıçlı, kalkanlı, mızrakçı ve surlardan atlayan pusucu olarak dört türdür.",
  },
  {
    id: 'cin', name: 'Çin Generali', title: 'Kalkanlı komutan', model: 'general', anim: 'Idle_Shield_Loop', parts: ['Dao', 'Shield'], h: 2.1,
    text: "Türkleri esir alan imparatorluk ordusunun komutanı. Önce atıyla kaçar; surlardaki okçular ok yağdırır, atı demir diken döker. Sonra kalkanıyla karşına dikilir: kalkanlıyken vuruşun işlemez. Saldırısında ekrana bak: ▲ ZIPLA ya da ▼ EĞİL. Doğru hamleyle kaçarsan dengesi bozulur; o an vur!",
  },
  {
    id: 'geyik', name: 'Ak Geyik', title: 'Gizli yolun kılavuzu', model: 'stag', anim: 'Idle', scale: 0.42, h: 2.2,
    text: "Türk ve Macar efsanelerinde avcıları bilinmeyen yurtlara götüren kutlu geyik: Hun avcıları bir dişi geyiği kovalayarak Meotis bataklığını aşıp yeni topraklar bulmuş, Kutrigur ile Utigur kardeşler de bir geyiğin ardından denizi geçmiştir (Ögel, s.578–582). Oyunda nadiren önünden koşar; yakalarsan seni altın yapraklı kayın korusundaki gizli yola, kut dolu yola götürür.",
  },
  {
    id: 'sulu', name: 'Sulu', title: 'Bataklık ölüsü', model: 'sulu', anim: 'Zombie_Idle_Loop', h: 2,
    text: "Kara Bataklık'ın dibinde bekleyen, yosun bağlamış ölüler. Suyun altında durur, yaklaşınca birden yükselirler. İki vuruşta düşerler; oka bir kez dayanırlar.",
  },
  {
    id: 'albis', name: 'Albıslar', title: 'Albastı\'nın soyu', model: 'albasti', anim: 'Idle_Loop', scale: 0.8, h: 1.7,
    text: "Altay yaratılış anlatısında Erlik, örsüne her vuruşta bir yaratık doğurur; bunlardan biri Albıs'tır (Ögel, s.461–462). Oyunda yerden hafifçe süzülür ve son anda senin şeridine kayar: gözün üstünde olsun!",
  },
  {
    id: 'almas', name: 'Almas', title: 'Altay\'ın yaban adamı', model: 'almas', anim: 'Idle_Loop', h: 2.1,
    text: "Altay ve Moğol dağlarında yaşadığına inanılan, baştan ayağa kıllı yaban adam. Oyunda uzaktan buz kayası yuvarlar: şerit değiştirerek kaç; iki vuruşta düşer.",
  },
  {
    id: 'sulmus', name: 'Şulmuslar', title: 'Erlik\'in iblisleri', model: 'sulmus', anim: 'Zombie_Idle_Loop', h: 2,
    text: "Altay yaratılış destanında Erlik'in örsünde doğan kötü ruhlar arasında sayılır (Ögel, s.461). Kızıl derili, kara boynuzludurlar; seni görünce koşarak üstüne atılırlar.",
  },
  {
    id: 'kerey', name: 'Kerey Han', title: 'Erlik\'in oğlu', model: 'kerey', anim: 'Sword_Idle', h: 2.2,
    text: "Altay anlatısında Erlik'in oğlu ve insan dünyasının cehennemi Kara-Teş'in hükümdarıdır; burun kemiği bakırdandır (Ögel, s.458). Oyunda Yeraltı'nın birinci katının boss'u: balyozuyla şok dalgası yollar, sonra bakır burnunu şeridine saplar. Burnu toprağa gömülüyken kılıçla vur!",
  },
  {
    id: 'demirhane', name: "Erlik'in Demirhanesi", title: 'Yeraltının ikinci katı', model: 'erlik', anim: 'Punch_Cross', h: 2.3,
    text: "Erlik yeraltında körük, kıskaç ve çekiç yapar; örse her vuruşunda bir kurbağa, yılan, ayı, domuz, Albıs, Şulmus doğar. Ülgen demirhaneyi yakınca alevden Kordoy, kıskaçtan Yalban kuşları çıkar (Ögel, s.461–462). Oyunda örsten doğan iblisleri biç; örs akkor kesilince okla vur!",
  },
  {
    id: 'matman', name: 'Haydut Matman', title: 'Tüpken Kara Tamu\'nun hükümdarı', model: 'sulmus', anim: 'MX_GS_Idle2', h: 2.2,
    text: "Altay anlatısında dokuz dünyanın her birinin ayrı bir cehennemi vardır; en derin kara cehennem Tüpken Kara Tamu'yu 'Haydut' lakaplı Matman-Karakçı yönetir (Ögel, s.435). Oyunda Yeraltı'nın üçüncü katının başbuğudur: şeridine atılır, savuruşlarından eğilip zıplayarak kaç, sendeleyince vur!",
  },
  {
    id: 'itbarak', name: 'İt-Barak', title: 'Karanlık Ülke\'nin it başlıları', model: 'itbarak', anim: 'Sword_Idle', parts: ['Axe', 'Shield'], h: 2,
    text: "Oğuz destanında kuzeyin 'Karanlıklar Ülkesi'nde yaşayan, erkekleri it başlı, çok kıllı bir kavim; Farsça metinlerde Kıl-Barak diye geçer. 'Barak' adı 'hızlı gitmek' anlamından gelir (Ögel, s.185–195). Oyunda koşarak üstüne atılırlar ve oklardan yana kaçarlar; kılıcı yakından çal!",
  },
  {
    id: 'boyali', name: 'İt-Barak Pehlivanı', title: 'Üç kat boyalı', model: 'boyali', anim: 'Idle_Loop', h: 2.4,
    text: "Destana göre İt-Barak pehlivanları savaştan önce siyah ve beyaz iki sıvıyı karıştırıp vücutlarına üç kat sürer, böylece oklar onlara işlemezdi; Oğuz'un ilk akını bu yüzden yenilgiyle bitti (Ögel, s.186). Oyunda saldırısından yana kaç, dengesi bozulunca kılıçla vur: her vuruş bir kat boyayı kırar. Boyası dökülünce okla bitir!",
  },
];
