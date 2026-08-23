import React from 'react';
import { Portal, Icon } from './components/ui.jsx';
import { LangProvider, useLang } from './lib/i18n.jsx';
import { EditProvider, useEdit } from './lib/editable.jsx';
import { THEME_VARS, useThemeColors, ThemeColorRow } from './lib/theme.jsx';
import { ImageOptsProvider } from './lib/image-opts.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect } from './lib/tweaks-panel.jsx';
import { Dashboard } from './views/Dashboard.jsx';
import { ClientDetail } from './views/ClientDetail.jsx';
import { Reports } from './views/Reports.jsx';
import { Settings } from './views/Settings.jsx';
import { TEAM_LEADERS } from './data/portfolio.js';
import { logoSrc } from './logos/index.js';

const { useState: useState_app, useEffect: useEffect_app } = React;

const TWEAK_DEFAULTS = {
  "density": "comfortable",
  "layout": "grid",
  "hero": "full",
  "panelHd": "compact"
};

function MultiSelectLocations({ value, onChange }){
  const [open, setOpen] = useState_app(false);
  const ref = React.useRef(null);
  const OPTIONS = [
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'SY', name: 'Syria',        flag: '🇸🇾' },
    { code: 'AE', name: 'UAE',          flag: '🇦🇪' },
    { code: 'EG', name: 'Egypt',        flag: '🇪🇬' },
    { code: 'JO', name: 'Jordan',       flag: '🇯🇴' },
    { code: 'QA', name: 'Qatar',        flag: '🇶🇦' },
    { code: 'KW', name: 'Kuwait',       flag: '🇰🇼' },
    { code: 'OM', name: 'Oman',         flag: '🇴🇲' },
    { code: 'BH', name: 'Bahrain',      flag: '🇧🇭' },
    { code: 'TR', name: 'Türkiye',      flag: '🇹🇷' },
  ];

  useEffect_app(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = (code) => {
    if (value.includes(code)) onChange(value.filter(v => v !== code));
    else onChange([...value, code]);
  };

  return (
    <div className="multi-select" ref={ref}>
      <button type="button" className="multi-select-trigger" onClick={() => setOpen(o => !o)}>
        {value.length === 0
          ? <span className="ms-placeholder">Select countries…</span>
          : (
            <span className="ms-chips">
              {value.map(code => {
                const opt = OPTIONS.find(o => o.code === code);
                if (!opt) return null;
                return (
                  <span key={code} className="ms-chip">
                    <span className="ms-flag">{opt.flag}</span>
                    {opt.name}
                    <span className="ms-x" onClick={(e) => { e.stopPropagation(); toggle(code); }}>×</span>
                  </span>
                );
              })}
            </span>
          )}
        <Icon.ChevronDown className="ms-caret"/>
      </button>
      {open && (
        <div className="multi-select-menu">
          {OPTIONS.map(opt => {
            const on = value.includes(opt.code);
            return (
              <button type="button" key={opt.code}
                      className={`ms-item ${on ? 'on' : ''}`}
                      onClick={() => toggle(opt.code)}>
                <span className={`ms-check ${on ? 'on' : ''}`}>
                  {on && <Icon.Check/>}
                </span>
                <span className="ms-flag">{opt.flag}</span>
                <span className="ms-name">{opt.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditModal({ client, onClose }){
  const { t } = useLang();
  // Parse existing region "SA/SY" → ['SA','SY']
  const initialLocations = (client?.region || '').split(/[\/,]/).map(s => s.trim()).filter(Boolean);

  const [stage,    setStage]    = useState_app(client?.stage || 'Active');
  const [locs,    setLocs]      = useState_app(initialLocations);
  const [industry, setIndustry] = useState_app(client?.industry || '');
  const [founder, setFounder]   = useState_app(client?.founder || '');
  const [spoc,    setSpoc]      = useState_app(client?.owner || '');
  const [mgr,     setMgr]       = useState_app(client?.leader || '');
  const [phase,   setPhase]     = useState_app(client?.phase || 'foundation');

  if (!client) return null;

  const TL = TEAM_LEADERS;
  const managers = Object.values(TL).map(t => t.name);

  return (
    <Portal>
      <div className="modal-backdrop on" onClick={onClose}>
        <div className={`modal modal-wide ${client.isNew ? 'add-client' : ''}`} onClick={(e) => e.stopPropagation()}>
          <h3>{client.isNew ? t('add_client_title') : t('edit_title', { name: client.name })}</h3>
          <div className="sub">{t('edit_sub')}</div>
  
          <div className="field">
            <label>{t('edit_stage')}</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option>Active</option>
              <option>Pending Signature</option>
              <option>Prospect</option>
              <option>On Hold</option>
            </select>
          </div>
  
          <div className="field">
            <label>{t('edit_location')}</label>
            <MultiSelectLocations value={locs} onChange={setLocs}/>
          </div>
  
          <div className="field-row">
            <div className="field">
              <label>{t('edit_industry')}</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">— select —</option>
                <option>Technology</option>
                <option>Real Estate</option>
                <option>Financial Services</option>
                <option>F&B / Hospitality</option>
                <option>Healthcare</option>
                <option>Non-Profit / Foundation</option>
                <option>Energy & Utilities</option>
                <option>Retail / Consumer</option>
                <option>Education</option>
                <option>Government</option>
                <option>Media & Entertainment</option>
              </select>
            </div>
            <div className="field">
              <label>{t('edit_phase')}</label>
              <select value={phase} onChange={(e) => setPhase(e.target.value)}>
                <option value="foundation">Foundation</option>
                <option value="activation">Activation</option>
                <option value="growth">Growth</option>
              </select>
            </div>
          </div>
  
          <div className="field-row">
            <div className="field">
              <label>{t('edit_founder')}</label>
              <input value={founder} onChange={(e) => setFounder(e.target.value)} placeholder="Client founder name"/>
            </div>
            <div className="field">
              <label>{t('edit_spoc')}</label>
              <input value={spoc} onChange={(e) => setSpoc(e.target.value)} placeholder="Main point of contact"/>
            </div>
          </div>
  
          <div className="field">
            <label>{t('edit_mgr')}</label>
            <select value={mgr} onChange={(e) => setMgr(e.target.value)}>
              <option value="">— select —</option>
              {managers.map(name => <option key={name}>{name}</option>)}
            </select>
          </div>
  
          <div className="modal-foot">
            <button className="btn-ghost" onClick={onClose}>{t('btn_cancel')}</button>
            <button className="btn-primary accent" onClick={onClose}>{t('btn_save')}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function AppShell(){
  const { t, lang, setLang } = useLang();
  const { editMode, setEditMode, clearOverrides, dirty, commitSave, overrides } = useEdit();
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [themeColors, setThemeColor, resetThemeColors] = useThemeColors();
  const [view, setView] = useState_app('dashboard');
  const [openClient, setOpen] = useState_app(null);
  const [editing, setEditing] = useState_app(null);
  const [refreshing, setRefreshing] = useState_app(false);
  const [toast, setToast] = useState_app('');
  const [tweaksOpen, setTweaksOpen] = useState_app(false);

  // Snapshot of overrides when edit-mode is entered; used for Cancel
  const editSnapshot = React.useRef(null);
  React.useEffect(() => {
    if (editMode && !editSnapshot.current) {
      editSnapshot.current = JSON.stringify(overrides);
    }
    if (!editMode) editSnapshot.current = null;
  }, [editMode, overrides]);

  const cancelEdits = () => {
    // Notify dashboard grid to restore from sessionStorage snapshot
    window.dispatchEvent(new CustomEvent('nhj-cancel-edits'));
    if (!editSnapshot.current) { setEditMode(false); return; }
    try {
      const snap = JSON.parse(editSnapshot.current);
      localStorage.setItem('nhj-overrides', JSON.stringify(snap));
      // Soft revert — no reload (dashboard listens for the event above)
      // Force re-render by toggling edit mode off
      setEditMode(false);
    } catch (e) {
      setEditMode(false);
    }
  };

  const saveEdits = () => {
    commitSave();
    flash('Saved.');
    setEditMode(false);
  };

  useEffect_app(() => {
    document.body.classList.remove('density-compact','density-comfortable','density-spacious');
    document.body.classList.add(`density-${tw.density}`);
  }, [tw.density]);

  useEffect_app(() => {
    if (!openClient) return;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, [openClient]);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      flash(t('toast_refreshed'));
    }, 700);
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar-l">
          <div className="brand">
            <div className="brand-logo">
              <image-slot
                id="logo-nhj"
                shape="rounded"
                radius="5"
                fit="contain"
                src={logoSrc('nhj')}
                placeholder="NHJ"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            {t('app_name')}
          </div>
          <div className="crumbs">
            <span className="sep">/</span>
            <span className="here">
              {view === 'dashboard' && t('crumb_portfolio')}
              {view === 'reports'   && t('crumb_reports')}
              {view === 'settings'  && t('crumb_settings')}
            </span>
          </div>
        </div>

        <nav className="appbar-tabs" role="tablist">
          <button className={view === 'dashboard' ? 'on' : ''} onClick={() => setView('dashboard')}>{t('nav_dashboard')}</button>
          <button className={view === 'reports'   ? 'on' : ''} onClick={() => setView('reports')}>{t('nav_reports')}</button>
          <button className={view === 'settings'  ? 'on' : ''} onClick={() => setView('settings')}>{t('nav_settings')}</button>
        </nav>

        <div className="appbar-r">
          <span><span className="pulse"></span>{t('updated_now')}</span>
          <div className="lang-toggle" role="tablist" aria-label={t('tw_language')}>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
            <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')} aria-pressed={lang === 'ar'}>عربي</button>
          </div>
          <button
            className={`edit-btn ${editMode ? 'on' : ''}`}
            onClick={() => setEditMode(!editMode)}
            aria-pressed={editMode}
            aria-label={t('btn_edit_mode')}>
            <Icon.Edit/>
            <span>{editMode ? t('btn_done_edit') : t('btn_edit_mode')}</span>
          </button>
          <button
            className={`edit-btn tweaks-btn ${tweaksOpen ? 'on' : ''}`}
            onClick={() => setTweaksOpen(o => !o)}
            aria-pressed={tweaksOpen}
            aria-label="Tweaks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6"  x2="11" y2="6"/>  <line x1="15" y1="6"  x2="20" y2="6"/>  <circle cx="13" cy="6" r="2"/>
              <line x1="4" y1="12" x2="7"  y2="12"/> <line x1="11" y1="12" x2="20" y2="12"/> <circle cx="9"  cy="12" r="2"/>
              <line x1="4" y1="18" x2="13" y2="18"/> <line x1="17" y1="18" x2="20" y2="18"/> <circle cx="15" cy="18" r="2"/>
            </svg>
            <span>Tweaks</span>
          </button>
          <div className="ver">{t('version')} <b>{t('version_current')}</b> <Icon.ChevronDown/></div>
          <button className={`icon-btn ${refreshing ? 'spin' : ''}`} onClick={refresh} aria-label="Refresh"><Icon.Refresh/></button>
        </div>
      </header>

      {editMode && (
        <div className="edit-banner">
          <span><Icon.Edit/> {t('edit_banner')}{dirty > 0 && <span className="edit-dirty"> · {dirty} change{dirty === 1 ? '' : 's'}</span>}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ghost" onClick={() => {
              if (window.confirm(t('confirm_reset'))) clearOverrides();
            }}>{t('btn_reset_edits')}</button>
            <button className="btn-ghost" onClick={cancelEdits}>{t('btn_cancel')}</button>
            <button className="btn-primary accent" onClick={saveEdits}>
              <Icon.Check/> {t('btn_save')}
            </button>
          </div>
        </div>
      )}

      <main className="page">
        {view === 'dashboard' && <Dashboard tweaks={tw} onOpenClient={setOpen} onEdit={setEditing}/>}
        {view === 'reports'   && <Reports onOpenClient={setOpen}/>}
        {view === 'settings'  && <Settings/>}
      </main>

      {openClient && <div className="drawer-backdrop on" onClick={() => setOpen(null)}></div>}
      {openClient && <ClientDetail client={openClient} onClose={() => setOpen(null)} onEdit={(c) => setEditing(c)} onFlash={flash}/>}

      {editing && <EditModal client={editing} onClose={() => { setEditing(null); flash(t('toast_saved')); }}/>}

      <div className={`toast ${toast ? 'on' : ''}`}><span className="dot"></span>{toast}</div>

      <TweaksPanel title={t('tweaks_title')} open={tweaksOpen} onClose={() => setTweaksOpen(false)}>
        <TweakSection label={t('tw_layout')}/>
        <TweakRadio label={t('tw_density')}
                    value={tw.density}
                    options={['compact','comfortable','spacious']}
                    onChange={v => setTweak('density', v)}/>
        <TweakSelect label={t('tw_card_layout')}
                     value={tw.layout}
                     options={['grid','list','minimal']}
                     onChange={v => setTweak('layout', v)}/>
        <TweakSelect label={t('tw_hero')}
                     value={tw.hero}
                     options={['full','slim','none']}
                     onChange={v => setTweak('hero', v)}/>
        <TweakSelect label="Panel header"
                     value={tw.panelHd}
                     options={['compact','stat-tabs']}
                     onChange={v => setTweak('panelHd', v)}/>
        <TweakSection label={t('tw_language')}/>
        <TweakRadio label={t('tw_language')}
                    value={lang}
                    options={['en','ar']}
                    onChange={v => setLang(v)}/>
        <TweakSection label={t('tw_theme_colors')}/>
        {THEME_VARS.map(v => (
          <ThemeColorRow key={v.key}
                         varKey={v.key} label={v.label} hint={v.hint} def={v.def}
                         value={themeColors[v.key]}
                         onChange={setThemeColor}/>
        ))}
        <button className="btn-ghost" onClick={resetThemeColors} style={{ marginTop: 4, alignSelf: 'flex-start' }}>
          {t('btn_reset_theme')}
        </button>
      </TweaksPanel>
    </div>
  );
}

function App(){
  return (
    <LangProvider>
      <EditProvider>
        <ImageOptsProvider>
          <AppShell/>
        </ImageOptsProvider>
      </EditProvider>
    </LangProvider>
  );
}

export { App };
export default App;
