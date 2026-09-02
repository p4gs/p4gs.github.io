import { describe, expect, test } from "bun:test";
import { createVerify, generateKeyPairSync } from "node:crypto";

import {
  ALLOWED_ORIGINS,
  buildIssueBody,
  corsHeadersFor,
  handleScanRequest,
  mintAppJwt,
  parseRepoInput,
  vetRepoMeta,
  type RelayResponse,
} from "./lib.ts";

// ---------------------------------------------------------------------------
// Slug accept/reject table (mirrors site/src/scan/parse-request.ts cases)
// ---------------------------------------------------------------------------

describe("parseRepoInput", () => {
  const accepted: Array<[string, string]> = [
    ["p4gs/sscs-bootstrapper", "p4gs/sscs-bootstrapper"],
    ["  owner/repo.name-x_1  ", "owner/repo.name-x_1"],
    ["https://github.com/p4gs/sscs-bootstrapper", "p4gs/sscs-bootstrapper"],
    ["http://github.com/p4gs/repo", "p4gs/repo"],
    ["https://www.github.com/p4gs/repo", "p4gs/repo"],
    ["github.com/p4gs/repo", "p4gs/repo"],
    ["https://github.com/p4gs/repo.git", "p4gs/repo"],
    ["owner/repo.git", "owner/repo"],
    ["https://github.com/p4gs/repo/tree/main", "p4gs/repo"],
    ["https://github.com/p4gs/repo?tab=readme-ov-file", "p4gs/repo"],
    ["https://github.com/p4gs/repo#readme", "p4gs/repo"],
  ];
  for (const [input, slug] of accepted) {
    test(`accepts ${JSON.stringify(input)}`, () => {
      expect(parseRepoInput(input)).toEqual({ slug });
    });
  }

  const rejected: string[] = [
    "",
    "   ",
    "no-slash",
    "just some words",
    "-bad/repo", // owner may not start with a hyphen
    "bad!owner/repo",
    `${"a".repeat(40)}/repo`, // owner too long (max 39)
    "owner/..",
    "owner/.",
    "owner/re$po",
    "owner//repo",
    "owner/",
    "/repo",
    "https://gitlab.com/owner/repo",
    `owner/${"n".repeat(101)}`, // name too long (max 100)
    "x".repeat(400), // over input length cap
  ];
  for (const input of rejected) {
    test(`rejects ${JSON.stringify(input.length > 50 ? `${input.slice(0, 20)}…(${input.length})` : input)}`, () => {
      expect(parseRepoInput(input)).toHaveProperty("error");
    });
  }

  test("rejects non-strings", () => {
    expect(parseRepoInput(42)).toHaveProperty("error");
    expect(parseRepoInput(null)).toHaveProperty("error");
    expect(parseRepoInput({ repo: "a/b" })).toHaveProperty("error");
  });

  test("errors never echo the input", () => {
    const evil = "<script>alert(1)</script>/repo";
    const out = parseRepoInput(evil);
    if (!("error" in out)) throw new Error("expected rejection");
    expect(out.error).not.toContain("<script>");
  });
});

// ---------------------------------------------------------------------------
// Origin allowlist
// ---------------------------------------------------------------------------

