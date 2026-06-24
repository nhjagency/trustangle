#!/usr/bin/env node
/* trustangle brand linter — runs against built index.html.
   Exit 0 = clean. Exit 1 = violations.
   Negation guard: approved copy in a negated/quoted context is compliant
   (e.g. "without disrupting the business"). Fix the rule, not the copy. */
import { readFileSync } from "node:fs";

const file = process.argv[2] || new URL("../index.html", import.meta.url).pathname;
const html = readFileSync(file, "utf8");

// Visible text only: drop scripts, styles, comments, verbatim customer
// quotes (<blockquote>), then tags. Testimonials are quoted speech: we do not
// censor a customer's words, so blockquote content is exempt from the
// vocabulary/count rules (the rest of the page is still checked).
const visible = html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&rarr;/g, " ").replace(/&[a-z]+;/g, " ")
  .replace(/\s+/g, " ");

const FORBIDDEN = [
  "unlock", "leverage", "revolutionary", "unleash", "transform", "transformation",
  "game-changer", "cutting-edge", "disrupt", "disruption", "dominate", "win",
  "world-class", "best-in-class", "seamless", "leading",
  "in today's world", "towards a better future",
];
const NEGATORS = /\b(without|never|not|no|isn't|aren't|don't|won't|avoid|free of)\s+$/i;

const issues = [];

for (const term of FORBIDDEN) {
  const re = new RegExp((/[a-z]$/.test(term) ? "\\b" : "") + term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\w*", "gi");
  let m;
  while ((m = re.exec(visible))) {
    const before = visible.slice(Math.max(0, m.index - 16), m.index);
    if (NEGATORS.test(before)) continue;          // negated context — allowed
    issues.push(`Forbidden term "${m[0]}" near: …${visible.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20).trim()}…`);
  }
}

// Changeable fixed counts (only 2014 is an allowed fixed number)
const countRe = /\b\d+\s+(products|companies|industries|clients|partners|platforms|sectors|years)\b/gi;
let c;
while ((c = countRe.exec(visible))) issues.push(`Changeable fixed count: "${c[0].trim()}"`);

// Exactly one <h1>
const h1 = (html.match(/<h1[\s>]/gi) || []).length;
if (h1 !== 1) issues.push(`Expected exactly one <h1>, found ${h1}`);

// Company name casing
const badName = html.match(/Trustangle|Trust Angle|TrustAngle/g);
if (badName) issues.push(`Company name casing: ${[...new Set(badName)].join(", ")} (must be lowercase "trustangle")`);

if (issues.length) {
  console.error("✗ brand-lint: " + issues.length + " issue(s)\n - " + issues.join("\n - "));
  process.exit(1);
}
console.log("✓ brand-lint: clean (forbidden vocab, counts, single h1, name casing)");
process.exit(0);
