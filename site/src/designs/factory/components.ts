/**
 * Factory's instruments.
 *
 * EVERY DIAGRAM ON THIS PAGE IS RENDERED FROM THE DATA. The nine bars are
 * `controlsDefending(...).length`, the maze's checkpoints are `PHASES`, the
 * region count is `PHASES.length`, the node chips and the explorer cards are
 * `CONTROL_REGISTRY` grouped by phase, and every question is
 * `CHECK_QUESTIONS[id]`. Nothing below holds a hand-typed list of controls,
 * phases or attack groups, because a diagram that carries its own copy of the
 * taxonomy is a diagram that goes stale silently — and this site's whole
 * argument is that a picture should be evidence, not decoration.
 */
import { CHECK_QUESTIONS, questionFor } from "../../checks";
import { PHASES, PHASE_NAMES } from "../../scoring";
import { CONTROL_REGISTRY, type EvidenceClass } from "../../reclassify";
import { ATTACK_CLASSES, controlsDefending, type AttackClassId } from "../../threats";
import type { ControlRecord } from "../../schema";
import { escapeHtml } from "./layout";

/* ══ shared vocabulary ═══════════════════════════════════════════════════ */

/**
 * What each evidence class means, in words a first-time reader can hold.
 *
 * These sentences appear on the home page, where the site's own vocabulary is
 * banned, so none of them uses a retired term. They say what could be LOOKED
 * AT, never what was concluded.
 */
export const CLASS_PLAIN: Readonly<Record<EvidenceClass, string>> = {
  A: "Files the project commits. Anyone can read them.",
  Aprime: "The build files the project commits, read and never run.",
  B: "A live read of the project's settings on GitHub.",
  C: "Only a maintainer's own machine can answer this one.",
  M: "About the tool, not the project. Never counted either way.",
};

/** The same thing as a two- or three-word label for a chip or a legend. */
export const CLASS_SHORT: Readonly<Record<EvidenceClass, string>> = {
  A: "committed files",
  Aprime: "committed build files",
  B: "live settings",
  C: "the maintainer's machine",
  M: "about the tool",
};

/** Card type per evidence class — the explorer's four tints. */
const CARD_TYPE: Readonly<Record<EvidenceClass, string>> = {
  A: "observed",
  Aprime: "observed",
  B: "artifact",
  C: "local",
  M: "meta",
};

const REGION_TINTS = ["blue", "violet", "green", "grey"] as const;

/** The four card types, as the legend names them. Order is the registry's. */
const CARD_LEGEND: ReadonlyArray<{ type: string; label: string }> = [
  { type: "observed", label: "what the project commits" },
  { type: "artifact", label: "a live read of its settings" },
  { type: "local", label: "only a maintainer's machine" },
  { type: "meta", label: "about the tool, never counted" },
];

/** Every control id in the registry, in registry order. */
export function allControlIds(): string[] {
  return Object.keys(CONTROL_REGISTRY);
}

/** Registry controls for one phase, in registry order. */
export function controlsInPhase(phase: number): string[] {
  return allControlIds().filter((id) => CONTROL_REGISTRY[id]!.phase === phase);
}

/* ══ 4.10 the metric, with its hidden twin ═══════════════════════════════ */

/**
 * A statistic. The visible span is `aria-hidden`, and a visually-hidden twin
 * beside it carries the same value for a screen reader — the shape the
 * reference ships whether or not anything ever animates the number.
 *
 * NOTHING COUNTS UP. Three attempts to make the reference's figures animate
 * measured zero mutations across a 3.1 s scroll-in, so there is no counter to
 * copy and none is invented here.
 */
export function metric(value: string, caption: string): string {
  return `<div class="fy-metric">
    <strong class="fy-metric-value"><span class="fy-metric-final">${escapeHtml(
      value,
    )}</span><span aria-hidden="true">${escapeHtml(value)}</span></strong>
    <span class="fy-metric-caption">${escapeHtml(caption)}</span>
  </div>`;
}

/* ══ 4.3 the toggletip ═══════════════════════════════════════════════════ */

export interface TipOpts {
  /** Unique dom id for the panel. */
  id: string;
  /** Accessible name for the panel. */
  label: string;
  /** Small mono line at the top of the panel. */
  eyebrow?: string;
  /** The panel's body, already escaped/marked up. */
  body: string;
  /** An optional trailing links line, already marked up. */
  links?: string;
}

/** The panel half of a toggletip. Always in the DOM, `hidden` until asked for. */
export function tipPanel(o: TipOpts): string {
  return `<div class="fy-tip" id="${o.id}" role="dialog" aria-label="${escapeHtml(
    o.label,
  )}" data-state="closed" hidden>
      <button type="button" class="fy-tip-close" data-tip-close aria-label="Close">&#215;</button>
      ${o.eyebrow ? `<p class="fy-tip-title">${escapeHtml(o.eyebrow)}</p>` : ""}
      <div class="fy-tip-body">${o.body}</div>
      ${o.links ? `<p class="fy-tip-links">${o.links}</p>` : ""}
    </div>`;
}

