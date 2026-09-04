/**
 * Every check, as a question a non-expert can answer yes or no to.
 *
 * Modelled directly on scorecard.dev, which is the measured best practice for
 * this exact problem: 18 check descriptions, mean 8.7 words, median 9, max 13,
 * every one phrased as a yes/no question, and jargon named rather than
 * explained ("e.g. Dependabot, RenovateBot"). The `id` stays visible beside the
 * question — it is what a maintainer greps for — but it is no longer the only
 * thing a reader is given.
 *
 * The rules, enforced by `site/test/checks.test.ts`:
 *   - every control in the registry has a question, and nothing has a question
 *     without being in the registry (fail-closed, like every other table here);
 *   - each question ends in "?" and runs 5–14 words;
 *   - no question uses a term `glossary.ts` retires, so these are safe to print
 *     on the home page, where the reader has learned nothing yet.
 */

import { CONTROL_REGISTRY } from "./reclassify";

export const CHECK_QUESTIONS: Readonly<Record<string, string>> = Object.freeze({
  // Phase 1 — local source integrity
  secrets: "Are secrets blocked before they can be committed?",
  "commit-signing": "Are commits on protected branches signed by a person?",
  "agent-signing": "Do AI agents sign their commits with their own key?",
  "signing-model": "Is signing set up the same way in every environment?",
  "branch-protection": "Does the main branch require review before anything merges?",
  "actions-audit": "Are build steps pinned to an exact version, with narrow permissions?",
  gittuf: "Is there a signed policy for who may change which branches?",
  "ai-trailers": "Do commits record which AI tool and model helped write them?",
  "ai-dep-gate": "Do AI commits that add dependencies get extra review?",
  "pr-template": "Does the pull-request template ask what an AI generated?",
  "ai-receipts": "Is there a signed receipt linking a commit to its AI tool?",
  // Phase 2 — dependency & vulnerability visibility
  sbom: "Does the project publish a list of what it is made of?",
  "vuln-scan": "Is the project scanned for publicly known vulnerabilities?",
  scorecard: "Does the project publish an OpenSSF Scorecard result?",
  renovate: "Are dependency updates automated and pinned to exact versions?",
  "package-trust": "Is a new dependency checked before anyone installs it?",
  bumblebee: "Are installed tools and extensions checked against known compromises?",
  grype: "Is that parts list itself scanned for known vulnerabilities?",
  "socket-firewall": "Are malicious packages blocked at the moment of install?",
  // Phase 3 — provenance, signing & credential federation
  "sigstore-signing": "Are released files signed so anyone can check them?",
  "slsa-provenance": "Does every build publish a receipt saying how it was made?",
  "github-attestations": "Does the build publish that receipt through GitHub itself?",
  "sbom-attestation": "Is the parts list signed and tied to the file it describes?",
  "model-signing": "Are machine-learning model files signed?",
  "provenance-verify": "Are build receipts checked before anything is published?",
  "release-immutability": "Are release files attached before the release goes public?",
  "octo-sts": "Does the build use short-lived credentials instead of stored tokens?",
  "harden-runner": "Is each build job watched for unexpected network traffic?",
  witness: "Are the build steps themselves recorded and checked against a policy?",
  // Phase 4 — deeper code security & CI hardening
  sast: "Is the code checked for known-dangerous patterns before merging?",
  sighthound: "Is that check also run locally, before a commit lands?",
  codeql: "Is the code analysed in depth on every pull request?",
  fuzzing: "Is the code fed random input continuously to find crashes?",
  "workflow-audit-extended": "Are risky build triggers and secret handling audited?",
  "secure-repo": "Has the repository been through a guided hardening setup?",
  "wait-for-secrets": "Does releasing require a person to hand over the secret?",
  // Phase 5 — observability & governance
  "dependency-track": "Are parts lists tracked over time, not just at build time?",
  guac: "Are receipts and parts lists linked into one searchable graph?",
  openvex: "Does the project say which vulnerabilities actually apply to it?",
  oras: "Are parts lists and receipts stored where anyone can fetch them?",
  "security-insights": "Does the project publish a machine-readable security summary?",
  "best-practices-badge": "Does the project hold an OpenSSF Best Practices badge?",
  "osps-baseline": "Are the enabled checks mapped to the OSPS Baseline?",
  "compliance-map": "Are the checks mapped to the frameworks an auditor asks about?",
});

/** Fail-closed: a control with no question is an error, never a blank. */
export function questionFor(controlId: string): string {
  const q = CHECK_QUESTIONS[controlId];
  if (!q) {
    throw new Error(
      `control "${controlId}" has no plain-English question — add it to CHECK_QUESTIONS`,
    );
  }
  return q;
}

/** The same drift guard the evidence and threat tables carry. */
export function assertQuestionParity(): void {
  const missing = Object.keys(CONTROL_REGISTRY).filter((id) => !CHECK_QUESTIONS[id]);
  const extra = Object.keys(CHECK_QUESTIONS).filter((id) => !(id in CONTROL_REGISTRY));
  if (missing.length) throw new Error(`controls with no question: ${missing.join(", ")}`);
  if (extra.length) throw new Error(`questions for unknown controls: ${extra.join(", ")}`);
}
