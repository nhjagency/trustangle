# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page static marketing site for **trustangle** — a Saudi technology **advisory and implementation partner** (founded 2014, operating across MENA). The current work is the **Home page**, built section by section from approved copy specs.

There is **no build step, framework, or package manager**. The site is hand-written `index.html` + `styles.css` + `main.js`, opened directly in a browser. Everything is vanilla HTML/CSS/JS.

## Commands

```bash
# Brand lint — the only automated gate. Run after every content change.
node qa/brand-lint.mjs            # defaults to ./index.html
node qa/brand-lint.mjs <file>     # lint a specific (e.g. bundled) file
# exit 0 = clean, exit 1 = violations (prints each issue)

# Unit tests — Node's built-in runner, no deps. Target the test files only
# (do NOT run `node --test qa/`: it would also execute brand-lint.mjs).
node --test qa/*.test.mjs

# Preview: just open index.html in a browser. Asset paths are relative,
# so it works from file:// (the /industries/* and /technologies/* spoke
# links 404 locally — those pages are not built yet, expected).
```

"Tests" = `brand-lint` passing, the `qa/*.test.mjs` unit tests passing, **plus** the manual QA checklist in each section spec (em dashes, slugs, heading order, AA contrast, responsive at ≤880px). The `qa/*.test.mjs` files assert structural facts about the built `index.html` (e.g. the feedback button's mailto/aria/dash rules) using `node:test` + `node:assert` only.

### What `qa/brand-lint.mjs` actually checks
It strips scripts/styles/comments/tags to visible text, then flags:
- **Forbidden vocabulary** (list lives in the file: transform, leverage, seamless, world-class, disrupt, dominate, win, leading, etc.) — with a negation guard, so "without disrupting" is allowed. Fix the rule, not approved copy, if a legitimate phrase trips it.
- **Changeable fixed counts**: `\d+` followed by products/companies/industries/clients/partners/platforms/sectors/years. Only **2014** is an allowed fixed number.
- Exactly **one `<h1>`**.
- **Company name casing** (rejects Trustangle / Trust Angle / TrustAngle).

It does **NOT** check em dashes or browser storage — enforce those by hand (see standing rules). Note: `HOME-BUILD-PROMPT.md`, `REPOSITION-PROMPT.md`, and `qa/build-debugger.html` are referenced by some section prompts but are **not in the repo**; `qa/brand-lint.mjs` is the only gate present.

## Architecture

- **`index.html`** — the whole page: `<head>` (SEO title/meta, OG/Twitter, hreflang en/ar/x-default, JSON-LD `Organization` + `ProfessionalService` with `foundingDate` 2014), sticky `<nav>` with dropdowns, `<main>` of ordered sections, `<footer>`, then `<script src="main.js">`.
- **`styles.css`** — all styling. Design tokens are CSS custom properties in `:root` (brand teal, ink, gray, tints, radii, shadows, fonts). **Use the tokens; never hardcode the old AgentFlow blue/violet.** Fonts: `--disp` = Archivo (display, web substitute for Acumin), `--body` = Source Sans 3 (body, substitute for Myriad Pro). Section specs may name Plus Jakarta Sans / Inter as fallbacks — the site standardizes on Archivo + Source Sans 3 for consistency.
- **`main.js`** — one IIFE of progressive-enhancement components. Components: scroll-reveal (IntersectionObserver; respects `prefers-reduced-motion`), mobile nav toggle, nav dropdowns, references marquee (duplicates rows for a seamless loop), tablist widgets. JS is intentionally limited — no libraries, **no browser storage of any kind** (state in memory only).

### Home page section order (in `<main>`)
1 Hero · 2 Positioning · 3 Industries · 4 Technologies & ecosystem · (held, `hidden`: Outcomes, References) · 5 Point of view · 6 Insights · 7 Vision 2030 · 8 Final CTA.
**Outcomes and References** exist as `[data-held]` `hidden` scaffold between 5 and 6 — ready to enable, never shipped as visible empty bands.

### Data-driven Industries selector
The Industries section is a single `.ind-card` panel swapped by the tablist in `main.js`. Each `.ind-tab` button carries `data-name`, `data-href` (`/industries/<slug>`), and `data-brief`; clicking/arrowing updates the panel name, brief, "Explore →" link, and case-study sector. **To edit a sector, edit its tab's data attributes**, not just the visible Hospitality panel.

### Other files
`BUILD-BRIEF.md` (executable build spec: structure, tokens, copy, acceptance) · `content/home.md` (section copy + SEO + placeholder flags) · `reference/home-mockup-agentflow-light.html` (visual reference) · `assets/` (logos, favicons; partner logos used grayscale, see consent rule) · `sandbox/` and `Design/` are scratch, not shipped.

## Brand rules — hard constraints (apply to every edit)

- **Name** is always `trustangle` — lowercase, one word. Logo wordmark: `trust` in ink + `angle` in teal.
- **Forbidden vocabulary** (any language): unlock, leverage, revolutionary, unleash, transform/transformation, game-changer, cutting-edge, disrupt, dominate, win, world-class, best-in-class, seamless, leading, plus AI-marketing filler ("in today's world", "towards a better future").
- **No em dashes (—)** anywhere in visible copy or alt/aria/title text. Use a colon, comma, or sentence break. Hyphens in real hyphenated words ("go-live", "quarter-end") are fine. Standing rule across the whole page; retro-fix any you find.
- **No fixed changeable counts** ("13 companies", "55 products", "19 industries"). Descriptive phrasing only. **2014** (founding year) is the one allowed fixed number.
- **Directional outcomes only** — "can help reduce…", never guarantees or specific % claims.
- **Never invent** statistics, client names, testimonials, awards, case studies, or partner endorsements. Placeholders must read visibly as placeholders.
- **Partner logos require written vendor consent.** Until then, partner names are text wordmarks (or grayscale logos only where the client has explicitly approved the asset). Never compare or rank platforms.
- **Customer confidentiality**: anonymised references only ("a leading hospitality group in the Kingdom").
- **Vision 2030**: operational framing only (ZATCA readiness, data residency, localization), never decorative or political. Do not inject regulator names into copy that doesn't call for them.
- **Colour**: brand accent is Tropical Green `#0099a8`; teal **text on light must use `#067d89`** (AA). Ink `#0f1e23`, gray `#5a6a6f`.
- **Tone/positioning**: Trusted Advisor, not a vendor catalogue. Advisory before product on every page. Judgment first, technology second.

## IA decisions (locked)

- Top nav order: **Industries · Technologies · What We Do** (dropdown: Advisory & Consulting, Implementation & Delivery) **· Insights**, then an Arabic-language toggle (`/ar`), a dark-mode toggle, and the Request a Consultation CTA. (Client iterated nav in 2026-06.)
- **Dark mode** is a `data-theme="dark"` toggle on `<html>`, held in memory only (no storage, per the rule); preference does not persist across reloads. Theme overrides live at the end of `styles.css`.
- Primary CTA everywhere: **Request a Consultation** (never "Free Consultation" / "Book now").
- Products/technologies are in-page filters with their own spoke pages (`/technologies/*`, `/industries/*`) — **not** mega-menu items.
- Technology grouping uses Business Unit names: ERP · Customer Experience & POS · Data & AI · Supply Chain & Field Operations · Digital Omnichannel · Integration.

## Working conventions

- **Branch**: develop on the assigned feature branch; never push to a different branch without permission. Commit with clear messages; do not open a PR unless asked.
- **Workflow per change**: edit → `node qa/brand-lint.mjs` → render/screenshot to verify → commit + push. Scroll-reveal sections start at `opacity:0`; force `.reveal.in` (or scroll) when screenshotting or they look blank.
- **Single-file preview bundle**: to share a self-contained file, inline `styles.css`/`main.js` into `index.html` and base64-inline the referenced `assets/*` — produces one portable `.html`. Asset paths in `index.html` are URL-encoded for spaces (e.g. `Shiji%20logo.png`).
- **Bilingual parity** is a governing principle: an Arabic (RTL) page is a separate, future deliverable written natively. Build English first; keep the hreflang hooks in place.
- The **AgentFlow Home V3** template is the visual source of truth (re-skinned to brand). Drop all DevTools-style sections (code playground, model demo, pricing, "install in seconds"); restrained motion only.
