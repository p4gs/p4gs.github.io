/**
 * Chain — shared visual components. The hero object of the design: the
 * five-phase verification chain (nodes joined by connectors colored by the
 * adjacent phases' states), plus its mini form for directory cards, grade
 * pills, and the shared legend.
 *
 * Honesty invariants carried in the visuals: a phase with zero countable
 * controls renders HATCHED ("no evidence" — outside every denominator),
 * never as a pass or a fail; percent labels come straight from the record.
 */
import type { PhaseScore, Score } from "../../schema";
import { escapeHtml } from "./layout";

export const PHASE_NAMES: Readonly<Record<number, string>> = {
  1: "Commit integrity",
  2: "Dependencies",
  3: "Build receipts",
  4: "Code & build hardening",
  5: "Ongoing posture",
};

/** Short node captions for the chain itself. */
export const PHASE_SHORT: Readonly<Record<number, string>> = {
  1: "Commit",
  2: "Dependencies",
  3: "Receipts",
  4: "Hardening",
  5: "Posture",
};

/** Inline stroke icons — 24 grid, 2px stroke, stroke = currentColor. */
export const PHASE_ICONS: Readonly<Record<number, string>> = {
  1: `<path d="M20 6L9 17l-5-5"></path>`,
  2: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>`,
  3: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
  4: `<circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.35-4.35"></path>`,
  5: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>`,
};

export function icon(paths: string, size = 24): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const CHECK_ICON_PATH = `<path d="M20 6L9 17l-5-5"></path>`;

/** The three visual states a phase can be in. */
export type PhaseState = "ok" | "warn" | "none";

/** A phase's minimal shape for chain rendering. */
export interface ChainPhase {
  phase: number;
  percent: number | null;
}

export function phaseState(p: ChainPhase): PhaseState {
  if (p.percent === null) return "none";
  return p.percent === 100 ? "ok" : "warn";
}

const STATE_COLOR: Readonly<Record<PhaseState, string>> = {
  ok: "#0E8A72",
  warn: "#D6742C",
  none: "#9FB0A8",
};

const STATE_LABEL: Readonly<Record<PhaseState, string>> = {
  ok: "verified",
  warn: "needs attention",
  none: "no countable evidence, unverified",
};

export function phasePctText(p: ChainPhase): string {
  return p.percent === null ? "no evidence" : `${p.percent}%`;
}

function nodeAria(p: ChainPhase, st: PhaseState): string {
  return `${PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`}: ${phasePctText(p)}, ${STATE_LABEL[st]}`;
}

/**
 * The hero chain. Five rounded tiles with stroke icons, joined by connector
 * bars whose gradient runs from the left node's state color to the right
 * node's. With `animate`, the page's CHAIN_SCRIPT adds `.chain-go` on load
 * and the chain "verifies" left→right (CSS-only animation, staggered by
 * --i); without JS — or under prefers-reduced-motion — the full final state
 * shows instantly, because every animation starts FROM the hidden state and
 * the default is the finished one.
 */
export function heroChain(
  phases: ReadonlyArray<ChainPhase>,
  opts: { animate?: boolean } = {},
): string {
  const parts: string[] = [];
  phases.forEach((p, i) => {
    const st = phaseState(p);
    if (i > 0) {
      const prev = phaseState(phases[i - 1]!);
      parts.push(
        `<span class="ch-conn" style="--i:${i - 1};--c1:${STATE_COLOR[prev]};--c2:${STATE_COLOR[st]}" aria-hidden="true"><i></i></span>`,
      );
    }
    const bead = st === "warn" ? `<span class="ch-bead" aria-hidden="true">!</span>` : "";
    parts.push(`<div class="ch-node st-${st}" style="--i:${i}" role="img" aria-label="${escapeHtml(
      nodeAria(p, st),
    )}">
    <span class="ch-tile" aria-hidden="true">${icon(PHASE_ICONS[p.phase] ?? CHECK_ICON_PATH, 26)}${bead}</span>
    <span class="ch-name" aria-hidden="true">${escapeHtml(PHASE_SHORT[p.phase] ?? `Phase ${p.phase}`)}</span>
    <span class="ch-pct mono" aria-hidden="true">${escapeHtml(phasePctText(p))}</span>
  </div>`);
  });
  return `<div class="hero-chain${opts.animate ? " chain-anim" : ""}" role="group" aria-label="Five-phase verification chain">
  ${parts.join("\n  ")}
</div>`;
}

/** Tiny loader that arms the verify sweep; safe to include once per page. */
export const CHAIN_SCRIPT = `<script>(function(){
  var chains=document.querySelectorAll(".hero-chain.chain-anim");
  if(!chains.length)return;
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    for(var i=0;i<chains.length;i++)chains[i].classList.add("chain-go");
  });});
})();</script>`;

/** The shared three-state legend row. */
export function legendRow(): string {
  return `<div class="chain-legend">
  <span class="lg-item"><span class="lg-swatch lg-ok" aria-hidden="true"></span>verified</span>
  <span class="lg-item"><span class="lg-swatch lg-warn" aria-hidden="true"></span>needs attention</span>
  <span class="lg-item"><span class="lg-swatch lg-hatch" aria-hidden="true"></span>unverified — outside the math</span>
</div>`;
}

/**
 * Mini chain for directory cards: five dots colored by phase state (hatch
 * ring for no-evidence phases), each with its percent underneath.
 */
export function miniChain(score: Score): string {
  const label = score.phases
    .map((p) => `${PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`} ${phasePctText(p)}`)
    .join(", ");
  const parts: string[] = [];
  score.phases.forEach((p, i) => {
    const st = phaseState(p);
    if (i > 0) parts.push(`<span class="mc-link" aria-hidden="true"></span>`);
    parts.push(`<span class="mc-ph st-${st}" aria-hidden="true"><span class="mc-dot"></span><span class="mc-pct mono">${
      p.percent === null ? "—" : escapeHtml(String(p.percent))
    }</span></span>`);
  });
  return `<div class="mini-chain" role="img" aria-label="${escapeHtml(`Phases: ${label}`)}">${parts.join("")}</div>`;
}

const PILL_CLASS: Readonly<Record<string, string>> = {
  "A+": "g-ap",
  A: "g-a",
  B: "g-b",
  C: "g-c",
  D: "g-d",
  F: "g-f",
  NA: "g-na",
};

/** Grade pill: teal tints for A+/A/B, amber for C/D, fail for F, gray NA. */
export function gradePill(grade: string, opts: { size?: "lg" } = {}): string {
  const cls = PILL_CLASS[grade] ?? "g-na";
  return `<span class="pill ${cls}${opts.size === "lg" ? " pill-lg" : ""}" role="img" aria-label="grade ${escapeHtml(grade)}">${escapeHtml(grade)}</span>`;
}

export function gradeBadge(score: Score, opts: { size?: "lg" } = {}): string {
  const prov = score.provisional
    ? ` <span class="prov" title="Evidence coverage below 75%">provisional</span>`
    : "";
  return `${gradePill(score.grade, opts)}${prov}`;
}
