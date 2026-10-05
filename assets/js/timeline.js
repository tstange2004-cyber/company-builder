(function () {
  "use strict";

  var FOCUS_BY_LENS = {
    startup: [1, 2],
    investor: [0, 2, 4],
    mentor: [0, 1]
  };

  function init() {
    var section = document.querySelector("[data-program]");
    if (!section) return;

    var nodes = Array.prototype.slice.call(section.querySelectorAll("[data-step]"));
    var cards = Array.prototype.slice.call(section.querySelectorAll("[data-timeline-card]"));
    var copies = Array.prototype.slice.call(section.querySelectorAll("[data-timeline-copy]"));
    var progressPath = section.querySelector("[data-timeline-path]");
    var stage = section.querySelector(".program-stage");
    var gate = section.querySelector(".gate-node");
    var investors = Array.prototype.slice.call(section.querySelectorAll("[data-next-investors] span"));
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var activeIndex = 0;
    var length = 0;

    function state() {
      return window.CBState || { lens: "startup", lang: "en" };
    }

    function setPath(value) {
      if (!progressPath || !length) return;
      progressPath.style.strokeDashoffset = String(length * (1 - value));
    }

    function animateInvestors(show) {
      if (!window.gsap || reduced) {
        investors.forEach(function (item) {
          item.style.opacity = show ? "1" : "0";
          item.style.transform = show ? "none" : "translateY(8px)";
        });
        return;
      }
      window.gsap.killTweensOf(investors);
      if (show) {
        window.gsap.fromTo(investors,
          { opacity: 0, y: 9 },
          { opacity: 1, y: 0, duration: .52, stagger: .055, ease: "power3.out", overwrite: true }
        );
      } else {
        window.gsap.set(investors, { opacity: 0, y: 9 });
      }
    }

    function activate(index) {
      index = Math.max(0, Math.min(nodes.length - 1, index));
      if (activeIndex === index && nodes[index] && nodes[index].classList.contains("active")) return;
      activeIndex = index;
      nodes.forEach(function (node, itemIndex) {
        var selected = itemIndex === index;
        node.classList.toggle("active", selected);
        node.setAttribute("aria-selected", selected ? "true" : "false");
        node.setAttribute("tabindex", selected ? "0" : "-1");
      });
      cards.forEach(function (card, itemIndex) {
        card.classList.toggle("active", itemIndex === index);
      });
      if (gate) gate.classList.toggle("gate-open", index >= 2);
      animateInvestors(index === 4);
    }

    function applyLens() {
      var selected = FOCUS_BY_LENS[state().lens] || FOCUS_BY_LENS.startup;
      nodes.forEach(function (node, index) {
        node.classList.toggle("is-focus", selected.indexOf(index) !== -1);
      });
      applyCopy();
    }

    function applyCopy() {
      var current = state();
      var language = window.CB_LENS_COPY && window.CB_LENS_COPY[current.lang];
      var lens = language && language[current.lens];
      if (!lens) return;
      copies.forEach(function (element, index) {
        var next = lens.timeline[index];
        if (!next || element.textContent === next) return;
        if (window.gsap && !reduced) {
          window.gsap.to(element, {
            opacity: 0,
            y: 6,
            duration: .16,
            onComplete: function () {
              element.textContent = next;
              window.gsap.to(element, { opacity: 1, y: 0, duration: .28, ease: "power3.out" });
            }
          });
        } else {
          element.textContent = next;
        }
      });
    }

    function goToStep(index) {
      if (cards[index]) cards[index].scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    }

    nodes.forEach(function (node, index) {
      node.addEventListener("click", function () { goToStep(index); });
      node.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        var direction = event.key === "ArrowRight" ? 1 : -1;
        var next = (index + direction + nodes.length) % nodes.length;
        nodes[next].focus();
        goToStep(next);
      });
    });

    if (progressPath) {
      length = progressPath.getTotalLength();
      progressPath.style.strokeDasharray = String(length);
      progressPath.style.strokeDashoffset = reduced ? "0" : String(length);
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var index = Number(entry.target.getAttribute("data-timeline-card"));
          activate(index);
        });
      }, { rootMargin: "-32% 0px -48%", threshold: .08 });
      cards.forEach(function (card) { observer.observe(card); });
      setPath(1);
    }

    window.addEventListener("cb:lens", applyLens);
    window.addEventListener("cb:language", applyCopy);
    applyLens();
    activeIndex = -1;
    activate(0);
    document.documentElement.classList.add("timeline-ready");
  }

  window.CompanyBuilderTimeline = {
    init: init,
    focusByLens: FOCUS_BY_LENS
  };
}());
