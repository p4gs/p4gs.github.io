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
import {
  APERTURE_KEYFRAMES,
  LOOP_KEYFRAMES,
  LOOP_STAGE_MS,
  MOTION_CSS,
  MOTION_SCRIPT,
} from "../src/designs/factory/motion";
import { mazeRoute } from "../src/designs/factory/components";
import { CONTROL_COUNT, CONTROL_REGISTRY } from "../src/reclassify";
import { PHASES } from "../src/scoring";
import { ATTACK_CLASSES, controlsDefending, type AttackClassId } from "../src/threats";
import { ctxFor, RECORDS } from "./fixtures";
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

  test("the loop is GATED, not scroll-linked", () => {
    const inside = blockAfter(MOTION_CSS, SUPPORTS);
    expect(MOTION_CSS).toContain("animation-play-state: paused");
    expect(inside).toContain('.fy-loop[data-running="true"]');
    expect(inside).toContain("animation-play-state: running");
    // The measured cadence, in the one place the script reads it from.
    expect(LOOP_STAGE_MS).toBe(2500);
    expect(MOTION_SCRIPT).toContain(String(LOOP_STAGE_MS));
  });

  test("BOTH fallback branches paint the settled END state", () => {
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
      // the traces: drawn, every checkpoint reached
      expect(body, name).toContain("stroke-dashoffset: 0");
      expect(body, name).toContain("fill-opacity: 0.4");
      // the loop: static, its moving parts gone
      expect(body, name).toContain(".fy-packet");
      expect(body, name).toContain(".fy-context-pulse");
    }
  });

  test("nothing animates a name outside the catalogued set", () => {
    const named = new Set<string>();
    for (const m of CSS.matchAll(/animation-name:\s*([^;}]+)/g)) {
      for (const n of m[1]!.split(",")) named.add(n.trim());
    }
    for (const m of CSS.matchAll(/\banimation:\s*([a-z][\w-]*)\s+[\d.]/g)) {
      named.add(m[1]!.trim());
    }
    const allowed = new Set<string>([
      ...APERTURE_KEYFRAMES,
      ...LOOP_KEYFRAMES,
      "fy-tip-enter",
      "var(--popover-enter-animation-name)",
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

  test("the bar chart has nine bars whose heights order matches the counts", () => {
    const heights = attrOfEach(HOME, ".fy-bar", "height").map(Number);
    expect(heights.length).toBe(ATTACK_CLASSES.length);
    expect(heights.length).toBe(9);
    const counts = ATTACK_CLASSES.map((c) => controlsDefending(c.id as AttackClassId).length);
    const order = (xs: number[]) =>
      xs
        .map((v, i) => [v, i] as const)
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map(([, i]) => i);
    expect(order(heights)).toEqual(order(counts));
    // Proportional, not merely ordered: a chart that ranked right and scaled
    // wrong would pass an ordering check and still lie about the magnitudes.
    const unit = heights[0]! / counts[0]!;
    for (let i = 0; i < heights.length; i += 1) {
      expect(Math.abs(heights[i]! - counts[i]! * unit)).toBeLessThanOrEqual(1);
    }
  });

  test("the marked bars are the groups a maintainer alone can answer", () => {
    const marked = countOf(HOME, "fy-bar fy-bar-marked");
    const expected = ATTACK_CLASSES.filter((c) => {
      const ids = controlsDefending(c.id as AttackClassId);
      return ids.filter((id) => CONTROL_REGISTRY[id]!.cls === "C").length * 2 > ids.length;
    }).length;
    expect(marked).toBe(expected);
    expect(expected).toBeGreaterThan(0);
  });

  test("the maze carries one checkpoint per phase, at real path fractions", () => {
    const maze = HOME.slice(
      HOME.indexOf('class="fy-figure fy-maze"'),
      HOME.indexOf("</figure>", HOME.indexOf('class="fy-figure fy-maze"')),
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
      const r = mazeRoute(n);
      expect(r.stops.length, `n=${n}`).toBe(n);
      expect(r.stops[0]).toBe(0);
      expect(r.stops[r.stops.length - 1]).toBe(r.points.length - 1);
      for (const [x, y] of r.points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(532);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(374);
      }
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
    expect(countOf(tri, 'fill="none"')).toBe(1);
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
    expect(HOME).toContain("the signed record");
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

  test("the three font families are all requested, italics included", () => {
    expect(factory.head).toContain("family=Inter:wght@400;500");
    expect(factory.head).toContain("family=JetBrains+Mono:wght@400;500");
    // ital,wght — `document.fonts.check("italic …")` answers true for a
    // SYNTHESIZED italic, so asking for the axis is the only thing that loads
    // the real cut.
    expect(factory.head).toContain("family=Source+Serif+4:ital,");
    expect(factory.head).toContain("1,8..60,400");
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
