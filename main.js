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

  /* ---------- Consultation popup (scroll-triggered once + every CTA) ---------- */
  (function () {
    var modal = document.getElementById("consult-modal");
    if (!modal) return;
    var modalBox = modal.querySelector(".cm-modal");
    var DATA = {
      "Hospitality":{pain:["PMS and POS that do not hold through peak season","A multi-property rollout slipping behind","Guest data scattered across systems","ZATCA and finance not connected to the POS"],focus:["Every property live on time","One guest view across properties","Finance and ZATCA in order"]},
      "Food & Beverage":{pain:["Aggregator orders not matching the books","Inventory and waste hard to control","POS slow at the Friday rush","Reservations and delivery on separate systems"],focus:["One order, one number everywhere","Control over inventory and cost","Faster service at peak"]},
      "Retail & Commerce":{pain:["Stock counts that do not match across channels","Online and store on separate systems","Fulfillment too slow","No clear view of the customer"],focus:["Accurate stock across channels","One customer view","Faster fulfillment"]},
      "Real Estate & Construction":{pain:["Leasing and facility data in silos","Project numbers that do not reconcile","Manual handover between stages","No single view of the portfolio"],focus:["One view of the portfolio","Numbers that reconcile","Less manual handover"]},
      "Manufacturing":{pain:["The floor disconnected from finance","Downtime nobody can explain","Inventory and orders out of sync","Maintenance run on guesswork"],focus:["The floor connected to the close","Less unplanned downtime","Orders and stock in sync"]},
      "Banking & Finance":{pain:["Onboarding too slow for the regulator","Lending decisions stuck in manual steps","Core systems that do not integrate","Compliance bolted on, not built in"],focus:["Faster, compliant onboarding","Integrated core systems","Governance from day one"]},
      "Insurance":{pain:["Claims slow and hard to audit","Policy and underwriting on separate systems","Manual onboarding and KYC","No clear trail for the regulator"],focus:["Faster, auditable claims","One policy-to-claim view","A clear regulatory trail"]},
      "Investments":{pain:["Investor onboarding is manual","Reporting that cannot keep up","Capital and compliance on separate tracks","No single investor view"],focus:["Faster investor onboarding","Reporting built for scrutiny","Capital and compliance together"]},
      "Other":{pain:["Choosing a platform, unsure of the timeline","Live, but the rollout keeps slipping","Systems that do not talk to each other","Not sure we should build this at all"],focus:["Getting it live on time","Systems that work together","A defensible decision"]}
    };
    var scr = 1, sel = {industry:null,pain:null,focus:null,type:null,dur:15,date:null,slot:null};
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var dows = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    var phases = ["Your project","Your details","Your consultation"];
    var today = new Date(); today.setHours(0,0,0,0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    function q(s,c){ return (c||modal).querySelector(s); }
    function qa(s,c){ return Array.prototype.slice.call((c||modal).querySelectorAll(s)); }

    /* ----- open / close ----- */
    var seen = false, ret = null;
    function focusables(){ return qa('button, a[href], input, [tabindex]:not([tabindex="-1"])').filter(function(el){ return !el.disabled && el.offsetParent !== null; }); }
    function onKey(e){
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key !== "Tab") return;
      var f = focusables(); if (!f.length) return;
      var a = f[0], b = f[f.length-1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    }
    function openModal(){
      ret = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(function(){ modal.classList.add("is-open"); });
      var c = q(".cm-close"); if (c) c.focus();
      document.addEventListener("keydown", onKey);
    }
    function closeModal(){
      modal.classList.remove("is-open");
      document.removeEventListener("keydown", onKey);
      window.setTimeout(function(){ modal.hidden = true; }, 240);
      if (ret && ret.focus) ret.focus();
    }
    q(".cm-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function(e){ if (e.target === modal) closeModal(); });
    qa("[data-consult-open]", document).forEach(function(btn){
      btn.addEventListener("click", function(e){ e.preventDefault(); openModal(); });
    });
    // Scroll trigger: show once after the Industries section (fallback ~0.6 viewport).
    var industries = document.getElementById("industries");
    function onScroll(){
      var t = industries
        ? industries.getBoundingClientRect().bottom < window.innerHeight * 0.6
        : window.scrollY > window.innerHeight * 0.6;
      if (t && !seen) { seen = true; openModal(); window.removeEventListener("scroll", onScroll); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ----- wizard ----- */
    qa('.cm-chips[data-group="industry"] .cm-chip').forEach(function(ch){
      ch.addEventListener('click',function(){
        qa('.cm-chips[data-group="industry"] .cm-chip').forEach(function(x){x.classList.remove('is-sel');});
        ch.classList.add('is-sel');
        var v = ch.textContent.trim();
        if (sel.industry !== v) { sel.pain = null; sel.focus = null; }
        sel.industry = v; buildBranch();
        setTimeout(function(){ show(2); }, 260);
      });
    });
    function buildBranch(){
      var d = DATA[sel.industry] || DATA["Other"];
      fillChips('cm-pain','pain',d.pain);
      fillChips('cm-focus','focus',d.focus);
    }
    function fillChips(id,group,arr){
      var box = q('#'+id); box.innerHTML = '';
      arr.forEach(function(t){
        var b = document.createElement('button'); b.type = 'button';
        b.className = 'cm-chip' + (sel[group]===t?' is-sel':''); b.textContent = t;
        b.addEventListener('click',function(){
          qa('.cm-chip',box).forEach(function(x){x.classList.remove('is-sel');});
          b.classList.add('is-sel'); sel[group] = t;
          setTimeout(function(){ show(scr+1); }, 260);
        });
        box.appendChild(b);
      });
    }
    qa('.cm-type').forEach(function(t){
      t.addEventListener('click',function(){
        qa('.cm-type').forEach(function(x){x.classList.remove('is-sel');});
        t.classList.add('is-sel'); sel.type = t.getAttribute('data-type'); sel.dur = +t.getAttribute('data-dur');
        sel.slot = null; renderSlots(); refresh();
      });
    });
    qa('.cm-field input').forEach(function(i){ i.addEventListener('input', refresh); });

    function phaseOf(n){ return n<=3?1 : n===4?2 : 3; }
    function canAdvance(){
      if (scr===4) return q('#cm-nm').value.trim() && q('#cm-ph').value.trim() && q('#cm-co').value.trim();
      if (scr===5) return sel.type && sel.date && sel.slot;
      if (scr===6) return true;
      return false;
    }
    function refresh(){
      var useFwd = (scr===4||scr===5||scr===6);
      q('#cm-fwd').style.display = useFwd?'inline-block':'none';
      q('#cm-fwd').disabled = !canAdvance();
      if (scr===4) q('#cm-fwd').textContent = 'Next';
      else if (scr===5) q('#cm-fwd').textContent = (sel.type==='inperson') ? 'Continue to payment →' : 'Book the session →';
      else if (scr===6) q('#cm-fwd').textContent = 'Pay [fee] and confirm →';
      q('#cm-back').style.visibility = scr>1 ? 'visible':'hidden';
      var ph = phaseOf(scr);
      qa('.cm-seg').forEach(function(s,i){ s.classList.toggle('is-on', i < (scr===7?3:ph)); });
      q('#cm-phase').textContent = scr===7 ? 'Done' : phases[ph-1];
    }
    function show(n){
      scr = n;
      qa('.cm-panel').forEach(function(p){ p.classList.toggle('is-shown', +p.getAttribute('data-scr')===n); });
      if (n===6) buildPay();
      if (n===7){ q('#cm-nav').style.display='none'; buildSummary(); refresh(); if (modalBox) modalBox.scrollTop=0; return; }
      q('#cm-nav').style.display='flex';
      if (n===5) renderCal();
      refresh(); if (modalBox) modalBox.scrollTop=0;
    }
    q('#cm-fwd').addEventListener('click',function(){
      if (!canAdvance()) return;
      if (scr===5){ show(sel.type==='inperson'?6:7); return; }
      if (scr===6){ show(7); return; }
      show(scr+1);
    });
    q('#cm-back').addEventListener('click',function(){
      if (scr===7) return;
      if (scr===6){ show(5); return; }
      if (scr>1) show(scr-1);
    });

    function renderCal(){
      q('#cm-mlabel').textContent = months[view.getMonth()]+' '+view.getFullYear();
      var cal = q('#cm-cal'); cal.innerHTML = '';
      dows.forEach(function(d){ var e=document.createElement('div'); e.className='cm-dow'; e.textContent=d; cal.appendChild(e); });
      var first = new Date(view.getFullYear(),view.getMonth(),1).getDay();
      var days = new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
      for (var i=0;i<first;i++){ var x=document.createElement('div'); x.className='cm-day is-empty'; cal.appendChild(x); }
      for (var d=1;d<=days;d++){
        var dt = new Date(view.getFullYear(),view.getMonth(),d);
        var b = document.createElement('button'); b.type='button'; b.className='cm-day'; b.textContent=d;
        var wd = dt.getDay(); var dis = dt<today || wd===5 || wd===6;
        if (dis){ b.disabled=true; }
        else b.addEventListener('click',(function(dd){ return function(){
          qa('.cm-day').forEach(function(x){x.classList.remove('is-sel');}); this.classList.add('is-sel');
          sel.date = {d:dd,m:view.getMonth(),y:view.getFullYear(),label:dd+' '+months[view.getMonth()]+' '+view.getFullYear()};
          sel.slot = null; renderSlots(); refresh();
        };})(d).bind(b));
        if (sel.date && sel.date.d===d && sel.date.m===view.getMonth() && sel.date.y===view.getFullYear()) b.classList.add('is-sel');
        cal.appendChild(b);
      }
    }
    q('#cm-prev').addEventListener('click',function(){ view.setMonth(view.getMonth()-1); renderCal(); });
    q('#cm-next').addEventListener('click',function(){ view.setMonth(view.getMonth()+1); renderCal(); });

    function fmt(h,m){ var ap=h>=12?'pm':'am'; var hh=h>12?h-12:h; return hh+':'+(m<10?'0'+m:m)+' '+ap; }
    function renderSlots(){
      var g = q('#cm-slots'); g.innerHTML = '';
      if (!sel.type){ g.innerHTML='<span class="cm-slothint">Choose a consultation type first.</span>'; return; }
      if (!sel.date){ g.innerHTML='<span class="cm-slothint">Pick a day first.</span>'; return; }
      var times = [];
      if (sel.dur===60){ [12,13,14,15,16].forEach(function(h){ times.push(fmt(h,0)); }); }
      else { for (var h=12;h<17;h++){ times.push(fmt(h,0)); times.push(fmt(h,30)); } }
      times.forEach(function(t){
        var b = document.createElement('button'); b.type='button'; b.className='cm-slot'+(sel.slot===t?' is-sel':''); b.textContent=t;
        b.addEventListener('click',function(){ qa('.cm-slot').forEach(function(x){x.classList.remove('is-sel');});
          b.classList.add('is-sel'); sel.slot=t; refresh(); });
        g.appendChild(b);
      });
    }
    function buildPay(){
      var rows = [['Session','In person, 1 hour'],['When',(sel.date?sel.date.label:'')+(sel.slot?' · '+sel.slot:'')],['Fee','[fee]']];
      q('#cm-paycard').innerHTML = rows.map(function(r,i){ return '<div class="cm-row'+(i===2?' cm-tot':'')+'"><span>'+r[0]+'</span><span>'+r[1]+'</span></div>'; }).join('');
    }
    function buildSummary(){
      var rows = [['Industry',sel.industry],['Pain',sel.pain],['Priority',sel.focus],
        ['Name',q('#cm-nm').value.trim()],['Company',q('#cm-co').value.trim()],['Phone',q('#cm-ph').value.trim()],
        ['Consultation', sel.type==='online'?'Online · 15 min · free':'In person · 1 hour · paid, refundable'],
        ['When',(sel.date?sel.date.label:'')+(sel.slot?' · '+sel.slot:'')]];
      q('#cm-summary').innerHTML = rows.map(function(r){ return '<div><span>'+r[0]+'</span><span>'+(r[1]||'')+'</span></div>'; }).join('');
    }
    show(1);
  })();

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
