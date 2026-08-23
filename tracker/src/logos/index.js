// Client logos committed to the repo.
//
// Drop a file in this folder named after the client id — `byn.png`,
// `lynnc.svg`, `silver.webp` — and it becomes that client's logo everywhere:
// the portfolio card, the engagement drawer header, and (for `nhj.png`) the
// app bar and hero mark. No code change needed; the glob below picks up
// whatever is in the folder at build time.
//
// PNG, SVG, JPG and WEBP are all accepted. Prefer a square-ish image with a
// transparent or white background — the slot is small and fits the whole logo
// inside it (object-fit: contain), so wide lockups end up tiny.
//
// A logo a user drops onto a slot in the running app overrides the committed
// file for that user only. Remove the dropped image and the committed one
// comes back.
//
// See ./README.md for the full list of client ids.

const files = import.meta.glob('./*.{png,svg,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const BY_ID = Object.fromEntries(
  Object.entries(files).map(([p, url]) => [p.replace(/^\.\//, '').replace(/\.[^.]+$/, ''), url]),
);

// Returns the committed logo URL for a client id, or '' when none is present.
export function logoSrc(id) {
  return BY_ID[id] || '';
}

export { BY_ID as LOGOS };
