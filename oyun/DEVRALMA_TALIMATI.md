# OĞUZ KAĞAN: TÜRK DESTANI — MESHY 3D ENTEGRASYON VE DEVRALMA TALİMATI (GÜNCEL)
*Son Güncelleme: 3 Ekim 2026, 13:34*

Bu belge, oyunun 3D modellerinin Meshy API kullanılarak üretilmesi, Blender ile oyun iskeletine giydirilmesi ve Three.js tabanlı koşu oyununa (`oguzkhan`) entegrasyonu sürecinde **kaldığı yerden devam etmek** için hazırlanmıştır.

---

## 1. Güncel Durum Özeti (Nerede Kaldık?)

| Kategori | Hedef | Üretilen (Meshy) | Oyuna Entegre Edilen | Kalan / Eksik |
| :--- | :---: | :---: | :---: | :--- |
| **10 Yiğit (Kostüm)** | 10 | 10 (%100) | 10 (%100) | **TAMAMLANDI.** (`oguz`, `mete`, `bumin`, `bilge`, `tonyukuk`, `kultigin`, `alperTunga`, `attila`, `basat`, `beyrek` -> `src/assets/yigit/`) |
| **Bosslar** | 15 | 15 (%100) | 15 (%100) | **TAMAMLANDI.** Modeller `src/assets/govde/` altına aktarıldı. |
| **Düşmanlar** | 14 | 11 | 3 (`albis`, `almas`, `itokcu`) | **3 EKSİK:** `mizrakci`, `pusucu`, `sulmus` üretilmeyi bekliyor. İndirilen 8 tanesinin giydirmesi yapılacak. |
| **Engeller (`@engel`)** | ~12 | 1 (Barikat) | 1 (Barikat) | **BAŞLANMADI.** Kalan engeller üretilecek ve `dunya.glb` içine paketlenecek. |

---

## 2. İşlemin Durma Sebebi ve Kritik Düzeltme (402 Hatası)

* **Hesap Durumu:**
  * `MESHY_API_KEY` (1. Hesap): **20 kredi kaldı** (30 kredilik görev açılamaz).
  * `MESHY_API_KEY_2` (2. Hesap): **2.220 kredi mevcut**.
* **Sorun:**
  * `tools/meshy_toplu.py` içindeki paralel iş parçacıkları (threading) 402 aldığında anahtar değiştirme mantığı senkronize olamadığı için `mizrakci`, `pusucu` ve `sulmus` düşmanlarında 402 hatası fırlatarak betik durdu.
* **Çözüm (ZORUNLU İLK ADIM):**
  * `tools/meshy_toplu.py` dosyasında `KEYS` tanımını 2. hesabı (2.220 kredi) ilk sıraya alacak şekilde düzenleyin:
  ```python
  # tools/meshy_toplu.py satır 13:
  KEYS = [k for k in (os.environ.get('MESHY_API_KEY_2', ''), os.environ.get('MESHY_API_KEY', '')) if k]
  ```

---

## 3. Sıradaki Yapılacak İşler ve Çalıştırılacak Komutlar

### ADIM 1: Anahtar Sırasını Güncelle
`tools/meshy_toplu.py` dosyasındaki `KEYS` dizisinde `MESHY_API_KEY_2`'yi başa alın (Böylece 2.220 kredilik hesap doğrudan kullanılacaktır).

### ADIM 2: Kalan 3 Düşmanı Üret
Kredi hatası nedeniyle bekleyen 3 düşmanı Meshy'ye gönderin:
```powershell
python tools/meshy_toplu.py nesneler/dusman/mizrakci nesneler/dusman/pusucu nesneler/dusman/sulmus --paralel 3
```
*Not: Görevler tamamlandığında GLB dosyaları `ai-kaynak/nesneler/dusman/<ad>/meshy.glb` konumuna otomatik indirilecektir.*

### ADIM 3: İndirilen Düşmanları İskelete Giydir
`ai-kaynak/nesneler/dusman/` altında indirilen düşman modellerini (`baltaci`, `geyik`, `ikikalkan`, `itkalkan`, `kalkanli`, `kanatli`, `kosucu`, `okcu`, `mizrakci`, `pusucu`, `sulmus`) Blender ile oyun iskeletine giydirerek `src/assets/govde/<id>.glb` konumlarına yazın:
```powershell
$blender = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
$dusmanlar = @("baltaci", "geyik", "ikikalkan", "itkalkan", "kalkanli", "kanatli", "kosucu", "okcu", "mizrakci", "pusucu", "sulmus")
foreach ($d in $dusmanlar) {
    if (Test-Path "ai-kaynak/nesneler/dusman/$d/meshy.glb") {
        & $blender -b --python tools/meshy_uydur.py -- "ai-kaynak/nesneler/dusman/$d/meshy.glb" "src/assets/govde/$d.glb" 20000
    }
}
```

### ADIM 4: Engelleri Üret (`@engel`)
Kalan bütçeyle oyun içi engelleri Meshy ile toplu üretin:
```powershell
python tools/meshy_toplu.py @engel --paralel 4
```
*Not: Bu komut `ai-kaynak/nesneler/engel/` altındaki tüm klasörleri (kaya, çukur, çit, kapan vb.) 10.000 poly hedefiyle Meshy'ye gönderir.*

### ADIM 5: Engelleri Temizle ve Dünyaya (`dunya.glb`) Paketle
1. Çevre/engel temizliğini çalıştırın:
```powershell
python tools/meshy_cevre.py
```
2. Üretilen tüm engelleri `tools/dunya_birlestir.py` kullanarak mevcut `src/assets/dunya.glb` içine monte edin:
```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --python tools/dunya_birlestir.py -- barikat
```
*(Yeni üretilen diğer engel id'lerini de parametre olarak ekleyin).*

### ADIM 6: Derleme ve Test
Oyunu derleyin ve Vite sunucusunda test edin:
```powershell
npm run build
```
Tarayıcıdan `http://localhost:5173/` açarak karakterlerin ve modellerin düzgün yüklendiğini doğrulayın.

---

## 4. Kritik Kurallar & Hatırlatmalar
1. **Model İsimleri Kuralı:** Model veya yapay zeka isimleri asla git commit mesajlarına yazılmaz.
2. **Güvenlik:** API anahtarları asla kaynak kodlara, loglara veya commit geçmişine açık metin yazılmaz (`$env:MESHY_API_KEY_2` ortam değişkeninden okunur).
3. **Frankenstein Aksesuar Çakışması:** Kostüm değiştirilirken (`setBody(id)`), `oguz.glb` içindeki varsayılan aksesuarların üst üste binmemesi için `src/assets.js` içindeki parça gizleme mantığı korunmalıdır:
   ```javascript
   for (const p of Object.values(this.parts)) p.visible = false;
   ```
4. **Çift Harcama Koruması:** `gorev.json` dosyaları mevcut görev durumunu tutar. Görev tamamlanmadan betik kesilirse tekrar çalıştırıldığında yeniden kredi harcamaz, mevcut görevi bekler.
