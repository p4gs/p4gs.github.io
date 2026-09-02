/**
 * Console instruments: glowing grade chips and three-state luminous meters.
 *
 * Meter semantics (shared with the site's honesty contract): the track spans
 * pass + fail + gap + unverified; pass is the luminous gradient, fail/gap is
 * solid fail-red, unverified is hatched — visible, never counted. The percent
 * label is the score over COUNTABLE controls only, so a bar can read 100%
 * while a hatched stretch shows exactly what was never checked.
 */
import type { PhaseScore, Score } from "../../schema";
import { escapeHtml } from "./layout";

export const PHASE_NAMES: Readonly<Record<number, string>> = {
  1: "Commit integrity",
  2: "Dependencies & SBOM",
  3: "Provenance",
  4: "SAST & CI hardening",
  5: "Continuous posture",
};

/** Short instrument labels for tight surfaces (hero card). */
export const PHASE_SHORT: Readonly<Record<number, string>> = {
  1: "Commit integrity",
  2: "Dependencies",
  3: "Provenance",
  4: "SAST & CI",
  5: "Posture",
};

const GRADE_CLASS: Readonly<Record<string, string>> = {
  "A+": "g-pass",
  A: "g-pass",
  B: "g-pass",
  C: "g-warn",
  D: "g-warn",
  F: "g-fail",
  NA: "g-na",
};

export type ChipSize = "sm" | "md" | "lg";

/** A glowing mono grade chip — a status element, so glow is allowed. */
export function gradeChip(grade: string, size: ChipSize = "md"): string {
  const cls = GRADE_CLASS[grade] ?? "g-na";
  return `<span class="grade-chip gc-${size} ${cls}" role="img" aria-label="grade ${escapeHtml(
    grade,
  )}">${escapeHtml(grade)}</span>`;
}

export function gradeBadge(score: Score, size: ChipSize = "md"): string {
  const prov = score.provisional
    ? ` <span class="prov-tag" title="Evidence coverage below 75%">provisional</span>`
    : "";
  return `${gradeChip(score.grade, size)}${prov}`;
}

function pctClass(p: PhaseScore): string {
  if (p.percent === null) return "pct-none";
  return p.percent < 100 ? "pct-low" : "pct-ok";
}

function pctLabel(p: PhaseScore): string {
  return p.percent === null ? "no evidence" : `${p.percent}%`;
}

function meterAria(name: string, p: PhaseScore): string {
  const base = `${name}: ${pctLabel(p)}`;
  return p.unverified > 0 ? `${base} (${p.unverified} unverified — not counted)` : base;
}

/** The three fill segments, width-proportional over countable + unverified. */
function segments(p: PhaseScore): string {
  const failGap = p.fail + p.gap;
  const total = p.pass + failGap + p.unverified;
  if (total === 0) return "";
  const w = (n: number) => ((100 * n) / total).toFixed(1);
  const seg = (cls: string, n: number, label: string) =>
    n === 0
      ? ""
      : `<span class="mfill ${cls}" style="--w:${w(n)}%" title="${label}: ${n}"></span>`;
  return (
    seg("m-pass", p.pass, "pass") +
    seg("m-fail", failGap, "fail or gap") +
    seg("m-unv", p.unverified, "unverified")
  );
}

/** A full meter: name + tabular percent above a luminous track. */
export function meter(p: PhaseScore, opts: { short?: boolean } = {}): string {
  const names = opts.short ? PHASE_SHORT : PHASE_NAMES;
  const name = names[p.phase] ?? `Phase ${p.phase}`;
  const total = p.pass + p.fail + p.gap + p.unverified;
  const track =
    total === 0
      ? `<span class="bar-empty" title="No controls in scope">n/a</span>`
      : segments(p);
  return `<div class="meter" role="img" aria-label="${escapeHtml(meterAria(name, p))}">
  <div class="meter-head"><span class="meter-name">${escapeHtml(name)}</span><span class="meter-pct ${pctClass(p)}">${pctLabel(p)}</span></div>
  <div class="meter-track">${track}</div>
</div>`;
}

/** The five phase meters, stacked. `animate` arms the home-hero load moment. */
export function meterStack(
  phases: readonly PhaseScore[],
  opts: { short?: boolean; animate?: boolean } = {},
): string {
  const cls = opts.animate ? "meter-stack tm-anim" : "meter-stack";
  return `<div class="${cls}">${phases.map((p) => meter(p, opts)).join("\n")}</div>`;
}

/** Compact per-row meters for the directory table: P1..P5 + track + percent. */
export function compactMeters(score: Score): string {
  const rows = score.phases
    .map((p) => {
      const name = PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`;
      const total = p.pass + p.fail + p.gap + p.unverified;
      const track =
        total === 0
          ? `<span class="bar-empty" title="No controls in scope">n/a</span>`
          : segments(p);
      return `<div class="pmeter" role="img" aria-label="${escapeHtml(meterAria(name, p))}" title="${escapeHtml(name)}">
  <span class="pm-label" aria-hidden="true">P${p.phase}</span>
  <span class="pm-track">${track}</span>
  <span class="pm-pct ${pctClass(p)}" aria-hidden="true">${p.percent === null ? "—" : `${p.percent}%`}</span>
</div>`;
    })
    .join("\n");
  return `<div class="pmeters">${rows}</div>`;
}
