/** Initialisiert Sprache, Navigation und Animationen der Startseite. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var mobile = window.matchMedia("(max-width: 767px)").matches;
  var marqueeTween = null;
  var marqueePaused = false;
  var lenis = null;

  function readStoredLanguage() {
    try {
      var stored = localStorage.getItem("company-builder-language");
      return stored === "de" || stored === "en" ? stored : "en";
    } catch (error) {
      return "en";
    }
  }

  function initHeroVideo() {
    var video = document.querySelector("[data-hero-video]");
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    video.play().catch(function () { /* Autoplay kann durch Browsereinstellungen blockiert sein. */ });
  }

  window.CBState = {
    lang: readStoredLanguage()
  };

  function applyLanguage(language, announce) {
    var dictionary = window.CB_I18N && window.CB_I18N[language];
    if (!dictionary) return;
    window.CBState.lang = language;
    root.lang = language;
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      var key = element.getAttribute("data-i18n");
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) element.textContent = dictionary[key];
    });
    document.querySelectorAll("[data-language]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.language === language ? "true" : "false");
    });
    document.querySelectorAll("[data-count]").forEach(function (number) {
      number.textContent = formatCount(Number(number.dataset.count), number.dataset.countKind);
    });
    document.title = language === "de" ? "HIGHEST & FUTURY Company Builder" : "HIGHEST & FUTURY Company Builder";
    try { localStorage.setItem("company-builder-language", language); } catch (error) { /* storage may be unavailable */ }
    splitHeroTitle(announce !== false);
    if (announce !== false) {
      window.dispatchEvent(new CustomEvent("cb:language", { detail: { lang: language } }));
    }
  }

  function splitHeroTitle(animate) {
    var heading = document.querySelector("[data-split]");
    if (!heading) return;
    var text = heading.textContent.trim();
    heading.setAttribute("aria-label", text);
    heading.innerHTML = text.split(/\s+/).map(function (word) {
      return '<span class="word" aria-hidden="true">' + word + "</span>";
    }).join(" ");
    if (animate && window.gsap && !reducedMotion) {
      window.gsap.fromTo(heading.querySelectorAll(".word"),
        { opacity: 0, yPercent: 145, rotateX: -58, scale: .72, filter: "blur(16px)" },
        { opacity: 1, yPercent: 0, rotateX: 0, scale: 1, filter: "blur(0px)", duration: 1.18, stagger: .078, ease: "expo.out", delay: .03 }
      );
    }
  }

  function introHasRun() {
    try { return sessionStorage.getItem("company-builder-intro") === "seen"; } catch (error) { return false; }
  }

  function markIntroRun() {
    try { sessionStorage.setItem("company-builder-intro", "seen"); } catch (error) { /* storage may be unavailable */ }
  }

  function initIntro(onReady) {
    var intro = document.querySelector("[data-intro]");
    var wordmark = document.querySelector("[data-intro-wordmark]");
    var particleWrap = document.querySelector("[data-intro-particles]");
    var skip = document.querySelector("[data-intro-skip]");
    if (!intro || introHasRun() || reducedMotion || !window.gsap) {
      if (intro) intro.remove();
      onReady();
      return;
    }

    markIntroRun();
    intro.classList.add("is-active");
    intro.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    var label = wordmark.textContent;
    wordmark.innerHTML = label.split("").map(function (character) {
      return character === " " ? '<span aria-hidden="true">&nbsp;</span>' : '<span aria-hidden="true">' + character + "</span>";
    }).join("");
    for (var i = 0; i < 38; i += 1) {
      var dot = document.createElement("i");
      dot.style.left = "50%";
      dot.style.top = "50%";
      particleWrap.appendChild(dot);
    }

    var finished = false;
    var timeline = window.gsap.timeline({ onComplete: finish });
    timeline.fromTo(wordmark.querySelectorAll("span"),
      { opacity: 0, y: 42, scale: .4, rotateX: -65 },
      { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: .46, stagger: .019, ease: "expo.out" }
    ).to(particleWrap.querySelectorAll("i"), {
      x: function () { return (Math.random() - .5) * Math.min(window.innerWidth * 1.35, 1350); },
      y: function () { return (Math.random() - .5) * Math.min(window.innerHeight * 1.25, 900); },
      scale: function () { return 1 + Math.random() * 3; },
      opacity: 0,
      duration: .72,
      stagger: .004,
      ease: "expo.out"
    }, .2).to(wordmark, { scale: 1.35, letterSpacing: ".06em", duration: .48, ease: "expo.in" }, .56).to(intro, { opacity: 0, duration: .25, ease: "power2.in" }, .88);

    function finish() {
      if (finished) return;
      finished = true;
      timeline.kill();
      intro.classList.remove("is-active");
      intro.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      intro.remove();
      onReady();
    }

    skip.addEventListener("click", finish);
    intro.addEventListener("click", function (event) {
      if (event.target !== skip) finish();
    });
  }

  function initSmoothScroll() {
    if (reducedMotion || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.08, smoothWheel: true, wheelMultiplier: .92 });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", function (event) {
        window.ScrollTrigger.update();
        updateMarqueeSpeed(event.velocity || 0);
      });
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    var ticking = false;
    function update() {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 26);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function initReveal() {
    var elements = document.querySelectorAll(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(function (element) { element.classList.add("in-view"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -7%" });
    elements.forEach(function (element) { observer.observe(element); });
  }

  function updateMarqueeSpeed(velocity) {
    if (!marqueeTween || marqueePaused) return;
    var target = Math.min(2.6, Math.max(.7, 1 + Math.abs(velocity) * .035));
    if (window.gsap) window.gsap.to(marqueeTween, { timeScale: target, duration: .35, overwrite: true });
  }

  function initMarquee() {
    var marquee = document.querySelector("[data-marquee]");
    var track = document.querySelector("[data-marquee-track]");
    if (!marquee || !track || reducedMotion || !window.gsap) return;
    marqueeTween = window.gsap.to(track, { xPercent: -50, duration: 18, repeat: -1, ease: "none" });
    marquee.addEventListener("mouseenter", function () { marqueePaused = true; marqueeTween.pause(); });
    marquee.addEventListener("mouseleave", function () { marqueePaused = false; marqueeTween.play(); });
  }

  function describeArc(cx, cy, radius, startAngle, endAngle) {
    var start = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
    var end = { x: cx + radius * Math.cos(endAngle), y: cy + radius * Math.sin(endAngle) };
    return "M " + start.x + " " + start.y + " A " + radius + " " + radius + " 0 0 1 " + end.x + " " + end.y;
  }

  function prepareStatIcons() {
    var ring = document.querySelector(".ring-icon g");
    if (ring && !ring.children.length) {
      for (var i = 0; i < 6; i += 1) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        var start = -Math.PI / 2 + i * Math.PI / 3 + .07;
        var end = -Math.PI / 2 + (i + 1) * Math.PI / 3 - .07;
        path.setAttribute("d", describeArc(40, 40, 28, start, end));
        path.setAttribute("stroke-width", "7");
        path.style.setProperty("--i", i);
        ring.appendChild(path);
      }
    }
    document.querySelectorAll(".coin-icon ellipse, .bar-icon rect, .dots-icon circle").forEach(function (shape, index) {
      shape.style.setProperty("--i", index);
    });
  }

  function formatCount(value, kind) {
    var language = window.CBState.lang;
    var formatted = Math.round(value).toLocaleString(language === "de" ? "de-DE" : "en-US");
    if (kind === "currency") return language === "de" ? formatted + " €" : "€" + formatted;
    return formatted;
  }

  function initStats() {
    prepareStatIcons();
    var cards = document.querySelectorAll("[data-stat]");
    if (!("IntersectionObserver" in window) || reducedMotion) {
      cards.forEach(function (card) {
        card.classList.add("animated");
        if (card.parentElement) card.parentElement.classList.add("animated");
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        card.classList.add("animated");
        if (card.parentElement) card.parentElement.classList.add("animated");
        var number = card.querySelector("[data-count]");
        if (number) {
          var target = Number(number.dataset.count);
          var kind = number.dataset.countKind;
          var started = performance.now();
          function tick(now) {
            var p = Math.min(1, (now - started) / 1150);
            var eased = 1 - Math.pow(1 - p, 3);
            number.textContent = formatCount(target * eased, kind);
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
        observer.unobserve(card);
      });
    }, { threshold: .35 });
    cards.forEach(function (card) { observer.observe(card); });
  }

  function initProof() {
    var section = document.querySelector("[data-proof]");
    var stage = section && section.querySelector(".proof-stage");
    var track = document.querySelector("[data-proof-track]");
    if (!section || !stage || !track || mobile || reducedMotion || !window.gsap || !window.ScrollTrigger) return;
    function distance() { return Math.max(0, track.scrollWidth - window.innerWidth + 64); }
    window.gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: function () { return "+=" + Math.max(window.innerWidth, distance() * 1.05); },
        pin: true,
        scrub: .6,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          track.style.setProperty("--proof-shift", ((self.progress - .5) * -44).toFixed(1) + "px");
        }
      }
    });
    root.classList.add("proof-ready");
  }

  function initVenturePop() {
    var cards = Array.from(document.querySelectorAll("[data-proof-track] .venture-card"));
    if (!cards.length) return;

    cards.forEach(function (card, index) {
      var fromLeft = index % 2 === 0;
      card.style.setProperty("--pop-x", fromLeft ? "-74px" : "74px");
      card.style.setProperty("--pop-rotate", fromLeft ? "-2.2deg" : "2.2deg");
      card.style.setProperty("--pop-delay", (index % 2) * 110 + "ms");
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      cards.forEach(function (card) { card.classList.add("is-settled"); });
      return;
    }

    root.classList.add("proof-pop-ready");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        card.classList.add("is-arriving");
        card.addEventListener("animationend", function settle(event) {
          if (event.target !== card || event.animationName !== "venture-pop-in") return;
          card.classList.remove("is-arriving");
          card.classList.add("is-settled");
        });
        observer.unobserve(card);
      });
    }, { threshold: .16, rootMargin: "0px 0px -8%" });

    cards.forEach(function (card) { observer.observe(card); });
  }

  function initImageFallbacks() {
    document.querySelectorAll(".venture-image img").forEach(function (image) {
      function fallback() {
        var wrap = image.closest(".venture-image");
        if (!wrap) return;
        wrap.classList.add("is-fallback");
        wrap.dataset.fallback = image.alt || "Image unavailable";
      }
      image.addEventListener("error", fallback);
      if (image.complete && image.naturalWidth === 0) fallback();
    });
  }

  function initMagneticButtons() {
    if (!finePointer || reducedMotion || !window.gsap) return;
    document.querySelectorAll(".magnetic").forEach(function (button) {
      button.addEventListener("pointermove", function (event) {
        var rect = button.getBoundingClientRect();
        window.gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * .32, y: (event.clientY - rect.top - rect.height / 2) * .36, scale: 1.055, duration: .28, ease: "power3.out" });
      });
      button.addEventListener("pointerleave", function () {
        window.gsap.to(button, { x: 0, y: 0, scale: 1, duration: .72, ease: "elastic.out(1,.38)" });
      });
    });
  }

  function initPortalTilt() {
    if (!finePointer || reducedMotion) return;
    document.querySelectorAll(".portal-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - .5;
        var y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = "rotateY(" + (x * 11) + "deg) rotateX(" + (-y * 9) + "deg) translateY(-12px) scale(1.025)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  function initPageTransitions() {
    var wipe = document.querySelector(".page-wipe");
    if (!wipe) return;

    function resetTransitionState() {
      if (window.gsap) window.gsap.killTweensOf(wipe);
      wipe.classList.remove("is-active");
      wipe.removeAttribute("style");
      document.querySelectorAll("[data-portal].active").forEach(function (card) {
        card.classList.remove("active");
      });
    }

    resetTransitionState();
    window.addEventListener("pageshow", resetTransitionState);

    document.querySelectorAll("[data-transition-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        var href = link.href;
        if (window.gsap && !reducedMotion) {
          window.gsap.to(wipe, { y: 0, duration: .6, ease: "power3.inOut", onComplete: function () { window.location.href = href; } });
        } else {
          wipe.classList.add("is-active");
          window.setTimeout(function () { window.location.href = href; }, reducedMotion ? 0 : 600);
        }
      });
    });
  }

  function initCountdown() {
    var wrap = document.querySelector("[data-countdown]");
    var closed = document.querySelector("[data-countdown-closed]");
    var applyButton = document.querySelector("[data-apply-button]");
    if (!wrap) return;
    var target = new Date("2026-10-18T23:59:59+02:00").getTime();
    var fields = {
      days: wrap.querySelector("[data-countdown-days]"),
      hours: wrap.querySelector("[data-countdown-hours]"),
      minutes: wrap.querySelector("[data-countdown-minutes]"),
      seconds: wrap.querySelector("[data-countdown-seconds]")
    };
    var previous = {};
    var timer = 0;

    function two(value) { return String(value).padStart(2, "0"); }
    function render() {
      var difference = target - Date.now();
      if (difference <= 0) {
        clearInterval(timer);
        wrap.hidden = true;
        if (closed) { closed.hidden = false; closed.setAttribute("role", "status"); }
        if (applyButton) applyButton.hidden = true;
        return;
      }
      var totalSeconds = Math.floor(difference / 1000);
      var values = {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor(totalSeconds % 86400 / 3600),
        minutes: Math.floor(totalSeconds % 3600 / 60),
        seconds: totalSeconds % 60
      };
      Object.keys(values).forEach(function (key) {
        var text = key === "days" ? String(values[key]).padStart(2, "0") : two(values[key]);
        if (previous[key] !== text) {
          fields[key].textContent = text;
          fields[key].classList.remove("tick");
          void fields[key].offsetWidth;
          if (!reducedMotion) fields[key].classList.add("tick");
          previous[key] = text;
        }
      });
    }
    render();
    timer = window.setInterval(render, 1000);
  }

  function init() {
    if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    applyLanguage(window.CBState.lang, false);
    document.querySelectorAll("[data-language]").forEach(function (button) {
      button.addEventListener("click", function () { applyLanguage(button.dataset.language, true); });
    });
    root.classList.add("animations-ready");
    initSmoothScroll();
    initHeader();
    initReveal();
    initMarquee();
    initStats();
    initVenturePop();
    initImageFallbacks();
    initMagneticButtons();
    initPortalTilt();
    initPageTransitions();
    initCountdown();
    initHeroVideo();
    if (window.CompanyBuilderHero) window.CompanyBuilderHero.init();
    if (window.CompanyBuilderTimeline) window.CompanyBuilderTimeline.init();
    if (window.CompanyBuilderNetwork) window.CompanyBuilderNetwork.init();
    initIntro(function () { splitHeroTitle(true); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
