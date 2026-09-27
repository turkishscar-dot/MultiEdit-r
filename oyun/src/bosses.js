// Boss'lar. Her biri kendi durum makinesi ve vuruş mekaniğiyle.
// escape: KAÇIŞ çubuğu süresi (sn; bitince boss kaçar). B.add(..., { parry: true }): kılıçla geri çalınabilen mermi.
// Hiçbiri geri geri yürümez: devler sırtını dönüp kaçar, durunca döner; ruhlar süzülür; Erlik alevde kaybolup belirir.
// B = main.js'ten gelen yardımcılar, b = boss durumu (gz: dünyadaki z, off: oyuncuya uzaklık).
const LANES = [-2.5, 0, 2.5];
const rand = (a, b) => a + Math.random() * (b - a);
const pickLane = () => Math.floor(Math.random() * 3);

function setState(b, s) { b.state = s; b.t = 0; }
// Dev koşarak oyuncunun `off` metre önünde kalmaya çalışır
// oyuncunun o anki hızı (P.vz) eklenir; yoksa takip gecikmesi yüzünden hedef mesafeye hiç varılmaz
const runTo = (B, b, off, k, dt) => (b.gz += -B.P.vz * dt + (B.P.z - off - b.gz) * Math.min(1, dt * k));

// ---------------- Tepegöz: kaçar, topuzla kaya savurur, döner ve şeridi ezer; sersemlerken kılıçla vurulur
const tepegoz = {
  name: 'TEPEGÖZ', hp: 9, escape: 80, model: 'tepegoz', scale: 2.5, hitY: 3.2,
  start(B, b) {
    b.gz = B.P.z - 70; b.rot = Math.PI;
    b.actor.play('Sprint_Loop', { speed: 0.8, fade: 0 });
    B.banner('TEPEGÖZ GELİYOR!');
  },
  update(B, b, dt) {
    const phase = b.hp > 6 ? 1 : b.hp > 3 ? 2 : 3;
    const a = b.actor;
    if (b.state === 'enter') { runTo(B, b, 18, 1, dt); if (b.off < 19) setState(b, 'run'); }
    else if (b.state === 'run') {
      runTo(B, b, 18, 3, dt);
      b.rot = Math.PI;
      if (b.t > 1.8 - phase * 0.25) {
        b.t = 0;
        a.overlay('Punch_Cross', { speed: 1.4 }); // koşarken topuzu yere vurur, kaya geri seker
        B.add('boulder', b.lane, b.gz + 2.5, { vz: 8 + phase * 2, parry: true });
        B.dust.emit(LANES[b.lane], 0.3, b.gz + 2, 20, 0xc9a77a, 5, 3);
        b.lane = pickLane();
        if (++b.n >= 2 + phase) { b.n = 0; b.lane = B.P.lane; setState(b, 'turn'); a.play('Sword_Idle', { fade: 0.2 }); }
      }
    }
    else if (b.state === 'turn') { // durur, döner, şeridi işaretler; vuruş + yavaşlama sonrası ~5 m'de ezer
      b.rot = 0;
      B.warn(b.lane, b.gz, B.P.z, true, b.t);
      if (b.t > 0.4 && b.off < 4.8 + B.P.speed * 0.52) { setState(b, 'smash'); a.play('Punch_Cross', { loop: false, speed: 1.5, fade: 0.05 }); }
    }
    else if (b.state === 'smash') {
      if (b.t > 0.35) {
        B.warn(b.lane, 0, 0, false);
        B.shake(0.5);
        B.burst(LANES[b.lane], 0.4, b.gz + 2.5, 3);
        B.dust.emit(LANES[b.lane], 0.3, b.gz + 2, 50, 0xc9a77a, 8, 4);
        if (Math.abs(LANES[b.lane] - B.P.x) < 1.6) B.hurt();
        B.hold(true); // Oğuz durur: düello
        setState(b, 'stun');
        a.play('Idle_Loop', { speed: 0.4, fade: 0.3 });
        B.tap('DOKUN! VUR!');
      }
    }
    else if (b.state === 'stun') {
      if (b.t > 3.5 || b.hits >= 3) {
        b.hits = 0;
        B.tap(null);
        B.hold(false);
        setState(b, 'flee');
        a.play('Sprint_Loop', { speed: 1, fade: 0.2 });
      }
    }
    else if (b.state === 'flee') { b.rot = Math.PI; runTo(B, b, 18, 1.2, dt); if (b.off > 16) setState(b, 'run'); }
    b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 3);
  },
  tap(B, b) { if (b.state !== 'stun') return false; B.slashBoss(); return true; },
  arrow(B, b, ar) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xfff2a0, 3, 2); return true; }, // ok işlemez
  hit(B, b) { b.hits++; b.actor.play('Hit_Chest', { loop: false, speed: 1.4, fade: 0.05, then: () => b.state === 'stun' && b.actor.play('Idle_Loop', { speed: 0.4 }) }); },
};

