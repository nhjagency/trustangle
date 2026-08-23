import React from 'react';
// Edit-mode provider + EditableText component.
// When edit mode is on, any field wrapped in <EditableText> becomes a
// contenteditable span; on blur its new value is stored in a single
// localStorage-backed override map keyed by a logical "path" like
// `client.rmz.name`. Components read overrides via useOverride() so
// derived values (progress bars, totals) reflect the edits too.
//
// A2 upgrade: each EditableText also supports per-element STYLE overrides
// (color, fontSize) stored under `<path>.style`. A floating toolbar
// appears next to the focused/hovered editable when edit mode is on.

const EditContext = React.createContext({
  editMode: false,
  setEditMode: () => {},
  overrides: {},
  setOverride: () => {},
  clearOverrides: () => {},
});

const OVERRIDE_KEY = 'nhj-overrides';

function EditProvider({ children }){
  const [editMode, setEditMode] = React.useState(false);
  const [overrides, setOverridesState] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}'); }
    catch (e) { return {}; }
  });
  // Tracks how many edits happened in this session — drives the
  // "unsaved changes" indicator in the edit banner.
  const [dirty, setDirty] = React.useState(0);

  React.useEffect(() => {
    document.body.classList.toggle('edit-mode', editMode);
  }, [editMode]);

  const setOverride = React.useCallback((path, value) => {
    setOverridesState(prev => {
      const next = { ...prev, [path]: value };
      try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setDirty(d => d + 1);
  }, []);

  const clearOverrides = React.useCallback(() => {
    setOverridesState({});
    setDirty(0);
    try { localStorage.removeItem(OVERRIDE_KEY); } catch (e) {}
  }, []);

  const commitSave = React.useCallback(() => setDirty(0), []);

  return (
    <EditContext.Provider value={{ editMode, setEditMode, overrides, setOverride, clearOverrides, dirty, commitSave }}>
      {children}
    </EditContext.Provider>
  );
}

function useEdit(){ return React.useContext(EditContext); }

function useOverride(path, fallback){
  const { overrides } = useEdit();
  return (overrides[path] !== undefined && overrides[path] !== null && overrides[path] !== '')
    ? overrides[path] : fallback;
}

// Small per-element style toolbar (color + font size +/-)
const STYLE_COLORS = [
  null,                // reset to default
  'oklch(45% .15 250)', // blue
  'oklch(52% .19 27)',  // orange
  'oklch(50% .14 152)', // green
  'oklch(45% .18 295)', // plum
  'oklch(58% .14 60)',  // gold
  'oklch(30% .02 250)', // dark
];

function EditStyleToolbar({ path }){
  const { setOverride, overrides } = useEdit();
  const styleKey = `${path}.style`;
  const current = overrides[styleKey] || {};
  const setStyle = (next) => setOverride(styleKey, { ...current, ...next });
  const bumpSize = (delta) => {
    const cur = parseFloat(current.fontSize) || 0;
    const next = Math.max(8, (cur || 14) + delta);
    setStyle({ fontSize: next + 'px' });
  };
  return (
    <div className="edit-tool" onMouseDown={(e) => e.preventDefault()}>
      <button className="et-btn" onClick={() => bumpSize(-1)} title="Decrease font size">A−</button>
      <button className="et-btn" onClick={() => bumpSize(+1)} title="Increase font size">A+</button>
      <span className="et-sep"></span>
      {STYLE_COLORS.map((c, i) => (
        <button key={i}
                className={`et-sw ${current.color === c ? 'on' : ''} ${c === null ? 'reset' : ''}`}
                title={c === null ? 'Reset color' : 'Apply color'}
                style={c ? { background: c } : {}}
                onClick={() => setStyle({ color: c })}>
          {c === null ? '⊘' : ''}
        </button>
      ))}
    </div>
  );
}

function EditableText({ path, fallback, className = '', multiline = false, asNumber = false, suffix = '', prefix = '' }){
  const { editMode, setOverride, overrides } = useEdit();
  const value = useOverride(path, fallback);
  const style = overrides[`${path}.style`] || null;
  const [showTool, setShowTool] = React.useState(false);

  if (!editMode) {
    return <span className={className} style={style || undefined}>{prefix}{value}{suffix}</span>;
  }

  return (
    <span
      className={`editable ${className}`}
      style={style || undefined}
      contentEditable
      suppressContentEditableWarning
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onFocus={() => setShowTool(true)}
      onMouseEnter={() => setShowTool(true)}
      onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) setShowTool(false); }}
      onBlur={(e) => {
        let v = e.currentTarget.textContent.trim();
        if (asNumber) {
          const n = parseFloat(v);
          v = isNaN(n) ? fallback : n;
        }
        if (String(v) !== String(value)) setOverride(path, v);
        setTimeout(() => setShowTool(false), 150);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.currentTarget.textContent = String(value);
          e.currentTarget.blur();
        }
      }}
    >
      {value}
      {showTool && <EditStyleToolbar path={path}/>}
    </span>
  );
}

