# Oğuz Kağan — Güncelleme Deposu (Staging Repo)

Bu repo, **Oğuz Kağan oyununun kendisini içermez.** Oyun projesi (Three.js + Vite ile yazılmış bir web
oyunu) kadir'in bilgisayarında/Drive'ında ayrı duruyor, bu repoya hiç bağlı değil.

Bu repo yalnızca bir **ara istasyon**: buradaki Claude oturumu (analiz + kod yazma kredisi burada
olduğu için) özellik güncellemelerini hazırlar, buraya commit'ler. Kadir'in bilgisayarındaki Claude
(Claude Code) bu repoyu çeker, `updates/` altındaki her klasörü okuyup gerçek oyun projesine uygular.

## Nasıl çalışır

1. Bu oturumdaki Claude, hedef özellik için `updates/` altında ayrı bir klasör açar
   (örn. `updates/001-alp-gucu-ultimate/`).
2. Her klasörün içinde bir `TALIMAT.md` var: hangi dosyaya, hangi fonksiyonun yanına, ne ekleneceği;
   gerekirse hazır kod parçaları.
3. Kadir, PC'deki Claude'a (gerçek proje dosyalarına erişimi olan) "şu klasördeki `TALIMAT.md`'yi oku ve
   uygula" der.
4. PC'deki Claude `TALIMAT.md`'yi okur, kodu gerçek proje dosyalarına (`src/main.js`, `src/bosses.js`
   vb.) entegre eder, test eder.
5. Uygulama bittikten sonra o `updates/NNN-.../` klasörü `applied/` altına taşınır (arşiv, tekrar
   karışıklık olmasın diye).

## Durum

- [x] Oğuz Kağan projesinin kaynak kodu (`src/*.js`, `index.html`) analiz edildi (Drive üzerinden zip
      olarak alındı, `node_modules`/`dist`/derlenmiş `OYNA.html` hariç tutuldu).
- [x] Spiderman Unlimited ile detaylı karşılaştırma yapıldı → bkz. **`REPORT.md`**.
- [x] 7 güncelleme paketi hazır (`updates/001`–`007`), her biri bağımsız uygulanabilir
      (004 ve 005, 004→005 sırasıyla; 007, 004'ten sonra).

## Rapor

Detaylı analiz ve öneriler için **[`REPORT.md`](./REPORT.md)** dosyasına bak.

## Klasör yapısı

```
REPORT.md                              ← detaylı analiz raporu
updates/
  001-alp-gucu-ultimate/TALIMAT.md      ← beceriyle dolan özel yetenek
  002-umay-ana-canlanma/TALIMAT.md      ← kut ile canlanma (continue)
  003-kil-payi-near-miss/TALIMAT.md     ← ucundan kaçış bonusu
  004-alplik-unvanlari-achievements/    ← başarım sistemi
  005-yoruk-gorevleri-daily-quests/     ← günlük görevler (004'e bağımlı)
  006-kovalamaca-chase/TALIMAT.md       ← senaryolu takip sahnesi (en yüksek efor)
  007-san-defteri-stats/                ← istatistik paneli (004'e bağımlı)
applied/
  (uygulanmış paketler buraya taşınır)
```
