# Bilgisayardaki Oyuna Aktarma

Bu klasördeki kod, 27 Eylül 2026'da Drive'dan alınan `oguzkhan` zip'inin üstüne yazıldı. `istemler/` klasöründeki 16 istemin hepsi burada kodlandı ve test edildi (19. adımda yalnızca karşılaştırma yapıldı; kurulum hesap açılınca).

## PC'deki Claude'a ne diyeceksin

> `MultiEdit-r` reposunun `claude/serene-wright-uo3dxg` dalındaki `oyun/UYGULAMA.md` dosyasını oku ve uygula.

## Aktarma adımları (PC'deki Claude için)

1. Oyun klasöründe `git status`. Git yoksa önce `git init` ve mevcut hâli commit et.
2. **Çakışma kontrolü:** Bu repodaki ilk "baseline" commit'i (`Add working copy of the game source`), zip'teki hâldir. PC'deki `src/main.js`, `index.html`, `src/bosses.js`, `src/world.js`, `src/costumes.js`, `src/boylar.js`, `src/cine.js` o tarihten sonra değiştiyse, dosyaları üstüne yazma. Önce farkı çıkar (`git diff <baseline> -- oyun/src/main.js`) ve değişiklikleri birleştir.
3. Değişmediyse şunları olduğu gibi kopyala (ayrıca `public/ses/` klasörünün tamamı, yeni `src/assets/karakus.glb`, yapay zekâ paketi `src/assets/dunya.glb`, `src/assets/doku/` klasörü ve karakter gölgeleri `src/assets/ao.json`):
   - **Değişen:** `index.html`, `src/main.js`, `src/bosses.js`, `src/world.js`, `src/costumes.js`, `src/boylar.js`, `src/cine.js`, `src/assets.js`, `src/book.js`, `SESLENDIRME.md`
   - **Yeni kaynak:** `src/simge.js`, `src/akinci.js`, `ui.js`, `sound.js`, `bonus.js`, `tips.js`, `carsi.js`, `tore.js`, `harita.js`, `yigit.js`, `seferler.js`, `koleksiyon.js`, `ekranlar.js`, `diyalog.js`, `diyalog-metin.js`, `ayarlar.js`, `online.js`, `desen.js`
   - **Belgeler:** `SES-KAYNAKLARI.md`, `CEVRIMICI.md`, `UYGULAMA.md`
   - **Test araçları** (`tools/` içine; mevcut `bot.js`, `build_chars.py`, `vo_list.mjs` dosyalarının üstüne yazılmaz, adları farklı): `test-bot.mjs`, `bot-brain.js`, `smu2-scenes.mjs`, `kostum-shots.mjs`, `boss-shots.mjs`, `anim-sheet.mjs`, `eagle-shots.mjs`, `tur.mjs`, `ses_uret.py`, `build_eagle.py`, `regresyon.sh`, `flow-test.mjs`, `tore-test.mjs`, `cards-test.mjs`, `dialog-test.mjs`, `tips-test.mjs`, `sound-test.mjs`, `events-test.mjs`, `scenes.mjs`, `shot-menu.mjs`, `ui-test.mjs`, `fps-test.mjs`, `vo_dialog.mjs`
4. `npm run dev`, sonra `tools/regresyon.sh` (Playwright gerekir: `npm i -D playwright`). Hepsi "tamam" çıkmalı.
5. `npm run build` ile `OYNA.html`'i yeniden üret.
6. `node tools/vo_list.mjs` çalıştırılırsa SESLENDIRME.md'nin eski bölümü yeniden yazılır. Diyalog bölümü `<!-- diyaloglar -->` işaretleri arasında durur. Silinirse `node tools/vo_dialog.mjs` ile geri gelir.

## Burada yapılamayanlar (PC tarafında yapılmalı)

