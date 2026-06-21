/* ============================================================
   trustangle — Home page
   Vanilla JS only: scroll-reveal + accessible mobile nav.
   No browser storage of any kind.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    // Show everything immediately — no motion.
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mobile nav toggle ---------- */
  var burger = document.querySelector(".burger");
  var navLinks = document.getElementById("nav-links");

  if (burger && navLinks) {
    var setOpen = function (open) {
      navLinks.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    };

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    // Close after choosing a destination.
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });

    // Close on Escape, return focus to the toggle.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });
  }

  /* ---------- Nav dropdowns ---------- */
  var triggers = document.querySelectorAll(".nav-trigger");

  function closeDropdowns(except) {
    triggers.forEach(function (t) {
      if (t === except) return;
      t.setAttribute("aria-expanded", "false");
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.classList.remove("open");
    });
  }

  triggers.forEach(function (t) {
    var panel = document.getElementById(t.getAttribute("aria-controls"));
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = t.getAttribute("aria-expanded") === "true";
      closeDropdowns(t);
      t.setAttribute("aria-expanded", isOpen ? "false" : "true");
      if (panel) panel.classList.toggle("open", !isOpen);
    });
  });

  if (triggers.length) {
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".has-dropdown")) closeDropdowns(null);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDropdowns(null);
    });
  }

  /* ---------- Testimonials marquee: duplicate cards for a seamless loop ---------- */
  var tTrack = document.querySelector(".tmarquee-track");
  if (tTrack && !prefersReduced) {
    Array.prototype.slice.call(tTrack.children).forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");   // clones are decorative, not tab stops
      tTrack.appendChild(clone);
    });
  }
})();

/* ============================================================
   trustangle — Prototype content editor ("Edit Mode")
   Self-contained. Lets you show/hide & reorder sections and
   edit any text live (session-only preview), then Export the
   result as content.json (re-applied on load if present).
   Nothing is written to browser storage; refresh restores base.
   ============================================================ */
