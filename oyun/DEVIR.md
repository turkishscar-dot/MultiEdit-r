# Devir belgesi: Oğuz Kağan koşu oyunu (başka bir ajan için)

Önce repo kökündeki `CLAUDE.md`'yi oku.
Dal: `claude/serene-wright-uo3dxg` (repo: turkishscar-dot/MultiEdit-r, klasör `oyun/`). Türkçe konuşulur; kullanıcı küçük küçük "Adım N" istekleri verir.
Yığın: Three.js r0.186 + Vite 8. Sürekli okunacak diğer belge: `UYGULAMA.md` (özellikler ve geçmiş), `kostum/` (kostüm tasarımı).

## Kullanıcının kuralları (bozma)
- Ücretli bir şey gerekirse **önce sor**. Hesabı, parolayı, ödemeyi kullanıcı yapar.
- API anahtarları (`REPLICATE_API_TOKEN`, Meshy) **ortam değişkeninde** durur; dosyaya, commit'e, günlüğe yazma. Kullanıcı iş bitince silmeli.
- Sohbet özelliği ekleme (moderasyon, çocuk güvenliği).
- Model adı, sürüm gibi kimlikleri commit mesajına, PR'a, koda yazma.
- Tek dal; PR sadece istenirse. Commit sonuna `Co-Authored-By` ve `Claude-Session` satırı (oturuma göre).
- Küçük adımlar, her adımın sonunda: test, derleme, yayın, commit, kısa Türkçe özet.

## Çalıştırma
```
cd oyun && npm i && npx vite --port 5173          # geliştirme
sh tools/regresyon.sh                              # 25 kontrol, "SONUÇ: 25 tamam, 0 hatalı" beklenir (uzun sürer, ~5-10 dk)
node tools/web-paket.mjs                           # çok dosyalı web paketi -> dist-web (modeller .glb.txt)
node tools/csp-sunucu.mjs 4190 &                   # sıkı CSP sunucusu (claude.ai artifact ortamını taklit eder)
node tools/mobil-test.mjs http://localhost:4190/   # telefon/CSP testi
```
- Test tarayıcısı: Playwright + `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (swiftshader, yazılımla çizim). Test betikleri tarayıcıyı `CHROME` ortam değişkeninden alır: bulutta `export CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Regresyon için vite açık olmalı (5173). Oyun kancaları: `window.__game` (start, tick, Y, EK, book, TORE, AYR...).
- Yayın: claude.ai Artifact, `dist-web/index.html`, URL `https://claude.ai/artifact/EhXmC3e9XCYgj3JuVJKTxz` (Artifact aracı olan ortamda). Bunun dışında `OYNA.html` tek dosya derlemesi (`git`e girmez).
- `*.glb` dosyaları `.gitignore`'da; yeni model eklerken `git add -f`.

## Boru hatları (araçlar `tools/`)
- **Splash art** (kart resimleri, `src/assets/splash/<id>.jpg`): `node tools/splash-render.mjs [id[:dönüş]...]` -> `python3 tools/splash-uret.py [--yeniden] id...` -> `python3 tools/splash-uret.py paket`. FLUX Kontext pro, görsel başına ~0,04 $.
- **Kostüm parçaları**: `python3 tools/build_kiyafet.py` (bpy) -> `src/assets/kiyafet.glb`. Parçalar `DETAY` içinden `src/yigit.js`'de seçilir.
- **Yüz yakın çekimi**: `node tools/yuz-yakin.mjs id...` -> `test-out/yuz-<id>.png`.
- **Meshy denemesi** (yeni karakter modeli):
  1. `node tools/meshy-referans.mjs id` (T-pozunda 3B görüntü) -> `python3 tools/meshy-uret.py id` -> `ai-kaynak/meshy/<id>-ref.png`.
  2. Kullanıcı görseli Meshy'ye yükler (image-to-3D, Meshy 6/7, T-pose, simetri, üçgen, ~20k), sonra **Texture (PBR)** uygular, dokulu GLB indirir.
  3. `python3 tools/meshy_uydur.py girdi.glb cikti.glb 30000`: 30k üçgene indirir, ölçekler, Oğuz gövdesinin kemik ağırlıklarını aktarır ve yumuşatır (`YUMUSAT` ortam değişkeni). Çıktı bizim 65 kemikli iskelette; **119 animasyon kendiliğinden çalışır**.
  - Pilot sonucu (Kül Tigin): geometri çok iyi, koşu döngüsü temiz. Eksikler: dokusuz teslim edildi; 910k üçgen -> 30k detay kaybettirir, normal haritası çıkarılıp bindirilmeli; ağırlıklar yumuşatınca iyi ama elle düzeltme gerekebilir (omuz, sırt çantası, saç).

