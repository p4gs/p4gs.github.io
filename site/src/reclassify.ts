/**
 * Reclassification — turning `sscsb verify` raw outcomes from a scan of a
 * third-party clone into honest directory verdicts.
 *
 * The scan protocol runs `sscsb init` before `verify`, and init installs the
 * very artifacts many controls check for — so a raw PASS can be evidence the
 * SCANNER created seconds earlier, not evidence about the repository. The rule
 * that fixes this is diff-based: anything init created (absent from the
 * pre-init `git ls-files` snapshot) can never count as the target's evidence.
 *
 * Evidence classes (full rationale on /methodology/):
 *   A  — committed-artifact controls: pass only on pre-existing artifacts.
 *   A' — static audits of committed workflows: vacuous with zero pre-existing
 *        workflows; otherwise the raw verdict maps directly (init's own
 *        templates pass sscsb's audit by construction, so init can only
 *        pollute toward PASS, never cause FAIL).
 *   B  — live-remote checks (GitHub API): raw verdict maps directly.
 *   C  — local-environment checks: unobservable in a repo scan → unverified.
 *   M  — meta/informational: excluded from scoring entirely.
 *
 * Fail-closed: a control id with no class is an error, never a guess — a new
 * sscsb control must be classified here before its scans can be scored.
 *
 * The classes above describe THIS function — what a repository scan of a
 * third-party clone may conclude. They are also what the merge at the bottom of
 * this file keys on, but not in the way an earlier cut of this comment claimed:
 * a signed local record is not confined to class C. It votes on every control,
 * and the merge decides what its vote is worth — a class-C verdict counts on
 * its own (nobody else can look), a class A/A'/B verdict counts only once an
 * independent source agrees or disagrees with it, and a disagreement anywhere
 * scores a gap. See EVIDENCE MERGE below for the actual rule.
 */

import { computeScore } from "./scoring";
import type { ControlRecord, RawOutcome, ScanOutcome, ScanRecord } from "./schema";

export type EvidenceClass = "A" | "Aprime" | "B" | "C" | "M";

/**
 * Every control sscsb v1 can emit, with its evidence class and its phase.
 *
 * The phase lives HERE, not only in the record, because a local-only listing
 * has to be scored against a scope the DIRECTORY defines. A record that could
 * nominate its own phases (or omit rows entirely) would be choosing its own
 * denominator, which is the inflation path this table closes.
 */
export const CONTROL_REGISTRY: Readonly<
  Record<string, { readonly cls: EvidenceClass; readonly phase: number }>
> = {
  // Phase 1
  secrets: { cls: "A", phase: 1 },
  "commit-signing": { cls: "C", phase: 1 },
  "agent-signing": { cls: "C", phase: 1 },
  "signing-model": { cls: "C", phase: 1 },
  "branch-protection": { cls: "B", phase: 1 },
  "actions-audit": { cls: "Aprime", phase: 1 },
  gittuf: { cls: "A", phase: 1 },
  "ai-trailers": { cls: "C", phase: 1 },
  "ai-dep-gate": { cls: "C", phase: 1 },
  "pr-template": { cls: "A", phase: 1 },
  "ai-receipts": { cls: "C", phase: 1 },
  // Phase 2
  sbom: { cls: "A", phase: 2 },
  "vuln-scan": { cls: "A", phase: 2 },
  scorecard: { cls: "B", phase: 2 },
  renovate: { cls: "A", phase: 2 },
  "package-trust": { cls: "C", phase: 2 },
  bumblebee: { cls: "C", phase: 2 },
  grype: { cls: "C", phase: 2 },
  "socket-firewall": { cls: "C", phase: 2 },
  // Phase 3
  "sigstore-signing": { cls: "A", phase: 3 },
  "slsa-provenance": { cls: "A", phase: 3 },
  "github-attestations": { cls: "A", phase: 3 },
  "sbom-attestation": { cls: "A", phase: 3 },
  "model-signing": { cls: "A", phase: 3 },
  "provenance-verify": { cls: "A", phase: 3 },
  "release-immutability": { cls: "A", phase: 3 },
  "octo-sts": { cls: "A", phase: 3 },
  "harden-runner": { cls: "Aprime", phase: 3 },
  witness: { cls: "C", phase: 3 },
  // Phase 4
  sast: { cls: "A", phase: 4 },
  sighthound: { cls: "C", phase: 4 },
  codeql: { cls: "A", phase: 4 },
  fuzzing: { cls: "A", phase: 4 },
  "workflow-audit-extended": { cls: "Aprime", phase: 4 },
  "secure-repo": { cls: "M", phase: 4 },
  "wait-for-secrets": { cls: "A", phase: 4 },
  // Phase 5
  "dependency-track": { cls: "A", phase: 5 },
  guac: { cls: "C", phase: 5 },
  openvex: { cls: "C", phase: 5 },
  oras: { cls: "C", phase: 5 },
  "security-insights": { cls: "A", phase: 5 },
  "best-practices-badge": { cls: "A", phase: 5 },
  "osps-baseline": { cls: "A", phase: 5 },
  "compliance-map": { cls: "M", phase: 5 },
};

