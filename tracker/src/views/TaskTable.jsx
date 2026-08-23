import React from 'react';
import { Portal, Icon } from '../components/ui.jsx';

// Excel-like task grid for a client engagement.
// Features: per-column drag-resize, drag-reorder, sort (asc/desc/clear),
//           hide/show via Columns menu, right-click column & row context menus,
//           row drag-reorder, row drag-resize (height), multi-row select,
//           inline cell editing for text/date/check/select/pill columns,
//           persistent prefs (column order/width/hidden/sort/rowHeights),
//           SOW completeness suggestions panel below.

const { useState: useState_tt, useEffect: useEffect_tt, useMemo: useMemo_tt, useRef: useRef_tt, useCallback: useCallback_tt } = React;

// ── Column registry ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'oklch(60% .02 250)' },
  { value: 'in_progress', label: 'In Progress', color: 'oklch(55% .14 250)' },
  { value: 'in_review',   label: 'In Review',   color: 'oklch(55% .14 60)'  },
  { value: 'on_hold',     label: 'On Hold',     color: 'oklch(55% .14 30)'  },
  { value: 'completed',   label: 'Completed',   color: 'oklch(55% .15 152)' },
];
const PHASE_OPTIONS = ['Discovery','Foundation','Activation','Growth'].map(v => ({ value: v, label: v }));
const PRIORITY_OPTIONS = [
  { value: 'High',   label: 'High',   color: 'oklch(55% .15 30)'  },
  { value: 'Medium', label: 'Medium', color: 'oklch(58% .12 80)'  },
  { value: 'Low',    label: 'Low',    color: 'oklch(55% .07 200)' },
  { value: '',       label: 'Unset',  color: 'oklch(70% .02 250)' },
];
const UNIT_OPTIONS = ['NHJ','WHJ','RWJ'].map(v => ({ value: v, label: v }));
const CATEGORY_OPTIONS = ['Business','Marketing','Content','Design','Tech','Operations','Growth'].map(v => ({ value: v, label: v }));

// Change #2: Task Name first
const DEFAULT_COLUMNS = [
  { key: 'name',      label: 'Task Name',           type: 'text',                                width: 240 },
  { key: 'phase',     label: 'Phases',              type: 'select',  options: PHASE_OPTIONS,    width: 120 },
  { key: 'cat',       label: 'Category',            type: 'select',  options: CATEGORY_OPTIONS, width: 120 },
  { key: 'unit',      label: 'Unit',                type: 'select',  options: UNIT_OPTIONS,     width: 80  },
  { key: 'priority',  label: 'Priority',            type: 'pill',    options: PRIORITY_OPTIONS, width: 105 },
  { key: 'owner',     label: 'Owner',               type: 'text',                                width: 150 },
  { key: 'start',     label: 'Start',               type: 'date',                                width: 110 },
  { key: 'end',       label: 'End',                 type: 'date',                                width: 110 },
  { key: 'status',    label: 'Status',              type: 'pill',    options: STATUS_OPTIONS,   width: 130 },
  { key: 'action',    label: 'Task Action',         type: 'longtext',                            width: 280 },
  { key: 'clientReq', label: 'Client Req',          type: 'check',                               width: 80  },
  { key: 'duration',  label: 'Duration',            type: 'text',                                width: 80  },
  { key: 'depTask',   label: 'Depends On',          type: 'text',                                width: 150 },
  { key: 'depStatus', label: 'Dep. Status',         type: 'pill',    options: STATUS_OPTIONS,   width: 130 },
  { key: 'completed', label: 'Completed',           type: 'date',                                width: 120 },
];

const ROW_DEFAULT_HEIGHT = 38;
const ROW_MIN_HEIGHT = 28;
const ROW_MAX_HEIGHT = 200;
const COL_MIN_W = 60;
const COL_MAX_W = 600;

// ── Persistence ────────────────────────────────────────────────────────
const STORAGE_KEY = (id) => `nhj-tasktable-${id}`;

