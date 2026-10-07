# Ses ve Müzik Kaynakları

Bu oturumun çalıştığı ortamdan ses sitelerine (freesound, opengameart, kenney, pixabay, incompetech) erişim kapalıydı. Bu yüzden bütün ses ve müzikler **`src/sound.js` içinde, Web Audio API ile kodla üretiliyor**. Dışarıdan alınmış hiçbir ses dosyası yok.

| Ses | Nasıl üretiliyor | Kaynak | Lisans | Boyut |
|---|---|---|---|---|
| Menü müziği (kopuz/dombra, sakin) | Karplus-Strong tel sentezi, uşşak dizisi, hafif def | Oyunun kendi kodu | Projeye ait | 0 KB |
| Ötüken (davul-zurna) | İnen sinüs davul + kamışlı (testere/kare dalga, titreşimli) zurna, hicaz | Oyunun kendi kodu | Projeye ait | 0 KB |
| Kara Bataklık (karanlık, yankılı) | Alçak süzgeçli drone, yankılı (üretilmiş oda tepkisi) tel, su damlası | Oyunun kendi kodu | Projeye ait | 0 KB |
| Altay (boğazdan söyleme) | Alçak testere dalga drone + dar bant süzgeçle seçilen üst sesler (khöömei), topşur ritmi | Oyunun kendi kodu | Projeye ait | 0 KB |
| Gök Yolu (rüzgârlı, ferah) | Süzgeci gezinen gürültü (rüzgâr), sinüs pad, pentatonik tel | Oyunun kendi kodu | Projeye ait | 0 KB |
| Yeraltı (ağır davul) | Çok alçak davul, drone, örs çınlaması | Oyunun kendi kodu | Projeye ait | 0 KB |
| Çin (pentatonik) | Parlak tel (guzheng benzeri), tahta tokmak | Oyunun kendi kodu | Projeye ait | 0 KB |
| Karanlık Ülke (soğuk, kurt uluması) | Sinüs pad, yankılı çan, sentez kurt uluması | Oyunun kendi kodu | Projeye ait | 0 KB |
| Boss müziği (hızlı) | 150 BPM davul + hızlı zurna | Oyunun kendi kodu | Projeye ait | 0 KB |
| Zafer / yenilgi | Kısa zurna nakaratı / inen tel dizisi | Oyunun kendi kodu | Projeye ait | 0 KB |
| 29 efekt (kılıç, ok, zıplama, kut dizisi, nal, kişneme, kurt, ıslıklı ok, kımız, darbe, ölüm, kükreme, kalkan, tık, sayfa...) | Gürültü süzgeçleri, osilatörler, tel sentezi | Oyunun kendi kodu | Projeye ait | 0 KB |

**Toplam boyut:** 0 MB (sınır 8 MB).

## Gerçek ses dosyası eklemek istersen

Kodla üretilen sesler çizgi roman havasına uyuyor ama gerçek kayıt kadar zengin değil. İleride gerçek CC0 / CC-BY dosyaları koymak için:

1. Dosyaları `public/ses/` klasörüne koy (OGG ya da MP3, 96 kbps).
2. Aynı klasöre `manifest.json` yaz. Adlar `sound.js`'teki efekt ve parça adlarıdır:
   ```json
   { "otuken": "otuken.ogg", "kut": "kut.ogg", "boss": "boss.ogg" }
   ```
3. Manifestte olan ad dosyadan çalar, olmayan kodla üretilmeye devam eder. Kod değiştirmen gerekmez.
4. CC-BY dosyalarda yazar adını Ayarlar > Emeği Geçenler listesine eklemek zorunludur.

Efekt adları: swing, hit, bowdraw, bowrelease, arrowhit, jump, flip, slide, land, kut, gallop, neigh, howl, whistle, heal, hurt, death, roar, shieldbreak, click, page, parry, gold, crack, revive, levelup, combo, near, coin2.
Müzik adları: menu, otuken, bataklik, altay, gok, yeralti, cin, karanlik, boss. Kısa parçalar: win, lose.
