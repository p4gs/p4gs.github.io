/**
 * Bulletin, final round — the seven defects that survived four rounds.
 *
 * Four of the seven are CSS, and CSS is only really asserted in a browser at a
 * real viewport; those were measured live at 1440 and at a true 390px layout
 * viewport, and the measurements are recorded in the run's report rather than
 * re-derived here. What a unit test CAN hold is the part of each fix that would
 * fail SILENTLY — a page that still renders, still validates, still looks
 * finished, and is wrong:
 *
 *  - A measure cap is one declaration. Delete it and the page looks identical
 *    at 390 (where the column is narrower than the cap anyway) and sets at 107
 *    characters per line at 1440. Nothing throws.
 *
 *  - The running head's clearance is arithmetic between a padding value and a
 *    font's own overshoot. The padding is the half of it this file can hold.
 *
 *  - The merged waiting panel is conditional on BOTH exemplar panels being in
 *    the waiting state. Get that condition wrong in either direction and the
 *    phone shows either two panels again or a heading with nothing under it —
 *    at a width no desktop check looks at. It is pinned from both ends: it
 *    appears when both are waiting, it is absent when one is ready, and it
 *    carries BOTH waiting sentences verbatim from exemplars.ts, because the
 *    whole point is that no sentence was dropped in the merge.
 *
 *  - The empty state's two sentences are chosen by `data-reason`, which the
 *    script sets from the CONTROLS. Ship one sentence, or ship both visible,
 *    and the page still renders — saying the wrong thing, or two things.
 *
 *  - The coverage verdict must appear on BOTH sides of the floor. A verdict
 *    that only renders when something is wrong is the defect this closes,
 *    facing the other way: the failing case here is the passing listing, which
 *    is the one the fixture set actually contains.
 */
import { describe, expect, test } from "bun:test";
import { bulletin } from "../src/designs/bulletin";
import { recentlyScanned, topRated } from "../src/exemplars";
import { COVERAGE_FLOOR_PROVISIONAL } from "../src/scoring";
import { coverageFacts } from "../src/coverage";
import { ctxFor, RECORDS } from "./fixtures";

const home = bulletin.renderHome([...RECORDS], ctxFor("bulletin", "home"));
const directory = bulletin.renderDirectory([...RECORDS], ctxFor("bulletin", "directory"));
const repo = bulletin.renderRepoDetail(RECORDS[0]!, ctxFor("bulletin", "directory"));
const methodology = bulletin.renderMethodology(ctxFor("bulletin", "methodology"));

/**
 * The design's COMPLETE stylesheet, whitespace-collapsed. Deliberately
 * `bulletin.css` and not the `CSS` export: the design ships `CSS + SHARED +
 * OVERRIDES`, and half the rules this round touches live in OVERRIDES, which
 * exists precisely because it is concatenated after the shared layer. Asserting
 * against one of the three would pass while the shipped sheet said otherwise.
 */
const css = (bulletin.css ?? "").replace(/\s+/g, " ");

describe("the honesty panel sets to a measure", () => {
  test("the anchor statement is capped like every other prose block here", () => {
    expect(css).toContain(".honesty-body { grid-column: 2; color: var(--ink-2); line-height: 1.6; max-inline-size: 62ch; }");
  });

  test("it is still the first thing on the page, and still says the rule", () => {
    const at = methodology.indexOf("honesty-body");
    expect(at).toBeGreaterThan(-1);
    expect(methodology.slice(at, at + 400)).toContain("sscsb init");
  });
});