/** Control → evidence class, derived from the one registry above. */
export const CONTROL_CLASSES: Readonly<Record<string, EvidenceClass>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(CONTROL_REGISTRY).map(([id, meta]) => [id, meta.cls]),
    ),
  );

/** One row of `sscsb verify --format json` output (schema_version 1). */
export interface VerifyRow {
  control: string;
  phase: number;
  name: string;
  outcome: RawOutcome;
  messages: string[];
  artifacts: string[];
  tools: string[];
}

export interface ReclassifyInput {
  rows: VerifyRow[];
  /** Repo-relative paths present BEFORE `sscsb init` ran (git ls-files -z). */
  preFiles: ReadonlySet<string>;
  /** Count of pre-init files matching .github/workflows/*.ya?ml */
  workflowsPre: number;
  /** Control ids enabled per the target's own committed config (from report). */
  enabled: ReadonlySet<string>;
  /** Registry default-enabled ids (from report; controls absent = default-off). */
  defaultEnabled: ReadonlySet<string>;
}

const MAX_MESSAGES = 8;
const MAX_MESSAGE_LEN = 300;

/** Strip control characters and cap length — messages reach markdown/HTML. */
export function sanitizeMessage(m: string): string {
  // eslint-disable-next-line no-control-regex
  const stripped = m.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  return stripped.length > MAX_MESSAGE_LEN
    ? `${stripped.slice(0, MAX_MESSAGE_LEN)}\u2026`
    : stripped;
}

function mapDirect(raw: RawOutcome): ScanOutcome {
  switch (raw) {
    case "pass":
      return "pass";
    case "fail":
      return "fail";
    case "degraded":
      return "unverified";
    case "disabled":
      // Only reachable for in-scope (default-on) controls the target switched
      // off in its committed config: that is a posture choice, scored as gap.
      return "gap";
    case "info":
      return "info";
  }
}

