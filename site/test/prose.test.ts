/**
 * The plain-language promise, measured.
 *
 * THE DEFECT THIS PINS. The site's whole premise is that a reader who has never
 * opened a SLSA spec can follow it, and the plain-language pass was done by
 * hand, page by page. It silently missed one page. Measured, the methodology
 * page ran a 13.6-word mean with a single 71-word sentence, while the home and
 * repo pages sat near 8-10 with nothing over 32. Nothing caught it because
 * nothing measured it, and a hand pass will miss the same page again.
 *
 * WHY THE THRESHOLDS DIFFER PER PAGE. They are not one number because the pages
 * are not one job. The repo detail page is mostly short verdict lines; the
 * methodology page is the methodology, and is allowed to be the most technical
 * writing on the site. What it is NOT allowed to be is unbounded — the 71-word
 * sentence was not precision, it was four sentences that had never been
 * separated. So each page gets a ceiling set just above what it now measures,
 * with roughly one to two words of headroom on the mean: enough that an honest
 * edit does not trip it, tight enough that a slide back toward the old copy
 * does. Every design renders the same numbers, so every design is measured.
 *
 * The measurement itself is `test/readability.ts`, which documents what it
 * counts and what it deliberately does not (code blocks, rows of labels,
 * fragments under four words).
 */
import { describe, expect, test } from "bun:test";
import { measure, splitSentences, wordsIn, MIN_WORDS } from "./readability";
import { DESIGNS } from "../src/designs/registry";
import type { DesignCtx } from "../src/designs/types";
import { BASE_PATH } from "../src/config";
import { RECORDS, ctxFor } from "./fixtures";

/**
 * Per page: the ceiling on the mean words per sentence, and on the single
 * longest sentence. Measured values at the time of writing are in the comment
 * beside each — the gap between the two is the headroom.
 */
const THRESHOLDS: Record<string, { mean: number; max: number }> = {
  // measured 10.1 – 10.7 mean, 25 – 30 max
  home: { mean: 12, max: 34 },
  // measured 11.0 – 13.3 mean, 27 max
  directory: { mean: 15, max: 34 },
  // measured 8.3 – 8.5 mean, 28 max
  repo: { mean: 11, max: 34 },
  // The most technical page on the site, and allowed to be. Before this pass:
  // 13.6 mean, 71 max. Now 11.5 – 11.6 mean, 30 max.
  methodology: { mean: 12.5, max: 40 },
};

function pagesFor(d: (typeof DESIGNS)[number]): Record<string, string> {
  const ctx = (active: string, subpath: string): DesignCtx => ctxFor(d.id, active, subpath);
  return {
    home: d.renderHome(RECORDS, ctx("home", "")),
    directory: d.renderDirectory(RECORDS, ctx("directory", "directory/")),
    repo: d.renderRepoDetail(RECORDS[0]!, ctx("directory", "directory/x/")),
    methodology: d.renderMethodology(ctx("methodology", "methodology/")),
  };
}

describe("sentence length is bounded on every page, in every design", () => {
  for (const d of DESIGNS) {
    const pages = pagesFor(d);
    for (const [page, html] of Object.entries(pages)) {
      const limit = THRESHOLDS[page]!;
      const r = measure(html);

      test(`${d.id} ${page}: mean words per sentence ≤ ${limit.mean}`, () => {
        expect(r.count, `${d.id} ${page} produced no measurable prose`).toBeGreaterThan(10);
        expect(
          r.mean,
          `${d.id} ${page}: ${r.mean} mean over ${r.count} sentences (median ${r.median}). ` +
            `Longest: ${r.longest.map((s) => `[${s.words}] ${s.text.slice(0, 90)}`).join(" | ")}`,
        ).toBeLessThanOrEqual(limit.mean);
      });

      test(`${d.id} ${page}: no sentence longer than ${limit.max} words`, () => {
        const over = r.sentences.filter((s) => s.words > limit.max);
        expect(
          over.map((s) => `[${s.words}] ${s.text}`),
          `${d.id} ${page}: split these rather than deleting the precision`,
        ).toEqual([]);
      });
    }
  }
});

