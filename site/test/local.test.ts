/**
 * The local lane: the CONTRACT it shares with the tool, and the merge rule that
 * keeps a self-report honest — both proved rather than asserted in prose.
 *
 * Two failures this file exists to make impossible:
 *
 *  1. **A lane that cannot work end to end.** The previous cut had the tool
 *     signing one namespace over one document shape at one (gitignored) path,
 *     and this site verifying a different namespace over a different shape at a
 *     different path. Each tree was internally consistent and every submission
 *     failed. The contract block is now the single source, mirrored verbatim,
 *     digest-pinned on both sides.
 *  2. **Inflation.** A local record is signed by a maintainer's own key on a
 *     machine nobody can inspect. The defence is not trust in that maintainer:
 *     it is that a contradiction COSTS the repository, and that where an
 *     independent observer could have checked, the merge waits for one.
 */
import { describe, expect, test } from "bun:test";
import { readinessFrom } from "../src/anchor";
import { BASE_PATH, METHODOLOGY_VERSION, SCHEMA_VERSION } from "../src/config";
import { ANCHOR_REGEN_COMMANDS, anchorCaveat, coverageFacts } from "../src/coverage";
import { escapeHtml } from "../src/designs/ledger/layout";
import { DESIGNS } from "../src/designs/registry";
import { factSentences, selfReportSentence } from "../src/designs/shared-facts";
import type { DesignCtx } from "../src/designs/types";
import {
  CONTRACT_DIGEST,
  CONTRACT_TEXT,
  contractDigest,
  LOCAL_ANCHOR_PATH,
  LOCAL_COMMAND,
  LOCAL_METHODOLOGY_VERSION,
  LOCAL_NAMESPACE,
  LOCAL_RECORD_PATH,
  LOCAL_SCHEMA_VERSION,
  LOCAL_SIGNATURE_PATH,
  LOCAL_SUBMISSION_LABEL,
  parseContract,
} from "../src/local-contract";
import type { ListingFacts } from "../src/listing";
import {
  CONTROL_CLASSES,
  CONTROL_REGISTRY,
  isLocallyResolvable,
  isOnLane,
  mergeEvidence,
  requiresIndependentObservation,
  type EvidenceSource,
} from "../src/reclassify";
import { validateScanRecord, type ControlRecord, type ScanOutcome, type ScanRecord } from "../src/schema";
import {
  LOCAL_SIGNATURE_NAMESPACE,
  localOverlayCount,
  resolveTrustKind,
  trustKind,
  validateTrustInfo,
  type TrustInfo,
} from "../src/trust";

/* --------------------------------- fixtures -------------------------------- */

/** One representative control per evidence class, with its real sscsb id. */
const CLASS_MEMBER = {
  A: { id: "codeql", phase: 4 },
  Aprime: { id: "actions-audit", phase: 1 },
  B: { id: "branch-protection", phase: 1 },
  C: { id: "commit-signing", phase: 1 },
  M: { id: "compliance-map", phase: 5 },
} as const;

function ctl(
  id: string,
  phase: number,
  scan: ScanOutcome,
  over: Partial<ControlRecord> = {},
): ControlRecord {
  return {
    id,
    phase,
    in_scope: true,
    raw_outcome: scan === "unverified" ? "pass" : (scan === "gap" ? "disabled" : scan),
    scan_outcome: scan,
    reclassified: false,
    reason: null,
    messages: [],
    ...over,
  };
}

function record(controls: ControlRecord[], over: Partial<ScanRecord> = {}): ScanRecord {
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
    request_issue: null,
    controls,
    score: {
      grade: "NA",
      provisional: false,
      overall_percent: null,
      evidence_coverage_percent: 0,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase, pass: 0, fail: 0, gap: 0, unverified: 0, info: 0, percent: null,
      })),
    },
    ...over,
  };
}

function localSidecar(over: Partial<TrustInfo> = {}): TrustInfo {
  return validateTrustInfo({
    schema_version: 1,
    lane: "local",
    signature: "verified",
    identity: null,
    commit: "b".repeat(40),
    verified_at: "2026-09-02T10:00:00Z",
    bundle: null,
    signer: "maintainer@example.com",
    key_fingerprint: "SHA256:AAAABBBBCCCCDDDDEEEEFFFF0000111122223333444",
    signature_file: "acme--widget.local.sig",
    resolved: ["commit-signing"],
    ...over,
  });
}

const outcomeOf = (cs: ControlRecord[], id: string) =>
  cs.find((c) => c.id === id)?.scan_outcome;


/* ------------------------------- the contract ------------------------------ */

describe("the contract is one text, mirrored, and this tree matches it", () => {
  test("the digest pins the same block the tool pins", () => {
    // The cross-repository drift guard. The tool computes this same digest over
    // its own copy in docs/local-scan.md and asserts the same hex. Edit one
    // side without the other and one of the two tests fails — instead of a
    // lane that silently cannot work.
    expect(contractDigest()).toBe(CONTRACT_DIGEST);
  });

  test("every constant this site uses comes FROM the block, not beside it", () => {
    const c = parseContract(CONTRACT_TEXT);
    expect(LOCAL_COMMAND).toBe(c.get("command")!);
    expect(LOCAL_NAMESPACE).toBe(c.get("sshsig-namespace")!);
    expect(LOCAL_RECORD_PATH).toBe(c.get("record-path")!);
    expect(LOCAL_SIGNATURE_PATH).toBe(c.get("signature-path")!);
    expect(LOCAL_ANCHOR_PATH).toBe(c.get("anchor-path")!);
    expect(LOCAL_SUBMISSION_LABEL).toBe(c.get("submission-label")!);
    expect(LOCAL_SCHEMA_VERSION).toBe(Number(c.get("schema-version")));
    expect(LOCAL_METHODOLOGY_VERSION).toBe(Number(c.get("methodology-version")));
  });

  test("the namespace the verifier uses IS the contract's namespace", () => {
    // Blocker 1: the tool signed `sscsb-local-scan`, this site verified
    // `sscsb-scan-record`. One string, defined once.
    expect(LOCAL_SIGNATURE_NAMESPACE).toBe(LOCAL_NAMESPACE);
    expect(LOCAL_NAMESPACE).toBe("sscsb-scan-record");
  });

  test("the record and signature live at COMMITTED paths, not gitignored output", () => {
    // Blocker 3: the tool wrote `.sscsb/out/scan-local.json`, which `sscsb
    // init` gitignores, while ingest fetched a committed path. `init` adds
    // exactly one ignore rule, `.sscsb/out/`.
    expect(LOCAL_RECORD_PATH.startsWith(".sscsb/out/")).toBe(false);
    expect(LOCAL_SIGNATURE_PATH.startsWith(".sscsb/out/")).toBe(false);
    expect(LOCAL_SIGNATURE_PATH).toBe(`${LOCAL_RECORD_PATH}.sig`);
  });

  test("the methodology version in the contract is the one this build scores with", () => {
    // Blocker 2 in miniature: a record missing or disagreeing on
    // methodology_version fails validateScanRecord, so the whole lane dies at
    // the validator with a message about a field nobody set deliberately.
    expect(LOCAL_METHODOLOGY_VERSION).toBe(METHODOLOGY_VERSION);
    expect(LOCAL_SCHEMA_VERSION).toBe(SCHEMA_VERSION);
  });
});

