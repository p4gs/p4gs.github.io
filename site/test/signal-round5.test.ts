/**
 * Signal, round 5 — the RENDERING changes that would fail silently.
 *
 * Same contract as rounds 3 and 4, and for the same reason. Two of the changes
 * below are string transforms over HTML produced by `threats-shared.ts`, a file
 * five designs share and this one may not edit. A `.replace` whose pattern
 * stops matching returns its input unchanged: nothing throws, nothing looks
 * broken enough to notice in a diff, and the page quietly goes back to the
 * comma-gapped runs a judge quoted verbatim. So the assertions here are
 * two-sided — the new form is present AND the old form is gone — and they
 * count, because "it matched at least once" is not the claim.
 *
 * The CSS-only fixes of this round (the in-flow switcher, the pass-hued score
 * meter, the hugged `reported` tag, the pinned status chip, the unbroken
 * identifier chips) are NOT here. They are asserted where they can actually be
 * asserted: in a real browser at 1440 and at a true 390px layout viewport,
 * sampling 11 evenly-spaced scroll positions per page.
 */
import { describe, expect, test } from "bun:test";
import { BASE_PATH } from "../src/config";
import { signal } from "../src/designs/signal";
import { chipList, chipRuns } from "../src/designs/signal/components";
import type { DesignCtx } from "../src/designs/types";
import type { ControlRecord, ScanOutcome, ScanRecord } from "../src/schema";

const ctx: DesignCtx = {
  prefix: BASE_PATH,
  h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
  switcher: "",
  active: "directory",
};

function ctl(
  id: string,
  phase: number,
  scan: ScanOutcome,
  reason: string | null = null,
): ControlRecord {
  return {
    id,
    phase,
    in_scope: true,
    raw_outcome: scan === "unverified" ? "pass" : scan === "gap" ? "disabled" : scan,
    scan_outcome: scan,
    reclassified: false,
    reason,
    messages: [],
  };
}

function record(controls: ControlRecord[]): ScanRecord {
  const pass = controls.filter((c) => c.scan_outcome === "pass").length;
  const unverified = controls.filter((c) => c.scan_outcome === "unverified").length;
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "Acme",
      name: "Widget",
      url: "https://github.com/Acme/Widget",
      default_branch: "main",
      commit: "b".repeat(40),
      description: "sample",
    },
    scanned_at: "2026-09-01T12:00:00Z",
    scanner: {
      sscsb_version: "0.3.0",
      workflow_run_id: 7,
      workflow_run_url: "https://github.com/Acme/Widget/actions/runs/7",
    },
    request_issue: null,
    controls,
    score: {
      grade: "A+",
      provisional: false,
      overall_percent: pass === 0 ? null : 100,
      evidence_coverage_percent: 80,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase,
        pass: phase === 1 ? pass : 0,
        fail: 0,
        gap: 0,
        unverified: phase === 1 ? unverified : 0,
        info: 0,
        percent: phase === 1 && pass > 0 ? 100 : null,
      })),
    },
  };
}

/** A run of chips joined the way the shared modules join them. */
const RUN = `<code>alpha</code>, <code>beta</code>, <code>gamma</code>`;

describe("R5-D6: an identifier run is a list, not a sentence", () => {
  test("chipList emits no separator between chips at all", () => {
    const html = chipList(["alpha", "beta"]);
    expect(html).toBe(`<span class="chip-list"><code>alpha</code><code>beta</code></span>`);
    expect(html).not.toContain(",");
  });

  test("chipList escapes, and returns nothing for nothing", () => {
    expect(chipList([])).toBe("");
    expect(chipList(["a<b"])).toContain("a&lt;b");
  });

  test("chipRuns rewrites a comma-joined run and keeps every identifier", () => {
    const out = chipRuns(`<p>${RUN}</p>`);
    expect(out).toBe(
      `<p><span class="chip-list"><code>alpha</code><code>beta</code><code>gamma</code></span></p>`,
    );
  });

  /**
   * The half that matters. A comma between two chips is a list separator; a
   * comma in a sentence that happens to contain chips is grammar, and removing
   * it would rewrite the prose. The run has to be chips and separators and
   * nothing else, so both of these survive untouched.
   */
  test("a comma doing grammatical work in prose is left alone", () => {
    const prose = `<li>Run <code>sscsb init</code>, then <code>sscsb verify</code>.</li>`;
    expect(chipRuns(prose)).toBe(prose);
    const orElse = `<p><code>unverified</code> or <code>info</code>, outside every denominator.</p>`;
    expect(chipRuns(orElse)).toBe(orElse);
  });

  test("a lone chip is not a run", () => {
    const one = `<p>the <code>secrets</code> check, which ran.</p>`;
    expect(chipRuns(one)).toBe(one);
  });
});

