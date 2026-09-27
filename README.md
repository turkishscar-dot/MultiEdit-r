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
- [x] **`istemler/` klasöründeki 16 özelliğin hepsi bu repoda kodlandı ve test edildi** → oyunun güncel kodu **`oyun/`** klasöründe.
  - Bilgisayardaki oyuna nasıl aktarılacağı, neyin burada yapılamadığı: **[`oyun/UYGULAMA.md`](./oyun/UYGULAMA.md)**
  - Çevrim içi altyapı karşılaştırması (hesabı sen açacaksın): **[`oyun/CEVRIMICI.md`](./oyun/CEVRIMICI.md)**
  - Ses kaynakları ve lisans: **[`oyun/SES-KAYNAKLARI.md`](./oyun/SES-KAYNAKLARI.md)**
- [x] **İkinci SMU paketi** (düşman simgeleri, kanatlı kul, iniş-çıkış ve uçurumlar, kam ışını, Yada Taşı, tempo, boss sırasında engeller) kodlandı; ayrıntı `oyun/UYGULAMA.md` → "İkinci SMU paketi".
- `istemler/`: yol haritası olarak duruyor (hepsi uygulandı; 19. adımın kurulum kısmı hesap açılınca).
- `updates/001`, `updates/006`: isteğe bağlı eski öneriler.
- `iptal/`: yerine yeni istemler geçen eski paketler.

## Klasör yapısı

```
REPORT.md          ← SMU karşılaştırma raporu
oyun/              ← oyunun güncel kaynak kodu (3B modeller hariç) + test araçları
  UYGULAMA.md      ← PC'deki oyuna aktarma talimatı
  CEVRIMICI.md     ← Firebase / Supabase karşılaştırması
  SES-KAYNAKLARI.md
  src/             ← oyun kodu
  tools/           ← test botu ve test betikleri (regresyon.sh hepsini çalıştırır)
istemler/          ← 00–19 yol haritası
updates/, iptal/   ← eski paketler
```