describe("the validator accepts exactly the shape the contract names", () => {
  const c = parseContract(CONTRACT_TEXT);

  test("a record with every contracted field validates", () => {
    const r = record([ctl("commit-signing", 1, "pass")]);
    expect(() => validateScanRecord(r)).not.toThrow();
    for (const field of c.get("record-fields")!.split(/\s+/)) {
      expect(r).toHaveProperty(field);
    }
    for (const field of c.get("repo-fields")!.split(/\s+/)) {
      expect(r.repo).toHaveProperty(field);
    }
    for (const field of c.get("score-fields")!.split(/\s+/)) {
      expect(r.score).toHaveProperty(field);
    }
    for (const field of c.get("control-fields")!.split(/\s+/)) {
      expect(r.controls[0]).toHaveProperty(field);
    }
  });

  test("dropping methodology_version is refused — the field is not decorative", () => {
    const r = record([ctl("commit-signing", 1, "pass")]) as unknown as Record<string, unknown>;
    delete r.methodology_version;
    expect(() => validateScanRecord(r)).toThrow(/methodology_version/);
  });
});

/* ----------------------------- the class contract -------------------------- */

describe("evidence classes decide what a lone self-report may settle", () => {
  test("every control's class and phase come from ONE registry", () => {
    for (const [id, meta] of Object.entries(CONTROL_REGISTRY)) {
      expect(CONTROL_CLASSES[id]).toBe(meta.cls);
      expect(meta.phase).toBeGreaterThanOrEqual(1);
      expect(meta.phase).toBeLessThanOrEqual(5);
    }
  });

  test("class C — and only class C — is settleable by a lone local record", () => {
    for (const [id, meta] of Object.entries(CONTROL_REGISTRY)) {
      expect(isLocallyResolvable(id)).toBe(meta.cls === "C");
    }
  });

  test("A, A' and B require independent observation; C and M do not", () => {
    for (const [id, meta] of Object.entries(CONTROL_REGISTRY)) {
      expect(requiresIndependentObservation(id)).toBe(
        meta.cls === "A" || meta.cls === "Aprime" || meta.cls === "B",
      );
    }
  });

  test("an unknown control id is never resolvable and never observable", () => {
    expect(isLocallyResolvable("not-a-control")).toBe(false);
    expect(requiresIndependentObservation("not-a-control")).toBe(false);
  });
});

/* ------------------------------- the merge rule ---------------------------- */

const src = (lane: EvidenceSource["lane"], controls: ControlRecord[]): EvidenceSource => ({
  lane,
  record: record(controls),
});

describe("the owner's rule: both lanes count, and disagreement is a gap", () => {
  test("a local pass on a class-C row the base could not see COUNTS", () => {
    // The whole reason the lane exists. Class C is unobservable from a repo
    // scan, so the maintainer's signed word is the best evidence obtainable.
    const merged = mergeEvidence([
      src("action", [ctl("commit-signing", 1, "unverified")]),
      src("local", [ctl("commit-signing", 1, "pass")]),
    ]);
    expect(outcomeOf(merged.record.controls, "commit-signing")).toBe("pass");
    expect(merged.resolvedByLocal).toEqual(["commit-signing"]);
    expect(merged.contradictions).toEqual([]);
  });

  test("a local FAIL is adopted just as readily — the lane is not a whitewash", () => {
    const merged = mergeEvidence([
      src("action", [ctl("ai-trailers", 1, "unverified")]),
      src("local", [ctl("ai-trailers", 1, "fail")]),
    ]);
    expect(outcomeOf(merged.record.controls, "ai-trailers")).toBe("fail");
  });

  test("agreement across lanes is that verdict, not a contradiction", () => {
    const merged = mergeEvidence([
      src("action", [ctl("codeql", 4, "pass")]),
      src("local", [ctl("codeql", 4, "pass")]),
    ]);
    expect(outcomeOf(merged.record.controls, "codeql")).toBe("pass");
    expect(merged.contradictions).toEqual([]);
    // …and it is NOT credited to the local lane: an independent source agreed.
    expect(merged.resolvedByLocal).toEqual([]);
  });

  for (const [a, b] of [
    ["pass", "fail"],
    ["pass", "gap"],
    ["fail", "gap"],
  ] as const) {
    test(`contradictory verdicts (${a} vs ${b}) score a GAP, flagged`, () => {
      const merged = mergeEvidence([
        src("action", [ctl("codeql", 4, a)]),
        src("local", [ctl("codeql", 4, b)]),
      ]);
      const row = merged.record.controls.find((c) => c.id === "codeql")!;
      expect(row.scan_outcome).toBe("gap");
      expect(merged.contradictions).toEqual(["codeql"]);
      // The flag reaches the RECORD, naming each source and its verdict.
      expect(row.contradiction).toEqual([
        { source: "action", verdict: a },
        { source: "local", verdict: b },
      ]);
      expect(row.reason).toContain("CONTRADICTION");
      expect(row.reason).toContain(`action says ${a}`);
      expect(row.reason).toContain(`local says ${b}`);
    });
  }

  test("a contradiction COSTS the repository — it is a gap in the denominator", () => {
    const agreeing = mergeEvidence([
      src("action", [ctl("codeql", 4, "pass"), ctl("sbom", 2, "pass")]),
      src("local", [ctl("codeql", 4, "pass"), ctl("sbom", 2, "pass")]),
    ]);
    const conflicting = mergeEvidence([
      src("action", [ctl("codeql", 4, "pass"), ctl("sbom", 2, "pass")]),
      src("local", [ctl("codeql", 4, "fail"), ctl("sbom", 2, "pass")]),
    ]);
    expect(agreeing.record.score.overall_percent).toBe(100);
    // The contradicted row is countable but not passing: 1 of 2.
    expect(conflicting.record.score.overall_percent).toBe(50);
    expect(conflicting.record.score.evidence_coverage_percent).toBe(100);
    // So a flattering local scan can only ever lower the grade, never raise it.
    expect(conflicting.record.score.overall_percent!).toBeLessThan(
      agreeing.record.score.overall_percent!,
    );
  });

  test("a local record cannot overturn a base verdict by agreeing louder", () => {
    // Only one source has a countable verdict here, and it is the base's fail.
    const merged = mergeEvidence([
      src("action", [ctl("codeql", 4, "fail")]),
      src("local", [ctl("codeql", 4, "fail")]),
    ]);
    expect(outcomeOf(merged.record.controls, "codeql")).toBe("fail");
  });

  test("rows with no countable verdict anywhere stay unverified", () => {
    const merged = mergeEvidence([
      src("external", [ctl("commit-signing", 1, "unverified")]),
    ]);
    expect(outcomeOf(merged.record.controls, "commit-signing")).toBe("unverified");
    expect(merged.record.score.evidence_coverage_percent).toBe(0);
  });
});