## Sırada (kullanıcı hedefi: 1080p/2K net görüntü ve karakter kalitesi)
0. **İlk yükleme 175 MB** (Ekim PC güncellemesi): `assets.js` bütün yiğit ve düşman Meshy gövdelerini (`assets/yigit`, `assets/govde`, ~100 MB) açılışta indiriyor. Gövdeler seçilince indirilmeli (tembel yükleme; `setBody` eşzamansız olmalı). Telefonda bellek de sorun olabilir.
1. **Çözünürlük ve kenar yumuşatma** (bağımsız, ücretsiz kod işi). Bulgu:
   - `src/main.js`: `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`; grafik düzeyleri `src/ayarlar.js` `GFX`: yüksek 1,5×, orta 1×, düşük 0,75×. Açılışta 2,5 sn FPS ölçümü `autoGfx` ile düzeyi düşürüyor (telefonda çoğu zaman ORTA/DÜŞÜK seçilir; ekranın yarısı/üçte biri çözünürlükte çizim, bulanık).
   - `EffectComposer` ara hedefleri **MSAA'sız** (tırtıklı kenarlar).
   - Yapılacak: "YEREL" seviyesi (ratio = devicePixelRatio, üst sınır 3); composer hedeflerine `samples = 4`; **dinamik çözünürlük** (FPS düşerse oranı kıs, toparlanınca yükselt; kalıcı düşürme yok); anizotropi 4->8/16; bloom yarı çözünürlük; gölge kalitesi. Ayarlardan geri alınabilir olsun. Telefonda FPS'i yalnız kullanıcı ölçebilir; test botu yazılımla çiziyor.
2. **Meshy ile karakterleri yenileme**: dokulu Kül Tigin GLB gelince: normal haritası çıkar (Blender bake), 1024 doku, oyuna yeni şablon olarak ekle (yiğit kartına `model` alanı; kostüm parçaları bu yiğitlerde kapanır), vitrinde ve koşuda dene, paket boyutunu ölç (şimdi ~68 MB). Sonra en görünür 8-10 yiğit ve boss'lar. 250 ücretsiz kredi biter, Meshy Pro ~30 kredi/model.
3. Sonra: düşman/boss modelleri (aynı hat), harita ve arayüz çizimleri (FLUX), ses ve müzik (ElevenLabs Türkçe seslendirme ~0,08 $/1000 karakter; müzik ~0,15 $/dk).
4. Bilinen açıklar: Dağ Han başlığındaki iki küçük kırmızı nokta 3B modelden geliyor; sakal `build_kiyafet.py` içinde çeneden başlıyor (doğrulandı).

## Tuzaklar
- Regresyon uzun sürer; arka planda çalıştırıp bitiş işaretini bekle. `pgrep -f` ile beklerken kendi komutunu yakalamamaya dikkat.
- Vite yeniden yüklenirken Playwright betikleri koparsa (`#ypbtns > button` bulunamadı) sayfayı yenileyip tekrar dene (`splash-render.mjs` bunu yapar).
- Karakter paylaşılan iskelet: Oğuz gövdesi + `C_*` parçaları, hepsi tek şablon. Yiğit rengi, saç dokusu (`MI_Hair_*`), sakal (`C_BeardLong*`) `applyCostume` (`src/costumes.js`) ve `DETAY` (`src/yigit.js`) ile ayarlanır.
- Pelerin ağırlığı: `sway()` gövde eğimine göre pelerini geriye kaldırır (kalçaya girmesin).
- claude.ai Artifact CSP'si `data:`/`blob:` isteklerini engeller; web paketi bu yüzden modelleri `.glb.txt` yapıp `parseAsync` ile yükler.

## Tanıtım sitesi (oguzkagangame.com)
- Kaynak: repo kökünde `site/` (statik: `index.html`, `css/`, `js/veri.js` + `js/site.js`, `fonts/` yerel, `img/`, `oyna/` = oynanabilir oyun). Türkçe/İngilizce geçişli.
- Güncelleme: `node tools/site-ekran.mjs [bölüm:kare ...]` (gerçek oyun ekranları, vite açık olmalı) → `python3 tools/site-yap.py` (görseller + `site/oyna` oyun derlemesi; `gorsel` argümanıyla yalnız görseller). Yiğit verisi `site/js/veri.js` (oyundaki `CARDS` ile aynı tutulmalı).
- Yayın: Cloudflare Workers (repo kökündeki `wrangler.jsonc`, varlık klasörü `site`), GitHub'daki bu dala bağlı. Push edilince kendiliğinden yayınlanır. Dosya başı sınır 25 MB.
- Yiğit sayısı 25 (PC'de Kül Tigin, Bilge Kağan, Manas, Fatih çıkarıldı). Stüdyo bölümü: kurucu, Multi Editor, Scar Edits (`site/img/multi-editor/`).
- İletişim adresi `kadir@oguzkagangame.com` (Cloudflare Email Routing → kullanıcının Gmail'i).
