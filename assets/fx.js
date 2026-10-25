/* PIN COURT — playful motion layer. Pure enhancement: the site works without it. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  if (fine) root.classList.add("fx-cursor");
  if (reduce) return;
  root.classList.add("fx");

  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // 1. hero rally ball
  var hero = document.querySelector(".hero");
  if (hero) {
    var rally = document.createElement("div");
    rally.className = "rally"; rally.setAttribute("aria-hidden", "true");
    rally.innerHTML = '<div class="track"><div class="hop"><span class="ball"></span></div><span class="shadow"></span></div>';
    hero.insertBefore(rally, hero.firstChild.nextSibling);
  }

  // 2. tap the hero pin to make it bounce
  var mark = document.querySelector(".hero-mark");
  if (mark) {
    mark.style.pointerEvents = "auto";
    mark.addEventListener("click", function () {
      mark.classList.remove("boing"); void mark.offsetWidth; mark.classList.add("boing");
      setTimeout(function () { mark.classList.remove("boing"); }, 650);
    });
  }

  // 3. ball-mark ripple on every click
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" && e.target.closest("input, textarea, select")) return;
    var h = document.createElement("span");
    var onDark = e.target.closest(".hero, .dark, .band, .site-footer, .fair-card.big");
    h.className = "hit" + (onDark ? "" : " dark");
    h.style.left = e.clientX + "px"; h.style.top = e.clientY + "px";
    document.body.appendChild(h);
    setTimeout(function () { h.remove(); }, 600);
  }, { passive: true });

  // 4. scroll reveal with a short stagger inside each group
  var groups = [".step", ".fair-card", ".why > div", ".placements li", ".timeline li", ".cats li", ".tier-table tbody tr", ".checks li", ".faq details", ".band-item", ".plan > div", ".pool"];
  var items = [];
  groups.forEach(function (sel) {
    $all(sel).forEach(function (el, i) { el.classList.add("reveal"); el.style.setProperty("--d", Math.min(i, 8) * 0.07 + "s"); items.push(el); });
  });

  // 5. count up whole-number stats (keeps any asterisk)
  function countUp(el) {
    var node = el.firstChild; if (!node || node.nodeType !== 3) return;
    var t = node.nodeValue.trim(); if (!/^\d+$/.test(t)) return;
    var end = +t, start = performance.now(), dur = 900;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      node.nodeValue = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  // 6. bracket: ball drops to the final
  var bracket = document.querySelector(".bracket");
  if (bracket) {
    var runner = document.createElement("span"); runner.className = "runner"; bracket.appendChild(runner);
    var fin = bracket.querySelector(".final");
    if (fin) bracket.style.setProperty("--h", (fin.offsetTop + fin.offsetHeight / 2 - 8) + "px");
    items.push(bracket);
  }

  // 7. bouncing ball on the One-Point Shootout card
  var big = document.querySelector(".fair-card.big");
  if (big) { var m = document.createElement("span"); m.className = "mini"; m.setAttribute("aria-hidden", "true"); m.innerHTML = "<i></i><b></b>"; big.appendChild(m); }

  // 8. pincode card cycles through real Mumbai pincodes
  var card = document.querySelector(".pin-card");
  if (card) {
    var codes = ["050", "076", "001", "058", "053", "049", "026", "016", "093", "_ _ _"], k = 0;
    card.innerHTML = card.innerHTML.replace("400 _ _ _", '400 <span class="roll">_ _ _</span>');
    var roll = card.querySelector(".roll");
    setInterval(function () { if (roll) roll.textContent = codes[k++ % codes.length]; }, 1400);
  }


  // 9. live ball cursor: wake + shadow, racket over anything clickable, never lost on lime
  if (fine) {
    root.classList.add("fx-live");
    var RACKET = '<svg viewBox="0 0 40 40" class="r"><g><ellipse cx="20" cy="13" rx="9" ry="11" fill="rgba(255,248,232,.55)" stroke="#0A2A1F" stroke-width="2.6"/>' +
      '<path d="M15 3.5v19M20 2v22M25 3.5v19M11.5 8h17M11 13h18M11.5 18h17" stroke="#0A2A1F" stroke-width=".8" opacity=".7"/>' +
      '<path d="M17.6 23.6l2.4 4 2.4-4" fill="none" stroke="#0A2A1F" stroke-width="2"/><rect x="18.2" y="27" width="3.6" height="12" rx="1.6" fill="#103F2E" stroke="#0A2A1F"/></g></svg>';
    var cur = document.createElement("div"); cur.className = "cur hide"; cur.innerHTML = '<span class="b"></span>' + RACKET;
    var sh = document.createElement("div"); sh.className = "cur-shadow hide";
    var N = 7, trail = [];
    for (var t = 0; t < N; t++) {
      var d = document.createElement("div"); d.className = "cur-trail hide";
      var sc = 1 - t / (N + 1); d.style.opacity = (0.55 * sc).toFixed(2);
      document.body.appendChild(d); trail.push({ el: d, x: -99, y: -99, s: sc });
    }
    document.body.appendChild(sh); document.body.appendChild(cur);
    var mx = -99, my = -99, shown = false, lastEl = null;
    var isLime = function (el) {
      for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
        var c = getComputedStyle(n).backgroundColor, m = c && c.match(/\d+(\.\d+)?/g);
        if (m && (m.length < 4 || +m[3] > 0.5)) { return +m[0] > 180 && +m[1] > 200 && +m[2] < 130; }
      }
      return false;
    };
    var CLICKABLE = "a, button, summary, label.chip, select, input[type=checkbox], input[type=radio], [role=button], .hero-mark";
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; [cur, sh].concat(trail.map(function (o) { o.x = mx; o.y = my; return o.el; })).forEach(function (el) { el.classList.remove("hide"); }); }
      var el = e.target instanceof Element ? e.target : null;
      cur.classList.toggle("on-link", !!(el && el.closest(CLICKABLE)));
      if (el !== lastEl) {
        lastEl = el;
        var lime = !!(el && isLime(el));
        cur.classList.toggle("on-lime", lime);
        trail.forEach(function (o) { o.el.classList.toggle("on-lime", lime); });
      }
    }, { passive: true });
    document.addEventListener("pointerdown", function () { cur.classList.add("down"); });
    document.addEventListener("pointerup", function () { cur.classList.remove("down"); });
    document.documentElement.addEventListener("mouseleave", function () { shown = false; [cur, sh].concat(trail.map(function (o) { return o.el; })).forEach(function (el) { el.classList.add("hide"); }); });
    (function frame() {
      var px = mx, py = my;
      trail.forEach(function (o, i) {
        o.x += (px - o.x) * 0.42; o.y += (py - o.y) * 0.42;
        o.el.style.transform = "translate(" + o.x.toFixed(1) + "px," + o.y.toFixed(1) + "px) scale(" + o.s.toFixed(2) + ")";
        px = o.x; py = o.y;
      });
      cur.style.transform = "translate(" + mx + "px," + my + "px)";
      sh.style.transform = "translate(" + (mx + 7) + "px," + (my + 18) + "px)";
      requestAnimationFrame(frame);
    })();
  }

  var seen = function (el) {
    el.classList.add("in");
    if (el.classList.contains("band-item")) { var b = el.querySelector("b"); if (b) countUp(b); }
  };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { seen(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(seen);
  }
})();
