import React from 'react';
import { Icon } from '../components/ui.jsx';
import { useLang } from '../lib/i18n.jsx';
import { logoSrc } from '../logos/index.js';
import {
  CHANGE_EVENT, STATUS, PRIORITY, FORMAT,
  load, fmtDeadline, daysUntil, isOverdue, monthKey, monthLabel,
} from '../data/design-reviews.js';

const { useState, useMemo, useEffect } = React;

// Design Review — creative review and approval for work made in Figma.
//
// Figma owns the artwork, Workiom owns briefs and deadlines, Pinterest owns
// references. This module owns one thing: is the design approved, and if not,
// what has to change. Nothing here edits a design.

// ─── Project lookup ───────────────────────────────────────────────────
// Reads the same client records as the rest of the tracker, so a design's
// project is the project, not a copy of it.
function useProjects(){
  return useMemo(() => {
    const map = {};
    (window.CLIENTS || []).forEach(c => { map[c.id] = c; });
    return map;
  }, []);
}

// ─── Small shared pieces ──────────────────────────────────────────────
function StatusPill({ status }){
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className="dr-pill" style={{
      '--p': s.color,
      background: `color-mix(in oklab, ${s.color} 13%, white)`,
      color: s.color,
      borderColor: `color-mix(in oklab, ${s.color} 30%, transparent)`,
    }}>{s.label}</span>
  );
}

function PriorityDot({ priority }){
  const p = PRIORITY[priority];
  if (!p) return null;
  return (
    <span className="dr-prio" title={`${p.label} priority`}>
      <span className="dr-prio-dot" style={{ background: p.color }}/>
      {p.label}
    </span>
  );
}

function DeadlineChip({ row }){
  const days = daysUntil(row.deadline);
  const over = isOverdue(row);
  const soon = !over && days != null && days <= 2;
  const label = over ? `${Math.abs(days)}d overdue`
    : days === 0 ? 'Due today'
    : days === 1 ? 'Due tomorrow'
    : fmtDeadline(row.deadline);
  return (
    <span className={`dr-deadline ${over ? 'over' : soon ? 'soon' : ''}`}>
      <Icon.Calendar/> {label}
    </span>
  );
}

// The artwork frame. A connected Figma thumbnail renders here; until then the
// frame states plainly that no preview is connected rather than standing in
// for artwork nobody has seen.
function DesignPreview({ row, project }){
  const ratio = (FORMAT[row.format] || FORMAT.square).ratio;
  const logo = project ? logoSrc(project.id) : '';
  return (
    <div className="dr-preview" style={{ aspectRatio: ratio }}>
      {row.thumbnailUrl ? (
        <img className="dr-preview-img" src={row.thumbnailUrl} alt={`${row.postId} preview`}/>
      ) : (
        <div className="dr-preview-empty">
          {logo && <img className="dr-preview-logo" src={logo} alt="" aria-hidden="true"/>}
          <span className="dr-preview-note">No Figma preview connected</span>
          <span className="dr-preview-fmt">{(FORMAT[row.format] || {}).label}</span>
        </div>
      )}
      <span className="dr-preview-platform">{row.platform}</span>
      <span className="dr-preview-ver">{row.figmaVersion}</span>
    </div>
  );
}

