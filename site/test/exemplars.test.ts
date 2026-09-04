/**
 * The home page's three panels, and the thresholds that keep two of them
 * honest at small n.
 *
 * These tests exist because both ranked panels are WRONG at the directory's
 * current size, in ways that look right: "top rated" is a three-way tie on the
 * same grade broken by a number the detail pages say not to hold against a
 * repository, and "recently scanned" ranks a fifteen-second window inside one
 * scheduled batch. A panel that silently starts meaning something is the
 * failure mode; a stated threshold is itself a transparency claim.
 */
import { describe, expect, test } from "bun:test";
import {
  PANEL_SIZE,
  RECENT_BATCH_WINDOW_MS,
  TOP_RATED_MIN_LISTINGS,
  distinctGrades,
  listedSlugs,
  recentlyScanned,
  scansAreOneBatch,
  topRated,
  unansweredAcrossDirectory,
} from "../src/exemplars";
import type { Grade, ScanRecord } from "../src/schema";

let seq = 0;
function rec(opts: {
  name?: string;
  grade?: Grade;
  coverage?: number;
  scannedAt?: string;
  unverified?: string[];
}): ScanRecord {
  const name = opts.name ?? `repo${seq++}`;
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "acme", name, url: `https://github.com/acme/${name}`,
      default_branch: "main", commit: "a".repeat(40), description: "a repository",
    },
    scanned_at: opts.scannedAt ?? "2026-09-03T13:17:00.000Z",
    scanner: { sscsb_version: "0.3.0", workflow_run_id: 1, workflow_run_url: "https://x/1" },
    request_issue: null,
    controls: (opts.unverified ?? []).map((id) => ({
      id, phase: 1, in_scope: true, raw_outcome: "disabled" as const,
      scan_outcome: "unverified" as const, reclassified: true, reason: null, messages: [],
    })),
    score: {
      grade: opts.grade ?? "A+",
      provisional: (opts.coverage ?? 67) < 75,
      overall_percent: 100,
      evidence_coverage_percent: opts.coverage ?? 67,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 1, fail: 0, gap: 0, unverified: 0, info: 0, percent: 100,
      })),
    },
  };
}

describe("top rated — gated until a ranking would mean something", () => {
  test("the directory's actual shape (3 listings, one grade) shows no ranking", () => {
    const p = topRated([rec({}), rec({}), rec({})]);
    expect(p.ready).toBe(false);
    if (p.ready) return;
    expect(p.waitingFor).toContain("3 listings");
    expect(p.waitingFor).toContain("1 grade");
    expect(p.waitingFor).toContain(String(TOP_RATED_MIN_LISTINGS));
  });

  test("enough listings but a single grade is still a tie, not a ranking", () => {
    const many = Array.from({ length: TOP_RATED_MIN_LISTINGS + 4 }, () => rec({}));
    expect(distinctGrades(many)).toBe(1);
    expect(topRated(many).ready).toBe(false);
  });

  test("two grades and enough listings opens the panel, best first", () => {
    const many = [
      ...Array.from({ length: TOP_RATED_MIN_LISTINGS }, () => rec({ grade: "C" })),
      rec({ name: "best", grade: "A+" }),
      rec({ name: "second", grade: "A" }),
    ];
    const p = topRated(many);
    expect(p.ready).toBe(true);
    if (!p.ready) return;
    expect(p.items.length).toBe(PANEL_SIZE);
    expect(p.items[0]!.slug).toBe("acme/best");
    expect(p.items[1]!.slug).toBe("acme/second");
  });

  test("a listing whose evidence is thin says so on the card, in plain words", () => {
    const many = [
      ...Array.from({ length: TOP_RATED_MIN_LISTINGS }, () => rec({ grade: "C" })),
      rec({ name: "best", grade: "A+", coverage: 67.7 }),
    ];
    const p = topRated(many);
    expect(p.ready).toBe(true);
    if (!p.ready) return;
    const card = p.items[0]!;
    expect(card.incompleteNote).toContain("32.3%");
    expect(card.incompleteNote).toContain("could not be answered");
    expect(card.incompleteNote.toLowerCase()).not.toContain("provisional");
    expect(card.incompleteNote.toLowerCase()).not.toContain("coverage");
  });
});

