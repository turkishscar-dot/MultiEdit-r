// Ses yöneticisi (Web Audio). Müzik, efekt ve seslendirme düzeyleri ayrı tutulur ve saklanır.
// Sesler kod içinde üretilir (kopuz teli, davul, zurna, boğaz sesi, rüzgâr...): dosya boyutu 0, lisans derdi yok.
// Gerçek ses dosyası koymak istersen: ses/manifest.json = { "kut": "kut.ogg", "otuken": "otuken.ogg", ... }
// Manifestteki ad varsa o dosya çalar, yoksa üretilen ses kullanılır.
const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k)) }; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const vol = load('oguz-ses', { music: 0.6, sfx: 0.8, voice: 1 });

let ctx = null, master, musicBus, sfxBus, verb, duckGain;
const files = {}; // ad -> AudioBuffer (manifestten)

function init() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor(); // üst üste binen seslerde patlamasın
  comp.threshold.value = -10; comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  duckGain = ctx.createGain();
  musicBus = ctx.createGain();
  musicBus.connect(duckGain).connect(master);
  sfxBus = ctx.createGain();
  sfxBus.connect(master);
  verb = ctx.createConvolver(); // yankı: üretilen kısa oda tepkisi
  verb.buffer = impulse(2.2, 2.5);
  const wet = ctx.createGain(); wet.gain.value = 0.35;
  verb.connect(wet).connect(musicBus);
  applyVol();
  loadManifest();
  return ctx;
}

function applyVol() {
  if (!ctx) return;
  musicBus.gain.value = vol.music * 0.55;
  sfxBus.gain.value = vol.sfx;
}
export function setVol(k, v) { vol[k] = v; save('oguz-ses', vol); applyVol(); }

async function loadManifest() {
  try {
    const r = await fetch('ses/manifest.json');
    if (!r.ok) return;
    const m = await r.json();
    for (const [name, file] of Object.entries(m)) {
      fetch('ses/' + file).then(x => x.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(buf => { files[name] = buf; }).catch(() => {});
    }
  } catch {}
}

// Mobilde ses ilk dokunuşta açılır; sekme gizlenince susar
const unlock = () => { init(); if (ctx?.state === 'suspended' && !document.hidden) ctx.resume(); };
addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend(); else ctx.resume();
});

