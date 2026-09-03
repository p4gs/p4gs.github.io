/**
 * Evidence-coverage facts — the numbers behind "why is this grade provisional,
 * and what would fix it".
 *
 * The four designs each write their own sentence in their own voice, but they
 * all take the FACTS from here, so they cannot drift apart on what is missing
 * or on what the fix is. The peer pressure this feeds is transparency about
 * what was and wasn't verified — never a ranking of maintainers.
 *
 * The nudge's claim is derived, not assumed. "Fixable by a local scan" is
 * asserted ONLY when a local scan could actually clear the coverage floor: it
 * is computed by projecting what would happen if every class-C hole were
 * filled. A repository whose holes are mostly elsewhere gets an honest "this
 * helps but will not clear the floor" instead of a promise the command cannot
 * keep.
 *
 * The second half of the same honesty: the command itself. `sscsb scan --local`
 * REFUSES on a repository whose committed `allowed_signers` grants no
 * `sscsb-scan-record` namespace — an anchor generated before the lane existed,
 * or one that lists no `class = "human"` signer. Telling those maintainers it
 * is one line is telling them to run into a wall the directory can see from
 * here: the external scan reads the committed anchor and records what it found
 * (`anchor.ts`, `ScanRecord.local_lane`), so the nudge names the real first
 * step instead.
 */

import { LOCAL_ANCHOR_PATH, LOCAL_COMMAND, LOCAL_NAMESPACE } from "./local-contract";
import { isLocallyResolvable } from "./reclassify";
import type { ScanRecord } from "./schema";
import { COVERAGE_FLOOR_NA, COVERAGE_FLOOR_PROVISIONAL } from "./scoring";

/**
 * The one command that closes a class-C coverage hole. Shown verbatim.
 *
 * It comes from the contract block (`local-contract.ts`), which is a verbatim
 * mirror of the tool's own `docs/local-scan.md` — because the previous cut of
 * this file hard-coded a command string the CLI did not implement, and every
 * provisional listing rendered it.
 */
export const LOCAL_SCAN_COMMAND = LOCAL_COMMAND;

/**
 * The commands that make a repository able to run the local lane at all,
 * quoted from the tool's own refusal message in `src/local_scan.rs`.
 *
 * `sscsb init` regenerates `.sscsb/policy/allowed_signers` from
 * `.sscsb/policy/signers.toml`; the file has to be COMMITTED, because the
 * directory reads it out of the public repository at the record's commit and
 * never from anything the submitter hands it.
 */
export const ANCHOR_REGEN_COMMANDS: readonly string[] = Object.freeze([
  "sscsb init",
  `git add ${LOCAL_ANCHOR_PATH}`,
  `git commit -m 'policy: permit the ${LOCAL_NAMESPACE} namespace'`,
]);

export type CoverageState =
  /** Coverage at or above the provisional floor: nothing to explain. */
  | "complete"
  /** Below the floor, and a local scan would take it back over the floor. */
  | "fixable-by-local"
  /** Below the floor; a local scan helps but cannot get it over the floor. */
  | "partly-fixable-by-local"
  /** Below the floor, and NO class-C rows are missing — a local scan changes nothing. */
  | "incomplete"
  /** A local record already contributed and coverage is still short. */
  | "local-applied";

export interface CoverageFacts {
  coverage: number;
  /** In-scope controls with no verdict at all. */
  unverified: number;
  /** Of those, how many a local scan could settle ON ITS OWN (class C). */
  localResolvable: number;
  /** Rows a verified local record already resolved on this listing. */
  resolvedByLocal: number;
  /** The coverage this listing would have if every class-C hole were filled. */
  projectedCoverage: number;
  /** Below COVERAGE_FLOOR_PROVISIONAL — the grade reads `provisional` (or NA). */
  belowFloor: boolean;
  /** Below COVERAGE_FLOOR_NA — no letter at all. */
  belowNaFloor: boolean;
  state: CoverageState;
  /**
   * Whether the repository's committed anchor already permits the scan-record
   * namespace: `true` = ready, `false` = `sscsb scan --local` would refuse,
   * `null` = the directory never looked (no external record, or one predating
   * this signal). Null is treated as ready — the nudge may not invent an
   * obstacle it has no evidence for.
   */
  anchorReady: boolean | null;
  /**
   * The commands that actually close the class-C holes here, in order. One
   * line when the anchor is ready; the anchor regeneration first when it is
   * not. Designs render this list rather than hard-coding the command, so the
   * four of them cannot disagree about what a maintainer has to do.
   */
  nudgeCommands: readonly string[];
}

