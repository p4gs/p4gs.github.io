/**
 * The attack-class taxonomy: drift, derivation, and the honesty rules.
 *
 * The parity test is the important one. The threat map is a THIRD table keyed
 * by control id (after `src/controls.rs` in the tool and `reclassify.ts` here),
 * and without a mechanical link a 45th control would map to nothing, defend
 * nothing, and the exposure panel would under-report with no error anywhere.
 */
import { describe, expect, test } from "bun:test";
import { CONTROL_REGISTRY } from "../src/reclassify";
import type { ControlRecord, ScanRecord } from "../src/schema";
import {
  ATTACK_CLASSES,
  assertParity,
  CONTROL_THREATS,
  controlsDefending,
  exposureFor,
  exposureLine,
  POSTURE_DISCLOSURE_CONTROLS,
  PRIMARY_SOURCES,
  threatsFor,
} from "../src/threats";
import { exposurePanel, threatsSection } from "../src/designs/threats-shared";

const h = (p: string) => `/sscsb/${p}`;

function control(id: string, outcome: ControlRecord["scan_outcome"]): ControlRecord {
  return {
    id,
    phase: CONTROL_REGISTRY[id]?.phase ?? 1,
    in_scope: true,
    raw_outcome: outcome === "gap" || outcome === "unverified" ? "disabled" : "pass",
    scan_outcome: outcome,
    reclassified: false,
    reason: null,
    messages: [],
  };
}

function record(controls: ControlRecord[]): ScanRecord {
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "acme", name: "widget", url: "https://github.com/acme/widget",
      default_branch: "main", commit: "a".repeat(40), description: "d",
    },
    scanned_at: "2026-09-01T12:00:00Z",
    scanner: { sscsb_version: "0.3.0", workflow_run_id: 1, workflow_run_url: "https://x/1" },
    request_issue: null,
    controls,
    score: {
      grade: "B", provisional: true, overall_percent: 80, evidence_coverage_percent: 60,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 1, fail: 0, gap: 0, unverified: 0, info: 0, percent: 100,
      })),
    },
  };
}

describe("drift — the threat map against the control registry", () => {
  test("every registered control has a mapping, and nothing maps to a ghost", () => {
    expect(() => assertParity()).not.toThrow();
  });

  test("the two tables have identical key sets", () => {
    expect(Object.keys(CONTROL_THREATS).sort()).toEqual(Object.keys(CONTROL_REGISTRY).sort());
  });

  test("an unmapped control id is an error, never a guess", () => {
    expect(() => threatsFor("a-control-invented-in-2027")).toThrow(/no attack-class mapping/);
  });

  test("the posture-disclosure sentinel is a real empty list, not a missing key", () => {
    expect(POSTURE_DISCLOSURE_CONTROLS).toEqual([
      "best-practices-badge",
      "compliance-map",
      "osps-baseline",
      "secure-repo",
      "security-insights",
    ]);
    for (const id of POSTURE_DISCLOSURE_CONTROLS) {
      expect(id in CONTROL_THREATS).toBe(true);
      expect(threatsFor(id)).toEqual([]);
    }
  });

  test("every class is defended by at least one control and carries an incident", () => {
    for (const c of ATTACK_CLASSES) {
      expect(controlsDefending(c.id).length).toBeGreaterThan(0);
      expect(c.incidents.length).toBeGreaterThan(0);
      for (const i of c.incidents) {
        expect(i.url.startsWith("https://")).toBe(true);
        expect(i.when.length).toBeGreaterThan(3);
      }
    }
  });

  test("there are nine classes and they are A1..A9", () => {
    expect(ATTACK_CLASSES.map((c) => c.id)).toEqual([
      "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9",
    ]);
  });
});

