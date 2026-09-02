/** Shared visual components: inspection seals and the five phase bars. */
import type { PhaseScore, Score } from "../../schema";
import { escapeHtml } from "./layout";

export const PHASE_NAMES: Readonly<Record<number, string>> = {
  1: "Commit integrity",
  2: "Dependencies & SBOM",
  3: "Provenance",
  4: "SAST & CI hardening",
  5: "Continuous posture",
};

export type SealSize = 84 | 74 | 64 | 44;

/** Deterministic slight tilt in −4..4deg — the same key always stamps the same way. */
export function sealRotation(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return (Math.abs(h) % 9) - 4;
}

const SEAL_CLASS: Readonly<Record<string, string>> = {
  "A+": "seal-aplus",
  A: "seal-a",
  B: "seal-b",
  C: "seal-c",
  D: "seal-d",
  F: "seal-f",
  NA: "seal-na",
};

/** A double-ring inspection seal for a grade letter. */
export function seal(
  grade: string,
  opts: { size?: SealSize; rotationKey?: string; rotation?: number } = {},
): string {
  const cls = SEAL_CLASS[grade] ?? "seal-na";
  const size = opts.size ?? 84;
  const sizeCls = size === 84 ? "" : ` seal-${size}`;
  const rot = opts.rotation ?? sealRotation(opts.rotationKey ?? grade);
  return `<span class="seal ${cls}${sizeCls}" style="--seal-rot:${rot}deg" role="img" aria-label="grade ${escapeHtml(
    grade,
  )}"><span class="seal-ring" aria-hidden="true"></span>${escapeHtml(grade)}</span>`;
}

export function gradeBadge(
  score: Score,
  opts: { size?: SealSize; rotationKey?: string } = {},
): string {
  const prov = score.provisional
    ? `<span class="provisional" title="Evidence coverage below 75%">provisional</span>`
    : "";
  return `${seal(score.grade, opts)}${prov}`;
}

/**
 * A three-state bar: pass (solid) / fail+gap (solid fail) / unverified
 * (hatched). Unverified is rendered, never hidden — "not checked" is a
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
    n === 0 ? "" : `<span class="seg ${cls}" style="width:${w(n)}%" title="${label}: ${n}"></span>`;
  const pct = p.percent === null ? "no evidence" : `${p.percent}%`;
  return `<div class="bar" role="img" aria-label="${escapeHtml(
    `${PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`}: ${pct}`,
  )}">${seg("seg-pass", p.pass, "pass")}${seg("seg-fail", p.fail + p.gap, "fail or gap")}${seg(
    "seg-unverified hatch",
    p.unverified,
    "unverified",
  )}</div>`;
}

export function phaseBars(score: Score, opts: { compact?: boolean } = {}): string {
  return `<div class="phase-bars${opts.compact ? " phase-bars-compact" : ""}">${score.phases
    .map(
      (p) =>
        `<div class="phase-row"><span class="phase-name">${
          opts.compact ? `P${p.phase}` : escapeHtml(PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`)
        }</span>${phaseBar(p)}<span class="phase-pct">${
          p.percent === null ? "—" : `${p.percent}%`
        }</span></div>`,
    )
    .join("")}</div>`;
}
