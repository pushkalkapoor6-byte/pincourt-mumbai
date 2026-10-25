/* PIN COURT — form handling (players + sponsors)
   Sends each submission to the Google Apps Script web app in config.js. */
(function () {
  "use strict";
  var cfg = window.PINCOURT_CONFIG || {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function fieldOf(el) { return el.closest(".field"); }
  function scrollToEl(el) { var y = el.getBoundingClientRect().top + window.pageYOffset - window.innerHeight / 3; window.scrollTo({ top: Math.max(0, y), behavior: "smooth" }); }
  function setInvalid(el, bad) { var f = fieldOf(el); if (f) f.classList.toggle("invalid", bad); return !bad; }

  // digits-only inputs
  $all('input[inputmode="numeric"]').forEach(function (el) {
    el.addEventListener("input", function () { el.value = el.value.replace(/\D/g, "").slice(0, +el.maxLength || 20); });
  });

  // pincode hint
  var pin = $("#p-pin"), pinHint = $("#pin-hint");
  if (pin && pinHint) {
    pin.addEventListener("input", function () {
      var v = pin.value;
      if (v.length === 6 && !/^40[0-1]/.test(v)) {
        pinHint.textContent = "That's outside Mumbai. Still fine to register.";
        pinHint.classList.add("warn");
      } else {
        pinHint.textContent = "The pincode where you live.";
        pinHint.classList.remove("warn");
      }
    });
  }

  // guardian block for under-18s
  var guardian = $("#guardian");
  $all('input[name="ageGroup"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var minor = r.value !== "18+";
      guardian.classList.toggle("show", minor);
      $("#p-gname").required = minor;
      var lbl = $('label[for="p-mobile"]');
      if (lbl) lbl.textContent = minor ? "Parent's mobile (WhatsApp)" : "Mobile (WhatsApp)";
    });
  });

  // ready-made squad details
  var squadBox = $("#squad-box");
  $all('input[name="entryType"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var squad = r.value !== "Individual" && r.checked;
      squadBox.classList.toggle("show", squad);
      $("#p-squadsize").required = squad;
    });
  });

  // clear error on change
  document.addEventListener("input", function (e) { var f = e.target.closest && e.target.closest(".field.invalid"); if (f) f.classList.remove("invalid"); });
  document.addEventListener("change", function (e) { var f = e.target.closest && e.target.closest(".field.invalid"); if (f) f.classList.remove("invalid"); });

  function validate(form) {
    var ok = true, first = null;
    $all("input, select, textarea", form).forEach(function (el) {
      if (el.closest(".hp")) return;
      var good = true, v = (el.value || "").trim();
      if (el.type === "radio") {
        if (!el.required) return;
        good = !!form.querySelector('input[name="' + el.name + '"]:checked');
      } else if (el.type === "checkbox") {
        if (!el.required) return;
        good = el.checked;
      } else {
        if (el.required && !v) good = false;
        else if (v && el.pattern && !new RegExp("^(?:" + el.pattern + ")$").test(v)) good = false;
        else if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) good = false;
      }
      if (!setInvalid(el, !good)) { ok = false; if (!first) first = el; }
    });
    // at least one partnership option on the sponsor form
    var group = form.querySelector("[data-require-one]");
    if (group) {
      var any = $all("input:checked", group).length > 0;
      group.closest(".field").classList.toggle("invalid", !any);
      if (!any) { ok = false; if (!first) first = group.querySelector("input"); }
    }
    if (first) { scrollToEl(fieldOf(first) || first); }
    return ok;
  }

  function collect(form) {
    var data = { type: form.dataset.type, page: location.pathname, submittedAt: new Date().toISOString() };
    $all("input, select, textarea", form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) data[el.name] = el.value; return; }
      if (el.type === "checkbox") {
        if (el.name === "consent" || el.name === "wantsDeck") { data[el.name] = el.checked ? "Yes" : "No"; return; }
        if (!el.checked) return;
        data[el.name] = data[el.name] ? data[el.name] + ", " + el.value : el.value;
        return;
      }
      data[el.name] = el.value.trim();
    });
    return data;
  }

  $all("form[data-type]").forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector(".form-msg");
    var success = form.parentNode.querySelector(".success");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "form-msg"; msg.textContent = "";
      if (!validate(form)) return;

      var data = collect(form);
      if (data.website) { showSuccess(); return; } // honeypot: quietly ignore bots

      if (cfg.DEMO) { // review/preview mode: nothing is sent anywhere
        try { window.parent.postMessage({ pincourtDemo: data }, "*"); } catch (err) {}
        showSuccess(data); return;
      }

      if (!cfg.ENDPOINT) {
        msg.className = "form-msg error";
        msg.textContent = "This form isn't connected yet. Please try again later.";
        console.warn("PIN COURT: set ENDPOINT in config.js (see SETUP-GUIDE.md).");
        return;
      }

      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";

      // text/plain keeps this a "simple" request, so Apps Script accepts it without a CORS preflight
      fetch(cfg.ENDPOINT, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "text/plain;charset=utf-8" } })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) showSuccess(data);
          else throw new Error((res && res.error) || "Unknown error");
        })
        .catch(function (err) {
          console.error(err);
          msg.className = "form-msg error";
          msg.textContent = "Sorry, that didn't go through. Please check your connection and try again.";
          btn.disabled = false; btn.textContent = label;
        });
    });

    function showSuccess(data) {
      $all("[data-echo]", success).forEach(function (el) {
        var v = data && data[el.dataset.echo];
        el.textContent = v ? (el.dataset.echo === "pincode" ? v.replace(/^(\d{3})(\d{3})$/, "$1 $2") : v) : "";
      });
      form.style.display = "none";
      success.classList.add("show");
      scrollToEl(success);
    }
  });
})();
