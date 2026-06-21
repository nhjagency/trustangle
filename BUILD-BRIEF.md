# trustangle — Home Page Build Brief (for Claude Code)

> **What this file is.** A complete, self-contained spec for building the trustangle
> home page as a responsive static prototype, styled to match the **AgentFlow “Home V3”**
> Webflow template. Hand this to Claude Code as the source of truth. Copy is final and
> brand-locked — do not rewrite it. Where you see `PLACEHOLDER`, leave it visibly empty;
> do not invent content.

---

## 1. Goal

Build a single-page, responsive home page prototype (`index.html` + assets) that:
- Matches the **visual style of AgentFlow Home V3** (layout, hero treatment, spacing, motion).
- Uses the trustangle brand palette and the final copy in this brief.
- Reads as a **Trusted Advisor**, not a product catalogue: advisory first, product second.
- Is clean, professional, and human — explicitly **not** “AI-generated-looking.”

This prototype is a reference build for a later Webflow implementation, so prioritise
faithful structure, tokens, and copy over production tooling.

## 2. Visual source of truth — AgentFlow Home V3

Reference: `https://agentflowtemplate.webflow.io/home-pages/home-v3`

The demo blocks automated fetching, so **open it in a browser (or the purchased template’s
Figma / Webflow export) and mirror it**: section order, hero composition, card shapes,
button styles, badge/eyebrow style, spacing rhythm, and animation feel.

If the page cannot be opened, fall back to the AgentFlow design system described in §4–§6
(light, modern, generous whitespace, rounded cards, pill eyebrows, Google web fonts).
Keep the layout adjustable so the V3 hero treatment can be swapped in once confirmed.

**Re-skin, don’t reuse content:** AgentFlow is an AI-coding-agent template. Drop every
DevTools-specific section — code playground, model/agent demo, pricing tiers,
“install in seconds.” Map only the sections listed in §7.

## 3. Tech

- Static `index.html`, external `styles.css`, minimal `main.js`. No framework required.
- Google Fonts via `<link>`. No build step needed; keep it openable as a file.
- Vanilla JS only: scroll-reveal (IntersectionObserver) + mobile nav toggle.
- **No browser storage** of any kind.

## 4. Design tokens

```
/* Brand (locked) */
--teal:        #0099a8;   /* Tropical Green — primary accent, buttons, badges */
--teal-dk:     #067d89;   /* accessible teal for text on light */
--teal-lt:     #e6f4f5;   /* tint for badges / icon chips */
--gray:        #7a7c81;   /* Cool Gray — captions, muted labels */

/* Neutrals (light theme) */
--ink:         #0f1e23;   /* headings / primary text */
--ink-mut:     #5a6a6f;   /* body / secondary text */
--bg:          #ffffff;
--bg-alt:      #f6f8f8;   /* alternating section background */
--line:        #e6ecec;   /* borders */

--radius: 16px;           /* cards */  --radius-lg: 24px;  /* panels */
--shadow: 0 18px 44px -26px rgba(15,30,35,.30);
--wrap: 1140px;           /* max content width */
```

- **Only Tropical Green and Cool Gray** as brand colour. Match AgentFlow’s accent role,
  but the accent **is** `#0099a8` (do not keep the template’s original blue/violet).
- Confirm the exact fonts from the V3 page; if unavailable, use **Plus Jakarta Sans**
  (display, 600–800) + **Inter** (body, 400–600).

## 5. Global components

- **Notification bar** (thin, dark `--ink`): short Insights link. No urgency/scarcity wording.
- **Nav** (sticky, white, blurred): logo left; links — Advisory & Consulting · Implementation
  & Delivery · Industries · Technologies · Insights; right side — “Our story” text link +
  primary button **Request a Consultation**. Collapses to a burger ≤880px.
- **Buttons:** primary = filled teal, white text; secondary = white, 1px border, dark text.
- **Pill eyebrow** (BRIX signature): rounded-full, `--teal-lt` bg, `--teal-dk` text, leading dot.
- **Section marker:** a small teal “angle” glyph (CSS triangle) nodding to the logo — reuse as
  the card icon and bullet motif. Use it consistently; don’t add other decorative icons.
