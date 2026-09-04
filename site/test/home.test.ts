/**
 * The home page, in all four designs.
 *
 * The switcher advertises the four as equivalent, so "the ledger got the new
 * home page" is not a shippable state — every assertion here runs against
 * every registered design.
 *
 * The plain-language rule these tests enforce: the home page contains none of
 * the vocabulary the audit found undefined on it. Prose only — an identifier
 * inside `<code>` is a label, not a sentence, and the site has always let a
 * terminal transcript carry tool names a reader does not know. Everything
 * outside a code span has to stand on its own.
 */
import { describe, expect, test } from "bun:test";
import { assertQuestionParity, CHECK_QUESTIONS } from "../src/checks";
import { BASE_PATH } from "../src/config";
import { DESIGNS } from "../src/designs/registry";
import type { DesignCtx } from "../src/designs/types";
import { GLOSSARY, RETIRED_ON_HOME } from "../src/glossary";
import type { ScanRecord } from "../src/schema";
import { textFrom } from "./html-text";

function rec(name: string, over: Partial<ScanRecord["score"]> = {}): ScanRecord {
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "p4gs", name, url: `https://github.com/p4gs/${name}`,
      default_branch: "main", commit: "b".repeat(40),
      description: "A repository with a description long enough to need clamping in a card.",
    },
    scanned_at: "2026-09-03T13:17:44.684Z",
    scanner: { sscsb_version: "0.3.0", workflow_run_id: 9, workflow_run_url: "https://x/9" },
    request_issue: null,
    controls: [
      {
        id: "commit-signing", phase: 1, in_scope: true, raw_outcome: "disabled",
        scan_outcome: "unverified", reclassified: true, reason: null, messages: [],
      },
      {
        id: "codeql", phase: 4, in_scope: true, raw_outcome: "pass",
        scan_outcome: "pass", reclassified: false, reason: null, messages: [],
      },
    ],
    score: {
      grade: "A+", provisional: true, overall_percent: 100,
      evidence_coverage_percent: 67.7,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 1, fail: 0, gap: 0, unverified: 1, info: 0, percent: 100,
      })),
      ...over,
    },
  };
}

const RECORDS = [rec("sscsb-action"), rec("sscs-bootstrapper"), rec("p4gs.github.io")];

function ctxFor(id: string): DesignCtx {
  const prefix = id === DESIGNS[0]!.id ? BASE_PATH : `${BASE_PATH}_d/${id}/`;
  return {
    prefix,
    h: (p: string) => `${prefix}${p.replace(/^\//, "")}`,
    switcher: "",
    active: "home",
  };
}

const HOMES: Array<[string, string]> = DESIGNS.map((d) => [
  d.id,
  d.renderHome(RECORDS, ctxFor(d.id)),
]);

/**
 * Everything outside a `<code>` element and outside tag markup.
 *
 * WHAT WAS WRONG. This was four regexes, and the script and style rules carried
 * no `i` flag: `<SCRIPT>…</SCRIPT>` matched nothing, so a design that shouted
 * its tag names had its JavaScript measured as page copy — the banned-
 * vocabulary check below would then have been reading `location`, `replace` and
 * every string literal in the switcher as prose the reader sees. The tag rule
 * `/<[^>]+>/g` was wrong in the other direction: it ends a tag at the first
 * `>`, including one inside a quoted attribute value, leaking the rest of the
 * attribute into the text.
 *
 * `textFrom` hands the same question to a real HTML parser, which agrees with
 * the browser about all of it.
 */
function prose(html: string): string {
  return textFrom(html, ["code", "script", "style"]);
}

