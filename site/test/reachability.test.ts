/**
 * The local-lane reachability gate, driven against a stub `gh`.
 *
 * The bug this closes: ingest checked that the record's commit EXISTED in the
 * repository and then fetched the trust anchor
 * (`.sscsb/policy/allowed_signers`) at that commit. Far more shas "exist" in a
 * GitHub repository than a reader assumes — every branch, and every pull
 * request from a fork via `refs/pull/<n>/head`. So a submitter could push a
 * branch whose `allowed_signers` approves a key they hold, sign a record with
 * it, point the record at that tip, and the directory would verify the
 * signature against the submitter's own file.
 *
 * The gate now requires the commit to be merged into the LIVE default branch.
 * These tests run the real `checkReachable`/`main` — including the `gh`
 * subprocess calls — against a stub that answers with each status GitHub can
 * return, so the decision is proved rather than described.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkReachable,
  isReachable,
  main,
  REACHABLE_STATUSES,
  unreachableMessage,
} from "../src/scan/require-reachable";

const SLUG = "Acme/Widget";
const COMMIT = "a".repeat(40);

let binDir: string;
let realPath: string | undefined;

beforeAll(() => {
  binDir = mkdtempSync(join(tmpdir(), "gh-stub-"));
  const gh = join(binDir, "gh");
  // A stub `gh` driven entirely by env, so each test picks the answer GitHub
  // would have given. It matches on the API path the real code builds, which
  // means a change to that path breaks these tests — which is the point.
  writeFileSync(
    gh,
    `#!/bin/sh
path="$2"
case "$path" in
  */compare/*)
    [ -n "\${STUB_STATUS:-}" ] || exit 1
    echo "$STUB_STATUS" ;;
  */commits/*)
    [ "\${STUB_COMMIT_EXISTS:-1}" = "1" ] || exit 1
    echo "${COMMIT}" ;;
  repos/*)
    [ "\${STUB_HAS_REPO:-1}" = "1" ] || exit 1
    echo "\${STUB_DEFAULT_BRANCH:-main}" ;;
  *) exit 1 ;;
esac
`,
    { mode: 0o755 },
  );
  chmodSync(gh, 0o755);
  realPath = process.env.PATH;
  process.env.PATH = `${binDir}:${realPath ?? ""}`;
});

afterAll(() => {
  process.env.PATH = realPath;
});

function stub(env: Record<string, string>): void {
  for (const k of [
    "STUB_STATUS",
    "STUB_COMMIT_EXISTS",
    "STUB_HAS_REPO",
    "STUB_DEFAULT_BRANCH",
  ]) {
    delete process.env[k];
  }
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
}

describe("only a commit merged into the default branch may anchor a local record", () => {
  test("identical — the commit IS the default-branch tip", async () => {
    stub({ STUB_STATUS: "identical" });
    const r = await checkReachable(SLUG, COMMIT);
    expect(r.ok).toBe(true);
    expect(r.status).toBe("identical");
    expect(r.defaultBranch).toBe("main");
  });

  test("behind — the commit is an ancestor of the tip", async () => {
    stub({ STUB_STATUS: "behind" });
    expect((await checkReachable(SLUG, COMMIT)).ok).toBe(true);
  });

  for (const status of ["ahead", "diverged"] as const) {
    test(`${status} — not merged, so REFUSED`, async () => {
      // `ahead` is the fork/PR-branch shape: the record's commit is a
      // descendant of the default branch that was never merged into it.
      stub({ STUB_STATUS: status });
      const r = await checkReachable(SLUG, COMMIT);
      expect(r.ok).toBe(false);
      expect(r.message).toContain("not reachable");
      expect(r.message).toContain(status);
      expect(r.message).toContain("allowed_signers");
    });
  }

  test("a compare call that FAILS is refused, not waved through", async () => {
    // Fail closed: an answer we cannot read is not an answer we may act on.
    stub({});
    const r = await checkReachable(SLUG, COMMIT);
    expect(r.ok).toBe(false);
    expect(r.status).toBeNull();
    expect(r.message).toContain("unknown");
  });

  test("an unrecognized status is refused too", async () => {
    stub({ STUB_STATUS: "something-new" });
    expect((await checkReachable(SLUG, COMMIT)).ok).toBe(false);
  });

  test("a commit that does not exist gets the plain answer", async () => {
    stub({ STUB_STATUS: "identical", STUB_COMMIT_EXISTS: "0" });
    const r = await checkReachable(SLUG, COMMIT);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("does not exist");
  });

  test("an unresolvable default branch is refused — it is never assumed", async () => {
    // The branch must come from GitHub. Defaulting to "main" here would let a
    // repository that renamed its default branch be compared against a stale
    // one, and an API outage silently pick the anchor.
    stub({ STUB_STATUS: "identical", STUB_HAS_REPO: "0" });
    const r = await checkReachable(SLUG, COMMIT);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("default branch");
  });

  test("the default branch is whatever GitHub says, not `main`", async () => {
    stub({ STUB_STATUS: "behind", STUB_DEFAULT_BRANCH: "trunk" });
    const r = await checkReachable(SLUG, COMMIT);
    expect(r.ok).toBe(true);
    expect(r.defaultBranch).toBe("trunk");
  });

  test("a malformed slug or sha never reaches the API", async () => {
    stub({ STUB_STATUS: "identical" });
    expect((await checkReachable("not-a-slug", COMMIT)).message).toContain("malformed slug");
    expect((await checkReachable(SLUG, "HEAD")).message).toContain("40-hex");
  });
});

describe("the workflow entry point exits on the decision", () => {
  test("exit 0 when merged, exit 1 with an ::error:: line when not", async () => {
    const errors: string[] = [];
    const realError = console.error;
    console.error = (m: string) => errors.push(String(m));
    try {
      process.env.SLUG = SLUG;
      process.env.COMMIT = COMMIT;
      stub({ STUB_STATUS: "behind" });
      expect(await main()).toBe(0);

      stub({ STUB_STATUS: "diverged" });
      expect(await main()).toBe(1);
    } finally {
      console.error = realError;
      delete process.env.SLUG;
      delete process.env.COMMIT;
    }
    expect(errors.join("\n")).toContain("::error::");
    expect(errors.join("\n")).toContain("not reachable");
  });
});

describe("the reachable set is exactly the two merged states", () => {
  test("identical and behind, and nothing else", () => {
    expect([...REACHABLE_STATUSES].sort()).toEqual(["behind", "identical"]);
    for (const s of ["ahead", "diverged", "", "IDENTICAL"]) {
      expect(isReachable(s)).toBe(false);
    }
    expect(isReachable(null)).toBe(false);
  });

  test("the refusal names the repository, the branch and what to do", () => {
    const m = unreachableMessage(SLUG, COMMIT, "trunk", "ahead");
    expect(m).toContain(SLUG);
    expect(m).toContain("trunk");
    expect(m).toContain("Merge the branch");
  });
});
