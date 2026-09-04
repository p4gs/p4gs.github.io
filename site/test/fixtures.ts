/**
 * A realistic listing and a design context, for suites that render whole pages.
 *
 * The shape mirrors what the live directory actually holds today: an A+ that is
 * PROVISIONAL because evidence coverage sits under the floor, with a class-C
 * control unverified. A fixture that scored 100% coverage would render none of
 * the honesty copy the pages are mostly made of.
 */
import { BASE_PATH } from "../src/config";
import { DESIGNS } from "../src/designs/registry";
import type { DesignCtx } from "../src/designs/types";
import type { ScanRecord } from "../src/schema";

export function rec(name: string, over: Partial<ScanRecord["score"]> = {}): ScanRecord {
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "p4gs",
      name,
      url: `https://github.com/p4gs/${name}`,
      default_branch: "main",
      commit: "b".repeat(40),
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

export const RECORDS: ScanRecord[] = [
  rec("sscsb-action"),
  rec("sscs-bootstrapper"),
  rec("p4gs.github.io"),
];

export function ctxFor(id: string, active = "home", _subpath = ""): DesignCtx {
  const prefix = id === DESIGNS[0]!.id ? BASE_PATH : `${BASE_PATH}_d/${id}/`;
  return {
    prefix,
    h: (p: string) => `${prefix}${p.replace(/^\//, "")}`,
    switcher: "",
    active,
  };
}