describe("corsHeadersFor", () => {
  for (const origin of ALLOWED_ORIGINS) {
    test(`reflects ${origin}`, () => {
      expect(corsHeadersFor(origin)).toEqual({
        "access-control-allow-origin": origin,
        vary: "Origin",
      });
    });
  }

  test("unknown origins get nothing", () => {
    expect(corsHeadersFor("https://evil.example")).toEqual({});
    expect(corsHeadersFor("https://tools.sensiblesecurity.xyz.evil.example")).toEqual({});
    expect(corsHeadersFor("http://localhost:3000")).toEqual({});
    expect(corsHeadersFor(undefined)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// JWT structure — verified against a throwaway keypair
// ---------------------------------------------------------------------------

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const TEST_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

describe("mintAppJwt", () => {
  const NOW = 1_700_000_000;

  test("emits a valid RS256 JWT with iat-60 / exp+540 / iss=app id", () => {
    const jwt = mintAppJwt("12345", TEST_KEY_PEM, NOW);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);
    const [h, p, s] = parts as [string, string, string];

    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(p, "base64url").toString())).toEqual({
      iat: NOW - 60,
      exp: NOW + 540,
      iss: "12345",
    });

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${h}.${p}`);
    expect(verifier.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
  });

  test("accepts a PEM pasted with \\n escapes", () => {
    const jwt = mintAppJwt("12345", TEST_KEY_PEM.replaceAll("\n", "\\n"), NOW);
    const [h, p, s] = jwt.split(".") as [string, string, string];
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${h}.${p}`);
    expect(verifier.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Issue body snapshot (must match the issue-form output shape exactly)
// ---------------------------------------------------------------------------

test("buildIssueBody matches the scan-request form output", () => {
  expect(buildIssueBody("octo/cat")).toBe(
    "### Repository URL\n\nhttps://github.com/octo/cat\n\n### Confirmation\n\n- [x] I understand the result may be published publicly with a letter grade\n\n_Submitted via tools.sensiblesecurity.xyz_",
  );
});

// ---------------------------------------------------------------------------
// Repo vetting
// ---------------------------------------------------------------------------

describe("vetRepoMeta", () => {
  const ok = { private: false, archived: false, disabled: false, size: 1024 };
  test("passes a public active repo", () => expect(vetRepoMeta(ok)).toBeNull());
  test("rejects private", () => expect(vetRepoMeta({ ...ok, private: true })).toContain("private"));
  test("rejects archived", () => expect(vetRepoMeta({ ...ok, archived: true })).toContain("archived"));
  test("rejects disabled", () => expect(vetRepoMeta({ ...ok, disabled: true })).toContain("disabled"));
  test("rejects oversized", () =>
    expect(vetRepoMeta({ ...ok, size: 600 * 1024 })).toContain("scan cap"));
});

// ---------------------------------------------------------------------------
// Handler flow with stubbed fetch
// ---------------------------------------------------------------------------

interface StubCall {
  url: string;
  init: { method?: string; headers?: Record<string, string>; body?: string } | undefined;
}

interface StubOptions {
  repoStatus?: number;
  repoMeta?: Record<string, unknown>;
  dedupItems?: Array<{ title: string; html_url: string }>;
  openCount?: number;
  createStatus?: number;
}

function githubStub(opts: StubOptions = {}): { fetchImpl: typeof fetch; calls: StubCall[] } {
  const calls: StubCall[] = [];
  const jsonRes = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  const fetchImpl = (async (input: unknown, init?: StubCall["init"]) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/repos/p4gs/p4gs.github.io/installation")) return jsonRes(200, { id: 42 });
    if (url.endsWith("/app/installations/42/access_tokens")) return jsonRes(201, { token: "ghs_stub" });
    if (url.includes("/search/issues?q=")) {
      const q = new URL(url).searchParams.get("q") ?? "";
      if (q.includes("in:title")) {
        const items = opts.dedupItems ?? [];
        return jsonRes(200, { total_count: items.length, items });
      }
      return jsonRes(200, { total_count: opts.openCount ?? 0, items: [] });
    }
    if (url.endsWith("/repos/p4gs/p4gs.github.io/issues") && init?.method === "POST") {
      return jsonRes(opts.createStatus ?? 201, {
        html_url: "https://github.com/p4gs/p4gs.github.io/issues/99",
      });
    }
    if (/\/repos\/[^/]+\/[^/]+$/.test(url)) {
      const status = opts.repoStatus ?? 200;
      if (status !== 200) return jsonRes(status, { message: "upstream detail" });
      return jsonRes(200, opts.repoMeta ?? { private: false, archived: false, disabled: false, size: 1024 });
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as unknown as typeof fetch;

  return { fetchImpl, calls };
}

const ENV = { SCAN_INTAKE_APP_ID: "12345", SCAN_INTAKE_APP_KEY: TEST_KEY_PEM };
const GOOD_ORIGIN = "https://tools.sensiblesecurity.xyz";

function post(repo: unknown, origin: string | undefined = GOOD_ORIGIN) {
  return { method: "POST", origin, body: { repo } };
}

describe("handleScanRequest", () => {
  test("happy path queues an issue", async () => {
    const { fetchImpl, calls } = githubStub();
    const res = await handleScanRequest(post("octo/cat"), ENV, fetchImpl);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      state: "queued",
      issue_url: "https://github.com/p4gs/p4gs.github.io/issues/99",
    });
    expect(res.headers["access-control-allow-origin"]).toBe(GOOD_ORIGIN);

    // App JWT on the installation lookup.
    const instCall = calls[0]!;
    expect(instCall.url).toBe("https://api.github.com/repos/p4gs/p4gs.github.io/installation");
    const auth = instCall.init?.headers?.authorization ?? "";
    expect(auth.startsWith("Bearer ")).toBe(true);
    expect(auth.slice("Bearer ".length).split(".")).toHaveLength(3);

    // Installation token + standard headers on the target-repo vet.
    const repoCall = calls.find((c) => c.url.endsWith("/repos/octo/cat"))!;
    expect(repoCall.init?.headers?.authorization).toBe("Bearer ghs_stub");
    expect(repoCall.init?.headers?.["user-agent"]).toBe("sscsb-scan-intake");
    expect(repoCall.init?.headers?.accept).toBe("application/vnd.github+json");

    // Dedup search actually quotes the slug and scopes to titles.
    const dedupCall = calls.find((c) => c.url.includes("/search/issues?q=") && c.url.includes("in%3Atitle"))!;
    const q = new URL(dedupCall.url).searchParams.get("q");
    expect(q).toBe('repo:p4gs/p4gs.github.io is:issue is:open label:scan-request "octo/cat" in:title');

    // Created issue matches the form output exactly.
    const createCall = calls.find(
      (c) => c.url.endsWith("/repos/p4gs/p4gs.github.io/issues") && c.init?.method === "POST",
    )!;
    expect(JSON.parse(createCall.init!.body!)).toEqual({
      title: "[scan] octo/cat",
      labels: ["scan-request"],
      body: buildIssueBody("octo/cat"),
    });
  });

  test("accepts a URL-shaped repo and a string JSON body", async () => {
    const { fetchImpl } = githubStub();
    const res = await handleScanRequest(
      { method: "POST", origin: GOOD_ORIGIN, body: JSON.stringify({ repo: "https://github.com/octo/cat.git" }) },
      ENV,
      fetchImpl,
    );
    expect(res.status).toBe(201);
  });

  test("dedup hit returns the existing issue without creating one", async () => {
    const { fetchImpl, calls } = githubStub({
      dedupItems: [{ title: "[scan] octo/cat", html_url: "https://github.com/p4gs/p4gs.github.io/issues/7" }],
    });
    const res = await handleScanRequest(post("octo/cat"), ENV, fetchImpl);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      state: "existing",
      issue_url: "https://github.com/p4gs/p4gs.github.io/issues/7",
    });
    expect(calls.some((c) => c.init?.method === "POST" && c.url.endsWith("/issues"))).toBe(false);
  });

  test("missing repo → 404, nothing created", async () => {
    const { fetchImpl, calls } = githubStub({ repoStatus: 404 });
    const res = await handleScanRequest(post("octo/gone"), ENV, fetchImpl);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "repository does not exist or is not visible" });
    expect(calls.some((c) => c.url.includes("/search/issues"))).toBe(false);
  });

  test("private repo → 422 with the vet reason", async () => {
    const { fetchImpl } = githubStub({
      repoMeta: { private: true, archived: false, disabled: false, size: 1 },
    });
    const res = await handleScanRequest(post("octo/secret"), ENV, fetchImpl);
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: "repository is private — only public repositories can be scanned" });
  });

  test("archived repo → 422", async () => {
    const { fetchImpl } = githubStub({
      repoMeta: { private: false, archived: true, disabled: false, size: 1 },
    });
    const res = await handleScanRequest(post("octo/old"), ENV, fetchImpl);
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: "repository is archived" });
  });

  test("missing env → 503 and no GitHub traffic", async () => {
    const { fetchImpl, calls } = githubStub();
    for (const env of [{}, { SCAN_INTAKE_APP_ID: "12345" }, { SCAN_INTAKE_APP_KEY: TEST_KEY_PEM }]) {
      const res = await handleScanRequest(post("octo/cat"), env, fetchImpl);
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ error: "scan intake not configured" });
    }
    expect(calls).toHaveLength(0);
  });

  test("queue full → 429, nothing created", async () => {
    const { fetchImpl, calls } = githubStub({ openCount: 25 });
    const res = await handleScanRequest(post("octo/cat"), ENV, fetchImpl);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "scan queue is full" });
    expect(calls.some((c) => c.init?.method === "POST" && c.url.endsWith("/issues"))).toBe(false);
  });

  test("queue just under the cap still queues", async () => {
    const { fetchImpl } = githubStub({ openCount: 24 });
    const res = await handleScanRequest(post("octo/cat"), ENV, fetchImpl);
    expect(res.status).toBe(201);
  });

  test("bad origin gets no ACAO header", async () => {
    const { fetchImpl } = githubStub();
    const res = await handleScanRequest(post("octo/cat", "https://evil.example"), ENV, fetchImpl);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("OPTIONS preflight from an allowed origin", async () => {
    const { fetchImpl, calls } = githubStub();
    const res = await handleScanRequest(
      { method: "OPTIONS", origin: GOOD_ORIGIN, body: undefined },
      ENV,
      fetchImpl,
    );
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
    expect(res.headers["access-control-allow-origin"]).toBe(GOOD_ORIGIN);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toContain("content-type");
    expect(calls).toHaveLength(0);
  });

  test("OPTIONS preflight from a bad origin carries no CORS headers", async () => {
    const res = await handleScanRequest(
      { method: "OPTIONS", origin: "https://evil.example", body: undefined },
      ENV,
      githubStub().fetchImpl,
    );
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("non-POST → 405", async () => {
    const res = await handleScanRequest(
      { method: "GET", origin: GOOD_ORIGIN, body: undefined },
      ENV,
      githubStub().fetchImpl,
    );
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe("POST, OPTIONS");
  });

  test("malformed bodies → 400", async () => {
    const { fetchImpl } = githubStub();
    const cases: unknown[] = ["not json", 42, null, [], { repo: 42 }, {}, { repo: "-bad/repo" }];
    for (const body of cases) {
      const res = await handleScanRequest({ method: "POST", origin: GOOD_ORIGIN, body }, ENV, fetchImpl);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    }
  });

  test("upstream failure → opaque 502, no token or upstream detail leaked", async () => {
    const { fetchImpl } = githubStub({ createStatus: 500 });
    const res = await handleScanRequest(post("octo/cat"), ENV, fetchImpl);
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "github api error" });
    const serialized = JSON.stringify(res as RelayResponse);
    expect(serialized).not.toContain("ghs_stub");
    expect(serialized).not.toContain("upstream detail");
  });

  test("fetch throwing → opaque 502", async () => {
    const throwing = (async () => {
      throw new Error("socket hangup with secret ghs_stub");
    }) as unknown as typeof fetch;
    const res = await handleScanRequest(post("octo/cat"), ENV, throwing);
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "github api error" });
  });
});