/**
 * The methodology page is allowed to be the most technical page. It is not
 * allowed to drift back to being a different KIND of page from the rest, which
 * is what "13.2 mean against 8.1" actually described.
 */
test("the methodology page stays in the same register as the rest of the site", () => {
  for (const d of DESIGNS) {
    const pages = pagesFor(d);
    const method = measure(pages.methodology!).mean;
    const others = ["home", "directory", "repo"].map((p) => measure(pages[p]!).mean);
    const best = Math.min(...others);
    expect(
      method - best,
      `${d.id}: methodology ${method} vs the plainest page ${best}`,
    ).toBeLessThanOrEqual(5);
  }
});

describe("the measurement itself", () => {
  test("a colon or semicolon ends a sentence — the threshold cannot be dodged with punctuation", () => {
    expect(splitSentences("One thing; another thing. A third.")).toEqual([
      "One thing;",
      "another thing.",
      "A third.",
    ]);
  });

  test("a version number, a domain and an ellipsis are not sentence ends", () => {
    // One sentence, not four. Splitting on these would report a page as
    // pleasantly short by chopping its sentences at every version number.
    expect(splitSentences("Use v2.5.10 from example.com now… then stop.")).toEqual([
      "Use v2.5.10 from example.com now… then stop.",
    ]);
    // A real terminator still splits.
    expect(splitSentences("Use v2.5.10 now. Then stop.").length).toBe(2);
  });

  test("a row of sibling labels is not one long sentence", () => {
    // Taxonomy chips in a container with no prose of its own. Joining these
    // invented a 43-word "sentence" on the home page that nobody wrote, and
    // would have sent a readability pass chasing a defect that does not exist.
    const labels = [
      "A1 Poisoned commit",
      "A2 Stolen publisher identity",
      "A3 Look-alike or invented package",
    ];
    const chips = `<div>${labels.map((t) => `<a href="#">${t}</a>`).join("")}</div>`;
    const r = measure(chips);
    // Each chip stands alone; none is the concatenation of the row.
    expect(r.max).toBeLessThanOrEqual(5);
    expect(r.sentences.map((s) => s.text)).toEqual(labels.slice(1));
  });

  test("an inline link inside a sentence never splits it", () => {
    const p = `<p>The listings that passed the most of <a href="#">what could be checked</a> across every phase of the scan.</p>`;
    const r = measure(p);
    expect(r.count).toBe(1);
    // Counted whole — the link cannot be used to hide the sentence's length.
    expect(r.max).toBe(17);
  });

  test("code blocks and commands are excluded — a command line is not prose", () => {
    const html = `<p>Run it.</p><pre><code>sscsb verify --format json --config .sscsb/config.toml --output out.json</code></pre>`;
    expect(measure(html).sentences).toEqual([]); // "Run it." is under the floor
    expect(measure(`<p>${"word ".repeat(50)}.</p>`).max).toBe(50);
  });

  test("the fragment floor is low enough to count real short sentences", () => {
    expect(MIN_WORDS).toBeLessThanOrEqual(4);
    expect(wordsIn("An unperformed check is never a verdict.")).toBe(7);
    expect(measure("<p>An unperformed check is never a verdict.</p>").count).toBe(1);
  });

  test("it reads the built pages, not a hand-written sample", () => {
    // Guards the wiring: if renderHome ever returned "" this suite would pass
    // vacuously while measuring nothing.
    const home = measure(DESIGNS[0]!.renderHome(RECORDS, ctxFor(DESIGNS[0]!.id, "home", "")));
    expect(home.count).toBeGreaterThan(20);
    expect(BASE_PATH.length).toBeGreaterThan(0);
  });
});
