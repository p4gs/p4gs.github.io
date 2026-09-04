/**
 * The home page's three panels — computed once here so four designs cannot
 * disagree about what they show, or about when they are allowed to show it.
 *
 * ── Why two of the three have a threshold ────────────────────────────────
 *
 * A panel that silently starts meaning something is worse than one that says
 * what it is waiting for. Both ranked panels are honest-by-construction only
 * above a stated threshold, and below it they render the threshold and the
 * current numbers rather than a ranking nobody could audit:
 *
 *  - "Top rated" at three listings is a three-way tie on the same grade,
 *    broken by evidence coverage — a number the detail pages explicitly say is
 *    NOT held against a repository. Ranking on it would contradict the page
 *    that explains it. So: enough listings, and more than one grade present.
 *  - "Recently scanned" is meaningless while one scheduled job refreshes the
 *    whole registry in the same minute; it would reorder on sub-minute noise.
 *    So: the three newest scans must not all sit inside one batch window.
 *
 * The third panel has no threshold because it ranks nothing. It aggregates
 * which checks most often went unanswered across the whole directory, names
 * no repository, and points at the one command that closes them. That is the
 * peer pressure `coverage.ts` describes — transparency about what was and
 * was not verified, never a ranking of maintainers.
 */

import { isLocallyResolvable } from "./reclassify";
import type { ScanRecord } from "./schema";
import { resolveTrustKind, trustKeyOf, type TrustInfo, type TrustKind } from "./trust";

/** Listings needed before a ranked "best" panel is anything but self-praise. */
export const TOP_RATED_MIN_LISTINGS = 12;
/** Distinct grades needed before a "top" ordering carries information. */
export const TOP_RATED_MIN_GRADES = 2;
/** Newest scans inside this window are one batch, not a recency ordering. */
export const RECENT_BATCH_WINDOW_MS = 10 * 60 * 1000;
/** How many cards each ranked panel shows. */
export const PANEL_SIZE = 3;
/** How many checks the aggregate panel names. */
export const UNVERIFIED_PANEL_SIZE = 5;

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

/**
 * Where the evidence came from, in words a first-time reader can act on.
 * The badge vocabulary ("lane", "verified") is precise and opaque; these are
 * the same four states said plainly, and they keep the ordering the trust
 * model requires — a repository's own CI is the strongest claim on offer.
 */
export const SOURCE_PLAIN: Readonly<Record<TrustKind, { short: string; long: string }>> = {
  verified: {
    short: "run by the repo's own CI",
    long: "The repository's own build ran this scan and signed the result. The signature was checked against that workflow's identity before listing.",
  },
  "unsigned-action": {
    short: "sent by the repo, unsigned",
    long: "The repository's own build sent this record but did not sign it, so nothing proves where it came from. It is listed as an unverified claim.",
  },
  local: {
    short: "signed by a maintainer",
    long: "A maintainer ran the scan on their own machine and signed it with a key this repository publishes. Attributable — and weaker than a scan the repository's own build ran.",
  },
  external: {
    short: "run from outside",
    long: "This site ran the scan from outside the project, so it saw only what anyone can see.",
  },
};

export interface ExemplarCard {
  /** `owner/repo`. */
  slug: string;
  /** Path relative to the design prefix, for ctx.h(). */
  path: string;
  grade: string;
  /** Percentage of answered checks that passed; null when nothing was answered. */
  passedPercent: number | null;
  /** Percentage of in-scope checks that produced an answer at all. */
  answeredPercent: number;
  /** YYYY-MM-DD. */
  scannedDate: string;
  source: TrustKind;
  sourceShort: string;
  sourceLong: string;
  /**
   * The honesty line that must ride with every grade whose evidence is thin.
   * Empty when the listing cleared the coverage floor.
   */
  incompleteNote: string;
  description: string;
}

/** Panels either have content or they say what they are waiting for. */
export type Panel<T> =
  | { ready: true; items: T[] }
  | { ready: false; waitingFor: string };

function cardFor(
  r: ScanRecord,
  trust: ReadonlyMap<string, TrustInfo> | undefined,
  localTrust: ReadonlyMap<string, TrustInfo> | undefined,
): ExemplarCard {
  const key = trustKeyOf(r);
  const kind = resolveTrustKind(r, trust?.get(key), localTrust?.get(key));
  const answered = r.score.evidence_coverage_percent;
  const unanswered = Math.round((100 - answered) * 10) / 10;
  return {
    slug: `${r.repo.owner}/${r.repo.name}`,
    path: `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`,
    grade: r.score.grade,
    passedPercent: r.score.overall_percent,
    answeredPercent: answered,
    scannedDate: r.scanned_at.slice(0, 10),
    source: kind,
    sourceShort: SOURCE_PLAIN[kind].short,
    sourceLong: SOURCE_PLAIN[kind].long,
    incompleteNote: r.score.provisional
      ? `Not the whole picture — ${unanswered}% of the checks could not be answered here.`
      : "",
    description: r.repo.description,
  };
}