describe("where someone else could have checked, we require that someone else", () => {
  for (const cls of ["A", "Aprime", "B"] as const) {
    const m = CLASS_MEMBER[cls];
    test(`class ${cls} (${m.id}): a lone local pass is NOT counted`, () => {
      const merged = mergeEvidence([
        src("external", [ctl(m.id, m.phase, "unverified")]),
        src("local", [ctl(m.id, m.phase, "pass")]),
      ]);
      const row = merged.record.controls.find((c) => c.id === m.id)!;
      expect(row.scan_outcome).toBe("unverified");
      expect(merged.awaitingIndependent).toContain(m.id);
      expect(row.reason).toContain("observable from a repository");
    });

    test(`class ${cls} (${m.id}): it counts as soon as something independent agrees`, () => {
      const merged = mergeEvidence([
        src("external", [ctl(m.id, m.phase, "pass")]),
        src("local", [ctl(m.id, m.phase, "pass")]),
      ]);
      expect(outcomeOf(merged.record.controls, m.id)).toBe("pass");
      expect(merged.awaitingIndependent).toEqual([]);
    });

    test(`class ${cls} (${m.id}): …or disagrees, which is a gap`, () => {
      const merged = mergeEvidence([
        src("external", [ctl(m.id, m.phase, "fail")]),
        src("local", [ctl(m.id, m.phase, "pass")]),
      ]);
      expect(outcomeOf(merged.record.controls, m.id)).toBe("gap");
      expect(merged.contradictions).toContain(m.id);
    });
  }

  test("class C never waits for anyone — nobody else can look", () => {
    const merged = mergeEvidence([
      src("external", [ctl("grype", 2, "unverified")]),
      src("local", [ctl("grype", 2, "pass")]),
    ]);
    expect(outcomeOf(merged.record.controls, "grype")).toBe("pass");
    expect(merged.awaitingIndependent).toEqual([]);
  });

  test("class M is informational in every lane and counts nowhere", () => {
    const merged = mergeEvidence([
      src("external", [ctl("compliance-map", 5, "pass")]),
      src("local", [ctl("compliance-map", 5, "pass")]),
    ]);
    const row = merged.record.controls.find((c) => c.id === "compliance-map")!;
    expect(row.scan_outcome).toBe("info");
    expect(row.in_scope).toBe(false);
  });
});

describe("a local-only listing cannot inflate itself — the live path that was open", () => {
  /**
   * The exact submission the review proved would publish A+ / 100% coverage /
   * non-provisional with zero independently-observable evidence: a local record
   * asserting passes and declaring only the rows it likes to be in scope.
   */
  const flattering = mergeEvidence([
    src("local", [
      ctl("commit-signing", 1, "pass"),
      ctl("ai-trailers", 1, "pass"),
      ctl("grype", 2, "pass"),
      ctl("codeql", 4, "pass"),
      ctl("sbom", 2, "pass"),
      ctl("scorecard", 2, "pass"),
    ]),
  ]);

  test("it publishes, and it is NOT graded A+", () => {
    expect(flattering.localOnly).toBe(true);
    expect(flattering.record.score.grade).toBe("NA");
    expect(flattering.record.score.provisional).toBe(false);
  });

  test("coverage is a fraction of the DIRECTORY's control set, not the record's", () => {
    // The denominator is every non-meta control the directory knows about, so
    // a record cannot shrink it by declining to mention a control.
    const nonMeta = Object.values(CONTROL_REGISTRY).filter((m) => m.cls !== "M").length;
    const scoped = flattering.record.controls.filter((c) => c.in_scope).length;
    expect(scoped).toBe(nonMeta);
    expect(flattering.record.controls.length).toBe(Object.keys(CONTROL_REGISTRY).length);
    expect(flattering.record.score.evidence_coverage_percent).toBeLessThan(50);
  });

  test("class-C rows ARE settled; every observable row waits", () => {
    expect(outcomeOf(flattering.record.controls, "commit-signing")).toBe("pass");
    expect(outcomeOf(flattering.record.controls, "grype")).toBe("pass");
    expect(outcomeOf(flattering.record.controls, "codeql")).toBe("unverified");
    expect(outcomeOf(flattering.record.controls, "sbom")).toBe("unverified");
    expect(outcomeOf(flattering.record.controls, "scorecard")).toBe("unverified");
    expect(flattering.awaitingIndependent).toContain("codeql");
  });

  test("controls the record never mentioned are unverified, not absent", () => {
    const row = flattering.record.controls.find((c) => c.id === "renovate")!;
    expect(row.in_scope).toBe(true);
    expect(row.scan_outcome).toBe("unverified");
  });
});

