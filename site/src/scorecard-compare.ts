/**
 * OpenSSF Scorecard, side by side with sscsb.
 *
 * The two tools answer different questions, and the comparison is only
 * honest if that is said plainly rather than scored as a contest.
 *
 * THEY ARE NOT COMPETITORS, AND AN EARLIER DRAFT OF THIS FILE GOT IT WRONG.
 * It said Scorecard "rates a repository from the outside, with no help from
 * the maintainer" and "works on repositories that never opted in". That is
 * not how Scorecard is normally used: its own front page leads with "run
 * automatically on code you own using the GitHub Action", which is a
 * maintainer opt-in exactly like sscsb's. A third party CAN run the CLI
 * against someone else's repository, but that is the secondary path, not the
 * defining one. sscsb itself installs `.github/workflows/scorecard.yml` and
 * ships Scorecard as one of its own 44 controls.
 *
 * The real difference is WHAT EACH CAN SEE, and what it does about it:
 *
 *   - Scorecard reads the repository and its forge — branch rules, workflow
 *     files, history, manifests, releases — and returns 0-10 per check.
 *   - sscsb reads that too, and additionally the maintainer's own machine:
 *     whether the hooks are really installed, how signing is configured,
 *     whether an agent's commits are gated. That is the whole reason this
 *     site has a local-evidence class and Scorecard has no equivalent.
 *   - Scorecard rates. sscsb configures, then verifies what it configured,
 *     and reports DEGRADED when a tool is missing instead of scoring the
 *     absence as a low number indistinguishable from a real failure.
 *
 * Where they overlap, sscsb routes the Scorecard finding to the control that
 * owns it rather than re-gating on another tool's rubric — see
 * `scorecard.rs`'s CHECK_MAP, which this mirrors.
 *
 * SOURCES, both fetched rather than recalled:
 *   - Scorecard checks + risk levels: github.com/ossf/scorecard/docs/checks.md
 *   - sscsb control ids: test/fixtures/rust-control-ids.txt, which
 *     control-registry.test.ts pins against the Rust registry itself.
 */

/** How sscsb relates to a given Scorecard check. */
export type Coverage =
  /** sscsb has one or more controls that check the same property. */
  | "covered"
  /** sscsb checks it, but from a different angle — the note says how. */
  | "partial"
  /** No sscsb control checks this. Said plainly, not hidden. */
  | "none";

export interface ScorecardRow {
  /** Check name exactly as Scorecard publishes it. */
  check: string;
  /** Scorecard's own risk label. */
  risk: "Critical" | "High" | "Medium" | "Low";
  /** Scorecard's own one-line description. */
  what: string;
  coverage: Coverage;
  /** sscsb control ids that speak to this check. */
  controls: readonly string[];
  /** One line on how the two differ. Empty when they simply agree. */
  note?: string;
}

/**
 * All 20 Scorecard checks. Not a subset: a comparison that silently drops
 * the checks we do not cover would be marketing, not methodology.
 */
