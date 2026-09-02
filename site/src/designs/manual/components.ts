/**
 * Manual — shared visual components: the serif seal (thin double circle) and
 * the five understated phase lines. Unverified is always rendered (hatched),
 * never hidden, and never inside a denominator.
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

export type SealSize = "lg" | "md" | "sm";

/** Grade → seal color class. A+/A/B pass-green, C warn, D burnt, F fail, NA dim. */
const SEAL_CLASS: Readonly<Record<string, string>> = {
  "A+": "mseal-pass",
  A: "mseal-pass",
  B: "mseal-pass",
  C: "mseal-warn",
  D: "mseal-d",
  F: "mseal-fail",
  NA: "mseal-na",
};

/** A grade letter set in the display serif inside a thin double circle. */
export function seal(grade: string, opts: { size?: SealSize; label?: string } = {}): string {
  const cls = SEAL_CLASS[grade] ?? "mseal-na";
  const size = opts.size ?? "lg";
  return `<span class="mseal mseal-${size} ${cls}" role="img" aria-label="${escapeHtml(
    opts.label ?? `grade ${grade}`,
  )}">${escapeHtml(grade)}</span>`;
}

/** Seal plus the provisional footnote-tag when evidence coverage warrants it. */
export function gradeSeal(score: Score, opts: { size?: SealSize; label?: string } = {}): string {
  const prov = score.provisional
    ? `<em class="m-prov" title="Evidence coverage below 75%">provisional</em>`
    : "";
  return `<span class="mseal-wrap">${seal(score.grade, opts)}${prov}</span>`;
}

/**
 * One thin 6px phase line: pass (solid green) / fail+gap (solid red) /
 * unverified (hatched), segments separated by 2px gaps. Widths are
 * proportional via flex-grow so the gaps stay exactly 2px.
 */
export function phaseBar(p: PhaseScore): string {
  const name = PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`;
  const countable = p.pass + p.fail + p.gap;
  const total = countable + p.unverified;
  if (total === 0) {
    return `<div class="mbar mbar-empty" role="img" aria-label="${escapeHtml(
      `${name}: no controls in scope`,
    )}"></div>`;
  }
  const pct = p.percent === null ? "no evidence" : `${p.percent}%`;
  const seg = (cls: string, n: number, what: string) =>
    n === 0
      ? ""
      : `<span class="mseg ${cls}" style="flex:${n}" title="${what}: ${n}"></span>`;
  return `<div class="mbar" role="img" aria-label="${escapeHtml(
    `${name}: ${pct} — ${p.pass} pass, ${p.fail + p.gap} fail or gap, ${p.unverified} unverified`,
  )}">${seg("mseg-pass", p.pass, "pass")}${seg("mseg-fail", p.fail + p.gap, "fail or gap")}${seg(
    "mseg-unv",
    p.unverified,
    "unverified — shown, never counted",
  )}</div>`;
}

/** The five phase rows: name (or P1..P5 compact), bar, mono percent. */
export function phaseBars(score: Score, opts: { compact?: boolean } = {}): string {
  return `<div class="mbars${opts.compact ? " mbars-compact" : ""}">${score.phases
    .map(
      (p) =>
        `<div class="mrow"><span class="mphase-name">${
          opts.compact ? `P${p.phase}` : escapeHtml(PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`)
        }</span>${phaseBar(p)}<span class="mpct">${
          p.percent === null ? "—" : `${p.percent}%`
        }</span></div>`,
    )
    .join("")}</div>`;
}
