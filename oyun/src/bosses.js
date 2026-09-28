// Boss'lar. SMU'daki gibi hiçbiri durmaz: önde koşar, arada sıçrayıp döner ve oyuncunun şeridine
// kendi silahını savurur. Hasar yalnız iki yolla verilir:
//  1) Yolda süzülen mavi YADA KÜRESİ: yanına gelince kılıçla vur, küre boss'a uçar (main.js → tryOrb).
//  2) Altın parlayan mermiyi doğru anda kılıçla geri çal (parry: true).
// Canı bitince bitiriş (main.js → startFinisher). Oğuz hiç durmaz, yolda engeller de sürer (bossRow).
// B = main.js'ten gelen yardımcılar, b = boss durumu (gz: dünyadaki z, off: oyuncuya uzaklık).
const LANES = [-2.5, 0, 2.5];
const rand = (a, b) => a + Math.random() * (b - a);
const pickLane = () => Math.floor(Math.random() * 3);
const aim = B => (Math.random() < 0.7 ? B.P.lane : pickLane()); // çoğunlukla oyuncunun koştuğu şeride

function setState(b, s) { b.state = s; b.t = 0; }
// Boss oyuncunun `off` metre önünde kalmaya çalışır; oyuncunun hızı (P.vz) eklenir ki hedefe varılsın
const runTo = (B, b, off, k, dt) => (b.gz += -B.P.vz * dt + (B.P.z - off - b.gz) * Math.min(1, dt * k));

// ---------------- Saldırılar ----------------
// Her saldırı: rüzgârlanma (şerit uyarısı) + atış. Boss sıçrayıp havada döner, atışı yapar, koşarak iner.
const ATK = {
  kaya(B, b, c) { // tek şeride mermi; çoğu altın parlar (geri çalınabilir)
    B.add(c.rock, b.aimLane, b.gz + 2.5, { vz: c.rockV + b.phase * 1.5, parry: c.parry !== false && Math.random() < 0.6 });
  },
  ezme(B, b, c) { // şeridi boydan boya döven dalga: şerit değiştir
    B.add('wave', b.aimLane, b.gz + 2, { vz: 16 + b.phase * 2 });
    B.shake(0.3);
  },
  dalga(B, b) { // üç şeride yerden dalga: zıpla
    for (let l = 0; l < 3; l++) B.add('shock', l, b.gz + 2, { vz: 12 + b.phase * 1.5 });
  },
  yagmur(B, b) { // iki şeride ok (biri boş): eğil ya da boş şeride geç
    const skip = pickLane();
    for (let l = 0; l < 3; l++) if (l !== skip) B.add('bolt', l, B.P.z - 30, { vz: 22, parry: l === (skip + 1) % 3 });
  },
  alev(B, b) { // iki şeritte yerden alev sütunu
    const safe = pickLane();
    for (let l = 0; l < 3; l++) if (l !== safe) B.add('pillar', l, B.P.z - 14);
  },
  diken(B, b) { B.add('caltrop', b.aimLane, b.gz + 1.5); }, // atından demir diken: zıpla
  kul(B, b, c) { // kulları çağırır
    for (let l = 0; l < 3; l++) if (l !== B.P.lane && Math.random() < 0.7) B.add('kormos', l, B.P.z - 32, { variant: c.minion || 'sulmus' });
  },
};
const WARN_T = 0.55; // şerit uyarısının süresi (sn)

