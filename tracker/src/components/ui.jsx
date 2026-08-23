import React from 'react';
import ReactDOM from 'react-dom';
// Shared small components & SVG icons.

// ─── Portal ───────────────────────────────────────────────────────────
// Every in-app modal/drawer must wrap its top-level <div className="modal-backdrop">
// (or equivalent overlay) in <Portal>. This:
//   1. Renders the children into document.body via ReactDOM.createPortal,
//      escaping any parent stacking context (e.g. .gw widgets, .panel,
//      transformed/filtered ancestors) so modals always sit above content.
//   2. Locks body scroll while the portal is mounted, restoring the
//      previous overflow value on unmount so nested portals nest cleanly.
// The on-disk modal CSS already handles z-index (9998 backdrop / 9999 modal).
function Portal({ children }){
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = prev;
      // Only release the class if no other portal is still open.
      if (!document.querySelector('.modal-backdrop')) {
        document.body.classList.remove('modal-open');
      }
    };
  }, []);
  return ReactDOM.createPortal(children, document.body);
}

const Icon = {
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>
    </svg>
  ),
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9l6 6 6-6"/></svg>
  ),
  ChevronRight: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6l6 6-6 6"/></svg>
  ),
  ChevronLeft: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 6l-6 6 6 6"/></svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>
  ),
  More: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l5 5L20 7"/></svg>
  ),
  Up: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 14l5-5 5 5"/></svg>
  ),
  Filter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 4h18l-7 9v6l-4-2v-4z"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6l-12 12"/></svg>
  ),
  Paperclip: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 11.5l-9 9a5.5 5.5 0 0 1-7.78-7.78l9-9a3.5 3.5 0 0 1 4.95 4.95l-8.49 8.49a1.5 1.5 0 0 1-2.12-2.12l7.78-7.78"/>
    </svg>
  ),
  Link: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/>
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>
    </svg>
  ),
  File: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>
    </svg>
  ),
  Sparkles: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>
    </svg>
  ),
};

function Pill({ status, children, ...rest }){
  const cls = { active:'', pending:'pending', prospect:'prospect', hold:'hold' }[status] || '';
  return <span className={`card-pill ${cls}`} {...rest}>{children}</span>;
}

function todayISO(){
  return '2026-05-17';
}

function dueRel(iso){
  if (!iso) return { label: '—', state: '' };
  const t = new Date(todayISO());
  const d = new Date(iso);
  const days = Math.round((d - t) / 86400000);
  if (days < 0) return { label: `${-days}d overdue`, state: 'over' };
  if (days === 0) return { label: 'Today', state: 'soon' };
  if (days === 1) return { label: 'Tomorrow', state: 'soon' };
  if (days <= 7)  return { label: `In ${days}d`, state: 'soon' };
  const m = d.toLocaleString('en-US', { month: 'short' });
  return { label: `${m} ${d.getDate()}`, state: 'future' };
}

function shortDate(iso){
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


// Slug a person name for stable image-slot ids
function nameSlug(name){
  return (name || 'unknown').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}


// ─── Avatar store: photo + zoom + position per team-member slug ───────
const NHJ_AVATAR_KEY = 'nhj-avatars';
function loadAvatars() {
  try { return JSON.parse(localStorage.getItem(NHJ_AVATAR_KEY) || '{}'); }
  catch (e) { return {}; }
}
function saveAvatars(obj) {
  try { localStorage.setItem(NHJ_AVATAR_KEY, JSON.stringify(obj)); } catch (e) {}
}
function getAvatar(slug) { return loadAvatars()[slug] || null; }
function setAvatarData(slug, data) {
  const all = loadAvatars();
  if (data == null) delete all[slug];
  else all[slug] = data;
  saveAvatars(all);
  window.dispatchEvent(new CustomEvent('nhj-avatars-changed', { detail: { slug } }));
}

function useAvatar(slug) {
  const [data, setData] = React.useState(() => getAvatar(slug));
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.detail || e.detail.slug === slug) setData(getAvatar(slug));
    };
    window.addEventListener('nhj-avatars-changed', handler);
    return () => window.removeEventListener('nhj-avatars-changed', handler);
  }, [slug]);
  return data;
}

