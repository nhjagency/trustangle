import React from 'react';
import { Portal } from '../components/ui.jsx';
// Global image options: per-image zoom + white-background toggle.
// Works on any wrapper that hosts an <image-slot>. We listen for clicks on
// the small ⚙ button that we inject onto each host, then a single modal
// edits the options. Options persist in localStorage and apply via CSS
// custom properties on the wrapper.

const IMG_OPTS_KEY = 'nhj-img-opts';

function loadImgOpts() {
  try { return JSON.parse(localStorage.getItem(IMG_OPTS_KEY) || '{}'); }
  catch (e) { return {}; }
}
function saveImgOpts(obj) {
  try { localStorage.setItem(IMG_OPTS_KEY, JSON.stringify(obj)); } catch (e) {}
}

// Selector for any wrapper that hosts an <image-slot>
const HOST_SELECTOR = '.logo-slot, .logo-slot-lg, .hero-mark, .team-avatar, .brand-logo';

function applyToHost(host, opts) {
  if (!host) return;
  const zoom = opts && opts.zoom != null ? opts.zoom : 1;
  const bg   = opts && opts.whiteBg === false ? 'transparent' : 'white';
  host.style.setProperty('--img-zoom', zoom);
  host.style.setProperty('--img-bg', bg);
  host.dataset.imgOpts = '1';
}

function enhanceAll(onClick) {
  const stored = loadImgOpts();
  document.querySelectorAll(HOST_SELECTOR).forEach((host) => {
    const slot = host.querySelector('image-slot');
    if (!slot || !slot.id) return;
    const id = slot.id;

    // Apply stored opts
    if (stored[id]) applyToHost(host, stored[id]);

    // Inject the ⚙ button if not already
    if (!host.querySelector(':scope > .img-opts-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'img-opts-btn';
      btn.setAttribute('aria-label', 'Image options');
      btn.dataset.slotId = id;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(id, host);
      });
      host.appendChild(btn);
    }
  });
}

function ImageOptsProvider({ children }){
  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState(null);
  const [opts, setOptsState] = React.useState({ zoom: 1, whiteBg: true });
  const [imgUrl, setImgUrl] = React.useState(null);
  const [hasImage, setHasImage] = React.useState(false);
  const hostRef = React.useRef(null);

  // Enhance on mount and whenever DOM changes
  React.useEffect(() => {
    const onClick = (id, host) => {
      hostRef.current = host;
      const stored = loadImgOpts()[id] || { zoom: 1, whiteBg: true };
      setActiveId(id);
      setOptsState(stored);
      // Read the underlying image URL from the image-slot's shadow DOM
      const slot = host.querySelector('image-slot');
      let url = null, has = false;
      if (slot && slot.shadowRoot) {
        const img = slot.shadowRoot.querySelector('img');
        if (img && img.src && img.style.display !== 'none') {
          url = img.src; has = true;
        }
      }
      setImgUrl(url);
      setHasImage(has);
      setOpen(true);
    };
    enhanceAll(onClick);
    const obs = new MutationObserver(() => enhanceAll(onClick));
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  // Persist + apply when opts change
  React.useEffect(() => {
    if (!activeId) return;
    const all = loadImgOpts();
    all[activeId] = opts;
    saveImgOpts(all);
    if (hostRef.current) applyToHost(hostRef.current, opts);
  }, [activeId, opts]);

  const close = () => { setOpen(false); setActiveId(null); };
  const reset = () => setOptsState({ zoom: 1, whiteBg: true });

  return (
    <>
      {children}
      {open && (
        <Portal>
          <div className="modal-backdrop on" onClick={close}>
            <div className="modal img-opts-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Image options</h3>
              <div className="sub">Adjust how this image is displayed everywhere it appears.</div>
  
              <div className="io-preview" style={{ background: opts.whiteBg ? 'white' : 'transparent' }}>
                {hasImage && imgUrl ? (
                  <img className="io-preview-img"
                       src={imgUrl}
                       alt=""
                       style={{ transform: `scale(${opts.zoom})` }}/>
                ) : (
                  <div className="io-preview-empty">No image yet — drop one onto the avatar first.</div>
                )}
              </div>
  
              <div className="field" style={{ marginTop: 14 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Zoom</span>
                  <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(opts.zoom * 100)}%</span>
                </label>
                <input type="range" min="0.5" max="2.5" step="0.05"
                       value={opts.zoom}
                       onChange={(e) => setOptsState(o => ({ ...o, zoom: parseFloat(e.target.value) }))}/>
                <div className="io-zoom-tags">
                  {[0.75, 1, 1.25, 1.5, 2].map(z => (
                    <button key={z} className={`io-zoom-tag ${Math.abs(opts.zoom - z) < .03 ? 'on' : ''}`}
                            onClick={() => setOptsState(o => ({ ...o, zoom: z }))}>
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
              </div>
  
              <div className="field io-bg-row">
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>White background</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Add a clean white backdrop behind transparent logos.</div>
                </div>
                <div className={`switch ${opts.whiteBg ? 'on' : ''}`}
                     onClick={() => setOptsState(o => ({ ...o, whiteBg: !o.whiteBg }))}></div>
              </div>
  
              <div className="modal-foot">
                <button className="btn-ghost" onClick={reset}>Reset</button>
                <button className="btn-primary accent" onClick={close}>Done</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

export { ImageOptsProvider };
