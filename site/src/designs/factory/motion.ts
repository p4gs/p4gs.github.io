/**
 * Factory's motion layer — every animation and transition the design
 * introduces, and the one inline script that drives the parts CSS cannot.
 *
 * Both exports are plain strings so `test/factory.test.ts` can assert on them
 * directly rather than inferring behaviour from rendered HTML.
 *
 * ── The three branches, and why the settled state is the DEFAULT ──────────
 *
 * `MOTION_CSS` paints the FINISHED state first, unconditionally, and only then
 * turns the animation on inside `@supports (animation-timeline: scroll())` +
 * `@media (prefers-reduced-motion: no-preference)`. So a browser without
 * scroll-driven animation, a reader who asked for less motion, and a printer
 * all get the same page: the black response panel with its complete headline,
 * the traced figures fully drawn with every checkpoint reached, and the loop
 * standing still with its moving parts removed. That is the reference's own
 * reduced-motion behaviour, measured — not a degradation invented here.
 *
 * The `@supports not (animation-timeline: scroll())` and
 * `@media (prefers-reduced-motion: reduce)` blocks then restate the settled
 * state explicitly, because the animated branch is not the only thing that
 * could have moved: `data-*` attributes the script writes have their own
 * styling, and those two branches switch it off at the source.
 *
 * ── What is NOT here, deliberately ───────────────────────────────────────
 *
 * No reveal-on-scroll fade and no count-up. A whole-document sweep of the
 * reference found exactly two animated components (the aperture and the loop)
 * and 22 transitions, all of them hover/focus/state affordances. The restraint
 * is the design; adding a fade would be adding a thing the reference does not
 * do, to a page whose argument is that it only shows what it can prove.
 */

/** Keyframe names, exported so the test can name them rather than grep prose. */
export const APERTURE_KEYFRAMES = [
  "fy-close-bar-left",
  "fy-close-bar-right",
  "fy-join-response-left",
  "fy-join-response-right",
  "fy-reveal-complete-response",
  "fy-hide-response-half",
] as const;

export const LOOP_KEYFRAMES = [
  "fy-loop-travel",
  "fy-loop-appear",
  "fy-loop-disappear",
  "fy-loop-release",
  "fy-loop-arrival",
  "fy-loop-return-travel",
  "fy-context-pulse",
] as const;

/** One stage of the operating loop, in milliseconds. 5 stages = 12.5 s a pass. */
export const LOOP_STAGE_MS = 2500;

