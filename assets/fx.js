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

  // 1. hero court scene: a ball rallies over the net and bounces on the court
  var svg = document.querySelector(".scene");
  if (svg) {
    var NS = "http://www.w3.org/2000/svg";
    var F = 427, ZC = -9, HC = 6, CX = 300, HY = 112, NZ = 11.885, R = 0.25;
    var proj = function (X, Z, Y) { var d = Z - ZC; return [CX + F * X / d, HY + F * (HC - Y) / d, F / d]; };
    var far = svg.querySelector(".layer-far"), near = svg.querySelector(".layer-near");
    var mk = function (tag, cls) { var e = document.createElementNS(NS, tag); if (cls) e.setAttribute("class", cls); return e; };
    var sh = mk("ellipse", "sshadow"), ballG = mk("g", "sball"), ball = mk("circle");
    ballG.appendChild(ball);
    // one rally = a list of points the ball travels through; c = arc control height
    var rally = function (s) {
      return [
        { X: 3.0 * s, Z: 0.8, Y: 1.0 },
        { X: 1.9 * s, Z: 19.5, Y: 0, c: 4.2, t: 1000, bounce: true },
        { X: 1.6 * s, Z: 24.0, Y: 1.1, c: 2.0, t: 420 },
        { X: 2.9 * s, Z: 4.4, Y: 0, c: 4.2, t: 1000, bounce: true },
        { X: 3.1 * s, Z: -0.4, Y: 1.0, c: 2.0, t: 420 },
        { X: 2.2 * s, Z: 18.4, Y: 0, c: 4.6, t: 1050, bounce: true },
        { X: 1.7 * s, Z: 23.2, Y: 0.55, c: 1.6, t: 420 },
        { X: 1.5 * s, Z: 25.5, Y: 0, c: 1.0, t: 380, bounce: true },
        { X: 1.4 * s, Z: 26.6, Y: 0, c: 0.15, t: 500, fade: true }
      ];
    };
    var side = 1, pts = rally(side), seg = 1, segStart = 0, running = true, vis = true;
    var addMark = function (p) {
      var q = proj(p.X, p.Z, 0), m = mk("ellipse", "mark");
      m.setAttribute("cx", q[0].toFixed(1)); m.setAttribute("cy", q[1].toFixed(1));
      m.setAttribute("rx", (q[2] * 0.32).toFixed(1)); m.setAttribute("ry", (q[2] * 0.1).toFixed(1));
      (p.Z > NZ ? far : near).appendChild(m); setTimeout(function () { m.remove(); }, 1500);
    };
    var draw = function (X, Z, Y, op) {
      var layer = Z > NZ ? far : near;
      if (ballG.parentNode !== layer) { layer.appendChild(sh); layer.appendChild(ballG); }
      var b = proj(X, Z, Y), g = proj(X, Z, 0), r = b[2] * R;
      ball.setAttribute("cx", b[0].toFixed(1)); ball.setAttribute("cy", (b[1] - r).toFixed(1)); ball.setAttribute("r", r.toFixed(2));
      sh.setAttribute("cx", g[0].toFixed(1)); sh.setAttribute("cy", g[1].toFixed(1));
      sh.setAttribute("rx", (r * 1.3 / (1 + Y * 0.25)).toFixed(2)); sh.setAttribute("ry", (r * 0.42 / (1 + Y * 0.25)).toFixed(2));
      sh.style.opacity = (Math.max(0.25, 1 - Y * 0.22) * op).toFixed(2); ballG.style.opacity = op;
    };
    var step = function (now) {
      if (!running) return;
      if (!segStart) segStart = now;
      if (now < segStart) { if (vis) requestAnimationFrame(step); else running = false; return; }
      var A = pts[seg - 1], B = pts[seg], t = Math.min(1, (now - segStart) / B.t), u = 1 - t;
      var X = A.X + (B.X - A.X) * t, Z = A.Z + (B.Z - A.Z) * t;
      var Y = u * u * A.Y + 2 * t * u * B.c + t * t * B.Y;
      draw(X, Z, Y, B.fade ? 1 - t : 1);
      if (t >= 1) {
        if (B.bounce) addMark(B);
        seg++; segStart = now;
        if (seg >= pts.length) { seg = 1; side = -side; pts = rally(side); segStart = now + 900; draw(0, 0, 0, 0); }
      }
      if (vis) requestAnimationFrame(step); else running = false;
    };
    requestAnimationFrame(step);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        vis = en[0].isIntersecting;
        if (vis && !running) { running = true; segStart = 0; requestAnimationFrame(step); }
      }).observe(svg);
    }
    // tap the pin: it jumps (and a tiny buzz on Android phones)
    var pinEl = svg.querySelector(".scene-pin");
    if (pinEl) pinEl.addEventListener("click", function () {
      pinEl.classList.remove("boing"); void pinEl.getBoundingClientRect(); pinEl.classList.add("boing");
      if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
      setTimeout(function () { pinEl.classList.remove("boing"); }, 750);
    });
  }

  // 2. phones: tap empty space and a ball drops and bounces where you tapped
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a, button, input, textarea, select, label, summary, .scene-pin, form")) return;
      var d = document.createElement("span"); d.className = "drop";
      d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px";
      d.innerHTML = "<i></i><b></b>"; document.body.appendChild(d);
      setTimeout(function () { d.remove(); }, 1400);
    });
  }

  // 3a. a ball rolls along the top of the screen as you scroll
  var sb = document.createElement("div"); sb.className = "scroll-ball"; sb.setAttribute("aria-hidden", "true");
  sb.innerHTML = '<div class="bar"></div><span class="b"></span>'; document.body.appendChild(sb);
  var bar = sb.querySelector(".bar"), sbb = sb.querySelector(".b");
  var onScroll = function () {
    var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, scrollY / max) : 0;
    bar.style.transform = "scaleX(" + p + ")";
    sbb.style.transform = "translateX(" + (p * innerWidth) + "px) rotate(" + (p * 1440) + "deg)";
    sb.style.opacity = scrollY > 40 ? 1 : 0;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // 3b. phones: sticky call-to-action once the hero has scrolled away, hidden at the form
  var target = document.querySelector("#join") ? { id: "#join", text: "Your pincode needs a team", btn: "Rep your pincode" }
                                                : { id: "#enquire", text: "Put your brand on court", btn: "Become a partner" };
  var formSec = document.querySelector(target.id), heroSec = document.querySelector(".hero");
  if (formSec && heroSec && "IntersectionObserver" in window) {
    var bar2 = document.createElement("div"); bar2.className = "sticky-cta";
    bar2.innerHTML = '<img src="assets/icon-reversed.svg" alt=""><span>' + target.text + '</span><a class="btn btn-lime" href="' + target.id + '">' + target.btn + "</a>";
    document.body.appendChild(bar2);
    var heroGone = false, formIn = false;
    var upd = function () { bar2.classList.toggle("show", heroGone && !formIn); };
    new IntersectionObserver(function (en) { heroGone = !en[0].isIntersecting; upd(); }).observe(heroSec);
    new IntersectionObserver(function (en) { formIn = en[0].isIntersecting; upd(); }, { threshold: 0.05 }).observe(formSec);
  }

  // 3. ball-mark ripple on every click
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" && e.target.closest("input, textarea, select")) return;
    var h = document.createElement("span");
    var onDark = e.target.closest(".hero, .dark, .band, .site-footer, .fair-card.big, .sticky-cta");
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
    var CLICKABLE = "a, button, summary, label.chip, select, input[type=checkbox], input[type=radio], [role=button], .scene-pin";
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
