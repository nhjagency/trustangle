import React from 'react';
import ReactDOM from 'react-dom';
import { Portal, Icon, Pill, shortDate, TeamAvatar } from '../components/ui.jsx';
import { useLang } from '../lib/i18n.jsx';
import { useEdit, EditableText, EditFrame } from '../lib/editable.jsx';
import { logoSrc } from '../logos/index.js';

const { useState, useMemo, useEffect } = React;

// Tiny country flag — accepts "SA", "SY", or "SA/SY"
function CountryFlags({ region }){
  if (!region) return null;
  const codes = String(region).split(/[\/,]/).map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 2);
  return (
    <span className="card-flags" aria-hidden="true">
      {codes.map(code => (
        <img key={code}
             className="card-flag"
             src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
             alt={code}/>
      ))}
    </span>
  );
}

// Live task counts read from REAL_TASKS + per-client localStorage overrides
function useLiveCounts(clientId, defaults = {}){
  return useMemo(() => {
    let rows = null;
    try {
      const saved = localStorage.getItem(`nhj-tasktable-${clientId}`);
      if (saved) rows = JSON.parse(saved).rows;
    } catch (e) {}
    if (!rows) rows = window.REAL_TASKS?.[clientId] || [];
    const total = rows.length;
    if (!total) return { complete: defaults.complete ?? 0, inProgress: defaults.inProgress ?? 0, total: 0 };
    const completed = rows.filter(r => r.status === 'completed').length;
    const inProgress = rows.filter(r => r.status === 'in_progress').length;
    return {
      complete: Math.round((completed / total) * 100),
      inProgress,
      total,
    };
  // re-read on tick of clientId or when storage changes
  }, [clientId]);
}

// Map client.phase → top-stripe color (C3)
const PHASE_STRIPE = {
  foundation: 'var(--nhj-blue)',
  activation: 'var(--whj-orange)',
  growth:     'var(--rwj-green)',
};

function EngagementCard({ c, onOpen, onEdit, layout, animate }){
  const { t, lang } = useLang();
  const { editMode } = useEdit();
  const live = useLiveCounts(c.id, { complete: c.complete, inProgress: c.inProgress });
  const complete = live.complete;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!animate) { setProgress(complete); return; }
    const timer = setTimeout(() => setProgress(complete), 80);
    return () => clearTimeout(timer);
  }, [complete, animate]);

  const stagePillText = c.stage === 'Pending Signature' ? t('pill_pending_sig')
    : c.status === 'active' ? t('pill_active')
    : c.status === 'prospect' ? t('pill_prospect')
    : c.status === 'hold' ? t('pill_on_hold')
    : c.stage;

  const phaseColor = PHASE_STRIPE[c.phase] || c.color;

  return (
    <div className="card" style={{ '--c': phaseColor }} onClick={() => { if (!editMode) onOpen(c); }}>
      <div className="card-h">
        <div className="logo-slot" onClick={(e) => e.stopPropagation()}>
          <image-slot
            id={`logo-${c.id}`}
            shape="rounded"
            radius="7"
            fit="contain"
            src={logoSrc(c.id)}
            placeholder={c.short}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="card-id">
          <h3 className="card-title">
            <EditableText path={`client.${c.id}.name`} fallback={c.name}/>
          </h3>
        </div>
        <Pill status={c.status}>{stagePillText}</Pill>
      </div>

      {layout !== 'minimal' && c.status === 'active' && (
        <div className="progress">
          <div className="progress-bar"><span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}/></div>
        </div>
      )}

      <div className="card-stats">
        <div className="s">
          <div className="v">{complete}%</div>
          <div className="l">{t('card_complete')}</div>
        </div>
        <div className={`s ${live.inProgress ? 'alert' : ''}`}>
          <div className="v">{live.inProgress}</div>
          <div className="l">{t('card_in_progress')}</div>
        </div>
      </div>

      {layout !== 'minimal' && (
        <div className="card-foot">
          <span className="last">
            <CountryFlags region={c.region}/>
            {c.signedAt ? `${lang === 'ar' ? 'وُقّع' : 'Signed'} ${shortDate(c.signedAt)}` : c.holdReason || ''}
          </span>
          <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); onEdit(c); }}>
            <Icon.Edit/> {t('card_edit')}
          </button>
        </div>
      )}
    </div>
  );
}

