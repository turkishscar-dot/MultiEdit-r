# Oğuz Kağan: Seslendirme Rehberi (ElevenLabs)

Oyundaki bilgisayar sesi kaldırıldı. Ara sahneler artık `vo/` klasöründeki MP3 dosyalarını çalıyor. Bir cümlenin dosyası yoksa sahne sessiz geçer ve yazı ekranda kalır. Yani kaydı parça parça ekleyebilirsin.

## 1. Ses seçimi: yaşlı, belgesel anlatan erkek sesi

**Yol A: Hazır ses (Voice Library)**
1. ElevenLabs'te **Voices → Voice Library** bölümüne gir.
2. Filtreleri şöyle ayarla:
   - **Language:** Turkish (bulamazsan English)
   - **Gender:** Male
   - **Age:** Old
   - **Use case:** Narrative & Story ya da Documentary
3. Aramaya *narrator*, *storyteller*, *documentary*, *deep* ya da *wise old man* yaz.
4. Birkaç sese şu cümleyi okutarak dinle, en tok ve ağır olanı seç: *"Çok eski zamanlarda, Ötüken'in bozkırlarında…"*

**Yol B: Sesi kendin tasarla (Voice Design)**
1. **Voices → Create a Voice → Voice Design** bölümüne gir.
2. Açıklama alanına şunu yapıştır (İngilizce açıklama daha iyi sonuç verir):

   > An elderly Turkish man in his seventies with a deep, warm, resonant and slightly raspy voice. He speaks slowly and solemnly, like a documentary narrator telling an ancient Turkic epic by a campfire. Clear, well-articulated standard Turkish (Istanbul accent), calm authority, dramatic pauses.

3. Örnek metin olarak Türkçe bir cümle yaz, üretilen sesleri dinle ve beğendiğini kaydet.

## 2. Ayarlar

| Ayar | Değer | Neden |
|---|---|---|
| Model | **Eleven Multilingual v2** | Türkçede en düzgün telaffuz. Daha duygulu anlatım istersen *Eleven v3* dene. |
| Stability (Kararlılık) | **%50–60** | Anlatıcı sesi tutarlı kalsın, yine de tekdüze olmasın. |
| Similarity (Benzerlik) | **%75** | Ses kimliği korunur. |
| Style Exaggeration (Üslup) | **%15–25** | Hafif destan havası verir. Fazlası abartılı olur. |
| Speaker Boost | **Açık** | Daha dolgun ses. |
| Speed (Hız) | **0.90** | Belgesel temposu. |
| Çıktı biçimi | **MP3, 44.1 kHz, 128 kbps** | Oyunun beklediği biçim. |

**İpuçları**
- Her cümleyi **ayrı ayrı** üret ve indir.
- Bir kelime yanlış okunursa yazılışını kolaylaştır: "Kağan" yerine "Kaan", "Ötüken" yerine "Ö-tü-ken" gibi.
- Dramatik bir durak için cümleye `...` ekleyebilirsin. Dosya adı ise **aşağıdaki listedeki gibi kalmalı**.

## 3. Dosyaları nereye koyacaksın?

- **Geliştirme için:** `oguzkhan/public/vo/` klasörü. Klasör yoksa oluştur.
- **Çift tıklanan `OYNA.html` için:** `OYNA.html`'in yanındaki `vo/` klasörü.

Dosya adları metinden üretilir. Bir cümleyi değiştirirsem dosya adı da değişir. Böylece eski kayıt yanlış yerde çalmaz. Liste güncel değilse `node tools/vo_list.mjs` komutu bu dosyayı yeniden yazar.

## 4. Okunacak metinler (17 cümle)

### Açılış hikâyesi (çizgi roman)

| Dosya adı | Okunacak metin |
|---|---|
| `driocn.mp3` | Çok eski zamanlarda, Ötüken'in bozkırlarında Oğuz boyları özgür ve güçlüydü. |
| `19y4kb6.mp3` | Ama yerin yedi kat altında, karanlıklar ülkesinin hükümdarı Erlik Han uyandı. |
| `1shvtag.mp3` | Kulları Körmösler yerden fırladı, Oğuz yurduna ölüm saçtılar. |
| `17nythj.mp3` | Dağlar kadar büyük Tepegöz boyları dağıttı, ocakları söndürdü. |
| `ag6hwa.mp3` | Umudun tükendiği gece, gök yeleli bir kurt belirdi ve Oğuz'a yol gösterdi. |
| `1hdyke6.mp3` | Oğuz yayını kuşandı, kılıcını çekti... |
| `1sas92m.mp3` | ...ve tek başına, düşmanın kalbine akın etti! |

### Bölüm 1 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `1t2iqmi.mp3` | Erlik'in ilk kulu Tepegöz, Ötüken'in surlarına dayandı. Oğuz tek başına surlara çıktı. |

