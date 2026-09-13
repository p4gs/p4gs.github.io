/**
 * Bulletin's instruments: the grade slab, the oversized numeral, and the
 * three-state phase rules.
 *
 * Meter semantics are the site's honesty contract, not this design's choice:
 * the rule spans pass + fail + gap + unverified. Pass is solid ink, fail-or-gap
 * is the one hot accent, and unverified is hatched — visible, never counted.
 * The percentage beside it is over the ANSWERED checks only, so a rule can
 * read 100% while a hatched stretch shows exactly what nobody could check.
 */
import type { PhaseScore, Score } from "../../schema";
import { escapeHtml } from "./layout";
import { PHASE_NAMES } from "../../scoring";

/**
 * The phase names come from `scoring.ts`, beside PHASES itself — re-exported
 * here so every existing `from "./components"` import keeps working. A phase
 * name is taxonomy shared by all five designs, never one design's copy.
 */
export { PHASE_NAMES };

/** Short forms for the poster slab, where the column is narrow. */
export const PHASE_SHORT: Readonly<Record<number, string>> = {
  1: "Commits",
  2: "Deps",
  3: "Receipts",
  4: "Hardening",
  5: "Posture",
  6: "Publishing",
};

/**
 * Grade colour. Ink for anything passing, the rust tint of the accent for a
 * middling letter, the hot accent itself for F — the accent is reserved for
 * state that matters, and a failing grade is the state that matters most.
 */
const GRADE_CLASS: Readonly<Record<string, string>> = {
  "A+": "gr-ink",
  A: "gr-ink",
  B: "gr-ink",
  C: "gr-rust",
  D: "gr-rust",
  F: "gr-hot",
  NA: "gr-quiet",
};

export type SlabSize = "sm" | "md" | "xl";

/** The grade, set as a poster numeral inside a hard 2px rule. */
export function gradeSlab(grade: string, size: SlabSize = "md"): string {
  const cls = GRADE_CLASS[grade] ?? "gr-quiet";
  return `<span class="grade-slab gs-${size} ${cls}" role="img" aria-label="grade ${escapeHtml(
    grade,
  )}">${escapeHtml(grade)}</span>`;
}

/** The slab plus the provisional tag, which stays wherever the grade goes. */
export function gradeBadge(score: Score, size: SlabSize = "md"): string {
  const prov = score.provisional
    ? `<span class="prov-tag" title="Evidence coverage below 75%">provisional</span>`
    : "";
  return `${gradeSlab(score.grade, size)}${prov}`;
}

/** A headline figure: the number at poster scale, its caption beneath. */
export function figure(value: string, caption: string, hot = false): string {
  return `<div class="fig${hot ? " fig-hot" : ""}">
    <div class="fig-num">${escapeHtml(value)}</div>
    <div class="fig-cap">${caption}</div>
  </div>`;
}

function pctClass(p: PhaseScore): string {
  if (p.percent === null) return "pct-none";
  return p.percent < 100 ? "pct-low" : "pct-ok";
}

/**
 * "no evidence" and "no checks in scope" are DIFFERENT facts, and one phase on
 * every record is the second one. Phase 6 (distribution & publishing) has no
 * control in any record this directory holds, so its rule read "no evidence" —
 * which tells a reader the scan looked and came back empty-handed, and sends
 * them hunting for a sixth group that is not there. The title attribute on the
 * bar said the true thing already, and a phone has no hover.
 */
function pctLabel(p: PhaseScore): string {
  if (p.percent !== null) return `${p.percent}%`;
  const n = p.pass + p.fail + p.gap + p.unverified;
  return n === 0 ? "no checks in scope" : "no evidence";
}

function barAria(name: string, p: PhaseScore): string {
  const base = `${name}: ${pctLabel(p)}`;
  return p.unverified > 0 ? `${base} (${p.unverified} unverified — not counted)` : base;
}

/** The three segments, width-proportional over answered + unverified. */
function segments(p: PhaseScore): string {
  const failGap = p.fail + p.gap;
  const total = p.pass + failGap + p.unverified;
  if (total === 0) return "";
  const w = (n: number) => ((100 * n) / total).toFixed(1);
  const seg = (cls: string, n: number, label: string) =>
    n === 0
      ? ""
      : `<span class="seg ${cls}" style="width:${w(n)}%" title="${label}: ${n}"></span>`;
  return (
    seg("seg-pass", p.pass, "pass") +
    seg("seg-fail", failGap, "fail or gap") +
    seg("seg-unv", p.unverified, "unverified")
  );
}

/** One ruled phase row: name, hard bar, tabular percent. */
export function phaseRule(p: PhaseScore, opts: { short?: boolean } = {}): string {
  const names = opts.short ? PHASE_SHORT : PHASE_NAMES;
  const name = names[p.phase] ?? `Phase ${p.phase}`;
  const total = p.pass + p.fail + p.gap + p.unverified;
  // A phase with nothing in scope gets no bar at all, and the wrapper loses
  // its 10px height and its clipping with it: rendered inside the bar, the
  // "n/a" was sliced in half by the very box that exists to show a length.
  const bar =
    total === 0
      ? `<span class="pr-bar pr-bar-none"><span class="bar-empty" title="No controls in scope">n/a</span></span>`
      : `<span class="pr-bar">${segments(p)}</span>`;
  return `<div class="prule" role="img" aria-label="${escapeHtml(barAria(name, p))}">
  <span class="pr-name">${escapeHtml(name)}</span>
  ${bar}
  <span class="pr-pct ${pctClass(p)}">${pctLabel(p)}</span>
</div>`;
}

/** Every phase, stacked and ruled. */
export function phaseRules(
  phases: readonly PhaseScore[],
  opts: { short?: boolean } = {},
): string {
  return `<div class="prules">${phases.map((p) => phaseRule(p, opts)).join("\n")}</div>`;
}

/** The compact per-row form for the directory broadsheet. */
export function compactRules(score: Score): string {
  const rows = score.phases
    .map((p) => {
      const name = PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`;
      const total = p.pass + p.fail + p.gap + p.unverified;
      const bar =
        total === 0
          ? `<span class="cp-bar cp-bar-none"><span class="bar-empty" title="No controls in scope">n/a</span></span>`
          : `<span class="cp-bar">${segments(p)}</span>`;
      return `<div class="cprule" role="img" aria-label="${escapeHtml(
        barAria(name, p),
      )}" title="${escapeHtml(name)}">
  <span class="cp-label" aria-hidden="true">P${p.phase}</span>
  ${bar}
  <span class="cp-pct ${pctClass(p)}" aria-hidden="true">${
    p.percent === null ? "—" : `${p.percent}%`
  }</span>
</div>`;
    })
    .join("\n");
  return `<div class="cprules">${rows}</div>`;
}