// ---------------- Albastı: süzülür, çığlık dalgası yollar, sisin içinde 3 kopyaya bölünür.
// Gerçeğinin gölgesi vardır; onu okla vurunca açığa çıkar ve oklara açık kalır. Kılıç işlemez.
const albasti = {
  name: 'ALBASTI', hp: 9, escape: 75, model: 'albasti', scale: 1.15, hitY: 1.8, clones: 2,
  start(B, b) {
    b.gz = B.P.z - 60; b.rot = 0; b.y = 1.2;
    for (const a of [b.actor, ...b.extra]) a.play('Idle_Loop', { speed: 0.5, fade: 0 });
    for (const a of b.extra) a.root.visible = false;
    b.blob = B.blob();
    B.banner('ALBASTI SİSTEN ÇIKTI!');
  },
  update(B, b, dt) {
    const phase = b.hp > 6 ? 1 : b.hp > 3 ? 2 : 3;
    const hover = off => (b.gz = B.P.z - off);
    b.y = 1.2 + Math.sin(b.time * 2.2) * 0.25;
    if (b.state === 'enter') { b.gz += (B.P.z - 14 - b.gz) * Math.min(1, dt * 1.5); if (b.off < 15) setState(b, 'hover'); }
    else if (b.state === 'hover') {
      hover(14);
      if (b.t > 2.1 - phase * 0.3) { // çığlık: şeride dalga
        b.t = 0;
        b.lane = B.P.lane;
        b.actor.play('MX_Cast', { loop: false, speed: 1.6, then: () => b.actor.play('Idle_Loop', { speed: 0.5 }) });
        B.add('wave', b.lane, b.gz + 1.5, { vz: 16 + phase * 3 });
        if (++b.n >= 2) { b.n = 0; setState(b, 'vanish'); B.dust.emit(b.x, 1.4, b.gz, 60, 0xd8e0e8, 4, 3); }
      }
    }
    else if (b.state === 'vanish') {
      hover(14);
      b.actor.root.visible = false;
      if (b.t > 0.5) { // üç şeritte belirir; gerçeği rastgele
        const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
        b.lane = lanes[0];
        b.x = LANES[lanes[0]];
        b.actor.root.visible = true;
        b.illusions = b.extra.map((a, i) => ({ a, lane: lanes[i + 1], alive: true }));
        for (const il of b.illusions) { il.a.root.visible = true; B.dust.emit(LANES[il.lane], 1.4, b.gz, 30, 0xd8e0e8, 3, 2); }
        B.dust.emit(b.x, 1.4, b.gz, 30, 0xd8e0e8, 3, 2);
        setState(b, 'triple');
        B.tap('GÖLGESİ OLANI VUR!');
      }
    }
    else if (b.state === 'triple') {
      hover(13);
      for (const il of b.illusions) il.a.root.visible = il.alive && (Math.random() > 0.04); // serap titrer
      if (b.t > 4.2 - phase * 0.5) { // süre doldu: hepsi atılır, sadece gerçeği acıtır
        setState(b, 'lunge');
        B.tap(null);
        for (const a of [b.actor, ...b.extra]) a.play('Zombie_Scratch', { speed: 1.4 });
      }
    }
    else if (b.state === 'lunge') {
      b.gz += 30 * dt;
      if (b.off < 1 && !b.struck) { b.struck = true; if (Math.abs(b.x - B.P.x) < 1.3) B.hurt(); }
      if (b.off < -4) { b.struck = false; albasti.regroup(B, b); b.gz = B.P.z - 30; setState(b, 'enter'); }
    }
    else if (b.state === 'exposed') {
      hover(12);
      if (b.t > 2.6) { B.tap(null); b.actor.play('Idle_Loop', { speed: 0.5 }); setState(b, 'hover'); }
    }
    if (b.state !== 'vanish' && b.state !== 'triple' && b.state !== 'lunge') b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 4);
    b.blob.visible = b.actor.root.visible;
    b.blob.position.set(b.x, 0.03, b.gz);
    b.blob.scale.setScalar(1 - (b.y - 1.2) * 0.4);
    for (const il of b.illusions || []) {
      il.a.root.position.set(LANES[il.lane], b.y, b.gz);
      il.a.root.rotation.y = 0;
      il.a.update(dt);
    }
  },
  regroup(B, b) {
    for (const il of b.illusions || []) il.a.root.visible = false;
    b.illusions = null;
  },
  ranged: true, // okla vurulur: savaş başında yay ele geçer
  tap() { return false; }, // yakın dövüş yok: dokunuş ok atar
  arrow(B, b, ar) {
    if (b.state === 'triple') {
      const il = b.illusions.find(i => i.alive && Math.abs(LANES[i.lane] - ar.x) < 1.2);
      if (il) { // serap dağılır
        il.alive = false;
        il.a.root.visible = false;
        B.dust.emit(LANES[il.lane], 1.4, b.gz, 40, 0xb8a0ff, 5, 3);
        B.pop('SERAP!', { x: LANES[il.lane], y: 1, z: b.gz });
        return true;
      }
      if (Math.abs(b.x - ar.x) < 1.2) { // gerçeği bulundu
        albasti.regroup(B, b);
        setState(b, 'exposed');
        b.eh = 0;
        B.tap('OKLA! OKLA!');
        b.actor.play('Hit_Knockback', { loop: false, speed: 1.2, then: () => b.actor.play('Idle_Loop', { speed: 0.3 }) });
        B.hitBoss();
        return true;
      }
      return false;
    }
    if (b.state === 'exposed' && Math.abs(b.x - ar.x) < 1.4) {
      B.hitBoss();
      if (++b.eh >= 2 && b.hp > 0) { B.tap(null); b.actor.play('Idle_Loop', { speed: 0.5 }); setState(b, 'hover'); } // her açığa çıkışta en çok 3 isabet
      return true;
    }
    if (Math.abs(b.x - ar.x) < 1.4) { B.sparks.emit(ar.x, ar.y, ar.z, 12, 0xd8e0e8, 3, 2); B.pop('SİS!', ar); return true; }
    return false;
  },
  hit(B, b) { b.actor.play('Hit_Chest', { loop: false, speed: 1.5, then: () => b.actor.play('Idle_Loop', { speed: 0.3 }) }); },
};

