/**
 * Factory — the claims this design would otherwise make silently.
 *
 * WHY THESE AND NOT OTHERS. The whole existing suite already runs against
 * Factory, so everything it checks (the vocabulary ban, the honesty copy, the
 * link integrity, the readability ceilings) is covered. What it cannot see is
 * the half of this design that is CSS and markup structure:
 *
 *  - A motion branch that stops matching does not throw. `@supports not
 *    (animation-timeline: scroll())` and the reduced-motion block are the two
 *    branches almost nobody renders, and both of them are the ones that have to
 *    paint the SETTLED state — if either silently stopped doing so, a reader who
 *    asked for less motion would get a blank aperture and an undrawn diagram,
 *    and no test that renders HTML would notice.
 *  - An `animation-timeline` declaration that escapes the `@supports` block is
 *    inert in every browser that would have honoured it and invalid nowhere, so
 *    it fails by doing nothing.
 *  - A diagram that stops being rendered FROM the data keeps rendering. The
 *    nine bars, the six regions, the six checkpoints and the 54 cards are all
 *    derived; a refactor that froze any of them into a literal would still
 *    produce a page that looks right today and goes stale silently.
 *
 * Assertions are two-sided where the old form could linger, and counted where a
 * partial match would pass: a `.filter` whose predicate stops matching returns
 * an empty array, and an empty array satisfies "none of these are wrong".
 */
import { describe, expect, test } from "bun:test";
import { DESIGNS } from "../src/designs/registry";
import { switcherFor } from "../src/build";
import { factory } from "../src/designs/factory/index";
import { redactHome } from "../src/designs/factory/directory";
import {
  APERTURE_KEYFRAMES,
  LOOP_KEYFRAMES,
  LOOP_STAGE_MS,
  MOTION_CSS,
  MOTION_SCRIPT,
} from "../src/designs/factory/motion";
import {
  LOOP_EDGE_PATH,
  PIPELINE_GRID,
  pipelineRoute,
  STAGE_ZONES,
  slotForPhases,
  VERDICT_STATES,
  VERDICT_WORD,
} from "../src/designs/factory/components";
import { CONTROL_COUNT, CONTROL_REGISTRY } from "../src/reclassify";
import { CLASS_SHORT } from "../src/designs/factory/components";
import { COVERAGE_FLOOR_PROVISIONAL, PHASES, PHASE_NAMES } from "../src/scoring";
import { ATTACK_CLASSES, controlsDefending, type AttackClassId } from "../src/threats";
import { LANE_TITLE } from "../src/trust";
import { ctxFor, rec, RECORDS } from "./fixtures";
import { attrOfEach, textFrom } from "./html-text";

const CTX = ctxFor("factory");
const HOME = factory.renderHome(RECORDS, CTX);
const DIRECTORY = factory.renderDirectory(RECORDS, ctxFor("factory", "directory", "directory/"));
const DETAIL = factory.renderRepoDetail(
  RECORDS[0]!,
  ctxFor("factory", "directory", "directory/p4gs--sscsb-action/"),
);
const METHODOLOGY = factory.renderMethodology(
  ctxFor("factory", "methodology", "methodology/"),
);
const PAGES: Array<[string, string]> = [
  ["home", HOME],
  ["directory", DIRECTORY],
  ["detail", DETAIL],
  ["methodology", METHODOLOGY],
];
const CSS = factory.css ?? "";

/** The body of the first balanced-brace block that follows `header`. */
function blockAfter(css: string, header: string): string {
  const at = css.indexOf(header);
  if (at === -1) return "";
  let i = css.indexOf("{", at + header.length);
  if (i === -1) return "";
  const start = i + 1;
  let depth = 1;
  i += 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") depth -= 1;
    i += 1;
  }
  return css.slice(start, i - 1);
}

function countOf(haystack: string, needle: string): number {
  let n = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) {
    n += 1;
    at = haystack.indexOf(needle, at + needle.length);
  }
  return n;
}

/* ══ the registry ════════════════════════════════════════════════════════ */

describe("the registry gains a sixth design and loses nothing", () => {
  test("factory is LAST, so the default design does not move", () => {
    expect(DESIGNS.map((d) => d.id)).toEqual([
      "ledger",
      "console",
      "chain",
      "signal",
      "bulletin",
      "factory",
    ]);
    expect(DESIGNS[DESIGNS.length - 1]!.id).toBe("factory");
    expect(DESIGNS[0]!.id).toBe("ledger");
  });

  test("it implements the whole contract, and names itself for the switcher", () => {
    expect(factory.label).toBe("Factory");
    expect(typeof factory.renderHome).toBe("function");
    expect(typeof factory.renderDirectory).toBe("function");
    expect(typeof factory.renderRepoDetail).toBe("function");
    expect(typeof factory.renderMethodology).toBe("function");
    expect(CSS.length).toBeGreaterThan(1000);
  });

  test("the switcher on a Factory page lists every design in registry order", () => {
    const ids = attrOfEach(switcherFor(factory, ""), "a[data-design]", "data-design");
    expect(ids).toEqual(DESIGNS.map((d) => d.id));
  });
});

/* ══ the motion branches ═════════════════════════════════════════════════ */

const SUPPORTS = "@supports (animation-timeline: scroll())";
const NO_SUPPORTS = "@supports not (animation-timeline: scroll())";
const REDUCED = "@media (prefers-reduced-motion: reduce)";

describe("MOTION_CSS carries all three branches, and the settled state is the default", () => {
  test("all three branch headers are present", () => {
    expect(MOTION_CSS).toContain(SUPPORTS);
    expect(MOTION_CSS).toContain(NO_SUPPORTS);
    expect(MOTION_CSS).toContain(REDUCED);
  });

  test("EVERY animation-timeline declaration is inside the supports branch", () => {
    // The two @supports CONDITIONS name the property too, so they are removed
    // before counting — what is being asserted is that no DECLARATION escapes.
    const conditionless = MOTION_CSS.split(SUPPORTS).join("").split(NO_SUPPORTS).join("");
    const total = countOf(conditionless, "animation-timeline:");
    const inside = countOf(blockAfter(MOTION_CSS, SUPPORTS), "animation-timeline:");
    expect(total).toBeGreaterThan(0);
    expect(inside).toBe(total);
  });

  test("the six aperture keyframes are present by name, inside that branch", () => {
    const inside = blockAfter(MOTION_CSS, SUPPORTS);
    expect(APERTURE_KEYFRAMES.length).toBe(6);
    for (const name of APERTURE_KEYFRAMES) {
      expect(inside).toContain(`@keyframes ${name} `);
    }
  });

  test("the seven loop keyframes are present by name", () => {
    expect(LOOP_KEYFRAMES.length).toBe(7);
    for (const name of LOOP_KEYFRAMES) {
      expect(MOTION_CSS).toContain(`@keyframes ${name} `);
    }
  });

  test("the aperture's wiring is the measured one, not a re-derivation", () => {
    const inside = blockAfter(MOTION_CSS, SUPPORTS);
    expect(inside).toContain("timeline-scope: --fy-window-response");
    expect(inside).toContain("view-timeline-name: --fy-window-response");
    expect(inside).toContain("view-timeline-axis: block");
    expect(inside).toContain(
      "view-timeline-inset: 0 calc(100% - var(--fy-window-viewport-height))",
    );
    expect(inside).toContain("animation-range: entry-crossing exit-crossing 0%");
    expect(inside).toContain("cubic-bezier(0.333333, 0, 0.666667, 1)");
    // The two step tracks fire together at progress 1; that single frame is the
    // whole trick, and `step-end` is not interchangeable with a duration.
    expect(inside).toContain("step-end");
    expect(inside).toContain("100% { clip-path: inset(0px); }");
    expect(inside).toContain("100% { visibility: hidden; }");
    // The seam fallback, so the two halves meet on whole device pixels.
    expect(inside).toContain("round(nearest, 50%, 1px)");
  });

  test("A11 · the loop is GATED on reduced motion ALONE, never on a scroll timeline", () => {
    // Only the aperture uses a scroll timeline. Inside the @supports block the
    // loop's rings and packets were `display: none` in any engine without
    // `animation-timeline` — every WebKit before 26 — while its state machine
    // kept flipping stages, and the traces drew with every checkpoint already
    // lit because the pending rules were unreachable. It fails by doing nothing.
    const inside = blockAfter(MOTION_CSS, SUPPORTS);
    const noSupport = blockAfter(MOTION_CSS, NO_SUPPORTS);
    expect(MOTION_CSS).toContain("animation-play-state: paused");
    expect(MOTION_CSS).toContain('.fy-loop[data-running="true"]');
    expect(inside).not.toContain('.fy-loop[data-running="true"]');
    expect(inside).not.toContain('.fy-checkpoint-group[data-reached="false"]');
    expect(inside).not.toContain("fy-loop-travel");
    // the @supports not branch is the APERTURE's settled state and nothing else
    expect(noSupport).not.toContain(".fy-packet");
    expect(noSupport).not.toContain(".fy-loop");
    expect(noSupport).not.toContain(".fy-trace");
    // and the gate lives in a plain reduced-motion block
    const noPref = blockAfter(MOTION_CSS, "\n@media (prefers-reduced-motion: no-preference)");
    expect(noPref).toContain('.fy-loop[data-running="true"]');
    expect(noPref).toContain('.fy-checkpoint-group[data-reached="false"]');
    expect(noPref).toContain("@keyframes fy-loop-travel");
    // The measured cadence, in the one place the script reads it from.
    expect(LOOP_STAGE_MS).toBe(2500);
    expect(MOTION_SCRIPT).toContain(String(LOOP_STAGE_MS));
  });

  test("the aperture's settled state is painted by BOTH of its fallbacks", () => {
    for (const [name, header] of [
      ["no-support", NO_SUPPORTS],
      ["reduced-motion", REDUCED],
    ] as const) {
      const body = blockAfter(MOTION_CSS, header);
      expect(body.length, `${name}: branch is empty`).toBeGreaterThan(200);
      // the aperture: a finished black panel, no doors, the complete headline
      expect(body, name).toContain(".fy-bars");
      expect(body, name).toContain("display: none");
      expect(body, name).toContain("background: #000");
      expect(body, name).toContain("clip-path: none");
    }
    // Reduced motion ALSO settles the traces and the loop, because those two
    // are exactly what a reader asking for less motion is asking about.
    const reduced = blockAfter(MOTION_CSS, REDUCED);
    expect(reduced).toContain("stroke-dashoffset: 0");
    expect(reduced).toContain("fill-opacity: 0.4");
    expect(reduced).toContain(".fy-packet");
    expect(reduced).toContain(".fy-context-pulse");
  });

  test("M1 · every var(--fy-…) the stylesheet reads is one something defines", () => {
    // `view-timeline-inset: 0 calc(100% - var(--fy-window-viewport-height))`
    // shipped against a property nothing defined: invalid at computed-value
    // time, silently `auto`, and `auto` coincides with the intended inset at
    // exactly one viewport height. Class-level guard, not a one-name check.
    expect(CSS).toContain("--fy-window-viewport-height: 100svh");
    expect(CSS).toContain("min-block-size: max(540px, var(--fy-window-viewport-height))");
    expect(CSS).toContain("min-block-size: max(500px, var(--fy-window-viewport-height))");

    const defined = new Set([...CSS.matchAll(/(--fy-[\w-]+)\s*:/g)].map((m) => m[1]!));
    // Properties the SCRIPT writes, and properties written as inline styles by
    // the renderers, are defined too — just not in the stylesheet.
    for (const m of MOTION_SCRIPT.matchAll(/setProperty\("(--fy-[\w-]+)"/g)) defined.add(m[1]!);
    for (const [, html] of PAGES) {
      for (const m of html.matchAll(/(--fy-[\w-]+)\s*:/g)) defined.add(m[1]!);
    }
    const missing = new Set<string>();
    for (const m of CSS.matchAll(/var\(\s*(--fy-[\w-]+)\s*([,)])/g)) {
      if (m[2] === ",") continue; // has a fallback, so an absent name is fine
      if (!defined.has(m[1]!)) missing.add(m[1]!);
    }
    expect([...missing]).toEqual([]);
    // counted, or an expression that stopped matching would satisfy the line above
    expect([...CSS.matchAll(/var\(\s*--fy-/g)].length).toBeGreaterThan(100);
  });

  test("nothing animates a name outside the catalogued set", () => {
    const named = new Set<string>();
    for (const m of CSS.matchAll(/animation-name:\s*([^;}]+)/g)) {
      for (const n of m[1]!.split(",")) named.add(n.trim());
    }
    for (const m of CSS.matchAll(/\banimation:\s*([a-z][\w-]*)\s+[\d.]/g)) {
      named.add(m[1]!.trim());
    }
    // Max-11: the phantom allowlist entry `var(--popover-enter-animation-name)`
    // was a name nothing in this tree ever animated — an allowlist entry that
    // could only ever hide a real one.
    const allowed = new Set<string>([
      ...APERTURE_KEYFRAMES,
      ...LOOP_KEYFRAMES,
      "fy-tip-enter",
      "fy-tip-exit",
    ]);
    expect([...named].filter((n) => !allowed.has(n))).toEqual([]);
    // Counted, because an empty set would satisfy the line above by accident.
    expect(named.size).toBeGreaterThanOrEqual(APERTURE_KEYFRAMES.length);
    // And nothing that reads as a reveal-on-scroll or a counter.
    expect([...named].filter((n) => /count|fade|slide|thumb/i.test(n))).toEqual([]);
  });

  test("the scroll affordance on a wide table is two TRANSITIONED properties", () => {
    expect(MOTION_CSS).toContain("@property --fy-mask-start");
    expect(MOTION_CSS).toContain("@property --fy-mask-end");
    expect(MOTION_CSS).toContain("transition-property: --fy-mask-start, --fy-mask-end");
    expect(MOTION_CSS).toContain("transition-duration: 0.3s");
    expect(MOTION_CSS).toContain("cubic-bezier(0.4, 0, 0.2, 1)");
  });

  test("the measured transition timings are the ones that shipped", () => {
    expect(MOTION_CSS).toContain("transition: background-color 0.18s"); // hero arrow
    expect(MOTION_CSS).toContain(
      ".fy-chapters a { transition: background-color 0.25s cubic-bezier(0, 0, 1, 1); }",
    ); // pill cross-fade — a TIME transition, not scroll-linked
    expect(MOTION_CSS).toContain(
      ".fy-seg-label { transition: background-color 0.15s, color 0.15s; }",
    ); // and no sliding thumb anywhere
    expect(CSS).not.toMatch(/translateX\([^)]*\)[^;]*;\s*\/\*\s*thumb/i);
  });
});

/* ══ the script ══════════════════════════════════════════════════════════ */

describe("MOTION_SCRIPT is the one script, and it asks before it observes", () => {
  test("it loads nothing", () => {
    expect(MOTION_SCRIPT).not.toContain("src=");
    expect(MOTION_SCRIPT).not.toContain("import(");
    expect(MOTION_SCRIPT).not.toContain("document.write");
  });

  test("the reduced-motion check happens BEFORE any observer exists", () => {
    const check = MOTION_SCRIPT.indexOf("prefers-reduced-motion: reduce");
    const observe = MOTION_SCRIPT.indexOf("IntersectionObserver");
    expect(check).toBeGreaterThan(-1);
    expect(observe).toBeGreaterThan(-1);
    expect(check).toBeLessThan(observe);
    expect(MOTION_SCRIPT).toContain("matchMedia");
  });

  test("under reduced motion it PARTICIPATES rather than standing down", () => {
    // The reference's own behaviour, measured: the figures snap to the drawn end
    // state and JS says so in `data-figure-mode`, the loop marks itself static,
    // and the nav still tracks where the reader is — being where you are is
    // information, not decoration.
    expect(MOTION_SCRIPT).toContain('"data-figure-mode", "static"');
    expect(MOTION_SCRIPT).toContain('"data-loop-status", "static"');
    expect(MOTION_SCRIPT).toContain('"data-reduced-motion", "true"');
  });

  test("every page ships exactly one inline script of ours, and one external", () => {
    for (const [name, html] of PAGES) {
      expect(countOf(html, MOTION_SCRIPT), `${name}: motion script count`).toBe(1);
      const external = attrOfEach(html, "script[src]", "src");
      for (const src of external) {
        expect(src, `${name}: unexpected external script`).toBe(CTX.h("filter.js"));
      }
    }
    // filter.js is loaded exactly where `#dir-filter` actually exists.
    expect(attrOfEach(HOME, "script[src]", "src").length).toBe(1);
    expect(attrOfEach(DIRECTORY, "script[src]", "src").length).toBe(1);
    expect(attrOfEach(METHODOLOGY, "script[src]", "src").length).toBe(0);
    expect(attrOfEach(DETAIL, "script[src]", "src").length).toBe(0);
  });
});

/* ══ the home page's diagrams are rendered FROM the data ═════════════════ */

