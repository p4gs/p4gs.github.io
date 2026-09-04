/**
 * The tool's control registry, read from its Rust source.
 *
 * WHY: this site holds THREE 44-entry tables keyed by control id —
 * CONTROL_REGISTRY (reclassify.ts), CONTROL_THREATS (threats.ts) and
 * CHECK_QUESTIONS (checks.ts). All three describe controls that are DEFINED
 * somewhere else entirely: `src/controls.rs` in the sscs-bootstrapper
 * repository. The site's tests checked the three tables against each other, so
 * they could stay perfectly consistent with one another while every one of them
 * drifted from the tool. The only mention of the real registry anywhere in the
 * site was a comment.
 *
 * WHY A VENDORED FIXTURE AND NOT A CROSS-REPO READ. The two live in different
 * repositories, and this site's CI checks out only its own. A test that read
 * `../sscs-bootstrapper/src/controls.rs` would pass on a laptop and be silently
 * unrunnable in CI, which is the worst of both. So the id list is committed here
 * (`test/fixtures/rust-control-ids.txt`), the hermetic test pins the three
 * tables to it, and a SECOND test re-derives the list from the Rust source
 * whenever that checkout is actually present — locally, or in a CI job that
 * checks out both — and fails on drift. Where it is absent the test reports as
 * skipped rather than passing quietly.
 *
 * Refresh with: `bun run refresh:controls` (see package.json).
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

/** Where the fixture lives. */
export const FIXTURE = new URL("../test/fixtures/rust-control-ids.txt", import.meta.url)
  .pathname;

/**
 * Candidate locations for the tool repository, most explicit first:
 *   1. `$SSCSB_REPO`
 *   2. a sibling checkout beside this site repo
 */
export function toolRepoPath(): string | null {
  const candidates = [
    process.env.SSCSB_REPO,
    resolve(new URL("../..", import.meta.url).pathname, "..", "sscs-bootstrapper"),
  ].filter((p): p is string => !!p);
  for (const c of candidates) {
    if (existsSync(join(c, "src", "controls.rs"))) return c;
  }
  return null;
}

/**
 * Every control id, in source order, from the Rust registry text.
 *
 * The registry is a `&[ControlDef]` of struct literals, so each entry's id is
 * the `id: "…"` field. `ControlDef`'s own field DECLARATION (`pub id: &'static
 * str`) does not match, and neither does anything in a doc comment.
 */
export function parseControlIds(rust: string): string[] {
  const body = rust.slice(rust.indexOf("pub const CONTROLS"));
  if (!body) throw new Error("controls.rs: no `pub const CONTROLS` table found");
  const ids = [...body.matchAll(/^\s*id:\s*"([a-z0-9][a-z0-9-]*)",\s*$/gm)].map(
    (m) => m[1]!,
  );
  if (ids.length === 0) throw new Error("controls.rs: parsed zero control ids");
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error(`controls.rs: duplicate ids ${dupes.join(", ")}`);
  return ids;
}

/** The vendored id list, sorted. Throws if the fixture is missing or empty. */
export async function fixtureIds(): Promise<string[]> {
  const text = await Bun.file(FIXTURE).text();
  const ids = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (!ids.length) throw new Error(`${FIXTURE}: no ids`);
  return ids;
}

/** Read the live Rust registry, or null when the checkout is not present. */
export async function liveIds(): Promise<string[] | null> {
  const repo = toolRepoPath();
  if (!repo) return null;
  return parseControlIds(await Bun.file(join(repo, "src", "controls.rs")).text());
}

if (import.meta.main) {
  const repo = toolRepoPath();
  if (!repo) {
    console.error(
      "sscs-bootstrapper checkout not found. Set SSCSB_REPO=/path/to/sscs-bootstrapper,\n" +
        "or check it out beside this repository, then re-run `bun run refresh:controls`.",
    );
    process.exit(1);
  }
  const ids = parseControlIds(await Bun.file(join(repo, "src", "controls.rs")).text());
  const header = [
    "# Control ids, vendored from sscs-bootstrapper src/controls.rs.",
    "# The site's three id-keyed tables are pinned to this list by",
    "# test/control-registry.test.ts. Do not hand-edit.",
    "# Refresh: bun run refresh:controls  (needs the tool repo checked out)",
    `# ${ids.length} controls`,
  ].join("\n");
  await Bun.write(FIXTURE, `${header}\n${[...ids].sort().join("\n")}\n`);
  console.log(`wrote ${ids.length} control ids → ${FIXTURE}`);
}