// ---------- yardımcılar ----------
const now = () => ctx.currentTime;
const mtof = m => 440 * 2 ** ((m - 69) / 12);
function impulse(sec, decay) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** decay; }
  return b;
}
let noiseBuf = null;
function noise() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  return s;
}
function env(g, t, a, peak, d, end = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(end, t + a + d);
}
function osc(type, f, t, dur, out, peak = 0.3, a = 0.005) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  env(g, t, a, peak, dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + a + dur + 0.05);
  return o;
}
function burst(t, dur, out, { peak = 0.4, type = 'bandpass', f = 1000, f2 = f, q = 1, a = 0.003 } = {}) {
  const n = noise(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
  flt.type = type; flt.Q.value = q;
  flt.frequency.setValueAtTime(f, t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  env(g, t, a, peak, dur);
  n.connect(flt).connect(g).connect(out);
  n.start(t, Math.random()); n.stop(t + dur + a + 0.05);
}
// Karplus-Strong tel sesi (kopuz, dombra, topşur, guzheng): arabellekler frekansa göre saklanır
const ks = {};
function pluckBuf(freq, bright = 0.5, dur = 1.6) {
  const key = Math.round(freq) + ':' + bright;
  if (ks[key]) return ks[key];
  const sr = ctx.sampleRate, n = Math.floor(sr * dur), N = Math.max(2, Math.round(sr / freq));
  const b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  let p = 0;
  const damp = 0.994 + bright * 0.005;
  for (let i = 0; i < n; i++) {
    const a = ring[p], c = ring[(p + 1) % N];
    ring[p] = damp * (bright * a + (1 - bright) * 0.5 * (a + c));
    d[i] = a;
    p = (p + 1) % N;
  }
  return (ks[key] = b);
}
function pluck(freq, t, out, peak = 0.35, bright = 0.5) {
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = pluckBuf(freq, bright);
  g.gain.value = peak;
  s.connect(g).connect(out);
  s.start(t);
}
function drum(t, out, { f = 110, f2 = 45, dur = 0.35, peak = 0.9, click = 0.25 } = {}) { // davul: iniş yapan sinüs + tokmak vuruşu
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  env(g, t, 0.003, peak, dur);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + dur + 0.05);
  if (click) burst(t, 0.03, out, { peak: click, f: 2500, q: 0.7 });
}
function reed(freq, t, dur, out, peak = 0.12, vib = 6) { // zurna: kamışlı, titreşimli ses
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  const f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'square';
  o.frequency.value = freq; o2.frequency.value = freq * 1.003;
  lfo.frequency.value = vib; lg.gain.value = freq * 0.012;
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  f.type = 'bandpass'; f.frequency.value = freq * 3; f.Q.value = 0.9;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
  g.gain.setValueAtTime(peak, t + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); o2.connect(f); f.connect(g).connect(out);
  for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + dur + 0.05); }
}
function pad(freqs, t, dur, out, peak = 0.05, type = 'sawtooth', cut = 900) {
  const f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.value = cut;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  f.connect(g).connect(out);
  for (const fr of freqs) for (const det of [-6, 6]) {
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = fr; o.detune.value = det;
    o.connect(f); o.start(t); o.stop(t + dur + 0.05);
  }
}
function throat(base, overtones, t, dur, out, peak = 0.14) { // boğazdan söyleme: alçak drone + dar süzgeçle seçilen üst sesler
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = base;
  const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 500;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 28;
  const step = dur / overtones.length;
  overtones.forEach((h, i) => bp.frequency.setTargetAtTime(base * h, t + i * step, 0.04));
  const bg = ctx.createGain(); bg.gain.value = 3.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.15);
  g.gain.setValueAtTime(peak, t + dur - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lo).connect(g); o.connect(bp).connect(bg).connect(g); g.connect(out);
  o.start(t); o.stop(t + dur + 0.05);
}
function howl(t, out, peak = 0.18, pitch = 1) { // kurt uluması: yükselip süzülen, titreyen ses
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'triangle';
  const b = 330 * pitch;
  o.frequency.setValueAtTime(b * 0.7, t);
  o.frequency.exponentialRampToValueAtTime(b * 1.5, t + 0.5);
  o.frequency.setValueAtTime(b * 1.5, t + 1.3);
  o.frequency.exponentialRampToValueAtTime(b * 0.9, t + 2.2);
  lfo.frequency.value = 5; lg.gain.value = 8; lfo.connect(lg).connect(o.frequency);
  f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.35);
  g.gain.setValueAtTime(peak, t + 1.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
  o.connect(f).connect(g).connect(out);
  o.start(t); lfo.start(t); o.stop(t + 2.4); lfo.stop(t + 2.4);
}

