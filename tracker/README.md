# NHJ Project Service Tracker

A React app for tracking NHJ client engagements: a portfolio dashboard, a
per-client engagement drawer with a spreadsheet-style task grid, portfolio
reports, and settings for team, integrations and admin.

Built from the `NHJ - Tracker Preview` Claude Design handoff bundle. The design
is unchanged; what changed is everything the prototype relied on the design host
for (see [What changed from the prototype](#what-changed-from-the-prototype)).

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/ (relative asset paths, serves from any sub-path)
npm run preview    # serve the built bundle
npm run smoke      # headless walk-through of every view, against dist/
```

`npm run smoke` needs a build first. It serves `dist/`, drives Chromium through
the dashboard, a client drawer, the task grid, reports, settings, the tweaks
panel, edit mode and the Arabic toggle, and fails on any console error, page
error or same-origin request failure. Screenshots land in `qa/screens/`
(gitignored).

## Layout

```
index.html            Google Fonts + #root, loads src/main.jsx
src/main.jsx          boot: styles, <image-slot> registration, data, <App/>
src/App.jsx           app shell: appbar, view switch, edit banner, tweaks panel
src/styles.css        the whole design system (tokens in :root, RTL, dark rules)
src/data/portfolio.js clients, team leaders, SOW categories and every task
src/components/
  ui.jsx              Portal, Icon set, Pill, date helpers, TeamAvatar
  image-slot.js       <image-slot> custom element (logos, brand mark)
src/logos/            client logos, one file per client id (see its README)
src/lib/
  i18n.jsx            EN/AR string table, LangProvider, useLang
  editable.jsx        edit mode: EditableText, overrides store, EditFrame
  theme.jsx           live theme colors (CSS custom properties)
  tweaks-panel.jsx    floating display-preferences panel + its controls
  image-opts.jsx      per-image zoom and white-background options
src/views/
  Dashboard.jsx       hero, draggable widget grid, status rail, client cards
  ClientDetail.jsx    engagement drawer: overview, tasks, timeline, information
  TaskTable.jsx       the task grid (resize, reorder, sort, inline edit, columns)
  Reports.jsx         portfolio KPIs, phase mix, at-risk, this week, workload
  Settings.jsx        general, team and roles, notifications, integrations, admin
qa/smoke.mjs          headless smoke test
```

## Data

`src/data/portfolio.js` carries the portfolio the prototype was built against:
team leaders, the SOW category map, and the tasks parsed from the per-client
"To Do List" workbooks (phase, category, unit, priority, owner, status, dates).
It assigns `window.CLIENTS`, `window.REAL_TASKS`, `window.TEAM_LEADERS` and
`window.CLIENT_DETAILS` (the shape the views were written against) and exports
the same objects for code that prefers imports.

"Today" is pinned, so "overdue", "due this week" and the star-employee month stay
stable against a fixed dataset. `data/portfolio.js`, `components/ui.jsx`
(`todayISO`) and `views/Dashboard.jsx` all pin `2026-05-17`; `views/Reports.jsx`
pins `2026-05-19` with its week starting `2026-05-18`. Collapse those into one
clock when the data layer is wired to a backend.

## Client logos

Commit an image to `src/logos/` named after the client id — `byn.png`,
`lynnc.svg`, `nhj.png` — and it fills that client's slot on the portfolio card
and in the drawer header; `nhj` also fills the app bar and hero mark. The
folder is globbed at build time, so no code change is needed.
`src/logos/README.md` lists every client id.

A logo someone drops onto a slot in the running app is stored in their browser
and overrides the committed file for them only; removing it restores the
committed one.

## Where state lives

Everything the app remembers is per browser, in `localStorage` — no backend
yet. The keys:

| Key | Holds |
| --- | --- |
| `nhj-lang` | EN / AR choice |
| `nhj-tweaks` | density, card layout, hero size, panel header |
| `nhj-theme` | theme color overrides |
| `nhj-overrides` | edit-mode text and style overrides |
| `nhj-dashboard-layout-v3` | widget grid positions and sizes |
| `nhj-tasktable-<clientId>` | task rows, columns, sort, row heights |
| `nhj-attach-<clientId>` | task attachments and links |
| `nhj_engagement_overrides` | engagement fields edited in the drawer |
| `nhj-team`, `nhj-avatars`, `nhj-img-opts` | team profiles, photos, image options |
| `nhj-kudos`, `nhj_kudos_history`, `nhj_employee_kudos_points` | kudos and points |
| `nhj-image-slot:<id>` | images dropped onto a logo or brand slot |
| `nhj-spoc-<clientId>` | SPOC thread notes |

Clearing site data resets the app to the seeded portfolio.

## What changed from the prototype

The prototype ran on React + Babel from a CDN inside the design tool. This app
is the same UI on a real build, with the design-host dependencies replaced:

- **Build.** Vite + `@vitejs/plugin-react`; the `window.X = X` globals became ES
  modules with explicit imports and exports.
- **`<image-slot>`.** The design tool's element wrote images to a sidecar file
  through its host bridge. Rewritten as a small custom element with the same
  tag, attributes and shadow parts (so every `image-slot::part(...)` rule in
  `styles.css` still applies), storing a downscaled copy in `localStorage`.
- **Tweaks panel.** Dropped the design-host message protocol
  (`__activate_edit_mode` and friends) and the deck-stage controls. The panel is
  now controlled by `open` / `onClose` from the app shell, and preferences
  persist under `nhj-tweaks` instead of being written back into the source file.
- **Boot.** `ReactDOM.createRoot` moved from `app.jsx` into `src/main.jsx`, under
  `React.StrictMode`.

Everything else — the layout, the widget grid editor, edit mode, the task grid,
the reports, the EN/AR toggle — is the prototype's behaviour, unchanged.

## Known gaps

- **No backend.** Every edit is local to the browser that made it. Two people
  looking at the tracker do not see each other's changes.
- **Bundle size.** ~930 kB minified, most of it the task dataset compiled into
  the bundle. Moving the portfolio behind a fetch would cut it sharply, and is
  the natural first step when the backend arrives.
- **Flags come from `flagcdn.com`.** The client cards and the region widget load
  flag SVGs from that CDN; on a network that blocks it, those images are empty.
  Fonts come from Google Fonts with a system fallback stack.
- **Placeholder contacts.** Contact emails in `CLIENT_DETAILS` are generated
  `@<client>.example` addresses, and the settings sessions list is sample data.
  Both read as placeholders on purpose.
