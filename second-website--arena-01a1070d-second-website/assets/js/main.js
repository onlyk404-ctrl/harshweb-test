/* =========================================================================
   HARSH — Portfolio · main.js
   Vanilla JS. No dependencies.
   Modules:
     01. Helpers
     02. Preloader
     03. Reveal on scroll
     04. Split text + scroll-linked word lighting
     05. Parallax
     06. Scroll-linked marquee
     07. Pinned horizontal gallery
     08. Infinite tickers
     09. Testimonial background words
     10. Custom cursor
     11. Case-study hover preview
     12. Copy to clipboard
     13. Mobile menu
     14. Active dock link (scrollspy)
     15. Archive filters + lightbox
     16. Misc (year, scroll lock)
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------------------------------------ 01. HELPERS */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const vh = () => window.innerHeight;

  /* ------------------------------------------------------- 01b. DOM REFS */
  const gallery = $(".gallery");
  const track = $("[data-track]");
  const galleryIndex = $("[data-gallery-index]");

  /* ----------------------------------------------------------- 02. PRELOADER */
  const loader = $("#loader");
  const loaderBar = $("#loaderBar");
  const loaderCount = $("#loaderCount");

  function runLoader() {
    if (!loader) return finishLoad();

    let progress = 0;
    let assetsReady = document.readyState === "complete";
    window.addEventListener("load", () => { assetsReady = true; }, { once: true });

    const finish = () => {
      loader.classList.add("is-done");
      finishLoad();
    };

    const tick = () => {
      // ease the bar towards 100%, but never past 94% until assets are in
      progress += Math.random() * 14 + 5;
      const ceiling = assetsReady ? 100 : 94;
      const p = Math.min(progress, ceiling);
      if (loaderBar) loaderBar.style.width = p + "%";
      if (loaderCount) loaderCount.textContent = String(Math.floor(p)).padStart(2, "0");

      if (p >= 100) {
        setTimeout(finish, 300);
      } else {
        setTimeout(tick, assetsReady || p < 90 ? 90 + Math.random() * 110 : 140);
      }
    };

    setTimeout(tick, 160);

    // safety net: never hold the visitor hostage
    setTimeout(() => {
      if (loader && !loader.classList.contains("is-done")) finish();
    }, 4500);
  }

  let hasFinished = false;
  function finishLoad() {
    if (hasFinished) return;
    hasFinished = true;
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    setupReveals();
    requestAnimationFrame(() => measure());
  }

  /* ----------------------------------------------------- 03. REVEAL ON SCROLL */
  // blocks that don't need data-attributes in the markup
  $$(".quote, .case, .tile, .archive__head > *").forEach((el) => el.classList.add("reveal"));

  /**
   * Reveal-on-scroll.
   * Deliberately not IntersectionObserver-only: if the visitor jump-scrolls past
   * a block (dock links, hash links, restored scroll position) the block must
   * still end up visible. Every pending item is checked against the viewport
   * bottom and revealed the moment it is at or above that line — which also
   * covers items that were skipped entirely.
   */
  let pendingReveals = [];
  let revealThrottle = 0;

  function setupReveals() {
    pendingReveals = $$(".reveal").filter((el) => !el.classList.contains("is-in"));
    if (reduceMotion) {
      pendingReveals.forEach((el) => el.classList.add("is-in"));
      pendingReveals = [];
      if (gallery) gallery.classList.add("is-in");
      return;
    }
    updateReveals(true);
  }

  function updateReveals(force) {
    if (revealThrottle++ % 3 !== 0 && !force) return;

    if (pendingReveals.length) {
      const line = vh() * 0.92;
      const batch = [];
      pendingReveals = pendingReveals.filter((el) => {
        if (el.getBoundingClientRect().top < line) {
          batch.push(el);
          return false;
        }
        return true;
      });
      batch.forEach((el, i) => {
        if (i < 8) el.style.transitionDelay = (i * 0.07).toFixed(2) + "s";
        el.classList.add("is-in");
      });
    }

    if (gallery && !gallery.classList.contains("is-in")) {
      const r = gallery.getBoundingClientRect();
      if (r.top < vh() * 0.9 && r.bottom > 0) gallery.classList.add("is-in");
    }
  }

  /* --------------------------------------------- 04. SPLIT TEXT + WORD LIGHT */
  const splitTargets = $$('[data-split="words"]');
  splitTargets.forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const words = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          words.forEach((w) => {
            if (/^\s+$/.test(w)) {
              frag.appendChild(document.createTextNode(" "));
            } else if (w.length) {
              const span = document.createElement("span");
              span.className = "word";
              span.textContent = w;
              frag.appendChild(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  });

  function updateWords() {
    for (let s = 0; s < splitTargets.length; s++) {
      const el = splitTargets[s];
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh() + 200) continue;
      const total = r.height + vh() * 0.35;
      const p = clamp((vh() * 0.86 - r.top) / total);
      if (!el._words) el._words = Array.from(el.querySelectorAll(".word"));
      const words = el._words;
      const lit = Math.round(p * words.length * 1.12);
      for (let i = 0; i < words.length; i++) {
        const on = i < lit;
        if (on !== words[i].classList.contains("is-lit")) words[i].classList.toggle("is-lit", on);
      }
    }
  }

  /* ------------------------------------------------------------ 05. PARALLAX */
  const parallaxItems = $$("[data-parallax]");

  /* ---------------------------------------- 05b. HERO SCROLL (figure + lines) */
  const heroEl = $("#hero");
  const heroMedia = $("[data-hero-media]");
  const heroRows = heroEl ? $$(".hero__row", heroEl) : [];
  const heroInner = heroEl ? $(".hero__inner", heroEl) : null;
  const heroDir = [-1, 1, -1];      // row A drifts left, B right, C left
  const heroAmt = [0.24, 0.26, 0.18]; // fraction of viewport width

  function updateHero() {
    if (!heroEl || reduceMotion) return;
    const r = heroEl.getBoundingClientRect();
    if (r.bottom < -50) return;
    const p = clamp(-r.top / Math.max(1, r.height * 0.9));
    const w = window.innerWidth;
    if (heroMedia) {
      // figure lags behind the page, grows slightly and fades into the dark
      heroMedia.style.transform = `translate3d(0, ${(p * r.height * 0.32).toFixed(1)}px, 0) scale(${(1 + p * 0.22).toFixed(4)})`;
      heroMedia.style.opacity = (1 - p * 0.85).toFixed(3);
    }
    heroRows.forEach((row, i) => {
      row.style.transform = `translate3d(${(heroDir[i % 3] * heroAmt[i % 3] * p * w).toFixed(1)}px, 0, 0)`;
    });
    if (heroInner) heroInner.style.opacity = clamp(1 - p * 1.25).toFixed(3);
  }

  /* ------------------------------------------------- 06. SCROLL MARQUEE */
  const marqueeRows = $$("[data-marquee-scroll]");

  /* -------------------------------------------------- 09. QUOTES BG WORDS */
  const quoteWords = $$("[data-quotes-word]");

  /* ---------------------------------------------------- 07. GALLERY MEASURE */
  let galleryDistance = 0;
  let cards = [];

  function measure() {
    if (gallery && track && window.innerWidth > 980) {
      cards = $$(".pcard", track);
      galleryDistance = Math.max(0, track.scrollWidth - window.innerWidth + 40);
      gallery.style.height = vh() + galleryDistance + "px";
    } else if (gallery) {
      gallery.style.height = "";
      if (track) track.style.transform = "";
    }
    measureTickers();
  }

  /* ---------------------------------------------------- 08. INFINITE TICKERS */
  function buildTicker(el) {
    if (el.dataset.tickerReady === "1") return;
    const original = el.innerHTML;
    let k = 2;
    el.innerHTML = original.repeat(k);
    let guard = 0;
    while (el.scrollWidth < window.innerWidth * 2.1 && guard < 8) {
      k += 2;
      el.innerHTML = original.repeat(k);
      guard++;
    }
    el.dataset.tickerReady = "1";
  }
  function measureTickers() {
    $$("[data-ticker]").forEach(buildTicker);
  }

  /* ------------------------------------------------------ 10. CUSTOM CURSOR */
  let cursor, cursorRing;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  function initCursor() {
    cursor = $("#cursor");
    if (!cursor || !canHover || reduceMotion) return;
    cursorRing = $(".cursor__ring", cursor);

    window.addEventListener(
      "mousemove",
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      },
      { passive: true }
    );

    const hoverTargets = "a, button, .tile, .case__link, .filters button";
    document.addEventListener("mouseover", (e) => {
      const hit = e.target.closest(hoverTargets);
      cursor.classList.toggle("is-hover", !!hit);
      cursor.classList.toggle("is-label", !!e.target.closest('[data-cursor="view"]'));
    });
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) cursor.classList.remove("is-hover");
    });
  }

  /* --------------------------------------------- 11. CASE HOVER PREVIEW */
  const previewList = $("[data-preview-list]");
  let previewX = 0,
    previewY = 0,
    activeCase = null;

  if (previewList && canHover) {
    previewList.addEventListener("mousemove", (e) => {
      const li = e.target.closest(".case");
      if (li !== activeCase) {
        if (activeCase) activeCase.classList.remove("is-previewing");
        activeCase = li;
        if (activeCase) activeCase.classList.add("is-previewing");
      }
      previewX = e.clientX;
      previewY = e.clientY;
    });
    previewList.addEventListener("mouseleave", () => {
      if (activeCase) activeCase.classList.remove("is-previewing");
      activeCase = null;
    });
  }

  /* ----------------------------------------------------- 12. COPY EMAIL/PHONE */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      const original = btn.innerHTML;
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
      }
      btn.classList.add("is-copied");
      btn.innerHTML = "Copied!";
      setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.innerHTML = original;
      }, 1600);
    });
  });

  /* --------------------------------------------------------- 13. MOBILE MENU */
  const menuBtn = $("#menuBtn");
  const menu = $("#menu");
  function closeMenu() {
    if (!menu || !menuBtn) return;
    menu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ------------------------------------------------------ 14. SCROLLSPY DOCK */
  const spyLinks = $$("[data-spy]");
  const spySections = spyLinks
    .map((a) => document.getElementById(a.getAttribute("data-spy")))
    .filter(Boolean);

  function updateSpy() {
    if (!spySections.length) return;
    let current = null;
    spySections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= vh() * 0.45 && r.bottom >= vh() * 0.35) current = sec.id;
    });
    spyLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("data-spy") === current));
  }

  /* --------------------------------------------- 15. ARCHIVE FILTERS + LIGHTBOX */
  const filterBar = $(".filters");
  if (filterBar) {
    const tiles = $$(".tile");
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      $$("button", filterBar).forEach((b) => b.classList.toggle("is-active", b === btn));
      const filter = btn.getAttribute("data-filter");
      tiles.forEach((t) => {
        const show = filter === "all" || (t.getAttribute("data-cat") || "").includes(filter);
        t.style.display = show ? "" : "none";
      });
    });
  }

  const lightbox = $("#lightbox");
  if (lightbox) {
    const lbImg = $("img", lightbox);
    const lbTitle = $("[data-lb-title]", lightbox);
    const lbCat = $("[data-lb-cat]", lightbox);
    $$(".tile").forEach((tile) => {
      if (!tile.querySelector("img")) return;
      tile.setAttribute("tabindex", "0");
      tile.setAttribute("role", "button");
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tile.click();
        }
      });
      tile.addEventListener("click", () => {
        const img = $("img", tile);
        if (img) lbImg.src = img.src;
        if (lbTitle) lbTitle.textContent = tile.getAttribute("data-title") || "";
        if (lbCat) lbCat.textContent = tile.getAttribute("data-cat") || "";
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });
    const close = () => {
      lightbox.hidden = true;
      document.body.style.overflow = "";
    };
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.closest(".lightbox__close")) close();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lightbox.hidden) close();
    });
  }

  /* --------------------------------------------------------------- 16. MISC */
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------ SCROLL LOOP (rAF) */
  let loopQueued = false;
  function onScroll() {
    if (loopQueued) return;
    loopQueued = true;
    requestAnimationFrame(loop);
  }

  function loop() {
    loopQueued = false;

    // reveal-on-scroll (also rescues blocks skipped by jump scrolls)
    updateReveals();

    // word lighting
    updateWords();

    // hero figure + headline lines
    updateHero();

    // parallax
    parallaxItems.forEach((el) => {
      const speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      const r = el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh() + 300) return;
      const offset = (r.top + r.height / 2 - vh() / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });

    // scroll-linked marquee
    marqueeRows.forEach((row) => {
      const section = row.closest(".marquee") || row;
      const r = section.getBoundingClientRect();
      const total = r.height + vh();
      const p = clamp((vh() - r.top) / total);
      const dist = Math.max(0, row.scrollWidth - window.innerWidth);
      row.style.transform = `translate3d(${(-p * dist).toFixed(1)}px, 0, 0)`;
    });

    // pinned gallery
    if (gallery && track && galleryDistance > 0 && window.innerWidth > 980) {
      const r = gallery.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh()));
      track.style.transform = `translate3d(${(-p * galleryDistance).toFixed(1)}px, 0, 0)`;
      if (galleryIndex && cards.length) {
        const i = Math.min(cards.length - 1, Math.round(p * (cards.length - 1)));
        galleryIndex.textContent = String(i + 1).padStart(2, "0");
      }
    }

    // quotes background words
    if (quoteWords.length) {
      quoteWords.forEach((w, i) => {
        const r = w.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh() / 2) / vh();
        const dir = i % 2 === 0 ? 1 : -1;
        w.style.transform = `translate3d(${(p * 60 * dir).toFixed(1)}px, 0, 0)`;
      });
    }

    // case preview follow
    if (activeCase) {
      const thumb = $(".case__thumb", activeCase);
      if (thumb) {
        previewX = lerp(previewX, mouseX, 0.16);
        previewY = lerp(previewY, mouseY, 0.16);
        thumb.style.left = previewX + "px";
        thumb.style.top = previewY + "px";
      }
    }

    // cursor
    if (cursorRing) {
      ringX = lerp(ringX, mouseX, 0.18);
      ringY = lerp(ringY, mouseY, 0.18);
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      cursorRing.style.left = ringX - mouseX + "px";
      cursorRing.style.top = ringY - mouseY + "px";
    }

    updateSpy();
  }

  /* ------------------------------------------------------------- BOOTSTRAP */
  function start() {
    initCursor();
    measure();
    measureTickers();
    onScroll();
    runLoader();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    onScroll();
  });
  window.addEventListener("load", measure);

  if (document.readyState === "complete") {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }

  // keep the loop alive while idle as well (smooth cursor / previews)
  (function raf() {
    loop();
    requestAnimationFrame(raf);
  })();
})();