// Pre-built SVG avatar placeholders (gender-neutral but visually distinct)
const AVATAR_PRESETS = {
  male: 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    + '<rect width="100" height="100" fill="#dde8f5"/>'
    + '<path d="M28 96c0-22 10-36 22-36s22 14 22 36" fill="#7a8aa8"/>'
    + '<circle cx="50" cy="40" r="17" fill="#b9c4d4"/>'
    + '<path d="M34 32q4-12 16-12t16 12q2 6-2 6-4-6-14-6t-14 6q-4 0-2-6z" fill="#3a4658"/>'
    + '<circle cx="44" cy="40" r="1.6" fill="#2a323e"/>'
    + '<circle cx="56" cy="40" r="1.6" fill="#2a323e"/>'
    + '<path d="M46 48q4 3 8 0" stroke="#5a6878" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
    + '</svg>'),
  female: 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    + '<rect width="100" height="100" fill="#fde8ee"/>'
    + '<path d="M22 88c2-26 12-44 28-44s26 18 28 44H22z" fill="#5b3a4a"/>'
    + '<path d="M28 96c0-22 10-36 22-36s22 14 22 36" fill="#e8a4b3"/>'
    + '<ellipse cx="50" cy="42" rx="16" ry="18" fill="#f0bfc7"/>'
    + '<path d="M30 38c0-14 8-22 20-22s20 8 20 22q0 6-2 8-2-12-18-12-18 0-18 12-2-2-2-8z" fill="#5b3a4a"/>'
    + '<circle cx="44" cy="42" r="1.6" fill="#3a2530"/>'
    + '<circle cx="56" cy="42" r="1.6" fill="#3a2530"/>'
    + '<path d="M46 50q4 3 8 0" stroke="#b86878" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
    + '</svg>'),
};

// Rebuilt TeamAvatar that uses the avatar store; falls back to colored initials
function TeamAvatarPhoto({ name, color, size = 32, radius, kind = 'rounded', className = '', border, ring = 'department' }){
  const slug = nameSlug(name);
  const av = useAvatar(slug);
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('');
  const isCircle = kind === 'circle';
  const px = typeof size === 'number' ? size + 'px' : size;
  const r = radius != null ? radius : Math.round(size * 0.28);
  const hasImg = !!(av && av.url);
  const tx = av && av.x != null ? av.x : 0;
  const ty = av && av.y != null ? av.y : 0;
  const zm = av && av.zoom != null ? av.zoom : 1;
  return (
    <span
      className={`team-avatar ${className}`}
      style={{
        '--ta-c': hasImg ? 'transparent' : (color || 'var(--ink)'),
        '--ta-size': px,
        '--ta-r': isCircle ? '50%' : r + 'px',
        '--ta-fs': Math.round(size * 0.36) + 'px',
        '--ta-border': border || 'transparent',
      }}
      data-has-photo={hasImg ? '1' : '0'}
    >
      {hasImg ? (
        <span className="ta-img-wrap">
          <span className="ta-img-inner" style={{
            transform: `translate(${tx * 100}%, ${ty * 100}%) scale(${zm})`,
          }}>
            <img src={av.url} alt={name} draggable={false}/>
          </span>
        </span>
      ) : (
        <span className="ta-initials">{initials}</span>
      )}
    </span>
  );
}

export {
  Portal,
  Icon,
  Pill,
  todayISO,
  dueRel,
  shortDate,
  nameSlug,
  loadAvatars,
  getAvatar,
  setAvatarData,
  useAvatar,
  AVATAR_PRESETS,
  TeamAvatarPhoto,
  // The photo-aware avatar is the one every view uses.
  TeamAvatarPhoto as TeamAvatar,
};
