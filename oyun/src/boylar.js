// 24 Oğuz boyu ve ongun kuşları (Ögel, Türk Mitolojisi I, s.218–219, 355–370). Bölüm öncesi seçilen boyun
// küçük bir gücü olur. Seçim yuvası sayısı: 1 + geçilen ana bölüm sayısı (en çok 5).
export const BOYLAR = [
  // Bozok: Gün, Ay, Yıldız Han'ın oğulları (sağ kol)
  { id: 'kayi', name: 'Kayı', son: 'Gün Han', bird: 'Şunkar', perk: 'Rüzgâr: +%15 skor, daha hızlı başlarsın' },
  { id: 'bayat', name: 'Bayat', son: 'Gün Han', bird: 'Puhu (ügi)', perk: 'Gece gözü: karanlık haritalar aydınlanır' },
  { id: 'alkaevli', name: 'Alka-evli', son: 'Gün Han', bird: 'Köykenek', perk: 'Bereket: kasaya giren kut +%25' },
  { id: 'karaevli', name: 'Kara-evli', son: 'Gün Han', bird: 'Göbek-sarı', perk: 'Kalkan: bölümdeki ilk darbe işlemez' },
  { id: 'yazir', name: 'Yazır', son: 'Ay Han', bird: 'Turumtay', perk: 'Keskin ok: daha hızlı nişan ve atış' },
  { id: 'yaparli', name: 'Yaparlı', son: 'Ay Han', bird: 'Karğu', perk: 'Karga gözü: pusular daha erken belli olur' },
  { id: 'dodurga', name: 'Dodurğa', son: 'Ay Han', bird: 'Kızıl karçığay', perk: 'Sebat: darbe alınca kombo sıfırlanmaz, yarıya iner' },
  { id: 'doger', name: 'Döğer', son: 'Ay Han', bird: 'Koçken', perk: 'Atçı: at 6 sn daha uzun koşar, nal daha sık çıkar' },
  { id: 'avsar', name: 'Avşar', son: 'Yıldız Han', bird: 'Çure laçin', perk: 'Bitirici: bitiriş vuruşu daha sık gelir' },
  { id: 'kizik', name: 'Kızık', son: 'Yıldız Han', bird: 'Sarıca', perk: 'Mıknatıs: yan şeritteki kutlar sana gelir' },
  { id: 'begdili', name: 'Begdili', son: 'Yıldız Han', bird: 'Bahri', perk: 'Göğün eri: uçuşta halka puanı iki kat' },
  { id: 'karkin', name: 'Karkın', son: 'Yıldız Han', bird: 'Laçin', perk: 'Sıçrayış: daha yükseğe zıplarsın' },
  // Üçok: Gök, Dağ, Deniz Han'ın oğulları (sol kol)
  { id: 'bayindir', name: 'Bayındır', son: 'Gök Han', bird: '—', perk: 'Şölen: şifalı kımız iki kat sık çıkar' },
  { id: 'becene', name: 'Beçene', son: 'Gök Han', bird: 'Ala-toğan', perk: 'Dev avcısı: boss\'a vuruşların bazen çift işler' },
  { id: 'cavuldur', name: 'Çavuldur', son: 'Gök Han', bird: 'Buğdayık', perk: 'Güçlü omuz: bir engeli yıkıp geçersin' },
  { id: 'cepni', name: 'Çepni', son: 'Gök Han', bird: 'Hüma', perk: 'Hüma kuşu: bir kez ölümden dönersin' },
  { id: 'salur', name: 'Salur', son: 'Dağ Han', bird: 'Bürküt (kartal)', perk: 'Kartal: bütün şeritlerdeki kutlar sana gelir' },
  { id: 'eymur', name: 'Eymür', son: 'Dağ Han', bird: 'Ancan', perk: 'Dayanık: darbeden sonra daha uzun korunursun' },
  { id: 'alayuntli', name: 'Ala-yuntlı', son: 'Dağ Han', bird: 'Yağalbay', perk: 'Akıncı: bölüme at sırtında başlarsın' },
  { id: 'uregir', name: 'Üregir', son: 'Dağ Han', bird: '—', perk: 'Kurtarıcı: kurtarılan esir iki kat puan ve kut' },
  { id: 'igdir', name: 'İğdir', son: 'Deniz Han', bird: 'Karçığay', perk: 'Çift ok: her atışta iki ok' },
  { id: 'bukduz', name: 'Bükdüz', son: 'Deniz Han', bird: 'İtelgü', perk: 'Kalkan kırıcı: kalkanlı düşman tek vuruşta düşer' },
  { id: 'yiva', name: 'Yıva', son: 'Deniz Han', bird: 'Tongun', perk: 'Şifa: kımız iki can verir' },
  { id: 'kinik', name: 'Kınık', son: 'Deniz Han', bird: 'Çure-karçığay', perk: 'Kuş avcısı: okların uçanlara kendiliğinden döner' },
];

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Seçili boylar (kalıcı) ve o anki koşu için etkin güçler
export const picks = { list: load('oguz-boylar', []), save() { save('oguz-boylar', this.list); } };
export const has = id => picks.list.includes(id);
export const slots = progress => Math.min(5, 1 + Object.keys(progress).filter(k => +k > 0).length);
