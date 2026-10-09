// PayPilot — interface layer (no dependencies)
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const ic = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const toast = (msg) => { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2800); };

  // nav
  const nav = $('.nav');
  const onScroll = () => { nav?.classList.toggle('is-solid', scrollY > 30); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('.burger')?.addEventListener('click', () => { const o = document.body.classList.toggle('menu-open'); $('.burger').setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; });
  $$('.sheet a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); document.body.style.overflow = ''; }));

  // reveals
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .14 });
  $$('.rv,.tile').forEach(el => io.observe(el));

  // cursor glow
  const glow = $('.cursor-glow');
  if (glow && !reduce) addEventListener('pointermove', (e) => { glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, { passive: true });

  // statement word reveal
  $$('[data-words]').forEach(el => {
    const hl = (el.dataset.hl || '').split('|');
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="${hl.some(h => h && w.toLowerCase().includes(h)) ? 'hl' : ''}">${w}</span>`).join(' ');
    const spans = $$('span', el);
    const upd = () => { const r = el.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35))); const n = Math.round(p * spans.length); spans.forEach((s, i) => s.classList.toggle('on', i < n)); };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
  });

  // tile spotlight
  $$('.tile').forEach(t => t.addEventListener('pointermove', (e) => { const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));

  // POS tilt on scroll
  const posWrap = $('.pos-wrap');
  if (posWrap && !reduce) {
    const pos = $('.pos', posWrap);
    const upd = () => { const r = posWrap.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .9))); pos.style.setProperty('--tilt', (1 - p).toFixed(3)); };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
  }

  // ---------- POS demo ----------
  const MENUS = {
    grocery: [['🍌', 'Bananas', .99, '/lb'], ['🍎', 'Apples', 1.49, '/lb'], ['🥑', 'Avocados', 1.29, ' ea'], ['🍅', 'Tomatoes', 1.49, '/lb'], ['🥬', 'Lettuce', 1.99, ' ea'], ['🥦', 'Broccoli', 1.99, ' ea'], ['🫑', 'Bell Peppers', 2.49, '/lb'], ['🧅', 'Onions', 1.19, '/lb'], ['🥔', 'Potatoes', .79, '/lb'], ['🥕', 'Carrots', .99, '/lb'], ['🍓', 'Strawberries', 3.99, ' ea'], ['🫐', 'Blueberries', 4.99, ' ea']],
    cafe: [['☕', 'Latte', 4.75, ''], ['🧋', 'Cold Brew', 4.25, ''], ['🍵', 'Matcha', 5.25, ''], ['🥐', 'Croissant', 3.5, ''], ['🥯', 'Bagel', 2.95, ''], ['🍩', 'Donut', 2.25, ''], ['🥪', 'Panini', 8.95, ''], ['🥗', 'Salad', 9.5, ''], ['🍪', 'Cookie', 2.5, ''], ['🧁', 'Cupcake', 3.75, ''], ['🥤', 'Smoothie', 6.5, ''], ['💧', 'Water', 1.95, '']],
    retail: [['👟', 'Sneakers', 89, ''], ['🧢', 'Cap', 24, ''], ['👕', 'Tee', 28, ''], ['🧥', 'Jacket', 120, ''], ['👜', 'Tote', 45, ''], ['🕶️', 'Shades', 38, ''], ['⌚', 'Watch', 149, ''], ['🧦', 'Socks', 12, ''], ['🎒', 'Backpack', 65, ''], ['🧣', 'Scarf', 32, ''], ['💍', 'Ring', 58, ''], ['🧴', 'Lotion', 16, '']],
  };
  const pos = $('[data-pos]');
  if (pos) {
    const grid = $('.pos__grid', pos), lines = $('.pos__lines', pos), payBtn = $('.pos__pay', pos), ov = $('.pos__overlay', pos);
    let menu = 'grocery', cart = [];
    const drawGrid = () => { grid.innerHTML = MENUS[menu].map((m, i) => `<button class="pos__item" type="button" data-i="${i}"><span class="emo">${m[0]}</span><b>${m[1]}</b><small>${money(m[2])}${m[3]}</small></button>`).join(''); };
    const draw = () => {
      if (!cart.length) lines.innerHTML = '<div class="pos__empty">Tap items to start a sale.</div>';
      else lines.innerHTML = cart.map(l => `<div class="pos__line"><span>${l.e} ${l.n}</span><span>×${l.q}</span><span>${money(l.p * l.q)}</span></div>`).join('');
      const sub = cart.reduce((a, l) => a + l.p * l.q, 0), qty = cart.reduce((a, l) => a + l.q, 0);
      const disc = qty >= 3 ? Math.min(sub * .07, 25) : 0, tax = (sub - disc) * .0525, tot = sub - disc + tax;
      $('[data-sub]', pos).textContent = money(sub); $('[data-tax]', pos).textContent = money(tax); $('[data-total]', pos).textContent = money(tot);
      const loyal = $('.pos__loyal', pos); loyal.hidden = !disc; $('[data-disc]', pos).textContent = '−' + money(disc);
      payBtn.disabled = !cart.length; payBtn.innerHTML = cart.length ? `Pay ${money(tot)} ${ic('arrow')}` : 'Add items to charge';
      lines.scrollTop = lines.scrollHeight; pos.dataset.total = tot;
    };
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.pos__item'); if (!b) return; const m = MENUS[menu][+b.dataset.i];
      const ex = cart.find(l => l.n === m[1]); ex ? ex.q++ : cart.push({ e: m[0], n: m[1], p: m[2], q: 1 }); draw();
    });
    $$('.pos__tabs button', pos).forEach(t => t.addEventListener('click', () => { menu = t.dataset.menu; $$('.pos__tabs button', pos).forEach(x => x.classList.toggle('on', x === t)); drawGrid(); }));
    $('[data-clear]', pos)?.addEventListener('click', () => { cart = []; draw(); });
    $$('.pos__actions button', pos).forEach(b => b.addEventListener('click', () => toast(`${b.textContent.trim()} — available in the full PayPilot POS`)));
    payBtn.addEventListener('click', () => {
      const tot = +pos.dataset.total;
      ov.innerHTML = `<div class="tapbox"><div class="rings"><i></i><i></i><i></i><svg class="icon"><use href="#i-wave"/></svg></div><h3>${money(tot)}</h3><p>Tap, insert or swipe</p></div>`; ov.classList.add('on');
      setTimeout(() => { ov.innerHTML = `<div class="tapbox"><div class="ok"><svg class="icon"><use href="#i-check"/></svg></div><h3>Approved</h3><p>${money(tot)} · Contactless · receipt sent</p></div>`; }, 1700);
      setTimeout(() => { ov.classList.remove('on'); cart = []; draw(); }, 3700);
    });
    drawGrid(); draw();
    // seed a sale so the demo never looks empty
    [[0, 1], [2, 2], [3, 1], [5, 1], [10, 1]].forEach(([i, q]) => { const m = MENUS.grocery[i]; cart.push({ e: m[0], n: m[1], p: m[2], q }); }); draw();
  }

  // ---------- Wallet demo ----------
  const w = $('[data-wallet]');
  if (w) {
    let amt = '25', balA = 1284.5, balB = 342.75;
    const out = $('.w-amt', w), send = $('.w-send', w), feed = $('.feed', w);
    const show = () => { out.textContent = '$' + (amt || '0'); send.textContent = `Send $${amt || '0'}`; };
    $$('.keypad button', w).forEach(k => k.addEventListener('click', () => {
      const v = k.dataset.k; if (v === 'del') amt = amt.slice(0, -1); else if (v === '.') { if (!amt.includes('.')) amt += amt ? '.' : '0.'; } else if (amt.replace('.', '').length < 6) { if (amt.includes('.') && amt.split('.')[1].length >= 2) return; amt = amt === '0' ? v : amt + v; }
      show();
    }));
    const notes = ['🍕 Pizza night', '🎟️ Concert tix', '⛽ Gas money', '🏠 Rent split', '🎂 Birthday gift', '☕ Coffee run'];
    send.addEventListener('click', () => {
      const n = parseFloat(amt); if (!n || n > balA) { toast(n > balA ? 'That’s more than the demo balance' : 'Enter an amount'); return; }
      const from = send.getBoundingClientRect(), to = $('.phone.b .w-bal', w).getBoundingClientRect();
      const orb = document.createElement('div'); orb.className = 'orb'; orb.textContent = '$'; document.body.appendChild(orb);
      const x0 = from.left + from.width / 2 - 27, y0 = from.top - 27, x1 = to.left + 40, y1 = to.top;
      const t0 = performance.now(), D = reduce ? 10 : 900;
      const fly = (t) => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e - Math.sin(k * Math.PI) * 160; orb.style.transform = `translate(${x}px,${y}px) scale(${1 - k * .4})`; if (k < 1) requestAnimationFrame(fly); else { orb.remove(); land(n); } };
      requestAnimationFrame(fly);
      balA -= n; $('.phone.a .w-bal', w).innerHTML = money(balA) + ' <small>balance</small>';
    });
    const land = (n) => {
      balB += n; $('.phone.b .w-bal', w).innerHTML = money(balB) + ' <small>balance</small>';
      const note = notes[(Math.random() * notes.length) | 0];
      feed.insertAdjacentHTML('afterbegin', `<div class="feed__item"><span class="av" style="background:linear-gradient(135deg,#A78BFA,#E879F9)">JD</span><p>Jordan paid you<small>${note} · just now</small></p><b class="plus">+${money(n)}</b></div>`);
      [...feed.children].slice(4).forEach(c => c.remove());
      toast(`Sent ${money(n)} to Riley — instantly`);
    };
    show();
  }

  // ---------- pricing calculator (illustrative) ----------
  const calc = $('[data-calc]');
  if (calc) {
    const vol = $('#c-vol'), tkt = $('#c-tkt'), rate = $('#c-rate');
    const run = () => {
      const v = +vol.value, t = +tkt.value, r = +rate.value / 100;
      $('#o-vol').textContent = '$' + v.toLocaleString(); $('#o-tkt').textContent = '$' + t; $('#o-rate').textContent = (r * 100).toFixed(2) + '%';
      const today = v * r * 12; $('#o-today').textContent = '$' + Math.round(today).toLocaleString();
      $('#o-txn').textContent = Math.round(v / t).toLocaleString(); $('#o-zero').textContent = '$' + Math.round(today).toLocaleString();
    };
    calc.addEventListener('input', run); run();
  }

  // ---------- get-started wizard ----------
  const gs = $('[data-wizard]');
  if (gs) {
    const steps = $$('.fstep', gs), bars = $$('.steps-bar i', gs); let i = 0;
    const go = (n) => { i = n; steps.forEach((s, k) => s.classList.toggle('on', k === i)); bars.forEach((b, k) => b.classList.toggle('on', k <= i)); };
    gs.addEventListener('click', (e) => {
      if (e.target.closest('[data-next]')) {
        const req = $$('[required]', steps[i]); const bad = req.find(x => x.type === 'radio' ? !$$(`[name="${x.name}"]`, steps[i]).some(r => r.checked) : !x.checkValidity());
        if (bad) { bad.focus?.(); toast('Please complete this step'); return; }
        go(Math.min(steps.length - 1, i + 1));
      }
      if (e.target.closest('[data-back]')) go(Math.max(0, i - 1));
    });
    gs.addEventListener('submit', (e) => {
      e.preventDefault();
      const agree = gs.querySelector('[name="agree"]');
      if (agree && !agree.checked) { agree.focus(); toast('Please agree to the Terms and Privacy Policy'); return; }
      const req = $$('[required]', steps[i]).filter(x => x.type !== 'checkbox');
      const bad = req.find(x => !x.checkValidity());
      if (bad) { bad.focus?.(); toast('Please complete this step'); return; }
      gs.hidden = true; $('#gs-done').hidden = false; scrollTo({ top: 0, behavior: 'smooth' });
    });
    go(0);
  }

  // blog hub: filter + search + load more
  const hub = $('[data-hub]');
  if (hub) {
    const cards = $$('.bcard', hub), chips = $$('.chip-f'), q = $('[data-hub-q]'), more = $('[data-hub-more]'), empty = $('[data-hub-empty]');
    let f = (location.hash || '#all').slice(1), lim = 21;
    const run = () => { const t = (q.value || '').toLowerCase(); let n = 0;
      cards.forEach(c => { const ok = (f === 'all' || c.dataset.topic === f) && (!t || c.textContent.toLowerCase().includes(t)); if (ok) n++; c.hidden = !ok || n > lim; c.classList.toggle('bcard--feature', ok && n === 1 && f === 'all' && !t); });
      more.hidden = n <= lim; empty.hidden = n > 0; chips.forEach(x => x.classList.toggle('on', x.dataset.f === f)); };
    chips.forEach(c => c.addEventListener('click', () => { f = c.dataset.f; lim = 21; history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f); run(); }));
    q.addEventListener('input', () => { lim = 21; run(); }); more.addEventListener('click', () => { lim += 21; run(); });
    if (!chips.some(c => c.dataset.f === f)) f = 'all'; run();
  }
  // article: share + TOC highlight
  $$('[data-share]').forEach(b => b.addEventListener('click', async () => { try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); toast('Link copied'); } } catch {} }));
  const tocLinks = $$('.toc a');
  if (tocLinks.length) { const heads = tocLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    addEventListener('scroll', () => { let cur = heads[0]; heads.forEach(h => { if (h.getBoundingClientRect().top < 140) cur = h; }); tocLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur.id)); }, { passive: true }); }

  // simple fake forms
  $$('form[data-fake]').forEach(f => f.addEventListener('submit', (e) => { e.preventDefault(); if (!f.checkValidity()) return f.reportValidity(); toast(f.dataset.fake); f.reset(); }));
})();
