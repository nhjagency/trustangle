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
  var themeBtn = document.querySelector(".nav-theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      document.documentElement.setAttribute("data-theme", isDark ? "" : "dark");
      themeBtn.setAttribute("aria-pressed", isDark ? "false" : "true");
      themeBtn.setAttribute("aria-label", isDark ? "Switch to dark mode" : "Switch to light mode");
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
    var drOnScroll = function () {
      if (window.scrollY > window.innerHeight * 0.6) {
        openDR();
        window.removeEventListener("scroll", drOnScroll);
      }
    };
    window.addEventListener("scroll", drOnScroll, { passive: true });
  }
})();