export const MOTION_CSS = `
/* ══ motion: settled state (the default every branch falls back to) ══════ */

/* --- the aperture, at rest: the finished black panel, doors never seen --- */
.fy-stage { position: relative; isolation: isolate; overflow: clip; }
.fy-response { position: relative; background: #000; color: var(--fy-dark-ink); color-scheme: dark; }
.fy-response-left { position: absolute; inset: 0; }
.fy-response-right, .fy-bars { display: none; }
.fy-bar-left, .fy-bar-right {
  position: absolute; inset-block: 0; inline-size: calc(50% + 1px); background: #000;
}
.fy-bar-left { inset-inline-start: 0; }
.fy-bar-right { inset-inline-end: 0; }

/* --- the traced figures, at rest: drawn, every checkpoint reached -------- */
.fy-trace { stroke-dashoffset: 0; }
.fy-checkpoint { fill: var(--fy-figure-accent); fill-opacity: 0.4; stroke: var(--fy-figure-accent); }
.fy-speed-node { fill: var(--fy-figure-accent); }

/* --- the loop, at rest: static, moving parts gone ------------------------ */
.fy-packet, .fy-return-packet, .fy-edge-highlight, .fy-active-ring, .fy-arrival-ring,
.fy-context-pulse { animation-play-state: paused; }

/* ══ motion: the animated branch ═════════════════════════════════════════ */
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {

    /* ── 1. the hero aperture ──────────────────────────────────────────────
       The mechanism is copied: a \`timeline-scope\` on the stage, a
       \`view-timeline-name\` on a 100svh response panel inset to exactly one
       viewport, and \`animation-range: entry-crossing exit-crossing 0%\` so the
       range runs from "the panel's top edge is at the bottom of the viewport"
       to "its top edge is at the top" — which, with the opening panel exactly
       \`100svh - header\` tall under a header of exactly that height, makes
       progress equal \`scrollY / innerHeight\` over the first viewport and
       nothing else. Both halves and both bars ride that one timeline. */
    .fy-track[data-window-driver="css"] .fy-stage { timeline-scope: --fy-window-response; }
    .fy-track[data-window-driver="css"] .fy-response {
      view-timeline-name: --fy-window-response;
      view-timeline-axis: block;
      view-timeline-inset: 0 calc(100% - var(--fy-window-viewport-height));
    }
    .fy-track[data-window-mode="scroll"] .fy-response { background: 0 0; }
    .fy-track[data-window-mode="scroll"] .fy-response-left { clip-path: inset(0 50% 0 0); }
    .fy-track[data-window-mode="scroll"] .fy-response-right {
      display: flex; position: absolute; inset: 0; clip-path: inset(0 0 0 50%);
    }
    .fy-track[data-window-mode="scroll"] .fy-bars { display: block; }

    .fy-track[data-window-mode="scroll"][data-window-driver="css"]
      :is(.fy-bar-left, .fy-bar-right, .fy-response-left, .fy-response-right) {
      animation-duration: auto;
      animation-timing-function: cubic-bezier(0.333333, 0, 0.666667, 1);
      animation-fill-mode: both;
      animation-timeline: --fy-window-response;
      animation-range: entry-crossing exit-crossing 0%;
    }
    .fy-track[data-window-mode="scroll"][data-window-driver="css"] .fy-bar-left {
      animation-name: fy-close-bar-left;
    }
    .fy-track[data-window-mode="scroll"][data-window-driver="css"] .fy-bar-right {
      animation-name: fy-close-bar-right;
    }
    .fy-track[data-window-mode="scroll"][data-window-driver="css"] .fy-response-left {
      animation-name: fy-join-response-left, fy-reveal-complete-response;
      animation-timing-function: cubic-bezier(0.333333, 0, 0.666667, 1), step-end;
    }
    .fy-track[data-window-mode="scroll"][data-window-driver="css"] .fy-response-right {
      animation-name: fy-join-response-right, fy-hide-response-half;
      animation-timing-function: cubic-bezier(0.333333, 0, 0.666667, 1), step-end;
    }
    .fy-track[data-window-mode="scroll"][data-window-driver="css"][data-window-in-view="true"]
      :is(.fy-bar-left, .fy-bar-right, .fy-response-left, .fy-response-right) {
      will-change: transform;
    }

    @keyframes fy-close-bar-left {
      0% { transform: translate(-100%); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes fy-close-bar-right {
      0% { transform: translate(100%); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes fy-join-response-left {
      0% { transform: translate(-50%); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes fy-join-response-right {
      0% { transform: translate(50%); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes fy-reveal-complete-response {
      100% { clip-path: inset(0px); }
    }
    @keyframes fy-hide-response-half {
      100% { visibility: hidden; }
    }

    /* The seam. Without this the two halves meet on a fractional device pixel
       and a hairline of the panel behind shows through the join at some zoom
       levels. Guarded on the capability, because \`round()\` is newer than the
       rest of this block. */
    @supports (clip-path: inset(0 calc(100% - round(nearest, 50%, 1px)) 0 0)) {
      .fy-track[data-window-mode="scroll"][data-window-driver="css"] .fy-response-left {
        clip-path: inset(0px calc(100% - round(50%, 1px)) 0px 0px);
      }
      .fy-track[data-window-mode="scroll"][data-window-driver="css"] .fy-response-right {
        clip-path: inset(0px 0px 0px round(50%, 1px));
      }
    }

  }
}

/* ══ motion: everything that is NOT scroll-driven ════════════════════════
   The traced figures are written by JS per scroll frame and the loop is a
   time-based state machine; neither uses a scroll timeline, and the reference
   gates both on \`prefers-reduced-motion\` and nothing else.

   THIS BLOCK USED TO BE INSIDE THE \`@supports\` ABOVE, and that was a real
   defect rather than a tidiness question: in an engine with keyframes and JS
   but no scroll-timeline support — every Safari before 26, every WebKit view
   inside an app — the loop's rings and packets were \`display: none\` while its
   state machine kept flipping stages, and the traces drew with every checkpoint
   already lit because the pending rules were unreachable. It fails by doing
   nothing, in the browsers least likely to be the ones it was tested in. */
@media (prefers-reduced-motion: no-preference) {

    /* ── the traced figures ────────────────────────────────────────────────
       No keyframes and no transition: \`stroke-dashoffset\` is recomputed per
       scroll frame from the figure's own \`data-figure-progress\`, which the
       script writes. Mid-band the value must be whatever the scroll position
       says it is, and a transition would make it lag the finger. */
    .fy-figure[data-figure-mode="scroll"] .fy-trace { stroke-dashoffset: var(--fy-trace-offset, 1px); }
    .fy-checkpoint-group[data-reached="false"] .fy-checkpoint {
      fill: var(--fy-checkpoint-pending); fill-opacity: 0.15; stroke: var(--fy-checkpoint-pending);
    }
    .fy-speed-node[data-reached="false"] { fill: #000; }

    /* ── the operating loop ────────────────────────────────────────────────
       Gated, not scroll-linked: every animation is declared \`paused\` and only
       \`[data-running="true"]\` — which the script sets on intersection — lets
       it run. That is the cleanest way to hold an animation until it is on
       screen, and it means an off-screen loop costs nothing. */
    .fy-loop[data-running="true"] :is(.fy-packet, .fy-return-packet, .fy-edge-highlight,
      .fy-active-ring, .fy-arrival-ring) { animation-play-state: running; }
    .fy-loop[data-pulse-running="true"] .fy-context-pulse { animation-play-state: running; }

    .fy-connector[data-edge-state="running"] .fy-packet {
      animation-name: fy-loop-travel;
      animation-duration: 0.6s;
      animation-timing-function: var(--fy-loop-ease-transfer);
      animation-delay: 1.294s;
      animation-fill-mode: both;
    }
    .fy-connector[data-edge-state="running"] .fy-packet-group {
      animation-name: fy-loop-appear, fy-loop-disappear;
      animation-duration: 0.08s, 0.6s;
      animation-timing-function: var(--fy-loop-ease-settle), var(--fy-loop-ease-settle);
      animation-delay: 1.294s, 1.894s;
      animation-fill-mode: both, forwards;
    }
    .fy-connector[data-edge-state="running"] .fy-edge-highlight {
      animation-name: fy-loop-appear, fy-loop-disappear;
      animation-duration: 0.08s, 0.6s;
      animation-timing-function: var(--fy-loop-ease-settle), var(--fy-loop-ease-settle);
      animation-delay: 1.294s, 1.894s;
      animation-fill-mode: both, forwards;
    }
    .fy-loop-card[data-card-state="active"] .fy-card-ring {
      animation-name: fy-loop-disappear;
      animation-duration: 0s;
      animation-timing-function: linear;
      animation-delay: 1.894s;
      animation-fill-mode: both;
    }
    .fy-loop-card[data-card-state="arriving"] .fy-card-ring {
      animation-name: fy-loop-appear;
      animation-duration: 0s;
      animation-timing-function: linear;
      animation-delay: 2.014s;
      animation-fill-mode: both;
    }
    .fy-loop-card[data-card-state="active"] .fy-active-ring {
      animation-name: fy-loop-release;
      animation-duration: var(--fy-loop-release-duration);
      animation-timing-function: var(--fy-loop-ease-settle);
      animation-delay: 1.894s;
      animation-fill-mode: both;
    }
    .fy-loop-card[data-card-state="arriving"] .fy-arrival-ring {
      animation-name: fy-loop-arrival;
      animation-duration: 0.6s;
      animation-timing-function: var(--fy-loop-ease-settle);
      animation-delay: 1.894s;
      animation-fill-mode: both;
    }
    .fy-loop[data-pulse-running="true"] .fy-context-pulse {
      animation-name: fy-context-pulse;
      animation-duration: 2.2s;
      animation-timing-function: var(--fy-loop-ease-settle);
      animation-fill-mode: both;
    }
    /* The rail's closing packet. It only exists at ≤767 — the stylesheet gives
       the .fy-return-packet rule a display there and nowhere else — so this names the
       STATE that releases it rather than the layout that draws it. */
    .fy-connector[data-loop-edge="rescan"][data-edge-state="running"] .fy-return-packet {
      animation-name: fy-loop-return-travel;
      animation-duration: 2.4s;
      animation-timing-function: linear;
      animation-fill-mode: both;
    }

    @keyframes fy-loop-travel {
      0% { offset-distance: 0%; }
      100% { offset-distance: 100%; }
    }
    @keyframes fy-loop-appear {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes fy-loop-disappear {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes fy-loop-release {
      0% { opacity: 0.72; }
      100% { opacity: 0; }
    }
    @keyframes fy-loop-arrival {
      0% { opacity: 0; transform: scale(0.986); }
      60% { opacity: 0.84; transform: scale(1.012); }
      100% { opacity: 0.72; transform: scale(1); }
    }
    @keyframes fy-loop-return-travel {
      0% { transform: translate(100%, 100%); }
      3% { animation-timing-function: cubic-bezier(0.25, 0.125, 0.75, 0.875); transform: translateY(100%); }
      97% { animation-timing-function: cubic-bezier(0.25, 0.25, 0.75, 1); transform: translate(0px); }
      100% { transform: translate(100%); }
    }
    @keyframes fy-context-pulse {
      0% { opacity: 0; transform: scale(0.92); }
      28% { opacity: 0.45; transform: scale(0.98); }
      62% { opacity: 0.32; transform: scale(1.03); }
      100% { opacity: 0; transform: scale(1.08); }
    }
}

/* ══ motion: transitions (state affordances only — never scroll-linked) ═══ */
.fy-continue { transition: background-color 0.18s; }
.fy-find { transition: background-color 0.2s cubic-bezier(0.17, 0.17, 0.3, 1); }
.fy-chapters a { transition: background-color 0.25s cubic-bezier(0, 0, 1, 1); }
.fy-node, .fy-refcard { transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; }
.fy-seg-label { transition: background-color 0.15s, color 0.15s; }
.fy-annotate { transition: text-decoration-color 0.2s ease-in-out; }

/* The scroll affordance on a wide table is two TRANSITIONED custom properties,
   not a static gradient: the edge fades in only on the side that has more
   table behind it, and fades out again when the reader reaches that end. */
@property --fy-mask-start {
  syntax: "<color>"; inherits: false; initial-value: rgba(0, 0, 0, 1);
}
@property --fy-mask-end {
  syntax: "<color>"; inherits: false; initial-value: rgba(0, 0, 0, 1);
}
.fy-wrap {
  --fy-mask-start: rgba(0, 0, 0, 1);
  --fy-mask-end: rgba(0, 0, 0, 1);
  transition-property: --fy-mask-start, --fy-mask-end;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-mask-image: linear-gradient(to right, var(--fy-mask-start) 0, #000 32px,
    #000 calc(100% - 32px), var(--fy-mask-end) 100%);
  mask-image: linear-gradient(to right, var(--fy-mask-start) 0, #000 32px,
    #000 calc(100% - 32px), var(--fy-mask-end) 100%);
}
.fy-wrap[data-overflow-start="true"] { --fy-mask-start: rgba(0, 0, 0, 0); }
.fy-wrap[data-overflow-end="true"] { --fy-mask-end: rgba(0, 0, 0, 0); }
/* THE SAME AFFORDANCE ON THE SHARED SCROLL CONTAINERS. Five methodology tables
   — including the one that carries all 54 checks, their questions and the groups
   each defends — are 560-640px wide inside a 344px window at 390, so every
   question was cut mid-word at the viewport edge and the whole third column was
   off screen, with no fade, no shadow and no scrollbar to say so. The document
   never widens, which is why every overflow probe stayed green. */
.table-scroll {
  --fy-mask-start: rgba(0, 0, 0, 1);
  --fy-mask-end: rgba(0, 0, 0, 1);
  transition-property: --fy-mask-start, --fy-mask-end;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-mask-image: linear-gradient(to right, var(--fy-mask-start) 0, #000 24px,
    #000 calc(100% - 24px), var(--fy-mask-end) 100%);
  mask-image: linear-gradient(to right, var(--fy-mask-start) 0, #000 24px,
    #000 calc(100% - 24px), var(--fy-mask-end) 100%);
}
.table-scroll[data-overflow-start="true"] { --fy-mask-start: rgba(0, 0, 0, 0); }
.table-scroll[data-overflow-end="true"] { --fy-mask-end: rgba(0, 0, 0, 0); }
.table-scroll:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: -2px; }
/* The cue itself, because a fade alone still asks the reader to guess. */
.fy-swipe {
  display: block; margin-block-start: 8px; font-family: var(--fy-mono);
  font-size: 12px; line-height: 18px; color: var(--fy-muted);
}
.fy-dark .fy-swipe { color: var(--fy-dark-quiet); }

/* The toggletip. 0.4 s in with an 8px rise, 0.2 s out the way it came —
   side-aware, so a panel that opened upward closes upward.

   THE EXIT USED TO BE A COMMENT. This block described a 0.2 s close and shipped
   only the enter keyframe, while the script set \`hidden\` synchronously: a
   40 ms stroboscopic series over 0-240 ms found the panel gone at EVERY sample
   including delay 0. It vanished in one frame, which is the one thing a 0.4 s
   entrance makes conspicuous. */
.fy-tip[data-state="open"] {
  animation: fy-tip-enter 0.4s cubic-bezier(0.17, 0.17, 0.3, 1) both;
}
.fy-tip[data-state="closing"] {
  animation: fy-tip-exit 0.2s cubic-bezier(0.17, 0.17, 0.3, 1) both;
}
@keyframes fy-tip-enter {
  0% { opacity: 0; transform: translate3d(0, var(--fy-tip-from, -0.5rem), 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes fy-tip-exit {
  0% { opacity: 1; transform: translate3d(0, 0, 0); }
  100% { opacity: 0; transform: translate3d(0, var(--fy-tip-from, -0.5rem), 0); }
}

/* ══ motion: no scroll-driven animation available ════════════════════════
   THE APERTURE'S SETTLED STATE, AND ONLY THE APERTURE'S. The aperture is the
   one thing on this page that needs a scroll timeline; the loop and the traced
   figures do not, and an engine without \`animation-timeline\` must still run
   them. This block used to hide the loop's moving parts here, which turned a
   missing CSS feature into a dead diagram. */
@supports not (animation-timeline: scroll()) {
  .fy-track[data-window-mode] .fy-bars,
  .fy-track[data-window-mode] .fy-response-right { display: none; }
  .fy-track[data-window-mode] .fy-response { background: #000; }
  .fy-track[data-window-mode] .fy-response-left {
    clip-path: none; transform: none; will-change: auto; visibility: visible;
  }
}

/* ══ motion: the reader asked for less of it ═════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  .fy-track[data-window-mode] .fy-bars,
  .fy-track[data-window-mode] .fy-response-right { display: none; }
  .fy-track[data-window-mode] .fy-response { background: #000; }
  .fy-track[data-window-mode] .fy-response-left {
    clip-path: none; transform: none; will-change: auto; visibility: visible;
  }
  .fy-track[data-window-mode]
    :is(.fy-bar-left, .fy-bar-right, .fy-response-left, .fy-response-right) {
    will-change: auto; animation: auto ease 0s 1 normal none running none;
  }
  .fy-figure .fy-trace { stroke-dashoffset: 0; }
  .fy-figure .fy-checkpoint {
    fill: var(--fy-figure-accent); fill-opacity: 0.4; stroke: var(--fy-figure-accent);
  }
  .fy-figure .fy-speed-node { fill: var(--fy-figure-accent); }
  .fy-loop :is(.fy-packet, .fy-return-packet, .fy-edge-highlight, .fy-active-ring,
    .fy-arrival-ring, .fy-context-pulse) {
    animation: auto ease 0s 1 normal none running none; display: none;
  }
  .fy-continue, .fy-find, .fy-chapters a, .fy-node, .fy-refcard, .fy-seg-label,
  .fy-annotate, .fy-wrap { transition: none; }
  .fy-tip[data-state="open"], .fy-tip[data-state="closing"] { animation: none; }
}

@media print {
  .fy-aperture, .fy-chapters, .fy-find { display: none; }
  .fy-loop :is(.fy-packet, .fy-return-packet, .fy-active-ring, .fy-arrival-ring,
    .fy-context-pulse) { display: none; }
}
`;

