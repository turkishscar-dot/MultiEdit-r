(() => {
  const V = window.VERI, $ = id => document.getElementById(id);
  const al = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const koy = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  let dil = al('ok-dil', (navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en');
  const L = () => (dil === 'tr' ? 0 : 1);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const yildiz = n => '★'.repeat(n);
  const YAKINDA = ['YAKINDA', 'COMING SOON'];

  // oyundan kareler
  const KARELER = [['b1', 'Ötüken Surları', 'Walls of Ötüken'], ['b4', "Gök Yolu: Tulpar'la uçuş", 'The Sky Road: flying on Tulpar'], ['b6', 'Esir Türkler', 'The Captive Turks'],
    ['b3', 'Altay', 'Altai'], ['b5', 'Yeraltı', 'The Underworld'], ['b2', 'Kara Bataklık', 'The Black Marsh']];
  function kareler() {
    const k = $('kareler'); k.replaceChildren();
    for (const [id, tr, en] of KARELER) {
      const f = el('figure', 'kare gizli'), i = el('img');
      i.src = `img/ekran/${id}.jpg`; i.alt = [tr, en][L()]; i.loading = 'lazy'; i.width = 1280; i.height = 720;
      f.append(i, el('figcaption', null, [tr, en][L()])); k.append(f);
    }
  }

  // yiğitler
  let grup = 'hepsi';
  function filtre() {
    const f = $('filtre'); f.replaceChildren();
    const ekle = (id, ad) => { const b = el('button', null, ad); b.type = 'button'; b.setAttribute('aria-pressed', String(grup === id)); b.onclick = () => { grup = id; filtre(); kartlar(); }; f.append(b); };
    ekle('hepsi', ['Hepsi', 'All'][L()]);
    for (const [id, ad] of Object.entries(V.gruplar)) ekle(id, ad[L()]);
  }
  function kartlar() {
    const k = $('kartlar'); k.replaceChildren();
    for (const y of V.yigitler) {
      if (grup !== 'hepsi' && y.g !== grup) continue;
      const b = el('button', 'kart'); b.type = 'button';
      const i = el('img'); i.src = `img/yigit/${y.id}.jpg`; i.alt = y.ad[L()]; i.loading = 'lazy'; i.width = 720; i.height = 450;
      const bilgi = el('span', 'bilgi'); bilgi.append(el('b', null, y.ad[L()]), el('small', null, y.un[L()]));
      b.append(i, el('span', 'yildiz', yildiz(y.y)), bilgi);
      if (y.g === 'bayram') b.append(el('span', 'etiket', ['Bayram', 'Festival'][L()]));
      b.onclick = () => pencere(y);
      k.append(b);
    }
  }
  function pencere(y) {
    $('p-resim').src = `img/yigit/${y.id}.jpg`; $('p-resim').alt = y.ad[L()];
    $('p-yildiz').textContent = yildiz(y.y) + '  ·  ' + V.gruplar[y.g][L()];
    $('p-ad').textContent = y.ad[L()]; $('p-unvan').textContent = y.un[L()]; $('p-metin').textContent = y.t[L()];
    const d = $('pencere'); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  $('kapat').onclick = () => $('pencere').close();
  $('pencere').addEventListener('click', e => { if (e.target === $('pencere')) $('pencere').close(); });

  // bölümler
  function kisimlar() {
    const k = $('kisimlar'); k.replaceChildren();
    for (const ks of V.kisimlar) {
      const d = el('div', 'kisim gizli'), h = el('h3', null, ks.ad[L()]); h.append(el('small', null, ks.alt[L()]));
      const ul = el('ul', 'bolum-listesi');
      for (const b of ks.bolumler) {
        const li = el('li', b.yakinda ? 'yakinda' : null);
        if (b.ekran) { const i = el('img'); i.src = `img/ekran/${b.ekran}.jpg`; i.alt = b.ad[L()]; i.loading = 'lazy'; i.width = 1280; i.height = 720; li.append(i); }
        else li.append(el('div', 'resim', String(b.n)));
        const y = el('div', 'yazi'), no = el('span', 'no', (['BÖLÜM ', 'CHAPTER '][L()]) + b.n);
        if (b.yakinda) li.dataset.yakinda = no.dataset.yakinda = YAKINDA[L()];
        y.append(no, el('b', null, b.ad[L()]), el('small', null, 'Boss: ' + b.boss[L()]));
        li.append(y); ul.append(li);
      }
      d.append(h, ul); k.append(d);
    }
  }

  // dil
  function dilUygula() {
    document.documentElement.lang = dil;
    $('dil').textContent = dil === 'tr' ? 'EN' : 'TR';
    for (const e of document.querySelectorAll('[data-en]')) {
      if (e.dataset.tr == null) e.dataset.tr = e.innerHTML;
      e.innerHTML = dil === 'en' ? e.dataset.en : e.dataset.tr;
    }
    for (const e of document.querySelectorAll('[data-en-alt]')) {
      if (e.dataset.trAlt == null) e.dataset.trAlt = e.alt;
      e.alt = dil === 'en' ? e.dataset.enAlt : e.dataset.trAlt;
    }
    document.title = dil === 'en' ? 'Oğuz Kağan · An Epic Runner' : 'Oğuz Kağan · Destan Koşusu';
    filtre(); kartlar(); kisimlar(); kareler(); goster();
  }
  $('dil').onclick = () => { dil = dil === 'tr' ? 'en' : 'tr'; koy('ok-dil', dil); dilUygula(); };

  // menü
  const menu = $('menu'), hb = $('hamburger');
  hb.onclick = () => { const a = menu.classList.toggle('acik'); hb.setAttribute('aria-expanded', String(a)); };
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('acik'); hb.setAttribute('aria-expanded', 'false'); } });
  const ust = $('ust'), kaydir = () => ust.classList.toggle('dolu', scrollY > 40);
  addEventListener('scroll', kaydir, { passive: true }); kaydir();

  // belirerek gelme
  let io = null;
  function goster() {
    for (const e of document.querySelectorAll('.ozellikler .panel, .yol li, .alinti')) e.classList.add('gizli');
    const hepsi = document.querySelectorAll('.gizli:not(.gorundu)');
    if (!('IntersectionObserver' in window)) { hepsi.forEach(e => e.classList.add('gorundu')); return; }
    io ??= new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('gorundu'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    hepsi.forEach(e => io.observe(e));
  }

  dilUygula();
})();
