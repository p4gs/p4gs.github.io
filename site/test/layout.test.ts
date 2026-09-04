/**
 * Two layout defects that only a real browser at a real viewport found, pinned
 * here so they cannot come back silently.
 *
 * 1. THE FIXED SWITCHER COVERED THE FOOTER. `.design-switcher` is
 *    `position: fixed; bottom: 10px; z-index: 50`, so scrolled to the end of a
 *    page it sits over whatever is last on screen. The clearance for it lived
 *    on `main` — 116px of bottom padding — and the footer is OUTSIDE main, so
 *    the padding reserved space in the wrong place. Measured in Chrome at
 *    390x844, scrolled to the bottom: switcher top 778, footer spans at
 *    770-790 and 806-826. Both covered.
 *
 *    Two things fix it and both are asserted below: the clearance moves to
 *    `body` (the end of the document, whatever element that is), and the
 *    switcher MEASURES ITSELF into `--switcher-clearance`, because its height
 *    is not a constant — 56px at 390px wide, 102px at 320px where the links
 *    wrap onto three rows. A hard-coded 116px was both in the wrong place and
 *    the wrong number.
 *
 * 2. THE HERO RECEIPT WAS CLIPPED WITH NO AFFORDANCE. At 390px the receipt
 *    measured clientWidth 351 against scrollWidth 373 — 22px of its right edge
 *    hidden behind an `overflow-x: auto` that showed no scrollbar, on the
 *    page's own proof element. It now fits: the longest line is bounded here,
 *    and the type scales down on narrow viewports. Verified in Chrome at
 *    320/360/390/414 portrait and 667x375 / 844x390 landscape: scrollWidth
 *    equals clientWidth at every one.
 */
import { describe, expect, test } from "bun:test";
import { switcherFor } from "../src/build";
import { DESIGNS } from "../src/designs/registry";
import { renderHome } from "../src/designs/ledger/home";
import { RECORDS, ctxFor } from "./fixtures";
import { textOfEach } from "./html-text";

const DEFAULT_CSS = await Bun.file(
  new URL("../public/style.css", import.meta.url).pathname,
).text();

/** Every design's stylesheet: its own, or the shared default for the ledger. */
const STYLESHEETS: Array<[string, string]> = DESIGNS.map((d) => [
  d.id,
  d.css ?? DEFAULT_CSS,
]);

describe("nothing at the end of a page sits under the fixed switcher", () => {
  test("all four designs are covered by this suite", () => {
    expect(STYLESHEETS.length).toBe(4);
  });

  for (const [id, css] of STYLESHEETS) {
    test(`${id}: the clearance is on <body>, not on <main>`, () => {
      // The footer lives outside main, so main's padding can never reach it.
      expect(css).toMatch(/body\s*\{[^}]*padding-block-end:\s*var\(--switcher-clearance/);
    });

    test(`${id}: the no-JS fallback clears the WIDEST the switcher gets`, () => {
      const m = css.match(/--switcher-clearance,\s*(\d+)px\)/);
      expect(m, `${id}: no literal fallback for --switcher-clearance`).not.toBeNull();
      // 102px tall at 320px wide (links on three rows) + its 10px inset + a gap.
      expect(Number(m![1])).toBeGreaterThanOrEqual(120);
    });
  }

  test("the switcher measures its own height rather than trusting a constant", () => {
    const script = switcherFor(DESIGNS[0]!, "");
    expect(script).toContain("--switcher-clearance");
    expect(script).toContain("getBoundingClientRect");
    // Re-measured on the events that change it: a hard-coded value would be
    // wrong the moment the links rewrap.
    expect(script).toContain("resize");
    expect(script).toContain("orientationchange");
  });
});

describe("the hero receipt fits the narrowest phone", () => {
  /**
   * The budget. Chrome measured the receipt's content box at 315px wide at a
   * 390px viewport, with the mono face at ~0.6em per character; 40 characters
   * is what fits there and at 320px once the type steps down. The old copy ran
   * to 46 and was cut off.
   */
  const MAX_CHARS = 40;

  const html = renderHome(RECORDS, ctxFor("ledger", "home", ""));

  /**
   * One string per transcript row, read out of the parse rather than out of a
   * regex.
   *
   * WHAT WAS WRONG. The receipt was located with
   * `/<div class="receipt-body">([\s\S]*?)<\/div>\s*<\/div>/` — a lazy match
   * that stops at the FIRST `</div></div>`, so it ends at the first nested row
   * rather than at the receipt, and the whole measurement silently ran on a
   * fragment. What survived was then split on `/<div[^>]*>/` and stripped with
   * `/<[^>]+>/g`, which treats "`<`, anything, `>`" as a tag: `<a title="a>b">`
   * ends at the `>` inside the quoted value and leaks `b">` into the measured
   * line, and a `<` with no `>` after it — a truncated `<script`, say — is
   * copied into the output untouched. That last case is the reappearing
   * sequence CodeQL's js/incomplete-multi-character-sanitization names, and it
   * is also just a wrong character count on a test whose entire job is counting
   * characters.
   *
   * A parser gives the rows directly, entity-decoded, with no fragment to get
   * wrong: `&amp;` is one character on screen and is counted as one here.
   */
  const lines = textOfEach(html, "div.receipt-body > div")
    .map((l) => l.trim())
    .filter(Boolean);

  test("the receipt is on the page and is readable as lines", () => {
    expect(lines.length).toBeGreaterThan(0);
  });

  test("every transcript line is inside the width budget", () => {
    expect(lines.length).toBeGreaterThanOrEqual(7);
    const over = lines
      .filter((l) => l.length > MAX_CHARS)
      .map((l) => `${l.length}: ${l}`);
    expect(
      over,
      `these are cut off on a 390px screen with nothing saying so — shorten them, ` +
        `do not widen the scroller`,
    ).toEqual([]);
  });

  test("the transcript keeps its own scroller as a backstop", () => {
    // Fitting is the fix; the scroller stays for a font that loads wider than
    // the metric assumed here.
    expect(DEFAULT_CSS).toMatch(/\.receipt-body\s*\{[^}]*overflow-x:\s*auto/);
  });

  test("the type steps down on narrow viewports instead of clipping", () => {
    expect(DEFAULT_CSS).toMatch(/\.receipt-body\s*\{[^}]*font-size:\s*min\(/);
  });

  test("lines still say what they said — the shortening kept every verdict", () => {
    const joined = lines.join("\n");
    for (const id of [
      "secrets", "commit-signing", "branch-protection",
      "slsa-provenance", "harden-runner", "signing-model",
    ]) {
      expect(joined).toContain(id);
    }
    expect(joined).toContain("[FAIL]");
    expect(joined).toContain("[·····]"); // the unverified third state
    expect(joined).toContain("1 failed, 1 unanswered");
  });
});
