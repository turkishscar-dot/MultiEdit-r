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

