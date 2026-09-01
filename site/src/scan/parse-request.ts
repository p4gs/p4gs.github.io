/**
 * Parse and validate a scan request (issue body or workflow_dispatch input).
 *
 * Runs inside directory-scan.yml with the request text arriving ONLY via env
 * (never workflow interpolation). Emits `slug=owner/repo` to $GITHUB_OUTPUT on
 * success; on any validation failure prints a human reason to stdout and exits
 * 1 — the workflow turns that into a polite issue comment.
 */

export const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
export const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_REPO_MB = 512;

/** Extract owner/repo from free-ish text (issue form field or dispatch input). */
export function extractSlug(text: string): { owner: string; name: string } | { error: string } {
  const cleaned = text.trim();
  // Accept: https://github.com/owner/repo[.git][/...], github.com/owner/repo, owner/repo
  const m = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s#?]+)|^([^\/\s]+)\/([^\/\s#?]+)$/m,
  );
  if (!m) return { error: "no GitHub repository reference found — expected `https://github.com/owner/repo`" };
  const owner = (m[1] ?? m[3] ?? "").trim();
  let name = (m[2] ?? m[4] ?? "").trim();
  name = name.replace(/\.git$/, "");
  if (!OWNER_RE.test(owner)) return { error: `owner ${JSON.stringify(owner)} is not a valid GitHub owner` };
  if (!NAME_RE.test(name)) return { error: `repository name ${JSON.stringify(name)} is not valid` };
  if (name === "." || name === "..") return { error: "repository name is not valid" };
  return { owner, name };
}

interface RepoMeta {
  private: boolean;
  archived: boolean;
  disabled: boolean;
  size: number; // KB
  default_branch: string;
  description: string | null;
}

async function ghApi(path: string, token: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "sscsb-directory-scan",
    },
  });
}

export function vetRepoMeta(meta: RepoMeta): string | null {
  if (meta.private) return "repository is private — only public repositories can be scanned";
  if (meta.archived) return "repository is archived";
  if (meta.disabled) return "repository is disabled";
  if (meta.size > MAX_REPO_MB * 1024) {
    return `repository is ${Math.round(meta.size / 1024)} MB — the scan cap is ${MAX_REPO_MB} MB`;
  }
  return null;
}

if (import.meta.main) {
  const body = process.env.ISSUE_BODY ?? "";
  const dispatch = process.env.DISPATCH_REPO ?? "";
  const token = process.env.GH_TOKEN ?? "";
  const out = process.env.GITHUB_OUTPUT;

  const source = dispatch || body;
  const parsed = extractSlug(source);
  if ("error" in parsed) {
    console.log(`request rejected: ${parsed.error}`);
    process.exit(1);
  }
  const slug = `${parsed.owner}/${parsed.name}`;
  const res = await ghApi(`/repos/${slug}`, token);
  if (res.status === 404) {
    console.log(`request rejected: ${slug} does not exist or is not visible`);
    process.exit(1);
  }
  if (!res.ok) {
    console.log(`request rejected: GitHub API returned ${res.status} for ${slug}`);
    process.exit(1);
  }
  const meta = (await res.json()) as RepoMeta;
  const vet = vetRepoMeta(meta);
  if (vet) {
    console.log(`request rejected: ${vet}`);
    process.exit(1);
  }
  if (out) {
    const lines = [
      `slug=${slug}`,
      `default_branch=${meta.default_branch}`,
      `description=${(meta.description ?? "").replaceAll("\n", " ").slice(0, 300)}`,
    ];
    await Bun.write(out, `${(await Bun.file(out).text().catch(() => ""))}${lines.join("\n")}\n`);
  }
  console.log(`accepted: ${slug} (default branch ${meta.default_branch})`);
}
