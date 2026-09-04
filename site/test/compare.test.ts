/**
 * The Scorecard comparison is a published claim about another project's tool,
 * so it gets the same treatment as every other claim on this site: pinned to
 * something that fails when it drifts.
 *
 * The load-bearing test is `every_control_id_is_real`. A typo there would
 * print a check this repository does not have, next to a competitor's name,
 * on the methodology page — a false claim in the worst possible place.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { SCORECARD_ROWS, SSCSB_ONLY, compareTotals } from "../src/scorecard-compare";
import { compareSection, COMPARE_SECTION_ID } from "../src/designs/compare-shared";

const h = (p: string) => `/sscsb/${p}`;
const html = compareSection(h);

/** The same registry fixture control-registry.test.ts pins to the Rust source. */
function registryIds(): Set<string> {
  const raw = readFileSync(`${import.meta.dir}/fixtures/rust-control-ids.txt`, "utf8");
  return new Set(
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"))
  );
}

describe("scorecard comparison data", () => {
  test("every control id named is a control that actually exists", () => {
    const ids = registryIds();
    const used = new Set<string>([
      ...SCORECARD_ROWS.flatMap((r) => r.controls),
      ...SSCSB_ONLY.flatMap((r) => r.controls),
    ]);
    expect(used.size).toBeGreaterThan(20);
    const unknown = [...used].filter((id) => !ids.has(id)).sort();
    expect(unknown).toEqual([]);
  });

  test("all 20 published Scorecard checks are present, none dropped", () => {
    // Sourced from github.com/ossf/scorecard/docs/checks.md. If Scorecard adds
    // a check this fails, which is the point: a stale comparison is a wrong one.
    expect(SCORECARD_ROWS).toHaveLength(20);
    const names = SCORECARD_ROWS.map((r) => r.check);
    expect(new Set(names).size).toBe(20);
    for (const required of [
      "Binary-Artifacts",
      "Branch-Protection",
      "Dangerous-Workflow",
      "Signed-Releases",
      "Token-Permissions",
      "Webhooks",
    ]) {
      expect(names).toContain(required);
    }
  });

  test("the gaps are stated, not hidden", () => {
    const t = compareTotals();
    // If this ever reaches zero the comparison has stopped being honest OR
    // sscsb genuinely grew to cover everything — either way, look at it.
    expect(t.none).toBeGreaterThan(0);
    const gaps = SCORECARD_ROWS.filter((r) => r.coverage === "none");
    for (const g of gaps) {
      expect(g.controls).toEqual([]);
      expect(g.note, `${g.check} must say why it is uncovered`).toBeTruthy();
    }
  });

  test("a covered or partial row always names at least one control", () => {
    for (const r of SCORECARD_ROWS) {
      if (r.coverage === "covered" || r.coverage === "partial") {
        expect(r.controls.length, `${r.check} claims coverage with no control`).toBeGreaterThan(0);
      }
    }
  });

  test("risk levels use Scorecard's own vocabulary", () => {
    for (const r of SCORECARD_ROWS) {
      expect(["Critical", "High", "Medium", "Low"]).toContain(r.risk);
    }
  });
});

describe("scorecard comparison rendering", () => {
  test("renders every check and every sscsb-only row", () => {
    for (const r of SCORECARD_ROWS) expect(html).toContain(r.check);
    for (const r of SSCSB_ONLY) expect(html).toContain(r.title);
  });

  test("carries the section id the nav rails link to", () => {
    expect(html).toContain(`id="${COMPARE_SECTION_ID}"`);
  });

  test("wide tables scroll inside their own container, never the page", () => {
    // The mobile rule the rest of the site already follows.
    const tables = html.match(/<table/g) ?? [];
    const scrollers = html.match(/class="table-scroll"/g) ?? [];
    expect(tables.length).toBeGreaterThan(0);
    expect(scrollers.length).toBe(tables.length);
  });

  test("does not claim sscsb beats Scorecard", () => {
    // The comparison is a map of two different jobs, not a scoreboard. These
    // are the words that would turn it into marketing.
    // Bare "replaces" is deliberately NOT banned: "neither replaces the other"
    // is the framing this section exists to make, and a blunt substring ban
    // flagged it — the rule has to name the claim, not a word that appears in
    // its denial.
    const banned = [
      "better than",
      "superior",
      "beats scorecard",
      "outperforms",
      "more secure than",
      "sscsb replaces",
      "instead of scorecard",
    ];
    const lower = html.toLowerCase();
    for (const b of banned) expect(lower, `must not contain "${b}"`).not.toContain(b);
    // And the honest framing must actually be present, not merely un-banned.
    expect(lower).toContain("neither replaces the other");
  });

  test("does not misdescribe how Scorecard is run", () => {
    // An earlier draft said Scorecard "rates a repository from the outside,
    // with no help from the maintainer" and "works on projects that never
    // opted in". Wrong: scorecard.dev leads with "run automatically on code
    // you own using the GitHub Action" — a maintainer opt-in exactly like
    // sscsb's — and sscsb installs .github/workflows/scorecard.yml itself.
    // Publishing a wrong claim about another project's tool, on the page
    // whose entire subject is honest measurement, is the worst place to be
    // careless. This test exists so that draft cannot come back.
    const lower = html.toLowerCase();
    for (const wrong of [
      "never opted in",
      "from the outside",
      "with no help from the maintainer",
      "no cooperation from the maintainer",
      "external rater",
    ]) {
      expect(lower, `must not claim: "${wrong}"`).not.toContain(wrong);
    }
    // And the true relationship must be stated, not merely not-denied.
    expect(lower).toContain("installs");
    expect(lower).toContain("opt-in");
  });

  test("html-escapes data rather than trusting it", () => {
    expect(html).not.toContain("<script");
    // Every note is emitted through esc(); an apostrophe proves the path runs.
    const withApostrophe = SCORECARD_ROWS.find((r) => r.note?.includes("'"));
    if (withApostrophe) expect(html).toContain("&#39;");
  });
});
