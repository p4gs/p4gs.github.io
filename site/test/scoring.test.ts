import { describe, expect, test } from "bun:test";
import type { ControlRecord } from "../src/schema";
import {
  COVERAGE_FLOOR_NA,
  COVERAGE_FLOOR_PROVISIONAL,
  computeScore,
  gradeFor,
} from "../src/scoring";

describe("gradeFor — owner-specified academic boundaries", () => {
  test("A+ requires exactly 100", () => {
    expect(gradeFor(100)).toBe("A+");
    expect(gradeFor(99.9)).toBe("A");
    expect(gradeFor(100.0)).toBe("A+");
  });
  test("each boundary edge lands on the higher grade", () => {
    expect(gradeFor(90)).toBe("A");
    expect(gradeFor(89.9)).toBe("B");
    expect(gradeFor(80)).toBe("B");
    expect(gradeFor(79.9)).toBe("C");
    expect(gradeFor(70)).toBe("C");
    expect(gradeFor(69.9)).toBe("D");
    expect(gradeFor(60)).toBe("D");
    expect(gradeFor(59.9)).toBe("F");
    expect(gradeFor(0)).toBe("F");
  });
});

/** Build a minimal in-scope control row. */
function ctl(
  phase: number,
  scan: ControlRecord["scan_outcome"],
  id = `c-${phase}-${scan}-${Math.random().toString(36).slice(2, 7)}`,
): ControlRecord {
  return {
    id,
    phase,
    in_scope: true,
    raw_outcome: "pass",
    scan_outcome: scan,
    reclassified: false,
    reason: null,
    messages: [],
  };
}

describe("computeScore", () => {
  test("unverified and info are never in any denominator", () => {
    const s = computeScore([
      ctl(1, "pass"),
      ctl(1, "unverified"),
      ctl(1, "unverified"),
      ctl(1, "info"),
    ]);
    expect(s.phases[0]!.percent).toBe(100); // 1/1 countable, not 1/4
    expect(s.overall_percent).toBe(100);
  });

  test("out-of-scope controls are excluded entirely", () => {
    const out = { ...ctl(1, "fail"), in_scope: false };
    const s = computeScore([ctl(1, "pass"), out]);
    expect(s.overall_percent).toBe(100);
  });

  test("gap counts against, like fail", () => {
    const s = computeScore([ctl(2, "pass"), ctl(2, "gap"), ctl(2, "fail"), ctl(2, "pass")]);
    expect(s.phases[1]!.percent).toBe(50);
  });

  test("zero countable in a phase renders null percent, not 0 or 100", () => {
    const s = computeScore([ctl(3, "unverified"), ctl(1, "pass")]);
    expect(s.phases[2]!.percent).toBeNull();
  });

  test("all-pass full-coverage scope earns A+ exactly", () => {
    const rows = [1, 2, 3, 4, 5].flatMap((p) => [ctl(p, "pass"), ctl(p, "pass")]);
    const s = computeScore(rows);
    expect(s.overall_percent).toBe(100);
    expect(s.grade).toBe("A+");
    expect(s.provisional).toBe(false);
    expect(s.evidence_coverage_percent).toBe(100);
  });

  test(`coverage below ${COVERAGE_FLOOR_NA}% yields NA, never a letter`, () => {
    // 1 countable pass + 9 unverified = 10% coverage.
    const rows = [ctl(1, "pass"), ...Array.from({ length: 9 }, () => ctl(2, "unverified"))];
    const s = computeScore(rows);
    expect(s.grade).toBe("NA");
    expect(s.overall_percent).toBe(100); // computed, but not graded
  });

  test(`coverage in [${COVERAGE_FLOOR_NA}, ${COVERAGE_FLOOR_PROVISIONAL}) marks the letter provisional`, () => {
    // 6 countable of 10 = 60% coverage; 6/6 pass = 100% → provisional A+.
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => ctl(1, "pass", `p${i}`)),
      ...Array.from({ length: 4 }, (_, i) => ctl(2, "unverified", `u${i}`)),
    ];
    const s = computeScore(rows);
    expect(s.grade).toBe("A+");
    expect(s.provisional).toBe(true);
  });

  test("empty scope is NA with zero coverage", () => {
    const s = computeScore([]);
    expect(s.grade).toBe("NA");
    expect(s.overall_percent).toBeNull();
    expect(s.evidence_coverage_percent).toBe(0);
  });

  test("plan worked example: 6 pass / 24 countable → 25.0% F, coverage 88.9%", () => {
    // Phase 1: 2 pass, 1 fail, 3 gap, 2 unverified (6 countable of 8)
    // Phase 2: 2 pass, 3 gap                        (5 of 5)
    // Phase 3: 1 fail, 6 gap                        (7 of 7)
    // Phase 4: 2 pass, 1 gap                        (3 of 3)
    // Phase 5: 3 gap, 1 info                        (3 of 4)
    const rows = [
      ctl(1, "pass"), ctl(1, "pass"), ctl(1, "fail"),
      ctl(1, "gap"), ctl(1, "gap"), ctl(1, "gap"),
      ctl(1, "unverified"), ctl(1, "unverified"),
      ctl(2, "pass"), ctl(2, "pass"), ctl(2, "gap"), ctl(2, "gap"), ctl(2, "gap"),
      ctl(3, "fail"), ctl(3, "gap"), ctl(3, "gap"), ctl(3, "gap"),
      ctl(3, "gap"), ctl(3, "gap"), ctl(3, "gap"),
      ctl(4, "pass"), ctl(4, "pass"), ctl(4, "gap"),
      ctl(5, "gap"), ctl(5, "gap"), ctl(5, "gap"), ctl(5, "info"),
    ];
    const s = computeScore(rows);
    expect(s.overall_percent).toBe(25);
    expect(s.grade).toBe("F");
    expect(s.provisional).toBe(false);
    expect(s.evidence_coverage_percent).toBe(88.9);
    expect(s.phases[0]!.percent).toBe(33.3);
    expect(s.phases[1]!.percent).toBe(40);
    expect(s.phases[2]!.percent).toBe(0);
    expect(s.phases[3]!.percent).toBe(66.7);
    expect(s.phases[4]!.percent).toBe(0);
  });
});
