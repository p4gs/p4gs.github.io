/**
 * Render the issue-comment summary for a completed scan. Reads the record
 * from RECORD_PATH, writes markdown to COMMENT_PATH (consumed via
 * `gh issue comment --body-file` — never shell-interpolated).
 */
import { PHASE_NAMES } from "../designs/ledger/components";
import { validateScanRecord } from "../schema";
import { trustKind, validateTrustInfo, type TrustInfo } from "../trust";

/** Markdown-escape untrusted text destined for a GitHub comment. */
export function mdEscape(s: string): string {
  return s.replace(/([\\`*_{}\[\]<>#+|])/g, "\\$1");
}

/** One line describing provenance; empty for external scans (nothing to claim). */
export function trustLine(t: TrustInfo | undefined): string {
  switch (trustKind(t)) {
    case "verified":
      return `Signature: **verified** — bundle verified against \`${mdEscape(t?.identity ?? "")}\`${
        t?.commit ? ` (commit \`${mdEscape(t.commit.slice(0, 12))}\`)` : ""
      }`;
    case "unsigned-action":
      return "Signature: **none** — submitted from the repository's CI without a signature, so this can only be listed as an unverified claim (grant the scan job `id-token: write` to sign the next record)";
    case "local":
      return `Signature: **verified (local lane)** — detached SSH signature checked with \`ssh-keygen -Y verify\` against this repository's committed \`.sscsb/policy/allowed_signers\` at commit \`${mdEscape(
        (t?.commit ?? "").slice(0, 12),
      )}\`, signer \`${mdEscape(t?.signer ?? "")}\`. This is a workstation record. Its verdicts are merged with every other evidence source for this repository: sources that disagree score a gap, and an assertion about a control a repository scan could observe is not counted until an independent record agrees with it.`;
    default:
      return "";
  }
}

export function renderComment(recordJson: unknown, trust?: TrustInfo): string {
  const r = validateScanRecord(recordJson);
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const phaseLines = r.score.phases
    .map((p) => {
      const pct = p.percent === null ? "no evidence" : `${p.percent}%`;
      return `| ${PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`} | ${p.pass} | ${p.fail + p.gap} | ${p.unverified} | ${pct} |`;
    })
    .join("\n");
  const grade = r.score.provisional ? `${r.score.grade} (provisional)` : r.score.grade;
  return `## sscsb scan complete: \`${mdEscape(slug)}\`

**Grade: ${grade}** — overall ${r.score.overall_percent ?? "no evidence"}%, evidence coverage ${r.score.evidence_coverage_percent}%
Scanned commit \`${r.repo.commit.slice(0, 12)}\` on \`${mdEscape(r.repo.default_branch)}\` with sscsb ${mdEscape(r.scanner.sscsb_version)} · [run](${r.scanner.workflow_run_url})
${trustLine(trust) ? `${trustLine(trust)}\n` : ""}
| Phase | Pass | Fail/Gap | Unverified | Score |
|---|---|---|---|---|
${phaseLines}

Unverified controls are excluded from every denominator — an unperformed check is never a verdict. Full per-control detail ships with the published record; a maintainer reviews before this listing appears in the directory.

*A maintainer can publish this result by applying the \`publish\` label.*`;
}

if (import.meta.main) {
  const record = await Bun.file(process.env.RECORD_PATH ?? "scan-record.json").json();
  const trustPath = process.env.TRUST_PATH ?? "";
  const trust = trustPath && (await Bun.file(trustPath).exists())
    ? validateTrustInfo(await Bun.file(trustPath).json())
    : undefined;
  const md = renderComment(record, trust);
  await Bun.write(process.env.COMMENT_PATH ?? "scan-comment.md", md);
  console.log("comment rendered");
}
