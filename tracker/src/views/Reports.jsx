import React from 'react';

const { useEffect: useEffect_r, useState: useState_r, useMemo: useMemo_r } = React;

// ─── Shared palette ────────────────────────────────────────────────
const RP_PHASE = {
  Foundation: '#2563eb',
  Activation: '#f97316',
  Growth:     '#10b981',
};
const RP_STATUS = {
  completed:    '#10b981',
  in_progress:  '#3b82f6',
  on_hold:      '#6b7280',
  not_started:  '#e5e7eb',
};
// Stable per-project accent colors used across all sections.
const RP_PROJECT_COLOR_LIST = [
  '#2563eb', '#f97316', '#10b981', '#8b5cf6', '#dc2626',
  '#0891b2', '#d946ef', '#facc15', '#14b8a6', '#ef4444',
  '#3b82f6', '#84cc16', '#a855f7', '#f59e0b', '#06b6d4',
  '#e11d48', '#65a30d', '#7c3aed', '#fb923c', '#0d9488',
  '#be185d', '#4f46e5', '#22c55e',
];

// ─── Custom Reports hero ────────────────────────────────────────────
function ReportsHero({ kpis }){
  return (
    <div className="hero rp-hero">
      <div className="hero-orb"/>
      <div className="hero-orb b"/>
      <div className="rp-hero-mark" aria-hidden="true">NHJ</div>
      <div className="hero-text rp-hero-text">
        <div className="hero-eyebrow">NHJ PORTFOLIO</div>
        <h1>Project Service <em>Tracker</em></h1>
        <div className="hero-sub">Executive reporting · {kpis.projects} active engagements</div>
      </div>
      <div className="rp-hero-kpis" role="list">
        {kpis.cells.map((k, i) => (
          <div key={k.label} className={`rp-hero-kpi${i > 0 ? ' has-div' : ''}`} role="listitem">
            <div className="rp-hero-kpi-v">{k.value}</div>
            <div className="rp-hero-kpi-l">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section card scaffold ──────────────────────────────────────────
function RPCard({ title, accent, subtitle, children, className = '' }){
  return (
    <section className={`rp-card ${className}`}>
      <header className="rp-card-h">
        <h3 className="rp-card-title">
          {title} <em className="rp-card-em" style={{ color: accent || '#2563eb' }}>{/* italic accent slot */}</em>
        </h3>
        {subtitle && <p className="rp-card-sub">{subtitle}</p>}
      </header>
      <div className="rp-card-body">{children}</div>
    </section>
  );
}

// Title with an italic-accented second word. Pass the full string;
// the LAST word is italicized and colored.
function RPTitle({ text, accent = '#2563eb', subtitle }){
  const parts = text.trim().split(' ');
  const last = parts.pop();
  const head = parts.join(' ');
  return (
    <header className="rp-card-h">
      <h3 className="rp-card-title">
        {head} <em className="rp-card-em" style={{ color: accent }}>{last}</em>
      </h3>
      {subtitle && <p className="rp-card-sub">{subtitle}</p>}
    </header>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 1 — Executive summary strip
// ════════════════════════════════════════════════════════════════════
function ExecSummary({ unassigned }){
  const cells = [
    { v: '373',   l: 'Completed',     c: '#10b981' },
    { v: '13',    l: 'In Progress',   c: '#3b82f6' },
    { v: '1,092', l: 'Not Started',   c: '#f59e0b' },
    { v: '79',    l: 'On Hold',       c: '#6b7280' },
    { v: (unassigned || 1013).toLocaleString(), l: 'Unassigned', c: '#dc2626' },
  ];
  return (
    <section className="rp-card rp-exec">
      <div className="rp-exec-row">
        {cells.map((c, i) => (
          <div key={c.l} className={`rp-exec-cell${i > 0 ? ' has-div' : ''}`}>
            <span className="rp-exec-accent" style={{ background: c.c }}/>
            <div className="rp-exec-v">{c.v}</div>
            <div className="rp-exec-l">{c.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 2 — Phase distribution
// ════════════════════════════════════════════════════════════════════
function PhaseDistribution({ tasks }){
  const counts = useMemo_r(() => {
    const m = { Foundation: 0, Activation: 0, Growth: 0 };
    tasks.forEach(t => {
      const p = t.phaseLabel;
      if (m[p] != null) m[p]++;
    });
    return m;
  }, [tasks]);
  const total = counts.Foundation + counts.Activation + counts.Growth || 1;
  // Fixed lifecycle order: Foundation → Activation → Growth (left to right).
  const rows = [
    { name: 'Foundation', color: RP_PHASE.Foundation, count: counts.Foundation },
    { name: 'Activation', color: RP_PHASE.Activation, count: counts.Activation },
    { name: 'Growth',     color: RP_PHASE.Growth,     count: counts.Growth },
  ];
  return (
    <section className="rp-card rp-phase-card">
      <RPTitle text="Phase distribution" subtitle="tasks across project phases"/>
      <div className="rp-stack-bar">
        {rows.filter(r => r.count > 0).map(r => (
          <span key={r.name} className="rp-stack-seg"
                style={{ background: r.color, flexGrow: r.count }}
                title={`${r.name} · ${r.count}`}/>
        ))}
      </div>
      <ul className="rp-phase-legend">
        {rows.map(r => (
          <li key={r.name}>
            <span className="rp-dot" style={{ background: r.color }}/>
            <span className="rp-phase-name">{r.name}</span>
            <span className="rp-phase-count">{r.count.toLocaleString()} Tasks</span>
            <span className="rp-phase-pct">({Math.round((r.count / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 3 — Project health (status mix per project)
// ════════════════════════════════════════════════════════════════════
function ProjectHealth({ projects }){
  const rows = useMemo_r(() => {
    // Case-insensitive deduplication — merge variants like "Nowa" / "nowa".
    const byKey = new Map();
    projects.forEach(p => {
      const key = p.name.trim().toLowerCase();
      const existing = byKey.get(key);
      if (!existing){
        byKey.set(key, { ...p });
      } else {
        existing.total       += p.total;
        existing.completed   += p.completed;
        existing.in_progress += p.in_progress;
        existing.on_hold     += p.on_hold;
        existing.not_started += p.not_started;
        const hasCase = (s) => /[A-Z]/.test(s);
        if (hasCase(p.name) && !hasCase(existing.name)) existing.name = p.name;
      }
    });

    return [...byKey.values()]
      .filter(p => p.total > 0)
      .map(p => ({
        ...p,
        pct: Math.round((p.completed / p.total) * 100),
      }))
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
  }, [projects]);

  // Color thresholds: ≥40 healthy green, 15–39 amber, <15 red.
  const pctColor = (n) => n >= 40 ? '#10b981' : n >= 15 ? '#f59e0b' : '#dc2626';

  return (
    <section className="rp-card">
      <RPTitle text="Project health" subtitle="status mix per project"/>
      <div className="rp-health-list rp-health-list-cap">
        {rows.map(p => {
          const t = p.total || 1;
          const seg = [
            { c: RP_STATUS.completed,   n: p.completed },
            { c: RP_STATUS.in_progress, n: p.in_progress },
            { c: RP_STATUS.on_hold,     n: p.on_hold },
            { c: RP_STATUS.not_started, n: p.not_started },
          ];
          return (
            <div key={p.name} className="rp-health-row">
              <div className="rp-health-name" title={p.name}>{p.name}</div>
              <div className="rp-health-bar">
                {seg.filter(s => s.n > 0).map((s, i) => (
                  <span key={i} className="rp-health-seg"
                        style={{ background: s.c, width: `${(s.n / t) * 100}%` }}/>
                ))}
              </div>
              <div className="rp-health-pct" style={{ color: pctColor(p.pct) }}>
                {p.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 4 — At-risk projects
// ════════════════════════════════════════════════════════════════════
function AtRisk({ projects, onOpenProject }){
  const risky = useMemo_r(() => {
    // Case-insensitive dedupe — merge entries whose names differ only by case
    // (e.g. "Nowa" / "nowa"). The proper-cased version (longest mixed-case)
    // wins as the display label, and totals are summed.
    const byKey = new Map();
    projects.forEach(p => {
      const key = p.name.trim().toLowerCase();
      const existing = byKey.get(key);
      if (!existing){
        byKey.set(key, { ...p });
      } else {
        existing.total       += p.total;
        existing.completed   += p.completed;
        existing.in_progress += p.in_progress;
        existing.on_hold     += p.on_hold;
        existing.not_started += p.not_started;
        const hasCase = (s) => /[A-Z]/.test(s);
        if (hasCase(p.name) && !hasCase(existing.name)) existing.name = p.name;
      }
    });

    return [...byKey.values()]
      .map(p => ({
        ...p,
        pct: p.total ? Math.round((p.completed / p.total) * 100) : 0,
        inMotion: p.in_progress,
      }))
      // ≤5% complete AND has a non-trivial task list AND
      // either 0 tasks in motion OR notStarted equals total.
      .filter(p => p.total > 0 && p.pct <= 5 && (p.inMotion === 0 || p.not_started === p.total))
      .sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name));
  }, [projects]);

  const onView = (name) => (e) => {
    e.preventDefault();
    if (onOpenProject) onOpenProject(name);
  };

  return (
    <section className="rp-card">
      <RPTitle text="At-risk projects" accent="#dc2626" subtitle="projects ≤5% complete with zero tasks in motion"/>
      {risky.length === 0 ? (
        <div className="rp-risk-empty">
          <span className="rp-risk-check" aria-hidden="true">✓</span>
          No projects below the 5% risk threshold
        </div>
      ) : (
        <div className="rp-risk-row">
          {risky.map(p => {
            const startedCount = p.completed + p.in_progress;
            return (
              <article key={p.name} className="rp-risk-card">
                <span className="rp-risk-accent" aria-hidden="true"/>
                <div className="rp-risk-name">{p.name}</div>
                <div className="rp-risk-reason">
                  {p.pct}% complete · {startedCount === 0 ? '0 tasks started' : `${startedCount} task${startedCount === 1 ? '' : 's'} started`}
                </div>
                <div className="rp-risk-stats">
                  {p.total} tasks · {p.inMotion} in motion
                </div>
                <a className="rp-risk-link" href="#" onClick={onView(p.name)}>View details →</a>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 5 — This week's tasks
// ════════════════════════════════════════════════════════════════════
// Each row: [start ISO, end ISO, project, task, owner, phase, status]
// Sorted by start ascending, then end ascending.
const THIS_WEEK_TASKS = [
  ['2025-10-25', '2026-05-20', 'Techtown',          'Business Materials',       'Lama Al sheikh', 'Activation', 'not_started'],
  ['2025-10-29', '2026-05-21', 'Silver Foundation', 'Business Materials',       'Unassigned',     'Activation', 'not_started'],
  ['2026-02-08', '2026-05-24', 'Mealy',             'Business Materials',       'Unassigned',     'Activation', 'not_started'],
  ['2026-04-06', '2026-05-21', 'Fundraizerly',      'Business Materials',       'Lujain Alasadi', 'Activation', 'not_started'],
  ['2026-05-19', '2026-05-20', 'Techtown',          'Company Profile - Design', 'Najlae Hamdoun', 'Activation', 'in_progress'],
  ['2026-05-21', '2026-05-21', 'BYN',               'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-06-04', 'BYN',               'Business Materials',       'Unassigned',     'Activation', 'not_started'],
  ['2026-05-21', '2026-05-21', 'Fundraizerly',      'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-05-24', 'Mealy',             'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-05-21', 'Namir',             'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-05-21', 'Qeema',             'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-05-21', 'Silver Foundation', 'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-05-21', 'Wafra',             'Business Card',            'Najlae Hamdoun', 'Activation', 'not_started'],
  ['2026-05-21', '2026-05-21', 'Wafra',             'Business Materials',       'Unassigned',     'Activation', 'not_started'],
  ['2026-05-24', '2026-05-24', 'Sukuk',             'Brand Guideline',          'Najlae Hamdoun', 'Foundation', 'not_started'],
];

// Today + current-week boundaries (Mon May 18 → Sun May 24, 2026).
const RP_TODAY      = new Date('2026-05-19T00:00:00');
const RP_WEEK_START = new Date('2026-05-18T00:00:00');
const RP_WEEK_END   = new Date('2026-05-24T00:00:00');
const RP_CURRENT_YEAR = 2026;

const RP_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function rpFmtDate(iso){
  const d = new Date(iso + 'T00:00:00');
  const m = RP_MONTHS[d.getMonth()];
  const day = String(d.getDate()).padStart(2,'0');
  const yr = d.getFullYear();
  return yr === RP_CURRENT_YEAR ? `${m} ${day}` : `${m} ${day} '${String(yr).slice(-2)}`;
}
function rpDaysBetween(a, b){
  return Math.round((a - b) / (1000*60*60*24));
}

const STATUS_PILL = {
  in_progress: { bg: '#dbeafe', fg: '#1d4ed8', label: 'In Progress' },
  not_started: { bg: '#fef3c7', fg: '#b45309', label: 'Not Started' },
  completed:   { bg: '#d1fae5', fg: '#047857', label: 'Completed' },
  on_hold:     { bg: '#f3f4f6', fg: '#374151', label: 'On Hold' },
};
const PHASE_PILL = {
  Foundation: { bg: '#dbeafe', fg: '#1e40af' },
  Activation: { bg: '#ffedd5', fg: '#c2410c' },
  Growth:     { bg: '#d1fae5', fg: '#047857' },
};

function ThisWeek({ projectColors }){
  const DEFAULTS = { start: 110, end: 110, project: 160, task: 260, owner: 160, phase: 110, status: 120 };
  const COL_KEYS = ['start','end','project','task','owner','phase','status'];
  const COL_LABELS = { start:'Start', end:'End', project:'Project', task:'Task', owner:'Owner', phase:'Phase', status:'Status' };
  const [widths, setWidths] = useState_r(DEFAULTS);
  const dragRef = React.useRef(null);

  const onMouseDown = (key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { key, startX: e.clientX, startW: widths[key] };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const next = Math.min(500, Math.max(60, dragRef.current.startW + dx));
      setWidths(w => ({ ...w, [dragRef.current.key]: next }));
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const colStyle = (k) => ({ width: widths[k] + 'px', minWidth: widths[k] + 'px', maxWidth: widths[k] + 'px' });

  return (
    <section className="rp-card">
      <RPTitle text="This week" subtitle="tasks scheduled May 18 – May 24 · sorted by date"/>
      <div className="rp-tw-wrap">
        <table className="rp-tw-table">
          <colgroup>
            {COL_KEYS.map(k => <col key={k} style={{ width: widths[k] + 'px' }}/>)}
          </colgroup>
          <thead>
            <tr>
              {COL_KEYS.map(k => (
                <th key={k} className="rp-tw-th" style={colStyle(k)}>
                  <span className="rp-tw-th-label">{COL_LABELS[k]}</span>
                  <span
                    className="rp-tw-resizer"
                    onMouseDown={onMouseDown(k)}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${COL_LABELS[k]} column`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {THIS_WEEK_TASKS.map(([startIso, endIso, project, task, owner, phase, status], i) => {
              const sp = STATUS_PILL[status];
              const pp = PHASE_PILL[phase];
              const unassigned = owner === 'Unassigned';
              const startDate = new Date(startIso + 'T00:00:00');
              const endDate   = new Date(endIso + 'T00:00:00');
              const startBeforeWeek = startDate < RP_WEEK_START;
              const endAfterWeek    = endDate > RP_WEEK_END;
              const isTodayStart = startIso === '2026-05-19';
              const isTodayEnd   = endIso === '2026-05-19';
              const overdue = endDate < RP_TODAY;
              const lateToStart = rpDaysBetween(RP_TODAY, startDate) > 30 && status === 'not_started';

              const startColor = startBeforeWeek ? '#9ca3af' : '#374151';
              const endColor   = endAfterWeek ? '#6b7280' : '#374151';

              return (
                <tr key={i} className={`rp-tw-row${isTodayStart ? ' is-today' : ''}`}>
                  <td className="rp-tw-cell rp-tw-date-cell" style={colStyle('start')}>
                    <span className="rp-tw-date-text" style={{ color: startColor }}>{rpFmtDate(startIso)}</span>
                    {isTodayStart && <span className="rp-today-pill">TODAY</span>}
                  </td>
                  <td className="rp-tw-cell rp-tw-date-cell" style={colStyle('end')}>
                    {overdue ? (
                      <span className="rp-tw-overdue-pill">{rpFmtDate(endIso)}</span>
                    ) : (
                      <span className="rp-tw-date-text" style={{ color: endColor }}>{rpFmtDate(endIso)}</span>
                    )}
                    {isTodayEnd && <span className="rp-today-pill">TODAY</span>}
                  </td>
                  <td className="rp-tw-cell" style={colStyle('project')}>
                    <div className="rp-tw-project" title={project}>
                      <span className="rp-proj-dot" style={{ background: projectColors[project] || '#6b7280' }}/>
                      <span className="rp-tw-trunc">{project}</span>
                    </div>
                  </td>
                  <td className="rp-tw-cell" style={colStyle('task')}>
                    <div className="rp-tw-task-wrap" title={task}>
                      <span className="rp-tw-trunc rp-tw-task">{task}</span>
                      {lateToStart && <span className="rp-tw-overdue-flag">OVERDUE</span>}
                    </div>
                  </td>
                  <td className={`rp-tw-cell rp-tw-owner${unassigned ? ' is-unassigned' : ''}`} style={colStyle('owner')} title={owner}>
                    <span className="rp-tw-trunc">{owner}</span>
                  </td>
                  <td className="rp-tw-cell" style={colStyle('phase')}>
                    <span className="rp-mini-pill" style={{ background: pp.bg, color: pp.fg }}>{phase}</span>
                  </td>
                  <td className="rp-tw-cell" style={colStyle('status')}>
                    <span className="rp-mini-pill" style={{ background: sp.bg, color: sp.fg }}>{sp.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 6 — Weekly timeline (Gantt strip)
// ════════════════════════════════════════════════════════════════════
const WEEK_DAYS = [
  { label: 'Mon 18', date: 'May 18' },
  { label: 'Tue 19', date: 'May 19' },
  { label: 'Wed 20', date: 'May 20' },
  { label: 'Thu 21', date: 'May 21' },
  { label: 'Fri 22', date: 'May 22' },
  { label: 'Sat 23', date: 'May 23' },
  { label: 'Sun 24', date: 'May 24' },
];

function WeeklyTimeline({ projectColors, allTasks }){
  // Group tasks by owner, then by day index (using END date within current week).
  const byOwner = useMemo_r(() => {
    const out = {};
    THIS_WEEK_TASKS.forEach(([, endIso, project, , owner]) => {
      const d = new Date(endIso + 'T00:00:00');
      const dayIdx = (d >= RP_WEEK_START && d <= RP_WEEK_END)
        ? rpDaysBetween(d, RP_WEEK_START)
        : -1;
      if (dayIdx < 0) return;
      if (!out[owner]) out[owner] = [];
      out[owner].push({ dayIdx, project });
    });
    return out;
  }, []);

  const owners = ['Najlae Hamdoun', 'Lama Al sheikh', 'Lujain Alasadi', 'Unassigned']
    .filter(o => byOwner[o] && byOwner[o].length);

  // ── Hover popup: list every task (across portfolio) for this (owner, project)
  const [hover, setHover] = useState_r(null); // { owner, project, x, y }
  const hideTimer = React.useRef(null);
  const showTimer = React.useRef(null);

  const popupRows = useMemo_r(() => {
    if (!hover) return [];
    return (allTasks || [])
      .filter(t => t.owner === hover.owner && t.project === hover.project);
  }, [hover, allTasks]);

  const cancelHide = () => { if (hideTimer.current){ clearTimeout(hideTimer.current); hideTimer.current = null; } };
  const cancelShow = () => { if (showTimer.current){ clearTimeout(showTimer.current); showTimer.current = null; } };

  const queueShow = (owner, project, evt) => {
    cancelHide();
    cancelShow();
    const rect = evt.currentTarget.getBoundingClientRect();
    const anchorX = rect.left + rect.width / 2;
    const anchorY = rect.top;
    showTimer.current = setTimeout(() => {
      setHover({ owner, project, x: anchorX, y: anchorY });
    }, 150);
  };
  const queueHide = () => {
    cancelShow();
    hideTimer.current = setTimeout(() => setHover(null), 200);
  };

  return (
    <section className="rp-card">
      <RPTitle text="Weekly timeline" subtitle="tasks plotted across the week · hover any bar for the full task list"/>
      <div className="rp-gantt">
        <div className="rp-gantt-grid">
          <div className="rp-gantt-axis"/>
          {WEEK_DAYS.map((d, i) => (
            <div key={d.label} className={`rp-gantt-col-h${i === 1 ? ' is-today' : ''}`}>
              <span className="rp-gantt-daylabel">{d.label}</span>
              {i === 1 && <span className="rp-gantt-today-tag">TODAY</span>}
            </div>
          ))}
        </div>

        {owners.map(owner => {
          // Group same-day bars to stack neatly. NO cap — show every bar.
          const byDay = Array.from({ length: 7 }, () => []);
          byOwner[owner].forEach(t => byDay[t.dayIdx].push(t));
          const isUnassigned = owner === 'Unassigned';
          return (
            <div key={owner} className="rp-gantt-row">
              <div className="rp-gantt-axis">
                <span className={isUnassigned ? 'rp-axis-unassigned' : ''}>{owner}</span>
              </div>
              {byDay.map((tasks, i) => (
                <div key={i} className={`rp-gantt-col${i === 1 ? ' is-today' : ''}`}>
                  {tasks.map((t, j) => {
                    const c = projectColors[t.project] || '#6b7280';
                    return (
                      <div
                        key={j}
                        className={`rp-gantt-bar${isUnassigned ? ' is-unassigned' : ''}`}
                        style={isUnassigned
                          ? { background: '#f3f4f6', color: '#374151', borderColor: '#9ca3af' }
                          : { background: c }}
                        title={`${t.project}`}
                        onMouseEnter={(e) => queueShow(owner, t.project, e)}
                        onMouseLeave={queueHide}
                      >
                        {t.project}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {hover && popupRows.length > 0 && (
        <div
          className="rp-tl-popup"
          style={{ left: hover.x, top: hover.y }}
          onMouseEnter={cancelHide}
          onMouseLeave={queueHide}
          role="tooltip"
        >
          <div className="rp-tl-popup-h">
            <span className="rp-tl-popup-title">{hover.project} · {hover.owner}</span>
            <span className="rp-tl-popup-count">{popupRows.length} task{popupRows.length === 1 ? '' : 's'}</span>
          </div>
          <div className="rp-tl-popup-table-wrap">
            <table className="rp-tl-popup-table">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Project</th>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Phase</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {popupRows.map((r, i) => {
                  const sp = STATUS_PILL[r.status] || STATUS_PILL.not_started;
                  const pp = PHASE_PILL[r.phaseLabel] || PHASE_PILL.Foundation;
                  return (
                    <tr key={i}>
                      <td>{r.startIso ? rpFmtDate(r.startIso) : '—'}</td>
                      <td>{r.endIso ? rpFmtDate(r.endIso) : '—'}</td>
                      <td>
                        <span className="rp-proj-dot" style={{ background: projectColors[r.project] || '#6b7280' }}/>
                        {r.project}
                      </td>
                      <td title={r.name}>{r.name || '—'}</td>
                      <td>{r.owner || 'Unassigned'}</td>
                      <td><span className="rp-mini-pill" style={{ background: pp.bg, color: pp.fg }}>{r.phaseLabel}</span></td>
                      <td><span className="rp-mini-pill" style={{ background: sp.bg, color: sp.fg }}>{sp.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <span className="rp-tl-popup-arrow" aria-hidden="true"/>
        </div>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 7 — Workload heatmap (owner × project)
// ════════════════════════════════════════════════════════════════════
function WorkloadHeatmap({ allTasks }){
  // Build a key for a date's Monday-of-week (00:00).
  const startOfWeek = (d) => {
    const x = new Date(d);
    const dow = x.getDay(); // 0=Sun
    const diff = (dow === 0 ? -6 : 1 - dow); // back to Monday
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() + diff);
    return x;
  };

  const TODAY = RP_TODAY;
  const initialMonday = startOfWeek(TODAY);
  const [weekStart, setWeekStart] = useState_r(initialMonday);

  const weekEnd = useMemo_r(() => {
    const e = new Date(weekStart);
    e.setDate(e.getDate() + 6);
    return e;
  }, [weekStart]);

  const rangeLabel = `${RP_MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${RP_MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  const isCurrentWeek = weekStart.getTime() === initialMonday.getTime();

  // Filter to assigned tasks whose START or END falls in [weekStart, weekEnd].
  const matrix = useMemo_r(() => {
    const ownerTotals = {};
    const projTotals  = {};
    const cells = {};
    (allTasks || []).forEach(t => {
      const o = t.owner; if (!o) return;
      const s = t.startIso ? new Date(t.startIso + 'T00:00:00') : null;
      const e = t.endIso   ? new Date(t.endIso   + 'T00:00:00') : null;
      const inWeek = (d) => d && d >= weekStart && d <= weekEnd;
      if (!inWeek(s) && !inWeek(e)) return;
      const p = t.project;
      const k = o + '||' + p;
      cells[k] = (cells[k] || 0) + 1;
      ownerTotals[o] = (ownerTotals[o] || 0) + 1;
      projTotals[p]  = (projTotals[p]  || 0) + 1;
    });
    const owners = Object.entries(ownerTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([o]) => o);
    const projectNames = Object.entries(projTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([p]) => p);
    return { owners, projectNames, cells, ownerTotals, projTotals };
  }, [allTasks, weekStart, weekEnd]);

  // Workload color scale (weekly, per-cell counts):
  // 0 = empty · 1 light · 2 ok · 3 moderate · 4-5 heavy · 6+ overload
  const bg = (n) => {
    if (n === 0) return { background: '#ffffff', border: '1px solid #e5e7eb', color: 'transparent' };
    if (n === 1) return { background: '#d1fae5', color: '#065f46' };
    if (n === 2) return { background: '#6ee7b7', color: '#064e3b' };
    if (n === 3) return { background: '#fbbf24', color: '#78350f' };
    if (n <= 5)  return { background: '#f97316', color: '#ffffff' };
    return            { background: '#dc2626', color: '#ffffff', fontWeight: 800 };
  };

  const shiftWeek = (days) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + days);
    setWeekStart(next);
  };
  const goToday = () => setWeekStart(initialMonday);

  const grandTotal = matrix.owners.reduce((s, o) => s + (matrix.ownerTotals[o] || 0), 0);
  const truncate = (s, n = 10) => s.length > n ? s.slice(0, n - 1) + '…' : s;

  return (
    <section className="rp-card">
      <RPTitle
        text="Workload heatmap"
        subtitle="weekly task counts · assigned only · auto-updates by week"
      />
      <div className="rp-heat-nav">
        <button type="button" className="rp-heat-nav-btn" onClick={() => shiftWeek(-7)} aria-label="Previous week">←</button>
        <span className="rp-heat-nav-label">{rangeLabel}</span>
        <button type="button" className="rp-heat-nav-btn" onClick={() => shiftWeek(7)} aria-label="Next week">→</button>
        <button
          type="button"
          className={`rp-heat-nav-today${isCurrentWeek ? ' is-current' : ''}`}
          onClick={goToday}
          disabled={isCurrentWeek}
        >This week</button>
      </div>

      {matrix.owners.length === 0 ? (
        <div className="rp-heat-empty">No assigned tasks scheduled this week.</div>
      ) : (
        <>
          <div className="rp-heat-wrap">
            <table className="rp-heat">
              <thead>
                <tr>
                  <th className="rp-heat-corner"></th>
                  {matrix.projectNames.map(p => (
                    <th key={p} className="rp-heat-col-h" title={p}>
                      <span>{truncate(p, 10)}</span>
                    </th>
                  ))}
                  <th className="rp-heat-total-h">Σ</th>
                </tr>
              </thead>
              <tbody>
                {matrix.owners.map(o => (
                  <tr key={o}>
                    <th className="rp-heat-row-h">{o}</th>
                    {matrix.projectNames.map(p => {
                      const n = matrix.cells[o + '||' + p] || 0;
                      return (
                        <td key={p} className="rp-heat-cell" style={bg(n)} title={`${o} · ${p}: ${n}`}>
                          {n > 0 ? n : ''}
                        </td>
                      );
                    })}
                    <td className="rp-heat-total">{matrix.ownerTotals[o] || 0}</td>
                  </tr>
                ))}
                <tr className="rp-heat-foot">
                  <th className="rp-heat-row-h">Σ</th>
                  {matrix.projectNames.map(p => (
                    <td key={p} className="rp-heat-total">{matrix.projTotals[p] || 0}</td>
                  ))}
                  <td className="rp-heat-total rp-heat-grand">{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="rp-heat-legend">
            <li><span className="rp-heat-swatch" style={{ background:'#d1fae5' }}/> 1 Light</li>
            <li><span className="rp-heat-swatch" style={{ background:'#6ee7b7' }}/> 2 OK</li>
            <li><span className="rp-heat-swatch" style={{ background:'#fbbf24' }}/> 3 Moderate</li>
            <li><span className="rp-heat-swatch" style={{ background:'#f97316' }}/> 4–5 Heavy</li>
            <li><span className="rp-heat-swatch" style={{ background:'#dc2626' }}/> 6+ Overload</li>
          </ul>
        </>
      )}
    </section>
  );
}

// ─── Unassigned alert + drawer ──────────────────────────────────────
function UnassignedAlert({ count, onOpen }){
  return (
    <div className="rp-unassigned-alert">
      <span className="rp-unassigned-accent" aria-hidden="true"/>
      <div className="rp-unassigned-body">
        <span className="rp-unassigned-icon" aria-hidden="true">⚠</span>
        <strong>{count.toLocaleString()} tasks are unassigned</strong>
        <span className="rp-unassigned-sub">across the portfolio · Assign owners to unblock workload visibility</span>
      </div>
      <a className="rp-unassigned-link" href="#" onClick={(e) => { e.preventDefault(); onOpen && onOpen(); }}>
        View unassigned tasks →
      </a>
    </div>
  );
}

function UnassignedDrawer({ open, onClose, tasks, projectColors }){
  const [query, setQuery]   = useState_r('');
  const [scope, setScope]   = useState_r('all'); // all|phase|project|priority
  const [collapsed, setCollapsed] = useState_r({ Foundation: false, Activation: false, Growth: false, Discovery: false, Other: false });

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Map raw phase to drawer-group label. Reports lumps Discovery into Foundation
  // elsewhere, but the drawer surfaces both as distinct groups.
  const groupOf = (raw) => {
    const v = (raw || '').toLowerCase();
    if (v.includes('discov')) return 'Discovery';
    if (v.includes('found')) return 'Foundation';
    if (v.includes('activ')) return 'Activation';
    if (v.includes('growth')) return 'Growth';
    return 'Other';
  };

  const groupedFiltered = useMemo_r(() => {
    const q = query.trim().toLowerCase();
    const groups = { Foundation: [], Activation: [], Growth: [], Discovery: [], Other: [] };
    (tasks || []).forEach(t => {
      const g = groupOf(t.phase);
      if (q){
        const blob = `${t.name} ${t.project} ${t.priority} ${t.status}`.toLowerCase();
        if (!blob.includes(q)) return;
      }
      groups[g].push(t);
    });
    return groups;
  }, [tasks, query]);

  const order = ['Foundation', 'Activation', 'Growth', 'Discovery', 'Other'];

  return (
    <>
      <div
        className={`rp-drawer-backdrop${open ? ' on' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside className={`rp-drawer${open ? ' on' : ''}`} role="dialog" aria-label="Unassigned tasks">
        <header className="rp-drawer-head">
          <div className="rp-drawer-title-row">
            <h2 className="rp-drawer-title">Unassigned Tasks <span className="rp-drawer-count">· {(tasks || []).length.toLocaleString()} total</span></h2>
            <button className="rp-drawer-close" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className="rp-drawer-controls">
            <input
              className="rp-drawer-search"
              placeholder="Search tasks, projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="rp-drawer-chips" role="tablist">
              {['Phase','Project','Priority'].map(k => (
                <button key={k}
                  className={`rp-drawer-chip${scope === k.toLowerCase() ? ' on' : ''}`}
                  onClick={() => setScope(s => s === k.toLowerCase() ? 'all' : k.toLowerCase())}
                >{k}</button>
              ))}
            </div>
          </div>
        </header>

        <div className="rp-drawer-body">
          {order.map(g => {
            const rows = groupedFiltered[g] || [];
            if (rows.length === 0) return null;
            const isCol = collapsed[g];
            return (
              <section key={g} className={`rp-ug rp-ug-${g.toLowerCase()}`}>
                <header
                  className="rp-ug-head"
                  onClick={() => setCollapsed(c => ({ ...c, [g]: !c[g] }))}
                  role="button"
                  aria-expanded={!isCol}
                >
                  <span className="rp-ug-name">{g}</span>
                  <span className="rp-ug-count">{rows.length} tasks</span>
                  <span className={`rp-ug-chev${isCol ? '' : ' open'}`}>▾</span>
                </header>
                {!isCol && (
                  <div className="rp-ug-table-wrap">
                    <table className="rp-ug-table">
                      <colgroup>
                        <col style={{ width:'34px' }}/>
                        <col style={{ width:'260px' }}/>
                        <col style={{ width:'140px' }}/>
                        <col style={{ width:'90px' }}/>
                        <col style={{ width:'100px' }}/>
                        <col style={{ width:'100px' }}/>
                        <col style={{ width:'140px' }}/>
                      </colgroup>
                      <thead>
                        <tr>
                          <th></th>
                          <th>Task</th>
                          <th>Project</th>
                          <th>Priority</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((t, i) => {
                          const sp = STATUS_PILL[t.status] || STATUS_PILL.not_started;
                          return (
                            <tr key={t.id || i}>
                              <td><input type="checkbox"/></td>
                              <td className="rp-ug-task" title={t.name}>{t.name || '—'}</td>
                              <td>
                                <span className="rp-proj-dot" style={{ background: projectColors[t.project] || '#6b7280' }}/>
                                {t.project}
                              </td>
                              <td>{t.priority || '—'}</td>
                              <td>{t.startIso ? rpFmtDate(t.startIso) : '—'}</td>
                              <td>{t.endIso ? rpFmtDate(t.endIso) : '—'}</td>
                              <td><span className="rp-mini-pill" style={{ background: sp.bg, color: sp.fg }}>{sp.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </aside>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 8 — Team workload (preserved as last card)
// ════════════════════════════════════════════════════════════════════
function TeamWorkloadLegacy(){
  // Counts preserved from the prior widget so the panel reads identically.
  const ownerList = [
    { name: 'Haiyan Alsaiyed',  value: 5, color: 'oklch(58% .14 38)'  },
    { name: 'TBC',              value: 3, color: 'oklch(60% .12 235)' },
    { name: 'Sinan Hatahet',    value: 2, color: 'oklch(58% .12 145)' },
    { name: 'Karam Tekin',      value: 2, color: 'oklch(45% .10 340)' },
    { name: 'Maysarah Mishaal', value: 2, color: 'oklch(72% .14 65)'  },
    { name: 'Amjed Kurdi',      value: 1, color: 'oklch(55% .11 280)' },
  ];
  const maxOwner = Math.max(...ownerList.map(o => o.value));
  return (
    <section className="rp-card">
      <RPTitle text="Team workload" subtitle="engagements per owner"/>
      <div className="list-stack">
        {ownerList.map(o => (
          <div key={o.name} className="list-row" style={{ '--c': o.color }}>
            <span className="lr-dot"></span>
            <span className="lr-name">{o.name}</span>
            <span className="lr-bar"><span style={{ width: `${(o.value / maxOwner) * 100}%` }}/></span>
            <span className="lr-v">{o.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// Reports page — assembles all 8 sections.
// ════════════════════════════════════════════════════════════════════
function Reports({ onOpenClient }){
  const [unassignedOpen, setUnassignedOpen] = useState_r(false);
  // ── Aggregate every task in the portfolio from REAL_TASKS ────────
  const { allTasks, projects, projectColors, projToClient, unassignedCount } = useMemo_r(() => {
    const phaseLabel = (raw) => {
      const v = (raw || '').toLowerCase();
      if (v.includes('found') || v.includes('discov')) return 'Foundation';
      if (v.includes('activ')) return 'Activation';
      if (v.includes('growth')) return 'Growth';
      return 'Foundation';
    };
    const norm = (s) => {
      const v = (s || '').toLowerCase();
      if (v.includes('compl') || v === 'done') return 'completed';
      if (v.includes('progress') || v === 'in_progress' || v === 'doing') return 'in_progress';
      if (v.includes('hold')) return 'on_hold';
      return 'not_started';
    };

    const all = [];
    const projMap = {};
    const projToClient = {};
    let unassignedCount = 0;

    (window.CLIENTS || []).forEach(c => {
      const raw = (window.REAL_TASKS || {})[c.id] || [];
      raw.forEach(t => {
        const status = norm(t.status);
        const phase  = phaseLabel(t.phase);
        const proj   = t.project || c.name;
        const owner  = (t.owner || '').trim();
        if (!owner) unassignedCount++;
        all.push({
          id:        t.id || `${c.id}-${all.length}`,
          clientId:  c.id,
          project:   proj,
          name:      t.name || '',
          owner,
          startIso:  t.start || '',
          endIso:    t.end || '',
          priority:  t.priority || '',
          phase:     t.phase || '',
          status,
          phaseLabel: phase,
        });
        if (!projMap[proj]){
          projMap[proj] = { name: proj, total: 0, completed: 0, in_progress: 0, on_hold: 0, not_started: 0 };
        }
        projMap[proj].total++;
        projMap[proj][status]++;
        if (!projToClient[proj.toLowerCase()]) projToClient[proj.toLowerCase()] = c.id;
      });
    });

    const projList = Object.values(projMap).sort((a, b) => a.name.localeCompare(b.name));
    const colors = {};
    projList.forEach((p, i) => { colors[p.name] = RP_PROJECT_COLOR_LIST[i % RP_PROJECT_COLOR_LIST.length]; });

    return { allTasks: all, projects: projList, projectColors: colors, projToClient, unassignedCount };
  }, []);

  // Open the project page (ClientDetail drawer) for a given project name.
  const openProject = (projectName) => {
    if (!onOpenClient) return;
    const cid = projToClient[(projectName || '').toLowerCase()];
    const client = (window.CLIENTS || []).find(c => c.id === cid);
    if (client) onOpenClient(client);
  };

  const unassignedTasks = useMemo_r(() => allTasks.filter(t => !t.owner), [allTasks]);

  return (
    <div className="reports-page">
      <ReportsHero kpis={{
        projects: 23,
        cells: [
          { value: '1,565', label: 'Total Tasks' },
          { value: '23',    label: 'Portfolio Projects' },
          { value: '24%',   label: 'Overall Completion' },
        ],
      }}/>

      <ExecSummary unassigned={unassignedCount}/>

      <div className="rp-row rp-row-2col">
        <PhaseDistribution tasks={allTasks}/>
        <ProjectHealth projects={projects}/>
      </div>

      <AtRisk projects={projects} onOpenProject={openProject}/>

      <UnassignedAlert
        count={unassignedCount || 1013}
        onOpen={() => setUnassignedOpen(true)}
      />

      <ThisWeek projectColors={projectColors}/>

      <WeeklyTimeline projectColors={projectColors} allTasks={allTasks}/>

      <WorkloadHeatmap allTasks={allTasks}/>

      <TeamWorkloadLegacy/>

      <UnassignedDrawer
        open={unassignedOpen}
        onClose={() => setUnassignedOpen(false)}
        tasks={unassignedTasks}
        projectColors={projectColors}
      />
    </div>
  );
}

export { Reports };