// ─── Design card ──────────────────────────────────────────────────────
function DesignCard({ row, project }){
  const stripe = project ? project.color : 'var(--nhj-blue)';
  return (
    <article className="card dr-card" style={{ '--c': stripe }}>
      <DesignPreview row={row} project={project}/>

      <div className="dr-card-body">
        <div className="dr-card-top">
          <span className="dr-postid">{row.postId}</span>
          <StatusPill status={row.status}/>
        </div>

        <h3 className="dr-title">{row.title}</h3>
        <div className="dr-project">
          <span className="dr-project-dot" style={{ background: stripe }}/>
          {project ? project.name : row.projectId}
          {row.campaign && <span className="dr-campaign"> · {row.campaign}</span>}
        </div>

        <div className="dr-meta">
          <span className="dr-meta-i"><Icon.User/> {row.designer}</span>
          <DeadlineChip row={row}/>
          <PriorityDot priority={row.priority}/>
        </div>

        <div className="dr-card-foot">
          {row.figmaUrl ? (
            <a className="btn-ghost dr-figma" href={row.figmaUrl} target="_blank" rel="noreferrer">
              <Icon.Link/> Open in Figma
            </a>
          ) : (
            <span className="dr-figma-none" title="No Figma file linked to this design yet">
              <Icon.Link/> Figma not linked
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────
function Select({ label, value, onChange, options }){
  return (
    <label className="dr-select">
      <span className="dr-select-l">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
function DesignReview(){
  const { t } = useLang();
  const projects = useProjects();
  const [rows, setRows] = useState(() => load());

  // Reload when another part of the app writes to the store.
  useEffect(() => {
    const on = () => setRows(load());
    window.addEventListener(CHANGE_EVENT, on);
    return () => window.removeEventListener(CHANGE_EVENT, on);
  }, []);

  const [status, setStatus]     = useState('queue');
  const [project, setProject]   = useState('');
  const [designer, setDesigner] = useState('');
  const [platform, setPlatform] = useState('');
  const [month, setMonth]       = useState('');

  // Filter options come from the records on hand, so a filter never offers a
  // value that would return nothing.
  const options = useMemo(() => {
    const uniq = (list) => [...new Set(list.filter(Boolean))].sort();
    return {
      projects: uniq(rows.map(r => r.projectId))
        .map(id => ({ value: id, label: (projects[id] || {}).name || id })),
      designers: uniq(rows.map(r => r.designer)).map(v => ({ value: v, label: v })),
      platforms: uniq(rows.map(r => r.platform)).map(v => ({ value: v, label: v })),
      months: uniq(rows.map(r => monthKey(r.deadline)))
        .map(v => ({ value: v, label: monthLabel(v) })),
    };
  }, [rows, projects]);

  const scoped = useMemo(() => rows.filter(r =>
    (!project  || r.projectId === project) &&
    (!designer || r.designer === designer) &&
    (!platform || r.platform === platform) &&
    (!month    || monthKey(r.deadline) === month)
  ), [rows, project, designer, platform, month]);

  const kpis = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return {
      review:   scoped.filter(r => r.status === 'ready_for_review').length,
      revision: scoped.filter(r => r.status === 'revision').length,
      approved: scoped.filter(r => r.status === 'approved'
                              && new Date(r.updatedAt).getTime() >= weekAgo).length,
      overdue:  scoped.filter(r => isOverdue(r)).length,
    };
  }, [scoped]);

  const counts = useMemo(() => {
    const c = { queue: 0, all: scoped.length };
    Object.keys(STATUS).forEach(k => { c[k] = 0; });
    scoped.forEach(r => { if (c[r.status] != null) c[r.status]++; });
    c.queue = c.ready_for_review + c.revision;
    return c;
  }, [scoped]);

  // The queue is what is waiting on a person: submitted for review, or sent
  // back and not yet resubmitted. Deadline order, soonest first.
  const visible = useMemo(() => {
    const byDeadline = (a, b) => String(a.deadline).localeCompare(String(b.deadline));
    if (status === 'queue') {
      return scoped.filter(r => r.status === 'ready_for_review' || r.status === 'revision')
                   .sort(byDeadline);
    }
    if (status === 'all') return [...scoped].sort(byDeadline);
    return scoped.filter(r => r.status === status).sort(byDeadline);
  }, [scoped, status]);

  const filtersOn = project || designer || platform || month;
  const clearFilters = () => { setProject(''); setDesigner(''); setPlatform(''); setMonth(''); };

  const KPI_CELLS = [
    { k: 'review',   v: kpis.review,   l: 'Needs Review',      c: STATUS.ready_for_review.color },
    { k: 'revision', v: kpis.revision, l: 'Revision Required', c: STATUS.revision.color },
    { k: 'approved', v: kpis.approved, l: 'Approved This Week',c: STATUS.approved.color },
    { k: 'overdue',  v: kpis.overdue,  l: 'Overdue',           c: 'oklch(50% .18 25)' },
  ];

  const CHIPS = [
    { k: 'queue',            l: 'Needs Your Review', color: STATUS.ready_for_review.color },
    { k: 'designing',        l: STATUS.designing.label,  color: STATUS.designing.color },
    { k: 'revision',         l: STATUS.revision.label,   color: STATUS.revision.color },
    { k: 'approved',         l: STATUS.approved.label,   color: STATUS.approved.color },
    { k: 'all',              l: 'All designs',           color: 'oklch(50% .02 250)' },
  ];

  return (
    <>
      <div className="hero dr-hero">
        <div className="hero-orb b" aria-hidden></div>
        <div className="hero-orb" aria-hidden></div>
        <div className="hero-text">
          <div className="hero-eyebrow">{t('hero_eyebrow')}</div>
          <h1>Design <em>Review</em></h1>
          <div className="hero-sub">
            Review, approve and track creative outputs across all NHJ projects.
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="v">{kpis.review}</div>
            <div className="l">Awaiting You</div>
          </div>
          <div className="hero-stat">
            <div className="v">{counts.all}</div>
            <div className="l">In Review Cycle</div>
          </div>
        </div>
      </div>

      {/* Same KPI strip the Reports view uses. */}
      <section className="rp-card rp-exec dr-kpis">
        <div className="rp-exec-row dr-kpi-row">
          {KPI_CELLS.map((c, i) => (
            <div key={c.k} className={`rp-exec-cell${i > 0 ? ' has-div' : ''}`}>
              <span className="rp-exec-accent" style={{ background: c.c }}/>
              <div className="rp-exec-v">{c.v}</div>
              <div className="rp-exec-l">{c.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rp-card dr-panel">
        <header className="rp-card-h dr-panel-h">
          <div>
            <h3 className="rp-card-title">
              Needs your <em className="rp-card-em" style={{ color: 'var(--nhj-blue)' }}>review</em>
            </h3>
            <p className="rp-card-sub">
              Designs are made in Figma. This is where they are reviewed, sent back or approved.
            </p>
          </div>
        </header>

        <div className="dr-filters">
          <div className="tt-status-filter dr-chips">
            {CHIPS.map(c => (
              <button key={c.k} type="button"
                      className={`tt-status-pill ${status === c.k ? 'on' : ''}`}
                      style={{ '--p': c.color }}
                      onClick={() => setStatus(c.k)}>
                {c.l}<span className="tt-status-count">{counts[c.k] || 0}</span>
              </button>
            ))}
          </div>

          <div className="dr-selects">
            <Select label="Project"  value={project}  onChange={setProject}  options={options.projects}/>
            <Select label="Designer" value={designer} onChange={setDesigner} options={options.designers}/>
            <Select label="Platform" value={platform} onChange={setPlatform} options={options.platforms}/>
            <Select label="Month"    value={month}    onChange={setMonth}    options={options.months}/>
            {filtersOn && (
              <button type="button" className="btn-ghost dr-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="dr-empty">
            <div className="dr-empty-t">Nothing here.</div>
            <div className="dr-empty-s">
              {filtersOn ? 'Try clearing a filter.' : 'No designs are waiting on a review right now.'}
            </div>
          </div>
        ) : (
          <div className="dr-grid">
            {visible.map(row => (
              <DesignCard key={row.id} row={row} project={projects[row.projectId]}/>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export { DesignReview };