// ── A2: Drag-to-reorder + resize handles ─────────────────────────────────
// <EditGroup name="..."> declares a reorderable set; each direct child must
// be an <EditFrame id="..."> registering its slot. Order persists in the
// override map under `group.<name>.order`, sizes under `frame.<id>.size`.
// In NON-edit mode, the frame collapses to `display: contents` so it does
// not affect the host layout (e.g. CSS grids) unless a size is saved.

const EditGroupCtx = React.createContext(null);

function EditGroup({ name, children }){
  const { editMode, overrides, setOverride } = useEdit();
  const kids = React.Children.toArray(children).filter(Boolean);
  const ids = kids.map((c, i) => c?.props?.id || c?.key || `slot-${i}`);
  const orderKey = `group.${name}.order`;
  const savedOrder = overrides[orderKey];

  let arranged = kids;
  if (Array.isArray(savedOrder)) {
    const map = new Map();
    kids.forEach((c, i) => map.set(ids[i], c));
    arranged = savedOrder.map(id => map.get(id)).filter(Boolean);
    // Append any new items not yet in saved order
    kids.forEach((c, i) => {
      if (!savedOrder.includes(ids[i])) arranged.push(c);
    });
  }

  const moveItem = React.useCallback((fromId, toId) => {
    const baseOrder = savedOrder || ids;
    const next = baseOrder.filter(id => id !== fromId);
    const idx = next.indexOf(toId);
    if (idx < 0) next.push(fromId);
    else next.splice(idx, 0, fromId);
    setOverride(orderKey, next);
  }, [savedOrder, ids.join('|'), orderKey, setOverride]);

  return (
    <EditGroupCtx.Provider value={{ moveItem, editMode, groupName: name }}>
      {arranged}
    </EditGroupCtx.Provider>
  );
}

function EditFrame({ id, children, resizable = false, label = '', className = '' }){
  const ctx = React.useContext(EditGroupCtx);
  const { editMode, overrides, setOverride } = useEdit();
  const sizeKey = `frame.${id}.size`;
  const savedSize = overrides[sizeKey] || null;
  const ref = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const onDragStart = (e) => {
    e.dataTransfer.setData('text/x-frame-id', id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('ef-dragging');
  };
  const onDragEnd = (e) => {
    e.currentTarget.classList.remove('ef-dragging');
    setDragOver(false);
  };
  const onDragOver = (e) => {
    if (Array.from(e.dataTransfer.types).includes('text/x-frame-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    const fromId = e.dataTransfer.getData('text/x-frame-id');
    setDragOver(false);
    if (fromId && fromId !== id && ctx?.moveItem) {
      ctx.moveItem(fromId, id);
      e.preventDefault();
    }
  };

  const onResizePointer = (e) => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const rect = ref.current.getBoundingClientRect();
    const startW = rect.width, startH = rect.height;
    const move = (ev) => {
      const w = Math.max(140, startW + (ev.clientX - startX));
      const h = Math.max(80,  startH + (ev.clientY - startY));
      ref.current.style.width  = w + 'px';
      ref.current.style.height = h + 'px';
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const final = ref.current.getBoundingClientRect();
      setOverride(sizeKey, { width: Math.round(final.width), height: Math.round(final.height) });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const clearSize = (e) => {
    e.stopPropagation();
    setOverride(sizeKey, null);
    if (ref.current) { ref.current.style.width = ''; ref.current.style.height = ''; }
  };

  const style = {};
  if (savedSize?.width)  style.width  = savedSize.width + 'px';
  if (savedSize?.height) style.height = savedSize.height + 'px';

  // Non-edit mode + no saved size → become invisible to layout (display:contents)
  if (!editMode && !savedSize) {
    return <>{children}</>;
  }

  if (!editMode) {
    return <div ref={ref} className={className} style={style}>{children}</div>;
  }

  return (
    <div ref={ref}
         className={`edit-frame ${dragOver ? 'ef-drop' : ''} ${className}`}
         style={style}
         draggable
         onDragStart={onDragStart}
         onDragEnd={onDragEnd}
         onDragOver={onDragOver}
         onDragLeave={onDragLeave}
         onDrop={onDrop}>
      <span className="ef-handle" title={`Drag to reorder${label ? ' · ' + label : ''}`}>
        <svg viewBox="0 0 12 16" width="10" height="14" aria-hidden="true">
          <circle cx="3" cy="3"  r="1.2"/><circle cx="9" cy="3"  r="1.2"/>
          <circle cx="3" cy="8"  r="1.2"/><circle cx="9" cy="8"  r="1.2"/>
          <circle cx="3" cy="13" r="1.2"/><circle cx="9" cy="13" r="1.2"/>
        </svg>
        {label && <span className="ef-label">{label}</span>}
      </span>
      {savedSize && <button className="ef-reset" onClick={clearSize} title="Reset size">⟲</button>}
      {children}
      {resizable && (
        <span className="ef-resize" onPointerDown={onResizePointer} title="Resize"/>
      )}
    </div>
  );
}

export { EditProvider, useEdit, useOverride, EditableText, EditGroup, EditFrame };
