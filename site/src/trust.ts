/**
 * Trust sidecar for a published record — WHICH lane produced it and whether
 * that provenance was cryptographically proven. Kept OUT of the scan record
 * on purpose: the record is the signed artifact, and mutating it would
 * invalidate the very signature this file describes.
 *
 * Written by directory-ingest.yml (authenticated lane) after `cosign
 * verify-blob`; external scans have no sidecar and are `external` by
 * construction. Published beside the record so anyone can re-verify.
 *
 * Three lanes:
 *   external — the directory cloned a public repo and scanned it. No sidecar
 *              exists; this is the state by construction.
 *   action   — the repository's OWN CI produced the record and keyless-signed
 *              it; ingest verified the Sigstore bundle against the canonical
 *              workflow identity on the live default branch.
 *   local    — a maintainer ran the contract's command on a workstation and
 *              signed the record with their git signing key; ingest verified
 *              the detached SSH signature with `ssh-keygen -Y verify` against
 *              `.sscsb/policy/allowed_signers` FETCHED FROM THE PUBLIC REPO at
 *              the scanned commit. That proves exactly one thing: a holder of
 *              a key the repository commits as an approved signer asserts this
 *              result at that commit. It is attributable and auditable, and
 *              strictly WEAKER than the action lane, which proves the
 *              repository's own CI ran the scan.
 *
 * Every lane's verdicts are MERGED per control (reclassify.ts mergeEvidence):
 * sources that agree give that verdict, sources that disagree score a gap with
 * a named contradiction, and a local assertion about a control a repository
 * scan could observe is held back until something independent agrees with it.
 */

import { SITE_REPO_URL } from "./config";
import { LOCAL_NAMESPACE } from "./local-contract";
import type { ScanRecord } from "./schema";

export const TRUST_SCHEMA_VERSION = 1;

export type Lane = "external" | "action" | "local";
export type SignatureState = "verified" | "absent";

export interface TrustInfo {
  schema_version: number;
  lane: Lane;
  signature: SignatureState;
  /** The pinned certificate identity the bundle verified against, when verified. */
  identity: string | null;
  /** The record commit the certificate was bound to (--certificate-github-workflow-sha). */
  commit: string | null;
  verified_at: string | null;
  /** Filename of the Sigstore bundle published beside the record, when signed. */
  bundle: string | null;
  /**
   * LOCAL LANE ONLY — the `allowed_signers` principal whose entry verified the
   * detached SSH signature (`ssh-keygen -Y verify -I <signer>`). Null on every
   * other lane.
   */
  signer: string | null;
  /** LOCAL LANE ONLY — fingerprint of the key that signed (`SHA256:…`). */
  key_fingerprint: string | null;
  /** LOCAL LANE ONLY — filename of the detached SSH signature published beside the record. */
  signature_file: string | null;
  /**
   * LOCAL LANE ONLY — control ids whose countable verdict came SOLELY from
   * this local record, filled in by the build's merge so the listing can say
   * what the workstation actually contributed.
   */
  resolved: readonly string[];
}

const LANES: ReadonlySet<string> = new Set(["external", "action", "local"]);
const STATES: ReadonlySet<string> = new Set(["verified", "absent"]);

/** Throws with a precise message on the first violation (build-time guard). */
export function validateTrustInfo(value: unknown): TrustInfo {
  const fail = (msg: string): never => {
    throw new Error(`trust sidecar invalid: ${msg}`);
  };
  if (typeof value !== "object" || value === null) fail("not an object");
  const t = value as Record<string, unknown>;
  if (t.schema_version !== TRUST_SCHEMA_VERSION) {
    fail(`schema_version ${String(t.schema_version)} — this build understands only ${TRUST_SCHEMA_VERSION}`);
  }
  if (!LANES.has(String(t.lane))) fail(`lane ${JSON.stringify(t.lane)}`);
  if (!STATES.has(String(t.signature))) fail(`signature ${JSON.stringify(t.signature)}`);
  const optStr = (k: string) => {
    const v = t[k];
    if (v !== null && v !== undefined && typeof v !== "string") fail(`${k} must be a string or null`);
  };
  for (const k of [
    "identity",
    "commit",
    "verified_at",
    "bundle",
    "signer",
    "key_fingerprint",
    "signature_file",
  ]) {
    optStr(k);
  }
  if (t.resolved !== undefined && t.resolved !== null) {
    if (!Array.isArray(t.resolved) || t.resolved.some((x) => typeof x !== "string")) {
      fail("resolved must be a list of control ids");
    }
  }
  if (t.lane === "local") {
    // A local record is EVIDENCE only through its detached SSH signature. An
    // unverifiable one is refused here for exactly the reason a tampered
    // action-lane bundle is refused at ingest: the directory must never render
    // a provenance claim it cannot stand behind.
    if (t.signature !== "verified") {
      fail(
        "local-lane sidecar without a verified signature — a local record is EVIDENCE only " +
          "through its detached SSH signature; an unverified one is a tamper signal and is refused",
      );
    }
    for (const k of ["signer", "key_fingerprint", "signature_file", "commit"]) {
      if (typeof t[k] !== "string" || (t[k] as string).length === 0) {
        fail(`local-lane sidecar verified without a ${k}`);
      }
    }
    if (!/^[0-9a-f]{40}$/.test(String(t.commit))) fail("local-lane commit is not a 40-hex sha");
  } else if (t.signature === "verified") {
    if (typeof t.identity !== "string" || t.identity.length === 0) fail("verified without an identity");
    if (typeof t.bundle !== "string" || t.bundle.length === 0) fail("verified without a bundle filename");
  }
  return {
    schema_version: TRUST_SCHEMA_VERSION,
    lane: t.lane as Lane,
    signature: t.signature as SignatureState,
    identity: (t.identity as string | null | undefined) ?? null,
    commit: (t.commit as string | null | undefined) ?? null,
    verified_at: (t.verified_at as string | null | undefined) ?? null,
    bundle: (t.bundle as string | null | undefined) ?? null,
    signer: (t.signer as string | null | undefined) ?? null,
    key_fingerprint: (t.key_fingerprint as string | null | undefined) ?? null,
    signature_file: (t.signature_file as string | null | undefined) ?? null,
    resolved: Object.freeze([...((t.resolved as string[] | undefined) ?? [])]),
  };
}

