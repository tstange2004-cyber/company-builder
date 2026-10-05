/**
 * Gemeinsame Logik der klassischen Unterseiten.
 * Die animierte Startseite verwendet bewusst eigene, spezialisierte Skripte.
 */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#main-nav");

  // Ein Reload beginnt immer oben statt an einer zuvor verwendeten Sprungmarke.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("pageshow", (event) => {
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    if (event.persisted || navigationEntry?.type === "reload") window.scrollTo(0, 0);
  });

  // Kopfzeile und Mobilmenü werden auf jeder Unterseite gleich gesteuert.
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (menuButton && navigation) {
    const menuLabel = menuButton.querySelector(".sr-only");
    const setMenuOpen = (open) => {
      menuButton.setAttribute("aria-expanded", String(open));
      navigation.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      if (menuLabel) menuLabel.textContent = open ? "Menü schließen" : "Menü öffnen";
    };

    menuButton.addEventListener("click", () => {
      setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });
    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenuOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1120) setMenuOpen(false);
    });
  }

  // Ruhige Einblendungen unterstützen die Orientierung, bleiben aber optional.
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(".inner-section > .inner-content");
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
})();
