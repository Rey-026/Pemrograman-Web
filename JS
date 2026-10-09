/* ============================================================
   Tokyo Blog – main.js
   ============================================================ */

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── 1. Nav ─────────────────────────────────────────────── */
function buildNav() {
  const links = [
    { href: 'index.html',   label: 'Home',    icon: '🗾' },
    { href: 'explore.html', label: 'Explore', icon: '🍜' },
    { href: 'video.html',   label: 'Video',   icon: '🎬' },
    { href: 'maps.html',    label: 'Map',     icon: '🗺️'  },
  ];
  const current = location.pathname.split('/').pop() || 'index.html';

  /* Remove old plain-text nav links */
  qsa('body > a').forEach(a => a.remove());

  const nav = document.createElement('nav');
  nav.id = 'site-nav';
  nav.innerHTML = `
    <div class="nav-inner">
      <span class="nav-logo">東京</span>
      <div class="nav-links">
        ${links.map(l => `
          <a href="${l.href}" class="nav-link${l.href === current ? ' active' : ''}">
            <span class="nav-icon">${l.icon}</span>
            <span class="nav-text">${l.label}</span>
          </a>
        `).join('')}
      </div>
      <button class="nav-burger" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-drawer">
      ${links.map(l => `
        <a href="${l.href}" class="drawer-link${l.href === current ? ' active' : ''}">
          ${l.icon} ${l.label}
        </a>
      `).join('')}
    </div>
  `;
  document.body.prepend(nav);

  const burger = qs('.nav-burger', nav);
  const drawer = qs('.nav-drawer', nav);
  burger.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.classList.toggle('is-open', open);
  });

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── 2. Scroll-reveal ───────────────────────────────────── */
function initReveal() {
  const els = qsa('h1:not(.hero-title), h2, h3, p:not(.hero-eyebrow):not(.hero-sub), img:not(.hero-img), table, iframe, ul, .card-grid, .season-grid, .landmark-grid, .cta-strip, .info-card, .season-card, .landmark-card, .video-tips');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach((el, i) => {
    el.classList.add('will-reveal');
    el.style.transitionDelay = `${(i % 5) * 60}ms`;
    io.observe(el);
  });
}

/* ── 3. Lightbox ────────────────────────────────────────── */
function initLightbox() {
  const overlay = document.createElement('div');
  overlay.id = 'lightbox';
  overlay.innerHTML = `
    <button class="lb-close" aria-label="Close">&times;</button>
    <img class="lb-img" src="" alt="">
    <p class="lb-caption"></p>
  `;
  document.body.appendChild(overlay);

  const lbImg     = qs('.lb-img', overlay);
  const lbCaption = qs('.lb-caption', overlay);

  function open(img) {
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = img.alt;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  qsa('img:not(.hero-img)').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => open(img));
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.classList.contains('lb-close')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ── 4. Sakura canvas ───────────────────────────────────── */
function initSakura() {
  const canvas = document.createElement('canvas');
  canvas.id = 'sakura-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, petals = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const COLORS = ['#f2a7c3','#f7c5d8','#e88fb0','#fde8f0','#f9d0e3'];

  class Petal {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x    = Math.random() * W;
      this.y    = initial ? Math.random() * H : -20;
      this.r    = 4 + Math.random() * 7;
      this.vx   = -0.5 + Math.random() * 1;
      this.vy   = 0.6 + Math.random() * 1.2;
      this.tilt = Math.random() * Math.PI * 2;
      this.dtilt= 0.02 + Math.random() * 0.04;
      this.alpha= 0.5 + Math.random() * 0.5;
      this.color= COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x    += this.vx + Math.sin(this.y / 60) * 0.4;
      this.y    += this.vy;
      this.tilt += this.dtilt;
      if (this.y > H + 20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.tilt);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const COUNT = Math.min(55, Math.floor(W / 22));
  for (let i = 0; i < COUNT; i++) petals.push(new Petal());

  let rafId;
  function loop() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach(p => { p.update(); p.draw(); });
    rafId = requestAnimationFrame(loop);
  }
  loop();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else loop();
  });
}