export function reclassify(input: ReclassifyInput): ControlRecord[] {
  const out: ControlRecord[] = [];
  for (const row of input.rows) {
    const cls = CONTROL_CLASSES[row.control];
    if (cls === undefined) {
      throw new Error(
        `unclassified control \`${row.control}\` — a new sscsb control must be ` +
          `added to CONTROL_CLASSES (with a methodology entry) before scoring`,
      );
    }
    const inScope =
      cls !== "M" &&
      (input.defaultEnabled.has(row.control) || input.enabled.has(row.control));

    let scan: ScanOutcome;
    let reclassified = false;
    let reason: string | null = null;

    if (cls === "M" || !inScope) {
      scan = "info";
      if (cls === "M") reason = "informational control — excluded from scoring";
      else reason = "optional control not enabled by this repository";
    } else if (cls === "C") {
      scan = "unverified";
      reclassified = row.outcome === "pass" || row.outcome === "fail";
      reason = "requires the local development environment; not observable in a repository scan";
    } else if (cls === "Aprime") {
      if (input.workflowsPre === 0) {
        scan = "unverified";
        reclassified = true;
        reason = "no committed workflows to audit — a pass here would be vacuous";
      } else {
        scan = mapDirect(row.outcome);
      }
    } else if (cls === "B") {
      scan = mapDirect(row.outcome);
    } else {
      // Class A: committed artifacts are the evidence.
      const created = row.artifacts.filter((p) => !input.preFiles.has(p));
      if (row.artifacts.length > 0 && created.length > 0) {
        scan = "gap";
        reclassified = true;
        reason = `evidence installed by the scanner's own init (${created.join(", ")}) — absent from the repository`;
      } else {
        scan = mapDirect(row.outcome);
        if (row.outcome === "degraded" && row.artifacts.length > 0) {
          // Artifact-carrying tool controls degrade on missing runner tools;
          // with all artifacts pre-existing, the committed evidence stands.
          scan = "pass";
          reclassified = true;
          reason =
            "runner-tool availability is the scanner's environment, not the repository's; all registered artifacts pre-exist";
        }
      }
    }

    out.push({
      id: row.control,
      phase: row.phase,
      in_scope: inScope,
      raw_outcome: row.outcome,
      scan_outcome: scan,
      reclassified,
      reason,
      messages: row.messages.slice(0, MAX_MESSAGES).map(sanitizeMessage),
    });
  }
  return out;
}

/* ------------------------------------------------------------------------ *
 * EVIDENCE MERGE — one control id, several sources, one verdict.
 *
 * The rule, verbatim from the owner:
 *
 *   "A repo's overall grade at a maximum should take into account their GH
 *    Actions-emitted results *and* their internal scan-emitted results. These
 *    should not be seen as mutually exclusive. When there are contradictory
 *    verified results for the same requirement, that should be flagged and
 *    treated as a gap (erring on the side of caution)."
 *
 * Implemented as: for each control id, collect the verdict from every evidence
 * SOURCE the directory holds — the newest verified action-lane record, the
 * newest verified local-lane record, and the external record the directory
 * produced itself. Then
 *
 *   (a) two or more sources give DIFFERENT countable verdicts (pass/fail/gap)
 *       → gap, carrying a contradiction flag naming each source and its
 *         verdict. The flag reaches the record, the listing row and the detail
 *         page — a silent downgrade would hide the very disagreement that is
 *         the interesting fact.
 *   (b) exactly one distinct countable verdict → that verdict, whatever lane
 *       produced it.
 *   (c) no countable verdict → unverified / info, outside every denominator.
 *
 * A contradiction therefore COSTS the repository: a gap sits in the
 * denominator without passing. That is "err on the side of caution", and it is
 * what removes any incentive to submit a flattering local scan.
 *
 * ── The observability requirement ───────────────────────────────────────────
 *
 * A naive union of the lanes has a live inflation path, and it is not
 * theoretical: a local-only record could set its own denominator and publish
 * A+ / 100% coverage / non-provisional with zero independently observable
 * evidence. The fix is NOT to re-confine local to class C. It is:
 *
 *   WHERE INDEPENDENT OBSERVATION IS POSSIBLE, REQUIRE IT.
 *
 * Classes A, A' and B are by definition observable from a repository scan — a
 * committed artifact, a committed workflow, a live GitHub setting. For those
 * rows a maintainer's self-report ALONE is not countable: with no independent
 * source the row stays `unverified`, outside the denominator, and it becomes
 * countable the moment a CI or external record exists to agree or disagree
 * with it. Class C is by definition NOT independently observable, so there the
 * maintainer's signed word is the best evidence obtainable and counts on its
 * own.
 *
 * That is not "local counts less". It is "where someone else could have
 * checked, we require that someone else".
 *
 * ── Lane discipline: the mirror image ───────────────────────────────────────
 *
 * The same principle runs the other way. A repository-observable lane cannot
 * observe class C — the development environment is not in the checkout — so a
 * class-C verdict from an `action` or `external` source is not evidence
 * whatever it says, and is dropped before anything is counted. Today's external
 * pipeline reclassifies those rows to `unverified` already; the merge no longer
 * DEPENDS on every present and future record producer doing so.
 *
 * The second half of the same defence: for a local-only listing the SCOPE is
 * the directory's own non-meta control set, never the record's `in_scope`
 * flags. A record cannot shrink its denominator by declining to mention a
 * control.
 * ------------------------------------------------------------------------ */