(function () {
  "use strict";

  var main = document.querySelector("main");
  if (!main) return;

  /* ---------- Identify the reorderable sections ---------- */
  function keyFor(sec) {
    if (sec.id) return sec.id;
    var lbl = sec.getAttribute("aria-labelledby");
    if (lbl) return lbl.replace(/-title$/, "");
    if (sec.classList.contains("hero")) return "hero";
    if (sec.classList.contains("partners")) return "partners";
    return "sec";
  }
  function labelFor(sec, key) {
    if (sec.classList.contains("hero")) return "Hero";
    if (sec.classList.contains("partners")) return "Partners strip";
    if (sec.classList.contains("final")) return "Contact / CTA";
    var lbl = sec.getAttribute("aria-labelledby");
    var t = lbl && document.getElementById(lbl);
    var txt = t ? t.textContent.replace(/\s+/g, " ").trim() : key;
    return txt.length > 34 ? txt.slice(0, 33) + "…" : txt;
  }

  var sections = Array.prototype.filter.call(main.children, function (el) {
    return el.tagName === "SECTION";
  });
  sections.forEach(function (sec) {
    var key = keyFor(sec);
    sec.setAttribute("data-sec", key);
    sec.setAttribute("data-label", labelFor(sec, key));
  });

  /* ---------- Mark editable text elements (stable keys) ---------- */
  var TAGS = "h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd";
  var CLASSES = ["eyebrow", "pill", "kicker", "lead", "btn", "chip", "tag",
                 "link-mono", "hero-badge-primary", "hero-badge-secondary"];
  var scopes = [main, document.querySelector("footer")].filter(Boolean);
  var cand = [];
  scopes.forEach(function (scope) {
    Array.prototype.push.apply(cand, scope.querySelectorAll(TAGS));
    CLASSES.forEach(function (c) {
      Array.prototype.push.apply(cand, scope.querySelectorAll("." + c));
    });
  });
  // de-dupe + keep only the outermost editable (no editable ancestor)
  var set = [];
  cand.forEach(function (el) { if (set.indexOf(el) === -1) set.push(el); });
  var editable = set.filter(function (el) {
    return !set.some(function (other) {
      return other !== el && other.contains(el);
    });
  });
  editable.forEach(function (el, i) {
    el.setAttribute("data-ek", "e" + (1000 + i));
  });
  function byEk(ek) { return document.querySelector('[data-ek="' + ek + '"]'); }

  /* ---------- State ---------- */
  var textEditing = false;

  /* ---------- Apply content.json on load (if reachable) ---------- */
  function applyContent(data) {
    if (!data) return;
    if (Array.isArray(data.sections)) {
      data.sections.forEach(function (row) {
        var sec = main.querySelector('[data-sec="' + row.key + '"]');
        if (!sec) return;
        sec.hidden = !!row.hidden;
        main.appendChild(sec); // reorder by re-appending in saved order
      });
    }
    if (Array.isArray(data.text)) {
      data.text.forEach(function (row) {
        var el = byEk(row.id);
        if (el && typeof row.value === "string") el.innerHTML = row.value;
      });
    }
  }
  if (/^https?:$/.test(location.protocol)) {  // skip on file:// (CORS)
    try {
      fetch("content.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(applyContent)
        .catch(function () {});
    } catch (e) { /* ignore */ }
  }

  /* ---------- Build content.json from current DOM ---------- */
  function buildContent() {
    var secs = Array.prototype.filter
      .call(main.children, function (el) { return el.tagName === "SECTION"; })
      .map(function (sec) {
        return {
          key: sec.getAttribute("data-sec"),
          label: sec.getAttribute("data-label"),
          hidden: !!sec.hidden
        };
      });
    var text = editable.map(function (el) {
      return {
        id: el.getAttribute("data-ek"),
        section: (el.closest("section") || {}).getAttribute
          ? (el.closest("section") || el).getAttribute("data-sec")
          : null,
        tag: el.tagName.toLowerCase(),
        value: el.innerHTML.trim()
      };
    });
    return { version: 1, generated: new Date().toISOString(), sections: secs, text: text };
  }

  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportJSON() {
    download("content.json", JSON.stringify(buildContent(), null, 2), "application/json");
  }
  function exportHTML() {
    var clone = document.documentElement.cloneNode(true);
    var ui = clone.querySelector("#ta-editor"); if (ui) ui.remove();
    var st = clone.querySelector("#ta-editor-style"); if (st) st.remove();
    clone.querySelectorAll("[contenteditable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });
    download("index.html", "<!doctype html>\n" + clone.outerHTML, "text/html");
  }

  /* ---------- Text edit mode ---------- */
  function setTextEditing(on) {
    textEditing = on;
    editable.forEach(function (el) {
      if (on) { el.setAttribute("contenteditable", "true"); el.classList.add("ta-ed"); }
      else { el.removeAttribute("contenteditable"); el.classList.remove("ta-ed"); }
    });
    document.body.classList.toggle("ta-editing", on);
  }
  // In text mode, don't let links/buttons navigate while you edit their label.
  document.addEventListener("click", function (e) {
    if (!textEditing) return;
    var a = e.target.closest("a,button");
    if (a && a.closest("main, footer")) { e.preventDefault(); }
  }, true);

  /* ---------- Build the panel UI ---------- */
  var css = [
    "#ta-editor{position:fixed;right:16px;bottom:16px;z-index:9999;width:300px;max-height:78vh;",
    "display:flex;flex-direction:column;background:#fff;border:1px solid #d4ddd9;border-radius:12px;",
    "box-shadow:0 12px 40px rgba(8,40,46,.18);font:13px/1.4 var(--body,system-ui,sans-serif);color:#15292e;overflow:hidden}",
    "#ta-editor.min{width:auto}",
    "#ta-editor.min .ta-body{display:none}",
    "#ta-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;",
    "background:#0e9488;color:#fff;cursor:pointer;font-weight:600}",
    "#ta-head .ta-dot{font-weight:400;opacity:.85;font-size:12px}",
    ".ta-body{padding:10px 12px;overflow:auto}",
    ".ta-h{font-weight:600;margin:2px 0 6px;color:#5b6b6e;text-transform:uppercase;letter-spacing:.04em;font-size:10px}",
    ".ta-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eef2f1}",
    ".ta-row .ta-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".ta-row.off .ta-name{color:#b0bbbd;text-decoration:line-through}",
    ".ta-btn{border:1px solid #d4ddd9;background:#fff;border-radius:6px;padding:3px 7px;cursor:pointer;font:inherit;color:#15292e}",
    ".ta-btn:hover{border-color:#0e9488;color:#0e9488}",
    ".ta-icon{width:26px;text-align:center;padding:3px 0}",
    ".ta-actions{display:flex;flex-direction:column;gap:6px;margin-top:10px}",
    ".ta-actions .ta-btn{padding:7px 10px;text-align:center}",
    ".ta-btn.pri{background:#0e9488;color:#fff;border-color:#0e9488;font-weight:600}",
    ".ta-btn.pri:hover{background:#0b7d72}",
    ".ta-btn.on{background:#15292e;color:#fff;border-color:#15292e}",
    "body.ta-editing .ta-ed{outline:1px dashed rgba(14,148,136,.55);outline-offset:3px;border-radius:3px}",
    "body.ta-editing .ta-ed:hover{outline-color:#0e9488;cursor:text}",
    "body.ta-editing .ta-ed:focus{outline:2px solid #0e9488;background:rgba(14,148,136,.06)}"
  ].join("");
  var style = document.createElement("style");
  style.id = "ta-editor-style"; style.textContent = css;
  document.head.appendChild(style);

  var panel = document.createElement("div");
  panel.id = "ta-editor";
  panel.setAttribute("aria-label", "Content editor");
  panel.innerHTML =
    '<div id="ta-head"><span>✎ Edit Mode</span><span class="ta-dot" data-min>–</span></div>' +
    '<div class="ta-body">' +
      '<div class="ta-h">Sections · show / reorder</div>' +
      '<div id="ta-secs"></div>' +
      '<div class="ta-actions">' +
        '<button class="ta-btn" id="ta-text">✎ Edit text: OFF</button>' +
        '<button class="ta-btn pri" id="ta-json">↓ Export content.json</button>' +
        '<button class="ta-btn" id="ta-html">↓ Export index.html</button>' +
        '<button class="ta-btn" id="ta-reset">↺ Reset (reload)</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);

  var list = panel.querySelector("#ta-secs");
  function renderList() {
    var secs = Array.prototype.filter
      .call(main.children, function (el) { return el.tagName === "SECTION"; });
    list.innerHTML = "";
    secs.forEach(function (sec, i) {
      var row = document.createElement("div");
      row.className = "ta-row" + (sec.hidden ? " off" : "");
      var name = sec.getAttribute("data-label") || sec.getAttribute("data-sec");
      row.innerHTML =
        '<button class="ta-btn ta-icon" data-act="up" ' + (i === 0 ? "disabled" : "") + '>↑</button>' +
        '<button class="ta-btn ta-icon" data-act="down" ' + (i === secs.length - 1 ? "disabled" : "") + '>↓</button>' +
        '<span class="ta-name">' + name + '</span>' +
        '<button class="ta-btn ta-icon" data-act="toggle">' + (sec.hidden ? "✕" : "◉") + '</button>';
      row.querySelector('[data-act="up"]').onclick = function () {
        if (sec.previousElementSibling) main.insertBefore(sec, sec.previousElementSibling);
        renderList();
      };
      row.querySelector('[data-act="down"]').onclick = function () {
        var next = sec.nextElementSibling;
        if (next) main.insertBefore(next, sec);
        renderList();
      };
      row.querySelector('[data-act="toggle"]').onclick = function () {
        sec.hidden = !sec.hidden; renderList();
      };
      list.appendChild(row);
    });
  }
  renderList();

  panel.querySelector("#ta-text").onclick = function () {
    setTextEditing(!textEditing);
    this.textContent = "✎ Edit text: " + (textEditing ? "ON" : "OFF");
    this.classList.toggle("on", textEditing);
  };
  panel.querySelector("#ta-json").onclick = exportJSON;
  panel.querySelector("#ta-html").onclick = exportHTML;
  panel.querySelector("#ta-reset").onclick = function () { location.reload(); };

  var head = panel.querySelector("#ta-head");
  head.onclick = function () { panel.classList.toggle("min"); };

  // Test hook (no effect on UX)
  window.__taEditor = { build: buildContent, apply: applyContent, sections: sections };
})();
