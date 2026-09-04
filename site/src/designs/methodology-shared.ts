/**
 * Methodology copy that every design renders identically.
 *
 * WHY THIS FILE EXISTS. The evidence-class rules, the scan-protocol paragraph
 * and the changelog were four byte-identical copies, one per design, and they
 * had already started to drift: three designs rendered a literal backtick,
 * `sscsb init`, where the fourth rendered a proper `<code>` element. That is
 * the same argument `methodology-local.ts` already makes about the local lane —
 * four drifting copies of a scoring rule is exactly the failure this directory
 * exists to argue against — so the same remedy applies. Designs vary the shell;
 * the rules are identical everywhere.
 *
 * SENTENCE LENGTH IS PART OF THE CONTRACT HERE. The methodology page is the
 * most technical page on the site and is allowed to be, but it was measurably
 * out of step with every other page: a 13.2-word mean and one 70-word sentence
 * against roughly 8 words per sentence elsewhere. The copy below says exactly
 * what it said before, in sentences a reader can finish. `test/prose.test.ts`
 * measures the rendered pages and fails if that slips back.
 */

/** One evidence class, as the methodology table renders it. */
export interface EvidenceClassRule {
  name: string;
  rule: string;
}

export const EVIDENCE_CLASS_RULES: Readonly<Record<string, EvidenceClassRule>> =
  Object.freeze({
    A: {
      name: "A — committed artifacts",
      rule: "The control's evidence is files committed to the repository. The scanner snapshots that file list before it runs <code>sscsb init</code>. A registered artifact missing from that snapshot was installed by the scanner itself, so the control scores <strong>gap</strong>. Evidence the scanner installed seconds earlier is never the repository's evidence. A pre-existing artifact that fails sscsb's shape checks is a real <strong>fail</strong>. Five controls are different: secrets, sbom, vuln-scan, sast and provenance-verify. Their raw verdict only reflects which tools the scanning machine happened to have, so the committed artifacts decide instead.",
    },
    Aprime: {
      name: "A′ — static audits of committed workflows",
      rule: "actions-audit, workflow-audit-extended and harden-runner parse every workflow file. With zero pre-existing workflows the verdict would be vacuous, so it scores <strong>unverified</strong>. Otherwise the raw verdict maps directly. sscsb's own installed templates pass its audit by construction, so init can only push a verdict toward pass. A fail therefore always implicates the repository's own workflows.",
    },
    B: {
      name: "B — live remote checks",
      rule: "branch-protection and Scorecard query GitHub itself. Init cannot influence them, so raw verdicts map directly. Scorecard's live alert feed needs permissions a cross-repo scan does not have. That half is recorded as unverified, never guessed.",
    },
    C: {
      name: "C — local environment",
      rule: "Commit signing, signing-model posture, AI trailers and package-trust hooks describe the <em>development machine</em>. No repository scan can observe that machine — not from inside CI, not from outside. A repository scan therefore records these as <strong>unverified</strong>. An unperformed check is a third state, never a pass or a fail. Class C is the one class a signed local record can settle <strong>by itself</strong>. There, the maintainer's signed word is the best evidence that can exist. It is <em>not</em> the only class a local record may resolve. A local record votes on every control it holds. Its verdict on a class A, A′ or B row becomes countable as soon as an independent record agrees with it. If one disagrees, the row scores a gap. See “the local lane” below.",
    },
    M: {
      name: "M — meta / informational",
      rule: "compliance-map (about sscsb itself) and secure-repo (an external service pointer) are excluded from scoring entirely.",
    },
  });

/**
 * The scan-protocol opening paragraph. `v` is the methodology version, which
 * every design already has in scope.
 */
export function scanProtocolIntro(v: string | number): string {
  return `<p>This directory measures <strong>sscsb-control adoption</strong> — how much of the
    supply-chain posture sscsb can bootstrap and verify a repository has actually
    committed to. It is not a general security audit. In methodology v${v}, a repository
    using an equivalent tool sscsb doesn't model scores a gap for that control —
    Dependabot in place of Renovate, say. Tool-equivalence mapping is a roadmap item for
    a future methodology version. Every version bump is recorded here and displayed on
    each repo's page.</p>`;
}

/**
 * The changelog entries, newest concern last, as `<li>` elements. `localHref`
 * is the design's already-prefixed link to the local-lane section — every href
 * on this site must carry BASE_PATH, so the caller supplies it.
 *
 * `includeProvenance` is the one genuine per-design difference: the ledger
 * design carries the trust-chain section, so it also carries the entry that
 * describes it.
 */
export function changelogItems(
  localHref: string,
  opts: { includeProvenance?: boolean } = {},
): string {
  const provenance = opts.includeProvenance
    ? `\n    <li><strong>v1, 2026-09</strong> — authenticated records are signed and verified against the producing workflow's identity. Scoring is unchanged: provenance is displayed, not scored.</li>`
    : "";
  return `<li><strong>v1</strong> — initial methodology: diff-based init reclassification, five evidence classes, and an academic grade scale with A+ reserved for exactly 100%.</li>${provenance}
    <li><strong>v1, 2026-09</strong> — the <a href="${localHref}">local lane</a>. A maintainer-signed workstation record, verified against the repository's own committed <code>allowed_signers</code>, joins the action and external records as an evidence source. Verdicts are merged per control. Sources that disagree score a <strong>gap</strong> with a named contradiction. A local assertion about a control a repository scan could observe is not counted until an independent record agrees with it. Class rules, the formula and the grade scale are unchanged.</li>`;
}
