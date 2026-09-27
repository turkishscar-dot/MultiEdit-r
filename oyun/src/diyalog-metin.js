// Diyalog metinleri ve konuşanlar (yalnız veri: tools/vo_dialog.mjs de okur).
// Akıl hocası Uluğ Türük; 6. ve 7. bölümler yüzyıllar sonra geçtiği için rüyada konuşur.
// konuşanlar: model, panel rengi, portrede kafa yüksekliği düzeltmesi
export const SPEAKERS = {
  ulug: { name: 'ULUĞ TÜRÜK', model: 'ulug', bg: '#4a6aa8' },
  ulugr: { name: 'ULUĞ TÜRÜK (RÜYADA)', model: 'ulug', bg: '#2a2a5a' },
  oguz: { name: 'OĞUZ', model: 'oguz', bg: '#d9962a' },
  korbasi: { name: 'KÖRMÖS BAŞI', model: 'kormos', bg: '#5a2a4a' },
  tepegoz: { name: 'TEPEGÖZ', model: 'tepegoz', bg: '#7a2a1a' },
  albasti: { name: 'ALBASTI', model: 'albasti', bg: '#1e3a30' },
  yelbegen: { name: 'YELBEGEN', model: 'yelbegen', bg: '#4a5a7a' },
  kerey: { name: 'KEREY HAN', model: 'kerey', bg: '#5a1a10' },
  matman: { name: 'HAYDUT MATMAN', model: 'sulmus', bg: '#3a0a2a' },
  erlik: { name: 'ERLİK HAN', model: 'erlik', bg: '#6a0a0a' },
  general: { name: 'ÇİN GENERALİ', model: 'general', bg: '#8a3a2a' },
  pehlivan: { name: 'İT-BARAK PEHLİVANI', model: 'boyali', bg: '#1a2a3a' },
};