describe("exposure derivation", () => {
  test("a class whose controls all passed is `evidenced`, never `safe`", () => {
    const ids = controlsDefending("A8");
    const e = exposureFor(record(ids.map((id) => control(id, "pass")))).find(
      (x) => x.cls.id === "A8",
    )!;
    expect(e.state).toBe("evidenced");
    expect(exposureLine(e)).toBe(`Every check passed — ${ids.length} of ${ids.length}.`);
    expect(exposureLine(e).toLowerCase()).not.toContain("safe");
  });

  /**
   * The overstatement this catches: a class can be fully evidenced on the
   * checks that produced an answer while several others in the SAME class
   * produced none. "All checks passed" reads as coverage the scan never had.
   */
  test("a class evidenced on part of itself does not claim the whole of itself", () => {
    const ids = controlsDefending("A8");
    const e = exposureFor(
      record([
        ...ids.filter((id) => id !== "sighthound").map((id) => control(id, "pass")),
        control("sighthound", "unverified"),
      ]),
    ).find((x) => x.cls.id === "A8")!;
    expect(e.state).toBe("evidenced");
    expect(e.notObserved).toEqual(["sighthound"]);
    expect(exposureLine(e)).toBe(
      "Every answered check passed — 4 of 4. 1 more produced no answer.",
    );
    const html = exposurePanel(h, record([
      ...ids.filter((id) => id !== "sighthound").map((id) => control(id, "pass")),
      control("sighthound", "unverified"),
    ]));
    expect(html).toContain("All answered checks passed");
    expect(html).not.toContain(">All checks passed<");
  });

  test("a class with countable controls and no passes reads `No defence found`", () => {
    const ids = controlsDefending("A8");
    const e = exposureFor(record(ids.map((id) => control(id, "gap")))).find(
      (x) => x.cls.id === "A8",
    )!;
    expect(e.state).toBe("none-found");
    expect(exposureLine(e)).toContain("No defence found");
    expect(e.absent).toEqual(ids);
  });

  test("`fail` and `gap` are collapsed for the count but kept apart in the detail", () => {
    const ids = controlsDefending("A8");
    const e = exposureFor(
      record([control(ids[0]!, "fail"), ...ids.slice(1).map((id) => control(id, "pass"))]),
    ).find((x) => x.cls.id === "A8")!;
    expect(e.state).toBe("partial");
    expect(e.broken).toEqual([ids[0]!]);
    expect(e.absent).toEqual([]);
  });

  /**
   * The single failure that would contradict the project's own doctrine:
   * `unverified` is "nobody looked", not "nothing there". Rendering it as a
   * missing defence turns the directory into a false-assurance machine in the
   * inverse direction.
   */
  test("unverified never becomes a missing defence", () => {
    const ids = controlsDefending("A6");
    const e = exposureFor(record(ids.map((id) => control(id, "unverified")))).find(
      (x) => x.cls.id === "A6",
    )!;
    expect(e.state).toBe("not-observed");
    expect(e.absent).toEqual([]);
    expect(e.broken).toEqual([]);
    expect(e.notObserved.length).toBe(ids.length);
    expect(exposureLine(e)).toContain("Not observed");
  });

  test("class-C controls are named as maintainer-only when nothing answered them", () => {
    const e = exposureFor(
      record(controlsDefending("A6").map((id) => control(id, "unverified"))),
    ).find((x) => x.cls.id === "A6")!;
    expect(e.localOnly.length).toBeGreaterThan(0);
    expect(exposureLine(e)).toContain("maintainer's own machine");
  });

  test("ordering is by evidence, not by class number or drama", () => {
    const a8 = controlsDefending("A8");
    const a4 = controlsDefending("A4");
    const rows = exposureFor(
      record([
        ...a8.map((id) => control(id, "pass")),
        ...a4.map((id) => control(id, "gap")),
      ]),
    );
    const order = rows.map((r) => r.state);
    const rank = { "none-found": 0, partial: 1, "not-observed": 2, evidenced: 3 } as const;
    for (let i = 1; i < order.length; i++) {
      expect(rank[order[i]!]).toBeGreaterThanOrEqual(rank[order[i - 1]!]);
    }
    expect(rows[0]!.state).toBe("none-found");
  });

  test("controls outside the record's scope contribute nothing", () => {
    const rows = exposureFor(record([control("codeql", "pass")]));
    const a8 = rows.find((r) => r.cls.id === "A8")!;
    expect(a8.passed).toEqual(["codeql"]);
    expect(a8.state).toBe("evidenced");
    const a1 = rows.find((r) => r.cls.id === "A1")!;
    expect(a1.state).toBe("not-observed");
  });
});

