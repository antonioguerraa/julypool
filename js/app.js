/* ==========================================================================
   Julypool — Scroll-Driven Video Landing Page
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Device detection ---------- */
  const isMobile = window.innerWidth <= 768;

  /* ---------- Constants ---------- */
  const DESKTOP_FRAMES = 265;
  const MOBILE_FRAMES = 169;
  const TOTAL_FRAMES = isMobile ? MOBILE_FRAMES : DESKTOP_FRAMES;
  const IMAGE_SCALE = isMobile ? 1.0 : 0.85;
  const SAMPLE_INTERVAL = 20;

  /* ---------- DOM refs ---------- */
  const loader = document.getElementById("loader");
  const loaderBarFill = document.getElementById("loader-bar-fill");
  const loaderPercent = document.getElementById("loader-percent");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const canvasWrap = document.querySelector(".canvas-wrap");
  const hero = document.querySelector(".hero-standalone");
  const darkOverlay = document.getElementById("dark-overlay");
  const marqueeWrap = document.querySelector(".marquee-wrap");
  const marqueeText = document.querySelector(".marquee-text");
  const header = document.querySelector(".site-header");
  const scrollContainer = document.getElementById("scroll-container");
  const sections = document.querySelectorAll(".scroll-section");

  /* ---------- State ---------- */
  const frames = [];
  let currentFrame = 0;
  let canvasBgColor = "#F2ECE3";
  let loadedCount = 0;
  let isLoaded = false;

  /* ==========================================================================
     1. Preloader
     ========================================================================== */

  function framePath(i) {
    const num = String(i).padStart(4, "0");
    const folder = isMobile ? "frames-mobile" : "frames";
    return `${folder}/frame_${num}.jpg`;
  }

  function preloadFrames() {
    return new Promise((resolve) => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = framePath(i);
        img.onload = img.onerror = () => {
          loadedCount++;
          const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          loaderBarFill.style.width = pct + "%";
          loaderPercent.textContent = pct + "%";
          if (loadedCount === TOTAL_FRAMES) resolve();
        };
        frames[i - 1] = img;
      }
    });
  }

  function hideLoader() {
    loader.classList.add("hidden");
    isLoaded = true;
    animateHeroIn();
  }

  /* ==========================================================================
     2. Lenis Smooth Scroll
     ========================================================================== */

  let lenis;

  function initLenis() {
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ==========================================================================
     3. Canvas Renderer
     ========================================================================== */

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    renderFrame(currentFrame);
  }

  function sampleBgColor(img) {
    const sampleCanvas = document.createElement("canvas");
    const sCtx = sampleCanvas.getContext("2d");
    sampleCanvas.width = img.naturalWidth;
    sampleCanvas.height = img.naturalHeight;
    sCtx.drawImage(img, 0, 0);

    const samples = [
      sCtx.getImageData(2, 2, 1, 1).data,
      sCtx.getImageData(img.naturalWidth - 3, 2, 1, 1).data,
      sCtx.getImageData(2, img.naturalHeight - 3, 1, 1).data,
      sCtx.getImageData(img.naturalWidth - 3, img.naturalHeight - 3, 1, 1).data,
    ];

    let r = 0, g = 0, b = 0;
    samples.forEach((s) => {
      r += s[0];
      g += s[1];
      b += s[2];
    });
    r = Math.round(r / 4);
    g = Math.round(g / 4);
    b = Math.round(b / 4);

    canvasBgColor = `rgb(${r},${g},${b})`;
    document.documentElement.style.setProperty("--canvas-bg", canvasBgColor);
  }

  function renderFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, vw, vh);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const vpRatio = vw / vh;

    let drawW, drawH;
    if (imgRatio > vpRatio) {
      drawH = vh * IMAGE_SCALE;
      drawW = drawH * imgRatio;
    } else {
      drawW = vw * IMAGE_SCALE;
      drawH = drawW / imgRatio;
    }

    const x = (vw - drawW) / 2;
    const y = (vh - drawH) / 2;

    ctx.drawImage(img, x, y, drawW, drawH);

    if (index % SAMPLE_INTERVAL === 0) {
      sampleBgColor(img);
    }
  }

  /* ==========================================================================
     4. Frame-to-Scroll Binding
     ========================================================================== */

  function initScrollAnimation() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress;
        let index;

        if (isMobile) {
          // Mobile: forward playback only (1 → 169), clamp at last frame
          const phase = Math.min(p * 2.5, 1); // finish video in first ~40% of scroll
          index = Math.min(TOTAL_FRAMES - 1, Math.floor(phase * (TOTAL_FRAMES - 1)));
        } else {
          // Desktop: two-pass — reverse then forward
          if (p < 0.5) {
            const phase = p / 0.5;
            index = Math.max(0, TOTAL_FRAMES - 1 - Math.floor(phase * (TOTAL_FRAMES - 1)));
          } else {
            const phase = (p - 0.5) / 0.5;
            index = Math.min(TOTAL_FRAMES - 1, Math.floor(phase * (TOTAL_FRAMES - 1)));
          }
        }

        if (index !== currentFrame) {
          currentFrame = index;
          renderFrame(currentFrame);
        }
      },
    });
  }

  /* ==========================================================================
     5. Circle-Wipe Hero Reveal
     ========================================================================== */

  function initHeroWipe() {
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: isMobile ? "5% top" : "8% top",
        scrub: 0.3,
      },
    });

    heroTl
      .to(hero, {
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: "none",
      })
      .fromTo(
        canvasWrap,
        { clipPath: "circle(0% at 50% 50%)" },
        { clipPath: "circle(80% at 50% 50%)", duration: 1, ease: "none" },
        0
      );
  }

  /* ==========================================================================
     6. Section Animation System
     ========================================================================== */

  function initSections() {
    sections.forEach((section) => {
      const enter = parseFloat(section.dataset.enter) / 100;
      const leave = parseFloat(section.dataset.leave) / 100;
      const anim = section.dataset.animation;
      const persist = section.dataset.persist === "true";

      if (anim === "marquee-reveal") {
        initMarqueeSection(enter, leave);
        return;
      }

      const inner = section.querySelector(".section-inner");
      if (!inner) return;

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: () => `${enter * 100}% top`,
        end: () => `${leave * 100}% top`,
        onEnter: () => {
          section.style.visibility = "visible";
          section.classList.add("active");
        },
        onLeave: () => {
          if (!persist) {
            section.style.visibility = "hidden";
            section.classList.remove("active");
          }
        },
        onEnterBack: () => {
          section.style.visibility = "visible";
          section.classList.add("active");
        },
        onLeaveBack: () => {
          section.style.visibility = "hidden";
          section.classList.remove("active");
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainer,
          start: () => `${enter * 100}% top`,
          end: () => `${(enter + (leave - enter) * 0.4) * 100}% top`,
          scrub: 0.5,
        },
      });

      const tlOut = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainer,
          start: () => `${(leave - (leave - enter) * 0.2) * 100}% top`,
          end: () => `${leave * 100}% top`,
          scrub: 0.5,
        },
      });

      buildEntranceAnimation(tl, section, inner, anim);

      if (!persist) {
        tlOut.to(section, { opacity: 0, duration: 1, ease: "none" });
      }
    });
  }

  function buildEntranceAnimation(tl, section, inner, anim) {
    const label = inner.querySelector(".section-label");
    const heading = inner.querySelector(".section-heading");
    const body = inner.querySelector(".section-body");
    const cta = inner.querySelector(".section-cta") || inner.querySelector(".btn-cta");

    const elements = [label, heading, body, cta].filter(Boolean);

    switch (anim) {
      case "fade-up":
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" });
        elements.forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.12 * i);
        });
        break;

      case "slide-right":
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" });
        elements.forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 0.12 * i);
        });
        break;

      case "slide-left":
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" });
        elements.forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 0.12 * i);
        });
        break;

      case "stagger-up":
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" });
        if (label) tl.fromTo(label, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0);
        if (heading) tl.fromTo(heading, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.1);
        const cards = inner.querySelectorAll(".value-card");
        cards.forEach((card, i) => {
          tl.fromTo(card, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.15 + i * 0.08);
        });
        break;

      case "scale-up":
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" });
        elements.forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, 0.12 * i);
        });
        initCounters(inner);
        break;

      case "clip-reveal":
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" });
        tl.fromTo(inner, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power2.inOut" }, 0);
        elements.forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, 0.3 + i * 0.1);
        });
        break;

      default:
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "none" });
    }
  }

  /* ==========================================================================
     7. Dark Overlay (Stats Section)
     ========================================================================== */

  function initDarkOverlay() {
    gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainer,
        start: "53% top",
        end: "57% top",
        scrub: 0.5,
      },
    }).fromTo(darkOverlay, { opacity: 0 }, { opacity: 0.9, ease: "none" });

    gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainer,
        start: "63% top",
        end: "67% top",
        scrub: 0.5,
      },
    }).to(darkOverlay, { opacity: 0, ease: "none" });
  }

  /* ==========================================================================
     8. Marquee
     ========================================================================== */

  function initMarqueeSection(enter, leave) {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: () => `${enter * 100}% top`,
      end: () => `${leave * 100}% top`,
      onEnter: () => gsap.to(marqueeWrap, { opacity: 1, duration: 0.5 }),
      onLeave: () => gsap.to(marqueeWrap, { opacity: 0, duration: 0.5 }),
      onEnterBack: () => gsap.to(marqueeWrap, { opacity: 1, duration: 0.5 }),
      onLeaveBack: () => gsap.to(marqueeWrap, { opacity: 0, duration: 0.5 }),
    });

    gsap.to(marqueeText, {
      xPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainer,
        start: () => `${enter * 100}% top`,
        end: () => `${leave * 100}% top`,
        scrub: 1,
      },
    });
  }

  /* ==========================================================================
     9. Counter Animations
     ========================================================================== */

  function initCounters(container) {
    const counters = container.querySelectorAll(".stat-number[data-target]");
    counters.forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "56% top",
        end: "58% top",
        onEnter: () => {
          gsap.to(el, {
            textContent: target,
            duration: 1.5,
            ease: "power2.out",
            snap: { textContent: 1 },
            onUpdate: function () {
              el.textContent = Math.round(parseFloat(el.textContent));
            },
          });
        },
        once: true,
      });
    });
  }

  /* ==========================================================================
     10. Header Scroll Effect
     ========================================================================== */

  function initHeader() {
    ScrollTrigger.create({
      start: 100,
      end: 99999,
      onEnter: () => header.classList.add("scrolled"),
      onLeaveBack: () => header.classList.remove("scrolled"),
    });
  }

  /* ==========================================================================
     Hero Animation
     ========================================================================== */

  function animateHeroIn() {
    const title = document.querySelector(".hero-banner-title");
    const btn = document.querySelector(".hero-banner-btn");

    if (title) {
      gsap.to(title, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
        ease: "power2.out",
      });
    }

    if (btn) {
      gsap.to(btn, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.7,
        ease: "power2.out",
      });
    }
  }

  /* ==========================================================================
     Mobile Hero: use first frame from mobile video
     ========================================================================== */

  function setupMobileHero() {
    if (!isMobile) return;
    const heroImg = document.querySelector(".hero-banner-img");
    if (heroImg) {
      heroImg.src = "frames-mobile/frame_0001.jpg";
      heroImg.style.objectFit = "cover";
    }
  }

  /* ==========================================================================
     Init
     ========================================================================== */

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    // Add mobile class to body for CSS
    if (isMobile) document.body.classList.add("is-mobile");

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    preloadFrames().then(() => {
      hideLoader();

      if (isMobile) {
        // Mobile: start at frame 1, play forward
        currentFrame = 0;
        setupMobileHero();
      } else {
        // Desktop: start at last frame (blueprint)
        currentFrame = TOTAL_FRAMES - 1;
      }

      renderFrame(currentFrame);
      initLenis();
      initScrollAnimation();
      initHeroWipe();
      initSections();
      initDarkOverlay();
      initHeader();
    });
  }

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