describe("scope and metadata belong to the repository-observable base", () => {
  test("an out-of-scope base row stays out of scope whatever the local says", () => {
    const merged = mergeEvidence([
      src("action", [ctl("witness", 3, "info", { in_scope: false })]),
      src("local", [ctl("witness", 3, "pass")]),
    ]);
    const row = merged.record.controls.find((c) => c.id === "witness")!;
    expect(row.in_scope).toBe(false);
    expect(row.scan_outcome).toBe("info");
  });

  test("an out-of-scope LOCAL row contributes nothing", () => {
    const merged = mergeEvidence([
      src("action", [ctl("commit-signing", 1, "unverified")]),
      src("local", [ctl("commit-signing", 1, "pass", { in_scope: false })]),
    ]);
    expect(outcomeOf(merged.record.controls, "commit-signing")).toBe("unverified");
  });

  test("a control the base does not have is dropped entirely", () => {
    const merged = mergeEvidence([
      src("action", [ctl("commit-signing", 1, "unverified")]),
      src("local", [ctl("commit-signing", 1, "pass"), ctl("grype", 2, "pass")]),
    ]);
    expect(merged.record.controls.map((c) => c.id)).toEqual(["commit-signing"]);
  });

  test("an unclassified control id throws — fail closed", () => {
    expect(() =>
      mergeEvidence([src("action", [ctl("brand-new-control", 1, "pass")])]),
    ).toThrow(/unclassified control/);
  });

  test("the base's metadata is the listing's metadata", () => {
    const base = src("action", [ctl("commit-signing", 1, "unverified")]);
    base.record.repo.commit = "c".repeat(40);
    const merged = mergeEvidence([base, src("local", [ctl("commit-signing", 1, "pass")])]);
    expect(merged.record.repo.commit).toBe("c".repeat(40));
    expect(merged.localOnly).toBe(false);
  });

  test("no source record is ever mutated", () => {
    const base = src("action", [ctl("commit-signing", 1, "unverified")]);
    const local = src("local", [ctl("commit-signing", 1, "pass")]);
    mergeEvidence([base, local]);
    expect(base.record.controls[0]!.scan_outcome).toBe("unverified");
    expect(local.record.controls[0]!.scan_outcome).toBe("pass");
  });
});

describe("a local record DOES lift a real score, alongside a real scan", () => {
  const base = src("action", [
    ctl("codeql", 4, "pass"),
    ctl("sbom", 2, "pass"),
    ctl("scorecard", 2, "pass"),
    ctl("branch-protection", 1, "pass"),
    ctl("commit-signing", 1, "unverified"),
    ctl("ai-trailers", 1, "unverified"),
    ctl("grype", 2, "unverified"),
  ]);
  const local = src("local", [
    ctl("commit-signing", 1, "pass"),
    ctl("ai-trailers", 1, "pass"),
    ctl("grype", 2, "pass"),
  ]);

  test("before: 4 of 7 countable — 57.1% coverage, provisional", () => {
    const before = mergeEvidence([base]);
    expect(before.record.score.evidence_coverage_percent).toBe(57.1);
    expect(before.record.score.provisional).toBe(true);
  });

  test("after: 100% coverage, A+, no longer provisional, three rows credited", () => {
    const after = mergeEvidence([base, local]);
    expect(after.record.score.evidence_coverage_percent).toBe(100);
    expect(after.record.score.overall_percent).toBe(100);
    expect(after.record.score.grade).toBe("A+");
    expect(after.record.score.provisional).toBe(false);
    expect(after.resolvedByLocal.sort()).toEqual(["ai-trailers", "commit-signing", "grype"]);
  });

  test("the credited rows say WHY, and name the evidence they rest on", () => {
    const after = mergeEvidence([base, local]);
    const row = after.record.controls.find((c) => c.id === "commit-signing")!;
    expect(row.reclassified).toBe(true);
    expect(row.reason).toContain("signed local scan");
    expect(row.reason).toContain("allowed_signers");
    expect(row.contradiction).toBeNull();
  });
});

/* ------------------------------ the trust sidecar -------------------------- */

describe("local trust sidecar", () => {
  test("a verified local sidecar validates and keeps its auditable fields", () => {
    const t = localSidecar();
    expect(t.lane).toBe("local");
    expect(t.signer).toBe("maintainer@example.com");
    expect(t.key_fingerprint).toStartWith("SHA256:");
    expect(t.signature_file).toBe("acme--widget.local.sig");
    expect(t.commit).toBe("b".repeat(40));
  });
  test("an unverifiable local record is REFUSED, exactly like a tampered bundle", () => {
    expect(() => localSidecar({ signature: "absent" })).toThrow(/refused/);
    expect(() => localSidecar({ signature: "absent" })).toThrow(/tamper signal/);
  });
  test("a verified local sidecar must name its signer, key and signature file", () => {
    expect(() => localSidecar({ signer: null })).toThrow(/signer/);
    expect(() => localSidecar({ key_fingerprint: "" })).toThrow(/key_fingerprint/);
    expect(() => localSidecar({ signature_file: null })).toThrow(/signature_file/);
    expect(() => localSidecar({ commit: "HEAD" })).toThrow(/40-hex/);
  });
  test("trustKind and resolveTrustKind expose local as its own fourth state", () => {
    expect(trustKind(localSidecar())).toBe("local");
    // Base sidecar absent + local sidecar present ⇒ a local-only listing.
    expect(resolveTrustKind(record([]), undefined, localSidecar())).toBe("local");
    expect(localOverlayCount(localSidecar())).toBe(1);
    expect(localOverlayCount(undefined)).toBe(0);
  });
  test("a verified action-lane base still wins the lane badge when a local overlay exists", () => {
    const action = validateTrustInfo({
      schema_version: 1,
      lane: "action",
      signature: "verified",
      identity: "https://github.com/Acme/Widget/.github/workflows/sscsb-scan.yml@refs/heads/main",
      commit: "b".repeat(40),
      verified_at: "2026-09-01T13:00:00Z",
      bundle: "acme--widget.sigstore.json",
    });
    expect(resolveTrustKind(record([]), action, localSidecar())).toBe("verified");
  });
});