### Bölüm 2 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `k8izh2.mp3` | Oğuz, Erlik'in izini sisli Kara Bataklık'a kadar sürdü. Sisin içinden bir kadın çığlığı yükseldi: Albastı! |

### Bölüm 3 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `1a3d56m.mp3` | Karlı Altay geçidinde, köyleri yutan yedi başlı dev Yelbegen yolu kesmişti. |

### Bölüm 4 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `lwcfxy.mp3` | Erlik'e giden yol göklerden geçiyordu. Gök Tengri, Oğuz'a kanatlı at Tulpar'ı gönderdi. |

### Bölüm 5 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `1gstqex.mp3` | Erlik'e giden yol yerin katlarından geçiyordu: oğlu Kerey Han'ın Kara-Teş'i, Erlik'in demirhanesi, Haydut Matman'ın Tüpken Kara Tamu'su ve en dipte Erlik'in tahtı. |

### Bölüm 6 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `z2ww9t.mp3` | Yüzyıllar geçti. Ölümsüz Oğuz, kimseye görünmeden bozkırı gözetiyordu. |
| `j6svfq.mp3` | Bir gün kara haber geldi: Oğuz'un yokluğunda Çin ordusu Türk boylarını esir almış, boyunduruğa vurmuştu. |
| `2a55o8.mp3` | Orhun Yazıtları'nın ağıdı yankılandı: "Beylik erkek evladın kul, hanımlık kız evladın cariye oldu." |
| `10g6lv8.mp3` | Oğuz kılıcını kuşandı. Halkını kurtarmak için tek başına savaşa tutuştu! |

### Bölüm 7 girişi

| Dosya adı | Okunacak metin |
|---|---|
| `4mg4gw.mp3` | Kuzeyin güneş doğmayan Karanlık Ülkesi'nden it başlı İt-Barak akıncıları indi; obaları yağmaladılar. Ölümsüz Oğuz yeniden atına bindi. |

<!-- diyaloglar:başla -->
## 5. Görev diyalogları (68 cümle)

Konuşanlar farklı seslerle okunmalı: **Uluğ Türük** yaşlı, bilge, sakin (anlatıcı sesine yakın ama daha yumuşak); **Oğuz** genç, kararlı erkek sesi; kötüler (Tepegöz, Erlik, Kerey Han, Matman, Yelbegen, General, Pehlivan) kalın ve alaycı, **Albastı** fısıltılı kadın sesi. Dosyalar aynı `vo/` klasörüne gider.

### 1. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `z8r57m.mp3` | ULUĞ TÜRÜK | Oğuz! Erlik'in kulları Körmösler sur kapısına dayandı. Başlarında Körmös Başı var. |
| `1nuovpg.mp3` | OĞUZ | Kapıyı tutsunlar. Ben surun üstünden inerim. |
| `qshbwi.mp3` | ULUĞ TÜRÜK | Önce kırk kut topla, yolun açılsın. Sonra başlarını ez; kulları dağılır. |

### 1. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1demxl8.mp3` | ULUĞ TÜRÜK | Akşam iniyor. Burçlardan pusucular atlar; ünlemi gördüğün yerde hazır ol. |
| `1x5xpvt.mp3` | OĞUZ | Sekiz Körmös düşmeden gün batmayacak. |
| `cl7odz.mp3` | ULUĞ TÜRÜK | Uçurumda bir kartal bekler, Er-Töştük'ün Kara Kuşu gibi. Seni surun öbür yanına taşıyacak. |

### 1. bölüm, 3. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `xx2zk1.mp3` | ULUĞ TÜRÜK | Gök kızıla kesti. Tepegöz geliyor; ona ne ok işler ne kılıç. |
| `15g5rkp.mp3` | OĞUZ | Basat onu nasıl yendi? |
| `1c5lpzq.mp3` | ULUĞ TÜRÜK | Tek gözünü kör etti. Sen de bekle: topuzunu yere vurup sersemlediğinde kılıcını indir. |
| `wn34b2.mp3` | TEPEGÖZ | Küçük insan! Ötüken'in ocakları benim karnımı doyuracak! |

### 1. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `xaa79.mp3` | ULUĞ TÜRÜK | Tepegöz yıkıldı, Ötüken yeniden nefes aldı. Ama Erlik'in gölgesi bataklıklara uzanıyor. |

### 2. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `z9rxra.mp3` | ULUĞ TÜRÜK | Erlik'in izi Kara Bataklık'a iner. Sular ölüleri saklar; yosunlu Sulular yaklaşınca yükselir. |
| `1rted4.mp3` | OĞUZ | Suyun altından gelen düşman... Irmağı nasıl geçeceğim? |
| `1i6h33b.mp3` | ULUĞ TÜRÜK | Irmak kolunda bir sal var. Akıntıya bırak kendini, kıyıdaki okçulara yayını çevir. |