// Ortak koşan boss. cfg: name, hp, escape, model, scale, hitY, atks [saldırı adları], rock (mermi türü), rockV,
// every [en az, en çok sn], float (süzülen), ride (atlı), minion, parts (görünür silahlar), onHit(B, b)
function kosan(cfg0) {
  const cfg = { escape: 75, scale: 1.4, hitY: 2.2, rockV: 11, every: [2.2, 3.2], ...cfg0 };
  const def = {
    ...cfg,
    mount: !!cfg.ride, // atlı boss: main.js at aktörünü de kurar
    start(B, b) {
      b.gz = B.P.z - 60; b.rot = Math.PI; b.y = cfg.float || 0; b.lane = 1; b.phase = 1;
      const a = b.actor;
      if (cfg.parts) for (const p of ['Axe', 'Dao', 'Shield', 'Spear', 'Club', 'Mace']) if (a.parts[p]) a.parts[p].visible = cfg.parts.includes(p);
      if (cfg.ride) { b.mount.root.visible = true; b.mount.play('Gallop', { speed: 1.5, fade: 0 }); a.play('Sitting_Idle_Loop', { fade: 0 }); b.y = 1.2; }
      else a.play(cfg.float ? 'Idle_Loop' : 'Sprint_Loop', { speed: cfg.float ? 0.5 : 0.9, fade: 0 });
      if (cfg.float) b.blob = B.blob();
      b.next = 2.2;
      cfg.begin?.(B, b);
      B.banner(cfg.name + '!');
    },
    update(B, b, dt) {
      const a = b.actor, R = b.hp / b.max;
      b.phase = R > 0.66 ? 1 : R > 0.33 ? 2 : 3;
      const keep = 17 + Math.sin(b.time * 0.8) * 2 - (b.stag > 0 ? 5 : 0); // vurulunca bir an geri kalır
      b.stag = Math.max(0, (b.stag || 0) - dt);
      runTo(B, b, keep, b.state === 'enter' ? 1 : 3, dt);
      if (cfg.float) b.y = cfg.float + Math.sin(b.time * 2.2) * 0.25;
      if (b.state === 'enter') { if (b.off < keep + 2) setState(b, 'run'); }
      else if (b.state === 'run') {
        b.rot = Math.PI;
        b.lane = b.wander ??= 1;
        if (b.t > 1.5) { b.t = 0; b.wander = pickLane(); }
        if ((b.next -= dt) <= 0) { // saldırı: şerit seç, uyar, sıçrayıp dön
          b.atk = cfg.atks[Math.floor(Math.random() * cfg.atks.length)];
          b.aimLane = aim(B);
          setState(b, 'windup');
          if (b.atk === 'kaya' || b.atk === 'ezme' || b.atk === 'diken') b.lane = b.aimLane;
          if (!cfg.float && !cfg.ride) a.play('NinjaJump_Start', { loop: false, speed: 1.3, fade: 0.08 });
        }
      }
      else if (b.state === 'windup') {
        const k = Math.min(1, b.t / WARN_T);
        b.rot = Math.PI * (1 - k); // havada döner, oyuncuya bakar
        if (!cfg.float && !cfg.ride) b.y = Math.sin(k * Math.PI * 0.5) * 1.6 * (cfg.scale > 2 ? 0.6 : 1);
        if (b.atk === 'kaya' || b.atk === 'ezme' || b.atk === 'diken') B.warn(b.aimLane, b.gz, B.P.z, true, b.t);
        if (b.t >= WARN_T) {
          B.warn(0, 0, 0, false);
          a.overlay(cfg.throwClip || 'OverhandThrow', { speed: 1.5 });
          ATK[b.atk](B, b, cfg);
          setState(b, 'land');
        }
      }
      else if (b.state === 'land') {
        const k = Math.min(1, b.t / 0.45);
        b.rot = Math.PI * k;
        if (!cfg.float && !cfg.ride) b.y = Math.max(0, (1 - k) * 1.6 * (cfg.scale > 2 ? 0.6 : 1));
        if (k >= 1) {
          b.y = cfg.float || (cfg.ride ? 1.2 : 0);
          if (!cfg.float && !cfg.ride) { a.play('Sprint_Loop', { speed: 0.9, fade: 0.15 }); B.dust.emit(b.x, 0.3, b.gz, 20, 0xc9a77a, 4, 2); }
          const [lo, hi] = cfg.every;
          b.next = rand(lo, hi) * (b.phase === 3 ? 0.8 : 1) / (B.difficulty?.() || 1);
          setState(b, 'run');
        }
      }
      b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 3);
      if (b.blob) { b.blob.position.set(b.x, 0.03, b.gz); b.blob.visible = true; }
      if (cfg.ride) {
        const m = b.mount.root;
        m.position.set(b.x, 0, b.gz + 0.15);
        m.rotation.y = b.rot;
        b.mount.update(dt);
      }
    },
    post(B, b) { if (cfg.ride) B.rideLegs(b.actor); },
    tap() { return false; }, // boss'a dokunarak vurulmaz: küreyi vur
    arrow(B, b, ar) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xfff2a0, 3, 2); return true; }, // ok işlemez
    hit(B, b) { b.stag = 0.6; cfg.onHit?.(B, b); },
    end(B, b) { B.warn(0, 0, 0, false); if (b.blob) { b.blob.visible = false; } if (cfg.ride) b.mount.root.visible = false; },
  };
  return def;
}

