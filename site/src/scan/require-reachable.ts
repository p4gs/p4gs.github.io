/**
 * The reachability gate for a local-lane record's commit.
 *
 * # Why existence is not enough
 *
 * A local record names a commit, and the ingest fetches the TRUST ANCHOR
 * (`.sscsb/policy/allowed_signers`) from the public repository **at that
 * commit**. So whoever chooses the commit chooses the file the signature is
 * verified against.
 *
 * The previous gate only asked whether the commit existed
 * (`gh api repos/<slug>/commits/<sha>`). GitHub's git network makes far more
 * shas "exist" in a repository than a reader would assume: every commit pushed
 * to any branch, and every commit on a pull request from a fork, is reachable
 * through the API on the base repository — `refs/pull/<n>/head` is a real ref
 * in the base repo, and the contents API will serve blobs at those shas. That
 * is the whole attack: push a branch (or open a PR from a fork) whose
 * `allowed_signers` approves a key you hold, sign a record with it, and point
 * the record at that tip. Every downstream check passes, because the anchor the
 * directory reads is the anchor the submitter wrote.
 *
 * # The gate
 *
 * The commit must be **merged into the live default branch** — content that
 * went through whatever review and branch protection the repository actually
 * runs. `GET /repos/{slug}/compare/{default_branch}...{commit}` answers exactly
 * that question:
 *
 *   - `identical` — the commit IS the default branch tip.
 *   - `behind`    — the commit is an ancestor of the tip.
 *   - `ahead`     — the tip is an ancestor of the commit: not merged.
 *   - `diverged`  — neither: not merged.
 *
 * `identical` and `behind` pass; everything else, including an API error or an
 * unrecognized status, is refused. Fail-closed: an answer we cannot read is not
 * an answer we may act on.
 *
 * The default branch is read from GitHub, never from the record — a record that
 * could name its own trusted branch would defeat the point.
 *
 * Lives here rather than inline in YAML so the decision is testable: the test
 * drives `main()` against a stub `gh` and asserts the exit code for every
 * status GitHub can return.
 *
 * Inputs (env, never argv): `SLUG` (`owner/repo`), `COMMIT` (40-hex).
 * Exit 0 = reachable. Exit 1 = refused, with a `::error::` line.
 */

/** Compare statuses that mean "merged into the default branch". */
export const REACHABLE_STATUSES: ReadonlySet<string> = new Set(["identical", "behind"]);

export function isReachable(status: string | null): boolean {
  return status !== null && REACHABLE_STATUSES.has(status);
}

/** The refusal, worded so a maintainer knows what to do next. */
export function unreachableMessage(
  slug: string,
  commit: string,
  defaultBranch: string,
  status: string | null,
): string {
  return (
    `commit ${commit} is not reachable from ${slug}'s default branch ` +
    `${defaultBranch} (compare status: ${status ?? "unknown"}). The trust anchor ` +
    `.sscsb/policy/allowed_signers is read AT THIS COMMIT, so a record may only name a ` +
    `commit that is merged into the default branch — otherwise a branch or fork PR that ` +
    `never passed review could nominate the approved-signer file it is verified against. ` +
    `Merge the branch carrying the signed record, then resubmit.`
  );
}

/** `gh api <path> [--jq expr]`, or null when the call fails. */
async function ghApi(path: string, jq?: string): Promise<string | null> {
  const args = ["api", path, ...(jq ? ["--jq", jq] : [])];
  // `env` is passed explicitly. Bun resolves the executable against the
  // environment it hands the child, and with the option omitted that is the
  // environment the process STARTED with — so a later `process.env.PATH`
  // change (a test's stub `gh`, a workflow step that prepends a tool dir) is
  // silently ignored. The child needs GH_TOKEN and HOME from here regardless.
  const proc = Bun.spawn(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  if (proc.exitCode !== 0) return null;
  const trimmed = out.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface ReachabilityResult {
  ok: boolean;
  defaultBranch: string | null;
  status: string | null;
  message: string | null;
}

export async function checkReachable(
  slug: string,
  commit: string,
): Promise<ReachabilityResult> {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}$/.test(slug)) {
    return { ok: false, defaultBranch: null, status: null, message: `malformed slug ${slug}` };
  }
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    return {
      ok: false,
      defaultBranch: null,
      status: null,
      message: `record commit ${commit} is not a 40-hex sha`,
    };
  }
  const defaultBranch = await ghApi(`repos/${slug}`, ".default_branch");
  if (!defaultBranch) {
    return {
      ok: false,
      defaultBranch: null,
      status: null,
      message: `could not resolve the default branch of ${slug}`,
    };
  }
  // Existence first, so a typo'd sha gets the plain answer rather than a
  // reachability lecture.
  if ((await ghApi(`repos/${slug}/commits/${commit}`, ".sha")) === null) {
    return {
      ok: false,
      defaultBranch,
      status: null,
      message: `commit ${commit} does not exist in ${slug} — refusing`,
    };
  }
  const status = await ghApi(`repos/${slug}/compare/${defaultBranch}...${commit}`, ".status");
  if (isReachable(status)) return { ok: true, defaultBranch, status, message: null };
  return {
    ok: false,
    defaultBranch,
    status,
    message: unreachableMessage(slug, commit, defaultBranch, status),
  };
}

export async function main(): Promise<number> {
  const slug = process.env.SLUG ?? "";
  const commit = process.env.COMMIT ?? "";
  const r = await checkReachable(slug, commit);
  if (!r.ok) {
    console.error(`::error::${r.message}`);
    return 1;
  }
  console.log(
    `commit ${commit} is reachable from ${slug}@${r.defaultBranch} (compare: ${r.status})`,
  );
  return 0;
}

if (import.meta.main) {
  process.exit(await main());
}
