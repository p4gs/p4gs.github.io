/**
 * Signal — the shared visual vocabulary.
 *
 * THE GOVERNING CONSTRAINT. This site encodes control STATE in colour: pass,
 * fail, gap and unverified. Green, amber and red are therefore spoken for, and
 * the brand accent is a blue that can never be mistaken for a status. It also
 * means colour is never allowed to be the only signal — every state below
 * renders as **colour + shape + text**, so a reader who cannot separate the
 * hues reads exactly the same verdict from the glyph and the word.
 *
 * The four shapes, and why each is the shape it is:
 *
 *   pass       ● a filled disc            — something is there, and it works
 *   gap        ⊘ a hollow disc, struck    — looked for, not found
 *   fail       ◓ a half-filled disc       — present and not working
 *   unverified ◌ a dashed ring            — nobody answered; never counted
 *
 * The dashed ring is deliberately the emptiest mark on the page. An
 * unperformed check is a third state, not a quiet failure, and it must not
 * look like one.
 */
import type { Score } from "../../schema";
import { escapeHtml } from "./layout";
import { PHASE_NAMES } from "../../scoring";

/**
 * The phase names come from `scoring.ts`, beside PHASES itself — re-exported
 * here so every existing `from "./components"` import keeps working. A phase
 * name is taxonomy shared by all five designs, never one design's copy.
 */
export { PHASE_NAMES };

/** The four states a control row can be in, plus the informational one. */
export type MarkState = "pass" | "fail" | "gap" | "unverified" | "info";

const MARK_WORD: Readonly<Record<MarkState, string>> = {
  pass: "PASS",
  fail: "FAIL",
  gap: "GAP",
  unverified: "UNVERIFIED",
  info: "INFO",
};

const MARK_TITLE: Readonly<Record<MarkState, string>> = {
  pass: "The check ran and passed",
  fail: "The defence is there and it is not working",
  gap: "The defence was looked for and not found",
  unverified: "Nobody could answer this check — it is not counted either way",
  info: "Informational — excluded from scoring",
};

/**
 * The glyph alone, as an inline SVG on a 16 grid. Drawn rather than typed: the
 * dingbat characters for these shapes render at wildly different sizes across
 * platforms, and a status mark that changes size between two rows of the same
 * table reads as two different marks.
 */
export function mark(state: MarkState, size = 16): string {
  const box = `width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true"`;
  switch (state) {
    case "pass":
      return `<svg class="mk mk-pass" ${box}><circle cx="8" cy="8" r="6" fill="currentColor"></circle></svg>`;
    case "fail":
      return `<svg class="mk mk-fail" ${box}><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"></path></svg>`;
    case "gap":
      return `<svg class="mk mk-gap" ${box}><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M4 12L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`;
    case "info":
      return `<svg class="mk mk-info" ${box}><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="1 3"></circle><circle cx="8" cy="8" r="2" fill="currentColor"></circle></svg>`;
    default:
      return `<svg class="mk mk-unverified" ${box}><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.6 2.6"></circle></svg>`;
  }
}

/** Glyph plus word — the form every verdict takes where there is room for it. */
export function statusChip(state: MarkState, label?: string): string {
  return `<span class="chip chip-${state}" title="${escapeHtml(MARK_TITLE[state])}">${mark(
    state,
    12,
  )}<span class="chip-word">${escapeHtml(label ?? MARK_WORD[state])}</span></span>`;
}

/**
 * Glyph plus a number — the compact form used in table cells.
 *
 * `data-count` is what lets the stylesheet tie the glyph's CHROMA to the
 * count. Round 2 dimmed a zero NUMERAL to grey but left its ring at full
 * strength, so an all-passing directory still drew a saturated red fail ring
 * and a saturated amber gap ring in every row — the two most expensive colours
 * on a page where colour is data, spent on nothing, with the glyph loud and
 * the numeral quiet inside one unit. At zero the ring drops to muted ink and
 * the SHAPE carries the meaning; the legend keeps the full-chroma reference
 * key, so no reader loses the mapping.
 */
