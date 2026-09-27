// Koşu bonusları: boy güçleri, yiğit kartları ve Çarşı yükseltmeleri buraya katkı yapar.
// Her kaynak koşu başında bonus nesnesine kendi değerlerini ekler (collect). Oyun kodu yalnız bonus.* okur.
export const bonus = {
  nearMiss: 0, // her kıl payında fazladan kombo (+2 = kıl payı 3 kombo sayılır)
  comboTime: 0, // kombo süresine eklenen saniye
  comboPts: 0, // kombo türü puanlarına yüzde ek (0.5 = %50)
  bossPts: 0, // boss puanına yüzde ek
  kutPct: 0, // toplanan kuta yüzde ek
  foeKut: 0, // öldürülen düşman başına düşen kut
  scoreMult: 0, // koşu puanı çarpanına ek (yiğit ordusu gücü)
};
const sources = [];
export function addSource(fn) { sources.push(fn); }
export function collect() {
  for (const k in bonus) bonus[k] = 0;
  for (const fn of sources) fn(bonus);
  return bonus;
}
