/* <consultation-modal>: self-contained booking modal for trustangle.
   Vanilla JS + Shadow DOM, one injected <style>. No frameworks, no storage.
   Auto-opens on click of any element whose text is "Request a Consultation" /
   "اطلب استشارة" or that carries [data-consult]; closes on backdrop / × / Esc. */
(function () {
  "use strict";

  var TEAM = [
    { name: "Maysarah Mechaal", abbr: "Maysarah M.", initials: "MM", url: "https://www.linkedin.com/in/maysarah-mechaal/" },
    { name: "Hamza Abu Sitta",  abbr: "Hamza A.",    initials: "HA", url: "https://www.linkedin.com/in/hamzaabusitta/" },
    { name: "Basheer Mishal",   abbr: "Basheer M.",  initials: "BM", url: "https://www.linkedin.com/in/basheer-mishal/" },
    { name: "Ahmad Jallabi",    abbr: "Ahmad J.",    initials: "AJ", url: "https://www.linkedin.com/in/ahmad-jallabi-10/" },
    { name: "Sara Fareed",      abbr: "Sara F.",     initials: "SF", url: "https://www.linkedin.com/in/sara-fareed/" }
  ];

  var INDUSTRIES = ["Hospitality","Food & Beverage","Retail & Commerce","Real Estate & Construction","Manufacturing","Banking & Finance","Insurance","Investments","Other"];

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

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var FEE = "SAR 750";

  // ---- inline icons (stroke, currentColor) ----
  var IC = {
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>',
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1Z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.2l2.6 1.6"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 6.2a3 3 0 0 1 0 5.6M21 19c0-2.3-1.4-4-3.6-4.7"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.25 8.25h4.5V24h-4.5zM8.5 8.25h4.3v2.15h.06c.6-1.13 2.06-2.32 4.24-2.32 4.54 0 5.38 2.99 5.38 6.87V24h-4.5v-6.98c0-1.66-.03-3.8-2.32-3.8s-2.67 1.81-2.67 3.68V24h-4.5z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.1 8.1L23.3 22h-6.6l-5.2-6.8L5.6 22H2.5l7.6-8.7L1 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
  };

  var STEPS = [
    { ic: IC.target, label: "Your project" },
    { ic: IC.person, label: "Your details" },
    { ic: IC.chat,   label: "Your consultation" },
    { ic: IC.card,   label: "Confirm & pay" }
  ];

  var CSS = '\
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&family=Archivo:wght@600;700;800&display=swap");\
:host{--ink:#0f1e23;--muted:#5a6a6f;--line:#e6ecec;--accent:#0099a8;--accent-deep:#067d89;--accent-soft:#e2f3f4;--tint:#f5f9f9;\
  --ui:"Plus Jakarta Sans",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace;--disp:"Archivo",var(--ui);}\
*{box-sizing:border-box}\
.backdrop{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:2vh 2vw;\
  background:rgba(10,24,28,.52);opacity:0;transition:opacity .22s ease;font-family:var(--ui);color:var(--ink)}\
:host([open]) .backdrop{display:flex}\
.backdrop.show{opacity:1}\
.modal{width:min(96vw,1080px);height:min(96vh,924px);background:#fff;border-radius:24px;overflow:hidden;\
  display:grid;grid-template-columns:260px 1fr;box-shadow:0 40px 110px -38px rgba(10,24,28,.6);transform:translateY(10px) scale(.99);transition:transform .22s ease}\
.backdrop.show .modal{transform:none}\
/* ---- left rail ---- */\
.rail{background:linear-gradient(170deg,#f6fbfb,#eef5f5);border-right:1px solid var(--line);padding:26px 22px;display:flex;flex-direction:column}\
.logo{width:152px;height:auto;display:block}\
.steps{list-style:none;margin:0;padding:0;flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;position:relative}\
.steps li{position:relative;display:flex;align-items:center;gap:13px;padding:11px 8px;border-radius:12px;color:var(--muted);transition:.2s}\
.steps li .dot{flex:none;width:38px;height:38px;border-radius:11px;background:#fff;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--muted);z-index:1;transition:.2s}\
.steps li .dot svg{width:19px;height:19px}\
.steps li .lbl{font-size:14px;font-weight:600;line-height:1.15}\
.steps li::before{content:"";position:absolute;left:26px;top:38px;bottom:-6px;width:2px;background:var(--line);z-index:0}\
.steps li:last-child::before{display:none}\
.steps li.done{color:var(--accent-deep)}\
.steps li.done .dot{background:var(--accent-soft);border-color:transparent;color:var(--accent-deep)}\
.steps li.active{color:var(--ink)}\
.steps li.active .dot{background:linear-gradient(135deg,#067d89,#0099a8);border-color:transparent;color:#fff;box-shadow:0 8px 18px -8px rgba(6,125,137,.7)}\
.social{display:flex;gap:10px;padding-top:14px;border-top:1px solid var(--line)}\
.social a{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--muted);background:#fff;border:1px solid var(--line);transition:.18s}\
.social a:hover{color:#fff;background:var(--accent-deep);border-color:transparent}\
.social a svg{width:16px;height:16px}\
/* ---- right main ---- */\
.main{position:relative;display:flex;flex-direction:column;min-height:0;padding:22px 34px 16px}\
.close{position:absolute;top:18px;right:20px;width:34px;height:34px;border:none;background:none;font-size:24px;line-height:1;color:var(--muted);cursor:pointer;border-radius:8px}\
.close:hover{color:var(--ink);background:var(--tint)}\
.body{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column}\
.screen{display:none;flex-direction:column;min-height:0;flex:1}\
.screen.show{display:flex}\
.count{font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-deep);margin-bottom:7px}\
.h{font-family:var(--disp);font-weight:800;font-size:clamp(21px,2.3vw,27px);line-height:1.16;letter-spacing:-.015em;margin:0 0 4px;max-width:24ch}\
.sub{font-size:13.5px;color:var(--muted);margin:0 0 14px}\
.chips{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:14px}\
.chip{font-family:var(--ui);font-size:14px;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:11px;padding:11px 16px;cursor:pointer;transition:.13s}\
.chip:hover{border-color:var(--accent)}\
.chip.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.writein{display:block;width:100%;max-width:480px;font-family:var(--ui);font-size:14px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:11px;padding:11px 14px}\
.writein:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
.fields{display:grid;gap:13px;max-width:460px}\
.field label{display:block;font-weight:600;font-size:12.5px;color:var(--muted);margin-bottom:5px}\
.field input{width:100%;font-family:var(--ui);font-size:15px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:11px;padding:12px 14px}\
.field input:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
/* connect */\
.types{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:9px}\
.type{position:relative;border:1px solid var(--line);border-radius:13px;padding:9px 13px;cursor:pointer;transition:.13s}\
.type:hover{border-color:var(--accent)}\
.type.sel{border-color:var(--accent);background:var(--accent-soft)}\
.type .tt{font-family:var(--disp);font-weight:700;font-size:15px}\
.type .td{font-size:12px;color:var(--muted);margin-top:2px}\
.type .tp{font-family:var(--mono);font-size:12px;font-weight:600;color:var(--accent-deep);margin-top:4px}\
.type .tick{position:absolute;top:9px;right:9px;width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;display:none;align-items:center;justify-content:center}\
.type .tick svg{width:11px;height:11px}\
.type.sel .tick{display:flex}\
.teamnote{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--accent-deep);background:var(--accent-soft);border-radius:10px;padding:7px 11px;margin-bottom:9px}\
.teamnote svg{width:15px;height:15px;flex:none}\
.cgrid{display:grid;grid-template-columns:1.05fr .95fr;gap:18px;min-height:0}\
.col-h{font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}\
.book{display:grid;grid-template-columns:auto 1fr;gap:14px}\
.calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}\
.calhead b{font-family:var(--disp);font-weight:700;font-size:13.5px}\
.calhead button{border:1px solid var(--line);background:#fff;border-radius:7px;width:26px;height:26px;cursor:pointer;color:var(--ink);font-size:14px;line-height:1}\
.calhead button:hover:not(:disabled){border-color:var(--accent);color:var(--accent-deep)}\
.calhead button:disabled{opacity:.4;cursor:not-allowed}\
.cal{display:grid;grid-template-columns:repeat(7,26px);gap:3px}\
.cal .dw{font-size:10px;font-weight:600;color:var(--muted);text-align:center}\
.cal .d{width:26px;height:26px;border:none;background:var(--tint);border-radius:7px;font-size:12px;color:var(--ink);cursor:pointer;font-family:var(--ui)}\
.cal .d:hover:not(:disabled){background:var(--accent-soft);color:var(--accent-deep)}\
.cal .d.sel{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;font-weight:600}\
.cal .d:disabled{background:none;color:#c4cdce;cursor:not-allowed}\
.cal .d.empty{background:none;cursor:default}\
.times{display:flex;flex-direction:column;gap:5px;max-height:236px;align-content:start}\
.tlabel{font-size:11px;font-weight:600;color:var(--muted);margin-bottom:1px}\
.slot{display:flex;justify-content:space-between;align-items:center;font-family:var(--ui);font-size:12.5px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 11px;cursor:pointer;color:var(--ink)}\
.slot:hover:not(:disabled){border-color:var(--accent)}\
.slot.sel{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;border-color:transparent;font-weight:600}\
.slot:disabled{color:#aab4b5;cursor:not-allowed;background:var(--tint)}\
.slot .bk{font-size:10px;text-transform:uppercase;letter-spacing:.05em}\
.hint{font-size:12px;color:var(--muted)}\
.locard{border:1px solid var(--line);border-radius:12px;padding:9px 12px;margin-bottom:8px}\
.locard .lt{display:flex;align-items:center;gap:7px;font-weight:700;font-size:13px}\
.locard .lt svg{width:16px;height:16px;color:var(--accent-deep)}\
.locard .la{font-size:12px;color:var(--muted);margin:3px 0 0;line-height:1.35}\
.locard a{color:var(--accent-deep);font-weight:600;text-decoration:none;font-size:12px}\
.locard a:hover{color:var(--accent)}\
.infocard{border:1px solid var(--line);border-radius:12px;padding:3px 12px;margin-bottom:8px}\
.irow{display:flex;align-items:center;gap:10px;padding:4px 0;border-bottom:1px solid var(--line)}\
.irow:last-child{border-bottom:none}\
.irow .ii{flex:none;width:30px;height:30px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center}\
.irow .ii svg{width:17px;height:17px}\
.irow .il{font-size:11px;color:var(--muted)}\
.irow .iv{font-size:12.5px;font-weight:600;line-height:1.2}\
.team{display:flex;flex-direction:column;gap:1px}\
.adv{display:flex;align-items:center;gap:9px;padding:2px 4px;border-radius:9px;text-decoration:none;color:inherit}\
.adv:hover{background:var(--tint)}\
.adv .av{flex:none;width:25px;height:25px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;overflow:hidden}\
.adv .av img{width:100%;height:100%;object-fit:cover}\
.adv .an{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}\
.adv .ali{color:var(--muted)}\
.adv .ali svg{width:14px;height:14px;display:block}\
.adv:hover .ali{color:var(--accent-deep)}\
.contactrows{display:grid;gap:10px;max-width:420px}\
.crow{display:flex;align-items:center;gap:11px;border:1px solid var(--line);border-radius:12px;padding:12px 14px}\
.crow .ii{flex:none;width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center}\
.crow .ii svg{width:17px;height:17px}\
.crow a{color:var(--ink);font-weight:600;text-decoration:none;font-size:14px}\
.crow a:hover{color:var(--accent-deep)}\
.crow .cl{font-size:11px;color:var(--muted)}\
/* pay + done */\
.summ{border:1px solid var(--line);border-radius:14px;padding:16px 18px;max-width:460px;margin-bottom:14px}\
.summ .r{display:flex;justify-content:space-between;gap:16px;padding:6px 0;font-size:14px}\
.summ .r span:first-child{color:var(--muted)}\
.summ .r span:last-child{font-weight:600;text-align:right}\
.summ .r.tot{border-top:1px solid var(--line);margin-top:6px;padding-top:11px;font-size:15px}\
.refund{display:flex;gap:10px;align-items:flex-start;background:var(--accent-soft);border-radius:12px;padding:13px 15px;max-width:460px;color:var(--accent-deep)}\
.refund svg{width:18px;height:18px;flex:none;margin-top:1px}\
.refund p{margin:0;font-size:13.5px;font-weight:600}\
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}\
.done .ok{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:16px}\
.done .ok svg{width:30px;height:30px}\
.done .summ{margin:14px auto 0;text-align:left}\
/* footer nav */\
.nav{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:12px;margin-top:10px;border-top:1px solid var(--line)}\
.btn{font-family:var(--ui);font-weight:600;font-size:14.5px;border-radius:999px;padding:11px 24px;cursor:pointer;border:1px solid transparent;transition:.15s;display:inline-flex;align-items:center;gap:8px}\
.btn svg{width:15px;height:15px}\
.btn-back{background:#fff;border-color:var(--line);color:var(--ink)}\
.btn-back:hover{border-color:var(--muted)}\
.btn-next{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;box-shadow:0 12px 26px -12px rgba(6,125,137,.8)}\
.btn-next:disabled{background:#c4cdce;box-shadow:none;cursor:not-allowed}\
@media(max-width:820px){.modal{grid-template-columns:1fr}.rail .steps,.rail .social{display:none}.rail{flex-direction:row;align-items:center;padding:16px 20px}.cgrid{grid-template-columns:1fr}}\
@media(prefers-reduced-motion:reduce){.backdrop,.modal{transition:none}}';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var Comp = function () {};
  Comp.prototype = Object.create(HTMLElement.prototype);

  class ConsultationModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._ret = null;
      this._reset();
    }
    _reset() {
      this.state = { screen: 1, industry: null, industryText: "", pain: [], painText: "", focus: null, focusText: "",
        name: "", phone: "", company: "", type: null, date: null, slot: null };
      this.view = null;
    }
    connectedCallback() {
      var st = el("style"); st.textContent = CSS;
      this.shadowRoot.appendChild(st);
      this.shadowRoot.appendChild(this._build());
      this._bind();
    }

    /* ---------- skeleton ---------- */
    _build() {
      var bd = el("div", "backdrop");
      var modal = el("div", "modal");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Request a consultation");

      // rail
      var rail = el("aside", "rail");
      rail.appendChild(el("img", "logo")).setAttribute("src", "assets/trustangle-logo-full.png");
      rail.querySelector(".logo").setAttribute("alt", "trustangle");
      var steps = el("ol", "steps");
      STEPS.forEach(function (s, i) {
        var li = el("li"); li.setAttribute("data-step", i + 1);
        li.appendChild(el("span", "dot", s.ic));
        li.appendChild(el("span", "lbl", s.label));
        steps.appendChild(li);
      });
      rail.appendChild(steps);
      var social = el("div", "social");
      social.innerHTML =
        '<a href="https://www.linkedin.com/company/trustangle" target="_blank" rel="noopener" aria-label="LinkedIn">' + IC.linkedin + '</a>' +
        '<a href="#" aria-label="X">' + IC.x + '</a>' +
        '<a href="#" aria-label="Instagram">' + IC.instagram + '</a>';
      rail.appendChild(social);
      modal.appendChild(rail);

      // main
      var main = el("main", "main");
      main.appendChild(el("button", "close", "&times;")).setAttribute("aria-label", "Close");
      main.appendChild(el("div", "body"));
      var nav = el("div", "nav");
      nav.appendChild(el("button", "btn btn-back", "Back"));
      nav.appendChild(el("button", "btn btn-next", "Next"));
      main.appendChild(nav);
      modal.appendChild(main);

      bd.appendChild(modal);
      this._bd = bd; this._modal = modal; this._body = main.querySelector(".body");
      this._back = nav.querySelector(".btn-back"); this._next = nav.querySelector(".btn-next");
      return bd;
    }

    _bind() {
      var self = this;
      this._bd.addEventListener("click", function (e) { if (e.target === self._bd) self.close(); });
      this.shadowRoot.querySelector(".close").addEventListener("click", function () { self.close(); });
      this._back.addEventListener("click", function () { self._goBack(); });
      this._next.addEventListener("click", function () { self._goNext(); });
      this._onKey = function (e) { if (e.key === "Escape") self.close(); };
    }

    /* ---------- open / close ---------- */
    open() {
      this._reset();
      this.setAttribute("open", "");
      this._ret = document.activeElement;
      document.documentElement.style.overflow = "hidden";
      document.addEventListener("keydown", this._onKey);
      var self = this;
      requestAnimationFrame(function () { self._bd.classList.add("show"); });
      this._render();
      var c = this.shadowRoot.querySelector(".close"); if (c) c.focus();
    }
    close() {
      this._bd.classList.remove("show");
      document.removeEventListener("keydown", this._onKey);
      document.documentElement.style.overflow = "";
      var self = this;
      window.setTimeout(function () { self.removeAttribute("open"); }, 220);
      if (this._ret && this._ret.focus) this._ret.focus();
    }

    /* ---------- navigation ---------- */
    _phase(n) { return n <= 3 ? 1 : n === 4 ? 2 : n === 5 ? 3 : 4; }
    _valid() {
      var s = this.state;
      switch (s.screen) {
        case 1: return !!(s.industry || s.industryText.trim());
        case 2: return s.pain.length > 0 || !!s.painText.trim();
        case 3: return !!(s.focus || s.focusText.trim());
        case 4: return !!(s.name.trim() && s.phone.trim() && s.company.trim());
        case 5:
          if (s.type === "contact") return true;
          if (s.type === "inperson" || s.type === "online") return !!(s.date && s.slot);
          return false;
        case 6: return true;
        default: return true;
      }
    }
    _goNext() {
      if (!this._valid()) return;
      var s = this.state;
      if (s.screen === 5) { this.state.screen = (s.type === "inperson") ? 6 : 7; this._render(); return; }
      if (s.screen === 6) { this.state.screen = 7; this._render(); return; }
      if (s.screen >= 7) return;
      this.state.screen += 1; this._render();
    }
    _goBack() {
      var s = this.state;
      if (s.screen === 7) { this.state.screen = (s.type === "inperson") ? 6 : 5; this._render(); return; }
      if (s.screen <= 1) return;
      this.state.screen -= 1; this._render();
    }

    /* ---------- render ---------- */
    _render() {
      var s = this.state, ph = this._phase(s.screen);
      // rail step states
      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll(".steps li"), function (li) {
        var n = +li.getAttribute("data-step");
        li.classList.toggle("active", n === ph);
        li.classList.toggle("done", n < ph);
      });
      // body
      this._body.innerHTML = "";
      this._body.appendChild(this["_screen" + s.screen]());
      // nav
      this._back.style.visibility = s.screen > 1 && s.screen < 7 ? "visible" : "hidden";
      this._next.style.display = s.screen === 7 ? "none" : "inline-flex";
      this._next.disabled = !this._valid();
      this._next.innerHTML = this._nextLabel() + (s.screen === 7 ? "" : IC.arrow);
    }
    _nextLabel() {
      var s = this.state;
      if (s.screen === 4) return "Continue";
      if (s.screen === 5) {
        if (s.type === "inperson") return "Continue to payment";
        if (s.type === "contact") return "Send request";
        return "Confirm booking";
      }
      if (s.screen === 6) return "Pay " + FEE + " and confirm";
      return "Next";
    }

    /* ---------- screens ---------- */
    _wrap(count, title, sub) {
      var w = el("div", "screen show");
      if (count) w.appendChild(el("div", "count", count));
      w.appendChild(el("h2", "h", title));
      if (sub) w.appendChild(el("p", "sub", sub));
      return w;
    }
    _chips(items, group, multi) {
      var self = this, s = this.state, box = el("div", "chips");
      items.forEach(function (t) {
        var sel = multi ? s[group].indexOf(t) >= 0 : s[group] === t;
        var c = el("button", "chip" + (sel ? " sel" : ""), t); c.type = "button";
        c.addEventListener("click", function () {
          if (multi) {
            var i = s[group].indexOf(t);
            if (i >= 0) s[group].splice(i, 1); else s[group].push(t);
          } else {
            s[group] = (s[group] === t) ? null : t;
            if (group === "industry") { s.pain = []; s.focus = null; }
          }
          self._render();
          if (group === "industry" && t === "Other") { var wi = self._body.querySelector(".writein"); if (wi) wi.focus(); }
        });
        box.appendChild(c);
      });
      return box;
    }
    _writeIn(group, ph) {
      var self = this, s = this.state;
      var inp = el("input", "writein"); inp.type = "text"; inp.placeholder = ph; inp.value = s[group];
      inp.addEventListener("input", function () { s[group] = inp.value; self._next.disabled = !self._valid(); });
      return inp;
    }

    _screen1() {
      var w = this._wrap("Step 1 of 4", "Which industry is your project in?", "Pick the closest fit, or write your own.");
      w.appendChild(this._chips(INDUSTRIES, "industry", false));
      w.appendChild(this._writeIn("industryText", "Or describe your industry"));
      return w;
    }
    _screen2() {
      var ind = this.state.industry || "Other";
      var w = this._wrap("Step 1 of 4", "What is the pain right now?", "Select all that apply.");
      w.appendChild(this._chips((DATA[ind] || DATA.Other).pain, "pain", true));
      w.appendChild(this._writeIn("painText", "Anything else slowing you down?"));
      return w;
    }
    _screen3() {
      var ind = this.state.industry || "Other";
      var w = this._wrap("Step 1 of 4", "What matters most?", "Choose the one outcome that counts.");
      w.appendChild(this._chips((DATA[ind] || DATA.Other).focus, "focus", false));
      w.appendChild(this._writeIn("focusText", "Or name your priority"));
      return w;
    }
    _screen4() {
      var self = this, s = this.state;
      var w = this._wrap("Step 2 of 4", "Where do we send what we find?");
      var f = el("div", "fields");
      [["name", "Full name", "text", "name"], ["phone", "Phone", "tel", "tel"], ["company", "Company", "text", "organization"]].forEach(function (r) {
        var fl = el("div", "field");
        fl.appendChild(el("label", null, r[1])).setAttribute("for", "cm-" + r[0]);
        var inp = el("input"); inp.id = "cm-" + r[0]; inp.type = r[2]; inp.autocomplete = r[3]; inp.value = s[r[0]];
        inp.addEventListener("input", function () { s[r[0]] = inp.value; self._next.disabled = !self._valid(); });
        fl.appendChild(inp); f.appendChild(fl);
      });
      w.appendChild(f);
      return w;
    }

    _screen5() {
      var self = this, s = this.state;
      var w = this._wrap("Step 3 of 4", "How would you like to connect?");
      // type cards
      var types = el("div", "types");
      [
        { k: "inperson", t: "In-person", d: "1 hour", p: FEE },
        { k: "online", t: "Online", d: "15 min", p: "Free" },
        { k: "contact", t: "Contact", d: "Direct", p: "" }
      ].forEach(function (tp) {
        var c = el("div", "type" + (s.type === tp.k ? " sel" : ""));
        c.innerHTML = '<div class="tt">' + tp.t + '</div><div class="td">' + tp.d + '</div>' +
          (tp.p ? '<div class="tp">' + tp.p + '</div>' : '<div class="tp">&nbsp;</div>') +
          '<span class="tick">' + IC.check + '</span>';
        c.addEventListener("click", function () {
          s.type = tp.k; s.date = null; s.slot = null;
          self.view = null; self._render();
        });
        types.appendChild(c);
      });
      w.appendChild(types);
      // team note
      w.appendChild(el("div", "teamnote", IC.people + "<span>You will meet our senior advisory team, not a sales desk.</span>"));

      // body area depends on type
      var grid = el("div", "cgrid");
      if (s.type === "contact") {
        var cwrap = el("div");
        cwrap.appendChild(el("p", "col-h", "Reach us directly"));
        var rows = el("div", "contactrows");
        rows.innerHTML =
          '<div class="crow"><span class="ii">' + IC.chat + '</span><div><div class="cl">Email</div><a href="mailto:consultations@trustangle.com">consultations@trustangle.com</a></div></div>' +
          '<div class="crow"><span class="ii">' + IC.person + '</span><div><div class="cl">Phone</div><a href="tel:+966112930707">+966 11 293 0707</a></div></div>';
        cwrap.appendChild(rows);
        grid.appendChild(cwrap);
      } else if (s.type) {
        grid.appendChild(this._bookCol());
        grid.appendChild(this._infoCol());
      } else {
        var hint = el("div"); hint.appendChild(el("p", "hint", "Choose how you would like to connect to pick a time."));
        grid.appendChild(hint);
      }
      w.appendChild(grid);
      return w;
    }

    _bookCol() {
      var self = this, s = this.state;
      var col = el("div");
      col.appendChild(el("p", "col-h", "Pick a date and time"));
      var book = el("div", "book");
      // calendar
      var calWrap = el("div");
      if (!this.view) { var t = new Date(); t.setHours(0, 0, 0, 0); this.view = new Date(t.getFullYear(), t.getMonth(), 1); }
      var head = el("div", "calhead");
      var prev = el("button", null, "&lsaquo;"); prev.type = "button"; prev.setAttribute("aria-label", "Previous month");
      var lab = el("b", null, MONTHS[this.view.getMonth()] + " " + this.view.getFullYear());
      var next = el("button", null, "&rsaquo;"); next.type = "button"; next.setAttribute("aria-label", "Next month");
      head.appendChild(prev); head.appendChild(lab); head.appendChild(next);
      calWrap.appendChild(head);
      var cal = el("div", "cal");
      DOWS.forEach(function (d) { cal.appendChild(el("div", "dw", d)); });

      var today = new Date(); today.setHours(0, 0, 0, 0);
      var minD = new Date(today); if (s.type === "inperson") minD.setDate(minD.getDate() + 1);
      var maxD = new Date(today); maxD.setDate(maxD.getDate() + 30);
      var first = new Date(this.view.getFullYear(), this.view.getMonth(), 1).getDay();
      var days = new Date(this.view.getFullYear(), this.view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < first; i++) cal.appendChild(el("div", "d empty"));
      for (var d = 1; d <= days; d++) {
        var dt = new Date(this.view.getFullYear(), this.view.getMonth(), d);
        var wd = dt.getDay();
        var b = el("button", "d", String(d)); b.type = "button";
        var dis = dt < minD || dt > maxD || wd === 5 || wd === 6;
        if (dis) { b.disabled = true; }
        else b.addEventListener("click", (function (dd) {
          return function () {
            s.date = { d: dd, m: self.view.getMonth(), y: self.view.getFullYear(), label: dd + " " + MONTHS[self.view.getMonth()] + " " + self.view.getFullYear() };
            s.slot = null; self._render();
          };
        })(d));
        if (s.date && s.date.d === d && s.date.m === this.view.getMonth() && s.date.y === this.view.getFullYear()) b.classList.add("sel");
        cal.appendChild(b);
      }
      // limit month nav to the booking window
      prev.disabled = (this.view.getFullYear() === today.getFullYear() && this.view.getMonth() <= today.getMonth());
      next.disabled = (new Date(this.view.getFullYear(), this.view.getMonth(), 1) >= new Date(maxD.getFullYear(), maxD.getMonth(), 1));
      prev.addEventListener("click", function () { self.view = new Date(self.view.getFullYear(), self.view.getMonth() - 1, 1); self._render(); });
      next.addEventListener("click", function () { self.view = new Date(self.view.getFullYear(), self.view.getMonth() + 1, 1); self._render(); });
      calWrap.appendChild(cal);
      book.appendChild(calWrap);

      // times
      var tcol = el("div", "times");
      if (!s.date) { tcol.appendChild(el("p", "hint", "Pick a day to see times.")); }
      else {
        tcol.appendChild(el("div", "tlabel", "Available times"));
        var times = [];
        if (s.type === "inperson") { [12, 13, 14, 15, 16].forEach(function (h) { times.push(fmt(h, 0)); }); }
        else { for (var h = 12; h <= 16; h++) { times.push(fmt(h, 0)); if (h < 16) times.push(fmt(h, 30)); } }
        times.forEach(function (t, i) {
          var booked = (i % 4 === 1); // ~25% booked, deterministic
          var sl = el("button", "slot" + (s.slot === t ? " sel" : "")); sl.type = "button";
          sl.innerHTML = "<span>" + t + "</span>" + (booked ? '<span class="bk">Booked</span>' : "");
          if (booked) sl.disabled = true;
          else sl.addEventListener("click", function () { s.slot = t; self._render(); });
          tcol.appendChild(sl);
        });
      }
      book.appendChild(tcol);
      col.appendChild(book);
      return col;
    }

    _infoCol() {
      var col = el("div");
      col.appendChild(el("p", "col-h", "Our location"));
      var loc = el("div", "locard");
      loc.innerHTML = '<div class="lt">' + IC.pin + 'KAFD, Riyadh</div>' +
        '<p class="la">King Abdullah Financial District, Riyadh, Saudi Arabia</p>' +
        '<a href="https://maps.app.goo.gl/JhnSe44AseKDLBiA8" target="_blank" rel="noopener">View on map &rarr;</a>';
      col.appendChild(loc);
      var info = el("div", "infocard");
      var dur = this.state.type === "inperson" ? "1 hour, in person" : "15 minutes, online";
      info.innerHTML =
        '<div class="irow"><span class="ii">' + IC.clock + '</span><div><div class="il">Duration</div><div class="iv">' + dur + '</div></div></div>' +
        '<div class="irow"><span class="ii">' + IC.people + '</span><div><div class="il">Team</div><div class="iv">5 specialists on call</div></div></div>' +
        '<div class="irow"><span class="ii">' + IC.list + '</span><div><div class="il">What to expect</div><div class="iv">A read on your decision, no pitch</div></div></div>';
      col.appendChild(info);
      col.appendChild(el("p", "col-h", "Who you will meet"));
      var team = el("div", "team");
      TEAM.forEach(function (m) {
        var a = el("a", "adv"); a.href = m.url; a.target = "_blank"; a.rel = "noopener";
        a.innerHTML = '<span class="av">' + m.initials + '</span><span class="an">' + m.abbr + '</span><span class="ali">' + IC.linkedin + '</span>';
        team.appendChild(a);
      });
      col.appendChild(team);
      return col;
    }

    _screen6() {
      var s = this.state;
      var w = this._wrap("Step 4 of 4", "Confirm your in-person session.");
      var sm = el("div", "summ");
      sm.innerHTML =
        '<div class="r"><span>Session</span><span>In person, 1 hour</span></div>' +
        '<div class="r"><span>When</span><span>' + (s.date ? s.date.label : "") + (s.slot ? " · " + s.slot : "") + '</span></div>' +
        '<div class="r tot"><span>Fee</span><span>' + FEE + '</span></div>';
      w.appendChild(sm);
      w.appendChild(el("div", "refund", IC.check + '<p>If you do not benefit from the session, we refund the fee in full.</p>'));
      return w;
    }
    _screen7() {
      var s = this.state, contact = s.type === "contact";
      var w = el("div", "screen show");
      var d = el("div", "done");
      d.appendChild(el("div", "ok", IC.check));
      d.appendChild(el("h2", "h", contact ? "We'll be in touch." : "You're booked."));
      d.appendChild(el("p", "sub", contact ? "Your request is with our advisory team." : "A calendar invite and confirmation are on the way."));
      var rows = [
        ["Industry", s.industry || s.industryText],
        ["Priority", s.focus || s.focusText],
        ["Name", s.name],
        ["Company", s.company],
        ["Consultation", s.type === "inperson" ? "In person · 1 hour · " + FEE + ", refundable" : s.type === "online" ? "Online · 15 min · free" : "Direct contact"]
      ];
      if (!contact && s.date) rows.push(["When", s.date.label + (s.slot ? " · " + s.slot : "")]);
      var sm = el("div", "summ");
      sm.innerHTML = rows.map(function (r) { return '<div class="r"><span>' + r[0] + '</span><span>' + (r[1] || "") + '</span></div>'; }).join("");
      d.appendChild(sm);
      w.appendChild(d);
      return w;
    }
  }

  function fmt(h, m) { var ap = h >= 12 ? "pm" : "am"; var hh = h > 12 ? h - 12 : h; return hh + (m ? ":" + (m < 10 ? "0" + m : m) : ":00") + " " + ap; }

  if (!customElements.get("consultation-modal")) customElements.define("consultation-modal", ConsultationModal);

  /* ---------- triggers: look up the live element on each click ---------- */
  var LABELS = ["request a consultation", "اطلب استشارة"];
  function findModal() { return document.querySelector("consultation-modal"); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("a,button,[data-consult]");
    if (!t) return;
    var txt = (t.textContent || "").trim().toLowerCase();
    if (t.hasAttribute("data-consult") || t.hasAttribute("data-consult-open") || LABELS.indexOf(txt) >= 0) {
      var m = findModal();
      if (m) { e.preventDefault(); m.open(); }
    }
  });

  /* ---------- open once after the Industries section on scroll ---------- */
  var seen = false;
  function onScroll() {
    if (seen) return;
    var ind = document.getElementById("industries");
    var t = ind ? ind.getBoundingClientRect().bottom < window.innerHeight * 0.6 : window.scrollY > window.innerHeight * 0.6;
    if (t) { seen = true; var m = findModal(); if (m) m.open(); window.removeEventListener("scroll", onScroll); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();