export function countMark(state: MarkState, n: number): string {
  return `<span class="cmark cmark-${state}" data-count="${n}" title="${escapeHtml(
    `${n} ${MARK_WORD[state].toLowerCase()}`,
  )}">${mark(state, 13)}<span class="cmark-n">${n}</span></span>`;
}

export interface Tally {
  pass: number;
  fail: number;
  gap: number;
  unverified: number;
  info: number;
}

/** The whole record's verdict counts, summed across phases. */
export function tally(score: Score): Tally {
  return score.phases.reduce<Tally>(
    (a, p) => ({
      pass: a.pass + p.pass,
      fail: a.fail + p.fail,
      gap: a.gap + p.gap,
      unverified: a.unverified + p.unverified,
      info: a.info + p.info,
    }),
    { pass: 0, fail: 0, gap: 0, unverified: 0, info: 0 },
  );
}

const GRADE_CLASS: Readonly<Record<string, string>> = {
  "A+": "gr-top", A: "gr-top", B: "gr-top", C: "gr-mid", D: "gr-mid", F: "gr-low", NA: "gr-na",
};

/**
 * The grade, as a pill.
 *
 * A+ is exactly 100% and nothing else, which is why it is allowed to look
 * different from A. NA is not a bad grade — it is the absence of one — so it
 * is drawn in the muted ink, never in the failure hue.
 */
export function gradePill(grade: string, opts: { size?: "lg" } = {}): string {
  return `<span class="grade ${GRADE_CLASS[grade] ?? "gr-na"}${
    opts.size === "lg" ? " grade-lg" : ""
  }" role="img" aria-label="grade ${escapeHtml(grade)}">${escapeHtml(grade)}</span>`;
}

export function gradeBadge(score: Score, opts: { size?: "lg" } = {}): string {
  const prov = score.provisional
    ? ` <span class="prov">provisional</span>`
    : "";
  return `${gradePill(score.grade, opts)}${prov}`;
}

/**
 * A 4px hairline meter. Used under a score and under a coverage figure, never
 * on its own: a bar with no number beside it is a shape a reader cannot read
 * back, and every number on this site has to survive being quoted.
 */
export function meter(percent: number | null, kind: "score" | "coverage" = "score"): string {
  const v = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  return `<span class="meter meter-${kind}${percent === null ? " meter-empty" : ""}" aria-hidden="true"><span class="meter-fill" style="width:${v}%"></span></span>`;
}

/** "no evidence" rather than "0%" — they are different facts. */
export function pctText(v: number | null): string {
  return v === null ? "no evidence" : `${v}%`;
}

/** One figure in the hero's live stat row: mono label above, big number below. */
export function stat(label: string, value: string, note?: string): string {
  return `<div class="sg-stat">
  <span class="sg-stat-label">${escapeHtml(label)}</span>
  <span class="sg-stat-value">${escapeHtml(value)}</span>
  ${note ? `<span class="sg-stat-note">${escapeHtml(note)}</span>` : ""}
</div>`;
}

/**
 * The legend. Four marks, four words, one line — printed wherever the marks
 * are, because a key on a different page is a key nobody reads.
 */
export function legend(): string {
  return `<div class="sg-legend" role="group" aria-label="What the marks mean">
  <span class="lg"><span class="lg-mk lg-pass">${mark("pass", 13)}</span>passed</span>
  <span class="lg"><span class="lg-mk lg-fail">${mark("fail", 13)}</span>there, not working</span>
  <span class="lg"><span class="lg-mk lg-gap">${mark("gap", 13)}</span>looked for, not found</span>
  <span class="lg"><span class="lg-mk lg-unverified">${mark("unverified", 13)}</span>nobody could answer — never counted</span>
</div>`;
}