// ---------- efektler ----------
let kutRun = 0, kutT = -9;
const SFX = {
  swing(t, o) { burst(t, 0.16, o, { peak: 0.7, f: 600, f2: 3500, q: 1.2 }); },
  hit(t, o) { drum(t, o, { f: 160, f2: 60, dur: 0.12, peak: 0.6, click: 0.3 }); burst(t, 0.09, o, { peak: 0.35, type: 'highpass', f: 3000, q: 0.5 }); osc('square', 1800, t, 0.06, o, 0.05); },
  bowdraw(t, o) { burst(t, 0.28, o, { peak: 0.25, f: 400, f2: 1400, q: 6, a: 0.08 }); },
  bowrelease(t, o) { pluck(98, t, o, 0.5, 0.2); burst(t, 0.12, o, { peak: 0.2, f: 2000, f2: 5000, q: 1 }); },
  arrowhit(t, o) { drum(t, o, { f: 260, f2: 120, dur: 0.07, peak: 0.5, click: 0.2 }); },
  jump(t, o) { burst(t, 0.2, o, { peak: 0.2, f: 300, f2: 1200, q: 1 }); },
  flip(t, o) { burst(t, 0.15, o, { peak: 0.18, f: 400, f2: 1800, q: 1.2 }); burst(t + 0.2, 0.15, o, { peak: 0.18, f: 500, f2: 2000, q: 1.2 }); },
  slide(t, o) { burst(t, 0.45, o, { peak: 0.2, type: 'lowpass', f: 1400, f2: 300, q: 0.5 }); },
  land(t, o) { drum(t, o, { f: 90, f2: 50, dur: 0.1, peak: 0.35, click: 0.1 }); },
  kut(t, o) { // 6'lı dizide her kut bir perde yükselir
    kutRun = t - kutT < 0.45 ? (kutRun + 1) % 6 : 0;
    kutT = t;
    const m = [76, 79, 81, 83, 86, 88][kutRun];
    osc('sine', mtof(m), t, 0.18, o, 0.14); osc('sine', mtof(m + 12), t, 0.1, o, 0.05);
  },
  gallop(t, o) { for (const [dt, p] of [[0, 0.5], [0.09, 0.35], [0.2, 0.45], [0.28, 0.3]]) drum(t + dt, o, { f: 140, f2: 70, dur: 0.06, peak: p, click: 0.15 }); },
  neigh(t, o) {
    const x = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(), l = ctx.createOscillator(), lg = ctx.createGain();
    x.type = 'sawtooth';
    x.frequency.setValueAtTime(700, t); x.frequency.exponentialRampToValueAtTime(1100, t + 0.25); x.frequency.exponentialRampToValueAtTime(400, t + 0.9);
    l.frequency.value = 22; lg.gain.value = 60; l.connect(lg).connect(x.frequency);
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 2;
    env(g, t, 0.05, 0.12, 0.85);
    x.connect(f).connect(g).connect(o); x.start(t); l.start(t); x.stop(t + 1); l.stop(t + 1);
  },
  howl(t, o) { howl(t, o, 0.4); },
  whistle(t, o) { // ıslıklı ok: tiz, inen, vızıldayan ıslık
    const x = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    x.type = 'sine';
    x.frequency.setValueAtTime(2600, t); x.frequency.exponentialRampToValueAtTime(1300, t + 1.1);
    l.frequency.value = 30; lg.gain.value = 90; l.connect(lg).connect(x.frequency);
    env(g, t, 0.05, 0.12, 1.1);
    x.connect(g).connect(o); x.start(t); l.start(t); x.stop(t + 1.2); l.stop(t + 1.2);
  },
  heal(t, o) { [72, 76, 79, 84].forEach((m, i) => osc('sine', mtof(m), t + i * 0.08, 0.35, o, 0.12)); },
  hurt(t, o) { drum(t, o, { f: 120, f2: 40, dur: 0.25, peak: 0.8, click: 0.4 }); burst(t, 0.2, o, { peak: 0.3, type: 'lowpass', f: 900, f2: 200 }); },
  death(t, o) { burst(t, 0.35, o, { peak: 0.25, f: 700, f2: 200, q: 3 }); drum(t + 0.05, o, { f: 90, f2: 40, dur: 0.2, peak: 0.4, click: 0.05 }); },
  roar(t, o) {
    const x = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    x.type = 'sawtooth';
    x.frequency.setValueAtTime(70, t); x.frequency.linearRampToValueAtTime(95, t + 0.4); x.frequency.exponentialRampToValueAtTime(50, t + 1.6);
    f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1200, t + 0.4); f.frequency.exponentialRampToValueAtTime(300, t + 1.6);
    env(g, t, 0.1, 0.5, 1.5);
    x.connect(f).connect(g).connect(o); x.start(t); x.stop(t + 1.8);
    burst(t, 1.5, o, { peak: 0.25, type: 'lowpass', f: 1200, f2: 250, a: 0.1 });
  },
  shieldbreak(t, o) { burst(t, 0.5, o, { peak: 0.45, f: 3200, f2: 1500, q: 2 }); [1320, 1780, 2530].forEach(f => osc('triangle', f, t, 0.5, o, 0.06)); drum(t, o, { f: 200, f2: 80, dur: 0.12, peak: 0.5 }); },
  click(t, o) { osc('square', 1500, t, 0.03, o, 0.06); },
  page(t, o) { burst(t, 0.35, o, { peak: 0.25, f: 2500, f2: 900, q: 0.8, a: 0.04 }); },
  parry(t, o) { SFX.shieldbreak(t, o); osc('sine', 2093, t + 0.05, 0.6, o, 0.1); },
  gold(t, o) { [84, 88, 91, 96].forEach((m, i) => osc('triangle', mtof(m), t + i * 0.06, 0.3, o, 0.1)); },
  crack(t, o) { burst(t, 0.2, o, { peak: 0.45, f: 900, f2: 300, q: 1.5 }); drum(t, o, { f: 180, f2: 90, dur: 0.08, peak: 0.4, click: 0.3 }); },
  revive(t, o) { [60, 64, 67, 72, 76].forEach((m, i) => osc('sine', mtof(m), t + i * 0.1, 0.6, o, 0.1)); burst(t, 1, o, { peak: 0.08, f: 3000, f2: 6000, a: 0.3 }); },
  levelup(t, o) { [67, 72, 76, 79, 84].forEach((m, i) => { reed(mtof(m), t + i * 0.1, 0.3, o, 0.07); }); drum(t, o, { f: 100, f2: 50 }); drum(t + 0.5, o, { f: 100, f2: 50 }); },
  combo(t, o) { osc('triangle', mtof(79), t, 0.12, o, 0.08); osc('triangle', mtof(86), t + 0.06, 0.12, o, 0.08); },
  near(t, o) { burst(t, 0.25, o, { peak: 0.25, f: 800, f2: 4000, q: 2 }); },
  coin2(t, o) { osc('sine', mtof(91), t, 0.2, o, 0.1); },
};

