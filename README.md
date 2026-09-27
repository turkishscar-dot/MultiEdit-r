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

- [x] Oğuz Kağan kaynak kodu analiz edildi, Spiderman Unlimited ile karşılaştırıldı → **`REPORT.md`**.
- [x] **Asıl yol haritası: [`istemler/`](./istemler/README.md)**. 20 adım (00–19); sıra, bağımlılıklar ve PC'deki Claude için genel kurallar orada.
- [ ] İsteğe bağlı eski paketler: `updates/001-alp-gucu-ultimate`, `updates/006-kovalamaca-chase`.
- `iptal/`: yerine yeni istemler geçen eski paketler. Uygulanmayacak.

## Klasör yapısı

```
REPORT.md          ← SMU karşılaştırma raporu
istemler/          ← PC'deki Claude'a sırayla verilecek istemler (00–19) + README (sıra, kurallar)
updates/           ← isteğe bağlı eski paketler (001, 006)
iptal/             ← iptal edilen paketler, uygulanmayacak
applied/           ← uygulanmış paketler buraya taşınır
```