describe("every diagram is derived, and a literal would fail here", () => {
  test("the nested diagram has one region per phase, in PHASES order", () => {
    const phases = attrOfEach(HOME, ".fy-region", "data-phase").map(Number);
    expect(phases).toEqual([...PHASES]);
    expect(phases.length).toBe(PHASES.length);
  });

  test("every control id the home page renders is in the registry", () => {
    const ids = textFrom(
      attrOfEach(HOME, ".fy-node", "aria-controls").join(" "),
    );
    const chipIds = attrOfEach(HOME, ".fy-node", "aria-controls").map((s) =>
      s.replace("fy-tip-home-", ""),
    );
    expect(chipIds.length).toBe(CONTROL_COUNT);
    expect(chipIds.filter((id) => !(id in CONTROL_REGISTRY))).toEqual([]);
    expect(ids.length).toBeGreaterThan(0);
  });

  test("the explorer has one typed card per control, and every type is real", () => {
    const cards = attrOfEach(HOME, ".fy-refcard", "data-reference-type");
    expect(cards.length).toBe(CONTROL_COUNT);
    expect(cards.length).toBe(Object.keys(CONTROL_REGISTRY).length);
    expect([...new Set(cards)].sort()).toEqual(["artifact", "local", "meta", "observed"]);
  });

  test("the bar chart has nine bars whose total heights match the counts", () => {
    const heights = attrOfEach(HOME, ".fy-bar", "height").map(Number);
    expect(heights.length).toBe(ATTACK_CLASSES.length * 2);
    expect(heights.length).toBe(18);
    // pairs, in order: [local-only, answerable-from-outside] per group
    const totals: number[] = [];
    for (let i = 0; i < heights.length; i += 2) totals.push(heights[i]! + heights[i + 1]!);
    const counts = ATTACK_CLASSES.map((c) => controlsDefending(c.id as AttackClassId).length);
    const order = (xs: number[]) =>
      xs
        .map((v, i) => [v, i] as const)
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map(([, i]) => i);
    expect(order(totals)).toEqual(order(counts));
    // Proportional, not merely ordered: a chart that ranked right and scaled
    // wrong would pass an ordering check and still lie about the magnitudes.
    const unit = totals[0]! / counts[0]!;
    for (let i = 0; i < totals.length; i += 1) {
      expect(Math.abs(totals[i]! - counts[i]! * unit)).toBeLessThanOrEqual(1);
    }
  });

  test("the maze carries one checkpoint per phase, at real path fractions", () => {
    const maze = HOME.slice(
      HOME.indexOf('class="fy-figure fy-pipeline"'),
      HOME.indexOf("</figure>", HOME.indexOf('class="fy-figure fy-pipeline"')),
    );
    const at = attrOfEach(maze, "[data-node-at]", "data-node-at").map(Number);
    expect(at.length).toBe(PHASES.length);
    expect(at[0]).toBe(0);
    expect(at[at.length - 1]).toBe(1);
    // strictly increasing — a checkpoint that lit before the line reached it
    // would be the one defect this figure can have
    for (let i = 1; i < at.length; i += 1) expect(at[i]!).toBeGreaterThan(at[i - 1]!);
    // and the legend names the phases, so the order is readable without hovering
    expect(countOf(maze, "data-legend-at=")).toBe(PHASES.length);
  });

  test("the route generator follows the phase count rather than a literal", () => {
    for (const n of [3, 5, PHASES.length, 8]) {
      const r = pipelineRoute(n);
      expect(r.stops.length, `n=${n}`).toBe(n);
      expect(r.stops[0]).toBe(0);
      expect(r.stops[r.stops.length - 1]).toBe(r.points.length - 1);
      for (const [x, y] of r.points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(532);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(374);
      }
      // every checkpoint lands inside a zone, and the zones account for all of
      // them — a seventh phase widens Build rather than falling off the board
      expect(r.zones.reduce((a, z) => a + z.holds, 0), `n=${n}`).toBe(n);
    }
  });

  test("the maze is deterministic — the same build draws the same walls", () => {
    const twice = factory.renderHome(RECORDS, ctxFor("factory"));
    expect(twice).toBe(HOME);
  });

  test("the triangle names the three evidence lanes, one of them hollow", () => {
    const tri = HOME.slice(
      HOME.indexOf('class="fy-figure fy-triangle"'),
      HOME.indexOf("</figure>", HOME.indexOf('class="fy-figure fy-triangle"')),
    );
    expect(countOf(tri, "data-node-at=")).toBe(3);
    expect(countOf(tri, "fy-speed-node")).toBe(3);
    // Exactly one node is hollow, and it is hollow through a CLASS. It shipped
    // once as `fill="none"` on the circle, which renders solid: any CSS fill
    // rule beats an SVG presentation attribute, and three branches set one. So
    // this asserts both halves — the class on exactly one node, the rule that
    // out-specifies those branches, and the inert attribute gone.
    expect(countOf(tri, "fy-node-hollow")).toBe(1);
    expect(tri).not.toContain('fill="none"');
    expect(CSS).toContain(".fy-figure .fy-speed-node.fy-node-hollow { fill: none; }");
  });

  test("A1-A9 are expanders, and every defending id they name is in the registry", () => {
    const triggers = attrOfEach(HOME, ".fy-attack-trigger", "aria-expanded");
    expect(triggers.length).toBe(ATTACK_CLASSES.length);
    expect(triggers).toEqual(ATTACK_CLASSES.map(() => "false"));
    for (const c of ATTACK_CLASSES) {
      const panel = HOME.slice(
        HOME.indexOf(`id="fy-attack-${c.id.toLowerCase()}"`),
        HOME.indexOf("</li>", HOME.indexOf(`id="fy-attack-${c.id.toLowerCase()}"`)),
      );
      const ids = [...panel.matchAll(/<code>([^<]+)<\/code>/g)].map((m) => m[1]!);
      expect(ids.length, c.id).toBe(controlsDefending(c.id as AttackClassId).length);
      expect(ids.filter((id) => !(id in CONTROL_REGISTRY)), c.id).toEqual([]);
    }
  });

  test("the metrics carry their final values beside a visually-hidden twin", () => {
    const finals = [...HOME.matchAll(
      /<span class="fy-metric-final">([^<]*)<\/span><span aria-hidden="true">([^<]*)<\/span>/g,
    )];
    expect(finals.length).toBe(5);
    for (const m of finals) expect(m[1]).toBe(m[2]);
    expect(finals.map((m) => m[1])).toContain(String(CONTROL_COUNT));
    expect(finals.map((m) => m[1])).toContain(String(PHASES.length));
    expect(finals.map((m) => m[1])).toContain(String(ATTACK_CLASSES.length));
    // and no counter anywhere near them
    expect(HOME).not.toContain("data-countup");
  });

  test("the loop has five stage cards, five edges and one centre", () => {
    const stages = attrOfEach(HOME, ".fy-loop-card", "data-stage");
    expect(stages.length).toBe(5);
    expect(new Set(stages).size).toBe(5);
    expect(attrOfEach(HOME, ".fy-connector", "data-loop-edge")).toEqual(stages);
    expect(countOf(HOME, "fy-context-store")).toBe(1);
    expect(HOME).toContain('data-loop-status="paused"');
    expect(HOME).toContain('data-running="false"');
  });

  test("the resting frame is in the markup, so no-JS is not a blank diagram", () => {
    expect(HOME).toContain('<span class="fy-context-title">the record</span>');
    expect(HOME).toContain('data-figure-progress="1"');
    expect(countOf(HOME, 'data-reached="true"')).toBeGreaterThan(PHASES.length);
    expect(HOME).not.toContain('data-reached="false"');
  });
});

/* ══ the pages ═══════════════════════════════════════════════════════════ */