export const SCORECARD_ROWS: readonly ScorecardRow[] = [
  {
    check: "Binary-Artifacts",
    risk: "High",
    what: "Detects generated executable artifacts in source repository",
    coverage: "none",
    controls: [],
    note: "No sscsb control checks for committed binaries. A real gap, not a deliberate omission.",
  },
  {
    check: "Branch-Protection",
    risk: "High",
    what: "Ensures default and release branches use protection settings or repository rules",
    coverage: "covered",
    controls: ["branch-protection"],
    note: "sscsb also verifies that protection actually blocks an unsigned commit, not only that a setting is on.",
  },
  {
    check: "CI-Tests",
    risk: "Low",
    what: "Determines if project runs tests before pull requests merge",
    coverage: "none",
    controls: [],
    note: "Out of scope by design: sscsb checks supply-chain posture, not whether a project tests itself.",
  },
  {
    check: "CII-Best-Practices",
    risk: "Low",
    what: "Checks for OpenSSF Best Practices Badge at passing, silver, or gold level",
    coverage: "partial",
    controls: ["best-practices-badge"],
    note: "sscsb records that the self-assessment exists; earning the badge is an owner action it cannot perform.",
  },
  {
    check: "Code-Review",
    risk: "High",
    what: "Verifies project requires human code review before merging pull requests",
    coverage: "partial",
    controls: ["branch-protection", "pr-template"],
    note: "Structurally capped for a solo maintainer: Scorecard counts approved changesets, and one person merging their own pull requests scores zero however the branch is protected.",
  },
  {
    check: "Contributors",
    risk: "Low",
    what: "Assesses if project has recent contributors from multiple organizations",
    coverage: "none",
    controls: [],
    note: "Measures project social structure, which sscsb makes no claim about.",
  },
  {
    check: "Dangerous-Workflow",
    risk: "Critical",
    what: "Identifies dangerous patterns in GitHub Action workflows",
    coverage: "covered",
    controls: ["workflow-audit-extended", "actions-audit"],
    note: "sscsb parses committed workflows per job and reads shell bodies, so a signing step whose failure is swallowed does not count as present.",
  },
  {
    check: "Dependency-Update-Tool",
    risk: "High",
    what: "Checks if project uses automated dependency update tools",
    coverage: "covered",
    controls: ["renovate"],
  },
  {
    check: "Fuzzing",
    risk: "Medium",
    what: "Determines if project uses fuzzing or property-based testing",
    coverage: "covered",
    controls: ["fuzzing"],
    note: "Off by default in sscsb; enabling it is a deliberate choice, and off means the code does not run.",
  },
  {
    check: "License",
    risk: "Low",
    what: "Verifies project has published a software license",
    coverage: "none",
    controls: [],
    note: "Licensing is a legal property, not a supply-chain control.",
  },
  {
    check: "Maintained",
    risk: "High",
    what: "Assesses whether project is actively maintained",
    coverage: "none",
    controls: [],
    note: "Scores zero for any repository under 90 days old, which no action can change. sscsb makes no maintenance claim.",
  },
  {
    check: "Packaging",
    risk: "Medium",
    what: "Checks if project is published as a downloadable package",
    coverage: "partial",
    controls: ["release-immutability"],
    note: "sscsb cares whether a published release can be altered after the fact, not whether one exists.",
  },
  {
    check: "Pinned-Dependencies",
    risk: "Medium",
    what: "Verifies dependencies are pinned to specific versions or hashes",
    coverage: "covered",
    controls: ["actions-audit", "renovate"],
    note: "sscsb SHA-pins every action except the SLSA generator, which must stay tag-pinned because slsa-verifier validates the trusted builder's ref and rejects a digest.",
  },
  {
    check: "SAST",
    risk: "Medium",
    what: "Determines if project uses static application security testing",
    coverage: "covered",
    controls: ["sast", "codeql"],
    note: "sscsb runs SAST at pre-commit as well as in CI, so a finding is caught before it is ever pushed.",
  },
  {
    check: "SBOM",
    risk: "Medium",
    what: "Checks for Software Bill of Materials in source or release artifacts",
    coverage: "covered",
    controls: ["sbom", "sbom-attestation"],
    note: "sscsb additionally binds the SBOM to the artifact by attestation, so it cannot be swapped after the build.",
  },
  {
    check: "Security-Policy",
    risk: "Medium",
    what: "Verifies project has published a security vulnerability reporting policy",
    coverage: "covered",
    controls: ["security-insights"],
  },
  {
    check: "Signed-Releases",
    risk: "High",
    what: "Checks if project cryptographically signs release artifacts",
    coverage: "covered",
    controls: ["sigstore-signing", "slsa-provenance", "provenance-verify", "github-attestations"],
    note: "Overlap is thinner than the names suggest. Scorecard scores this by FILENAME — it looks for a *.sig or *.intoto.jsonl beside the last five releases and its own docs say it does not verify them. sscsb runs cosign verify-blob and slsa-verifier against the release workflow's certificate identity before publishing, and fails the release closed. An empty file renamed to release.tar.gz.sig scores 8 there and fails here.",
  },
  {
    check: "Token-Permissions",
    risk: "High",
    what: "Ensures automated workflow tokens follow least privilege principle",
    coverage: "covered",
    controls: ["actions-audit", "octo-sts", "harden-runner"],
    note: "sscsb also replaces long-lived tokens with short-lived federated credentials rather than only narrowing scopes.",
  },
  {
    check: "Vulnerabilities",
    risk: "High",
    what: "Identifies open, unfixed vulnerabilities in codebase or dependencies",
    coverage: "covered",
    controls: ["vuln-scan", "grype", "openvex", "dependency-track"],
    note: "sscsb can record an assessed VEX judgement, so a vulnerability that genuinely does not apply is suppressed visibly rather than silently.",
  },
  {
    check: "Webhooks",
    risk: "Critical",
    what: "Verifies repository webhooks have token authentication configured",
    coverage: "none",
    controls: [],
    note: "No sscsb control inspects webhook configuration. A real gap.",
  },
];