/** The attributes a trigger needs to open one. */
export function tipTrigger(id: string): string {
  return `aria-haspopup="dialog" aria-controls="${id}" aria-expanded="false" data-state="closed"`;
}

/* ══ 4.6 node chips ══════════════════════════════════════════════════════ */

const ICONS: Readonly<Record<EvidenceClass, string>> = {
  A: '<path d="M5 2h7l3 3v13H5z"/><path d="M12 2v3h3"/>',
  Aprime: '<path d="M6 3v6"/><circle cx="6" cy="11" r="2"/><path d="M14 3v6"/><circle cx="14" cy="11" r="2"/><path d="M6 13v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2"/>',
  B: '<circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c2 2.4 2 11.6 0 14M10 3c-2 2.4-2 11.6 0 14"/>',
  C: '<rect x="3" y="4" width="14" height="9" rx="1"/><path d="M2 16h16"/>',
  M: '<circle cx="10" cy="10" r="7"/><path d="M10 9v5M10 6.5v.6"/>',
};

function icon(cls: EvidenceClass): string {
  return `<svg class="fy-node-icon" viewBox="0 0 20 20" width="20" height="20" fill="none"
      stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" focusable="false">${ICONS[cls]}</svg>`;
}

/** How a verdict is named on a chip, when the chip is bound to one record. */
const VERDICT_WORD: Readonly<Record<string, string>> = {
  pass: "pass",
  fail: "fail",
  gap: "gap",
  unverified: "no answer",
  info: "info",
};

export interface ChipOpts {
  /** Prefix for the tip's dom id, so two diagrams on one page cannot collide. */
  scope: string;
  /** Where the "what is this check" link points. */
  href: string;
  /** When set, the chip is bound to one record's verdict for that control. */
  verdicts?: ReadonlyMap<string, ControlRecord>;
}

/**
 * One 44px node chip: a real button that opens the check's question.
 *
 * On the repository sheet the same chip also carries that listing's verdict —
 * as colour AND as a shape AND as a word, so the three states survive
 * greyscale, print and a protanope. Unverified is hatched and says "no answer",
 * because it is a third state and never a failure.
 */
export function nodeChip(id: string, o: ChipOpts): string {
  const meta = CONTROL_REGISTRY[id]!;
  const tipId = `fy-tip-${o.scope}-${id}`;
  const row = o.verdicts?.get(id);
  const verdict = row ? row.scan_outcome : null;
  const verdictMark = verdict
    ? `<span class="fy-node-verdict">${escapeHtml(VERDICT_WORD[verdict] ?? verdict)}</span>`
    : "";
  const scoped = row && !row.in_scope ? " · not in scope for this listing" : "";
  const tipBody = `<p>${escapeHtml(questionFor(id))}</p>
      <p class="fy-tip-meta">${escapeHtml(CLASS_PLAIN[meta.cls])}${
        verdict
          ? ` This scan recorded <strong>${escapeHtml(
              VERDICT_WORD[verdict] ?? verdict,
            )}</strong>${escapeHtml(scoped)}.`
          : ""
      }</p>`;
  return `<div class="fy-tip-holder">
    <button type="button" class="fy-node"${
      verdict ? ` data-verdict="${escapeHtml(verdict)}"` : ""
    } ${tipTrigger(tipId)}>
      ${icon(meta.cls)}<span class="fy-node-label"><code>${escapeHtml(id)}</code></span>${verdictMark}
    </button>
    ${tipPanel({
      id: tipId,
      label: `${id} — what this check asks`,
      eyebrow: CLASS_SHORT[meta.cls],
      body: tipBody,
      links: `<a href="${o.href}">What every check asks &rarr;</a>`,
    })}
  </div>`;
}

/* ══ 4.6 the nested phase diagram ════════════════════════════════════════ */

export interface NestedOpts extends ChipOpts {
  /** The annotated heading over the whole frame. */
  title: string;
  /** The toggletip the heading opens. */
  titleTip: string;
  /** Optional per-record verdicts (repo sheet). */
  verdicts?: ReadonlyMap<string, ControlRecord>;
}

/**
 * "What one scan checks" — one tinted region per phase, each holding its own
 * checks as node chips inside a dashed repeated-group box.
 *
 * The region count is `PHASES.length` and the chips are the registry grouped by
 * phase, so a seventh phase or a fifty-fifth control appears here the moment it
 * exists in the data, and cannot fail to.
 */
