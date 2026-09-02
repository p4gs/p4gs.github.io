/**
 * Render the issue-comment summary for a completed scan. Reads the record
 * from RECORD_PATH, writes markdown to COMMENT_PATH (consumed via
 * `gh issue comment --body-file` — never shell-interpolated).
 */
import { PHASE_NAMES } from "../designs/ledger/components";
import { validateScanRecord } from "../schema";

/** Markdown-escape untrusted text destined for a GitHub comment. */
export function mdEscape(s: string): string {
  return s.replace(/([\\`*_{}\[\]<>#+|])/g, "\\$1");
}

export function renderComment(recordJson: unknown): string {
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

| Phase | Pass | Fail/Gap | Unverified | Score |
|---|---|---|---|---|
${phaseLines}

Unverified controls are excluded from every denominator — an unperformed check is never a verdict. Full per-control detail ships with the published record; a maintainer reviews before this listing appears in the directory.

*A maintainer can publish this result by applying the \`publish\` label.*`;
}

if (import.meta.main) {
  const record = await Bun.file(process.env.RECORD_PATH ?? "scan-record.json").json();
  const md = renderComment(record);
  await Bun.write(process.env.COMMENT_PATH ?? "scan-comment.md", md);
  console.log("comment rendered");
}