describe("wording — what the rendered pages may never say", () => {
  const banned = [
    "vulnerable to",
    "exposed to",
    "at risk of",
    "unprotected against",
    "high risk",
    "critical exposure",
  ];

  const pages: Array<[string, string]> = [
    ["taxonomy section", threatsSection(h)],
    [
      "exposure panel (nothing found)",
      exposurePanel(h, record(controlsDefending("A8").map((id) => control(id, "gap")))),
    ],
    [
      "exposure panel (nothing observed)",
      exposurePanel(h, record(controlsDefending("A6").map((id) => control(id, "unverified")))),
    ],
  ];

  for (const [name, html] of pages) {
    test(`${name} makes no claim about the repository the scan did not measure`, () => {
      const lower = html.toLowerCase();
      for (const phrase of banned) expect(lower).not.toContain(phrase);
    });
  }

  test("the exposure panel carries the standing caveat and the posture group", () => {
    const html = exposurePanel(h, record([control("codeql", "pass")]));
    expect(html).toContain("not weaknesses it found");
    for (const id of POSTURE_DISCLOSURE_CONTROLS) expect(html).toContain(id);
  });

  test("incidents live in their own block, never in a sentence about the repo", () => {
    const html = exposurePanel(h, record(controlsDefending("A5").map((id) => control(id, "gap"))));
    for (const c of ATTACK_CLASSES) {
      for (const i of c.incidents) expect(html).not.toContain(i.title);
    }
    // …and they ARE on the explainer page.
    expect(threatsSection(h)).toContain("xz / liblzma backdoor");
  });

  test("every class deep-links from the panel to its own explainer anchor", () => {
    const html = exposurePanel(h, record([control("codeql", "pass")]));
    for (const c of ATTACK_CLASSES) {
      expect(html).toContain(`methodology/#threat-${c.id.toLowerCase()}`);
      expect(threatsSection(h)).toContain(`id="threat-${c.id.toLowerCase()}"`);
    }
  });

  /**
   * `primary` is a claim about US — that this site opened the document — not a
   * claim that the document exists. One incident (Apache Struts CVE-2017-5638)
   * carried the mark on a record nobody here had fetched, added alongside
   * Log4Shell because both are first-party bugs and marked by pattern-match.
   * On a page whose entire argument is evidence over assertion, that is the one
   * mistake that cannot be shrugged off.
   */
  test("every `primary` mark rests on a source actually opened and recorded", () => {
    const unbacked = ATTACK_CLASSES.flatMap((c) => c.incidents)
      .filter((i) => i.sourced === "primary")
      .filter((i) => !(i.url in PRIMARY_SOURCES))
      .map((i) => `${i.title} → ${i.url}`);
    expect(
      unbacked,
      "mark it `reported`, or open the source and add it to PRIMARY_SOURCES with what you read",
    ).toEqual([]);
  });

  test("the recorded-source list has no entries nothing cites", () => {
    const cited = new Set(ATTACK_CLASSES.flatMap((c) => c.incidents).map((i) => i.url));
    expect(Object.keys(PRIMARY_SOURCES).filter((u) => !cited.has(u))).toEqual([]);
  });

  test("each recorded source carries what was read from it, not just a URL", () => {
    for (const [url, note] of Object.entries(PRIMARY_SOURCES)) {
      expect(url).toMatch(/^https:\/\//);
      // A note short enough to be a placeholder is not evidence of a read.
      expect(note.split(/\s+/).length, url).toBeGreaterThanOrEqual(8);
    }
  });

  test("a source we did not open ourselves is labelled, not laundered", () => {
    const reported = ATTACK_CLASSES.flatMap((c) => c.incidents).filter(
      (i) => i.sourced === "reported",
    );
    const html = threatsSection(h);
    for (const i of reported) {
      expect(html).toContain(i.title);
      expect(html).toContain("tx-reported");
    }
  });
});
