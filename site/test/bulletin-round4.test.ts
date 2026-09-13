/**
 * Bulletin, round 4 — the changes that would fail SILENTLY.
 *
 * Most of this round is CSS, and CSS is asserted where it can actually be
 * asserted: in a real browser at 1440 and at a true 390px viewport. What is
 * pinned here is the small set of changes that produce a page which still
 * renders, still validates, still looks finished — and is wrong.
 *
 *  - The contract block is a SUBSTITUTION over HTML produced by a shared file.
 *    A substitution is only as good as the string it matches: reformat
 *    `methodology-local.ts` and `replace` matches nothing, returns its input,
 *    and the phone quietly goes back to a wrapped <pre> whose continuation
 *    lines parse as keys. Nothing throws. So it is pinned from BOTH ends — the
 *    shared output still contains what we match on, and the rendered page no
 *    longer does — plus the property that made the table worth building: every
 *    key in CONTRACT_TEXT survives into it, verbatim.
 *
 *  - The section index's accessible name comes from a visually-hidden span
 *    while the paint comes from an aria-hidden one. Drop either and the strip
 *    still looks right: one way it reads "01 Protocol" to a screen reader, the
 *    other way the bar is 1,400px of links in a 358px box again.
 *
 *  - The jump strip's label exists twice, once per width. Ship both visible and
 *    the phone reads "Jump to phasePhase"; ship neither and the round-3 defect
 *    is back.
 *
 *  - The zero-results strip and its script only matter together, and only
 *    against the ids `public/filter.js` documents. A renamed id leaves a page
 *    that empties itself in silence, which is the defect it exists to close.
 */
import { describe, expect, test } from "bun:test";
import { bulletin } from "../src/designs/bulletin";
import { localLaneBodyWithContractTable } from "../src/designs/bulletin/methodology";
import { PHASE_SHORT } from "../src/designs/bulletin/components";
import { NO_LISTING_FACTS, type ListingFacts } from "../src/listing";
import { CONTRACT_TEXT } from "../src/local-contract";
import { localLaneBody } from "../src/methodology-local";
import { trustKeyOf } from "../src/trust";
import { ctxFor, RECORDS } from "./fixtures";

const ctx = ctxFor("bulletin", "methodology");
const methodology = bulletin.renderMethodology(ctx);

/**
 * A listing whose merge actually FOUND something. The default fixture context
 * carries no facts map, so every provenance surface on the page — the merge
 * fold, the contradiction panel — renders as the empty string, and a suite
 * built on it would assert nothing about the copy it is meant to pin.
 */
const FACTS: ListingFacts = {
  ...NO_LISTING_FACTS,
  contradictions: ["codeql"],
  staleAgainstBase: { local: "3cb129084db2ab", base: "c8a23493ec0cff" },
  selfReported: {
    grade: "A+",
    provisional: false,
    overall_percent: 100,
    evidence_coverage_percent: 89.5,
  },
};
const factsCtx = {
  ...ctxFor("bulletin", "directory"),
  facts: new Map([[trustKeyOf(RECORDS[0]!), FACTS]]),
};
const directory = bulletin.renderDirectory([...RECORDS], factsCtx);
const repo = bulletin.renderRepoDetail(RECORDS[0]!, factsCtx);

describe("the local-lane contract is a table, not a wrapped <pre>", () => {
  test("the shared <pre> this replaces is still the shape we match on", () => {
    const shared = localLaneBody(ctx.h, "cov-cmd");
    expect(shared).toContain(`<pre class="cov-cmd"><code>${CONTRACT_TEXT}</code></pre>`);
  });

  test("the replacement actually happened", () => {
    const body = localLaneBodyWithContractTable(ctx.h);
    expect(body).not.toContain(`<code>${CONTRACT_TEXT}</code>`);
    expect(body).toContain('<table class="contract-table">');
    expect(methodology).toContain('<table class="contract-table">');
  });

  test("every contract key and value survives, verbatim", () => {
    const body = localLaneBodyWithContractTable(ctx.h);
    const [header = "", ...lines] = CONTRACT_TEXT.split("\n");
    expect(body).toContain(header);
    for (const line of lines.filter((l) => l.trim().length > 0)) {
      const at = line.search(/\s{2,}/);
      const key = at === -1 ? line.trim() : line.slice(0, at);
      const val = at === -1 ? "" : line.slice(at).trim();
      expect(body).toContain(`<td class="ct-key">${key}</td>`);
      expect(body).toContain(`<td class="ct-val">${val}</td>`);
    }
  });

  test("the genuinely linear shell commands stay <pre>", () => {
    // The command a maintainer copies is one line with backslash
    // continuations; wrapping it is correct and a table would be wrong.
    expect(methodology).toContain('<pre class="cov-cmd">');
    expect(methodology).toContain("ssh-keygen -Y verify");
  });
});