// [konuşan, cümle]. Anahtar: harita düğümü (bölüm-kısım). 'son:' ile başlayanlar bölüm sonu.
export const DIALOGS = {
  '1-0': [['ulug', "Oğuz! Erlik'in kulları Körmösler sur kapısına dayandı. Başlarında Körmös Başı var."], ['oguz', 'Kapıyı tutsunlar. Ben surun üstünden inerim.'], ['ulug', 'Önce kırk kut topla, yolun açılsın. Sonra başlarını ez; kulları dağılır.']],
  '1-1': [['ulug', 'Akşam iniyor. Burçlardan pusucular atlar; ünlemi gördüğün yerde hazır ol.'], ['oguz', 'Sekiz Körmös düşmeden gün batmayacak.'], ['ulug', "Uçurumda bir kartal bekler, Er-Töştük'ün Kara Kuşu gibi. Seni surun öbür yanına taşıyacak."]],
  '1-2': [['ulug', 'Gök kızıla kesti. Tepegöz geliyor; ona ne ok işler ne kılıç.'], ['oguz', 'Basat onu nasıl yendi?'], ['ulug', 'Tek gözünü kör etti. Sen de bekle: topuzunu yere vurup sersemlediğinde kılıcını indir.'], ['tepegoz', "Küçük insan! Ötüken'in ocakları benim karnımı doyuracak!"]],
  'son:1': [['ulug', "Tepegöz yıkıldı, Ötüken yeniden nefes aldı. Ama Erlik'in gölgesi bataklıklara uzanıyor."]],
  '2-0': [['ulug', "Erlik'in izi Kara Bataklık'a iner. Sular ölüleri saklar; yosunlu Sulular yaklaşınca yükselir."], ['oguz', 'Suyun altından gelen düşman... Irmağı nasıl geçeceğim?'], ['ulug', 'Irmak kolunda bir sal var. Akıntıya bırak kendini, kıyıdaki okçulara yayını çevir.']],
  '2-1': [['ulug', 'Ölü orman bir kuyuya iner. Yol bitince aşağı atla; dipte bataklık sürer.'], ['oguz', 'Kök ve kaya arasından düşerken de yolumu bulurum.']],
  '2-2': [['ulug', "Kara Göl'de bir kadın çığlığı... Albastı'dır bu, Al Karısı. Sisin içinde kılık değiştirir."], ['albasti', 'Oğuz... Üçümüzden hangisi benim?'], ['ulug', 'Gerçeğinin gölgesi vardır. Onu okla vur; kılıç ruhu kesmez.']],
  'son:2': [['ulug', "Albastı sisle birlikte dağıldı. Ama Altay'da yedi başlı bir gölge bekliyor."]],
  '3-0': [['ulug', "Altay'ın kayın ormanlarında Almaslar yaşar, baştan ayağa kıllı yaban adamlar. Beyleri yolunu kesecek."], ['oguz', 'Buz kayası yuvarlayan devler mi?'], ['ulug', 'Evet. Şerit değiştirerek kaç; iki vuruşta düşerler.']],
  '3-1': [['ulug', 'Yamaçtan donmuş bir göle ineceksin. Kalkanını ayağının altına al, buzda kay.'], ['oguz', 'Kalkan kızak olur, çatlakları zıplarım.']],
  '3-2': [['ulug', 'Geçitte yedi başlı Yelbegen bekliyor. Ak-Han masalında kahraman başlarını tek tek keserek onu yendi.'], ['yelbegen', 'Yedi ağzım var, yedisi de aç!'], ['oguz', 'Hangi yöne döneceğini göster; başını oradan keserim.']],
  'son:3': [['ulug', "Yelbegen'in başları karlara düştü. Erlik'in kapısı yerin dibinde, ama oraya giden yol göklerden geçiyor."]],
  '4-0': [['ulug', "Erlik'e giden yol göklerden geçer. Gök Tengri sana kanatlı at Tulpar'ı gönderdi."], ['oguz', 'Tulpar... Yere basmadan koşan at.'], ['ulug', 'Halkalardan geç, bulutlardan kaç. Üç şerit, üç yükseklik: gözün hep açık olsun.']],
  '4-1': [['ulug', "Fırtınanın içinde Dev Kara Kuş var, Erlik'in kanadı. Tüylerini ok gibi yağdırır."], ['oguz', 'Altın parlayan tüyleri kılıcımla geri çalarım.'], ['ulug', 'Çığlık attığında gözü açıkta kalır. O an okunu bırak.']],
  'son:4': [['ulug', "Kara Kuş bulutların arasına düştü. Tulpar seni yerin yedi kat altına açılan kapıya bıraktı."]],
  '5-0': [['ulug', "Yerin katlarına iniyorsun. İlk kat Kara-Teş; Erlik'in oğlu Kerey Han'ın ülkesi."], ['kerey', 'Babamın kapısına varamayacaksın, Oğuz!'], ['ulug', 'Burnu bakırdandır. Şeridine saplandığında kılıcını indir.']],
  '5-1': [['ulug', 'Erlik örse her vurduğunda bir yaratık doğar: Albıs, Şulmus... Burası onun demirhanesi.'], ['oguz', 'Örsü susturursam doğumlar da durur.'], ['ulug', 'Örs akkor kesilince okla vur.']],
  '5-2': [['ulug', 'Dokuz dünyanın en derin cehennemi Tüpken Kara Tamu. Hükümdarı Haydut Matman.'], ['matman', 'Buraya inen geri çıkmaz.'], ['oguz', 'Ben geri çıkarım, Matman. Yolumdan çekil.']],
  '5-3': [['ulug', "En dipte Erlik'in tahtı. Kibri yüzünden yeraltına sürüldü, oradan insanlara kötülük salar."], ['erlik', "Gök Tengri'nin küçük kulu! Ateşimde erisin kılıcın!"], ['oguz', 'Ateş sütunlarından kaçarım. Diz çöktüğünde kılıcım seni bulur.'], ['ulug', 'Sonunda hızlı hızlı vur, Oğuz! Karanlıklar ülkesini mühürle!']],
  'son:5': [['ulug', "Erlik yenildi, karanlıklar ülkesi mühürlendi. Gök Tengri sana ölümsüzlük bağışladı, Oğuz."]],
  '6-0': [['ulugr', 'Oğuz... Yüzyıllardır toprağın altındayım ama rüyana geldim. Türk boyları esir düştü.'], ['oguz', "Orhun'daki taşların ağıdını duydum. Onları kim tuttu?"], ['ulugr', 'Tang ordusu. Önce sınır karakolunu geç; yüzbaşıları kalkanla bekler.']],
  '6-1': [['ulugr', 'Kampta boyunduruklu esirler var. Üstlerine koş; boyunduruk kırılsın, yurtlarına dönsünler.'], ['oguz', 'Tek birini bile geride bırakmam.']],
  '6-2': [['ulugr', 'Kale kapısında general bekliyor. Önce atıyla kaçar; surlardaki okçuların oklarını kılıcınla geri çal.'], ['general', 'Bozkırın hayaleti! Kalkanım seni durdurur.'], ['oguz', 'Saldırını beklerim. Doğru hamleden sonra kalkanın düşer.']],
  'son:6': [['ulugr', 'Zincirler kırıldı, esirler yurtlarına döndü. Kimse kurtarıcılarının kim olduğunu bilmeyecek.']],
  '7-0': [['ulugr', "Kuzeyin güneş doğmayan ülkesinden it başlı İt-Barak akıncıları indi."], ['oguz', 'Destanda onlara ilk akınım yenilgiyle bitmişti.'], ['ulugr', 'Bu kez başbuğları buzun üstünde. Oklardan kaçarlar; kılıcını yakından çal.']],
  '7-1': [['ulugr', 'Ordun bu ırmağı sallarla geçmişti. Sen de salla geç; gökteki ışıklar yolunu aydınlatır.'], ['oguz', 'Işık sönmeden kombo kombo ilerlerim.']],
  '7-2': [['ulugr', 'Pehlivanları siyah ve beyaz iki sıvıyı karıştırıp bedenlerine üç kat sürer; oklar işlemez.'], ['pehlivan', 'Üç kat boyam var, Oğuz. Hangisini kıracaksın?'], ['oguz', 'Hepsini. Her vuruşta bir kat.']],
  'son:7': [['ulugr', 'İt-Barak pehlivanının boyası döküldü, obalar yeniden ateş yaktı. Seferler sürecek, Oğuz.']],
};