describe("recently scanned — gated until the dates are not one batch", () => {
  test("scans seconds apart are one scheduled run, not a recency ordering", () => {
    const batch = [
      rec({ scannedAt: "2026-09-03T13:17:44.684Z" }),
      rec({ scannedAt: "2026-09-03T13:17:29.866Z" }),
      rec({ scannedAt: "2026-09-03T13:17:35.428Z" }),
    ];
    expect(scansAreOneBatch(batch)).toBe(true);
    const p = recentlyScanned(batch);
    expect(p.ready).toBe(false);
    if (p.ready) return;
    expect(p.waitingFor).toContain("same scheduled run");
  });

  test("independent schedules open the panel, newest first", () => {
    const spread = [
      rec({ name: "old", scannedAt: "2026-09-01T00:00:00.000Z" }),
      rec({ name: "new", scannedAt: "2026-09-03T00:00:00.000Z" }),
      rec({ name: "mid", scannedAt: "2026-09-02T00:00:00.000Z" }),
    ];
    expect(scansAreOneBatch(spread)).toBe(false);
    const p = recentlyScanned(spread);
    expect(p.ready).toBe(true);
    if (!p.ready) return;
    expect(p.items.map((i) => i.slug)).toEqual(["acme/new", "acme/mid", "acme/old"]);
  });

  test("the batch window is the boundary, and it is exact", () => {
    const base = Date.parse("2026-09-03T00:00:00.000Z");
    const inside = [
      rec({ scannedAt: new Date(base).toISOString() }),
      rec({ scannedAt: new Date(base - RECENT_BATCH_WINDOW_MS + 1000).toISOString() }),
    ];
    const outside = [
      rec({ scannedAt: new Date(base).toISOString() }),
      rec({ scannedAt: new Date(base - RECENT_BATCH_WINDOW_MS - 1000).toISOString() }),
    ];
    expect(scansAreOneBatch(inside)).toBe(true);
    expect(scansAreOneBatch(outside)).toBe(false);
  });

  test("a single listing cannot be a recency ordering", () => {
    expect(scansAreOneBatch([rec({})])).toBe(true);
    expect(recentlyScanned([]).ready).toBe(false);
  });
});

describe("still unchecked — an aggregate about evidence, never about repositories", () => {
  test("it counts how many listings left each check unanswered", () => {
    const s = unansweredAcrossDirectory([
      rec({ name: "a", unverified: ["commit-signing", "witness"] }),
      rec({ name: "b", unverified: ["commit-signing"] }),
      rec({ name: "c", unverified: ["commit-signing", "witness"] }),
    ]);
    expect(s.ofListings).toBe(3);
    expect(s.checks[0]).toEqual({
      id: "commit-signing",
      listings: 3,
      ofListings: 3,
      onlyMaintainerCanAnswer: true,
    });
    expect(s.checks[1]!.id).toBe("witness");
    expect(s.checks[1]!.listings).toBe(2);
  });

  test("it names no repository — that is the whole point of this slot", () => {
    const s = unansweredAcrossDirectory([
      rec({ name: "embarrassing-repo", unverified: ["commit-signing"] }),
    ]);
    expect(JSON.stringify(s)).not.toContain("embarrassing-repo");
  });

  test("it separates checks only a maintainer's machine can answer", () => {
    const s = unansweredAcrossDirectory([
      rec({ unverified: ["commit-signing", "sbom"] }),
    ]);
    const byId = Object.fromEntries(s.checks.map((c) => [c.id, c.onlyMaintainerCanAnswer]));
    expect(byId["commit-signing"]).toBe(true);
    expect(byId["sbom"]).toBe(false);
    expect(s.maintainerOnly).toBe(1);
  });

  test("an empty directory produces nothing rather than a divide-by-zero", () => {
    const s = unansweredAcrossDirectory([]);
    expect(s.checks).toEqual([]);
    expect(s.ofListings).toBe(0);
  });
});

describe("the listing index the home page embeds", () => {
  test("it is every slug, lowercased and sorted", () => {
    expect(listedSlugs([rec({ name: "Zed" }), rec({ name: "Alpha" })])).toEqual([
      "acme/alpha",
      "acme/zed",
    ]);
  });
});