/* --------------------------------- the UI ---------------------------------- */

describe("every design renders the local lane honestly", () => {
  const withLocal = new Map([["acme--widget", localSidecar()]]);
  const ctx = (localTrust?: ReadonlyMap<string, TrustInfo>): DesignCtx => ({
    prefix: BASE_PATH,
    h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
    switcher: "",
    active: "directory",
    localTrust,
  });
  const localOnly = mergeEvidence([
    src("local", [ctl("commit-signing", 1, "pass"), ctl("codeql", 4, "pass")]),
  ]).record;

  for (const d of DESIGNS) {
    test(`${d.id}: a local-only listing is marked local, never verified`, () => {
      const dir = d.renderDirectory([localOnly], ctx(withLocal));
      expect(dir).toContain('data-lane="local"');
      expect(dir).not.toContain('data-lane="verified"');
      const detail = d.renderRepoDetail(localOnly, ctx(withLocal));
      expect(detail).toContain("Local scan — signature verified");
      expect(detail).not.toContain("✓ verified");
      // The badge must name the weaker claim, not the CI one.
      expect(detail).toContain("maintainer@example.com");
      expect(detail).toContain("ssh-keygen -Y verify");
      expect(detail).toContain("allowed_signers");
      // Each design words it its own way, but none may present the local lane
      // as equal to the authenticated one.
      expect(detail.toLowerCase()).toMatch(/weaker|shorter chain/);
    });

    test(`${d.id}: the local record and signature are linked for re-verification`, () => {
      const detail = d.renderRepoDetail(localOnly, ctx(withLocal));
      expect(detail).toContain(`${BASE_PATH}directory/acme--widget/scan-record.local.json`);
      expect(detail).toContain(`${BASE_PATH}directory/acme--widget/scan-record.local.json.sig`);
    });

    test(`${d.id}: a listing below the coverage floor shows why, and the one-line fix`, () => {
      const provisional = record(
        [
          ctl("codeql", 4, "pass"),
          ctl("sbom", 2, "pass"),
          ctl("commit-signing", 1, "unverified"),
          ctl("ai-trailers", 1, "unverified"),
          ctl("grype", 2, "unverified"),
        ],
        {
          score: {
            grade: "A+", provisional: true, overall_percent: 100,
            evidence_coverage_percent: 40,
            phases: [1, 2, 3, 4, 5].map((phase) => ({
              phase, pass: 0, fail: 0, gap: 0, unverified: 0, info: 0, percent: null,
            })),
          },
        },
      );
      const dir = d.renderDirectory([provisional], ctx());
      expect(dir).toContain("sscsb scan --local --submit");
      expect(dir).toContain('data-coverage="40"');
      expect(dir).toContain('data-complete="0"');
      expect(dir).toContain("3 controls");
      const detail = d.renderRepoDetail(provisional, ctx());
      expect(detail).toContain("sscsb scan --local --submit");
      expect(detail).toContain("40%");
    });

    test(`${d.id}: a CONTRADICTION reaches the listing row and the detail page`, () => {
      // The owner's rule ends "that should be flagged and treated as a gap".
      // Treating it as a gap without flagging it is a silent downgrade, so
      // every design has to say it in both places.
      const merged = mergeEvidence([
        src("action", [ctl("codeql", 4, "fail"), ctl("sbom", 2, "pass")]),
        src("local", [ctl("codeql", 4, "pass"), ctl("sbom", 2, "pass")]),
      ]);
      const withFacts: ReadonlyMap<string, ListingFacts> = new Map([
        [
          "acme--widget",
          {
            resolvedByLocal: merged.resolvedByLocal,
            contradictions: merged.contradictions,
            awaitingIndependent: merged.awaitingIndependent,
            localOnly: merged.localOnly,
            staleAgainstBase: { local: "d".repeat(40), base: "e".repeat(40) },
            selfReported: null,
          },
        ],
      ]);
      const c = { ...ctx(withLocal), facts: withFacts };
      const dir = d.renderDirectory([merged.record], c);
      expect(dir).toContain('data-contradictions="1"');
      expect(dir).toContain("Contradiction:");
      expect(dir).toContain("codeql");
      expect(dir).toContain("errs on the side of caution");
      // …and the stale-local warning, derived from the BASE's commit.
      expect(dir).toContain("dddddddddddd");
      expect(dir).toContain("eeeeeeeeeeee");

      const detail = d.renderRepoDetail(merged.record, c);
      expect(detail).toContain("What the evidence merge found");
      expect(detail).toContain("Contradiction:");
      // The per-control row names each source and the verdict it gave.
      expect(detail).toContain("action says fail");
      expect(detail).toContain("local says pass");
    });

    test(`${d.id}: a listing with nothing to flag says nothing`, () => {
      const clean = mergeEvidence([src("action", [ctl("codeql", 4, "pass")])]);
      const c = { ...ctx(), facts: new Map() as ReadonlyMap<string, ListingFacts> };
      expect(d.renderDirectory([clean.record], c)).toContain('data-contradictions="0"');
      expect(d.renderDirectory([clean.record], c)).not.toContain("Contradiction:");
      expect(d.renderRepoDetail(clean.record, c)).not.toContain(
        "What the evidence merge found",
      );
    });

    test(`${d.id}: a local-only listing publishes NA, never A+`, () => {
      // The inflation path the review found, rendered: a self-report asserting
      // passes across every class must not produce a top grade on a page.
      const flattering = mergeEvidence([
        src("local", [
          ctl("commit-signing", 1, "pass"),
          ctl("codeql", 4, "pass"),
          ctl("sbom", 2, "pass"),
        ]),
      ]).record;
      const dir = d.renderDirectory([flattering], ctx(withLocal));
      expect(dir).toContain('data-grade="NA"');
      expect(dir).not.toContain('data-grade="A+"');
      expect(dir).toContain('data-lane="local"');
    });

    test(`${d.id}: a complete listing is never nagged`, () => {
      const complete = record([ctl("codeql", 4, "pass")], {
        score: {
          grade: "A+", provisional: false, overall_percent: 100,
          evidence_coverage_percent: 100,
          phases: [1, 2, 3, 4, 5].map((phase) => ({
            phase, pass: 0, fail: 0, gap: 0, unverified: 0, info: 0, percent: null,
          })),
        },
      });
      const dir = d.renderDirectory([complete], ctx());
      expect(dir).toContain('data-complete="1"');
      expect(dir).not.toContain("sscsb scan --local --submit");
    });

    test(`${d.id}: the sort and coverage-filter controls the shared filter.js expects`, () => {
      const dir = d.renderDirectory([localOnly], ctx(withLocal));
      expect(dir).toContain('id="dir-sort"');
      expect(dir).toContain('value="coverage"');
      expect(dir).toContain('id="dir-incomplete"');
      expect(dir).toContain('id="dir-count"');
    });

    test(`${d.id}: methodology documents the local lane at #local`, () => {
      const html = d.renderMethodology(ctx());
      expect(html).toContain('id="local"');
      expect(html).toContain("ssh-keygen -Y verify");
      expect(html).toContain("allowed_signers");
      expect(html).toContain("weaker");
      // The contract itself is published, verbatim, not paraphrased.
      expect(html).toContain("sscsb local-lane contract v1");
      expect(html).toContain(LOCAL_NAMESPACE);
      expect(html).toContain(LOCAL_RECORD_PATH);
      expect(html).toContain(LOCAL_COMMAND);
      // The scoring rule, in the owner's own terms.
      expect(html).toContain("contradiction flag");
      expect(html).toContain("Where someone else could have checked, we require that someone else");
      expect(html).toContain("class C");
    });
  }
});