describe("every design renders the new home page", () => {
  test("all four designs are covered by this suite", () => {
    expect(HOMES.length).toBe(4);
    expect(HOMES.map(([id]) => id).sort()).toEqual(["chain", "console", "ledger", "manual"]);
  });

  for (const [id, html] of HOMES) {
    describe(id, () => {
      test("the search control is above everything else that is interactive", () => {
        expect(html).toContain('id="dir-filter"');
        expect(html).toContain('id="dir-scan"');
        expect(html).toContain('id="dir-scan-cta"');
        expect(html).toContain('id="dir-scan-status"');
        // The input comes before the exemplar panels in document order.
        expect(html.indexOf('id="dir-filter"')).toBeLessThan(html.indexOf('id="top-rated"'));
      });

      /**
       * The bug the exemplar-data map found: with no directory table on the
       * page, filter.js's "already listed" scan finds nothing and the page
       * offers to scan repositories that already have listings. The index is
       * the data source that fixes it, so its absence is a regression.
       */
      test("it embeds the listing index filter.js needs to answer 'already listed'", () => {
        expect(html).toContain('id="dir-index"');
        const m = html.match(/<script type="application\/json" id="dir-index">(.*?)<\/script>/s);
        expect(m).not.toBeNull();
        expect(JSON.parse(m![1]!)).toEqual([
          "p4gs/p4gs.github.io",
          "p4gs/sscs-bootstrapper",
          "p4gs/sscsb-action",
        ]);
        expect(html).toContain("filter.js");
        expect(html).toContain('id="dir-found"');
        expect(html).toContain('data-detail-base=');
      });

      test("all three exemplar panels are present", () => {
        expect(html).toContain('id="top-rated"');
        expect(html).toContain('id="recently-scanned"');
        expect(html).toContain('id="still-unchecked"');
      });

      test("at this directory size, both ranked panels explain their own emptiness", () => {
        expect(html).toContain("hp-waiting");
        expect(html).toContain("12 listings");
        expect(html).toContain("same scheduled run");
      });

      test("the aggregate panel names a check and no repository", () => {
        const start = html.indexOf('id="still-unchecked"');
        const end = html.indexOf("</section>", start);
        const panel = html.slice(start, end);
        expect(panel).toContain("commit-signing");
        expect(panel).toContain(CHECK_QUESTIONS["commit-signing"]!);
        expect(panel).not.toContain("sscsb-action");
        expect(panel).not.toContain("p4gs/");
      });

      test("the compact taxonomy links every class to its explainer", () => {
        for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
          expect(html).toContain(`methodology/#threat-a${n}`);
        }
      });

      test("it uses none of the vocabulary the audit found undefined here", () => {
        const text = prose(html).toLowerCase();
        const found = RETIRED_ON_HOME.filter((t) => text.includes(t.toLowerCase()));
        expect(found).toEqual([]);
      });

      test("its grade cards say what could not be checked, in words", () => {
        // The three A+ listings are all below the coverage floor, so if any
        // card renders it must carry the honesty line rather than the word.
        if (html.includes("hp-card-note")) {
          expect(html).toContain("could not be answered");
        }
      });
    });
  }
});

describe("the terms that survive are defined where they are used", () => {
  const OTHER: Array<[string, string]> = DESIGNS.flatMap((d) => [
    [`${d.id} methodology`, d.renderMethodology(ctxFor(d.id))] as [string, string],
    [`${d.id} directory`, d.renderDirectory(RECORDS, ctxFor(d.id))] as [string, string],
  ]);

  test("every glossary term has a plain definition under 25 words", () => {
    for (const [key, e] of Object.entries(GLOSSARY)) {
      expect(e.plain.split(/\s+/).length).toBeLessThan(25);
      expect(e.plain).not.toContain(key);
    }
  });

  for (const [name, html] of OTHER) {
    test(`${name}: each term it uses carries its definition on the same page`, () => {
      const text = prose(html).toLowerCase();
      for (const [key, e] of Object.entries(GLOSSARY)) {
        if (!text.includes(e.term.toLowerCase())) continue;
        expect(html).toContain(`data-defines="${key}"`);
      }
    });
  }

  test("the methodology page carries the full taxonomy and the question table", () => {
    for (const d of DESIGNS) {
      const html = d.renderMethodology(ctxFor(d.id));
      expect(html).toContain('id="threats"');
      expect(html).toContain('id="threat-a1"');
      expect(html).toContain('id="every-check"');
      expect(html).toContain("xz / liblzma backdoor");
    }
  });
});

describe("the plain-English questions", () => {
  test("every check has one, and nothing has one without being a check", () => {
    expect(() => assertQuestionParity()).not.toThrow();
    expect(Object.keys(CHECK_QUESTIONS).length).toBe(44);
  });

  test("each is a question, 5 to 14 words, in scorecard.dev's register", () => {
    for (const [id, q] of Object.entries(CHECK_QUESTIONS)) {
      expect(q.endsWith("?"), `${id}: "${q}"`).toBe(true);
      const words = q.split(/\s+/).length;
      expect(words, `${id}: "${q}" is ${words} words`).toBeGreaterThanOrEqual(5);
      expect(words, `${id}: "${q}" is ${words} words`).toBeLessThanOrEqual(14);
    }
  });

  /** They print on the home page, where the reader has learned nothing yet. */
  test("no question uses a retired term", () => {
    for (const [id, q] of Object.entries(CHECK_QUESTIONS)) {
      for (const t of RETIRED_ON_HOME) {
        expect(q.toLowerCase().includes(t.toLowerCase()), `${id}: "${q}" uses "${t}"`).toBe(false);
      }
    }
  });
});
