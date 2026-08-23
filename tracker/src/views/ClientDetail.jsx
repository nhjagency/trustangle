import React from 'react';
import { Portal, Icon, Pill, shortDate, TeamAvatar } from '../components/ui.jsx';
import { useLang } from '../lib/i18n.jsx';
import { useEdit, EditableText } from '../lib/editable.jsx';
import { TaskTable } from './TaskTable.jsx';
import { logoSrc } from '../logos/index.js';

const { useState: useState_d, useEffect: useEffect_d, useRef: useRef_d, useMemo: useMemo_d } = React;

// ── Engagement overrides storage (Information-tab edits, per client) ──
const ENG_OVERRIDES_KEY = 'nhj_engagement_overrides';
function loadAllEngagementOverrides(){
  try { return JSON.parse(localStorage.getItem(ENG_OVERRIDES_KEY) || '{}'); }
  catch (e) { return {}; }
}
function loadEngagementOverrides(clientId){
  return loadAllEngagementOverrides()[clientId] || {};
}
function saveEngagementOverrides(clientId, data){
  try {
    const all = loadAllEngagementOverrides();
    all[clientId] = data;
    localStorage.setItem(ENG_OVERRIDES_KEY, JSON.stringify(all));
  } catch (e) {}
}

// Region options for the dropdown
const REGION_OPTIONS = ['SA','UAE','KW','QA','BH','OM','EG','JO','LB','SY','IQ','YE','MA','TN','DZ','Other'];

// Add N months to an ISO date string (YYYY-MM-DD); returns ISO string.
function addMonthsIso(iso, n){
  if (!iso || !n) return iso || '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  d.setMonth(d.getMonth() + Number(n));
  // guard against month-end overflow
  if (d.getDate() < day) d.setDate(0);
  return d.toISOString().slice(0, 10);
}

