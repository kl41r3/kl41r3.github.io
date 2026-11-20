/* Theme toggle, section highlight, BibTeX, paw-print trail. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ── */
  $('#theme-toggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ── Sidebar: highlight the section in view ── */
  const links = new Map($$('.toc a').map(a => [a.getAttribute('href').slice(1), a]));
  if (links.size && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('is-active'));
        links.get(e.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ── Copy helper ── */
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove(); return ok;
    }
  }

  /* ── BibTeX: toggle + copy ── */
  $$('.pub').forEach(pub => {
    const btn = $('.b-bib', pub);
    const pre = $('.bib', pub);
    if (!btn || !pre) return;
    const wrap = document.createElement('div');
    wrap.className = 'bib-wrap';
    wrap.hidden = true;
    pre.hidden = false;
    pre.replaceWith(wrap);
    wrap.appendChild(pre);
    const cp = document.createElement('button');
    cp.type = 'button'; cp.className = 'bib-copy'; cp.textContent = 'Copy';
    wrap.appendChild(cp);

    btn.addEventListener('click', () => {
      wrap.hidden = !wrap.hidden;
      btn.setAttribute('aria-expanded', String(!wrap.hidden));
    });
    cp.addEventListener('click', async () => {
      const ok = await copy(pre.textContent);
      cp.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(() => { cp.textContent = 'Copy'; }, 1400);
    });
  });

  /* ── Paw-print trail (mouse only) ── */
  const layer = $('#paws');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (layer && fine && !reduced()) {
    const SVGNS = 'http://www.w3.org/2000/svg';
    const PAW = '<ellipse cx="12" cy="15.5" rx="5" ry="4.3"/><ellipse cx="5.2" cy="9.6" rx="2" ry="2.6"/><ellipse cx="9.6" cy="5.6" rx="2" ry="2.7"/><ellipse cx="14.4" cy="5.6" rx="2" ry="2.7"/><ellipse cx="18.8" cy="9.6" rx="2" ry="2.6"/>';
    const POOL = 18;
    const pool = [];
    for (let i = 0; i < POOL; i++) {
      const s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('viewBox', '0 0 24 24');
      s.setAttribute('class', 'paw');
      s.innerHTML = PAW;
      layer.appendChild(s);
      pool.push(s);
    }
    let idx = 0, side = 1;
    let lx = null, ly = null, acc = 0;
    const STEP = 30;          // px between prints
    const SPREAD = 5;         // left/right offset from the path

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const x = e.clientX, y = e.clientY;
      if (lx === null) { lx = x; ly = y; return; }
      const dx = x - lx, dy = y - ly;
      const d = Math.hypot(dx, dy);
      if (d > 200) { lx = x; ly = y; acc = 0; return; }   // jumped (e.g. re-entered window)
      acc += d;
      if (acc >= STEP && d > 0) {
        acc = 0;
        const ux = dx / d, uy = dy / d;
        side = -side;
        const px = x - uy * SPREAD * side;
        const py = y + ux * SPREAD * side;
        const deg = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        const el = pool[idx++ % POOL];
        el.classList.remove('on');
        el.style.transform = `translate(${px}px, ${py}px) rotate(${deg}deg)`;
        void el.getBoundingClientRect();
        el.classList.add('on');
      }
      lx = x; ly = y;
    }, { passive: true });
    document.addEventListener('mouseleave', () => { lx = null; });
  }
})();
