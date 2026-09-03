/**
 * Per-listing facts the merge produced, carried to every design.
 *
 * Kept OUT of the trust sidecar and out of the scan record on purpose: the
 * sidecar is a published, validated provenance claim and the record is signed
 * bytes. These are BUILD-TIME derivations — what the merge did with the
 * sources it had — so they belong beside the listing, not inside either
 * artifact.
 */

import type { ScanRecord, Score } from "./schema";
import { trustKeyOf } from "./trust";

/**
 * The score block the submitter's own signed record carries.
 *
 * A local record is a complete, self-describing `ScanRecord`, so it has a
 * top-level `score` — computed on the maintainer's machine, over the controls
 * that machine had in scope. The directory republishes those bytes verbatim
 * (the signature covers them, so it cannot rewrite them), which means a reader
 * who fetches `scan-record.local.json` off the listing can read a grade the
 * directory never awarded and quote it as one.
 *
 * The bytes stay byte-identical. The CONTEXT is what changes: wherever the
 * published record is reachable, the page says which number is the directory's
 * and which is the submitter's self-report.
 */
export interface SelfReportedScore {
  grade: Score["grade"];
  provisional: boolean;
  overall_percent: number | null;
  evidence_coverage_percent: number;
}

export interface ListingFacts {
  /** Control ids whose countable verdict came solely from the local lane. */
  resolvedByLocal: readonly string[];
  /** Control ids where two or more sources disagreed — each scored a gap. */
  contradictions: readonly string[];
  /**
   * Class A/A'/B ids a local record asserted that are NOT counted, because
   * a repository scan could observe them and none has agreed yet.
   */
  awaitingIndependent: readonly string[];
  /** True when the only evidence source is a local record. */
  localOnly: boolean;
  /**
   * Set when a local record and its base describe DIFFERENT commits: the local
   * record's commit, and the base's.
   *
   * This matters because a local record has no expiry. Comparing it only
   * against its own sidecar (which is bound to the same commit by
   * construction, so always agrees) proves nothing; the question a reader
   * actually has is whether the workstation record still describes the code
   * the repository scan looked at.
   */
  staleAgainstBase: { local: string; base: string } | null;
  /**
   * The score block inside the local record the directory republishes, when
   * this listing has one. Null when no local record is published — there is
   * then nothing on the page whose grade could be mistaken for the
   * directory's.
   */
  selfReported: SelfReportedScore | null;
}

export const NO_LISTING_FACTS: ListingFacts = {
  resolvedByLocal: [],
  contradictions: [],
  awaitingIndependent: [],
  localOnly: false,
  staleAgainstBase: null,
  selfReported: null,
};

/** A record's listing facts from the map the build loaded (absent = none). */
export function lookupFacts(
  facts: ReadonlyMap<string, ListingFacts> | undefined,
  r: Pick<ScanRecord, "repo">,
): ListingFacts {
  return facts?.get(trustKeyOf(r)) ?? NO_LISTING_FACTS;
}

/** `abc1234…` — a commit rendered the way every page renders one. */
export function shortSha(sha: string): string {
  return sha.slice(0, 12);
}
