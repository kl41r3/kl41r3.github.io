/* Pixel cat on the page.
   Sprites: "Cat 2D Pixel Art" (free version) by Mattz Art, https://xzany.itch.io/cat-2d-pixel-art
   recoloured here at load time into a grey British Shorthair with blue eyes.
   Click empty space to throw a ball of yarn; the cat goes and catches it. */
(() => {
  'use strict';
  const el = document.getElementById('cat');
  const cv = document.getElementById('cat-canvas');
  const yarnLayer = document.getElementById('yarns');
  if (!el || !cv || !yarnLayer) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FW = 80, FH = 64;                 // frame size in the sheets
  const GROUND = 48;                      // first empty row under the paws
  const HIT = { x: 13, y: 43 };           // where the attack lands (sprite faces left)
  const BASE = 'assets/cat/';
  const ANIMS = {
    idle:   { src: 'idle.png',   n: 8,  ms: 2800, loop: true },
    walk:   { src: 'walk.png',   n: 12, ms: 700,  loop: true },
    run:    { src: 'run.png',    n: 8,  ms: 450,  loop: true },
    attack: { src: 'attack.png', n: 8,  ms: 560,  loop: false }
  };
  const ATTACK_HIT = 330;                 // ms into the attack when the paw lands

  /* Orange tabby → grey British Shorthair. Eyes stay blue. */
  const RECOLOR = {
    e69c69: '8f94a0', f6ca9f: 'aab0bc', bf6f4a: '72777f', '8a4836': '50545e',
    ffffff: 'c9ccd4', c7cfdd: 'a9aeb9', '92a1b9': '868b97',
    f68187: 'e7a2ad', f5555d: 'dd8593', '891e2b': '6e3b47'
  };
  const EYE_D = '0069aa', EYE_L = '0098dc';
  const C = { lid: '#4c505a', fur: '#8f94a0' };

  /* ───────── Load + recolour sheets ───────── */
  const sheets = {};
  const hex = (r, g, b) => ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  function prepare(name, img) {
    const a = ANIMS[name];
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
    const alpha = new Uint8Array(c.width * c.height);
    const eyes = Array.from({ length: a.n }, () => ({ x: 99, y: 99 }));
    for (let p = 0, i = 0; i < d.length; i += 4, p++) {
      if (!d[i + 3]) continue;
      alpha[p] = 1;
      const h = hex(d[i], d[i + 1], d[i + 2]);
      if (h === EYE_D || h === EYE_L) {
        const x = p % c.width, y = (p / c.width) | 0, f = (x / FW) | 0, e = eyes[f];
        e.x = Math.min(e.x, x - f * FW); e.y = Math.min(e.y, y);
      }
      const to = RECOLOR[h];
      if (to) { d[i] = parseInt(to.slice(0, 2), 16); d[i + 1] = parseInt(to.slice(2, 4), 16); d[i + 2] = parseInt(to.slice(4, 6), 16); }
    }
    g.putImageData(id, 0, 0);
    sheets[name] = { canvas: c, alpha, width: c.width, eyes };
  }
  const loadAll = Promise.all(Object.keys(ANIMS).map(name => new Promise(res => {
    const img = new Image();
    img.onload = () => { prepare(name, img); res(true); };
    img.onerror = () => res(false);
    img.src = BASE + ANIMS[name].src;
  })));

  /* ───────── Render one frame ───────── */
  const ctx = cv.getContext('2d');
  cv.width = FW; cv.height = FH;
  ctx.imageSmoothingEnabled = false;
  let S = 3, lastKey = '', curAnim = 'idle', curFrame = 0;

  function px(x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
  function closedEyes(e) {
    const { x: x0, y: y0 } = e;
    ctx.fillStyle = C.fur;
    ctx.fillRect(x0, y0, 2, 3); ctx.fillRect(x0 + 6, y0, 3, 3);
    ctx.fillStyle = C.lid;
    ctx.fillRect(x0, y0 + 1, 2, 1); ctx.fillRect(x0 + 6, y0 + 1, 3, 1);
  }
  function render(anim, f, closed) {
    const k = `${anim}${f}|${closed}`;
    if (k === lastKey) return;
    lastKey = k; curAnim = anim; curFrame = f;
    const s = sheets[anim];
    ctx.clearRect(0, 0, FW, FH);
    ctx.drawImage(s.canvas, f * FW, 0, FW, FH, 0, 0, FW, FH);
    const e = s.eyes[f];
    if (closed && e.x <= 80) closedEyes(e);
  }

  /* Pixel-accurate hit test against the frame on screen */
  function overCat(cx, cy) {
    const s = sheets[curAnim];
    if (!s) return false;
    let lx = (cx - st.x) / S, ly = (cy - st.y) / S;
    if (st.facing > 0) lx = FW - lx;          // sprite art faces left
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
      const x = Math.floor(lx) + ox, y = Math.floor(ly) + oy;
      if (x < 0 || y < 0 || x >= FW || y >= FH) continue;
      if (s.alpha[y * s.width + curFrame * FW + x]) return true;
    }
    return false;
  }

  /* ───────── Yarn (drawn in code) ───────── */
  const YW = 11, YH = 10;
  const YARN = (() => {
    const c = document.createElement('canvas'); c.width = YW; c.height = YH;
    const g = c.getContext('2d');
    const P = { o: '#5e2c3c', y: '#d97a95', d: '#a24d67', h: '#f3b7c6' };
    const rows = [
      '..ooooo....',
      '.oyyhyyo...',
      'oyhhydyyo..',
      'oyhydyydo..',
      'oyydyydyo..',
      'oydyydyyo..',
      'oyydyyddo..',
      '.oyyddyo...',
      '..ooooo.dd.',
      '.........dd'
    ];
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (P[ch]) { g.fillStyle = P[ch]; g.fillRect(x, y, 1, 1); } }));
    return c;
  })();

  /* ───────── State ───────── */
  const st = {
    x: 0, y: 0, facing: -1,                 // -1 = facing left (sprite default)
    mode: 'enter', t0: 0, run: false, target: null, attackFace: -1, hitDone: false,
    hover: false, lastPoke: performance.now()
  };
  const toys = [];
  let cur = null;

  const cw = () => FW * S, ch = () => FH * S;
  const vw = () => document.documentElement.clientWidth || innerWidth;   // excludes the scrollbar
  const home = () => ({ x: vw() - 55 * S - 16, y: innerHeight - GROUND * S - 6 });
  const clampX = x => Math.max(-18 * S, Math.min(vw() - 56 * S, x));
  const clampY = y => Math.max(-18 * S, Math.min(innerHeight - GROUND * S - 2, y));

  function applyScale() {
    S = innerWidth < 600 ? 2 : 3;
    cv.style.width = cw() + 'px';
    cv.style.height = ch() + 'px';
  }
  function place() {
    el.style.transform = `translate3d(${Math.round(st.x)}px, ${Math.round(st.y)}px, 0) scaleX(${st.facing > 0 ? -1 : 1})`;
  }

  function throwYarn(cx, cy) {
    if (toys.length >= 4) return;
    const c = document.createElement('canvas');
    c.className = 'yarn';
    c.width = YW; c.height = YH;
    c.getContext('2d').drawImage(YARN, 0, 0);
    c.style.width = YW * S + 'px'; c.style.height = YH * S + 'px';
    yarnLayer.appendChild(c);
    const mouthX = st.facing > 0 ? FW - 26 : 26;
    const fromX = st.x + mouthX * S, fromY = st.y + 30 * S;
    const toX = Math.max(10 * S, Math.min(vw() - 10 * S, cx));
    const toY = Math.max(10 * S, Math.min(innerHeight - 8 * S, cy));
    const t = { el: c, phase: 'fly', t0: performance.now(), fromX, fromY, toX, toY, x: fromX, y: fromY, rot: 0, s: 1 };
    toys.push(t);
    placeYarn(t);
    st.lastPoke = performance.now();
  }
  function placeYarn(t) {
    t.el.style.transform = `translate3d(${Math.round(t.x - 4.5 * S)}px, ${Math.round(t.y - 4.5 * S)}px, 0) rotate(${t.rot}deg) scale(${t.s})`;
  }
  function updateYarn(now) {
    for (let i = toys.length - 1; i >= 0; i--) {
      const t = toys[i];
      if (t.phase === 'fly') {
        const k = Math.min(1, (now - t.t0) / 520), e = k * (2 - k);
        t.x = t.fromX + (t.toX - t.fromX) * e;
        t.y = t.fromY + (t.toY - t.fromY) * e - Math.sin(Math.PI * k) * 72;
        t.rot = (Math.floor((now - t.t0) / 70) % 4) * 90;
        if (k >= 1) { t.phase = 'landed'; t.x = t.toX; t.y = t.toY; t.rot = 0; }
        placeYarn(t);
      } else if (t.phase === 'hit') {
        const k = Math.min(1, (now - t.hitAt) / 250);
        t.s = 1 - .6 * k;
        t.el.style.opacity = String(1 - k);
        placeYarn(t);
        if (k >= 1) { t.el.remove(); toys.splice(i, 1); }
      }
    }
  }

  /* ───────── Behaviour ───────── */
  function chase(t, now) {
    cur = t; t.phase = 'chased';
    const catCX = st.x + 40 * S;
    const face = t.x >= catCX ? 1 : -1;
    st.attackFace = face;
    const hitX = face > 0 ? FW - HIT.x : HIT.x;
    st.target = { x: clampX(t.x - hitX * S), y: clampY(t.y - HIT.y * S) };
    const d = Math.hypot(st.target.x - st.x, st.target.y - st.y);
    st.run = d > .3 * Math.min(vw(), innerHeight);
    st.mode = 'move'; st.t0 = now;
  }
  function goHome(now) {
    cur = null; st.target = home(); st.run = false;
    st.mode = 'move'; st.t0 = now;
  }
  const nextToy = () => toys.find(t => t.phase === 'landed');

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(50, now - last); last = now;
    updateYarn(now);

    const pending = nextToy();
    if (pending && !cur && st.mode !== 'attack') chase(pending, now);

    if (st.mode === 'enter' || st.mode === 'move') {
      const tg = st.mode === 'enter' ? home() : st.target;
      const dx = tg.x - st.x, dy = tg.y - st.y, d = Math.hypot(dx, dy);
      const speed = (st.run ? 400 : 190) * S / 3 / 1000;
      if (Math.abs(dx) > .5) st.facing = dx > 0 ? 1 : -1;
      if (d <= speed * dt || d < 1) {
        st.x = tg.x; st.y = tg.y;
        if (cur) { st.facing = st.attackFace; st.mode = 'attack'; st.t0 = now; st.hitDone = false; }
        else { st.mode = 'sit'; st.t0 = now; }
      } else {
        st.x += dx / d * speed * dt; st.y += dy / d * speed * dt;
      }
    } else if (st.mode === 'attack') {
      const t = now - st.t0;
      if (!st.hitDone && t >= ATTACK_HIT && cur) {
        st.hitDone = true; cur.phase = 'hit'; cur.hitAt = now;
      }
      if (t >= ANIMS.attack.ms) {
        cur = null;
        const n = nextToy();
        if (n) chase(n, now); else { st.mode = 'linger'; st.t0 = now; }
      }
    } else if (st.mode === 'linger') {
      if (now - st.t0 > 2400) goHome(now);
    } else if (st.mode === 'sit') {
      const h = home();
      if (Math.abs(st.x - h.x) > 2 || Math.abs(st.y - h.y) > 2) goHome(now);
      else if (now - st.lastPoke > 45000) { st.mode = 'sleep'; st.t0 = now; }
    }

    draw(now);
    place();
    requestAnimationFrame(tick);
  }

  function frameOf(anim, t) {
    const a = ANIMS[anim];
    const f = Math.floor(t / (a.ms / a.n));
    return a.loop ? f % a.n : Math.min(a.n - 1, f);
  }
  function draw(now) {
    const m = st.mode;
    if (m === 'move' || m === 'enter') {
      const a = st.run ? 'run' : 'walk';
      render(a, frameOf(a, now - st.t0), false);
    } else if (m === 'attack') {
      render('attack', frameOf('attack', now - st.t0), false);
    } else if (m === 'sleep') {
      render('idle', 3, true);
    } else {
      render('idle', frameOf('idle', now), false);
    }
  }

  /* ───────── Input ───────── */
  const INTERACTIVE = 'a, button, input, select, textarea, label, summary, pre, .bib-wrap, [contenteditable], [role="button"]';
  const wake = () => { if (st.mode === 'sleep') { st.mode = 'sit'; st.t0 = performance.now(); } };

  addEventListener('pointermove', e => {
    const over = overCat(e.clientX, e.clientY);
    if (over !== st.hover) {
      st.hover = over;
      document.documentElement.classList.toggle('cat-hover', over);
      if (over) { wake(); st.lastPoke = performance.now(); }
    }
  }, { passive: true });

  document.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (overCat(e.clientX, e.clientY)) {
      e.preventDefault(); e.stopPropagation();
      st.lastPoke = performance.now();
      wake();
      return;
    }
    if (reduced) return;
    if (e.target.closest && e.target.closest(INTERACTIVE)) return;
    const sel = getSelection && getSelection();
    if (sel && !sel.isCollapsed && String(sel).trim()) return;
    wake();
    throwYarn(e.clientX, e.clientY);
  }, true);

  addEventListener('resize', () => {
    applyScale();
    toys.forEach(t => { t.el.style.width = YW * S + 'px'; t.el.style.height = YH * S + 'px'; });
    if (st.mode === 'sit' || st.mode === 'sleep') { const h = home(); st.x = h.x; st.y = h.y; }
    else { st.x = clampX(st.x); st.y = clampY(st.y); }
    place();
  });

  /* ───────── Start ───────── */
  const style = document.createElement('style');
  style.textContent = 'html.cat-hover, html.cat-hover * { cursor: pointer !important; }';
  document.head.appendChild(style);
  applyScale();

  loadAll.then(ok => {
    if (ok.includes(false)) return;
    const h = home();
    if (reduced) {
      st.x = h.x; st.y = h.y; st.mode = 'sit';
      render('idle', 0, false); place();
      el.classList.add('is-ready');
      return;
    }
    st.x = innerWidth + 10; st.y = h.y; st.facing = -1;
    place();
    el.classList.add('is-ready');
    requestAnimationFrame(t => { last = t; tick(t); });
  });

  window.cat = { state: st, throwYarn, overCat };
})();