/** External scans carry no sidecar: this is their trust state by construction. */
export function externalTrust(): TrustInfo {
  return {
    schema_version: TRUST_SCHEMA_VERSION,
    lane: "external",
    signature: "absent",
    identity: null,
    commit: null,
    verified_at: null,
    bundle: null,
    signer: null,
    key_fingerprint: null,
    signature_file: null,
    resolved: [],
  };
}

/** Sidecar filename for a record: lowercased `{owner}--{name}.json`, same as the record. */
export function trustFilename(owner: string, name: string): string {
  return `${owner.toLowerCase()}--${name.toLowerCase()}.json`;
}

/** Local-lane sidecar filename: `{owner}--{name}.local.json`, beside the base sidecar. */
export function localTrustFilename(owner: string, name: string): string {
  return `${owner.toLowerCase()}--${name.toLowerCase()}.local.json`;
}

/** The local scan record's filename under `site/data/local/`. */
export function localRecordFilename(owner: string, name: string): string {
  return `${owner.toLowerCase()}--${name.toLowerCase()}.json`;
}

/** Filenames the build publishes beside a listing carrying a local record. */
export const LOCAL_RECORD_PUBLISHED = "scan-record.local.json";
export const LOCAL_SIGNATURE_PUBLISHED = "scan-record.local.json.sig";

/**
 * The `ssh-keygen -Y` namespace a local scan record is signed under. Distinct
 * from git's own `git` namespace on purpose: a commit signature must never be
 * replayable as a scan-record signature, or the reverse.
 *
 * Taken from the contract block, never restated: the previous cut of this file
 * hard-coded `sscsb-scan-record` while the tool signed `sscsb-local-scan`, so
 * every submission failed verification and neither tree's tests could see it.
 */
export const LOCAL_SIGNATURE_NAMESPACE = LOCAL_NAMESPACE;

export type TrustKind = "verified" | "unsigned-action" | "local" | "external";

/** Collapse a sidecar into the four states the UI distinguishes. */
export function trustKind(t: TrustInfo | undefined): TrustKind {
  if (!t || t.lane === "external") return "external";
  if (t.lane === "local") return "local";
  return t.signature === "verified" ? "verified" : "unsigned-action";
}

/** Sidecar map key for a record: the sidecar filename without `.json`. */
export function trustKeyOf(r: Pick<ScanRecord, "repo">): string {
  return trustFilename(r.repo.owner, r.repo.name).replace(/\.json$/, "");
}

/** A record's sidecar from the map the build loaded (no map = no sidecar). */
export function lookupTrust(
  trust: ReadonlyMap<string, TrustInfo> | undefined,
  r: Pick<ScanRecord, "repo">,
): TrustInfo | undefined {
  return trust?.get(trustKeyOf(r));
}

/**
 * Which lane a record with NO sidecar came through. Authenticated scans run
 * in the target repository's own CI, so their workflow_run_url lives outside
 * this site's repo; external scans run in this repo's directory-scan workflow.
 */
export function scanLaneOf(r: Pick<ScanRecord, "scanner">): Lane {
  return r.scanner.workflow_run_url.startsWith(`${SITE_REPO_URL}/`) ? "external" : "action";
}

/**
 * The lane every design renders. The base sidecar (written at ingest after
 * signature verification) is authoritative; a listing with no base sidecar but
 * a verified LOCAL sidecar is a local-only listing; otherwise a record falls
 * back to the URL heuristic, and an action-lane record that was never verified
 * is labeled as the unverified claim it is. No design may show a verified mark
 * without a verified sidecar — this is the one place that rule lives, so the
 * four designs cannot drift apart on it.
 *
 * `local` is passed only for a listing whose BASE is the local record. When a
 * listing has both an action/external base and a local record, the lane stays
 * the base's and the local contribution is shown separately
 * (`localOverlayCount`): the badge must always name the strongest evidence for
 * the score.
 */
export function resolveTrustKind(
  r: ScanRecord,
  t: TrustInfo | undefined,
  local?: TrustInfo | undefined,
): TrustKind {
  if (t) return trustKind(t);
  if (local?.lane === "local") return "local";
  return scanLaneOf(r) === "action" ? "unsigned-action" : "external";
}

/** How many controls the local lane settled on its own here (0 = none). */
export function localOverlayCount(local: TrustInfo | undefined): number {
  return local?.lane === "local" ? local.resolved.length : 0;
}

/** A record's LOCAL sidecar from the map the build loaded. */
export function lookupLocalTrust(
  local: ReadonlyMap<string, TrustInfo> | undefined,
  r: Pick<ScanRecord, "repo">,
): TrustInfo | undefined {
  return local?.get(trustKeyOf(r));
}
