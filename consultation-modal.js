/* <consultation-modal>: self-contained booking modal for trustangle.
   Vanilla JS + Shadow DOM, one injected <style>. No frameworks, no storage.
   Opens on any "Request a Consultation" / "اطلب استشارة" / [data-consult] click
   (live lookup each time) and once after the Industries section; closes on
   backdrop / x / Esc. Placeholders ({{...}}) are intentionally left literal. */
(function () {
  "use strict";

  /* ---- placeholders (left literal until real values are supplied) ---- */
  var DIAGNOSTIC_FEE = "SAR 750";
  var PAYMENT_PROVIDER = "{{PAYMENT_PROVIDER}}";
  var FORM_ENDPOINT = "{{FORM_ENDPOINT}}";

  var TEAM = [
    { name: "Maysarah Mechaal", abbr: "Maysarah M.", slug: "maysarah-mechaal", initials: "MM", url: "https://www.linkedin.com/in/maysarah-mechaal/", title: "{{TITLE_MAYSARAH}}" },
    { name: "Hamza Abu Sitta",  abbr: "Hamza A.",    slug: "hamza-abu-sitta",  initials: "HA", url: "https://www.linkedin.com/in/hamzaabusitta/",   title: "{{TITLE_HAMZA}}" },
    { name: "Basheer Mishal",   abbr: "Basheer M.",  slug: "basheer-mishal",   initials: "BM", url: "https://www.linkedin.com/in/basheer-mishal/",  title: "{{TITLE_BASHEER}}" },
    { name: "Ahmad Jallabi",    abbr: "Ahmad J.",    slug: "ahmad-jallabi",    initials: "AJ", url: "https://www.linkedin.com/in/ahmad-jallabi-10/", title: "{{TITLE_AHMAD}}" },
    { name: "Sara Fareed",      abbr: "Sara F.",     slug: "sara-fareed",      initials: "SF", url: "https://www.linkedin.com/in/sara-fareed/",     title: "{{TITLE_SARA}}" }
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
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.2l2.6 1.6"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 6.2a3 3 0 0 1 0 5.6M21 19c0-2.3-1.4-4-3.6-4.7"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16"/><path d="M15 9h3a1 1 0 0 1 1 1v11"/><path d="M3.5 21h17"/><path d="M9.5 8h2M9.5 12h2M9.5 16h2"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>',
    extlink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5.5"/></svg>'
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
.body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:thin;scrollbar-color:#cdd9d9 transparent}\
.body::-webkit-scrollbar{width:7px}\
.body::-webkit-scrollbar-track{background:transparent}\
.body::-webkit-scrollbar-thumb{background:#cdd9d9;border-radius:99px}\
.body::-webkit-scrollbar-thumb:hover{background:#aab8b8}\
.body::-webkit-scrollbar-button{display:none;height:0}\
.screen{display:none;flex-direction:column;min-height:0}\
.screen.show{display:flex}\
.count{font-family:var(--body);font-size:13px;font-weight:700;color:var(--muted);margin-bottom:5px}\
.h{font-family:var(--disp);font-weight:800;font-size:clamp(20px,2vw,25px);line-height:1.14;letter-spacing:-.015em;margin:0 0 16px;white-space:nowrap}\
.h+.sub{margin-top:-9px}\
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
/* connect: center column + right info sidebar */\
.screen.connect.show{display:grid;grid-template-columns:1fr 280px;gap:26px;align-items:start;flex:1;min-height:0}\
.cmain{display:flex;flex-direction:column;min-height:0}\
.cside{display:flex;flex-direction:column;min-height:0}\
.types{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:11px}\
.type{position:relative;border:1.5px solid var(--line);border-radius:14px;padding:12px;cursor:pointer;transition:.13s;background:#fff}\
.type:hover{border-color:var(--accent)}\
.type.sel{border-color:var(--accent);background:var(--accent-soft)}\
.tradio{position:absolute;top:11px;right:11px;width:18px;height:18px;border-radius:50%;border:1.6px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;color:transparent}\
.type.sel .tradio{background:var(--accent);border-color:var(--accent);color:#fff}\
.tradio svg{width:11px;height:11px}\
.ticon{width:34px;height:34px;border-radius:10px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center;margin-bottom:9px}\
.type.sel .ticon{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff}\
.ticon svg{width:18px;height:18px}\
.type .tt{font-family:var(--disp);font-weight:700;font-size:15px}\
.type .td{font-size:12px;color:var(--muted);margin-top:2px}\
.type .tp{font-family:var(--mono);font-size:13px;font-weight:600;color:var(--accent-deep);margin-top:8px;min-height:16px}\
.teamnote{display:flex;align-items:flex-start;gap:10px;background:var(--accent-soft);border-radius:12px;padding:11px 13px;margin-bottom:12px}\
.teamnote svg{width:16px;height:16px;flex:none;color:var(--accent-deep);margin-top:1px}\
.teamnote b{display:block;font-size:12.5px;color:var(--ink);font-weight:700;line-height:1.3}\
.teamnote span{display:block;font-size:12px;color:var(--accent-deep);margin-top:1px}\
.bk-h{font-size:13px;font-weight:700;color:var(--ink);margin:0 0 8px}\
.book{display:grid;grid-template-columns:1fr 150px;gap:18px}\
.calhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}\
.calhead b{font-family:var(--disp);font-weight:700;font-size:14px}\
.calhead button{border:1px solid var(--line);background:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;color:var(--ink);font-size:15px;line-height:1}\
.calhead button:hover:not(:disabled){border-color:var(--accent);color:var(--accent-deep)}\
.calhead button:disabled{opacity:.35;cursor:not-allowed}\
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}\
.cal .dw{font-size:10.5px;font-weight:600;color:var(--muted);text-align:center;padding-bottom:3px}\
.cal .d{aspect-ratio:1;min-height:30px;border:none;background:none;border-radius:50%;font-size:12.5px;color:var(--ink);cursor:pointer;font-family:var(--body)}\
.cal .d:hover:not(:disabled){background:var(--accent-soft);color:var(--accent-deep)}\
.cal .d.sel{background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;font-weight:600}\
.cal .d.today:not(.sel){box-shadow:inset 0 0 0 1.5px var(--accent-line,#bee4e4)}\
.cal .d:disabled{background:none;color:#cbd4d5;cursor:not-allowed}\
.cal .d.empty{background:none;cursor:default}\
.times{display:grid;grid-template-columns:1fr;gap:8px;align-content:start}\
.times.two{grid-template-columns:1fr 1fr}\
.slot{display:flex;justify-content:flex-start;align-items:center;font-family:var(--body);font-size:13.5px;border:1px solid var(--line);background:#fff;border-radius:11px;padding:12px 15px;cursor:pointer;color:var(--ink)}\
.slot:hover:not(:disabled){border-color:var(--accent)}\
.slot.sel{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);font-weight:600}\
.slot:disabled{color:#b3bcbd;cursor:not-allowed;background:var(--tint)}\
.slot .bk{font-size:9px;text-transform:uppercase;letter-spacing:.05em;margin-left:5px}\
.hint{font-size:12px;color:var(--muted)}\
.locard{border:1px solid var(--line);border-radius:14px;padding:13px;display:flex;gap:11px;margin-bottom:11px}\
.locard .lpin{flex:none;width:34px;height:34px;border-radius:10px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center}\
.locard .lpin svg{width:17px;height:17px}\
.locard .lt{font-weight:700;font-size:13.5px}\
.locard .la{font-size:12px;color:var(--muted);margin:3px 0 0;line-height:1.4}\
.locard a{display:inline-flex;align-items:center;gap:5px;color:var(--accent-deep);font-weight:600;text-decoration:none;font-size:12.5px;margin-top:8px}\
.locard a svg{width:13px;height:13px}\
.locard a:hover{color:var(--accent)}\
.infocard{border:1px solid var(--line);border-radius:14px;padding:4px 14px;margin-bottom:13px}\
.irow{display:flex;align-items:flex-start;gap:11px;padding:9px 0;border-bottom:1px solid var(--line)}\
.irow:last-child{border-bottom:none}\
.irow .ii{flex:none;width:32px;height:32px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center;margin-top:1px}\
.irow .ii svg{width:17px;height:17px}\
.irow .il{font-size:11px;color:var(--muted)}\
.irow .iv{font-size:13px;font-weight:600;line-height:1.25}\
.who-h{font-size:13px;font-weight:700;color:var(--ink);margin:0 0 6px}\
.team{display:flex;flex-direction:column}\
.adv{display:flex;align-items:center;gap:10px;padding:7px 2px;border-radius:9px;text-decoration:none;color:inherit;border-bottom:1px solid var(--line)}\
.adv:last-child{border-bottom:none}\
.adv:hover{background:var(--tint)}\
.adv .av{flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#067d89,#0099a8);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;overflow:hidden}\
.adv .av img{width:100%;height:100%;object-fit:cover}\
.adv .an{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}\
.adv .ali{color:var(--muted)}\
.adv .ali svg{width:15px;height:15px;display:block}\
.adv:hover .ali{color:var(--accent-deep)}\
.contactrows{display:grid;gap:10px;max-width:420px}\
.crow{display:flex;align-items:center;gap:11px;border:1px solid var(--line);border-radius:12px;padding:12px 14px}\
.crow .ii{flex:none;width:34px;height:34px;border-radius:9px;background:var(--accent-soft);color:var(--accent-deep);display:flex;align-items:center;justify-content:center}\
.crow .ii svg{width:17px;height:17px}\
.crow a{color:var(--ink);font-weight:600;text-decoration:none;font-size:14px}\
.crow a:hover{color:var(--accent-deep)}\
.crow .cl{font-size:11px;color:var(--muted)}\
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
      if (s.screen === 5) return s.type === "inperson" ? "Continue to payment" : s.type === "contact" ? "Send request" : "Book the session";
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
      var w = this._wrap("", "Which industry is your project in?");
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
      var w = this._wrap("", "What is hurting right now?");
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
      var w = this._wrap("", "What matters most?");
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
      return w;
    }

    _screen5() {
      var self = this, s = this.state;
      if (!s.type) s.type = "inperson"; // default selection, matches the design
      var contact = s.type === "contact";
      var w = el("div", "screen show" + (contact ? "" : " connect"));

      var main = el("div", "cmain");
      main.appendChild(el("h2", "h", "How would you like to connect?"));
      main.appendChild(el("p", "sub", "Pick a format, then a time. You will meet the people who would advise you."));
      var types = el("div", "types");
      [
        { k: "inperson", t: "In person", d: "1 hour", p: DIAGNOSTIC_FEE, ic: IC.building },
        { k: "online", t: "Online", d: "15 min", p: "Free", ic: IC.video },
        { k: "contact", t: "Contact", d: "Direct", p: "", ic: IC.chat }
      ].forEach(function (tp) {
        var c = el("div", "type" + (s.type === tp.k ? " sel" : ""));
        c.innerHTML = '<span class="tradio">' + IC.check + '</span>' +
          '<span class="ticon">' + tp.ic + '</span>' +
          '<div class="tt">' + tp.t + '</div><div class="td">' + tp.d + '</div>' +
          '<div class="tp">' + (tp.p || "&nbsp;") + '</div>';
        c.addEventListener("click", function () {
          s.type = tp.k; s.date = null; s.slot = null; self.view = null; self._render();
        });
        types.appendChild(c);
      });
      main.appendChild(types);

      if (contact) {
        var rows = el("div", "contactrows");
        rows.innerHTML =
          '<div class="crow"><span class="ii">' + IC.chat + '</span><div><div class="cl">Email</div><a href="mailto:consultations@trustangle.com">consultations@trustangle.com</a></div></div>' +
          '<div class="crow"><span class="ii">' + IC.person + '</span><div><div class="cl">Phone</div><a href="tel:+966112930707">+966 11 293 0707</a></div></div>';
        main.appendChild(rows);
        w.appendChild(main);
        return w;
      }
      main.appendChild(this._book());
      w.appendChild(main);
      w.appendChild(this._side());
      return w;
    }

    _book() {
      var self = this, s = this.state;
      var book = el("div", "book");
      // ----- date -----
      var left = el("div");
      left.appendChild(el("p", "bk-h", "Pick a date"));
      if (!this.view) { var t = new Date(); t.setHours(0, 0, 0, 0); this.view = new Date(t.getFullYear(), t.getMonth(), 1); }
      var head = el("div", "calhead");
      var prev = el("button", null, "&lsaquo;"); prev.type = "button"; prev.setAttribute("aria-label", "Previous month");
      var lab = el("b", null, MONTHS[this.view.getMonth()] + " " + this.view.getFullYear());
      var next = el("button", null, "&rsaquo;"); next.type = "button"; next.setAttribute("aria-label", "Next month");
      head.appendChild(prev); head.appendChild(lab); head.appendChild(next);
      left.appendChild(head);
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
      next.disabled = (new Date(this.view.getFullYear(), this.view.getMonth(), 1) >= new Date(maxD.getFullYear(), maxD.getMonth(), 1));
      prev.addEventListener("click", function () { self.view = new Date(self.view.getFullYear(), self.view.getMonth() - 1, 1); self._render(); });
      next.addEventListener("click", function () { self.view = new Date(self.view.getFullYear(), self.view.getMonth() + 1, 1); self._render(); });
      left.appendChild(cal);
      book.appendChild(left);
      // ----- time -----
      var right = el("div");
      right.appendChild(el("p", "bk-h", "Pick a time"));
      var tcol = el("div", "times");
      if (!s.date) { tcol.appendChild(el("p", "hint", "Pick a day first.")); }
      else {
        var times = [];
        if (s.type === "inperson") { [12, 13, 14, 15, 16].forEach(function (h) { times.push(fmt(h, 0)); }); }
        else { for (var h = 12; h <= 16; h++) { times.push(fmt(h, 0)); if (h < 16) times.push(fmt(h, 30)); } tcol.classList.add("two"); }
        times.forEach(function (t) {
          var sl = el("button", "slot" + (s.slot === t ? " sel" : ""), t); sl.type = "button";
          sl.addEventListener("click", function () { s.slot = t; self._render(); });
          tcol.appendChild(sl);
        });
      }
      right.appendChild(tcol);
      book.appendChild(right);
      return book;
    }

    _side() {
      var col = el("aside", "cside");
      // location only matters for an in-person session
      if (this.state.type === "inperson") {
        var loc = el("div", "locard");
        loc.innerHTML = '<span class="lpin">' + IC.pin + '</span>' +
          '<div><div class="lt">King Abdullah Financial District (KAFD)</div>' +
          '<div class="la">Riyadh, Saudi Arabia</div>' +
          '<a href="https://maps.app.goo.gl/3qnF1WnFU3N2s8T3A" target="_blank" rel="noopener">View on map ' + IC.extlink + '</a></div>';
        col.appendChild(loc);
      }
      var info = el("div", "infocard");
      var dur = this.state.type === "inperson" ? "1 hour" : "15 minutes";
      info.innerHTML =
        '<div class="irow"><span class="ii">' + IC.clock + '</span><div><div class="il">Duration</div><div class="iv">' + dur + '</div></div></div>' +
        '<div class="irow"><span class="ii">' + IC.calendar + '</span><div><div class="il">What to expect</div><div class="iv">A focused discussion tailored to your needs.</div></div></div>';
      col.appendChild(info);
      col.appendChild(el("p", "who-h", "Who you will meet"));
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
      var s = this.state, contact = s.type === "contact";
      var w = el("div", "screen show");
      var d = el("div", "done");
      d.appendChild(el("div", "ok", IC.check));
      d.appendChild(el("h2", "h", contact ? "We will be in touch shortly." : "Booked. We will confirm shortly."));
      var pains = s.pains.slice(); if (s.customPain.trim()) pains.push(s.customPain.trim());
      var consult = s.type === "online" ? "Online · 15 min · free" : s.type === "contact" ? "Direct contact" : "In person · 1 hour · paid, refundable";
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
