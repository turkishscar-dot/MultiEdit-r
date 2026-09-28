# Kostüm Parçaları: Blender Talimatı (PC'deki Claude için)

> **28 Eylül güncellemesi:** 2. bölümdeki 15 parçanın hepsi bu repoda, Blender Python modülüyle üretildi: `oyun/tools/build_kiyafet.py` → `oyun/src/assets/kiyafet.glb` (oyun yüklerken Oğuz'a ekler, `oguz.glb` değişmez). PC'de parça modellemek gerekmiyor. Kalan iş: 3. bölüm (oranlar ve yüz) ve istenirse parçaları elle güzelleştirmek. Elle yapılan parça aynı adla `oguz.glb`'ye eklenirse `kiyafet.glb`'deki aynı adlı parçayı listeden çıkar (`build_kiyafet.py`).

> PC'deki Claude'a: "`MultiEdit-r` reposunun `claude/serene-wright-uo3dxg` dalındaki `kostum/BLENDER.md` dosyasını oku ve sırayla uygula."

Kod tarafı hazır (bu repoda `oyun/src`). Blender'da yalnızca **parçaları modelleyip `oguz.glb`'ye eklemek** gerekiyor. Parça doğru adla gelince oyunda kendiliğinden görünür. Hangi yiğidin hangi parçayı giydiği `oyun/src/yigit.js` → `DETAY` içinde zaten yazılı.

Önce `oyun/UYGULAMA.md`'deki aktarmayı yap (kod dosyaları PC'deki oyuna kopyalanmış olmalı). Sonra bu belgeye geç.

## 1. Kurallar (kod bunlara göre yazıldı)

| Kural | Neden |
|---|---|
| Her kostüm parçasının **nesne adı `C_` ile başlar** (ör. `C_Belt`). | Kod `C_` ile başlayan her nesneyi kostüm parçası sayar. Varsayılan gizlidir, yalnız o yiğitte açılır (`assets.js`, `costumes.js`). |
| **Adında `Sway` geçen** parça koşarken sallanır (ör. `C_Cape_Sway`). | Kod bu nesneyi **yerel X ekseni** etrafında yay gibi döndürür (`costumes.js` → `sway`). |
| Sallanan parçanın **orijini menteşe noktasındadır**. Pelerinde iki omzun ortası, örgüde başın arkası, saçakta bel hizası. Parça bir kemiğe **ebeveynlenir** (Bone parent). Deform/skin edilmez. | Dönme orijin etrafında olur. Orijin yanlışsa parça havada döner. |
| Pelerin gibi sallanan parçanın dinlenme duruşu **aşağı sarkık** olmalı. Kod koşarken en çok 0.9 radyan geriye kaldırır. | |
| Diğer parçalar (kemer, yaka, zırh, uzun kaftan) ya bir kemiğe ebeveynlenir ya da gövde iskeletine **skin edilir**. Uzun kaftan ve etek mutlaka skin edilmeli (thigh_l, thigh_r, pelvis ağırlıkları), yoksa koşarken bacaklar içinden çıkar. | |
| Yeni malzeme adları **`M_` ile başlar**, düz renklidir. Kod toon malzemeye çevirir. | `assets.js` → `toon()` |
| Kostüme göre boyanacak üç yeni malzeme: **`M_Cape`** (pelerin), **`M_Sash`** (kuşak), **`M_Kurk`** (kürk yaka). Açık gri yap; renk koddan gelir. | `DETAY[...].colors` bu adlarla renk verir. |
| Altın için var olan `M_Gold`, çelik için `M_Steel`, deri için `M_Leather` kullanılır. Yeni altın malzemesi açma. | Kılıç ve koşum parıltısı bunlara göre ayarlı. |
| Uzun kaftan (`C_KaftanLong`) **`M_Kaftan`** malzemesini kullanır. | Böylece kaftanın rengi ve deseni eteğe de geçer. |
| **Kaftan ve şalvara UV açılmalı:** ön ve arka ayrı parça, dikişler yanlarda, texel yoğunluğu eşit, 0–1 alanını doldursun. | Kod bu ikisine desen dokusu koyuyor (`desen.js`: kilim, çintemani, rumi, pul, kürk, şerit). Şu anki UV'de desenler zor seçiliyor. |
| Poligon bütçesi: kahraman tamamı ≤ 25 bin üçgen, tek parça ≤ 1500 üçgen, doku ≤ 512 px. | Telefon. |
| Ölçü: model 1.9 m boyunda, yüzü −Z yönüne bakar (mevcut hâliyle aynı). | Kamera ve oyun ölçüleri buna göre. |

## 2. Yapılacak parçalar (kullanım sayısına göre sırayla)

Her parçayı bitirince `node tools/kostum-shots.mjs` çalıştır ve `test-out/kostum-vitrin.png`'ye bak.