/** A thing sscsb checks that Scorecard has no equivalent for. */
export interface OnlyRow {
  title: string;
  controls: readonly string[];
  what: string;
}

/**
 * The other direction. Scorecard rates from outside a repository, so the
 * whole class of "what happens on the maintainer's machine, before a commit
 * exists" is invisible to it — which is most of this list.
 */
export const SSCSB_ONLY: readonly OnlyRow[] = [
  {
    title: "An AI agent cannot land a commit",
    controls: ["commit-signing", "agent-signing", "signing-model"],
    what: "Signing identities are classified, and only a human-class key satisfies the protected-branch policy. An agent can draft anything; it cannot land it.",
  },
  {
    title: "AI-authored changes are declared and gated",
    controls: ["ai-trailers", "ai-dep-gate", "ai-receipts"],
    what: "Commits record which model and tool produced them, and an AI commit that adds a dependency or a shell command hits an extra gate.",
  },
  {
    title: "Secrets are blocked before they exist",
    controls: ["secrets"],
    what: "Two scanners run at pre-commit and pre-push, so a credential never reaches the remote in the first place. Scorecard can only observe what was already pushed.",
  },
  {
    title: "A new dependency needs approval",
    controls: ["package-trust"],
    what: "Checks that a package exists, is not a look-alike of a popular name, and was approved by a human before it entered the tree.",
  },
  {
    title: "Build provenance is verified, not just produced",
    controls: ["provenance-verify", "slsa-provenance", "octo-sts"],
    what: "The release is gated on verifying its own provenance against a pinned trusted builder before anything is published.",
  },
  {
    title: "Releases cannot be altered after publication",
    controls: ["release-immutability"],
    what: "Assets and tags are frozen once a release is published.",
  },
  {
    title: "Ref history itself is protected",
    controls: ["gittuf"],
    what: "Signed, forge-independent policy over who may change which refs — protection that survives the forge being wrong.",
  },
  {
    title: "Every control maps to a framework",
    controls: ["compliance-map", "osps-baseline", "security-insights"],
    what: "Each control is mapped to SLSA, SSDF, the CRA and the OpenSSF Baseline, so the posture can be read as compliance evidence.",
  },
  {
    title: "A missing tool degrades loudly",
    controls: [],
    what: "If a scanner is not installed, sscsb says so and reports DEGRADED. It never scores the absence of a check as a pass, and never as a low number you cannot tell apart from a real failure.",
  },
];

export interface CompareTotals {
  scorecardChecks: number;
  covered: number;
  partial: number;
  none: number;
  sscsbOnly: number;
}

export function compareTotals(): CompareTotals {
  return {
    scorecardChecks: SCORECARD_ROWS.length,
    covered: SCORECARD_ROWS.filter((r) => r.coverage === "covered").length,
    partial: SCORECARD_ROWS.filter((r) => r.coverage === "partial").length,
    none: SCORECARD_ROWS.filter((r) => r.coverage === "none").length,
    sscsbOnly: SSCSB_ONLY.length,
  };
}
