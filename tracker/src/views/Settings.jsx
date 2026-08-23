import React from 'react';
import { Portal, Icon, nameSlug, TeamAvatar, AVATAR_PRESETS, setAvatarData, getAvatar } from '../components/ui.jsx';
import { useLang } from '../lib/i18n.jsx';

const { useState: useState_s, useEffect: useEffect_s, useMemo: useMemo_s } = React;

// ─── Team Members (settings) ──────────────────────────────────────────
const TEAM_KEY = 'nhj-team';

const DEPARTMENTS = [
  { key: 'nhj', name: 'NHJ — Strategic',    color: 'var(--nhj-blue)'   },
  { key: 'whj', name: 'WHJ — Creative',     color: 'var(--whj-orange)' },
  { key: 'rwj', name: 'RWJ — Growth',       color: 'var(--rwj-green)'  },
  { key: 'ops', name: 'Operations',         color: 'oklch(50% .03 260)' },
];

const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', flag: 'https://flagcdn.com/sa.svg' },
  { code: 'SY', name: 'Syria',        flag: 'https://flagcdn.com/sy.svg' },
  { code: 'AE', name: 'UAE',          flag: 'https://flagcdn.com/ae.svg' },
  { code: 'EG', name: 'Egypt',        flag: 'https://flagcdn.com/eg.svg' },
  { code: 'JO', name: 'Jordan',       flag: 'https://flagcdn.com/jo.svg' },
  { code: 'QA', name: 'Qatar',        flag: 'https://flagcdn.com/qa.svg' },
  { code: 'KW', name: 'Kuwait',       flag: 'https://flagcdn.com/kw.svg' },
  { code: 'TR', name: 'Türkiye',      flag: 'https://flagcdn.com/tr.svg' },
];

const PALETTE = [
  'oklch(48% .18 295)', 'oklch(42% .12 260)', 'oklch(48% .19 25)',
  'oklch(58% .12 85)',  'oklch(42% .14 152)', 'oklch(46% .14 252)',
  'oklch(50% .18 28)',  'oklch(58% .11 95)',  'oklch(52% .14 55)',
  'oklch(50% .15 200)', 'oklch(55% .15 130)', 'oklch(45% .14 320)',
];

function loadTeam() {
  try { return JSON.parse(localStorage.getItem(TEAM_KEY) || '{}'); }
  catch (e) { return {}; }
}
function saveTeam(obj) {
  try { localStorage.setItem(TEAM_KEY, JSON.stringify(obj)); } catch (e) {}
}

// Build merged member list = defaults (from data.js) overlaid by user edits/additions
function buildMembers(custom){
  const TL = window.TEAM_LEADERS || {};
  const defaults = Object.entries(TL).map(([key, v]) => ({
    id: key,
    name: v.name,
    email: v.email,
    color: v.color,
    role: key === 'sana' ? 'admin' : 'manager',
    department: 'nhj',
    position: 'Marketing Manager',
    locations: ['SA','SY'],
    isDefault: true,
  }));
  // Merge defaults with custom (overrides + additions)
  const map = {};
  defaults.forEach(d => { map[d.id] = { ...d, ...(custom[d.id] || {}) }; });
  Object.keys(custom).forEach(id => {
    if (!map[id]) map[id] = { ...custom[id], id };
  });
  return Object.values(map);
}

