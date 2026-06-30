/* <consultation-modal>: self-contained booking modal for trustangle.
   Minimal, centered, single-column design. Vanilla JS + Shadow DOM, one
   injected <style>. No frameworks, no storage. Opens on any
   "Request a Consultation" / "اطلب استشارة" / [data-consult] click (live
   lookup each time) and once after the Industries section; closes on
   backdrop / x / Esc. Placeholders ({{...}}) are left literal. */
(function () {
  "use strict";

  var DIAGNOSTIC_FEE = "SAR 750";
  var PAYMENT_PROVIDER = "{{PAYMENT_PROVIDER}}";
  var FORM_ENDPOINT = "{{FORM_ENDPOINT}}";

  var TEAM = [
    { name: "Maysarah Mechaal", abbr: "Maysarah M.", slug: "maysarah-mechaal", initials: "MM", url: "https://www.linkedin.com/in/maysarah-mechaal/" },
    { name: "Hamza Abu Sitta",  abbr: "Hamza A.",    slug: "hamza-abu-sitta",  initials: "HA", url: "https://www.linkedin.com/in/hamzaabusitta/" },
    { name: "Basheer Mishal",   abbr: "Basheer M.",  slug: "basheer-mishal",   initials: "BM", url: "https://www.linkedin.com/in/basheer-mishal/" },
    { name: "Ahmad Jallabi",    abbr: "Ahmad J.",    slug: "ahmad-jallabi",    initials: "AJ", url: "https://www.linkedin.com/in/ahmad-jallabi-10/" },
    { name: "Sara Fareed",      abbr: "Sara F.",     slug: "sara-fareed",      initials: "SF", url: "https://www.linkedin.com/in/sara-fareed/" }
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
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.25 8.25h4.5V24h-4.5zM8.5 8.25h4.3v2.15h.06c.6-1.13 2.06-2.32 4.24-2.32 4.54 0 5.38 2.99 5.38 6.87V24h-4.5v-6.98c0-1.66-.03-3.8-2.32-3.8s-2.67 1.81-2.67 3.68V24h-4.5z"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16"/><path d="M15 9h3a1 1 0 0 1 1 1v11"/><path d="M3.5 21h17"/><path d="M9.5 8h2M9.5 12h2M9.5 16h2"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    extlink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5"/></svg>'
  };

  var CSS = '\
@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap");\
:host{--ink:#0f1e23;--muted:#5a6a6f;--line:#e6ecec;--accent:#0099a8;--accent-deep:#067d89;--accent-soft:#e2f3f4;--tint:#f5f9f9;\
  --disp:"Archivo",system-ui,sans-serif;--body:"Source Sans 3",system-ui,sans-serif}\
*{box-sizing:border-box}\
.backdrop{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:3vh 4vw;\
  background:rgba(10,24,28,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .22s ease;font-family:var(--body);color:var(--ink)}\
:host([open]) .backdrop{display:flex}\
.backdrop.show{opacity:1}\
.modal{position:relative;width:min(94vw,560px);max-height:92vh;background:#fff;border-radius:22px;box-shadow:0 36px 90px -34px rgba(10,24,28,.55);\
  display:flex;flex-direction:column;overflow:hidden;transform:translateY(10px) scale(.99);transition:transform .22s ease;text-align:center}\
.backdrop.show .modal{transform:none}\
.close{position:absolute;top:16px;right:16px;width:34px;height:34px;border:none;background:none;font-size:22px;line-height:1;color:var(--muted);cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:2}\
.close:hover{color:var(--ink);background:var(--tint)}\
.close:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.head{padding:26px 40px 0;flex:none}\
.logo{height:30px;width:auto;display:block;margin:0 auto 16px}\
.prog{display:flex;justify-content:center;gap:7px;margin-bottom:9px}\
.dot{width:7px;height:7px;border-radius:50%;background:var(--line);transition:.2s}\
.dot.on{background:var(--accent)}\
.dot.cur{width:22px;border-radius:99px;background:linear-gradient(135deg,#067d89,#0099a8)}\
.phase{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-deep)}\
.body{flex:1;min-height:0;overflow-y:auto;padding:18px 40px 4px;scrollbar-width:thin;scrollbar-color:#cdd9d9 transparent}\
.body::-webkit-scrollbar{width:7px}\
.body::-webkit-scrollbar-thumb{background:#cdd9d9;border-radius:99px}\
.body::-webkit-scrollbar-button{display:none;height:0}\
.screen{display:none;flex-direction:column;align-items:center}\
.screen.show{display:flex}\
.h{font-family:var(--disp);font-weight:800;font-size:clamp(21px,2.4vw,26px);line-height:1.18;letter-spacing:-.015em;margin:0 0 7px;max-width:22ch}\
.sub{font-size:14px;color:var(--muted);margin:0 0 20px;max-width:42ch}\
.chips{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-bottom:14px}\
.chip{font-family:var(--body);font-size:14px;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:999px;padding:10px 18px;cursor:pointer;transition:.13s}\
.chip:hover{border-color:var(--accent)}\
.chip.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.writein{display:block;width:100%;max-width:380px;margin:2px auto 0;font-family:var(--body);font-size:14px;color:var(--ink);text-align:center;background:var(--tint);border:1px solid var(--line);border-radius:12px;padding:11px 14px}\
.writein:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
.fields{display:grid;gap:13px;width:100%;max-width:360px;margin:0 auto;text-align:left}\
.field label{display:block;font-weight:600;font-size:12.5px;color:var(--muted);margin-bottom:5px}\
.field input{width:100%;font-family:var(--body);font-size:15px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:12px;padding:12px 14px}\
.field input:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
/* type options */\
.types{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;max-width:430px;margin:0 auto 18px}\
.type{position:relative;border:1.5px solid var(--line);border-radius:16px;padding:16px 10px 14px;cursor:pointer;transition:.13s;background:#fff;display:flex;flex-direction:column;align-items:center;gap:3px}\
.type:hover{border-color:var(--accent)}\
.type.sel{border-color:var(--accent);background:var(--accent-soft)}\
.type:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.ticon{width:40px;height:40px;border-radius:12px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center;margin-bottom:6px}\
.type.sel .ticon{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff}\
.ticon svg{width:20px;height:20px}\
.tt{font-family:var(--disp);font-weight:700;font-size:14.5px}\
.td{font-size:12px;color:var(--muted)}\
.tp{font-family:var(--body);font-size:13px;font-weight:700;color:var(--accent-deep);margin-top:3px}\
.type.sel .tick{position:absolute;top:9px;right:9px;width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center}\
.tick{display:none}.tick svg{width:11px;height:11px}\
/* date + time */\
.cal-h{font-size:12.5px;font-weight:700;color:var(--ink);margin:0 0 8px}\
.calrange{font-family:var(--disp);font-weight:700;font-size:13.5px;margin:0 0 8px;color:var(--ink)}\
.cal{display:grid;grid-template-columns:repeat(7,38px);gap:5px;justify-content:center;margin:0 auto}\
.cal .dw{font-size:10.5px;font-weight:600;color:var(--muted);text-align:center;padding-bottom:3px}\
.cal .d{width:38px;height:38px;border:none;background:none;border-radius:50%;font-size:13px;color:var(--ink);cursor:pointer;font-family:var(--body)}\
.cal .d:hover:not(:disabled){background:var(--accent-soft);color:var(--accent-deep)}\
.cal .d.sel{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;font-weight:600}\
.cal .d.today:not(.sel){box-shadow:inset 0 0 0 1.5px var(--accent-soft)}\
.cal .d:disabled{background:none;color:#cbd4d5;cursor:not-allowed}\
.cal .d:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\
.times{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:14px auto 0;max-width:380px}\
.slot{display:inline-flex;align-items:center;gap:6px;font-family:var(--body);font-size:13px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:9px 16px;cursor:pointer;color:var(--ink)}\
.slot:hover:not(:disabled){border-color:var(--accent)}\
.slot.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.slot:disabled{background:var(--tint);color:#aab4b5;cursor:not-allowed}\
.slot .bk{font-size:9px;font-weight:700;letter-spacing:.05em;color:#9aa6a7}\
.hint{font-size:12.5px;color:var(--muted);margin:8px 0 0}\
.div{width:100%;max-width:430px;height:1px;background:var(--line);margin:20px auto 16px}\
.loc{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted);margin:0 auto 14px;flex-wrap:wrap;justify-content:center}\
.loc svg{width:14px;height:14px;color:var(--accent-deep)}\
.loc a{color:var(--accent-deep);font-weight:600;text-decoration:none}\
.loc a:hover{color:var(--accent)}\
.who-h{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 11px}\
.avs{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}\
.avc{display:flex;flex-direction:column;align-items:center;gap:5px;text-decoration:none;color:var(--ink);width:62px}\
.avc .av{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;overflow:hidden}\
.avc .av img{width:100%;height:100%;object-fit:cover}\
.avc .an{font-size:11px;font-weight:600;line-height:1.15;text-align:center}\
.avc:hover .av{box-shadow:0 0 0 2px var(--accent)}\
.contactrows{display:grid;gap:10px;width:100%;max-width:340px;margin:0 auto;text-align:left}\
.crow{display:flex;align-items:center;gap:11px;border:1px solid var(--line);border-radius:13px;padding:12px 14px}\
.crow .ii{flex:none;width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center}\
.crow .ii svg{width:17px;height:17px}\
.crow .cl{font-size:11px;color:var(--muted)}\
.crow a{color:var(--ink);font-weight:600;text-decoration:none;font-size:14px}\
.crow a:hover{color:var(--accent-deep)}\
/* pay + done */\
.summ{border:1px solid var(--line);border-radius:14px;padding:16px 18px;width:100%;max-width:380px;margin:0 auto 14px;text-align:left}\
.summ .r{display:flex;justify-content:space-between;gap:16px;padding:6px 0;font-size:14px}\
.summ .r span:first-child{color:var(--muted)}\
.summ .r span:last-child{font-weight:600;text-align:right}\
.summ .r.tot{border-top:1px solid var(--line);margin-top:6px;padding-top:11px;font-size:15px}\
.refund{display:flex;gap:10px;align-items:flex-start;text-align:left;background:var(--accent-soft);border-radius:12px;padding:13px 15px;width:100%;max-width:380px;margin:0 auto;color:var(--accent-deep)}\
.refund svg{width:18px;height:18px;flex:none;margin-top:1px}\
.refund p{margin:0;font-size:13.5px;font-weight:600}\
.paynote{font-size:12.5px;color:var(--muted);margin:13px auto 0;max-width:380px}\
.ok{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;margin:10px auto 16px}\
.ok svg{width:30px;height:30px}\
/* footer */\
.nav{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 40px 24px}\
.btn{font-family:var(--disp);font-weight:600;font-size:14.5px;border-radius:999px;padding:12px 26px;cursor:pointer;border:1px solid transparent;transition:.15s;display:inline-flex;align-items:center;gap:8px}\
.btn svg{width:15px;height:15px}\
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.btn-back{background:#fff;border-color:var(--line);color:var(--ink)}\
.btn-back:hover{border-color:var(--muted)}\
.btn-next{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;box-shadow:0 12px 26px -12px rgba(6,125,137,.8)}\
.btn-next:disabled{background:#c4cdce;box-shadow:none;cursor:not-allowed}\
@media(max-width:520px){.head,.body,.nav{padding-left:22px;padding-right:22px}.types{grid-template-columns:1fr}}\
@media(prefers-reduced-motion:reduce){.backdrop,.modal{transition:none}}';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmt(h, m) { var ap = h >= 12 ? "pm" : "am"; var hh = h > 12 ? h - 12 : h; return hh + ":" + (m < 10 ? "0" + m : m) + " " + ap; }
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
      modal.appendChild(el("button", "close", "&times;")).setAttribute("aria-label", "Close");
      var head = el("div", "head");
      head.appendChild(el("div", "prog", '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'));
      head.appendChild(el("div", "phase", "Your project"));
      modal.appendChild(head);
      modal.appendChild(el("div", "body"));
      var nav = el("div", "nav");
      nav.appendChild(el("button", "btn btn-back", "Back"));
      nav.appendChild(el("button", "btn btn-next", "Next"));
      modal.appendChild(nav);
      bd.appendChild(modal);
      this._bd = bd; this._modal = modal;
      this._body = modal.querySelector(".body");
      this._phase = modal.querySelector(".phase");
      this._dots = modal.querySelectorAll(".dot");
      this._back = nav.querySelector(".btn-back");
      this._next = nav.querySelector(".btn-next");
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
    _valid() {
      var s = this.state;
      switch (s.screen) {
        case 1: return !!(s.industry || s.industryText.trim());
        case 2: return s.pains.length > 0 || !!s.customPain.trim();
        case 3: return !!(s.priority || s.priorityText.trim());
        case 4: return !!(s.name.trim() && s.phone.trim() && s.company.trim());
        case 5: return s.type === "contact" ? true : !!(s.type && s.date && s.slot);
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
      var s = this.state, ph = this._phaseOf(s.screen);
      Array.prototype.forEach.call(this._dots, function (d, i) {
        d.classList.toggle("on", i < (s.screen === 7 ? 3 : ph));
        d.classList.toggle("cur", s.screen !== 7 && i === ph - 1);
      });
      this._phase.textContent = s.screen === 7 ? "Done" : PHASES[ph - 1];
      this._body.innerHTML = "";
      this._body.appendChild(this["_screen" + s.screen]());
      this._body.scrollTop = 0;
      var showNext = (s.screen === 2 || s.screen === 4 || s.screen === 5 || s.screen === 6);
      this._next.style.display = showNext ? "inline-flex" : "none";
      this._next.disabled = !this._valid();
      this._next.innerHTML = this._nextLabel() + IC.arrow;
      this._back.style.visibility = (s.screen > 1 && s.screen < 7) ? "visible" : "hidden";
      this._modal.querySelector(".nav").style.display = s.screen === 7 ? "none" : "flex";
    }
    _nextLabel() {
      var s = this.state;
      if (s.screen === 2 || s.screen === 4) return "Continue";
      if (s.screen === 5) return s.type === "inperson" ? "Continue to payment" : s.type === "contact" ? "Send request" : "Book the session";
      if (s.screen === 6) return "Pay " + DIAGNOSTIC_FEE + " and confirm";
      return "Next";
    }

    _wrap(title, sub) {
      var w = el("div", "screen show");
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
      var w = this._wrap("Which industry is your project in?", "Pick the closest fit, or write your own.");
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
      var w = this._wrap("What is hurting right now?", "Select all that apply.");
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
      w.appendChild(this._writeIn("customPain", "Or describe it in your own words"));
      return w;
    }
    _screen3() {
      var self = this, s = this.state, ind = s.industry || "Other";
      var w = this._wrap("What matters most?", "Choose the one outcome that counts.");
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
      var w = this._wrap("Where do we send what we find?");
      var f = el("div", "fields");
      [["name", "Full name", "text", "name"], ["phone", "Phone", "tel", "tel"], ["company", "Company name", "text", "organization"]].forEach(function (r) {
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
      if (!s.type) s.type = "inperson";
      var w = this._wrap("How would you like to connect?", "Pick a format, then a time.");
      var types = el("div", "types");
      [
        { k: "inperson", t: "In person", d: "1 hour", p: DIAGNOSTIC_FEE, ic: IC.building },
        { k: "online", t: "Online", d: "15 min", p: "Free", ic: IC.video },
        { k: "contact", t: "Contact", d: "Direct", p: "", ic: IC.chat }
      ].forEach(function (tp) {
        var c = el("button", "type" + (s.type === tp.k ? " sel" : "")); c.type = "button";
        c.innerHTML = '<span class="tick">' + IC.check + '</span><span class="ticon">' + tp.ic + '</span>' +
          '<span class="tt">' + tp.t + '</span><span class="td">' + tp.d + '</span>' +
          (tp.p ? '<span class="tp">' + tp.p + '</span>' : '');
        c.addEventListener("click", function () { s.type = tp.k; s.date = null; s.slot = null; self._render(); });
        types.appendChild(c);
      });
      w.appendChild(types);

      if (s.type === "contact") {
        var rows = el("div", "contactrows");
        rows.innerHTML =
          '<div class="crow"><span class="ii">' + IC.chat + '</span><div><div class="cl">Email</div><a href="mailto:consultations@trustangle.com">consultations@trustangle.com</a></div></div>' +
          '<div class="crow"><span class="ii">' + IC.pin + '</span><div><div class="cl">Phone</div><a href="tel:+966112930707">+966 11 293 0707</a></div></div>';
        w.appendChild(rows);
        return w;
      }
      w.appendChild(this._book());
      if (s.type === "inperson") {
        w.appendChild(el("p", "loc", IC.pin + '<span>trustangle Head office, KAFD, Riyadh</span> · <a href="https://maps.app.goo.gl/3qnF1WnFU3N2s8T3A" target="_blank" rel="noopener">View on map</a>'));
      }
      w.appendChild(el("div", "div"));
      w.appendChild(el("p", "who-h", "Who you will meet"));
      var avs = el("div", "avs");
      TEAM.forEach(function (m) {
        var a = el("a", "avc"); a.href = m.url; a.target = "_blank"; a.rel = "noopener"; a.title = m.name;
        a.innerHTML = '<span class="av"><img src="assets/team/' + m.slug + '.avif" alt="' + esc(m.name) + '" onerror="this.parentNode.textContent=\'' + m.initials + '\'"></span>' +
          '<span class="an">' + esc(m.abbr) + '</span>';
        avs.appendChild(a);
      });
      w.appendChild(avs);
      return w;
    }

    _book() {
      var self = this, s = this.state;
      var wrap = el("div");
      wrap.style.width = "100%";
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var minD = new Date(today); if (s.type === "inperson") minD.setDate(minD.getDate() + 1);
      var start = new Date(today); start.setDate(start.getDate() - start.getDay());
      var cells = 14;
      var maxD = new Date(start); maxD.setDate(start.getDate() + cells - 1);
      var rng = function (d) { return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3); };
      wrap.appendChild(el("p", "calrange", rng(today) + " – " + rng(maxD) + " " + maxD.getFullYear()));
      var cal = el("div", "cal");
      DOWS.forEach(function (d) { cal.appendChild(el("div", "dw", d)); });
      for (var i = 0; i < cells; i++) {
        var dt = new Date(start); dt.setDate(start.getDate() + i);
        var wd = dt.getDay();
        var b = el("button", "d", String(dt.getDate())); b.type = "button";
        var dis = dt < minD || dt > maxD || wd === 5 || wd === 6;
        if (dt.getTime() === today.getTime()) b.classList.add("today");
        if (dis) { b.disabled = true; }
        else b.addEventListener("click", (function (dd) {
          return function () {
            s.date = { d: dd.getDate(), m: dd.getMonth(), y: dd.getFullYear(), label: dd.getDate() + " " + MONTHS[dd.getMonth()] + " " + dd.getFullYear() };
            s.slot = null; self._render();
          };
        })(dt));
        if (s.date && s.date.d === dt.getDate() && s.date.m === dt.getMonth() && s.date.y === dt.getFullYear()) b.classList.add("sel");
        cal.appendChild(b);
      }
      wrap.appendChild(cal);
      var tcol = el("div", "times");
      if (!s.date) { tcol.appendChild(el("p", "hint", "Pick a day to see times.")); }
      else {
        var times = [];
        if (s.type === "inperson") { [12, 13, 14, 15, 16].forEach(function (h) { times.push(fmt(h, 0)); }); }
        else { for (var h = 12; h <= 16; h++) { times.push(fmt(h, 0)); if (h < 16) times.push(fmt(h, 30)); } }
        times.forEach(function (t, i) {
          var booked = bookedSlot(s.date, i);
          var sl = el("button", "slot" + (s.slot === t ? " sel" : "")); sl.type = "button";
          sl.innerHTML = "<span>" + t + "</span>" + (booked ? '<span class="bk">BOOKED</span>' : "");
          if (booked) { sl.disabled = true; }
          else sl.addEventListener("click", function () { s.slot = t; self._render(); });
          tcol.appendChild(sl);
        });
      }
      wrap.appendChild(tcol);
      return wrap;
    }

    _screen6() {
      var s = this.state;
      var w = this._wrap("Confirm your in-person session.");
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
      var s = this.state, contact = s.type === "contact";
      var w = el("div", "screen show");
      w.appendChild(el("div", "ok", IC.check));
      w.appendChild(el("h2", "h", contact ? "We will be in touch shortly." : "Booked. We will confirm shortly."));
      var pains = s.pains.slice(); if (s.customPain.trim()) pains.push(s.customPain.trim());
      var consult = s.type === "online" ? "Online · 15 min · free" : s.type === "contact" ? "Direct contact" : "In person · 1 hour · paid, refundable";
      var rows = [
        ["Industry", s.industry || s.industryText],
        ["Pain", pains.join(", ")],
        ["Priority", s.priority || s.priorityText],
        ["Name", s.name], ["Company", s.company], ["Phone", s.phone],
        ["Consultation", consult]
      ];
      if (s.date) rows.push(["When", s.date.label + (s.slot ? " · " + s.slot : "")]);
      var sm = el("div", "summ");
      sm.innerHTML = rows.map(function (r) { return '<div class="r"><span>' + r[0] + '</span><span>' + esc(r[1] || "") + '</span></div>'; }).join("");
      w.appendChild(sm);
      return w;
    }

    _submit() {
      var s = this.state;
      var payload = { industry: s.industry || s.industryText, pains: s.pains.slice(), customPain: s.customPain,
        priority: s.priority || s.priorityText, name: s.name, phone: s.phone, company: s.company,
        type: s.type, date: s.date ? s.date.label : "", slot: s.slot, paid: s.paid };
      if (!FORM_ENDPOINT || FORM_ENDPOINT.indexOf("{{") === 0) return;
      try { fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(function () {}); } catch (e) {}
    }
  }

  if (!customElements.get("consultation-modal")) customElements.define("consultation-modal", ConsultationModal);

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

  var seen = false;
  function onScroll() {
    if (seen) return;
    var ind = document.getElementById("industries");
    var t = ind ? ind.getBoundingClientRect().bottom < window.innerHeight * 0.6 : window.scrollY > window.innerHeight * 0.6;
    if (t) { seen = true; var m = findModal(); if (m) m.open(); window.removeEventListener("scroll", onScroll); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();