export function nestedDiagram(o: NestedOpts): string {
  const titleTipId = `fy-tip-${o.scope}-frame`;
  const regions = PHASES.map((phase, i) => {
    const ids = controlsInPhase(phase);
    const tint = REGION_TINTS[i % REGION_TINTS.length]!;
    return `<div class="fy-region" data-tint="${tint}" data-phase="${phase}">
      <div class="fy-region-head">
        <h4 class="fy-region-title">${escapeHtml(PHASE_NAMES[phase] ?? `Phase ${phase}`)}</h4>
        <span class="fy-repeat-count">P${phase}</span>
      </div>
      <p class="fy-region-note">${ids.length} ${ids.length === 1 ? "check" : "checks"} run here.</p>
      <div class="fy-repeat">
        <p class="fy-repeat-label"><span>One chip per check</span>
        <span class="fy-repeat-count" aria-hidden="true">1&hellip;${ids.length}</span></p>
        <div class="fy-nodes">
${ids.map((id) => nodeChip(id, o)).join("\n")}
        </div>
      </div>
    </div>`;
  }).join("\n");
  return `<figure class="fy-network" id="${o.scope}-diagram">
  <div class="fy-network-head">
    <span class="fy-tip-holder">
      <button type="button" class="fy-annotate" ${tipTrigger(titleTipId)}>${escapeHtml(o.title)}</button>
      ${tipPanel({
        id: titleTipId,
        label: o.title,
        body: `<p>${escapeHtml(o.titleTip)}</p>`,
      })}
    </span>
  </div>
  <div class="fy-regions">
${regions}
  </div>
</figure>`;
}

/* ══ 4.7 the overview groups ═════════════════════════════════════════════ */

/** Which evidence classes each lane can answer, from the merge rules. */
const LANE_CLASSES: ReadonlyArray<{
  key: string;
  name: string;
  line: string;
  classes: readonly EvidenceClass[];
  emphasis?: boolean;
}> = [
  {
    key: "external",
    name: "A scan from outside",
    line: "Anyone can ask for a public repository to be read. It sees what anyone can see.",
    classes: ["A", "Aprime", "B"],
  },
  {
    key: "action",
    name: "The project's own build",
    line: "The same scan, run in the project's CI, and signed there so the signature says which build made it.",
    classes: ["A", "Aprime", "B"],
  },
  {
    key: "local",
    name: "A maintainer's machine",
    line: "The only place the last group can be looked at. A maintainer runs it and signs the result.",
    classes: ["A", "Aprime", "B", "C"],
    emphasis: true,
  },
];

/**
 * "Who can see what" — the three lanes, with the check groups each one can
 * answer and how many checks sit in each group.
 *
 * The emphasised group is the LOCAL lane, and that is the argument the diagram
 * is making: sixteen of the fifty-four checks describe a machine no scan from
 * outside will ever reach.
 */
export function overviewDiagram(h: (p: string) => string): string {
  const counted = (cls: EvidenceClass) =>
    allControlIds().filter((id) => CONTROL_REGISTRY[id]!.cls === cls).length;
  const rows = LANE_CLASSES.map(
    (lane) => `<div class="fy-ov-row">
    <div class="fy-ov-label">
      <h3>${escapeHtml(lane.name)}</h3>
      <p>${escapeHtml(lane.line)}</p>
    </div>
    <div class="fy-ov-group"${lane.emphasis ? ' data-emphasis="true"' : ""}>
${lane.classes
  .map(
    (cls) => `      <div class="fy-ov-panel">
        <h4>${escapeHtml(CLASS_SHORT[cls])}</h4>
        <p><span class="fy-ov-count">${counted(cls)}</span> checks &middot; ${escapeHtml(
          CLASS_PLAIN[cls],
        )}</p>
      </div>`,
  )
  .join("\n")}
    </div>
  </div>`,
  ).join("\n");
  return `<figure class="fy-overview" id="who-sees-what">
${rows}
  <figcaption class="fy-note">Two of the three read the same things. The third reads
  something nobody else can. <a href="${h("methodology/#local")}">How that is checked &rarr;</a></figcaption>
</figure>`;
}

/* ══ 4.5 the bar chart ═══════════════════════════════════════════════════ */

const BAR_W = 44;
const BAR_GAP = 12;
const PLOT_TOP = 44;
const PLOT_BOTTOM = 292;
const AXIS_X = 44;
const BAR_X0 = 60;

/**
 * "Nine ways in, and how many checks answer each."
 *
 * STATIC, deliberately. The reference's equivalent chart animates nothing — no
 * keyframes, no transitions, zero mutations across every scroll sample — and
 * drawing it once is the honest thing anyway: the numbers do not change while
 * you look at them.
 *
 * The accent marks the groups whose defence is MOSTLY checks only a
 * maintainer's own machine can answer. That is computed from the registry, not
 * chosen: it is the same fact the overview diagram makes, said again with bars.
 */
