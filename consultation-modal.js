/* <consultation-modal>: self-contained booking modal for trustangle.
   Vanilla JS + Shadow DOM, one injected <style>. No frameworks, no storage.
   Opens on any "Request a Consultation" / "اطلب استشارة" / [data-consult] click
   (live lookup each time) and once after the Industries section; closes on
   backdrop / x / Esc. Placeholders ({{...}}) are intentionally left literal. */
(function () {
  "use strict";

  /* ---- placeholders (left literal until real values are supplied) ---- */
  var DIAGNOSTIC_FEE = "{{DIAGNOSTIC_FEE}}";
  var PAYMENT_PROVIDER = "{{PAYMENT_PROVIDER}}";
  var FORM_ENDPOINT = "{{FORM_ENDPOINT}}";

  var TEAM = [
    { name: "Maysarah Mechaal", slug: "maysarah-mechaal", initials: "MM", url: "https://www.linkedin.com/in/maysarah-mechaal/", title: "{{TITLE_MAYSARAH}}" },
    { name: "Hamza Abu Sitta",  slug: "hamza-abu-sitta",  initials: "HA", url: "https://www.linkedin.com/in/hamzaabusitta/",   title: "{{TITLE_HAMZA}}" },
    { name: "Basheer Mishal",   slug: "basheer-mishal",   initials: "BM", url: "https://www.linkedin.com/in/basheer-mishal/",  title: "{{TITLE_BASHEER}}" },
    { name: "Ahmad Jallabi",    slug: "ahmad-jallabi",    initials: "AJ", url: "https://www.linkedin.com/in/ahmad-jallabi-10/", title: "{{TITLE_AHMAD}}" },
    { name: "Sara Fareed",      slug: "sara-fareed",      initials: "SF", url: "https://www.linkedin.com/in/sara-fareed/",     title: "{{TITLE_SARA}}" }
  ];

  var INDUSTRIES = ["Hospitality","Food & Beverage","Retail & Commerce","Real Estate & Construction","Manufacturing","Banking & Finance","Insurance","Investments","Other"];

  var DATA = {
    "Hospitality":{pains:["PMS and POS that do not hold through peak season","A multi-property rollout slipping behind","Guest data scattered across systems","ZATCA and finance not connected to the POS","Booking, channel, and rate management out of sync","No single guest profile across properties"],priorities:["Every property live on time","One guest view across properties","Finance and ZATCA in order"]},
    "Food & Beverage":{pains:["Aggregator orders not matching the books","Inventory and waste hard to control","POS slow at the Friday rush","Reservations and delivery on separate systems","Recipe and food cost drifting unnoticed","Many branches, no single view of sales"],priorities:["One order, one number everywhere","Control over inventory and cost","Faster service at peak"]},
    "Retail & Commerce":{pains:["Stock counts that do not match across channels","Online and store on separate systems","Fulfillment too slow","No clear view of the customer","Pricing and promotions inconsistent across locations","Returns and exchanges hard to track"],priorities:["Accurate stock across channels","One customer view","Faster fulfillment"]},
    "Real Estate & Construction":{pains:["Leasing and facility data in silos","Project numbers that do not reconcile","Manual handover between stages","No single view of the portfolio","Maintenance requests lost between teams","Fundraising and investor records disconnected"],priorities:["One view of the portfolio","Numbers that reconcile","Less manual handover"]},
    "Manufacturing":{pains:["The floor disconnected from finance","Downtime nobody can explain","Inventory and orders out of sync","Maintenance run on guesswork","No live view of output or OEE","Quality issues caught too late"],priorities:["The floor connected to the close","Less unplanned downtime","Orders and stock in sync"]},
    "Banking & Finance":{pains:["Onboarding too slow for the regulator","Lending decisions stuck in manual steps","Core systems that do not integrate","Compliance bolted on, not built in","No single view of the customer across products","Reporting that cannot keep up with the regulator"],priorities:["Faster, compliant onboarding","Integrated core systems","Governance from day one"]},
    "Insurance":{pains:["Claims slow and hard to audit","Policy and underwriting on separate systems","Manual onboarding and KYC","No clear trail for the regulator","Broker and agent portals cut off from core","Renewals and endorsements handled by hand"],priorities:["Faster, auditable claims","One policy-to-claim view","A clear regulatory trail"]},
    "Investments":{pains:["Investor onboarding is manual","Reporting that cannot keep up","Capital and compliance on separate tracks","No single investor view","Fundraising rounds tracked in spreadsheets","Asset and portfolio data hard to consolidate"],priorities:["Faster investor onboarding","Reporting built for scrutiny","Capital and compliance together"]},
    "Other":{pains:["Choosing a platform, unsure of the timeline","Live, but the rollout keeps slipping","Systems that do not talk to each other","Manual work that should be automated","No single source of truth for the data","Not sure we should build this at all"],priorities:["Getting it live on time","Systems that work together","A defensible decision"]}
  };

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var PHASES = ["Your project", "Your details", "Your consultation"];

  var IC = {
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>',
    person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1Z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.25 8.25h4.5V24h-4.5zM8.5 8.25h4.3v2.15h.06c.6-1.13 2.06-2.32 4.24-2.32 4.54 0 5.38 2.99 5.38 6.87V24h-4.5v-6.98c0-1.66-.03-3.8-2.32-3.8s-2.67 1.81-2.67 3.68V24h-4.5z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.1 8.1L23.3 22h-6.6l-5.2-6.8L5.6 22H2.5l7.6-8.7L1 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
  };

  var RAIL = [
    { ic: IC.target, label: "Your project" },
    { ic: IC.person, label: "Your details" },
    { ic: IC.chat,   label: "Your consultation" },
    { ic: IC.card,   label: "Confirm & pay" }
  ];

  var CSS = '\
@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap");\
:host{--ink:#0f1e23;--muted:#5a6a6f;--line:#e6ecec;--accent:#0099a8;--accent-deep:#067d89;--accent-soft:#e2f3f4;--tint:#f5f9f9;\
  --disp:"Archivo",system-ui,sans-serif;--body:"Source Sans 3",system-ui,sans-serif}\
*{box-sizing:border-box}\
.backdrop{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:2vh 2vw;\
  background:rgba(10,24,28,.52);opacity:0;transition:opacity .22s ease;font-family:var(--body);color:var(--ink)}\
:host([open]) .backdrop{display:flex}\
.backdrop.show{opacity:1}\
.modal{width:min(96vw,1080px);height:min(96vh,924px);background:#fff;border-radius:24px;overflow:hidden;\
  display:grid;grid-template-columns:260px 1fr;box-shadow:0 40px 110px -38px rgba(10,24,28,.6);transform:translateY(10px) scale(.99);transition:transform .22s ease}\
.backdrop.show .modal{transform:none}\
.rail{background:linear-gradient(170deg,#f6fbfb,#eef5f5);border-right:1px solid var(--line);padding:26px 22px;display:flex;flex-direction:column}\
.logo{width:152px;height:auto;display:block}\
.steps{list-style:none;margin:auto 0;padding:0;display:flex;flex-direction:column;gap:26px;position:relative}\
.steps li{position:relative;display:flex;align-items:center;gap:13px;padding:0 6px;color:var(--muted);transition:.2s}\
.steps li .dot{flex:none;width:36px;height:36px;border-radius:50%;background:#fff;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--muted);z-index:1;transition:.2s}\
.steps li .dot svg{width:17px;height:17px}\
.steps li .lbl{font-size:14px;font-weight:600;line-height:1.15}\
.steps li::before{content:"";position:absolute;left:23px;top:38px;bottom:-26px;border-left:2px dotted #cdd9d9;z-index:0}\
.steps li:last-child::before{display:none}\
.steps li.done{color:var(--ink)}\
.steps li.done .dot{background:linear-gradient(135deg,#067d89,#0099a8);border-color:transparent;color:#fff}\
.steps li.active{color:var(--ink)}\
.steps li.active .dot{background:var(--accent-soft);border:2px solid var(--accent);color:var(--accent-deep)}\
.social{display:flex;gap:10px;padding-top:14px;border-top:1px solid var(--line)}\
.social a{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--muted);background:#fff;border:1px solid var(--line);transition:.18s}\
.social a:hover{color:#fff;background:var(--accent-deep);border-color:transparent}\
.social a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.social a svg{width:16px;height:16px}\
.main{position:relative;display:flex;flex-direction:column;min-height:0;padding:18px 32px 14px}\
.close{position:absolute;top:18px;right:20px;width:38px;height:38px;border:1px solid var(--line);background:#fff;font-size:21px;line-height:1;color:var(--muted);cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center}\
.close:hover{color:var(--ink);border-color:var(--muted)}\
.close:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.top{margin:0 0 10px}\
.prog{display:flex;gap:6px;margin-bottom:7px}\
.seg{height:4px;flex:1;border-radius:99px;background:var(--line)}\
.seg.on{background:linear-gradient(135deg,#067d89,#0099a8)}\
.phase{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-deep)}\
.body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column}\
.screen{display:none;flex-direction:column;min-height:0}\
.screen.show{display:flex}\
.count{font-family:var(--body);font-size:13px;font-weight:700;color:var(--muted);margin-bottom:5px}\
.h{font-family:var(--disp);font-weight:800;font-size:clamp(20px,2vw,25px);line-height:1.14;letter-spacing:-.015em;margin:0 0 4px;white-space:nowrap}\
.sub{font-size:13.5px;color:var(--muted);margin:0 0 11px}\
.chips{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:10px}\
.chip{font-family:var(--body);font-size:14px;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:11px;padding:11px 16px;cursor:pointer;transition:.13s;text-align:left}\
.chip:hover{border-color:var(--accent)}\
.chip.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.writein{display:block;width:100%;max-width:520px;font-family:var(--body);font-size:14px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:11px;padding:11px 14px}\
.writein:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
.fields{display:grid;gap:11px;max-width:460px}\
.field label{display:block;font-weight:600;font-size:12.5px;color:var(--muted);margin-bottom:5px}\
.field input{width:100%;font-family:var(--body);font-size:15px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:11px;padding:12px 14px}\
.field input:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
.note{font-size:13px;color:var(--muted);margin-top:14px}\
/* consultation */\
.who-h{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}\
.teamrow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:11px}\
.tm{flex:1 1 0;min-width:112px;display:flex;flex-direction:column;align-items:center;text-align:center;background:var(--tint);border:1px solid var(--line);border-radius:13px;padding:9px 7px 8px}\
.tm .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;overflow:hidden;margin-bottom:6px}\
.tm .av img{width:100%;height:100%;object-fit:cover}\
.tm .nm{font-family:var(--disp);font-weight:700;font-size:12.5px;color:var(--ink);line-height:1.15}\
.tm .ti{font-size:11px;color:var(--muted);margin:2px 0 5px;min-height:13px}\
.tm .li{font-size:11px;font-weight:600;color:var(--accent-deep);text-decoration:none}\
.tm .li:hover{color:var(--accent)}\
.tm .li:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.types{display:grid;gap:8px;margin-bottom:11px;max-width:560px}\
.trow{display:flex;align-items:center;gap:13px;width:100%;text-align:left;border:1.5px solid var(--line);border-radius:13px;padding:10px 14px;cursor:pointer;background:#fff;font-family:var(--body)}\
.trow:hover{border-color:var(--accent)}\
.trow.sel{border-color:var(--accent);background:var(--accent-soft)}\
.trow:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.trow .radio{flex:none;width:20px;height:20px;border-radius:50%;border:1.6px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;color:transparent}\
.trow.sel .radio{background:var(--accent);border-color:var(--accent);color:#fff}\
.trow .radio svg{width:12px;height:12px}\
.trow .ti b{font-family:var(--disp);font-size:15.5px;color:var(--ink)}\
.trow .ti span{display:block;font-size:12.5px;color:var(--muted);margin-top:1px}\
.trow .tprice{margin-left:auto;font-family:var(--disp);font-weight:700;font-size:14px;color:var(--accent-deep);white-space:nowrap}\
.book{display:grid;grid-template-columns:1fr 168px;gap:18px;align-items:start}\
.bk-h{font-size:13px;font-weight:700;color:var(--ink);margin:0 0 6px}\
.calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}\
.calhead b{font-family:var(--disp);font-weight:700;font-size:14px}\
.calhead button{border:1px solid var(--line);background:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;color:var(--ink);font-size:15px;line-height:1}\
.calhead button:hover:not(:disabled){border-color:var(--accent);color:var(--accent-deep)}\
.calhead button:disabled{opacity:.35;cursor:not-allowed}\
.calhead button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}\
.cal .dw{font-size:10.5px;font-weight:600;color:var(--muted);text-align:center;padding-bottom:3px}\
.cal .d{aspect-ratio:1;min-height:27px;border:none;background:var(--tint);border-radius:9px;font-size:12.5px;color:var(--ink);cursor:pointer;font-family:var(--body)}\
.cal .d:hover:not(:disabled){background:var(--accent-soft);color:var(--accent-deep)}\
.cal .d.sel{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;font-weight:600}\
.cal .d.today:not(.sel){box-shadow:inset 0 0 0 1.5px var(--accent)}\
.cal .d:disabled{background:none;color:#cbd4d5;cursor:not-allowed}\
.cal .d:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\
.cal .d.empty{background:none;cursor:default}\
.slots{display:grid;grid-template-columns:1fr;gap:8px;align-content:start}\
.slots.two{grid-template-columns:1fr 1fr}\
.slot{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--body);font-size:13px;border:1px solid var(--line);background:#fff;border-radius:11px;padding:10px 13px;cursor:pointer;color:var(--ink)}\
.slot:hover:not(:disabled){border-color:var(--accent)}\
.slot.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.slot:disabled{background:var(--tint);color:#aab4b5;cursor:not-allowed}\
.slot .bk{font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#9aa6a7}\
.slot:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\
.hint{font-size:12.5px;color:var(--muted)}\
.summ{border:1px solid var(--line);border-radius:14px;padding:16px 18px;max-width:480px;margin-bottom:14px}\
.summ .r{display:flex;justify-content:space-between;gap:16px;padding:6px 0;font-size:14px}\
.summ .r span:first-child{color:var(--muted)}\
.summ .r span:last-child{font-weight:600;text-align:right}\
.summ .r.tot{border-top:1px solid var(--line);margin-top:6px;padding-top:11px;font-size:15px}\
.refund{display:flex;gap:10px;align-items:flex-start;background:var(--accent-soft);border-radius:12px;padding:13px 15px;max-width:480px;color:var(--accent-deep)}\
.refund svg{width:18px;height:18px;flex:none;margin-top:1px}\
.refund p{margin:0;font-size:13.5px;font-weight:600}\
.paynote{font-size:12.5px;color:var(--muted);margin-top:13px;max-width:480px}\
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}\
.done .ok{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:16px}\
.done .ok svg{width:30px;height:30px}\
.done .summ{margin:14px auto 0;text-align:left}\
.nav{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:11px;margin-top:9px;border-top:1px solid var(--line)}\
.btn{font-family:var(--disp);font-weight:600;font-size:14.5px;border-radius:999px;padding:11px 24px;cursor:pointer;border:1px solid transparent;transition:.15s;display:inline-flex;align-items:center;gap:8px}\
.btn svg{width:15px;height:15px}\
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.btn-back{background:#fff;border-color:var(--line);color:var(--ink)}\
.btn-back:hover{border-color:var(--muted)}\
.btn-next{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;box-shadow:0 12px 26px -12px rgba(6,125,137,.8)}\
.btn-next:disabled{background:#c4cdce;box-shadow:none;cursor:not-allowed}\
@media(max-width:820px){.modal{grid-template-columns:1fr}.rail .steps,.rail .social{display:none}.rail{flex-direction:row;align-items:center;padding:16px 20px}.book{grid-template-columns:1fr}.h{white-space:normal}}\
@media(prefers-reduced-motion:reduce){.backdrop,.modal{transition:none}}';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmt(h, m) { var ap = h >= 12 ? "pm" : "am"; var hh = h > 12 ? h - 12 : h; return hh + ":" + (m < 10 ? "0" + m : m) + " " + ap; }
  // pseudo-random "booked" marker that varies per day and slot (~25%)
  function bookedSlot(date, i) {
    var h = ((date.y * 73856093) ^ (date.m * 19349663) ^ (date.d * 83492791) ^ ((i + 1) * 2654435761)) >>> 0;
    return (h % 4) === 0;
  }

  class ConsultationModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._ret = null;
      this._reset();
    }
    _reset() {
      this.state = { screen: 1, industry: null, industryText: "", pains: [], customPain: "", priority: "", priorityText: "",
        name: "", phone: "", company: "", type: null, date: null, slot: null, paid: false };
      this.view = null;
    }
    connectedCallback() {
      var st = el("style"); st.textContent = CSS;
      this.shadowRoot.appendChild(st);
      this.shadowRoot.appendChild(this._build());
      this._bind();
    }

    _build() {
      var bd = el("div", "backdrop");
      var modal = el("div", "modal");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Request a consultation");

      var rail = el("aside", "rail");
      rail.appendChild(el("img", "logo")).setAttribute("src", "assets/trustangle-logo-full.png");
      rail.querySelector(".logo").setAttribute("alt", "trustangle");
      var steps = el("ol", "steps");
      RAIL.forEach(function (s, i) {
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

      var main = el("main", "main");
      main.appendChild(el("button", "close", "&times;")).setAttribute("aria-label", "Close");
      var top = el("div", "top");
      top.appendChild(el("div", "prog", '<span class="seg"></span><span class="seg"></span><span class="seg"></span>'));
      top.appendChild(el("div", "phase", "Your project"));
      main.appendChild(top);
      main.appendChild(el("div", "body"));
      var nav = el("div", "nav");
      nav.appendChild(el("button", "btn btn-back", "Back"));
      nav.appendChild(el("button", "btn btn-next", "Next"));
      main.appendChild(nav);
      modal.appendChild(main);

      bd.appendChild(modal);
      this._bd = bd; this._modal = modal; this._body = main.querySelector(".body");
      this._top = top; this._phase = top.querySelector(".phase"); this._segs = top.querySelectorAll(".seg");
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

    _phaseOf(n) { return n <= 3 ? 1 : n === 4 ? 2 : 3; }
    _railOf(n) { return n <= 3 ? 1 : n === 4 ? 2 : n === 5 ? 3 : 4; }
    _valid() {
      var s = this.state;
      switch (s.screen) {
        case 1: return !!(s.industry || s.industryText.trim());
        case 2: return s.pains.length > 0 || !!s.customPain.trim();
        case 3: return !!(s.priority || s.priorityText.trim());
        case 4: return !!(s.name.trim() && s.phone.trim() && s.company.trim());
        case 5: return !!(s.type && s.date && s.slot);
        case 6: return true;
        default: return true;
      }
    }
    _goNext() {
      if (!this._valid()) return;
      var s = this.state;
      if (s.screen === 5) { s.screen = (s.type === "inperson") ? 6 : 7; if (s.screen === 7) this._submit(); this._render(); return; }
      if (s.screen === 6) { s.paid = true; this._submit(); s.screen = 7; this._render(); return; }
      if (s.screen >= 7) return;
      s.screen += 1; this._render();
    }
    _goBack() {
      var s = this.state;
      if (s.screen <= 1 || s.screen === 7) return;
      if (s.screen === 6) { s.screen = 5; this._render(); return; }
      s.screen -= 1; this._render();
    }
    _advance(to) { this.state.screen = to; this._render(); }

    _render() {
      var s = this.state, ph = this._phaseOf(s.screen), rl = this._railOf(s.screen);
      Array.prototype.forEach.call(this.shadowRoot.querySelectorAll(".steps li"), function (li) {
        var n = +li.getAttribute("data-step");
        li.classList.toggle("active", n === rl);
        li.classList.toggle("done", n < rl);
      });
      Array.prototype.forEach.call(this._segs, function (sg, i) { sg.classList.toggle("on", i < (s.screen === 7 ? 3 : ph)); });
      this._phase.textContent = s.screen === 7 ? "Done" : PHASES[ph - 1];
      this._top.style.display = s.screen === 7 ? "none" : "block";

      this._body.innerHTML = "";
      this._body.appendChild(this["_screen" + s.screen]());

      // footer nav: screens 1 & 3 auto-advance (no Next); 7 has none
      var showNext = (s.screen === 2 || s.screen === 4 || s.screen === 5 || s.screen === 6);
      this._next.style.display = showNext ? "inline-flex" : "none";
      this._next.disabled = !this._valid();
      this._next.innerHTML = this._nextLabel() + IC.arrow;
      this._back.style.visibility = (s.screen > 1 && s.screen < 7) ? "visible" : "hidden";
    }
    _nextLabel() {
      var s = this.state;
      if (s.screen === 2) return "Continue";
      if (s.screen === 4) return "Continue";
      if (s.screen === 5) return s.type === "inperson" ? "Continue to payment" : "Book the session";
      if (s.screen === 6) return "Pay " + DIAGNOSTIC_FEE + " and confirm";
      return "Next";
    }

    _wrap(count, title, sub) {
      var w = el("div", "screen show");
      if (count) w.appendChild(el("div", "count", count));
      w.appendChild(el("h2", "h", title));
      if (sub) w.appendChild(el("p", "sub", sub));
      return w;
    }
    _writeIn(group, ph) {
      var self = this, s = this.state;
      var inp = el("input", "writein"); inp.type = "text"; inp.placeholder = ph; inp.value = s[group];
      inp.addEventListener("input", function () { s[group] = inp.value; self._next.disabled = !self._valid(); });
      return inp;
    }

    _screen1() {
      var self = this, s = this.state;
      var w = this._wrap("1 / 3", "Which industry is your project in?");
      var box = el("div", "chips");
      INDUSTRIES.forEach(function (t) {
        var c = el("button", "chip" + (s.industry === t ? " sel" : ""), esc(t)); c.type = "button";
        c.addEventListener("click", function () {
          if (s.industry !== t) { s.industry = t; s.pains = []; s.customPain = ""; s.priority = ""; s.priorityText = ""; }
          self._advance(2);
        });
        box.appendChild(c);
      });
      w.appendChild(box);
      return w;
    }
    _screen2() {
      var self = this, s = this.state, ind = s.industry || "Other";
      var w = this._wrap("2 / 3", "What is hurting right now?", "Select all that apply.");
      var box = el("div", "chips");
      (DATA[ind] || DATA.Other).pains.forEach(function (t) {
        var c = el("button", "chip" + (s.pains.indexOf(t) >= 0 ? " sel" : ""), esc(t)); c.type = "button";
        c.addEventListener("click", function () {
          var i = s.pains.indexOf(t); if (i >= 0) s.pains.splice(i, 1); else s.pains.push(t);
          c.classList.toggle("sel"); self._next.disabled = !self._valid();
        });
        box.appendChild(c);
      });
      w.appendChild(box);
      w.appendChild(this._writeIn("customPain", "Or describe the pain in your own words"));
      return w;
    }
    _screen3() {
      var self = this, s = this.state, ind = s.industry || "Other";
      var w = this._wrap("3 / 3", "What matters most?");
      var box = el("div", "chips");
      (DATA[ind] || DATA.Other).priorities.forEach(function (t) {
        var c = el("button", "chip" + (s.priority === t ? " sel" : ""), esc(t)); c.type = "button";
        c.addEventListener("click", function () { s.priority = t; self._advance(4); });
        box.appendChild(c);
      });
      w.appendChild(box);
      return w;
    }
    _screen4() {
      var self = this, s = this.state;
      var w = this._wrap("", "Where do we send what we find?");
      var f = el("div", "fields");
      [["name", "Full name", "text", "name"], ["phone", "Phone", "tel", "tel"], ["company", "Company name", "text", "organization"]].forEach(function (r) {
        var fl = el("div", "field");
        fl.appendChild(el("label", null, r[1])).setAttribute("for", "cm-" + r[0]);
        var inp = el("input"); inp.id = "cm-" + r[0]; inp.type = r[2]; inp.autocomplete = r[3]; inp.value = s[r[0]];
        inp.addEventListener("input", function () { s[r[0]] = inp.value; self._next.disabled = !self._valid(); });
        fl.appendChild(inp); f.appendChild(fl);
      });
      w.appendChild(f);
      w.appendChild(el("div", "note", "Saved details fill in automatically if your browser offers them."));
      return w;
    }

    _screen5() {
      var self = this, s = this.state;
      var w = this._wrap("", "Choose how we meet, then pick a time.");
      // a) team
      w.appendChild(el("p", "who-h", "Who you will meet · the advisory team"));
      var team = el("div", "teamrow");
      TEAM.forEach(function (m) {
        var card = el("div", "tm");
        card.innerHTML =
          '<span class="av"><img src="assets/team/' + m.slug + '.avif" alt="' + esc(m.name) + '" onerror="this.parentNode.textContent=\'' + m.initials + '\'"></span>' +
          '<div class="nm">' + esc(m.name) + '</div><div class="ti">' + m.title + '</div>' +
          '<a class="li" href="' + m.url + '" target="_blank" rel="noopener">LinkedIn ↗</a>';
        team.appendChild(card);
      });
      w.appendChild(team);
      // b) type rows
      var types = el("div", "types");
      [
        { k: "online", t: "Online", d: "15 minutes", p: "Free" },
        { k: "inperson", t: "In person", d: "1 hour, credited to the project", p: DIAGNOSTIC_FEE }
      ].forEach(function (tp) {
        var r = el("button", "trow" + (s.type === tp.k ? " sel" : "")); r.type = "button";
        r.innerHTML = '<span class="radio">' + IC.check + '</span>' +
          '<span class="ti"><b>' + tp.t + '</b><span>' + tp.d + '</span></span>' +
          '<span class="tprice">' + tp.p + '</span>';
        r.addEventListener("click", function () { s.type = tp.k; s.slot = null; self._render(); });
        types.appendChild(r);
      });
      w.appendChild(types);
      // c) calendar + slots
      w.appendChild(this._book());
      return w;
    }

    _book() {
      var self = this, s = this.state;
      var book = el("div", "book");
      var left = el("div");
      if (!this.view) { var t0 = new Date(); t0.setHours(0, 0, 0, 0); this.view = new Date(t0.getFullYear(), t0.getMonth(), 1); }
      var head = el("div", "calhead");
      var prev = el("button", null, "&lsaquo;"); prev.type = "button"; prev.setAttribute("aria-label", "Previous month");
      var lab = el("b", null, MONTHS[this.view.getMonth()] + " " + this.view.getFullYear());
      var next = el("button", null, "&rsaquo;"); next.type = "button"; next.setAttribute("aria-label", "Next month");
      head.appendChild(prev); head.appendChild(lab); head.appendChild(next);
      left.appendChild(head);
      var cal = el("div", "cal");
      DOWS.forEach(function (d) { cal.appendChild(el("div", "dw", d)); });
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var first = new Date(this.view.getFullYear(), this.view.getMonth(), 1).getDay();
      var days = new Date(this.view.getFullYear(), this.view.getMonth() + 1, 0).getDate();
      for (var i = 0; i < first; i++) cal.appendChild(el("div", "d empty"));
      for (var d = 1; d <= days; d++) {
        var dt = new Date(this.view.getFullYear(), this.view.getMonth(), d);
        var wd = dt.getDay();
        var b = el("button", "d", String(d)); b.type = "button";
        var dis = dt < today || wd === 5 || wd === 6; // past + Fri/Sat (KSA week Sun-Thu)
        if (dt.getTime() === today.getTime()) b.classList.add("today");
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
      prev.disabled = (this.view.getFullYear() === today.getFullYear() && this.view.getMonth() <= today.getMonth());
      prev.addEventListener("click", function () { self.view = new Date(self.view.getFullYear(), self.view.getMonth() - 1, 1); self._render(); });
      next.addEventListener("click", function () { self.view = new Date(self.view.getFullYear(), self.view.getMonth() + 1, 1); self._render(); });
      left.appendChild(cal);
      book.appendChild(left);

      var right = el("div");
      right.appendChild(el("p", "bk-h", "Available times"));
      var slots = el("div", "slots");
      if (!s.type) { slots.appendChild(el("p", "hint", "Choose online or in person first.")); }
      else if (!s.date) { slots.appendChild(el("p", "hint", "Pick a day first.")); }
      else {
        var times = [];
        if (s.type === "inperson") { [12, 13, 14, 15, 16].forEach(function (h) { times.push(fmt(h, 0)); }); }
        else { for (var h = 12; h <= 16; h++) { times.push(fmt(h, 0)); times.push(fmt(h, 30)); } slots.classList.add("two"); }
        times.forEach(function (tt, i) {
          var booked = bookedSlot(s.date, i);
          var sl = el("button", "slot" + (s.slot === tt ? " sel" : "")); sl.type = "button";
          sl.innerHTML = "<span>" + tt + "</span>" + (booked ? '<span class="bk">BOOKED</span>' : "");
          if (booked) { sl.disabled = true; }
          else sl.addEventListener("click", function () { s.slot = tt; self._render(); });
          slots.appendChild(sl);
        });
      }
      right.appendChild(slots);
      book.appendChild(right);
      return book;
    }

    _screen6() {
      var s = this.state;
      var w = this._wrap("", "Confirm your in-person session.");
      var sm = el("div", "summ");
      sm.innerHTML =
        '<div class="r"><span>Session</span><span>In person, 1 hour</span></div>' +
        '<div class="r"><span>When</span><span>' + (s.date ? esc(s.date.label) : "") + (s.slot ? " · " + esc(s.slot) : "") + '</span></div>' +
        '<div class="r tot"><span>Fee</span><span>' + DIAGNOSTIC_FEE + '</span></div>';
      w.appendChild(sm);
      w.appendChild(el("div", "refund", IC.check + '<p>If you do not benefit from the session, we refund the fee in full.</p>'));
      w.appendChild(el("p", "paynote", "Secure payment via " + PAYMENT_PROVIDER + ". The fee is credited toward the project at signing."));
      return w;
    }
    _screen7() {
      var s = this.state;
      var w = el("div", "screen show");
      var d = el("div", "done");
      d.appendChild(el("div", "ok", IC.check));
      d.appendChild(el("h2", "h", "Booked. We will confirm shortly."));
      var pains = s.pains.slice(); if (s.customPain.trim()) pains.push(s.customPain.trim());
      var consult = s.type === "online" ? "Online · 15 min · free" : "In person · 1 hour · paid, refundable";
      var rows = [
        ["Industry", s.industry || s.industryText],
        ["Pain", pains.join(", ")],
        ["Priority", s.priority || s.priorityText],
        ["Name", s.name],
        ["Company", s.company],
        ["Phone", s.phone],
        ["Consultation", consult]
      ];
      if (s.date) rows.push(["When", s.date.label + (s.slot ? " · " + s.slot : "")]);
      var sm = el("div", "summ");
      sm.innerHTML = rows.map(function (r) { return '<div class="r"><span>' + r[0] + '</span><span>' + esc(r[1] || "") + '</span></div>'; }).join("");
      d.appendChild(sm);
      w.appendChild(d);
      return w;
    }

    /* ---------- submission (fire-and-forget; never blocks the UI) ---------- */
    _submit() {
      var s = this.state;
      var pains = s.pains.slice();
      var payload = { industry: s.industry || s.industryText, pains: pains, customPain: s.customPain,
        priority: s.priority || s.priorityText, name: s.name, phone: s.phone, company: s.company,
        type: s.type, date: s.date ? s.date.label : "", slot: s.slot, paid: s.paid };
      // Endpoint placeholder unresolved -> skip the network call.
      if (!FORM_ENDPOINT || FORM_ENDPOINT.indexOf("{{") === 0) return;
      try {
        fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(function () {});
      } catch (e) {}
    }
  }

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