function Hero({ variant, stats }){
  const { t } = useLang();
  if (variant === 'none') return null;
  return (
    <div className={`hero ${variant === 'slim' ? 'slim' : ''}`}>
      <div className="hero-orb b" aria-hidden></div>
      <div className="hero-orb" aria-hidden></div>
      <div className="hero-mark">
        <image-slot
          id="logo-nhj"
          shape="rounded"
          radius="14"
          fit="contain"
          src={logoSrc('nhj')}
          placeholder="NHJ"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div className="hero-text">
        <div className="hero-eyebrow">{t('hero_eyebrow')}</div>
        <h1>{t('hero_title_a')} <em>{t('hero_title_b')}</em></h1>
        <div className="hero-sub">{t('hero_sub', { n: stats.total })}</div>
      </div>
      {variant !== 'slim' && (
        <div className="hero-stats">
          <div className="hero-stat"><div className="v">{stats.active}</div><div className="l">{t('hero_stat_clients')}</div></div>
          <div className="hero-stat"><div className="v">{stats.pipeline}</div><div className="l">{t('hero_stat_pipeline')}</div></div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ tweaks, onOpenClient, onEdit }){
  const { t } = useLang();
  const [status, setStatus] = useState('all');
  const [region, setRegion] = useState(null);
  const [query, setQuery] = useState('');
  const all = window.CLIENTS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(c => {
      // B7: when search query is active, ignore status filter
      if (!q && status !== 'all' && c.status !== status) return false;
      if (region && !(c.region || '').toUpperCase().includes(region)) return false;
      if (q && !(
        c.name.toLowerCase().includes(q) ||
        (c.owner || '').toLowerCase().includes(q) ||
        (c.founder || '').toLowerCase().includes(q) ||
        (c.region || '').toLowerCase().includes(q) ||
        (c.leader || '').toLowerCase().includes(q) ||
        (c.phase || '').toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [status, region, query]);

  const totals = useMemo(() => ({
    total:    all.length,
    active:   all.filter(c => c.status === 'active').length,
    pending:  all.filter(c => c.status === 'pending').length,
    prospect: all.filter(c => c.status === 'prospect').length,
    hold:     all.filter(c => c.status === 'hold').length,
    pipeline: all.filter(c => c.status === 'prospect' || c.status === 'pending').length,
    attn:     all.reduce((s,c) => s + (c.attn || 0), 0),
  }), []);

  const sections = [
    { key: 'active',   label: t('sect_active_engagements'), filter: c => c.status === 'active' },
    { key: 'pending',  label: t('sect_pending'),            filter: c => c.status === 'pending' },
    { key: 'prospect', label: t('sect_prospects'),          filter: c => c.status === 'prospect' },
    { key: 'hold',     label: t('sect_on_hold'),            filter: c => c.status === 'hold' },
  ];

  return (
    <>
      <Hero variant={tweaks.hero} stats={totals}/>

      <HealthSnapshot all={all} region={region} setRegion={setRegion}/>

      <div className="dash-layout">
        <aside className="status-rail">
          <div className="status-rail-h">{t('filter_status')}</div>
          <div className="status-rail-list">
            {[
              { k: 'all',      l: t('filter_all'),      v: totals.total,    c: 'all' },
              { k: 'active',   l: t('filter_active'),   v: totals.active,   c: 'active' },
              { k: 'pending',  l: t('filter_pending'),  v: totals.pending,  c: 'pending' },
              { k: 'prospect', l: t('filter_prospect'), v: totals.prospect, c: 'prospect' },
              { k: 'hold',     l: t('filter_hold'),     v: totals.hold,     c: 'hold' },
            ].map(tab => (
              <button key={tab.k}
                      className={`status-item st-${tab.c} ${!query && status === tab.k ? 'on' : ''}`}
                      onClick={() => setStatus(tab.k)}>
                <span className="si-dot"></span>
                <span className="si-l">{tab.l}</span>
                <span className="si-v">{tab.v}</span>
              </button>
            ))}
          </div>
          <div className="status-rail-search">
            <Icon.Search/>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear">×</button>
            )}
          </div>
          {query && (
            <div className="status-rail-note">
              Searching across all clients
            </div>
          )}
          {region && (
            <div className="status-rail-note region-chip">
              <span className="region-chip-label">
                <img src={`https://flagcdn.com/${region.toLowerCase()}.svg`} alt={region}/>
                {region} · {region === 'SA' ? 'Saudi Arabia' : 'Syria'}
              </span>
              <button className="rail-clear" onClick={() => setRegion(null)} aria-label="Clear">×</button>
            </div>
          )}
        </aside>

        <div className="panel">
          <div className="panel-hd">
            <div className="panel-hd-l">
              <h2>{t('panel_portfolio_title')}</h2>
            </div>
            <div className="panel-hd-r">
              <button className="btn-primary accent" onClick={() => onEdit({
                id: 'new-' + Date.now(),
                name: 'New Client', short: 'nc', region: '', owner: '', leader: '',
                status: 'prospect', stage: 'Prospect', phase: 'foundation',
                color: 'var(--nhj-blue)', complete: 0, inProgress: 0, attn: 0, isNew: true,
              })}>
                <Icon.Plus/> {t('btn_new_engagement')}
              </button>
            </div>
          </div>
          <p className="panel-blurb">{t('panel_blurb')}</p>

        {(() => {
          // Flat list of cards — no per-status section header strips.
          // We still iterate `sections` in their original order (active →
          // pending → prospect → hold) so the visual order matches the
          // sidebar's listing, but render every card in ONE grid.
          const ordered = sections.flatMap(s => filtered.filter(s.filter));
          if (ordered.length === 0) return null;
          return (
            <EditFrame id="sect-flat" label="Engagements">
              <div className={`cards ${tweaks.layout}`}>
                {ordered.map(c => (
                  <EngagementCard key={c.id} c={c} onOpen={onOpenClient} onEdit={onEdit} layout={tweaks.layout} animate={true}/>
                ))}
              </div>
            </EditFrame>
          );
        })()}

        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>{t('no_matches')}</div>
            <div style={{ fontSize: 13 }}>{t('no_matches_sub')}</div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Dashboard grid editor — free drag, 8-handle resize, delete, add, persist
// Strict no-overlap: drops/resizes that would collide are refused (snap back).
// ═══════════════════════════════════════════════════════════════════════
const GRID_COLS = 12;
const GRID_GAP_PX = 16;
const GRID_ROW_MIN_PX = 110;
const LAYOUT_KEY = 'nhj-dashboard-layout-v3';
const LAYOUT_SNAP_KEY = 'nhj-dashboard-layout-v3-snap';
const DEFAULT_LAYOUT = {
  velocity: { id: 'velocity', title: 'Phase Velocity',    col: 1, colSpan: 6, row: 1, rowSpan: 2, visible: true },
  star:     { id: 'star',     title: 'Star Employee',     col: 7, colSpan: 6, row: 1, rowSpan: 2, visible: true },
  region:   { id: 'region',   title: 'Clients by Region', col: 1, colSpan: 5, row: 3, rowSpan: 2, visible: true },
  due:      { id: 'due',      title: 'Due — Work Weeks',  col: 6, colSpan: 7, row: 3, rowSpan: 2, visible: true },
};
const MIN_SPANS = {
  velocity: { col: 3, row: 1 },
  star:     { col: 4, row: 2 },
  region:   { col: 3, row: 1 },
  due:      { col: 5, row: 1 },
};

function loadLayout(){
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
    const merged = {};
    Object.keys(DEFAULT_LAYOUT).forEach(k => {
      merged[k] = { ...DEFAULT_LAYOUT[k], ...(saved[k] || {}) };
    });
    return merged;
  } catch (e) { return { ...DEFAULT_LAYOUT }; }
}
function saveLayout(layout){
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (e) {}
}

// ── Collision helpers ────────────────────────────────────────────────
function rectsOverlap(a, b){
  const aR = a.col + a.colSpan, bR = b.col + b.colSpan;
  const aB = a.row + a.rowSpan, bB = b.row + b.rowSpan;
  return !(aR <= b.col || bR <= a.col || aB <= b.row || bB <= a.row);
}
function collidesWithOthers(candidate, ownId, allLayout){
  return Object.values(allLayout).some(w =>
    w.visible && w.id !== ownId && rectsOverlap(candidate, w)
  );
}

function GridWidget({ id, layout, ghost, isDragging, isResizing, editMode, lang, onDragStart, onResizeStart, onDelete, children }){
  const w = layout[id];
  const g = ghost && ghost.id === id ? ghost : null;
  const eff = g || w;
  const style = {
    gridColumn: `${eff.col} / span ${eff.colSpan}`,
    gridRow:    `${eff.row} / span ${eff.rowSpan}`,
    zIndex: isDragging ? 100 : (isResizing ? 50 : 1),
  };
  const cls = [
    'gw',
    `gw-${id}`,
    editMode ? 'gw-editing' : '',
    isDragging ? 'gw-dragging' : '',
    isResizing ? 'gw-resizing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} style={style} data-widget={id}>
      {editMode && (
        <>
          {/* The whole header pill is draggable; the × button stops propagation. */}
          <div className="gw-bar" onPointerDown={(e) => {
                 if (e.target.closest('.gw-x')) return;
                 onDragStart(e, id);
               }}>
            <span className="gw-grip" aria-hidden="true">
              <svg viewBox="0 0 12 16" width="12" height="16">
                <circle cx="3" cy="3"  r="1.4"/><circle cx="9" cy="3"  r="1.4"/>
                <circle cx="3" cy="8"  r="1.4"/><circle cx="9" cy="8"  r="1.4"/>
                <circle cx="3" cy="13" r="1.4"/><circle cx="9" cy="13" r="1.4"/>
              </svg>
            </span>
            <span className="gw-title">{w.title}</span>
            <button className="gw-x" onClick={onDelete} aria-label="Remove widget" title="Remove">×</button>
          </div>
          {['n','s','e','w','ne','nw','se','sw'].map(dir => (
            <span key={dir}
                  className={`gw-resize gw-r-${dir} ${lang === 'ar' ? 'rtl' : ''}`}
                  onPointerDown={(e) => onResizeStart(e, id, dir)}/>
          ))}
        </>
      )}
      <div className="gw-content">{children}</div>
    </div>
  );
}

function GridGhost({ ghost }){
  if (!ghost) return null;
  return (
    <div className={`gw-ghost ${ghost.blocked ? 'blocked' : ''}`} style={{
      gridColumn: `${ghost.col} / span ${ghost.colSpan}`,
      gridRow:    `${ghost.row} / span ${ghost.rowSpan}`,
    }}/>
  );
}

function AddWidgetMenu({ hidden, onAdd, onClose }){
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div className="gw-add-menu" ref={ref}>
      <div className="gw-add-menu-h">Add a widget back</div>
      {hidden.length === 0 && (
        <div className="gw-add-empty">All widgets are visible.</div>
      )}
      {hidden.map(w => (
        <button key={w.id} className="gw-add-row" onClick={() => onAdd(w.id)}>
          <Icon.Plus/>
          <span>{w.title}</span>
        </button>
      ))}
    </div>
  );
}

function DashboardGrid({ all, region, setRegion }){
  const { editMode } = useEdit();
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const [layout, setLayout] = React.useState(() => loadLayout());
  const layoutRef = React.useRef(layout);
  React.useEffect(() => { layoutRef.current = layout; saveLayout(layout); }, [layout]);

  React.useEffect(() => {
    if (editMode) {
      try { sessionStorage.setItem(LAYOUT_SNAP_KEY, JSON.stringify(layoutRef.current)); } catch (e) {}
    }
  }, [editMode]);
  React.useEffect(() => {
    const onCancel = () => {
      try {
        const snap = sessionStorage.getItem(LAYOUT_SNAP_KEY);
        if (snap) setLayout(JSON.parse(snap));
      } catch (e) {}
    };
    window.addEventListener('nhj-cancel-edits', onCancel);
    return () => window.removeEventListener('nhj-cancel-edits', onCancel);
  }, []);

  const [ghost, setGhost] = React.useState(null);
  const ghostRef = React.useRef(null);
  React.useEffect(() => { ghostRef.current = ghost; }, [ghost]);
  const [activeId, setActiveId] = React.useState(null);
  const [resizeId, setResizeId] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const gridRef = React.useRef(null);

  const update = (id, patch) => setLayout(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const cellSize = () => {
    const r = gridRef.current.getBoundingClientRect();
    const totalGap = GRID_GAP_PX * (GRID_COLS - 1);
    const cellW = (r.width - totalGap) / GRID_COLS;
    // Row height derived from first row's content; falls back to 220px
    const firstRow = gridRef.current.querySelector('.gw');
    const cellH = firstRow ? firstRow.getBoundingClientRect().height : 220;
    return { cellW, cellH, rect: r };
  };

  // ── Drag (move widget) — strict no-overlap ───────────────────────
  const onDragStart = (e, id) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setActiveId(id);
    const cur = layoutRef.current[id];
    const { cellW, cellH, rect } = cellSize();
    const startOffsetCol = (e.clientX - rect.left) / (cellW + GRID_GAP_PX);
    const startOffsetRow = (e.clientY - rect.top)  / (cellH + GRID_GAP_PX);
    const grabCol = startOffsetCol - (cur.col - 1);
    const grabRow = startOffsetRow - (cur.row - 1);

    let lastValid = { id, col: cur.col, row: cur.row, colSpan: cur.colSpan, rowSpan: cur.rowSpan, blocked: false };
    setGhost(lastValid);

    const move = (ev) => {
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      let col;
      if (isRTL) {
        const rx = rect.width - x;
        col = Math.round(rx / (cellW + GRID_GAP_PX) - grabCol) + 1;
      } else {
        col = Math.round(x / (cellW + GRID_GAP_PX) - grabCol) + 1;
      }
      let row = Math.round(y / (cellH + GRID_GAP_PX) - grabRow) + 1;
      col = Math.max(1, Math.min(GRID_COLS - cur.colSpan + 1, col));
      row = Math.max(1, row);
      const candidate = { col, row, colSpan: cur.colSpan, rowSpan: cur.rowSpan };
      const blocked = collidesWithOthers(candidate, id, layoutRef.current);
      if (!blocked) {
        lastValid = { id, ...candidate, blocked: false };
        setGhost(lastValid);
      } else {
        // Show the candidate but mark as blocked
        setGhost({ id, ...candidate, blocked: true });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      // Commit only the last valid (non-blocked) position
      if (lastValid && (lastValid.col !== cur.col || lastValid.row !== cur.row)) {
        update(id, { col: lastValid.col, row: lastValid.row });
      }
      setGhost(null);
      setActiveId(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ── Resize (8 handles) — clamp at neighbor edges ─────────────────
  const onResizeStart = (e, id, dir) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    setResizeId(id);
    const cur = layoutRef.current[id];
    const min = MIN_SPANS[id] || { col: 2, row: 1 };
    const { cellW, cellH } = cellSize();
    const startX = e.clientX, startY = e.clientY;
    const startCol = cur.col, startSpan = cur.colSpan;
    const startRow = cur.row, startRSpan = cur.rowSpan;

    let lastValid = { id, col: startCol, row: startRow, colSpan: startSpan, rowSpan: startRSpan, blocked: false };
    setGhost(lastValid);

    const move = (ev) => {
      let dx = ev.clientX - startX;
      let dy = ev.clientY - startY;
      if (isRTL) dx = -dx;
      const dCol = Math.round(dx / (cellW + GRID_GAP_PX));
      const dRow = Math.round(dy / (cellH + GRID_GAP_PX));
      let col = startCol, colSpan = startSpan, row = startRow, rowSpan = startRSpan;
      if (dir.includes('e')) {
        colSpan = Math.max(min.col, Math.min(GRID_COLS - startCol + 1, startSpan + dCol));
      }
      if (dir.includes('w')) {
        const ncol = Math.max(1, Math.min(startCol + startSpan - min.col, startCol + dCol));
        col = ncol;
        colSpan = Math.max(min.col, startCol + startSpan - ncol);
      }
      if (dir.includes('s')) {
        rowSpan = Math.max(min.row, Math.min(6, startRSpan + dRow));
      }
      if (dir.includes('n')) {
        const nrow = Math.max(1, Math.min(startRow + startRSpan - min.row, startRow + dRow));
        row = nrow;
        rowSpan = Math.max(min.row, startRow + startRSpan - nrow);
      }
      const candidate = { col, row, colSpan, rowSpan };
      const blocked = collidesWithOthers(candidate, id, layoutRef.current);
      if (!blocked) {
        lastValid = { id, ...candidate, blocked: false };
        setGhost(lastValid);
      } else {
        setGhost({ id, ...candidate, blocked: true });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (lastValid) {
        update(id, { col: lastValid.col, row: lastValid.row, colSpan: lastValid.colSpan, rowSpan: lastValid.rowSpan });
      }
      setGhost(null);
      setResizeId(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const deleteWidget = (id) => update(id, { visible: false });

  const restoreWidget = (id) => {
    const def = DEFAULT_LAYOUT[id];
    const colSpan = def.colSpan, rowSpan = def.rowSpan;
    const others = Object.values(layoutRef.current).filter(w => w.visible && w.id !== id);
    let placed = false;
    let row = 1;
    while (!placed && row <= 30) {
      for (let col = 1; col <= GRID_COLS - colSpan + 1; col++) {
        const cand = { col, row, colSpan, rowSpan };
        if (!others.some(o => rectsOverlap(cand, o))) {
          update(id, { visible: true, col, row, colSpan, rowSpan });
          placed = true;
          break;
        }
      }
      row++;
    }
    setAddOpen(false);
  };

  const visible = Object.values(layout).filter(w => w.visible);
  const hidden  = Object.values(layout).filter(w => !w.visible);
  const maxRow = Math.max(2, ...visible.map(w => w.row + w.rowSpan - 1));

  const renderContent = (id) => {
    switch (id){
      case 'velocity': return <PhaseVelocity all={all}/>;
      case 'star':     return <TeamWorkload all={all}/>;
      case 'region':   return <RegionWidget all={all} region={region} setRegion={setRegion}/>;
      case 'due':      return <DueWeeksWidget all={all}/>;
      default: return null;
    }
  };

  return (
    <div className={`dashboard-grid-wrap ${editMode ? 'editing' : ''}`}>
      {editMode && (
        <div className="gw-controls">
          <span className="gw-controls-hint">Drag the grip icon to move · Drag any edge or corner to resize · × to remove</span>
          <div style={{ position: 'relative' }}>
            <button className="btn-primary accent gw-add-btn" onClick={() => setAddOpen(o => !o)}>
              <Icon.Plus/> Add widget {hidden.length > 0 && <span className="gw-add-count">{hidden.length}</span>}
            </button>
            {addOpen && <AddWidgetMenu hidden={hidden} onAdd={restoreWidget} onClose={() => setAddOpen(false)}/>}
          </div>
        </div>
      )}
      <div className="dashboard-grid"
           ref={gridRef}
           style={{
             gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
             gridAutoRows: `minmax(${GRID_ROW_MIN_PX}px, auto)`,
             gap: `${GRID_GAP_PX}px`,
           }}>
        {visible.map(w => (
          <GridWidget key={w.id} id={w.id}
                      layout={layout}
                      ghost={ghost}
                      isDragging={activeId === w.id}
                      isResizing={resizeId === w.id}
                      editMode={editMode}
                      lang={lang}
                      onDragStart={onDragStart}
                      onResizeStart={onResizeStart}
                      onDelete={() => deleteWidget(w.id)}>
            {renderContent(w.id)}
          </GridWidget>
        ))}
        <GridGhost ghost={ghost}/>
      </div>
    </div>
  );
}

// ── Region (extracted from HealthSnapshot) ──────────────────────────
function RegionWidget({ all, region, setRegion }){
  const ksa = all.filter(c => (c.region || '').includes('SA')).length;
  const syr = all.filter(c => (c.region || '').includes('SY')).length;
  const lbl = (n) => `${n} ${n === 1 ? 'Client' : 'Clients'}`;
  return (
    <div className="snap-card snap-region">
      <div className="snap-hd">
        <span className="snap-l">Clients By Region</span>
      </div>
      <div className="region-split">
        <button type="button"
                className={`region-seg seg-sa ${region === 'SA' ? 'on' : ''}`}
                onClick={() => setRegion(region === 'SA' ? null : 'SA')}>
          <img className="region-seg-flag" src="https://flagcdn.com/sa.svg" alt="Saudi Arabia"/>
          <div className="region-seg-name">Saudi Arabia</div>
          <div className="region-seg-n">{lbl(ksa)}</div>
        </button>
        <button type="button"
                className={`region-seg seg-sy ${region === 'SY' ? 'on' : ''}`}
                onClick={() => setRegion(region === 'SY' ? null : 'SY')}>
          <img className="region-seg-flag" src="https://flagcdn.com/sy.svg" alt="Syria"/>
          <div className="region-seg-name">Syria</div>
          <div className="region-seg-n">{lbl(syr)}</div>
        </button>
      </div>
    </div>
  );
}

// ── Due Weeks (extracted) ───────────────────────────────────────────
function DueWeeksWidget({ all }){
  const TODAY = new Date('2026-05-17T00:00:00');
  const ym = `${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}`;
  const weeks = [0, 0, 0, 0];
  let monthTotal = 0;
  all.forEach(c => (c.tasks || []).forEach(tk => {
    if (tk.done || !tk.dueIso) return;
    if (!tk.dueIso.startsWith(ym)) return;
    const day = parseInt(tk.dueIso.slice(8, 10), 10);
    const w = Math.min(3, Math.floor((day - 1) / 7));
    weeks[w]++; monthTotal++;
  }));
  const mx = Math.max(...weeks, 1);
  const nowWeek = Math.min(3, Math.floor((TODAY.getDate() - 1) / 7));
  return (
    <div className="snap-card snap-due">
      <div className="snap-hd">
        <span className="snap-l">Due — Work Weeks</span>
        <span className="snap-total">{TODAY.toLocaleString('en-US',{month:'long', year:'numeric'})}</span>
      </div>
      <div className="due-body">
        <div className="due-big">
          <div className="due-big-v">{monthTotal}</div>
          <div className="due-big-l">tasks</div>
        </div>
        <div className="due-weeks">
          {weeks.map((n, i) => {
            const start = i * 7 + 1;
            const end = i === 3 ? new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate() : (i + 1) * 7;
            const monthLbl = TODAY.toLocaleString('en-US', { month: 'short' });
            const heightPct = Math.max(8, (n / mx) * 100); // min 8% so a labeled stub shows for 0
            return (
              <span key={i}
                    className={`due-week-bar ${i === nowWeek ? 'now' : ''}`}
                    title={`W${i+1} · ${monthLbl} ${start}–${end} · ${n} tasks`}>
                <span className="dw-bar-fill" style={{ height: `${heightPct}%` }}>
                  <span className="dw-bar-n">{n}</span>
                </span>
                <span className="dw-bar-l">W{i+1}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HealthSnapshot({ all, region, setRegion }){
  return <DashboardGrid all={all} region={region} setRegion={setRegion}/>;
}

function HelpButton({ title, body }){
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" className="help-btn"
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              aria-label="What is this?">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
      {open && (
        <Portal>
          <div className="modal-backdrop on" onClick={() => setOpen(false)}>
            <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{title}</h3>
              <div className="help-body">
                {body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <div className="modal-foot">
                <button className="btn-primary accent" onClick={() => setOpen(false)}>Got it</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

// Live kudos ticker — auto-rotates through all kudos every 10s
function KudosTicker(){
  const [kudos, setKudos] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const read = () => {
      try {
        const all = JSON.parse(localStorage.getItem('nhj-kudos') || '{}');
        const flat = [];
        for (const [name, list] of Object.entries(all)){
          (list || []).forEach(k => flat.push({ ...k, to: name }));
        }
        flat.sort((a, b) => (b.when || 0) - (a.when || 0));
        setKudos(flat);
      } catch (e) {}
    };
    read();
    const i = setInterval(read, 2000);
    return () => clearInterval(i);
  }, []);
  React.useEffect(() => {
    if (kudos.length <= 1) return;
    const i = setInterval(() => setIdx(k => (k + 1) % kudos.length), 10000);
    return () => clearInterval(i);
  }, [kudos.length]);
  if (!kudos.length) return <div className="kudos-ticker empty">💛 Be the first to send appreciation</div>;
  const k = kudos[idx % kudos.length];
  return (
    <div className="kudos-ticker" key={idx}>
      <span className="kt-line">
        <span className="kt-quote">“</span>{k.message}<span className="kt-quote">”</span>
        <span className="kt-meta"> — {k.author} → {k.to}</span>
      </span>
    </div>
  );
}

// ─── Kudos points system ────────────────────────────────────────────
// Persists employee kudos points across sessions.
//  - localStorage key: nhj_employee_kudos_points
//  - shape: { [employeeName]: number }
//  - +10 awarded ONLY when a kudo is actually sent (not on cancel).
const KUDOS_POINTS_KEY = 'nhj_employee_kudos_points';
const KUDOS_POINTS_EVENT = 'nhj-kudos-points-changed';

function readKudosPoints(){
  try {
    const raw = localStorage.getItem(KUDOS_POINTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) { return {}; }
}
function writeKudosPoints(map){
  try { localStorage.setItem(KUDOS_POINTS_KEY, JSON.stringify(map)); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent(KUDOS_POINTS_EVENT)); } catch (e) {}
}
function awardKudosPoints(name, delta = 10){
  if (!name) return;
  const map = readKudosPoints();
  map[name] = (map[name] || 0) + delta;
  writeKudosPoints(map);
}

function useKudosPoints(){
  const [points, setPoints] = React.useState(() => readKudosPoints());
  React.useEffect(() => {
    const on = () => setPoints(readKudosPoints());
    window.addEventListener(KUDOS_POINTS_EVENT, on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener(KUDOS_POINTS_EVENT, on);
      window.removeEventListener('storage', on);
    };
  }, []);
  return points;
}

// Quick-suggestion chips. Clicking one fills the textarea; same +10 either way.
// Emoji is part of the chip label AND injected into the textarea content.
const KUDOS_QUICK_SUGGESTIONS = [
  '🎉 Great work this week!',
  '🙌 Thanks for jumping in.',
  '💪 You crushed that deadline.',
  '⭐ Amazing teamwork.',
  '🚀 Couldn\u2019t have done it without you.',
];

// Append to nhj_kudos_history with a freshly-captured timestamp.
const KUDOS_HISTORY_KEY = 'nhj_kudos_history';
const KUDOS_HISTORY_EVENT = 'nhj-kudos-history-changed';
function readKudosHistory(){
  try {
    const raw = localStorage.getItem(KUDOS_HISTORY_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
function writeKudosHistory(list){
  try { localStorage.setItem(KUDOS_HISTORY_KEY, JSON.stringify(list)); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent(KUDOS_HISTORY_EVENT)); } catch (e) {}
}
function appendKudosHistory(entry){
  const list = readKudosHistory();
  list.unshift(entry);
  writeKudosHistory(list);
}
function makeKudosId(){
  try { if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); } catch (e) {}
  return 'k_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

function KudosComposeModal({ onClose, recipient, onSent }){
  const [author, setAuthor] = React.useState(() => { try { return localStorage.getItem('nhj-visitor-name') || ''; } catch(e) { return ''; } });
  const [msg, setMsg]       = React.useState('');
  const to = recipient?.name || '';

  // Lock body scroll while open; restore on unmount.
  React.useEffect(() => {
    const prev = document.body.classList.contains('modal-open');
    document.body.classList.add('modal-open');
    return () => { if (!prev) document.body.classList.remove('modal-open'); };
  }, []);

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = () => {
    const m = msg.trim();
    if (!m || !to) return;

    // Capture timestamp at moment of submission, not modal open.
    const timestamp = new Date().toISOString();
    const fromName = author.trim() || 'Anonymous';

    // 1. Append to the legacy per-recipient store used by the kudos ticker.
    try {
      const all = JSON.parse(localStorage.getItem('nhj-kudos') || '{}');
      const list = all[to] || [];
      all[to] = [{ author: fromName, message: m, when: Date.now() }, ...list].slice(0, 50);
      localStorage.setItem('nhj-kudos', JSON.stringify(all));
      localStorage.setItem('nhj-visitor-name', fromName);
    } catch (e) {}

    // 2. Append a full audit-record to nhj_kudos_history.
    appendKudosHistory({
      id: makeKudosId(),
      fromName,
      toEmployeeId: recipient?.id || '',
      toEmployeeName: to,
      message: m,
      points: 10,
      timestamp,
    });

    // 3. Award the +10 kudos points to the recipient.
    awardKudosPoints(to, 10);

    if (typeof onSent === 'function') onSent(to);
    onClose();
  };

  const ui = (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal kudos-modal" onClick={(e) => e.stopPropagation()}>
          {/* Borderless X close — top-right */}
          <button type="button" className="kudos-x" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
  
          <h3 className="kudos-title">Send appreciation</h3>
          <div className="sub kudos-sub">Recognize a teammate for great work.</div>
  
          {/* Recipient display — pulled from the Star Employee card that opened the modal */}
          {recipient && (
            <div className="kudos-recipient">
              <TeamAvatar name={recipient.name} color={recipient.color} size={32} kind="circle"/>
              <div className="kudos-recipient-meta">
                <div className="kudos-recipient-name">{recipient.name}</div>
                <div className="kudos-recipient-role">{recipient.role || 'Team member'}</div>
              </div>
            </div>
          )}
  
          <div className="field kudos-field">
            <label>Your name</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name"/>
          </div>
  
          {/* Quick suggestions — clicking fills the message (emoji included) */}
          <div className="kudos-suggestions">
            {KUDOS_QUICK_SUGGESTIONS.map(s => (
              <button
                type="button"
                key={s}
                className={`kudos-chip${msg === s ? ' is-active' : ''}`}
                onClick={() => setMsg(s)}
              >
                {s}
              </button>
            ))}
          </div>
  
          <div className="field kudos-field">
            <label>Message</label>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
                      placeholder="Say something nice…" autoFocus
                      style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}/>
          </div>
  
          <div className="kudos-foot">
            <button className="btn-primary accent kudos-send" onClick={send} disabled={!msg.trim() || !to}>
              Send kudos
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );

  // Render via portal so the modal escapes any dashboard-grid stacking context.
  return ReactDOM.createPortal(ui, document.body);
}

function TeamWorkload({ all }){
  const TODAY = new Date('2026-05-17T00:00:00');
  const monthName = TODAY.toLocaleString('en-US', { month: 'long' });
  const ym = `${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}`;

  // B6: count closed tasks per OWNER (task.who/owner) this month, from REAL task data.
  // Fall back to client.leader assignment if owner is missing.
  const closedByPerson = useMemo(() => {
    const map = {};
    (window.CLIENTS || []).forEach(c => {
      // Look at per-client task overrides first (saved in nhj-tasktable-<id>)
      let rows = null;
      try {
        const saved = localStorage.getItem(`nhj-tasktable-${c.id}`);
        if (saved) rows = JSON.parse(saved).rows;
      } catch (e) {}
      const tasks = rows || window.REAL_TASKS?.[c.id] || [];
      tasks.forEach(tk => {
        const completedOn = tk.completed || tk.end;
        const isDoneThisMonth = tk.status === 'completed' && completedOn && String(completedOn).startsWith(ym);
        if (!isDoneThisMonth) return;
        const owner = tk.owner || tk.who || window.TEAM_LEADERS?.[c.leader]?.name || c.leader || 'Unassigned';
        if (!map[owner]) map[owner] = { name: owner, count: 0, clients: new Set(), closedTasks: [], color: c.leaderColor || 'var(--nhj-blue)' };
        map[owner].count++;
        map[owner].clients.add(c.name);
        map[owner].closedTasks.push({ ...tk, clientName: c.name, clientId: c.id, clientColor: c.color });
      });
    });
    return Object.values(map).map(p => ({ ...p, totalClients: p.clients.size })).sort((a,b) => b.count - a.count);
  }, []);

  const ranked = closedByPerson;
  const maxClosed = Math.max(...ranked.map(r => r.count), 1);

  const findProfile = (name) => {
    try {
      const saved = JSON.parse(localStorage.getItem('nhj-team') || '{}');
      return Object.values(saved).find(m => m && m.name === name) || null;
    } catch (e) { return null; }
  };

  // ─── Kudos-points-driven rotating Star Employee ────────────────────
  const points = useKudosPoints();

  // Build the full employee universe from TEAM_LEADERS + anyone surfaced
  // via real closed-task data, so rotation has color/role info to draw on.
  const allEmployees = useMemo(() => {
    const map = new Map();
    Object.entries(window.TEAM_LEADERS || {}).forEach(([id, t]) => {
      if (!t || !t.name) return;
      map.set(t.name, { id, name: t.name, color: t.color, count: 0, totalClients: 0, closedTasks: [] });
    });
    ranked.forEach(r => {
      const existing = map.get(r.name);
      if (existing) { Object.assign(existing, { count: r.count, totalClients: r.totalClients, closedTasks: r.closedTasks, color: existing.color || r.color }); }
      else { map.set(r.name, { ...r }); }
    });
    return [...map.values()];
  }, [ranked]);

  // Engaged = points > 0, sorted DESC. Highest is the "Star".
  const engaged = useMemo(() => {
    return allEmployees
      .map(e => ({ ...e, points: points[e.name] || 0 }))
      .filter(e => e.points > 0)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  }, [allEmployees, points]);

  // Placeholder recipient when nobody has earned points yet:
  // first employee alphabetically — so Send Kudos still works.
  const placeholderRecipient = useMemo(() => {
    return [...allEmployees].sort((a, b) => a.name.localeCompare(b.name))[0] || null;
  }, [allEmployees]);

  const [rotIdx, setRotIdx] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [openProfile, setOpenProfile] = React.useState(null);
  const [fadeKey, setFadeKey] = React.useState(0);

  // Keep rotIdx in range when the engaged list shrinks (e.g. localStorage cleared).
  React.useEffect(() => {
    if (engaged.length === 0) { setRotIdx(0); return; }
    if (rotIdx >= engaged.length) setRotIdx(0);
  }, [engaged.length, rotIdx]);

  // Rotation tick — pauses on hover, while modal is open, or with ≤1 engaged.
  React.useEffect(() => {
    if (engaged.length <= 1) return;
    if (hovered || composeOpen) return;
    const t = setInterval(() => {
      setRotIdx(i => (i + 1) % engaged.length);
      setFadeKey(k => k + 1);
    }, 2000);
    return () => clearInterval(t);
  }, [engaged.length, hovered, composeOpen]);

  // Currently displayed engaged employee (or null when none are engaged).
  const featured = engaged.length ? engaged[rotIdx % engaged.length] : null;

  // Fallback when nobody has earned points yet: show the closed-tasks leader
  // so the card never looks empty. Rotation is off in this state.
  const closedTasksStar = ranked[0] || null;
  const fallback = !featured && closedTasksStar
    ? { ...closedTasksStar, points: 0 }
    : null;

  // The employee shown right now — used both for the card hero and as the
  // recipient when "Send Kudos" is clicked.
  const displayed = featured || fallback;
  const recipient = displayed ? {
    id: displayed.id || '',
    name: displayed.name,
    color: displayed.color,
    role: findProfile(displayed.name)?.position || 'Marketing Manager',
  } : null;

  return (
    <>
    <div className="snap-card snap-star"
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}>
      <div className="snap-hd">
        <span className="snap-l">★ Star Employee — {monthName}
          <HelpButton title="Star Employee of the Month" body={[
            'The team member with the highest kudos points across the team. Each kudo sent awards +10 points to the recipient.',
            'The card rotates through every teammate who has earned points, pausing on hover or while you are composing a kudo.',
            'Click the star to view their full closed-tasks profile.'
          ]}/>
        </span>
      </div>

      {/* Truly empty edge case: no closed tasks AND no points anywhere yet */}
      {!displayed && (
        <div className="star-hero-row">
          <div className="star-hero star-hero-empty">
            <div className="star-avatar-wrap star-avatar-empty">
              <div className="star-avatar-blank" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 21a8 8 0 0 1 16 0"/>
                </svg>
              </div>
            </div>
            <div className="star-info">
              <div className="star-name star-name-empty">No star yet</div>
              <div className="star-pos">Be the first to send kudos!</div>
              <div className="star-meta star-meta-empty">Each kudo awards +10 pts to its recipient.</div>
            </div>
          </div>
        </div>
      )}

      {/* Star hero — rotates among engaged employees, or falls back
          to the closed-tasks leader when no kudos points exist yet. */}
      {displayed && (
        <div className="star-hero-row">
          <button type="button" className="star-hero star-hero-btn star-fade" key={`${displayed.name}-${fadeKey}`} onClick={() => setOpenProfile(displayed)}>
            <div className="star-avatar-wrap" style={{ '--c': displayed.color }}>
              <TeamAvatar name={displayed.name} color={displayed.color} size={48} kind="circle"/>
              <span className="star-crown" aria-label="King">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.5 17l-1.2-9.5a.6.6 0 0 1 .98-.55l4.2 3.3 3.8-6.4a.6.6 0 0 1 1.04 0l3.8 6.4 4.2-3.3a.6.6 0 0 1 .98.55L20.5 17H3.5z"/>
                  <path d="M3.5 18.5h17a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5V19a.5.5 0 0 1 .5-.5z"/>
                  <circle cx="2.4" cy="6.6" r="1.1"/>
                  <circle cx="12" cy="2.4" r="1.2"/>
                  <circle cx="21.6" cy="6.6" r="1.1"/>
                </svg>
              </span>
            </div>
            <div className="star-info">
              <div className="star-name-row">
                <span className="star-name">{displayed.name}</span>
                <span className="kudos-pts-pill" title={`${displayed.points} kudos points`}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.56l-5.9 3.11 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z"/>
                  </svg>
                  {displayed.points} pts
                </span>
              </div>
              <div className="star-pos">{findProfile(displayed.name)?.position || 'Marketing Manager'}</div>
              <div className="star-meta">
                {displayed.count > 0
                  ? <><b>{displayed.count}</b> tasks closed · {displayed.totalClients} clients</>
                  : (engaged.length > 0
                      ? <>Earning kudos from teammates · rank #{rotIdx + 1} of {engaged.length}</>
                      : <>Be the first to send kudos!</>)}
              </div>
            </div>
          </button>
          <button type="button" className="star-send-btn star-send-btn-compact" onClick={() => setComposeOpen(true)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8.16-2.59A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z"/>
            </svg>
            Send Kudos
          </button>
        </div>
      )}

      {/* Auto-rotating kudos ticker */}
      <KudosTicker/>

      {/* Top 2 runners-up under the kudos ticker */}
      {ranked.length > 1 && (
        <div className="star-board">
          {ranked.slice(1, 3).map(r => {
            const rp = findProfile(r.name);
            const deptKey = rp?.department || 'nhj';
            const border = deptKey === 'nhj' ? 'var(--nhj-blue)'
              : deptKey === 'whj' ? 'var(--whj-orange)'
              : deptKey === 'rwj' ? 'var(--rwj-green)'
              : 'oklch(75% .15 90)';
            return (
              <button type="button" key={r.name} className="star-board-row" onClick={() => setOpenProfile(r)}>
                <TeamAvatar name={r.name} color={r.color} size={26} kind="circle" border={border}/>
                <div className="sbr-name-bar">
                  <span className="sbr-name">{r.name}</span>
                  <span className="sbr-bar">
                    <span className="sbr-bar-fill" style={{ width: `${(r.count / maxClosed) * 100}%`, background: r.color }}/>
                  </span>
                </div>
                <span className="sbr-n">{r.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>

    {composeOpen && (
      <KudosComposeModal
        recipient={recipient}
        onClose={() => setComposeOpen(false)}
      />
    )}
    {openProfile && (
      <EmployeeProfileModal employee={openProfile} profile={findProfile(openProfile.name)} monthName={monthName} onClose={() => setOpenProfile(null)}/>
    )}
    </>
  );
}

// F: Star Employee profile modal — tasks shown as TABLE, kudos removed, stat boxes colored
function EmployeeProfileModal({ employee, profile, monthName, onClose }){
  const tasks = employee.closedTasks || [];

  // F4: month date range
  const TODAY = new Date('2026-05-17T00:00:00');
  const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const monthEnd   = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
  const fmtDDMMYYYY = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  // Active clients (status === 'active') worked on by this employee this month
  const activeClientCount = React.useMemo(() => {
    const ids = new Set();
    tasks.forEach(t => {
      const c = (window.CLIENTS || []).find(x => x.id === t.clientId);
      if (c && c.status === 'active') ids.add(c.id);
    });
    return ids.size;
  }, [tasks]);
  const projectsCount = new Set(tasks.map(t => t.clientId)).size;

  // Bug 1-3: filter chip state, radio toggle
  const [filter, setFilter] = React.useState(null); // null | 'closed' | 'active' | 'projects'

  const filteredTasks = React.useMemo(() => {
    if (!filter) return tasks;
    if (filter === 'closed') {
      return tasks.filter(t => t.status === 'completed' || t.done);
    }
    if (filter === 'active') {
      return tasks.filter(t => {
        const c = (window.CLIENTS || []).find(x => x.id === t.clientId);
        return c && c.status === 'active';
      });
    }
    if (filter === 'projects') {
      const inMonth = (s) => s && String(s).startsWith(`${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}`);
      return tasks.filter(t => inMonth(t.start) || inMonth(t.end) || inMonth(t.completed));
    }
    return tasks;
  }, [tasks, filter]);

  const filterMeta = {
    closed:   { label: 'Closed Tasks',       cls: 'emp-stat-closed' },
    active:   { label: 'Active clients',     cls: 'emp-stat-active' },
    projects: { label: 'Projects this month', cls: 'emp-stat-projects' },
  };

  const toggleFilter = (k) => setFilter(prev => prev === k ? null : k);

  const readAttach = (clientId, taskId) => {
    try {
      const all = JSON.parse(localStorage.getItem(`nhj-attach-${clientId}`) || '{}');
      return all[taskId] || [];
    } catch (e) { return []; }
  };

  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal emp-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-x" onClick={onClose} aria-label="Close"><Icon.X/></button>
  
          <div className="emp-modal-h">
            <TeamAvatar name={employee.name} color={employee.color} size={56} kind="circle"/>
            <div className="emp-modal-h-info">
              <h3>{employee.name}</h3>
              <div className="sub">{profile?.position || 'Marketing Manager'} · {employee.totalClients} clients</div>
            </div>
          </div>
  
          {/* Bug 4: range string tied to month, dim, near filters */}
          <div className="emp-period">
            <span className="emp-period-month">Showing {monthName} {TODAY.getFullYear()}</span>
            <span className="emp-period-sep"> · </span>
            {fmtDDMMYYYY(monthStart)} – {fmtDDMMYYYY(monthEnd)}
          </div>
  
          {/* Bug 1+2: stat cards as clickable filter chips */}
          <div className="emp-stats">
            <button type="button"
                    className={`emp-stat emp-stat-closed ${filter === 'closed' ? 'on' : ''}`}
                    onClick={() => toggleFilter('closed')}>
              <div className="emp-stat-v">{employee.count}</div>
              <div className="emp-stat-l">Closed Tasks</div>
              {filter === 'closed' && <span className="emp-stat-check">✓</span>}
            </button>
            <button type="button"
                    className={`emp-stat emp-stat-active ${filter === 'active' ? 'on' : ''}`}
                    onClick={() => toggleFilter('active')}>
              <div className="emp-stat-v">{activeClientCount}</div>
              <div className="emp-stat-l">Active clients</div>
              {filter === 'active' && <span className="emp-stat-check">✓</span>}
            </button>
            <button type="button"
                    className={`emp-stat emp-stat-projects ${filter === 'projects' ? 'on' : ''}`}
                    onClick={() => toggleFilter('projects')}>
              <div className="emp-stat-v">{projectsCount}</div>
              <div className="emp-stat-l">Projects this month</div>
              {filter === 'projects' && <span className="emp-stat-check">✓</span>}
            </button>
          </div>
  
          <div className="emp-scroll">
            {/* Bug 3: filter chip with × */}
            <div className="emp-th-row">
              <h4 className="emp-section-h">Completed Tasks This Month</h4>
              {filter && (
                <span className={`emp-filter-chip ${filterMeta[filter].cls}`}>
                  Filtered: {filterMeta[filter].label}
                  <button onClick={() => setFilter(null)} aria-label="Clear filter">×</button>
                </span>
              )}
            </div>
            {filteredTasks.length === 0 && <div className="emp-empty">No tasks match this filter.</div>}
            {filteredTasks.length > 0 && (
              <table className="emp-task-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Task</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Attachments</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((tk, i) => {
                    const att = readAttach(tk.clientId, tk.id);
                    return (
                      <tr key={i}>
                        <td>
                          <span className="emp-task-client">
                            <span className="emp-task-dot" style={{ background: tk.clientColor }}></span>
                            {tk.clientName}
                          </span>
                        </td>
                        <td>{tk.name}</td>
                        <td className="num">{tk.start || '—'}</td>
                        <td className="num">{tk.completed || tk.end || '—'}</td>
                        <td><span className="emp-status-pill done">Completed</span></td>
                        <td>
                          {att.length === 0 ? <span className="emp-empty-inline">—</span> :
                            <span className="emp-att-list">
                              {att.map((a, j) => (
                                <span key={j} className="emp-att-chip">
                                  {a.type === 'link'
                                    ? <a href={a.url} target="_blank" rel="noreferrer"><Icon.Link/> {a.name}</a>
                                    : <span><Icon.File/> {a.name}</span>}
                                </span>
                              ))}
                            </span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
  
          <div className="modal-foot">
            <button className="btn-primary accent" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// B4: Phase Velocity — computed from real task data (avg days per phase across portfolio)
function PhaseVelocity({ all }){
  const items = useMemo(() => {
    const buckets = { foundation: [], activation: [], growth: [], discovery: [] };
    all.forEach(c => (c.tasks || []).forEach(tk => {
      const phase = (tk.phase || '').toLowerCase();
      if (!buckets[phase] || !tk.start || !tk.dueIso) return;
      const days = Math.round((new Date(tk.dueIso) - new Date(tk.start)) / 86400000);
      if (days > 0 && days < 365) buckets[phase].push(days);
    }));
    const avg = arr => arr.length ? Math.round(arr.reduce((s,x) => s + x, 0) / arr.length) : 0;
    return [
      { phase: 'Foundation', days: avg(buckets.foundation), color: 'var(--nhj-blue)' },
      { phase: 'Activation', days: avg(buckets.activation), color: 'var(--whj-orange)' },
      { phase: 'Growth',     days: avg(buckets.growth),     color: 'var(--rwj-green)' },
    ];
  }, []);
  const max = Math.max(...items.map(i => i.days), 1);

  return (
    <div className="snap-card snap-velocity">
      <div className="snap-hd">
        <span className="snap-l">Phase Velocity
          <HelpButton title="Phase Velocity" body={[
            'Average task duration per engagement phase, computed from real task start/end dates.',
            'Use these benchmarks to spot bottlenecks — phases longer than the average likely need attention.'
          ]}/>
        </span>
        <span className="snap-total">avg days / task</span>
      </div>
      <div className="ve-rows">
        {items.map(i => (
          <div key={i.phase} className="ve-row">
            <span className="ve-label">
              <span className="ve-dot" style={{ background: i.color }}></span>
              {i.phase}
            </span>
            <span className="ve-track">
              <span className="ve-fill" style={{ width: `${(i.days/max)*100}%`, background: i.color }}/>
            </span>
            <span className="ve-n">{i.days}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Dashboard, Hero };