### 2. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1ofcwp4.mp3` | ULUĞ TÜRÜK | Ölü orman bir kuyuya iner. Yol bitince aşağı atla; dipte bataklık sürer. |
| `1w78rpp.mp3` | OĞUZ | Kök ve kaya arasından düşerken de yolumu bulurum. |

### 2. bölüm, 3. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1yrxy68.mp3` | ULUĞ TÜRÜK | Kara Göl'de bir kadın çığlığı... Albastı'dır bu, Al Karısı. Sisin içinde kılık değiştirir. |
| `1syxj5e.mp3` | ALBASTI | Oğuz... Üçümüzden hangisi benim? |
| `1e0iixp.mp3` | ULUĞ TÜRÜK | Gerçeğinin gölgesi vardır. Onu okla vur; kılıç ruhu kesmez. |

### 2. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1l4m7ew.mp3` | ULUĞ TÜRÜK | Albastı sisle birlikte dağıldı. Ama Altay'da yedi başlı bir gölge bekliyor. |

### 3. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `slxuo0.mp3` | ULUĞ TÜRÜK | Altay'ın kayın ormanlarında Almaslar yaşar, baştan ayağa kıllı yaban adamlar. Beyleri yolunu kesecek. |
| `iwimar.mp3` | OĞUZ | Buz kayası yuvarlayan devler mi? |
| `1ck0abb.mp3` | ULUĞ TÜRÜK | Evet. Şerit değiştirerek kaç; iki vuruşta düşerler. |

### 3. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1piprqg.mp3` | ULUĞ TÜRÜK | Yamaçtan donmuş bir göle ineceksin. Kalkanını ayağının altına al, buzda kay. |
| `s8dxxt.mp3` | OĞUZ | Kalkan kızak olur, çatlakları zıplarım. |

### 3. bölüm, 3. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1frdtcj.mp3` | ULUĞ TÜRÜK | Geçitte yedi başlı Yelbegen bekliyor. Ak-Han masalında kahraman başlarını tek tek keserek onu yendi. |
| `1hx88k6.mp3` | YELBEGEN | Yedi ağzım var, yedisi de aç! |
| `1rodajh.mp3` | OĞUZ | Hangi yöne döneceğini göster; başını oradan keserim. |

### 3. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `otoln3.mp3` | ULUĞ TÜRÜK | Yelbegen'in başları karlara düştü. Erlik'in kapısı yerin dibinde, ama oraya giden yol göklerden geçiyor. |

### 4. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `gutdyb.mp3` | ULUĞ TÜRÜK | Erlik'e giden yol göklerden geçer. Gök Tengri sana kanatlı at Tulpar'ı gönderdi. |
| `vm3hj2.mp3` | OĞUZ | Tulpar... Yere basmadan koşan at. |
| `ofd4ih.mp3` | ULUĞ TÜRÜK | Halkalardan geç, bulutlardan kaç. Üç şerit, üç yükseklik: gözün hep açık olsun. |

### 4. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1lx9g3a.mp3` | ULUĞ TÜRÜK | Fırtınanın içinde Dev Kara Kuş var, Erlik'in kanadı. Tüylerini ok gibi yağdırır. |
| `17ytx3n.mp3` | OĞUZ | Altın parlayan tüyleri kılıcımla geri çalarım. |
| `hlblyd.mp3` | ULUĞ TÜRÜK | Çığlık attığında gözü açıkta kalır. O an okunu bırak. |

### 4. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1c9fvl6.mp3` | ULUĞ TÜRÜK | Kara Kuş bulutların arasına düştü. Tulpar seni yerin yedi kat altına açılan kapıya bıraktı. |

### 5. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1u59os2.mp3` | ULUĞ TÜRÜK | Yerin katlarına iniyorsun. İlk kat Kara-Teş; Erlik'in oğlu Kerey Han'ın ülkesi. |
| `eh9w1g.mp3` | KEREY HAN | Babamın kapısına varamayacaksın, Oğuz! |
| `1wlt1e7.mp3` | ULUĞ TÜRÜK | Burnu bakırdandır. Şeridine saplandığında kılıcını indir. |

### 5. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1mx3qfn.mp3` | ULUĞ TÜRÜK | Erlik örse her vurduğunda bir yaratık doğar: Albıs, Şulmus... Burası onun demirhanesi. |
| `e5coc2.mp3` | OĞUZ | Örsü susturursam doğumlar da durur. |
| `1p6evs1.mp3` | ULUĞ TÜRÜK | Örs akkor kesilince okla vur. |