/**
 * The one inline script. No `src`, no library, no dependency.
 *
 * It does five things, in this order, and the FIRST thing it does is ask
 * whether the reader wants motion at all — before any observer exists:
 *
 *  1. Traced figures. Under reduced motion they are pinned to progress 1 and
 *     marked `data-figure-mode="static"`; otherwise an IntersectionObserver
 *     arms them and a passive scroll listener writes progress over a band that
 *     ENDS when the figure's centre meets the viewport centre and is 0.30 ×
 *     viewport tall — the rule measured off the reference, expressed as a
 *     fraction of the viewport rather than a pixel count so it retimes itself.
 *  2. The pill nav's scroll-spy. It runs under reduced motion too: the
 *     cross-fade is a transition the stylesheet already switches off, but
 *     WHERE YOU ARE is information, not decoration. At narrow widths it also
 *     scrolls the active pill into view, by assignment rather than
 *     `scrollIntoView()` — that can move the page as well as the strip.
 *  3. The operating loop. A gate (in view → `data-running="true"`) and a state
 *     machine that advances `data-loop-stage` every 2.5 s.
 *  4. Toggletips and expanders: one open at a time, Escape and outside-click
 *     close, focus returns to the trigger.
 *  5. The segmented explorer, and the scroll masks on wide tables.
 *
 * Everything it touches is already correct in the HTML without it.
 */