function loadTableState(clientId){
  try {
    const raw = localStorage.getItem(STORAGE_KEY(clientId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveTableState(clientId, state){
  try { localStorage.setItem(STORAGE_KEY(clientId), JSON.stringify(state)); } catch (e) {}
}

function seedRows(clientId){
  return (window.REAL_TASKS?.[clientId] || []).map((t, i) => ({
    _rid: t.id || `${clientId}-r${i+1}`,
    name: t.name || '',
    phase: t.phase || '',
    cat: t.cat || '',
    unit: t.unit || '',
    priority: t.priority || '',
    owner: t.owner || '',
    start: t.start || '',
    end: t.end || '',
    status: t.status || 'not_started',
    action: t.action || '',
    clientReq: !!t.clientReq,
    duration: t.duration || '',
    depTask: t.depTask || '',
    depStatus: t.depStatus || 'not_started',
    completed: t.completed || '',
  }));
}

function initialState(clientId){
  const saved = loadTableState(clientId);
  if (saved && saved.rows && saved.columns) {
    // Merge with defaults if newer columns added since last save
    const have = new Set(saved.columns.map(c => c.key));
    DEFAULT_COLUMNS.forEach(c => {
      if (!have.has(c.key)) saved.columns.push({ ...c });
    });
    return { hidden: [], sort: [], rowHeights: {}, ...saved };
  }
  return {
    columns: DEFAULT_COLUMNS.map(c => ({ ...c })),
    rows: seedRows(clientId),
    hidden: [],
    sort: [], // [{key, dir}]
    rowHeights: {},
  };
}

// ── Pill renderer ─────────────────────────────────────────────────────
function StatusPill({ option, muted }){
  if (!option) return null;
  if (option.value === '' && muted) {
    return <span className="tt-empty tt-priority-unset">Unset</span>;
  }
  return (
    <span className="tt-pill" style={{
      '--p': option.color,
      background: `color-mix(in oklab, ${option.color} 14%, white)`,
      color: option.color,
      borderColor: `color-mix(in oklab, ${option.color} 30%, transparent)`,
    }}>{option.label}</span>
  );
}

function PillCell({ value, options, onChange }){
  const [open, setOpen] = useState_tt(false);
  const ref = useRef_tt(null);
  useEffect_tt(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const opt = options.find(o => o.value === value) || options.find(o => o.value === '') || options[0];
  return (
    <div className="tt-pill-cell" ref={ref}>
      <button className="tt-pill-trigger" onClick={() => setOpen(o => !o)} type="button">
        <StatusPill option={opt} muted/>
      </button>
      {open && (
        <div className="tt-menu">
          {options.map(o => (
            <button key={o.value} type="button" className={`tt-menu-item ${o.value === value ? 'on' : ''}`}
                    onClick={() => { onChange(o.value); setOpen(false); }}>
              <StatusPill option={o}/>
              {o.value === value && <Icon.Check className="tt-menu-check"/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectCell({ value, options, onChange }){
  const [editing, setEditing] = useState_tt(false);
  if (editing){
    return (
      <select className="tt-input" autoFocus value={value || ''}
              onBlur={() => setEditing(false)}
              onChange={(e) => { onChange(e.target.value); setEditing(false); }}>
        <option value="">—</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <div className="tt-cell-view" onClick={() => setEditing(true)}>
      {value || <span className="tt-empty">—</span>}
    </div>
  );
}

function TextCell({ value, onChange, multiline, type='text' }){
  const [editing, setEditing] = useState_tt(false);
  const [v, setV] = useState_tt(value || '');
  useEffect_tt(() => setV(value || ''), [value]);
  if (editing){
    const commit = () => { onChange(v); setEditing(false); };
    if (multiline){
      return (
        <textarea className="tt-input tt-input-multi" autoFocus value={v}
                  onChange={(e) => setV(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setV(value || ''); setEditing(false); } }}/>
      );
    }
    return (
      <input className="tt-input" autoFocus type={type} value={v}
             onChange={(e) => setV(e.target.value)}
             onBlur={commit}
             onKeyDown={(e) => {
               if (e.key === 'Enter') commit();
               if (e.key === 'Escape') { setV(value || ''); setEditing(false); }
             }}/>
    );
  }
  return (
    <div className={`tt-cell-view ${multiline ? 'tt-cell-multi' : ''}`} onClick={() => setEditing(true)}>
      {value ? value : <span className="tt-empty">—</span>}
    </div>
  );
}

function CheckCell({ value, onChange }){
  return (
    <div className="tt-cell-view tt-check" onClick={(e) => { e.stopPropagation(); onChange(!value); }}>
      <span className={`tt-checkbox ${value ? 'on' : ''}`}>{value && <Icon.Check/>}</span>
    </div>
  );
}

function DateCell({ value, onChange }){
  const [editing, setEditing] = useState_tt(false);
  const display = value || '';
  if (editing){
    return (
      <input className="tt-input" type="date" autoFocus value={value || ''}
             onBlur={() => setEditing(false)}
             onChange={(e) => { onChange(e.target.value); setEditing(false); }}/>
    );
  }
  return (
    <div className="tt-cell-view" onClick={() => setEditing(true)}>
      {display || <span className="tt-empty">—</span>}
    </div>
  );
}

// ── Context menus (column / row) ──────────────────────────────────────
function ContextMenu({ x, y, items, onClose }){
  const ref = useRef_tt(null);
  useEffect_tt(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [onClose]);
  // Clamp to viewport
  const vw = window.innerWidth, vh = window.innerHeight;
  const left = Math.min(x, vw - 240);
  const top  = Math.min(y, vh - 280);
  return (
    <div className="tt-ctx-menu" ref={ref} style={{ left, top }}>
      {items.map((it, i) => it === '---' ? <div key={i} className="tt-menu-sep"/> : (
        <button key={i}
                className={`tt-menu-item ${it.danger ? 'tt-danger' : ''}`}
                onClick={() => { onClose(); it.onClick && it.onClick(); }}>
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── New column modal — extended types + width + pin ───────────────────
const NEW_COL_TYPES = [
  { value: 'text',     label: 'Text' },
  { value: 'longtext', label: 'Long text' },
  { value: 'number',   label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent',  label: 'Percent' },
  { value: 'date',     label: 'Date' },
  { value: 'check',    label: 'Checkbox' },
  { value: 'select',   label: 'Single select' },
  { value: 'pill',     label: 'Pill / Tag' },
  { value: 'url',      label: 'URL' },
];

function NewColumnDialog({ onClose, onAdd }){
  const [label, setLabel] = useState_tt('');
  const [type, setType] = useState_tt('text');
  const [width, setWidth] = useState_tt(140);
  const [def, setDef] = useState_tt('');
  const valid = label.trim().length > 0 && label.trim().length <= 30;
  const submit = () => {
    if (!valid) return;
    const key = `c_${Date.now().toString(36)}`;
    const col = { key, label: label.trim(), type, width: Math.max(COL_MIN_W, Math.min(COL_MAX_W, parseInt(width)||140)) };
    if (type === 'select' || type === 'pill') {
      col.options = (def.trim() ? def.split(',').map(s => s.trim()).filter(Boolean) : ['Option 1','Option 2'])
        .map(v => ({ value: v, label: v }));
    }
    onAdd(col, def);
    onClose();
  };
  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <h3>Add column</h3>
          <div className="sub">New columns are saved per engagement.</div>
          <div className="field">
            <label>Name <span style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 4 }}>(max 30 chars)</span></label>
            <input value={label} maxLength={30} autoFocus
                   onChange={(e) => setLabel(e.target.value)}
                   placeholder="e.g. Notes, Stakeholder, Budget…"/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Data type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {NEW_COL_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Width (px)</label>
              <input type="number" min={COL_MIN_W} max={COL_MAX_W} value={width}
                     onChange={(e) => setWidth(e.target.value)}/>
            </div>
          </div>
          {(type === 'select' || type === 'pill') && (
            <div className="field">
              <label>Options <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>(comma-separated)</span></label>
              <input value={def} onChange={(e) => setDef(e.target.value)} placeholder="Option A, Option B, Option C"/>
            </div>
          )}
          {(type === 'text' || type === 'number' || type === 'currency' || type === 'percent' || type === 'url') && (
            <div className="field">
              <label>Default value <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}>(optional)</span></label>
              <input value={def} onChange={(e) => setDef(e.target.value)}/>
            </div>
          )}
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary accent" onClick={submit} disabled={!valid}><Icon.Plus/> Add</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Columns visibility dropdown ───────────────────────────────────────
function ColumnsDropdown({ columns, hidden, onToggle, onClose }){
  const ref = useRef_tt(null);
  useEffect_tt(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div className="tt-col-dropdown" ref={ref}>
      <div className="tt-col-dropdown-h">Show / hide columns</div>
      <div className="tt-col-dropdown-body">
        {columns.map(c => {
          const isHidden = hidden.includes(c.key);
          return (
            <label key={c.key} className="tt-col-dropdown-row">
              <input type="checkbox" checked={!isHidden} onChange={() => onToggle(c.key)}/>
              <span className="tt-col-dropdown-label">{c.label}</span>
              <span className="tt-col-dropdown-type">{c.type}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main TaskTable ─────────────────────────────────────────────────────
function TaskTable({ clientId }){
  const [state, setState] = useState_tt(() => initialState(clientId));
  const [selected, setSelected] = useState_tt(new Set());
  const [lastSelectedIdx, setLastSelectedIdx] = useState_tt(null);
  const [colMenu, setColMenu] = useState_tt(null);   // { x, y, colKey }
  const [rowMenu, setRowMenu] = useState_tt(null);   // { x, y, rid }
  const [newColOpen, setNewColOpen] = useState_tt(false);
  const [columnsDropOpen, setColumnsDropOpen] = useState_tt(false);
  const [filter, setFilter] = useState_tt('');
  const [statusFilter, setStatusFilter] = useState_tt('all');
  const [toast, setToast] = useState_tt(null);     // { msg, undo }
  const [renameKey, setRenameKey] = useState_tt(null);
  const [renameVal, setRenameVal] = useState_tt('');
  const undoRef = useRef_tt(null);   // last delete snapshot

  // Persist whole state
  useEffect_tt(() => { saveTableState(clientId, state); }, [state, clientId]);
  useEffect_tt(() => { setSelected(new Set()); setLastSelectedIdx(null); }, [clientId]);

  // Hidden + sort live inside state for persistence
  const hidden = state.hidden || [];
  const sort   = state.sort || [];

  const visibleCols = useMemo_tt(
    () => state.columns.filter(c => !hidden.includes(c.key)),
    [state.columns, hidden]
  );

  const filteredRows = useMemo_tt(() => {
    let rows = state.rows;
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    if (sort.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const s of sort) {
          const av = a[s.key] ?? '', bv = b[s.key] ?? '';
          const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
          if (cmp !== 0) return s.dir === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }
    return rows;
  }, [state.rows, filter, statusFilter, sort]);

  const statusCounts = useMemo_tt(() => {
    const c = { all: state.rows.length, not_started: 0, in_progress: 0, completed: 0, on_hold: 0, in_review: 0 };
    state.rows.forEach(r => { if (c[r.status] != null) c[r.status]++; });
    return c;
  }, [state.rows]);

  // ── Mutations ────────────────────────────────────────────────────────
  const setS = (patch) => setState(s => ({ ...s, ...patch }));
  const setSFn = (fn) => setState(fn);

  const updateCell = (rid, key, value) => {
    setSFn(s => ({ ...s, rows: s.rows.map(r => r._rid === rid ? { ...r, [key]: value } : r) }));
  };
  const addRow = () => {
    const empty = { _rid: `r-${Date.now().toString(36)}` };
    state.columns.forEach(c => { empty[c.key] = c.type === 'check' ? false : ''; });
    empty.status = 'not_started';
    setSFn(s => ({ ...s, rows: [...s.rows, empty] }));
  };
  const insertRow = (rid, where) => {
    const empty = { _rid: `r-${Date.now().toString(36)}` };
    state.columns.forEach(c => { empty[c.key] = c.type === 'check' ? false : ''; });
    empty.status = 'not_started';
    setSFn(s => {
      const idx = s.rows.findIndex(r => r._rid === rid);
      const at = where === 'below' ? idx + 1 : idx;
      const next = [...s.rows];
      next.splice(at, 0, empty);
      return { ...s, rows: next };
    });
  };
  const duplicateRow = (rid) => {
    setSFn(s => {
      const idx = s.rows.findIndex(r => r._rid === rid);
      if (idx < 0) return s;
      const copy = { ...s.rows[idx], _rid: `r-${Date.now().toString(36)}` };
      const next = [...s.rows];
      next.splice(idx + 1, 0, copy);
      return { ...s, rows: next };
    });
  };
  const deleteRow = (rid) => {
    undoRef.current = state.rows;
    setSFn(s => ({ ...s, rows: s.rows.filter(r => r._rid !== rid) }));
    setToast({ msg: '1 row deleted', undo: true });
    setTimeout(() => setToast(null), 5000);
  };
  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} row${selected.size === 1 ? '' : 's'}?`)) return;
    undoRef.current = state.rows;
    setSFn(s => ({ ...s, rows: s.rows.filter(r => !selected.has(r._rid)) }));
    setToast({ msg: `${selected.size} rows deleted`, undo: true });
    setSelected(new Set());
    setTimeout(() => setToast(null), 5000);
  };
  const doUndo = () => {
    if (!undoRef.current) return;
    setSFn(s => ({ ...s, rows: undoRef.current }));
    undoRef.current = null;
    setToast(null);
  };

  const toggleSelectRow = (rid, idx, e) => {
    if (e && e.shiftKey && lastSelectedIdx !== null) {
      // range select
      const [lo, hi] = lastSelectedIdx < idx ? [lastSelectedIdx, idx] : [idx, lastSelectedIdx];
      const range = filteredRows.slice(lo, hi + 1).map(r => r._rid);
      setSelected(prev => {
        const next = new Set(prev);
        range.forEach(id => next.add(id));
        return next;
      });
    } else if (e && (e.ctrlKey || e.metaKey)) {
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(rid)) next.delete(rid); else next.add(rid);
        return next;
      });
      setLastSelectedIdx(idx);
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(rid)) next.delete(rid); else next.add(rid);
        return next;
      });
      setLastSelectedIdx(idx);
    }
  };
  const toggleSelectAll = () => {
    if (selected.size === filteredRows.length) setSelected(new Set());
    else setSelected(new Set(filteredRows.map(r => r._rid)));
  };

  // Column ops
  const addColumn = (col, def) => {
    setSFn(s => ({
      ...s,
      columns: [...s.columns, col],
      rows: s.rows.map(r => ({ ...r, [col.key]: col.type === 'check' ? (def === 'true') : def || '' })),
    }));
  };
  const renameColumn = (key, label) => {
    setSFn(s => ({ ...s, columns: s.columns.map(c => c.key === key ? { ...c, label } : c) }));
  };
  const deleteColumn = (key) => {
    if (!window.confirm('Delete this column? Its data will be lost.')) return;
    setSFn(s => ({
      ...s,
      columns: s.columns.filter(c => c.key !== key),
      rows: s.rows.map(r => { const n = { ...r }; delete n[key]; return n; }),
    }));
  };
  const toggleHideColumn = (key) => {
    setSFn(s => {
      const h = s.hidden || [];
      const next = h.includes(key) ? h.filter(k => k !== key) : [...h, key];
      return { ...s, hidden: next };
    });
  };
  const insertColumn = (atKey, where) => {
    const newCol = { key: `c_${Date.now().toString(36)}`, label: 'New column', type: 'text', width: 140 };
    setSFn(s => {
      const idx = s.columns.findIndex(c => c.key === atKey);
      const at = where === 'right' ? idx + 1 : idx;
      const next = [...s.columns];
      next.splice(at, 0, newCol);
      return {
        ...s,
        columns: next,
        rows: s.rows.map(r => ({ ...r, [newCol.key]: '' })),
      };
    });
    setRenameKey(newCol.key);
    setRenameVal('New column');
  };
  const moveColumn = (key, dir) => {
    setSFn(s => {
      const cols = [...s.columns];
      const idx = cols.findIndex(c => c.key === key);
      const target = idx + dir;
      if (target < 0 || target >= cols.length) return s;
      [cols[idx], cols[target]] = [cols[target], cols[idx]];
      return { ...s, columns: cols };
    });
  };
  const setColumnWidth = (key, width) => {
    setSFn(s => ({ ...s, columns: s.columns.map(c => c.key === key ? { ...c, width } : c) }));
  };
  const autofitColumn = (key) => {
    // Approximate widest content
    const col = state.columns.find(c => c.key === key);
    if (!col) return;
    const lengths = [col.label.length, ...state.rows.map(r => String(r[key] ?? '').length)];
    const max = Math.max(...lengths);
    const px = Math.max(COL_MIN_W, Math.min(COL_MAX_W, max * 8 + 32));
    setColumnWidth(key, px);
  };

  // Sort ops
  const onSortClick = (key, e) => {
    const shift = e && e.shiftKey;
    setSFn(s => {
      const cur = s.sort || [];
      const existing = cur.find(x => x.key === key);
      let next;
      if (!existing) {
        next = shift ? [...cur, { key, dir: 'asc' }] : [{ key, dir: 'asc' }];
      } else if (existing.dir === 'asc') {
        next = cur.map(x => x.key === key ? { ...x, dir: 'desc' } : x);
        if (!shift) next = [{ key, dir: 'desc' }];
      } else {
        next = cur.filter(x => x.key !== key);
      }
      return { ...s, sort: next };
    });
  };

  // ── Column resize ────────────────────────────────────────────────────
  const onColResizeStart = (e, key) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const col = state.columns.find(c => c.key === key);
    const startW = col.width;
    const move = (ev) => {
      const next = Math.max(COL_MIN_W, Math.min(COL_MAX_W, startW + (ev.clientX - startX)));
      setColumnWidth(key, next);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // ── Column drag-reorder ──────────────────────────────────────────────
  const colDragRef = useRef_tt(null);
  const [colDropIdx, setColDropIdx] = useState_tt(null);
  const onColDragStart = (e, key, idx) => {
    if (renameKey) return;
    e.dataTransfer.setData('text/x-col-key', key);
    e.dataTransfer.effectAllowed = 'move';
    colDragRef.current = { key, idx };
  };
  const onColDragOver = (e, idx) => {
    if (!colDragRef.current) return;
    e.preventDefault();
    setColDropIdx(idx);
  };
  const onColDrop = (e, dropIdx) => {
    e.preventDefault();
    const drag = colDragRef.current;
    setColDropIdx(null); colDragRef.current = null;
    if (!drag || drag.idx === dropIdx) return;
    setSFn(s => {
      const cols = [...s.columns];
      const visibleKeys = cols.filter(c => !(s.hidden || []).includes(c.key)).map(c => c.key);
      const fromKey = drag.key;
      const toKey = visibleKeys[dropIdx];
      if (!toKey) return s;
      const fromI = cols.findIndex(c => c.key === fromKey);
      const toI   = cols.findIndex(c => c.key === toKey);
      const [moved] = cols.splice(fromI, 1);
      cols.splice(toI, 0, moved);
      return { ...s, columns: cols };
    });
  };

  // ── Row drag-reorder ─────────────────────────────────────────────────
  const rowDragRef = useRef_tt(null);
  const [rowDropIdx, setRowDropIdx] = useState_tt(null);
  const onRowDragStart = (e, rid, idx) => {
    e.dataTransfer.setData('text/x-row-id', rid);
    e.dataTransfer.effectAllowed = 'move';
    rowDragRef.current = { rid, idx };
  };
  const onRowDragOver = (e, idx) => {
    if (!rowDragRef.current) return;
    e.preventDefault();
    setRowDropIdx(idx);
  };
  const onRowDrop = (e, dropIdx) => {
    e.preventDefault();
    const drag = rowDragRef.current;
    setRowDropIdx(null); rowDragRef.current = null;
    if (!drag || drag.idx === dropIdx) return;
    setSFn(s => {
      const rows = [...s.rows];
      const fromGlobalIdx = rows.findIndex(r => r._rid === drag.rid);
      const toRid = filteredRows[dropIdx]?._rid;
      if (!toRid) return s;
      const toGlobalIdx = rows.findIndex(r => r._rid === toRid);
      const [moved] = rows.splice(fromGlobalIdx, 1);
      rows.splice(toGlobalIdx, 0, moved);
      return { ...s, rows };
    });
  };

  // ── Row height resize ────────────────────────────────────────────────
  const onRowResizeStart = (e, rid) => {
    e.preventDefault(); e.stopPropagation();
    const startY = e.clientY;
    const startH = state.rowHeights?.[rid] ?? ROW_DEFAULT_HEIGHT;
    const move = (ev) => {
      const next = Math.max(ROW_MIN_HEIGHT, Math.min(ROW_MAX_HEIGHT, startH + (ev.clientY - startY)));
      setSFn(s => ({ ...s, rowHeights: { ...(s.rowHeights || {}), [rid]: next } }));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const resetTable = () => {
    if (!window.confirm("Reset this client's table to the original Excel data? Any local edits will be lost.")) return;
    localStorage.removeItem(STORAGE_KEY(clientId));
    setState(initialState(clientId));
    setSelected(new Set());
  };

  const clearAllFilters = () => {
    setStatusFilter('all'); setFilter('');
    setSFn(s => ({ ...s, sort: [] }));
  };

  // ── Cell render ──────────────────────────────────────────────────────
  const renderCell = (row, col) => {
    const v = row[col.key];
    const set = (val) => updateCell(row._rid, col.key, val);
    switch (col.type){
      case 'pill':     return <PillCell value={v} options={col.options || STATUS_OPTIONS} onChange={set}/>;
      case 'select':   return <SelectCell value={v} options={col.options || []} onChange={set}/>;
      case 'check':    return <CheckCell value={!!v} onChange={set}/>;
      case 'date':     return <DateCell value={v} onChange={set}/>;
      case 'longtext': return <TextCell value={v} onChange={set} multiline/>;
      case 'number':
      case 'currency':
      case 'percent':  return <TextCell value={v} onChange={set} type="number"/>;
      case 'url':
        if (v) return (
          <div className="tt-cell-view tt-cell-url">
            <a href={v} target="_blank" rel="noreferrer">{v} ↗</a>
          </div>
        );
        return <TextCell value={v} onChange={set}/>;
      default:         return <TextCell value={v} onChange={set}/>;
    }
  };

  // ── Context menu builders ────────────────────────────────────────────
  const openColMenu = (e, colKey) => {
    e.preventDefault();
    setColMenu({ x: e.clientX, y: e.clientY, colKey });
  };
  const openRowMenu = (e, rid) => {
    e.preventDefault();
    setRowMenu({ x: e.clientX, y: e.clientY, rid });
  };
  const colCtxItems = (colKey) => {
    const col = state.columns.find(c => c.key === colKey);
    if (!col) return [];
    return [
      { icon: <Icon.ChevronDown style={{ transform: 'rotate(180deg)' }}/>, label: 'Sort ascending',  onClick: (e) => onSortClick(colKey, { shiftKey: false }) },
      { icon: <Icon.ChevronDown/>, label: 'Sort descending', onClick: () => { onSortClick(colKey, { shiftKey: false }); onSortClick(colKey, { shiftKey: false }); } },
      { icon: <Icon.X/>, label: 'Clear sort',     onClick: () => setSFn(s => ({ ...s, sort: (s.sort || []).filter(x => x.key !== colKey) })) },
      '---',
      { icon: <Icon.ChevronLeft/>,  label: 'Move left',     onClick: () => moveColumn(colKey, -1) },
      { icon: <Icon.ChevronRight/>, label: 'Move right',    onClick: () => moveColumn(colKey, +1) },
      '---',
      { icon: <Icon.Edit/>,  label: 'Rename column', onClick: () => { setRenameKey(colKey); setRenameVal(col.label); } },
      { icon: <Icon.Filter/>,label: 'Hide column',   onClick: () => toggleHideColumn(colKey) },
      '---',
      { icon: <Icon.Plus/>,  label: 'Insert column left',  onClick: () => insertColumn(colKey, 'left') },
      { icon: <Icon.Plus/>,  label: 'Insert column right', onClick: () => insertColumn(colKey, 'right') },
      { icon: <Icon.X/>,     label: 'Delete column',       onClick: () => deleteColumn(colKey), danger: true },
      '---',
      { icon: <Icon.Search/>, label: 'Autofit width',  onClick: () => autofitColumn(colKey) },
    ];
  };
  const rowCtxItems = (rid) => [
    { icon: <Icon.Plus/>, label: 'Insert row above',  onClick: () => insertRow(rid, 'above') },
    { icon: <Icon.Plus/>, label: 'Insert row below',  onClick: () => insertRow(rid, 'below') },
    { icon: <Icon.File/>, label: 'Duplicate row',     onClick: () => duplicateRow(rid) },
    '---',
    { icon: <Icon.X/>,    label: 'Delete row',        onClick: () => deleteRow(rid), danger: true },
  ];

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="task-table-wrap">
      {/* Status filter pills */}
      <div className="tt-status-filter">
        {[
          { k: 'all',         l: 'All',         color: 'oklch(60% .02 250)' },
          { k: 'completed',   l: 'Completed',   color: 'oklch(55% .15 152)' },
          { k: 'in_progress', l: 'In Progress', color: 'oklch(55% .14 250)' },
          { k: 'not_started', l: 'Not Started', color: 'oklch(60% .02 250)' },
          { k: 'on_hold',     l: 'On Hold',     color: 'oklch(55% .14 30)'  },
        ].map(p => (
          <button key={p.k} type="button"
                  className={`tt-status-pill ${statusFilter === p.k ? 'on' : ''}`}
                  style={{ '--p': p.color }}
                  onClick={() => setStatusFilter(p.k)}>
            {p.l}<span className="tt-status-count">{statusCounts[p.k] || 0}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tt-toolbar">
        <div className="tt-toolbar-l">
          <button className="tt-toolbar-btn" onClick={addRow}><Icon.Plus/> Row</button>
          <button className="tt-toolbar-btn" onClick={() => setNewColOpen(true)}><Icon.Plus/> Column</button>
          <button className={`tt-toolbar-btn ${selected.size === 0 ? 'tt-disabled' : 'tt-danger'}`}
                  onClick={deleteSelected} disabled={selected.size === 0}>
            <Icon.X/> Delete{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
          <div className="tt-columns-btn-wrap">
            <button className="tt-toolbar-btn" onClick={() => setColumnsDropOpen(o => !o)}>
              Columns <Icon.ChevronDown/>
              {hidden.length > 0 && <span className="tt-toolbar-badge">{hidden.length}</span>}
            </button>
            {columnsDropOpen && (
              <ColumnsDropdown columns={state.columns} hidden={hidden}
                               onToggle={toggleHideColumn}
                               onClose={() => setColumnsDropOpen(false)}/>
            )}
          </div>
        </div>
        <div className="tt-toolbar-r">
          <div className="tt-search">
            <Icon.Search/>
            <input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)}/>
          </div>
          <button className="tt-toolbar-btn" onClick={clearAllFilters}
                  title="Reset all filters and column sort">
            Clear filters
          </button>
          <button className="tt-toolbar-btn" onClick={resetTable} title="Reload from Excel source">
            <Icon.Refresh/> Reset
          </button>
        </div>
      </div>

      {/* Status strip */}
      <div className="tt-strip">
        <span>{filteredRows.length} of {state.rows.length} rows</span>
        {sort.length > 0 && (
          <span className="tt-strip-sort">
            · Sorted by {sort.map(s => {
              const col = state.columns.find(c => c.key === s.key);
              return `${col?.label || s.key} ${s.dir === 'asc' ? '▲' : '▼'}`;
            }).join(', ')}
          </span>
        )}
        {hidden.length > 0 && <span>· {hidden.length} column{hidden.length === 1 ? '' : 's'} hidden</span>}
        {selected.size > 0 && <span className="tt-strip-sel">· {selected.size} row{selected.size === 1 ? '' : 's'} selected</span>}
        {(statusFilter !== 'all' || filter.trim()) && <span>· filter active</span>}
      </div>

      {/* Table */}
      <div className="task-table-scroll">
        <table className="task-table">
          <thead>
            <tr>
              <th className="tt-th-sel">
                <span className={`tt-checkbox ${selected.size > 0 && selected.size === filteredRows.length ? 'on' : ''} ${selected.size > 0 && selected.size < filteredRows.length ? 'partial' : ''}`}
                      onClick={toggleSelectAll}>
                  {selected.size > 0 && selected.size === filteredRows.length && <Icon.Check/>}
                </span>
              </th>
              <th className="tt-th-num">#</th>
              {visibleCols.map((col, idx) => {
                const sortEntry = sort.find(s => s.key === col.key);
                const sortIdx = sort.findIndex(s => s.key === col.key);
                return (
                  <th key={col.key}
                      className={`tt-th ${colDropIdx === idx ? 'tt-th-dropleft' : ''}`}
                      style={{ width: col.width, minWidth: col.width }}
                      draggable={renameKey !== col.key}
                      onDragStart={(e) => onColDragStart(e, col.key, idx)}
                      onDragOver={(e) => onColDragOver(e, idx)}
                      onDrop={(e) => onColDrop(e, idx)}
                      onContextMenu={(e) => openColMenu(e, col.key)}>
                    <div className="tt-th-inner" onClick={(e) => {
                      if (renameKey === col.key) return;
                      if (e.target.closest('.tt-th-resize') || e.target.closest('.tt-th-menu-btn')) return;
                      onSortClick(col.key, e);
                    }}>
                      {renameKey === col.key ? (
                        <input className="tt-th-rename"
                               autoFocus
                               value={renameVal}
                               onChange={(e) => setRenameVal(e.target.value)}
                               onBlur={() => { renameColumn(col.key, renameVal.trim() || col.label); setRenameKey(null); }}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter')  { renameColumn(col.key, renameVal.trim() || col.label); setRenameKey(null); }
                                 if (e.key === 'Escape') { setRenameKey(null); }
                               }}/>
                      ) : (
                        <span className="tt-th-label"
                              onDoubleClick={(e) => { e.stopPropagation(); setRenameKey(col.key); setRenameVal(col.label); }}>
                          {col.label}
                        </span>
                      )}
                      {sortEntry && (
                        <span className="tt-sort-ind">
                          {sortEntry.dir === 'asc' ? '▲' : '▼'}
                          {sort.length > 1 && <sub>{sortIdx+1}</sub>}
                        </span>
                      )}
                      <button className="tt-th-menu-btn" onClick={(e) => { e.stopPropagation(); openColMenu({ clientX: e.clientX, clientY: e.clientY, preventDefault: () => {} }, col.key); }} aria-label="Column menu">
                        <Icon.More/>
                      </button>
                    </div>
                    <span className="tt-th-resize"
                          onMouseDown={(e) => onColResizeStart(e, col.key)}
                          onDoubleClick={(e) => { e.stopPropagation(); autofitColumn(col.key); }}/>
                  </th>
                );
              })}
              <th className="tt-th-add">
                <button className="tt-th-add-btn" onClick={() => setNewColOpen(true)} aria-label="Add column">
                  <Icon.Plus/>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => {
              const h = state.rowHeights?.[row._rid] ?? ROW_DEFAULT_HEIGHT;
              return (
                <tr key={row._rid}
                    className={`${selected.has(row._rid) ? 'tt-row-selected' : ''} ${rowDropIdx === i ? 'tt-row-droptarget' : ''}`}
                    style={{ height: h }}
                    onDragOver={(e) => onRowDragOver(e, i)}
                    onDrop={(e) => onRowDrop(e, i)}>
                  <td className="tt-td-sel">
                    <span className={`tt-checkbox ${selected.has(row._rid) ? 'on' : ''}`}
                          onClick={(e) => toggleSelectRow(row._rid, i, e)}>
                      {selected.has(row._rid) && <Icon.Check/>}
                    </span>
                  </td>
                  <td className="tt-td-num"
                      draggable
                      onDragStart={(e) => onRowDragStart(e, row._rid, i)}
                      onContextMenu={(e) => openRowMenu(e, row._rid)}
                      onClick={(e) => toggleSelectRow(row._rid, i, e)}
                      title="Drag to reorder · right-click for menu">
                    <span className="tt-rownum-grip">⋮⋮</span>
                    <span className="tt-rownum-n">{i + 1}</span>
                    <span className="tt-row-resize"
                          onMouseDown={(e) => onRowResizeStart(e, row._rid)}/>
                  </td>
                  {visibleCols.map(col => (
                    <td key={col.key} className={`tt-td tt-td-${col.type}`}>
                      {renderCell(row, col)}
                    </td>
                  ))}
                  <td className="tt-td-spacer"/>
                </tr>
              );
            })}
            {filteredRows.length === 0 && (
              <tr><td colSpan={visibleCols.length + 3} className="tt-empty-row">No tasks match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="tt-foot">
        <button className="tt-add-row-btn" onClick={addRow}><Icon.Plus/> Add task</button>
      </div>

      {newColOpen && <NewColumnDialog onClose={() => setNewColOpen(false)} onAdd={addColumn}/>}
      {colMenu && <ContextMenu x={colMenu.x} y={colMenu.y} items={colCtxItems(colMenu.colKey)} onClose={() => setColMenu(null)}/>}
      {rowMenu && <ContextMenu x={rowMenu.x} y={rowMenu.y} items={rowCtxItems(rowMenu.rid)} onClose={() => setRowMenu(null)}/>}

      {/* Toast w/ undo */}
      {toast && (
        <div className="tt-toast">
          <span>{toast.msg}</span>
          {toast.undo && <button className="tt-toast-undo" onClick={doUndo}>Undo</button>}
        </div>
      )}

      {/* E6: SOW completeness check — suggested tasks missing from this client */}
      <SowSuggestions clientId={clientId}
                      currentRows={state.rows}
                      onAdoptOne={(suggestion) => {
                        const id = `r-${Date.now().toString(36)}`;
                        const empty = { _rid: id };
                        state.columns.forEach(c => { empty[c.key] = c.type === 'check' ? false : ''; });
                        Object.assign(empty, suggestion, { status: 'not_started' });
                        setSFn(s => ({ ...s, rows: [empty, ...s.rows] }));
                      }}/>
    </div>
  );
}

// ── SOW suggestions: list common SOW tasks NOT present in the client's table ──
const SOW_DEFAULT_TASKS = [
  { name: 'Brand Name',                        cat: 'Business',   phase: 'Discovery'  },
  { name: 'Tagline / slogan',                  cat: 'Business',   phase: 'Discovery'  },
  { name: 'Website Domain',                    cat: 'Business',   phase: 'Discovery'  },
  { name: 'Emails Creation',                   cat: 'Business',   phase: 'Discovery'  },
  { name: 'Company Snapshot',                  cat: 'Content',    phase: 'Discovery'  },
  { name: 'Business Clarity & Company Vision', cat: 'Business',   phase: 'Foundation' },
  { name: 'Marketing Competitors Analysis',    cat: 'Marketing',  phase: 'Foundation' },
  { name: 'Content Calendar & Planning',       cat: 'Content',    phase: 'Foundation' },
  { name: 'Social Media Content Creation',     cat: 'Content',    phase: 'Foundation' },
  { name: 'Hashtags & Keywords',               cat: 'Content',    phase: 'Foundation' },
  { name: 'Blog Posts',                        cat: 'Content',    phase: 'Foundation' },
  { name: 'Wikipedia',                         cat: 'Content',    phase: 'Foundation' },
  { name: 'Website Development',               cat: 'Tech',       phase: 'Activation' },
  { name: 'SEO Programme',                     cat: 'Marketing',  phase: 'Activation' },
  { name: 'Google Business Profile',           cat: 'Marketing',  phase: 'Activation' },
  { name: 'PR Programme',                      cat: 'Marketing',  phase: 'Growth'     },
  { name: 'Influencer Marketing',              cat: 'Marketing',  phase: 'Growth'     },
  { name: 'Performance Marketing',             cat: 'Marketing',  phase: 'Growth'     },
];

function SowSuggestions({ clientId, currentRows, onAdoptOne }){
  const [collapsed, setCollapsed] = useState_tt(true);
  const present = new Set(currentRows.map(r => (r.name || '').toLowerCase().trim()).filter(Boolean));
  const missing = SOW_DEFAULT_TASKS.filter(s => !present.has(s.name.toLowerCase()));
  if (missing.length === 0) {
    return (
      <div className="sow-sugg sow-sugg-done">
        <Icon.Check/> All SOW catalog items are present for this engagement.
      </div>
    );
  }
  return (
    <div className="sow-sugg">
      <button className="sow-sugg-h" onClick={() => setCollapsed(c => !c)}>
        <Icon.Plus className={`sow-sugg-toggle ${collapsed ? '' : 'open'}`}/>
        <span><strong>{missing.length}</strong> suggested task{missing.length === 1 ? '' : 's'} from SOW catalog not in this engagement</span>
      </button>
      {!collapsed && (
        <div className="sow-sugg-list">
          {missing.map(s => (
            <button key={s.name} type="button" className="sow-sugg-item"
                    onClick={() => onAdoptOne(s)}>
              <Icon.Plus/>
              <span className="sow-sugg-name">{s.name}</span>
              <span className="sow-sugg-meta">{s.phase} · {s.cat}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { TaskTable };