// ---------------- Yelbegen: üç başlı dev. Kaçarken buz kayası savurur; döner, başları sırayla şeritlere saldırır.
// Sonra ekranda çıkan yöne kaydırarak bir başı kesersin. Yanlış ya da geç kalırsan baş ısırır.
const yelbegen = {
  name: 'YELBEGEN', hp: 3, escape: 70, model: 'yelbegen', scale: 2.6, hitY: 3.4,
  start(B, b) {
    b.gz = B.P.z - 70; b.rot = Math.PI;
    const h = n => b.actor.root.getObjectByName(n);
    b.heads = { left: [h('Head_L'), h('Head_L3')], right: [h('Head_R'), h('Head_R3')] }; // bize dönükken modelin -x'i ekranın solu
    for (const n of ['Head_L', 'Head_R', 'Head_L2', 'Head_R2', 'Head_L3', 'Head_R3']) h(n).visible = true;
    b.cut = [];
    b.mark = B.mark();
    b.mark.visible = false;
    b.actor.play('Sprint_Loop', { speed: 0.8, fade: 0 });
    B.banner('YELBEGEN GELİYOR!');
  },
  update(B, b, dt) {
    const a = b.actor;
    if (b.state === 'enter') { runTo(B, b, 18, 1, dt); if (b.off < 19) setState(b, 'run'); }
    else if (b.state === 'run') {
      runTo(B, b, 18, 3, dt);
      b.rot = Math.PI;
      if (b.t > 1.4) {
        b.t = 0;
        a.overlay('Punch_Cross', { speed: 1.4 });
        B.add('ice', pickLane(), b.gz + 2.5, { vz: 11, parry: true });
        if (++b.n >= 3) { b.n = 0; setState(b, 'turn'); a.play('Sword_Idle', { fade: 0.2 }); b.bites = [0, 1, 2].sort(() => Math.random() - 0.5); }
      }
    }
    else if (b.state === 'turn') { // durur ve döner; oyuncu yaklaşınca başlar sırayla saldırır
      b.rot = 0;
      if (b.t > 0.4 && b.off < 5.5 + B.P.speed * 0.17) { B.hold(true); setState(b, 'bite'); b.bi = 0; }
    }
    else if (b.state === 'bite') {
      const lane = b.bites[b.bi];
      const T = 0.75;
      B.warn(lane, b.gz, B.P.z, b.t < T, b.t);
      if (b.t > T && !b.snapped) {
        b.snapped = true;
        a.play('Punch_Jab', { loop: false, speed: 1.8, fade: 0.05 });
        B.burst(LANES[lane], 1.5, B.P.z - 1.5, 2);
        if (Math.abs(LANES[lane] - B.P.x) < 1.3) B.hurt();
      }
      if (b.t > T + 0.35) {
        b.snapped = false;
        b.t = 0;
        if (++b.bi >= 3) { B.warn(0, 0, 0, false); yelbegen.prompt(B, b); }
      }
    }
    else if (b.state === 'qte') {
      if (b.t > b.window) { // geç kaldı
        B.hurt();
        B.pop('ISIRDI!', { x: 0, y: 2, z: b.gz });
        yelbegen.flee(B, b);
      }
    }
    else if (b.state === 'flee') { b.rot = Math.PI; runTo(B, b, 18, 1.2, dt); if (b.off > 16) setState(b, 'run'); }
    b.x += (0 - b.x) * Math.min(1, dt * 3);
    b.mark.visible = b.state === 'qte';
    if (b.mark.visible) { // kesilecek başın üstünde yanıp söner
      b.actor.bone('Head').getWorldPosition(b.mark.position);
      if (b.want !== 'up') b.mark.position.x += (b.want === 'left' ? -0.27 : 0.27) * yelbegen.scale;
      b.mark.position.y += 1.1;
      b.mark.scale.setScalar(1.3 + Math.sin(b.t * 25) * 0.25);
    }
  },
  prompt(B, b) {
    const left = ['left', 'right'].filter(d => !b.cut.includes(d));
    b.want = left.length ? left[Math.floor(Math.random() * left.length)] : 'up';
    b.window = Math.max(0.7, 1.2 - b.cut.length * 0.2);
    setState(b, 'qte');
    B.tap({ left: '◀ KAYDIR!', right: 'KAYDIR! ▶', up: '▲ KAYDIR!' }[b.want]);
  },
  flee(B, b) {
    B.tap(null);
    B.hold(false);
    setState(b, 'flee');
    b.actor.play('Sprint_Loop', { speed: 1, fade: 0.2 });
  },
  swipe(B, b, dir) {
    if (b.state !== 'qte') return false;
    if (dir !== b.want) { B.hurt(); B.pop('ISIRDI!', { x: 0, y: 2, z: b.gz }); yelbegen.flee(B, b); return true; }
    B.slashBoss(dir);
    if (dir !== 'up') {
      b.cut.push(dir);
      for (const hd of b.heads[dir]) hd.visible = false; // o yandaki iki baş düşer
      B.sparks.emit(dir === 'left' ? -0.9 : 0.9, 4.6, b.gz + 0.5, 60, 0x6a0a10, 6, 5);
      B.pop('KESİLDİ!', { x: dir === 'left' ? -1 : 1, y: 3, z: b.gz });
    }
    if (b.hp > 0) yelbegen.flee(B, b);
    return true;
  },
  tap() { return true; }, // QTE'de dokunuş sayılmaz
  arrow(B, b, ar) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xfff2a0, 3, 2); return true; },
  hit(B, b) { b.actor.play('Hit_Chest', { loop: false, speed: 1.4, fade: 0.05 }); },
};