| Konu | Neden | Ne yapılmalı |
|---|---|---|
| Kanatlı Kul ve Kalkan Duvarı'nın kendi modelleri | Blender yok | Şimdilik Körmös modeline kodla takılıyor: sırtına Kara Kuş kanatları, sağ koluna ikinci kalkan (sol kalkanın aynası). İstenirse `build_chars.py` ile gerçek kanatlı bir model yapılabilir |
| Uluğ Türük ve yeni kartların kendi modelleri | Bu ortamda Blender yok | `build_chars.py` ile Uluğ Türük (ak sakal, sarık/börk, uzun kaftan, asa) ve yeni kartlara özel başlıklar. Şimdilik Oğuz modelinden kuruluyor: ak saç-sakal, sarık, açık kaftan, kodla eklenen asa. Kadın yiğitler (Tomris, Banu Çiçek) için de ayrı model iyi olur, şu an sakalsız Oğuz modeli kullanılıyor |
| Gerçek ses dosyaları | Ses sitelerine erişim kapalıydı | Sesler kodla üretiliyor (lisans sorunu yok, 0 MB). İstersen `public/ses/manifest.json` ile gerçek CC0 dosyaları eklenir, bkz. SES-KAYNAKLARI.md |
| `tools/bot.js`'e geri çalmayı öğretmek | `tools/` zip'te yoktu | Burada ayrı bir bot yazıldı (`test-bot.mjs` + `bot-brain.js`) ve geri çalmayı biliyor. Mevcut `bot.js`'e aynı mantık (`parryThink`) aktarılabilir |
| Gerçek telefonda FPS ölçümü | Bu ortamda GPU yok (yazılımla çizim, 5–8 FPS) | Oyun açılışta FPS ölçüp grafik düzeyini kendisi seçiyor. Ayarlar > Oyun sayfasında ölçülen FPS görünüyor. Telefonda bir kez aç ve oradaki değere bak |
| Çevrim içi kurulum | Hesap senin açman gereken bir şey | CEVRIMICI.md'deki adımlar. Supabase önerildi (kartsız) |

## Neler eklendi (kısa)

- **Gök Demir** (ikinci para, mor-mavi taş), **Tunç Davul** (yiğit çağırma), sayaçlar menüde, bitişte ve Çarşı'da; kazanınca zıplar.
- **Akıncı Seviyesi:** Er → Alp → Tarkan → Tudun → Şad → Yabgu → Kağan. Açılımlar: Boy seçimi 3, Çarşı 5, Seferler 8, Sonsuz Akın 10, Ordu 12, Etkinlikler 15. Kilitli düğmeler kaçıncı seviyede açılacağını söyler. "ALP OLDUN!" ekranı, alttan kayan bildirim kartları.
- **Ses ve müzik:** 9 bölge/boss müziği, zafer ve yenilgi parçası, 29 efekt. Ayrı düzeyler; sekme gizlenince susar; ilk dokunuşta açılır; seslendirme çalarken müzik kısılır.
- **Dört kombo:** VURUŞ / KIL PAYI / İSABET (altın tamga halkası) / KALKAN. Süre halkası, 5 sn'de söner, çarpan 40 komboya kadar.
- **Boss:** mavi KAÇIŞ çubuğu (60–90 sn; bitince boss kaçar); altın parlayan mermiler kılıçla **geri çalınır**.
- **Altın düşman** (Gök Demir düşürür, önden kaçar), **kırılan ahşap engeller** (çatlak doku, 3–5 kut).
- **Sonsuz Akın:** 7 bölge × ~1500 m, her bölge sonunda boss, turlar hızlanır; günün ve tüm zamanların rekoru.
- **Hayat Suyu ile devam:** 1 → 2 → 4 Gök Demir, en çok 3; altın kase, 5 sn halka, yeşil ışık.
- **Çarşı:** 6 takviye, 6 kalıcı yükseltme (5 kademe), Gök Demir paketleri "YAKINDA"; Boy Seçimi'nde takviye rafı.
- **Töre Defteri:** günlük 3 görev, 42 başarım × 3 kademe, 7 günlük giriş armağanı.
- **Akın Haritası:** parşömen üstünde düğümler, ek görevler (bazıları boy ya da yiğit ister), madalyalar, "GÖREV TAMAM" ekranı.
- **Yiğit Kartları:** 30 yiğit, Er 3★'dan Destan 8★'a, ordu (lider + 3), ordu gücü çarpanı (sağ üst), Tunç Davul.
- **Kağanlık Kademesi**, **Akın Seferleri** (gerçek saatle), **Destan Koleksiyonları** (6 set).
- **Uluğ Türük diyalogları:** 20 kısmın başında ve 7 bölüm sonunda, portreli konuşma balonları; 68 cümle SESLENDIRME.md'de.
- **Eğitim ipuçları:** ilk kısımda sırayla, sonra her yeni şeyde bir kez; telefonda el hareketi, masaüstünde tuş.
- **Ayarlar:** ses düzeyleri, grafik (otomatik), titreşim, eğerek yönlendirme, ipuçlarını sıfırla, ara sahne galerisi, emeği geçenler, dil.

