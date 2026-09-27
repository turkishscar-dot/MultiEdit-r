// Çizgi roman hikâye anlatımı ("motion comic"): ara sahne çekimleri sayfadaki panellere dolar.
// Canlı panel oyun motorunun görüntüsünden kırpılır; kamera o panele yakınlaşır, çekim bitince panel
// sayfadaki yerinde donar. Sayfa dolunca uzaklaşıp bütün sayfa gösterilir, sonra yeni sayfaya geçilir.
// Her şey tek bir 2B tuvale çizildiği için aynı görüntü kare kare kaydedilip videoya çevrilebilir.
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

// Sayfa düzenleri (sayfaya göre 0..1). r: panelin hafif eğikliği (derece)
export const LAYOUTS = {
  three: [{ x: 0, y: 0, w: 1, h: 0.45, r: -0.6 }, { x: 0, y: 0.48, w: 0.56, h: 0.52, r: 0.7 }, { x: 0.59, y: 0.48, w: 0.41, h: 0.52, r: -0.5 }],
  threeB: [{ x: 0, y: 0, w: 0.43, h: 0.54, r: 0.6 }, { x: 0.46, y: 0, w: 0.54, h: 0.54, r: -0.6 }, { x: 0, y: 0.57, w: 1, h: 0.43, r: 0.4 }],
  splash: [{ x: 0, y: 0, w: 1, h: 1, r: 0 }],
};

export class Comic {
  constructor(gl) {
    this.gl = gl; // oyun motorunun tuvali
    this.c = document.createElement('canvas');
    this.c.id = 'comic';
    this.c.hidden = true;
    document.body.append(this.c);
    this.g = this.c.getContext('2d');
    this.live = document.createElement('canvas'); // canlı panelin son karesi
    const dot = document.createElement('canvas'); // yarım ton (halftone) nokta deseni
    dot.width = dot.height = 7;
    const d = dot.getContext('2d');
    d.fillStyle = '#000';
    d.beginPath(); d.arc(3.5, 3.5, 1.4, 0, 7); d.fill();
    this.dots = this.g.createPattern(dot, 'repeat');
    this.on = false;
  }

  // pages: [{ layout, shots: [çekim, ...] }] → Cine'ye verilecek düz çekim listesi (sayfa sonlarına duraklama eklenir)
  build(pages) {
    const out = [];
    pages.forEach((p, pi) => {
      p.shots.forEach((e, k) => {
        const [s, sfx] = Array.isArray(e) ? e : [e, null];
        out.push(Object.assign(Object.create(s), { comic: { page: pi, slot: k, layout: LAYOUTS[p.layout], sfx } }));
      });
      const n = LAYOUTS[p.layout].length;
      out.push({ dur: n > 1 ? 2.2 : 0.5, comic: { page: pi, overview: true, layout: LAYOUTS[p.layout] } });
    });
    return out;
  }

  start() {
    this.on = true;
    this.c.hidden = false;
    this.snaps = {}; // "sayfa:panel" → dondurulmuş kare
    this.cam = { s: 1, x: 0.5, y: 0.5 };
    this.cur = null;
    this.flip = 0;
    this.resize();
  }

  stop() { this.on = false; this.c.hidden = true; }

  resize() {
    this.c.width = innerWidth;
    this.c.height = innerHeight;
    const m = Math.min(innerWidth, innerHeight) * 0.04;
    const ratio = innerWidth > innerHeight ? 1.45 : 0.72; // sayfa en/boy
    let w = innerWidth - m * 2, h = w / ratio;
    if (h > innerHeight - m * 2) { h = innerHeight - m * 2; w = h * ratio; }
    this.page = { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2, w, h };
  }

  slotRect(sl) {
    const p = this.page, gap = 0; // düzen zaten boşluklu
    return { x: p.x + sl.x * p.w + gap, y: p.y + sl.y * p.h + gap, w: sl.w * p.w, h: sl.h * p.h, r: (sl.r || 0) * Math.PI / 180 };
  }

  // Cine her yeni çekimde çağırır: bitmiş panelin son karesini sayfaya dondur
  shot(s) {
    const prev = this.cur;
    if (prev && !prev.overview && this.live.width) {
      const snap = document.createElement('canvas');
      snap.width = this.live.width;
      snap.height = this.live.height;
      snap.getContext('2d').drawImage(this.live, 0, 0);
      this.snaps[prev.page + ':' + prev.slot] = snap;
    }
    if (prev && s?.comic && s.comic.page !== prev.page) this.flip = 1; // yeni sayfa soldan kayarak gelir
    this.cur = s?.comic || null;
    this.t = 0;
  }

