// Destan Koleksiyonları: Destan Kitabı'nda setler. Set tamamlanınca özel ödül (Gök Demir, unvan, altın Tanrı Kılıcı görünüşü).
import { owned } from './yigit.js';
import { setHas, stat } from './tore.js';
import { BOYLAR } from './boylar.js';
import { wallet } from './costumes.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const BOSS_NAMES = { tepegoz: 'Tepegöz', albasti: 'Albastı', yelbegen: 'Yelbegen', erlik: 'Erlik Han', karakus: 'Dev Kara Kuş', general: 'Çin Generali', kerey: 'Kerey Han', demirhane: 'Demirhane', boyali: 'İt-Barak Pehlivanı', korbasi: 'Körmös Başı', suluaga: 'Bataklık Ağası', almasbey: 'Almas Beyi', matman: 'Haydut Matman', yuzbasi: 'Tang Yüzbaşısı', itbasi: 'İt-Barak Başbuğu' };
let relics = () => ({});
export function setRelicSource(fn) { relics = fn; }

// Her set: üyeler [ad, tamam mı] döndürür
export const SETS = [
  { id: 'ogullar', name: "Oğuz'un Altı Oğlu", text: 'Altı oğlun yiğit kartı.', reward: { gd: 10, title: 'Bozok-Üçok Beyi' },
    members: () => [['Gün Han', 'gunhan'], ['Ay Han', 'ayhan'], ['Yıldız Han', 'yildizhan'], ['Gök Han', 'gokhan'], ['Dağ Han', 'daghan'], ['Deniz Han', 'denizhan']].map(([n, id]) => [n, owned(id)]) },
  { id: 'gokturk', name: 'Göktürk Kağanları', text: 'Kağanlar ve yanlarındaki komutan ile vezir.', reward: { gd: 15, title: 'Ötüken Beyi' },
    members: () => [['Bumin Kağan', 'bumin'], ['Tonyukuk', 'tonyukuk']].map(([n, id]) => [n, owned(id)]) },
  { id: 'saman', name: 'Şamanlar', text: 'Geyik, Ayı ve Kartal şamanları.', reward: { gd: 8, title: 'Kam' },
    members: () => [['Geyik Şaman', 'geyiksaman'], ['Ayı Şaman', 'ayisaman'], ['Kartal Şaman', 'kartalsaman']].map(([n, id]) => [n, owned(id)]) },
  { id: 'ruya', name: 'Rüyanın Yayı', text: 'Her bölümün altın yayı ve üç gümüş oku.', reward: { gd: 20, title: 'Uluğ Türük\'ün Yorumcusu' },
    members: () => [1, 2, 3, 4, 5, 6, 7].map(l => { const r = relics()[l]; return [`${l}. bölüm yay ve oklar`, !!(r?.yay && r.ok.every(Boolean))]; }) },
  { id: 'canavar', name: 'Canavarlar', text: 'Her boss\'u en az bir kez yen.', reward: { gd: 20, title: 'Dev Avcısı', sword: true },
    members: () => Object.entries(BOSS_NAMES).map(([k, n]) => [n, setHas('boss_kinds', k)]) },
  { id: 'ongun', name: 'Ongunlar', text: '24 boyun hepsini bir kez seç.', reward: { gd: 15, title: 'Boybeyi' },
    members: () => BOYLAR.map(b => [b.name, setHas('boys', b.id)]) },
];
const st = load('oguz-koleksiyon', { done: [], title: null });
export const setDone = id => st.done.includes(id);
export const titleOf = () => st.title;
export const goldSword = () => st.done.includes('canavar'); // altın çerçeveli Tanrı Kılıcı görünüşü
// Yeni tamamlanan setlerin ödülünü verir
export function checkSets() {
  const got = [];
  for (const S of SETS) {
    if (setDone(S.id) || !S.members().every(m => m[1])) continue;
    st.done.push(S.id);
    st.title = S.reward.title;
    wallet.addGD(S.reward.gd);
    got.push(S);
  }
  if (got.length) save('oguz-koleksiyon', st);
  return got;
}
void stat;
