/**
 * Emit the local-lane contract as shell variables, so the ingest workflow
 * QUOTES the contract instead of restating it.
 *
 * The previous ingest hard-coded `-n sscsb-scan-record` and
 * `.sscsb/scan-record.local.json` in YAML while the tool used a different
 * namespace and a different (gitignored) path. Both sides looked internally
 * consistent and the lane could never work. A workflow that sources these
 * lines cannot drift from the block the tool is tested against.
 *
 * Writes `KEY=value` lines to $GITHUB_ENV when set, and always prints them.
 */
import {
  LOCAL_ANCHOR_PATH,
  LOCAL_NAMESPACE,
  LOCAL_RECORD_PATH,
  LOCAL_SIGNATURE_PATH,
  LOCAL_SUBMISSION_LABEL,
} from "../local-contract";

export function contractEnvLines(): string[] {
  return [
    `SSCSB_LOCAL_NAMESPACE=${LOCAL_NAMESPACE}`,
    `SSCSB_LOCAL_RECORD_PATH=${LOCAL_RECORD_PATH}`,
    `SSCSB_LOCAL_SIGNATURE_PATH=${LOCAL_SIGNATURE_PATH}`,
    `SSCSB_LOCAL_ANCHOR_PATH=${LOCAL_ANCHOR_PATH}`,
    `SSCSB_LOCAL_LABEL=${LOCAL_SUBMISSION_LABEL}`,
  ];
}

if (import.meta.main) {
  const lines = contractEnvLines();
  const out = process.env.GITHUB_ENV;
  if (out) {
    await Bun.write(out, `${await Bun.file(out).text().catch(() => "")}${lines.join("\n")}\n`);
  }
  console.log(lines.join("\n"));
}
