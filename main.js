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
})();
