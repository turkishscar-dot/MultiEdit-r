# PC güncelleme raporu (pc-guncelleme dalı)

Bilgisayardaki Oğuz Kağan çalışma klasörünün güncel hâli `oyun/` altına kopyalandı. Bulutta olup bilgisayarda olmayan hiçbir dosya silinmedi; birleştirme kararı bulut tarafında. Oyun kodunda aktarım sırasında değişiklik yapılmadı.

## 1. Bilgisayarda yapılan değişiklikler

**Ortam ve görsel kalite (son oturum)**
- Zemin/yüzey dokuları Poly Haven (CC0) 1K ile değişti: bazalt (lav çatlaklı), taş yol, sur duvarı, kaya, ahşap, iskele, toprak, çimen, kar, donmuş zemin. `tools/doku_duzenle.py` parlaklığı oyun ışığına göre ayarlar. Eski dokular `src/assets/doku_eski/` içinde.
- Poly Haven 3D modelleri (42 adet: kaya, kayalık duvar, kütük, kök, çalı, taş ocak...) `src/assets/ph.glb` paketinde. `tools/ph_indir.py` indirir, `blender -b --python tools/ph_paket.py` paketler (düğüm adı `PH_<ad>`). `world.js` içinde `phObj/phSerp` ile bölümlere ton ve ışımayla serpilir (yeraltı/lav, bataklık, orman, Altay, Karanlık Ülke, Koru, Demirhane).
- Uzak dağlar: koniler yerine üç katmanlı sivri sırt + kar tepeleri (`makeSky`). Yeraltı bölümünde kaya kuleleri `kayalik()` ile dokulu, bozulmuş gövdeli.
- Güneş/ay: sert kenarlı çekirdek disk + hâle (bloom'u tetikler). Gökyüzüne gökyüzü renginden türeyen, yavaş kayan bulutlar eklendi.
- Kuzey ışıkları (aurora) tamamen kaldırıldı. Altay'daki koni yamaçlar kaldırıldı. Karanlık Ülke ve Altay zeminine doku (donmus.jpg, kar.jpg).
- Çevre modelleri (`doga/kale/dunya/ph`) iki yüzlü çiziliyor (boşluklu kule/kale görüntüsü giderildi).
- Meshy "_ai" modelleri delikliydi: `tools/ai_isle.py` köşeleri birleştirmeden sadeleştiriyordu. Birleştirme (`kaynat`) eklendi, üçgen bütçeleri arttı (dekor 4500, kaya 2200, kule 4000). 38 model yeniden üretildi, `dunya.glb` güncellendi. Devrik çam engelinin altındaki kayalar kütüğe değecek şekilde yükseltildi.

**Masaüstü uygulaması (yeni)**
- Electron kabuğu: `electron/main.cjs`, `OYNA-UYGULAMA.bat` (derler ve açar), `npm run app` / `app:hizli` / `build:web`. Yüksek performanslı ekran kartını (RTX) zorlar; `oyun://` protokolüyle `dist-web/` sunar. F11 tam ekran, F12 geliştirici araçları.
- `GPU-AYARLA.bat`: Chrome/Edge'i Windows'ta "Yüksek performans" yapar (kullanıcı kendisi çalıştırır). Tarayıcıda Intel/yazılım çizici algılanırsa ilk açılışta bir kez uyarı gösterilir (`gpuUyari`, main.js).

**Yiğitler ve karakterler (önceki oturumlar, git geçmişinden)**
- 29 yiğide Meshy gövdesi; dikiş kaynağı, parmak ağırlıkları, kılıç/sadak/pelerin için bağlantı noktası ağırlığı, düz bekleme duruşu (`Idle_Loop`). Yiğide özel düzeltmeler `tools/meshy_duzelt.json`.
- Destan Kitabı'na engel, yeryüzü, Körmös sergi sayfaları; geniş yiğit paneli ve tam splash.
- Kül Tigin, Fatih, Bilge Kağan ve Manas yiğitleri kaldırıldı; Tonyukuk eski Meshy modeline döndü.
- Kostüm parçaları Blender'da yapıldı (kostum/BLENDER.md).

**Boss, arayüz, ses:** Bu aktarımda boss davranışı ya da ses kodunda yeni değişiklik yok. Arayüzde: Destan Kitabı sergi sayfaları, yiğit paneli, GPU uyarısı.

## 2. Yeni / değişen model, doku ve ses dosyaları
- Yeni: `src/assets/ph.glb` (9,8 MB), `src/assets/doku/kar.jpg`, `donmus.jpg`, `src/assets/doku_eski/*` (yedek), `src/assets/govde/*.glb` (29), `src/assets/yigit/*.glb` (24), `src/assets/harita/*` (8), `tasarim-taslak/*` (24 taslak görsel).
- Değişen: `src/assets/dunya.glb` (10,6 MB, yeniden üretildi), `src/assets/doku/{bazalt,tasyol,surduvar,tahta,iskele,kaya,toprak,cimen}.jpg` (Poly Haven).
- Kök `src/assets/*.glb` dosyaları (bulutta `.gitignore` nedeniyle yoktu) `git add -f` ile eklendi (en büyüğü 10,6 MB). 100 MB üstü dosya yok.
- Yeni ses dosyası yok.

## 3. `git diff claude/serene-wright-uo3dxg --stat -- oyun/` özeti
277 dosya: 227 yeni, 50 değişen; +5963 / −496 satır (ikili dosyalar satıra sayılmaz). Dağılım: `src/assets/govde` 29, `src/assets/yigit` 24, `src/assets/doku_eski` 18, `tasarim-taslak` 24, `src/assets/harita` 8, `src/assets/doku` 8 değişen + 2 yeni, geri kalan çoğunluk `tools/*` ve `src/*.js` (main.js, world.js, assets.js, yigit.js, tore.js, story.js, harita.js, koleksiyon.js...).
Not: `oyun/.gitignore` bilgisayardaki sürümle değişti (Gameloft, apk, ai-kaynak vb. dışlanıyor; kök `*.glb` artık yok sayılmıyor).

## 4. Derleme
`npm i && npx vite build` temiz klonda (oyun/): **hatasız**, 187 modül, tek dosya `dist/index.html` ≈ 235,7 MB (122,9 MB gzip). Not: tek dosya çok büyük; `npm run build:web` parçalı çıktı (dist-web) üretir.

## 5. Bilinen hatalar / yarım kalanlar
- Gökyüzü bulutları gece bölümlerinde zor seçilir. Zemin kenarlarında (korkuluk/kırık kenar) iyileştirme yapılmadı.
- Kule/kale modellerinde kenarlarda ince kırıntılar kaldı (üçgen bütçesi artırıldı, tam kaybolmadı).
- Devrik çam kayası oyunda (çarpışma) denenmedi; yalnız kitap sayfasında görüldü.
- Poly Haven modelleri örneklenmiş (instancing yok): çok bölümlü sahnede draw call artar. Telefon için hafif sürüm üretilmedi; yüksek üçgenli süs ağaçları telefonda ağır olabilir.
- `fir_sapling_medium` ve `island_tree_01` Blender'ı kilitlediği için pakete girmedi.
- Karanlık Ülke ve Altay dışındaki bölümlerde (Çin, Gök Yolu) çevre iyileştirmesi yapılmadı.
- Gameloft/Spider-Man Unlimited dosyaları (telifli referans) bilerek bu repoya konmadı.
