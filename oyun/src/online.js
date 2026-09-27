// Çevrim içi hazırlık (sunucu henüz yok): koşu özeti ve makullük kontrolü.
// Aynı plausible() işlevi ileride sunucu tarafında (Supabase Edge Function / Firebase Cloud Function) skoru kabul etmeden önce çalışacak.
// Sohbet yok (moderasyon yükü ve çocuk güvenliği).

// Koşu özeti: sunucuya gidecek tek şey budur
export function runSummary({ mode, score, dist, kills, bosses, time, maxCombo, zone, loop, boys, leader, version = 1 }) {
  return { v: version, mode, score: Math.floor(score), dist: Math.floor(dist), kills, bosses, time: Math.round(time), maxCombo, zone, loop, boys, leader, at: Date.now() };
}

// Oyunun kurallarından çıkan üst sınırlar (hileli skoru ayıklar; gerçek oyuncuyu yanlışlıkla elemesin diye cömert)
const MAX_SPEED = 30; // m/sn (en hızlı tur + at)
const MAX_MULT = 5 * 1.15 * 9; // kombo ×5, Kayı ×1.15, ordu çarpanı en çok ~×9
export function plausible(s) {
  const why = [];
  if (!(s.time > 0) || !(s.dist >= 0) || !(s.score >= 0)) why.push('eksik alan');
  if (s.dist > s.time * MAX_SPEED) why.push('mesafe süreye göre fazla');
  if (s.kills > s.time * 3) why.push('saniyede 3ten fazla düşman');
  if (s.bosses > Math.ceil(s.dist / 1300) + 1) why.push('mesafeye göre fazla boss');
  // skor: mesafe + düşman + boss + kut + kombo puanlarının çarpanlı toplamından büyük olamaz
  const cap = (s.dist * 1 + s.kills * 200 + s.bosses * 6000 + s.dist * 12) * MAX_MULT;
  if (s.score > cap) why.push('skor üst sınırı aşıyor');
  if (s.maxCombo > s.kills * 3 + s.dist / 5 + 10) why.push('kombo olası değil');
  return { ok: !why.length, why };
}