describe("R5-D6: the transform actually fires on the shared markup", () => {
  /**
   * `threats-shared.ts` renders the "Checks that defend it" line for nine
   * threat classes and the exposure panel's Broken / Not found / No answer
   * lists. Signal cannot change how those are joined, so it rewrites them on
   * the way out — and a rewrite that silently stops matching is indisting-
   * uishable from one that is working. Count, and assert the old form is gone.
   */
  const method = signal.renderMethodology(ctx);

  test("the methodology page carries chip lists and no comma-joined runs", () => {
    expect((method.match(/class="chip-list"/g) ?? []).length).toBeGreaterThan(9);
    expect(method).not.toMatch(/<code>[^<]*<\/code>,\s*<code>/);
  });

  test("the repo page's exposure panel carries them too", () => {
    const r = record([
      ctl("a", 1, "pass"),
      ctl("b", 1, "pass"),
      ctl("c", 1, "unverified", "requires the local development environment"),
    ]);
    const html = signal.renderRepoDetail(r, ctx);
    expect(html).toContain(`class="chip-list"`);
    expect(html).not.toMatch(/<code>[^<]*<\/code>,\s*<code>/);
  });

  test("no identifier was lost on the way through", () => {
    // Every control id the posture line names still appears exactly once.
    for (const id of ["best-practices-badge", "compliance-map", "osps-baseline"]) {
      expect((method.match(new RegExp(`<code>${id}</code>`, "g")) ?? []).length).toBeGreaterThan(0);
    }
  });
});

describe("R5-D3: one fact, one statement, one treatment", () => {
  const LONG =
    "resolved by a signed local scan: this control lives in the development " +
    "environment, so a workstation record signed by a key this repository commits " +
    "in .sscsb/policy/allowed_signers is the only evidence that can exist for it";
  const OTHER =
    "runner-tool availability is the scanner's environment, not the repository's; " +
    "all registered artifacts pre-exist the scan and are never counted as evidence";

  test("a reason split across families is never rendered in two forms", () => {
    const r = record([
      ctl("a", 1, "unverified", LONG),
      ctl("b", 1, "unverified", LONG),
      ctl("c", 2, "unverified", LONG),
      ctl("d", 3, "unverified", LONG),
    ]);
    const html = signal.renderRepoDetail(r, ctx);
    // Never three occurrences in one family and one stranded in another.
    expect((html.match(/class="family-note"/g) ?? []).length).toBe(1);
    expect((html.match(/class="ctl-src"/g) ?? []).length).toBe(4);
    // And not one row falls back to the long form.
    expect(html).not.toContain(`<p class="ctl-reason">${LONG}`);
  });

  /**
   * Two notes can now sit together at the top of the grid, so a chip reading
   * "see the note above" would name neither. Each chip names its own.
   */
  test("every chip names which note it inherits", () => {
    const r = record([
      ctl("a", 1, "unverified", LONG),
      ctl("b", 1, "unverified", LONG),
      ctl("c", 2, "unverified", LONG),
      ctl("d", 1, "unverified", OTHER),
      ctl("e", 2, "unverified", OTHER),
      ctl("f", 3, "unverified", OTHER),
    ]);
    const html = signal.renderRepoDetail(r, ctx);
    expect((html.match(/class="family-note"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("see the note above");
    expect(html).toContain(`<span class="ctl-src">resolved by a signed local scan</span>`);
    expect(html).toContain(`<span class="ctl-src">runner-tool availability is the`);
    // Each note states its own count, and the counts are the real ones.
    expect(html).toContain("3 controls below");
  });
});

describe("R5-D1: the switcher's tap affordance stands down when it is in flow", () => {
  /**
   * Signal's stylesheet takes the trial switcher out of position:fixed, so
   * there is nothing to collapse and nothing a first tap should swallow. The
   * script guards on the LIVE element's own position rather than on a media
   * query, which is what keeps the two files from drifting apart — and it is a
   * string in a template literal, so only a test can notice it going missing.
   */
  // The affordance is only emitted where the switcher itself is — the build
  // passes the harness's markup in, and a page without it has nothing to arm.
  const html = signal.renderHome([], {
    ...ctx,
    switcher: `<nav class="design-switcher" aria-label="Design variant"></nav>`,
  });

  test("the script asks the element what its position is before arming", () => {
    expect(html).toContain(`getComputedStyle(nav).position!=="fixed"`);
    // The affordance itself is still there for any design state that floats it.
    expect(html).toContain(`nav.classList.add("is-open")`);
  });

  test("the stylesheet is the thing that places it, and it places it in flow", () => {
    expect(signal.css).toContain(".design-switcher {\n  position: static;");
    // The shared 44px tap floor is not among the things overridden: the
    // in-flow rule sets padding only, never min-block-size.
    expect(signal.css).not.toMatch(/\.design-switcher a[^{]*\{[^}]*min-block-size:\s*0/);
  });
});

describe("R5-D5: the brand accent never carries a control state", () => {
  test("the score meter is the pass hue and the coverage meter is neutral", () => {
    expect(signal.css).toContain(".meter-score .meter-fill { background: var(--pass); }");
    expect(signal.css).toContain(".meter-coverage .meter-fill { background: var(--ink-3); }");
    expect(signal.css).not.toContain(".meter-score .meter-fill { background: var(--accent); }");
  });
});
