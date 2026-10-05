(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("pageshow", (event) => {
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    if (event.persisted || navigationEntry?.type === "reload") window.scrollTo(0, 0);
  });

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuButton.querySelector(".sr-only").textContent = "Menü öffnen";
  };

  menuButton?.addEventListener("click", () => {
    const opens = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(opens));
    navigation?.classList.toggle("open", opens);
    document.body.classList.toggle("menu-open", opens);
    menuButton.querySelector(".sr-only").textContent = opens ? "Menü schließen" : "Menü öffnen";
  });

  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1120) closeMenu();
  });

  function initHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const video = hero.querySelector("[data-hero-video]");
    if (reducedMotion.matches) {
      video?.pause();
      return;
    }

    video?.play().catch(() => {});
    let scheduled = false;

    const update = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      hero.style.setProperty("--hero-progress", progress.toFixed(4));
      scheduled = false;
    };

    window.addEventListener("scroll", () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function initReveals() {
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
    const targets = document.querySelectorAll(
      ".section-heading, .pathways, .reference-card, .network-band, .inner-section > .inner-content"
    );
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5%" });

    targets.forEach((target) => {
      target.classList.add("reveal-target");
      observer.observe(target);
    });
  }

  function initStory() {
    const story = document.querySelector("[data-film-story]");
    if (!story || reducedMotion.matches) return;

    const scenes = [...story.querySelectorAll("[data-film-scene]")];
    const steps = [...document.querySelectorAll(".story-step")];
    const rail = [...document.querySelectorAll(".story-rail span")];
    const progressBar = document.querySelector(".story-progress span");
    const counter = story.querySelector("[data-film-counter]");
    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
    let progress = 0;
    let target = 0;
    let activeStep = 0;
    let animationFrame = 0;
    let storyVisible = false;

    function updateTarget() {
      const rect = story.getBoundingClientRect();
      storyVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      target = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
      const nextStep = Math.min(scenes.length - 1, Math.floor(target * scenes.length));
      if (nextStep !== activeStep) {
        activeStep = nextStep;
        rail.forEach((marker, index) => marker.classList.toggle("active", index === activeStep));
        if (counter) counter.textContent = `SCENE ${String(activeStep + 1).padStart(2, "0")} — ${String(scenes.length).padStart(2, "0")}`;
      }
      if (progressBar) progressBar.style.transform = `scaleX(${target})`;
      if (!animationFrame) animationFrame = requestAnimationFrame(render);
    }

    function paint() {
      const sequence = progress * scenes.length;
      const mobile = window.innerWidth <= 720;

      scenes.forEach((scene, index) => {
        const sceneTime = sequence - index;
        const local = clamp(sceneTime, 0, 1);
        const fadeIn = clamp((sceneTime + 0.08) / 0.08, 0, 1);
        const fadeOut = index === scenes.length - 1 ? 1 : 1 - clamp((sceneTime - 0.8) / 0.24, 0, 1);
        const opacity = Math.min(fadeIn, fadeOut);
        const direction = index % 2 === 0 ? 1 : -1;

        scene.style.setProperty("--film-opacity", opacity.toFixed(4));
        scene.style.setProperty("--film-scale", (1.095 - local * 0.055).toFixed(4));
        scene.style.setProperty("--film-x", `${((1 - local) * 1.8 * direction).toFixed(3)}%`);
        scene.style.setProperty("--film-y", `${((0.5 - local) * 1.1).toFixed(3)}%`);
        scene.style.setProperty("--film-blur", `${(Math.abs(sceneTime - 0.5) > 0.66 ? 2.2 : 0).toFixed(1)}px`);
        scene.classList.toggle("active", index === activeStep);

        const video = scene.querySelector("[data-film-video]");
        if (!video) return;
        const shouldPlay = storyVisible && opacity > 0.03;
        if (shouldPlay && video.paused) video.play().catch(() => {});
        if (!shouldPlay && !video.paused) video.pause();
      });

      steps.forEach((step, index) => {
        const stepTime = sequence - index;
        const fadeIn = clamp((stepTime + 0.08) / 0.08, 0, 1);
        const fadeOut = index === steps.length - 1 ? 1 : 1 - clamp((stepTime - 0.72) / 0.2, 0, 1);
        const opacity = Math.min(fadeIn, fadeOut);
        const shift = stepTime < 0 ? 26 : -clamp(stepTime, 0, 1) * 14;

        step.style.opacity = opacity.toFixed(4);
        step.style.visibility = opacity > 0.01 ? "visible" : "hidden";
        step.style.transform = mobile
          ? `translate3d(0, ${shift.toFixed(2)}px, 0)`
          : `translate3d(0, calc(-50% + ${shift.toFixed(2)}px), 0)`;
        step.classList.toggle("active", index === activeStep);
      });
    }

    function render() {
      progress += (target - progress) * 0.11;
      if (Math.abs(target - progress) < 0.0005) progress = target;
      paint();
      if (progress !== target) animationFrame = requestAnimationFrame(render);
      else animationFrame = 0;
    }

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();
  }

  initHero();
  initReveals();
  initStory();
})();