// ---------------- Erlik Han: üç aşamalı final. Alevde kaybolup ileride belirir; ateş sütunları, kul dalgaları,
// balyoz şok dalgası (zıpla). Yorulup diz çökünce kılıçla vur. Canı bitince hızlı hızlı dokunarak bitir.
const erlik = {
  name: 'ERLİK HAN', hp: 12, escape: 90, model: 'erlik', scale: 2.2, hitY: 3,
  start(B, b) {
    b.gz = B.P.z - 30; b.rot = 0;
    b.actor.play('Sword_Idle', { fade: 0 });
    B.burst(0, 2, b.gz, 5);
    B.banner('ERLİK HAN!');
  },
  update(B, b, dt) {
    const phase = b.hp > 8 ? 1 : b.hp > 4 ? 2 : 3;
    const a = b.actor;
    const blink = () => { // alevde kaybol, ileride belir
      B.sparks.emit(b.x, 2, b.gz, 60, 0xff5a1a, 6, 6);
      b.gz = B.P.z - 26;
      b.lane = pickLane();
      b.x = LANES[b.lane];
      B.sparks.emit(b.x, 2, b.gz, 60, 0xff5a1a, 6, 6);
    };
    if (b.state === 'enter') { if (b.t > 1.2) setState(b, 'attack'); }
    else if (b.state === 'attack') {
      if (b.off < 10) blink();
      if (b.t > 1.5 - phase * 0.25) {
        b.t = 0;
        b.n++;
        const roll = b.n % 3;
        if (roll === 1 || phase === 1) { // iki şeritte ateş sütunu
          a.play('MX_GS_Cast', { loop: false, speed: 3.2, then: () => a.play('MX_GS_Idle') });
          const safe = pickLane();
          for (let l = 0; l < 3; l++) if (l !== safe) B.add('pillar', l, B.P.z - 18);
        } else if (roll === 2 && phase >= 2) { // balyoz: tüm şeritlere şok dalgası, zıpla
          a.play('Punch_Cross', { loop: false, speed: 1.4, then: () => a.play('Sword_Idle') });
          for (let l = 0; l < 3; l++) B.add('shock', l, b.gz + 2, { vz: 14 });
          B.shake(0.35);
        } else { // kul çağırır
          for (let l = 0; l < 3; l++) if (Math.random() < 0.6) B.add('kormos', l, B.P.z - 30, { variant: 'yeralti', y: -1.9, phase: 'wait', pt: 0, ready: false });
        }
        if (b.n >= 5 + phase) { b.n = 0; setState(b, 'tired'); a.play('Sword_Idle', { fade: 0.3 }); }
      }
    }
    else if (b.state === 'tired') { // yaklaşınca diz çöker
      if (b.off < 5 + B.P.speed * 0.17) {
        B.hold(true);
        setState(b, 'stun');
        a.play('Hit_Knockback', { loop: false, speed: 0.8, then: () => a.play('Idle_Loop', { speed: 0.3 }) });
        B.tap('DOKUN! VUR!');
      }
    }
    else if (b.state === 'stun') {
      if (b.t > 3.5 || b.hits >= 4) { b.hits = 0; B.tap(null); B.hold(false); blink(); setState(b, 'attack'); a.play('Sword_Idle'); }
    }
    else if (b.state === 'mash') { // son darbe: bar dolmalı
      b.bar = Math.max(0, b.bar - dt * 0.35);
      B.mash(b.bar);
      if (b.bar >= 1) { B.mash(null); B.finish(); }
      else if (b.t > 4) { // yetişemedi: Erlik silkinir
        B.mash(null); B.hurt(); b.hp = 2; B.bar(); B.hold(false); B.tap(null); blink(); setState(b, 'attack'); a.play('Sword_Idle');
      }
    }
    b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 5);
  },
  tap(B, b) {
    if (b.state === 'mash') { b.bar += 0.065; B.sparks.emit(b.x, 2.8, b.gz + 0.8, 8, 0xff9a3a, 4, 2); return true; }
    if (b.state !== 'stun') return false;
    B.slashBoss();
    return true;
  },
  arrow(B, b, ar) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xff9a3a, 3, 2); return true; },
  hit(B, b) { b.hits++; b.actor.play('Hit_Chest', { loop: false, speed: 1.4, fade: 0.05, then: () => b.state === 'stun' && b.actor.play('Idle_Loop', { speed: 0.3 }) }); },
  // Can bitince bitiriş yerine önce hızlı dokunma sınavı
  beforeFinish(B, b) {
    if (b.mashed) return false;
    b.mashed = true;
    b.bar = 0.3;
    setState(b, 'mash');
    B.hold(true);
    B.tap('HIZLI HIZLI DOKUN!');
    return true;
  },
};

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

