import { describe, expect, test } from "bun:test";
import { BASE_PATH } from "../src/config";
import { laneBadge, renderDirectory, renderRepoDetail, renderTrustSection } from "../src/render/directory";
import { renderComment, trustLine } from "../src/scan/render-comment";
import type { ScanRecord } from "../src/schema";
import {
  externalTrust,
  trustFilename,
  trustKind,
  validateTrustInfo,
  type TrustInfo,
} from "../src/trust";

function record(): ScanRecord {
  return {
    schema_version: 1,
    methodology_version: 1,
    repo: {
      owner: "Acme",
      name: "Widget",
      url: "https://github.com/Acme/Widget",
      default_branch: "main",
      commit: "b".repeat(40),
      description: "sample",
    },
    scanned_at: "2026-09-01T12:00:00Z",
    scanner: {
      sscsb_version: "0.3.0",
      workflow_run_id: 7,
      workflow_run_url: "https://github.com/Acme/Widget/actions/runs/7",
    },
    request_issue: 9,
    controls: [
      {
        id: "codeql", phase: 4, in_scope: true, raw_outcome: "pass",
        scan_outcome: "pass", reclassified: false, reason: null, messages: [],
      },
    ],
    score: {
      grade: "A", provisional: false, overall_percent: 95,
      evidence_coverage_percent: 90,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 1, fail: 0, gap: 0, unverified: 0, info: 0, percent: 100,
      })),
    },
  };
}

const IDENTITY = "https://github.com/Acme/Widget/.github/workflows/sscsb-scan.yml@refs/heads/main";

function verified(): TrustInfo {
  return {
    schema_version: 1,
    lane: "action",
    signature: "verified",
    identity: IDENTITY,
    commit: "b".repeat(40),
    verified_at: "2026-09-01T13:00:00Z",
    bundle: "acme--widget.sigstore.json",
  };
}

function unsignedAction(): TrustInfo {
  return { ...verified(), signature: "absent", identity: null, commit: null, verified_at: null, bundle: null };
}

describe("validateTrustInfo", () => {
  test("accepts a verified sidecar and normalizes optionals", () => {
    const t = validateTrustInfo(verified());
    expect(t.lane).toBe("action");
    expect(t.signature).toBe("verified");
    expect(t.bundle).toBe("acme--widget.sigstore.json");
  });
  test("a verified sidecar must name its identity and bundle", () => {
    expect(() => validateTrustInfo({ ...verified(), identity: null })).toThrow(/identity/);
    expect(() => validateTrustInfo({ ...verified(), bundle: "" })).toThrow(/bundle/);
  });
  test("rejects unknown schema, lane, and signature state", () => {
    expect(() => validateTrustInfo({ ...verified(), schema_version: 2 })).toThrow(/schema_version/);
    expect(() => validateTrustInfo({ ...verified(), lane: "magic" })).toThrow(/lane/);
    expect(() => validateTrustInfo({ ...verified(), signature: "probably" })).toThrow(/signature/);
  });
  test("filename matches the record's lowercased owner--name", () => {
    expect(trustFilename("Acme", "Widget")).toBe("acme--widget.json");
  });
});

describe("trustKind", () => {
  test("three states the UI distinguishes", () => {
    expect(trustKind(undefined)).toBe("external");
    expect(trustKind(externalTrust())).toBe("external");
    expect(trustKind(unsignedAction())).toBe("unsigned-action");
    expect(trustKind(verified())).toBe("verified");
  });
});

describe("detail page provenance section", () => {
  test("verified: shows the pinned identity, bundle link, and re-verify command", () => {
    const html = renderTrustSection(record(), verified());
    expect(html).toContain("signature verified");
    expect(html).toContain(IDENTITY);
    expect(html).toContain(`${BASE_PATH}directory/acme--widget/scan-record.json.sigstore.json`);
    expect(html).toContain("cosign verify-blob");
  });
  test("unsigned action record is called an unverified claim, never verified", () => {
    const html = renderTrustSection(record(), unsignedAction());
    expect(html).toContain("unverified claim");
    expect(html).not.toContain("signature verified");
  });
  test("external scans keep the install nudge", () => {
    const html = renderTrustSection(record(), undefined);
    expect(html).toContain("Improve this score");
    expect(html).toContain("external");
  });
  test("identity is HTML-escaped", () => {
    const evil = { ...verified(), identity: `https://x/<script>alert(1)</script>` };
    const html = renderTrustSection(record(), evil);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
  test("renderRepoDetail carries the lane badge in the heading", () => {
    expect(renderRepoDetail(record(), verified())).toContain("lane-verified");
    expect(renderRepoDetail(record())).toContain("lane-external");
  });
});

describe("directory listing lane column", () => {
  test("marks verified, unsigned-action, and external rows", () => {
    const rows = renderDirectory([record()], new Map([["acme--widget", verified()]]));
    expect(rows).toContain('data-lane="verified"');
    expect(rows).toContain("✓ verified");
    const unsigned = renderDirectory([record()], new Map([["acme--widget", unsignedAction()]]));
    expect(unsigned).toContain('data-lane="unsigned-action"');
    expect(renderDirectory([record()])).toContain('data-lane="external"');
  });
  test("lane badge titles are escaped attributes", () => {
    expect(laneBadge(verified())).toMatch(/^<span class="lane lane-verified" title="[^"]*">/);
  });
});

describe("issue comment provenance line", () => {
  test("verified line names the identity; external adds nothing", () => {
    expect(trustLine(verified())).toContain("**verified**");
    expect(trustLine(verified())).toContain("sscsb-scan.yml");
    expect(trustLine(undefined)).toBe("");
    expect(trustLine(unsignedAction())).toContain("unverified claim");
  });
  test("renderComment includes the line only when there is something to say", () => {
    expect(renderComment(record(), verified())).toContain("Signature: **verified**");
    expect(renderComment(record())).not.toContain("Signature:");
  });
});