describe("every page is inside its own tree, and says which copy is canonical", () => {
  test("every internal href starts with the design's prefix", () => {
    for (const [name, html] of PAGES) {
      const bad = attrOfEach(html, "a[href]", "href").filter(
        (h) => !/^[a-z][a-z0-9+.-]*:/i.test(h) && !h.startsWith("#") && !h.startsWith(CTX.prefix),
      );
      expect(bad, `${name}: hrefs outside the tree`).toEqual([]);
    }
  });

  test("the canonical link points at the DEFAULT design's page", () => {
    const withCanonical = factory.renderHome(RECORDS, {
      ...ctxFor("factory"),
      canonical: "https://sscsb.dev/",
    });
    expect(withCanonical).toContain('<link rel="canonical" href="https://sscsb.dev/">');
    // absent outside the build rather than invented
    expect(HOME).not.toContain('rel="canonical"');
  });

  test("the head names only the two font hosts", () => {
    for (const [name, html] of PAGES) {
      const head = html.slice(0, html.indexOf("</head>"));
      const hosts = [...head.matchAll(/https?:\/\/([^/"']+)/g)].map((m) => m[1]!);
      expect([...new Set(hosts)].sort(), `${name}: head hosts`).toEqual([
        "fonts.googleapis.com",
        "fonts.gstatic.com",
      ]);
    }
  });

  test("TWO font families are requested, and no third", () => {
    expect(factory.head).toContain("family=Inter:wght@400;500");
    expect(factory.head).toContain("family=JetBrains+Mono:wght@400;500");
    // Source Serif 4 existed for one pull-quote per page and the inline term
    // glosses — a third family, with an italic axis, requested on every page of
    // the site to set two paragraphs. Two-sided: gone from the head AND gone
    // from every rule that read it, or the CSS would silently fall back to
    // Georgia and the page would still look "designed".
    expect(factory.head).not.toContain("Source+Serif");
    expect(CSS).not.toContain("Source Serif");
    expect(CSS).not.toContain("--fy-serif");
    const families = [...factory.head.matchAll(/family=([A-Za-z+0-9]+)[:&]/g)].map((m) => m[1]!);
    expect(families).toEqual(["Inter", "JetBrains+Mono"]);
    for (const [name, html] of PAGES) expect(html, name).not.toContain("Source+Serif");
  });

  test("the switcher is in the colophon, in document flow", () => {
    const withSwitcher = factory.renderHome(RECORDS, {
      ...ctxFor("factory"),
      switcher: '<nav class="design-switcher">SW</nav>',
    });
    const foot = withSwitcher.indexOf("<footer");
    expect(withSwitcher.indexOf("design-switcher")).toBeGreaterThan(foot);
    expect(CSS).toContain(":root .design-switcher {\n  position: static;");
    expect(CSS).not.toMatch(/\.design-switcher\s*\{[^}]*position:\s*fixed/);
  });
});

/* ══ the defects a real browser found ════════════════════════════════════ */

/**
 * Every claim below failed once, live, at 1440 or 390 — and every one of them
 * failed SILENTLY: the page rendered, the suite was green, and nothing threw.
 * They are pinned two-sided where an old form could come back.
 */
describe("what the browser found, and what keeps it found", () => {
  test("the opening panel is exactly one viewport minus the header", () => {
    // The aperture's progress equals scrollY / innerHeight ONLY while this
    // holds. It shipped 13px over at 1440 — the search control's chips wrapped
    // to a second row — which moved the whole range 13px down the page. Both
    // halves of the arithmetic are asserted, because a header that stops being
    // 64px breaks it just as surely as a panel that grows.
    expect(CSS).toContain("--fy-header-h: 64px");
    expect(CSS).toContain("--fy-header-h: 54px");
    expect(CSS).toContain(".fy-header {\n  block-size: var(--fy-header-h)");
    expect(CSS).toContain("min-block-size: calc(100svh - var(--fy-header-h))");
    expect(CSS).toContain("min-block-size: max(500px, calc(100svh - var(--fy-header-h)))");
  });

  test("the headline keeps its word boundary when the break is hidden", () => {
    // `repository<br>can` renders "repositorycan" at <=767, where the
    // stylesheet hides the break. Measured at 390 before the space went in.
    // T7 · the break moved so the two lines are closer in length; the SPACE
    // before it is the part that matters here and it moved with it.
    expect(HOME).toContain("What each <br>repository can prove");
    expect(HOME).not.toContain("each<br>repository");
    expect(CSS).toContain(".fy-headline br { display: none; }");
  });

  test("an open toggletip cannot widen the document", () => {
    // 340px anchored to a holder in the right-hand column pushed the document
    // 6px sideways at 1440 and 17px at 390. No closed-state probe can see it.
    expect(MOTION_SCRIPT).toContain("document.documentElement.clientWidth");
    expect(MOTION_SCRIPT).toContain("box.right > vw - 8");
    expect(MOTION_SCRIPT).toContain("box.left + shift < 8");
    // and it is given back on close, or the next open inherits the last shift
    expect(MOTION_SCRIPT).toContain('t.panel.style.insetInlineStart = "";');
    expect(CSS).toContain("inline-size: min(340px, calc(100vw - 16px))");
  });

  test("the loop's halo belongs to a disc, so the rail does not get one", () => {
    // `inset: -6%` is right inside a 220px disc and wrong once the compact
    // layout makes that store a full-width card: 9px of document past the right
    // edge at 390. It was contained with `overflow: clip` on the stage, which
    // is what hid the three edges of clipping E1 later measured — so the halo
    // goes at that width instead, and the clip goes with it.
    expect(MOBILE).toContain(".fy-context-pattern, .fy-context-pulse { display: none; }");
    expect(MOBILE).not.toContain(".fy-loop-stage { overflow: clip; }");
    expect(CSS).not.toMatch(/\.fy-loop-stage \{[^}]*overflow:\s*clip/);
    // the desktop stage may NOT clip — its process box overflows it by design
    expect(CSS).toContain("inline-size: 118%; margin-inline: -9%");
  });

  test("the card type is a property of the diagram, not of the window", () => {
    // Without a container, cqw resolves against the VIEWPORT, so at 1440 every
    // clamp pinned to its maximum and an 18px title landed in a 164px circle.
    // With it fixed, the brief's own measured clamps are the ones that ship.
    expect(CSS).toContain("container: factory-loop / inline-size");
    expect(CSS).toContain("font-size: clamp(16px, 1.8cqw, 20px)");
    expect(CSS).toContain("font-size: clamp(13px, 1.35cqw, 15px)");
    expect(CSS).not.toContain("font-size: clamp(14px, 1.8cqw, 18px)");
  });

  test("the resting ring is normalised so it renders as dots", () => {
    // stroke-dasharray: 0,1 renders whatever pathLength says it does. At
    // pathLength="1" the gap becomes the whole circumference and the ring is a
    // single dot; unnormalised in a 100-unit viewBox the dots overlap into a
    // solid hairline.
    expect(HOME).toContain('<circle cx="50" cy="50" r="49.5" pathLength="150">');
    expect(HOME).not.toContain('pathLength="1">');
    expect(CSS).toContain("stroke-dasharray: 0, 1; vector-effect: non-scaling-stroke");
  });

  test("the rail's return packet is gated on the edge, not on a layout class", () => {
    // Keyed on a layout class alone it out-specified the reduced-motion and
    // no-support branches, and a reader who asked for less motion got a static
    // dot parked on the rail. The class itself is gone now (Max-10): the rail
    // is a property of the viewport, so the media query is the only thing that
    // should know about it.
    expect(CSS).toContain(
      '.fy-connector[data-loop-edge="rescan"][data-edge-state="running"] .fy-return-packet',
    );
    expect(CSS).not.toMatch(/\.fy-connector\[data-loop-edge="rescan"\] \.fy-return-packet\s*\{/);
    expect(CSS).not.toContain("fy-compact");
    for (const [name, html] of PAGES) expect(html, name).not.toContain("fy-compact");
  });

  test("the explorer legend paints the cards' own tokens", () => {
    // Keyed off the evidence class it gave `meta` and `artifact` the same grey,
    // so two of the four types were identical in the one place that exists to
    // tell them apart.
    const types = attrOfEach(HOME, ".fy-legend-dot", "data-reference-type");
    expect(types).toEqual(["observed", "artifact", "local", "meta"]);
    const cardTypes = [...new Set(attrOfEach(HOME, ".fy-refcard", "data-reference-type"))].sort();
    expect(types.slice().sort()).toEqual(cardTypes);
  });

  test("the shared layer follows the ground it is set on", () => {
    // The taxonomy explainer is set on the opening block's black. The shared
    // components take their palette from bridge tokens, so they followed those
    // tokens straight onto a white panel inside a black chapter — headings
    // survived, every control id and incident line went pale-grey-on-pale-grey.
    // A component layer driven by variables fails silently and completely.
    const dark = CSS.slice(CSS.indexOf(".fy-dark {\n  --hp-surface"));
    expect(dark.length).toBeGreaterThan(100);
    for (const token of ["--hp-surface", "--hp-ink", "--hp-dim", "--hp-muted", "--hp-line", "--hp-accent"]) {
      expect(dark.slice(0, 900), `no dark ${token}`).toContain(token);
    }
    expect(CSS).toContain(".fy-dark a { color: #6fb0ff; }");
    // and the taxonomy really is on that ground
    expect(METHODOLOGY).toMatch(/<div class="fy-dark">[\s\S]*id="threats"/);
  });

  test("every anchor target clears the sticky nav, shared ones included", () => {
    // Two of the eight methodology pills point at sections the SHARED modules
    // render under their own class, so a per-class scroll-margin landed those
    // headings underneath the bar that had just been used to jump to them.
    expect(CSS).toContain("main [id] { scroll-margin-top: 88px; }");
    expect(CSS).not.toContain(".fy-chapter { scroll-margin-top");
  });

  test("the listing restacks into cards at 390 rather than side-scrolling", () => {
    // A five-column results table in a 350px wrap means dragging sideways to
    // reach who ran the scan and when. Every cell already carries a data-label;
    // this is the rule that prints it, and the wrap stops being a scroll
    // container because there is nothing left to scroll.
    expect(CSS).toContain('content: attr(data-label)');
    expect(CSS).toContain("  .fy-wrap { overflow-x: visible; }");
    const cells = attrOfEach(DIRECTORY, "td", "data-label");
    expect(cells.length).toBe(RECORDS.length * 5);
    expect([...new Set(cells)]).toEqual([
      "Grade", "Repository", "Phases", "Evidence source", "Scanned",
    ]);
  });

  test("every control this design styles clears the 44px floor", () => {
    // Six selectors measured under it live, at one or both widths. The pill nav
    // is the interesting one: the reference is 40px, and the floor wins.
    expect(CSS).toContain("  inline-size: 44px; block-size: 44px; border-radius: 999px;");
    expect(CSS).toContain("  min-block-size: 44px; color: var(--fy-text); border-radius: 999px;");
    expect(CSS).toContain(":root .ex-name { min-block-size: 44px");
    expect(CSS).toContain(":root .tx-incident > a { display: inline-flex");
    expect(CSS).not.toContain("min-block-size: 40px");
    // and the shared layer's own floors are still the last word
    expect(CSS).toContain('input:not([type="checkbox"]):not([type="radio"]), select, textarea {\n  font-size: max(16px, 1em) !important;\n}');
  });
});

/* ══ what may not appear ═════════════════════════════════════════════════ */

describe("nothing of the reference's own comes along", () => {
  const BANNED = /openai|defense factory|codex|daybreak|aardvark|security\.md/i;

  test("not in any rendered page", () => {
    for (const [name, html] of PAGES) {
      const hit = html.match(BANNED);
      expect(hit?.[0] ?? null, `${name}: borrowed name`).toBeNull();
    }
  });

  test("not in the stylesheet", () => {
    expect(CSS.match(BANNED)?.[0] ?? null).toBeNull();
  });

  test("and neither does its red", () => {
    expect(CSS.toLowerCase()).not.toContain("#fa423e");
    expect(CSS.toLowerCase()).not.toContain("rgb(250, 66, 62)");
    for (const [name, html] of PAGES) {
      expect(html.toLowerCase(), `${name}`).not.toContain("#fa423e");
    }
  });

  test("the two blues keep their jobs, and neither is a verdict", () => {
    expect(CSS).toContain("--fy-link: #2c67c5");
    expect(CSS).toContain("--fy-accent: #0285ff");
    const verdicts = ["--fy-pass", "--fy-fail", "--fy-warn", "--fy-na"];
    for (const v of verdicts) {
      const m = CSS.match(new RegExp(`${v}:\\s*([^;]+);`));
      expect(m, `${v} is not defined`).not.toBeNull();
      expect(m![1]!.trim().toLowerCase()).not.toBe("#2c67c5");
      expect(m![1]!.trim().toLowerCase()).not.toBe("#0285ff");
    }
  });
});

/* ══ round 1 — the structural and honesty fixes ══════════════════════════ */

/**
 * Round 1 of the judge panel, the code review and the independent measurement
 * pass produced a prioritised list; §A (structural), §D (honesty) and §E
 * (measured) are pinned here, item by item, in the list's own order.
 *
 * Where an item is a behaviour claim the assertion is two-sided: the new form
 * is required AND the old one is required to be gone, because most of these
 * shipped once and every one of them shipped silently.
 */
const MOBILE = blockAfter(CSS, "@media (max-width: 767px)");

describe("A1 · the hero is one axis, one control, no chips", () => {
  const opening = HOME.slice(
    HOME.indexOf('<div class="fy-opening">'),
    HOME.indexOf('<div class="fy-response">'),
  );

  test("the opening panel carries no chips at all", () => {
    expect(opening.length).toBeGreaterThan(400);
    expect(opening).not.toContain("hp-chips");
    expect(opening).not.toContain("hp-chip");
    // The three repository links the chips carried are gone from the panel.
    // dir-found is the hidden result slot filter.js writes into, not a chip.
    expect(opening).not.toContain(CTX.h("directory/p4gs--sscsb-action/"));
    // and the shared control it is built from still ships them, so the strip
    // is doing work rather than describing a control that changed underneath it
    expect(HOME).toContain('id="dir-filter"');
  });

  test("the search control is INSIDE the opening panel, with its label hidden", () => {
    expect(opening).toContain('class="hp-search"');
    expect(opening).toContain('id="dir-filter"');
    expect(opening).toContain('placeholder="owner/repo"');
    // present for anything that reads the input by its accessible name…
    expect(opening).toContain('class="hp-search-label" for="dir-filter"');
    // …and off the page
    expect(CSS).toContain(".fy-opening .hp-search-label {");
    expect(CSS).toContain("clip-path: inset(50%); white-space: nowrap;\n}");
  });

  test("it is a pill on a hairline, capped at 520px, centred on the page axis", () => {
    expect(CSS).toContain(
      ".fy-opening .hp-search { margin-block: 28px 0; text-align: start; max-inline-size: 520px; margin-inline: auto; }",
    );
    expect(CSS).toContain("border-radius: 999px; border: 1px solid var(--fy-hair); padding: 12px 20px;");
    // the 720px the chips forced is gone
    expect(CSS).not.toContain("max-inline-size: 720px");
  });

  test("the display line is set to fit its own 1120 container", () => {
    // Measured at 1440: line 1 spanned 1182px inside a 1120 container and hung
    // 29px past it on each side. Two halves — the container is the wrap, and
    // the type scale is cut so the longest line fits inside it.
    expect(CSS).toContain(".fy-opening-in { inline-size: min(100%, var(--fy-wrap)); }");
    expect(CSS).not.toContain(".fy-opening-in { inline-size: min(100%, var(--fy-media)); }");
    expect(CSS).toContain("font-size: clamp(41px, 8.2vw, 138px)");
  });

  test("the display line and the kicker both balance, and the line is optically centred", () => {
    expect(CSS).toMatch(/\.fy-headline \{[^}]*text-wrap: balance; padding-inline-end: 6px;/);
    expect(CSS).toMatch(/\.fy-kicker \{[^}]*text-wrap: balance;/);
    // padding, not margin: the element box must not move, or the probe that
    // compares the five centres would be measuring the shim instead.
    expect(CSS).not.toMatch(/\.fy-headline \{[^}]*margin-inline-end/);
  });

  test("the mobile display line is the brief's 41 / 41.82 / -1.64", () => {
    // 41 x 1.02 = 41.82 and 41 x -0.04em = -1.64px, so the two ratios ARE the
    // measured values at this size — asserted together, because a change to
    // either ratio silently moves both.
    expect(MOBILE).toContain(".fy-headline { font-size: clamp(41px, 8.2vw, 65px)");
    expect(CSS).toMatch(/\.fy-headline \{[^}]*line-height: 1\.02;[^}]*letter-spacing: -0\.04em/);
  });
});

describe("A2 · the fixed search affordance is a plate at desktop and gone on phones", () => {
  test("at desktop it is opaque, hairlined and shadowed — never a transparent disc", () => {
    expect(CSS).toContain("place-items: center; color: #5d5d5d; background: #ffffff;");
    expect(CSS).toContain("border: 1px solid #dedede; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);");
    // the ground it used to have none of
    expect(CSS).not.toContain("border: 1px solid rgba(128, 128, 128, 0.42)");
  });

  test("at <=767 it is removed, not shrunk", () => {
    expect(MOBILE).toContain(".fy-find { display: none; }");
    expect(MOBILE).not.toContain(".fy-find { inset-block-start: 5px");
  });

  test("the header keeps 44px of clearance only where the affordance exists", () => {
    expect(CSS).toContain("padding-inline-end: 56px;");
    expect(MOBILE).toContain(".fy-header-in { padding-inline-end: 24px; }");
  });
});

describe("A3 · the two pills stack instead of interpenetrating", () => {
  test("the segmented control pins one clear row under the chapter nav", () => {
    // 12 (the nav's own top) + 48 (its height) + 12 (the same gap again) = 72.
    expect(CSS).toMatch(/\.fy-segmented \{[^}]*position: sticky; inset-block-start: 72px; z-index: 15;/);
    expect(CSS).toContain("position: sticky; inset-block-start: 12px;");
    // below the nav, so an overlap resolves the only way it may
    expect(CSS).toContain("z-index: 20; inline-size: fit-content;");
  });

  test("at <=767 it does not pin at all", () => {
    expect(MOBILE).toContain(".fy-segmented { position: static; inset-block-start: auto; }");
  });

  test("every focusable diagram control clears the nav when focus scrolls to it", () => {
    expect(CSS).toContain(
      ".fy-segmented, .fy-seg-option, .fy-refcard, .fy-node, .fy-attack, .fy-attack-trigger {\n  scroll-margin-top: 88px;\n}",
    );
    expect(CSS).toContain("main [id] { scroll-margin-top: 88px; }");
  });
});

describe("A4 + E2 · the pill nav is on all four pages, and every pill resolves", () => {
  test("the repo sheet and the directory carry the nav they were missing", () => {
    // Measured live on 178c8d2: `document.querySelector('nav.fy-chapters')`
    // returned null on both, so a reader who learned the navigation on home
    // lost it on the longest page the site serves.
    expect(DETAIL).toContain('<nav class="fy-chapters');
    expect(DIRECTORY).toContain('<nav class="fy-chapters');
  });

  test("every pill on every page points at an element that page renders", () => {
    for (const [name, html] of PAGES) {
      const nav = html.slice(
        html.indexOf('<nav class="fy-chapters'),
        html.indexOf("</nav>", html.indexOf('<nav class="fy-chapters')),
      );
      const hrefs = attrOfEach(nav, "a[href]", "href");
      expect(hrefs.length, `${name}: pill count`).toBeGreaterThanOrEqual(3);
      for (const href of hrefs) {
        expect(href.startsWith("#"), `${name}: ${href} is not a hash`).toBe(true);
        const id = href.slice(1);
        expect(
          html.includes(`id="${id}"`),
          `${name}: pill ${href} points at nothing on the page`,
        ).toBe(true);
      }
      // exactly one nav per page — the spy binds the first it finds
      expect(countOf(html, '<nav class="fy-chapters'), `${name}: navs`).toBe(1);
    }
  });

  test("the secondary pages' nav is the tight variant, and home's is not", () => {
    expect(DETAIL).toContain('<nav class="fy-chapters fy-chapters-tight"');
    expect(DIRECTORY).toContain('<nav class="fy-chapters fy-chapters-tight"');
    expect(HOME).toContain('<nav class="fy-chapters" aria-label="Sections">');
    expect(METHODOLOGY).toContain('<nav class="fy-chapters" aria-label="Sections">');
    expect(CSS).toContain(".fy-chapters-tight { margin-block-start: 32px; }");
  });

  test("the sheet's six pills name the sheet's own sections", () => {
    const labels = ["The record", "Phases", "What ran", "Defences", "Who ran it", "All checks"];
    for (const label of labels) expect(DETAIL).toContain(`</span>${label}</a>`);
    // and the ids they point at are on real containers, not invented anchors
    for (const id of ["sheet-record", "sheet-phases", "sheet-diagram", "exposure", "sheet-lane", "sheet-controls"]) {
      expect(countOf(DETAIL, `id="${id}"`), `${id}`).toBe(1);
    }
  });

  test("the dead empty-state script placeholder is gone", () => {
    expect(DIRECTORY).not.toContain("DIR_EMPTY_SCRIPT");
    expect(attrOfEach(DIRECTORY, "script[src]", "src").length).toBe(1);
  });
});

describe("A5 · the explorer is the reference's flow diagram", () => {
  test("three mono column headers name the flow, left to right", () => {
    expect(HOME).toContain(`<p class="fy-flow-head" data-flow-head="in">Inputs</p>`);
    expect(HOME).toContain('<p class="fy-flow-head" data-flow-head="checks">Checks</p>');
    expect(HOME).toContain('<p class="fy-flow-head" data-flow-head="out">Record</p>');
    expect(CSS).toMatch(/\.fy-flow-head \{[^}]*font-family: var\(--fy-mono\)/);
  });

  test("the Inputs column is the three evidence sources, typed by class", () => {
    const types = attrOfEach(HOME, ".fy-flowcard", "data-reference-type");
    expect(types).toEqual(["observed", "artifact", "local"]);
    // the words are the registry's own short names, not a second vocabulary
    for (const cls of ["A", "B", "C"] as const) {
      const esc = CLASS_SHORT[cls].replaceAll("'", "&#39;");
      expect(HOME).toContain(`<span class="fy-flowcard-title">${esc}</span>`);
    }
  });

  test("the Record column is one card in the emphasis type, and carries no tint", () => {
    expect(countOf(HOME, 'class="fy-flowcard fy-flowcard-record" data-flow="record"')).toBe(1);
    expect(CSS).toContain(".fy-flowcard-record { --fy-ref-bg: #ffffff; --fy-ref-edge: #262626; }");
    // it is an OUTPUT, not an evidence class: no data-reference-type on it, or
    // the four tints would be encoding two different things.
    const record = HOME.slice(
      HOME.indexOf('class="fy-flowcard fy-flowcard-record"'),
      HOME.indexOf("</div>", HOME.indexOf('class="fy-flowcard fy-flowcard-record"')),
    );
    expect(record).not.toContain("data-reference-type");
    expect(record).toContain(`${PHASES.length} phase bars`);
  });

  test("the stage is dotted-grid with a dotted working viewport inside it", () => {
    expect(CSS).toContain("border: 1px dotted var(--fy-edge-grey); border-radius: 8px;");
    // R1 · the stage was the one off-grammar stroke in the whole figure
    expect(CSS).not.toContain("border: 1px dashed var(--fy-edge-grey); border-radius: 8px;");
    expect(CSS).toContain(
      "background-image: radial-gradient(rgba(0, 0, 0, 0.08) 0.7px, rgba(0, 0, 0, 0) 0.9px);",
    );
    expect(CSS).toContain("border: 1px dotted var(--fy-dash); border-radius: 8px; padding: 20px;");
    // and it is NOT the solid hairline box the cards used to sit in
    expect(CSS).not.toContain("border: 1px solid var(--fy-hair); border-radius: 8px; padding: 20px;");
  });

  test("orthogonal connectors run left to right, with arrowheads", () => {
    // The bracket gathers three inputs into one run; the second wire is a
    // single run into the record. Both keep a 1px stroke under a non-uniform
    // scale, which is the whole reason for vector-effect here.
    expect(HOME).toContain('d="M0 16H22M0 50H22M0 84H22M22 16V84M22 50H52"');
    expect(HOME).toContain('d="M0 50H52"');
    // ROUND 3 · three wire elements now, because the outgoing run moved into the
    // Record card's own grid row (so its 50% means the card's centre) and the
    // 390 connector has to stay between the checks cards and the Record head in
    // reading order. Each width paints exactly one of the two.
    expect(countOf(HOME, 'class="fy-flow-wire" data-flow-wire=')).toBe(2);
    // three elements, and exactly one of them is the untagged inbound bracket
    expect(countOf(HOME, 'class="fy-flow-wire"')).toBe(3);
    expect(countOf(HOME, '<div class="fy-flow-wire" aria-hidden="true">')).toBe(1);
    expect(CSS).toContain("vector-effect: non-scaling-stroke;\n}");
    expect(CSS).toMatch(/\.fy-flow-wire::after \{[^}]*transform: translateY\(-50%\) rotate\(45deg\)/);
  });

  test("the bands are what makes the bracket land on the input cards", () => {
    // A wire stretched to the GRID row would take its 16/50/84 percentages
    // from the tallest column on the page — the 54-card checks column.
    // R1 · and they TOP-anchor, so a head sits on its own content rather than
    // naming a column that starts a third of a screen below it.
    expect(CSS).toMatch(/\.fy-flow-band \{[^}]*align-content: start;/);
    expect(CSS).toMatch(/\.fy-flow-col \{[^}]*align-content: start;/);
    expect(CSS).toMatch(/\.fy-flow-band \{[^}]*grid-template-columns: minmax\(0, 1fr\) 56px;/);
  });

  test("the key is above the panel, as dots plus one dotted-square glyph", () => {
    const legendAt = HOME.indexOf('<p class="fy-legend">');
    const flowAt = HOME.indexOf('<div class="fy-flow">');
    expect(legendAt).toBeGreaterThan(-1);
    expect(legendAt).toBeLessThan(flowAt);
    expect(countOf(HOME, "fy-legend-dot")).toBe(4);
    expect(countOf(HOME, "fy-legend-frame")).toBe(1);
    expect(CSS).toMatch(/\.fy-legend-dot \{[^}]*border-radius: 50%;/);
    expect(CSS).toContain("border: 1px dotted var(--fy-dash);\n}");
    // the four-swatch key is gone
    expect(CSS).not.toContain("fy-legend-swatch");
    expect(HOME).not.toContain("fy-legend-swatch");
  });

  test("the flow stacks at <=767 and the stretched brackets are hidden there", () => {
    expect(MOBILE).toContain(".fy-flow-grid { grid-template-columns: minmax(0, 1fr); grid-template-rows: none; row-gap: 14px; }");
    // R1 · THE REGRESSION. The stacking rules must OUT-RANK the desktop
    // `[data-flow-*]` family (0,2,0) or the three-column track survives the
    // media query and one of its tracks computes to 0px. Written without the
    // attribute they are (0,1,0) and lose, silently, without widening the
    // document — which is why only a computed-style probe at 390 found it.
    expect(MOBILE).toContain(
      ".fy-flow-head[data-flow-head], .fy-flow-band[data-flow-band] {\n    grid-column: 1; grid-row: auto;\n  }",
    );
    // `padding-inline` and not `-end`: the out head carries a start padding at
    // desktop now, and a stacked head centres over nothing.
    expect(MOBILE).toContain(".fy-flow-head[data-flow-head] { text-align: start; padding-inline: 0; }");
    // the unqualified forms are the ones that lost; neither may come back
    expect(MOBILE).not.toMatch(/\.fy-flow-head, \.fy-flow-band \{/);
    expect(MOBILE).not.toMatch(/\n  \.fy-flow-head \{/);
    // the heads are one row at desktop and interleave with their bands when stacked
    expect(MOBILE).toContain('.fy-flow-head[data-flow-head="in"] { order: 1; }');
    expect(MOBILE).toContain('.fy-flow-band[data-flow-band="out"] { order: 6; }');
    expect(MOBILE).toContain(".fy-flow-lines { display: none; }");
    expect(MOBILE).toContain("transform: translateX(-50%) rotate(135deg);");
  });

  test("the cards are still one per control, and still 54", () => {
    const cards = attrOfEach(HOME, ".fy-refcard", "data-reference-type");
    expect(cards.length).toBe(CONTROL_COUNT);
  });
});

describe("A5 · the flow's heads are one row, and the bands align on one centre", () => {
  test("the three heads are the OUTER grid's first row, not band children", () => {
    // Inside a band, a head centres against the tallest column on the stage —
    // which pushed "Inputs" and "Record" hundreds of pixels down the page while
    // "Checks" sat at the top. Measured, and it is what the first cut shipped.
    expect(CSS).toContain(".fy-flow-head[data-flow-head=\"in\"] { grid-column: 1; padding-inline-end: 56px; }");
    expect(CSS).toContain(".fy-flow-band[data-flow-band=\"in\"] { grid-column: 1; }");
    expect(CSS).toMatch(/\.fy-flow-head \{\n  grid-row: 1;/);
    expect(CSS).toMatch(/\.fy-flow-band \{\n  position: relative; grid-row: 2;/);
    // heads precede bands in source order, which is what the mobile `order`
    // rules re-interleave
    expect(HOME.indexOf('data-flow-head="out"')).toBeLessThan(HOME.indexOf('data-flow-band="in"'));
  });

  test("the flow takes the media frame, because 1120 is one card column too narrow", () => {
    const chapter = HOME.slice(HOME.indexOf('id="ch-checks"'), HOME.indexOf('id="ch-yours"'));
    expect(chapter).toContain('<div class="fy-mediaframe">');
    expect(chapter.indexOf('<div class="fy-mediaframe">')).toBeLessThan(
      chapter.indexOf('<div class="fy-explorer">'),
    );
    expect(CSS).toContain("grid-template-columns: minmax(190px, 1fr) minmax(0, 3fr) minmax(190px, 1fr);");
  });
});

describe("A6 · the nested diagram is an irregular composition, three deep", () => {
  test("there is still one region per phase, and the slots come from the counts", () => {
    const slots = attrOfEach(HOME, ".fy-region", "data-slot");
    expect(attrOfEach(HOME, ".fy-region", "data-phase").map(Number)).toEqual([...PHASES]);
    expect(slots.length).toBe(PHASES.length);
    // every slot used exactly once at six phases, and the composition is the
    // reference's: one tall narrow, two wide stacked, two narrow stacked, one
    // full-width strip
    expect([...slots].sort()).toEqual(["full", "narrowA", "narrowB", "narrowC", "wide1", "wide2"]);
    const counts = new Map(
      PHASES.map((p) => [p, Object.values(CONTROL_REGISTRY).filter((m) => m.phase === p).length]),
    );
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    // largest in the wide middle, smallest on the short full-width strip
    expect(slotForPhases(counts).get(ranked[0]![0])).toBe("wide2");
    expect(slotForPhases(counts).get(ranked[1]![0])).toBe("wide1");
    expect(slotForPhases(counts).get(ranked[ranked.length - 1]![0])).toBe("full");
  });

  test("the slot mapping follows the data rather than a literal", () => {
    // A seventh phase, or a phase that grows past its neighbours, must move.
    const grown = new Map([[1, 3], [2, 99], [3, 40], [4, 5], [5, 4], [6, 1]]);
    expect(slotForPhases(grown).get(2)).toBe("wide2");
    expect(slotForPhases(grown).get(3)).toBe("wide1");
    expect(slotForPhases(grown).get(6)).toBe("full");
    // and a seventh lands on its own full-width row rather than on top of the
    // sixth, which is why the slot is a span and not a named area
    const seven = new Map([[1, 9], [2, 8], [3, 7], [4, 6], [5, 5], [6, 4], [7, 3]]);
    expect(slotForPhases(seven).get(7)).toBe("full");
    expect(CSS).toContain('.fy-region[data-slot="full"] { grid-column: 1 / -1; }');
  });

  test("each phase nests its class-C checks three deep, in a dashed counted group", () => {
    expect(countOf(HOME, '<div class="fy-stack">')).toBeGreaterThanOrEqual(1);
    const withLocal = PHASES.filter((p) =>
      Object.entries(CONTROL_REGISTRY).some(([, m]) => m.phase === p && m.cls === "C"),
    );
    expect(withLocal.length).toBeGreaterThan(0);
    expect(countOf(HOME, '<div class="fy-stack">')).toBe(withLocal.length);
    expect(countOf(HOME, '<div class="fy-repeat" data-group="local">')).toBe(withLocal.length);
    // the dashed group carries the counter
    expect(HOME).toMatch(
      /Maintainer&rsquo;s machine only<\/span>\s*<span class="fy-repeat-count" aria-hidden="true">(1|1&hellip;\d+)<\/span>/,
    );
    // the offset stacked-card edge, and it cannot reach the document edge
    expect(CSS).toContain("inset-block: 6px -6px; inset-inline: 6px -6px;");
  });

  test("the P-badges are gone from the region corners", () => {
    expect(HOME).not.toMatch(/<span class="fy-repeat-count">P\d<\/span>/);
    const heads = HOME.match(/<div class="fy-region-head">[\s\S]*?<\/div>/g) ?? [];
    expect(heads.length).toBe(PHASES.length);
    for (const h of heads) expect(h).not.toMatch(/>P\d</);
  });

  test("the regions are neutral — the four tints stay on the evidence class", () => {
    expect(HOME).not.toContain("data-tint=");
    expect(CSS).not.toContain('.fy-region[data-tint="green"]');
    expect(CSS).toContain(
      ".fy-region {\n  border-radius: 8px; border: 1px solid var(--fy-edge-grey);\n  background: var(--fy-tint-grey); padding: 16px;\n}",
    );
    // and the one tint inside a region is the class-C group's violet
    expect(CSS).toContain(
      '.fy-repeat[data-group="local"] {\n  border-color: var(--fy-edge-violet); background: var(--fy-tint-violet);\n}',
    );
  });

  test("every chip icon is 20x20 and carries its evidence class", () => {
    const sizes = attrOfEach(HOME, ".fy-node-icon", "width");
    expect(sizes.length).toBe(CONTROL_COUNT);
    expect([...new Set(sizes)]).toEqual(["20"]);
    const classes = attrOfEach(HOME, ".fy-node-icon", "data-cls");
    expect([...new Set(classes)].sort()).toEqual(["A", "Aprime", "B", "C", "M"]);
    // five classes, five DISTINCT glyphs — not one path drawn five times
    const glyphs = new Set(
      [...HOME.matchAll(/<svg class="fy-node-icon" data-cls="(\w+)"[\s\S]*?>([\s\S]*?)<\/svg>/g)]
        .map((m) => m[2]!.trim()),
    );
    expect(glyphs.size).toBe(5);
    expect(CSS).toContain('.fy-node-icon[data-cls="C"] { color: #8b62e0; }');
  });

  test("the region note says checks BELONG to a phase, and splits on the sheet", () => {
    // "N checks run here" over a column of NO ANSWER chips reads as a
    // contradiction; and the scanner does not walk a phase, so nothing runs
    // "here" in the first place.
    expect(HOME).not.toContain("run here");
    expect(HOME).toContain("checks belong to this phase.");
    expect(DETAIL).toContain("checks belong to this phase</span>");
    // R2 · and the split is a PARTITION now: every chip in the region is in
    // exactly one part, so the parts sum to the chip count. The old split
    // counted answered and no-answer only, and left four of thirteen unsaid.
    const notes = [...DETAIL.matchAll(/<p class="fy-region-note">([\s\S]*?)<\/p>/g)].map((m) => m[1]!);
    expect(notes.length).toBe(PHASES.length);
    for (const n of notes) {
      const spans = [...n.matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1]!);
      const total = Number(/^(\d+) check/.exec(spans[0]!)![1]);
      const parts = spans.slice(1).map((t) => Number(/^(\d+) /.exec(t)![1]));
      expect(parts.reduce((a, b) => a + b, 0), `region note "${n}" must partition its chips`).toBe(
        total,
      );
    }
    // the states the partition is written in, all four of them
    expect(DETAIL).toMatch(/<span>\d+ answered<\/span>/);
    expect(DETAIL).toContain("not in this record");
  });
});

describe("A7 + D8 · the lanes diagram says what differs, and emphasises the right lane", () => {
  const fig = HOME.slice(
    HOME.indexOf('<figure class="fy-overview"'),
    HOME.indexOf("</figure>", HOME.indexOf('<figure class="fy-overview"')),
  );

  test("what every lane can read is stated ONCE, above the lanes", () => {
    expect(countOf(fig, 'data-ov="shared"')).toBe(1);
    expect(countOf(fig, 'data-ov="lane"')).toBe(3);
    expect(fig.indexOf('data-ov="shared"')).toBeLessThan(fig.indexOf('data-ov="lane"'));
    // the three shared groups appear exactly once each — they used to appear
    // three times each, word for word, which read as a rendering fault
    for (const title of ["Committed files", "Committed build files", "Live settings"]) {
      expect(countOf(fig, `<h4>${title}</h4>`), title).toBe(1);
    }
  });

  test("each lane shows only its delta", () => {
    expect(fig).toContain('data-ov-panel="none"');
    expect(fig).toContain("<h4>A signature</h4>");
    expect(fig).toContain('data-ov-panel="local"');
    // exactly one panel per lane row
    expect(countOf(fig, "fy-ov-panel")).toBe(6);
  });

  test("the SIGNED CI lane carries the emphasis and the marker, not the local lane", () => {
    const action = fig.slice(fig.indexOf('data-lane="action"'), fig.indexOf('data-lane="local"'));
    expect(action).toContain('data-emphasis="true"');
    expect(action).toContain('<span class="fy-ov-marker">signed</span>');
    const local = fig.slice(fig.indexOf('data-lane="local"'));
    expect(local).not.toContain('data-emphasis="true"');
    expect(countOf(fig, 'data-emphasis="true"')).toBe(1);
    expect(CSS).toContain('.fy-ov-group[data-emphasis="true"] { border-color: var(--fy-accent); }');
    // and the local lane's extra card takes the dashed weaker treatment
    expect(CSS).toContain(
      '.fy-ov-panel[data-ov-panel="local"] {\n  background: var(--fy-ground); border: 1px dashed var(--fy-na); grid-column: 1 / -1;\n}',
    );
  });

  test("the closing line weights the lanes, and the arithmetic closes", () => {
    expect(fig).toContain("Two of the three can be checked by anyone.");
    expect(fig).toContain("can only be\n  asserted by the maintainer, and is weighted accordingly.");
    expect(fig).not.toContain("The third reads\n  something nobody else can");
    // 26 + 6 + 4 + 16 = 52, with the two class-M controls named as the gap
    const meta = Object.values(CONTROL_REGISTRY).filter((m) => m.cls === "M").length;
    const scored = CONTROL_COUNT - meta;
    expect(fig).toContain(`+ ${meta} about the tool &mdash; never counted.`);
    expect(fig).toContain(`${scored} of ${CONTROL_COUNT} are scored.`);
    // derived, not typed: the panel counts must add to the footnote
    const counts = [...fig.matchAll(/<span class="fy-ov-count">(\d+)<\/span>/g)].map((m) =>
      Number(m[1]),
    );
    expect(counts.length).toBe(4);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(scored);
  });

  test("the panels are terse lists, and the L-brackets are there at desktop only", () => {
    // T4 · every separator on these lists is now a ::before on the item after
    // it, so the list is spans rather than one text run.
    expect(fig).toContain("<span>branch rules</span> <span>repository settings</span>");
    expect(fig).toContain("<span>read live</span>");
    expect(CSS).toMatch(/\.fy-ov-label::before \{[^}]*inset-inline-start: calc\(100% \+ 20px\)/);
    expect(CSS).toMatch(/\.fy-ov-label::after \{[^}]*inline-size: 20px; block-size: 1px/);
    expect(MOBILE).toContain(".fy-ov-label::before, .fy-ov-label::after { content: none; }");
  });
});

describe("A8 + D5 + round 3 · the figure is a directed pipeline, and it stops asserting a walk", () => {
  const beat = HOME.slice(HOME.indexOf('id="chaining"'), HOME.indexOf('id="lanes"'));
  const route = pipelineRoute(PHASES.length);

  test("the trace is DIRECTED — it never doubles back into a system it has left", () => {
    // The whole reason the carved maze went: a perfect maze's route is free to
    // re-enter any column, which is a puzzle's property and not a pipeline's.
    for (let i = 1; i < route.points.length; i += 1) {
      expect(route.points[i]![0], `step ${i}`).toBeGreaterThanOrEqual(route.points[i - 1]![0]);
    }
    // strictly forward at the checkpoints, one per column, left to right
    for (let k = 1; k < route.columns.length; k += 1) {
      expect(route.columns[k]!, `checkpoint ${k}`).toBeGreaterThan(route.columns[k - 1]!);
    }
    // and it still turns corners: a straight rule would not read as a board
    const d = beat.match(/<path class="fy-trace" d="([^"]+)"/)![1]!;
    const segs = d.split(/(?=[ML])/).filter((s: string) => s.trim().length > 0);
    expect(segs.length).toBeGreaterThanOrEqual(10);
    let verticalRuns = 0;
    for (let i = 1; i < route.points.length; i += 1) {
      if (route.points[i]![1] !== route.points[i - 1]![1]) verticalRuns += 1;
    }
    expect(verticalRuns).toBeGreaterThanOrEqual(PHASES.length - 1);
  });

  test("the four zones are the phases regrouped, never a new taxonomy", () => {
    // PHASES and PHASE_NAMES are untouched; STAGE_ZONES only says which system
    // each existing phase belongs to, and the zone WIDTHS are the phase counts.
    const named = STAGE_ZONES.flatMap((z) => z.phases);
    expect(new Set(named).size).toBe(named.length);
    for (const p of named) expect(PHASES as readonly number[]).toContain(p);
    expect(named.length).toBe(PHASES.length);
    expect(STAGE_ZONES.map((z) => z.label)).toEqual([
      "Repository",
      "Build",
      "Production",
      "Registry",
    ]);
    // Build holds three of the six phases, so it is three times either neighbour
    const build = route.zones[1]!;
    const repo = route.zones[0]!;
    expect(build.to - build.from).toBe(3 * (repo.to - repo.from));
    expect(route.zones.map((z) => z.holds)).toEqual([1, 3, 1, 1]);
    // every checkpoint sits inside the zone it belongs to
    let k = 0;
    for (const z of route.zones) {
      for (let j = 0; j < z.holds; j += 1, k += 1) {
        expect(route.columns[k]!, `${z.label} #${j}`).toBeGreaterThanOrEqual(z.from);
        expect(route.columns[k]!).toBeLessThan(z.to);
      }
    }
    // …and each zone is named on the figure, over its own span
    expect(countOf(beat, 'class="fy-zone-label"')).toBe(STAGE_ZONES.length);
    for (const z of STAGE_ZONES) expect(beat).toContain(`>${z.label}</span>`);
  });

  test("the board is a frame with a divider between each pair of systems", () => {
    const { cols, rows } = PIPELINE_GRID;
    expect(route.walls.startsWith(`M26 26H506V346H26Z`)).toBe(true);
    // one full-height divider per interior zone boundary
    const dividers = route.walls.match(/M\d+ 26V346/g) ?? [];
    expect(dividers.length).toBe(STAGE_ZONES.length - 1);
    // and nothing left of the carved labyrinth: a perfect maze over this
    // lattice draws 77 interior walls, and every one of them is gone
    const interior = (cols - 1) * rows + cols * (rows - 1) - (cols * rows - 1);
    expect(interior).toBe(77);
    const subpaths = route.walls.split(/(?=M)/).filter((s: string) => s.trim().length > 0);
    expect(subpaths.length).toBeLessThan(interior);
  });

  test("the checkpoints are spread along the road, not stacked on two edges", () => {
    const at = attrOfEach(beat, "[data-node-at]", "data-node-at").map(Number);
    expect(at.length).toBe(PHASES.length);
    expect(at[0]).toBe(0);
    expect(at[at.length - 1]).toBe(1);
    for (let i = 1; i < at.length; i += 1) {
      expect(at[i]! - at[i - 1]!, `gap ${i}`).toBeGreaterThanOrEqual(0.1);
    }
    const xy = route.stops.map((i: number) => route.points[i]!.join(","));
    expect(new Set(xy).size).toBe(PHASES.length);
  });

  test("the same build draws the same board — the jogs are seeded, never random", () => {
    expect(pipelineRoute(PHASES.length).walls).toBe(route.walls);
    expect(pipelineRoute(PHASES.length).points).toEqual(route.points);
    expect(factory.renderHome(RECORDS, ctxFor("factory"))).toBe(HOME);
  });

  test("nothing near this figure says the scanner walks anything", () => {
    for (const banned of ["walks", "passes", "in order", "none is skipped", "None is skipped"]) {
      expect(beat.toLowerCase(), banned).not.toContain(banned.toLowerCase());
    }
    expect(beat).toContain("One record covers the whole lifecycle.");
    expect(beat).toContain("T1&ndash;T7");
    expect(beat).toContain("including the ones it could not answer");
    // the figure's own accessible name, which is the other place the claim lived
    expect(beat).toContain("The road code travels");
    // and the metric caption that said "phases a scan walks, in order"
    expect(HOME).toContain(`phases the ${CONTROL_COUNT} checks are grouped into`);
    expect(HOME).not.toContain("phases a scan walks");
  });
});

describe("A9 · the pill nav has a navigating guard, short labels, and a dark state", () => {
  test("a pill click marks its own target and shuts the spy up until the scroll settles", () => {
    // The root scrolls smoothly, so a click on 04 sends the page THROUGH 02 and
    // 03 and the spy lit each on the way — a 250ms cross-fade fired three
    // times. Both halves are asserted: the flag is set, and the spy reads it.
    expect(MOTION_SCRIPT).toContain('nav.setAttribute("data-navigating", "true")');
    expect(MOTION_SCRIPT).toContain("if (navigating) return;");
    expect(MOTION_SCRIPT).toContain('"onscrollend" in window');
    expect(MOTION_SCRIPT).toContain("setTimeout(settle, 700)");
    // and the guard is released, or the nav would stop tracking after one click
    expect(MOTION_SCRIPT).toContain('nav.setAttribute("data-navigating", "false")');
  });

  test("the nav inverts over a dark section, written by the spy", () => {
    expect(MOTION_SCRIPT).toContain('closest(".fy-dark")');
    expect(MOTION_SCRIPT).toContain('nav.setAttribute("data-on-dark", dark ? "true" : "false")');
    expect(CSS).toContain(
      '.fy-chapters[data-on-dark="true"] { background: #000000; border-color: #333333; }',
    );
    expect(CSS).toContain('.fy-chapters[data-on-dark="true"] a { color: var(--fy-dark-ink); }');
    expect(CSS).toContain('.fy-chapters[data-on-dark="true"] a:hover { background: #1a1a1a; color: #ffffff; }');
    // and there IS a dark section for it to fire on
    expect(METHODOLOGY).toMatch(/<div class="fy-dark">[\s\S]*id="threats"/);
  });

  test("the methodology's eight labels fit a pill", () => {
    const nav = METHODOLOGY.slice(
      METHODOLOGY.indexOf('<nav class="fy-chapters'),
      METHODOLOGY.indexOf("</nav>", METHODOLOGY.indexOf('<nav class="fy-chapters')),
    );
    const labels = [...nav.matchAll(/<\/span>([^<]+)<\/a>/g)].map((m) => m[1]!);
    expect(labels.length).toBe(8);
    for (const l of labels) expect(l.length, l).toBeLessThanOrEqual(12);
    expect(labels).toEqual([
      "Protocol", "Threats", "Scorecard", "Evidence",
      "Formula", "Grades", "Local", "Changelog",
    ]);
    // the long forms that measured 1230px are gone
    expect(nav).not.toContain("What checks are for");
    expect(nav).not.toContain("Next to Scorecard");
  });
});

describe("A10 + E1 + D9 · the loop's geometry, chrome and centre", () => {
  test("the connectors are ARCS, and the packet rides the connector's own path", () => {
    // A straight chord between two discs on a circle is a different diagram.
    // The box is rotated to the chord's angle and local −y is then the outward
    // normal, so ONE quadratic bows outward on all five edges.
    expect(LOOP_EDGE_PATH).toBe("M 8 60 Q 60 40 112 60");
    expect(countOf(HOME, `<path class="fy-edge-base" d="${LOOP_EDGE_PATH}"></path>`)).toBe(5);
    expect(countOf(HOME, `<path class="fy-edge-highlight" d="${LOOP_EDGE_PATH}"></path>`)).toBe(5);
    expect(HOME).not.toContain('d="M 8 60 H 112"');
    // the active edge differs from a resting one in colour and opacity ONLY
    expect(CSS).toContain(`offset-path: path("${LOOP_EDGE_PATH}")`);
    expect(CSS).not.toContain('offset-path: path("M 8 60 H 112")');
  });

  test("the centre is a bounded circle with a circular halo", () => {
    expect(CSS).toContain("border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.12); background: var(--fy-ground);");
    expect(CSS).toMatch(/\.fy-context-pulse \{[^}]*border-radius: 50%/);
    expect(CSS).toMatch(/\.fy-context-pulse \{[^}]*transparent 72%\)/);
  });

  test("the card padding is a length, because a percentage is not the card's", () => {
    // Percentage padding resolves against the CONTAINING BLOCK: 7% on a 193px
    // card inside an 840px process box computed to 58.6px a side, leaving 75px
    // of text width inside a 193px circle and wrapping one caption onto FOUR
    // lines. Measured before and after; a probe pins the ≤ 2-line result.
    expect(CSS).toContain("text-align: center; padding: 26px;");
    expect(CSS).not.toContain("text-align: center; padding: 7%;");
    expect(CSS).toContain("text-align: center; gap: 4px; padding: 22px;");
  });

  test("the brief's measured values are the ones that ship", () => {
    expect(CSS).toContain("margin-block: -64px -112px");
    expect(CSS).not.toContain("margin-block: -56px -104px");
    expect(CSS).toMatch(/\.fy-edge-base \{[^}]*opacity: 0\.75;/);
    // the ring carries no opacity of its own — the brief has none
    expect(CSS).toContain("stroke-dasharray: 0, 1; vector-effect: non-scaling-stroke;\n}");
    expect(CSS).not.toMatch(/\.fy-card-ring circle \{[^}]*opacity:/);
  });

  test("the centre names the record, and never a signature it may not have", () => {
    // "the signed record" is a universal two of the four trust kinds do not
    // have: an external scan is unsigned, and so is a CI run without id-token.
    for (const [name, html] of PAGES) expect(html, name).not.toContain("the signed record");
    expect(HOME).toContain('<span class="fy-context-title">the record</span>');
    expect(HOME).toContain("<span>scan-record.json</span> <span>signed when the lane can sign it</span>");
    expect(HOME).toContain("Five steps, and one record in the middle of them &mdash; signed");
  });

  test("the caption names something visible, and it is INSIDE the stage", () => {
    // "Shared context" named nothing a reader could point at, and it sat 25px
    // below the stage border attached to nothing. It is the centre's third line.
    expect(HOME).not.toContain("Shared context");
    expect(HOME).not.toContain("fy-loop-caption");
    expect(HOME).toContain('<span class="fy-context-note">One record. Every stage adds to it.</span>');
    const store = HOME.slice(
      HOME.indexOf('<div class="fy-context-store">'),
      HOME.indexOf("</div>", HOME.indexOf('<div class="fy-context-store">')),
    );
    expect(store).toContain("fy-context-note");
  });

  test("E1 · the compact rail undoes the desktop geometry, explicitly", () => {
    // The rail inherited inline-size 118%, margin-inline −9% and margin-block
    // −56/−104: measured at 390, the store title rendered 6 of its 28 pixels
    // with ZERO dark pixels in the glyph box, card 05 lost 63px and every card
    // lost 10.7px of its right edge.
    expect(MOBILE).toContain("inline-size: 100%; margin-inline: 0; margin-block: 0;");
    expect(MOBILE).toContain(".fy-context-pattern, .fy-context-pulse { display: none; }");
    expect(MOBILE).not.toContain("overflow: clip");
  });

  test("the five captions are the short register a 193px circle can hold", () => {
    const bodies = [...HOME.matchAll(/<span class="fy-card-body">([^<]*)<\/span>/g)].map((m) => m[1]!);
    expect(bodies.length).toBe(5);
    for (const b of bodies) expect(b.split(" ").length, b).toBeLessThanOrEqual(5);
    expect(bodies[0]).toBe("Clone, never run");
    expect(HOME).not.toContain("Clone, never execute");
  });
});

describe("A12 + A13 + E4 · the directory's controls, cards and standalone links", () => {
  test("the sort control keeps its id and its element, and wears the design", () => {
    // filter.js binds #dir-sort by id. A design may restyle a control; it may
    // never replace one.
    expect(DIRECTORY).toContain('<select id="dir-sort">');
    expect(countOf(DIRECTORY, '<select id="dir-sort">')).toBe(1);
    expect(CSS).toMatch(/\.fy-sortbar select \{[^}]*appearance: none; -webkit-appearance: none;/);
    expect(CSS).toMatch(/\.fy-sortbar select \{[^}]*min-block-size: 44px[^}]*border-radius: 999px/);
    expect(CSS).toContain(".fy-sortbar select:focus-visible { outline: 2px solid var(--fy-ring)");
    // the chevron is a background image, not generated content — a DOM-render
    // capture drops ::before/::after content, and a control whose only
    // affordance vanishes from every screenshot cannot be reviewed
    expect(CSS).toMatch(/\.fy-sortbar select \{[^}]*background-image: url\("data:image\/svg\+xml/);
    expect(CSS).not.toMatch(/\.fy-sortbar select::(before|after)/);
  });

  test("the coverage checkbox is a bordered square with room to its label", () => {
    expect(DIRECTORY).toContain('<input type="checkbox" id="dir-incomplete">');
    expect(CSS).toMatch(
      /\.fy-sortbar \.dir-check input\[type="checkbox"\] \{[^}]*inline-size: 20px; block-size: 20px/,
    );
    expect(CSS).toContain(".fy-sortbar .dir-check { gap: 10px; }");
    expect(CSS).toMatch(/input\[type="checkbox"\]:checked \{[^}]*background-image: url\("data:image\/svg\+xml/);
  });

  test("the listing count has its own cell at the end of the bar", () => {
    expect(CSS).toMatch(/\.fy-count \{[^}]*margin-inline-start: auto; text-align: end;/);
  });

  test("the repository name is a link that looks like one, with an affordance", () => {
    const rows = [...DIRECTORY.matchAll(/<td data-label="Repository">([\s\S]*?)<\/td>/g)];
    expect(rows.length).toBe(RECORDS.length);
    for (const [, cell] of rows) {
      expect(cell).toMatch(/<a class="fy-repo-link" href="[^"]+">[^<]+<\/a>/);
      expect(cell).toContain('class="fy-record-link"');
      expect(cell).toContain("View record&nbsp;&rarr;");
    }
    // blue and underlined, like every other link on the site
    expect(CSS).toMatch(/\.fy-repo-link \{[^}]*color: var\(--fy-link\);\s*\n?\s*text-decoration: underline/);
    expect(CSS).not.toMatch(/\.fy-repo-link \{[^}]*color: var\(--fy-ink\)/);
    expect(CSS).toMatch(/\.fy-record-link \{[^}]*min-block-size: 44px/);
  });

  test("the card's phase bars take the sheet's geometry", () => {
    expect(CSS).toContain(".fy-phasebar { display: grid; gap: 4px; inline-size: 100%; min-inline-size: 190px; }");
    expect(CSS).toContain("grid-template-columns: 30px minmax(60px, 1fr) 52px");
    expect(CSS).toMatch(/\.fy-phase-pct \{[^}]*text-align: end/);
  });

  test("the merge pill labels the first line, not the middle of its paragraph", () => {
    // Measured at 390: the pill's centre sat 27px below the top of the
    // three-line text it marks. The shared 44px summary rule centres it, and
    // that rule is declared later — so this wins on specificity, not order.
    expect(CSS).toContain(".fy-table .fy-merge summary { align-items: flex-start; gap: 8px; }");
    expect(CSS.indexOf(".fy-table .fy-merge summary")).toBeGreaterThan(
      CSS.indexOf(".fy-merge summary { cursor: pointer"),
    );
  });

  test("E4 · standalone links reach the floor; inline ones keep their exception", () => {
    expect(CSS).toContain(".fy-arrow-link, .fy-tip-links a {\n  display: inline-flex; align-items: center; min-block-size: 44px;\n}");
    // T4 · the metadata line's links get their 44px from an ABSOLUTE pseudo,
    // not from inline-flex: E4 inflated a shared line box and dropped the
    // links ~12px off the baseline of the text they sit inline with.
    expect(CSS).toContain(".fy-rm a { position: relative; }");
    expect(CSS).toMatch(/\.fy-rm a::after \{[^}]*position: absolute;[^}]*block-size: 44px;/);
    expect(CSS).not.toMatch(/\.fy-rm a \{[^}]*min-block-size: 44px/);
    expect(countOf(HOME, 'class="fy-arrow-link"')).toBe(3);
    // the links inside running prose are deliberately NOT tagged — the WCAG
    // 2.5.8 inline exception covers them and inflating them breaks the line
    const loopLead = HOME.slice(HOME.indexOf("Nobody has to wait for us"), HOME.indexOf("Nobody has to wait for us") + 300);
    expect(loopLead).not.toContain("fy-arrow-link");
  });
});

describe("D1 · the aperture's honesty half is true, and the caveat is above the fold", () => {
  test("the response names who is left, instead of denying the site's own third lane", () => {
    // "— and what nobody could check." is FALSE, and this site is the thing
    // that disproves it: a class-C check is answerable by exactly one party,
    // and the local lane exists so that party can answer it.
    expect(countOf(HOME, "&mdash; and what only its maintainer could.")).toBe(2);
    expect(HOME).not.toContain("nobody could check");
    // R5 · AND ITS SIBLING, WHICH SURVIVED. `glossary.ts` defines `unverified`
    // as "nobody could answer this check" — the identical construction, wrong
    // for the identical reason: on a sheet with eight local-lane answers, eight
    // of them WERE answered, with the signature verified two sections below.
    // The shared entry still feeds the other five designs; Factory renders its
    // own wording instead of the glossary's, on all four pages.
    for (const [name, html] of PAGES) {
      expect(html, `${name}: nobody could answer`).not.toContain("nobody could answer");
      expect(html, `${name}: nobody could check`).not.toContain("nobody could check");
    }
    expect(DETAIL).toContain("no lane available here could answer it, which is not the same as");
    // the supporting line is unchanged, and it is the one that carries the rule
    expect(HOME).toContain("An unperformed check is never a verdict. It is shown,");
    // both halves of the aperture say the same thing, or the seam lies mid-close
    const left = HOME.slice(HOME.indexOf('class="fy-response-left"'), HOME.indexOf('class="fy-response-right"'));
    const right = HOME.slice(HOME.indexOf('class="fy-response-right"'));
    expect(left).toContain("&mdash; and what only its maintainer could.");
    expect(right).toContain("&mdash; and what only its maintainer could.");
  });

  test("the opening panel carries the caveat, so a reader who never scrolls meets it", () => {
    const opening = HOME.slice(
      HOME.indexOf('<div class="fy-opening">'),
      HOME.indexOf('<div class="fy-response">'),
    );
    expect(opening).toContain("what it could prove, and what it could not");
    expect(opening).not.toContain(
      "<p class=\"fy-context\">Every listing here is a public record of one scan of one commit.</p>",
    );
  });
});

describe("D2 + A14 · the pass bar's width equals its own number", () => {
  const rec = RECORDS[0]!;

  test("the green segment is the phase's own percent, on a track of the answered set", () => {
    const rows = [...DETAIL.matchAll(/<span class="fy-phaserow"[\s\S]*?<\/span>\n    <\/span>/g)];
    expect(rows.length).toBe(rec.score.phases.length);
    rec.score.phases.forEach((p, i) => {
      const row = rows[i]![0];
      const answered = p.pass + p.fail + p.gap;
      const want = ((100 * p.pass) / answered).toFixed(1);
      expect(row, `P${p.phase} pass width`).toContain(`class="fy-seg-pass" style="width:${want}%"`);
      // and that IS the number printed at the end of the row
      expect(Number(want)).toBeCloseTo(p.percent ?? 0, 1);
    });
  });

  test("nothing that was never answered is drawn inside the track", () => {
    for (const [name, html] of PAGES) {
      expect(html, `${name}: unanswered segment`).not.toContain("fy-seg-unv");
    }
    expect(CSS).not.toContain(".fy-seg-unv {");
    // R3 · and nothing is hatched at all now. The swatch was the last rule that
    // applied `--fy-hatch`, which made it a legend for itself: a reader who
    // learned "hatched = no answer" scanned six full-green bars for hatching and
    // concluded nothing was unanswered.
    expect(CSS).not.toContain(".fy-swatch-unv");
    expect(CSS).toContain("--fy-hatch: none;");
    expect(CSS).not.toContain("repeating-linear-gradient(135deg,\n    rgba(0, 0, 0");
    for (const [name, html] of PAGES) {
      expect(html, `${name}: hatched swatch`).not.toContain("fy-swatch-unv");
    }
  });

  test("the aria-label's own words are printed on the visible layer", () => {
    // They were written, and written well, in an attribute no sighted desktop
    // reader and no touch reader will ever meet.
    const notes = [...DETAIL.matchAll(/<span class="fy-phase-note" aria-hidden="true">([^<]*)<\/span>/g)]
      .map((m) => m[1]!);
    expect(notes.length).toBe(rec.score.phases.length);
    for (const n of notes) expect(n).toMatch(/of \d+ answered/);
    const withOpen = rec.score.phases.filter((p) => p.unverified > 0);
    expect(withOpen.length).toBeGreaterThan(0);
    expect(notes.filter((n) => n.includes("no answer (not counted)")).length).toBe(withOpen.length);
    // the row's accessible name says the same thing, rather than more than it
    expect(DETAIL).toMatch(/aria-label="[^"]*of \d+ answered[^"]*no answer \(not counted\)"/);
  });

  test("one legend sits above the stack on the sheet, and not three on the directory", () => {
    expect(countOf(DETAIL, 'class="fy-phase-key"')).toBe(1);
    expect(DETAIL.indexOf('class="fy-phase-key"')).toBeLessThan(DETAIL.indexOf('class="fy-phaserow"'));
    expect(DETAIL).toContain("no answer is never in the track, and never counted");
    expect(countOf(DIRECTORY, 'class="fy-phase-key"')).toBe(0);
  });
});

/* ══ the honesty fixtures ════════════════════════════════════════════════ */

/**
 * A listing whose class-C verdict came from a maintainer's signed local record,
 * whose local record describes a DIFFERENT commit than the scan, and whose
 * grade is NOT provisional.
 *
 * The default fixture carries none of those, so every local-lane and
 * contradiction claim below would pass vacuously against it — the two facts
 * this design is most obliged to surface are exactly the two it has never had.
 * `commit-signing` passes here, because only a COUNTABLE verdict can have come
 * from a lane at all.
 */
const HONEST_RECORD = {
  ...rec("sscsb-action", {
    provisional: false,
    evidence_coverage_percent: 96,
    phases: [1, 2, 3, 4, 5].map((phase) => ({
      phase, pass: 2, fail: 0, gap: 0, unverified: phase === 1 ? 1 : 0, info: 0, percent: 100,
    })),
  }),
  controls: [
    {
      id: "commit-signing", phase: 1, in_scope: true, raw_outcome: "pass",
      scan_outcome: "pass" as const, reclassified: false, reason: null, messages: [],
    },
    {
      id: "codeql", phase: 4, in_scope: true, raw_outcome: "pass",
      scan_outcome: "pass" as const, reclassified: false, reason: null, messages: [],
    },
  ],
};
const LOCAL_TRUST = {
  schema_version: 1,
  lane: "local" as const,
  signature: "verified" as const,
  identity: null,
  commit: "3cb129084db2".padEnd(40, "0"),
  verified_at: "2026-09-04T00:00:00.000Z",
  bundle: null,
  signer: "10093271+p4gs@users.noreply.github.com",
  key_fingerprint: "SHA256:aaaa",
  signature_file: "scan-record.local.json.sig",
  resolved: ["commit-signing"],
};
const HONEST_FACTS = {
  resolvedByLocal: ["commit-signing"],
  contradictions: [],
  awaitingIndependent: [],
  localOnly: false,
  staleAgainstBase: { local: "3cb129084db2ffff", base: "c8a23493ec0caaaa" },
  selfReported: { grade: "A+", overall_percent: 100, evidence_coverage_percent: 96 },
};
const HONEST_CTX = {
  ...ctxFor("factory", "directory", "directory/p4gs--sscsb-action/"),
  localTrust: new Map([["p4gs--sscsb-action", LOCAL_TRUST]]),
  facts: new Map([["p4gs--sscsb-action", HONEST_FACTS]]),
};
const HONEST_DETAIL = factory.renderRepoDetail(HONEST_RECORD as never, HONEST_CTX as never);

describe("D3 · a local-lane verdict reads weaker at the row, not only in the header", () => {
  test("the fixture actually carries the facts, or every claim below is vacuous", () => {
    expect(LOCAL_TRUST.resolved.length).toBeGreaterThan(0);
    expect(DETAIL).not.toContain('data-lane="local"');
  });

  test("every chip the local lane resolved is dashed and says local", () => {
    const chip = HONEST_DETAIL.slice(
      HONEST_DETAIL.indexOf('aria-controls="fy-tip-sheet-commit-signing"') - 400,
      HONEST_DETAIL.indexOf('aria-controls="fy-tip-sheet-commit-signing"') + 1200,
    );
    expect(chip).toContain('data-lane="local"');
    expect(chip).toContain('<span class="fy-node-lane">local</span>');
    expect(CSS).toContain('.fy-node[data-lane="local"] { border-style: dashed; }');
    // and a chip the local lane did NOT resolve carries neither
    expect(countOf(HONEST_DETAIL, 'class="fy-node-lane"')).toBe(LOCAL_TRUST.resolved.length);
  });

  test("every evidence-table row it resolved carries the same mark", () => {
    expect(HONEST_DETAIL).toContain('<tr class="" data-lane="local">');
    expect(HONEST_DETAIL).toContain(
      '<a class="fy-row-lane fy-hit-pill" href="#sheet-lane">local</a>',
    );
    expect(CSS).toContain('.fy-table tr[data-lane="local"] td[data-label="Verdict"] .fy-outcome { border-style: dashed; }');
  });

  test("+local N is countable words, and a link to the rows it names", () => {
    // "+local 6" was six WHAT, resolved by whom, and which six — with the
    // sentence that answered it in a `title`.
    expect(HONEST_DETAIL).toContain(
      `<a class="fy-lane fy-lane-overlay fy-hit-pill" href="#sheet-lane">+${LOCAL_TRUST.resolved.length} from a local signed record</a>`,
    );
    expect(HONEST_DETAIL).not.toContain(">+local ");
  });
});

describe("D4 · the contradiction is in the hero, before any figure", () => {
  test("the badge anchors to #merge and comes before the two numbers", () => {
    const badge = HONEST_DETAIL.indexOf('class="fy-badge-conflict"');
    const figs = HONEST_DETAIL.indexOf('class="fy-figs"');
    expect(badge).toBeGreaterThan(-1);
    expect(badge).toBeLessThan(figs);
    expect(HONEST_DETAIL.slice(badge, figs)).toContain('href="#merge"');
  });

  test("the wording is words, never MERGE and never the not-equals sign", () => {
    expect(HONEST_DETAIL).toContain("DIFFERENT COMMIT — the maintainer&#39;s");
    expect(HONEST_DETAIL).toContain("this listing scans");
    expect(HONEST_DETAIL).toContain("Both score A+.");
    for (const [name, html] of [["detail", HONEST_DETAIL], ["directory", DIRECTORY]] as const) {
      expect(html, `${name}: not-equals`).not.toContain("≠");
      expect(html, `${name}: MERGE`).not.toContain(">Merge<");
    }
  });

  test("R4 · the contradiction family is never painted in the fail red", () => {
    // The ISA's own anti-claim: red is `did not pass` and nothing else. Both
    // listings that render this box have zero fails and grade A+.
    for (const sel of [".fy-badge-conflict {", ".fy-panel-conflict {", ".fy-conflict {"]) {
      const rule = blockAfter(CSS, sel.slice(0, -2));
      expect(rule, `${sel} must not borrow the fail red`).not.toContain("--fy-fail");
    }
    expect(CSS).toContain(".fy-panel-conflict { border-color: var(--fy-ink); }");
  });

  test("R4 · both badges render when both facts are true", () => {
    // It returned on staleAgainstBase BEFORE it tested contradictions, so a
    // listing carrying both showed the commit mismatch and swallowed the
    // contradiction — which types.ts requires on the sheet, and which is the
    // more serious of the two. Only a fixture carrying BOTH can see it.
    const both = {
      ...HONEST_CTX,
      facts: new Map([
        ["p4gs--sscsb-action", { ...HONEST_FACTS, contradictions: ["codeql"] }],
      ]),
    };
    const page = factory.renderRepoDetail(HONEST_RECORD as never, both as never);
    expect(countOf(page, 'class="fy-badge-conflict"')).toBe(2);
    expect(page).toContain("DIFFERENT COMMIT");
    expect(page).toContain("SOURCES DISAGREE");
    // and one badge alone still renders alone
    expect(countOf(HONEST_DETAIL, 'class="fy-badge-conflict"')).toBe(1);
  });

  test('"not provisional" is qualified in the same breath', () => {
    expect(HONEST_DETAIL).toContain("The grade is not provisional — but the evidence sources did not agree.");
    expect(HONEST_DETAIL).toContain('<a href="#merge">What the merge found&nbsp;&rarr;</a>');
    // and a listing with no disagreement keeps the plain sentence
    const clean = factory.renderRepoDetail(
      { ...HONEST_RECORD, repo: { ...HONEST_RECORD.repo, name: "clean" } } as never,
      ctxFor("factory", "directory", "directory/p4gs--clean/"),
    );
    expect(clean).toContain("The grade is not provisional. ");
    expect(clean).not.toContain("did not agree");
  });
});

describe("D10 · the denominators are on the page", () => {
  test("both figures name what they are a fraction OF", () => {
    // 87.1% against a home page that just taught "54 checks" reads as ~47
    // answered; the true figure was 27 of 31 in scope, and the strings 31 and
    // 27 appeared zero times in the rendered page.
    expect(DETAIL).toMatch(/\d+ of the \d+ checks in scope for this\s*\n?\s*listing were answered\./);
    expect(DETAIL).toMatch(/\d+ of the \d+ checks that were\s*\n?\s*answered passed\./);
    expect(DETAIL).toContain('<a href="#sheet-controls">see the table</a>');
    // derived from the rows the table shows, not typed
    const rec = RECORDS[0]!;
    const scoped = rec.controls.filter((c) => c.in_scope).length;
    expect(DETAIL).toContain(`of the ${scoped} checks in scope`);
    // R2 · THREE counts, and they sum to the registry. The old sentence folded
    // "the record marks these out of scope" together with "the record holds no
    // row for these at all" and asserted out-of-scope for both — the guess
    // `threats.ts` forbids, in the flattering direction.
    const held = new Set(rec.controls.map((c) => c.id));
    const absent = Object.keys(CONTROL_REGISTRY).filter((id) => !held.has(id)).length;
    const oos = rec.controls.filter((c) => !c.in_scope).length;
    expect(scoped + oos + absent).toBe(CONTROL_COUNT);
    const cap = /Of the (\d+) standard checks, (\d+) are\s*\n?\s*marked out of scope for this repository and (\d+) do not appear in this record at\s*\n?\s*all/.exec(
      DETAIL,
    );
    expect(cap, "the coverage figure must name all three counts").not.toBeNull();
    expect(Number(cap![1])).toBe(CONTROL_COUNT);
    expect(Number(cap![2])).toBe(oos);
    expect(Number(cap![3])).toBe(absent);
    expect(scoped + Number(cap![2]) + Number(cap![3])).toBe(CONTROL_COUNT);
    // and "see the table" is true: every absent id has a row there
    for (const id of Object.keys(CONTROL_REGISTRY).filter((i) => !held.has(i))) {
      expect(DETAIL, `${id} needs a row`).toContain(
        `<tr class="fy-row-absent">\n  <td data-label="Control"><code>${id}</code></td>`,
      );
    }
  });

  test("R2 · a bound chip always carries a verdict word, and absent is one of them", () => {
    const rec = RECORDS[0]!;
    const held = new Set(rec.controls.map((c) => c.id));
    for (const id of Object.keys(CONTROL_REGISTRY)) {
      const want = held.has(id) ? rec.controls.find((c) => c.id === id)!.scan_outcome : "absent";
      expect(DETAIL, `${id} chip verdict`).toContain(
        `<button type="button" class="fy-node" data-verdict="${want}"`,
      );
    }
    // no chip on the sheet is bound and wordless
    const chips = [...DETAIL.matchAll(/<button type="button" class="fy-node"([^>]*)>/g)];
    expect(chips.length).toBe(CONTROL_COUNT);
    for (const c of chips) expect(c[1]!, `chip without a verdict: ${c[1]}`).toContain("data-verdict=");
    // the home page's chips are bound to NO record, so they carry none at all
    expect(HOME).not.toContain('class="fy-node" data-verdict=');
  });
});

describe("D12 · three data states, three treatments", () => {
  test("no answer is dashed and struck; info is not a pill at all", () => {
    expect(CSS).toContain('.fy-node[data-verdict="unverified"] { border-style: dashed; border-color: var(--fy-na); }');
    expect(CSS).toContain('.fy-node[data-verdict="unverified"] .fy-node-label { text-decoration: line-through;');
    expect(CSS).toContain('.fy-node[data-verdict="info"] .fy-node-verdict { color: var(--fy-muted); border: 0; padding: 0; }');
    expect(CSS).toContain(".fy-oc-unverified { color: var(--fy-na); border-style: dashed; }");
    expect(CSS).toContain(".fy-oc-info { color: var(--fy-muted); border: 0; padding: 0;");
    // the dotted-border pair that differed on one channel plus the word is gone
    expect(CSS).not.toContain("border-style: dotted; border-color: var(--fy-na)");
  });
});

describe("D6 + D7 · the chart plots the fact, and the lanes figure is ranked", () => {
  const chart = HOME.slice(HOME.indexOf('<div class="fy-chart-grid">'), HOME.indexOf('id="chaining"'));

  test("nine bars, eighteen segments, split by where an answer could come from", () => {
    expect(countOf(chart, 'class="fy-bar ')).toBe(ATTACK_CLASSES.length * 2);
    expect(countOf(chart, "fy-bar-local")).toBe(ATTACK_CLASSES.length);
    expect(countOf(chart, "fy-bar-outside")).toBe(ATTACK_CLASSES.length);
    // and each split is the class-C share of that group, from the registry
    ATTACK_CLASSES.forEach((c) => {
      const ids = controlsDefending(c.id as AttackClassId);
      const localOnly = ids.filter((id) => CONTROL_REGISTRY[id]!.cls === "C").length;
      expect(chart, c.id).toContain(
        `${c.id} ${c.name}: ${localOnly} of ${ids.length} only a maintainer&#39;s own machine can answer`,
      );
    });
  });

  test("no bar is singled out, and the accent is nowhere in the chart", () => {
    // The accent marked the two groups defended MOSTLY by maintainer-only
    // checks — true against the data, and underivable from anything plotted:
    // A8 is also 5 and grey, A7 is also 8 and grey.
    expect(chart).not.toContain("fy-bar-marked");
    expect(CSS).not.toContain(".fy-bar-marked");
    expect(chart.toLowerCase()).not.toContain("#0285ff");
    expect(chart).not.toContain("var(--fy-accent)");
    expect(CSS).not.toMatch(/\.fy-bar[\w-]* \{ fill: var\(--fy-accent\)/);
    // two neutral fills, one of them a hatch, so they differ on texture too
    expect(CSS).toContain(".fy-bar-local { fill: url(#fy-chart-hatch); }");
    expect(chart).toContain('<pattern id="fy-chart-hatch"');
  });

  test("the caption describes what is drawn, with a key for the two fills", () => {
    expect(chart).toContain("answerable from outside");
    expect(chart).toContain("only on a maintainer&rsquo;s own machine");
    expect(chart).toContain("split by\n    where an answer could come from");
    expect(countOf(chart, "fy-chart-swatch")).toBe(2);
    expect(chart).not.toContain("stand out. Most of what defends them");
    // T2 · h2 + ONE body block. The third caption-size paragraph is a register
    // the reference's own beats do not have; the key is a legend, not a tier.
    expect(chart).not.toContain("fy-chart-caption");
    expect(countOf(chart, "fy-beat-body")).toBe(1);
  });

  test("the lanes figure is an OPEN ranked path, with exactly two segments", () => {
    const tri = HOME.slice(
      HOME.indexOf('class="fy-figure fy-triangle"'),
      HOME.indexOf("</figure>", HOME.indexOf('class="fy-figure fy-triangle"')),
    );
    const d = tri.match(/<path class="fy-trace" d="([^"]+)"/)![1]!;
    expect(d.split("L").length - 1).toBe(2);
    expect(d).not.toContain("Z");
    // a closed triangle asserts an edge from the weakest lane back to the
    // strongest, which is not a thing this site believes
    expect(tri).not.toContain("M70 92L510 92L290 286Z");
    expect(countOf(tri, "data-node-at=")).toBe(3);
    expect(countOf(tri, "fy-node-hollow")).toBe(1);
  });

  test("the ranking is readable — strongest first, and the first label says signed", () => {
    const tri = HOME.slice(
      HOME.indexOf('class="fy-figure fy-triangle"'),
      HOME.indexOf("</figure>", HOME.indexOf('class="fy-figure fy-triangle"')),
    );
    const labels = [...tri.matchAll(/<span class="fy-speed-label"[^>]*>([^<]+)<\/span>/g)].map(
      (m) => m[1]!,
    );
    expect(labels.length).toBe(3);
    expect(labels[0]).toContain("signed");
    expect(labels[2]).toContain("maintainer");
    expect(tri).toContain(">strongest<");
    expect(tri).toContain(">weakest<");
    // the hollow node is the LAST one, which is the weakest
    const hollowAt = tri.indexOf("fy-node-hollow");
    const nodes = [...tri.matchAll(/data-node-at="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(nodes[2]).toBe(1);
    expect(hollowAt).toBeGreaterThan(tri.indexOf(`data-node-at="${nodes[1]!.toFixed(4)}"`));
  });

  test("the beat's headline weights them, and stops addressing the wrong reader", () => {
    expect(HOME).toContain("Three ways a record gets made, and they do not carry equal");
    expect(HOME).not.toContain("the third is the one only you can do");
  });
});

describe("D11 + D13 + D14 + D16 · the rest of the honesty list", () => {
  test("D11 · meta is a dotted border, not a fifth shade", () => {
    expect(CSS).toContain('.fy-refcard[data-reference-type="meta"] {\n  --fy-ref-bg: #ffffff; --fy-ref-edge: #6f6f74; border-style: dotted;\n}');
    expect(CSS).toContain('.fy-legend-dot[data-reference-type="meta"] { --fy-ref-bg: #ffffff; --fy-ref-edge: #6f6f74; border-style: dotted; }');
  });

  test("D11 · green appears nowhere decorative", () => {
    // The green tint pair existed only to colour a phase region, which is not
    // an evidence class — a verdict colour spent on decoration.
    expect(CSS).not.toContain("--fy-tint-green");
    expect(CSS).not.toContain("--fy-edge-green");
    // every remaining use of the pass hue is a verdict, a grade ring or a key
    const uses = [...CSS.matchAll(/^([^\n{]*)\{[^}]*var\(--fy-pass\)/gm)]
      .map((m) => m[1]!.trim())
      .filter((sel) => sel !== ":root");
    expect(uses.length).toBeGreaterThan(0);
    for (const sel of uses) {
      expect(sel, sel).toMatch(/pass|verdict|g-aplus|cov-over|lane-auth|oc-pass/);
    }
  });

  test("D11 · scored under an older methodology is neutral, and says which", () => {
    // Amber is this page's `gap` colour: a listing scored under an older
    // methodology did not go wrong, it names its version.
    expect(CSS).toMatch(/\.fy-stale \{\n  color: var\(--fy-muted\)/);
    expect(CSS).not.toMatch(/\.fy-stale \{\n  color: var\(--fy-warn\)/);
    const old = factory.renderRepoDetail(
      RECORDS[0]!,
      ctxFor("factory", "directory", "directory/p4gs--sscsb-action/"),
    );
    expect(old).toContain(`scored under methodology v${RECORDS[0]!.methodology_version}&nbsp;&rarr;`);
    expect(old).not.toContain("scored before v");
  });

  test("D13 · the home page carries the tier claim, and fails closed without one", () => {
    // threats.ts is explicit that `sourced: "primary"` is a claim about THIS
    // SITE, added after one incident wore the mark by pattern-match. The
    // methodology page made the claim and marked the exception; home rendered
    // the same citations with neither.
    expect(HOME).toContain("Every incident below links to a primary source");
    expect(HOME).toContain('the line is marked <span class="fy-reported">reported</span>');
    expect(HOME.indexOf("fy-sourcing")).toBeLessThan(HOME.indexOf('<ul class="fy-attacks">'));
    // fail-closed: an incident with no tier renders no incident line
    expect(MOTION_SCRIPT.length).toBeGreaterThan(0); // (suite sanity)
    expect(HOME).toContain('class="fy-incident"');
    const tiers = new Set(ATTACK_CLASSES.map((c) => c.incidents[0]?.sourced ?? "none"));
    for (const t of tiers) expect(["primary", "reported"]).toContain(t);
    // and the renderer drops an untiered incident rather than citing it
    expect(MOTION_SCRIPT).not.toContain("sourced");
  });

  test("D14 · nothing on the page says a check RUNS in a phase", () => {
    for (const [name, html] of PAGES) {
      expect(html, `${name}: run in this phase`).not.toContain("run in this phase");
      expect(html, `${name}: run here`).not.toContain("checks run here");
    }
    expect(HOME).toContain("checks belong to this phase. Each card opens");
  });

  test("D16 · a workstation path never reaches the page", () => {
    expect(redactHome("verified against /Users/jane.doe/.ssh/allowed_signers")).toBe(
      "verified against ~/.ssh/allowed_signers",
    );
    expect(redactHome("found in /home/ci-bot/work/repo")).toBe("found in ~/work/repo");
    expect(redactHome("nothing to redact")).toBe("nothing to redact");
    // and the renderer uses it, proven through a record rather than by reading
    const withPath = {
      ...RECORDS[0]!,
      controls: [
        {
          id: "commit-signing", phase: 1, in_scope: true, raw_outcome: "pass",
          scan_outcome: "pass" as const, reclassified: false, reason: null,
          messages: ["signing key at /Users/jane.doe/.ssh/id_ed25519"],
        },
      ],
    };
    const html = factory.renderRepoDetail(
      withPath as never,
      ctxFor("factory", "directory", "directory/p4gs--sscsb-action/"),
    );
    expect(html).toContain("signing key at ~/.ssh/id_ed25519");
    expect(html).not.toContain("/Users/jane.doe");
  });
});

describe("A15 · the toggletip closes the way it opened, and holds focus", () => {
  test("there is a real exit animation, and the script waits for it", () => {
    // The CSS comment claimed "0.2 s out the way it came — side-aware" and
    // shipped only the enter keyframe: a 40 ms stroboscopic series over
    // 0–240 ms found the panel gone at EVERY sample, delay 0 included.
    expect(MOTION_CSS).toContain("@keyframes fy-tip-exit");
    expect(MOTION_CSS).toContain(
      '.fy-tip[data-state="closing"] {\n  animation: fy-tip-exit 0.2s cubic-bezier(0.17, 0.17, 0.3, 1) both;\n}',
    );
    // side-aware: it leaves by the same offset it arrived on
    expect(MOTION_CSS).toMatch(/@keyframes fy-tip-exit \{[\s\S]*var\(--fy-tip-from, -0\.5rem\)/);
    expect(MOTION_SCRIPT).toContain('addEventListener("animationend", once)');
    expect(MOTION_SCRIPT).toContain('t.panel.setAttribute("data-state", "closing")');
    // and it cannot hide a panel that was re-opened while the close was pending
    expect(MOTION_SCRIPT).toContain('if (t.panel.getAttribute("data-state") !== "closing") return;');
    // under reduced motion it closes at once rather than animating
    expect(MOTION_SCRIPT).toContain("if (reduce) {\n      t.panel.setAttribute(\"data-state\", \"closing\");");
    expect(blockAfter(MOTION_CSS, REDUCED)).toContain('.fy-tip[data-state="closing"] { animation: none; }');
  });

  test("focus moves INTO the dialog it announced", () => {
    // `role="dialog"` with focus left on the trigger behind it is a dialog a
    // keyboard reader is standing outside of.
    expect(countOf(HOME, 'role="dialog" tabindex="-1"')).toBeGreaterThan(50);
    for (const [name, html] of PAGES) {
      const dialogs = countOf(html, 'class="fy-tip"');
      expect(countOf(html, 'role="dialog" tabindex="-1"'), `${name}`).toBe(dialogs);
    }
    expect(MOTION_SCRIPT).toContain("panel.focus({ preventScroll: true })");
    // and Escape still brings it back
    expect(MOTION_SCRIPT).toContain('if (ev.key === "Escape" || ev.key === "Esc") closeTip(true);');
    expect(MOTION_SCRIPT).toContain("if (focusBack) { try { t.trigger.focus(); } catch (e) {} }");
  });
});

describe("D17 · no qualifying fact lives only in a title or an aria-label", () => {
  const QUALIFIERS = [
    "not counted",
    "never counted",
    "weaker",
    "signed by",
    "below",
    "unverified claim",
    "public-only visibility",
    "different commit",
  ];

  test("no title= on a Factory page asserts a qualifying fact", () => {
    for (const [name, html] of PAGES) {
      const titles = [...html.matchAll(/\stitle="([^"]*)"/g)].map((m) => m[1]!);
      for (const t of titles) {
        for (const q of QUALIFIERS) {
          expect(t.toLowerCase(), `${name}: title carries "${q}": ${t}`).not.toContain(q);
        }
      }
    }
  });

  test("every qualifying fact a title used to carry is on the visible layer", () => {
    // the four lane chips
    expect(DIRECTORY).toContain('class="fy-lane-key"');
    for (const kind of ["verified", "unsigned-action", "local", "external"] as const) {
      expect(DIRECTORY, kind).toContain(escapeForTest(LANE_TITLE[kind]));
    }
    expect(DIRECTORY).toContain("weaker than the action lane");
    // the provisional threshold
    expect(DIRECTORY).not.toContain('class="fy-prov" title=');
    expect(DIRECTORY).toContain(`${COVERAGE_FLOOR_PROVISIONAL}%`);
    // the phase-bar segment counts
    expect(DETAIL).not.toMatch(/<span class="fy-seg-(pass|fail)"[^>]*title=/);
    expect(DETAIL).toMatch(/of \d+ answered/);
  });

  test("an aria-label that carries a qualifying fact has it visible too", () => {
    // The four that do: the chart, both traced figures, and the phase rows.
    const chart = HOME.slice(HOME.indexOf('<div class="fy-chart-grid">'), HOME.indexOf('id="chaining"'));
    expect(chart).toContain("only on a maintainer&rsquo;s own machine");
    expect(HOME).toContain("The road code travels");
    expect(HOME).toContain("Code moves from a commit to a published package");
    expect(HOME).toContain(">strongest<");
    expect(DETAIL).toContain('class="fy-phase-note"');
  });

  test("the one title a SHARED module still writes has its fact on the page", () => {
    // `threats-shared.ts` glosses its `reported` chip in a title. That module is
    // out of this design's file scope, and the fact it carries is stated in the
    // same section by the sourcing sentence above the list — so the title is a
    // duplicate rather than the only place the claim lives.
    expect(METHODOLOGY).toContain("this site has not opened the primary document.");
    expect(METHODOLOGY).toContain("Every incident below links to a primary source");
    expect(METHODOLOGY).toContain("The one exception is marked");
  });

  test("the sweep's own arithmetic — the counts BUILD-NOTES records", () => {
    let titles = 0;
    let labels = 0;
    for (const [, html] of PAGES) {
      titles += countOf(html, ' title="');
      labels += countOf(html, ' aria-label="');
    }
    // Rendered counts over the FIXTURE pages (the live sheet has 44 control
    // rows against the fixture's two, so the built tree's numbers are larger —
    // 62 / 400, recorded in BUILD-NOTES beside these).
    expect(titles).toBe(32);
    expect(labels).toBe(392);
    // Every distinct title value across the four pages, enumerated — a new one
    // cannot appear without this list being revisited.
    const distinct = new Set<string>();
    for (const [, html] of PAGES) {
      for (const m of html.matchAll(/\stitle="([^"]*)"/g)) distinct.add(m[1]!);
    }
    expect([...distinct].sort()).toEqual([
      "Build receipts",
      "Code &amp; build hardening",
      "Commit integrity",
      "Dependencies",
      "Distribution &amp; publishing",
      "Find a repository",
      "Ongoing posture",
      "Widely reported. Unlike the others on this page, this site has not opened the primary document.",
      "sscsb verify raw outcome",
    ]);
  });
});

/** The escaping the renderers apply, so a shared sentence can be looked for. */
function escapeForTest(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ══ what the browser found in THIS round ════════════════════════════════ */

describe("what the self-check found, and what keeps it found", () => {
  test("the compact card is positioned, and its circle offsets are reset", () => {
    // Two defects in one rule, both measured at 390 and neither visible to a
    // test that renders HTML:
    //  · with a STATIC card the active/arrival rings take their containing
    //    block from the whole loop — 310 x 686 — and painted a blue box round
    //    the entire rail for the 120 ms of the release animation. A still
    //    screenshot caught it; no geometry probe of the cards would have.
    //  · making it RELATIVE then made it OBEY the desktop rule's circle
    //    percentages, scattering all five cards and pushing the document to
    //    575px wide at 390.
    expect(MOBILE).toContain(
      "    position: relative; inset-block-start: auto; inset-inline-start: auto;\n",
    );
    expect(MOBILE).not.toMatch(/\.fy-loop-card \{\n\s*position: static/);
    // (the compact STORE is still static, and correctly so — its two absolutely
    // positioned children are display:none at this width)
    expect(MOBILE).toMatch(/\.fy-context-store \{\n\s*position: static/);
    // the desktop rule that has to be undone is still the one being undone
    expect(CSS).toContain(
      "  position: absolute; inset-block-start: var(--fy-circle-y); inset-inline-start: var(--fy-circle-x);",
    );
  });

  test("the local-lane row link reaches the tap floor when the card restacks", () => {
    // 51.2 x 32 at 390: the restack blockifies it out of the WCAG 2.5.8 inline
    // exception, which is exactly why it passed at 1440 and failed at 390.
    // T5 · it reaches the floor as the ELEMENT while the DRAWN pill stays the
    // height of the PASS pill beside it — it used to reach 44 by becoming a
    // dashed ~46px circle, a shape that appears nowhere else on the site.
    expect(CSS).toMatch(/:root \.fy-hit-pill \{[^}]*min-block-size: 44px;/);
    // …and the DRAWN pill is the height of the chip it is meant to pair with,
    // not 4px taller. `.fy-oc-pass` measures 18.0px; 22 against 18 is a quarter
    // more on a 20px object, which is where "the same component" stops holding.
    expect(CSS).toMatch(/:root \.fy-hit-pill::before \{[^}]*block-size: 18px;/);
    expect(CSS).not.toMatch(/:root \.fy-hit-pill::before \{[^}]*block-size: 22px;/);
    expect(CSS).not.toMatch(/\.fy-row-lane \{[^}]*min-block-size: 44px/);
    // and the cell keeps them on one line box, so the 390 card restack cannot
    // blockify the link out of the inline exception
    expect(DETAIL).toContain('<span class="fy-verdict-cell">');
    expect(CSS).toContain(".fy-verdict-cell { display: inline; }");
  });
});

/* ══ round 2 — the rest of the list, each item against the thing it fixes ═══ */

describe("R3 · one verdict vocabulary, on every surface that names a state", () => {
  test("the three keys are the same set of words, drawn as the page draws them", () => {
    const words = VERDICT_STATES.map((v) => v.word);
    // the sheet's key, the directory's key, and the explorer's Record card
    for (const [name, html] of [["detail", DETAIL], ["directory", DIRECTORY], ["home", HOME]] as const) {
      for (const w of words) {
        expect(html, `${name}: the key must name "${w}"`).toContain(`>${w}</span>`);
      }
    }
    // and they are the real pills, not swatches that match nothing on the page
    for (const v of VERDICT_STATES) {
      expect(DETAIL).toContain(`<span class="fy-outcome fy-oc-${v.key}">${v.word}</span>`);
    }
    // the vocabulary is ONE table, so a sixth state cannot be added to a chip
    // without appearing in every key
    expect(VERDICT_WORD.info).toBe("out of scope");
    expect(VERDICT_WORD.fail).toBe("did not pass");
  });

  test("gap is amber everywhere, and red is the fail state and nothing else", () => {
    expect(CSS).toMatch(/\.fy-oc-gap \{[^}]*color: var\(--fy-warn\)/);
    expect(CSS).toMatch(/\.fy-node\[data-verdict="gap"\] \.fy-node-verdict \{[^}]*color: var\(--fy-warn\)/);
    // T14 · the tint register, with the full-strength hue kept for the word
    expect(CSS).toContain("--fy-tint-pass: #edf8f1;");
    expect(CSS).toMatch(/\.fy-oc-pass \{[^}]*background: var\(--fy-tint-pass\)/);
    // the ONLY things --fy-fail may paint are the fail verdict and the fail
    // swatch — never a provenance fact
    const failRules = CSS.split("\n").filter((l) => l.includes("--fy-fail)") && !l.includes("--fy-fail:"));
    expect(failRules.length).toBeGreaterThan(3);
    for (const r of failRules) {
      expect(
        // the verdict itself, its swatch, its grade ring, its lane chip — and
        // the one bridge line that hands the token to the shared layer
        /fy-oc-fail|fy-seg-fail|fy-swatch-fail|fy-g-f|fy-lane|data-verdict="fail"|--hp-fail:/.test(r),
        `--fy-fail on a non-verdict rule: ${r.trim()}`,
      ).toBe(true);
    }
  });
});

describe("R6 · the three small honesty items", () => {
  test("the re-verify links say what the signed bytes still carry", () => {
    expect(HONEST_DETAIL).toContain(
      "The signed bytes are republished verbatim, and contain the workstation paths",
    );
    expect(HONEST_DETAIL).toContain("this page redacts.");
  });

  test("two identical grades are never separated by a vs", () => {
    // "vs" between equal values reads as a grade dispute where there is none,
    // and the sheet already resolves the same pair as "Both score A+."
    expect(DIRECTORY).not.toMatch(/A\+ 100% vs this listing A\+ 100%/);
    const both = factory.renderDirectory(RECORDS, {
      ...ctxFor("factory", "directory", "directory/"),
      facts: new Map(
        RECORDS.map((r) => [
          `${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}`,
          { ...HONEST_FACTS },
        ]),
      ),
    } as never);
    expect(both).toContain("both score A+ 100%");
    expect(both).not.toContain(" vs this listing");
  });

  test("16 in the standard set is reconciled with the ten or eleven in scope", () => {
    expect(HOME).toContain("Ten or eleven are in scope on a typical repository.");
    expect(HOME).toContain(`of the standard ${CONTROL_COUNT} only a maintainer&#39;s own machine can answer`);
  });
});

describe("S · the 390 structure, in the rules that produce it", () => {
  test("S1 · the chapter rail spans the gutters rather than a 278px cap", () => {
    expect(MOBILE).toContain("inline-size: calc(100% - 40px); max-inline-size: none;");
    expect(MOBILE).not.toContain("max-inline-size: calc(100% - var(--fy-gutter) * 2 - 64px)");
  });

  test("S2 · the shared scroll containers get the mask, a tab stop and a cue", () => {
    expect(CSS).toMatch(/\.table-scroll \{[^}]*--fy-mask-start/);
    expect(CSS).toContain('.table-scroll[data-overflow-end="true"] { --fy-mask-end: rgba(0, 0, 0, 0); }');
    expect(CSS).toMatch(/\.table-scroll:focus-visible \{[^}]*outline: 2px solid var\(--fy-ring\)/);
    expect(CSS).toMatch(/\.fy-swipe \{/);
    // the script is what applies them, to BOTH families
    expect(MOTION_SCRIPT).toContain('querySelectorAll(".fy-wrap, .table-scroll")');
    expect(MOTION_SCRIPT).toContain('cue.className = "fy-swipe"');
    expect(MOTION_SCRIPT).toContain('wrap.setAttribute("tabindex", "0")');
    // methodology is the page that carries them
    expect(countOf(METHODOLOGY, 'class="table-scroll"')).toBeGreaterThanOrEqual(2);
  });

  test("S3 · the compact rail interleaves connectors, and the order is derived", () => {
    // Cards and connectors live in two sibling containers; flattening both is
    // the only way a connector lands BETWEEN two cards.
    expect(MOBILE).toContain(".fy-loop-cards, .fy-connections { display: contents; }");
    expect(MOBILE).toContain(".fy-loop-card, .fy-connector { order: var(--fy-rail-order, 0); }");
    // …and the order is a property of the data, not five literals in CSS
    const cardOrders = [...HOME.matchAll(/class="fy-loop-card"[^>]*--fy-rail-order:(\d+)/g)].map((m) => Number(m[1]));
    const edgeOrders = [...HOME.matchAll(/class="fy-connector"[^>]*--fy-rail-order:(\d+)/g)].map((m) => Number(m[1]));
    expect(cardOrders).toEqual([1, 3, 5, 7, 9]);
    expect(edgeOrders).toEqual([2, 4, 6, 8, 10]);
    // the return bracket, and the symmetric gutter it lives in
    expect(MOBILE).toContain("gap: 10px; padding-inline: 20px;");
    expect(MOBILE).toMatch(/\.fy-connector\[data-loop-edge="rescan"\]::after \{[^}]*transform: rotate\(-45deg\)/);
    expect(countOf(HOME, 'class="fy-connector"')).toBe(5);
  });

  test("S4 · every label-plus-items row is a list at 390", () => {
    expect(MOBILE).toMatch(
      /\.fy-legend, \.fy-trace-legend, \.fy-verdict-key, \.fy-phase-names, \.fy-key \{\s*\n?\s*flex-direction: column/,
    );
    expect(MOBILE).toContain(".fy-ctl-bar .fy-key-label, :root .design-switcher .ds-label { flex: 0 0 100%; }");
  });

  test("S5 · every chart label is HTML, positioned from the plot's own geometry", () => {
    const chart = HOME.slice(HOME.indexOf('class="fy-chart-grid"'), HOME.indexOf("</figure>", HOME.indexOf('class="fy-chart-grid"')));
    // no SVG text left to be scaled by a viewBox
    expect(chart).not.toContain("<text");
    expect(countOf(chart, 'class="fy-chart-value"')).toBe(ATTACK_CLASSES.length);
    expect(countOf(chart, "<span>A")).toBe(ATTACK_CLASSES.length);
    expect(chart).toContain('<p class="fy-chart-axis" aria-hidden="true">Attack group</p>');
    expect(chart).toContain('class="fy-chart-ylabel"');
    // the id row's columns ARE the bars' columns, derived from the same numbers
    expect(CSS).toContain("column-gap: calc(12 / 584 * 100%);");
    expect(CSS).toContain("padding-inline: calc(60 / 584 * 100%) calc(32 / 584 * 100%);");
    // mono, like every other identifier on the site
    expect(CSS).toMatch(/\.fy-chart-ids \{[^}]*font-family: var\(--fy-mono\)/);
    // the mobile stretch is the wrap's aspect-ratio, so type does not stretch
    expect(MOBILE).toContain(".fy-plot-wrap { aspect-ratio: 584 / 432; }");
    expect(CSS).not.toContain("--fy-stretch");
  });

  test("S6 · the ranked figure's labels are HTML, placed off the trace", () => {
    const tri = HOME.slice(HOME.indexOf('class="fy-figure fy-triangle"'), HOME.indexOf("</figure>", HOME.indexOf('class="fy-figure fy-triangle"')));
    expect(countOf(tri, 'class="fy-speed-label"')).toBe(3);
    expect(tri).toContain('data-place="above-center"');
    expect(tri).toContain('data-place="above-start"');
    expect(tri).toContain('data-place="below-end"');
    // T19 · hollow AND dashed, which D7 asked for and only half of which landed
    expect(CSS).toContain(".fy-figure .fy-speed-node.fy-node-hollow { stroke-dasharray: 3 3; }");
  });

  test("S7 + S8 · nested chips, counters and the kicker at 390", () => {
    // ROUND 3 · these two moved OUT of the 767 block and are unconditional now.
    // A narrow region at 1440 squeezes a chip exactly the way a 390 viewport
    // does — `publish-provenance` set as `publis`/`h-`/`proven` in the
    // five-across Distribution & publishing band — so the fix that had been
    // written for one width was the fix the other needed. Two-sided: the pair
    // must be global AND `overflow-wrap: anywhere` must be gone from the label,
    // because that declaration is what shredded the ids.
    expect(CSS).toMatch(/\.fy-node \{[^}]*flex-wrap: wrap;/);
    expect(CSS).toContain(".fy-node-label { font-family: var(--fy-mono); font-size: 13px; line-height: 22px; overflow-wrap: normal; }");
    expect(CSS).not.toMatch(/\.fy-node-label \{[^}]*overflow-wrap: anywhere/);
    expect(MOBILE).not.toContain(".fy-node { flex-wrap: wrap; }");
    expect(MOBILE).not.toContain(".fy-node-label { overflow-wrap: normal; }");
    expect(MOBILE).toContain(".fy-metrics { grid-template-columns: minmax(0, 1fr); gap: 24px; }");
    expect(MOBILE).toContain(".fy-kicker .fy-sep { display: none; }");
    expect(HOME).toContain('<span class="fy-sep"');
    expect(CSS).toMatch(/\.fy-repeat-count \{[^}]*white-space: nowrap/);
  });

  test("S9 · the directory prints P1-P6 against the names they stand for", () => {
    expect(DIRECTORY).toContain('class="fy-key fy-phase-names"');
    for (const [n, name] of Object.entries(PHASE_NAMES)) {
      expect(DIRECTORY, `P${n} needs its name in visible text`).toContain(
        `<span class="fy-phase-id">P${n}</span>${name.replaceAll("&", "&amp;")}`,
      );
    }
    // …and it is the ONE page that draws the bars without them, so this is not
    // a nicety: a title attribute never renders at all on a touch device.
    expect(countOf(DIRECTORY, 'class="fy-phase-name"')).toBe(Object.keys(PHASE_NAMES).length);
  });
});

describe("T · the polish class, in the rules that carry it", () => {
  test("T1 · nothing in this tree is bolder than 500", () => {
    expect(CSS).toContain("strong, b { font-weight: 500; }");
    // …including the shared layer's own six 600/700 declarations
    expect(CSS).toContain(":root .hp-card-name, :root .hp-waiting-link, :root .hp-more,\n:root .ex-name, :root .tx-chip-id { font-weight: 500; }");
    // The concatenated sheet still CONTAINS the shared layer's own six heavy
    // declarations — that layer is not this design's to rewrite — and each one
    // is re-declared at 500 by the rule above. Six is the number: a seventh
    // means the shared layer grew one this override does not cover, and the
    // browser probe (0 elements over 500 on all four pages) is what closes it.
    const overWeight = [...CSS.matchAll(/font-weight: (\d+)/g)]
      .map((m) => Number(m[1]))
      .filter((w) => w > 500);
    expect(overWeight.length, "an uncovered heavy weight entered the shared layer").toBe(6);
  });

  test("T2 · the pull-quote is the reference's, and the dark chapter is unboxed", () => {
    expect(CSS).toMatch(/\.fy-pullquote \{[^}]*text-align: center;/);
    expect(CSS).toMatch(/\.fy-pullquote \{[^}]*padding: 0; border: 0;/);
    expect(HOME).toContain('<span class="fy-quote-by">');
  });

  test("T3 · both disclosure systems carry a marker that moves with the state", () => {
    expect(HOME).toContain('class="fy-chevron"');
    expect(countOf(HOME, 'class="fy-chevron"')).toBe(ATTACK_CLASSES.length);
    expect(CSS).toContain('.fy-attack-trigger[aria-expanded="true"] .fy-chevron { transform: rotate(180deg); color: var(--fy-accent); }');
    expect(CSS).toContain(":root .tx-details > summary { cursor: pointer; }");
    expect(CSS).toMatch(/:root \.tx-details > summary::before \{[^}]*transform: rotate\(45deg\)/);
    expect(CSS).toContain(":root .tx-details[open] > summary::before { transform: rotate(-135deg); margin-block-start: 3px; }");
  });

  test("T4 · every separator is a ::before on the item that follows it", () => {
    expect(CSS).toContain('.fy-sl > span + span::before { content: "\\B7\\A0"; }');
    // …and every site the judge caught stranding one is a sepList now
    expect(DIRECTORY).toContain('<span class="fy-sl"><span>100% passed</span>');
    expect(HOME).toContain('<span>Open source</span> <span>Apache-2.0</span>');
    expect(HOME).toContain('<span>scan-record.json</span> <span>signed when the lane can sign it</span>');
    expect(HOME).toContain('<span>A grade</span> <span>6 phase bars</span>');
    expect(DETAIL).toContain('<span>13 checks belong to this phase</span>');
    // every page uses the component, on the lines that used to strand one
    for (const [name, html] of PAGES) {
      expect(countOf(html, 'class="fy-sl"'), `${name}`).toBeGreaterThan(0);
    }
    // the metadata line's own separators moved from a trailing ::after
    expect(CSS).toContain(".fy-rm + .fy-rm::before { content: \"· \"; }");
    expect(CSS).not.toContain('.fy-rm:not(:last-child)::after');
  });

  test("T8 + T9 · the search field is a pill and the wordmark is a mark", () => {
    expect(CSS).toMatch(/:root \.hp-search-input \{[^}]*border-radius: 999px;/);
    expect(CSS).toMatch(/:root \.hp-search-input \{[^}]*max-inline-size: 520px;/);
    expect(CSS).not.toMatch(/:root \.hp-search-input \{[^}]*border-radius: 8px/);
    expect(CSS).toMatch(/\.fy-wordmark \{[^}]*font-family: var\(--fy-display\); font-weight: 500; font-size: 16px; letter-spacing: -0\.02em;/);
  });

  test("T10 + T11 + T12 + T13 · prose rhythm, counts, legend, measure", () => {
    expect(CSS).toMatch(/\.fy-method-section p \{ margin-block-start: 42px;/);
    expect(CSS).toContain(".fy-method-section h2 + p, .fy-method-section h3 + p { margin-block-start: 16px; }");
    expect(CSS).toMatch(/:root \.term-def \{[^}]*font-style: normal; color: var\(--fy-muted\)/);
    // ROUND 3 · T10's two-column grid is GONE, and the reason is worth keeping:
    // in a grid each `<code>` is an item and each ", " between them an ANONYMOUS
    // item, so auto-placement dealt nine ids into column 2 and nine bare commas
    // into column 1 — 179px from the token each belonged to. The label takes its
    // own line instead, which is one behaviour for home's copy and methodology's
    // `.tx-class-controls`, and leaves ordinary inline layout in charge of the
    // commas.
    expect(CSS).toContain(".fy-attack-checks, :root .tx-class-controls {\n  display: block; overflow-wrap: normal;\n}");
    expect(CSS).toContain(
      ".fy-attack-checks > .fy-attack-label, :root .tx-class-controls > .tx-label {\n  display: block; margin-block-end: 2px;\n}",
    );
    expect(CSS).not.toMatch(/\.fy-attack-checks \{[^}]*display: grid; grid-template-columns: auto minmax\(0, 1fr\)/);
    expect(CSS).toMatch(/\.fy-ov-count \{[^}]*min-inline-size: 2\.4ch; text-align: end;/);
    expect(CSS).toMatch(/\.fy-trace-legend \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    expect(CSS).toMatch(/\.fy-panel \{[^}]*max-inline-size: calc\(var\(--fy-prose\) \+ 48px\)/);
    expect(CSS).toMatch(/:root \.tx-reported \{[^}]*border-radius: 999px/);
  });

  test("T16 + T17 + T18 · the nav's plate, its clearance, and its guard", () => {
    expect(CSS).toMatch(/\.fy-chapters \{[\s\S]*?box-shadow: 0 1px 3px rgba\(0, 0, 0, 0\.08\);/);
    // T17 · THE CLEARANCE ON A PAGE'S FIRST LANDING IS THE NAV'S OWN BOTTOM
    // MARGIN, and no scroll-margin can supply it: at that scroll position the
    // nav has not reached its sticky offset, so it is still in flow directly
    // above the section and its bottom IS the section's top. Measured 0.0px
    // before; 23.6-28.5px on every pill of every page at both widths after.
    expect(CSS).toContain("margin: 160px auto 24px;");
    expect(MOBILE).toContain("margin: 80px 20px 24px;");
    expect(CSS).not.toContain("scroll-margin-top: 124px");
    // the belt exists only where scrollend does not
    expect(MOTION_SCRIPT).toContain('if ("onscrollend" in window) {');
    expect(MOTION_SCRIPT).toContain("} else {\n            navTimer = setTimeout(settle, 700);");
    expect(MOTION_SCRIPT).not.toMatch(/navTimer = setTimeout\(settle, 700\);\n          if \("onscrollend"/);
  });

  test("B14 + B15 + B19 · print, the count's name, and the conditional will-change", () => {
    // the opening panel carries the page's only h1
    const print = blockAfter(CSS, "@media print");
    expect(print).not.toContain(".fy-aperture");
    expect(print).toContain(".fy-chapters, .fy-find, .fy-bars, .fy-response { display: none; }");
    expect(HOME).toContain('<span class="fy-attack-mark">');
    expect(HOME).not.toContain('<span class="fy-attack-mark" aria-hidden="true">');
    expect(MOTION_SCRIPT).toContain('querySelectorAll(".fy-track[data-window-in-view]")');
    expect(MOTION_SCRIPT).toContain('track.setAttribute("data-window-in-view", en.isIntersecting ? "true" : "false");');
  });
});

/* ══ round 3 — the last targeted pass ════════════════════════════════════ */

/**
 * Round 3's four judges and the independent measurement agreed on one sentence
 * for most of this list: a token must not break away from what belongs to it.
 * The id away from its chip, the comma away from its id, the middot away from
 * the item it introduces, the badge away from its own pill — four shapes of the
 * same fault, and each is pinned here with the old form required to be gone,
 * because every one of them shipped silently once already.
 */
describe("round 3 — a token never breaks away from what belongs to it", () => {
  test("A1 · the chip's id is unbreakable at EVERY width, not only at 390", () => {
    // `.fy-node-label { overflow-wrap: anywhere }` was global while its repair
    // was in the 767 block, so the five-across Distribution & publishing band
    // at 1440 set `publish-provenance` as `publis` / `h-` / `proven`.
    expect(CSS).toMatch(/\.fy-node \{[^}]*flex-wrap: wrap;/);
    expect(CSS).toMatch(/\.fy-node-label \{[^}]*overflow-wrap: normal;/);
    expect(CSS).not.toMatch(/\.fy-node-label \{[^}]*overflow-wrap: anywhere/);
  });

  test("A2 + E20 · the run-in checks list is one component with one behaviour", () => {
    // The grid dealt nine ids into column 2 and nine bare commas into column 1.
    // One rule, both instances, label on its own line, ordinary inline layout
    // back in charge of the separators.
    expect(CSS).toContain(".fy-attack-checks, :root .tx-class-controls {");
    expect(CSS).toContain(".fy-attack-checks > .fy-attack-label, :root .tx-class-controls > .tx-label {");
    expect(CSS).not.toMatch(/\.fy-attack-checks \{[^}]*display: grid/);
    expect(CSS).not.toContain(".fy-attack-checks > a { grid-column: 1 / -1; }");
  });

  test("A3 · an identifier in the methodology threat lists never splits", () => {
    expect(CSS).toContain(".fy-attack-checks code, :root .tx-class-controls code { white-space: nowrap; }");
  });

  test("A4 · the merge badge is one line inside its 999px pill", () => {
    expect(CSS).toMatch(/\.fy-merge-tag \{[^}]*white-space: nowrap;/);
    expect(CSS).toMatch(/\.fy-merge-tag \{[^}]*flex: 0 0 auto;/);
    // and it is still the 999px pill, not a re-shaped box
    expect(CSS).toMatch(/\.fy-merge-tag \{[^}]*border-radius: 999px;/);
  });

  test("A5 · a separator never opens or closes a rendered line", () => {
    // CSS can express neither case: the dot strands at a line END when the item
    // it introduces is an atomic inline-block that wraps whole, and nothing
    // anywhere stops a line BEGINNING on one. Asked after layout, re-asked on
    // resize, and answered by hiding the GLYPH rather than removing the box —
    // `visibility` changes no geometry, so the mark cannot move the wrap that
    // produced it and the pass cannot oscillate against its own effect.
    expect(CSS).toContain('.fy-sl > span + span[data-sep="off"]::before,');
    expect(CSS).toContain('.fy-rm + .fy-rm[data-sep="off"]::before { visibility: hidden; }');
    expect(CSS).not.toMatch(/\[data-sep="off"\]::before \{[^}]*content: none/);
    expect(MOTION_SCRIPT).toContain('var SEP_SEL = ".fy-sl > span + span, .fy-rm + .fy-rm";');
    expect(MOTION_SCRIPT).toContain("var stranded = mine.length > 1;");
    expect(MOTION_SCRIPT).toContain('el.setAttribute("data-sep", "off");');
    expect(MOTION_SCRIPT).toContain('addEventListener("resize", seps);');
    // web fonts land after first layout and change every one of these measurements
    expect(MOTION_SCRIPT).toContain("document.fonts.ready.then(seps);");
  });

  test("A6 · the pull-quote does not hyphenate", () => {
    expect(CSS).toMatch(/\.fy-pullquote \{[\s\S]*?hyphens: none;/);
  });

  test("C10 · all three summary families say they open", () => {
    // `.tx-details summary` had the chevron; round 2 recorded that these two
    // already did and they did not — they had `cursor: pointer` and then the
    // `display: inline-flex` that is itself what suppresses the ::marker.
    expect(CSS).toContain(".fy-merge summary, .fy-table summary { display: inline-flex; align-items: center; list-style: none; }");
    expect(CSS).toContain(".fy-merge summary::before, .fy-table summary::before {");
    expect(CSS).toContain(".fy-merge[open] > summary::before,");
    expect(CSS).toContain(".fy-table details[open] > summary::before { transform: rotate(-135deg); margin-block-start: 3px; }");
    // the closed state is the same 45deg glyph `.tx-details` draws
    expect(CSS).toMatch(/\.fy-merge summary::before, \.fy-table summary::before \{[^}]*transform: rotate\(45deg\);/);
    // the 44px tap target survives
    expect(CSS).toMatch(/\.fy-table summary \{[^}]*min-block-size: 44px;/);
    // every summary the tree renders is covered by one of the three rules
    for (const [name, html] of PAGES) {
      const summaries = (html.match(/<summary/g) ?? []).length;
      const covered = (html.match(/class="(?:fy-merge|tx-details)"/g) ?? []).length
        + (html.match(/<details><summary>evidence \(/g) ?? []).length;
      expect(summaries, `${name}: ${summaries} summaries, ${covered} covered`).toBe(covered);
    }
  });

  test("E19 · the swipe cue is hidden when the region does not overflow", () => {
    // `.fy-swipe { display: block }` is an author rule and beats the UA's
    // `[hidden] { display: none }`, so `cue.hidden = max <= 1` did nothing.
    expect(MOTION_CSS).toContain(".fy-swipe[hidden] { display: none; }");
    expect(MOTION_SCRIPT).toContain("if (cue) cue.hidden = max <= 1;");
  });

  test("E24 · the reported chip is one component on both pages", () => {
    expect(CSS).toMatch(/\.fy-reported \{[\s\S]*?border-radius: 999px; padding: 0 8px; margin-inline-start: 0;/);
    expect(CSS).toMatch(/:root \.tx-reported \{[^}]*border-radius: 999px/);
    expect(CSS).not.toMatch(/\.fy-reported \{[^}]*padding: 0 6px; margin-inline-start: 8px/);
  });
});

describe("round 3 — the diagrams' connective claims are true", () => {
  test("B7 · the outgoing wire shares the Record card's own grid row", () => {
    // In the CHECKS band the wire stretched to that band's ~2000px row, so its
    // arrowhead's 50% resolved to bare dotted grid ~330px below the only card it
    // can mean. The row has to BE the card's row for 50% to mean the card.
    expect(CSS).toContain('.fy-flow-band[data-flow-band="out"] { grid-column: 3; grid-template-columns: 56px minmax(0, 1fr); }');
    expect(CSS).toContain('.fy-flow-band[data-flow-band="out"] .fy-flow-wire { grid-column: 1; grid-row: 1; }');
    expect(CSS).toContain('.fy-flow-band[data-flow-band="out"] .fy-flow-col { grid-column: 2; grid-row: 1; }');
    // out of flow, or the SVG's own viewBox aspect sets the row and 50% means
    // the wire's midpoint again — which IS the defect
    expect(CSS).toContain('.fy-flow-band[data-flow-band="out"] .fy-flow-lines { position: absolute; inset: 0; }');
    // the checks band gives its 56px back to the cards, and its head with it
    expect(CSS).toContain('.fy-flow-band[data-flow-band="checks"] { grid-column: 2; grid-template-columns: minmax(0, 1fr); }');
    expect(CSS).toContain('.fy-flow-head[data-flow-head="checks"] { grid-column: 2; }');
    expect(CSS).toContain('.fy-flow-head[data-flow-head="out"] { grid-column: 3; padding-inline-start: 56px; }');
    // the 390 connector is a second element, so reading order stays
    // checks-cards → connector → Record head; each width shows exactly one
    expect(HOME).toContain('<div class="fy-flow-wire" data-flow-wire="stack" aria-hidden="true"></div>');
    expect(HOME).toContain('<div class="fy-flow-wire" data-flow-wire="out" aria-hidden="true">');
    expect(CSS).toContain('.fy-flow-wire[data-flow-wire="stack"] { display: none; }');
    expect(MOBILE).toContain('.fy-flow-wire[data-flow-wire="stack"] { display: block; }');
    expect(MOBILE).toContain('.fy-flow-wire[data-flow-wire="out"] { display: none; }');
    // the inbound bracket is untouched — its arms still target 16/50/84%
    expect(HOME).toContain('d="M0 16H22M0 50H22M0 84H22M22 16V84M22 50H52"');
  });

  test("B8 · the rank word hangs under the rung it names, on both rungs", () => {
    // "strongest" above its rung sat in the same horizontal band as the first
    // node's centred label: 40.5 x 4.0px at 1440, 39.8 x 5.1px at 390 — the only
    // text overlap on the site, and at both widths. Horizontal separation is not
    // available (node 1 is 40 units right of the ladder's left edge, so a label
    // centred on it always reaches into the rank gutter), so it is vertical.
    const beat = HOME.slice(HOME.indexOf('id="lanes"'), HOME.indexOf('id="ways-in"'));
    // 110 and 270 are 14 units BELOW the rungs at 96 and 256
    expect(beat).toContain(`top:${((100 * 110) / 330).toFixed(3)}%">strongest`);
    expect(beat).toContain(`top:${((100 * 270) / 330).toFixed(3)}%">weakest`);
    expect(beat).not.toContain(`top:${((100 * 86) / 330).toFixed(3)}%">strongest`);
    expect(beat).not.toContain(`top:${((100 * 246) / 330).toFixed(3)}%">weakest`);
    // and the first label lifts a little further off its node
    expect(beat).toContain(`top:${((100 * (96 - 18)) / 330).toFixed(3)}%"`);
    // both rank words share one left, so the rule reads as one rule
    expect(countOf(beat, `class="fy-rank-label" style="left:${((100 * 8) / 580).toFixed(3)}%`)).toBe(2);
  });

  test("B9 · the phase picker says it is holding more, and moves what you picked into view", () => {
    // At 390 this showed two and a half of its six phases behind a scrollbar-less
    // scroll, under a rounded cap 20px inside the screen edge that reads as the
    // end of the control — on the site's one interactive device, whose own copy
    // says "pick a phase". The tables two selectors away already had every part
    // of this.
    expect(MOTION_CSS).toContain(".fy-segmented[data-overflow-end=\"true\"] { --fy-mask-end: rgba(0, 0, 0, 0); }");
    expect(MOTION_CSS).toContain(".fy-seg-swipe[hidden] { display: none; }");
    expect(MOTION_SCRIPT).toContain('cue.className = "fy-seg-swipe";');
    expect(MOTION_SCRIPT).toContain("cue.hidden = max <= 1;");
    // padded by the mask's own 20px, so a revealed label never lands under the
    // fade that says there is more
    expect(MOTION_SCRIPT).toContain("if (l.left < g.left + 20) group.scrollLeft -= g.left + 20 - l.left;");
    expect(MOTION_SCRIPT).toContain("else if (l.right > g.right - 20) group.scrollLeft += l.right - (g.right - 20);");
    expect(MOTION_SCRIPT).toContain('input.addEventListener("change", function () { sync(); reveal(input); });');
    // the radio semantics and the no-sliding-thumb rule are untouched
    expect(HOME).toContain('<div class="fy-segmented" role="radiogroup" aria-label="Pick a phase" data-segmented>');
    expect(MOTION_CSS).not.toContain(".fy-seg-thumb");
  });
});
