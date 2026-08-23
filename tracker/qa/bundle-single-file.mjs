// Inline the built app into one self-contained page.
//
//   npm run build && node qa/bundle-single-file.mjs [outPath]
//
// The output is *page content*, not a full document: no doctype, <html>,
// <head> or <body> wrapper, because the Artifact host supplies those. Serve it
// anywhere else by wrapping it in a minimal document of your own.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const out = process.argv[2] || path.join(ROOT, 'dist', 'nhj-tracker-single-file.html');

const assets = await readdir(path.join(DIST, 'assets'));
const cssName = assets.find(f => f.endsWith('.css'));
const jsName = assets.find(f => f.endsWith('.js') && !f.endsWith('.map'));
if (!cssName || !jsName) throw new Error('No built assets — run `npm run build` first.');

const css = await readFile(path.join(DIST, 'assets', cssName), 'utf8');
let js = await readFile(path.join(DIST, 'assets', jsName), 'utf8');
// A literal </script> inside the bundle would close the inline tag early.
js = js.replace(/<\/script>/gi, '<\\/script>');

const page = `<title>NHJ Project Tracker</title>
<meta name="description" content="NHJ project service tracker: client portfolio, engagement tasks, reports and team settings.">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Cairo:wght@400;500;600;700;800&family=Reem+Kufi:wght@400;500;600;700&display=swap">

<style>
${css}
</style>

<div id="root"></div>

<script>
document.body.classList.add('density-comfortable');
// Country flags are fetched from flagcdn.com. Where that host is unreachable
// (an offline machine, a strict content policy), hide the broken image rather
// than leaving a torn-icon placeholder in the card.
document.addEventListener('error', (e) => {
  const el = e.target;
  if (el && el.tagName === 'IMG' && /flagcdn\\.com/.test(el.src || '')) el.style.display = 'none';
}, true);
</script>

<script type="module">
${js}
</script>
`;

await writeFile(out, page);
const kb = (Buffer.byteLength(page) / 1024).toFixed(0);
console.log(`${path.relative(ROOT, out)} — ${kb} kB`);
