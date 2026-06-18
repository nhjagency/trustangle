# CLAUDE.md — trustangle Website (Home page build)

> Project context for Claude Code. Read this first. It carries over the working session
> in which this home page was scoped and drafted, the decisions made, the brand rules that
> govern every change, what is finished, and what is still open.

## Project

- **Client:** trustangle — a Saudi technology **advisory and implementation partner**,
  founded **2014**, operating across MENA with a growing ecosystem of specialised companies.
- **Agency:** NHJ. **Lead:** Sana (marketing).
- **This task:** rebuild the trustangle website; this session focused on the **Home page**.
- **Positioning shift:** from a vendor/reseller catalogue → a **Trusted Advisor** that shows
  judgment first and product second. Advisory before product on every page.

## Template & visual direction

- **Template:** AgentFlow (Webflow) — a light, modern SaaS template by BRIX. Style requested:
  **Home V3**.
- ⚠ The AgentFlow demo (`https://agentflowtemplate.webflow.io/home-pages/home-v3`) blocks
  automated fetching. **Treat the live V3 page and/or the purchased template’s Figma/Webflow
  export as the visual source of truth** for hero treatment, section order, spacing, and motion.
- **Re-skin, don’t reuse content.** Drop AgentFlow’s DevTools-only sections (code playground,
  model demo, pricing, “install in seconds”). Map only the trustangle sections in `BUILD-BRIEF.md`.
- Brand accent **is** Tropical Green `#0099a8` (replace the template’s original accent).

## What to build

Follow **`BUILD-BRIEF.md`** exactly: a responsive static prototype
(`index.html` + `styles.css` + `main.js`) matching AgentFlow Home V3, using the brand tokens
and the **final, brand-locked copy** in the brief. Copy is approved — do not rewrite it.
Keep all `PLACEHOLDER` items visibly empty.

## Brand rules — HARD CONSTRAINTS (apply to every edit)

- **Forbidden vocabulary (any language):** unlock, leverage, revolutionary, unleash, transform,
  game-changer, cutting-edge, disrupt, dominate, win, world-class, best-in-class; plus AI-marketing
  filler. Avoid “transform/transformation” in visible copy.
- **No changeable counts** as fixed numbers (no “55 products”, “13 companies”, “19 industries”).
  Descriptive phrasing only. Founding year **2014** is the one allowed fixed number.
- **Directional outcomes only** — “can help reduce…”, never guarantees or specific % claims.
- **Never invent** statistics, client names, testimonials, awards, or case studies.
- **Partner respect:** name platforms with respect; never compare/rank them. **Partner logos
  require written vendor consent** — keep the partner strip as text wordmarks until then.
- **Customer confidentiality:** anonymised references only (“a leading hospitality group in the Kingdom”).
- **Vision 2030:** operational framing only, never decorative or political.
- **Company name:** `trustangle` — lowercase, one word. Never Trustangle / Trust Angle / TrustAngle.
- **Bilingual parity** is a governing principle: an Arabic (RTL) version is required eventually,
  written natively (not a translation). Build English first.

## IA decisions locked in

- Top nav: **Advisory & Consulting · Implementation & Delivery** (not “What We Do”).
- Technology grouping uses Business Unit categories: ERP · Customer Experience & POS · Data & AI ·
  Supply Chain & Field Operations · Digital Omnichannel · Integration.
- Primary CTA: **Request a Consultation** (not “Free Consultation”).
- Products are in-page filters with individual pages — **not** mega-menu items.
- Advisory comes before products in the order.

## Files in this repo

```
CLAUDE.md      ← you are here (session context + rules)
BUILD-BRIEF.md ← the executable build spec: structure, tokens, final copy, acceptance criteria
content/
  home.md      ← the home page copy, section by section, with SEO + placeholder flags
reference/
  home-mockup-agentflow-light.html  ← working visual reference (AgentFlow light system,
                                       brand-coloured). Use as a starting point; refine toward V3.
```

## Status

**Done this session**
- Home page copy written in trustangle voice (`content/home.md`).
- Build brief produced (`BUILD-BRIEF.md`).
- Light AgentFlow-style HTML mockup built as a visual/voice reference.

**Open — needs the client before/while building**
- Confirm what makes **Home V3** different (likely a bolder/darker hero) and pin the hero spec.
- Three website scoping questions are still **unanswered**: product scope, competitor list,
  bilingual vs English-first.
- Three sector decisions are open: **Transportation & Logistics**, **Services/Laundry**, **“Other”**
  (possible removals — no matching products). Keep the industries grid easy to add to/trim.
- **Outcomes** stats and **testimonials**: real, approved metrics/quotes required; do not fabricate.
- **Partner logos:** pending vendor consent (text-only for now).
- **Arabic (RTL)** parity page: not yet built.

## Pipeline note

This used the `/build-website` workflow but only the Home page (Phase 5) was produced. Phases 1–3
(competitor research, SEO clusters, full sitemap) were **not** formally run. The SEO block in
`content/home.md` is provisional and should be validated if/when those phases are done.

## Session log (condensed)

1. Asked to start `/build-website` and draft the Home page from the IA; chose the AgentFlow template.
2. Produced home page content (markdown), flagging placeholders, partner-logo consent, and the
   open product-scope decision.
3. Produced the same content as a branded Word document.
4. Built a scrollable HTML mockup (first dark, then rebuilt **light** to match AgentFlow Home V1).
5. Asked for **Home V3** style + a Claude Code file → produced `BUILD-BRIEF.md` (V3 URL as visual
   source of truth, since the demo blocks bots).
6. This handoff: transferred context + results into this Claude Code project.

## Suggested next steps for Claude Code

1. Open the V3 reference, confirm the hero/layout, update `BUILD-BRIEF.md` §7.1 if needed.
2. Build `index.html` + `styles.css` + `main.js` per the brief; keep placeholders visible.
3. Run the §11 acceptance checks. Then scaffold the Arabic RTL version.
