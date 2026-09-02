/**
 * sscsb scan-intake relay — pure logic.
 *
 * Everything here is deterministic and dependency-free (node:crypto only), so
 * `bun test` covers it without a Vercel runtime. The Vercel adapter in
 * api/scan-request.ts maps (req, res) onto handleScanRequest().
 *
 * Deliberately self-contained: the slug rules mirror
 * site/src/scan/parse-request.ts (OWNER_RE / NAME_RE / vetRepoMeta) but are
 * re-declared here because relay/ deploys alone (Vercel Root Directory =
 * relay) and must not import from site/.
 */

import { createSign } from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Repo that hosts the scan-request issue queue. */
export const DIRECTORY_REPO = "p4gs/p4gs.github.io";
export const SCAN_LABEL = "scan-request";
/** Max open scan-request issues before new submissions are refused. */
export const QUEUE_CAP = 25;

export const ALLOWED_ORIGINS: readonly string[] = [
  "https://tools.sensiblesecurity.xyz",
  "https://p4gs.github.io",
  "http://localhost:4173",
  "http://localhost:8080",
];

const GITHUB_API = "https://api.github.com";
const GH_ERROR = "github api error";

// ---------------------------------------------------------------------------
// Slug validation (mirrors site/src/scan/parse-request.ts)
// ---------------------------------------------------------------------------

export const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
export const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_INPUT_LEN = 300;

/**
 * Extract and validate `owner/repo` from a submitted reference. Accepts the
 * same shapes as the site parser: full https://github.com URLs (with optional
 * trailing path/query/fragment and `.git`), bare `github.com/owner/repo`, and
 * plain `owner/repo`. Error messages never echo the input back.
 */
export function parseRepoInput(input: unknown): { slug: string } | { error: string } {
  if (typeof input !== "string") return { error: "expected `repo` to be a string like `owner/repo`" };
  if (input.length > MAX_INPUT_LEN) return { error: "repository reference is too long" };
  const cleaned = input.trim();
  const m = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s#?]+)|^([^\/\s]+)\/([^\/\s#?]+)$/m,
  );
  if (!m) {
    return { error: "no GitHub repository reference found — expected `owner/repo` or `https://github.com/owner/repo`" };
  }
  const owner = (m[1] ?? m[3] ?? "").trim();
  let name = (m[2] ?? m[4] ?? "").trim();
  name = name.replace(/\.git$/, "");
  if (!OWNER_RE.test(owner)) return { error: "owner is not a valid GitHub owner" };
  if (!NAME_RE.test(name)) return { error: "repository name is not valid" };
  if (name === "." || name === "..") return { error: "repository name is not valid" };
  return { slug: `${owner}/${name}` };
}

// ---------------------------------------------------------------------------
// Repo vetting (mirrors site/src/scan/parse-request.ts vetRepoMeta)
// ---------------------------------------------------------------------------

export interface RepoMeta {
  private: boolean;
  archived: boolean;
  disabled: boolean;
  size: number; // KB
}

const MAX_REPO_MB = 512;

