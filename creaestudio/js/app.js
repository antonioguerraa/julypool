/* ==========================================================================
   Crea Estudio Cocinas — Scroll-Driven Two-Video Landing Page
   Video 1 (frames 1-169): kitchen disassembles
   Video 2 (frames 170-314): new kitchen assembles
   ========================================================================== */

(function () {
  "use strict";

  const TOTAL_FRAMES = 314;
  const IMAGE_SCALE = 1.0;
  const SAMPLE_INTERVAL = 20;

  const loader = document.getElementById("loader");
  const loaderBarFill = document.getElementById("loader-bar-fill");
  const loaderPercent = document.getElementById("loader-percent");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const canvasWrap = document.querySelector(".canvas-wrap");
  const heroOverlay = document.getElementById("hero-text");
  const darkOverlay = document.getElementById("dark-overlay");
  const header = document.querySelector(".site-header");
  const scrollContainer = document.getElementById("scroll-container");
  const sections = document.querySelectorAll(".scroll-section");

  const frames = [];
  let currentFrame = 0;
  let canvasBgColor = "#F5F0EB";
  let loadedCount = 0;

  function framePath(i) {
    return `frames/frame_${String(i).padStart(4, "0")}.jpg`;
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
    animateHeroIn();
  }

  let lenis;
  function initLenis() {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

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
    const sc = document.createElement("canvas");
    const sctx = sc.getContext("2d");
    sc.width = img.naturalWidth; sc.height = img.naturalHeight;
    sctx.drawImage(img, 0, 0);
    const samples = [
      sctx.getImageData(2, 2, 1, 1).data,
      sctx.getImageData(img.naturalWidth - 3, 2, 1, 1).data,
      sctx.getImageData(2, img.naturalHeight - 3, 1, 1).data,
      sctx.getImageData(img.naturalWidth - 3, img.naturalHeight - 3, 1, 1).data,
    ];
    let r = 0, g = 0, b = 0;
    samples.forEach((s) => { r += s[0]; g += s[1]; b += s[2]; });
    canvasBgColor = `rgb(${Math.round(r/4)},${Math.round(g/4)},${Math.round(b/4)})`;
  }

  function renderFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, vw, vh);
    const imgR = img.naturalWidth / img.naturalHeight;
    const vpR = vw / vh;
    let dW, dH;
    if (imgR > vpR) { dH = vh * IMAGE_SCALE; dW = dH * imgR; }
    else { dW = vw * IMAGE_SCALE; dH = dW / imgR; }
    ctx.drawImage(img, (vw - dW) / 2, (vh - dH) / 2, dW, dH);
    if (index % SAMPLE_INTERVAL === 0) sampleBgColor(img);
  }

  /* Straight-through: frames 1→314, continuous scroll */
  function initScrollAnimation() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top", end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => {
        const index = Math.min(TOTAL_FRAMES - 1, Math.floor(self.progress * (TOTAL_FRAMES - 1)));
        if (index !== currentFrame) {
          currentFrame = index;
          renderFrame(currentFrame);
        }
      },
    });
  }

  /* Circle-wipe reveals canvas + hero text fades out */
  function initHeroFade() {
    gsap.timeline({
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: "8% top",
        scrub: 0.3,
      },
    })
    .to(heroOverlay, { opacity: 0, background: "transparent", duration: 0.6, ease: "none" }, 0)
    .fromTo(canvasWrap,
      { clipPath: "circle(0% at 50% 50%)" },
      { clipPath: "circle(85% at 50% 50%)", duration: 1, ease: "none" },
      0
    );

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "8% top",
      onEnter: () => { heroOverlay.style.visibility = "hidden"; },
      onLeaveBack: () => { heroOverlay.style.visibility = "visible"; },
    });
  }

  function initSections() {
    sections.forEach((section) => {
      const enter = parseFloat(section.dataset.enter) / 100;
      const leave = parseFloat(section.dataset.leave) / 100;
      const anim = section.dataset.animation;
      const persist = section.dataset.persist === "true";
      const inner = section.querySelector(".section-inner");
      if (!inner) return;

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: () => `${enter * 100}% top`,
        end: () => `${leave * 100}% top`,
        onEnter: () => { section.style.visibility = "visible"; section.classList.add("active"); },
        onLeave: () => { if (!persist) { section.style.visibility = "hidden"; section.classList.remove("active"); } },
        onEnterBack: () => { section.style.visibility = "visible"; section.classList.add("active"); },
        onLeaveBack: () => { section.style.visibility = "hidden"; section.classList.remove("active"); },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainer,
          start: () => `${enter * 100}% top`,
          end: () => `${(enter + (leave - enter) * 0.4) * 100}% top`,
          scrub: 0.5,
        },
      });

      const label = inner.querySelector(".section-label");
      const heading = inner.querySelector(".section-heading");
      const body = inner.querySelector(".section-body");
      const els = [label, heading, body].filter(Boolean);

      if (anim === "slide-right") {
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        els.forEach((el, i) => tl.fromTo(el, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.4 }, 0.1 * i));
      } else if (anim === "slide-left") {
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        els.forEach((el, i) => tl.fromTo(el, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.4 }, 0.1 * i));
      } else if (anim === "scale-up") {
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        els.forEach((el, i) => tl.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.4 }, 0.1 * i));
        initCounters(inner);
      } else {
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        els.forEach((el, i) => tl.fromTo(el, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.4 }, 0.1 * i));
      }

      if (!persist) {
        gsap.timeline({
          scrollTrigger: {
            trigger: scrollContainer,
            start: () => `${(leave - (leave - enter) * 0.2) * 100}% top`,
            end: () => `${leave * 100}% top`,
            scrub: 0.5,
          },
        }).to(section, { opacity: 0, duration: 1 });
      }
    });
  }

  function initDarkOverlay() {
    // Darken during transition zone (exploded view ~ frame 169)
    gsap.timeline({
      scrollTrigger: { trigger: scrollContainer, start: "45% top", end: "50% top", scrub: 0.5 },
    }).fromTo(darkOverlay, { opacity: 0 }, { opacity: 0.75 });
    gsap.timeline({
      scrollTrigger: { trigger: scrollContainer, start: "58% top", end: "62% top", scrub: 0.5 },
    }).to(darkOverlay, { opacity: 0 });
  }

  function initCounters(container) {
    container.querySelectorAll(".stat-number[data-target]").forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      ScrollTrigger.create({
        trigger: scrollContainer, start: "48% top", end: "50% top",
        onEnter: () => {
          gsap.to(el, {
            textContent: target, duration: 1.5, ease: "power2.out",
            snap: { textContent: 1 },
            onUpdate() { el.textContent = Math.round(parseFloat(el.textContent)).toLocaleString(); },
          });
        },
        once: true,
      });
    });
  }

  function initHeader() {
    ScrollTrigger.create({
      start: 100, end: 99999,
      onEnter: () => header.classList.add("scrolled"),
      onLeaveBack: () => header.classList.remove("scrolled"),
    });
  }

  function animateHeroIn() {
    const words = document.querySelectorAll(".hero-heading .word");
    const tag = document.querySelector(".hero-tag");
    const sub = document.querySelector(".hero-sub");
    const btn = document.querySelector(".hero-btn");
    gsap.fromTo(tag, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2 });
    words.forEach((w, i) => gsap.to(w, { opacity: 1, y: 0, duration: 0.9, delay: 0.4 + i * 0.12, ease: "power3.out" }));
    if (sub) gsap.fromTo(sub, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.9 });
    if (btn) gsap.fromTo(btn, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.1 });
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    preloadFrames().then(() => {
      hideLoader();
      currentFrame = 0;
      renderFrame(currentFrame);
      initLenis();
      initScrollAnimation();
      initHeroFade();
      initSections();
      initDarkOverlay();
      initHeader();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
