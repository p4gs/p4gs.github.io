/**
 * Signal, round 3 — the four RENDERING changes that would fail silently.
 *
 * Three of them are substitutions over HTML produced by files shared with the
 * other four designs (`compare-shared.ts`, `threats-shared.ts`). A substitution
 * on a string is only as good as the string: the day someone reformats the
 * shared markup, `replaceAll` matches nothing, returns its input unchanged, and
 * the page quietly goes back to what the judges flagged — a dashed tofu box
 * around an em dash, nine identical nine-word status labels, nine closed
 * disclosures the section's own intro promises are open. Nothing throws and
 * nothing looks broken enough to notice. So each substitution is pinned from
 * BOTH ends here: the shared output still contains what we match on, and the
 * rendered page no longer does.
 *
 * The fourth is the control-reason hoist, which is arithmetic on real data
 * rather than a string match, and whose two thresholds are the whole design:
 * hoist too eagerly and a six-word reason costs the reader a lookup upwards
 * for nothing.
 *
 * The CSS-only fixes are not here — they are asserted where they can actually
 * be asserted, in a real browser at 1440 and at a true 390px viewport.
 */
import { describe, expect, test } from "bun:test";
import { BASE_PATH } from "../src/config";
import { compareSection } from "../src/designs/compare-shared";
import { signal } from "../src/designs/signal";
import { SHARED_NONE_SPAN } from "../src/designs/signal/methodology";
import { threatsSection } from "../src/designs/threats-shared";
import type { DesignCtx } from "../src/designs/types";
import type { ControlRecord, ScanOutcome, ScanRecord } from "../src/schema";

const ctx: DesignCtx = {
  prefix: BASE_PATH,
  h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
  switcher: "",
  active: "directory",
};

const h = ctx.h;

function ctl(
  id: string,
  phase: number,
  scan: ScanOutcome,
  reason: string | null,
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
      grade: "NA",
      provisional: false,
      overall_percent: null,
      evidence_coverage_percent: 0,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase,
        pass: 0,
        fail: 0,
        gap: 0,
        unverified: 0,
        info: 0,
        percent: null,
      })),
    },
  };
}

/** The 200-character sentence that appeared six times on one real listing. */
const LONG =
  "resolved by a signed local scan: this control lives in the development environment, so a workstation record signed by a key this repository commits in .sscsb/policy/allowed_signers is the only evidence that can exist for it";
const SHORT = "optional control not enabled by this repository";

describe("the Scorecard crosswalk's empty cell carries words, not a dash", () => {
  test("the shared section still emits the bare span this design replaces", () => {
    // If this fails the substitution below has silently stopped matching and
    // the tofu box is back on the page — which is exactly the failure the
    // judges caught twice and which nothing else would report.
    expect(compareSection(h)).toContain(SHARED_NONE_SPAN);
  });

  test("the rendered methodology contains no bare em-dash marker", () => {
    const html = signal.renderMethodology(ctx);
    expect(html).not.toContain(SHARED_NONE_SPAN);
    expect(html).toContain("No sscsb equivalent");
  });

  test("every remaining cmp-none is the pill variant, which carries its own text", () => {
    const html = signal.renderMethodology(ctx);
    for (const m of html.matchAll(/<span class="([^"]*cmp-none[^"]*)"/g)) {
      expect(m[1]).toContain("cmp-mark");
    }
  });
});

describe("the incident disclosures are open and counted", () => {
  test("the shared section still emits the closed, uncounted summary", () => {
    const shared = threatsSection(h);
    expect(shared).toContain(`<details class="tx-details">`);
    expect(shared).toContain("<summary>What this looks like when it happens</summary>");
  });

  test("every disclosure on the rendered page is open", () => {
    const html = signal.renderMethodology(ctx);
    expect(html).not.toContain(`<details class="tx-details">`);
    const opened = html.match(/<details class="tx-details" open>/g) ?? [];
    const shared = threatsSection(h).match(/<details class="tx-details">/g) ?? [];
    expect(opened.length).toBe(shared.length);
    expect(opened.length).toBeGreaterThan(0);
  });

  test("each summary names how many incidents it holds", () => {
    const html = signal.renderMethodology(ctx);
    const summaries = [
      ...html.matchAll(/<summary>What this looks like when it happens · (\d+) incidents?<\/summary>/g),
    ];
    expect(summaries.length).toBeGreaterThan(0);
    // The count is the real number of list items, not a constant.
    for (const s of summaries) expect(Number(s[1])).toBeGreaterThan(0);
    const singular = [...html.matchAll(/· 1 incidents</g)];
    expect(singular.length).toBe(0);
  });
});