export function barChart(): string {
  const data = ATTACK_CLASSES.map((c) => {
    const ids = controlsDefending(c.id as AttackClassId);
    const localOnly = ids.filter((id) => CONTROL_REGISTRY[id]!.cls === "C").length;
    return { id: c.id, name: c.name, n: ids.length, marked: localOnly * 2 > ids.length };
  });
  const max = Math.max(...data.map((d) => d.n), 1);
  const unit = (PLOT_BOTTOM - PLOT_TOP) / max;
  const bars = data
    .map((d, i) => {
      const x = BAR_X0 + i * (BAR_W + BAR_GAP);
      const h = Math.round(d.n * unit);
      const y = PLOT_BOTTOM - h;
      return `    <rect class="fy-bar${d.marked ? " fy-bar-marked" : ""}" x="${x}" y="${y}"
      width="${BAR_W}" height="${h}"><title>${escapeHtml(
        `${d.id} ${d.name}: ${d.n} checks`,
      )}</title></rect>`;
    })
    .join("\n");
  const labels = data
    .map((d, i) => {
      const x = BAR_X0 + i * (BAR_W + BAR_GAP) + BAR_W / 2;
      const h = Math.round(d.n * unit);
      return `      <text class="fy-data-label" x="${x}" y="${
        PLOT_BOTTOM - h - 10
      }" text-anchor="middle">${d.n}</text>
      <text class="fy-data-label" x="${x}" y="${
        PLOT_BOTTOM + 22
      }" text-anchor="middle">${d.id}</text>`;
    })
    .join("\n");
  const marked = data.filter((d) => d.marked);
  const markedNames = marked.map((d) => d.id).join(" and ");
  const width = BAR_X0 + data.length * (BAR_W + BAR_GAP) + 20;
  return `<div class="fy-chart-grid">
  <figure class="fy-chart-figure">
    <svg class="fy-plot" viewBox="0 0 ${width} 320" role="img"
      aria-label="How many of the 54 checks defend each of the nine attack groups">
      <title>Checks that defend each attack group</title>
      <line class="fy-baseline" x1="${AXIS_X}" y1="${PLOT_TOP - 8}" x2="${AXIS_X}" y2="${PLOT_BOTTOM}"></line>
      <line class="fy-baseline" x1="${AXIS_X}" y1="${PLOT_BOTTOM}" x2="${width - 12}" y2="${PLOT_BOTTOM}"></line>
${bars}
      <g class="fy-label-scale">
      <text class="fy-axis-label" x="${AXIS_X - 14}" y="${
        (PLOT_TOP + PLOT_BOTTOM) / 2
      }" text-anchor="middle" transform="rotate(-90 ${AXIS_X - 14} ${
        (PLOT_TOP + PLOT_BOTTOM) / 2
      })">checks that defend it</text>
${labels}
      </g>
    </svg>
  </figure>
  <div class="fy-chart-copy">
    <h2>Nine ways in, and how many checks answer each.</h2>
    <p class="fy-beat-body">The groups are drawn from the public catalogues of what has
    actually gone wrong. Every bar is the number of checks mapped to that group. A tall bar
    is not safety. It is how many questions we know to ask.</p>
    <p class="fy-chart-caption">${escapeHtml(
      marked.length === 0
        ? "No group is defended mostly by checks a maintainer alone can answer."
        : `${markedNames} stand out. Most of what defends them can only be answered on a maintainer's own machine, so an outside scan leaves those questions open.`,
    )}</p>
  </div>