// ---------------- Çin Generali: atıyla kaçar; surlardaki okçular ok yağdırır, atı demir diken döker.
// Sonra atından atlar ve kalkanla düelloya girer: kalkanlıyken vuruş işlemez. Saldırısından doğru hamleyle
// (▲ zıpla / ▼ eğil) kaçarsan dengesi bozulur, o an vur.
const general = {
  name: 'ÇİN GENERALİ', hp: 9, escape: 85, model: 'general', scale: 1.15, hitY: 1.8, mount: true,
  start(B, b) {
    b.gz = B.P.z - 60; b.rot = Math.PI; b.y = 1.2; b.riding = true;
    b.actor.play('Sitting_Idle_Loop', { fade: 0 });
    b.mount.root.visible = true;
    b.mount.play('Gallop', { speed: 1.5, fade: 0 });
    b.mark = B.mark();
    b.mark.visible = false;
    B.banner('ÇİN GENERALİ!');
  },
  update(B, b, dt) {
    const a = b.actor;
    if (b.state === 'enter') { runTo(B, b, 18, 1, dt); if (b.off < 19) setState(b, 'ride'); }
    else if (b.state === 'ride') {
      runTo(B, b, 18, 3, dt);
      if (b.t > 1.5) {
        b.t = 0;
        if (b.n % 2 === 0) { // surlardaki okçular: iki şeride ok (eğil)
          const skip = pickLane();
          for (let l = 0; l < 3; l++) if (l !== skip) B.add('bolt', l, B.P.z - 34, { vz: 26, parry: true });
          if (b.n === 0) B.pop('OKÇULAR!', { x: 0, y: 3, z: B.P.z - 12 });
        } else B.add('caltrop', pickLane(), b.gz + 1.5); // atından demir diken (zıpla)
        if (++b.n >= 6) { setState(b, 'dismount'); a.play('NinjaJump_Start', { loop: false, speed: 1.2, fade: 0.1 }); }
      }
    }
    else if (b.state === 'dismount') { // attan atlar, döner; at dörtnala uzaklaşır
      b.riding = false;
      b.rot = 0;
      b.y = Math.max(0, 1.2 * (1 - b.t / 0.5) + Math.sin(Math.min(1, b.t / 0.5) * Math.PI) * 0.8);
      if (b.t > 0.5) { b.y = 0; setState(b, 'guard'); a.play('Idle_Shield_Loop', { fade: 0.2 }); }
    }
    else if (b.state === 'guard') { // yerinde bekler; oyuncu yaklaşınca düello
      if (b.off < 5 + B.P.speed * 0.17) { B.hold(true); setState(b, 'duel'); b.next = rand(1, 1.8); B.tap('KALKANI VAR! BEKLE...'); }
    }
    else if (b.state === 'duel') {
      if (b.t > b.next) {
        b.atk = Math.random() < 0.5 ? 'low' : 'high';
        b.dodged = false;
        setState(b, 'windup');
        B.tap(b.atk === 'low' ? '▲ ZIPLA!' : '▼ EĞİL!');
        a.play('Sword_Idle', { fade: 0.1 });
      }
    }
    else if (b.state === 'windup') { // 0.45 sn uyarı, sonra 0.5 sn vuruş penceresi
      if (b.t > 0.45 && !b.swung) { b.swung = true; const c = ['Sword_Attack', 'MX_GS_Slash1', 'MX_Stab2'][b.n++ % 3]; a.play(c, { loop: false, speed: a.duration(c) / 0.5, fade: 0.05 }); }
      if (b.t > 0.45 && (b.atk === 'low' ? B.P.y > 0.5 : B.P.slide > 0)) b.dodged = true;
      if (b.t > 0.95) {
        b.swung = false;
        if (b.dodged) { // dengesi bozuldu: vur!
          setState(b, 'open');
          b.oh = 0;
          B.tap('ŞİMDİ VUR!');
          a.play('Hit_Knockback', { loop: false, speed: 0.8, fade: 0.05 });
        } else {
          B.hurt();
          B.sparks.emit(B.P.x, 1.2, B.P.z - 1, 20, 0xfff2a0, 5, 3);
          setState(b, 'duel');
          b.next = rand(1, 1.6);
          B.tap('KALKANI VAR! BEKLE...');
          a.play('Idle_Shield_Loop', { fade: 0.2 });
        }
      }
    }
    else if (b.state === 'open') {
      if (b.t > 1.5 || b.oh >= 3) { setState(b, 'duel'); b.next = rand(0.9, 1.5); B.tap('KALKANI VAR! BEKLE...'); a.play('Idle_Shield_Loop', { fade: 0.2 }); }
    }
    b.x += (0 - b.x) * Math.min(1, dt * 3);
    // at: binerken altında, indikten sonra ileri dörtnala uzaklaşıp kaybolur
    const m = b.mount.root;
    if (b.riding) m.position.set(b.x, 0, b.gz + 0.15);
    else { m.position.z -= 18 * dt; if (B.P.z - m.position.z > 60) m.visible = false; }
    m.rotation.y = Math.PI;
    b.mount.update(dt);
    b.mark.visible = b.state === 'windup';
    if (b.mark.visible) { a.bone('Head').getWorldPosition(b.mark.position); b.mark.position.y += 0.9; b.mark.scale.setScalar(1 + Math.sin(b.t * 30) * 0.2); }
  },
  post(B, b) { if (b.riding) B.rideLegs(b.actor); }, // eyerde oturma pozu
  tap(B, b) {
    if (b.state === 'open') { B.slashBoss(); return true; }
    if (b.state === 'duel' || b.state === 'windup') { // kalkan
      B.sparks.emit(b.x, 1.4, b.gz + 0.8, 15, 0xfff2a0, 4, 2);
      B.pop('KALKAN!', { x: b.x, y: 1.2, z: b.gz });
      return true;
    }
    return false;
  },
  arrow(B, b, ar) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xfff2a0, 3, 2); return true; },
  hit(B, b) { b.oh++; },
  end(B, b) { b.mount.root.visible = false; },
};

