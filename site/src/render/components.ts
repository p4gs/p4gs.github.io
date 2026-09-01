/** Shared visual components: grade badge and the five phase bars. */
import type { PhaseScore, Score } from "../schema";
import { escapeHtml } from "./layout";

export const PHASE_NAMES: Readonly<Record<number, string>> = {
  1: "Commit integrity",
  2: "Dependencies & SBOM",
  3: "Provenance",
  4: "SAST & CI hardening",
  5: "Continuous posture",
};

export function gradeBadge(score: Score): string {
  const cls = score.grade === "NA" ? "na" : score.grade.replace("+", "plus").toLowerCase();
  const prov = score.provisional ? `<span class="provisional" title="Evidence coverage below 75%">provisional</span>` : "";
  return `<span class="grade grade-${cls}">${escapeHtml(score.grade)}</span>${prov}`;
}

/**
 * A stacked three-state bar: pass (green) / fail+gap (red) / unverified
 * (hatched gray). Unverified is rendered, never hidden — "not checked" is a
 * state the reader must see, not an absence.
 */
export function phaseBar(p: PhaseScore): string {
  const countable = p.pass + p.fail + p.gap;
  const total = countable + p.unverified;
  if (total === 0) {
    return `<div class="bar bar-empty" title="No controls in scope">n/a</div>`;
  }
  const w = (n: number) => ((100 * n) / total).toFixed(1);
  const seg = (cls: string, n: number, label: string) =>
    n === 0 ? "" : `<span class="seg seg-${cls}" style="width:${w(n)}%" title="${label}: ${n}"></span>`;
  const pct = p.percent === null ? "no evidence" : `${p.percent}%`;
  return `<div class="bar" role="img" aria-label="${escapeHtml(
    `${PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`}: ${pct}`,
  )}">${seg("pass", p.pass, "pass")}${seg("fail", p.fail + p.gap, "fail or gap")}${seg(
    "unverified",
    p.unverified,
    "unverified",
  )}</div>`;
}

export function phaseBars(score: Score): string {
  return `<div class="phase-bars">${score.phases
    .map(
      (p) =>
        `<div class="phase-row"><span class="phase-name">${escapeHtml(
          PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`,
        )}</span>${phaseBar(p)}<span class="phase-pct">${
          p.percent === null ? "—" : `${p.percent}%`
        }</span></div>`,
    )
    .join("")}</div>`;
}
