// <image-slot> — user-fillable image placeholder.
//
// Production replacement for the design-tool element of the same name: same
// tag, same attributes, same shadow parts (frame / image / empty / placeholder
// / ring) so every `image-slot::part(...)` rule in styles.css keeps applying.
// The difference is persistence: the design tool wrote a sidecar JSON through
// its host bridge; here a filled slot is downscaled and kept in localStorage
// under `nhj-image-slot:<id>`, so a logo or avatar survives a reload on the
// machine it was added on.
//
// Attributes:
//   id           persistence key (required for the image to survive a reload)
//   shape        rect | rounded | circle | pill        (default rounded)
//   radius       corner radius in px for `rounded`     (default 12)
//   fit          cover | contain | fill                (default cover)
//   position     object-position for contain/fill      (default 50% 50%)
//   placeholder  empty-state caption
//   src          fallback image URL, shown until the user supplies one

const STORE_PREFIX = 'nhj-image-slot:';
const CHANGE_EVENT = 'nhj-image-slot-changed';
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_EDGE = 512; // px — downscale before storing, localStorage is small

function readStore(id) {
  if (!id) return null;
  try { return localStorage.getItem(STORE_PREFIX + id); } catch (e) { return null; }
}

function writeStore(id, dataUrl) {
  if (!id) return;
  try {
    if (dataUrl) localStorage.setItem(STORE_PREFIX + id, dataUrl);
    else localStorage.removeItem(STORE_PREFIX + id);
  } catch (e) { /* quota or private mode — the slot still shows this session */ }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { id } }));
}

// Downscale to MAX_EDGE and re-encode, so a 4MB photo does not blow the
// localStorage budget. SVG is stored as-is (it is already small and scales).
function toStorableDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const raw = String(reader.result);
      if (file.type === 'image/svg+xml') { resolve(raw); return; }
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not an image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/webp', 0.85)); }
        catch (e) { resolve(raw); }
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

const SHEET = `
:host{display:inline-block;position:relative;vertical-align:top;
  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);
  width:100%;height:100%}
.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}
.frame img{position:absolute;inset:0;width:100%;height:100%;
  -webkit-user-drag:none;user-select:none}
.empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  text-align:center;padding:4px;box-sizing:border-box;cursor:pointer;user-select:none}
.cap{max-width:100%;font-weight:600;letter-spacing:.01em;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.18);
  transition:border-color .12s}
:host([data-over]) .frame{outline:2px solid var(--accent,#0212fd);outline-offset:-2px}
:host([data-over]) .ring{border-color:var(--accent,#0212fd)}
:host([data-filled]) .ring{display:none}
:host([data-filled]) .empty{display:none}
.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:6px;
  display:flex;gap:4px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:3;
  white-space:nowrap}
:host([data-filled]:hover) .ctl{opacity:1;pointer-events:auto}
.ctl button{appearance:none;border:0;border-radius:6px;padding:4px 8px;cursor:pointer;
  background:rgba(0,0,0,.7);color:#fff;font:10px/1 system-ui,-apple-system,sans-serif}
.ctl button:hover{background:rgba(0,0,0,.85)}
.err{position:absolute;left:4px;right:4px;bottom:4px;font-size:10px;color:#b3261e;
  background:rgba(255,255,255,.9);border-radius:4px;padding:2px 4px;pointer-events:none}
`;

class ImageSlotElement extends HTMLElement {
  static get observedAttributes() {
    return ['shape', 'radius', 'fit', 'position', 'placeholder', 'src', 'id'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>' + SHEET + '</style>' +
      '<div class="frame" part="frame">' +
      '  <img part="image" alt="" draggable="false" style="display:none">' +
      '  <div class="empty" part="empty"><div class="cap" part="placeholder"></div></div>' +
      '  <div class="ring" part="ring"></div>' +
      '</div>' +
      '<div class="ctl">' +
      '  <button data-act="replace" type="button">Replace</button>' +
      '  <button data-act="clear" type="button">Remove</button>' +
      '</div>' +
      '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';

    this._frame = root.querySelector('.frame');
    this._img = root.querySelector('.frame img');
    this._empty = root.querySelector('.empty');
    this._cap = root.querySelector('.cap');
    this._file = root.querySelector('input[type=file]');
    this._ctl = root.querySelector('.ctl');

    this._onStoreChange = (e) => {
      if (!e.detail || e.detail.id === this.id) this._render();
    };
  }

  connectedCallback() {
    this._empty.addEventListener('click', this._browse);
    this._file.addEventListener('change', this._onPick);
    this._ctl.addEventListener('click', this._onCtl);
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('dragleave', this._onDragLeave);
    this.addEventListener('drop', this._onDrop);
    window.addEventListener(CHANGE_EVENT, this._onStoreChange);
    this._render();
  }

  disconnectedCallback() {
    this._empty.removeEventListener('click', this._browse);
    this._file.removeEventListener('change', this._onPick);
    this._ctl.removeEventListener('click', this._onCtl);
    this.removeEventListener('dragover', this._onDragOver);
    this.removeEventListener('dragleave', this._onDragLeave);
    this.removeEventListener('drop', this._onDrop);
    window.removeEventListener(CHANGE_EVENT, this._onStoreChange);
  }

  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _browse = () => this._file.click();

  _onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) this._accept(f);
  };

  _onCtl = (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'replace') this._browse();
    if (act === 'clear') writeStore(this.id, null);
  };

  _onDragOver = (e) => {
    if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
    e.preventDefault();
    this.setAttribute('data-over', '');
  };

  _onDragLeave = () => this.removeAttribute('data-over');

  _onDrop = (e) => {
    this.removeAttribute('data-over');
    const f = e.dataTransfer?.files && e.dataTransfer.files[0];
    if (!f) return;
    e.preventDefault();
    this._accept(f);
  };

  async _accept(file) {
    if (!ACCEPT.includes(file.type)) { this._error('Use a PNG, JPG, WEBP, GIF or SVG.'); return; }
    try {
      writeStore(this.id, await toStorableDataUrl(file));
      this._error(null);
    } catch (err) {
      this._error(err.message);
    }
  }

  _error(msg) {
    let el = this.shadowRoot.querySelector('.err');
    if (!msg) { el?.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.className = 'err';
      this.shadowRoot.appendChild(el);
    }
    el.textContent = msg;
  }

  _render() {
    const shape = this.getAttribute('shape') || 'rounded';
    const radius = this.getAttribute('radius') || '12';
    const fit = this.getAttribute('fit') || 'cover';
    const position = this.getAttribute('position') || '50% 50%';
    const url = readStore(this.id) || this.getAttribute('src') || '';

    const corner = shape === 'circle' ? '50%'
      : shape === 'pill' ? '999px'
      : shape === 'rect' ? '0'
      : `${parseFloat(radius) || 12}px`;
    this._frame.style.borderRadius = corner;
    this.shadowRoot.querySelector('.ring').style.borderRadius = corner;
    this._empty.style.borderRadius = corner;

    this._cap.textContent = this.getAttribute('placeholder') || '';

    if (url) {
      this._img.src = url;
      this._img.style.display = '';
      this._img.style.objectFit = fit;
      this._img.style.objectPosition = position;
      this.setAttribute('data-filled', '');
    } else {
      this._img.removeAttribute('src');
      this._img.style.display = 'none';
      this.removeAttribute('data-filled');
    }
  }
}

if (!customElements.get('image-slot')) {
  customElements.define('image-slot', ImageSlotElement);
}

export { CHANGE_EVENT as IMAGE_SLOT_CHANGE_EVENT, readStore as readImageSlot, writeStore as writeImageSlot };
