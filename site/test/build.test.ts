import { describe, expect, test } from "bun:test";
import { BASE_PATH } from "../src/config";
import { escapeHtml, href } from "../src/render/layout";
import { renderDirectory, renderRepoDetail } from "../src/render/directory";
import { renderHome } from "../src/render/home";
import { renderMethodology } from "../src/render/methodology";
import { recordFilename, validateScanRecord, type ScanRecord } from "../src/schema";

function sampleRecord(overrides: Partial<ScanRecord> = {}): ScanRecord {
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "acme",
      name: "widget",
      url: "https://github.com/acme/widget",
      default_branch: "main",
      commit: "a".repeat(40),
      description: "A sample <script>alert(1)</script> repo",
    },
    scanned_at: "2026-09-01T12:00:00Z",
    scanner: {
      sscsb_version: "0.2.1",
      workflow_run_id: 1,
      workflow_run_url: "https://github.com/p4gs/sscs-bootstrapper/actions/runs/1",
    },
    request_issue: 57,
    controls: [
      {
        id: "codeql", phase: 4, in_scope: true, raw_outcome: "pass",
        scan_outcome: "pass", reclassified: false, reason: null, messages: ["ok"],
      },
    ],
    score: {
      grade: "F", provisional: false, overall_percent: 25,
      evidence_coverage_percent: 88.9,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 1, fail: 1, gap: 1, unverified: 1, info: 0, percent: 33.3,
      })),
    },
    ...overrides,
  };
}

describe("escapeHtml", () => {
  test("neutralizes script and attribute contexts", () => {
    expect(escapeHtml(`<script>x</script>`)).toBe("&lt;script&gt;x&lt;/script&gt;");
    expect(escapeHtml(`" onmouseover="evil()`)).toBe("&quot; onmouseover=&quot;evil()");
  });
});

describe("link integrity — every internal href carries BASE_PATH", () => {
  const pages: Array<[string, string]> = [
    ["home", renderHome(3)],
    ["directory", renderDirectory([sampleRecord()])],
    ["repo", renderRepoDetail(sampleRecord())],
    ["methodology", renderMethodology()],
  ];
  for (const [name, html] of pages) {
    test(`${name} page`, () => {
      const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]!);
      for (const h of hrefs) {
        if (h.startsWith("https://") || h.startsWith("mailto:")) continue;
        expect(h.startsWith(BASE_PATH)).toBe(true);
      }
    });
  }
  test("href() refuses to produce a bare-root link", () => {
    expect(href("directory/")).toBe(`${BASE_PATH}directory/`);
    expect(href("/directory/")).toBe(`${BASE_PATH}directory/`);
  });
});

describe("rendering escapes untrusted record fields", () => {
  test("repo description cannot inject markup", () => {
    const html = renderDirectory([sampleRecord()]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("validateScanRecord", () => {
  test("accepts the sample", () => {
    expect(() => validateScanRecord(sampleRecord())).not.toThrow();
  });
  test("rejects wrong schema_version loudly", () => {
    expect(() => validateScanRecord({ ...sampleRecord(), schema_version: 2 })).toThrow(
      /schema_version/,
    );
  });
  test("rejects malformed owner and traversal-shaped names", () => {
    const bad = sampleRecord();
    bad.repo = { ...bad.repo, owner: "../etc" };
    expect(() => validateScanRecord(bad)).toThrow(/owner/);
    const bad2 = sampleRecord();
    bad2.repo = { ...bad2.repo, name: "a/b" };
    expect(() => validateScanRecord(bad2)).toThrow(/name/);
  });
  test("rejects a non-sha commit", () => {
    const bad = sampleRecord();
    bad.repo = { ...bad.repo, commit: "HEAD" };
    expect(() => validateScanRecord(bad)).toThrow(/commit/);
  });
  test("rejects a bogus grade and short phase list", () => {
    const bad = sampleRecord();
    bad.score = { ...bad.score, grade: "Z" as never };
    expect(() => validateScanRecord(bad)).toThrow(/grade/);
    const bad2 = sampleRecord();
    bad2.score = { ...bad2.score, phases: bad2.score.phases.slice(0, 3) };
    expect(() => validateScanRecord(bad2)).toThrow(/phases/);
  });
  test("recordFilename lowercases into the two-dash form", () => {
    expect(recordFilename("Acme", "Widget.js")).toBe("acme--widget.js.json");
  });
});