// Extract first integer from a string like "12 months"
function parseTermMonths(str, fallback = 12){
  if (typeof str === 'number') return str;
  const m = String(str || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : fallback;
}

// ── Attachment storage (localStorage, scoped to client+task) ───────────
function loadAttachments(clientId){
  try {
    const raw = localStorage.getItem(`nhj-attach-${clientId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function saveAttachments(clientId, data){
  try { localStorage.setItem(`nhj-attach-${clientId}`, JSON.stringify(data)); } catch (e) {}
}

function AttachPopover({ taskKey, attachments, onAdd, onClose }){
  const { t } = useLang();
  const fileRef = useRef_d(null);
  const [link, setLink] = useState_d('');
  const [label, setLabel] = useState_d('');

  useEffect_d(() => {
    const onDoc = (e) => { if (!e.target.closest('.attach-pop')) onClose(); };
    setTimeout(() => document.addEventListener('click', onDoc), 0);
    return () => document.removeEventListener('click', onDoc);
  }, [onClose]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onAdd({ type: 'file', name: f.name, size: f.size, when: Date.now() });
    onClose();
  };

  const onAddLink = () => {
    if (!link.trim()) return;
    let url = link.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    onAdd({ type: 'link', name: label.trim() || url.replace(/^https?:\/\//, '').replace(/\/$/,''), url, when: Date.now() });
    onClose();
  };

  return (
    <div className="attach-pop" onClick={(e) => e.stopPropagation()}>
      <h5>{t('attach_label')}</h5>
      <div className="btn-row">
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Icon.File/> {t('attach_file')}
        </button>
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={onFile}/>
      </div>
      <h5 style={{ marginTop: 8 }}>{t('attach_link')}</h5>
      <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder={t('link_placeholder')}/>
      <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('link_label_placeholder')} style={{ marginTop: 6 }}/>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn-primary accent" onClick={onAddLink} disabled={!link.trim()}>{t('attach_add')}</button>
      </div>
    </div>
  );
}

function TaskRow({ task, idx, attachments, clientId, onToggle, onAttach, onRemoveAttach }){
  const { t } = useLang();
  const { editMode } = useEdit();
  const [popOpen, setPopOpen] = useState_d(false);
  const taskKey = task.id;
  const items = attachments || [];
  const catColor = task.cat && SOW_CATEGORIES[task.cat]?.color;
  const catLabel = task.cat && SOW_CATEGORIES[task.cat]?.label;
  const hasAttach = items.length > 0;

  return (
    <div className={`task ${task.done ? 'done' : ''}`}>
      <div className="task-check" onClick={onToggle}><Icon.Check/></div>
      <div className="task-mid" onClick={(e) => { if (!editMode) onToggle(); }}>
        <div className="task-name">
          <EditableText path={`task.${clientId}.${task.id}.name`} fallback={task.name}/>
        </div>
        <div className="task-meta">
          {task.cat && (
            <span className="task-cat" style={{ '--c-cat': catColor }} title={catLabel}>
              <span className="task-cat-dot"></span>
              {catLabel}
            </span>
          )}
          {task.who && (
            <span className="who" style={{ '--c-who': task.whoColor }}>
              <TeamAvatar name={task.who} color={task.whoColor} size={16} radius={5} className="who-avatar"/>
              <EditableText path={`task.${clientId}.${task.id}.who`} fallback={task.who}/>
            </span>
          )}
          {task.freq && (
            <span className="task-freq">{task.freq}</span>
          )}
        </div>
        {items.length > 0 && (
          <div className="attach-chips">
            {items.map((a, i) => (
              <span key={i} className="attach-chip" title={a.url || a.name}>
                {a.type === 'link'
                  ? <a href={a.url} target="_blank" rel="noreferrer" className="chip-link"><Icon.Link/> <span className="label">{a.name}</span></a>
                  : <span className="chip-link"><Icon.File/> <span className="label">{a.name}</span></span>}
                <button className="x" onClick={(e) => { e.stopPropagation(); onRemoveAttach(i); }} aria-label="Remove">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Change #8: due-date slot reserved on every row */}
      {task.due
        ? <div className={`task-due ${task.state || ''}`}>
            <EditableText path={`task.${clientId}.${task.id}.due`} fallback={task.due}/>
          </div>
        : <div className="task-due task-due-empty">No date</div>}

      {/* Change #9: attachment button only shown for tasks with attachments */}
      <div className="task-actions">
        <div style={{ position: 'relative' }}>
          {hasAttach ? (
            <>
              <button className="task-attach has"
                      onClick={(e) => { e.stopPropagation(); setPopOpen(o => !o); }}
                      aria-label={t('attach_label')}>
                <Icon.Paperclip/>
                <span className="task-attach-count">{items.length}</span>
              </button>
              {popOpen && (
                <AttachPopover taskKey={taskKey}
                               attachments={items}
                               onAdd={(a) => onAttach(a)}
                               onClose={() => setPopOpen(false)}/>
              )}
            </>
          ) : (
            // Edit-mode: still expose a small "+ attach" affordance so users can add
            editMode && (
              <>
                <button className="task-attach add-only"
                        onClick={(e) => { e.stopPropagation(); setPopOpen(o => !o); }}
                        title={t('attach_label')}
                        aria-label={t('attach_label')}>
                  <Icon.Plus/>
                </button>
                {popOpen && (
                  <AttachPopover taskKey={taskKey}
                                 attachments={items}
                                 onAdd={(a) => onAttach(a)}
                                 onClose={() => setPopOpen(false)}/>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline action modals (Email, Add task, Schedule meeting) ──────────
function EmailPopover({ contact, client, onClose }){
  const email = contact?.email || `${client.id}@example.co`;
  const name  = contact?.primary || client.owner;
  const [subject, setSubject] = useState_d(`${client.name} — quick check-in`);
  const [body, setBody] = useState_d(`Hi ${name?.split(' ')[0] || ''},\n\nFollowing up on the ${client.name} engagement.\n\nBest,\n`);
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
          <h3>Email {name}</h3>
          <div className="sub">{email}</div>
          <div className="field">
            <label>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}/>
          </div>
          <div className="field">
            <label>Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}/>
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <a className="btn-primary accent" href={href} onClick={onClose}><Icon.Mail/> Open in mail app</a>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function AddTaskModal({ client, leaders, onClose, onAdd }){
  const [name, setName] = useState_d('');
  const [cat, setCat]   = useState_d(Object.keys(SOW_CATEGORIES)[0] || '');
  const [who, setWho]   = useState_d(client.leader || (leaders[0]?.name || ''));
  const [due, setDue]   = useState_d('');
  const canSave = name.trim().length > 0;
  const submit = () => {
    if (!canSave) return;
    const leaderObj = leaders.find(l => l.name === who);
    const task = {
      id: `t-new-${Date.now().toString(36)}`,
      name: name.trim(),
      cat,
      who,
      whoColor: leaderObj?.color || client.leaderColor || 'oklch(50% .15 260)',
      due: due ? new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      dueIso: due || null,
      state: '',
      done: false,
    };
    onAdd(task);
    onClose();
  };
  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
          <h3>Add task to {client.name}</h3>
          <div className="sub">New tasks are saved locally to this prototype.</div>
          <div className="field">
            <label>Task</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Draft Q3 content calendar" autoFocus/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Category</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                {Object.entries(SOW_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Assignee</label>
              <select value={who} onChange={(e) => setWho(e.target.value)}>
                {leaders.map(l => <option key={l.name}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Due date</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)}/>
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary accent" onClick={submit} disabled={!canSave}>
              <Icon.Plus/> Add task
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function ScheduleMeetingModal({ client, contact, onClose, onScheduled }){
  const today = new Date();
  const next  = new Date(today.getTime() + 24 * 3600 * 1000);
  const iso   = next.toISOString().slice(0, 10);
  const [date, setDate] = useState_d(iso);
  const [time, setTime] = useState_d('10:00');
  const [dur, setDur]   = useState_d(30);
  const [channel, setChannel] = useState_d('teams');
  const [title, setTitle] = useState_d(`${client.name} · Weekly check-in`);
  const [attendees, setAttendees] = useState_d(contact?.email || `${client.id}@example.co`);

  const submit = () => {
    onScheduled(`Meeting scheduled · ${new Date(date + 'T' + time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`);
    onClose();
  };

  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
          <h3>Schedule meeting · {client.name}</h3>
          <div className="sub">Weekly status cadence per SOW §3.13. Invite is mocked in this prototype.</div>
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}/>
            </div>
            <div className="field">
              <label>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}/>
            </div>
            <div className="field">
              <label>Duration</label>
              <select value={dur} onChange={(e) => setDur(parseInt(e.target.value))}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="teams">Microsoft Teams</option>
              <option value="whatsapp">WhatsApp video call</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div className="field">
            <label>Attendees</label>
            <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="email, email, …"/>
          </div>
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary accent" onClick={submit}><Icon.Calendar/> Send invite</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function ClientDetail({ client, onClose, onEdit, onFlash }){
  const { t, lang } = useLang();
  const [tab, setTab] = useState_d('overview');
  const detail = window.CLIENT_DETAILS[client?.id] || {};
  const [tasks, setTasks] = useState_d(() => detail.tasks ? [...detail.tasks] : []);
  const [attachments, setAttachments] = useState_d(() => loadAttachments(client?.id || ''));
  const [showEmail, setShowEmail] = useState_d(false);
  const [showAddTask, setShowAddTask] = useState_d(false);
  const [showSchedule, setShowSchedule] = useState_d(false);

  // ── Engagement overrides (persisted Information-tab edits) ──────────
  const [overrides, setOverrides] = useState_d(() => loadEngagementOverrides(client?.id || ''));
  const [infoEditing, setInfoEditing] = useState_d(false);
  const [infoDraft, setInfoDraft]     = useState_d(null);
  const [infoErr, setInfoErr]         = useState_d('');

  // Refresh overrides whenever the drawer opens a new client
  useEffect_d(() => {
    setOverrides(loadEngagementOverrides(client?.id || ''));
    setInfoEditing(false);
    setInfoDraft(null);
    setInfoErr('');
  }, [client?.id]);

  // Build effective client + detail by layering overrides on baseline
  const effectiveClient = useMemo_d(() => ({
    ...client,
    region:    overrides.region          ?? client?.region,
    phase:     overrides.phase           ?? client?.phase,
    status:    overrides.status          ?? client?.status,
    size:      overrides.size            ?? client?.size,
    founder:   overrides.founder         ?? client?.founder,
    owner:     overrides.spoc            ?? client?.owner,
    leader:    overrides.accountManager  ?? client?.leader,
    industry:  overrides.industry        ?? client?.industry,
  }), [client, overrides]);

  const effectiveDetail = useMemo_d(() => ({
    ...detail,
    contract: {
      ...(detail.contract || {}),
      term:  overrides.contractTerm    ? `${overrides.contractTerm} months` : (detail.contract?.term || '12 months'),
      start: overrides.contractStarted ?? detail.contract?.start,
      renew: overrides.contractRenews  ?? detail.contract?.renew,
      signedBy: overrides.contractSignedBy ?? detail.contract?.signedBy ?? 'Bashar Mashal',
    },
    contact: {
      ...(detail.contact || {}),
      primary: overrides.primaryContactName  ?? detail.contact?.primary,
      email:   overrides.primaryContactEmail ?? detail.contact?.email,
    },
  }), [detail, overrides]);

  useEffect_d(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect_d(() => {
    saveAttachments(client?.id || '', attachments);
  }, [attachments, client?.id]);

  if (!client) return null;
  const tlItems = detail.timeline || [];
  const toggleTask = (i) => setTasks(prev => prev.map((x, idx) => idx === i ? { ...x, done: !x.done } : x));
  const addAttach = (taskId, a) => setAttachments(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), a] }));
  const removeAttach = (taskId, i) => setAttachments(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter((_, idx) => idx !== i) }));

  const doneCount = tasks.filter(t => t.done).length;
  const openCount = tasks.filter(t => !t.done).length;

  const addTask = (task) => {
    setTasks(prev => [task, ...prev]);
    onFlash && onFlash(`Task added · ${task.name}`);
  };
  const leadersList = Object.values(window.TEAM_LEADERS || {});
  const leaderNames = leadersList.map(l => l.name);

  // ── Edit-mode handlers ────────────────────────────────────────────
  const startInfoEdit = () => {
    setInfoErr('');
    setInfoDraft({
      region:        effectiveClient.region || '',
      phase:         effectiveClient.phase  || '',
      status:        effectiveClient.status || '',
      size:          effectiveClient.size   || '',
      founder:       effectiveClient.founder || effectiveClient.owner || '',
      spoc:          effectiveClient.owner  || '',
      accountManager: effectiveClient.leader || (leaderNames[0] || ''),
      industry:      effectiveClient.industry || '',
      contractTerm:    parseTermMonths(effectiveDetail.contract?.term, 12),
      contractStarted: effectiveDetail.contract?.start  || '',
      contractRenews:  effectiveDetail.contract?.renew  || '',
      contractSignedBy: effectiveDetail.contract?.signedBy || 'Bashar Mashal',
      primaryContactName:  effectiveDetail.contact?.primary || '',
      primaryContactEmail: effectiveDetail.contact?.email   || '',
    });
    setInfoEditing(true);
    setTab('information'); // jump straight to the editable surface
  };

  const cancelInfoEdit = () => {
    setInfoEditing(false);
    setInfoDraft(null);
    setInfoErr('');
  };

  const saveInfoEdit = () => {
    const d = infoDraft || {};
    // ── Validation ──
    if (d.primaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.primaryContactEmail).trim())) {
      setInfoErr('Please enter a valid email address for the primary contact.');
      return;
    }
    const term = Number(d.contractTerm);
    if (!Number.isFinite(term) || term < 1 || term > 60) {
      setInfoErr('Contract term must be between 1 and 60 months.');
      return;
    }
    if (d.contractStarted && d.contractRenews
        && new Date(d.contractRenews) < new Date(d.contractStarted)) {
      setInfoErr('Renews date must be on or after the Started date.');
      return;
    }
    const cleaned = { ...d, contractTerm: term };
    saveEngagementOverrides(client.id, cleaned);
    setOverrides(cleaned);
    setInfoEditing(false);
    setInfoDraft(null);
    setInfoErr('');
    onFlash && onFlash('Saved');
  };

  const phaseLabel = (p) => p ? t('phase_'+p) : '';

  return (
    <div className="drawer on" style={{ '--c': client.color }}>
      {/* D3: X close button at top-right, borderless */}
      <button className="drawer-x" onClick={onClose} aria-label="Close"><Icon.X/></button>

      <div className="drawer-h">
        <div className="drawer-h-top">
          <button className="back" onClick={onClose}>
            {lang === 'ar' ? <Icon.ChevronRight/> : <Icon.ChevronLeft/>} {t('drawer_back')}
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {infoEditing && (
              <span className="edit-mode-badge" aria-live="polite">
                <span className="edit-mode-badge-dot"></span>Editing mode
              </span>
            )}
            <button className="btn-ghost" onClick={() => setShowEmail(true)}><Icon.Mail/> {t('drawer_btn_email')}</button>
            {infoEditing ? (
              <>
                <button className="btn-ghost" onClick={cancelInfoEdit}>Cancel</button>
                <button className="btn-primary accent" onClick={saveInfoEdit}>
                  <Icon.Check/> Save changes
                </button>
              </>
            ) : (
              <button className="btn-ghost" onClick={startInfoEdit}>
                <Icon.Edit/> {t('drawer_btn_edit_engagement')}
              </button>
            )}
          </div>
        </div>
        <div className="drawer-h-id">
          <div className="logo-slot-lg">
            <image-slot
              id={`logo-${client.id}`}
              shape="rounded"
              radius="11"
              fit="contain"
              src={logoSrc(client.id)}
              placeholder={client.short}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div>
            <h1><EditableText path={`client.${client.id}.name`} fallback={client.name}/></h1>
            {/* D3: meta row REMOVED — these details now live under Information tab */}
          </div>
        </div>
      </div>

      <div className="drawer-tabs">
        {[['overview',t('tab_overview')],['tasks',`${t('tab_tasks')} · ${tasks.length}`],['timeline',t('tab_timeline')],['information','Information']].map(([k,l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="drawer-body">
        {tab === 'overview' && (
          <>
            <div className="detail-row">
              <div className="detail-card">
                <div className="l">{t('d_completion')}</div>
                <div className="v">{client.complete}%</div>
                <div className="sub">{t('d_tasks_total', { n: tasks.length })}</div>
              </div>
              <div className="detail-card">
                <div className="l">{t('d_in_progress')}</div>
                <div className="v">{client.inProgress}</div>
                <div className="sub">{t('d_active_work')}</div>
              </div>
              <div className="detail-card">
                <div className="l">{t('d_needs_attn')}</div>
                <div className="v" style={{ color: client.attn ? 'var(--accent)' : 'var(--ink)' }}>{client.attn}</div>
                <div className="sub">{client.attn ? t('d_review_req') : t('d_all_clear')}</div>
              </div>
              <div className={`detail-card detail-card-phase phase-${effectiveClient.phase || ''}`}>
                <div className="l">{effectiveClient.phase ? 'Phase' : 'Size'}</div>
                <div className="v phase-v">{effectiveClient.phase ? phaseLabel(effectiveClient.phase) : effectiveClient.size}</div>
                <div className="sub">{`${openCount} open · ${doneCount} done`}</div>
              </div>
            </div>

            <h3 className="section-title">{t('d_upcoming_tasks')}</h3>
            <div className="task-list">
              {tasks.filter(x => !x.done).slice(0, 8).map((task, i) => {
                const idx = tasks.indexOf(task);
                return (
                  <TaskRow key={`${task.id}-${idx}`}
                           task={task} idx={idx} clientId={client.id}
                           attachments={attachments[task.id]}
                           onToggle={() => toggleTask(idx)}
                           onAttach={(a) => addAttach(task.id, a)}
                           onRemoveAttach={(i) => removeAttach(task.id, i)}/>
                );
              })}
            </div>

            <div style={{ marginTop: 22, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-primary accent" onClick={() => setShowAddTask(true)}><Icon.Plus/> {t('btn_add_task')}</button>
              <OverflowMenu items={[
                { label: 'Schedule meeting', icon: <Icon.Calendar/>, onClick: () => setShowSchedule(true) },
                { label: 'Export tasks',     icon: <Icon.File/>,     onClick: () => onFlash && onFlash('Exporting tasks…') },
                { label: 'Archive engagement',
                  icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></svg>,
                  onClick: () => { if (window.confirm('Archive this engagement?')) onFlash && onFlash('Engagement archived'); } },
              ]}/>
            </div>
          </>
        )}

        {tab === 'tasks' && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                {t('d_all_tasks')}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-soft)', marginLeft: 6 }}>
                  · {t('d_n_of_m_complete', { n: doneCount, m: tasks.length })}
                </span>
              </h3>
            </div>
            <TaskTable clientId={client.id}/>
          </>
        )}

        {tab === 'timeline' && (
          <>
            <h3 className="section-title">{t('d_activity_timeline')}</h3>
            <div className="timeline">
              {tlItems.map((it, i) => (
                <div key={i} className={`tl-item ${it.active ? 'active' : ''}`}>
                  <div className="tl-when">{it.when}</div>
                  <div className="tl-what">{it.what}</div>
                  <div className="tl-by">{it.by}</div>
                </div>
              ))}
              {tlItems.length === 0 && (
                <div style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{t('d_no_activity')}</div>
              )}
            </div>
          </>
        )}

        {tab === 'information' && (
          <InformationTab client={effectiveClient}
                          detail={effectiveDetail}
                          t={t}
                          onEmail={() => setShowEmail(true)}
                          editing={infoEditing}
                          draft={infoDraft}
                          setDraft={setInfoDraft}
                          error={infoErr}
                          leaderNames={leaderNames}
                          onSave={saveInfoEdit}
                          onCancel={cancelInfoEdit}/>
        )}
      </div>
      {showEmail && <EmailPopover contact={detail.contact} client={client} onClose={() => setShowEmail(false)}/>}
      {showAddTask && <AddTaskModal client={client} leaders={leadersList} onClose={() => setShowAddTask(false)} onAdd={addTask}/>}
      {showSchedule && <ScheduleMeetingModal client={client} contact={detail.contact} onClose={() => setShowSchedule(false)} onScheduled={(msg) => onFlash && onFlash(msg)}/>}
    </div>
  );
}


// ── Overflow menu (… dropdown for secondary actions) ──────────────────
function OverflowMenu({ items }){
  const [open, setOpen] = useState_d(false);
  const ref = useRef_d(null);
  useEffect_d(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className="overflow-menu" ref={ref}>
      <button type="button" className="btn-ghost overflow-trigger" onClick={() => setOpen(o => !o)} aria-label="More actions">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
      </button>
      {open && (
        <div className="overflow-menu-dd">
          {items.map((it, i) => (
            <button key={i} className="overflow-menu-item" onClick={() => { setOpen(false); it.onClick && it.onClick(); }}>
              {it.icon}
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Information tab (replaces old Contract tab) ────────────────────────
function InformationTab({ client, detail, t, onEmail, editing, draft, setDraft, error, leaderNames, onSave, onCancel }){
  const phaseLabel = (p) => p ? t('phase_'+p) : '';
  const flag = (code) => `https://flagcdn.com/${code.toLowerCase()}.svg`;
  const regions = (client.region || '').split(/[\/,]/).map(s => s.trim()).filter(Boolean);
  const leaderName = client.leader || '—';

  const statusLabel = client.status === 'active' ? t('pill_active')
    : client.status === 'pending' ? 'Pending Signature'
    : client.status === 'prospect' ? t('pill_prospect')
    : client.status === 'hold' ? t('pill_on_hold')
    : client.stage;

  // patch helper for the draft object
  const patch = (key, val) => setDraft(d => ({ ...(d || {}), [key]: val }));

  // when started/term changes, auto-suggest renews (only if user hasn't manually overridden recently)
  const patchStart = (val) => {
    setDraft(d => {
      const next = { ...(d || {}), contractStarted: val };
      // recompute renews if it was empty or matched the previous auto-calc
      const prevAuto = addMonthsIso(d?.contractStarted, d?.contractTerm);
      if (!d?.contractRenews || d?.contractRenews === prevAuto) {
        next.contractRenews = addMonthsIso(val, d?.contractTerm);
      }
      return next;
    });
  };
  const patchTerm = (val) => {
    const n = Math.max(1, Math.min(60, parseInt(val || '0', 10) || 0));
    setDraft(d => {
      const next = { ...(d || {}), contractTerm: n };
      const prevAuto = addMonthsIso(d?.contractStarted, d?.contractTerm);
      if (!d?.contractRenews || d?.contractRenews === prevAuto) {
        next.contractRenews = addMonthsIso(d?.contractStarted, n);
      }
      return next;
    });
  };

  // ── EDIT MODE ────────────────────────────────────────────────────
  if (editing) {
    const d = draft || {};
    return (
      <>
        {error && (
          <div className="info-edit-error">
            <Icon.X/> {error}
          </div>
        )}

        <h3 className="section-title">Engagement Details</h3>
        <div className="info-grid info-grid-edit">
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-region">Region</label>
            <select id="ed-region" className="info-input"
                    value={REGION_OPTIONS.includes(d.region) ? d.region : 'Other'}
                    onChange={(e) => patch('region', e.target.value)}>
              {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-phase">Phase</label>
            <select id="ed-phase" className={`info-input info-phase-sel phase-${d.phase || ''}`}
                    value={d.phase || ''}
                    onChange={(e) => patch('phase', e.target.value)}>
              <option value="foundation">Foundation</option>
              <option value="activation">Activation</option>
              <option value="growth">Growth</option>
            </select>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-status">Status</label>
            <select id="ed-status" className={`info-input info-status-sel status-${d.status || ''}`}
                    value={d.status || ''}
                    onChange={(e) => patch('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="pending">Pending Signature</option>
              <option value="prospect">Prospect</option>
              <option value="hold">Hold</option>
            </select>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-size">Size</label>
            <select id="ed-size" className="info-input"
                    value={d.size || ''}
                    onChange={(e) => patch('size', e.target.value)}>
              <option value="Small">Small</option>
              <option value="Middle">Middle</option>
              <option value="Large">Large</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-founder">Founder</label>
            <input id="ed-founder" type="text" className="info-input"
                   value={d.founder || ''} onChange={(e) => patch('founder', e.target.value)}
                   placeholder="Founder name"/>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-spoc">SPOC (Client)</label>
            <input id="ed-spoc" type="text" className="info-input"
                   value={d.spoc || ''} onChange={(e) => patch('spoc', e.target.value)}
                   placeholder="Client SPOC"/>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-am">NHJ Account Manager</label>
            <select id="ed-am" className="info-input"
                    value={d.accountManager || ''}
                    onChange={(e) => patch('accountManager', e.target.value)}>
              {leaderNames.includes(d.accountManager) ? null : <option value={d.accountManager || ''}>{d.accountManager || '— select —'}</option>}
              {leaderNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-industry">Industry</label>
            <input id="ed-industry" type="text" className="info-input"
                   value={d.industry || ''} onChange={(e) => patch('industry', e.target.value)}
                   placeholder="e.g. Fintech, E-commerce, EdTech…"/>
          </div>
        </div>

        <h3 className="section-title">Contract</h3>
        <div className="info-grid info-grid-edit">
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-term">Term</label>
            <div className="info-input-suffix">
              <input id="ed-term" type="number" min="1" max="60" className="info-input"
                     value={d.contractTerm ?? ''}
                     onChange={(e) => patchTerm(e.target.value)}/>
              <span className="info-suffix">months</span>
            </div>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-start">Started</label>
            <input id="ed-start" type="date" className="info-input"
                   value={d.contractStarted || ''}
                   onChange={(e) => patchStart(e.target.value)}/>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-renew">Renews</label>
            <input id="ed-renew" type="date" className="info-input"
                   value={d.contractRenews || ''}
                   onChange={(e) => patch('contractRenews', e.target.value)}/>
            <span className="info-hint">Auto-calculated · editable</span>
          </div>
          <div className="info-row info-row-edit">
            <label className="info-l" htmlFor="ed-signed">Signed by</label>
            <select id="ed-signed" className="info-input"
                    value={d.contractSignedBy || ''}
                    onChange={(e) => patch('contractSignedBy', e.target.value)}>
              {leaderNames.includes(d.contractSignedBy) ? null : <option value={d.contractSignedBy || ''}>{d.contractSignedBy || '— select —'}</option>}
              {leaderNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <h3 className="section-title">Primary contact</h3>
        <div className="member-row info-contact-edit"
             style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <TeamAvatar name={d.primaryContactName || client.owner} color={client.color} size={36} radius={10}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
            <input type="text" className="info-input info-input-tight"
                   value={d.primaryContactName || ''}
                   onChange={(e) => patch('primaryContactName', e.target.value)}
                   placeholder="Contact name"/>
            <input type="email" className="info-input info-input-tight"
                   value={d.primaryContactEmail || ''}
                   onChange={(e) => patch('primaryContactEmail', e.target.value)}
                   placeholder="name@company.com"/>
          </div>
          <span className="role-pill">{t('d_role_primary')}</span>
        </div>

        {/* Sticky save bar at the bottom of the tab — mirrors header buttons */}
        <div className="info-edit-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary accent" onClick={onSave}>
            <Icon.Check/> Save changes
          </button>
        </div>

        <h3 className="section-title">Client SPOC Thread</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, marginTop: 0 }}>
          The client SPOC posts requirements, questions, and requests here. Team members can reply inline. All conversation persists locally.
        </p>
        <SpocThread clientId={client.id} client={client} detail={detail}/>
      </>
    );
  }

  // ── READ MODE (existing layout) ──────────────────────────────────
  return (
    <>
      <h3 className="section-title">Engagement Details</h3>
      <div className="info-grid">
        <div className="info-row">
          <span className="info-l">Region</span>
          <span className="info-v info-flag">
            {regions.map(c => <img key={c} src={flag(c)} alt={c}/>)}
            <span>{client.region || '—'}</span>
          </span>
        </div>
        <div className="info-row">
          <span className="info-l">Phase</span>
          <span className="info-v">{phaseLabel(client.phase) || '—'}</span>
        </div>
        <div className="info-row">
          <span className="info-l">Status</span>
          <span className="info-v"><Pill status={client.status}>{statusLabel}</Pill></span>
        </div>
        <div className="info-row">
          <span className="info-l">Size</span>
          <span className="info-v">{client.size || '—'}</span>
        </div>
        <div className="info-row">
          <span className="info-l">Founder</span>
          <span className="info-v"><EditableText path={`client.${client.id}.founder`} fallback={client.founder || client.owner || '—'}/></span>
        </div>
        <div className="info-row">
          <span className="info-l">SPOC (Client)</span>
          <span className="info-v"><EditableText path={`client.${client.id}.owner`} fallback={client.owner || '—'}/></span>
        </div>
        <div className="info-row">
          <span className="info-l">NHJ Account Manager</span>
          <span className="info-v">{leaderName}</span>
        </div>
        <div className="info-row">
          <span className="info-l">Industry</span>
          <span className="info-v"><EditableText path={`client.${client.id}.industry`} fallback={client.industry || '—'}/></span>
        </div>
      </div>

      <h3 className="section-title">Contract</h3>
      <div className="info-grid">
        <div className="info-row">
          <span className="info-l">Term</span>
          <span className="info-v">{detail.contract?.term || '12 months'}</span>
        </div>
        <div className="info-row">
          <span className="info-l">Started</span>
          <span className="info-v">{shortDate(detail.contract?.start || client.signedAt) || '—'}</span>
        </div>
        <div className="info-row">
          <span className="info-l">Renews</span>
          <span className="info-v">{shortDate(detail.contract?.renew || client.renewAt) || '—'}</span>
        </div>
        <div className="info-row">
          <span className="info-l">Signed by</span>
          <span className="info-v">{detail.contract?.signedBy || 'Bashar Mashal'} · NHJ</span>
        </div>
      </div>

      <h3 className="section-title">Primary contact</h3>
      <div className="member-row" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
        <TeamAvatar name={detail.contact?.primary || client.owner} color={client.color} size={36} radius={10}/>
        <div>
          <div className="member-name"><EditableText path={`contact.${client.id}.name`} fallback={detail.contact?.primary || client.owner}/></div>
          <div className="member-mail"><EditableText path={`contact.${client.id}.email`} fallback={detail.contact?.email || `${client.id}@example.co`}/></div>
        </div>
        <span className="role-pill">{t('d_role_primary')}</span>
        <button className="btn-ghost" onClick={onEmail} aria-label="Email">
          <Icon.Mail/>
        </button>
      </div>

      <h3 className="section-title">Client SPOC Thread</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, marginTop: 0 }}>
        The client SPOC posts requirements, questions, and requests here. Team members can reply inline. All conversation persists locally.
      </p>
      <SpocThread clientId={client.id} client={client} detail={detail}/>
    </>
  );
}

// ── SPOC thread with replies ──────────────────────────────────────────
function SpocThread({ clientId, client, detail }){
  const KEY = `nhj-spoc-${clientId}`;
  const [thread, setThread] = useState_d(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  });
  const [author, setAuthor] = useState_d(detail.contact?.primary || client.owner || '');
  const [role,   setRole]   = useState_d('spoc'); // 'spoc' or 'team'
  const [body,   setBody]   = useState_d('');
  const [replyTo, setReplyTo] = useState_d(null);
  const [replyBody, setReplyBody] = useState_d('');
  const [replyAuthor, setReplyAuthor] = useState_d('NHJ Team');

  const save = (next) => {
    setThread(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
  };

  const post = () => {
    if (!body.trim()) return;
    const item = {
      id: 't-' + Date.now().toString(36),
      author: author.trim() || 'Anonymous',
      role,
      body: body.trim(),
      when: Date.now(),
      replies: [],
    };
    save([item, ...thread]);
    setBody('');
  };

  const sendReply = (parentId) => {
    if (!replyBody.trim()) return;
    save(thread.map(m => m.id === parentId
      ? { ...m, replies: [...(m.replies || []), {
          author: replyAuthor.trim() || 'NHJ Team',
          role: 'team',
          body: replyBody.trim(),
          when: Date.now(),
        }] }
      : m));
    setReplyBody('');
    setReplyTo(null);
  };

  const fmt = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.round((now - d) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff/60)}h ago`;
    return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div className="spoc-thread">
      <div className="spoc-compose">
        <div className="spoc-compose-row">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="spoc">Client SPOC</option>
            <option value="team">NHJ Team</option>
          </select>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name"/>
        </div>
        <textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder={role === 'spoc' ? 'Post a requirement, question or request…' : 'Share an update…'}/>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button className="btn-primary accent" onClick={post} disabled={!body.trim()}>Post</button>
        </div>
      </div>

      <div className="spoc-list">
        {thread.length === 0 && <div className="spoc-empty">No messages yet — start the conversation above.</div>}
        {thread.map(m => (
          <div key={m.id} className={`spoc-msg ${m.role}`}>
            <div className="spoc-msg-h">
              <span className="spoc-author">{m.author}</span>
              <span className={`spoc-role-${m.role}`}>{m.role === 'spoc' ? 'Client SPOC' : 'NHJ Team'}</span>
              <span className="spoc-when">{fmt(m.when)}</span>
            </div>
            <div className="spoc-body">{m.body}</div>
            <button className="spoc-reply-btn" onClick={() => setReplyTo(replyTo === m.id ? null : m.id)}>
              {replyTo === m.id ? 'Cancel' : 'Reply'}
            </button>
            {(m.replies || []).length > 0 && (
              <div className="spoc-replies">
                {m.replies.map((r, i) => (
                  <div key={i} className="spoc-msg reply">
                    <div className="spoc-msg-h">
                      <span className="spoc-author">{r.author}</span>
                      <span className="spoc-role-team">NHJ Team</span>
                      <span className="spoc-when">{fmt(r.when)}</span>
                    </div>
                    <div className="spoc-body">{r.body}</div>
                  </div>
                ))}
              </div>
            )}
            {replyTo === m.id && (
              <div className="spoc-compose" style={{ marginTop: 6 }}>
                <input value={replyAuthor} onChange={(e) => setReplyAuthor(e.target.value)} placeholder="Your name (team)"/>
                <textarea rows={2} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Reply…"/>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary accent" onClick={() => sendReply(m.id)} disabled={!replyBody.trim()}>Send</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ClientDetail };