// ---------------- Kerey Han (Kara-Teş): Erlik'in oğlu, burun kemiği bakırdır (Ögel s.458). Sırtını dönüp kaçar,
// balyozuyla yere vurup şok dalgası ve bakır gülle yollar; sonra döner, bakır burnunu şeride saplar.
// Burnu toprağa gömülü kalınca kılıçla vur.
const kerey = {
  name: 'KEREY HAN', hp: 9, escape: 80, model: 'kerey', scale: 2.2, hitY: 3,
  start(B, b) {
    b.gz = B.P.z - 70; b.rot = Math.PI;
    b.actor.play('Sprint_Loop', { speed: 0.8, fade: 0 });
    B.banner('KEREY HAN! BAKIR BURUNLU!');
  },
  update(B, b, dt) {
    const phase = b.hp > 6 ? 1 : b.hp > 3 ? 2 : 3;
    const a = b.actor;
    if (b.state === 'enter') { runTo(B, b, 20, 1, dt); if (b.off < 21) setState(b, 'run'); }
    else if (b.state === 'run') {
      runTo(B, b, 20, 3, dt);
      b.rot = Math.PI;
      if (b.t > 1.6 - phase * 0.2) {
        b.t = 0;
        a.overlay('Punch_Cross', { speed: 1.4 });
        if (b.n % 2) for (let l = 0; l < 3; l++) B.add('shock', l, b.gz + 2, { vz: 12 + phase * 2 }); // bütün şeritlere dalga: zıpla
        else B.add('boulder', pickLane(), b.gz + 2.5, { vz: 10 + phase * 2, parry: true }); // bakır gülle: şerit değiştir ya da geri çal
        if (phase === 3 && b.n % 3 === 0) B.add('kormos', pickLane(), B.P.z - 34, { variant: 'sulmus' });
        if (++b.n >= 3 + phase) { b.n = 0; b.lane = B.P.lane; setState(b, 'turn'); a.play('Sword_Idle', { fade: 0.2 }); B.banner('BURNUNU SAPLAYACAK!'); }
      }
    }
    else if (b.state === 'turn') { // döner, şeridi işaretler
      b.rot = 0;
      B.warn(b.lane, b.gz, B.P.z, true, b.t);
      if (b.t > 0.4 && b.off < 5 + B.P.speed * 0.52) { setState(b, 'gore'); a.play('Punch_Cross', { loop: false, speed: 1.3, fade: 0.05 }); }
    }
    else if (b.state === 'gore') { // bakır burun şeride saplanır
      a.root.rotation.x = Math.min(0.55, b.t * 2);
      if (b.t > 0.35) {
        B.warn(b.lane, 0, 0, false);
        B.shake(0.5);
        B.burst(LANES[b.lane], 0.4, b.gz + 2.5, 3);
        B.sparks.emit(LANES[b.lane], 0.5, b.gz + 2.5, 50, 0xe08a3a, 8, 4);
        if (Math.abs(LANES[b.lane] - B.P.x) < 1.6) B.hurt();
        B.hold(true);
        setState(b, 'stuck');
        a.play('Idle_Loop', { speed: 0.3, fade: 0.2 });
        B.tap('BURNU SAPLANDI! VUR!');
      }
    }
    else if (b.state === 'stuck') {
      if (b.t > 3.2 || b.hits >= 3) {
        b.hits = 0;
        a.root.rotation.x = 0;
        B.tap(null);
        B.hold(false);
        setState(b, 'flee');
        a.play('Sprint_Loop', { speed: 1, fade: 0.2 });
      }
    }
    else if (b.state === 'flee') { b.rot = Math.PI; runTo(B, b, 20, 1.2, dt); if (b.off > 18) setState(b, 'run'); }
    b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 3);
  },
  tap(B, b) { if (b.state !== 'stuck') return false; B.slashBoss(); return true; },
  arrow(B, b, ar) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xe08a3a, 3, 2); return true; }, // bakır deri: ok işlemez
  hit(B, b) { b.hits++; B.sparks.emit(b.x, 2.6, b.gz + 1.5, 30, 0xe08a3a, 6, 3); },
  end(B, b) { b.actor.root.rotation.x = 0; },
};

// ---------------- Erlik'in Demirhanesi (ikinci kat): Erlik örsün başında. Her çekiç vuruşunda örsten bir iblis doğar
// ve üstüne koşar (Ögel s.461). Üç vuruştan sonra örs akkor kesilir: o an örsü okla. Körük alevinden kaç.
// Can bitince Erlik yerin dibine, tahtına kaçar.
const demirhane = {
  name: "ERLİK'İN DEMİRHANESİ", hp: 6, escape: 75, model: 'erlik', scale: 2.4, hitY: 1.6, ranged: true,
  start(B, b) {
    b.gz = B.P.z - 60; b.rot = 0; b.heat = 0;
    b.anvil = B.prop('makeAnvil');
    b.actor.play('Sword_Idle', { fade: 0 });
    B.banner('ERLİK ÖRSÜNÜN BAŞINDA!');
  },
  update(B, b, dt) {
    const phase = b.hp > 4 ? 1 : b.hp > 2 ? 2 : 3;
    const a = b.actor;
    b.anvil.position.set(0, 0, b.gz + 3.2);
    b.anvil.userData.hot(b.heat > 0);
    if (b.state === 'enter') { if (b.off < 17 + B.P.speed * 0.17) { B.hold(true); setState(b, 'forge'); } }
    else if (b.state === 'forge') {
      if (b.heat > 0 && (b.heat -= dt) <= 0) B.tap(null);
      if (b.t > 1.8 - phase * 0.2 && b.heat <= 0) {
        b.t = 0;
        a.play('Punch_Cross', { loop: false, speed: 1.3, fade: 0.05, then: () => a.play('Sword_Idle', { fade: 0.2 }) });
        B.shake(0.2);
        B.sparks.emit(0, 1.6, b.gz + 3.2, 40, 0xffb02a, 7, 3);
        if (phase >= 2 || b.n % 2 === 0) B.add('kormos', pickLane(), b.gz + 5, { variant: 'sulmus' }); // örsten doğan iblis
        if (phase >= 2 && b.n % 2) { const safe = pickLane(); for (let l = 0; l < 3; l++) if (l !== safe) B.add('pillar', l, B.P.z - 0.8); } // körük alevi
        if (++b.n % 3 === 0) { b.heat = 2.4; B.tap('ÖRS AKKOR! OKLA!'); }
      }
    }
    else if (b.state === 'escape') { // yerin dibine batar
      b.y = -b.t * 2.2;
      if (Math.random() < 0.5) B.sparks.emit(b.x, 0.3, b.gz, 6, 0xff5a1a, 4, 4);
      if (b.t > 1.4) { B.hold(false); B.done(); }
    }
  },
  tap() { return false; }, // dokunuş: iblisleri biç ya da ok at
  arrow(B, b, ar) {
    if (b.heat > 0 && b.state === 'forge') { B.hitBoss(); B.sparks.emit(0, 1.4, b.gz + 3.2, 30, 0xffe07a, 6, 3); return true; }
    B.sparks.emit(ar.x, ar.y, ar.z, 10, 0x8a8a8a, 3, 2);
    return true;
  },
  hit(B, b) { b.actor.play('Hit_Chest', { loop: false, speed: 1.4, fade: 0.05, then: () => b.actor.play('Sword_Idle') }); },
  beforeFinish(B, b) {
    setState(b, 'escape');
    b.heat = 0;
    B.tap(null);
    B.banner('ERLİK KAÇTI! TAHTINA İNİYOR!');
    b.actor.play('Idle_Loop', { fade: 0.2 });
    return true;
  },
  end(B, b) { B.unprop(b.anvil); b.y = 0; },
};