</div>`;
}

/* ══ 4.4 the traced figures ══════════════════════════════════════════════ */

const STEP = 40;
const M_X0 = 46;
const M_XMAX = 486;
const M_Y0 = 46;
const M_YMAX = 326;

interface Route {
  points: Array<[number, number]>;
  /** Index into `points` of each checkpoint, in order. */
  stops: number[];
}

/**
 * A deterministic orthogonal route with exactly `n` checkpoints.
 *
 * It serpentines: run across, drop a row, run back, drop again. The number of
 * horizontal runs falls out of the checkpoint count, and the rows are spread
 * over the same vertical extent whatever that count is — so this draws a
 * sensible figure for five phases or for eight, and the test that the
 * checkpoints equal `PHASES.length` can never be satisfied by a coincidence.
 */
export function mazeRoute(n: number): Route {
  const legs = Math.max(1, n - 1);
  const hRuns = Math.ceil(legs / 2);
  const rows: number[] = [];
  for (let i = 0; i < hRuns; i += 1) {
    const raw = hRuns === 1 ? M_Y0 : M_Y0 + ((M_YMAX - M_Y0) * i) / (hRuns - 1);
    rows.push(M_Y0 + Math.round((raw - M_Y0) / STEP) * STEP);
  }
  const points: Array<[number, number]> = [];
  const stops: number[] = [];
  let x = M_X0;
  let y = rows[0]!;
  let row = 0;
  let dir = 1;
  points.push([x, y]);
  stops.push(0);
  for (let leg = 0; leg < legs; leg += 1) {
    if (leg % 2 === 0) {
      const target = dir > 0 ? M_XMAX : M_X0;
      while (x !== target) {
        x += dir * STEP;
        points.push([x, y]);
      }
      dir = -dir;
    } else {
      row += 1;
      const target = rows[Math.min(row, rows.length - 1)]!;
      while (y < target) {
        y += STEP;
        points.push([x, y]);
      }
    }
    stops.push(points.length - 1);
  }
  return { points, stops: stops.slice(0, n) };
}

/** A tiny deterministic hash — the maze must be identical on every build. */
function wallHash(i: number, j: number, k: number): number {
  let v = (i * 73856093) ^ (j * 19349663) ^ (k * 83492791);
  v = (v ^ (v >>> 13)) >>> 0;
  return (v * 2654435761) >>> 0;
}

/**
 * Walls for the maze: a lattice of 40-unit cell edges, drawn or not by a hash
 * of the cell's own coordinates, with every edge the route crosses removed so
 * the route is always a legal path through it.
 */
function mazeWalls(route: Route): string {
  const cols = Math.round((M_XMAX - M_X0) / STEP) + 1;
  const rows = Math.round((M_YMAX - M_Y0) / STEP) + 1;
  const open = new Set<string>();
  for (let i = 1; i < route.points.length; i += 1) {
    const [ax, ay] = route.points[i - 1]!;
    const [bx, by] = route.points[i]!;
    const ai = Math.round((ax - M_X0) / STEP);
    const aj = Math.round((ay - M_Y0) / STEP);
    const bi = Math.round((bx - M_X0) / STEP);
    const bj = Math.round((by - M_Y0) / STEP);
    if (ai === bi) open.add(`h:${ai}:${Math.min(aj, bj)}`);
    else open.add(`v:${Math.min(ai, bi)}:${aj}`);
  }
  const d: string[] = [];
  const left = M_X0 - STEP / 2;
  const top = M_Y0 - STEP / 2;
  const right = left + cols * STEP;
  const bottom = top + rows * STEP;
  d.push(`M${left} ${top}H${right}V${bottom}H${left}Z`);
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      if (i < cols - 1 && !open.has(`v:${i}:${j}`) && wallHash(i, j, 1) % 100 < 44) {
        const x = left + (i + 1) * STEP;
        d.push(`M${x} ${top + j * STEP}v${STEP}`);
      }
      if (j < rows - 1 && !open.has(`h:${i}:${j}`) && wallHash(i, j, 2) % 100 < 44) {
        const y = top + (j + 1) * STEP;
        d.push(`M${left + i * STEP} ${y}h${STEP}`);
      }
    }
  }
  return d.join(" ");
}

interface TracedOpts {
  /** Extra class: `fy-maze` or `fy-triangle`. */
  kind: string;
  label: string;
  viewBox: string;
  /** Everything drawn behind the trace. */
  structure: string;
  /** The trace's own `d`. */
  trace: string;
  /** Checkpoints, each with its path fraction and its name. */
  nodes: Array<{ at: number; x: number; y: number; name: string; hollow?: boolean }>;
  /** Anything drawn on top (labels). */
  overlay?: string;
  /** Rendered under the figure as a readable list. */
  legend?: boolean;
}

/**
 * The traced-figure component, shared by the maze and the triangle.
 *
 * The technique, copied: the path declares `pathLength="1"` and CSS sets
 * `stroke-dasharray: 1px`, so writing `stroke-dashoffset = 1 - progress` draws
 * exactly that fraction of it. Node state is driven off the SAME progress at
 * each node's own path fraction, so a node can never light before the line
 * reaches it.
 *
 * The markup carries the FINISHED state: offset 0, every node reached. The
 * script winds it back to 0 only once it knows the reader wants motion.
 */
function tracedFigure(o: TracedOpts): string {
  const nodes = o.nodes
    .map(
      (n, i) => `      <g class="fy-checkpoint-group" data-node-at="${n.at.toFixed(
        4,
      )}" data-reached="true">
        <circle class="fy-checkpoint-base" cx="${n.x}" cy="${n.y}" r="7"></circle>
        <circle class="${o.kind === "fy-triangle" ? "fy-speed-node" : "fy-checkpoint"}${
          n.hollow ? " fy-node-hollow" : ""
        }" cx="${n.x}" cy="${n.y}" r="${n.hollow ? 7 : 6}"><title>${escapeHtml(
          `${i + 1}. ${n.name}`,
        )}</title></circle>
      </g>`,
    )
    .join("\n");
  const legend = o.legend
    ? `  <ol class="fy-trace-legend">
${o.nodes
  .map(
    (n, i) =>
      `    <li data-legend-at="${n.at.toFixed(4)}" data-reached="true"><span class="fy-legend-no">${
        i + 1
      }</span>${escapeHtml(n.name)}</li>`,
  )
  .join("\n")}
  </ol>`
    : "";
  return `<figure class="fy-figure ${o.kind}" data-figure-progress="1" data-figure-mode="static">
  <svg class="fy-drawing" viewBox="${o.viewBox}" role="img" aria-label="${escapeHtml(o.label)}">
    <title>${escapeHtml(o.label)}</title>
${o.structure}
    <path class="fy-trace" d="${o.trace}" pathLength="1" style="stroke-dasharray:1px"></path>
${nodes}
${o.overlay ?? ""}
  </svg>