### 5. bölüm, 3. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `ea72ol.mp3` | ULUĞ TÜRÜK | Dokuz dünyanın en derin cehennemi Tüpken Kara Tamu. Hükümdarı Haydut Matman. |
| `ezw1oz.mp3` | HAYDUT MATMAN | Buraya inen geri çıkmaz. |
| `6xb1io.mp3` | OĞUZ | Ben geri çıkarım, Matman. Yolumdan çekil. |

### 5. bölüm, 4. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `pmwqkt.mp3` | ULUĞ TÜRÜK | En dipte Erlik'in tahtı. Kibri yüzünden yeraltına sürüldü, oradan insanlara kötülük salar. |
| `1aaediv.mp3` | ERLİK HAN | Gök Tengri'nin küçük kulu! Ateşimde erisin kılıcın! |
| `3pnng9.mp3` | OĞUZ | Ateş sütunlarından kaçarım. Diz çöktüğünde kılıcım seni bulur. |
| `11r7ayc.mp3` | ULUĞ TÜRÜK | Sonunda hızlı hızlı vur, Oğuz! Karanlıklar ülkesini mühürle! |

### 5. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `10ivwl9.mp3` | ULUĞ TÜRÜK | Erlik yenildi, karanlıklar ülkesi mühürlendi. Gök Tengri sana ölümsüzlük bağışladı, Oğuz. |

### 6. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `j97olw.mp3` | ULUĞ TÜRÜK (RÜYADA) | Oğuz... Yüzyıllardır toprağın altındayım ama rüyana geldim. Türk boyları esir düştü. |
| `gv92bl.mp3` | OĞUZ | Orhun'daki taşların ağıdını duydum. Onları kim tuttu? |
| `15udnz3.mp3` | ULUĞ TÜRÜK (RÜYADA) | Tang ordusu. Önce sınır karakolunu geç; yüzbaşıları kalkanla bekler. |

### 6. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1shkesp.mp3` | ULUĞ TÜRÜK (RÜYADA) | Kampta boyunduruklu esirler var. Üstlerine koş; boyunduruk kırılsın, yurtlarına dönsünler. |
| `jz2c8c.mp3` | OĞUZ | Tek birini bile geride bırakmam. |

### 6. bölüm, 3. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `f2nir0.mp3` | ULUĞ TÜRÜK (RÜYADA) | Kale kapısında general bekliyor. Önce atıyla kaçar; surlardaki okçuların oklarını kılıcınla geri çal. |
| `21qnjt.mp3` | ÇİN GENERALİ | Bozkırın hayaleti! Kalkanım seni durdurur. |
| `uupfqc.mp3` | OĞUZ | Saldırını beklerim. Doğru hamleden sonra kalkanın düşer. |

### 6. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1v0tqwa.mp3` | ULUĞ TÜRÜK (RÜYADA) | Zincirler kırıldı, esirler yurtlarına döndü. Kimse kurtarıcılarının kim olduğunu bilmeyecek. |

### 7. bölüm, 1. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `1jvz5w9.mp3` | ULUĞ TÜRÜK (RÜYADA) | Kuzeyin güneş doğmayan ülkesinden it başlı İt-Barak akıncıları indi. |
| `17qf4qx.mp3` | OĞUZ | Destanda onlara ilk akınım yenilgiyle bitmişti. |
| `ksb5cn.mp3` | ULUĞ TÜRÜK (RÜYADA) | Bu kez başbuğları buzun üstünde. Oklardan kaçarlar; kılıcını yakından çal. |

### 7. bölüm, 2. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `dyb70p.mp3` | ULUĞ TÜRÜK (RÜYADA) | Ordun bu ırmağı sallarla geçmişti. Sen de salla geç; gökteki ışıklar yolunu aydınlatır. |
| `1axj970.mp3` | OĞUZ | Işık sönmeden kombo kombo ilerlerim. |

### 7. bölüm, 3. kısım

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `16e97x3.mp3` | ULUĞ TÜRÜK (RÜYADA) | Pehlivanları siyah ve beyaz iki sıvıyı karıştırıp bedenlerine üç kat sürer; oklar işlemez. |
| `1u6rtmx.mp3` | İT-BARAK PEHLİVANI | Üç kat boyam var, Oğuz. Hangisini kıracaksın? |
| `137dudv.mp3` | OĞUZ | Hepsini. Her vuruşta bir kat. |

### 7. bölüm sonu

| Dosya adı | Konuşan | Okunacak metin |
|---|---|---|
| `wj7ky2.mp3` | ULUĞ TÜRÜK (RÜYADA) | İt-Barak pehlivanının boyası döküldü, obalar yeniden ateş yaktı. Seferler sürecek, Oğuz. |

<!-- diyaloglar:bitir -->