| Sıra | Nesne adı | Ne | Kemik / bağlama | Malzeme | Kaç yiğitte |
|---|---|---|---|---|---|
| 1 | `C_Belt` | Türk kemer takımı: deri kemer, üstünde 5–7 altın levha, iki yanda sarkan kısa kayış | pelvis (skin ya da ebeveyn) | M_Leather, M_Gold | 17 |
| 2 | `C_Sash` | Bele iki tur sarılmış kumaş kuşak, önde düğüm ve iki sarkan uç | pelvis | M_Sash | 12 |
| 3 | `C_Cape_Sway` | Omuzdan dizin biraz üstüne inen pelerin; alt kenarı hafif dalgalı; önde yakada altın toka | spine_03 (ebeveyn), orijin omuz ortası | M_Cape, M_Gold | 11 |
| 4 | `C_KaftanLong` | Diz altına inen, önü açık kaftan eteği. Yanlarda at binmek için yırtmaç. Kenarda 2 cm altın şerit | pelvis + thigh_l/r (skin) | M_Kaftan, M_Gold | 11 |
| 5 | `C_FurCollar` | Omuzlara taşan kalın kürk yaka | spine_03 | M_Kurk | 7 |
| 6 | `C_Mustache` | Uçları çeneye doğru sarkan uzun bıyık | Head | M_Black | 7 |
| 7 | `C_BraidBack_Sway` | Enseden sırta inen tek kalın örgü, ucunda küçük altın halka | Head, orijin başın arkası | Saç malzemesi (yoksa M_Black), M_Gold | 6 |
| 8 | `C_Lamellar` | Pul zırh göğüslük: yatay sıralı dikdörtgen levhalar | spine_02/03 (skin) | M_Steel, M_Leather | 5 |
| 9 | `C_BraidsSide` | Kulakların önünden göğse inen iki ince örgü | Head | saç malzemesi | 4 |
| 10 | `C_Pauldrons` | Üç katlı levha omuzluk | upperarm_l/r (ebeveyn) | M_Steel ya da M_Gold | 4 |
| 11 | `C_BeardLong` | Göğse inen uzun kara sakal | Head | M_Black | 2 (Fatih, Babür) |
| 11b | `C_BeardLongWhite` | Aynı sakal, ak (yaşlılar) | Head | M_Bone ya da yeni açık gri malzeme | 2 (Tonyukuk, Hızır) |
| 12 | `C_Fringe_Sway` | Şaman saçakları: belden dize inen renkli kumaş şeritler ve küçük demir çıngıraklar | pelvis, orijin bel | M_Cloth, M_Iron | 3 |
| 13 | `C_ShamanMirror` | Göğüste yuvarlak bronz ayna (küzüngü) | spine_03 | M_Gold | 3 |
| 14 | `C_Drum` | Sırtta tek yüzlü şaman davulu (tüngür), deri yüzü, ahşap çember | spine_03 | M_Leather, M_Wood | 2 |

İlk dört parça 30 yiğidin çoğunu değiştirir. Önce onları bitir, oyunu dene, sonra devam et.

## 3. Oranlar ve yüz (isteğe bağlı, ikinci tur)

- Başı %6–8, elleri %8–10 büyütmek karakteri çizgi roman gibi okunur yapar. **Kemiğe ölçek verme** (bütün başlıklar kayar). Yüz ve el meshini düzenle, sonra her başlığın (Bork, Kavuk, Sarik, Taj, Kalpak, HunCap, KulTiginTac, AltinBork, EagleHat, BearHat, Antlers, YakutHat, Headband) başa oturduğunu tek tek kontrol et.
- Kaşları biraz kalınlaştır, gözlere beyaz vurgu ekle. Uzaktan yüz ifadesi okunsun.

## 4. Dışa aktarma

1. `build_chars.py` içinde parçaları ekleyen adımı yaz. Elle yaptıysan betiğe de geçir ki model yeniden üretilince kaybolmasın.
2. GLB'yi eskisinin yerine `src/assets/oguz.glb` olarak kaydet. Animasyonları dışa aktarma (animasyonlar `anims.glb`'de).
3. Nesne adlarını kontrol et: `node -e` ile GLB içinde `C_` ile başlayan düğümleri listele (UYGULAMA.md'deki gibi).

## 5. Kontrol listesi

- [ ] `npm run dev` açılıyor, konsolda hata yok.
- [ ] `node tools/kostum-shots.mjs` → `test-out/kostum-*.png`: parçalar doğru yiğitte görünüyor, başkasında görünmüyor.
- [ ] Koşarken pelerin ve örgü geriye kalkıyor, zıplayınca savruluyor, bacaklar kaftanın içinden çıkmıyor.
- [ ] Ata binince (`nal`) pelerin eyerin içine girmiyor.
- [ ] Vitrinde dönerken parçalar kemiklerle birlikte hareket ediyor.
- [ ] `tools/regresyon.sh` hepsi "tamam".
- [ ] Telefonda FPS düşmedi (Ayarlar > Oyun'daki ölçüm).
