/**
 * `build()` owns `site/dist/` — it is an OUTPUT, not an accumulator.
 *
 * The bug: `build()` mkdir'd DIST and then wrote into it, never clearing it. So
 * a listing removed from `site/data/repos/` kept everything the previous build
 * had written for it — its rendered detail page in all four design trees, its
 * republished `scan-record.json`, its Sigstore bundle — all still served at
 * their old URLs by a deploy that no longer knew they existed. Delisting a
 * repository has to actually delist it.
 *
 * This drives the real `build()` against the repository's real data, so it also
 * proves the build still produces a site after the clear.
 */
import { describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { build } from "../src/build";

const DIST = join(new URL("..", import.meta.url).pathname, "dist");

describe("a rebuild does not preserve what the build did not write", () => {
  test("a stale artifact — at the root and nested — is gone after a rebuild", async () => {
    // Two shapes: a top-level file, and one under the exact directory a
    // delisted repository's page would occupy.
    const rootStale = join(DIST, "__stale-from-an-older-build__.html");
    const nestedDir = join(DIST, "sscsb", "directory", "delisted--repo");
    const nestedStale = join(nestedDir, "index.html");
    const nestedRecord = join(nestedDir, "scan-record.json");

    await mkdir(nestedDir, { recursive: true });
    await writeFile(rootStale, "<h1>delisted</h1>");
    await writeFile(nestedStale, "<h1>a repository that is no longer listed</h1>");
    await writeFile(nestedRecord, "{}");
    for (const p of [rootStale, nestedStale, nestedRecord]) {
      expect(await Bun.file(p).exists()).toBe(true);
    }

    const { pages, repos, designs } = await build();

    for (const p of [rootStale, nestedStale, nestedRecord]) {
      expect(await Bun.file(p).exists()).toBe(false);
    }
    // …and the build still produced a site, rather than "cleaning" its way to
    // an empty directory.
    expect(pages).toBeGreaterThan(0);
    expect(designs).toBeGreaterThan(0);
    expect(await Bun.file(join(DIST, "index.html")).exists()).toBe(true);
    expect(await Bun.file(join(DIST, "sscsb", "index.html")).exists()).toBe(true);
    expect(await Bun.file(join(DIST, "sscsb", "directory", "index.html")).exists()).toBe(true);
    expect(repos).toBeGreaterThanOrEqual(0);
  });

  test("build() is idempotent — a second run over a clean tree is a no-op in kind", async () => {
    const first = await build();
    const second = await build();
    expect(second).toEqual(first);
    expect(await Bun.file(join(DIST, "index.html")).exists()).toBe(true);
  });

  test("it survives a dist/ that does not exist at all", async () => {
    await rm(DIST, { recursive: true, force: true });
    const { pages } = await build();
    expect(pages).toBeGreaterThan(0);
    expect(await Bun.file(join(DIST, "index.html")).exists()).toBe(true);
  });
});
