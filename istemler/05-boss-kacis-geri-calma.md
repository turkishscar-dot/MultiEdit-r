# 05 — Boss: Kaçış çubuğu ve Geri Çalma

**Aşama:** Oynanış  
**Önce yapılmış olmalı:** 03

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Boss savaşlarına Spider-Man Unlimited'daki iki şeyi uyarla.

1) KAÇIŞ ÇUBUĞU: Boss can çubuğunun üstüne mavi ince bir "KAÇIŞ" çubuğu ekle. Süre boss'a göre 60-90 saniye olsun (bosses.js'te her boss için ayarlanabilir). Süre biterse boss kaçar: "TEPEGÖZ KAÇTI!", bölüm kaybedilir (Sonsuz Akın'da sadece boss ödülü alınmaz, koşu sürer). Duel sırasında (Oğuz durduğunda) süre yavaş aksın.

2) GERİ ÇALMA: Boss'un fırlattığı bazı mermiler (Tepegöz'ün kayası, Kerey Han'ın bakır güllesi, Yelbegen'in buz kayası, Kara Kuş'un tüyü, generalin okçularının okları) Oğuz'a 3 m'den yakınken kılıç modunda doğru anda (0.3 sn pencere) dokunulursa geri seker ve boss'a çarpıp 1 hasar verir. "GERİ ÇALDI!" yazısı, kısa ağır çekim, kıvılcım olsun. Erken ya da geç dokunuş normal kılıç savurmasıdır. Hangi mermilerin geri çalınabileceğini bosses.js'te işaretle; geri çalınabilenler hafif altın parıltıyla belli olsun.

İlk kez olduğunda eğitim ipucu göster: "Kılıçla doğru anda vur, geri çal!"

bot.js'e geri çalmayı öğret. Her boss'u bot ile baştan sona test et, kaçış süresinin adil olduğunu raporla.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Duel sırasında akış `flow`/`holdTarget` ile yavaşlıyor. Kaçış süresini `flow` ile ölçekleyebilirsin.
- Boss mermileri `B.add(...)` ile `objs` içine giriyor (`boulder`, `ice`, `feather`, `bolt` vb.). "Geri çalınabilir" bilgisi nesneye eklenebilir.
- Eğitim ipucu sistemi 17. adımda genel olarak kurulacak. Burada ipucunu basitçe göster, 17. adımda o sisteme taşınacak.
- Sonsuz Akın davranışı (koşu sürer, ödül yok) 07. adımdan sonra da doğru çalışmalı. 07'de yeniden kontrol edilecek.
