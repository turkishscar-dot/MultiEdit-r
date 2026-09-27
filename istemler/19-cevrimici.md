# 19 — Çevrim içi özellikler

**Aşama:** Çevrim içi  
**Önce yapılmış olmalı:** 07 (günlük skor), 02 (etkinlikler Seviye 15), 12 (etkinlik yiğidi)

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Çevrim içi özellikler için altyapı öner ve kur.

1) Önce ücretsiz planla Firebase (Authentication + Firestore + Cloud Functions) ya da Supabase'i karşılaştır. Aylık maliyeti, sınırları ve hesap açma adımlarını bana anlat. Hesabı ben açacağım; parola ya da kart bilgisini ben gireceğim.

2) Sonra ekle:
- KURULTAY SIRALAMASI: günlük (gece yarısı sıfırlanır) ve tüm zamanlar Sonsuz Akın skorları. Günlük derece ödülleri: 1-10 etkinlik yiğidi, 11-100 Tunç Davul, 101-1000 Gök Demir, diğerleri kut.
- BOY İTTİFAKI: oyuncu 24 Oğuz boyundan birine katılır (src/boylar.js); haftalık boy puanı, boylar arası sıralama, haftalık boy ödülü.
- BAYRAM ETKİNLİKLERİ: Nevruz (21 Mart), Tepreş şöleni, Sığın Avı. Süreli görevler, etkinlik yiğidi, etkinlik sıralaması, ilk 100'e özel kostüm.
- BULUT KAYIT: Google Play Games / Game Center ile.

Hile koruması: skoru sunucuda koşu özetiyle (süre, mesafe, öldürme) makullük kontrolünden geçir.

Sohbet ekleme; moderasyon yükü ve çocuk güvenliği riski büyük.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Bu adım iki aşamalı. 1. aşamada karşılaştırmayı yap ve DUR. Kullanıcı hesabı açmadan 2. aşamaya geçme.
- Firebase Cloud Functions, Blaze (kullandıkça öde) planı ve kart bilgisi ister. Karşılaştırmada bunu açıkça belirt. Kart gerektiren her şey için kullanıcıya danış.
- API anahtarlarını ve gizli bilgileri koda gömme. Firebase web yapılandırması istemcide durabilir ama güvenlik kuralları (Firestore rules) mutlaka yazılmalı.
- Google Play Games ve Game Center yalnızca telefon paketlemesinden (Capacitor vb.) sonra çalışır. Web sürümünde bunun için sadece arayüz yeri ayır.
- Oyun çocuklara da hitap edebilir. Kullanıcı adları herkese açık sıralamada görünecekse ad filtresi ekle ve veri gizliliğini (KVKK) değerlendir.
