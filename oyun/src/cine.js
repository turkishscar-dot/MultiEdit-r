// Oyun motoru içinde çekilen ara sahneler: çekim listesi oynatır, alt yazıyı daktilo gibi yazar.
// Seslendirme: vo/<kimlik>.mp3 varsa çalar (ElevenLabs ile kaydedilir, bkz. SESLENDIRME.md); yoksa sessiz geçer.
// Her çekim: { text, dur, enter(c), update(c, k, t, dt), exit(c) }
const $ = id => document.getElementById(id);

// Metnin kısa kimliği: metin değişirse dosya adı da değişir (eski kayıt yanlış yerde çalmaz)
export function voId(text) {
  let h = 5381;
  for (const ch of text) h = (h * 33 + ch.codePointAt(0)) >>> 0;
  return h.toString(36);
}

let voice = null;
function speak(text, shot) {
  voice?.pause();
  const a = (voice = new Audio(`vo/${voId(text)}.mp3`));
  a.onloadedmetadata = () => { if (shot === cineRef?.shot) cineRef.dur = Math.max(cineRef.dur, a.duration + 0.6); }; // ses bitmeden çekim geçmesin
  a.play().catch(() => {}); // dosya yoksa sessiz
}
let cineRef = null;

export class Cine {
  constructor(ctx) { this.ctx = ctx; this.shots = null; cineRef = this; }
  get active() { return !!this.shots; }

  play(shots) {
    this.shots = shots;
    this.i = -1;
    $('cine').hidden = false;
    return new Promise(resolve => { this.resolve = resolve; this.next(); });
  }

  next() {
    this.shot?.exit?.(this.ctx);
    this.shot = null;
    this.ctx.clear();
    const s = this.shots[++this.i];
    if (!s) { this.comic?.shot(null); return this.end(); }
    this.shot = s;
    this.t = 0;
    this.comic?.shot(s);
    // yazı uzunsa okunacak kadar süre tanı
    this.dur = Math.max(s.dur || 0, s.text ? s.text.length / 14 + 1.4 : 0);
    s.enter?.(this.ctx);
    $('caption').hidden = !s.text;
    $('caption').textContent = '';
    if (s.text) speak(s.text, s);
  }

  update(dt) {
    if (!this.shots) return;
    this.t += dt;
    const s = this.shot;
    s.update?.(this.ctx, Math.min(1, this.t / this.dur), this.t, dt);
    if (s.text) $('caption').textContent = s.text.slice(0, Math.ceil(this.t * 45));
    if (this.t >= this.dur) this.next();
  }

  end() {
    if (!this.shots) return;
    this.shot?.exit?.(this.ctx);
    voice?.pause();
    this.shots = this.shot = null;
    $('cine').hidden = true;
    this.ctx.clear();
    this.resolve();
  }

  skip() { this.end(); }
}
