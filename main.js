/* ============================================================
   trustangle — Home page
   Vanilla JS only: scroll-reveal + accessible mobile nav.
   No browser storage of any kind.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  var revealEls = document.querySelectorAll(".reveal,[data-reveal]");

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
  var triggers = document.querySelectorAll(".nav-trigger[aria-controls]");

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

  /* ---------- References marquee: duplicate each row for a seamless loop ---------- */
  if (!prefersReduced) {
    document.querySelectorAll(".tmarquee-track").forEach(function (track) {
      Array.prototype.slice.call(track.children).forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("tabindex", "-1");   // clones are decorative, not tab stops
        track.appendChild(clone);
      });
    });
  }

  /* ---------- Industries sector filter (tablist + swapping case card) ---------- */
  var indTabs = Array.prototype.slice.call(document.querySelectorAll(".ind-tab"));
  var indCard = document.getElementById("ind-card");
  if (indTabs.length && indCard) {
    var indName = indCard.querySelector(".ind-name");
    var indBrief = indCard.querySelector(".ind-brief");
    var indExplore = indCard.querySelector(".ind-explore");
    var indSector = indCard.querySelector(".ind-case-sector");
    var indCaseImg = indCard.querySelector(".ind-case-img");
    var indCaseSlot = indCard.querySelector(".ind-case-slot");

    var selectSector = function (tab, focus) {
      indTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      var name = tab.getAttribute("data-name");
      var plain = name.replace(/&amp;/g, "&");
      indCard.setAttribute("aria-labelledby", tab.id);
      indName.textContent = plain;
      indBrief.textContent = tab.getAttribute("data-brief");
      indExplore.setAttribute("href", tab.getAttribute("data-href"));
      indExplore.innerHTML = "Explore " + name + " &rarr;";
      indSector.textContent = plain;
      // case study: show the image where we have one, else the placeholder
      var caseSrc = tab.getAttribute("data-case");
      if (indCaseImg && indCaseSlot) {
        if (caseSrc) {
          indCaseImg.src = caseSrc;
          indCaseImg.alt = plain + " case study";
          indCaseImg.hidden = false;
          indCaseSlot.hidden = true;
        } else {
          indCaseImg.hidden = true;
          indCaseImg.removeAttribute("src");
          indCaseSlot.hidden = false;
        }
      }
      // restrained fade on swap
      indCard.classList.remove("is-swapping");
      void indCard.offsetWidth;
      indCard.classList.add("is-swapping");
      tab.scrollIntoView({ inline: "center", block: "nearest" });
      if (focus) tab.focus();
    };

    indTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectSector(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        selectSector(indTabs[(i + d + indTabs.length) % indTabs.length], true);
      });
    });
  }

  /* ---------- Decision Router (self-identify, then the advisory answer) ---------- */
  var drOpts = Array.prototype.slice.call(document.querySelectorAll(".dr-opt"));
  var drPanel = document.querySelector(".dr-panel");
  if (drOpts.length && drPanel) {
    var drAsk = drPanel.querySelector(".dr-ask");
    var drWrong = drPanel.querySelector(".dr-wrong");
    var drNext = drPanel.querySelector(".dr-next");
    var selectDecision = function (btn) {
      drOpts.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      drAsk.textContent = btn.getAttribute("data-ask");
      drWrong.textContent = btn.getAttribute("data-wrong");
      drNext.textContent = btn.getAttribute("data-next");
    };
    drOpts.forEach(function (btn) {
      btn.addEventListener("click", function () { selectDecision(btn); });
    });
  }

  /* ---------- Theme toggle (in-memory; no browser storage) ---------- */
  var themeBtn = document.querySelector(".nav-theme, #theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) { document.documentElement.removeAttribute("data-theme"); }
      else { document.documentElement.setAttribute("data-theme", "dark"); }
      themeBtn.setAttribute("aria-pressed", isDark ? "false" : "true");
      themeBtn.setAttribute("aria-label", isDark ? "Switch to dark mode" : "Switch to light mode");
    });
  }

  /* ---------- Language toggle EN <-> AR (in-memory; header + hero strings) ---------- */
  var langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    var AR = {
      "Approach":"النهج","Industries":"القطاعات","Technologies":"التقنيات","Insights":"رؤى",
      "Advisory & Consulting":"الاستشارات","Implementation & Delivery":"التنفيذ والتسليم",
      "Hospitality":"الضيافة","Food & Beverage":"الأغذية والمشروبات","Retail & Commerce":"التجزئة والتجارة",
      "Real Estate & Construction":"العقار والإنشاء","Banking & Finance":"المصارف والتمويل","Insurance":"التأمين",
      "Manufacturing":"التصنيع","Investments":"الاستثمارات","Explore all industries":"استكشف كل القطاعات",
      "Customer Experience & POS":"تجربة العملاء ونقاط البيع","Supply Chain & Field Operations":"سلسلة الإمداد والعمليات الميدانية",
      "Digital Omnichannel":"القنوات الرقمية المتعددة","Integration":"التكامل","See all technologies":"اطّلع على كل التقنيات",
      "What to ask before you sign the platform":"ما الذي تسأله قبل توقيع المنصة",
      "ZATCA Phase Two as a finance discipline, not a project":"المرحلة الثانية لهيئة الزكاة كانضباط مالي، لا كمشروع",
      "The groups that solved POS before October":"المجموعات التي حلّت نقاط البيع قبل أكتوبر",
      "Browse all insights":"تصفّح كل الرؤى","Request a Consultation":"اطلب استشارة","See how we think":"اطّلع على طريقة تفكيرنا",
      "Choose The Partner.":"اختر الشريك.","Then Choose The Platform.":"ثم اختر المنصة.",
      "trustangle is a technology consulting and implementation partner in Saudi Arabia, working with regional depth since 2014. We help senior teams decide what to build, govern how it runs, and deliver it through a growing ecosystem of specialized companies we operate.":"trustangle شريك في الاستشارات والتنفيذ التقني في المملكة العربية السعودية، يعمل بعمق إقليمي منذ عام 2014. نساعد الفرق القيادية على تقرير ما الذي يُبنى، وحوكمة طريقة تشغيله، وتسليمه عبر منظومة متنامية من الشركات المتخصصة التي نشغّلها.",
      "Understand":"الفهم","Decide":"القرار","Deliver":"التسليم","Sustain":"الاستدامة",
      "The business and the sector, before the software.":"النشاط والقطاع، قبل البرمجيات.",
      "The platform that fits, governed from day one.":"المنصة التي تناسب، محوكمة من اليوم الأول.",
      "Implementation with the discipline of go-live.":"تنفيذ بانضباط الإطلاق.",
      "On the ground after the last location is live.":"حضور ميداني بعد تشغيل آخر موقع.",
      "Industries Served":"القطاعات المخدومة","Product Categories":"فئات المنتجات","Technology Partners":"شركاء التقنية","Unique Customers":"عملاء مميّزون"
    };
    // For elements wrapping text + an svg/extra node, only the leading text node is swapped.
    var i18nEls = document.querySelectorAll("[data-i18n]");
    i18nEls.forEach(function (el) {
      var node = el.firstChild;
      // store English text from the first text node (or whole textContent if simple)
      if (node && node.nodeType === 3 && node.textContent.trim()) {
        el.setAttribute("data-en", node.textContent);
      } else {
        el.setAttribute("data-en", el.textContent);
      }
    });
    var lang = "en";
    langBtn.addEventListener("click", function () {
      lang = lang === "en" ? "ar" : "en";
      var ar = lang === "ar";
      document.documentElement.setAttribute("dir", ar ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", ar ? "ar" : "en");
      langBtn.textContent = ar ? "EN" : "عربي";
      i18nEls.forEach(function (el) {
        var en = el.getAttribute("data-en") || "";
        var key = en.trim();
        var target = ar ? (AR[key] || en) : en;
        var node = el.firstChild;
        if (node && node.nodeType === 3) { node.textContent = ar ? (target + " ") : en; }
        else { el.textContent = target; }
      });
    });
  }

  /* ---------- Decision Router popup (shows once after scrolling) ---------- */
  var drModal = document.getElementById("decision-router");
  if (drModal && drModal.classList.contains("dr-modal")) {
    var drSeen = false, drReturn = null;
    var drFocusables = function () {
      return Array.prototype.slice.call(drModal.querySelectorAll(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    };
    var drKeydown = function (e) {
      if (e.key === "Escape") { closeDR(); return; }
      if (e.key !== "Tab") return;
      var f = drFocusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    var closeDR = function () {
      drModal.classList.remove("is-open");
      document.removeEventListener("keydown", drKeydown);
      window.setTimeout(function () { drModal.hidden = true; }, 240);
      if (drReturn && drReturn.focus) drReturn.focus();
    };
    var openDR = function () {
      if (drSeen) return; drSeen = true;
      drReturn = document.activeElement;
      drModal.hidden = false;
      requestAnimationFrame(function () { drModal.classList.add("is-open"); });
      var c = drModal.querySelector(".dr-modal-close"); if (c) c.focus();
      document.addEventListener("keydown", drKeydown);
    };
    Array.prototype.forEach.call(drModal.querySelectorAll("[data-dr-close]"), function (el) {
      el.addEventListener("click", closeDR);
    });

    /* ----- multi-step wizard inside the popup ----- */
    var drSteps = Array.prototype.slice.call(drModal.querySelectorAll(".dr-step"));
    var drProg = drModal.querySelectorAll(".dr-prog-i");
    var drConfirm = drModal.querySelector("[data-dr-confirm]");
    var chosenFormat = null;
    var showStep = function (n) {
      drSteps.forEach(function (s) { s.hidden = s.getAttribute("data-step") !== String(n); });
      Array.prototype.forEach.call(drProg, function (pi) {
        var pn = parseInt(pi.getAttribute("data-prog"), 10);
        pi.classList.toggle("is-on", pn === n);
        pi.classList.toggle("is-done", pn < n);
      });
      var cur = drModal.querySelector('.dr-step[data-step="' + n + '"]');
      var h = cur && cur.querySelector("h2");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    };
    // plain step jumps (CTA -> 2, Back buttons)
    Array.prototype.forEach.call(drModal.querySelectorAll("[data-dr-go]"), function (b) {
      b.addEventListener("click", function () { showStep(parseInt(b.getAttribute("data-dr-go"), 10)); });
    });
    // step 2 -> validate details -> step 3
    var drNext2 = drModal.querySelector('[data-dr-next="2"]');
    if (drNext2) drNext2.addEventListener("click", function () {
      var ok = true;
      ["dr-name", "dr-email"].forEach(function (id) {
        var inp = document.getElementById(id);
        var field = inp.closest(".dr-field");
        var valid = inp.value.trim() !== "" && inp.checkValidity();
        field.classList.toggle("dr-field--error", !valid);
        if (!valid && ok) { ok = false; inp.focus(); }
      });
      if (ok) showStep(3);
    });
    // step 3 format choice
    Array.prototype.forEach.call(drModal.querySelectorAll(".dr-fmt"), function (f) {
      f.addEventListener("click", function () {
        Array.prototype.forEach.call(drModal.querySelectorAll(".dr-fmt"), function (x) {
          x.setAttribute("aria-pressed", x === f ? "true" : "false");
        });
        chosenFormat = f.getAttribute("data-format");
        if (drConfirm) drConfirm.disabled = false;
      });
    });
    // confirm -> compose request + confirmation
    if (drConfirm) drConfirm.addEventListener("click", function () {
      var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; };
      var active = drModal.querySelector(".dr-opt.is-active .dr-opt-label");
      var decision = active ? active.textContent.trim() : "";
      var name = val("dr-name"), email = val("dr-email"), company = val("dr-company"), phone = val("dr-phone");
      var fmt = chosenFormat || "";
      var subject = "Consultation request: " + fmt;
      var body = "Decision: " + decision + "\nName: " + name + "\nEmail: " + email +
                 "\nCompany: " + company + "\nPhone: " + phone + "\nPreferred format: " + fmt;
      var msg = drModal.querySelector(".dr-done-msg");
      if (msg) msg.textContent = "Thanks" + (name ? ", " + name.split(" ")[0] : "") +
        ". We have your " + fmt.toLowerCase() + " consultation request and will be in touch shortly.";
      showStep(4);
      window.location.href = "mailto:consultations@trustangle.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });

    // Show the popup after the user scrolls past the Industries section
    // (fallback: after ~0.6 of the first viewport if that section is absent).
    var drIndustries = document.getElementById("industries");
    var drOnScroll = function () {
      var triggered = drIndustries
        ? drIndustries.getBoundingClientRect().bottom < window.innerHeight * 0.6
        : window.scrollY > window.innerHeight * 0.6;
      if (triggered) {
        openDR();
        showStep(1);
        window.removeEventListener("scroll", drOnScroll);
      }
    };
    window.addEventListener("scroll", drOnScroll, { passive: true });
  }

  /* ---------- Hero stats count-up on scroll into view ---------- */
  var statsHost = document.getElementById("hero-stats");
  if (statsHost) {
    var counters = [].slice.call(statsHost.querySelectorAll(".ta-stat-num")).map(function (num) {
      var target = parseInt(num.getAttribute("data-count"), 10) || 0;
      var suffix = num.getAttribute("data-suffix") || "";
      if (prefersReduced) { num.textContent = target + suffix; }
      else { num.textContent = "0"; }
      return { el: num, target: target, suffix: suffix };
    });

    var runCountUp = function () {
      var duration = 1200, started = null;
      var frame = function (ts) {
        if (started === null) started = ts;
        var p = Math.min((ts - started) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        counters.forEach(function (c) {
          c.el.textContent = Math.round(c.target * eased) + c.suffix;
        });
        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          counters.forEach(function (c) { c.el.textContent = c.target + c.suffix; });
        }
      };
      requestAnimationFrame(frame);
    };

    // Reduced motion: final values already rendered above, skip animation.
    if (!prefersReduced) {
      if ("IntersectionObserver" in window) {
        var fired = false;
        var statsIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !fired) {
              fired = true;
              runCountUp();
              statsIO.disconnect();
            }
          });
        }, { threshold: 0.4 });
        statsIO.observe(statsHost);
      } else {
        runCountUp();
      }
    }
  }

  /* ---------- Wallet stacking polish: covered card scales down + dims (AgentFlow-style) ---------- */
  var wcards = Array.prototype.slice.call(document.querySelectorAll(".ww-card"));
  if (wcards.length > 1 && !prefersReduced) {
    var wraf = null;
    var updateStack = function () {
      for (var i = 0; i < wcards.length - 1; i++) {
        var cur = wcards[i].getBoundingClientRect();
        var nxt = wcards[i + 1].getBoundingClientRect();
        var overlap = cur.bottom - nxt.top;                 // > 0 once the next card rises over this one
        var p = Math.max(0, Math.min(1, overlap / (cur.height * 0.85)));
        wcards[i].style.transformOrigin = "center top";
        wcards[i].style.transform = "scale(" + (1 - p * 0.055).toFixed(4) + ")";
        wcards[i].style.opacity = (1 - p * 0.4).toFixed(3);
      }
      // the last card never gets covered
      var last = wcards[wcards.length - 1];
      last.style.transform = "none";
      last.style.opacity = "1";
    };
    window.addEventListener("scroll", function () {
      if (wraf) cancelAnimationFrame(wraf);
      wraf = requestAnimationFrame(updateStack);
    }, { passive: true });
    window.addEventListener("resize", updateStack, { passive: true });
    updateStack();
  }

  /* ---------- Industries (Structure B): selector + brief + zoomable/pannable image ---------- */
  var ibSection = document.getElementById("industries");
  var ibFrame = document.getElementById("ib-frame");
  var ibImg = document.getElementById("ib-img");
  var ibDrop = document.getElementById("ib-drop");
  if (ibSection && ibFrame && ibImg) {
    var ibTabs = Array.prototype.slice.call(ibSection.querySelectorAll(".ib-tab"));
    var ibName = ibSection.querySelector(".ib-brief-name");
    var ibDesc = ibSection.querySelector(".ib-brief-desc");
    var ibTrack = document.getElementById("ib-track");

    // Per-industry platform logos: tab data-logos lists keys into this registry.
    var ibLogoLib = {
      "netsuite": { src: "assets/netsuite-logo.jpg", alt: "Oracle NetSuite" },
      "dynamics-365": { src: "assets/dynamics-365-logo.jpg", alt: "Microsoft Dynamics 365" },
      "shiji": { src: "assets/shiji-logo.png", alt: "Shiji" },
      "cegid": { src: "assets/cegid-logo.png", alt: "Cegid" },
      "lightspeed": { src: "assets/lightspeed-logo.png", alt: "Lightspeed" },
      "snowflake": { src: "assets/snowflake-logo.png", alt: "Snowflake" },
      "uipath": { src: "assets/uipath-logo.png", alt: "UiPath" },
      "reachware": { src: "assets/reachware-logo.png", alt: "Reachware" }
    };
    var renderLogos = function (tab) {
      if (!ibTrack) return;
      var keys = (tab.getAttribute("data-logos") || "").split(",")
        .map(function (k) { return k.trim(); })
        .filter(function (k) { return ibLogoLib[k]; });
      if (!keys.length) { ibTrack.innerHTML = ""; return; }
      // Build one unit wide enough to span the bar, then duplicate it so the
      // -50% marquee loop is seamless and never leaves an empty gap.
      var unit = [];
      while (unit.length < 10) unit = unit.concat(keys);
      var html = "";
      for (var half = 0; half < 2; half++) {
        unit.forEach(function (k) {
          var l = ibLogoLib[k];
          var hidden = half > 0 ? ' aria-hidden="true"' : '';
          var alt = half > 0 ? '' : l.alt;
          html += '<span' + hidden + '><img src="' + l.src + '" alt="' + alt + '"></span>';
        });
      }
      ibTrack.innerHTML = html;
    };
    var zoom = 1, panX = 0, panY = 0, dragging = false, sX = 0, sY = 0, sPX = 0, sPY = 0;

    var clampPan = function () {
      var mx = ibFrame.clientWidth * (zoom - 1) / 2;
      var my = ibFrame.clientHeight * (zoom - 1) / 2;
      panX = Math.max(-mx, Math.min(mx, panX));
      panY = Math.max(-my, Math.min(my, panY));
    };
    var apply = function () {
      clampPan();
      ibImg.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + zoom + ")";
      ibFrame.classList.toggle("is-zoomed", zoom > 1);
    };
    var resetZoom = function () { zoom = 1; panX = 0; panY = 0; apply(); };
    // Zoom toward an anchor point (vx,vy = offset from frame centre); omit to zoom from centre.
    var setZoomAt = function (z, vx, vy) {
      var nz = Math.max(1, Math.min(4, Math.round(z * 100) / 100));
      if (nz === zoom) return;
      if (nz === 1) { panX = 0; panY = 0; }
      else if (vx !== undefined) {
        var s = nz / zoom;
        panX = vx * (1 - s) + panX * s;
        panY = vy * (1 - s) + panY * s;
      }
      zoom = nz;
      apply();
    };

    // Reset is the only on-screen control now; zoom in/out is wheel + pinch.
    ibFrame.querySelectorAll(".ib-zbtn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-zoom") === "reset") resetZoom();
      });
    });

    // Mouse wheel / trackpad zoom, anchored to the cursor so you read where you point.
    ibFrame.addEventListener("wheel", function (e) {
      e.preventDefault();
      var r = ibFrame.getBoundingClientRect();
      var vx = (e.clientX - r.left) - r.width / 2;
      var vy = (e.clientY - r.top) - r.height / 2;
      setZoomAt(zoom * (e.deltaY < 0 ? 1.12 : 0.89), vx, vy);
    }, { passive: false });

    // Pointer handling: one pointer pans (when zoomed), two pointers pinch-zoom.
    var pointers = {}, pCount = 0, pinchDist = 0, pinchZoom = 1;
    var ptList = function () { var a = []; for (var k in pointers) a.push(pointers[k]); return a; };
    ibFrame.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".ib-zoom")) return; // let the reset button receive its click
      if (!pointers[e.pointerId]) pCount++;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { ibFrame.setPointerCapture(e.pointerId); } catch (err) {}
      if (pCount === 2) {
        var p = ptList();
        pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        pinchZoom = zoom;
        dragging = false;
        ibFrame.classList.remove("is-dragging");
      } else if (pCount === 1 && zoom > 1) {
        dragging = true; sX = e.clientX; sY = e.clientY; sPX = panX; sPY = panY;
        ibFrame.classList.add("is-dragging");
      }
    });
    ibFrame.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pCount >= 2 && pinchDist > 0) {
        var p = ptList();
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        var r = ibFrame.getBoundingClientRect();
        var vx = ((p[0].x + p[1].x) / 2 - r.left) - r.width / 2;
        var vy = ((p[0].y + p[1].y) / 2 - r.top) - r.height / 2;
        setZoomAt(pinchZoom * (d / pinchDist), vx, vy);
      } else if (dragging) {
        panX = sPX + (e.clientX - sX); panY = sPY + (e.clientY - sY); apply();
      }
    });
    var endPtr = function (e) {
      if (pointers[e.pointerId]) { delete pointers[e.pointerId]; pCount = Math.max(0, pCount - 1); }
      if (pCount < 2) pinchDist = 0;
      if (pCount === 0) { dragging = false; ibFrame.classList.remove("is-dragging"); }
    };
    ibFrame.addEventListener("pointerup", endPtr);
    ibFrame.addEventListener("pointercancel", endPtr);

    var selectIb = function (tab) {
      ibTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      var name = (tab.getAttribute("data-name") || "").replace(/&amp;/g, "&");
      if (ibName) ibName.textContent = name;
      if (ibDesc) ibDesc.textContent = tab.getAttribute("data-brief") || "";
      var img = tab.getAttribute("data-img");
      if (img) {
        ibImg.src = img; ibImg.alt = name; ibImg.hidden = false; ibDrop.hidden = true;
      } else {
        ibImg.hidden = true; ibImg.removeAttribute("src"); ibDrop.hidden = false;
      }
      renderLogos(tab);
      resetZoom();
    };
    ibTabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectIb(tab); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        if (!d) return; e.preventDefault();
        var n = ibTabs[(i + d + ibTabs.length) % ibTabs.length];
        selectIb(n); n.focus();
      });
    });

    // Initial render of the logo bar for the default active tab.
    var ibActive = ibSection.querySelector(".ib-tab.is-active") || ibTabs[0];
    if (ibActive) renderLogos(ibActive);

    // Drag-and-drop a photo onto the placeholder (in-memory preview; no storage)
    ["dragover", "dragenter"].forEach(function (ev) {
      ibFrame.addEventListener(ev, function (e) { if (!ibDrop.hidden) { e.preventDefault(); ibDrop.classList.add("is-over"); } });
    });
    ["dragleave", "dragend"].forEach(function (ev) {
      ibFrame.addEventListener(ev, function () { ibDrop.classList.remove("is-over"); });
    });
    ibFrame.addEventListener("drop", function (e) {
      if (ibDrop.hidden) return;
      e.preventDefault(); ibDrop.classList.remove("is-over");
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.indexOf("image/") === 0) {
        ibImg.src = URL.createObjectURL(f); ibImg.alt = "Selected photo"; ibImg.hidden = false; ibDrop.hidden = true; resetZoom();
      }
    });
  }
})();