describe("coverageFacts", () => {
  const r = (controls: ControlRecord[], coverage: number) =>
    record(controls, {
      score: {
        grade: "A", provisional: coverage < 75, overall_percent: 100,
        evidence_coverage_percent: coverage,
        phases: [1, 2, 3, 4, 5].map((phase) => ({
          phase, pass: 0, fail: 0, gap: 0, unverified: 0, info: 0, percent: null,
        })),
      },
    });

  test("counts only IN-SCOPE unverified rows, and only class C as locally fixable", () => {
    const f = coverageFacts(
      r(
        [
          ctl("commit-signing", 1, "unverified"),
          ctl("actions-audit", 1, "unverified"),
          ctl("witness", 3, "unverified", { in_scope: false }),
        ],
        50,
      ),
    );
    expect(f.unverified).toBe(2);
    expect(f.localResolvable).toBe(1);
  });

  test("the nudge only PROMISES a fix a local scan can actually deliver", () => {
    // The finding: "fixable by a local scan" was claimed for any listing below
    // the floor with a class-C hole, including ones where filling every class-C
    // hole still leaves coverage short. The state is now derived from the
    // projection, not from being below the floor.
    const closes = coverageFacts(
      r(
        [
          ctl("codeql", 4, "pass"),
          ctl("sbom", 2, "pass"),
          ctl("scorecard", 2, "pass"),
          ctl("commit-signing", 1, "unverified"),
        ],
        70,
      ),
    );
    expect(closes.projectedCoverage).toBe(100);
    expect(closes.state).toBe("fixable-by-local");

    const doesNotClose = coverageFacts(
      r(
        [
          ctl("commit-signing", 1, "unverified"),
          ctl("actions-audit", 1, "unverified"),
          ctl("codeql", 4, "unverified"),
          ctl("sbom", 2, "pass"),
        ],
        25,
      ),
    );
    // One class-C hole of four scoped: 2/4 = 50% even after a local scan.
    expect(doesNotClose.projectedCoverage).toBe(50);
    expect(doesNotClose.state).toBe("partly-fixable-by-local");
  });

  test("a listing at or above the floor has nothing to explain", () => {
    expect(coverageFacts(r([ctl("commit-signing", 1, "unverified")], 80)).state).toBe(
      "complete",
    );
  });

  test("a listing that already used the local lane is not asked for another scan", () => {
    expect(coverageFacts(r([ctl("commit-signing", 1, "unverified")], 60), 3).state).toBe(
      "local-applied",
    );
  });

  test("holes that no local scan can fill are reported as such", () => {
    expect(coverageFacts(r([ctl("actions-audit", 1, "unverified")], 60)).state).toBe(
      "incomplete",
    );
  });

  test("below the NA floor is flagged separately from provisional", () => {
    expect(coverageFacts(r([], 40)).belowNaFloor).toBe(true);
    expect(coverageFacts(r([], 60)).belowNaFloor).toBe(false);
    expect(coverageFacts(r([], 60)).belowFloor).toBe(true);
  });
});

/* --------------------- lane discipline: who could have looked ------------- */