export function vetRepoMeta(meta: RepoMeta): string | null {
  if (meta.private) return "repository is private — only public repositories can be scanned";
  if (meta.archived) return "repository is archived";
  if (meta.disabled) return "repository is disabled";
  if (meta.size > MAX_REPO_MB * 1024) {
    return `repository is ${Math.round(meta.size / 1024)} MB — the scan cap is ${MAX_REPO_MB} MB`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

/** Reflect the Origin only when it is on the allowlist; otherwise no CORS headers. */
export function corsHeadersFor(origin: string | undefined): Record<string, string> {
  if (origin !== undefined && ALLOWED_ORIGINS.includes(origin)) {
    return { "access-control-allow-origin": origin, vary: "Origin" };
  }
  return {};
}

// ---------------------------------------------------------------------------
// GitHub App JWT (RS256, zero deps)
// ---------------------------------------------------------------------------

/** Restore real newlines when the PEM was pasted with `\n` escapes. */
export function normalizePem(pem: string): string {
  return pem.replace(/\\n/g, "\n");
}

/**
 * Mint the short-lived RS256 app JWT GitHub Apps authenticate with.
 * `nowSec` is injectable for tests; iat is backdated 60s per GitHub docs.
 */
export function mintAppJwt(appId: string, privateKeyPem: string, nowSec: number): string {
  const b64url = (buf: Buffer): string => buf.toString("base64url");
  const header = b64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64url(
    Buffer.from(JSON.stringify({ iat: nowSec - 60, exp: nowSec + 540, iss: appId })),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = b64url(signer.sign(normalizePem(privateKeyPem)));
  return `${header}.${payload}.${signature}`;
}

// ---------------------------------------------------------------------------
// Issue body (matches .github/ISSUE_TEMPLATE/scan-request.yml form output)
// ---------------------------------------------------------------------------

export function buildIssueBody(slug: string): string {
  return [
    "### Repository URL",
    "",
    `https://github.com/${slug}`,
    "",
    "### Confirmation",
    "",
    "- [x] I understand the result may be published publicly with a letter grade",
    "",
    "_Submitted via tools.sensiblesecurity.xyz_",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Response shaping
// ---------------------------------------------------------------------------

export interface RelayResponse {
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}

export function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): RelayResponse {
  return {
    status,
    headers: { ...headers, "content-type": "application/json; charset=utf-8" },
    body,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export interface RelayRequestLike {
  method: string;
  origin: string | undefined;
  body: unknown;
}

export interface RelayEnv {
  SCAN_INTAKE_APP_ID?: string;
  SCAN_INTAKE_APP_KEY?: string;
  [key: string]: string | undefined;
}

export async function handleScanRequest(
  req: RelayRequestLike,
  env: RelayEnv,
  fetchImpl: typeof fetch = fetch,
  nowSec: () => number = () => Math.floor(Date.now() / 1000),
): Promise<RelayResponse> {
  const cors = corsHeadersFor(req.origin);

  if (req.method === "OPTIONS") {
    return {
      status: 204,
      headers: {
        ...cors,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
      },
      body: null,
    };
  }

  const reply = (status: number, body: Record<string, unknown>): RelayResponse =>
    jsonResponse(status, body, cors);

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method not allowed" }, { ...cors, allow: "POST, OPTIONS" });
  }

  // Body: {"repo": "owner/repo"} — tolerate an unparsed JSON string body.
  let bodyValue = req.body;
  if (typeof bodyValue === "string") {
    try {
      bodyValue = JSON.parse(bodyValue);
    } catch {
      return reply(400, { error: 'request body must be JSON like {"repo":"owner/repo"}' });
    }
  }
  if (typeof bodyValue !== "object" || bodyValue === null || Array.isArray(bodyValue)) {
    return reply(400, { error: 'request body must be JSON like {"repo":"owner/repo"}' });
  }
  const parsed = parseRepoInput((bodyValue as { repo?: unknown }).repo);
  if ("error" in parsed) return reply(400, { error: parsed.error });
  const slug = parsed.slug;

  const appId = env.SCAN_INTAKE_APP_ID;
  const appKey = env.SCAN_INTAKE_APP_KEY;
  if (!appId || !appKey) return reply(503, { error: "scan intake not configured" });

  const gh = (method: string, path: string, token: string, payload?: unknown): Promise<Response> =>
    fetchImpl(`${GITHUB_API}${path}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "sscsb-scan-intake",
        authorization: `Bearer ${token}`,
        ...(payload === undefined ? {} : { "content-type": "application/json" }),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });

  try {
    // App JWT → installation on the directory repo → installation token.
    const jwt = mintAppJwt(appId, appKey, nowSec());
    const instRes = await gh("GET", `/repos/${DIRECTORY_REPO}/installation`, jwt);
    if (!instRes.ok) return reply(502, { error: GH_ERROR });
    const inst = (await instRes.json()) as { id?: number };
    if (typeof inst.id !== "number") return reply(502, { error: GH_ERROR });
    const tokRes = await gh("POST", `/app/installations/${inst.id}/access_tokens`, jwt);
    if (tokRes.status !== 201) return reply(502, { error: GH_ERROR });
    const token = ((await tokRes.json()) as { token?: string }).token;
    if (!token) return reply(502, { error: GH_ERROR });

    // Re-validate the target server-side (the browser input is untrusted).
    const repoRes = await gh("GET", `/repos/${slug}`, token);
    if (repoRes.status === 404) {
      return reply(404, { error: "repository does not exist or is not visible" });
    }
    if (!repoRes.ok) return reply(502, { error: GH_ERROR });
    const vet = vetRepoMeta((await repoRes.json()) as RepoMeta);
    if (vet) return reply(422, { error: vet });

    // Dedup: an open scan-request issue already titled with this slug.
    const dedupQ = `repo:${DIRECTORY_REPO} is:issue is:open label:${SCAN_LABEL} "${slug}" in:title`;
    const dedupRes = await gh("GET", `/search/issues?q=${encodeURIComponent(dedupQ)}&per_page=100`, token);
    if (!dedupRes.ok) return reply(502, { error: GH_ERROR });
    const dedup = (await dedupRes.json()) as { items?: Array<{ title?: string; html_url?: string }> };
    const existing = (dedup.items ?? []).find(
      (item) => typeof item.title === "string" && item.title.includes(slug),
    );
    if (existing) return reply(200, { state: "existing", issue_url: existing.html_url ?? "" });

    // Queue cap: total open scan-request issues.
    const capQ = `repo:${DIRECTORY_REPO} is:issue is:open label:${SCAN_LABEL}`;
    const capRes = await gh("GET", `/search/issues?q=${encodeURIComponent(capQ)}&per_page=1`, token);
    if (!capRes.ok) return reply(502, { error: GH_ERROR });
    const cap = (await capRes.json()) as { total_count?: number };
    if ((cap.total_count ?? 0) >= QUEUE_CAP) return reply(429, { error: "scan queue is full" });

    // Create the scan-request issue, formatted like the issue-form output.
    const createRes = await gh("POST", `/repos/${DIRECTORY_REPO}/issues`, token, {
      title: `[scan] ${slug}`,
      labels: [SCAN_LABEL],
      body: buildIssueBody(slug),
    });
    if (createRes.status !== 201) return reply(502, { error: GH_ERROR });
    const created = (await createRes.json()) as { html_url?: string };
    return reply(201, { state: "queued", issue_url: created.html_url ?? "" });
  } catch {
    // Network failure, bad key, malformed upstream JSON — never leak details.
    return reply(502, { error: GH_ERROR });
  }
}
