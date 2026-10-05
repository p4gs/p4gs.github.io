/**
 * Scoring — the single implementation shared by the scan pipeline (which
 * writes score blocks into records) and the site build (which re-derives
 * display values). Published verbatim on /methodology/.
 *
 * Doctrine (inherited from sscsb itself, AGENTS.md "0 is not a clean bill of
 * health"): an unperformed check is never a verdict. `unverified` and `info`
 * controls are excluded from EVERY denominator — they are a third visual
 * state, not a pass or a fail.
 */

import type { ControlRecord, Grade, PhaseScore, Score } from "./schema";

/**
 * Every phase the tool emits. **Load-bearing, and stale is a SILENT failure.**
 *
 * `computeScore` reduces `totalPass` and `totalCountable` over this list, but
 * derives `coverage` from `scoped.length`, which has no phase filter. A phase
 * missing here therefore does not merely lose its own row: its passes vanish
 * from the overall percentage, a FAIL inside it becomes invisible, and its
 * controls still inflate the coverage denominator — so every listing's
 * published coverage drops for a reason nobody can see. `reclassify()`
 * fail-closes on an unknown control *id*; there is no equivalent guard on
 * phase, which makes this constant the guard. Phase 6 (distribution &
 * publishing) is why it now reads 1..6.
 */
export const PHASES = [1, 2, 3, 4, 5, 6] as const;

/**
 * What each phase is CALLED, beside the list of which phases exist — because
 * the two drift apart the moment they live in different files. They had:
 * PHASES gained phase 6 while four of the five designs kept a five-entry name
 * map of their own, so ledger, console and chain rendered the distribution
 * controls under a bare "Phase 6", and signal invented "Other checks" for a
 * family that `checks.ts` and `reclassify.ts` both call distribution &
 * publishing. A phase name is taxonomy, not design voice.
 *
 * A design may still abbreviate for a tight surface — that is what each
 * design's own PHASE_SHORT is for — but the full name is spelled once.
 */
export const PHASE_NAMES: Readonly<Record<number, string>> = {
  1: "Commit integrity",
  2: "Dependencies",
  3: "Build receipts",
  4: "Code & build hardening",
  5: "Ongoing posture",
  6: "Distribution & publishing",
};

/** Grade boundaries (owner-specified academic scale). A+ requires exactly 100. */
export function gradeFor(overallPercent: number): Exclude<Grade, "NA"> {
  if (overallPercent === 100) return "A+";
  if (overallPercent >= 90) return "A";
  if (overallPercent >= 80) return "B";
  if (overallPercent >= 70) return "C";
  if (overallPercent >= 60) return "D";
  return "F";
}

/** Coverage below this: no letter at all — "insufficient evidence". */
export const COVERAGE_FLOOR_NA = 50;
/** Coverage below this (but ≥ the NA floor): letter shown as provisional. */
export const COVERAGE_FLOOR_PROVISIONAL = 75;

const round1 = (x: number): number => Math.round(x * 10) / 10;

/**
 * Compute the score block from reclassified controls.
 *
 * Only `in_scope` controls participate at all. Within scope:
 *   countable = pass + fail + gap        (unverified/info never count)
 *   phase %   = 100·pass/countable       (countable 0 ⇒ null, "no evidence")
 *   overall   = Σpass/Σcountable         (same rule)
 *   coverage  = Σcountable/|scope|
 */
export function computeScore(controls: ControlRecord[]): Score {
  const scoped = controls.filter((c) => c.in_scope);
  const phases: PhaseScore[] = PHASES.map((phase) => {
    const rows = scoped.filter((c) => c.phase === phase);
    const count = (o: string) => rows.filter((c) => c.scan_outcome === o).length;
    const pass = count("pass");
    const fail = count("fail");
    const gap = count("gap");
    const countable = pass + fail + gap;
    return {
      phase,
      pass,
      fail,
      gap,
      unverified: count("unverified"),
      info: count("info"),
      percent: countable === 0 ? null : round1((100 * pass) / countable),
    };
  });

  const totalPass = phases.reduce((n, p) => n + p.pass, 0);
  const totalCountable = phases.reduce((n, p) => n + p.pass + p.fail + p.gap, 0);
  const overall = totalCountable === 0 ? null : round1((100 * totalPass) / totalCountable);
  const coverage = scoped.length === 0 ? 0 : round1((100 * totalCountable) / scoped.length);

  let grade: Grade;
  let provisional = false;
  if (overall === null || coverage < COVERAGE_FLOOR_NA) {
    grade = "NA";
  } else {
    grade = gradeFor(overall);
    provisional = coverage < COVERAGE_FLOOR_PROVISIONAL;
  }

  return {
    grade,
    provisional,
    overall_percent: overall,
    evidence_coverage_percent: coverage,
    phases,
  };
}