${legend}
</figure>`;
}

/**
 * "One scan walks the whole lifecycle" — the maze.
 *
 * Six checkpoints because there are six phases, named from `PHASE_NAMES` in
 * `PHASES` order, listed under the figure so the order is readable without
 * hovering anything.
 */
export function mazeFigure(): string {
  const route = mazeRoute(PHASES.length);
  const total = route.points.length - 1;
  const d = route.points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ");
  return tracedFigure({
    kind: "fy-maze",
    label: `A single route through ${PHASES.length} checkpoints, one per phase of the scan`,
    viewBox: "0 0 532 374",
    structure: `    <path class="fy-structure" d="${mazeWalls(route)}"></path>`,
    trace: d,
    legend: true,
    nodes: route.stops.map((idx, i) => {
      const phase = PHASES[i]!;
      const [x, y] = route.points[idx]!;
      return { at: idx / total, x, y, name: PHASE_NAMES[phase] ?? `Phase ${phase}` };
    }),
  });
}

/** The three evidence lanes, as the triangle's three nodes. */
const LANE_NODES = [
  { name: "A scan from outside", hollow: false },
  { name: "The project's own build", hollow: false },
  { name: "A maintainer's own machine", hollow: true },
] as const;

/**
 * "Three ways a scan gets run" — the triangle.
 *
 * Two nodes filled and one outlined, because two of the three lanes produce
 * evidence anybody can go and check, and the third produces evidence only the
 * maintainer can make. Outlined is not weaker-looking by accident: the local
 * lane IS weaker than the action lane, and the site says so everywhere.
 */
export function triangleFigure(): string {
  const pts: Array<[number, number]> = [
    [70, 92],
    [510, 92],
    [290, 286],
  ];
  const len = (a: [number, number], b: [number, number]) =>
    Math.hypot(b[0] - a[0], b[1] - a[1]);
  const l1 = len(pts[0]!, pts[1]!);
  const l2 = len(pts[1]!, pts[2]!);
  const l3 = len(pts[2]!, pts[0]!);
  const total = l1 + l2 + l3;
  const at = [0, l1 / total, (l1 + l2) / total];
  const overlay = `    <g class="fy-label-scale">
      <text class="fy-speed-label" x="70" y="66" text-anchor="start">${escapeHtml(
        LANE_NODES[0].name,
      )}</text>
      <text class="fy-speed-label" x="510" y="66" text-anchor="end">${escapeHtml(
        LANE_NODES[1].name,
      )}</text>
      <text class="fy-speed-label" x="290" y="314" text-anchor="middle">${escapeHtml(
        LANE_NODES[2].name,
      )}</text>
    </g>`;
  return tracedFigure({
    kind: "fy-triangle",
    label: "Three evidence lanes, two of them open to anyone and the third only to a maintainer",
    viewBox: "0 0 580 330",
    structure: `    <path class="fy-structure" d="M70 92L510 92L290 286Z"></path>`,
    trace: "M70 92L510 92L290 286Z",
    overlay,
    nodes: pts.map((p, i) => ({
      at: at[i]!,
      x: p[0],
      y: p[1],
      name: LANE_NODES[i]!.name,
      hollow: LANE_NODES[i]!.hollow,
    })),
  });
}

/* ══ the interactive attack list ═════════════════════════════════════════ */

/**
 * A1–A9 as an expander list: the group's plain line, the checks that defend it,
 * and ONE real incident of that shape.
 *
 * The honesty contract in `src/threats.ts` governs every sentence here. The
 * incident sits in its own row and never inside a sentence about a repository:
 * "X had no build receipts; this project has no build receipts" is a syllogism
 * a reader finishes as a prediction, and the scan measured nothing that would
 * support it.
 */
export function attackList(h: (p: string) => string): string {
  const items = ATTACK_CLASSES.map((c) => {
    const ids = controlsDefending(c.id as AttackClassId);
    const panelId = `fy-attack-${c.id.toLowerCase()}`;
    const inc = c.incidents[0];
    // THE INCIDENT'S OWN SENTENCE GETS ITS OWN BLOCK. Not a style choice: a
    // block that carries any direct text of its own joins every run inside it
    // into ONE sentence, so a heading and a date welded onto a 30-word
    // narrative read as a 37-word one — and `test/prose.test.ts` measures the
    // rendered page, not the source. The label and the link sit in their own
    // paragraph so the account stays the length it actually is.
    const incident = inc
      ? `<div class="fy-incident">
        <p><span class="fy-attack-label">When it happened</span>
        <a href="${escapeHtml(inc.url)}">${escapeHtml(inc.title)}</a>
        <span class="fy-incident-when">${escapeHtml(inc.when)}</span>${
          inc.sourced === "reported" ? `<span class="fy-reported">reported</span>` : ""
        }</p>
        <p>${escapeHtml(inc.what)}</p>
      </div>`
      : "";
    return `  <li class="fy-attack">
    <button type="button" class="fy-attack-trigger" data-expander
      aria-controls="${panelId}" aria-expanded="false">
      <span class="fy-attack-id">${c.id}</span>
      <span class="fy-attack-name">${escapeHtml(c.name)}</span>
      <span class="fy-attack-mark" aria-hidden="true">${ids.length} checks</span>
    </button>
    <div class="fy-attack-panel" id="${panelId}" hidden>
      <p class="fy-attack-line">${escapeHtml(c.line)}</p>
      <p class="fy-attack-checks"><span class="fy-attack-label">Checks that defend it</span>
      ${ids.map((id) => `<code>${escapeHtml(id)}</code>`).join(", ")}</p>
      ${incident}
      <p class="fy-attack-checks"><a href="${h(
        `methodology/#threat-${c.id.toLowerCase()}`,
      )}">Read the whole group &rarr;</a></p>
    </div>
  </li>`;
  }).join("\n");
  return `<ul class="fy-attacks">