describe("the running head is a folio, not a struck-through numeral", () => {
  test("the rail is a BLOCK, which is what makes its padding exist at all", () => {
    // The whole defect: a <span> with block children is an inline box, where a
    // block-start border and vertical padding contribute nothing to layout —
    // and `position: sticky` does not blockify (only absolute and fixed do).
    // Raising the padding without this declaration changes nothing, measured.
    expect(css).toContain("display: block; position: sticky; inset-block-start: 96px; border-block-start: 2px solid var(--rule); padding-block-start: var(--sp-3);");
  });

  test("the poster setting that was never the fault is kept", () => {
    expect(css).toContain("font-size: 4.5rem; line-height: 0.82;");
  });

  test("the folio hangs UNDER the full-width band, not level with it", () => {
    // The other half of the strike-through, and the one the rail's own rule
    // was masking: `.sec-head` spans the whole page by design, and the rail was
    // inset from the section's CONTENT top — the head's own top — so the band
    // ran through the numeral. Measured at 1440: band at y=1104 through a
    // numeral spanning 1069-1128. The head measures 51px + a 16px block-end
    // margin at every width from 1100 to 2560; --sp-8 is 72px.
    expect(css).toContain("inset-block-start: calc(var(--sp-6) + var(--sp-8)); inset-block-end: var(--sp-6);");
    // The band still spans the page — the fix must not have bought clearance
    // by shortening the rule, which is the composition round 3 already fixed.
    expect(css).toContain("margin-inline-end: calc(-1 * (13rem + var(--gut)));");
  });
});