// ---------------- İt-Barak Pehlivanı (Karanlık Ülke): vücudu üç kat kara-ak yapışkanla sıvalı, oklar seker (Ögel s.186).
// Şeridine atılır: yana kaç; ıskalayınca dengesi bozulur, kılıçla vur — her vuruş bir kat boyayı kırar.
// Üç kat dökülünce sırtını dönüp kaçar ve sürüsünü çağırır: artık okla vurulur.
const COATS = ['Coat1', 'Coat2', 'Coat3'];
const boyali = {
  name: 'İT-BARAK PEHLİVANI', hp: 6, escape: 80, model: 'boyali', scale: 1.5, hitY: 2.2,
  start(B, b) {
    b.gz = B.P.z - 55; b.rot = 0; b.coats = 3;
    for (const c of COATS) b.actor.parts[c].visible = true;
    b.actor.parts.Axe.visible = false;
    b.actor.parts.Shield.visible = false;
    b.actor.play('Idle_Loop', { fade: 0 });
    B.banner('İT-BARAK PEHLİVANI!');
  },
  update(B, b, dt) {
    const a = b.actor;
    if (b.state === 'enter') {
      if (b.off < 15 + B.P.speed * 0.17) { B.hold(true); setState(b, 'stalk'); b.next = rand(0.8, 1.4); B.tap('OK İŞLEMEZ! SALDIRISINDAN KAÇ!'); }
    }
    else if (b.state === 'stalk') {
      b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 4);
      if (a.clip !== 'MX_GS_Strafe') a.play('MX_GS_Strafe', { fade: 0.2 });
      if (b.t > b.next) { b.lane = B.P.lane; setState(b, 'crouch'); a.play('Crouch_Idle_Loop', { fade: 0.1 }); }
    }
    else if (b.state === 'crouch') { // şeridi işaretler, atılmaya hazırlanır
      b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 6);
      B.warn(b.lane, b.gz, B.P.z, true, b.t);
      if (b.t > 0.7) { setState(b, 'lunge'); b.z0 = b.gz; a.play('NinjaJump_Start', { loop: false, speed: 1.6, fade: 0.05 }); }
    }
    else if (b.state === 'lunge') {
      const k = Math.min(1, b.t / 0.35);
      b.gz = b.z0 + (B.P.z - 2.6 - b.z0) * k;
      b.y = Math.sin(k * Math.PI) * 1.2;
      if (k >= 1) {
        B.warn(b.lane, 0, 0, false);
        b.y = 0;
        B.dust.emit(b.x, 0.2, b.gz, 30, 0x6a7a90, 5, 3);
        if (b.lane === B.P.lane) { B.hurt(); setState(b, 'back'); a.play('NinjaJump_Start', { loop: false, speed: 1.4 }); }
        else { setState(b, 'open'); B.tap('ŞİMDİ! KILIÇLA VUR!'); a.play('MX_GS_Impact2', { loop: false, speed: 0.8, fade: 0.05 }); }
      }
    }
    else if (b.state === 'open') { if (b.t > 1.5) { setState(b, 'back'); B.tap(null); } }
    else if (b.state === 'back') { // geri sıçrar
      b.gz += (B.P.z - 14 - b.gz) * Math.min(1, dt * 4);
      b.y = Math.max(0, Math.sin(Math.min(1, b.t / 0.5) * Math.PI));
      if (b.t > 0.6) {
        b.y = 0;
        a.play('Idle_Loop', { fade: 0.2 });
        if (b.coats > 0) { setState(b, 'stalk'); b.next = rand(0.6, 1.2); B.tap(b.coats === 3 ? 'OK İŞLEMEZ! SALDIRISINDAN KAÇ!' : 'BOYA ' + b.coats + ' KAT KALDI!'); }
        else { // boyası döküldü: kaçar, sürüsünü çağırır
          B.hold(false);
          setState(b, 'flee');
          a.play('Sprint_Loop', { speed: 1.2, fade: 0.2 });
          B.banner('BOYASI DÖKÜLDÜ! OKLA!');
          B.arm('bow');
          B.tap('OKLA! OKLA!');
        }
      }
    }
    else if (b.state === 'flee') {
      runTo(B, b, 16, 3, dt);
      if (b.t > 1.2) {
        b.t = 0;
        b.lane = pickLane();
        if (++b.n % 3 === 0) for (let l = 0; l < 3; l++) if (l !== B.P.lane) B.add('kormos', l, B.P.z - 30, { variant: 'kosucu' });
      }
      b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 4);
    }
    b.rot = b.state === 'flee' ? Math.PI : 0;
  },
  tap(B, b) { if (b.state !== 'open') return false; B.slashBoss(); return true; },
  arrow(B, b, ar) {
    if (b.coats > 0) { B.sparks.emit(ar.x, ar.y, ar.z, 10, 0x1a1a1a, 3, 2); B.pop('BOYA!', { x: ar.x, y: ar.y, z: ar.z }); return true; }
    if (b.state !== 'flee' || Math.abs(ar.x - b.x) > 1.3) return false;
    B.hitBoss();
    return true;
  },
  hit(B, b) {
    if (b.coats <= 0) return;
    b.actor.parts[COATS[3 - b.coats]].visible = false; // dıştan içe bir kat boya kırılır
    b.coats--;
    B.sparks.emit(b.x, 1.6, b.gz + 0.8, 50, b.coats % 2 ? 0x1a1a1a : 0xf0f0e8, 7, 4);
    B.pop('BOYA KIRILDI!', { x: b.x, y: 1.5, z: b.gz });
    setState(b, 'back');
    B.tap(null);
  },
};

