/**
 * Signal, round 4 — the RENDERING changes that would fail silently.
 *
 * Same contract as round 3's file, and for the same reason: three of the
 * changes below are substitutions or additions over HTML produced by files
 * shared with the other four designs (`threats-shared.ts`), and a
 * `replaceAll` that stops matching returns its input unchanged. Nothing
 * throws, nothing looks broken enough to notice, and the page quietly goes
 * back to what three judges flagged.
 *
 * The CSS-only fixes are not here. They are asserted where they can actually
 * be asserted — in a real browser at 1440 and at a true 390px layout viewport.
 */
import { describe, expect, test } from "bun:test";
import { BASE_PATH } from "../src/config";
import { signal } from "../src/designs/signal";
import { legend } from "../src/designs/signal/components";
import { SHARED_EX_QUIET } from "../src/designs/signal/directory";
import { exposurePanel } from "../src/designs/threats-shared";
import type { DesignCtx } from "../src/designs/types";
import type { ControlRecord, ScanOutcome, ScanRecord } from "../src/schema";

const ctx: DesignCtx = {
  prefix: BASE_PATH,
  h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
  switcher: "",
  active: "directory",
};

function ctl(
  id: string,
  phase: number,
  scan: ScanOutcome,
  reason: string | null = null,
): ControlRecord {
  return {
    id,
    phase,
    in_scope: true,
    raw_outcome: scan === "unverified" ? "pass" : scan === "gap" ? "disabled" : scan,
    scan_outcome: scan,
    reclassified: false,
    reason,
    messages: [],
  };
}

/** A record whose phase 1 answered 2 of 3 checks, all answers passing. */
function record(controls: ControlRecord[]): ScanRecord {
  const pass = controls.filter((c) => c.scan_outcome === "pass").length;
  const unverified = controls.filter((c) => c.scan_outcome === "unverified").length;
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
      grade: "A+",
      provisional: false,
      overall_percent: pass === 0 ? null : 100,
      evidence_coverage_percent: 80,
      phases: [1, 2, 3, 4, 5].map((phase) => ({
        phase,
        pass: phase === 1 ? pass : 0,
        fail: 0,
        gap: 0,
        unverified: phase === 1 ? unverified : 0,
        info: 0,
        percent: phase === 1 && pass > 0 ? 100 : null,
      })),
    },
  };
}

describe("the family chip carries its denominator, never a bare percentage", () => {
  const r = record([
    ctl("a", 1, "pass"),
    ctl("b", 1, "pass"),
    ctl("c", 1, "unverified", "requires the local development environment"),
  ]);
  const html = signal.renderRepoDetail(r, ctx);

  test("the chip states the fraction it is a percentage OF", () => {
    expect(html).toContain(`<span class="family-count"`);
    expect(html).toMatch(/<span class="family-count"[^>]*>2\/2 passed/);
    // The bare percentage the judges read as coverage is gone from the chip.
    expect(html).not.toMatch(/<span class="family-count"[^>]*>100%</);
  });

  test("the unanswered check rides inside the same pill, not only in the meta line", () => {
    expect(html).toContain(`<span class="family-count-sub">1 unanswered</span>`);
  });

  test("a family that answered nothing still says so in words", () => {
    const none = record([ctl("a", 1, "unverified", null)]);
    const h = signal.renderRepoDetail(none, ctx);
    expect(h).toMatch(/<span class="family-count"[^>]*>no evidence</);
  });
});

describe("an unanswered row names the remedy, and the remedy exists on the page", () => {
  const r = record([
    ctl("a", 1, "pass"),
    ctl("openvex", 1, "unverified", "requires the local development environment"),
  ]);
  const html = signal.renderRepoDetail(r, ctx);

  test("only the unverified row carries the link", () => {
    const fixes = html.match(/class="ctl-fix"/g) ?? [];
    expect(fixes.length).toBe(1);
    expect(html).toContain(`>how to answer this →</a>`);
  });

  test("the anchor it points at is a section this page actually renders", () => {
    const m = html.match(/class="ctl-fix" href="#([a-z-]+)"/);
    expect(m).not.toBeNull();
    expect(html).toContain(`id="${m![1]!}"`);
  });
});