  // Her kare, 3B çizimden hemen sonra: canlı paneli kırp, sayfayı ve yazıları çiz
  draw(dt, text, t, title) {
    if (!this.on) return;
    const g = this.g, W = this.c.width, H = this.c.height, cur = this.cur;
    this.t += dt;
    if (!cur) return;
    const L = cur.layout;
    // sayfa kamerası: etkin panele yakınlaş, sayfa sonunda bütün sayfayı göster
    let tgt = { s: 1, x: 0.5, y: 0.5 };
    if (!cur.overview) {
      const sl = L[cur.slot], R = this.slotRect(sl);
      const s = Math.max(1, Math.min(W * 0.94 / R.w, H * 0.9 / R.h)), f = Math.min(1, (s - 1) * 3); // geniş panelde sayfa yerinde kalır
      tgt = { s, x: 0.5 + ((R.x + R.w / 2) / W - 0.5) * f, y: 0.5 + ((R.y + R.h / 2) / H - 0.5) * f };
    }
    const k = Math.min(1, dt * 3.2);
    this.cam.s = lerp(this.cam.s, tgt.s, k);
    this.cam.x = lerp(this.cam.x, tgt.x, k);
    this.cam.y = lerp(this.cam.y, tgt.y, k);
    this.flip = Math.max(0, this.flip - dt * 1.6);

    // canlı kareyi panel oranında kırp
    if (!cur.overview) {
      const R = this.slotRect(L[cur.slot]);
      const lw = Math.round(Math.min(1280, R.w * 2)), lh = Math.round(lw * R.h / R.w);
      if (this.live.width !== lw || this.live.height !== lh) { this.live.width = lw; this.live.height = lh; }
      const gw = this.gl.width, gh = this.gl.height, a = lw / lh;
      let sw = gw, sh = gw / a;
      if (sh > gh) { sh = gh; sw = gh * a; }
      this.live.getContext('2d').drawImage(this.gl, (gw - sw) / 2, (gh - sh) / 2, sw, sh, 0, 0, lw, lh);
    }

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#15101c';
    g.fillRect(0, 0, W, H);
    const s = this.cam.s, ox = W / 2 - this.cam.x * W * s, oy = H / 2 - this.cam.y * H * s;
    const slide = ease(this.flip) * W * 1.1;
    g.setTransform(s, 0, 0, s, ox + slide, oy);
    const P = this.page;
    g.fillStyle = '#f6ecd6'; // kâğıt
    g.fillRect(P.x - 10, P.y - 10, P.w + 20, P.h + 20);
    g.strokeStyle = '#15101c';
    g.lineWidth = 3;
    g.strokeRect(P.x - 10, P.y - 10, P.w + 20, P.h + 20);
    L.forEach((sl, i) => {
      const img = i === cur.slot && !cur.overview ? this.live : this.snaps[cur.page + ':' + i];
      this.panel(g, this.slotRect(sl), img, !img);
    });
    // anlatı kutusu ve ses efekti etkin panelde
    if (!cur.overview) {
      const R = this.slotRect(L[cur.slot]);
      if (text) this.caption(g, R, text.slice(0, Math.ceil(t * 45)), s);
      if (cur.sfx && this.t > cur.sfx[1]) this.sfx(g, R, cur.sfx[0], this.t - cur.sfx[1], s);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (title?.length) this.title(g, W, H, title);
  }

  panel(g, R, img, empty) {
    g.save();
    g.translate(R.x + R.w / 2, R.y + R.h / 2);
    g.rotate(R.r);
    const x = -R.w / 2 + 6, y = -R.h / 2 + 6, w = R.w - 12, h = R.h - 12;
    if (img) {
      g.drawImage(img, x, y, w, h);
      g.globalAlpha = 0.14;
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = this.dots;
      g.fillRect(x, y, w, h);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    } else {
      g.fillStyle = empty ? '#ece0c6' : '#fff';
      g.fillRect(x, y, w, h);
    }
    g.lineWidth = 6;
    g.strokeStyle = '#15101c';
    g.strokeRect(x, y, w, h);
    g.restore();
  }

  caption(g, R, text, s) {
    const fs = Math.max(14, Math.min(22, R.w / 30)) / Math.max(1, s * 0.55);
    g.font = `600 ${fs}px system-ui, sans-serif`;
    const maxW = R.w * 0.62, lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    }
    if (line) lines.push(line);
    const pad = fs * 0.6, lh = fs * 1.35;
    const bw = Math.max(...lines.map(l => g.measureText(l).width), fs * 4) + pad * 2, bh = lines.length * lh + pad * 1.4;
    const x = R.x + 16, y = R.y + 16;
    g.save();
    g.translate(x, y);
    g.rotate(-0.012);
    g.fillStyle = '#15101c';
    g.fillRect(4, 4, bw, bh);
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 0, bw, bh);
    g.lineWidth = 3;
    g.strokeRect(0, 0, bw, bh);
    g.fillStyle = '#15101c';
    lines.forEach((l, i) => g.fillText(l, pad, pad + fs + i * lh - fs * 0.2));
    g.restore();
  }

  sfx(g, R, word, t, s) {
    const k = Math.min(1, t * 6);
    const fs = (R.h * 0.28) * (0.4 + 0.6 * k) * (1 + Math.max(0, 1 - t * 4) * 0.3);
    g.save();
    g.translate(R.x + R.w * 0.72, R.y + R.h * 0.62);
    g.rotate(-0.18);
    g.font = `${fs}px Bangers, Impact, sans-serif`;
    g.textAlign = 'center';
    g.lineJoin = 'round';
    g.lineWidth = fs * 0.16;
    g.strokeStyle = '#15101c';
    g.strokeText(word, 0, 0);
    g.fillStyle = '#ffd23f';
    g.fillText(word, 0, 0);
    g.restore();
    void s;
  }

  // Bölüm başlığı: DOM başlık kartındaki yazılar tuvale çizilir (videoya da girsin)
  title(g, W, H, lines) {
    g.save();
    g.textAlign = 'center';
    g.lineJoin = 'round';
    let y = H / 2 - (lines.length - 1) * H * 0.06;
    for (const [text, cls, alpha] of lines) {
      const fs = cls === 'logo' ? Math.min(W * 0.1, 120) : cls === 'rune' ? Math.min(W * 0.11, 110) : Math.min(W * 0.05, 40);
      g.globalAlpha = alpha;
      g.font = cls === 'rune' ? `${fs}px 'Noto Sans Old Turkic', serif` : `${fs}px Bangers, Impact, sans-serif`;
      g.lineWidth = fs * 0.12;
      g.strokeStyle = '#15101c';
      g.strokeText(text, W / 2, y);
      g.fillStyle = cls === 'sub' ? '#ff9a5a' : '#ffd23f';
      g.fillText(text, W / 2, y);
      y += fs * 1.1;
    }
    g.restore();
  }
}
