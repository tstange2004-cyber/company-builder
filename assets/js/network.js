/** Positioniert das Netzwerk, zeichnet Verbindungen und steuert die Filter. */
(function () {
  "use strict";

  function init() {
    var section = document.querySelector("[data-network]");
    var map = document.querySelector("[data-network-map]");
    var canvas = document.querySelector("[data-network-canvas]");
    if (!section || !map || !canvas) return;

    var context = canvas.getContext("2d");
    var nodes = Array.prototype.slice.call(section.querySelectorAll("[data-network-node]"));
    var filters = Array.prototype.slice.call(section.querySelectorAll("[data-network-filter]"));
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var positions = [];
    var enabled = { partner: true, investor: true, mentor: true, center: true };
    var width = 0;
    var height = 0;
    var radii = { partner: 0, investor: 0, mentor: 0 };
    var dpr = 1;
    var lineProgress = reduced ? 1 : 0;
    var animationFrame = 0;
    var inView = false;
    var revealStarted = 0;
    var nodesRevealed = false;
    var arrangeFrame = 0;

    function arrange() {
      var rect = map.getBoundingClientRect();
      var size = Math.max(1, Math.round(map.clientWidth || rect.width));

      /* Keep the drawing surface mathematically square at every breakpoint. */
      if (Math.abs(map.clientHeight - size) > 0.5) map.style.height = size + "px";
      map.style.setProperty("--network-size", size + "px");
      width = size;
      height = size;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      positions.length = 0;

      var centerX = width / 2;
      var centerY = height / 2;
      var orbitNode = nodes.length > 1 ? nodes[1] : null;
      var orbitNodeSize = orbitNode ? orbitNode.getBoundingClientRect().width : 52;
      var outerRadius = Math.max(1, size / 2 - orbitNodeSize / 2 - 8);
      radii.partner = outerRadius * .38;
      radii.investor = outerRadius * .69;
      radii.mentor = outerRadius;
      var groupCounts = { partner: 0, investor: 0, mentor: 0 };
      var groupTotals = {
        partner: nodes.filter(function (node) { return node.dataset.group === "partner"; }).length,
        investor: nodes.filter(function (node) { return node.dataset.group === "investor"; }).length,
        mentor: nodes.filter(function (node) { return node.dataset.group === "mentor"; }).length
      };

      nodes.forEach(function (node) {
        var group = node.dataset.group;
        var x = centerX;
        var y = centerY;
        if (group !== "center") {
          var index = groupCounts[group]++;
          var total = groupTotals[group];
          var radius = radii[group];
          var offset = group === "partner" ? -.5 : group === "investor" ? -.5 : -.5 + Math.PI / total;
          var angle = -Math.PI / 2 + offset + index / total * Math.PI * 2;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
        }
        node.style.left = x + "px";
        node.style.top = y + "px";
        positions.push({ x: x, y: y, group: group, node: node });
      });
      draw(performance.now());
    }

    function scheduleArrange() {
      cancelAnimationFrame(arrangeFrame);
      arrangeFrame = requestAnimationFrame(function () {
        arrangeFrame = 0;
        arrange();
      });
    }

    function groupAlpha(group) {
      if (!enabled[group]) return 0;
      return group === "partner" ? .82 : group === "investor" ? .56 : .42;
    }

    function drawLine(from, to, alpha, widthValue, now, index) {
      var endX = from.x + (to.x - from.x) * lineProgress;
      var endY = from.y + (to.y - from.y) * lineProgress;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(endX, endY);
      context.lineWidth = widthValue;
      context.strokeStyle = "rgba(250,204,21," + alpha + ")";
      context.stroke();

      if (!reduced && lineProgress > .2 && alpha > .1) {
        var signal = (now * .00033 + index * .137) % 1;
        signal = Math.min(signal, lineProgress);
        var signalX = from.x + (to.x - from.x) * signal;
        var signalY = from.y + (to.y - from.y) * signal;
        context.save();
        context.shadowBlur = 18;
        context.shadowColor = "rgba(250,204,21,.95)";
        context.fillStyle = "rgba(255,248,198," + Math.min(1, alpha + .3) + ")";
        context.beginPath();
        context.arc(signalX, signalY, widthValue > 1 ? 4.4 : 3, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    function draw(now) {
      now = now || performance.now();
      context.clearRect(0, 0, width, height);
      if (!positions.length) return;
      var center = positions[0];
      var partners = positions.filter(function (item) { return item.group === "partner"; });

      positions.slice(1).forEach(function (item, index) {
        if (!enabled[item.group]) return;
        var parent = center;
        if (item.group !== "partner" && partners.length) parent = partners[index % partners.length];
        drawLine(parent, item, groupAlpha(item.group), item.group === "partner" ? 2.1 : 1.05, now, index);
      });

      var rotation = reduced ? 0 : now * .00016;
      context.beginPath();
      context.arc(center.x, center.y, radii.investor, rotation, rotation + Math.PI * 2 * lineProgress);
      context.strokeStyle = "rgba(250,204,21,.34)";
      context.lineWidth = 2.6;
      context.stroke();
      context.beginPath();
      context.arc(center.x, center.y, radii.mentor, -rotation * .7, -rotation * .7 + Math.PI * 2 * lineProgress);
      context.strokeStyle = "rgba(250,204,21,.42)";
      context.lineWidth = 3.2;
      context.stroke();
    }

    function animateLines() {
      cancelAnimationFrame(animationFrame);
      if (reduced || window.innerWidth < 768) {
        lineProgress = 1;
        draw(performance.now());
        return;
      }
      if (!revealStarted) revealStarted = performance.now();
      function tick(now) {
        var raw = Math.min(1, (now - revealStarted) / 1550);
        lineProgress = 1 - Math.pow(1 - raw, 3);
        draw(now);
        if (inView) animationFrame = requestAnimationFrame(tick);
      }
      animationFrame = requestAnimationFrame(tick);
    }

    function revealNodes() {
      if (nodesRevealed || reduced || window.innerWidth < 768 || !window.gsap) return;
      nodesRevealed = true;
      var center = positions[0];
      var orbitNodes = nodes.slice(1);
      window.gsap.fromTo(orbitNodes, {
        x: function (index) { return center.x - positions[index + 1].x; },
        y: function (index) { return center.y - positions[index + 1].y; },
        opacity: 0,
        scale: .18
      }, {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.18,
        stagger: .038,
        ease: "expo.out",
        clearProps: "transform,opacity"
      });
    }

    function applyFilters() {
      nodes.forEach(function (node) {
        var group = node.dataset.group;
        node.classList.toggle("is-muted", group !== "center" && !enabled[group]);
        node.setAttribute("aria-hidden", group !== "center" && !enabled[group] ? "true" : "false");
        node.tabIndex = group !== "center" && !enabled[group] ? -1 : 0;
      });
      draw(performance.now());
    }

    filters.forEach(function (filter) {
      filter.addEventListener("change", function () {
        enabled[filter.dataset.networkFilter] = filter.checked;
        applyFilters();
      });
    });

    var hasObserver = "IntersectionObserver" in window;
    if (hasObserver) {
      new IntersectionObserver(function (entries) {
        if (entries[0] && entries[0].isIntersecting) {
          inView = true;
          revealNodes();
          animateLines();
        } else {
          inView = false;
          cancelAnimationFrame(animationFrame);
        }
      }, { threshold: .16 }).observe(map);
    } else {
      inView = true;
    }

    window.addEventListener("resize", scheduleArrange, { passive: true });
    window.addEventListener("orientationchange", scheduleArrange, { passive: true });
    window.addEventListener("load", scheduleArrange, { once: true });
    window.addEventListener("pageshow", scheduleArrange);

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { scheduleArrange(); }).observe(map);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleArrange);

    /* Apply the final map width before the first measurement. */
    document.documentElement.classList.add("network-ready");
    arrange();
    applyFilters();
    requestAnimationFrame(scheduleArrange);
    if (!hasObserver) {
      revealNodes();
      animateLines();
    }
  }

  window.CompanyBuilderNetwork = { init: init };
}());
