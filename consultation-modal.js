/* <consultation-modal>: self-contained multi-step booking modal for trustangle.
   Two-pane design: a brand visual pane on the left (photo + logo + hero +
   advisory team) and a 7-step booking flow on the right.
   Vanilla JS + Shadow DOM, one injected <style>. No frameworks, no storage.
   Opens on any [data-consult] / [data-consult-open] click or any element whose
   text is "Request a Consultation" (live lookup each time); closes on backdrop /
   x / Esc. Placeholders ({{...}}) are left literal. */
(function () {
  "use strict";

  var DIAGNOSTIC_FEE = "SAR 750";
  var PAYMENT_PROVIDER = "{{PAYMENT_PROVIDER}}";
  var FORM_ENDPOINT = "{{FORM_ENDPOINT}}";
  var CONTACT_EMAIL = "consultations@trustangle.com";
  var CONTACT_PHONE = "{{CONTACT_PHONE}}";

  var TEAM = [
    { name: "Maysarah Mechaal", abbr: "Maysarah M.", initials: "MM", url: "https://www.linkedin.com/in/maysarah-mechaal/" },
    { name: "Hamza Abu Sitta",  abbr: "Hamza A.",    initials: "HA", url: "https://www.linkedin.com/in/hamzaabusitta/" },
    { name: "Basheer Mishal",   abbr: "Basheer M.",  initials: "BM", url: "https://www.linkedin.com/in/basheer-mishal/" },
    { name: "Ahmad Jallabi",    abbr: "Ahmad J.",    initials: "AJ", url: "https://www.linkedin.com/in/ahmad-jallabi-10/" },
    { name: "Sara Fareed",      abbr: "Sara F.",     initials: "SF", url: "https://www.linkedin.com/in/sara-fareed/" }
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
  var PHASES = ["Your project", "Your details", "Your consultation", "Confirm & pay"];

  var IC = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    larr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    rarr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>'
  };

  var CSS = '\
@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap");\
:host{--ink:#0f1e23;--muted:#5a6a6f;--line:#e6ecec;--accent:#0099a8;--accent-deep:#067d89;--accent-soft:#e2f3f4;--tint:#f5f9f9;\
  --disp:"Archivo",system-ui,sans-serif;--body:"Source Sans 3",system-ui,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}\
*{box-sizing:border-box}\
.backdrop{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:2vh 4vw;\
  background:rgba(10,24,28,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;transition:opacity .22s ease;font-family:var(--body);color:var(--ink)}\
:host([open]) .backdrop{display:flex}\
.backdrop.show{opacity:1}\
.modal{width:min(96vw,1120px);height:min(96vh,884px);background:#fff;border-radius:24px;box-shadow:0 40px 100px -36px rgba(10,24,28,.55);\
  display:grid;grid-template-columns:380px 1fr;overflow:hidden;transform:translateY(10px) scale(.99);transition:transform .22s ease}\
.backdrop.show .modal{transform:none}\
.modal:focus{outline:none}\
/* ---- left brand pane ---- */\
.pane{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:34px 32px;color:#fff;\
  background:linear-gradient(165deg,rgba(8,38,44,.7),rgba(8,38,44,.3) 40%,rgba(5,24,28,.84)),url("assets/consultation-room.png") center/cover no-repeat}\
.brand{position:relative;z-index:1;align-self:flex-start}\
.brand-logo{height:30px;width:auto;display:block;filter:brightness(0) invert(1);-webkit-filter:brightness(0) invert(1)}\
.pane-foot{position:relative;z-index:1}\
.pane-h{font-family:var(--disp);font-weight:800;font-size:clamp(25px,2.6vw,31px);line-height:1.1;letter-spacing:-.02em;margin:0 0 12px}\
.pane-sub{font-size:14px;line-height:1.55;color:rgba(255,255,255,.84);margin:0 0 20px;max-width:32ch}\
.pane-team{display:flex;align-items:center;gap:12px}\
.pcluster{display:flex}\
.pcluster .av{width:36px;height:36px;margin-left:-9px;border:2px solid rgba(255,255,255,.55);font-size:12px}\
.pcluster .av:first-child{margin-left:0}\
.pane-team>span{font-size:12.5px;color:rgba(255,255,255,.86)}\
.av{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-family:var(--disp);font-weight:700;color:#fff;\
  background:linear-gradient(135deg,#067d89,#0099a8)}\
/* ---- right pane ---- */\
.right{position:relative;display:flex;flex-direction:column;min-width:0}\
.rtop{flex:none;display:flex;align-items:center;gap:16px;padding:22px 34px 0}\
.pbar{display:flex;gap:6px;flex:1}\
.seg{height:4px;flex:1;border-radius:99px;background:var(--line);transition:.25s}\
.seg.on{background:linear-gradient(135deg,#067d89,#0099a8)}\
.close{flex:none;width:36px;height:36px;border:1px solid var(--line);border-radius:50%;background:#fff;font-size:20px;line-height:1;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center}\
.close:hover{color:var(--ink);border-color:var(--muted)}\
.close:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.body{flex:1;min-height:0;overflow-y:auto;padding:20px 34px 4px;scrollbar-width:thin;scrollbar-color:#cdd9d9 transparent}\
.body::-webkit-scrollbar{width:7px}\
.body::-webkit-scrollbar-thumb{background:#cdd9d9;border-radius:99px}\
.body::-webkit-scrollbar-button{display:none;height:0}\
.screen{display:none;flex-direction:column}\
.screen.show{display:flex}\
.shead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}\
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-deep);margin:0}\
.counter{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--muted)}\
.h{font-family:var(--disp);font-weight:800;font-size:clamp(21px,2.2vw,26px);line-height:1.14;letter-spacing:-.015em;margin:0 0 5px}\
.sub{font-size:13.5px;color:var(--muted);margin:0 0 16px}\
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}\
.chip{font-family:var(--body);font-size:13.5px;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:999px;padding:9px 15px;cursor:pointer;transition:.13s}\
.chip:hover{border-color:var(--accent)}\
.chip.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.writein{display:block;width:100%;max-width:440px;margin:3px 0 0;font-family:var(--body);font-size:14px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:11px;padding:10px 14px}\
.writein:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
/* details */\
.fields{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;max-width:560px}\
.field.full{grid-column:1 / -1}\
.field label{display:flex;align-items:center;gap:5px;font-weight:600;font-size:12px;color:var(--ink);margin-bottom:4px}\
.field .req{color:var(--accent-deep)}\
.field input{width:100%;font-family:var(--body);font-size:14px;color:var(--ink);background:var(--tint);border:1px solid var(--line);border-radius:10px;padding:9px 13px}\
.field input::placeholder{color:#94a3a6}\
.field input:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}\
.field input.bad{border-color:#c0392b;background:#fdf3f2}\
.field input.bad:focus{box-shadow:0 0 0 3px rgba(192,57,43,.14)}\
.field .err{display:none;font-size:11.5px;font-weight:600;color:#c0392b;margin-top:4px}\
.field.show-err .err{display:block}\
.field .err svg{width:12px;height:12px;vertical-align:-2px;margin-right:3px}\
/* connect: type cards */\
.types{display:flex;flex-direction:column;gap:9px;max-width:560px}\
.trow{display:flex;align-items:center;gap:13px;width:100%;text-align:left;border:1.5px solid var(--line);border-radius:13px;padding:11px 15px;cursor:pointer;background:#fff;font-family:var(--body);transition:.13s}\
.trow:hover{border-color:var(--accent)}\
.trow.sel{border-color:var(--accent);background:var(--accent-soft)}\
.trow:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.tbox{flex:none;width:24px;height:24px;border-radius:7px;border:2px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;color:transparent}\
.trow.sel .tbox{background:linear-gradient(135deg,#067d89,#0099a8);border-color:transparent;color:#fff}\
.tbox svg{width:13px;height:13px}\
.tinfo{flex:1;min-width:0}\
.tinfo b{display:block;font-family:var(--disp);font-weight:700;font-size:14.5px;color:var(--ink)}\
.tinfo span{display:block;font-size:12px;color:var(--muted);margin-top:1px}\
.tprice{flex:none;font-family:var(--disp);font-weight:700;font-size:13.5px;color:var(--accent-deep)}\
.teamnote{font-size:12.5px;color:var(--muted);margin:10px 0 14px}\
/* connect: booking grid */\
.booking{display:grid;grid-template-columns:minmax(0,1fr) 244px;gap:24px;align-items:start}\
.calwrap{min-width:0}\
.calrange{display:flex;align-items:center;gap:8px;margin:0 0 8px}\
.calm{font-family:var(--disp);font-weight:700;font-size:13.5px;color:var(--ink);min-width:118px;text-align:center}\
.calnav{width:26px;height:26px;border:1px solid var(--line);background:#fff;border-radius:8px;color:var(--ink);cursor:pointer;display:flex;align-items:center;justify-content:center}\
.calnav svg{width:13px;height:13px}\
.calnav:hover:not(:disabled){border-color:var(--accent);color:var(--accent-deep)}\
.calnav:disabled{color:#cbd4d5;cursor:not-allowed}\
.cal{display:grid;grid-template-columns:repeat(7,34px);gap:3px}\
.cal .dw{width:34px;font-size:10px;font-weight:600;color:var(--muted);text-align:center;padding-bottom:2px}\
.cal .pad{width:34px;height:34px}\
.cal .d{width:34px;height:34px;border:none;background:var(--tint);border-radius:8px;font-size:12.5px;color:var(--ink);cursor:pointer;font-family:var(--body)}\
.cal .d:hover:not(:disabled){background:var(--accent-soft);color:var(--accent-deep)}\
.cal .d.sel{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;font-weight:600}\
.cal .d.today:not(.sel){box-shadow:inset 0 0 0 1.5px var(--accent)}\
.cal .d:disabled{background:none;color:#cbd4d5;cursor:not-allowed}\
.cal .d:focus-visible{outline:2px solid var(--accent);outline-offset:1px}\
.tlabel{font-size:12px;font-weight:700;color:var(--ink);margin:13px 0 7px}\
.times{display:flex;flex-wrap:wrap;gap:7px;max-width:340px}\
.slot{display:inline-flex;align-items:center;gap:5px;font-family:var(--body);font-size:12.5px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 13px;cursor:pointer;color:var(--ink)}\
.slot:hover:not(:disabled){border-color:var(--accent)}\
.slot.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.slot:disabled{background:var(--tint);color:#aab4b5;cursor:not-allowed}\
.slot .bk{font-size:8.5px;font-weight:700;letter-spacing:.05em;color:#9aa6a7}\
.hint{font-size:12.5px;color:var(--muted)}\
.loc{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-top:12px;flex-wrap:wrap}\
.loc svg{width:13px;height:13px;color:var(--accent-deep)}\
.loc a{color:var(--accent-deep);font-weight:600;text-decoration:none}\
.loc a:hover{color:var(--accent)}\
.side{display:flex;flex-direction:column;gap:13px}\
.infocard{border:1px solid var(--line);border-radius:13px;padding:6px 15px;background:var(--tint)}\
.infocard .ir{display:flex;flex-direction:column;gap:1px;padding:9px 0;border-bottom:1px solid var(--line)}\
.infocard .ir:last-child{border-bottom:none}\
.infocard .ir span{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}\
.infocard .ir b{font-size:12.5px;font-weight:600;color:var(--ink)}\
.tlhead{font-size:12px;font-weight:700;color:var(--ink);margin:0 0 6px}\
.tlist .tm{display:flex;align-items:center;gap:9px;padding:3px 0}\
.tlist .av{width:28px;height:28px;font-size:10.5px}\
.tlist a{font-size:12.5px;color:var(--ink);text-decoration:none;font-weight:600}\
.tlist a:hover{color:var(--accent-deep)}\
/* contact rows */\
.contactrows{display:grid;gap:10px;max-width:400px}\
.crow{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:13px;padding:12px 14px;text-decoration:none;color:var(--ink);font-weight:600;font-size:14px;cursor:pointer;transition:.13s}\
.crow:hover{border-color:var(--accent);background:var(--tint)}\
.crow .ii{flex:none;width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center}\
.crow .ii svg{width:16px;height:16px}\
.crow .cl{font-size:11px;font-weight:600;color:var(--muted)}\
/* payment + confirmation */\
.summ{border:1px solid var(--line);border-radius:14px;padding:15px 18px;max-width:440px;margin-bottom:14px}\
.summ .r{display:flex;justify-content:space-between;gap:16px;padding:6px 0;font-size:13.5px}\
.summ .r span:first-child{color:var(--muted)}\
.summ .r span:last-child{font-weight:600;text-align:right}\
.summ .r.tot{border-top:1px solid var(--line);margin-top:6px;padding-top:11px;font-size:15px}\
.refund{display:flex;gap:10px;align-items:flex-start;background:var(--accent-soft);border-radius:12px;padding:13px 15px;max-width:440px;color:var(--accent-deep)}\
.refund svg{width:18px;height:18px;flex:none;margin-top:1px}\
.refund p{margin:0;font-size:13.5px;font-weight:600}\
.paynote{font-size:12.5px;color:var(--muted);margin-top:12px;max-width:440px}\
.done-ok{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;margin:8px 0 16px}\
.done-ok svg{width:30px;height:30px}\
/* footer nav */\
.nav{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 34px 26px}\
.btn{font-family:var(--disp);font-weight:600;font-size:14.5px;border-radius:999px;padding:12px 24px;cursor:pointer;border:1px solid transparent;transition:.15s;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}\
.btn svg{width:15px;height:15px}\
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\
.btn-back{background:transparent;border-color:transparent;color:var(--muted);padding-left:4px;padding-right:4px}\
.btn-back:hover{color:var(--ink)}\
.btn-next{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;box-shadow:0 12px 26px -12px rgba(6,125,137,.8)}\
.btn-next:disabled{background:#c4cdce;box-shadow:none;cursor:not-allowed}\
@media(max-width:720px){.modal{grid-template-columns:1fr;height:min(96vh,720px)}.pane{display:none}.booking{grid-template-columns:1fr}}\
@media(prefers-reduced-motion:reduce){.backdrop,.modal{transition:none}}';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim()); }
  function validPhone(s) { var d = String(s).replace(/[^0-9]/g, ""); return d.length >= 8 && /^\+?[0-9\s()-]+$/.test(String(s).trim()); }
  function fmt(h, m) { var ap = h >= 12 ? "pm" : "am"; var hh = h > 12 ? h - 12 : h; return hh + ":" + (m < 10 ? "0" + m : m) + " " + ap; }
  function bookedSlot(date, i) {
    var h = ((date.y * 73856093) ^ (date.m * 19349663) ^ (date.d * 83492791) ^ ((i + 1) * 2654435761)) >>> 0;
    return (h % 4) === 0;
  }
  function paneCluster() {
    var h = '<div class="pcluster">';
    TEAM.forEach(function (m) { h += '<span class="av" title="' + esc(m.name) + '">' + m.initials + '</span>'; });
    return h + '</div>';
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
        name: "", email: "", phone: "", company: "", type: null, calY: null, calM: null, date: null, slot: null, paid: false };
    }
    connectedCallback() {
      var st = el("style"); st.textContent = CSS;
      this.shadowRoot.appendChild(st);
      this.shadowRoot.appendChild(this._build());
      this._bind();
    }

    _build() {
      var bd = el("div", "backdrop");
      var modal = el("div", "modal"); modal.tabIndex = -1;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Request a consultation");

      var pane = el("aside", "pane");
      var brand = el("span", "brand");
      var brandImg = el("img", "brand-logo"); brandImg.src = "assets/trustangle-logo-full.png"; brandImg.alt = "trustangle";
      brand.appendChild(brandImg);
      pane.appendChild(brand);
      var foot = el("div", "pane-foot");
      foot.appendChild(el("h2", "pane-h", "Let's scope your project together."));
      foot.appendChild(el("p", "pane-sub", "Time with the team that advises and delivers, on the decision you are weighing now."));
      foot.appendChild(el("div", "pane-team", paneCluster() + '<span>Your advisory team</span>'));
      pane.appendChild(foot);
      modal.appendChild(pane);

      var right = el("div", "right");
      var rtop = el("div", "rtop", '<div class="pbar"><span class="seg"></span><span class="seg"></span><span class="seg"></span><span class="seg"></span></div>');
      var close = el("button", "close", "&times;"); close.setAttribute("aria-label", "Close"); close.type = "button";
      rtop.appendChild(close);
      right.appendChild(rtop);
      right.appendChild(el("div", "body"));
      var nav = el("div", "nav");
      nav.appendChild(el("button", "btn btn-back", "Back"));
      nav.appendChild(el("button", "btn btn-next", "Next"));
      right.appendChild(nav);
      modal.appendChild(right);

      bd.appendChild(modal);
      this._bd = bd; this._modal = modal;
      this._body = right.querySelector(".body");
      this._segs = right.querySelectorAll(".seg");
      this._close = close;
      this._back = nav.querySelector(".btn-back");
      this._next = nav.querySelector(".btn-next");
      this._nav = nav;
      return bd;
    }
    _bind() {
      var self = this;
      this._bd.addEventListener("click", function (e) { if (e.target === self._bd) self.close(); });
      this._close.addEventListener("click", function () { self.close(); });
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
      if (this._modal) this._modal.focus();
    }
    close() {
      this._bd.classList.remove("show");
      document.removeEventListener("keydown", this._onKey);
      document.documentElement.style.overflow = "";
      var self = this;
      window.setTimeout(function () { self.removeAttribute("open"); }, 220);
      if (this._ret && this._ret.focus) this._ret.focus();
    }

    /* flow: 1 industry, 2 pain, 3 priority, 4 details, 5 connect, 6 payment, 7 confirmation */
    _phase(n) { return n <= 3 ? 0 : n === 4 ? 1 : n === 5 ? 2 : 3; }
    _valid() {
      var s = this.state;
      switch (s.screen) {
        case 1: return !!(s.industry || s.industryText.trim());
        case 2: return s.pains.length > 0 || !!s.customPain.trim();
        case 3: return !!(s.priority || s.priorityText.trim());
        case 4: return !!s.name.trim() && !!s.company.trim() && validEmail(s.email) && validPhone(s.phone);
        case 5: return s.type === "contact" ? true : !!(s.date && s.slot);
        case 6: return true;
        default: return true;
      }
    }
    _goNext() {
      if (!this._valid()) return;
      var s = this.state;
      if (s.screen === 5) { if (s.type === "inperson") { s.screen = 6; } else { this._submit(); s.screen = 7; } this._render(); return; }
      if (s.screen === 6) { s.paid = true; this._submit(); s.screen = 7; this._render(); return; }
      if (s.screen >= 7) return;
      s.screen += 1; this._render();
    }
    _goBack() {
      var s = this.state;
      if (s.screen <= 1 || s.screen === 7) return;
      s.screen -= 1; this._render();
    }
    _advance(to) { this.state.screen = to; this._render(); }

    _render() {
      var s = this.state, ph = this._phase(s.screen);
      Array.prototype.forEach.call(this._segs, function (seg, i) { seg.classList.toggle("on", i <= ph); });
      this._body.innerHTML = "";
      this._body.appendChild(this["_screen" + s.screen]());
      this._body.scrollTop = 0;
      var showNext = (s.screen === 2 || s.screen === 4 || s.screen === 5 || s.screen === 6);
      this._next.style.display = showNext ? "inline-flex" : "none";
      this._next.disabled = !this._valid();
      this._next.innerHTML = this._nextLabel() + IC.arrow;
      this._back.style.visibility = (s.screen > 1 && s.screen < 7) ? "visible" : "hidden";
      this._nav.style.display = s.screen === 7 ? "none" : "flex";
    }
    _nextLabel() {
      var s = this.state;
      if (s.screen === 2 || s.screen === 4) return "Continue";
      if (s.screen === 5) return s.type === "inperson" ? "Continue to payment" : s.type === "contact" ? "Send request" : "Book the session";
      if (s.screen === 6) return "Pay " + DIAGNOSTIC_FEE + " and confirm";
      return "Next";
    }

    _wrap(title, sub, counter) {
      var w = el("div", "screen show");
      var head = el("div", "shead");
      head.appendChild(el("span", "eyebrow", PHASES[this._phase(this.state.screen)].toUpperCase()));
      if (counter) head.appendChild(el("span", "counter", counter));
      w.appendChild(head);
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
      var w = this._wrap("Which industry is your project in?", "Pick the closest fit, or write your own.", "01 / 03");
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
      w.appendChild(this._writeIn("industryText", "Type your own industry"));
      return w;
    }
    _screen2() {
      var self = this, s = this.state, ind = s.industry || "Other";
      var w = this._wrap("What is hurting right now?", "Select all that apply.", "02 / 03");
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
      var w = this._wrap("What matters most?", "Choose the one outcome that counts.", "03 / 03");
      var box = el("div", "chips");
      (DATA[ind] || DATA.Other).priorities.forEach(function (t) {
        var c = el("button", "chip" + (s.priority === t ? " sel" : ""), esc(t)); c.type = "button";
        c.addEventListener("click", function () { s.priority = t; self._advance(4); });
        box.appendChild(c);
      });
      w.appendChild(box);
      w.appendChild(this._writeIn("priorityText", "Or name your own priority"));
      return w;
    }
    _screen4() {
      var self = this, s = this.state;
      var w = this._wrap("Where do we send what we find?", "A short read on your situation, and where we can help.");
      var f = el("div", "fields");
      var fields = [
        { k: "name", label: "Full name", type: "text", ac: "name", full: false, ph: "", err: "Please enter your name." },
        { k: "company", label: "Company name", type: "text", ac: "organization", full: false, ph: "", err: "Please enter your company." },
        { k: "email", label: "Email", type: "email", ac: "email", full: true, ph: "you@company.com", err: "Enter a valid email address." },
        { k: "phone", label: "Phone", type: "tel", ac: "tel", full: true, ph: "+966 5X XXX XXXX", err: "Enter a valid phone number." }
      ];
      var check = function (fd, inp, fl) {
        var v = inp.value.trim(), ok = true;
        if (!v) ok = false;
        else if (fd.k === "email" && !validEmail(v)) ok = false;
        else if (fd.k === "phone" && !validPhone(v)) ok = false;
        fl.classList.toggle("show-err", !ok);
        inp.classList.toggle("bad", !ok);
        return ok;
      };
      fields.forEach(function (fd) {
        var fl = el("div", "field" + (fd.full ? " full" : ""));
        var lab = el("label"); lab.innerHTML = esc(fd.label) + '<span class="req">*</span>';
        lab.setAttribute("for", "cm-" + fd.k); fl.appendChild(lab);
        var inp = el("input"); inp.id = "cm-" + fd.k; inp.type = fd.type; inp.autocomplete = fd.ac;
        if (fd.ph) inp.placeholder = fd.ph; inp.value = s[fd.k];
        inp.addEventListener("input", function () {
          s[fd.k] = inp.value;
          if (fl.classList.contains("show-err")) check(fd, inp, fl);
          self._next.disabled = !self._valid();
        });
        inp.addEventListener("blur", function () { if (inp.value.trim()) check(fd, inp, fl); });
        fl.appendChild(inp);
        fl.appendChild(el("p", "err", IC.warn + esc(fd.err)));
        f.appendChild(fl);
      });
      w.appendChild(f);
      return w;
    }
    _screen5() {
      var self = this, s = this.state;
      if (!s.type) s.type = "inperson";
      var w = this._wrap("Choose how we meet.");
      var cards = el("div", "types");
      [
        { k: "inperson", t: "In person", d: "One focused hour on site, fee credited to your project", p: DIAGNOSTIC_FEE },
        { k: "online", t: "Online", d: "A quick 15-minute video call to scope the work", p: "Free" },
        { k: "contact", t: "Contact our team", d: "Prefer email or a call? Reach us directly", p: "Direct" }
      ].forEach(function (tp) {
        var r = el("button", "trow" + (s.type === tp.k ? " sel" : "")); r.type = "button";
        r.innerHTML = '<span class="tbox">' + IC.check + '</span>' +
          '<span class="tinfo"><b>' + tp.t + '</b><span>' + tp.d + '</span></span>' +
          '<span class="tprice">' + tp.p + '</span>';
        r.addEventListener("click", function () { if (s.type !== tp.k) { s.type = tp.k; s.slot = null; } self._render(); });
        cards.appendChild(r);
      });
      w.appendChild(cards);
      w.appendChild(el("p", "teamnote", "You meet senior advisors who advise and deliver, not a sales desk."));

      if (s.type === "contact") {
        var cc = el("div", "contactrows");
        cc.appendChild(el("a", "crow", '<span class="ii">' + IC.mail + '</span><span><span class="cl">Email</span><br>' + CONTACT_EMAIL + '</span>'));
        cc.firstChild.setAttribute("href", "mailto:" + CONTACT_EMAIL);
        if (CONTACT_PHONE.indexOf("{{") !== 0) {
          cc.appendChild(el("a", "crow", '<span class="ii">' + IC.phone + '</span><span><span class="cl">Call</span><br>' + esc(CONTACT_PHONE) + '</span>'));
          cc.lastChild.setAttribute("href", "tel:" + CONTACT_PHONE.replace(/[^+0-9]/g, ""));
        }
        w.appendChild(cc);
        return w;
      }

      var grid = el("div", "booking");
      var left = el("div", "calwrap");
      this._calendar(left);
      var right = el("div", "side");
      var dur = s.type === "inperson" ? "1 hour, on site" : "15 minutes, online";
      right.appendChild(el("div", "infocard",
        '<div class="ir"><span>Duration</span><b>' + dur + '</b></div>' +
        '<div class="ir"><span>Team</span><b>Senior trustangle advisors</b></div>' +
        '<div class="ir"><span>What to expect</span><b>A clear read on your decision and the next steps.</b></div>'));
      var tl = el("div", "tlist");
      tl.appendChild(el("p", "tlhead", "Who you will meet"));
      TEAM.forEach(function (m) {
        var row = el("div", "tm", '<span class="av">' + m.initials + '</span>');
        var a = el("a", null, esc(m.abbr)); a.href = m.url; a.target = "_blank"; a.rel = "noopener";
        row.appendChild(a); tl.appendChild(row);
      });
      right.appendChild(tl);
      grid.appendChild(left); grid.appendChild(right);
      w.appendChild(grid);
      return w;
    }
    _calendar(left) {
      var self = this, s = this.state;
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var minD = new Date(today); if (s.type === "inperson") minD.setDate(minD.getDate() + 1);
      var maxD = new Date(today); maxD.setDate(maxD.getDate() + 30);
      if (s.calY == null) { s.calY = minD.getFullYear(); s.calM = minD.getMonth(); }
      var monthIdx = function (y, m) { return y * 12 + m; };
      var curI = monthIdx(s.calY, s.calM), minI = monthIdx(minD.getFullYear(), minD.getMonth()), maxI = monthIdx(maxD.getFullYear(), maxD.getMonth());

      var hdr = el("div", "calrange");
      var prev = el("button", "calnav", IC.larr); prev.type = "button"; if (curI <= minI) prev.disabled = true;
      prev.addEventListener("click", function () { var m = s.calM - 1, y = s.calY; if (m < 0) { m = 11; y--; } s.calM = m; s.calY = y; self._render(); });
      var next = el("button", "calnav", IC.rarr); next.type = "button"; if (curI >= maxI) next.disabled = true;
      next.addEventListener("click", function () { var m = s.calM + 1, y = s.calY; if (m > 11) { m = 0; y++; } s.calM = m; s.calY = y; self._render(); });
      hdr.appendChild(prev);
      hdr.appendChild(el("span", "calm", MONTHS[s.calM] + " " + s.calY));
      hdr.appendChild(next);
      left.appendChild(hdr);

      var cal = el("div", "cal");
      DOWS.forEach(function (d) { cal.appendChild(el("div", "dw", d)); });
      var first = new Date(s.calY, s.calM, 1);
      var pad = first.getDay();
      for (var p = 0; p < pad; p++) cal.appendChild(el("div", "pad"));
      var dim = new Date(s.calY, s.calM + 1, 0).getDate();
      for (var day = 1; day <= dim; day++) {
        var dt = new Date(s.calY, s.calM, day); var wd = dt.getDay();
        var b = el("button", "d", String(day)); b.type = "button";
        var dis = dt < minD || dt > maxD || wd === 5 || wd === 6;
        if (dt.getTime() === today.getTime()) b.classList.add("today");
        if (dis) { b.disabled = true; }
        else b.addEventListener("click", (function (dd) {
          return function () {
            s.date = { d: dd.getDate(), m: dd.getMonth(), y: dd.getFullYear(), label: dd.getDate() + " " + MONTHS[dd.getMonth()] + " " + dd.getFullYear() };
            s.slot = null; self._render();
          };
        })(dt));
        if (s.date && s.date.d === day && s.date.m === s.calM && s.date.y === s.calY) b.classList.add("sel");
        cal.appendChild(b);
      }
      left.appendChild(cal);

      left.appendChild(el("p", "tlabel", "Available times"));
      var tcol = el("div", "times");
      if (!s.date) { tcol.appendChild(el("p", "hint", "Pick a day first.")); }
      else {
        var times = [];
        if (s.type === "inperson") { [12, 13, 14, 15, 16].forEach(function (h) { times.push(fmt(h, 0)); }); }
        else { for (var h = 12; h <= 16; h++) { times.push(fmt(h, 0)); if (h < 16) times.push(fmt(h, 30)); } }
        times.forEach(function (t, i) {
          var booked = bookedSlot(s.date, i);
          var sl = el("button", "slot" + (s.slot === t ? " sel" : "")); sl.type = "button";
          sl.innerHTML = "<span>" + t + "</span>" + (booked ? '<span class="bk">Booked</span>' : "");
          if (booked) { sl.disabled = true; }
          else sl.addEventListener("click", function () { s.slot = t; self._render(); });
          tcol.appendChild(sl);
        });
      }
      left.appendChild(tcol);
      if (s.type === "inperson") {
        left.appendChild(el("p", "loc", IC.pin + '<span>trustangle Head office, KAFD, Riyadh</span> · <a href="https://maps.app.goo.gl/3qnF1WnFU3N2s8T3A" target="_blank" rel="noopener">View on map</a>'));
      }
    }
    _screen6() {
      var s = this.state;
      var w = this._wrap("Confirm your in-person session.");
      w.appendChild(el("div", "summ",
        '<div class="r"><span>Session</span><span>In person, 1 hour</span></div>' +
        '<div class="r"><span>When</span><span>' + (s.date ? esc(s.date.label) : "") + (s.slot ? " · " + esc(s.slot) : "") + '</span></div>' +
        '<div class="r tot"><span>Fee</span><span>' + DIAGNOSTIC_FEE + '</span></div>'));
      w.appendChild(el("div", "refund", IC.check + '<p>If you do not benefit from the session, we refund the fee in full.</p>'));
      w.appendChild(el("p", "paynote", "Secure payment via " + PAYMENT_PROVIDER + ". The fee is credited toward the project at signing."));
      return w;
    }
    _screen7() {
      var s = this.state;
      var w = el("div", "screen show");
      w.appendChild(el("div", "done-ok", IC.check));
      w.appendChild(el("h2", "h", s.type === "contact" ? "Request received." : "You're booked."));
      var pains = s.pains.slice(); if (s.customPain.trim()) pains.push(s.customPain.trim());
      var consult = s.type === "online" ? "Online · 15 min · free" : s.type === "contact" ? "Direct contact" : "In person · 1 hour · paid, refundable";
      var rows = [
        ["Industry", s.industry || s.industryText],
        ["Pain", pains.join(", ")],
        ["Priority", s.priority || s.priorityText],
        ["Name", s.name], ["Email", s.email], ["Company", s.company], ["Phone", s.phone],
        ["Consultation", consult]
      ];
      if (s.date) rows.push(["When", s.date.label + (s.slot ? " · " + s.slot : "")]);
      w.appendChild(el("div", "summ", rows.filter(function (r) { return r[1]; }).map(function (r) {
        return '<div class="r"><span>' + r[0] + '</span><span>' + esc(r[1] || "") + '</span></div>';
      }).join("")));
      return w;
    }

    _submit() {
      var s = this.state;
      var payload = { industry: s.industry || s.industryText, pains: s.pains.slice(), customPain: s.customPain,
        priority: s.priority || s.priorityText, name: s.name, email: s.email, phone: s.phone, company: s.company,
        type: s.type, date: s.date ? s.date.label : "", slot: s.slot, paid: s.paid };
      if (!FORM_ENDPOINT || FORM_ENDPOINT.indexOf("{{") === 0) return;
      try { fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(function () {}); } catch (e) {}
    }
  }

  if (!customElements.get("consultation-modal")) customElements.define("consultation-modal", ConsultationModal);

  var LABELS = ["request a consultation"];
  function findModal() { return document.querySelector("consultation-modal"); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("a,button,[data-consult],[data-consult-open]");
    if (!t) return;
    var txt = (t.textContent || "").trim().toLowerCase();
    if (t.hasAttribute("data-consult") || t.hasAttribute("data-consult-open") || LABELS.indexOf(txt) >= 0) {
      var m = findModal();
      if (m) { e.preventDefault(); m.open(); }
    }
  });

  // Open once automatically after the Industries section scrolls into view.
  var seen = false;
  function onScroll() {
    if (seen) return;
    var ind = document.getElementById("industries");
    var past = ind ? ind.getBoundingClientRect().bottom < window.innerHeight * 0.6
                   : window.scrollY > window.innerHeight * 0.6;
    if (past) {
      seen = true;
      window.removeEventListener("scroll", onScroll);
      var m = findModal();
      if (m) m.open();
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();
