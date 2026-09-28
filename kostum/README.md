# Kostüm ve Karakter Görünüşü: Yapılacaklar

Amaç: yiğitler (kostümler) güzel görünsün, oyuncu almak istesin. İki taraf var:
- **Bu repoda yapılanlar** (kod, hazır): vitrin, deneme koşusu, efektler, bayram yiğitleri. Ayrıca Blender parçalarının kodda önceden bağlanması.
- **PC'de Blender'da yapılacaklar:** parçaların modelleri (`BLENDER.md`).

## Durum

### Kod (bu repoda, bitti)
- [x] **Vitrin:** Yiğitler ekranında önizleme büyüdü. Sürükleyerek döndürülüyor. BEKLE / SALDIR / ZAFER duruşları var. **⛶ VİTRİN** düğmesi tam ekran vitrin açıyor: büyük model, ◀ ▶ ile yiğitler arası geçiş.
- [x] **Nadirlik ışığı:** vitrinde arka plan, hâle, yükselen kıvılcımlar, kaide halkası ve karakterin kenar ışığı nadirlik renginde (3★ bronz → 8★ kızıl).
- [x] **Giyinme parıltısı:** yiğit değişince model hızla döner, ışık patlar.
- [x] **Bir koşu dene:** alınmamış yiğitle 600 m'lik koşu. Kut, XP, Gök Demir ve Töre sayaçları işlemez. Sonunda "Beğendin mi? AL" ekranı çıkar.
- [x] **Yiğide özel efektler:** koşu izi (nadirlikle yoğunlaşır), 6★ ve üstünde parlayan kılıç, eyer ve koşum rengi, bölüm sonunda zafer pozu.
- [x] **Kaftan desenleri:** kilim, çintemani, rumi, pul, kürk, şerit. Kodla çiziliyor, kostüm rengiyle boyanıyor.
- [x] **Kenar ışığı:** koşuda hafif, vitrinde güçlü. Karakteri arka plandan ayırır.
- [x] **Sallanan parçalar:** adında `Sway` geçen parça (pelerin, örgü, saçak) koşarken geriye kalkar, zıplayınca savrulur.
- [x] **Bayram yiğitleri:** Ergenekon Demircisi (Nevruz, 14–28 Mart) ve Boz Atlı Hızır (Hıdırellez, 1–10 Mayıs). Yalnız bu günlerde çağrılır, alınan kalıcıdır.
- [x] **Blender parçaları kodda bağlı:** 15 parçanın hangi yiğitte görüneceği ve rengi `oyun/src/yigit.js` → `DETAY` içinde yazılı. Model gelince kendiliğinden görünür.
- [x] Telefonda Yiğitler ekranındaki üst üste binen düğmeler düzeltildi.
- [x] **Karakter ayrıntısı:** kumaş, deri, kürk, metal ve altın dokuları, parlama, gölge boşlukları, yapay zekâ boyalı ayrıntı (`oyun/src/ayrinti.js`).
- [x] Kadın yiğitler (Tomris, Banu Çiçek) oyundan kaldırıldı.

### Blender (PC'de, sırayla)
- [ ] 1. Kaftan ve şalvara düzgün UV (desenler için).
- [x] 2. `C_Belt` kemer takımı (17 yiğit). *Bu repoda üretildi (`tools/build_kiyafet.py`).*
- [x] 3. `C_Sash` kuşak (12).
- [x] 4. `C_Cape_Sway` pelerin (11).
- [x] 5. `C_KaftanLong` uzun kaftan (11).
- [x] 6. `C_FurCollar`, `C_Mustache`, `C_BraidBack_Sway` (7, 7, 6).
- [x] 7. `C_Lamellar`, `C_BraidsSide`, `C_Pauldrons`, `C_BeardLong`, `C_BeardLongWhite` (5, 4, 4, 2, 2).
- [x] 8. Şaman takımı: `C_Fringe_Sway`, `C_ShamanMirror`, `C_Drum`.
- [ ] 9. İkinci tur: baş ve el oranları, yüz. *(Kadın yiğitlerin gövdesi, saç tepesi ve örgüleri bu repoda yapıldı; yüz hâlâ Oğuz'unki.)*
- [ ] 10. Her adımdan sonra `node tools/kostum-shots.mjs` ve `tools/regresyon.sh`.

### İleride
- [ ] Gerçek parayla satış (telefona paketlenince, ebeveyn onaylı ödeme; kostümler güç vermez, davul olasılıkları açık yazar).
- [ ] Yeni bayramlar ve kostüm takımları (kostüm + kılıç + at koşumu adıyla).
- [ ] İstenirse bir "vitrin kostümü" için 3B sanatçı (ücretli, önce sorulur).

## Belgeler
- `TASARIM.md`: 31 yiğidin görünüş tasarımı (siluet, renk, parça, kaynak notu).
- `BLENDER.md`: PC'deki Claude için adım adım Blender talimatı ve kontrol listesi.
- `YAPAY-ZEKA-KARAKTER.md`: karakter, düşman ve boss için yapay zekâ seçenekleri, riskleri ve önerilen sıra.

## PC'deki Claude'a ne diyeceksin
> `MultiEdit-r` reposunun `claude/serene-wright-uo3dxg` dalını çek. Önce `oyun/UYGULAMA.md`'yi uygula (kod), sonra `kostum/BLENDER.md`'yi sırayla uygula.
