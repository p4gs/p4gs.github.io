/**
 * Trust sidecar for a published record — WHICH lane produced it and whether
 * that provenance was cryptographically proven. Kept OUT of the scan record
 * on purpose: the record is the signed artifact, and mutating it would
 * invalidate the very signature this file describes.
 *
 * Written by directory-ingest.yml (authenticated lane) after `cosign
 * verify-blob`; external scans have no sidecar and are `external` by
 * construction. Published beside the record so anyone can re-verify.
 */

export const TRUST_SCHEMA_VERSION = 1;

export type Lane = "external" | "action";
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
}

const LANES: ReadonlySet<string> = new Set(["external", "action"]);
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
  for (const k of ["identity", "commit", "verified_at", "bundle"]) optStr(k);
  if (t.signature === "verified") {
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
  };
}

/** Sidecar filename for a record: lowercased `{owner}--{name}.json`, same as the record. */
export function trustFilename(owner: string, name: string): string {
  return `${owner.toLowerCase()}--${name.toLowerCase()}.json`;
}

export type TrustKind = "verified" | "unsigned-action" | "external";

/** Collapse a sidecar into the three states the UI distinguishes. */
export function trustKind(t: TrustInfo | undefined): TrustKind {
  if (!t || t.lane === "external") return "external";
  return t.signature === "verified" ? "verified" : "unsigned-action";
}
