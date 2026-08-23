// Headless smoke test for the built app.
//
//   npm run build && npm run smoke
//
// Serves ./dist, walks the three top-level views, opens a client drawer and
// the tweaks panel, and fails on any console error, page error, or missing
// landmark. Screenshots land in qa/screens/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(ROOT, 'qa', 'screens');
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.map': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

if (!existsSync(DIST)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}
mkdirSync(SHOTS, { recursive: true });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const rel = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const problems = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

// Google Fonts and flagcdn.com are the only third-party requests. A blocked
// CDN must not read as an app failure, so ignore resource-load noise here and
// let the same-origin requestfailed handler below catch real breakage.
page.on('console', (m) => {
  const text = m.text();
  if (m.type() !== 'error') return;
  if (text.includes('Failed to load resource')) return;
  problems.push(`console: ${text}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => {
  if (r.url().startsWith(base)) problems.push(`request failed: ${r.url()}`);
});

const step = async (name, fn) => {
  try { await fn(); } catch (e) { problems.push(`${name}: ${e.message}`); }
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
  console.log(`  ✓ ${name}`);
};

await page.goto(base, { waitUntil: 'networkidle' });

await step('dashboard', async () => {
  await page.waitForSelector('.appbar', { timeout: 10000 });
  const cards = await page.locator('.card').count();
  if (cards < 5) throw new Error(`expected the portfolio grid, saw ${cards} cards`);
  const h1 = await page.locator('h1').first().innerText();
  if (!h1.trim()) throw new Error('hero has no title');
});

await step('client-drawer', async () => {
  await page.locator('.card').first().click();
  await page.waitForSelector('.drawer, .drawer-backdrop.on', { timeout: 5000 });
});

await step('client-tasks', async () => {
  await page.locator('.drawer-tabs button', { hasText: 'Tasks' }).click();
  await page.waitForSelector('.tt-rownum-n', { timeout: 5000 });
  const rows = await page.locator('.tt-rownum-n').count();
  if (rows < 1) throw new Error('task table rendered no rows');
});

await step('reports', async () => {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reports', exact: true }).click();
  await page.waitForSelector('.page', { timeout: 5000 });
  await page.waitForTimeout(300);
});

await step('settings', async () => {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForSelector('.page', { timeout: 5000 });
  await page.waitForTimeout(300);
});

await step('tweaks-panel', async () => {
  await page.getByRole('button', { name: 'Tweaks' }).click();
  await page.waitForSelector('.twk-panel', { timeout: 5000 });
  await page.locator('.twk-x').click();
});

await step('edit-mode', async () => {
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.locator('.edit-btn').first().click();
  await page.waitForSelector('.edit-banner', { timeout: 5000 });
  if (!(await page.locator('.editable').count())) throw new Error('no editable fields in edit mode');
  await page.locator('.edit-btn').first().click();
  await page.waitForSelector('.edit-banner', { state: 'detached', timeout: 5000 });
});

await step('arabic', async () => {
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dir === 'rtl', null, { timeout: 5000 });
  await page.getByRole('button', { name: 'EN', exact: true }).click();
});

await browser.close();
server.close();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`\nAll checks passed. Screenshots in ${path.relative(ROOT, SHOTS)}/`);