describe("the section index says where you are, and where you can go", () => {
  test("the paint is short, the accessible name is the long title", () => {
    expect(methodology).toContain('<span class="si-short" aria-hidden="true">01 Protocol</span>');
    expect(methodology).toContain('<span class="si-long">01 The scan protocol</span>');
    // Eight sections, each carrying both forms.
    expect(methodology.match(/class="si-short"/g)).toHaveLength(8);
    expect(methodology.match(/class="si-long"/g)).toHaveLength(8);
  });

  test("a way back to the top rides the strip that is already sticky", () => {
    expect(methodology).toContain('class="sec-top" href="#content"');
  });

  test("the scroll-spy ships, and marks the current section rather than colouring it", () => {
    expect(methodology).toContain('setAttribute("aria-current", "true")');
    expect(methodology).toContain("nav.scrollLeft");
  });

  test("every index target exists on the page", () => {
    const hrefs = [...methodology.matchAll(/class="sec-(?:index )?[^"]*"|href="([^"]*#[^"]+)"/g)]
      .map((m) => m[1])
      .filter((h): h is string => typeof h === "string" && h.includes("methodology/#"))
      .map((h) => h.slice(h.indexOf("#") + 1));
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const id of new Set(hrefs)) expect(methodology).toContain(`id="${id}"`);
  });
});

describe("the running head fills the column the prose cannot", () => {
  test("a prose section carries one, and it is apparatus", () => {
    expect(methodology).toContain('<div class="sec-rail" aria-hidden="true">');
    expect(methodology).toContain('<span class="sec-rail-num">07</span>');
  });

  test("the wide-table section does NOT — there the column is the table", () => {
    const at = methodology.indexOf('id="evidence-classes"');
    const next = methodology.indexOf("</section>", at);
    expect(methodology.slice(at, next)).not.toContain("sec-rail");
    expect(methodology.slice(at, next)).toContain('class="method-table cls-table"');
  });
});

describe("the jump strip is labelled at both widths, and reads as a control", () => {
  test("both label forms ship; the stylesheet shows exactly one", () => {
    expect(repo).toContain('<span class="ctl-label-long">Jump to phase</span>');
    expect(repo).toContain('<span class="ctl-label-short">Phase</span>');
  });

  test('"P3" is not an accessible name', () => {
    expect(repo).toContain('aria-label="Jump to phase 3 — Build receipts"');
  });

  test("a return path rides the strip rather than a second sticky bar", () => {
    expect(repo).toContain('<a class="ctl-top" href="#content">');
  });
});

describe("filtering to zero says so, on the contract filter.js documents", () => {
  test("the strip and its reset ship together", () => {
    expect(directory).toContain('<p class="dir-empty" id="dir-empty" hidden>');
    expect(directory).toContain('class="dir-clear" id="dir-clear"');
  });

  test("it reads the rows and the controls, never filter.js's internals", () => {
    expect(directory).toContain('document.getElementById("dir-filter")');
    expect(directory).toContain('document.getElementById("dir-incomplete")');
    expect(directory).toContain('table.directory tbody');
    expect(directory).toContain('new Event("input", { bubbles: true })');
    expect(directory).toContain('new Event("change", { bubbles: true })');
  });
});

describe("the directory's own key decodes what its rows show", () => {
  test("P1…P6 have a legend, in the home board's own words", () => {
    expect(directory).toContain('class="key-phases"');
    for (const [n, name] of Object.entries(PHASE_SHORT)) {
      expect(directory).toContain(`<code>P${n}</code> ${name.toLowerCase()}`);
    }
  });

  test("the placeholder n reads as a placeholder, not a dropped glyph", () => {
    expect(directory).toContain('<em class="kv">n</em> controls on that listing');
  });

  test("the merge chip does not run into the summary it labels", () => {
    expect(directory).toContain('<span class="mn-tag">Merge</span><span class="vh"> — </span>');
  });
});

describe("the honesty contract is untouched by any of it", () => {
  test("unverified is still a visible third state on every surface", () => {
    for (const html of [directory, repo]) expect(html).toContain("key-unv");
    expect(repo).toContain('class="oc-chip">Unverified</span>');
  });

  test("a provisional grade still carries its tag", () => {
    expect(directory).toContain('class="prov-tag"');
  });

  test("the contradiction is still named on the row AND on the sheet", () => {
    expect(directory).toContain("merge-note");
    expect(repo).toContain('id="merge"');
  });
});