- **Footer** (light `--bg-alt`): 4 columns — brand blurb + “since 2014”; What we do; Explore;
  Contact — plus a bottom bar (© trustangle 2026 · Riyadh · MENA).

## 6. Logo

Wordmark only, set in the display font: `trust` in `--ink`, `angle` in `--teal`, one word,
all lowercase. **Never** render Trustangle / Trust Angle / TrustAngle.

## 7. Page structure & final copy

Build in this order. Headings use the display font; alternate section backgrounds
white / `--bg-alt`. Section intros (eyebrow + H2 + sub) are centred, BRIX-style.

### 7.1 Hero  *(AgentFlow V3 hero)*
- **Eyebrow:** Technology advisory & implementation · Since 2014
- **H1:** The partner comes before the platform.  *(style the word “platform” as the accent)*
- **Subhead:** trustangle is a technology advisory and implementation partner working across
  the Kingdom and the wider region. We help senior teams decide what to build, govern how it
  runs, and deliver it without disrupting the business.
- **Primary button:** Request a Consultation  ·  **Secondary:** See how we think →
- **Micro-line:** Advisory first. Platforms second. Delivery that holds up after go-live.
- **Hero visual:** match V3’s hero composition. For the in-frame content use the four-step
  method as a clean flow (Understand → Decide → Deliver → Sustain). **Do not** build a fake
  product dashboard or show any invented numbers.

### 7.2 Partner / ecosystem strip  *(logo cloud → text)*
- **Label:** Delivered on the platforms our customers already trust
- **Marks (TEXT wordmarks, not logos):** Oracle NetSuite · Microsoft Dynamics 365 · Shiji ·
  Lightspeed · Cegid · Snowflake · UiPath · Reachware
- ⚠ **Consent rule:** no partner logos/badges until each vendor approves logo use. Keep text-only.

### 7.3 Positioning  *(intro + 3-card row)*
- **Eyebrow:** How we think
- **H2:** We sell judgment first, and technology second.
- **Sub:** Most sites in our field open with a catalogue. Ours opens with a question: what is
  the problem the technology is supposed to solve, and who governs it after it ships? Senior
  buyers choose a partner they trust before they choose a platform.
- **Card 1 — Advisory before product:** Every engagement starts with the business problem and
  the governance around it, not a feature list.
- **Card 2 — Regional depth since 2014:** We work in the operational language of each sector
  and the regulatory reality of the Kingdom.
- **Card 3 — Discipline after go-live:** The team stays on the ground through the sequence of
  go-lives, the integrations, and the quarter-end that follows.

### 7.4 What we do  *(two feature cards)*
- **Eyebrow:** What we do  ·  **H2:** Two ways we work, one standard of delivery.
- **Block A — Advisory & Consulting:** We help leaders make defensible technology decisions:
  strategy, platform selection, governance, and the roadmap that connects them. The output is a
  decision a CIO could take to the board and a plan an operations team can actually run.
  → link: Advisory & Consulting
- **Block B — Implementation & Delivery:** We turn the decision into a working system: solution
  design, implementation, system integration, localization, managed services, and post-go-live
  support. This is where global platforms meet regional reality.
  → link: Implementation & Delivery

### 7.5 Industries  *(8-card grid)*
- **Eyebrow:** Industries  ·  **H2:** We describe your sector the way you run it.
- **Sub:** Each industry has its own operational language — peak seasons, multi-location
  rollouts, regulatory exposure. We work inside that reality, not around it.
- **Cards (title — line):**
  - Hospitality — POS and PMS that survive peak season across multiple locations.
  - Food & Beverage — inventory, delivery aggregation, and front-of-house under real shift pressure.
  - Retail & Commerce — order, warehouse, and field distribution that stay accurate at scale.
  - Real Estate & Construction — leasing, project, and facility operations on one operational backbone.
  - Banking & Finance — regulated platforms, digital onboarding, and audit-ready workflows.
  - Insurance — core platforms, claims, and underwriting built for compliance.
  - Manufacturing — production, maintenance, and order operations connected end to end.
  - Investments — fundraising, private capital, and investor operations with governance built in.
