/**
 * The three site tables against the tool's OWN control registry.
 *
 * THE GAP THIS CLOSES. This site holds three 44-entry tables keyed by control
 * id: CONTROL_REGISTRY (reclassify.ts), CONTROL_THREATS (threats.ts) and
 * CHECK_QUESTIONS (checks.ts). Every existing parity test compared them to EACH
 * OTHER. So all three could stay in perfect agreement while all three drifted
 * from the thing they describe — the controls actually defined in
 * `src/controls.rs` in the sscs-bootstrapper repository. The only mention of
 * that file anywhere in the site was a comment. A control renamed or added in
 * the tool would have produced a directory that scored a control set the tool
 * no longer emits, with nothing anywhere going red.
 *
 * WHY VENDORED, NOT READ ACROSS REPOSITORIES. The tool is a different
 * repository and this site's CI checks out only its own, so a test that read
 * `../sscs-bootstrapper/src/controls.rs` would be green on a laptop and
 * silently unrunnable in CI. Instead:
 *
 *   1. the id list is COMMITTED here as `test/fixtures/rust-control-ids.txt`,
 *      and the three tables are pinned to it — this always runs, everywhere;
 *   2. a second test re-derives the list from the live Rust source whenever
 *      that checkout is present (locally, or a CI job that checks out both) and
 *      fails on any drift. Where it is absent it reports as SKIPPED, which is
 *      visible in the run, rather than passing quietly.
 *
 * Refresh the fixture with `bun run refresh:controls`.
 */
import { describe, expect, test } from "bun:test";
import { CHECK_QUESTIONS } from "../src/checks";
import { CONTROL_REGISTRY } from "../src/reclassify";
import { CONTROL_THREATS } from "../src/threats";
import {
  fixtureIds,
  liveIds,
  parseControlIds,
  toolRepoPath,
} from "../tools/control-ids";

const EXPECTED = (await fixtureIds()).slice().sort();
const LIVE = await liveIds();

const TABLES: Array<[string, readonly string[]]> = [
  ["CONTROL_REGISTRY (reclassify.ts)", Object.keys(CONTROL_REGISTRY)],
  ["CONTROL_THREATS (threats.ts)", Object.keys(CONTROL_THREATS)],
  ["CHECK_QUESTIONS (checks.ts)", Object.keys(CHECK_QUESTIONS)],
];

describe("every id-keyed table matches the tool's control registry", () => {
  test("the vendored registry is the 44 controls, with no duplicates", () => {
    expect(EXPECTED.length).toBe(44);
    expect(new Set(EXPECTED).size).toBe(44);
  });

  for (const [name, keys] of TABLES) {
    test(`${name} has exactly the registry's ids`, () => {
      const have = keys.slice().sort();
      const missing = EXPECTED.filter((id) => !have.includes(id));
      const extra = have.filter((id) => !EXPECTED.includes(id));
      expect(
        { missing, extra },
        `${name} drifted from src/controls.rs — ` +
          "add the new controls (or drop the removed ones) here, then " +
          "`bun run refresh:controls`",
      ).toEqual({ missing: [], extra: [] });
    });
  }
});

describe("the vendored list against the live Rust source", () => {
  test.skipIf(LIVE === null)(
    "the fixture is exactly what src/controls.rs defines today",
    () => {
      expect(
        LIVE!.slice().sort(),
        `${toolRepoPath()}/src/controls.rs has changed — run \`bun run refresh:controls\``,
      ).toEqual(EXPECTED);
    },
  );

  // Runs everywhere: the PARSER is what the refresh command depends on, and a
  // parser that silently matched nothing would let a stale fixture look fresh.
  test("the parser reads ids from the table, not from the struct declaration", () => {
    const rust = `
//! doc comment mentioning id: "not-a-control"
pub struct ControlDef {
    pub id: &'static str,
    pub phase: u8,
}

pub const CONTROLS: &[ControlDef] = &[
    ControlDef {
        id: "secrets",
        phase: 1,
    },
    ControlDef {
        id: "commit-signing",
        phase: 1,
    },
];`;
    expect(parseControlIds(rust)).toEqual(["secrets", "commit-signing"]);
  });

  test("the parser refuses a file it cannot read rather than reporting zero controls", () => {
    expect(() => parseControlIds("fn main() {}")).toThrow(/zero control ids/);
    expect(() =>
      parseControlIds(`pub const CONTROLS: &[ControlDef] = &[
    ControlDef {
        id: "secrets",
    },
    ControlDef {
        id: "secrets",
    },
];`),
    ).toThrow(/duplicate ids/);
  });
});
