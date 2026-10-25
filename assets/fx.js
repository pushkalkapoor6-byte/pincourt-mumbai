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

  // 5. count up whole-number stats
  function countUp(el) {
    var t = el.textContent.trim(); if (!/^\d+$/.test(t)) return;
    var end = +t, start = performance.now(), dur = 900;
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v; if (p < 1) requestAnimationFrame(tick);
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

  var seen = function (el) {
    el.classList.add("in");
    if (el.classList.contains("band-item")) { var b = el.querySelector("b"); if (b && !b.querySelector("sup")) countUp(b); }
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
