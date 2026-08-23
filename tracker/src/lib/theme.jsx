import React from 'react';
// Live theme editor — exposes a set of CSS custom properties so the user
// can recolor anything in the app from the Tweaks panel. Values persist
// in localStorage and apply to :root via inline style overrides.

const THEME_VARS = [
  { key: '--nhj-blue',   label: 'NHJ Blue',         hint: 'Strategic',  def: '#0212fd' },
  { key: '--whj-orange', label: 'WHJ Orange',       hint: 'Creative',   def: '#f25723' },
  { key: '--rwj-green',  label: 'RWJ Green',        hint: 'Growth',     def: '#00c956' },
  { key: '--accent',     label: 'Primary Accent',   hint: 'Buttons & focus', def: '#0212fd' },
  { key: '--bg',         label: 'Background',       hint: 'Page',       def: '#f8f9fb' },
  { key: '--surface',    label: 'Surface',          hint: 'Cards & panels', def: '#ffffff' },
  { key: '--ink',        label: 'Text',             hint: 'Primary text', def: '#0d111c' },
];

function useThemeColors(){
  const [colors, setColorsState] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('nhj-theme') || '{}'); }
    catch (e) { return {}; }
  });

  React.useEffect(() => {
    THEME_VARS.forEach(({ key }) => {
      const v = colors[key];
      if (v) document.documentElement.style.setProperty(key, v);
      else   document.documentElement.style.removeProperty(key);
    });
  }, [colors]);

  const setColor = React.useCallback((key, value) => {
    setColorsState(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem('nhj-theme', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  const resetColors = React.useCallback(() => {
    setColorsState({});
    try { localStorage.removeItem('nhj-theme'); } catch (e) {}
    THEME_VARS.forEach(({ key }) => document.documentElement.style.removeProperty(key));
  }, []);

  return [colors, setColor, resetColors];
}

function ThemeColorRow({ varKey, label, hint, def, value, onChange }){
  const current = value || def;
  const [draft, setDraft] = React.useState(current);
  React.useEffect(() => { setDraft(current); }, [current]);

  const commit = (v) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim());
    if (m) {
      let hex = '#' + m[1].toLowerCase();
      if (hex.length === 4) hex = '#' + [...m[1]].map(c => c+c).join('').toLowerCase();
      onChange(varKey, hex);
    } else {
      setDraft(current);
    }
  };

  return (
    <div className="theme-row">
      <div className="theme-row-l">
        <div className="theme-label">{label}</div>
        {hint && <div className="theme-hint">{hint}</div>}
      </div>
      <div className="theme-row-r">
        <label className="theme-swatch" style={{ background: draft }}>
          <input type="color" value={draft.length === 7 ? draft : '#000000'}
            onChange={(e) => { setDraft(e.target.value); onChange(varKey, e.target.value); }}/>
        </label>
        <input type="text" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          className="theme-hex"
          placeholder="#000000"
          spellCheck="false"/>
      </div>
    </div>
  );
}

export { THEME_VARS, useThemeColors, ThemeColorRow };