/* =========================================================================
   17. ASTRAL INTERACTION LAYER
   Dependency-free canvas particles, pointer light, magnetic controls,
   3D card tilt, click shockwaves and scroll-energy feedback.
   ======================================================================== */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const root = document.documentElement;
  const body = document.body;

  const qs = (s, c = document) => c.querySelector(s);
  const qsa = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function mountLayers() {
    if (!qs(".fx-stage")) {
      const canvas = document.createElement("canvas");
      canvas.className = "fx-stage";
      canvas.setAttribute("aria-hidden", "true");
      body.prepend(canvas);
    }
    if (!qs(".fx-orb")) {
      const orb = document.createElement("div");
      orb.className = "fx-orb";
      orb.setAttribute("aria-hidden", "true");
      body.appendChild(orb);
    }
    if (!qs(".fx-grid")) {
      const grid = document.createElement("div");
      grid.className = "fx-grid";
      grid.setAttribute("aria-hidden", "true");
      body.appendChild(grid);
    }
    if (!qs(".fx-vignette")) {
      const vig = document.createElement("div");
      vig.className = "fx-vignette";
      vig.setAttribute("aria-hidden", "true");
      body.appendChild(vig);
    }

    const hero = qs(".hero");
    if (hero && !qs(".hero__hud", hero)) {
      const hud = document.createElement("div");
      hud.className = "hero__hud shell";
      hud.innerHTML = `
        <span><i class="pulse-line"></i><b data-hud-state>SYSTEM ONLINE</b></span>
        <span><b data-hud-coords>00.00 / 00.00</b><i>interactive field</i></span>
      `;
      hero.appendChild(hud);
    }
  }

  mountLayers();
  if (reduce) return;

  /* ----------------------------- live pointer field --------------------- */
  let pointerX = innerWidth * .5;
  let pointerY = innerHeight * .5;
  let targetX = pointerX;
  let targetY = pointerY;
  let lastMove = 0;

  window.addEventListener("mousemove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    lastMove = performance.now();
    body.classList.add("fx-interactive");
    root.style.setProperty("--fx-mx", `${e.clientX}px`);
    root.style.setProperty("--fx-my", `${e.clientY}px`);
    const coords = qs("[data-hud-coords]");
    if (coords) coords.textContent = `${(e.clientX / innerWidth * 100).toFixed(2)} / ${(e.clientY / innerHeight * 100).toFixed(2)}`;
  }, { passive: true });

  /* ---------------------------------------- canvas neural / star field ---- */
  const canvas = qs(".fx-stage");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) return;

  let dpr = Math.min(2, devicePixelRatio || 1);
  let particles = [];
  let width = innerWidth;
  let height = innerHeight;

  function seedParticles() {
    const count = coarse ? Math.round(Math.min(42, Math.max(22, width / 22))) : Math.round(Math.min(86, Math.max(46, width / 17)));
    particles = Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      const r = Math.min(width, height) * (0.14 + ((i * 37) % 100) / 100 * 0.48);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        ox: Math.random() * width,
        oy: Math.random() * height,
        vx: Math.cos(a) * (0.08 + Math.random() * .26),
        vy: Math.sin(a) * (0.08 + Math.random() * .26),
        r: .55 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        drift: .2 + Math.random() * .7,
        hue: i % 3
      };
    });
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function drawField(t) {
    pointerX = lerp(pointerX, targetX, .07);
    pointerY = lerp(pointerY, targetY, .07);
    ctx.clearRect(0, 0, width, height);

    const maxLink = coarse ? 118 : 148;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const wave = Math.sin(t * .00045 * p.drift + p.phase) * .16;
      p.x += p.vx + wave;
      p.y += p.vy + Math.cos(t * .00035 + p.phase) * .06;

      if (p.x < -40) p.x = width + 40;
      if (p.x > width + 40) p.x = -40;
      if (p.y < -40) p.y = height + 40;
      if (p.y > height + 40) p.y = -40;

      const dxm = pointerX - p.x;
      const dym = pointerY - p.y;
      const dm = Math.hypot(dxm, dym);
      if (dm < 170) {
        const pull = (1 - dm / 170) * .24;
        p.x -= dxm * pull * .014;
        p.y -= dym * pull * .014;
      }

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < maxLink) {
          const a = (1 - d / maxLink) * .095;
          let grad = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
          grad.addColorStop(0, p.hue === 0 ? `rgba(111,241,255,${a})` : p.hue === 1 ? `rgba(167,120,255,${a})` : `rgba(255,255,255,${a * .75})`);
          grad.addColorStop(1, q.hue === 0 ? `rgba(111,241,255,0)` : q.hue === 1 ? `rgba(167,120,255,0)` : `rgba(255,255,255,0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = d < 72 ? 0.8 : 0.55;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
      const c = p.hue === 0 ? "111,241,255" : p.hue === 1 ? "167,120,255" : "246,244,239";
      g.addColorStop(0, `rgba(${c},${.18 + (dm < 150 ? .12 : 0)})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${c},${.35 + Math.sin(t * .002 + p.phase) * .16})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = 36 + Math.sin(t * .0014) * 8;
    const glow = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, pulse * 3);
    glow.addColorStop(0, "rgba(111,241,255,.07)");
    glow.addColorStop(.5, "rgba(167,120,255,.035)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(pointerX - pulse * 3, pointerY - pulse * 3, pulse * 6, pulse * 6);

    requestAnimationFrame(drawField);
  }
  requestAnimationFrame(drawField);

  /* ----------------------------------------------- interactive tilts ------ */
  const tiltTargets = qsa(".pcard, .case, .about__photo, .about__strip img, .cta__row img");
  if (!coarse) {
    tiltTargets.forEach((el) => {
      el.setAttribute("data-tilt", "");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        const ry = px * 8;
        const rx = py * -8;
        if (el.classList.contains("case")) {
          el.style.setProperty("--case-rx", `${rx.toFixed(2)}deg`);
          el.style.setProperty("--case-ry", `${ry.toFixed(2)}deg`);
        } else {
          el.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
        }
      });
      el.addEventListener("pointerleave", () => {
        if (el.classList.contains("case")) {
          el.style.setProperty("--case-rx", "0deg");
          el.style.setProperty("--case-ry", "0deg");
        } else {
          el.style.transform = "";
        }
      });
    });
  }

  /* ---------------------------------------------- magnetic controls ------- */
  if (!coarse) {
    const magnetic = qsa(".btn, .dock__cta, .topbar__logo");
    magnetic.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate3d(${(dx * .12).toFixed(1)}px, ${(dy * .12).toFixed(1)}px, 0)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------------------------------------- click shockwaves -------- */
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const ripple = document.createElement("span");
    ripple.className = "fx-ripple";
    ripple.style.left = e.clientX + "px";
    ripple.style.top = e.clientY + "px";
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 900);
  }, { passive: true });

  /* ---------------------------------------------- scroll energy ------------ */
  let lastScroll = window.scrollY;
  let scrollVelocity = 0;
  let scrollStamp = performance.now();
  function updateScrollEnergy() {
    const now = performance.now();
    const dt = Math.max(16, now - scrollStamp);
    const dy = window.scrollY - lastScroll;
    scrollVelocity = lerp(scrollVelocity, (dy / dt) * 1000, .24);
    lastScroll = window.scrollY;
    scrollStamp = now;
    root.style.setProperty("--fx-scroll", scrollVelocity.toFixed(2));
    body.classList.toggle("is-scrolling", Math.abs(scrollVelocity) > 20);
    requestAnimationFrame(updateScrollEnergy);
  }
  requestAnimationFrame(updateScrollEnergy);

  /* -------------------------------------------------- hover copy pulse ----- */
  qsa(".hero__title, .cta__title, .cases__title").forEach((el) => {
    if (coarse) return;
    el.addEventListener("mouseenter", () => {
      el.animate([
        { letterSpacing: "-0.045em", filter: "none" },
        { letterSpacing: "-0.03em", filter: "drop-shadow(0 0 16px rgba(111,241,255,.12))" },
        { letterSpacing: "-0.045em", filter: "none" }
      ], { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" });
    });
  });

  /* ------------------------------------------- welcome toast / hint ------- */
  window.setTimeout(() => {
    if (coarse || !body.classList.contains("is-ready")) return;
    const toast = document.createElement("div");
    toast.className = "fx-toast";
    toast.textContent = "interactive mode · move your cursor";
    body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
    window.setTimeout(() => toast.remove(), 3000);
  }, 2600);

  /* -------------------------------------------------- idle state ----------- */
  window.setInterval(() => {
    if (performance.now() - lastMove > 4500) body.classList.remove("fx-interactive");
  }, 1000);
})();