// ---------------- Kısım başbuğları (ara boss): her bölgenin güçlü savaşçısı. Oğuz durur, düello olur.
// Saldırıları: şeride atılma (yana kaç), yüksek savuruş (▼ eğil), alçak savuruş (▲ zıpla). Iskalayınca sendeler: vur!
function champion({ name, model, scale = 1.4, parts = [], hp = 4, hitY = 2.2, idle = 'MX_GS_Idle', atks = ['lunge', 'high', 'low'], escape = 60 }) {
  return {
    name, hp, model, scale, hitY, escape, // escape: KAÇIŞ çubuğunun süresi (sn)
    start(B, b) {
      b.gz = B.P.z - 50; b.rot = 0;
      for (const p of ['Axe', 'Dao', 'Shield', 'Spear']) if (b.actor.parts[p]) b.actor.parts[p].visible = parts.includes(p);
      b.actor.play(idle, { fade: 0 });
      B.banner(name + '!');
    },
    update(B, b, dt) {
      const a = b.actor;
      b.x += (LANES[b.lane] - b.x) * Math.min(1, dt * 6);
      if (b.state === 'enter') {
        if (b.off < 13 + B.P.speed * 0.17) { B.hold(true); setState(b, 'duel'); b.next = rand(0.8, 1.2); B.tap('SALDIRISINI BEKLE...'); a.play('MX_GS_Strafe', { fade: 0.2 }); }
      }
      else if (b.state === 'duel') {
        if (b.t > b.next) {
          b.atk = atks[Math.floor(Math.random() * atks.length)];
          if (b.atk === 'lunge') { b.lane = B.P.lane; setState(b, 'crouch'); a.play('MX_GS_Crouch', { fade: 0.1 }); B.tap('◀ YANA KAÇ ▶'); }
          else { setState(b, 'windup'); b.swung = false; b.dodged = false; a.play(idle, { fade: 0.1 }); B.tap(b.atk === 'low' ? '▲ ZIPLA!' : '▼ EĞİL!'); }
        }
      }
      else if (b.state === 'crouch') { // şeridi işaretler, atılır
        B.warn(b.lane, b.gz, B.P.z, true, b.t);
        if (b.t > 0.65) { setState(b, 'lunge'); b.z0 = b.gz; a.play('MX_Dive', { loop: false, speed: a.duration('MX_Dive') / 0.5, fade: 0.05 }); }
      }
      else if (b.state === 'lunge') {
        const k = Math.min(1, b.t / 0.35);
        b.gz = b.z0 + (B.P.z - 2.6 - b.z0) * k;
        if (k >= 1) {
          B.warn(b.lane, 0, 0, false);
          B.dust.emit(b.x, 0.2, b.gz, 30, 0x8a7a68, 5, 3);
          if (b.lane === B.P.lane) { B.hurt(); setState(b, 'back'); }
          else champion.open(B, b);
        }
      }
      else if (b.state === 'windup') { // uyarıdan sonra savuruş; doğru hamle yapıldıysa ıskalar
        if (b.t > 0.5 && !b.swung) { b.swung = true; const c = ['MX_GS_Slash1', 'MX_GS_Attack', 'Sword_Attack'][b.n++ % 3]; a.play(c, { loop: false, speed: a.duration(c) / 0.45, fade: 0.05 }); }
        if (b.t > 0.5 && (b.atk === 'low' ? B.P.y > 0.5 : B.P.slide > 0)) b.dodged = true;
        if (b.t > 0.95) {
          if (b.dodged) champion.open(B, b);
          else { B.hurt(); setState(b, 'duel'); b.next = rand(0.9, 1.4); B.tap('SALDIRISINI BEKLE...'); a.play('MX_GS_Strafe', { fade: 0.2 }); }
        }
      }
      else if (b.state === 'open') { if (b.t > 1.5 || b.oh >= 2) { setState(b, 'back'); B.tap(null); } }
      else if (b.state === 'back') { // geri çekilir
        b.gz += (B.P.z - 13 - b.gz) * Math.min(1, dt * 4);
        if (b.t > 0.6) { setState(b, 'duel'); b.next = rand(0.7, 1.2); B.tap('SALDIRISINI BEKLE...'); a.play('MX_GS_Strafe', { fade: 0.2 }); }
      }
    },
    tap(B, b) { if (b.state !== 'open') return false; B.slashBoss(); return true; },
    arrow(B, b, ar) {
      if (b.state === 'open' && Math.abs(ar.x - b.x) < 1.3) { B.hitBoss(); return true; }
      B.sparks.emit(ar.x, ar.y, ar.z, 10, 0xfff2a0, 3, 2);
      return true;
    },
    hit(B, b) { b.oh++; },
    end(B) { B.warn(0, 0, 0, false); },
  };
}
champion.open = (B, b) => { setState(b, 'open'); b.oh = 0; B.tap('ŞİMDİ VUR!'); b.actor.play('MX_GS_Impact2', { loop: false, speed: 0.9, fade: 0.05 }); };

const korbasi = champion({ name: 'KÖRMÖS BAŞI', model: 'kormos', parts: ['Axe', 'Shield'], scale: 1.45 });
const suluaga = champion({ name: 'BATAKLIK AĞASI', model: 'sulu', scale: 1.5, idle: 'Zombie_Idle_Loop' });
const almasbey = champion({ name: 'ALMAS BEYİ', model: 'almas', scale: 1.55, idle: 'MX_GS_Idle3', hp: 5 });
const matman = champion({ name: 'HAYDUT MATMAN', model: 'sulmus', scale: 1.7, idle: 'MX_GS_Idle2', hp: 5 }); // Tüpken Kara Tamu'nun hükümdarı (Ögel s.435)
const yuzbasi = champion({ name: 'TANG YÜZBAŞISI', model: 'cinli', parts: ['Dao', 'Shield'], scale: 1.4 });
const itbasi = champion({ name: 'İT-BARAK BAŞBUĞU', model: 'itbarak', parts: ['Axe', 'Shield'], scale: 1.45, hp: 5 });

export const BOSSES = { tepegoz, albasti, yelbegen, erlik, karakus, general, kerey, demirhane, boyali, korbasi, suluaga, almasbey, matman, yuzbasi, itbasi };


