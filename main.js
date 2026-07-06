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
    // Translate any element carrying data-ar (preferred) or data-i18n (AR dict fallback).
    // Only the leading text node is swapped, so trailing <svg> icons are preserved.
    var i18nEls = document.querySelectorAll("[data-i18n],[data-ar]");
    i18nEls.forEach(function (el) {
      var node = el.firstChild;
      if (node && node.nodeType === 3 && node.textContent.trim()) {
        el.setAttribute("data-en", node.textContent);
      } else {
        el.setAttribute("data-en", el.textContent);
      }
    });
    var lang = "en";
    function applyLang(ar) {
      document.documentElement.setAttribute("dir", ar ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", ar ? "ar" : "en");
      document.documentElement.classList.toggle("is-ar", ar);
      langBtn.textContent = ar ? "EN" : "عربي";
      i18nEls.forEach(function (el) {
        var en = el.getAttribute("data-en") || "";
        var arv = el.getAttribute("data-ar") || AR[en.trim()] || en;
        var target = ar ? arv : en;
        var node = el.firstChild;
        if (node && node.nodeType === 3) { node.textContent = ar ? (target + " ") : en; }
        else { el.textContent = target; }
      });
      document.querySelectorAll("[data-ar-ph]").forEach(function (el) {
        if (!el.hasAttribute("data-en-ph")) el.setAttribute("data-en-ph", el.getAttribute("placeholder") || "");
        el.setAttribute("placeholder", ar ? el.getAttribute("data-ar-ph") : el.getAttribute("data-en-ph"));
      });
      document.dispatchEvent(new CustomEvent("ta-lang", { detail: { ar: ar } }));
    }
    langBtn.addEventListener("click", function () {
      lang = lang === "en" ? "ar" : "en";
      applyLang(lang === "ar");
    });
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

/* Readiness diagnostic: 5-question technology check (in-memory only, no storage) */
(function () {
  var root = document.getElementById("readiness");
  if (!root) return;
  var Q_EN = [
    { q: "How clear is your technology direction for the next two years?", o: ["Clear, we have a roadmap", "Somewhat, but not documented", "Not clear yet"] },
    { q: "How well do your systems integrate today?", o: ["Fully integrated", "Partly connected", "Mostly siloed"] },
    { q: "Do you make decisions from reliable data?", o: ["Yes, real-time data", "Sometimes, with manual effort", "Rarely"] },
    { q: "How ready are you for local compliance?", o: ["Ready and compliant", "Working on it", "Not started yet"] },
    { q: "When something breaks, how fast do you recover?", o: ["Fast, we have support and a plan", "Sometimes delayed", "Slowly, and manually"] }
  ];
  var Q_AR = [
    { q: "ما مدى وضوح وجهتك التقنية للعامين القادمين؟", o: ["واضحة، ولدينا خارطة طريق", "إلى حدٍّ ما، لكن غير موثّقة", "غير واضحة بعد"] },
    { q: "إلى أي مدى تتكامل أنظمتك اليوم؟", o: ["متكاملة بالكامل", "مترابطة جزئيًا", "منفصلة غالبًا"] },
    { q: "هل تتّخذ قراراتك من بيانات موثوقة؟", o: ["نعم، بيانات لحظية", "أحيانًا، بجهد يدوي", "نادرًا"] },
    { q: "ما مدى جاهزيتك للتوافق مع الأنظمة المحلية؟", o: ["جاهزون ومتوافقون", "نعمل عليها حاليًا", "لم نبدأ بعد"] },
    { q: "حين يتعطّل شيء، ما سرعة تعافيك؟", o: ["سريعًا، لدينا دعم وخطة", "بتأخّرٍ أحيانًا", "ببطءٍ وبشكل يدوي"] }
  ];
  var R_EN = {
    adv: { t: "Advanced", d: "Your technology foundation is solid and your direction is clear. Your priority now is to invest in data and AI, turning operational strength into a competitive edge." },
    mid: { t: "Intermediate", d: "You have a good foundation, but a few gaps are slowing you down, usually in integration or data. Your priority is to connect your systems and unify your data before adding anything new." },
    early: { t: "Early", d: "You are at the start of the journey, and this is a chance to build the foundation right the first time. Your priority is to set your technology direction and choose the right systems before you build." }
  };
  var R_AR = {
    adv: { t: "متقدّم", d: "أساسك التقني متين ووجهتك واضحة. الأولوية الآن أن تستثمر في البيانات والذكاء الاصطناعي لتحويل تميّزك التشغيلي إلى ميزة تنافسية." },
    mid: { t: "متوسّط", d: "لديك أساس جيّد، لكن بعض الفجوات تُبطئك، غالبًا في التكامل أو البيانات. الأولوية أن تربط أنظمتك وتوحّد بياناتك قبل إضافة أي جديد." },
    early: { t: "مبكّر", d: "أنت في بداية الطريق، وهذه فرصة لبناء الأساس بشكل صحيح من أول مرة. الأولوية أن تضبط وجهتك التقنية وتختار الأنظمة الأنسب قبل التنفيذ." }
  };
  var lang = document.documentElement.lang === "ar" ? "ar" : "en";
  function Q() { return lang === "ar" ? Q_AR : Q_EN; }
  function R() { return lang === "ar" ? R_AR : R_EN; }
  var panels = {}, cur = 0, ans = [], view = "intro", lastKey = null;
  root.querySelectorAll("[data-rd-panel]").forEach(function (p) { panels[p.getAttribute("data-rd-panel")] = p; });
  var qEl = root.querySelector("#rd-q"), optsEl = root.querySelector("#rd-opts"),
      fill = root.querySelector(".rd-fill"), countEl = root.querySelector(".rd-i"), backBtn = root.querySelector(".rd-back");
  function show(name) { view = name; Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== name; }); }
  document.addEventListener("ta-lang", function (e) {
    lang = e.detail && e.detail.ar ? "ar" : "en";
    if (view === "quiz") renderQ();
    else if (view === "result" && lastKey) { root.querySelector("#rd-level").textContent = R()[lastKey].t; root.querySelector("#rd-rtext").textContent = R()[lastKey].d; }
  });
  function renderQ() {
    var item = Q()[cur];
    qEl.textContent = item.q;
    countEl.textContent = String(cur + 1);
    fill.style.width = ((cur + 1) / Q().length * 100) + "%";
    backBtn.hidden = cur === 0;
    optsEl.innerHTML = "";
    item.o.forEach(function (txt, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "rd-opt"; b.textContent = txt;
      b.addEventListener("click", function () {
        ans[cur] = i;
        if (cur < Q().length - 1) { cur++; renderQ(); } else finish();
      });
      optsEl.appendChild(b);
    });
    optsEl.firstChild && optsEl.firstChild.focus();
  }
  function finish() {
    var score = ans.reduce(function (s, i) { return s + (2 - i); }, 0);
    var key = score >= 8 ? "adv" : score >= 4 ? "mid" : "early";
    lastKey = key;
    root.querySelector("#rd-level").textContent = R()[key].t;
    root.querySelector("#rd-rtext").textContent = R()[key].d;
    show("result");
  }
  root.querySelector(".rd-start").addEventListener("click", function () { cur = 0; ans = []; show("quiz"); renderQ(); });
  backBtn.addEventListener("click", function () { if (cur > 0) { cur--; renderQ(); } });
  root.querySelector(".rd-restart").addEventListener("click", function () { show("intro"); });
})();