const round1 = (x: number): number => Math.round(x * 10) / 10;

/**
 * Read the coverage story off a published record.
 *
 * `resolvedByLocal` comes from the merge (the build recorded what the local
 * record actually contributed), so a listing that already used the local lane
 * says so rather than nagging for a scan it has.
 */
export function coverageFacts(r: ScanRecord, resolvedByLocal = 0): CoverageFacts {
  const scoped = r.controls.filter((c) => c.in_scope);
  const unverified = scoped.filter((c) => c.scan_outcome === "unverified");
  const localResolvable = unverified.filter((c) => isLocallyResolvable(c.id)).length;
  const coverage = r.score.evidence_coverage_percent;
  const belowFloor = coverage < COVERAGE_FLOOR_PROVISIONAL;
  const belowNaFloor = coverage < COVERAGE_FLOOR_NA;

  // What coverage WOULD be if a local scan settled every class-C hole. The
  // countable count is recoverable from the published percentage without
  // re-deriving the scoring rule: coverage is countable/scope.
  const countable = scoped.length - unverified.length - scoped.filter((c) => c.scan_outcome === "info").length;
  const projectedCoverage =
    scoped.length === 0 ? 0 : round1((100 * (countable + localResolvable)) / scoped.length);

  let state: CoverageState;
  if (!belowFloor) state = "complete";
  else if (resolvedByLocal > 0) state = "local-applied";
  else if (localResolvable === 0) state = "incomplete";
  else if (projectedCoverage >= COVERAGE_FLOOR_PROVISIONAL) state = "fixable-by-local";
  else state = "partly-fixable-by-local";

  // Readiness of the committed anchor. `undefined`/`null` on the record means
  // no lane recorded it — treat that as ready rather than manufacturing an
  // obstacle we have no evidence for.
  const anchorReady = r.local_lane == null ? null : r.local_lane.scan_namespace_granted;

  return {
    coverage,
    unverified: unverified.length,
    localResolvable,
    resolvedByLocal,
    projectedCoverage,
    belowFloor,
    belowNaFloor,
    state,
    anchorReady,
    nudgeCommands:
      anchorReady === false
        ? Object.freeze([...ANCHOR_REGEN_COMMANDS, LOCAL_SCAN_COMMAND])
        : Object.freeze([LOCAL_SCAN_COMMAND]),
  };
}

/**
 * Why the nudge is more than one line here, or null when it is one line.
 *
 * Plain text: each design wraps it in its own chrome, but none of them may
 * reword the reason a documented command will refuse.
 */
export function anchorCaveat(f: CoverageFacts): string | null {
  if (f.anchorReady !== false) return null;
  return (
    `Not one line here: this repository's committed ${LOCAL_ANCHOR_PATH} grants no ` +
    `"${LOCAL_NAMESPACE}" namespace — it was generated before this lane existed, or it ` +
    `lists no class = "human" signer — so ${LOCAL_SCAN_COMMAND} refuses outright rather ` +
    `than mint a record that cannot verify. The real first step is to regenerate and ` +
    `commit the anchor: ${ANCHOR_REGEN_COMMANDS.join("; ")} — then run the scan.`
  );
}

/** `1 control` / `4 controls` — used in every design's sentence. */
export function plural(n: number, noun = "control"): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}