const lastPlay = {};
export const played = {}; // test: hangi efekt kaç kez istendi
export function sfx(name, { gain = 1, gap = 0.03 } = {}) {
  played[name] = (played[name] || 0) + 1;
  if (!init() || ctx.state !== 'running') return;
  const t = now();
  if (t - (lastPlay[name] ?? -9) < gap) return; // aynı ses aynı karede üst üste binmesin
  lastPlay[name] = t;
  const out = ctx.createGain();
  out.gain.value = gain;
  out.connect(sfxBus);
  if (files[name]) { const s = ctx.createBufferSource(); s.buffer = files[name]; s.connect(out); s.start(t); return; }
  SFX[name]?.(t, out);
}

// Atlı koşuda nal sesi döngüsü
let gallopT = null;
export function gallop(on) {
  clearInterval(gallopT);
  gallopT = null;
  if (on) { sfx('gallop'); gallopT = setInterval(() => sfx('gallop'), 380); }
}

// ---------- müzik ----------
// Her parça 16'lık vuruş adımlarıyla çalar; step(i, t, out) o adımda çalacak notaları kurar.
const S = 16; // bir ölçüdeki adım
const scale = (root, steps) => i => root + steps[((i % steps.length) + steps.length) % steps.length] + 12 * Math.floor(i / steps.length);
const USSAK = scale(62, [0, 1.5, 3, 5, 7, 8, 10]); // re uşşak (koma perdesi yaklaşık)
const HICAZ = scale(57, [0, 1, 4, 5, 7, 8, 10]); // la hicaz
const MINOR = scale(50, [0, 2, 3, 5, 7, 8, 10]);
const PENTA = scale(60, [0, 2, 4, 7, 9]); // Çin pentatonik
const MINPENTA = scale(52, [0, 3, 5, 7, 10]);
const note = (fn, i) => mtof(fn(i));