${items}
</ul>`;
}

/* ══ 4.8 the operating loop ══════════════════════════════════════════════ */

export interface LoopStage {
  id: string;
  no: string;
  title: string;
  body: string;
}

/**
 * The five stages, as SSCSB actually runs them.
 *
 * A CIRCLE IS A NARROW MEASURE. Each caption has about twenty characters a line
 * inside a 193px disc, so these are written to the reference's own register —
 * three or four words — and the sentence each one compresses is on the page
 * around it, not squeezed into the ring.
 */
export const LOOP_STAGES: readonly LoopStage[] = [
  { id: "scan", no: "01", title: "Scan", body: "Clone, never execute" },
  { id: "record", no: "02", title: "Record", body: "Answered, or left open" },
  { id: "review", no: "03", title: "Review", body: "A person reads it" },
  { id: "answer", no: "04", title: "Answer", body: "Run it, then sign it" },
  { id: "rescan", no: "05", title: "Rescan", body: "One commit, one snapshot" },
];

function loopCard(s: LoopStage, i: number, n: number): string {
  const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
  const x = 50 + 30 * Math.cos(angle);
  const y = 50 + 30 * Math.sin(angle);
  return `    <li class="fy-loop-card" data-stage="${s.id}"
      style="--fy-circle-x:${x.toFixed(3)}%;--fy-circle-y:${y.toFixed(3)}%">
      <svg class="fy-card-ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle cx="50" cy="50" r="49.5" pathLength="150"></circle>
      </svg>
      <span class="fy-active-ring" aria-hidden="true"></span>
      <span class="fy-arrival-ring" aria-hidden="true"></span>
      <span class="fy-card-meta">${s.no}</span>
      <span class="fy-card-title">${escapeHtml(s.title)}</span>
      <span class="fy-card-body">${escapeHtml(s.body)}</span>
    </li>`;
}

function loopConnector(i: number, n: number, edge: string): string {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180);
  const b = (-90 + (360 / n) * ((i + 1) % n)) * (Math.PI / 180);
  const ax = 50 + 30 * Math.cos(a);
  const ay = 50 + 30 * Math.sin(a);
  const bx = 50 + 30 * Math.cos(b);
  const by = 50 + 30 * Math.sin(b);
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const deg = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  return `    <div class="fy-connector" data-loop-edge="${edge}"
      style="--fy-edge-x:${mx.toFixed(3)}%;--fy-edge-y:${my.toFixed(3)}%;--fy-edge-a:${deg.toFixed(
        2,
      )}deg">
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path class="fy-edge-base" d="M 8 60 H 112"></path>
        <path class="fy-edge-highlight" d="M 8 60 H 112"></path>
        <g class="fy-packet-group"><circle class="fy-packet" r="3.5"></circle></g>
      </svg>
      <span class="fy-return-packet" aria-hidden="true"></span>
    </div>`;
}

/**
 * The five-stage operating loop.
 *
 * NOT INTERACTIVE, and that is copied too: the reference's loop autoplays and
 * offers no controls, so a reader never has to discover that it is a thing they
 * could drive. It is gated on being in view — every animation is declared
 * `paused` and only `[data-running="true"]` releases it — and it advances one
 * stage every 2.5 s, which is 12.5 s for a whole pass.
 *
 * The resting frame is in the markup, so a reader with JS off or motion turned
 * down sees five stages, a centre, and nothing moving.
 */
export function loopFigure(): string {
  const n = LOOP_STAGES.length;
  const cards = LOOP_STAGES.map((s, i) => loopCard(s, i, n)).join("\n");
  const edges = LOOP_STAGES.map((s, i) => loopConnector(i, n, s.id)).join("\n");
  return `<figure class="fy-loop" data-loop-stage="${LOOP_STAGES[0]!.id}"
  data-loop-status="paused" data-running="false" data-pulse-running="false"
  data-loop-completed-passes="0" aria-label="How a listing is produced, and kept current">
  <div class="fy-loop-stage fy-compact">
    <div class="fy-process">
      <ol class="fy-loop-cards">
${cards}
      </ol>
      <div class="fy-connections">
${edges}
      </div>
      <div class="fy-context-store">
        <span class="fy-context-pattern" aria-hidden="true"></span>
        <span class="fy-context-pulse" aria-hidden="true"></span>
        <span class="fy-context-title">the signed record</span>
        <span class="fy-context-sub">scan-record.json + signature</span>
      </div>
    </div>
  </div>
  <figcaption class="fy-loop-caption">Shared context</figcaption>
