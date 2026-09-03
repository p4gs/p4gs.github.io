/**
 * Reading a repository's COMMITTED `.sscsb/policy/allowed_signers` well enough
 * to answer one question: could `sscsb scan --local` actually work here?
 *
 * # Why the directory needs to know
 *
 * Every provisional listing whose holes are class C gets the same nudge —
 * "the maintainer closes this in one line: `sscsb scan --local --submit`". That
 * sentence is false for any repository whose anchor predates the local lane.
 * `sscsb init` used to write `namespaces="git"`, and the tool refuses rather
 * than mint a record that cannot verify, so a maintainer following the
 * directory's advice hits a wall the directory could have seen coming and told
 * them about. Since v0.3.2 the grant is also class-scoped — only
 * `class = "human"` signers get `sscsb-scan-record` — so an anchor listing only
 * CI keys is the same dead end.
 *
 * Both cases are visible in the committed file, which the external scan already
 * has in its clone. So the scan records what it saw, and the nudge tells the
 * truth: regenerate and commit the anchor first, THEN run the scan.
 *
 * # The parser
 *
 * A deliberately small mirror of `parse_allowed_signers` in the tool's
 * `src/local_scan.rs`, with the same two rules that matter here:
 *
 *   - a line with no `namespaces=` option permits every namespace (OpenSSH's
 *     own rule);
 *   - a line WITH one permits exactly what it lists. `*` is not expanded —
 *     reading a wildcard as "everything" would let a line written to scope a
 *     key narrowly widen itself here.
 *
 * Unparseable lines are skipped rather than fatal, for the same reason the tool
 * skips them: this file can be hand-edited in a repository we did not generate
 * it in, and one bad line must not hide a real grant on the next one.
 *
 * This is a READINESS SIGNAL for a nudge. It authorizes nothing: the signature
 * itself is verified at ingest against the anchor fetched from the repository
 * at the record's own commit, by `ssh-keygen`, never by this code.
 */

import { LOCAL_NAMESPACE } from "./local-contract";

export interface AnchorLine {
  principals: string[];
  /** `null` when the line carries no `namespaces=` option (permits all). */
  namespaces: string[] | null;
}

/** Split a line on whitespace, keeping a double-quoted run as one token. */
function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  let started = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      started = true;
    } else if (/\s/.test(ch) && !inQuotes) {
      if (started) {
        out.push(cur);
        cur = "";
        started = false;
      }
    } else {
      cur += ch;
      started = true;
    }
  }
  if (started) out.push(cur);
  return out;
}

const isKeyType = (t: string): boolean =>
  t.startsWith("ssh-") || t.startsWith("ecdsa-") || t.startsWith("sk-");

export function parseAnchor(text: string): AnchorLine[] {
  const out: AnchorLine[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const tokens = tokenize(line);
    const keyIdx = tokens.findIndex(isKeyType);
    if (keyIdx <= 0 || keyIdx + 1 >= tokens.length) continue;
    const principals = tokens[0]!.split(",").filter((p) => p.length > 0);
    if (principals.length === 0) continue;
    let namespaces: string[] | null = null;
    for (const opt of tokens.slice(1, keyIdx)) {
      if (opt.startsWith("namespaces=")) {
        namespaces = opt.slice("namespaces=".length).split(",").filter((n) => n.length > 0);
      }
    }
    out.push({ principals, namespaces });
  }
  return out;
}

/** Does any line in this anchor permit signing in `namespace`? */
export function grantsNamespace(text: string, namespace = LOCAL_NAMESPACE): boolean {
  return parseAnchor(text).some((l) => l.namespaces === null || l.namespaces.includes(namespace));
}

/**
 * What an external scan observed about the target's local-lane readiness, at
 * the scanned commit. Additive and optional on the record: a lane that did not
 * look does not claim to have looked.
 */
export interface LocalLaneReadiness {
  /** `.sscsb/policy/allowed_signers` is committed at all. */
  anchor_committed: boolean;
  /** Some approved signer is permitted to sign in the scan-record namespace. */
  scan_namespace_granted: boolean;
}

/** Read the readiness signal off the committed anchor's bytes (null = absent). */
export function readinessFrom(anchor: string | null): LocalLaneReadiness {
  if (anchor === null) return { anchor_committed: false, scan_namespace_granted: false };
  return { anchor_committed: true, scan_namespace_granted: grantsNamespace(anchor) };
}