## İkinci SMU paketi (ekran görüntülerinden istenenler)

| İstek | Oğuz Kağan'daki karşılığı | Dosya |
|---|---|---|
| Düşmanın üstünde simge; kayınca yenilen düşman | **Mavi ▼ KAY simgesi** kalkanlıların üstünde çıkar. Altından kayınca düşman yere serilir (ALTINDAN!). Yeni **Kalkan Duvarı** (iki kalkanlı) düşmana kılıç işlemez, üstünden atlanmaz: yalnız kayılır | `main.js` (FOE.ikikalkan, dualShield), `world.js` (makeActIcon) |
| Jetpack'li düşman, simge çıkınca zıpla | **Kanatlı Kul** (Erlik'in kulu, sırtında Kara Kuş kanatları) önde süzülür. **Sarı ▲ ZIPLA** simgesi çıkınca zıplarsan Oğuz sıçrar, onu havada indirir. Zıplamazsan şeridine mızrak savurur (altından kay) | `main.js` (updateFlyer, skyStrike) |
| Yukarı çıkma, aşağı inme, uçurum | Yol rampayla **sur üstüne** çıkar, bazen **ikinci kata** tırmanır, **uçurumlarla** bölünür, sonra aşağı atlanır ya da rampayla inilir. Yerde de uçurum olur. Uçuruma düşen bir can yitirir, karşı kenardan devam eder. Görünüş bölgeye göre: sur taşı, bataklık iskelesi, karlı kaya, orman kayası, Yeraltı'nda bazalt ve **lav yarığı** | `main.js` (terrPlan, groundStep, fallPit), `world.js` (makeTerrain, makePit) |
| Lazer (3 şerit, ince/kalın, sağdan/soldan) | **Kam ışını:** yolun sağındaki ya da solundaki boynuzlu kam totemi önce titrer, sonra üç şeridi kapatan ışın yakar. **İnce ışın:** altından kay ya da zıpla. **Kalın ışın:** yalnız zıpla. Renk bölgeye göre: kara şimşek (mor), bataklık ağusu (yeşil), ayaz (buz mavisi), orman (kehribar), Erlik'in yalını (kor), Çin'de ejder ateşi (kırmızı) | `main.js` (updateBeam), `world.js` (makeIsin) |
| Boss'a kalkan küresi atmak | **Yada Taşı:** kamların yağmur-fırtına taşı. Boss savaşında yolda mavi taşlar çıkar; toplanan taş sağ alttaki mavi **YADA** düğmesiyle (masaüstünde **F**) boss'a fırlatılır. Tengri'nin şimşeği iner: boss 1 can yitirir, KAÇIŞ süresine +4 sn eklenir. Yelbegen'de bir yandaki iki başı yakar, son başı Oğuz keser | `main.js` (throwYada, yadaStrike), `bosses.js` (yelbegen.yada) |
| Can bitince bitiriş animasyonu | Bitiriş artık üç çeşit: ağır kombo, **sıçrayıp tepeden inme**, dönerek vuruş. Son vuruşta gökten şimşek iner (TENGRİ ŞAHİT!) | `main.js` (startFinisher) |
| Tempo: her saniye düşman/engel | Sıralar sıklaştı (~her saniye bir sıra), bir sıranın dolma olasılığı arttı, pusular daha sık. Yeni iki düşman da bütün yer bölgelerinde çıkar | `main.js` (update, spawnRow) |
| Boss savaşında engeller sürsün | Koşan boss'larda boss'un ayağının dibinden 1-1.7 sn'de bir engel savrulur (canı azaldıkça iki şerit). Oğuz'un durduğu düellolarda (kısım başbuğları) çıkmaz. Kaçacak şerit hep bırakılır | `main.js` (bossRow) |
| Boss yeteneğini koştuğumuz yere atsın | Tepegöz, Yelbegen, Çin Generali ve Kerey Han atışlarını %70 oyuncunun şeridine yapar | `bosses.js` (aim) |