function AvatarEditor({ slug, color, name, onClose }){
  const FRAME = 240;
  const initial = getAvatar(slug) || { url: '', zoom: 1, x: 0, y: 0 };
  const originalRef = React.useRef(initial);
  const [zoom, setZoom] = React.useState(initial.zoom || 1);
  const [pos, setPos] = React.useState({ x: initial.x || 0, y: initial.y || 0 });
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    if (!originalRef.current.url) return;
    setAvatarData(slug, { url: originalRef.current.url, zoom, x: pos.x, y: pos.y });
  }, [zoom, pos.x, pos.y, slug]);

  const onPointerDown = (e) => {
    e.preventDefault();
    const start = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const move = (ev) => {
      setPos({
        x: start.px + (ev.clientX - start.mx) / FRAME,
        y: start.py + (ev.clientY - start.my) / FRAME,
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const cancel = () => {
    setAvatarData(slug, originalRef.current);
    onClose();
  };
  const save = () => onClose();

  if (!initial.url) { onClose(); return null; }

  return (
    <Portal>
      <div className="modal-backdrop on" onClick={cancel}>
        <div className="modal ae-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Adjust photo</h3>
          <div className="sub">Drag to reposition, slide to resize.</div>
  
          <div className="ae-frame" ref={dragRef} onPointerDown={onPointerDown}>
            <div className="ae-frame-inner" style={{
              transform: `translate(${pos.x * 100}%, ${pos.y * 100}%) scale(${zoom})`,
            }}>
              <img src={initial.url} alt="" draggable={false}/>
            </div>
            <div className="ae-grid"></div>
          </div>
  
          <div className="field" style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Size</span>
              <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(zoom * 100)}%</span>
            </label>
            <input type="range" min="0.5" max="3" step="0.05" value={zoom}
                   onChange={(e) => setZoom(parseFloat(e.target.value))}/>
          </div>
  
          <div className="modal-foot">
            <button className="btn-ghost" onClick={cancel}>Cancel</button>
            <button className="btn-primary accent" onClick={save}>Save</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function TeamProfileModal({ member, departments, onClose, onSave, onDelete }){
  const isNew = !member?.id;
  const [name,    setName]    = useState_s(member?.name || '');
  const [dept,    setDept]    = useState_s(member?.department || 'nhj');
  const [pos,     setPos]     = useState_s(member?.position || '');
  const [email,   setEmail]   = useState_s(member?.email || '');
  const [locs,    setLocs]    = useState_s(member?.locations || ['SA']);
  const [role,    setRole]    = useState_s(member?.role || 'manager');
  const [color,   setColor]   = useState_s(member?.color || PALETTE[Math.floor(Math.random() * PALETTE.length)]);

  // Avatar editing
  const slug = name.trim() ? nameSlug(name) : (member?.id || 'preview');
  const fileRef = React.useRef(null);
  const [showAvatarEdit, setShowAvatarEdit] = React.useState(false);
  const [, forceRender] = React.useState(0);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      setAvatarData(slug, { url: ev.target.result, zoom: 1, x: 0, y: 0 });
      forceRender(n => n + 1);
      setShowAvatarEdit(true);
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };
  const usePreset = (kind) => {
    setAvatarData(slug, { url: AVATAR_PRESETS[kind], zoom: 1, x: 0, y: 0 });
    forceRender(n => n + 1);
  };
  const removePhoto = () => {
    setAvatarData(slug, null);
    forceRender(n => n + 1);
  };
  const hasPhoto = !!getAvatar(slug);

  const [locOpen, setLocOpen] = useState_s(false);
  const locRef = React.useRef(null);
  useEffect_s(() => {
    const onDoc = (e) => { if (locRef.current && !locRef.current.contains(e.target)) setLocOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggleLoc = (code) => {
    setLocs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const id = member?.id || ('m-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36));
    onSave({
      id,
      name: name.trim(),
      department: dept,
      position: pos.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g,'.')}@nhj.example`,
      locations: locs,
      role,
      color,
    });
  };

  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal modal-wide profile-modal" onClick={(e) => e.stopPropagation()}>
          <h3>{isNew ? 'Add Team Member' : `Edit ${member.name}`}</h3>
          <div className="sub">All fields are saved locally to this prototype.</div>
  
          <div className="profile-hd">
            <div className="profile-avatar-stack">
              <TeamAvatar name={name || '?'} color={color} size={72} kind="circle"
                          border={dept === 'nhj' ? 'var(--nhj-blue)'
                                : dept === 'whj' ? 'var(--whj-orange)'
                                : dept === 'rwj' ? 'var(--rwj-green)'
                                : 'oklch(75% .15 90)'}/>
            </div>
            <div className="profile-hd-r">
              <div className="profile-actions">
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile}/>
                <button type="button" className="btn-primary accent" onClick={() => fileRef.current?.click()}>
                  <Icon.Plus/> {hasPhoto ? 'Replace photo' : 'Upload photo'}
                </button>
                <div className="profile-presets">
                  <button type="button" className="profile-preset" onClick={() => usePreset('male')} title="Use male placeholder">
                    <img src={AVATAR_PRESETS.male} alt="Male"/>
                  </button>
                  <button type="button" className="profile-preset" onClick={() => usePreset('female')} title="Use female placeholder">
                    <img src={AVATAR_PRESETS.female} alt="Female"/>
                  </button>
                </div>
                {hasPhoto && (
                  <>
                    <button type="button" className="btn-ghost" onClick={() => setShowAvatarEdit(true)}>
                      <Icon.Edit/> Adjust
                    </button>
                    <button type="button" className="btn-ghost profile-remove" onClick={removePhoto}>
                      <Icon.X/> Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
  
          <div className="field-row">
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus/>
            </div>
            <div className="field">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@nhj.example"/>
            </div>
          </div>
  
          <div className="field-row">
            <div className="field">
              <label>Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map(d => <option key={d.key} value={d.key}>{d.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Position</label>
              <input value={pos} onChange={(e) => setPos(e.target.value)} placeholder="e.g. Marketing Manager"/>
            </div>
          </div>
  
          <div className="field-row">
            <div className="field">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="field" ref={locRef}>
              <label>Location</label>
              <div className="multi-select">
                <button type="button" className="multi-select-trigger" onClick={() => setLocOpen(o => !o)}>
                  {locs.length === 0
                    ? <span className="ms-placeholder">Select…</span>
                    : <span className="ms-chips">
                        {locs.map(code => {
                          const c = COUNTRIES.find(x => x.code === code);
                          if (!c) return null;
                          return <span key={code} className="ms-chip">
                            <img className="ms-flag-img" src={c.flag} alt={c.name}/>
                            {c.name}
                            <span className="ms-x" onClick={(e) => { e.stopPropagation(); toggleLoc(code); }}>×</span>
                          </span>;
                        })}
                      </span>}
                  <Icon.ChevronDown className="ms-caret"/>
                </button>
                {locOpen && (
                  <div className="multi-select-menu">
                    {COUNTRIES.map(c => {
                      const on = locs.includes(c.code);
                      return (
                        <button type="button" key={c.code}
                                className={`ms-item ${on ? 'on' : ''}`}
                                onClick={() => toggleLoc(c.code)}>
                          <span className={`ms-check ${on ? 'on' : ''}`}>{on && <Icon.Check/>}</span>
                          <img className="ms-flag-img" src={c.flag} alt={c.name}/>
                          <span className="ms-name">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
  
          <div className="modal-foot">
            {!isNew && onDelete && !member.isDefault && (
              <button className="btn-ghost" style={{ color: 'var(--whj-orange)', borderColor: 'color-mix(in oklab, var(--whj-orange) 30%, transparent)' }}
                      onClick={() => { onDelete(member.id); onClose(); }}>Remove</button>
            )}
            <div style={{ flex: 1 }}/>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary accent" onClick={() => { handleSave(); onClose(); }}>
              {isNew ? 'Add Member' : 'Save'}
            </button>
          </div>
        </div>
        {showAvatarEdit && (
          <AvatarEditor slug={slug} color={color} name={name} onClose={() => { setShowAvatarEdit(false); forceRender(n => n + 1); }}/>
        )}
      </div>
    </Portal>
  );
}

// ── SOW Terms & Conditions content (sourced from the NHJ SOW PDF) ─────
const SOW_TERMS = [
  {
    id: 'confidentiality',
    title: 'Confidentiality',
    body: [
      'All information exchanged between NHJ and the Client — whether written, verbal, visual, or digital — is treated as confidential.',
      'Confidential information shall not be disclosed, shared, or distributed to any third party without prior written consent, and shall be used solely for the purpose of executing and managing the services outlined in the SOW.',
      'All strategies, concepts, methodologies, templates, and creative outputs remain the intellectual property of NHJ Group unless otherwise agreed in writing.',
      'Obligations remain in effect throughout the term of the engagement and for one year following its completion or termination.',
    ]
  },
  {
    id: 'roles',
    title: '3.10 Roles & Responsibilities',
    body: [
      '**NHJ Agency** — deliver approved services, coordinate internal teams, maintain quality and timelines, and assign a dedicated Account Manager as the single point of contact.',
      '**Client** — provide input, materials, and approvals in a timely manner; assign a single point of contact; and provide feedback within the timeframe defined by the Account Manager. Absence of feedback within this window is considered formal approval.',
    ]
  },
  {
    id: 'acceptance',
    title: '3.11 Acceptance Criteria',
    body: [
      'Deliverables are considered accepted upon written confirmation via a signed Certificate of Completion (CoC).',
      'A CoC is issued at the end of each project phase (Foundation, Activation, Growth) and upon completion of any one-time deliverable.',
    ]
  },
  {
    id: 'assumptions',
    title: '3.12 Assumptions & Constraints',
    body: [
      'Service timelines depend on the agreed project plan and client feedback turnaround.',
      'Scope remains fixed unless a formal Change Request is approved in writing by both parties.',
      'NHJ assumes the client will provide all required brand assets, access credentials, and briefing materials within 10 business days of kickoff.',
    ]
  },
  {
    id: 'comms',
    title: '3.13 Communication & Meeting Cadence',
    body: [
      'Primary channel agreed at kickoff (WhatsApp, Email, or Microsoft Teams).',
      'Weekly status update shared by the NHJ Account Manager every Thursday.',
      'Monthly review meeting covers performance, deliverables, and upcoming priorities.',
      'All approvals must be communicated in writing (email or signed document).',
    ]
  },
  {
    id: 'onboarding',
    title: '3.14 Onboarding & Kickoff',
    body: [
      'Kickoff meeting within 5 business days of signing.',
      'Brand and business intake form completed by the client.',
      'Access credentials and asset handover.',
      'Shared project plan and timeline confirmation.',
      'Introduction to the dedicated NHJ Account Manager and team.',
    ]
  },
  {
    id: 'revisions',
    title: '3.15 Revision Policy',
    body: [
      'Each deliverable includes up to two (2) rounds of revisions as standard.',
      'Additional revision rounds beyond the standard allowance are billed at the applicable man-day rate.',
      'Revisions must be submitted as consolidated feedback in a single communication.',
      'Major scope changes within a deliverable (e.g. full redesign or change of direction) are not considered revisions and require a Change Request.',
    ]
  },
  {
    id: 'termination',
    title: '3.17 Termination',
    body: [
      'Either party may terminate the SOW with 30 days written notice.',
      'In the event of early termination by the client, fees for services already delivered or in-progress remain due.',
      'NHJ may terminate immediately in the event of non-payment exceeding 45 days or material breach.',
      'Upon termination, NHJ will deliver all completed work to the client within 10 business days.',
    ]
  },
  {
    id: 'change-mgmt',
    title: '3.18 Change Management',
    body: [
      'Any scope, timeline, or deliverable changes must be agreed upon in writing via a formal Change Request signed by authorized representatives of both parties.',
    ]
  },
  {
    id: 'force-majeure',
    title: '3.19 Force Majeure',
    body: [
      'Neither party is liable for delays or failures resulting from circumstances beyond reasonable control — including natural disasters, government actions, civil unrest, or system outages.',
      'The affected party must notify the other in writing within 5 business days of the event.',
    ]
  },
];

function Bold({ children }){
  // Renders **bold** spans inside SOW text.
  const parts = String(children).split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith('**')
    ? <strong key={i} style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.slice(2, -2)}</strong>
    : <span key={i}>{p}</span>)}</>;
}

// ── Helpers for security & integrations ────────────────────────────────
function exportAuditCsv(flash){
  const now = new Date();
  const rows = [
    ['timestamp','actor','action','target','ip','user_agent'],
    [now.toISOString(),                              'sana@nhj.example',  'sign_in',         'workspace',        '93.40.12.5',  'Chrome 128 · macOS'],
    [new Date(now-3600e3).toISOString(),             'esraa@nhj.example', 'task.complete',   'Silver Foundation', '5.107.4.222', 'Safari 17 · iOS'],
    [new Date(now-2*3600e3).toISOString(),           'rewa@nhj.example',  'engagement.edit', 'T-Cafe',           '93.40.12.18', 'Firefox 130 · Windows'],
    [new Date(now-4*3600e3).toISOString(),           'khulod@nhj.example','attachment.add',  'LYNNC',            '5.107.4.99',  'Chrome 128 · Windows'],
    [new Date(now-26*3600e3).toISOString(),          'sana@nhj.example',  'role.change',     'Lama Al-Sheikh',   '93.40.12.5',  'Chrome 128 · macOS'],
    [new Date(now-48*3600e3).toISOString(),          'ayah@nhj.example',  'integration.connect','Microsoft Teams','5.107.4.10', 'Edge 128 · Windows'],
    [new Date(now-72*3600e3).toISOString(),          'maha@nhj.example',  'task.create',     'Nowa',             '5.107.4.55',  'Chrome 128 · macOS'],
  ];
  const csv = rows.map(r => r.map(v => /[,"\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `nhj-audit-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  flash && flash('Audit log exported');
}

const FAKE_SESSIONS = [
  { id: 's1', device: 'MacBook Pro · Chrome',  location: 'Riyadh, SA',    when: 'Active now',     current: true },
  { id: 's2', device: 'iPhone 15 · Safari',    location: 'Damascus, SY',  when: '2 hours ago' },
  { id: 's3', device: 'Windows · Edge',        location: 'Riyadh, SA',    when: '2 days ago' },
];

function SessionsModal({ onClose, flash }){
  const [list, setList] = useState_s(FAKE_SESSIONS);
  const revoke = (id) => { setList(prev => prev.filter(s => s.id !== id)); flash && flash('Session revoked'); };
  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
          <h3>Active sessions</h3>
          <div className="sub">Devices currently signed in to this workspace.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {list.map(s => (
              <div key={s.id} className="settings-row" style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
                <div className="l">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.device}
                    {s.current && <span className="role-pill" style={{ background: 'color-mix(in oklab, var(--rwj-green) 14%, var(--surface))', color: 'var(--rwj-green)', borderColor: 'color-mix(in oklab, var(--rwj-green) 30%, transparent)' }}>This device</span>}
                  </h4>
                  <p>{s.location} · {s.when}</p>
                </div>
                <div className="r">
                  {!s.current && <button className="btn-ghost" onClick={() => revoke(s.id)} style={{ color: 'var(--whj-orange)' }}>Revoke</button>}
                </div>
              </div>
            ))}
            {list.filter(s => !s.current).length === 0 && (
              <div style={{ padding: 12, color: 'var(--ink-soft)', fontStyle: 'italic' }}>No other active sessions.</div>
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

function ConfigureIntegrationModal({ name, onClose, flash }){
  const cfg = INTEG_DEFAULTS[name] || { fields: [] };
  const [vals, setVals] = useState_s(cfg.defaults);
  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Configure {name}</h3>
          <div className="sub">{cfg.sub}</div>
          {cfg.fields.map(f => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              {f.type === 'select'
                ? <select value={vals[f.key]} onChange={(e) => setVals(v => ({ ...v, [f.key]: e.target.value }))}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                : <input value={vals[f.key]} onChange={(e) => setVals(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder}/>}
            </div>
          ))}
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary accent" onClick={() => { flash && flash(`${name} settings saved`); onClose(); }}>Save</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const INTEG_DEFAULTS = {
  'WhatsApp Business': {
    sub: 'Sync messages from your Business API number into client timelines.',
    fields: [
      { key: 'number', label: 'Business number', placeholder: '+966 ...' },
      { key: 'channel', label: 'Inbox', type: 'select', options: ['Shared', 'Per-engagement'] },
    ],
    defaults: { number: '+966 50 123 4567', channel: 'Per-engagement' },
  },
  'Microsoft Teams': {
    sub: 'Auto-create meetings for weekly status calls.',
    fields: [
      { key: 'tenant', label: 'Tenant', placeholder: 'nhj.onmicrosoft.com' },
      { key: 'channel', label: 'Default channel', placeholder: '#portfolio' },
    ],
    defaults: { tenant: 'nhj.onmicrosoft.com', channel: '#portfolio' },
  },
  'Google Calendar': {
    sub: 'Create events when meetings are scheduled in a drawer.',
    fields: [
      { key: 'cal', label: 'Default calendar', placeholder: 'team@nhj.example' },
      { key: 'visibility', label: 'Visibility', type: 'select', options: ['Default', 'Private', 'Public'] },
    ],
    defaults: { cal: 'team@nhj.example', visibility: 'Default' },
  },
  'Slack': {
    sub: 'Post status changes to a Slack channel.',
    fields: [
      { key: 'workspace', label: 'Workspace', placeholder: 'nhj.slack.com' },
      { key: 'channel', label: 'Channel', placeholder: '#portfolio' },
    ],
    defaults: { workspace: 'nhj.slack.com', channel: '#portfolio' },
  },
  'Stripe': {
    sub: 'Link Stripe invoices to engagements.',
    fields: [
      { key: 'account', label: 'Account ID', placeholder: 'acct_...' },
      { key: 'mode', label: 'Mode', type: 'select', options: ['Live', 'Test'] },
    ],
    defaults: { account: 'acct_1Q...', mode: 'Live' },
  },
  'Notion': {
    sub: 'Mirror engagement briefs into a Notion database.',
    fields: [
      { key: 'db', label: 'Database ID', placeholder: 'a1b2c3...' },
      { key: 'sync', label: 'Sync direction', type: 'select', options: ['Two-way', 'NHJ → Notion', 'Notion → NHJ'] },
    ],
    defaults: { db: 'a1b2c3d4', sync: 'Two-way' },
  },
};

function Settings(){
  const { t } = useLang();
  const [section, setSection] = useState_s('general');
  const [autoRenew, setAutoRenew] = useState_s(true);
  const [weeklyDigest, setWeeklyDigest] = useState_s(true);
  const [dueAlerts, setDueAlerts] = useState_s(true);
  const [slack, setSlack] = useState_s(false);
  const [twoFactor, setTwoFactor] = useState_s(true);

  // Toast
  const [toast, setToast] = useState_s('');
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  // Integrations connection state
  const [integ, setInteg] = useState_s({
    'WhatsApp Business': true,
    'Microsoft Teams':   true,
    'Google Calendar':   true,
    'Slack':             false,
    'Stripe':            true,
    'Notion':            true,
  });
  const [configuring, setConfiguring] = useState_s(null); // integration name being configured
  const [sessionsOpen, setSessionsOpen] = useState_s(false);
  const [termsEditing, setTermsEditing] = useState_s(false);
  const [termsContent, setTermsContent] = useState_s(SOW_TERMS);

  // Dynamic team members (defaults from data.js, overrides/additions in localStorage)
  const [customTeam, setCustomTeam] = useState_s(() => loadTeam());
  const members = useMemo_s(() => buildMembers(customTeam), [customTeam]);

  const [editingMember, setEditingMember] = useState_s(null);  // null | { ...member } | { __new: true }

  // ── Admin mode (kudos history access) ────────────────────────────
  const ADMIN_CODE = 'NHJ-ADMIN-2026';
  const [isAdmin, setIsAdmin] = useState_s(() => {
    try { return localStorage.getItem('nhj_admin_mode') === 'true'; } catch (e) { return false; }
  });
  const [adminInput, setAdminInput] = useState_s('');
  const [adminErr, setAdminErr] = useState_s(false);
  const unlockAdmin = () => {
    if (adminInput.trim() === ADMIN_CODE){
      setIsAdmin(true);
      setAdminErr(false);
      setAdminInput('');
      try { localStorage.setItem('nhj_admin_mode', 'true'); } catch (e) {}
      flash('Admin mode active');
    } else {
      setAdminErr(true);
    }
  };
  const lockAdmin = () => {
    setIsAdmin(false);
    try { localStorage.setItem('nhj_admin_mode', 'false'); } catch (e) {}
    flash('Admin mode locked');
  };

  // ── Kudos history (admin panel data) ─────────────────────────────
  const [kudosHistory, setKudosHistory] = useState_s(() => {
    try {
      const raw = localStorage.getItem('nhj_kudos_history');
      const v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  });
  useEffect_s(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem('nhj_kudos_history');
        const v = raw ? JSON.parse(raw) : [];
        setKudosHistory(Array.isArray(v) ? v : []);
      } catch (e) { setKudosHistory([]); }
    };
    refresh();
    window.addEventListener('nhj-kudos-history-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('nhj-kudos-history-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const deleteKudo = (id) => {
    const next = kudosHistory.filter(k => k.id !== id);
    setKudosHistory(next);
    try { localStorage.setItem('nhj_kudos_history', JSON.stringify(next)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('nhj-kudos-history-changed')); } catch (e) {}
    flash('Kudos entry deleted');
  };
  const clearAllKudos = () => {
    if (!window.confirm('Delete the entire kudos history? This cannot be undone.')) return;
    setKudosHistory([]);
    try { localStorage.setItem('nhj_kudos_history', '[]'); } catch (e) {}
    try { localStorage.setItem('nhj_employee_kudos_points', '{}'); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('nhj-kudos-history-changed')); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('nhj-kudos-points-changed')); } catch (e) {}
    flash('Kudos history cleared');
  };

  const sections = [
    ['general',  t('set_general')],
    ['team',     t('set_team')],
    ['notify',   t('set_notify')],
    ['integ',    t('set_integ')],
    ['security', t('set_security')],
    ['admin',    'Admin'],
    ['terms',    'Terms & Conditions'],
  ];

  const upsertMember = (m) => {
    setCustomTeam(prev => {
      const next = { ...prev, [m.id]: m };
      saveTeam(next);
      return next;
    });
  };
  const removeMember = (id) => {
    setCustomTeam(prev => {
      const next = { ...prev };
      delete next[id];
      saveTeam(next);
      return next;
    });
  };

  return (
    <div className="settings-grid">
      <div className="settings-nav">
        {sections.map(([k,l]) => (
          <button key={k} className={section === k ? 'on' : ''} onClick={() => setSection(k)}>
            {l}
          </button>
        ))}
      </div>

      <div className="settings-panel">
        {section === 'general' && <>
          <h2 className="set-h">{t('set_general')}</h2>
          <p className="set-sub">Portfolio defaults that affect every engagement.</p>

          <div className="settings-row">
            <div className="l"><h4>Workspace name</h4><p>The label shown in your portfolio header.</p></div>
            <div className="r">
              <input defaultValue="NHJ Portfolio" className="set-input"/>
            </div>
          </div>
          <div className="settings-row">
            <div className="l"><h4>Auto-renew engagements</h4><p>Renew active engagements 30 days before expiry.</p></div>
            <div className="r"><div className={`switch ${autoRenew ? 'on' : ''}`} onClick={() => setAutoRenew(!autoRenew)}></div></div>
          </div>
          <div className="settings-row">
            <div className="l"><h4>Contract term default</h4><p>Defined in SOW §3.9 — 12 months from start date.</p></div>
            <div className="r">
              <select defaultValue="12" className="set-input">
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
          </div>
        </>}

        {section === 'team' && <>
          <h2 className="set-h">{t('set_team')}</h2>
          <p className="set-sub">{members.length} team members have access. Click any row to edit their profile.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
            {members.map(m => {
              const dept = DEPARTMENTS.find(d => d.key === m.department) || DEPARTMENTS[0];
              const deptBorder = dept.key === 'nhj' ? 'var(--nhj-blue)'
                : dept.key === 'whj' ? 'var(--whj-orange)'
                : dept.key === 'rwj' ? 'var(--rwj-green)'
                : 'oklch(75% .15 90)';
              return (
                <div key={m.id} className="member-row">
                  <TeamAvatar name={m.name} color={m.color} size={40} kind="circle" border={deptBorder}/>
                  <div className="member-info">
                    <div className="member-name">{m.name}</div>
                    <div className="member-pos">{m.position || 'Marketing Manager'}</div>
                  </div>
                  <button className="btn-ghost" onClick={() => setEditingMember(m)}>
                    <Icon.Edit/> Settings
                  </button>
                  <button className="btn-ghost" onClick={() => setEditingMember(m)}>
                    <Icon.User/> Roles
                  </button>
                </div>
              );
            })}
          </div>
          <button className="btn-primary accent" onClick={() => setEditingMember({ __new: true })}>
            <Icon.Plus/> Add Team Member
          </button>
        </>}

        {section === 'notify' && <>
          <h2 className="set-h">{t('set_notify')}</h2>
          <p className="set-sub">Choose what reaches your inbox and when.</p>
          <div className="settings-row">
            <div className="l"><h4>Weekly portfolio digest</h4><p>Sent Thursdays — matches SOW §3.13 cadence.</p></div>
            <div className="r"><div className={`switch ${weeklyDigest ? 'on' : ''}`} onClick={() => setWeeklyDigest(!weeklyDigest)}></div></div>
          </div>
          <div className="settings-row">
            <div className="l"><h4>Due-soon alerts</h4><p>Email at 8 AM the day a task is due or overdue.</p></div>
            <div className="r"><div className={`switch ${dueAlerts ? 'on' : ''}`} onClick={() => setDueAlerts(!dueAlerts)}></div></div>
          </div>
          <div className="settings-row">
            <div className="l"><h4>Slack mentions</h4><p>Send notifications to your team's #portfolio channel.</p></div>
            <div className="r"><div className={`switch ${slack ? 'on' : ''}`} onClick={() => setSlack(!slack)}></div></div>
          </div>
        </>}

        {section === 'integ' && <>
          <h2 className="set-h">{t('set_integ')}</h2>
          <p className="set-sub">Sync engagements with the tools you already use.</p>
          {[
            { n: 'WhatsApp Business', d: 'Primary client comms channel per SOW §3.13.' },
            { n: 'Microsoft Teams',   d: 'Weekly status + monthly review meetings.' },
            { n: 'Google Calendar',   d: 'Auto-create events for scheduled meetings.' },
            { n: 'Slack',             d: 'Notify channels when statuses change.' },
            { n: 'Stripe',            d: 'Track invoices alongside engagements.' },
            { n: 'Notion',            d: 'Embed engagement briefs and SOW templates.' },
          ].map(it => {
            const on = integ[it.n];
            return (
              <div key={it.n} className="settings-row">
                <div className="l">
                  <h4>{it.n} {on && <span className="role-pill" style={{ marginLeft: 6, background: 'color-mix(in oklab, var(--rwj-green) 16%, var(--surface))', color: 'var(--rwj-green)', borderColor: 'color-mix(in oklab, var(--rwj-green) 30%, transparent)' }}>Connected</span>}</h4>
                  <p>{it.d}</p>
                </div>
                <div className="r" style={{ display: 'flex', gap: 6 }}>
                  {on
                    ? <>
                        <button className="btn-ghost" onClick={() => setConfiguring(it.n)}>Configure</button>
                        <button className="btn-ghost" onClick={() => { setInteg(s => ({ ...s, [it.n]: false })); flash(`${it.n} disconnected`); }}>Disconnect</button>
                      </>
                    : <button className="btn-primary accent" onClick={() => { setInteg(s => ({ ...s, [it.n]: true })); flash(`${it.n} connected`); }}><Icon.Plus/> Connect</button>
                  }
                </div>
              </div>
            );
          })}
        </>}

        {section === 'security' && <>
          <h2 className="set-h">{t('set_security')}</h2>
          <p className="set-sub">Protect your workspace.</p>
          <div className="settings-row">
            <div className="l"><h4>Two-factor authentication</h4><p>Require an authenticator code on sign-in.</p></div>
            <div className="r"><div className={`switch ${twoFactor ? 'on' : ''}`} onClick={() => setTwoFactor(!twoFactor)}></div></div>
          </div>
          <div className="settings-row">
            <div className="l"><h4>Sessions</h4><p>3 active devices · oldest from Riyadh, 2 days ago.</p></div>
            <div className="r"><button className="btn-ghost" onClick={() => setSessionsOpen(true)}>Review</button></div>
          </div>
          <div className="settings-row">
            <div className="l"><h4>Audit log</h4><p>Export the last 90 days of actions.</p></div>
            <div className="r"><button className="btn-ghost" onClick={() => exportAuditCsv(flash)}><Icon.File/> Export CSV</button></div>
          </div>
        </>}

        {section === 'admin' && <>
          <h2 className="set-h">Admin</h2>
          <p className="set-sub">Elevated access for kudos moderation and audit. Lock when you're done.</p>

          {/* Admin Access */}
          <div className="settings-subhead">Admin Access</div>
          {!isAdmin ? (
            <div className="admin-unlock">
              <input
                type="password"
                className="set-input"
                placeholder="Admin code"
                value={adminInput}
                onChange={(e) => { setAdminInput(e.target.value); setAdminErr(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') unlockAdmin(); }}
                aria-label="Admin Code"
              />
              <button className="btn-primary accent" onClick={unlockAdmin}>Unlock</button>
              {adminErr && <div className="admin-err">Incorrect code</div>}
            </div>
          ) : (
            <div className="admin-status">
              <span className="admin-status-badge">
                <span className="admin-status-dot" aria-hidden="true"/>
                Admin mode active
              </span>
              <button className="btn-ghost" onClick={lockAdmin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2"/>
                  <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
                </svg>
                Lock
              </button>
            </div>
          )}

          {/* Kudos History — admin only */}
          {isAdmin && (
            <>
              <div className="settings-subhead" style={{ marginTop: 28 }}>
                Kudos History
                <span className="kh-count">{kudosHistory.length} entr{kudosHistory.length === 1 ? 'y' : 'ies'}</span>
              </div>
              <p className="set-sub" style={{ marginTop: 0 }}>Every kudo sent across the team, newest first. Removing an entry does not undo previously-awarded points.</p>

              {kudosHistory.length === 0 ? (
                <div className="kh-empty">No kudos have been sent yet.</div>
              ) : (
                <>
                  <div className="kh-table-wrap">
                    <table className="kh-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Message</th>
                          <th className="kh-pts-th">Points</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {kudosHistory.map(k => {
                          const d = new Date(k.timestamp);
                          const datePart = isFinite(d) ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                          const timePart = isFinite(d) ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                          return (
                            <tr key={k.id}>
                              <td className="kh-date">
                                <span>{datePart}</span>
                                <span className="kh-time">· {timePart}</span>
                              </td>
                              <td>{k.fromName || 'Anonymous'}</td>
                              <td className="kh-to">{k.toEmployeeName}</td>
                              <td className="kh-msg" title={k.message}>{k.message}</td>
                              <td className="kh-pts">
                                <span className="kh-pts-pill">+{k.points}</span>
                              </td>
                              <td className="kh-act">
                                <button className="kh-del" onClick={() => deleteKudo(k.id)} aria-label="Delete kudo">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M3 6h18"/>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="kh-foot">
                    <button className="btn-ghost kh-clear" onClick={clearAllKudos}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                      Clear all history & points
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </>}

        {section === 'terms' && <>
          <h2 className="set-h">Scope of Work — Terms & Conditions</h2>
          <p className="set-sub">Sourced from the NHJ SOW document (Sections 3.10–3.19 + Confidentiality). Applies to every engagement.</p>

          <div className="terms-meta">
            <div className="terms-meta-row">
              <span className="l">Contract term</span><span className="v">12 months from start date <span className="role-pill">SOW §3.9</span></span>
            </div>
            <div className="terms-meta-row">
              <span className="l">Service phases</span><span className="v">Foundation → Activation → Growth</span>
            </div>
            <div className="terms-meta-row">
              <span className="l">Signed by (NHJ)</span><span className="v">Bashar Mashal</span>
            </div>
            <div className="terms-meta-row">
              <span className="l">Document version</span><span className="v">Dated 10/05/2026</span>
            </div>
          </div>

          <div className="terms-list">
            {termsContent.map((term, ti) => (
              <details key={term.id} className="term" open={termsEditing}>
                <summary>
                  <span>{termsEditing
                    ? <input
                        value={term.title}
                        onChange={(e) => {
                          const next = [...termsContent];
                          next[ti] = { ...term, title: e.target.value };
                          setTermsContent(next);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ font: 'inherit', color: 'inherit', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', width: '70%' }}
                      />
                    : term.title}</span>
                  {!termsEditing && <Icon.ChevronDown className="chev"/>}
                </summary>
                <div className="term-body">
                  {term.body.map((p, i) => (
                    termsEditing
                      ? <textarea key={i} value={p} rows={Math.max(2, Math.ceil(p.length / 80))}
                                  onChange={(e) => {
                                    const next = [...termsContent];
                                    const body = [...term.body];
                                    body[i] = e.target.value;
                                    next[ti] = { ...term, body };
                                    setTermsContent(next);
                                  }}
                                  style={{ width: '100%', font: 'inherit', color: 'inherit', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', marginBottom: 8, resize: 'vertical' }}/>
                      : <p key={i}><Bold>{p}</Bold></p>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <a className="btn-ghost" href="uploads/nhj-sow.pdf" target="_blank" rel="noreferrer" download="NHJ-SOW.pdf">
              <Icon.File/> Download SOW (PDF)
            </a>
            {termsEditing
              ? <>
                  <button className="btn-ghost" onClick={() => { setTermsContent(SOW_TERMS); setTermsEditing(false); }}>Cancel</button>
                  <button className="btn-primary accent" onClick={() => { setTermsEditing(false); flash('Terms saved locally'); }}>
                    <Icon.Check/> Save terms
                  </button>
                </>
              : <button className="btn-primary accent" onClick={() => setTermsEditing(true)}>
                  <Icon.Edit/> Edit terms
                </button>}
          </div>
        </>}
      </div>

      {editingMember && (
        <TeamProfileModal
          member={editingMember.__new ? null : editingMember}
          departments={DEPARTMENTS}
          onClose={() => setEditingMember(null)}
          onSave={(m) => upsertMember(m)}
          onDelete={removeMember}
        />
      )}

      {sessionsOpen && <SessionsModal onClose={() => setSessionsOpen(false)} flash={flash}/>}
      {configuring && <ConfigureIntegrationModal name={configuring} onClose={() => setConfiguring(null)} flash={flash}/>}

      <div className={`toast ${toast ? 'on' : ''}`}>
        <span className="dot"></span>{toast}
      </div>
    </div>
  );
}

window.Settings = Settings;

export { Settings };
