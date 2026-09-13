/**
 * Signal, round 2 — the four RENDERING changes that carry an honesty rule.
 *
 * Round 1's directory printed every merge finding in full inside the
 * Repository cell: three listings sharing one ~130-word self-report paragraph
 * made 330px rows at 1440 and ~700px cards at 390, and the table stopped being
 * a table. The fix folds those findings into a disclosure — which is only safe
 * while two things stay true, and prose cannot keep them true:
 *
 *   1. a CONTRADICTION is never folded (types.ts: the disagreement is named on
 *      the listing AND the detail page), and
 *   2. everything that IS folded is still on the row, counted by its own
 *      summary, so nothing was deleted in the name of density.
 *
 * The other two guard the disclosure affordance and the empty-family card.
 * These are behaviours of `signal`'s own renderers, so they are tested here
 * rather than in the cross-design suites.
 */
import { describe, expect, test } from "bun:test";
import { BASE_PATH } from "../src/config";
import { signal } from "../src/designs/signal";
import type { DesignCtx } from "../src/designs/types";
import { NO_LISTING_FACTS, type ListingFacts } from "../src/listing";
import { mergeEvidence, type EvidenceSource } from "../src/reclassify";
import type { ControlRecord, ScanOutcome, ScanRecord } from "../src/schema";

function ctl(id: string, phase: number, scan: ScanOutcome, over: Partial<ControlRecord> = {}): ControlRecord {
  return {
    id, phase, in_scope: true,
    raw_outcome: scan === "unverified" ? "pass" : scan === "gap" ? "disabled" : scan,
    scan_outcome: scan, reclassified: false, reason: null, messages: [],
    ...over,
  };
}

function record(controls: ControlRecord[]): ScanRecord {
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "Acme", name: "Widget", url: "https://github.com/Acme/Widget",
      default_branch: "main", commit: "b".repeat(40), description: "sample",
    },
    scanned_at: "2026-09-01T12:00:00Z",
    scanner: {
      sscsb_version: "0.3.0", workflow_run_id: 7,
      workflow_run_url: "https://github.com/Acme/Widget/actions/runs/7",
    },
    request_issue: null,
    controls,
    score: {
      grade: "NA", provisional: false, overall_percent: null,
      evidence_coverage_percent: 0,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 0, fail: 0, gap: 0, unverified: 0, info: 0, percent: null,
      })),
    },
  };
}

const src = (lane: EvidenceSource["lane"], controls: ControlRecord[]): EvidenceSource => ({
  lane, record: record(controls),
});

const ctx = (facts?: ReadonlyMap<string, ListingFacts>): DesignCtx => ({
  prefix: BASE_PATH,
  h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
  switcher: "",
  active: "directory",
  facts,
});

/** The Repository cell of the first (only) row. */
function repoCell(html: string): string {
  const open = html.indexOf('<td class="c-repo"');
  const end = html.indexOf("</td>", open);
  expect(open).toBeGreaterThan(-1);
  return html.slice(open, end);
}

/** What is inside the folded disclosure, or "" when there is none. */
function foldedPart(cell: string): string {
  const i = cell.indexOf('<details class="row-notes">');
  return i === -1 ? "" : cell.slice(i);
}

/** What the reader meets without opening anything. */
function openPart(cell: string): string {
  const i = cell.indexOf('<details class="row-notes">');
  return i === -1 ? cell : cell.slice(0, i);
}

describe("signal: the directory row folds provenance notes, never a contradiction", () => {
  const contradicting = mergeEvidence([
    src("action", [ctl("codeql", 4, "fail"), ctl("sbom", 2, "pass")]),
    src("local", [ctl("codeql", 4, "pass"), ctl("sbom", 2, "pass")]),
  ]);
  const facts = (over: Partial<ListingFacts>): ReadonlyMap<string, ListingFacts> =>
    new Map<string, ListingFacts>([["acme--widget", { ...NO_LISTING_FACTS, ...over }]]);

  test("the contradiction sentence is OUTSIDE the disclosure, where nothing has to be opened", () => {
    const html = signal.renderDirectory(
      [contradicting.record],
      ctx(facts({
        contradictions: contradicting.contradictions,
        staleAgainstBase: { local: "d".repeat(40), base: "e".repeat(40) },
      })),
    );
    const cell = repoCell(html);
    expect(openPart(cell)).toContain("Contradiction:");
    expect(openPart(cell)).toContain("codeql");
    expect(foldedPart(cell)).not.toContain("Contradiction:");
    // …and it keeps the fail hue, which the other notes gave up in round 2.
    expect(openPart(cell)).toContain('class="rn rn-contra"');
    expect(foldedPart(cell)).toContain('class="rn rn-note"');
  });

  test("a stale local record and a self-report ride folded — present, counted, not shouted", () => {
    const html = signal.renderDirectory(
      [contradicting.record],
      ctx(facts({
        staleAgainstBase: { local: "d".repeat(40), base: "e".repeat(40) },
        selfReported: {
          grade: "A+", provisional: false, overall_percent: 100,
          evidence_coverage_percent: 89,
        },
      })),
    );
    const cell = repoCell(html);
    // Nothing was dropped: both sentences are on the row.
    expect(cell).toContain("dddddddddddd");
    expect(cell).toContain("Two scores are on this page");
    // …and both are behind one summary that says how many there are.
    expect(foldedPart(cell)).toContain("dddddddddddd");
    expect(foldedPart(cell)).toContain("Two scores are on this page");
    expect(cell).toContain("<summary>2 notes on this record</summary>");
  });

  test("a listing with nothing to fold grows no disclosure", () => {
    const clean = mergeEvidence([src("action", [ctl("codeql", 4, "pass")])]);
    const html = signal.renderDirectory([clean.record], ctx(new Map()));
    expect(html).not.toContain("row-notes");
    expect(html).not.toContain("notes on this record");
  });

  test("one folded finding is counted in the singular", () => {
    const html = signal.renderDirectory(
      [contradicting.record],
      ctx(facts({ staleAgainstBase: { local: "d".repeat(40), base: "e".repeat(40) } })),
    );
    expect(html).toContain("<summary>1 note on this record</summary>");
  });
});

describe("signal: the disclosures on the detail page say what opening them gets", () => {
  test("the evidence summary carries its line count — a bare label read as a caption", () => {
    const r = record([
      ctl("codeql", 4, "pass", { messages: ["one", "two", "three"] }),
      ctl("sbom", 2, "pass"),
    ]);
    const html = signal.renderRepoDetail(r, ctx());
    expect(html).toContain("<summary>evidence · 3</summary>");
    // A control with no messages still renders no disclosure at all.
    expect(html.match(/<details class="ctl-evidence">/g)?.length).toBe(1);
  });

  test("a family with no controls in scope renders no card", () => {
    // Round 1 shipped an 'Other checks' card reading
    // "0 pass · 0 fail · 0 gap · 0 unanswered" beside a 'no evidence' chip.
    const r = record([ctl("codeql", 4, "pass")]);
    // The score block still carries a summary row for all five phases — which
    // is exactly the shape that produced the empty card: four of them have no
    // control in scope, so four of them have nothing to render.
    expect(r.score.phases.map((p) => p.phase)).toEqual([1, 2, 3, 4, 5]);
    const html = signal.renderRepoDetail(r, ctx());
    expect(html).toContain('id="phase-4"');
    for (const empty of [1, 2, 3, 5]) {
      expect(html).not.toContain(`id="phase-${empty}"`);
    }
    expect(html.match(/class="family"/g)?.length).toBe(1);
  });
});