Bot bu mekanikleri de oynuyor (uçurumda zıplar, ışında kayar/zıplar, ▼ düşmanın altından kayar, ▲ çıkınca zıplar, Yada Taşı atar). Ekran görüntüleri: `node tools/smu2-scenes.mjs kalkan kanatli sur ucurum2 yerucurum isin kalinisin yada bitir`.

## Telefonda açmak

- **En kolayı:** claude.ai'de yayınlanan sürüm (özel bağlantı, yalnız senin hesabınla açılır): https://claude.ai/artifact/EhXmC3e9XCYgj3JuVJKTxz
- **Kendi bilgisayarından (aynı Wi-Fi):** `npm run dev` (zaten `--host` ile açılır), terminalde yazan `Network: http://192.168.x.x:5173` adresini telefonun tarayıcısına yaz.
- **Web paketi:** `npm run build:web` → `dist-web/` klasörü (modeller ve sesler ayrı dosya, telefonda önbelleğe alınır). Herhangi bir barındırmaya (GitHub Pages, Netlify, Cloudflare Pages) olduğu gibi yüklenebilir. Not: `OYNA.html` 51 MB tek dosya olduğu için telefonda yavaş açılır ve gerçek sesleri yükleyemez.
- **claude.ai güvenlik kuralı (CSP):** yayın sayfası `data:` ve `blob:` adreslerini yüklemez. Bu yüzden web paketinde modeller `.glb.txt` (base64 metin) olarak gider ve bellekte çözülür (`src/assets.js` → `loadModel`), dokular `createImageBitmap` ile açılır (`BitmapTextures`), diyalog portreleri `<img>` değil `<canvas>`. Denemek için: `node tools/csp-sunucu.mjs 4190` ve `node tools/mobil-test.mjs http://localhost:4190/`.

## Geri bildirim düzeltmeleri (28 Eylül)

