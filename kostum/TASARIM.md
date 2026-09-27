# Yiğit Görünüşleri: Tasarım Belgesi

Bu belge 31 yiğidin (29 kart + 2 bayram yiğidi) nasıl görünmesi gerektiğini anlatır. Blender'da parça yapan (PC'deki Claude) da, ileride tutulabilecek bir sanatçı da buradan çalışır. Parçaların teknik kuralları `BLENDER.md`'de. Kodda her yiğidin parça listesi ve renkleri `oyun/src/yigit.js` → `DETAY`, kostümlerinki `oyun/src/costumes.js` içinde.

## Temel ilkeler

1. **Arkadan tanınmalı.** Koşuda oyuncu karakteri arkadan ve küçük görür. Her yiğidin arkadan bakınca ayırt edilen en az iki büyük öğesi olmalı: başlık, pelerin, örgü, sadak, kürk yaka, uzun kaftan.
2. **Üç ölçü kuralı.** Uzaktan (koşuda) siluet ve ana renk okunmalı. Ortadan (vitrinde) parçalar okunmalı. Yakından (kart ve diyalog) desen, yüz ve takı okunmalı. Ayrıntıyı en son ekle.
3. **Renk: bir ana, bir yardımcı, bir vurgu.** Vurgu çoğunlukla altındır. Aynı gruptaki yiğitler birbirine yakın renklerde olmasın.
4. **Nadirlik görünüşe yansısın.** 3★ sade kumaş ve deri. 5★ zırh ya da pelerin. 6★ ve üstü altın, parlayan kılıç, yoğun iz. Kod kılıç parıltısını ve iz yoğunluğunu zaten nadirliğe göre veriyor.
5. **Tarihe saygı, destana özgürlük.** Tarihî kişilerde (Bilge Kağan, Fatih, Babür...) giysi dönemine yakın olsun. Destan kişilerinde (Basat, Er-Sogotoh...) anlatıdaki özellik öne çıksın. Bilinmeyen yerde tasarım tercihi yapıldığını açıkça not et.

## Kodun zaten verdiği efektler

| Efekt | Nereden | Not |
|---|---|---|
| Koşu izi (ayak arkasında parçacık) | `yigit.js` → `cardFx().iz` | Grup rengi, bazı yiğitlerde kendi rengi. Yoğunluk 3★'da az, 8★'de çok |
| Kılıç parıltısı | `cardFx().kilic` | 6★ ve üstünde izin renginde. Altın Elbiseli Adam altın, Attila kızıl |
| Eyer ve koşum rengi | `cardFx().at` | Ata binince |
| Vitrinde bekleme duruşu, zafer pozu | `cardFx().bekle`, `.zafer` | Bölüm bitince ve deneme koşusu sonunda |
| Kaftan deseni | `desen` (`desen.js`) | kilim, çintemani, rumi, pul, kürk, şerit (yol) |
| Kenar ışığı | `assets.js` → `RIM` | Vitrinde nadirlik renginde |

## Yiğitler