/** Which record a verdict came from. */
export type SourceLane = "action" | "external" | "local";

/** One evidence source for a repository. */
export interface EvidenceSource {
  lane: SourceLane;
  record: ScanRecord;
}

/** The three outcomes that participate in a denominator. */
export type Verdict = "pass" | "fail" | "gap";

const COUNTABLE: ReadonlySet<ScanOutcome> = new Set<ScanOutcome>(["pass", "fail", "gap"]);

/** Evidence classes a repository scan can observe from outside the machine. */
export const INDEPENDENTLY_OBSERVABLE: ReadonlySet<EvidenceClass> = new Set<EvidenceClass>([
  "A",
  "Aprime",
  "B",
]);

function classOf(id: string): EvidenceClass {
  const meta = CONTROL_REGISTRY[id];
  if (meta === undefined) {
    throw new Error(
      `unclassified control \`${id}\` — a new sscsb control must be ` +
        `added to CONTROL_REGISTRY (with a methodology entry) before scoring`,
    );
  }
  return meta.cls;
}

/**
 * Could someone other than the maintainer have checked this control?
 *
 * True for classes A, A' and B: a self-report about them needs an independent
 * record to agree or disagree with before it counts.
 */
export function requiresIndependentObservation(control: string): boolean {
  const meta = CONTROL_REGISTRY[control];
  return meta !== undefined && INDEPENDENTLY_OBSERVABLE.has(meta.cls);
}

/**
 * Is this a control a local scan can settle **on its own** — with no other
 * source in the listing?
 *
 * Exactly class C: the local-environment checks nobody else can observe, where
 * a maintainer's signed word is the best evidence that can exist. This is what
 * the coverage nudge means by "fixable by a local scan", because those are the
 * only rows a scan a maintainer runs today can move without waiting for a CI or
 * external record.
 *
 * It is NOT a statement that class C is all a local record may resolve. A local
 * record votes on every control it holds; an A/A'/B vote becomes countable the
 * moment an independent source agrees with it (and scores a gap if one
 * disagrees). See `mergeEvidence`.
 */
export function isLocallyResolvable(control: string): boolean {
  return CONTROL_REGISTRY[control]?.cls === "C";
}

/** One source's verdict on one control, as it appears on a contradiction flag. */
export interface ContradictionNote {
  source: SourceLane;
  verdict: Verdict;
}

const META_REASON = "informational control — excluded from scoring";
const OUT_OF_SCOPE_REASON = "optional control not enabled by this repository";
const NO_EVIDENCE_REASON =
  "no lane produced a verdict for this control — an unperformed check is never a verdict";
const AWAITING_INDEPENDENT_REASON =
  "asserted by a signed local scan, but this control is observable from a repository " +
  "scan — so it is not counted until a CI or external record agrees or disagrees with it";
const LOCAL_ONLY_EVIDENCE_REASON =
  "resolved by a signed local scan: this control lives in the development environment, " +
  "so a workstation record signed by a key this repository commits in " +
  ".sscsb/policy/allowed_signers is the only evidence that can exist for it";

/**
 * Why a verdict a repository-observable lane offered on a class-C control was
 * not counted. Said out loud rather than dropped silently: a reader looking at
 * the published action-lane record would otherwise see a `pass` there and an
 * `unverified` here with no explanation.
 */
function offLaneReason(offLane: readonly Contribution[]): string {
  const named = [...new Set(offLane.map((c) => c.source))].join(", ");
  return (
    `not counted — this control describes the development environment, which the ` +
    `${named} lane cannot observe: it looks at a checkout, not at the maintainer's ` +
    `machine. A verdict it cannot have made is not evidence, whatever it says. Only a ` +
    `signed local record can settle this row.`
  );
}