| Şikâyet | Ne yapıldı |
|---|---|
| Kılıç sesi silah gibi, müzik kötü | Bütün önemli sesler ve 9 müzik artık gerçek ses dosyası (`public/ses/`), `tools/ses_uret.py` ile üretildi. Ayrıntı: SES-KAYNAKLARI.md |
| Harita | Bölge sekmeleri (kendi çizilmiş simgeleriyle), her bölgenin çizilmiş manzarası, yol üstünde düğümler. Kaydırma yok. Düğüme tıklayınca ayrıntı ekranın ortasında açılır, arkası kararır |
| Emoji simgeler | `src/simge.js`: bölge, düğüm ve menü simgeleri SVG olarak çizildi |
| Öğretici ipuçları önü kapatıyor | Küçük bir bant olarak üstte çıkıyor, oyunu yavaşlatmıyor |
| Önde koşan sarı karakter | Altın düşman kaldırıldı |
| Mavi küre toplayınca boss kesiliyor | SMU'daki gibi: küre yolda süzülür, yanına gelince kılıçla VUR, küre boss'a uçar. Hasar yalnız böyle ya da altın mermiyi geri çalarak verilir |
| Boss hiç durmasın | 15 boss'un hepsi aynı çekirdekle baştan yazıldı (`bosses.js` → `kosan`): hep önde koşar, arada sıçrayıp havada döner, şeridine kendi silahını atar, iner, koşmaya devam eder. Albastı yavaşlatıldı |
| Bitiriş havaya vuruyor | Oğuz boss'un dibine atılır, vuruş noktaları boss'un boyuna göre hesaplanır: diz, sıçrayıp göğüs, son ağır darbe + şimşek. Kamera yolun içinden, çapraz |
| Havada indirmede değmiyor | Kul Oğuz'un kılıcına doğru dalar, havada buluşurlar |
| Güçlü kartlar varken oyun kolay | Ordu gücüne göre zorluk (1.0 → 1.8): sıra sıklığı, düşman oranı, pusu, hız, boss canı. HUD'da "ZORLUK ×" |
| Irmak anlamsız | Irmak bölümü kaldırıldı |
| Bataklık düşüşü | Yolun önünde toprak çöker, Oğuz çukura düşer, kuyunun içinden aşağı bakan kamerayla yüzüstü düşer, dipte su yaklaşır, suya dalıp yeni kata çıkar. Kesme yok |
| Destan Kitabı | İçindekiler sayfası (gruplu, tıklanınca o sayfaya gider), her sayfada kurdele ile İçindekiler'e dönüş, alttaki menü kaldırıldı, sayfa kıvrılarak çevrilir, kaide sayfaya sığar |
| Komik animasyonlar | Her klip kare kare incelendi (`tools/anim-sheet.mjs`); yumruk atar gibi duranlar çıkarıldı |
| Kartal | Blender'da (bpy) baştan modellendi: `tools/build_eagle.py` → `src/assets/karakus.glb` |

## Kostüm ve görünüş paketi

Ayrıntı ve Blender talimatı: repo kökündeki **`kostum/`** klasörü (`README.md`, `TASARIM.md`, `BLENDER.md`). Kod tarafı burada bitti: vitrin, "bir koşu dene", yiğide özel iz / kılıç parıltısı / eyer rengi / zafer pozu, kaftan desenleri, kenar ışığı, sallanan parçalar, iki bayram yiğidi. Blender'da yapılacak 15 parça `yigit.js` → `DETAY`'da önceden bağlı.

`assets.js` ve `book.js` de değişti. PC'de bu ikisi zip'ten sonra değiştiyse birleştir.

## Yapay zekâ ile yenilenen dünya (28 Eylül)

Engeller, yol kenarı dekoru ve zemin dokuları Replicate'te yapay zekâyla üretildi (yaklaşık 1,5–2 dolar). Karakterlere dokunulmadı.