Biçim: **arkadan tanınma** · **renkler** · **parçalar** (var olan + Blender'da yapılacak `C_`) · **not**.

### Oğuz Kağan (3★, başlangıç)
- **Arkadan:** gece mavisi pelerin, sırtta tek uzun örgü, kürklü börk.
- **Renkler:** gök mavisi kaftan, bordo şalvar, altın vurgu. Desen: rumi.
- **Parçalar:** Bork · C_Cape_Sway, C_Belt, C_BraidBack_Sway.
- **Not:** Uygur harfli Oğuz Kağan Destanı onu kurt belli, ayı göğüslü anlatır. Omuzlar geniş, bel ince olsun. Oyunun yüzü: en özenli iş bu.

### Oğuz'un altı oğlu (3★): Gün, Ay, Yıldız, Gök, Dağ, Deniz Han
Altısı bir aile gibi görünmeli: aynı kesim, farklı simge rengi.
- **Bozok (Gün, Ay, Yıldız):** kemer ve kuşak. Kuşak rengi adından gelir: Gün altın sarısı, Ay gümüş beyazı, Yıldız soluk sarı. Gün ve Ay börklü, Yıldız kalpaklı.
- **Üçok (Gök, Dağ, Deniz):** Gök ve Deniz yanlarda iki ince örgü ve kuşak. Dağ Han kürk yaka ve ayı başlıkla daha iri görünür.
- **Not:** Destanda üç büyük oğul altın yay, üç küçük oğul üç gümüş ok bulur. İleride Bozok'lara sırtta yay kılıfı, Üçok'lara sadak eklenebilir.

### Mete Han (5★, Hun)
- **Arkadan:** koyu kızıl pelerin, sırtta örgü, sivri Hun başlığı.
- **Renkler:** kan kırmızısı, siyah, bronz.
- **Parçalar:** HunCap · C_Lamellar, C_Belt, C_Mustache, C_BraidBack_Sway, C_Cape_Sway.
- **Not:** Islıklı ok (vınlayan ok) simgesi. Sadağa ucu delikli bir ok konabilir. Örgü bir tasarım tercihidir.

### Göktürkler: Bumin (5★), Bilge (5★), Kül Tigin (4★), Tonyukuk (4★)
- **Ortak:** Semerkant'taki Afrasiyab duvar resimlerinde (7. yy) Türk muhafızlar uzun örgülü saçla çizilir. Kağan ve komutanlarda örgü bu yüzden var.
- **Bumin:** yeşil kaftan (kilim deseni), pul zırh, yeşil pelerin, altın kurt başlı tuğ.
- **Bilge:** uzun kaftan, altın sarısı pelerin, bıyık, kuşlu taç ve yaka. Dört Göktürk içinde en "hükümdar" görünen.
- **Kül Tigin:** kızıl kaftan, pul zırh, omuzluk. Pelerini yok, savaşçı gibi hafif. Taç, Orhun'da bulunan mermer başındaki kuşlu taçtır.
- **Tonyukuk:** açık renkli uzun kaftan, ak uzun sakal (yazıtında yaşlılığından söz eder), kalpak, kuşak. Zırhsız, bilge görünüşlü.

### Alp Er Tunga (5★, destan)
- **Arkadan:** mor-siyah pelerin, altın börk, omuzluk.
- **Parçalar:** AltinBork · C_Lamellar, C_Pauldrons, C_Cape_Sway, C_Belt. Çizmeler altın.
- **Not:** Divanü Lugati't-Türk'teki sagu kederli bir havası olduğunu gösterir. Koyu mor bunun için seçildi.

### Tomris Hatun (5★, destan)
- **Arkadan:** altın sarısı pelerin, iki yanda örgü, uzun kaftan.
- **Renkler:** bordo, altın.
- **Parçalar:** Headband · C_KaftanLong, C_Belt, C_BraidsSide, C_Cape_Sway. Sakal kapalı.
- **Not:** Massaget kraliçesi (Herodot). Kadın yüz ve saç modeli (BLENDER.md §3) en çok burada fark yaratır.

### Attila (6★, Hun)
- **Arkadan:** kürk yakalı mor-siyah pelerin, sivri başlık.
- **Parçalar:** HunCap · C_Lamellar, C_FurCollar, C_Cape_Sway, C_Mustache. Kaftan deseni: pul. Kılıç kızıl parlar.
- **Not:** "Tanrının Kılıcı" rivayeti kılıcı öne çıkarır. Zafer pozunda kılıcı kaldırması yakışır.

### Dede Korkut: Basat, Bamsı Beyrek, Deli Dumrul (4★), Banu Çiçek (4★)
- **Basat:** kürk yaka, pençe eldiven, kalpak. Aslan sütüyle büyüdüğü anlatılır, iri ve yabani görünsün.
- **Beyrek:** yeşil uzun kaftan, bordo şalvar, bıyık, yaka. Boz aygırlı, ata binince eyer rengi öne çıksın.
- **Deli Dumrul:** kapkara kaftan, koyu yeşil pelerin, omuzluk. Köprü başında duran, ürkütücü bir siluet.
- **Banu Çiçek:** kırmızı uzun kaftan, tüylü başlık, iki yanda örgü, altın kuşak. Ok atan, at yarıştıran bir savaşçı. Süslü ama hafif.

### Manas (5★, destan)
- **Arkadan:** ak pelerin ve ak kalpak (Kırgız ak kalpağı), kızıl uzun kaftan.
- **Parçalar:** Kalpak · C_KaftanLong, C_Belt, C_Cape_Sway, C_Mustache. Desen: kilim.

### Er-Sogotoh (6★, destan)
- **Arkadan:** ak kürk yaka, sırtta örgü, Yakut başlığı.
- **Renkler:** ak, kahve. Desen: kürk.
- **Not:** Destanda kolları kayın gövdesi kalınlığında dev bir avcı. Kolları ve omuzları kalın modellemek (ikinci tur) en çok bu karta yakışır.

### Altın Elbiseli Adam (7★, en nadir)
- **Arkadan:** altın levhalı uzun sivri külah, baştan aşağı altın pul.
- **Parçalar:** AltinBork, GoldPlates · C_KaftanLong, C_Belt, C_Pauldrons. Desen: pul. Kılıç altın parlar, iz yoğun altın.
- **Not:** Esik kurganı (Kazakistan). Giysisi binlerce altın parçayla bezelidir. Oyunun "vitrin kostümü": en çok parıltı ve ayrıntı burada.

### Devlet kurucuları: Fatih (6★), Babür (6★), Şah İsmail (6★)
- **Fatih:** beyaz kavuk, kızıl kaftan (çintemani deseni), kürk yaka, altın kuşak, uzun sakal. Topkapı'daki padişah kaftanlarında çintemani sık görülür (çoğu 16. yüzyıldan).
- **Babür:** yeşil uzun kaftan (rumi), yakut sorguçlu sarık, altın kuşak, sakal.
- **Şah İsmail:** on iki dilimli kızıl taç (Kızılbaş), kızıl uzun kaftan, siyah kuşak, bıyık (portrelerinde sakalsız).
- **Ortak:** zırh yok, pelerin yok. Güç giysinin zenginliğinden gelsin. Bekleme duruşu ağır başlı, zafer pozu "incelemek".

### Şamanlar: Ak Oğlan, Geyik, Ayı, Kartal Şaman (3★)
- **Ortak:** Altay şaman giysisinde belden sarkan renkli şeritler (saçak), göğüste bronz ayna (küzüngü) ve davul (tüngür) bulunur. Koşarken saçakların savrulması şamanları uzaktan tanıtır.
- **Ak Oğlan:** baştan aşağı ak, sade kuşak. Şamanların en sadesi; "saf güç".
- **Geyik Şaman:** boynuzlu başlık, saçak, ayna, sırtta davul. Desen: şerit.
- **Ayı Şaman:** ayı başlık, pençe eldiven, kara kürk yaka, saçak, ayna.
- **Kartal Şaman:** kartal başlık, kollarda tüyler, saçak, ayna, davul.

### Bayram yiğitleri (5★, süreli)
- **Ergenekon Demircisi (Nevruz, 14–28 Mart):** yeşil kaftan (kilim), kızıl şalvar, kızıl pelerin, kürk yaka, kalpak. İleride deri önlük ve omuzda çekiç eklenebilir.
- **Boz Atlı Hızır (Hıdırellez, 1–10 Mayıs):** yeşil uzun kaftan (rumi), sarık, ak uzun sakal, gri pelerin. Eyer boz ata yakışsın diye koşum yeşil.

## Sonraki adımlar

- Bu belgeye göre Blender parçaları: `BLENDER.md` §2 (sıralı liste).
- Yeni kostüm eklenecekse: bu belgeye bir bölüm ekle, `yigit.js`'e kartı ve `DETAY` girdisini yaz, gerekiyorsa yeni `C_` parçasını BLENDER.md'deki tabloya ekle.
