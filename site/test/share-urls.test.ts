/**
 * The absolute URLs the designs paste into text that is read OFF this site —
 * the prefilled issue bodies that nudge a repository to publish a scan.
 *
 * These had been four fully-hardcoded literals per design (origin, base path
 * and all). Nothing tested them, so when the site moved from
 * `tools.sensiblesecurity.xyz/sscsb/` to the root of `sscsb.dev`, every one of
 * them would have kept shipping the old host into other people's issue
 * trackers, and the whole suite would have stayed green. That is the failure
 * this file exists to make impossible: the assertions are about the ORIGIN the
 * text carries, not about a spelling, so a design that re-hardcodes any host
 * fails here whatever it hardcodes.
 */
import { describe, expect, test } from "bun:test";
import { BASE_PATH, SITE_ORIGIN, SITE_REPO_URL } from "../src/config";
import {
  listingShareUrl,
  LOCAL_METHODOLOGY_SHARE_URL,
  METHODOLOGY_SHARE_URL,
  shareUrl,
} from "../src/designs/share-urls";
import { chain } from "../src/designs/chain/index";
import { consoleDesign } from "../src/designs/console/index";
import { ledger } from "../src/designs/ledger/index";
import type { ScanRecord } from "../src/schema";
import { ctxFor, rec } from "./fixtures";
import { decodeEntities } from "./html-text";

describe("shareUrl", () => {
  test("is absolute, on this site's own origin and base path", () => {
    const u = new URL(shareUrl("methodology/"));
    expect(u.origin).toBe(SITE_ORIGIN);
    expect(u.pathname).toBe(`${BASE_PATH}methodology/`);
  });

  test("a leading slash on the path does not double the base path", () => {
    expect(shareUrl("/directory/")).toBe(shareUrl("directory/"));
  });

  test("the published methodology anchors survive the join", () => {
    expect(new URL(METHODOLOGY_SHARE_URL).pathname).toBe(`${BASE_PATH}methodology/`);
    expect(new URL(LOCAL_METHODOLOGY_SHARE_URL).hash).toBe("#local");
  });
});

describe("listingShareUrl", () => {
  test("lower-cases the slug the directory publishes pages under", () => {
    const u = new URL(listingShareUrl("P4gs", "SSCS-Bootstrapper"));
    expect(u.pathname).toBe(`${BASE_PATH}directory/p4gs--sscs-bootstrapper/`);
    expect(u.origin).toBe(SITE_ORIGIN);
  });
});

/**
 * Driven through each design's PUBLIC render, not through the per-design
 * `nudgeIssueUrl` helpers: two of the three keep theirs module-private on
 * purpose ("designs never import each other"), and the rendered href is the
 * thing a maintainer actually clicks anyway.
 *
 * The list is spelled out rather than taken from the registry because the
 * `manual` design is being retired in a separate change and still carries its
 * original hardcoded literals; widen this to DESIGNS once it is gone.
 */
describe("the prefilled nudge every design puts on a repository's issue tracker", () => {
  for (const design of [ledger, consoleDesign, chain]) {
    /**
     * Two layers of encoding sit between the assertion and the text: the body
     * is `encodeURIComponent`-ed into the query, and the whole href is then
     * HTML-escaped into the attribute. BOTH have to come off, and in that
     * order. Decoding only `&amp;` silently truncates every body at its first
     * apostrophe — `encodeURIComponent` leaves `'` alone, `escapeHtml` turns it
     * into `&#39;`, and URLSearchParams then reads that `&` as the start of a
     * new parameter. A browser gets this right; a half-done test decoder does
     * not, and would have asserted about the first three words of the text.
     */
    const bodiesIn = (r: ScanRecord): string[] => {
      const html = design.renderRepoDetail(r, ctxFor(design.id, "directory", "directory/"));
      const out: string[] = [];
      for (const m of html.matchAll(/href="(https:\/\/github\.com\/[^"]*issues\/new\?[^"]*)"/g)) {
        const body = new URL(decodeEntities(m[1]!)).searchParams.get("body");
        if (body) out.push(body);
      }
      return out;
    };

    /**
     * BOTH nudges, because they are different call sites with different URLs:
     * the coverage panel's local-scan nudge renders for any provisional
     * listing, and the "suggest an authenticated scan" nudge renders only for
     * an EXTERNAL-lane record — one whose scan ran in this site's own repo.
     * Rendering the default fixture alone exercises exactly one of them, which
     * is how a reintroduced hardcoded host in the other survives a green run.
     */
    const nudgeBodies = (name: string): string[] => {
      const base = rec(name);
      const external: ScanRecord = {
        ...base,
        scanner: { ...base.scanner, workflow_run_url: `${SITE_REPO_URL}/actions/runs/9` },
      };
      return [...bodiesIn(base), ...bodiesIn(external)];
    };

    test(`${design.id}: both the local-scan and authenticated-scan nudges render`, () => {
      const bodies = nudgeBodies("sscs-bootstrapper");
      expect(bodies.length).toBeGreaterThanOrEqual(2);
      expect(new Set(bodies).size).toBeGreaterThanOrEqual(2);
    });

    test(`${design.id}: every link in a nudge body is on this site or on github.com`, () => {
      for (const body of nudgeBodies("sscs-bootstrapper")) {
        const origins = [...body.matchAll(/https?:\/\/[^\s)]+/g)].map((m) => new URL(m[0]).origin);
        expect(origins.length).toBeGreaterThan(0);
        for (const o of origins) expect([SITE_ORIGIN, "https://github.com"]).toContain(o);
      }
    });

    test(`${design.id}: a nudge links this listing and the methodology on this site`, () => {
      const all = nudgeBodies("sscs-bootstrapper").join("\n");
      expect(all).toContain(listingShareUrl("p4gs", "sscs-bootstrapper"));
      expect(all).toContain(METHODOLOGY_SHARE_URL);
    });

    /**
     * A URL shared into somebody else's tracker has to land on the canonical
     * page, never on whichever alternate design the reader happened to be on.
     * `_d/` inside a nudge body would be exactly that bug.
     */
    test(`${design.id}: a nudge points at the default tree, never an alternate design`, () => {
      for (const body of nudgeBodies("sscs-bootstrapper")) expect(body).not.toContain("_d/");
    });
  }
});
