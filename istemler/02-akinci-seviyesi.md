# 02 — Akıncı Seviyesi

**Aşama:** Temel  
**Önce yapılmış olmalı:** 01

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

"Akıncı Seviyesi" sistemi ekle.

XP kaynakları: mesafe, düşman, boss, görev madalyası, günlük görev.

Seviye unvanları (Göktürk unvanları): 1-4 Er, 5-9 Alp, 10-14 Tarkan, 15-19 Tudun, 20-29 Şad, 30-39 Yabgu, 40+ Kağan.

Açılımlar: 3'te Boy seçimi, 5'te Çarşı, 8'de Akın Seferleri, 10'da Sonsuz Akın, 12'de Yiğit Ordusu (varsa), 15'te etkinlikler. Açılmamış menü düğmeleri kilit simgeli olsun, dokununca kaçıncı seviyede açılacağını söylesin.

Menüde seviye çubuğu ve unvan. Seviye atlayınca çizgi roman stilinde bir ekran ("ALP OLDUN!") ve ödül. Başarım ve seviye bildirimleri ekranın altından kayan kart olarak çıksın (SMU'daki gibi).

Test: hızlıca XP vererek her unvanı ve açılımı dene.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Görev madalyası ve günlük görev XP'si, Akın Haritası (11) ve Töre Defteri (10) eklenince bağlanacak. Bu adımda XP ekleme fonksiyonunu dışarıdan çağrılabilir yaz.
- Alttan kayan bildirim kartını genel bir bileşen olarak yaz. Başarımlar, seferler ve kademe de bunu kullanacak.
- Kilitler bot testlerini bozmasın: `window.__game` üzerinden tüm açılımları açan bir test anahtarı ekle ve `tools/bot.js` bunu kullansın.
- Çarşı, Seferler, Yiğit Ordusu ve etkinlikler henüz yok. Onların düğmeleri, özellik eklenene kadar gizli kalsın ya da "YAKINDA" göstersin.
