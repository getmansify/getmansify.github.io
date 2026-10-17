// Mansify site: shared behaviour for every page.
(function () {
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Storage can be blocked (private mode, previews), so every access is guarded.
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- language: saved choice, else the browser's language ---------- */
  const titles = { en: document.body.dataset.titleEn, ar: document.body.dataset.titleAr };
  const langListeners = [];
  const setLang = (l) => {
    root.lang = l; root.dir = l === 'ar' ? 'rtl' : 'ltr';
    if (titles[l]) document.title = titles[l];
    langListeners.forEach((f) => f(l));
  };
  const savedLang = get('mansify-lang');
  setLang(savedLang === 'ar' || savedLang === 'en' ? savedLang : ((navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en'));
  $('#lang')?.addEventListener('click', () => { const l = root.lang === 'ar' ? 'en' : 'ar'; setLang(l); put('mansify-lang', l); });

  /* ---------- theme: follows the system until the visitor picks one ---------- */
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = get('mansify-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;
  const syncMode = () => { root.dataset.mode = root.dataset.theme || (dark.matches ? 'dark' : 'light'); };
  dark.addEventListener('change', syncMode); syncMode();
  $('#theme')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.mode === 'dark' ? 'light' : 'dark';
    put('mansify-theme', root.dataset.theme); syncMode();
  });

  /* ---------- word-by-word headlines and letter-by-letter wordmark ---------- */
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = p; frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('en') || n.classList.contains('ar')) i = 0; // each language starts its own count
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  });
  $$('.wordmark').forEach((el) => {
    const word = el.textContent.trim(); el.textContent = '';
    [...word].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'l'; s.style.setProperty('--i', i); s.textContent = ch; el.appendChild(s); });
  });

  /* ---------- reveal on scroll ---------- */
  const items = $$('.rv, .wordmark, .rules, .head');
  if ('IntersectionObserver' in window && !calm) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add('in'));

  /* ---------- scroll: progress bar, header, hero depth ---------- */
  const nav = $('#nav'), bar = $('.progress'), frame = $('.stage .frame');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (nav) { nav.classList.toggle('solid', y > 40); nav.classList.toggle('hide', y > 400 && y > lastY + 4); if (y < lastY - 4) nav.classList.remove('hide'); }
    if (frame && !calm) frame.style.setProperty('--rx', Math.max(0, 8 - y / 40).toFixed(2) + 'deg');
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if (finePointer && !calm) {
    /* hero: soft light follows the cursor, floating cards drift away from it */
    const hero = $('.hero');
    if (hero) {
      const spot = document.createElement('div'); spot.className = 'spot'; hero.prepend(spot);
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        hero.style.setProperty('--sx', x + 'px'); hero.style.setProperty('--sy', y + 'px');
        const dx = (x / r.width - .5), dy = (y / r.height - .5);
        $$('.float', hero).forEach((f, k) => { const d = (k % 2 ? -1 : 1) * (10 + k * 4); f.style.setProperty('--fx', (dx * d).toFixed(1) + 'px'); f.style.setProperty('--fy', (dy * d).toFixed(1) + 'px'); });
      });
    }
    /* spotlight on cards */
    $$('.spot-card').forEach((c) => c.addEventListener('mousemove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--cx', (e.clientX - r.left) + 'px'); c.style.setProperty('--cy', (e.clientY - r.top) + 'px');
    }));
    /* magnetic buttons */
    $$('.btn, .mail .circ').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + 'px');
      });
      b.addEventListener('mouseleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
    /* product page screenshot tilts toward the cursor */
    $$('.p-shot').forEach((s) => {
      s.addEventListener('mousemove', (e) => {
        const r = s.getBoundingClientRect();
        s.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 10).toFixed(2) + 'deg');
        s.style.setProperty('--rx2', ((.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2) + 'deg');
      });
      s.addEventListener('mouseleave', () => { s.style.removeProperty('--ry'); s.style.removeProperty('--rx2'); });
    });
  }

  /* ---------- icon stroke demo: plays by itself until someone touches the slider ---------- */
  $$('.outlined svg').forEach((svg) => { // outlined look: a thick line with a thinner "hole" line on top
    [...svg.children].forEach((n) => { const c = n.cloneNode(); c.classList.add('inner'); svg.appendChild(c); });
  });
  $$('[data-stroke]').forEach((box) => {
    const input = $('input', box), out = $('output', box), icons = $(box.dataset.stroke);
    if (!input || !icons) return;
    const draw = () => { icons.style.setProperty('--sw', input.value); out.textContent = Number(input.value).toFixed(2) + ' px'; };
    input.addEventListener('input', draw); draw();
    if (calm) return;
    let auto = true, t = 0, seen = false;
    const stop = () => { auto = false; };
    input.addEventListener('pointerdown', stop); input.addEventListener('keydown', stop);
    new IntersectionObserver((es) => { seen = es[0].isIntersecting; }).observe(box);
    const min = +input.min, max = +input.max;
    const loop = () => {
      if (auto && seen) { t += 0.012; input.value = (min + (max - min) * (0.5 - 0.5 * Math.cos(t))).toFixed(2); draw(); }
      if (auto) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  /* ---------- Prompt Batch prices: same file the extension reads ---------- */
  const priceBox = $('[data-prices]');
  const CHECKOUT = 'https://checkout.freemius.com/app/41752/plan/72512/';
  if (priceBox) {
    let p = null;
    const render = (l) => {
      if (!p) return;
      const m = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
      const ends = /^\d{4}-\d{2}-\d{2}$/.test(p.launchEnds || '') ? Date.parse(p.launchEnds + 'T23:59:59Z') : NaN;
      const done = p.launchLeft === 0 || (!isNaN(ends) && Date.now() > ends);
      const launch = !done && p.coupon && p.off ? Math.round(p.lifetime * (100 - p.off)) / 100 : null;
      const set = (k, v) => $$('[data-p="' + k + '"]').forEach((e) => { if (v === null) e.hidden = true; else { e.hidden = false; e.textContent = v; } });
      set('monthly', m(p.monthly)); set('off', String(p.off));
      set('now', m(launch == null ? p.lifetime : launch));
      set('was', launch == null ? null : m(p.lifetime));
      $$('[data-p="offer"]').forEach((e) => { e.hidden = launch == null; });
      const seats = $('[data-p="seats"]');
      const count = Number.isInteger(p.launchTotal) && Number.isInteger(p.launchLeft) && p.launchTotal > 0;
      if (seats) {
        seats.hidden = !(launch != null && (count || !isNaN(ends)));
        $('[data-p="seatsText"]', seats).textContent = count ? (l === 'ar' ? 'بقي ' + p.launchLeft + ' من ' + p.launchTotal + ' قسيمة إطلاق' : p.launchLeft + ' of ' + p.launchTotal + ' launch coupons left') : '';
        $('[data-p="seatsEnd"]', seats).textContent = isNaN(ends) ? '' : (l === 'ar' ? 'ينتهي ' : 'Ends ') + new Date(ends).toLocaleDateString(l === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
        $('.bar', seats).hidden = !count;
        if (count) $('.bar i', seats).style.width = Math.round((p.launchLeft / p.launchTotal) * 100) + '%';
      }
      buy(launch != null ? p.coupon : '');
    };
    // Buy buttons → Freemius checkout. Closed (data-sales="soon") until the Web Store approves the extension.
    const buy = (coupon) => {
      const open = priceBox.dataset.sales === 'open';
      $$('[data-buy]', priceBox).forEach((b) => {
        b.classList.toggle('is-soon', !open);
        if (!open) { b.removeAttribute('href'); b.setAttribute('aria-disabled', 'true'); return; }
        const cycle = b.dataset.buy;
        b.href = CHECKOUT + '?billing_cycle=' + cycle + (cycle === 'lifetime' && coupon ? '&coupon=' + encodeURIComponent(coupon) : '');
        b.removeAttribute('aria-disabled');
      });
    };
    buy('');
    fetch(priceBox.dataset.prices, { cache: 'no-cache' }).then((r) => r.json()).then((j) => { p = j; render(root.lang); }).catch(() => {});
    langListeners.push(render);
  }
})();

// Legal pages: highlight the section being read in the side list.
(function () {
  const links = [...document.querySelectorAll('.legal .toc a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-30% 0px -60% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
})();

/* ---------- shared layout (tools/layout.py, 2026-10-17): products menu + product bar section highlight ---------- */
(() => {
  const btn = document.getElementById('pmBtn'), panel = document.getElementById('pmPanel');
  if (btn && panel) {
    const set = (open) => { btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(panel.hidden); });
    document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  }
  const tabs = [...document.querySelectorAll('.pb-tabs a')];
  const here = location.pathname.split('/').pop() || 'index.html';
  tabs.forEach((a) => { const [file, hash] = a.getAttribute('href').split('#'); if (!hash && file === here) a.classList.add('on'); });
  const secs = tabs.map((a) => { const [file, hash] = a.getAttribute('href').split('#'); return hash && (file === here || (here === '' && file === 'index.html')) ? [a, document.getElementById(hash)] : null; }).filter((x) => x && x[1]);
  if (secs.length) {
    // the tab of the last section whose top has passed under the bars is marked
    const mark = () => { let cur = null; secs.forEach((x) => { if (x[1].getBoundingClientRect().top < 200) cur = x[0]; });
      tabs.forEach((t) => t.classList.toggle('on', t === cur)); };
    addEventListener('scroll', mark, { passive: true }); mark();
  }
})();

/* ---------- pinned product header (tools/layout.py, 2026-10-17) ----------
   Main product page: the header shrinks once you scroll (on at 140px, off at 20px). Its space is kept fixed, so shrinking
   never changes the page height (that is what made the scroll freeze). Tabs mark the section in view. */
(() => {
  const b = document.body, sec = document.querySelector('.phead');
  if (!sec || b.classList.contains('phead-fixed')) return;
  const tabs = [...document.querySelectorAll('.ph-tabs a')];
  const ids = tabs.map((a) => (a.getAttribute('href').split('#')[1] || '')).filter((id) => id && id !== 'top' && document.getElementById(id));
  const keep = () => { if (b.classList.contains('past-head')) return; sec.style.height = ''; sec.style.height = sec.offsetHeight + 'px'; };
  keep(); addEventListener('resize', keep); if (document.fonts) document.fonts.ready.then(keep);
  const tick = () => {
    const y = scrollY, on = b.classList.contains('past-head');
    if (!on && y > 140) b.classList.add('past-head'); else if (on && y < 20) b.classList.remove('past-head');
    let cur = 'top'; ids.forEach((id) => { if (document.getElementById(id).getBoundingClientRect().top < 240) cur = id; });
    tabs.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
  };
  addEventListener('scroll', tick, { passive: true }); tick();
})();