- **Hat:** `tools/ai_liste.json` (tarifler) → `tools/ai_uret.py gorsel` (FLUX, her nesneye 3 aday görsel) → elle seçim → `tools/ai_uret.py model <ad>:<no>` (TRELLIS, görselden 3B) → `tools/ai_isle.py <ad>` (Blender: gölge plakası temizliği, üçgen düşürme, engeli yola hizalama, 512 px WebP doku) → `tools/ai_isle.py paket` → `src/assets/dunya.glb`. Dokular: `tools/ai_uret.py doku` → `tools/ai_doku.py <ad>:<no>` (döşenebilir yapar) → `src/assets/doku/*.jpg`.
- **Anahtar:** `REPLICATE_API_TOKEN` ortam değişkeni. Hiçbir dosyaya yazılmaz. Ham üretimler `ai-kaynak/` klasöründe durur (git'e girmez).
- **Oyunda:** `src/assets.js` paketi yükler. `PineTree_ai…` gibi aile üyeleri eski paketteki aynı ailenin yerine geçer, `Tower`, `Bush` gibi tam adlar eskisinin üstüne yazılır. `src/world.js` → `aiEngel()`: her engel, eski kodla çizilen hâlinin kutusuna oturtulur (şerit genişliği, zıplama/kayma yüksekliği değişmez; kayılan engellerde geçit yüksekliği korunur). Model yoksa eski hâl çizilir. `aiDoku()`/`aiZemin()`: dokular yüklenince kodla çizilenin yerine geçer.
- **Yenilenenler (35 nesne):** 20 engel (barikat, araba, sandık, kütük, kayık, karlı kaya, kızak, kemik yığını, kafes, lav kayası, küpler, erzak arabası, buz kristali, çit, diken tuzağı, Çin çiti, sarmaşık, kilimli kiriş, devrik ağaç, zincirli geçit, Çin sancak kapısı), 7 ağaç (2 çam, huş, 2 yapraklı, akçaağaç), 2 çalı, 2 kaya, 3 kule, pagoda. 8 doku: taş yol, sur duvarı, tahta, iskele, bazalt, uçurum kayası, toprak, çimen.
- **Eski hâlinde kalanlar (yapay zekâ bozdu):** gerili ip (ince ip kayboldu), karlı devrik çam (gövde kayboldu), ölü ağaçlar (ince dallar), ikinci huş ve yosunlu kaya (şekil bozuldu), kar dokusu.
- **Telefon bütçesi:** engel 3–4 bin, ağaç 1000, çalı 1500, kaya 500, kule 1500 üçgen. Ormanda sahne 500 binden 209 bin üçgene indi. Paket 5,5 MB.
- **Görüntüler:** `node tools/ai-bolge.mjs <önek> [bölüm...]`, `node tools/ai-oncesonra.mjs <boş.glb> [bölüm...]`, `node tools/ai-onizle.mjs <çıktı> <açı> <glb,...>`.

## Karakter ayrıntısı (28 Eylül)

Modellere dokunmadan karakterlerin yüzeyi zenginleştirildi (`src/ayrinti.js`, `src/assets.js` → `toon()`):
- **Ayrıntı dokuları:** kumaş, deri, kürk, keçe, ahşap, metal, altın, kemik (`src/assets/doku/detay_*.jpg`, yapay zekâyla üretilip gri tona çevrildi). Malzeme adına göre eşlenir (`M_Leather`, `M_Gold`, `Steel`...). Gri oldukları için kostüm rengini bozmaz. Parçaların çoğunda UV yok: doku, iskelet öncesi konuma göre üç eksenden izdüşürülür (triplanar), koşarken gövdeye yapışık kalır.
- **Parlama:** metal, altın, mücevher ve cilada çizgi film tarzı ışık lekesi.
- **Gölge boşlukları (AO):** kol altı, yaka altı, kıvrımlar. `python3 tools/karakter_ao.py` (Blender Python modülü) 21 modelin hepsini ~30 sn'de hesaplar → `src/assets/ao.json` (409 KB). Anahtar köşe sayısı + ilk köşe konumu olduğundan model değişirse o parça kendiliğinden gölgesiz kalır. **`build_chars.py` ile bir karakter yeniden üretilirse bu komutu tekrar çalıştır.**
- Önce/sonra: `node tools/karakter-yakin.mjs oguz model:tepegoz` → `test-out/yakin-*.png`. `window.__game.AYR` ile ayrıntı, parlama ve gölge kısılabilir.

## Bilinçli kararlar

- **Harita düğümleri ayrı görev:** Her kısım ayrı oynanır (SMU'daki gibi). Sonraki kısımlar kendi girişiyle başlar; Yeraltı'nda dalışla. Eski yıldızlar madalyaya çevrildi.
- **Kostümler yiğit kartı oldu:** Satın alınmış kostüm kaybolmaz, kart olur; giyilen lider olur.
- **Seferden gelen destan eşyası:** Uzun seferler bazen eksik bir **gümüş ok** getirir, **altın yay hiçbir zaman** gelmez; altın yay bölümde bulunmalı.
- **Nazar Boncuğu + Kara-evli:** İkisi toplanır (2 kalkan).
- **Kaçış süreleri:** Bot, 15 boss'un hepsini sürenin yarısından azında yendi (en uzun: Yelbegen 35 sn / 70 sn). Oyuncu için bol pay var.
