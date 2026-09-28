# Ses ve Müzik Kaynakları

Sesler ve müzikler artık **gerçek ses dosyaları** (`public/ses/*.mp3`, toplam ~4,3 MB). Hepsi bu projede, `tools/ses_uret.py` ile çevrimdışı üretildi: dışarıdan alınmış kayıt yok, lisans sorunu yok, hepsi projeye ait.

Üretim: Python (numpy, scipy) ile fiziksel modelleme + Spotify'ın açık kaynak `pedalboard` kütüphanesiyle yankı, sıkıştırma ve sınırlayıcı. Yeniden üretmek: `pip install numpy scipy soundfile pedalboard` → `python3 tools/ses_uret.py` (tek bir ses: `python3 tools/ses_uret.py swing`).

| Ses | Nasıl yapıldı |
|---|---|
| Kılıç savurma (3 çeşit) | Patlama yok: gürültü, hızla yükselip hafifçe inen dar bir bantta akar (Doppler), ~60 ms'de yumuşak yükselir. Eski ses ani başladığı için silah sesi gibi duyuluyordu |
| Kılıç değme (2 çeşit) | Gövdeye tok vuruş + kısa kesik + küçük çelik çınlaması |
| Yay çekme, ok bırakma, ok saplanma | Ahşap gıcırtısı; alçak kiriş "tınn"ı (tel modeli + yay gövdesi) ve okun havayı yarışı; kuru "tak" ve titreyen ok gövdesi |
| Geri çalma, kalkan kırılması | Parlak çelik çınlaması, uzun yankı; kırılan tahta |
| Zıplama, iniş, kayma, kut, darbe | Kısa, yumuşak, müziği bastırmayan sesler |
| Kükreme, gök gürültüsü, kuyuya düşüş | Formantlı dev sesi; çatırtı + uzun gümbürtü; rüzgâr uğultusu |
| 9 bölge müziği (26–64 sn döngü) | Kopuz/dombra (Karplus-Strong tel + tahta gövde rezonansı, çift tel), kaval (nefesli, geç başlayan titreşim), zurna (boss), davul ve zilli def, boğazdan söyleme (Altay). Makamlar: uşşak (menü), bozlak (Ötüken), hicaz (boss, Yeraltı), pentatonik (Altay, Gök, Karanlık). Her parça A-B-A-B-A'-B'-A-B düzeninde, hepsi aynı ses düzeyinde (-18 dBFS) |
| Zafer, yenilgi | Zurna nakaratı; inen kopuz dizisi |

Oyun dosyaları sayfa açılınca indirir, ilk dokunuşta çözer. Döngülü müzikte MP3'ün baştaki sessizliği atlanır (kesintisiz döngü). Efektlerin çeşitleri rastgele seçilir ve her çalışta perdesi biraz değişir (tekdüze olmasın).

Dosya yüklenemezse (ör. `OYNA.html` bilgisayardan çift tıklanarak açılırsa) `src/sound.js`'teki eski kodla üretilen sesler yedek olarak çalar. Gerçek sesleri duymak için oyunu `npm run dev` ya da bir sunucu üzerinden aç.

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
