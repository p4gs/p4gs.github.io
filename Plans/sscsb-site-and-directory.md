# SSCS Bootstrapper homepage + public scan directory

> **Architecture amendment (2026-09-01, owner decision):** originally planned
> inside p4gs/sscs-bootstrapper; restructured to THREE repos —
> tool (`sscs-bootstrapper`: the CLI + `verify/status --format json`),
> site (`p4gs.github.io`, this repo: landing at `/`, sscsb site at `/sscsb/`,
> scan records, all pipeline workflows), and action (`sscsb-action`:
> Marketplace-listed composite action for authenticated scans from a repo's
> own CI). Rationale: data-publish PRs escape the tool repo's ~8-min Rust
> required-check suite; public submission issues stay out of the tool tracker;
> the domain-router repo had to exist anyway; issue-ops binds the scan
> workflows to the repo where submissions are filed.

## Decisions
| Decision | Choice |
|---|---|
| Domain | `tools.sensiblesecurity.xyz` (Namecheap CNAME `tools` → p4gs.github.io), site path `/sscsb/` |
| Scan trust | Auto-scan, gated publish: isolated no-secrets scan job → issue comment → maintainer `publish` label → GitHub-App bot PR → human merge |
| Scoring | Letter grade + 5 phase bars; **A+ = exactly 100**, A ≥90, B ≥80, C ≥70, D ≥60, F <60; coverage <50% → NA, 50–75% → provisional; unverified/info never in any denominator |
| Auth'd lane | sscsb-action runs in the target's own CI → `action-scan-result` issue → directory-ingest.yml fetches the record artifact from the submitter's public run → same publish gate; detail pages carry a prefilled maintainer-nudge issue link |

## Honesty core (methodology v1)
Diff-based reclassification: snapshot `git ls-files` before `sscsb init`; any
control whose passing evidence init created scores **gap**. Five evidence
classes (A committed-artifacts / A′ workflow-audits / B live-remote / C
local-environment→unverified / M meta-excluded); fail-closed on unclassified
ids; the default-on denominator comes from a fresh-init report by the SAME
binary and cannot be shrunk by the target's config. Published at /sscsb/methodology/.

## Verification per stage (running log)
- Rust `--format json`: sscs-bootstrapper PR #50 (machine.rs 98.8% lines, suite green).
- Site: 41 bun tests incl. grade-boundary edges and the worked example (25.0% → F).
- Live: tools.sensiblesecurity.xyz serving /, /sscsb/, /sscsb/directory/, /sscsb/methodology/ (HTTP; HTTPS enforce pending cert issuance).
- Pending: sscsb-action repo + release + Marketplace checkbox (owner), GitHub App for publish gate (owner: DIRECTORY_BOT_APP_ID var + DIRECTORY_BOT_KEY secret), seed scans E2E, branch protection on this repo.