function contradictionReason(notes: readonly ContradictionNote[]): string {
  const named = notes.map((n) => `${n.source} says ${n.verdict}`).join("; ");
  return (
    `CONTRADICTION — sources disagree (${named}). Scored as a gap: when verified ` +
    `evidence conflicts, the directory errs on the side of caution rather than ` +
    `picking the flattering answer.`
  );
}

/** Human-readable one-liner for a contradiction, used by every design. */
export function contradictionLabel(notes: readonly ContradictionNote[]): string {
  return notes.map((n) => `${n.source}: ${n.verdict}`).join(" vs ");
}

interface Contribution {
  source: SourceLane;
  row: ControlRecord;
  verdict: Verdict;
}

/** The rows every source holds for one control, in a stable source order. */
function contributionsFor(sources: readonly EvidenceSource[], id: string): Contribution[] {
  const out: Contribution[] = [];
  for (const s of sources) {
    const row = s.record.controls.find((c) => c.id === id);
    if (!row || !row.in_scope) continue;
    if (!COUNTABLE.has(row.scan_outcome)) continue;
    out.push({ source: s.lane, row, verdict: row.scan_outcome as Verdict });
  }
  return out;
}

/**
 * Which of those contributions a source was structurally capable of making.
 *
 * See `contributionsFor` for why: a class-C verdict from a repository-observable
 * lane is dropped, not trusted.
 */
export function isOnLane(cls: EvidenceClass, lane: SourceLane): boolean {
  return cls !== "C" || lane === "local";
}

/** The listing the directory publishes for a repository. */
export interface MergedListing {
  /** The record every design renders. */
  record: ScanRecord;
  /** Control ids whose verdict came solely from the local lane. */
  resolvedByLocal: string[];
  /** Control ids where sources disagreed and the row was scored as a gap. */
  contradictions: string[];
  /**
   * Class A/A'/B rows a local record asserted that stay `unverified` because
   * nothing independent has agreed with them yet.
   */
  awaitingIndependent: string[];
  /** True when the ONLY source is a local record. */
  localOnly: boolean;
}

/**
 * Merge every evidence source the directory holds for one repository.
 *
 * `sources` is ordered strongest-first; the first non-local source supplies the
 * listing's metadata (its commit, its run, its scanner version) and its scope.
 * With no non-local source the listing is local-only and the scope is the
 * directory's own non-meta control set.
 */