// ---------------- Boss'lar ----------------
// Tepegöz: kaçar, topuzla kaya savurur, sıçrayıp döner ve şeridi döver
const tepegoz = kosan({ name: 'TEPEGÖZ', hp: 6, escape: 80, model: 'tepegoz', scale: 2.5, hitY: 3.2, atks: ['kaya', 'kaya', 'ezme'], rock: 'boulder', rockV: 9, throwClip: 'Punch_Cross' });
// Albastı: süzülür, çığlık dalgası yollar (yavaşlatıldı: seyrek ve ağır dalga)
const albasti = kosan({ name: 'ALBASTI', hp: 6, escape: 80, model: 'albasti', scale: 1.15, hitY: 1.8, float: 1.2, atks: ['ezme', 'kaya'], rock: 'wave', rockV: 8, every: [3, 4.2], throwClip: 'MX_Cast', parry: false });
// Yelbegen: yedi başlı dev; buz kayası savurur, başlarıyla şeridi ısırır. Her iki vuruşta bir yandaki başlar düşer.
const yelbegen = kosan({ name: 'YELBEGEN', hp: 6, escape: 75, model: 'yelbegen', scale: 2.6, hitY: 3.4, atks: ['kaya', 'kaya', 'ezme'], rock: 'ice', rockV: 10, throwClip: 'Punch_Cross',
  begin(B, b) { const h = n => b.actor.root.getObjectByName(n); for (const n of ['Head_L', 'Head_R', 'Head_L2', 'Head_R2', 'Head_L3', 'Head_R3']) if (h(n)) h(n).visible = true; },
  onHit(B, b) {
    const h = n => b.actor.root.getObjectByName(n);
    const drop = b.hp === 4 ? ['Head_L', 'Head_L3'] : b.hp === 2 ? ['Head_R', 'Head_R3'] : [];
    for (const n of drop) if (h(n)) { h(n).visible = false; B.sparks.emit(b.x, 4.4, b.gz + 0.5, 50, 0x6a0a10, 6, 5); }
    if (drop.length) B.pop('BAŞI DÜŞTÜ!', { x: b.x, y: 4, z: b.gz });
  } });
// Erlik Han: ateş sütunları, yer dalgası, kul çağırır, kor kaya atar
const erlik = kosan({ name: 'ERLİK HAN', hp: 8, escape: 90, model: 'erlik', scale: 2.2, hitY: 3, atks: ['alev', 'dalga', 'kaya', 'kul'], rock: 'lavarock', rockV: 10, minion: 'sulmus', throwClip: 'Punch_Cross', parts: ['Mace'] });
// Demirci Erlik: örsten kor demir savurur, iblis salar
const demirhane = kosan({ name: "ERLİK'İN DEMİRHANESİ", hp: 6, escape: 80, model: 'erlik', scale: 2.4, hitY: 3, atks: ['kaya', 'kaya', 'kul', 'alev'], rock: 'lavarock', rockV: 11, minion: 'sulmus', throwClip: 'Punch_Cross', parts: ['Mace'] });
// Çin Generali: atıyla kaçar; okçular ok yağdırır, atı demir diken döker
const general = kosan({ name: 'ÇİN GENERALİ', hp: 6, escape: 85, model: 'general', scale: 1.15, hitY: 1.8, ride: true, atks: ['yagmur', 'diken', 'kaya'], rock: 'bolt', rockV: 16, throwClip: 'Bow_Shoot' });
// Kerey Han: balyozla yer dalgası, bakır gülle, iblis
const kerey = kosan({ name: 'KEREY HAN', hp: 6, escape: 80, model: 'kerey', scale: 2.2, hitY: 3, atks: ['kaya', 'dalga', 'kaya', 'kul'], rock: 'boulder', rockV: 10, minion: 'sulmus', throwClip: 'Punch_Cross' });
// İt-Barak Pehlivanı: boyalı gövde; her iki vuruşta bir kat boya dökülür. Sürüsünü salar, şeridi döver.
const COATS = ['Coat1', 'Coat2', 'Coat3'];
const boyali = kosan({ name: 'İT-BARAK PEHLİVANI', hp: 6, escape: 80, model: 'boyali', scale: 1.5, hitY: 2.2, atks: ['ezme', 'kul', 'kaya'], rock: 'boulder', rockV: 10, minion: 'kosucu', parts: [],
  begin(B, b) { for (const c of COATS) if (b.actor.parts[c]) b.actor.parts[c].visible = true; },
  onHit(B, b) { const c = COATS[Math.floor((6 - b.hp - 1) / 2)]; if (b.hp % 2 === 0 && b.actor.parts[c]) { b.actor.parts[c].visible = false; B.pop('BOYA KIRILDI!', { x: b.x, y: 2, z: b.gz }); } } });