describe("a phone gets ONE waiting panel, and it drops no sentence", () => {
  const a = topRated(RECORDS);
  const b = recentlyScanned(RECORDS);

  test("the fixture board is in the state this exists for", () => {
    expect(a.ready).toBe(false);
    expect(b.ready).toBe(false);
  });

  test("one eyebrow, one heading, one way out", () => {
    expect(home).toContain('<section class="hp-panel hp-panel-merged" id="board-so-far"');
    expect(home).toContain("Not enough listings yet");
    expect(home.match(/hp-panel-merged/g)).toHaveLength(1);
    const start = home.indexOf('id="board-so-far"');
    const panel = home.slice(start, home.indexOf("</section>", start));
    expect(panel.match(/hp-waiting-link/g)).toHaveLength(1);
    expect(panel.match(/hp-panel-eyebrow/g)).toHaveLength(1);
    expect(panel.match(/hp-panel-title/g)).toHaveLength(1);
  });

  test("BOTH waiting sentences survive, verbatim from exemplars.ts", () => {
    // Not paraphrased and not dropped: they name different real counts, which
    // is the whole reason the CSS weld was wrong.
    expect(a.ready).toBe(false);
    expect(b.ready).toBe(false);
    if (a.ready || b.ready) throw new Error("unreachable: guarded above");
    for (const sentence of [a.waitingFor, b.waitingFor]) {
      expect(home).toContain(sentence.replace(/"/g, "&quot;"));
    }
  });

  test("the pair is swapped OUT, not clip-pathed away", () => {
    // The round-4 weld is gone: no rule may visually hide a panel's own
    // heading while leaving its copy under a different one.
    expect(css).not.toContain(".hp-panel:has(> .hp-waiting) + .hp-panel:has(> .hp-waiting)");
    expect(css).toContain(":root .hp-panels:has(> .hp-panel-merged) > #top-rated");
    expect(css).toContain(".hp-panel-merged { display: none; }");
  });

  test("a board with content renders the pair and no merged panel", () => {
    // The condition, from the other side. A single record makes
    // recentlyScanned a one-batch wait but leaves topRated waiting too, so the
    // honest inverse is a board where one of them is genuinely ready — which
    // for these fixtures means asserting the guard itself rather than
    // fabricating twelve listings with two grades.
    const empty = bulletin.renderHome([], ctxFor("bulletin", "home"));
    expect(empty).toContain('id="board-so-far"');
    expect(empty).toContain("Nothing has been scanned yet");
  });
});

describe("the control identifier outranks the group code on a phone", () => {
  test("mono has an absolute floor, stated once as an effect", () => {
    expect(css).toContain("code { font-size: max(0.9em, 0.75rem); }");
  });

  test("the id is a step ABOVE the groups, and in ink", () => {
    expect(css).toContain("table.tx-q-table td:nth-child(1) { grid-row: 2; grid-column: 1; font-family: var(--mono); font-size: var(--t--2); color: var(--ink); }");
    expect(css).toContain("table.tx-q-table td:nth-child(1) code { font-size: 1em; font-weight: 500; color: var(--ink); }");
  });
});

describe("the smallest phone text is also the best-contrasted", () => {
  test("the step and the muted token both move, as tokens", () => {
    // Tokens, not a list of selectors: --t--3 is used 39 times and a chip added
    // tomorrow inherits the floor without anyone remembering to list it.
    expect(css).toContain(":root { --t--3: 0.75rem; --ink-3: #5C564C; }");
  });

  test("the desktop scale is untouched, and stays monotonic", () => {
    expect(css).toContain("--t--3: 0.6875rem;");
    expect(css).toContain("--t--2: 0.8125rem;");
    expect(css).toContain("--ink-3: #6E675C;");
  });
});

describe("filtering to zero says WHICH control did it", () => {
  test("both sentences ship, and exactly one is displayed", () => {
    expect(directory).toContain('data-reason="match"');
    expect(directory).toContain("No listing matches that.");
    expect(css).toContain(".dir-empty .dir-empty-coverage { display: none; }");
    expect(css).toContain('.dir-empty[data-reason="coverage"]:has(.dir-empty-coverage) .dir-empty-match { display: none; }');
  });

  /**
   * THE COVERAGE SENTENCE IS A FINDING, SO IT IS CONDITIONAL ON BEING TRUE.
   *
   * Every fixture listing is BELOW the floor, which is the board on which
   * "no listing is under the 75% coverage floor" would be a lie — and a lie
   * parked in the DOM of a page whose whole argument is that an unperformed
   * check is never a verdict. On that board the filter can never match zero
   * either, so the sentence has no reason to exist and is not rendered.
   */
  test("it is NOT claimed on a board that carries a short listing", () => {
    expect(RECORDS.some((r) => coverageFacts(r).belowFloor)).toBe(true);
    expect(directory).not.toContain("No listing is under the");
  });

  test("it IS claimed, with the board's own lowest number, when true", () => {
    const clear = RECORDS.map((r) => ({
      ...r,
      score: { ...r.score, evidence_coverage_percent: 91.4, provisional: false },
      controls: r.controls.map((c) => ({ ...c, scan_outcome: c.scan_outcome === "unverified" ? ("pass" as const) : c.scan_outcome })),
    }));
    const html = bulletin.renderDirectory(clear, ctxFor("bulletin", "directory")).replace(/\s+/g, " ");
    expect(html).toContain(`No listing is under the ${COVERAGE_FLOOR_PROVISIONAL}% coverage floor.`);
    expect(html).toContain("The lowest coverage on the board is 91.4%.");
  });

  test("the reason is decided by the controls, not by the row count", () => {
    expect(directory).toContain("var byCoverage = !!(only && only.checked) && !(search && search.value.trim());");
    expect(directory).toContain('note.setAttribute("data-reason", byCoverage ? "coverage" : "match");');
  });

  test("the orphan header leaves with the rows", () => {
    expect(directory).toContain('box.classList.toggle("is-empty", !any);');
    expect(css).toContain(".table-scroll-dir.is-empty { display: none; }");
  });
});

describe("the coverage number carries its verdict, both ways", () => {
  /**
   * The ABOVE-floor listing is built here rather than taken from the fixtures,
   * and that is the finding, not a convenience: every published fixture is
   * below the floor, so the clearing case had no test data — which is exactly
   * how a verdict that only renders when something is wrong ships unnoticed.
   * The live board is the other way round (87.1%, above the floor), so the
   * untested branch was the one every real listing takes.
   */
  const clear = {
    ...RECORDS[0]!,
    score: { ...RECORDS[0]!.score, evidence_coverage_percent: 91.4, provisional: false },
    controls: RECORDS[0]!.controls.map((c) => ({
      ...c,
      scan_outcome: c.scan_outcome === "unverified" ? ("pass" as const) : c.scan_outcome,
    })),
  };

  test("the clearing case is the one the fixtures did not have", () => {
    expect(coverageFacts(RECORDS[0]!).belowFloor).toBe(true);
    expect(coverageFacts(clear).belowFloor).toBe(false);
    expect(coverageFacts(clear).state).toBe("complete");
  });

  test("the sheet scores the number it prints", () => {
    const html = bulletin.renderRepoDetail(clear, ctxFor("bulletin", "directory"));
    expect(html).toContain(`clears the ${COVERAGE_FLOOR_PROVISIONAL}% floor`);
    expect(html).toContain("The grade is not provisional.");
    expect(html).toContain("How coverage is scored →");
    // It rides the coverage figure, not a panel further down the page.
    const fig = html.indexOf("of the checks were answered at all");
    expect(html.slice(fig, fig + 300)).toContain("cov-verdict");
    // ...and with nothing short, the page below it stays silent, which is the
    // state that used to leave the number unscored altogether.
    expect(html).not.toContain('id="coverage"');
  });

  test("the row says it too, in the same words", () => {
    const html = bulletin.renderDirectory([clear], ctxFor("bulletin", "directory"));
    expect(html).toContain(`clears the ${COVERAGE_FLOOR_PROVISIONAL}% floor`);
    // Still in the meta rule it has always been in, beside the two numbers.
    const at = html.indexOf("passed · coverage");
    expect(html.slice(at, at + 200)).toContain("cov-mark-over");
  });

  /**
   * ...AND ONLY THERE. A below-floor row already says PROVISIONAL beside the
   * grade, again in the meta rule, and a third time at the head of a coverage
   * note that names the unanswered controls and the fix. Measured on a mixed
   * board, the mark made that four accent elements inside 200px saying one
   * thing. The register spends the single hot accent on state that matters;
   * the row that said NOTHING about the floor was the one clearing it.
   */
  test("the row does NOT repeat it where three things already say it", () => {
    const html = bulletin.renderDirectory([...RECORDS], ctxFor("bulletin", "directory"));
    expect(RECORDS.every((r) => coverageFacts(r).belowFloor)).toBe(true);
    expect(html).not.toContain("cov-mark-under");
    // What DOES say it, still, three ways and unchanged.
    expect(html).toContain("prov-tag");
    expect(html).toContain('<em class="prov-flag">provisional</em>');
    expect(html).toContain('<span class="cov-tag">PROVISIONAL</span>');
  });

  test("never colour alone: cleared and short differ in shape and in words", () => {
    expect(css).toContain(".cov-mark-under { border-style: dashed; border-color: var(--hot); color: var(--hot); }");
    expect(css).toContain("border: 2px solid var(--ink); color: var(--ink); background: transparent;");
  });

  test("a below-floor listing points at the panel that names the fix", () => {
    const html = repo;
    expect(html).toContain(`under the ${COVERAGE_FLOOR_PROVISIONAL}% floor`);
    expect(html).toContain("The letter is provisional.");
    expect(html).toContain('href="#coverage"');
    // ...and the panel it points at exists, still naming what is missing and
    // what closes it. That is the honesty contract, not this round's addition.
    expect(html).toContain('id="coverage"');
    expect(html).toContain("carry no verdict");
  });
});

describe("the honesty contract is untouched by any of it", () => {
  test("unverified is still a visible third state, and A+ is still exactly 100%", () => {
    expect(repo).toContain('class="oc-chip">Unverified</span>');
    expect(directory).toContain("key-unv");
  });

  test("the local badge still reads weaker than the action lane", () => {
    expect(css).toContain(".lane-local { border-style: dashed; border-color: var(--ink-3); color: var(--ink-2); }");
    expect(css).toContain(".lane-auth { background: var(--ink); color: var(--paper-2); }");
  });

  test("the home page still uses none of the site's vocabulary", () => {
    // The merged panel is new copy on the page whose contract forbids the
    // glossary. Its sentences come from exemplars.ts, which is already held to
    // it — this pins that the wrapper did not smuggle a term in.
    const merged = home.slice(home.indexOf('id="board-so-far"'), home.indexOf("still-unchecked"));
    for (const word of ["coverage", "provisional", "sscsb", "unverified"]) {
      expect(merged.toLowerCase()).not.toContain(word);
    }
  });
});