describe("the attack-group disclaimer is said once, and is not merely hidden", () => {
  // Every control that defends group A8, all passing — which is what makes the
  // group "evidenced with nothing missing", the one state the shared panel
  // prints its disclaimer on.
  const r = record(
    ["vuln-scan", "sast", "sighthound", "codeql", "fuzzing"].map((id) => ctl(id, 1, "pass")),
  );
  const html = signal.renderRepoDetail(r, ctx);

  test("the shared panel still emits the per-row copy this design removes", () => {
    // Both ends pinned: if threats-shared.ts reformats, this fails rather than
    // the page quietly going back to nine copies.
    expect(exposurePanel(ctx.h, r)).toContain(SHARED_EX_QUIET);
  });

  test("no row carries it any more — in the markup, not just in the paint", () => {
    expect(html).not.toContain(SHARED_EX_QUIET);
    const inRows = html.match(/class="ex-detail ex-detail-quiet">Every sscsb check/g) ?? [];
    expect(inRows.length).toBe(0);
  });

  test("the sentence survives, once, above the list it governs", () => {
    const note = html.match(/<p class="ex-note">([\s\S]*?)<\/p>/);
    expect(note).not.toBeNull();
    expect(note![1]).toContain("not the same as being safe from this group");
    expect((html.match(/class="ex-note"/g) ?? []).length).toBe(1);
    expect(html.indexOf(`class="ex-note"`)).toBeLessThan(html.indexOf(`<ul class="ex-list">`));
  });
});

describe("the key names every state the page can draw", () => {
  test("five entries, including the informational one the control list renders", () => {
    const l = legend();
    expect((l.match(/class="lg"/g) ?? []).length).toBe(5);
    expect(l).toContain("informational — never scored");
    expect(l).toContain("nobody could answer");
  });

  test("info and unverified are different SHAPES, not one grey against another", () => {
    const l = legend();
    // The unverified ring is dashed; the info ring is solid with a centre dot.
    const info = l.match(/<svg class="mk mk-info"[\s\S]*?<\/svg>/)![0]!;
    const unver = l.match(/<svg class="mk mk-unverified"[\s\S]*?<\/svg>/)![0]!;
    expect(unver).toContain("stroke-dasharray");
    expect(info).not.toContain("stroke-dasharray");
    expect((info.match(/<circle/g) ?? []).length).toBe(2);
  });
});

describe("the chrome carries the same set at every width", () => {
  const html = signal.renderHome([], { ...ctx, active: "home" });

  test("the pill holds exactly the four items the brief calls persistent", () => {
    const nav = html.match(/<nav class="sg-nav"[\s\S]*?<\/nav>/)![0]!;
    expect((nav.match(/<a /g) ?? []).length).toBe(4);
    expect(nav).toContain("Search the directory");
    expect(nav).toContain(">Directory<");
    expect(nav).toContain(">Methodology<");
    expect(nav).toContain("Source on GitHub");
    // The fifth item, which used to be hidden below 560px, is gone from here.
    expect(nav).not.toContain("sg-nav-ext");
    expect(nav).not.toContain(">Action<");
  });

  test("the item it lost is reachable in the footer instead", () => {
    const foot = html.match(/<footer[\s\S]*?<\/footer>/)![0]!;
    expect(foot).toContain("GitHub Action");
  });
});

describe("the control row is four parts, so a phone and a desktop can differ", () => {
  const r = record([ctl("commit-signing", 1, "pass", "a reason")]);
  const html = signal.renderRepoDetail(r, ctx);

  test("the identifier and the verdict share one wrapper", () => {
    expect(html).toMatch(
      /<span class="ctl-head"><span class="ctl-id">[\s\S]*?<\/span><span class="chip chip-pass"/,
    );
  });

  test("a row with nothing to say emits no empty body", () => {
    const bare = signal.renderRepoDetail(record([ctl("branch-protection", 1, "pass")]), ctx);
    expect(bare).not.toContain(`<div class="ctl-body"></div>`);
    expect(bare).toContain(`class="ctl-head"`);
  });
});

describe("the repository header meta is marked up as facts", () => {
  const html = signal.renderRepoDetail(record([ctl("a", 1, "pass")]), ctx);

  test("each fact and each separator is addressable, so a phone can stack them", () => {
    expect((html.match(/class="rm-fact"/g) ?? []).length).toBe(6);
    expect((html.match(/class="rm-sep"/g) ?? []).length).toBe(5);
  });
});

describe("a clamped description keeps the rest of itself reachable", () => {
  test("the full text rides on title, since the table shows one line of it", () => {
    const html = signal.renderDirectory([record([ctl("a", 1, "pass")])], {
      ...ctx,
      trust: new Map(),
      localTrust: new Map(),
    });
    expect(html).toContain(`<span class="row-desc" title="sample">sample</span>`);
  });
});
