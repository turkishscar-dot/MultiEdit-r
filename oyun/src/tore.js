// Töre Defteri: tüm zamanların istatistikleri, günlük görevler, 3 kademeli başarımlar ve 7 günlük giriş armağanı.
// Bütün veri tek bir düz nesnede (state) durur: ileride sunucuya taşımak için snapshot()/restore() yeterli.
import { wallet } from './costumes.js';

const KEY = 'oguz-tore';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const state = load() || { stats: {}, sets: {}, ach: {}, daily: null, login: { day: 0, last: null }, claimedAch: {} };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
export const snapshot = () => JSON.parse(JSON.stringify(state));
export function restore(s) { Object.assign(state, s); persist(); }

// Saat: testlerde gün ileri alınabilsin diye tek yerden
export const clock = { offsetDays: 0, now() { return new Date(Date.now() + this.offsetDays * 864e5); } };
export const today = () => { const d = clock.now(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ---------- istatistik ----------
let notify = () => {}; // yeni başarım kademesi açılınca çağrılır (main.js alttan kayan kart gösterir)
export function onUnlock(fn) { notify = fn; }
export const stat = k => state.stats[k] || 0;
let muted = false; // "bir koşu dene" sırasında sayaçlar ve görevler işlemez
export const mute = v => { muted = v; };
export function rec(key, n = 1) { // toplam sayaç
  if (!n || muted) return;
  state.stats[key] = stat(key) + n;
  bumpDaily(key, n);
  checkAch();
  persist();
}
export function recMax(key, v) { // en yüksek değer
  if (muted) return;
  if (v <= stat(key)) { bumpDailyMax(key, v); return; }
  state.stats[key] = v;
  bumpDailyMax(key, v);
  checkAch();
  persist();
}
export function recSet(key, id) { // farklı öğeler kümesi (her boss, her boy...)
  if (muted) return;
  const s = (state.sets[key] ??= []);
  if (s.includes(id)) return;
  s.push(id);
  state.stats[key] = s.length;
  checkAch();
  persist();
}
export const setHas = (key, id) => (state.sets[key] || []).includes(id);

// ---------- başarımlar: her biri 3 kademeli ----------
// [id, ad, açıklama (n yerine eşik), istatistik, eşikler]
export const ACH = [
  ['akinci', 'Akıncı', 'Toplam {n} km koş', 'dist', [1000, 5000, 25000], 1000],
  ['uzunyol', 'Uzun Yol', 'Tek koşuda {n} m git', 'max_dist', [1000, 2500, 5000]],
  ['kilic', 'Kılıç Ustası', '{n} düşman biç', 'kill', [50, 250, 1000]],
  ['okcu', 'Okçu', 'Yayla {n} düşman vur', 'kill_arrow', [25, 150, 500]],
  ['devavcisi', 'Dev Avcısı', '{n} farklı boss yen (hepsi 15)', 'boss_kinds', [5, 10, 15]],
  ['bossyikan', 'Boss Yıkıcı', '{n} kez boss yen', 'boss', [10, 50, 150]],
  ['kilpayi', 'Kıl Payı Ustası', '{n} kıl payı', 'kilpayi', [25, 150, 500]],
  ['isabet', 'İsabetçi', '{n} tamga halkasından geç', 'isabet', [20, 100, 300]],
  ['kalkan', 'Kalkan Kırıcı', '{n} kalkan kır', 'kalkan', [10, 50, 200]],
  ['gericalan', 'Geri Çalan', '{n} mermiyi geri çal', 'parry', [5, 30, 100]],
  ['altinav', 'Altın Avcısı', '{n} altın düşman yakala', 'gold', [3, 15, 50]],
  ['kirici', 'Kırıcı', '{n} ahşap engel kır', 'broken', [10, 60, 200]],
  ['kurtarici', 'Kurtarıcı', '{n} esir kurtar', 'esir', [20, 100, 300]],
  ['ruyayay', 'Rüyanın Yayı', '{n} altın yay bul', 'yay', [1, 4, 7]],
  ['gumusok', 'Gümüş Oklar', '{n} gümüş ok bul', 'gumus', [3, 10, 21]],
  ['koleksiyon', 'Koleksiyoncu', '{n} kostüm edin', 'costumes', [5, 10, 13]],
  ['boybeyi', 'Boybeyi', '{n} farklı boy seç (hepsi 24)', 'boys', [6, 12, 24]],
  ['kombo', 'Kombo Ustası', 'Tek koşuda {n} kombo', 'max_combo', [10, 25, 40]],
  ['atli', 'Atlı', '{n} kez ata bin', 'mount', [5, 25, 100]],
  ['kurtdostu', 'Kurt Dostu', 'Gök Yeleli Kurdu {n} kez çağır', 'wolf', [3, 15, 50]],
  ['isliklik', 'Islıklı Ok', '{n} ok yağmuru çağır', 'volley', [1, 5, 20]],
  ['sifaci', 'Şifacı', '{n} şifalı kımız iç', 'kimiz', [5, 25, 100]],
  ['akgeyik', 'Ak Geyik', 'Ak Geyiği {n} kez yakala', 'deer', [1, 5, 15]],
  ['tanrikilici', 'Tanrı Kılıcı', 'Tanrı Kılıcını {n} kez bul', 'godsword', [1, 3, 10]],
  ['halkaci', 'Göğün Eri', 'Uçuşta {n} halkadan geç', 'hoop', [30, 150, 500]],
  ['altinmadalya', 'Altın Madalya', '{n} görevi altın madalyayla bitir', 'medal_gold', [3, 10, 25]],
  ['madalyali', 'Madalyalı', 'Toplam {n} madalya', 'medals', [10, 30, 60]],
  ['sonsuz', 'Sonsuz Akıncı', 'Sonsuz Akın\'da {n} m git', 'endless_dist', [3000, 8000, 15000]],
  ['bolgeasan', 'Bölge Aşan', 'Sonsuz Akın\'da toplam {n} boss yen', 'endless_boss', [3, 10, 30]],
  ['sebat', 'Sebatkâr', '{n} koşu yap', 'runs', [10, 50, 200]],
  ['hayatsuyu', 'Hayat Suyu', '{n} kez Hayat Suyu iç', 'revive', [1, 5, 15]],
  ['dokunulmaz', 'Dokunulmaz', 'Hiç darbe almadan {n} görev bitir', 'flawless', [1, 5, 15]],
  ['gorevli', 'Görevli', '{n} günlük görev tamamla', 'daily_done', [3, 15, 50]],
  ['sadik', 'Sadık', '{n} gün giriş armağanı al', 'login', [3, 7, 30]],
  ['seviye', 'Kademe Kademe', 'Akıncı Seviyesi {n}', 'level', [5, 10, 20]],
  ['zengin', 'Zengin', 'Toplam {n} kut kazan', 'kut', [1000, 10000, 50000]],
  ['gokdemirci', 'Gök Demirci', 'Toplam {n} Gök Demir kazan', 'gd', [5, 25, 100]],
  ['carsi', 'Çarşı Müdavimi', '{n} takviye kullan', 'boost', [3, 15, 50]],
  ['ustaisi', 'Usta İşi', '{n} yükseltme al', 'upgrade', [3, 12, 30]],
  ['bitirici', 'Bitirici', '{n} bitiriş vuruşu', 'finisher', [10, 50, 200]],
  ['tulpar', 'Tulpar Binicisi', 'Uçarak {n} m git', 'fly_dist', [1000, 5000, 15000]],
].map(([id, name, desc, key, tiers, div = 1]) => ({ id, name, desc, key, tiers, div }));
export const ACH_REWARD = [{ kut: 100, xp: 50 }, { kut: 300, xp: 100 }, { gd: 3, xp: 200 }];
export const achTier = id => state.ach[id] || 0; // açılmış kademe (0-3)
export const achClaimed = id => state.claimedAch[id] || 0; // ödülü alınmış kademe
function checkAch() {
  for (const a of ACH) {
    let t = achTier(a.id);
    while (t < 3 && stat(a.key) >= a.tiers[t]) {
      t++;
      state.ach[a.id] = t;
      notify(a, t);
    }
  }
}
export const achClaimable = () => ACH.filter(a => achTier(a.id) > achClaimed(a.id));
export function claimAch(id) { // açılmış ama alınmamış kademelerin ödülü
  const a = ACH.find(x => x.id === id), from = achClaimed(id), to = achTier(id), out = { kut: 0, gd: 0, xp: 0 };
  for (let t = from; t < to; t++) { const r = ACH_REWARD[t]; out.kut += r.kut || 0; out.gd += r.gd || 0; out.xp += r.xp || 0; }
  state.claimedAch[id] = to;
  persist();
  wallet.deposit(out.kut); wallet.addGD(out.gd);
  void a;
  return out;
}

// ---------- günlük görevler: her gün 3 (kolay/orta/zor), gece yarısı yenilenir ----------
// [id, metin, istatistik, hedef, 'max' = tek koşudaki en yüksek değer]
const POOL = {
  kolay: [['k20', '20 düşman biç', 'kill', 20], ['kp5', '5 kıl payı', 'kilpayi', 5], ['is5', '5 tamga halkasından geç', 'isabet', 5], ['kut300', '300 kut topla', 'kut', 300], ['d1500', 'Toplam 1500 m koş', 'dist', 1500], ['br5', '5 ahşap engel kır', 'broken', 5]],
  orta: [['k40', '40 düşman biç', 'kill', 40], ['kp12', '12 kıl payı', 'kilpayi', 12], ['ok20', 'Yayla 20 düşman vur', 'kill_arrow', 20], ['relic', 'Bir destan eşyası bul', 'relic', 1], ['gold1', 'Bir altın düşman yakala', 'gold', 1], ['kal8', '8 kalkan kır', 'kalkan', 8]],
  zor: [['tepegoz', "Tepegöz'ü yen", 'boss:tepegoz', 1], ['b3', '3 boss yen', 'boss', 3], ['c25', 'Tek koşuda 25 kombo', 'max_combo', 25, 'max'], ['r3000', 'Tek koşuda 3000 m git', 'max_dist', 3000, 'max'], ['par5', '5 mermiyi geri çal', 'parry', 5], ['albasti', "Albastı'yı yen", 'boss:albasti', 1], ['erlik', "Erlik Han'ı yen", 'boss:erlik', 1]],
};
export const DAILY_REWARD = { kolay: { kut: 200, xp: 40, medal: 'bronz' }, orta: { kut: 500, xp: 80, medal: 'gümüş' }, zor: { gd: 3, xp: 150, medal: 'altın' } };
function seeded(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1e6) / 1e6; }
let relicAvail = () => true;
export function setRelicCheck(fn) { relicAvail = fn; }
function freshDaily() {
  const r = seeded(today());
  const quests = Object.entries(POOL).map(([tier, list]) => {
    const ok = list.filter(q => q[2] !== 'relic' || relicAvail());
    const [id, text, key, n, kind] = ok[Math.floor(r() * ok.length)];
    return { tier, id, text, key, n, kind, prog: 0, claimed: false };
  });
  return { date: today(), quests };
}
export function daily() {
  if (state.daily?.date !== today()) { state.daily = freshDaily(); persist(); }
  return state.daily;
}
function bumpDaily(key, n) {
  const d = daily();
  for (const q of d.quests) if (q.key === key && !q.kind) q.prog = Math.min(q.n, q.prog + n);
}
function bumpDailyMax(key, v) {
  const d = daily();
  for (const q of d.quests) if (q.key === key && q.kind === 'max') q.prog = Math.min(q.n, Math.max(q.prog, v));
  persist();
}
export const dailyClaimable = () => daily().quests.filter(q => q.prog >= q.n && !q.claimed);
export function claimDaily(id) {
  const q = daily().quests.find(x => x.id === id);
  if (!q || q.claimed || q.prog < q.n) return null;
  q.claimed = true;
  const r = DAILY_REWARD[q.tier];
  wallet.deposit(r.kut || 0); wallet.addGD(r.gd || 0);
  rec('daily_done');
  persist();
  return r;
}

// ---------- 7 günlük giriş armağanı: gün kaçırılırsa sıfırlanmaz, kaldığı yerden sürer ----------
export const LOGIN = [
  { kut: 200 }, { gd: 1 }, { kut: 400 }, { gd: 2 }, { kut: 600 }, { gd: 3 }, { davul: 1, text: 'TUNÇ DAVUL' },
];
export const loginState = () => state.login;
export const loginReady = () => state.login.last !== today();
export function claimLogin() {
  if (!loginReady()) return null;
  const i = state.login.day % 7, r = LOGIN[i];
  state.login.day++;
  state.login.last = today();
  wallet.deposit(r.kut || 0); wallet.addGD(r.gd || 0); wallet.addDavul(r.davul || 0);
  rec('login');
  persist();
  return { ...r, day: i + 1 };
}

// Menüdeki kupa düğmesinde kırmızı nokta: alınacak bir şey var mı
export const toreBadge = () => loginReady() || dailyClaimable().length > 0 || achClaimable().length > 0;