/* ── 5. Page transitions ────────────────────────────────── */
function initPageTransitions() {
  const curtain = document.createElement('div');
  curtain.id = 'page-curtain';
  document.body.appendChild(curtain);

  requestAnimationFrame(() => { curtain.classList.add('leaving'); });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
    e.preventDefault();
    curtain.classList.remove('leaving');
    curtain.classList.add('entering');
    setTimeout(() => { window.location.href = href; }, 350);
  });
}

/* ── 6. Reading progress ────────────────────────────────── */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'read-progress';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
  }, { passive: true });
}

/* ── 7. Back to top ─────────────────────────────────────── */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  /* Use an SVG arrow for reliable centering */
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 13V3M3 8l5-5 5 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── 8. Lazy images ─────────────────────────────────────── */
function initLazyImages() {
  qsa('img:not(.hero-img)').forEach(img => {
    img.loading  = 'lazy';
    img.decoding = 'async';
    if (img.complete) img.classList.add('img-loaded');
    else img.addEventListener('load', () => img.classList.add('img-loaded'));
  });
  /* Hero image always eager */
  qsa('img.hero-img').forEach(img => {
    img.loading = 'eager';
    img.classList.add('img-loaded');
  });
}

/* ── 9. External links ──────────────────────────────────── */
function initExternalLinks() {
  qsa('a[href^="http"]').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    if (!a.querySelector('.ext-icon')) {
      const span = document.createElement('span');
      span.className = 'ext-icon';
      span.textContent = ' ↗';
      span.style.fontSize = '0.75em';
      a.appendChild(span);
    }
  });
}

/* ── 10. District tooltips ──────────────────────────────── */
function initDistrictTooltips() {
  const tips = {
    'Shibuya':   'Best at dusk — neon hits differently when the crossing lights up.',
    'Asakusa':   'Arrive before 8 am for silence and incense smoke at Senso-ji.',
    'Akihabara': 'Sunday = pedestrian zone on Chuo-dori. Bring extra cash.',
    'Shinjuku':  'Golden Gai alley has 200+ tiny bars — pick one at random.',
    'Harajuku':  'Meiji Shrine is 5 minutes from Takeshita Street chaos.',
  };
  qsa('h3').forEach(h => {
    const key = h.textContent.trim();
    if (tips[key]) {
      h.style.cursor = 'help';
      const tip = document.createElement('div');
      tip.className = 'district-tip';
      tip.textContent = tips[key];
      h.appendChild(tip);
      h.addEventListener('mouseenter', () => tip.classList.add('tip-show'));
      h.addEventListener('mouseleave', () => tip.classList.remove('tip-show'));
    }
  });
}

/* ── 11. Inject runtime styles ──────────────────────────── */
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
#sakura-canvas {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0; opacity: 0.5;
}
#site-nav {
  position: sticky; top: 0; z-index: 200;
  background: rgba(250,249,250,0.84);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border-bottom: 1px solid var(--border);
  transition: box-shadow 0.3s;
}
#site-nav.scrolled { box-shadow: 0 4px 28px rgba(26,22,18,0.12); }
.nav-inner {
  max-width: var(--max-width); margin: 0 auto; padding: 0 24px;
  height: 60px; display: flex; align-items: center; gap: 24px;
}
.nav-logo {
  font-family: var(--font-display); font-size: 1.5rem; font-weight: 900;
  color: var(--red-dark); letter-spacing: 0.05em; margin-right: auto;
}
.nav-links { display: flex; gap: 4px; }
.nav-link {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 50px;
  font-size: 0.82rem; font-weight: 500; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink-muted); text-decoration: none;
  transition: background 0.2s, color 0.2s; border-bottom: none !important;
}
.nav-link:hover, .nav-link.active { background: var(--light-pink); color: #fff; }
.nav-icon { font-size: 1rem; }
.nav-burger {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 6px;
}
.nav-burger span {
  display: block; width: 22px; height: 2px;
  background: var(--ink); border-radius: 2px;
  transition: transform 0.25s, opacity 0.25s;
}
.nav-burger.is-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-burger.is-open span:nth-child(2) { opacity: 0; }
.nav-burger.is-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
.nav-drawer {
  display: none; flex-direction: column;
  background: rgba(250,249,250,0.97);
  padding: 12px 24px 20px; border-top: 1px solid var(--border);
}
.nav-drawer.open { display: flex; }
.drawer-link {
  padding: 12px 0; font-size: 1rem; font-weight: 500;
  color: var(--ink); text-decoration: none;
  border-bottom: 1px solid var(--border);
}
.drawer-link.active { color: var(--light-pink); }
@media (max-width: 620px) {
  .nav-links { display: none; }
  .nav-burger { display: flex; }
}
#page-curtain {
  position: fixed; inset: 0;
  background: var(--red-dark); z-index: 9999;
  transition: opacity 0.35s ease, transform 0.35s ease;
  transform-origin: top;
}
#page-curtain.entering { opacity: 1; transform: scaleY(1); }
#page-curtain.leaving  { opacity: 0; transform: scaleY(0); pointer-events: none; }
#read-progress {
  position: fixed; top: 0; left: 0; width: 100%; height: 3px;
  background: linear-gradient(90deg, var(--light-pink), var(--gold));
  transform-origin: left; transform: scaleX(0);
  z-index: 9000; transition: transform 0.1s linear;
}
#back-to-top {
  position: fixed; bottom: 32px; right: 28px;
  width: 46px; height: 46px; border-radius: 50%;
  background: var(--red-dark); color: #fff;
  border: none; cursor: pointer;
  box-shadow: 0 4px 18px rgba(146,43,33,0.35);
  opacity: 0; transform: translateY(16px) scale(0.8);
  transition: opacity 0.3s, transform 0.3s;
  z-index: 500;
  /* Centering fix */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}
