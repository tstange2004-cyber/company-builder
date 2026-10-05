(function () {
  "use strict";

  var api = {};

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(value) {
    value = clamp(value, 0, 1);
    return value * value * (3 - 2 * value);
  }

  function init() {
    var section = document.querySelector("[data-hero]");
    var canvas = document.querySelector("[data-hero-canvas]");
    var stage = section.querySelector(".hero-stage");
    if (!section || !canvas) return;

    var context = canvas.getContext("2d", { alpha: true });
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var particles = [];
    var research = [];
    var lattice = [];
    var logoBars = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var progress = reduced ? 1 : 0;
    var active = true;
    var frame = 0;
    var last = performance.now();
    var mouse = { x: -9999, y: -9999, active: false };

    function particleCount() {
      if (window.innerWidth < 768) return 340;
      var cores = navigator.hardwareConcurrency || 4;
      var base = window.innerWidth > 1600 ? 1500 : window.innerWidth > 1100 ? 1280 : 940;
      return cores <= 4 ? Math.round(base * .8) : base;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildFormations();
      if (reduced) draw(performance.now());
    }

    function buildHexPoints() {
      var points = [];
      var spacing = width < 768 ? 31 : 37;
      var startX = width < 768 ? width * .07 : width * .49;
      var endX = width * .97;
      var startY = height * .15;
      var endY = height * .86;
      var row = 0;
      for (var y = startY; y <= endY; y += spacing * .86) {
        for (var x = startX; x <= endX; x += spacing) {
          points.push({ x: x + (row % 2 ? spacing * .5 : 0), y: y });
        }
        row += 1;
      }
      return points;
    }

    function buildLogoBarPoints() {
      var points = [];
      var spacing = width < 768 ? 4.2 : 5.8;
      var barWidth = clamp(width * .046, 24, 62);
      var gap = barWidth * .62;
      var totalWidth = barWidth * 3 + gap * 2;
      var centerX = width < 768 ? width * .7 : width * .82;
      var startX = centerX - totalWidth / 2;
      var baseY = height * .82;
      var maxHeight = Math.min(height * .56, width < 768 ? 360 : 520);
      var heights = [maxHeight * .34, maxHeight * .65, maxHeight];

      heights.forEach(function (barHeight, barIndex) {
        var left = startX + barIndex * (barWidth + gap);
        for (var x = left; x <= left + barWidth; x += spacing) {
          for (var y = baseY - barHeight; y <= baseY; y += spacing) {
            points.push({ x: x, y: y, bar: barIndex });
          }
        }
      });

      for (var i = points.length - 1; i > 0; i -= 1) {
        var swapIndex = Math.floor(Math.random() * (i + 1));
        var temporary = points[i];
        points[i] = points[swapIndex];
        points[swapIndex] = temporary;
      }
      return points;
    }

    function buildFormations() {
      var count = particleCount();
      var hexPoints = buildHexPoints();
      var barPoints = buildLogoBarPoints();
      particles.length = 0;
      research.length = 0;
      lattice.length = 0;
      logoBars.length = 0;

      for (var i = 0; i < count; i += 1) {
        var rx = Math.random() * width;
        var ry = Math.random() * height;
        var hex = hexPoints[i % hexPoints.length];
        var bar = barPoints[i % barPoints.length];
        research.push({ x: rx, y: ry });
        lattice.push({
          x: hex.x + (i >= hexPoints.length ? (Math.random() - .5) * 5 : 0),
          y: hex.y + (i >= hexPoints.length ? (Math.random() - .5) * 5 : 0)
        });
        logoBars.push({
          x: bar.x + (i >= barPoints.length ? (Math.random() - .5) * unitFor(width) * .35 : 0),
          y: bar.y + (i >= barPoints.length ? (Math.random() - .5) * unitFor(width) * .35 : 0)
        });
        particles.push({
          x: rx,
          y: ry,
          size: Math.random() < .08 ? 1.8 : Math.random() * .8 + .45,
          phase: Math.random() * Math.PI * 2,
          speed: .12 + Math.random() * .28,
          accent: Math.random() < .055
        });
      }
    }

    function unitFor(w) {
      return w < 768 ? 6 : 8;
    }

    function positionFor(index, now) {
      var a = research[index];
      var b = lattice[index];
      var c = logoBars[index];
      var p = particles[index];
      var driftStrength = 1 - smoothstep((progress - .13) / .27);
      var driftX = Math.sin(now * .00022 * p.speed + p.phase) * 13 * driftStrength;
      var driftY = Math.cos(now * .00018 * p.speed + p.phase) * 10 * driftStrength;
      var x;
      var y;

      if (progress < .55) {
        var toGrid = smoothstep((progress - .18) / .37);
        x = a.x + (b.x - a.x) * toGrid + driftX;
        y = a.y + (b.y - a.y) * toGrid + driftY;
      } else {
        var toLogo = smoothstep((progress - .55) / .42);
        x = b.x + (c.x - b.x) * toLogo;
        y = b.y + (c.y - b.y) * toLogo;
      }

      if (mouse.active && !coarse && progress < .7) {
        var dx = x - mouse.x;
        var dy = y - mouse.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var radius = 120;
        if (distance > .1 && distance < radius) {
          var force = (1 - distance / radius) * 56;
          x += dx / distance * force;
          y += dy / distance * force;
        }
      }
      return { x: x, y: y };
    }

    function draw(now) {
      if (!context || !particles.length) return;
      context.clearRect(0, 0, width, height);
      var positions = new Array(particles.length);
      for (var i = 0; i < particles.length; i += 1) positions[i] = positionFor(i, now);

      context.lineWidth = .55;
      var finalLineAlpha = .16 * (1 - smoothstep((progress - .8) / .18));
      context.strokeStyle = progress < .66 ? "rgba(18,18,18,.14)" : "rgba(170,132,0," + finalLineAlpha + ")";
      context.beginPath();
      var limit = Math.min(positions.length, 440);
      for (var j = 0; j < limit; j += progress < .35 ? 7 : 4) {
        var nextIndex = (j + 1 + (j % 5)) % limit;
        var one = positions[j];
        var two = positions[nextIndex];
        var distX = one.x - two.x;
        var distY = one.y - two.y;
        if (distX * distX + distY * distY < (progress < .35 ? 10500 : 3600)) {
          context.moveTo(one.x, one.y);
          context.lineTo(two.x, two.y);
        }
      }
      context.stroke();

      for (var k = 0; k < positions.length; k += 1) {
        var point = positions[k];
        var particle = particles[k];
        var windowGlow = progress > .72 && (particle.accent || (progress > .9 && k % 9 === 0));
        context.fillStyle = windowGlow ? "rgba(250,204,21,1)" : "rgba(18,18,18,.58)";
        context.beginPath();
        context.arc(point.x, point.y, windowGlow ? particle.size * 2.25 : particle.size * 1.2, 0, Math.PI * 2);
        context.fill();
      }

      drawTransitionPulse(.33, width * .72, height * .48);
      drawTransitionPulse(.66, width * .74, height * .55);

      function drawTransitionPulse(centerProgress, cx, cy) {
        var local = (progress - (centerProgress - .085)) / .17;
        if (local <= 0 || local >= 1) return;
        var alpha = Math.sin(local * Math.PI);
        var radius = 34 + local * Math.min(width, height) * .62;
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.strokeStyle = "rgba(250,204,21," + (alpha * .72) + ")";
        context.lineWidth = 1.5 + alpha * 3;
        context.shadowBlur = 24;
        context.shadowColor = "rgba(250,204,21,.7)";
        context.stroke();
        context.shadowBlur = 0;
      }
    }

    function loop(now) {
      frame = requestAnimationFrame(loop);
      if (!active || document.hidden || reduced) return;
      if (now - last < 16) return;
      last = now;
      draw(now);
    }

    function setProgress(value) {
      progress = clamp(value, 0, 1);
      if (stage) stage.style.setProperty("--hero-progress", progress.toFixed(4));
      if (reduced) draw(performance.now());
    }

    if (!reduced && window.ScrollTrigger) {
      window.ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: .6,
        onUpdate: function (self) { setProgress(self.progress); }
      });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        active = Boolean(entries[0] && entries[0].isIntersecting);
      }, { rootMargin: "20% 0px" }).observe(section);
    }

    canvas.addEventListener("pointermove", function (event) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    }, { passive: true });
    canvas.addEventListener("pointerleave", function () { mouse.active = false; });
    window.addEventListener("resize", resize, { passive: true });
    resize();
    setProgress(progress);
    if (!reduced) frame = requestAnimationFrame(loop);

    api.destroy = function () {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
    api.setProgress = setProgress;
  }

  api.init = init;
  window.CompanyBuilderHero = api;
}());