export const MOTION_SCRIPT = `(function () {
  var reduce = false;
  try {
    reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) { reduce = false; }
  var supportsIO = typeof IntersectionObserver === "function";

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  /* ── 1. traced figures ────────────────────────────────────────────────── */
  var figures = document.querySelectorAll("[data-figure-progress]");
  function paintFigure(fig, p) {
    fig.setAttribute("data-figure-progress", String(Math.round(p * 1000) / 1000));
    var trace = fig.querySelector(".fy-trace");
    if (trace) {
      trace.style.strokeDashoffset = (1 - p) + "px";
      fig.style.setProperty("--fy-trace-offset", (1 - p) + "px");
    }
    each(fig.querySelectorAll("[data-node-at]"), function (n) {
      var at = parseFloat(n.getAttribute("data-node-at") || "0");
      n.setAttribute("data-reached", p >= at - 0.0001 ? "true" : "false");
    });
    each(fig.querySelectorAll("[data-legend-at]"), function (n) {
      var at = parseFloat(n.getAttribute("data-legend-at") || "0");
      n.setAttribute("data-reached", p >= at - 0.0001 ? "true" : "false");
    });
  }
  if (figures.length) {
    if (reduce) {
      each(figures, function (fig) {
        fig.setAttribute("data-figure-mode", "static");
        paintFigure(fig, 1);
      });
    } else {
      var live = [];
      each(figures, function (fig) { fig.setAttribute("data-figure-mode", "paused"); paintFigure(fig, 0); });
      var queued = false;
      var tick = function () {
        queued = false;
        var vh = window.innerHeight || 1;
        var band = vh * 0.3;
        for (var i = 0; i < live.length; i++) {
          var fig = live[i];
          var box = fig.getBoundingClientRect();
          var centre = box.top + box.height / 2;
          var endAt = vh / 2;
          var p = 1 - (centre - endAt) / band;
          if (p < 0) p = 0;
          if (p > 1) p = 1;
          paintFigure(fig, p);
        }
      };
      var schedule = function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(tick);
      };
      if (supportsIO) {
        var figIO = new IntersectionObserver(function (entries) {
          each(entries, function (en) {
            var fig = en.target;
            var at = live.indexOf(fig);
            if (en.isIntersecting) {
              if (at === -1) live.push(fig);
              fig.setAttribute("data-figure-mode", "scroll");
            } else if (at !== -1) {
              live.splice(at, 1);
              fig.setAttribute("data-figure-mode", "paused");
            }
          });
          schedule();
        }, { rootMargin: "60% 0px 60% 0px" });
        each(figures, function (fig) { figIO.observe(fig); });
      } else {
        each(figures, function (fig) { live.push(fig); fig.setAttribute("data-figure-mode", "scroll"); });
      }
      addEventListener("scroll", schedule, { passive: true });
      addEventListener("resize", schedule);
      schedule();
    }
  }

  /* ── 2. the pill nav scroll-spy ───────────────────────────────────────── */
  var nav = document.querySelector("nav.fy-chapters");
  if (nav) {
    var pills = [];
    each(nav.querySelectorAll("a[href]"), function (a) {
      var hash = (a.getAttribute("href") || "").split("#")[1];
      if (!hash) return;
      var el = document.getElementById(hash);
      if (el) pills.push({ a: a, el: el });
    });
    if (pills.length) {
      var currentPill = null;
      // THE NAVIGATING GUARD. The root scrolls smoothly, so a click on pill 04
      // sends the page THROUGH 02 and 03 and the spy dutifully lights each one
      // on the way — a 250ms cross-fade fired three times, which reads as the
      // nav having a seizure. A click marks its own target at once and the spy
      // is ignored until the scroll settles (scrollend, or 700ms where that
      // event does not exist).
      var navigating = false;
      var navTimer = null;
      var settle = function () {
        navigating = false;
        nav.setAttribute("data-navigating", "false");
        if (navTimer) { clearTimeout(navTimer); navTimer = null; }
      };
      var mark = function (hit) {
        if (!hit || hit === currentPill) return;
        if (currentPill) currentPill.a.removeAttribute("aria-current");
        hit.a.setAttribute("aria-current", "location");
        currentPill = hit;
        // The nav inverts over a dark section: the reference never shows a
        // white pill on black, and a 1px #e6e6e6 hairline on #000 is invisible.
        var dark = !!(hit.el.closest && hit.el.closest(".fy-dark"));
        nav.setAttribute("data-on-dark", dark ? "true" : "false");
        var a = hit.a;
        var want = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
        var max = nav.scrollWidth - nav.clientWidth;
        if (max > 0) nav.scrollLeft = Math.max(0, Math.min(max, want));
      };
      each(pills, function (p) {
        p.a.addEventListener("click", function () {
          navigating = true;
          nav.setAttribute("data-navigating", "true");
          mark(p);
          if (navTimer) clearTimeout(navTimer);
          navTimer = setTimeout(settle, 700);
          if ("onscrollend" in window) {
            addEventListener("scrollend", settle, { once: true });
          }
        });
      });
      if (supportsIO) {
        var seen = {};
        var spy = new IntersectionObserver(function (entries) {
          each(entries, function (en) { seen[en.target.id] = en.isIntersecting; });
          if (navigating) return;
          var hit = null;
          for (var i = 0; i < pills.length; i++) {
            if (seen[pills[i].el.id]) hit = pills[i];
          }
          if (!hit) {
            for (var j = pills.length - 1; j >= 0; j--) {
              if (pills[j].el.getBoundingClientRect().top < 0) { hit = pills[j]; break; }
            }
          }
          mark(hit || pills[0]);
        }, { rootMargin: "0px 0px -70% 0px", threshold: 0 });
        each(pills, function (p) { spy.observe(p.el); });
      }
      nav.setAttribute("data-navigating", "false");
      mark(pills[0]);
    }
  }

  /* ── 3. the operating loop ────────────────────────────────────────────── */
  each(document.querySelectorAll(".fy-loop"), function (loop) {
    var cards = loop.querySelectorAll(".fy-loop-card");
    var edges = loop.querySelectorAll(".fy-connector");
    var stages = [];
    each(cards, function (c) { stages.push(c.getAttribute("data-stage") || ""); });
    if (!stages.length) return;
    if (reduce) {
      loop.setAttribute("data-loop-status", "static");
      loop.setAttribute("data-reduced-motion", "true");
      loop.setAttribute("data-running", "false");
      loop.setAttribute("data-pulse-running", "false");
      loop.setAttribute("data-context-settled", "true");
      return;
    }
    var at = 0, timer = null, passes = 0;
    var paint = function () {
      var next = (at + 1) % stages.length;
      loop.setAttribute("data-loop-stage", stages[at]);
      each(cards, function (c, i) {
        if (i === at) c.setAttribute("data-card-state", "active");
        else if (i === next) c.setAttribute("data-card-state", "arriving");
        else c.removeAttribute("data-card-state");
      });
      each(edges, function (e, i) {
        if (i === at) e.setAttribute("data-edge-state", "running");
        else e.removeAttribute("data-edge-state");
      });
      loop.setAttribute("data-pulse-running", "false");
      setTimeout(function () {
        if (loop.getAttribute("data-running") === "true") {
          loop.setAttribute("data-pulse-running", "true");
        }
      }, 60);
    };
    var start = function () {
      if (timer) return;
      loop.setAttribute("data-running", "true");
      loop.setAttribute("data-loop-status", "playing");
      paint();
      timer = setInterval(function () {
        at = (at + 1) % stages.length;
        if (at === 0) { passes += 1; loop.setAttribute("data-loop-completed-passes", String(passes)); }
        paint();
      }, ${LOOP_STAGE_MS});
    };
    var stop = function () {
      if (timer) { clearInterval(timer); timer = null; }
      loop.setAttribute("data-running", "false");
      loop.setAttribute("data-pulse-running", "false");
      loop.setAttribute("data-loop-status", "paused");
    };
    if (supportsIO) {
      var loopIO = new IntersectionObserver(function (entries) {
        each(entries, function (en) { if (en.isIntersecting) start(); else stop(); });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
      loopIO.observe(loop);
    } else {
      start();
    }
  });

  /* ── 4. toggletips and expanders ──────────────────────────────────────── */
  var openTip = null;
  function closeTip(focusBack) {
    if (!openTip) return;
    var t = openTip;
    openTip = null;
    t.trigger.setAttribute("aria-expanded", "false");
    t.trigger.setAttribute("data-state", "closed");
    if (focusBack) { try { t.trigger.focus(); } catch (e) {} }
    var settle = function () {
      // Only finish a close that is still a close: a panel re-opened while this
      // was pending must not be hidden by it.
      if (t.panel.getAttribute("data-state") !== "closing") return;
      t.panel.hidden = true;
      t.panel.setAttribute("data-state", "closed");
      t.panel.style.insetInlineStart = "";
    };
    if (reduce) {
      t.panel.setAttribute("data-state", "closing");
      settle();
      return;
    }
    t.panel.setAttribute("data-state", "closing");
    var once = function () { t.panel.removeEventListener("animationend", once); settle(); };
    t.panel.addEventListener("animationend", once);
    // A belt, for an engine that never fires animationend on a display-toggled
    // element: the panel must not be left visible and unreachable.
    setTimeout(once, 400);
  }
  function sideFor(trigger) {
    var box = trigger.getBoundingClientRect();
    return box.top > (window.innerHeight || 0) * 0.6 ? "top" : "bottom";
  }
  each(document.querySelectorAll('[aria-haspopup="dialog"][aria-controls]'), function (trigger) {
    var panel = document.getElementById(trigger.getAttribute("aria-controls") || "");
    if (!panel) return;
    trigger.addEventListener("click", function (ev) {
      ev.preventDefault();
      var wasOpen = openTip && openTip.trigger === trigger;
      closeTip(false);
      if (wasOpen) return;
      var side = sideFor(trigger);
      panel.setAttribute("data-side", side);
      panel.style.setProperty("--fy-tip-from", side === "top" ? "0.5rem" : "-0.5rem");
      panel.hidden = false;
      panel.setAttribute("data-state", "open");
      // Keep it on screen. A panel anchored to a holder in the right-hand
      // column otherwise widens the document, which is the one thing no page
      // here may do — and it is invisible until something opens it.
      panel.style.insetInlineStart = "0px";
      var vw = document.documentElement.clientWidth;
      var box = panel.getBoundingClientRect();
      var shift = 0;
      if (box.right > vw - 8) shift = -(box.right - (vw - 8));
      if (box.left + shift < 8) shift = 8 - box.left;
      if (shift !== 0) panel.style.insetInlineStart = Math.round(shift) + "px";
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("data-state", "open");
      openTip = { trigger: trigger, panel: panel };
      // Into the dialog it just announced. preventScroll, because moving focus
      // into a panel anchored below the fold would otherwise jump the page.
      try { panel.focus({ preventScroll: true }); } catch (e) {
        try { panel.focus(); } catch (e2) {}
      }
    });
  });
  each(document.querySelectorAll("[data-tip-close]"), function (b) {
    b.addEventListener("click", function () { closeTip(true); });
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" || ev.key === "Esc") closeTip(true);
  });
  document.addEventListener("click", function (ev) {
    if (!openTip) return;
    if (openTip.panel.contains(ev.target) || openTip.trigger.contains(ev.target)) return;
    closeTip(false);
  });
  each(document.querySelectorAll("[data-expander]"), function (trigger) {
    var panel = document.getElementById(trigger.getAttribute("aria-controls") || "");
    if (!panel) return;
    panel.hidden = trigger.getAttribute("aria-expanded") !== "true";
    trigger.addEventListener("click", function () {
      var open = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
    });
  });

  /* ── 5. the segmented explorer, and wide-table scroll masks ───────────── */
  each(document.querySelectorAll("[data-segmented]"), function (group) {
    var inputs = group.querySelectorAll('input[type="radio"]');
    var panels = [];
    each(inputs, function (input) {
      var panel = document.getElementById(input.getAttribute("aria-controls") || "");
      if (panel) panels.push({ input: input, panel: panel });
    });
    var sync = function () {
      each(panels, function (p) {
        p.panel.hidden = !p.input.checked;
        var label = p.input.parentNode;
        if (label && label.setAttribute) label.setAttribute("data-state", p.input.checked ? "on" : "off");
      });
    };
    each(inputs, function (input) { input.addEventListener("change", sync); });
    sync();
  });
  // The design's own wraps AND the shared .table-scroll containers, which ship
  // no affordance of their own: a 640px table in a 344px window cut every
  // question mid-word with nothing on the page saying more was there.
  each(document.querySelectorAll(".fy-wrap, .table-scroll"), function (wrap) {
    var cue = null;
    if (wrap.className.indexOf("table-scroll") !== -1) {
      if (!wrap.hasAttribute("tabindex")) wrap.setAttribute("tabindex", "0");
      cue = document.createElement("span");
      cue.className = "fy-swipe";
      cue.setAttribute("aria-hidden", "true");
      cue.hidden = true;
      cue.textContent = "swipe to see the rest \\u2192";
      if (wrap.parentNode) wrap.parentNode.insertBefore(cue, wrap.nextSibling);
    }
    var sync = function () {
      var max = wrap.scrollWidth - wrap.clientWidth;
      wrap.setAttribute("data-overflow-start", max > 1 && wrap.scrollLeft > 1 ? "true" : "false");
      wrap.setAttribute("data-overflow-end", max > 1 && wrap.scrollLeft < max - 1 ? "true" : "false");
      if (cue) cue.hidden = max <= 1;
    };
    wrap.addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync);
    sync();
  });
})();`;
