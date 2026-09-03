/**
 * THE LOCAL-LANE CONTRACT — a verbatim mirror of the fenced ```contract block
 * in the tool's `docs/local-scan.md`.
 *
 * This file is the reason the lane works end to end. The previous cut of it
 * did not: the tool signed `sscsb-local-scan` over a `verify --format json`
 * document written to the gitignored `.sscsb/out/scan-local.json` and submitted
 * inline, while this site verified `sscsb-scan-record` over a `ScanRecord`
 * fetched from the committed `.sscsb/scan-record.local.json` — four
 * independent mismatches, each of which alone made every submission fail, and
 * none of which any test could see because the two trees each restated the
 * contract in their own words.
 *
 * So the contract is written ONCE, and both trees quote it:
 *
 *   - the tool asserts every line against its own Rust constants in
 *     `tests/local_scan_docs.rs`, and pins `CONTRACT_DIGEST`;
 *   - this site asserts every line against its own TypeScript constants in
 *     `site/test/local.test.ts`, and pins the SAME digest.
 *
 * Edit one copy without the other and one of those two tests fails. Nothing
 * here may be paraphrased: `CONTRACT_TEXT` is the block, byte for byte.
 */

import { createHash } from "node:crypto";

/** The block, verbatim. Keep the two-or-more-space alignment — it is parsed. */
export const CONTRACT_TEXT = `sscsb local-lane contract v1
command              sscsb scan --local --submit
sshsig-namespace     sscsb-scan-record
record-path          .sscsb/scan-record.local.json
signature-path       .sscsb/scan-record.local.json.sig
anchor-path          .sscsb/policy/allowed_signers
anchor-namespaces    git,sscsb-scan-record
signed-bytes         the bytes of .sscsb/scan-record.local.json, verbatim
record-shape         ScanRecord
schema-version       1
methodology-version  1
record-fields        schema_version methodology_version repo scanned_at scanner request_issue controls score
repo-fields          owner name url default_branch commit description
control-fields       id phase in_scope raw_outcome scan_outcome reclassified reason messages
score-fields         grade provisional overall_percent evidence_coverage_percent phases
submission-label     local-scan-result`;

export const CONTRACT_HEADER = "sscsb local-lane contract v1";

/**
 * The digest BOTH trees pin: sha256 over `key=value\n` lines, keys sorted, the
 * header excluded. Sorted rather than source-ordered so a purely cosmetic
 * reordering of the block does not read as a contract change.
 */
export const CONTRACT_DIGEST =
  "6f7f55db83c16865499db2230ef7aed46982cc84e16bdd550e44b6754d991227";

/** Parse the block: `key`, two-or-more spaces, `value`. */
export function parseContract(text: string = CONTRACT_TEXT): Map<string, string> {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const header = lines.shift();
  if (header !== CONTRACT_HEADER) {
    throw new Error(`contract block must open with "${CONTRACT_HEADER}", got "${header}"`);
  }
  const out = new Map<string, string>();
  for (const line of lines) {
    const m = line.trimEnd().match(/^(\S+)\s{2,}(.+)$/);
    if (!m) throw new Error(`contract line has no value: ${JSON.stringify(line)}`);
    if (out.has(m[1]!)) throw new Error(`contract key declared twice: ${m[1]}`);
    out.set(m[1]!, m[2]!.trim());
  }
  return out;
}

/** The digest, computed the same way the tool computes it. */
export function contractDigest(text: string = CONTRACT_TEXT): string {
  const parsed = parseContract(text);
  const normalized = [...parsed.keys()]
    .sort()
    .map((k) => `${k}=${parsed.get(k)}\n`)
    .join("");
  return createHash("sha256").update(normalized).digest("hex");
}

const CONTRACT = parseContract();

function required(key: string): string {
  const v = CONTRACT.get(key);
  if (v === undefined) throw new Error(`the contract has no \`${key}\` line`);
  return v;
}

/** `sscsb scan --local --submit` — the one command the whole UX renders. */
export const LOCAL_COMMAND = required("command");
/** The SSHSIG namespace `ssh-keygen -Y verify` is given at ingest. */
export const LOCAL_NAMESPACE = required("sshsig-namespace");
/** The COMMITTED path ingest fetches the record from. */
export const LOCAL_RECORD_PATH = required("record-path");
/** The COMMITTED path ingest fetches the detached signature from. */
export const LOCAL_SIGNATURE_PATH = required("signature-path");
/** The COMMITTED trust anchor, fetched at the record's own commit. */
export const LOCAL_ANCHOR_PATH = required("anchor-path");
/** The `namespaces="…"` grant `sscsb init` writes into the anchor. */
export const LOCAL_ANCHOR_NAMESPACES = required("anchor-namespaces");
/** The issue label the `ingest_local` job keys on. */
export const LOCAL_SUBMISSION_LABEL = required("submission-label");
/** Record schema version the signed bytes declare. */
export const LOCAL_SCHEMA_VERSION = Number(required("schema-version"));
/** Methodology version the signed bytes declare. */
export const LOCAL_METHODOLOGY_VERSION = Number(required("methodology-version"));
/** Top-level fields the signed record must carry. */
export const LOCAL_RECORD_FIELDS = required("record-fields").split(/\s+/);
/** `repo` sub-fields the signed record must carry. */
export const LOCAL_REPO_FIELDS = required("repo-fields").split(/\s+/);
/** `controls[]` fields the signed record must carry. */
export const LOCAL_CONTROL_FIELDS = required("control-fields").split(/\s+/);
/** `score` sub-fields the signed record must carry. */
export const LOCAL_SCORE_FIELDS = required("score-fields").split(/\s+/);