const TRACKS = {
  menu: { bpm: 76, step(i, t, o, v) { // kopuz/dombra, sakin
    const mel = [0, 2, 3, 2, 4, 3, 2, 1, 0, -1, 0, 2, 1, 0, -2, 0];
    if (i % 2 === 0) pluck(note(USSAK, mel[(i / 2) % 16] + 7), t, o, 0.28, 0.45);
    if (i % S === 0) pluck(note(USSAK, 0), t, o, 0.35, 0.3);
    if (i % S === 8) pluck(note(USSAK, 4), t, o, 0.25, 0.3);
    if (i % S === 0 || i % S === 10) drum(t, o, { f: 90, f2: 55, dur: 0.3, peak: 0.25, click: 0.05 });
  } },
  otuken: { bpm: 126, step(i, t, o) { // davul-zurna, tempolu
    const k = i % S;
    if ([0, 6, 8].includes(k)) drum(t, o, { f: 100, f2: 45, dur: 0.3, peak: 0.8 });
    if ([3, 11, 14].includes(k)) drum(t, o, { f: 260, f2: 180, dur: 0.06, peak: 0.25, click: 0.3 }); // tokmak kenarı
    const mel = [7, 8, 7, 5, 4, 5, 4, 1, 0, 1, 4, 5, 7, 8, 10, 7];
    if (i % 2 === 0 && Math.floor(i / S) % 4 !== 3) reed(note(HICAZ, mel[(i / 2) % 16]), t, 60 / 126 / 2 * 0.95, o, 0.08);
  } },
  bataklik: { bpm: 66, step(i, t, o) { // karanlık, yankılı
    const k = i % (S * 2);
    if (k === 0) pad([mtof(38), mtof(45), mtof(50)], t, 60 / 66 * 8, o, 0.04, 'sawtooth', 350);
    if (i % 6 === 0) pluck(note(MINOR, [0, 3, 2, 5, 4, 1][(i / 6) % 6] + 7), t, verb, 0.3, 0.3);
    if (i % 22 === 5) osc('sine', 1200 + Math.random() * 600, t, 0.15, verb, 0.05); // su damlası
  } },
  altay: { bpm: 84, step(i, t, o) { // boğazdan söyleme havası
    const k = i % (S * 2);
    if (k === 0) throat(mtof(40), [6, 8, 9, 8, 10, 9, 8, 6], t, 60 / 84 * 8, o, 0.12);
    if (i % 4 === 0 || i % 4 === 3) pluck(note(MINPENTA, [0, 0, 2, 1][i % 4 === 0 ? (i / 4) % 4 : 0]), t, o, 0.2, 0.2); // at yürüyüşü ritmi
    if (i % 8 === 4) drum(t, o, { f: 80, f2: 50, dur: 0.25, peak: 0.3, click: 0.08 });
  } },
  gok: { bpm: 96, step(i, t, o) { // rüzgârlı, ferah
    const k = i % (S * 2);
    if (k === 0) {
      const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(), dur = 60 / 96 * 8;
      f.type = 'bandpass'; f.Q.value = 1.5;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(1600, t + dur / 2); f.frequency.exponentialRampToValueAtTime(500, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + dur / 2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f).connect(g).connect(o); n.start(t); n.stop(t + dur + 0.1);
      pad([mtof(62), mtof(66), mtof(69), mtof(74)], t, dur, o, 0.035, 'sine', 3000);
    }
    if (i % 3 === 0) pluck(note(PENTA, [4, 5, 7, 5, 8, 7, 5, 4][(i / 3) % 8] + 2), t, verb, 0.18, 0.7);
  } },
  yeralti: { bpm: 72, step(i, t, o) { // ağır davul
    const k = i % S;
    if (k === 0 || k === 10) drum(t, o, { f: 70, f2: 32, dur: 0.6, peak: 1 });
    if (k === 4 || k === 12) drum(t, o, { f: 55, f2: 30, dur: 0.4, peak: 0.6 });
    if (i % (S * 2) === 0) pad([mtof(33), mtof(40)], t, 60 / 72 * 8, o, 0.05, 'sawtooth', 250);
    if (i % (S * 2) === 14) [180, 257, 403].forEach(f => osc('triangle', f, t, 0.8, verb, 0.05)); // örs çınlaması
  } },
  cin: { bpm: 100, step(i, t, o) { // pentatonik
    const mel = [7, 9, 10, 9, 7, 5, 4, 5, 7, 7, 9, 12, 10, 9, 7, 5];
    if (i % 2 === 0) pluck(note(PENTA, mel[(i / 2) % 16]), t, o, 0.25, 0.8);
    if (i % S === 0) pluck(note(PENTA, 0), t, o, 0.3, 0.5);
    if (i % 4 === 2) osc('square', 900, t, 0.03, o, 0.05); // tahta tokmak
    if (i % 8 === 0) drum(t, o, { f: 150, f2: 90, dur: 0.15, peak: 0.3 });
  } },
  karanlik: { bpm: 80, step(i, t, o) { // soğuk, kurt uluması
    const k = i % (S * 4);
    if (i % (S * 2) === 0) pad([mtof(45), mtof(52), mtof(57), mtof(60)], t, 60 / 80 * 8, o, 0.035, 'sine', 1500);
    if (i % 4 === 0) osc('sine', note(MINPENTA, [7, 5, 8, 7, 10, 8, 7, 5][(i / 4) % 8] + 5), t, 0.9, verb, 0.07);
    if (k === 32) howl(t, verb, 0.08, 0.9);
  } },
  boss: { bpm: 150, step(i, t, o) { // daha hızlı
    const k = i % S;
    if ([0, 3, 6, 8, 11, 14].includes(k)) drum(t, o, { f: 100, f2: 45, dur: 0.22, peak: 0.85 });
    if (k % 2 === 1) drum(t, o, { f: 300, f2: 200, dur: 0.04, peak: 0.18, click: 0.25 });
    const mel = [0, 1, 4, 1, 0, 1, 5, 4, 7, 5, 4, 1, 0, 1, 4, 5];
    if (i % 2 === 0) reed(note(HICAZ, mel[(i / 2) % 16] + 7), t, 60 / 150 / 2 * 0.9, o, 0.07, 8);
  } },
};
// Kısa, tek seferlik parçalar
const STINGS = {
  win(t, o) { [0, 2, 4, 7].forEach((d, i) => reed(note(HICAZ, d + 7), t + i * 0.18, 0.3, o, 0.1)); reed(note(HICAZ, 14), t + 0.72, 1.4, o, 0.1); for (let i = 0; i < 8; i++) drum(t + i * 0.09, o, { f: 110, f2: 60, dur: 0.1, peak: 0.3 + i * 0.05 }); drum(t + 0.72, o, { peak: 1 }); },
  lose(t, o) { [7, 5, 4, 1, 0].forEach((d, i) => pluck(note(HICAZ, d), t + i * 0.35, o, 0.35, 0.3)); drum(t + 1.75, o, { f: 70, f2: 30, dur: 0.8, peak: 0.8 }); },
};