#back-to-top.visible { opacity: 1; transform: translateY(0) scale(1); }
#back-to-top:hover { background: var(--light-pink); }
#lightbox {
  position: fixed; inset: 0;
  background: rgba(10,8,6,0.9);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 8000; opacity: 0; pointer-events: none;
  transition: opacity 0.3s ease; padding: 24px;
  backdrop-filter: blur(6px);
}
#lightbox.active { opacity: 1; pointer-events: all; }
.lb-img {
  max-width: 90vw; max-height: 78vh;
  border-radius: 6px; box-shadow: 0 12px 60px rgba(0,0,0,0.6);
  transform: scale(0.94); transition: transform 0.3s ease;
  cursor: default !important; object-fit: contain;
}
#lightbox.active .lb-img { transform: scale(1); }
.lb-caption {
  color: rgba(255,255,255,0.6); font-size: 0.85rem;
  margin-top: 14px; max-width: 600px; text-align: center;
}
.lb-close {
  position: absolute; top: 20px; right: 24px;
  background: none; border: none; color: #fff;
  font-size: 2rem; cursor: pointer; line-height: 1;
  opacity: 0.7; transition: opacity 0.2s;
}
.lb-close:hover { opacity: 1; }
.will-reveal {
  opacity: 0; transform: translateY(22px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.revealed { opacity: 1 !important; transform: none !important; }
img:not(.hero-img) {
  opacity: 0;
  transition: opacity 0.45s ease, box-shadow 0.25s ease, transform 0.25s ease !important;
}
img.img-loaded { opacity: 1; }
h3 { position: relative; display: inline-block; }
.district-tip {
  display: none; position: absolute;
  left: 0; top: calc(100% + 6px);
  background: var(--ink); color: #f5ede3;
  font-family: var(--font-body); font-size: 0.78rem; font-weight: 400;
  text-transform: none; letter-spacing: 0;
  padding: 8px 14px; border-radius: 6px;
  white-space: nowrap; z-index: 300;
  box-shadow: 0 4px 18px rgba(0,0,0,0.2);
  pointer-events: none;
}
.district-tip::before {
  content: ''; position: absolute; top: -6px; left: 14px;
  border-width: 0 6px 6px; border-style: solid;
  border-color: transparent transparent var(--ink);
}
.tip-show { display: block !important; animation: fadeUp 0.2s ease; }
.ext-icon { opacity: 0.55; }
body > *:not(#sakura-canvas):not(#page-curtain):not(#lightbox):not(#read-progress):not(#back-to-top) {
  position: relative; z-index: 1;
}
  `;
  document.head.appendChild(style);
}

/* ── Boot ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  buildNav();
  initSakura();
  initPageTransitions();
  initProgressBar();
  initReveal();
  initLazyImages();
  initLightbox();
  initBackToTop();
  initExternalLinks();
  initDistrictTooltips();
});
