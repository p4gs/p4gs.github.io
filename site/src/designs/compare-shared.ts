/**
 * The Scorecard comparison section, rendered identically by every design.
 *
 * Same argument as `methodology-shared.ts` and `threats-shared.ts`: a rule
 * this site publishes must have exactly one copy, or the copies drift and the
 * page stops being a contract.
 *
 * The comparison is deliberately not a scoreboard, and not a rivalry: sscsb
 * INSTALLS Scorecard and ships it as one of its own 44 controls. Both are
 * opt-in and both run in the maintainer's CI. They differ in what they can
 * see — Scorecard reads the repository and its forge; sscsb reads that plus
 * the maintainer's own machine — and in what they do with it: Scorecard
 * rates, sscsb configures and then verifies what it configured.
 *
 * Rows where sscsb has nothing are printed as plainly as the rows where it
 * has more — a comparison that hid its own gaps would be the kind of claim
 * this directory exists to argue against. See `scorecard-compare.ts` for the
 * framing error an earlier draft made here, kept on the record.
 */

import { SCORECARD_ROWS, SSCSB_ONLY, compareTotals, type Coverage } from "../scorecard-compare";
import type { Href } from "./home-shared";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const COMPARE_SECTION_ID = "vs-scorecard";
export const COMPARE_TITLE = "Next to OpenSSF Scorecard";

/** Word, not colour: the label has to survive being read aloud. */
const COVERAGE_LABEL: Record<Coverage, string> = {
  covered: "Also checked",
  partial: "Partly",
  none: "Not checked",
};

function controlList(ids: readonly string[]): string {
  if (ids.length === 0) return "<span class=\"cmp-none\">—</span>";
  return ids.map((id) => `<code>${esc(id)}</code>`).join(" ");
}

function scorecardTable(): string {
  return SCORECARD_ROWS.map(
    (r) => `      <tr data-coverage="${r.coverage}">
        <td><strong>${esc(r.check)}</strong><span class="cmp-risk"> ${esc(r.risk)}</span></td>
        <td>${esc(r.what)}</td>
        <td><span class="cmp-mark cmp-${r.coverage}">${COVERAGE_LABEL[r.coverage]}</span></td>
        <td>${controlList(r.controls)}${r.note ? `<div class="cmp-note">${esc(r.note)}</div>` : ""}</td>
      </tr>`
  ).join("\n");
}

function onlyTable(): string {
  return SSCSB_ONLY.map(
    (r) => `      <tr>
        <td><strong>${esc(r.title)}</strong></td>
        <td>${esc(r.what)}</td>
        <td>${controlList(r.controls)}</td>
      </tr>`
  ).join("\n");
}

export function compareSection(h: Href): string {
  const t = compareTotals();
  return `<section class="method-section prose cmp-section" id="${COMPARE_SECTION_ID}">
    <h2>${COMPARE_TITLE}</h2>
    <p>These are not rival tools. sscsb <strong>installs</strong> Scorecard: one of its 44
    checks is whether Scorecard is running on your repository at all. Both are opt-in and
    both run in your own CI.</p>
    <p>They differ in what they can see. Scorecard reads the repository and its GitHub
    settings, and scores each check out of ten. sscsb reads that too, plus your own
    machine — whether the hooks are really installed, how signing is set up, whether an
    agent's commits are gated. That is what the
    <a href="${h(`methodology/#local`)}">local lane</a> exists to record.</p>
    <p>They also differ in what they do. Scorecard rates. sscsb sets the controls up, then
    checks its own work, and says so when a tool is missing instead of scoring the gap as a
    low number you cannot tell from a real failure. Neither replaces the other.</p>

    <h3>All ${t.scorecardChecks} Scorecard checks</h3>
    <p>Every check, including the ${t.none} sscsb does not check at all. A comparison that
    dropped its own gaps would not be worth reading.</p>
    <div class="table-scroll">
    <table class="method-table cmp-table">
    <thead><tr><th>Scorecard check</th><th>What it looks for</th><th>sscsb</th><th>Which checks, and how they differ</th></tr></thead>
    <tbody>
${scorecardTable()}
    </tbody>
    </table>
    </div>

    <h3>What sscsb checks that Scorecard cannot</h3>
    <p>Scorecard reads the repository and its GitHub settings. Everything below happens
    somewhere else — on a maintainer's machine, before a commit exists, or inside a release
    pipeline — so no amount of reading the repository will show it.</p>
    <div class="table-scroll">
    <table class="method-table cmp-table">
    <thead><tr><th>What</th><th>Why it matters</th><th>Checks</th></tr></thead>
    <tbody>
${onlyTable()}
    </tbody>
    </table>
    </div>

    <p class="cmp-footnote">Scorecard check names, risk levels and descriptions are taken
    from the project's own published check list. sscsb check names are the control ids this
    site already uses on every repository page.</p>
  </section>`;
}