export function mergeEvidence(sources: readonly EvidenceSource[]): MergedListing {
  const independentSources = sources.filter((s) => s.lane !== "local");
  const base = independentSources[0];
  const localOnly = base === undefined;
  const primary = base ?? sources[0];
  if (!primary) throw new Error("mergeEvidence needs at least one source");

  // Scope. With a repository-observable base, the base defines it (the scan
  // pipeline computed it from the scanner's own registry defaults union the
  // target's committed config). Without one, the DIRECTORY defines it — a
  // local record may not choose its own denominator.
  const scopeIds: string[] = base
    ? base.record.controls.map((c) => c.id)
    : Object.keys(CONTROL_REGISTRY);
  const baseById = new Map((base?.record.controls ?? []).map((c) => [c.id, c]));

  const resolvedByLocal: string[] = [];
  const contradictions: string[] = [];
  const awaitingIndependent: string[] = [];

  const controls: ControlRecord[] = scopeIds.map((id) => {
    const cls = classOf(id); // fail closed on an unknown id
    const meta = CONTROL_REGISTRY[id]!;
    const baseRow = baseById.get(id);
    const skeleton: ControlRecord = {
      id,
      phase: meta.phase,
      in_scope: false,
      raw_outcome: baseRow?.raw_outcome ?? "info",
      scan_outcome: "info",
      reclassified: false,
      reason: null,
      messages: [],
      contradiction: null,
    };

    if (cls === "M") return { ...skeleton, reason: META_REASON };

    // Scope: the base's own flag, or (local-only) every non-meta control.
    const inScope = base ? (baseRow?.in_scope ?? false) : true;
    if (!inScope) {
      return {
        ...skeleton,
        raw_outcome: baseRow?.raw_outcome ?? "disabled",
        reason: OUT_OF_SCOPE_REASON,
        messages: baseRow?.messages ?? [],
      };
    }

    // LANE DISCIPLINE, applied before anything is counted. A source may only
    // contribute a verdict it was structurally capable of observing, and class
    // C is the development environment — commit-signing configuration,
    // installed hooks, a locally installed scanner. An action runner and an
    // external clone are both looking at a checkout, not at the maintainer's
    // machine, so neither can have observed one.
    //
    // Today's external lane already reclassifies class C to `unverified`, so
    // the live data holds. But nothing STOPPED a future action-lane record —
    // produced by a different program on a schedule nobody here controls — from
    // shipping `commit-signing: pass`, and this merge would have taken it at
    // face value: countable evidence, an "independent observation" satisfying
    // the requirement below for other rows, and a contradiction partner able to
    // knock a genuine local verdict down to a gap. Dropping it here is cheaper
    // than trusting every future producer to be honest about what it can see.
    const offered = contributionsFor(sources, id);
    const all = offered.filter((c) => isOnLane(cls, c.source));
    const offLane = offered.filter((c) => !isOnLane(cls, c.source));
    const independent = all.filter((c) => c.source !== "local");
    const localContribution = all.find((c) => c.source === "local");

    // The observability requirement. A local verdict on a class the world can
    // check counts only alongside an independent one.
    const countable =
      cls === "C" || independent.length > 0
        ? all
        : independent; /* = [] — the local row is held back */
    const heldBack = countable.length === 0 && localContribution !== undefined;
    if (heldBack) awaitingIndependent.push(id);

    const distinct = new Set(countable.map((c) => c.verdict));

    if (distinct.size >= 2) {
      contradictions.push(id);
      const notes: ContradictionNote[] = countable.map((c) => ({
        source: c.source,
        verdict: c.verdict,
      }));
      return {
        ...skeleton,
        in_scope: true,
        raw_outcome: baseRow?.raw_outcome ?? countable[0]!.row.raw_outcome,
        scan_outcome: "gap",
        reclassified: true,
        reason: contradictionReason(notes),
        messages: countable
          .flatMap((c) => c.row.messages.map((m) => `${c.source}: ${m}`))
          .slice(0, MAX_MESSAGES)
          .map(sanitizeMessage),
        contradiction: notes,
      };
    }

    if (distinct.size === 1) {
      const verdict = [...distinct][0]!;
      // Prefer an independent row's own text; fall back to the local one.
      const authoritative =
        countable.find((c) => c.source !== "local" && c.verdict === verdict) ??
        countable.find((c) => c.verdict === verdict)!;
      const soleLocal = countable.length === 1 && countable[0]!.source === "local";
      if (soleLocal) resolvedByLocal.push(id);
      return {
        id,
        phase: meta.phase,
        in_scope: true,
        raw_outcome: authoritative.row.raw_outcome,
        scan_outcome: verdict,
        reclassified: soleLocal ? true : authoritative.row.reclassified,
        reason: soleLocal ? LOCAL_ONLY_EVIDENCE_REASON : authoritative.row.reason,
        messages: authoritative.row.messages.slice(0, MAX_MESSAGES).map(sanitizeMessage),
        contradiction: null,
      };
    }

    // Nothing countable.
    const fallback = baseRow ?? localContribution?.row ?? null;
    const reason = heldBack
      ? AWAITING_INDEPENDENT_REASON
      : offLane.length > 0
        ? offLaneReason(offLane)
        : (fallback?.reason ?? NO_EVIDENCE_REASON);
    return {
      ...skeleton,
      in_scope: true,
      raw_outcome: fallback?.raw_outcome ?? "degraded",
      scan_outcome: "unverified",
      reclassified: heldBack || offLane.length > 0 ? true : (fallback?.reclassified ?? false),
      reason,
      messages: (fallback?.messages ?? []).slice(0, MAX_MESSAGES).map(sanitizeMessage),
    };
  });

  return {
    record: { ...primary.record, controls, score: computeScore(controls) },
    resolvedByLocal,
    contradictions,
    awaitingIndependent,
    localOnly,
  };
}