- **Link:** Explore all industries →
- *Note: 3 sector decisions are still open (Transportation & Logistics, Services/Laundry, “Other”).
  Build the grid so cards are trivial to add/remove.*

### 7.6 Technologies / Business Units  *(category row)*
- **Eyebrow:** Technologies  ·  **H2:** Global platforms. Regional delivery.
- **Sub:** We work across a broad portfolio of technology categories. The platform is the
  partner’s strength; the regional implementation, localization, integration, and governance on
  top is ours.
- **Chips:** ERP · Customer Experience & POS · Data & AI · Supply Chain & Field Operations ·
  Digital Omnichannel · Integration

### 7.7 Method  *(4 numbered steps)*
- **Eyebrow:** How we work  ·  **H2:** Implementation discipline, in four moves.
- 01 **Understand** — the business problem, the operational reality, and the governance it has to live inside.
- 02 **Decide** — the platform and the roadmap, chosen for fit and defensibility, not familiarity.
- 03 **Deliver** — sequenced go-lives, localization, and integration with the systems already running.
- 04 **Sustain** — managed services and support that keep the system standing after the last location goes live.
- *Numbering is justified here: it is a real sequence.*

### 7.8 Outcomes  *(stats band — PLACEHOLDERS)*
- **Eyebrow:** Outcomes  ·  **H2:** We measure the work, not the noise.
- **Sub:** We anchor our work in outcomes a finance leader can defend — time-to-value, reduced
  error rates, audit-readiness — framed as directional, never guaranteed.
- Render **three dashed placeholder cards**, each: big “—”, caption “Directional outcome, sourced
  from a real engagement”, small note “to be sourced & approved”.
- ⚠ **Do not fill these with numbers.** Real, approved metrics only, phrased directionally.

### 7.8b References  *(two-row horizontal marquee — real, client-provided quotes)*
- **Eyebrow:** References  ·  **H2:** The work, in our clients’ words.
- **Sub:** Reference quotes from senior teams we have worked with across the Kingdom — in
  hospitality, food and beverage, retail, and logistics.
- **Two stacked rows** of wide, short (landscape) cards drifting slowly in **opposite** directions;
  each row’s card set is duplicated once for a seamless loop. **Pause on hover/focus.**
- Each card: a small **teal angle glyph** (the only marker — still **no avatar, no @handle, no
  X/social icon, no logo**), a quote **clamped to 2 lines**, and a `--gray` attribution
  **name · role, company**.
- Quotes are faithful **excerpts** of the client-provided testimonials, trimmed to fit two lines
  and to respect the forbidden-vocabulary rule (no *transform/revolutionize/disrupt/seamless*).
- White bg, `--radius-lg`, **0.5px solid `--line`** border (clean, not dashed), comfortable padding.
- **Accessibility:** cards are tabbable with visible focus; `prefers-reduced-motion` disables the
  auto-scroll (static, swipeable rows); ≤880px becomes a one-and-a-bit swipeable scroller.
- ⚠ Attribution is shown only with client approval; the Arabic testimonial is held for the RTL build.

### 7.9 Insights  *(3 article cards)*
- **Eyebrow:** Insights  ·  **H2:** How we think, in writing.
- **Sub:** Our perspective on advisory, sector reality, and delivering technology in the Kingdom —
  written for senior teams, not for search engines.
- Cards (label these **“Sample insight”** — placeholder titles, real layout):
  - Advisory — “Who governs the platform after it ships?” · 6 min read
  - Vision 2030 — “ZATCA Phase Two as a finance discipline, not a project” · 5 min read
  - Hospitality — “The groups that solved POS before October” · 4 min read
- **Link:** Read our Insights →

### 7.10 Vision 2030  *(teal gradient panel)*
- **Eyebrow:** National priorities  ·  **H2:** Aligned with national priorities, where it is operational.
- **Body:** For PIF portfolio companies and regulated entities, technology decisions carry both
  commercial and national weight. We work where Vision 2030 is real and operational — ZATCA Phase
  Two readiness, data residency, localization with discipline — not as a slogan.

