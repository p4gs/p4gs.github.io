import { describe, expect, test } from "bun:test";
import {
  CONTROL_CLASSES,
  reclassify,
  sanitizeMessage,
  type ReclassifyInput,
  type VerifyRow,
} from "../src/reclassify";

const DEFAULT_ON = new Set([
  "secrets", "commit-signing", "signing-model", "branch-protection", "actions-audit",
  "ai-trailers", "ai-dep-gate", "pr-template",
  "sbom", "vuln-scan", "scorecard", "renovate", "package-trust",
  "sigstore-signing", "slsa-provenance", "github-attestations", "sbom-attestation",
  "provenance-verify", "octo-sts", "harden-runner",
  "sast", "codeql", "workflow-audit-extended", "secure-repo",
  "openvex", "security-insights", "best-practices-badge", "osps-baseline", "compliance-map",
]);

function row(control: string, outcome: VerifyRow["outcome"], artifacts: string[] = []): VerifyRow {
  return { control, phase: 1, name: control, outcome, messages: [], artifacts, tools: [] };
}

function input(partial: Partial<ReclassifyInput>): ReclassifyInput {
  return {
    rows: [],
    preFiles: new Set(),
    workflowsPre: 0,
    enabled: new Set(),
    defaultEnabled: DEFAULT_ON,
    ...partial,
  };
}

describe("reclassify", () => {
  test("init-created artifact demotes a raw pass to gap", () => {
    const rows = [row("codeql", "pass", [".github/workflows/codeql.yml"])];
    const [r] = reclassify(input({ rows, workflowsPre: 1 }));
    expect(r!.scan_outcome).toBe("gap");
    expect(r!.reclassified).toBe(true);
    expect(r!.reason).toContain("scanner's own init");
  });

  test("pre-existing artifact keeps a raw pass as pass", () => {
    const rows = [row("codeql", "pass", [".github/workflows/codeql.yml"])];
    const preFiles = new Set([".github/workflows/codeql.yml"]);
    const [r] = reclassify(input({ rows, preFiles, workflowsPre: 1 }));
    expect(r!.scan_outcome).toBe("pass");
    expect(r!.reclassified).toBe(false);
  });

  test("pre-existing-but-gutted artifact keeps a raw fail as fail", () => {
    const rows = [row("codeql", "fail", [".github/workflows/codeql.yml"])];
    const preFiles = new Set([".github/workflows/codeql.yml"]);
    const [r] = reclassify(input({ rows, preFiles, workflowsPre: 1 }));
    expect(r!.scan_outcome).toBe("fail");
  });

  test("tool-control degraded with all artifacts pre-existing becomes pass", () => {
    const arts = [".github/workflows/secrets-scan.yml"];
    const rows = [row("secrets", "degraded", arts)];
    const [r] = reclassify(input({ rows, preFiles: new Set(arts), workflowsPre: 1 }));
    expect(r!.scan_outcome).toBe("pass");
    expect(r!.reclassified).toBe(true);
    expect(r!.reason).toContain("runner-tool availability");
  });

  test("class C never yields a verdict — even a raw pass goes unverified", () => {
    const [r] = reclassify(input({ rows: [row("commit-signing", "pass")] }));
    expect(r!.scan_outcome).toBe("unverified");
    expect(r!.reclassified).toBe(true);
  });

  test("class A′ is vacuous with zero pre-existing workflows", () => {
    const [r] = reclassify(input({ rows: [row("actions-audit", "pass")], workflowsPre: 0 }));
    expect(r!.scan_outcome).toBe("unverified");
    expect(r!.reason).toContain("vacuous");
  });

  test("class A′ maps a raw fail directly when workflows pre-existed", () => {
    const [r] = reclassify(input({ rows: [row("harden-runner", "fail")], workflowsPre: 3 }));
    expect(r!.scan_outcome).toBe("fail");
  });

  test("class B (branch-protection) maps raw verdicts directly", () => {
    const [r] = reclassify(input({ rows: [row("branch-protection", "fail")] }));
    expect(r!.scan_outcome).toBe("fail");
  });

  test("disabled default-on control scores gap — denominator cannot shrink", () => {
    const [r] = reclassify(input({ rows: [row("codeql", "disabled")], workflowsPre: 1 }));
    expect(r!.in_scope).toBe(true);
    expect(r!.scan_outcome).toBe("gap");
  });

  test("optional control not enabled is out of scope, info", () => {
    const [r] = reclassify(input({ rows: [row("witness", "disabled")] }));
    expect(r!.in_scope).toBe(false);
    expect(r!.scan_outcome).toBe("info");
  });

  test("optional control the target enabled enters scope", () => {
    const [r] = reclassify(
      input({ rows: [row("gittuf", "fail")], enabled: new Set(["gittuf"]), workflowsPre: 1 }),
    );
    expect(r!.in_scope).toBe(true);
    expect(r!.scan_outcome).toBe("fail");
  });

  test("meta controls are always out of scope", () => {
    const [r] = reclassify(input({ rows: [row("compliance-map", "pass")] }));
    expect(r!.in_scope).toBe(false);
  });

  test("an unclassified control id throws — fail closed", () => {
    expect(() => reclassify(input({ rows: [row("future-control", "pass")] }))).toThrow(
      /unclassified control/,
    );
  });

  test("fresh-init fixture: everything class-A is a gap, nothing passes", () => {
    // Simulates scanning a repo with no supply-chain posture at all.
    const rows = Object.entries(CONTROL_CLASSES)
      .filter(([, cls]) => cls === "A")
      .map(([id]) => row(id, "pass", [`.github/workflows/${id}.yml`]));
    const results = reclassify(input({ rows, workflowsPre: 0 }));
    for (const r of results.filter((x) => x.in_scope)) {
      expect(r.scan_outcome).toBe("gap");
    }
  });
});

describe("sanitizeMessage", () => {
  test("strips ANSI/control characters", () => {
    expect(sanitizeMessage("a\x1b[31mred\x07b\x00")).toBe("a[31mredb");
  });
  test("caps length with an ellipsis", () => {
    const long = "x".repeat(400);
    const out = sanitizeMessage(long);
    expect(out.length).toBe(301);
    expect(out.endsWith("…")).toBe(true);
  });
  test("leaves normal text alone", () => {
    expect(sanitizeMessage("branch `main`: required pull requests ✓")).toBe(
      "branch `main`: required pull requests ✓",
    );
  });
});
