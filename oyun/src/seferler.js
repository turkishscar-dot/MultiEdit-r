// Akın Seferleri: koşuda kullanılmayan yiğitler gerçek saatle süren seferlere gönderilir (oyun kapalıyken de).
// Aynı anda en çok 3 sefer. Dönüşte kut, XP, bazen Tunç Davul ya da eksik bir gümüş ok.
import { clock } from './tore.js';
import { wallet } from './costumes.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Oğuz Kağan Destanı'ndaki seferler; x/y: otağ önündeki küçük haritada yer (yüzde)
export const SEFERLER = [
  { id: 'curcet', name: "Çürçet'e ganimet akını", hours: 1, x: 82, y: 30, kut: 150, xp: 40, text: 'Destanda Oğuz, Çürçet kağanını yenip büyük ganimet alır.' },
  { id: 'idil', name: 'İdil kıyısında gözcülük', hours: 3, x: 22, y: 38, kut: 400, xp: 90, text: 'Uygurca destanda Oğuz İtil (İdil) ırmağına varır; Uluğ Ordu Bey ağaçları kesip orduyu sallarla karşıya geçirir.' },
  { id: 'kipcak', name: 'Kıpçak ile ittifak', hours: 6, x: 38, y: 62, kut: 800, xp: 180, text: 'Reşidüddin\'e göre bir savaş sırasında ağaç kovuğunda doğan çocuğa Oğuz "Kıpçak" adını verir; Kıpçaklar ondan gelir.' },
  { id: 'barkan', name: "Barkan'a uzun sefer", hours: 12, x: 60, y: 76, kut: 1500, xp: 320, relic: 0.25, text: 'Oğuz güneyde Barkan, Sind ve Tangut illerine sefer eder.' },
  { id: 'karanlik', name: "Karanlık Ülke'yi keşif", hours: 18, x: 50, y: 14, kut: 2200, xp: 450, relic: 0.35, davul: 0.5, text: 'Kuzeyde güneş doğmayan Karanlık Ülke. Anlatıya göre akıncılar dönüş yolunu bulmak için taylarını geride bırakan kısrakları yanlarına alır.' },
];
export const MAX_ACTIVE = 3;
const st = load('oguz-sefer', { active: [] }); // { id, cards: [...], start, end }
const persist = () => save('oguz-sefer', st);
const nowMs = () => clock.now().getTime();

export const active = () => st.active;
export const busyCards = () => st.active.flatMap(a => a.cards);
export const remaining = a => Math.max(0, a.end - nowMs());
export const isDone = a => remaining(a) <= 0;
export function send(id, cards) {
  const S = SEFERLER.find(s => s.id === id);
  if (!S || st.active.length >= MAX_ACTIVE || st.active.some(a => a.id === id) || !cards.length) return false;
  const t = nowMs();
  st.active.push({ id, cards: [...cards], start: t, end: t + S.hours * 3600e3 });
  persist();
  return true;
}
// Gök Demir ile anında bitirme: kalan her başlamış 2 saat için 1 Gök Demir
export const rushCost = a => Math.max(1, Math.ceil(remaining(a) / 7200e3));
export function rush(a) {
  if (isDone(a) || !wallet.spendGD(rushCost(a))) return false;
  a.end = nowMs();
  persist();
  return true;
}
// Dönüş: yiğit sayısı ödülü artırır (her yiğit +%25)
export function collect(a, missingRelic) {
  if (!isDone(a)) return null;
  const S = SEFERLER.find(s => s.id === a.id), k = 1 + (a.cards.length - 1) * 0.25;
  const out = { kut: Math.round(S.kut * k), xp: Math.round(S.xp * k), davul: 0, relic: null };
  if (S.davul && Math.random() < S.davul) out.davul = 1;
  if (S.relic && Math.random() < S.relic) out.relic = missingRelic?.() || null;
  wallet.deposit(out.kut);
  wallet.addDavul(out.davul);
  st.active = st.active.filter(x => x !== a);
  persist();
  return out;
}
// Telefon sürümünde yerel bildirim ("Akıncıların döndü!") buraya bağlanacak
export function scheduleNotice() {
  const soon = st.active.filter(a => !isDone(a)).map(a => a.end);
  globalThis.OguzNative?.scheduleNotification?.('Akıncıların döndü!', soon);
}
