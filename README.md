# Oğuz Kağan — Güncelleme Deposu (Staging Repo)

Bu repo, **Oğuz Kağan oyununun kendisini içermez.** Oyun projesi (Unity/Godot/Unreal
dosyaları) bu repoya hiç bağlı değil, kadir'in bilgisayarında ayrı duruyor.

Bu repo yalnızca bir **ara istasyon**: buradaki Claude oturumu (analiz + kod yazma
kredisi burada olduğu için) özellik güncellemelerini hazırlar, buraya commit'ler.
Kadir'in bilgisayarındaki Claude (Claude Code) bu repoyu çeker, `updates/` altındaki
her klasörü okuyup gerçek oyun projesine uygular.

## Nasıl çalışır

1. Bu oturumdaki Claude, Spiderman Unlimited analizinden çıkan her özellik için
   `updates/` altında ayrı bir klasör açar (örn. `updates/001-web-swing-to-at-sprint/`).
2. Her klasörün içinde:
   - Yazılmış/taslak kod dosyaları (hangi dil/engine ise onun uzantısıyla)
   - Bir `TALIMAT.md` — PC'deki Claude'a: bu dosyalar projede nereye gider, hangi
     ayarlar (sahne, prefab, input binding, animasyon vs.) editör içinde elle
     yapılmalı, nasıl test edilir.
3. Kadir, PC'deki Claude'a "şu klasördeki güncellemeyi uygula" der.
4. PC'deki Claude `TALIMAT.md`'yi okur, dosyaları gerçek proje klasörüne
   entegre eder, editör-içi bağlantıları kurar, derler/test eder.
5. Uygulama bittikten sonra o `updates/NNN-.../` klasörü `applied/` altına
   taşınır (arşiv, tekrar karışıklık olmasın diye).

## Durum

- [ ] Spiderman Unlimited materyalleri (4 PDF + video) analiz bekliyor
- [ ] Oğuz Kağan oyununun mevcut mekanikleri / motoru henüz tanımlanmadı
- [ ] İlk güncelleme paketleri henüz hazırlanmadı

## Klasör yapısı

```
updates/
  001-<özellik-adı>/
    TALIMAT.md
    <kod dosyaları>
  002-<özellik-adı>/
    ...
applied/
  (uygulanmış paketler buraya taşınır)
```