describe("a verdict a lane could not have made is not evidence", () => {
  // The mirror image of the observability requirement. Class C IS the
  // development environment; an action runner and an external clone are both
  // looking at a checkout. Today's external pipeline reclassifies those rows to
  // `unverified` already, so the live data holds — but the merge must not
  // DEPEND on every present and future record producer doing so.
  for (const lane of ["action", "external"] as const) {
    test(`a class-C pass from the ${lane} lane is dropped, not counted`, () => {
      const merged = mergeEvidence([src(lane, [ctl("commit-signing", 1, "pass")])]);
      const row = merged.record.controls.find((c) => c.id === "commit-signing")!;
      expect(row.scan_outcome).toBe("unverified");
      expect(row.reclassified).toBe(true);
      expect(row.reason).toContain("cannot observe");
      expect(row.reason).toContain(lane);
      // …and it stays outside the denominator, so it cannot lift the score.
      expect(merged.record.score.evidence_coverage_percent).toBe(0);
    });

    test(`a class-C ${lane} verdict cannot contradict a genuine local one`, () => {
      // The sharp edge: without the filter, a fabricated action-lane `fail`
      // would knock a maintainer's honest signed `pass` down to a gap.
      const merged = mergeEvidence([
        src(lane, [ctl("commit-signing", 1, "fail")]),
        src("local", [ctl("commit-signing", 1, "pass")]),
      ]);
      expect(outcomeOf(merged.record.controls, "commit-signing")).toBe("pass");
      expect(merged.contradictions).toEqual([]);
      expect(merged.resolvedByLocal).toEqual(["commit-signing"]);
    });

    test(`a class-C ${lane} verdict is not the independent observation A/A'/B rows wait for`, () => {
      // It must not launder itself into "somebody else checked" for other
      // classes either — those still need a real repository-observable source.
      const merged = mergeEvidence([
        src(lane, [ctl("grype", 2, "pass"), ctl("codeql", 4, "unverified")]),
        src("local", [ctl("grype", 2, "pass"), ctl("codeql", 4, "pass")]),
      ]);
      expect(outcomeOf(merged.record.controls, "codeql")).toBe("unverified");
      expect(merged.awaitingIndependent).toContain("codeql");
    });
  }

  test("non-C classes are untouched — every lane can see a committed artifact", () => {
    const merged = mergeEvidence([src("action", [ctl("codeql", 4, "pass")])]);
    expect(outcomeOf(merged.record.controls, "codeql")).toBe("pass");
  });

  test("isOnLane states the rule directly", () => {
    for (const [id, meta] of Object.entries(CONTROL_REGISTRY)) {
      expect(isOnLane(meta.cls, "local")).toBe(true);
      expect(isOnLane(meta.cls, "action")).toBe(meta.cls !== "C");
      expect(isOnLane(meta.cls, "external")).toBe(meta.cls !== "C");
      expect(id.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------ the nudge tells repositories the truth ---------------- */

describe("the one-line fix is only offered where the command actually runs", () => {
  // `sscsb scan --local` REFUSES on a repository whose committed
  // allowed_signers grants no `sscsb-scan-record` namespace — an anchor written
  // before this lane existed, or one listing no class = "human" signer. The
  // external scan reads that file out of the clone and records what it found.
  const provisional = (local_lane: ScanRecord["local_lane"]) =>
    record(
      [
        ctl("codeql", 4, "pass"),
        ctl("sbom", 2, "pass"),
        ctl("scorecard", 2, "pass"),
        ctl("commit-signing", 1, "unverified"),
      ],
      {
        local_lane,
        score: {
          grade: "A+", provisional: true, overall_percent: 100,
          evidence_coverage_percent: 70,
          phases: [1, 2, 3, 4, 5].map((phase) => ({
            phase, pass: 0, fail: 0, gap: 0, unverified: 0, info: 0, percent: null,
          })),
        },
      },
    );

  test("anchor ready: one command, no caveat", () => {
    const f = coverageFacts(
      provisional({ anchor_committed: true, scan_namespace_granted: true }),
    );
    expect(f.state).toBe("fixable-by-local");
    expect(f.anchorReady).toBe(true);
    expect(f.nudgeCommands).toEqual([LOCAL_COMMAND]);
    expect(anchorCaveat(f)).toBeNull();
  });

  test("anchor predates the lane: the anchor is regenerated FIRST, by name", () => {
    const f = coverageFacts(
      provisional({ anchor_committed: true, scan_namespace_granted: false }),
    );
    expect(f.anchorReady).toBe(false);
    expect(f.nudgeCommands[0]).toBe("sscsb init");
    expect(f.nudgeCommands).toContain(`git add ${LOCAL_ANCHOR_PATH}`);
    expect(f.nudgeCommands[f.nudgeCommands.length - 1]).toBe(LOCAL_COMMAND);
    const caveat = anchorCaveat(f)!;
    expect(caveat).toContain(LOCAL_ANCHOR_PATH);
    expect(caveat).toContain(LOCAL_NAMESPACE);
    expect(caveat).toContain("sscsb init");
    expect(caveat).toContain('class = "human"');
  });

  test("no anchor committed at all is the same dead end", () => {
    const f = coverageFacts(
      provisional({ anchor_committed: false, scan_namespace_granted: false }),
    );
    expect(f.anchorReady).toBe(false);
    expect(anchorCaveat(f)).not.toBeNull();
  });

  test("a record that never looked invents no obstacle", () => {
    // Absent means "nobody looked", never "not ready" — an action-lane or
    // local-only listing has no pre-init clone to read the anchor from.
    const f = coverageFacts(provisional(undefined));
    expect(f.anchorReady).toBeNull();
    expect(f.nudgeCommands).toEqual([LOCAL_COMMAND]);
    expect(anchorCaveat(f)).toBeNull();
  });

  test("the readiness signal is read off the real anchor text", () => {
    const key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleExampleExampleExampleExampleEx";
    expect(
      readinessFrom(`# Generated by sscsb\nme@x.test namespaces="git" ${key} c\n`),
    ).toEqual({ anchor_committed: true, scan_namespace_granted: false });
    expect(
      readinessFrom(`me@x.test namespaces="git,${LOCAL_NAMESPACE}" ${key} c\n`),
    ).toEqual({ anchor_committed: true, scan_namespace_granted: true });
    // An unrestricted line permits every namespace — OpenSSH's own rule.
    expect(readinessFrom(`me@x.test ${key} c\n`).scan_namespace_granted).toBe(true);
    // …but a `*` is NOT expanded: a line scoped narrowly may not widen itself.
    expect(
      readinessFrom(`me@x.test namespaces="*" ${key} c\n`).scan_namespace_granted,
    ).toBe(false);
    // Comments, blank lines and a malformed neighbour never hide a real grant.
    expect(
      readinessFrom(
        `# comment\n\nnot a signer line\nme@x.test namespaces="${LOCAL_NAMESPACE}" ${key}\n`,
      ).scan_namespace_granted,
    ).toBe(true);
    expect(readinessFrom(null)).toEqual({
      anchor_committed: false,
      scan_namespace_granted: false,
    });
  });

  for (const d of DESIGNS) {
    const ctx = (): DesignCtx => ({
      prefix: BASE_PATH,
      h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
      switcher: "",
      active: "directory",
    });

    test(`${d.id}: a ready repository is still told the one line`, () => {
      const r = provisional({ anchor_committed: true, scan_namespace_granted: true });
      const dir = d.renderDirectory([r], ctx());
      expect(dir).toContain(LOCAL_COMMAND);
      expect(dir).not.toContain("sscsb init");
      expect(d.renderRepoDetail(r, ctx())).not.toContain("sscsb init");
    });

    test(`${d.id}: a repository the command would REFUSE is told the real first step`, () => {
      const r = provisional({ anchor_committed: true, scan_namespace_granted: false });
      for (const html of [d.renderDirectory([r], ctx()), d.renderRepoDetail(r, ctx())]) {
        expect(html).toContain("sscsb init");
        expect(html).toContain("refuses");
        expect(html).toContain(LOCAL_COMMAND);
      }
      // …in ORDER: regenerate and commit the anchor, then scan. The caveat
      // carries the sequence verbatim, so a design that renders it renders the
      // steps in the order they have to be run.
      const detail = d.renderRepoDetail(r, ctx());
      const f = coverageFacts(r);
      expect(detail).toContain(escapeHtml(ANCHOR_REGEN_COMMANDS.join("; ")));
      expect(f.nudgeCommands.indexOf("sscsb init")).toBeLessThan(
        f.nudgeCommands.indexOf(LOCAL_COMMAND),
      );
    });
  }
});

/* ----------------- the embedded score is the submitter's ------------------ */

describe("a republished local record cannot pass its own grade off as ours", () => {
  // The signed bytes carry a top-level score block computed on the submitter's
  // machine, over the controls that machine had in scope. The directory has to
  // republish them verbatim — the signature covers them — so the CONTEXT is
  // what has to be unambiguous.
  const selfReported = {
    grade: "A+" as const,
    provisional: false,
    overall_percent: 100,
    evidence_coverage_percent: 100,
  };
  const merged = mergeEvidence([
    src("local", [ctl("commit-signing", 1, "pass"), ctl("codeql", 4, "pass")]),
  ]);
  const facts: ListingFacts = {
    resolvedByLocal: merged.resolvedByLocal,
    contradictions: merged.contradictions,
    awaitingIndependent: merged.awaitingIndependent,
    localOnly: merged.localOnly,
    staleAgainstBase: null,
    selfReported,
  };

  test("the directory's own grade is NOT the record's", () => {
    // Exactly the confusion the label exists to stop: the bytes say A+/100%,
    // the directory says NA on a fraction of coverage.
    expect(merged.record.score.grade).toBe("NA");
    expect(selfReported.grade).toBe("A+");
  });

  test("the sentence names both numbers and says which is authoritative", () => {
    const s = selfReportSentence(facts, merged.record.score)!;
    expect(s).toContain("DIRECTORY's");
    expect(s).toContain("SUBMITTER's self-report");
    expect(s).toContain("NA");
    expect(s).toContain("A+");
    expect(s).toContain("byte-identically");
  });

  test("no local record, no sentence — there is nothing to confuse", () => {
    expect(selfReportSentence({ ...facts, selfReported: null }, merged.record.score)).toBeNull();
    expect(factSentences({ ...facts, selfReported: null }, merged.record.score)).not.toContain(
      expect.stringContaining("self-report"),
    );
  });

  for (const d of DESIGNS) {
    test(`${d.id}: both the listing row and the detail page carry the label`, () => {
      const ctx: DesignCtx = {
        prefix: BASE_PATH,
        h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
        switcher: "",
        active: "directory",
        localTrust: new Map([["acme--widget", localSidecar()]]),
        facts: new Map([["acme--widget", facts]]),
      };
      const dir = d.renderDirectory([merged.record], ctx);
      const detail = d.renderRepoDetail(merged.record, ctx);
      for (const html of [dir, detail]) {
        // Both surfaces name whose number is whose, and both quote the two
        // grades so a reader who opens the linked record is not surprised.
        expect(html).toContain("DIRECTORY");
        expect(html).toContain("self-report");
        expect(html).toContain("A+");
      }
      // The grade the page STATES is the directory's, on both surfaces: the
      // row's sortable attribute, and the detail hero's own label.
      expect(dir).toContain('data-grade="NA"');
      expect(dir).not.toContain('data-grade="A+"');
      expect(detail).toContain("grade NA");
    });

    test(`${d.id}: methodology explains the two scores`, () => {
      const html = d.renderMethodology({
        prefix: BASE_PATH,
        h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
        switcher: "",
        active: "methodology",
      });
      expect(html).toContain("self-report");
      expect(html).toContain("byte for byte");
    });
  }
});

/* ------------------ methodology says what the code does ------------------- */

describe("the published methodology matches the merge and the signing rule", () => {
  const ctx: DesignCtx = {
    prefix: BASE_PATH,
    h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
    switcher: "",
    active: "methodology",
  };

  for (const d of DESIGNS) {
    test(`${d.id}: the class-C row no longer publishes the retired rule`, () => {
      const html = d.renderMethodology(ctx);
      // The rule that was retired when the merge became a union: "Class C is
      // also the only class a signed local scan may resolve."
      expect(html).not.toContain("only</em> class a signed local scan may resolve");
      expect(html).not.toMatch(/only class a signed local scan may resolve/);
      // What the code actually does, in its place.
      expect(html).toContain("settle <strong>by itself</strong>");
      expect(html).toContain("becomes countable as soon");
    });

    test(`${d.id}: methodology states the human-only signing rule, and why`, () => {
      const html = d.renderMethodology(ctx);
      expect(html).toContain('class = "human"');
      expect(html).toContain("structural, not advisory");
      // …and the reasons, not just the rule.
      expect(html).toContain("signs nothing");
      expect(html).toContain("proves strictly more");
    });

    test(`${d.id}: methodology states lane discipline both ways`, () => {
      const html = d.renderMethodology(ctx);
      expect(html).toContain("Where someone else could have checked");
      expect(html).toContain("dropped before anything is counted");
    });
  }
});
