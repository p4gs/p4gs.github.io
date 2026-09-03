/**
 * The sentences every design must say when the evidence merge did something
 * a reader needs to know about — written ONCE, in plain text, so four designs
 * cannot drift apart on a claim about evidence.
 *
 * Plain text rather than markup: each design escapes and wraps these in its
 * own chrome. What must not vary is WHAT is said.
 *
 * Three facts qualify:
 *
 *  1. **Contradiction.** Two or more verified sources gave different countable
 *     verdicts for the same control. The row is scored as a gap — erring on
 *     the side of caution — and the disagreement is named. Downgrading
 *     silently would bury the single most interesting fact the directory holds
 *     about that repository.
 *  2. **Stale local record.** A local record and the repository-observable
 *     base describe different commits. A local record has no expiry, so
 *     without this a workstation record from months ago can quietly fill holes
 *     in a much newer scan.
 *  3. **Held back.** A maintainer asserted a control a repository scan could
 *     have observed, and nothing independent has agreed yet, so it is not
 *     counted.
 *  4. **Self-reported score.** The published local record carries its own
 *     top-level `score` block, computed on the maintainer's machine over the
 *     controls that machine had in scope. The directory republishes those bytes
 *     byte-identically — it has to, the signature covers them — so a reader who
 *     fetches `scan-record.local.json` can read a grade the directory never
 *     awarded. The bytes stay; the page says whose number is whose.
 */

import { plural } from "../coverage";
import { type ListingFacts, shortSha } from "../listing";
import type { Score } from "../schema";

/** "3 controls · action vs local" — the compact listing-row form. */
export function contradictionSentence(f: ListingFacts): string | null {
  const n = f.contradictions.length;
  if (n === 0) return null;
  return (
    `Contradiction: ${plural(n)} ${n === 1 ? "has" : "have"} conflicting verified ` +
    `results across evidence sources (${f.contradictions.join(", ")}). ` +
    `${n === 1 ? "It is" : "Each is"} scored as a gap — when verified evidence ` +
    `disagrees, the directory errs on the side of caution.`
  );
}

/** The short badge text for a contradiction, or null. */
export function contradictionBadge(f: ListingFacts): string | null {
  const n = f.contradictions.length;
  return n === 0 ? null : `conflict ${n}`;
}

/** "…describes a different commit than the scan it is merged into." */
export function staleSentence(f: ListingFacts): string | null {
  if (!f.staleAgainstBase) return null;
  return (
    `The local record describes commit ${shortSha(f.staleAgainstBase.local)}, while the ` +
    `repository scan on this listing describes ${shortSha(f.staleAgainstBase.base)}. Its ` +
    `local-environment rows may predate the code above them.`
  );
}

/** Short badge text when the local record is behind the base. */
export function staleBadge(f: ListingFacts): string | null {
  return f.staleAgainstBase ? "local record at a different commit" : null;
}

/** "N controls asserted locally are not counted…" */
export function awaitingSentence(f: ListingFacts): string | null {
  const n = f.awaitingIndependent.length;
  if (n === 0) return null;
  return (
    `${plural(n)} asserted by the local scan are not counted: a repository scan can ` +
    `observe them, so the directory waits for an independent record to agree or ` +
    `disagree. Where someone else could have checked, we require that someone else.`
  );
}

/**
 * "The grade on this listing is the directory's…" — the one sentence that keeps
 * a republished self-report from being read as a directory grade.
 *
 * `directory` is the merged listing's score, which IS the directory's answer.
 * Both numbers are named, so a reader comparing the page against the bytes it
 * links to finds the difference explained rather than surprising.
 */
export function selfReportSentence(f: ListingFacts, directory: Score): string | null {
  const s = f.selfReported;
  if (!s) return null;
  const pct = (v: number | null) => (v === null ? "no evidence" : `${v}%`);
  return (
    `Two scores are on this page and only one of them is ours. The grade and coverage ` +
    `shown here — ${directory.grade}, ${pct(directory.overall_percent)}, coverage ` +
    `${directory.evidence_coverage_percent}% — are the DIRECTORY's, computed from every ` +
    `evidence source it holds under the published methodology. The signed local record ` +
    `linked below carries its own score block (${s.grade}, ${pct(s.overall_percent)}, ` +
    `coverage ${s.evidence_coverage_percent}%${s.provisional ? ", provisional" : ""}): that ` +
    `is the SUBMITTER's self-report, computed on their machine over the controls that ` +
    `machine had in scope. It is republished byte-identically because the signature covers ` +
    `those exact bytes, not because the directory endorses the number.`
  );
}

/**
 * Every applicable sentence, in reading order.
 *
 * `directory` is the merged listing's score. It is optional only so a caller
 * with no record in hand can still render the merge findings; omit it and the
 * self-report sentence is skipped.
 */
export function factSentences(f: ListingFacts, directory?: Score): string[] {
  return [
    contradictionSentence(f),
    staleSentence(f),
    awaitingSentence(f),
    directory ? selfReportSentence(f, directory) : null,
  ].filter((s): s is string => s !== null);
}
