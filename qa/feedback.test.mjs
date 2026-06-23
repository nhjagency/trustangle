/* Tests for the floating feedback button.
   Dependency-free: Node's built-in test runner.
   Run: node --test qa/feedback.test.mjs   (or: node --test qa/) */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const openTag = (html.match(/<a[^>]*class="feedback-btn"[^>]*>/) || [])[0];
const block = (html.match(/<a[^>]*class="feedback-btn"[\s\S]*?<\/a>/) || [])[0];

test("feedback button is present", () => {
  assert.ok(openTag, "an <a class=\"feedback-btn\"> exists");
  assert.ok(block, "the anchor is closed");
});

test("feedback button opens a mailto link with a subject", () => {
  const href = (openTag.match(/href="([^"]+)"/) || [])[1] || "";
  assert.ok(href.startsWith("mailto:"), `href should be a mailto, got: ${href}`);
  assert.match(href, /@/, "mailto target has an address");
  assert.match(href, /subject=/i, "mailto presets a subject");
});

test("feedback button has an accessible name mentioning feedback", () => {
  const aria = (openTag.match(/aria-label="([^"]+)"/) || [])[1] || "";
  const visible = (block.replace(/<[^>]+>/g, "").trim()) || "";
  assert.ok(
    /feedback/i.test(aria) || /feedback/i.test(visible),
    "aria-label or visible text mentions feedback"
  );
});

test("feedback button contains no em or en dash", () => {
  assert.ok(!/[–—]/.test(block), "no em/en dash in the button markup");
});

test("adding the button keeps exactly one <h1>", () => {
  assert.equal((html.match(/<h1[\s>]/gi) || []).length, 1);
});

test("feedback button is styled (class referenced in stylesheet)", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.feedback-btn\s*\{/, ".feedback-btn rule exists in styles.css");
});