describe("the attack-group state label is shortened, never dropped", () => {
  const r = record([ctl("a", 1, "pass", null)]);
  const html = signal.renderRepoDetail(r, ctx);

  test("no row loses its state text", () => {
    // Colour + shape + text, on EVERY row: the count of state labels must not
    // fall, only their length. Hiding eight of nine would be the colour-alone
    // failure this palette exists to prevent.
    const shortened = html.match(/<span class="ex-state ex-state-ok"/g) ?? [];
    const any = html.match(/<span class="ex-state/g) ?? [];
    expect(any.length).toBeGreaterThan(0);
    expect(shortened.length + (html.match(/<span class="ex-state">/g) ?? []).length)
      .toBe(any.length);
  });

  test("the long label is gone and the full sentence survives on the title", () => {
    expect(html).not.toContain(`<span class="ex-state">All answered checks passed</span>`);
    if (html.includes("ex-state-ok")) {
      expect(html).toContain("All passed</span>");
      expect(html).toContain("That is not the same as being safe from this group.");
    }
  });
});

describe("a long reason repeated across a family is stated once", () => {
  test("three or more long repeats hoist into a family note and leave a tag", () => {
    const r = record([
      ctl("c1", 1, "unverified", LONG),
      ctl("c2", 1, "unverified", LONG),
      ctl("c3", 1, "unverified", LONG),
      ctl("c4", 1, "pass", "its own reason, stated in full because nothing else shares it"),
    ]);
    const html = signal.renderRepoDetail(r, ctx);
    expect(html).toContain(`class="family-note"`);
    expect((html.match(/3 controls here/g) ?? []).length).toBe(1);
    // The sentence is on the page once — in the note — not once per row.
    expect((html.match(new RegExp(LONG.slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length)
      .toBe(1);
    // Each hoisted row still says which reason applies to it.
    expect((html.match(/class="ctl-src"/g) ?? []).length).toBe(3);
    expect(html).toContain("resolved by a signed local scan</span>");
    // The unique reason is untouched.
    expect(html).toContain("its own reason, stated in full because nothing else shares it");
  });

  test("two repeats are not enough — a lookup upwards must earn itself", () => {
    const r = record([ctl("c1", 1, "unverified", LONG), ctl("c2", 1, "unverified", LONG)]);
    const html = signal.renderRepoDetail(r, ctx);
    expect(html).not.toContain(`class="family-note"`);
    expect(html).not.toContain(`class="ctl-src"`);
  });

  test("a SHORT reason is never hoisted, however often it repeats", () => {
    const r = record([
      ctl("c1", 1, "gap", SHORT),
      ctl("c2", 1, "gap", SHORT),
      ctl("c3", 1, "gap", SHORT),
      ctl("c4", 1, "gap", SHORT),
    ]);
    const html = signal.renderRepoDetail(r, ctx);
    expect(html).not.toContain(`class="family-note"`);
    expect((html.match(new RegExp(SHORT, "g")) ?? []).length).toBe(4);
  });

  test("the hoist is per family — a shared reason in another phase is its own count", () => {
    const r = record([
      ctl("c1", 1, "unverified", LONG),
      ctl("c2", 1, "unverified", LONG),
      ctl("c3", 1, "unverified", LONG),
      ctl("d1", 2, "unverified", LONG),
      ctl("d2", 2, "unverified", LONG),
    ]);
    const html = signal.renderRepoDetail(r, ctx);
    expect((html.match(/class="family-note"/g) ?? []).length).toBe(1);
    expect((html.match(/class="ctl-src"/g) ?? []).length).toBe(3);
  });
});

describe("the directory answers a query that matches nothing", () => {
  const html = signal.renderDirectory([], ctx);

  test("the empty state and its query echo are in the markup, hidden", () => {
    expect(html).toContain(`class="dir-empty" id="dir-empty" hidden`);
    expect(html).toContain(`id="dir-empty-q"`);
  });

  test("it reads the row visibility filter.js sets rather than re-deriving it", () => {
    // The one thing this local workaround must not do is grow a second copy
    // of the shared filter's matching rules, which would then drift from it.
    expect(html).toContain(`rows[i].style.display!=="none"`);
    expect(html).not.toContain("data-name");
  });

  test("the script is emitted after filter.js, so its listeners run second", () => {
    expect(html.indexOf(`filter.js`)).toBeLessThan(html.indexOf(`dir-empty-q`.concat(`");`)));
  });
});

describe("the directory glossary is a list, and keeps the definition contract", () => {
  const html = signal.renderDirectory([], ctx);

  test("every term it lists carries its machine-checkable definition", () => {
    expect(html).toContain(`<dl class="key-gloss">`);
    for (const k of ["countable", "coverage", "provisional", "unverified", "gap", "lane"]) {
      expect(html).toContain(`data-defines="${k}"`);
    }
  });

  test("the #trust link the shared note owed the methodology is still owed", () => {
    expect(html).toContain(`methodology/#trust`);
  });
});