### 7.11 Final CTA  *(contained dark gradient panel)*
- **Eyebrow:** Get in touch  ·  **H2:** Start with a conversation, not a quote.
- **Body:** Bring us the decision you are weighing or the delivery you need to get right. We will
  tell you what we see — and whether we are the right partner for it.
- **Button:** Request a Consultation

## 8. SEO

- **Title:** trustangle | Technology Advisory & Implementation Partner — KSA
- **Meta description:** trustangle is a Saudi technology advisory and implementation partner.
  Since 2014 we help enterprises choose, govern, and deliver technology that holds up after go-live.
- **Primary keyword:** technology advisory and implementation partner (Saudi Arabia)
- One `<h1>` only; sequential headings; descriptive `alt` text; semantic landmarks.

## 9. Brand voice constraints — HARD RULES (do not “improve” the copy)

- **Forbidden vocabulary, any language:** unlock, leverage, revolutionary, unleash, transform,
  game-changer, cutting-edge, disrupt, dominate, win, world-class, best-in-class — and generic
  AI-marketing filler (“in today’s world”, “towards a better future”). Note: avoid
  “transform/transformation” in visible copy.
- **No changeable counts** as fixed numbers (no “55 products”, “13 companies”, “19 industries”).
  Use descriptive phrasing. Only the founding year **2014** is a fixed number.
- **Directional outcomes only** — “can help reduce…”, never guarantees or specific % claims.
- **No invented** statistics, client names, testimonials, awards, or case studies.
- **Customer confidentiality:** anonymised references only (“a leading hospitality group in the
  Kingdom”). **Partner respect:** name platforms with respect; never compare or rank them.
- **Vision 2030** framing must stay operational, never decorative or political.

## 10. Quality floor

- Responsive to mobile (single-column ≤880px); visible keyboard focus; `prefers-reduced-motion`
  respected; colour contrast AA. Restrained motion — one reveal on scroll, subtle hover. Avoid
  anything that reads as templated or AI-generated.

## 11. Acceptance criteria (from the rebuild brief)

1. A senior buyer can tell within one screen that trustangle is an advisor, not a catalogue.
2. Every sector line would be recognised as accurate by an operator who works in that sector.
3. A reader could quote one line from the page to their board.
4. Nothing on the page needs editing when a company or product count changes.
5. The build visibly matches AgentFlow Home V3’s style, re-skinned to the trustangle palette.

## 12. Suggested repo layout

```
/index.html
/styles.css
/main.js
/assets/            (logo wordmark, favicon)
/BUILD-BRIEF.md     (this file)
```

*Arabic (RTL) parity version is a separate deliverable — build the English page first.*

---

## Repositioning addendum (consultancy + ecosystem run)

This run evolved the home from "advisory partner" toward **consultancy + the ecosystem that
delivers**, per `REPOSITIONPROMPT.md`. Updated section order (two sections added):

1. Hero — eyebrow badge, headline, subhead, primary + secondary CTAs, micro-line.
2. Partner strip (text-only).
3. Positioning — adds the **consultancy wedge** sub-line.
4. **POV — "A point of view"** *(NEW)* — framed PLACEHOLDER video + pull-quote position line +
   PLACEHOLDER speaker/transcript. No autoplay, no overlay CTA.
5. What we do.
6. Industries — each card now reveals **"the decision we help with"** on hover/focus (always on mobile);
   cards deep-link to `/industries/*` spokes.
7. Technologies — chips deep-link to `/technologies/*` spokes.
8. **Ecosystem — "The ecosystem behind the advice"** *(NEW, `#ecosystem`)* — six capability cards
   (Business-Unit categories). No company names, no logos, no counts.
9. Method · Outcomes (placeholders) · **References — two-row marquee of client quotes, attributed
   name · role · company, no avatars/@handles/logos** · Insights · Vision 2030.
10. Final CTA — adds the **paid-diagnostic** "how a consultation works" block (fee = PLACEHOLDER).

SEO: `Organization` + `ProfessionalService` JSON-LD, hreflang (en/ar/x-default), Open Graph + Twitter
(og:image PLACEHOLDER), hub-and-spoke internal links. QA: `node qa/brand-lint.mjs` must exit 0.