// Kısım başbuğları: bölgenin güçlü savaşçısı; mızrak savurur, şeridi döver
const champ = o => kosan({ hp: 4, escape: 60, hitY: 2.2, atks: ['kaya', 'ezme'], rock: 'spear', rockV: 12, ...o });
const korbasi = champ({ name: 'KÖRMÖS BAŞI', model: 'kormos', parts: ['Axe', 'Shield'], scale: 1.45 });
const suluaga = champ({ name: 'BATAKLIK AĞASI', model: 'sulu', scale: 1.5, rock: 'wave', parry: false, rockV: 9 });
const almasbey = champ({ name: 'ALMAS BEYİ', model: 'almas', scale: 1.55, hp: 5, rock: 'ice', rockV: 10 });
const matman = champ({ name: 'HAYDUT MATMAN', model: 'sulmus', scale: 1.7, hp: 5, rock: 'lavarock', rockV: 10 }); // Tüpken Kara Tamu'nun hükümdarı (Ögel s.435)
const yuzbasi = champ({ name: 'TANG YÜZBAŞISI', model: 'cinli', parts: ['Dao', 'Shield'], scale: 1.4, atks: ['kaya', 'yagmur'], rock: 'bolt', rockV: 16 });
const itbasi = champ({ name: 'İT-BARAK BAŞBUĞU', model: 'itbarak', parts: ['Axe', 'Shield'], scale: 1.45, hp: 5, atks: ['kaya', 'ezme', 'kul'], minion: 'kosucu' });

// ---------------- Dev Kara Kuş (uçuş bölümü): önde uçar, tüy yağdırır ve kuş sürüsü salar.
// Arada dönüp çığlık atar; o an gözü açıktadır, okla vur.
const karakus = {
  name: 'DEV KARA KUŞ', hp: 9, escape: 75, model: 'karakus', scale: 3.2, hitY: 0, flying: true,
  start(B, b) { b.gz = B.P.z - 80; b.rot = Math.PI; b.y = 4.5; B.banner('DEV KARA KUŞ!'); },
  update(B, b, dt) {
    const phase = b.hp > 6 ? 1 : b.hp > 3 ? 2 : 3;
    b.y = 4.5 + Math.sin(b.time * 1.3) * 1.2;
    b.x = Math.sin(b.time * 0.7) * 2.2;
    b.flap = b.state === 'screech' ? 3 : 7;
    if (b.state === 'enter') { runTo(B, b, 24, 1, dt); if (b.off < 25) setState(b, 'fly'); }
    else if (b.state === 'fly') {
      runTo(B, b, 24, 3, dt);
      b.rot = Math.PI;
      if (b.t > 1.3 - phase * 0.2) {
        b.t = 0;
        const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 2 + phase);
        for (const c of cells) B.add('feather', c % 3, b.gz + 3, { vz: 18, row: Math.floor(c / 3), parry: true });
        if (++b.n >= 4) { b.n = 0; b.sh = 0; setState(b, 'screech'); B.tap('ŞİMDİ! OKLA!'); }
      }
    }
    else if (b.state === 'screech') {
      runTo(B, b, 22, 3, dt);
      b.rot = 0;
      if (b.t > 3) { B.tap(null); setState(b, 'fly'); }
    }
  },
  tap() { return false; },
  arrow(B, b, ar) {
    if (Math.abs(ar.x - b.x) > 3 || Math.abs(ar.y - b.y) > 3) return false;
    if (b.state === 'screech') {
      B.hitBoss();
      if (++b.sh >= 3 && b.hp > 0) { B.tap(null); setState(b, 'fly'); } // her çığlıkta en çok 3 isabet
    } else B.sparks.emit(ar.x, ar.y, ar.z, 10, 0x333333, 3, 2);
    return true;
  },
  hit() {},
};


export const BOSSES = { tepegoz, albasti, yelbegen, erlik, karakus, general, kerey, demirhane, boyali, korbasi, suluaga, almasbey, matman, yuzbasi, itbasi };