let cur = null; // { name, gain, step, next, i }
let timer = null;
export function music(name) {
  if (!init()) return;
  if (cur?.name === name) return;
  if (cur) { const g = cur.gain; g.gain.setTargetAtTime(0.0001, now(), 0.4); setTimeout(() => g.disconnect(), 2500); cur = null; }
  if (!name) return;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  g.gain.setTargetAtTime(1, now() + 0.1, 0.5);
  g.connect(musicBus);
  if (files[name]) { // dosya varsa döngüde çalar
    const s = ctx.createBufferSource(); s.buffer = files[name]; s.loop = true; s.connect(g); s.start();
    cur = { name, gain: g, src: s };
    return;
  }
  const T = TRACKS[name];
  if (!T) return;
  cur = { name, gain: g, T, next: now() + 0.12, i: 0 };
  timer ??= setInterval(schedule, 25);
}
function schedule() {
  if (!cur?.T || ctx.state !== 'running') return;
  const dt = 60 / cur.T.bpm / 4;
  if (cur.next < now()) cur.next = now() + 0.02; // sekme uyuduysa kaçan notaları çalma
  while (cur.next < now() + 0.12) {
    cur.T.step(cur.i, cur.next, cur.gain);
    cur.next += dt;
    cur.i++;
  }
}
export function sting(name) {
  if (!init()) return;
  music(null);
  const g = ctx.createGain();
  g.connect(musicBus);
  if (files[name]) { const s = ctx.createBufferSource(); s.buffer = files[name]; s.connect(g); s.start(); return; }
  STINGS[name]?.(now() + 0.05, g);
}

// Ara sahne seslendirmesi çalarken müzik kısılır
export function duck(on) {
  if (!ctx) return;
  duckGain.gain.setTargetAtTime(on ? 0.25 : 1, now(), 0.15);
}

// Temaya göre bölge müziği
const REGION = {
  surlar: 'otuken', aksam: 'otuken', burc: 'otuken',
  bataklik: 'bataklik', olu: 'bataklik',
  orman: 'altay', altay: 'altay', buzgol: 'altay',
  gok: 'gok', firtina: 'gok', vadi: 'gok',
  tamu: 'yeralti', demirhane: 'yeralti', abyss: 'yeralti', yeralti: 'yeralti', kuyu: 'yeralti',
  cin: 'cin', karakol: 'cin',
  karanlik: 'karanlik',
};
export const regionOf = theme => REGION[theme];

// Test: bütün efekt ve parça adları
export const NAMES = { sfx: Object.keys(SFX), music: Object.keys(TRACKS), stings: Object.keys(STINGS) };
export const _ctx = () => ctx;
export function _analyser() { init(); const a = ctx.createAnalyser(); a.fftSize = 2048; master.connect(a); return a; }
export function _init() { return init(); }
