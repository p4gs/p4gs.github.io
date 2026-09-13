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
import { CONTROL_COUNT, CONTROL_REGISTRY, type EvidenceClass } from "../../reclassify";
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

/**
 * The chip's icon: 20 × 20, one distinct glyph per evidence class, coloured by
 * the class's own tint edge.
 *
 * The glyph is what carries the class here, not a texture and not a shade of
 * grey — a reader who has met the key once can read a chip's source without
 * opening it. `data-cls` is on the element so a test can prove the five glyphs
 * are five glyphs rather than one drawn five times.
 */
function icon(cls: EvidenceClass): string {
  return `<svg class="fy-node-icon" data-cls="${cls}" viewBox="0 0 20 20" width="20" height="20"
      fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[cls]}</svg>`;
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
  /**
   * Control ids whose countable verdict came SOLELY from a maintainer's signed
   * local record (`ctx.localTrust.resolved`).
   *
   * A green PASS here is the repository's owner asserting his own posture on
   * his own laptop; a green PASS beside it may be something an independent scan
   * observed. `types.ts` requires the local mark to read as WEAKER than the
   * action lane, and the header badge and the deep panel both honour that — but
   * the ROW is the only place a reader decides whether to trust one control,
   * and it is where the provenance was being dropped.
   */
  localResolved?: ReadonlySet<string>;
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
  // Only a COUNTABLE verdict can have come from the local lane. Marking a
  // "no answer" chip as locally resolved would be two contradictory claims in
  // one chip, and a merge that produced that pairing is a data fault, not a
  // thing to draw.
  const countable =
    verdict === "pass" || verdict === "fail" || verdict === "gap";
  const local = countable && o.localResolved?.has(id) === true;
  const verdictMark = verdict
    ? `<span class="fy-node-verdict">${escapeHtml(VERDICT_WORD[verdict] ?? verdict)}</span>${
        local ? `<span class="fy-node-lane">local</span>` : ""
      }`
    : "";
  const scoped = row && !row.in_scope ? " · not in scope for this listing" : "";
  const tipBody = `<p>${escapeHtml(questionFor(id))}</p>
      <p class="fy-tip-meta">${escapeHtml(CLASS_PLAIN[meta.cls])}${
        verdict
          ? ` This scan recorded <strong>${escapeHtml(
              VERDICT_WORD[verdict] ?? verdict,
            )}</strong>${escapeHtml(scoped)}.`
          : ""
      }${
        local
          ? " That verdict comes from a record the maintainer signed on their own machine, and from no other source."
          : ""
      }</p>`;
  return `<div class="fy-tip-holder">
    <button type="button" class="fy-node"${
      verdict ? ` data-verdict="${escapeHtml(verdict)}"` : ""
    }${local ? ` data-lane="local"` : ""} ${tipTrigger(tipId)}>
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
/**
 * Which slot of the irregular composition each phase takes, by control count.
 *
 * The reference's grid is not a row of equal boxes: one tall narrow column on
 * the left, two stacked regions in a wide middle, two stacked narrow ones on
 * the right, and one full-width short region across the bottom. Ours is the
 * same shape, and which phase lands where is COMPUTED from how many checks it
 * holds — the two largest take the wide middle, the smallest takes the short
 * full-width strip, and the rest fill the narrow columns. A seventh phase, or a
 * phase that grows past its neighbours, rearranges the diagram by itself.
 */
const SLOTS = ["wide2", "wide1", "narrowA", "narrowB", "narrowC", "full"] as const;

export function slotForPhases(counts: ReadonlyMap<number, number>): Map<number, string> {
  const ranked = [...counts.keys()].sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a - b,
  );
  const out = new Map<number, string>();
  // The two largest take the wide middle column (the larger of them below, as
  // the reference stacks its short Control plane over its tall Data plane), the
  // next three the narrow columns, and anything beyond that the full-width
  // strip — which is a `grid-column: 1 / -1` rather than a named area, so a
  // seventh phase adds a row instead of stacking on top of the sixth.
  ranked.forEach((phase, i) => out.set(phase, SLOTS[i] ?? "full"));
  return out;
}

export function nestedDiagram(o: NestedOpts): string {
  const titleTipId = `fy-tip-${o.scope}-frame`;
  const counts = new Map(PHASES.map((p) => [p, controlsInPhase(p).length]));
  const slots = slotForPhases(counts);
  const regions = PHASES.map((phase) => {
    const ids = controlsInPhase(phase);
    const localOnly = ids.filter((id) => CONTROL_REGISTRY[id]!.cls === "C");
    const rest = ids.filter((id) => CONTROL_REGISTRY[id]!.cls !== "C");
    // On the sheet the chips carry verdicts, so "N checks belong to this phase"
    // alone sits above a column of NO ANSWER chips and reads as a contradiction.
    // The answered split comes from the record, not from the taxonomy.
    let note = `${ids.length} ${ids.length === 1 ? "check belongs" : "checks belong"} to this phase.`;
    if (o.verdicts) {
      const rows = ids.map((id) => o.verdicts!.get(id)).filter((r) => r !== undefined);
      const answered = rows.filter(
        (r) => r!.scan_outcome === "pass" || r!.scan_outcome === "fail" || r!.scan_outcome === "gap",
      ).length;
      const open = rows.filter((r) => r!.scan_outcome === "unverified").length;
      note = `${ids.length} ${
        ids.length === 1 ? "check belongs" : "checks belong"
      } to this phase &middot; ${answered} answered &middot; ${open} with no answer.`;
    }
    const stack =
      localOnly.length === 0
        ? ""
        : `      <div class="fy-stack">
        <div class="fy-repeat" data-group="local">
          <p class="fy-repeat-label"><span>Only a maintainer's machine can answer these</span>
          <span class="fy-repeat-count" aria-hidden="true">1&hellip;${localOnly.length}</span></p>
          <div class="fy-nodes">
${localOnly.map((id) => nodeChip(id, o)).join("\n")}
          </div>
        </div>
      </div>`;
    return `<div class="fy-region" data-slot="${slots.get(phase) ?? "full"}" data-phase="${phase}">
      <div class="fy-region-head">
        <h4 class="fy-region-title">${escapeHtml(PHASE_NAMES[phase] ?? `Phase ${phase}`)}</h4>
      </div>
      <p class="fy-region-note">${note}</p>
      <div class="fy-nodes">
${rest.map((id) => nodeChip(id, o)).join("\n")}
      </div>
${stack}
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

/** The terse `·`-list each shared group gets, instead of a sentence. */
const CLASS_TERSE: Readonly<Record<EvidenceClass, string>> = {
  A: "the tree at one commit · policy files · never executed",
  Aprime: "the project's own build files · read, never run",
  B: "branch rules · repository settings · read live",
  C: "signing keys · local hooks · what no outside scan reaches",
  M: "about the tool itself · never counted either way",
};

/** Sentence-case titles for the same groups. */
const CLASS_TITLE: Readonly<Record<EvidenceClass, string>> = {
  A: "Committed files",
  Aprime: "Committed build files",
  B: "Live settings",
  C: "The maintainer's machine",
  M: "About the tool",
};

/** What every lane can read, said once. */
const SHARED_CLASSES: readonly EvidenceClass[] = ["A", "Aprime", "B"];

/**
 * "Who can see what" — one shared row, then only what each lane ADDS.
 *
 * The first cut of this rendered the same three panels three times, word for
 * word, with a fourth in the third lane: ninety per cent of the figure's area
 * spent saying the same thing three ways, and at a glance it read as a
 * rendering fault. Worse, it emphasised the LOCAL lane — the weakest of the
 * three — while drawing lanes 1 and 2 identically, which erases the only
 * difference that matters between an outside scan and a signed CI scan: the
 * signature. A reader left with "local sees most, and the first two are
 * interchangeable," which is the trust ordering backwards.
 *
 * So: the shared row is stated once at the top, each lane shows only its
 * delta, the SIGNED CI lane carries the emphasis and a `signed` marker, and
 * the local lane's one extra card takes the same dashed weaker treatment the
 * `+local` badge uses everywhere else on the site.
 */
export function overviewDiagram(h: (p: string) => string): string {
  const counted = (cls: EvidenceClass) =>
    allControlIds().filter((id) => CONTROL_REGISTRY[id]!.cls === cls).length;
  const panel = (cls: EvidenceClass, extra = "") =>
    `      <div class="fy-ov-panel"${extra}>
        <h4>${escapeHtml(CLASS_TITLE[cls])}</h4>
        <p><span class="fy-ov-count">${counted(cls)}</span> checks &middot; ${escapeHtml(
          CLASS_TERSE[cls],
        )}</p>
      </div>`;
  const sharedTotal = SHARED_CLASSES.reduce((n, c) => n + counted(c), 0);
  const scored = sharedTotal + counted("C");
  const shared = `<div class="fy-ov-row" data-ov="shared">
    <div class="fy-ov-label">
      <h3>What anyone can read</h3>
      <p>Three groups of checks answer from things the project itself publishes. Every lane
      below starts here.</p>
    </div>
    <div class="fy-ov-group">
${SHARED_CLASSES.map((c) => panel(c)).join("\n")}
    </div>
  </div>`;
  const lanes = `<div class="fy-ov-row" data-ov="lane" data-lane="external">
    <div class="fy-ov-label">
      <h3>A scan from outside</h3>
      <p>Anyone can ask for a public repository to be read.</p>
    </div>
    <div class="fy-ov-group">
      <div class="fy-ov-panel" data-ov-panel="none">
        <h4>Nothing more</h4>
        <p>The shared row, read from outside. Nobody has to take the scanner's word for what
        it saw &mdash; the same files are there to read.</p>
      </div>
    </div>
  </div>
<div class="fy-ov-row" data-ov="lane" data-lane="action">
    <div class="fy-ov-label">
      <h3>The project's own build</h3>
      <p>The same scan, run in the project's own CI.</p>
    </div>
    <div class="fy-ov-group" data-emphasis="true">
      <span class="fy-ov-marker">signed</span>
      <div class="fy-ov-panel" data-ov-panel="adds">
        <h4>A signature</h4>
        <p>Which build produced the record &middot; burned in by the issuer &middot; not
        asserted by the record</p>
      </div>
    </div>
  </div>
<div class="fy-ov-row" data-ov="lane" data-lane="local">
    <div class="fy-ov-label">
      <h3>A maintainer's machine</h3>
      <p>The only place the last group can be looked at.</p>
    </div>
    <div class="fy-ov-group">
${panel("C", ' data-ov-panel="local"')}
    </div>
  </div>`;
  return `<figure class="fy-overview" id="who-sees-what">
${shared}
${lanes}
  <figcaption class="fy-note">Two of the three can be checked by anyone. The third can only be
  asserted by the maintainer, and is weighted accordingly.
  <a href="${h("methodology/#local")}">How that is checked &rarr;</a>
  <span class="fy-ov-foot">+ ${counted("M")} about the tool &mdash; never counted.
  ${scored} of ${CONTROL_COUNT} are scored.</span></figcaption>
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

/* The lattice: 12 x 8 cells of 40 units, drawn 26..506 by 26..346 inside the
   reference's own 532 x 374 viewBox, with cell centres at 46 + 40k. Every wall
   segment is one 40-unit cell edge, which is the grammar the reference's own
   `structure` path is written in (`M26 26h40 M66 26v40 ...`). */
const STEP = 40;
const M_LEFT = 26;
const M_TOP = 26;
const M_COLS = 12;
const M_ROWS = 8;
/** Exported so a test can derive the wall count rather than restate it. */
export const MAZE_GRID = { cols: M_COLS, rows: M_ROWS } as const;
const cx = (i: number): number => M_LEFT + STEP / 2 + i * STEP;
const cy = (j: number): number => M_TOP + STEP / 2 + j * STEP;

interface Route {
  points: Array<[number, number]>;
  /** Index into `points` of each checkpoint, in order. */
  stops: number[];
  /** The `d` of every wall the maze keeps. */
  walls: string;
}

/**
 * A deterministic PRNG. The maze must be byte-identical on every build, so the
 * carve cannot reach for `Math.random()` and cannot depend on iteration order.
 */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const edgeKey = (a: number, b: number): string => (a < b ? `${a}:${b}` : `${b}:${a}`);

/**
 * Carve a perfect maze over the lattice with a seeded depth-first walk.
 *
 * "Perfect" means every cell is reachable and there is exactly ONE path between
 * any two of them — which is what makes the route below a property of the maze
 * rather than a line drawn on top of one. The first cut of this figure drew a
 * serpentine over a field of random wall stubs: the route never turned a corner
 * the walls made, and the six checkpoints stacked on two edges because that is
 * where a serpentine's legs end.
 */
function carve(seed: number): Set<string> {
  const rand = rng(seed);
  const at = (i: number, j: number) => j * M_COLS + i;
  const open = new Set<string>();
  const seen = new Uint8Array(M_COLS * M_ROWS);
  const stack: Array<[number, number]> = [[0, 0]];
  seen[0] = 1;
  while (stack.length > 0) {
    const [i, j] = stack[stack.length - 1]!;
    const next: Array<[number, number]> = [];
    if (i > 0 && !seen[at(i - 1, j)]) next.push([i - 1, j]);
    if (i < M_COLS - 1 && !seen[at(i + 1, j)]) next.push([i + 1, j]);
    if (j > 0 && !seen[at(i, j - 1)]) next.push([i, j - 1]);
    if (j < M_ROWS - 1 && !seen[at(i, j + 1)]) next.push([i, j + 1]);
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const pick = next[Math.min(next.length - 1, Math.floor(rand() * next.length))]!;
    open.add(edgeKey(at(i, j), at(pick[0], pick[1])));
    seen[at(pick[0], pick[1])] = 1;
    stack.push(pick);
  }
  return open;
}

/** The one path through a perfect maze, from the top-left cell to the last. */
function solve(open: Set<string>): Array<[number, number]> {
  const at = (i: number, j: number) => j * M_COLS + i;
  const goal = at(M_COLS - 1, M_ROWS - 1);
  const seen = new Uint8Array(M_COLS * M_ROWS);
  const path: Array<[number, number]> = [];
  const walk = (i: number, j: number): boolean => {
    seen[at(i, j)] = 1;
    path.push([i, j]);
    if (at(i, j) === goal) return true;
    const steps: Array<[number, number]> = [
      [i + 1, j],
      [i, j + 1],
      [i - 1, j],
      [i, j - 1],
    ];
    for (const [ni, nj] of steps) {
      if (ni < 0 || nj < 0 || ni >= M_COLS || nj >= M_ROWS) continue;
      if (seen[at(ni, nj)]) continue;
      if (!open.has(edgeKey(at(i, j), at(ni, nj)))) continue;
      if (walk(ni, nj)) return true;
    }
    path.pop();
    return false;
  };
  walk(0, 0);
  return path;
}

/**
 * The road, with exactly `n` checkpoints on it.
 *
 * Points are one per 40-unit step, so an index into them IS the arc fraction —
 * which is what lets a checkpoint's `data-node-at` be a real position on the
 * path rather than an evenly-spaced guess. The checkpoints are spread over the
 * whole road, first and last at its ends.
 */
export function mazeRoute(n: number): Route {
  const open = carve(0x5c5b_1234 ^ (M_COLS * 131 + M_ROWS));
  const cells = solve(open);
  const points: Array<[number, number]> = cells.map(([i, j]) => [cx(i), cy(j)]);
  const last = points.length - 1;
  const stops: number[] = [];
  for (let k = 0; k < n; k += 1) {
    stops.push(n === 1 ? 0 : Math.round((k * last) / (n - 1)));
  }
  return { points, stops, walls: mazeWalls(open) };
}

/** Every lattice edge the carve did NOT open, plus the outer border. */
function mazeWalls(open: Set<string>): string {
  const at = (i: number, j: number) => j * M_COLS + i;
  const right = M_LEFT + M_COLS * STEP;
  const bottom = M_TOP + M_ROWS * STEP;
  const d: string[] = [`M${M_LEFT} ${M_TOP}H${right}V${bottom}H${M_LEFT}Z`];
  for (let j = 0; j < M_ROWS; j += 1) {
    for (let i = 0; i < M_COLS; i += 1) {
      if (i < M_COLS - 1 && !open.has(edgeKey(at(i, j), at(i + 1, j)))) {
        d.push(`M${M_LEFT + (i + 1) * STEP} ${M_TOP + j * STEP}v${STEP}`);
      }
      if (j < M_ROWS - 1 && !open.has(edgeKey(at(i, j), at(i, j + 1)))) {
        d.push(`M${M_LEFT + i * STEP} ${M_TOP + (j + 1) * STEP}h${STEP}`);
      }
    }
  }
  return d.join(" ");
}

/** Collapse a run of collinear steps into one straight `L`. */
function traceD(points: ReadonlyArray<[number, number]>): string {
  const out: string[] = [`M${points[0]![0]} ${points[0]![1]}`];
  for (let i = 1; i < points.length; i += 1) {
    const [px, py] = points[i - 1]!;
    const [x, y] = points[i]!;
    const straight =
      i > 1 &&
      Math.sign(x - px) === Math.sign(px - points[i - 2]![0]) &&
      Math.sign(y - py) === Math.sign(py - points[i - 2]![1]);
    if (straight) out[out.length - 1] = `L${x} ${y}`;
    else out.push(`L${x} ${y}`);
  }
  return out.join(" ");
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
 * The road code travels — the maze.
 *
 * WHAT THIS FIGURE DEPICTS, AND WHAT IT MUST NOT. It is not a scan walking a
 * route: the scanner reads a clone and a settings API, once, and produces every
 * verdict from that one read. The road is the path CODE takes, from a commit to
 * a published package, and the checkpoints are where the standard set's checks
 * sit along it. One scan photographs all six groups at once — including the
 * ones it could not answer. So no copy anywhere near this figure says walks,
 * passes, in order, or none is skipped, and a test enforces that.
 *
 * Six checkpoints because there are six phases, named from `PHASE_NAMES` in
 * `PHASES` order, listed under the figure so the order is readable without
 * hovering anything.
 */
export function mazeFigure(): string {
  const route = mazeRoute(PHASES.length);
  const total = route.points.length - 1;
  return tracedFigure({
    kind: "fy-maze",
    label: `The road code travels, from a commit to a published package, with the ${PHASES.length} groups of checks marked along it`,
    viewBox: "0 0 532 374",
    structure: `    <path class="fy-structure" d="${route.walls}"></path>`,
    trace: traceD(route.points),
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
  { id: "scan", no: "01", title: "Scan", body: "Clone, never run" },
  { id: "record", no: "02", title: "Record", body: "Answered, or left open" },
  { id: "review", no: "03", title: "Review", body: "A person reads it" },
  { id: "answer", no: "04", title: "Answer", body: "Run it, then sign it" },
  { id: "rescan", no: "05", title: "Rescan", body: "One commit, one snapshot" },
];

/**
 * The connector's path, and the packet's — the SAME path, so the active edge
 * differs from a resting one only in colour and opacity.
 *
 * It is an ARC. The reference's dotted connectors curve outward around the
 * ring; a straight chord between two discs on a circle reads as a different
 * diagram. The box is rotated to the chord's own angle, and local −y after
 * that rotation is the outward normal, so a quadratic bowing to −y bows away
 * from the centre on every one of the five edges without a per-edge sign.
 */
export const LOOP_EDGE_PATH = "M 8 60 Q 60 40 112 60";

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
        <path class="fy-edge-base" d="${LOOP_EDGE_PATH}"></path>
        <path class="fy-edge-highlight" d="${LOOP_EDGE_PATH}"></path>
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
  <div class="fy-loop-stage">
    <div class="fy-process">
      <ol class="fy-loop-cards">
${cards}
      </ol>
      <div class="fy-connections">
${edges}
      </div>
      <!-- THE CENTRE NAMES WHAT IS THERE, AND ONLY WHAT IS THERE. It read "the
           signed record", which is a universal two of the four trust kinds do
           not have: an external scan produces an unsigned record, and so does a
           CI run without id-token. The caption under it used to read "Shared
           context" — an internal label naming nothing a reader can point at —
           and it was stranded 25px BELOW the stage border, attached to nothing.
           It is the third line of the centre now. -->
      <div class="fy-context-store">
        <span class="fy-context-pattern" aria-hidden="true"></span>
        <span class="fy-context-pulse" aria-hidden="true"></span>
        <span class="fy-context-title">the record</span>
        <span class="fy-context-sub">scan-record.json &middot; signed when the lane can sign it</span>
        <span class="fy-context-note">One record. Every stage adds to it.</span>
      </div>
    </div>
  </div>
</figure>`;
}

/* ══ 4.9 the segmented explorer ══════════════════════════════════════════ */

/**
 * The three things a scan reads, as the flow diagram's Inputs column.
 *
 * Typed by evidence class, so the tint on an input card means exactly what the
 * same tint means on a check card two columns to the right: this is the kind of
 * thing that answers it. Class A′ shares A's tint and its column entry — "the
 * build files the project commits" is committed files read a second way, not a
 * fourth source.
 */
const FLOW_INPUTS: ReadonlyArray<{ cls: EvidenceClass; line: string }> = [
  { cls: "A", line: "Everything in the tree at one commit, read and never run." },
  { cls: "B", line: "A live read of what the project has switched on at GitHub." },
  { cls: "C", line: "Reachable from one machine only, and only by its owner." },
];

/** The bracket that gathers the three inputs into the checks column. */
const FLOW_WIRE_BRACKET = `<svg class="fy-flow-lines" viewBox="0 0 56 100"
        preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 16H22M0 50H22M0 84H22M22 16V84M22 50H52"></path>
      </svg>`;

/** The single run from the checks column into the record. */
const FLOW_WIRE_RUN = `<svg class="fy-flow-lines" viewBox="0 0 56 100"
        preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 50H52"></path>
      </svg>`;

/**
 * "Every check" — the reference's flow diagram, with six segments selecting
 * what sits in its middle column.
 *
 * The cards were always right and always orphaned: fifty-four typed panels
 * behind a phase picker, with nothing on the page saying where they come from
 * or what they produce. The reference draws the same component as a left-to-
 * right flow — Inputs, the dotted working viewport, Outputs — and that shape
 * happens to be the true one here: three evidence sources feed the checks, and
 * the checks produce one record.
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
  // exists to distinguish them. Dots rather than swatches, and one dotted-square
  // glyph for the frame the phase's checks sit in — the reference's own key.
  const legend = CARD_LEGEND.map(
    (t) =>
      `<span><span class="fy-legend-dot" data-reference-type="${t.type}"></span>${escapeHtml(
        t.label,
      )}</span>`,
  ).join("\n    ");
  const inputs = FLOW_INPUTS.map(
    (i) => `      <div class="fy-flowcard" data-reference-type="${CARD_TYPE[i.cls]}">
        <span class="fy-flowcard-title">${escapeHtml(CLASS_SHORT[i.cls])}</span>
        <span class="fy-flowcard-line">${escapeHtml(i.line)}</span>
      </div>`,
  ).join("\n");
  return `<div class="fy-explorer">
  <p class="fy-legend"><span class="fy-key-label">Key</span>
    ${legend}
    <span><span class="fy-legend-frame"></span>the phase these checks belong to</span>
  </p>
  <div class="fy-segmented" role="radiogroup" aria-label="Pick a phase" data-segmented>
${options}
  </div>
  <div class="fy-flow">
    <div class="fy-flow-grid">
      <p class="fy-flow-head" data-flow-head="in">Inputs</p>
      <p class="fy-flow-head" data-flow-head="checks">Checks</p>
      <p class="fy-flow-head" data-flow-head="out">Record</p>
      <div class="fy-flow-band" data-flow-band="in">
        <div class="fy-flow-col">
${inputs}
        </div>
        <div class="fy-flow-wire" aria-hidden="true">${FLOW_WIRE_BRACKET}</div>
      </div>
      <div class="fy-flow-band" data-flow-band="checks">
        <div class="fy-flow-col">
${panels}
        </div>
        <div class="fy-flow-wire" aria-hidden="true">${FLOW_WIRE_RUN}</div>
      </div>
      <div class="fy-flow-band" data-flow-band="out">
        <div class="fy-flow-col">
          <div class="fy-flowcard fy-flowcard-record" data-flow="record">
            <span class="fy-flowcard-title">One listing</span>
            <span class="fy-flowcard-line">A grade &middot; ${PHASES.length} phase bars &middot;
            every check with its verdict &mdash; passed, failed, no defence found, or no answer
            at all.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
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
export function chapterNav(
  chapters: readonly Chapter[],
  opts: { tight?: boolean } = {},
): string {
  const items = chapters
    .map(
      (c) => `  <a href="#${c.id}"><span aria-hidden="true">${c.no}</span>${escapeHtml(
        c.label,
      )}</a>`,
    )
    .join("\n");
  // `tight` is the secondary pages' variant: on home and methodology the nav
  // arrives after a full black block or a full-width figure and wants the
  // reference's 160px of air; on the directory and the repo sheet it arrives
  // two elements into the page, where 160px would be a hole.
  return `<nav class="fy-chapters${opts.tight ? " fy-chapters-tight" : ""}" aria-label="Sections">
${items}
</nav>`;
}
