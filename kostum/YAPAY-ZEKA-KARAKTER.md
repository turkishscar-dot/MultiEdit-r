# Karakterler, düşmanlar ve boss'lar: yapay zekâyla neler yapılabilir

28 Eylül 2026. Dünya nesnelerini (engel, ağaç, kule, doku) yapay zekâyla yeniledikten sonra yazıldı. Oradaki denemelerden öğrenilenlere dayanıyor.

## Şu anki durum

- **Modeller:** 21 karakter modeli var: Oğuz (yiğitler de bu model ve kostüm parçalarıyla kuruluyor), düşmanlar ve boss'lar.
- **İskelet ve animasyon:** Hepsi **aynı 65 kemikli iskeleti** kullanıyor ve **119 animasyon** ortak (`anims.glb`).
- **Oğuz:** 43 bin üçgen, 34 parça. Kılıç, yay, sadak, kalpak, börk, kaftan katmanları ayrı ve isimli parçalar. Kostüm sistemi bu parçaları açıp kapatıyor.
- **Yeni bir karakterin oyuna girme şartları:**
  1. Bu 65 kemikli iskelete bağlanmalı, yoksa 119 animasyon çalışmaz.
  2. Açılıp kapanacak parçaları ayrı ve isimli olmalı.
  3. Telefon için 15–40 bin üçgeni geçmemeli.

## Dünya nesnelerinden öğrendiklerimiz

- **Başarılı olan:** Görselden 3B (TRELLIS) kalın ve dolgun şekillerde çok iyi. Kaya, sandık, araba, kule ve ağaç tacı iyi çıktı.
- **İnce şeyler kayboluyor:** gerili ip, devrik çam gövdesi, ölü ağaç dalları. Karakterde kılıç ağzı, yay kirişi, parmaklar, sakal telleri ve saçaklar risk taşıyor.
- **Beyaz nesne sorunu:** Beyaz nesne beyaz arka planla karışıyor. İki huş denemesi kutuya dönüştü. Beyaz sakallı, ak kaftanlı yiğitler için renkli arka plan gerekir.
- **Tek parça çıkış:** Model tek parça ve tek dokulu geliyor, parçaları ayrı açılıp kapanmıyor.

## Seçenekler

| # | Ne | Nasıl | Risk | Maliyet | Kim yapar |
|---|---|---|---|---|---|
| 1 | **Silah ve aksesuar parçaları** (kılıç kını, kalkan, başlık, börk, omuzluk, kürk yaka, şaman aynası, davul) | Bugünkü hat birebir işler: görsel → 3B → temizlik. Parça el, baş ya da sırt kemiğine takılır ve kostüm sistemine yeni parça olarak girer | Düşük. İnce kılıç ağzı zayıf kalabilir, kalkan ve başlık iyi olur | 20–30 parça ≈ 1–2 $ | Ben, bu ortamda |
| 2 | **Kart, portre ve boss afişi resimleri** (2B) | Oyundaki modelin görüntüsü yapay zekâyla boyalı resme çevrilir. Böylece resim oyundaki karakterle aynı kişi olur | Düşük | 45–90 görsel ≈ 2–4 $ | Ben |
| 3 | **Parçalı (menteşeli) boss'lar**: Kara Kuş, Yel Beğen'in başları, Tepegöz'ün sopası ve kayası, Erlik'in balyozu | İskelet yerine katı parçalar kullanılır. Kara Kuş zaten böyle: gövde + iki kanat, kodla çırpılıyor. Parçalar ayrı üretilir, mevcut hareket kodu kullanılır | Düşük–orta | ≈ 1 $ | Ben |
| 4 | **Mevcut modellere yapay zekâ dokusu** | Şekil ve iskelet aynı kalır, yüzey detayı artar ("mesh + tarif → doku" modelleri) | Orta. Modellerimizin doku açılımı zayıf, önce Blender'da otomatik açılım gerekir | Pilot ≈ 0,5 $ | Ben (pilot) |
| 5 | **Tamamen yeni, iskeletli karakter** | Görsel → 3B, Rodin Gen-2 ile kollar açık duruşta. Sonra otomatik iskelet: Replicate'te `aaronjmars/unirig-ai` ve iki ayaklılar için `uthana/create-character-v1` var. Ardından Blender'da kemik adları bizim 65 kemiğe eşlenir ve animasyonlar aktarılır | **Yüksek.** Omuz ve kalça bükülmeleri bozulabilir, kaftan eteği bacakla gerilebilir, parmaklar dağılabilir. Tek parça olduğu için kostüm açılıp kapanmaz; her yiğit ayrı model olur ve paket büyür (31 × 1–2 MB) | Pilot ≈ 2–3 $ | Ben denerim, sonucu **senin gözünle** onaylamak gerekir |
| 6 | **Hazır ücretsiz iskeletli karakter paketleri** (Quaternius, CC0; oyundaki ağaç ve kale paketleri zaten ondan) | Temiz iskelet, tutarlı stil. Bozkır kıyafeti yok: gövde tabanı olur, kostüm parçaları (1. madde) üstüne takılır | Orta. Kemik eşleme gerekir | Ücretsiz | Ben (siteye ağ izni gerekir) |
| 7 | **İnsan 3B sanatçı** | Oğuz ve vitrin yiğitleri için en iyi sonuç | Düşük | Ücretli (önce sorulur) | Sanatçı |

## Önerilen sıra

1. **Aksesuar parçaları + yiğide özel başlık, omuzluk ve kalkan** (1. madde). "Kostümler tekdüze" şikâyetine en hızlı çözüm. `kostum/BLENDER.md`'deki katı parçalar (`C_Pauldrons`, `C_FurCollar`, `C_ShamanMirror`, `C_Drum`, başlıklar) Blender'ı beklemeden buradan üretilebilir. Vücuda sarılan parçalar (kemer, kuşak, uzun kaftan) bu yolla olmaz, çünkü iskelete bağlanmaları gerekir.
2. **Kart ve portre resimleri** (2. madde). Menü, kart ve diyalogda kalite algısını en çok artıran iş.
3. **Parçalı boss'lar** (3. madde).
4. **Tek bir sıradan düşmanla tam karakter pilotu** (5. madde). Örneğin baltacı: uzaktan ve arkadan görüldüğü için hataları en az fark edilen karakter. Sonuç iyiyse önce düşmanlar, sonra boss'lar, en son yiğitler.

Toplam tahmin: 7–8 $. Replicate'te yaklaşık 3 $ kaldı; 4. adımdan önce bakiye eklemek gerekebilir, önce sorulur.