/** How many distinct grades the directory currently holds. */
export function distinctGrades(records: readonly ScanRecord[]): number {
  return new Set(records.map((r) => r.score.grade)).size;
}

/**
 * The best-scoring listings — gated, because at small n this is a tie broken
 * by a number the site tells readers not to hold against a repository.
 */
export function topRated(
  records: readonly ScanRecord[],
  trust?: ReadonlyMap<string, TrustInfo>,
  localTrust?: ReadonlyMap<string, TrustInfo>,
): Panel<ExemplarCard> {
  const grades = distinctGrades(records);
  if (records.length < TOP_RATED_MIN_LISTINGS || grades < TOP_RATED_MIN_GRADES) {
    return {
      ready: false,
      waitingFor:
        `A "best scoring" list needs ${TOP_RATED_MIN_LISTINGS} listings and more than one ` +
        `grade among them. Otherwise it is just a tie, broken by a number this site says ` +
        `not to hold against anyone. There ${records.length === 1 ? "is" : "are"} ` +
        `${records.length} listing${records.length === 1 ? "" : "s"} and ` +
        `${grades} grade${grades === 1 ? "" : "s"} so far.`,
    };
  }
  const sorted = [...records].sort((a, b) => {
    const g = (GRADE_ORDER[a.score.grade] ?? 9) - (GRADE_ORDER[b.score.grade] ?? 9);
    if (g !== 0) return g;
    return b.score.evidence_coverage_percent - a.score.evidence_coverage_percent;
  });
  return {
    ready: true,
    items: sorted.slice(0, PANEL_SIZE).map((r) => cardFor(r, trust, localTrust)),
  };
}

/** True when the newest scans are one scheduled batch rather than an ordering. */
export function scansAreOneBatch(records: readonly ScanRecord[]): boolean {
  const times = records
    .map((r) => Date.parse(r.scanned_at))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)
    .slice(0, PANEL_SIZE);
  if (times.length < 2) return true;
  return times[0]! - times[times.length - 1]! < RECENT_BATCH_WINDOW_MS;
}

/**
 * The most recently scanned listings — gated on the scans not all coming from
 * the same run, which is exactly the state the directory is in while one
 * scheduled job refreshes everything at once.
 */
export function recentlyScanned(
  records: readonly ScanRecord[],
  trust?: ReadonlyMap<string, TrustInfo>,
  localTrust?: ReadonlyMap<string, TrustInfo>,
): Panel<ExemplarCard> {
  if (records.length === 0) {
    return { ready: false, waitingFor: "Nothing has been scanned yet." };
  }
  if (scansAreOneBatch(records)) {
    return {
      ready: false,
      waitingFor:
        "Every listing here was scanned by the same scheduled run, minutes apart, so " +
        "ordering them by date would be ordering noise. This fills in once projects " +
        "run their own scans on their own schedules.",
    };
  }
  const sorted = [...records].sort((a, b) =>
    a.scanned_at < b.scanned_at ? 1 : a.scanned_at > b.scanned_at ? -1 : 0,
  );
  return {
    ready: true,
    items: sorted.slice(0, PANEL_SIZE).map((r) => cardFor(r, trust, localTrust)),
  };
}

export interface UnansweredCheck {
  id: string;
  /** How many listings had this check in scope with no answer. */
  listings: number;
  /** Of the whole directory. */
  ofListings: number;
  /** True when only the maintainer's own machine could answer it. */
  onlyMaintainerCanAnswer: boolean;
}

export interface UnansweredSummary {
  /** The most-often-unanswered checks, worst first. */
  checks: UnansweredCheck[];
  /** How many of `checks` only a maintainer's machine can answer. */
  maintainerOnly: number;
  ofListings: number;
}

/**
 * What the directory could not check, aggregated across every listing.
 *
 * No repository is named, deliberately: this panel is about evidence, not
 * about repositories, and it names a fixable thing rather than a failing
 * party. It is the same peer pressure the coverage notes apply, addressed to
 * the whole directory at once.
 */
export function unansweredAcrossDirectory(
  records: readonly ScanRecord[],
  limit = UNVERIFIED_PANEL_SIZE,
): UnansweredSummary {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const c of r.controls) {
      if (!c.in_scope) continue;
      if (c.scan_outcome !== "unverified") continue;
      counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
    }
  }
  const checks = [...counts.entries()]
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0] < b[0] ? -1 : 1))
    .slice(0, limit)
    .map(([id, n]) => ({
      id,
      listings: n,
      ofListings: records.length,
      onlyMaintainerCanAnswer: isLocallyResolvable(id),
    }));
  return {
    checks,
    maintainerOnly: checks.filter((c) => c.onlyMaintainerCanAnswer).length,
    ofListings: records.length,
  };
}

/** Every listing's slug, lowercased — the home page's "is it already listed" set. */
export function listedSlugs(records: readonly ScanRecord[]): string[] {
  return records
    .map((r) => `${r.repo.owner}/${r.repo.name}`.toLowerCase())
    .sort();
}