</figure>`;
}

/* ══ 4.9 the segmented explorer ══════════════════════════════════════════ */

/**
 * "Every check" — six segments, one per phase, and one typed card per control.
 *
 * The segmented control is real radio inputs with a checked-label background
 * that cross-fades in 0.15 s. THERE IS NO SLIDING THUMB: the reference has
 * none, and a replica that animates a translating pill does not match.
 */
export function explorer(h: (p: string) => string): string {
  const name = "fy-phase-seg";
  const options = PHASES.map((phase, i) => {
    const panelId = `fy-panel-${phase}`;
    return `    <label class="fy-seg-option" data-state="${i === 0 ? "on" : "off"}">
      <input class="fy-seg-input" type="radio" name="${name}" value="${phase}"
        aria-controls="${panelId}"${i === 0 ? " checked" : ""}>
      <span class="fy-seg-label">${escapeHtml(PHASE_NAMES[phase] ?? `Phase ${phase}`)}</span>
    </label>`;
  }).join("\n");
  const panels = PHASES.map((phase) => {
    const ids = controlsInPhase(phase);
    const cards = ids
      .map((id) => {
        const meta = CONTROL_REGISTRY[id]!;
        const tipId = `fy-tip-card-${id}`;
        return `      <div class="fy-tip-holder">
        <button type="button" class="fy-refcard" data-reference-type="${CARD_TYPE[meta.cls]}"
          ${tipTrigger(tipId)}>
          <span class="fy-refcard-id"><code>${escapeHtml(id)}</code></span>
          <span class="fy-refcard-q">${escapeHtml(CHECK_QUESTIONS[id] ?? "")}</span>
        </button>
        ${tipPanel({
          id: tipId,
          label: `${id} — what this check asks`,
          eyebrow: CLASS_SHORT[meta.cls],
          body: `<p>${escapeHtml(questionFor(id))}</p>
      <p class="fy-tip-meta">${escapeHtml(CLASS_PLAIN[meta.cls])}</p>`,
          links: `<a href="${h("methodology/#every-check")}">What every check asks &rarr;</a>`,
        })}
      </div>`;
      })
      .join("\n");
    return `  <div class="fy-panel-port" id="fy-panel-${phase}" tabindex="0" role="group"
    aria-label="${escapeHtml(PHASE_NAMES[phase] ?? `Phase ${phase}`)}">
    <p class="fy-panel-note">${ids.length} ${
      ids.length === 1 ? "check" : "checks"
    } run in this phase. Each card opens the question that check answers.</p>
    <div class="fy-cards">
${cards}
    </div>
  </div>`;
  }).join("\n");
  // The legend paints the CARD's own tokens, not a second opinion about them.
  // Keyed off the evidence class it mapped `meta` and `artifact` to the same
  // grey, so two of the four types were indistinguishable in the one place that
  // exists to distinguish them.
  const legend = CARD_LEGEND.map(
    (t) =>
      `<span><span class="fy-legend-swatch" data-reference-type="${t.type}"></span>${escapeHtml(
        t.label,
      )}</span>`,
  ).join("\n    ");
  return `<div class="fy-explorer">
  <div class="fy-segmented" role="radiogroup" aria-label="Pick a phase" data-segmented>
${options}
  </div>
${panels}
  <p class="fy-legend">
    ${legend}
  </p>
</div>`;
}

/* ══ 4.11 the scrollable table wrap ══════════════════════════════════════ */

/**
 * A wide table that can be scrolled sideways — by mouse, by thumb, and by
 * keyboard, which is why it is focusable and carries a focus ring.
 *
 * It is deliberately a scroll container, so `overflow: clip` is wrong here.
 * Everywhere else on this page that wanted "do not let this bleed" got `clip`
 * instead, because `overflow: hidden` silently makes the element the containing
 * block for anything sticky inside it.
 */
export function tableWrap(inner: string, label: string): string {
  return `<div class="fy-wrap" tabindex="0" role="region" aria-label="${escapeHtml(label)}"
  data-overflow-start="false" data-overflow-end="false">
${inner}
</div>`;
}

/* ══ the pill nav ════════════════════════════════════════════════════════ */

export interface Chapter {
  id: string;
  no: string;
  label: string;
}

/**
 * The sticky numbered pill nav.
 *
 * `z-index: 20`, `overflow-x: auto` with contained overscroll, and the active
 * pill marked with `aria-current="location"` by the script. The background
 * cross-fades over 0.25 s — a TIME transition, not a scroll-linked one, which
 * was settled by measurement: holding a scroll position and re-reading always
 * returned a binary state.
 */
export function chapterNav(chapters: readonly Chapter[]): string {
  const items = chapters
    .map(
      (c) => `  <a href="#${c.id}"><span aria-hidden="true">${c.no}</span>${escapeHtml(
        c.label,
      )}</a>`,
    )
    .join("\n");
  return `<nav class="fy-chapters" aria-label="Sections">
${items}
</nav>`;
}
