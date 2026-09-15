/**
 * Factory's stylesheet — the static half of the design.
 *
 * The register: white paper, ink-black type at weight 400 and nothing bolder
 * for display, one editorial serif for the single pull-quote a page is allowed,
 * and mono for ids and numerals. Two blues that never trade places — `#2c67c5`
 * is a LINK and `#0285ff` is a DIAGRAM ACCENT, and neither is ever a verdict.
 * The verdict hues are SSCSB's own, because on this site a colour that means
 * "fail" has to keep meaning it on every page.
 *
 * Section rhythm is 128px of air between beats, hard cuts between the white
 * chapters and the black opening block, and no rounded-card soup: diagram
 * surfaces are 8px, overview groups 16px, chrome pills 999px, and that is the
 * whole radius vocabulary.
 *
 * MOTION IS NOT HERE. Every animation and transition this design introduces
 * lives in `motion.ts`, already inside its `@supports` / reduced-motion
 * branches, so the question "what moves, and what happens when it may not"
 * has exactly one place to be answered.
 */

export const CSS = `
/* ══ tokens ══════════════════════════════════════════════════════════════ */
:root {
  --fy-ground: #ffffff;
  --fy-ink: #000000;
  --fy-text: rgb(13, 13, 13);
  --fy-caption: rgb(8, 8, 8);
  --fy-muted: rgb(93, 93, 93);
  --fy-quiet: rgba(0, 0, 0, 0.6);
  --fy-surface: #f7f7f8;
  --fy-surface-2: #f3f3f3;
  --fy-surface-3: rgba(0, 0, 0, 0.04);
  --fy-hair: #e6e6e6;
  --fy-line: #dedede;

  /* the black block */
  --fy-dark: #000000;
  --fy-dark-ink: #ededed;
  --fy-dark-body: rgba(255, 255, 255, 0.78);
  --fy-dark-quiet: rgba(255, 255, 255, 0.56);
  --fy-dark-axis: #303030;
  --fy-dark-bar: rgba(255, 255, 255, 0.44);
  --fy-dark-rule: rgba(255, 255, 255, 0.14);

  /* the two blues, and they do not trade places */
  --fy-link: #2c67c5;
  --fy-accent: #0285ff;
  --fy-ring: #0169cc;

  /* diagram tints, each with its own border */
  --fy-tint-blue: #f0f7fe;      --fy-edge-blue: #a4cdfb;
  --fy-tint-violet: #f5f1fd;    --fy-edge-violet: #c9b1f6;
  --fy-tint-grey: #f7f7f8;      --fy-edge-grey: #d0d0d4;
  /* The verdict tints, in the same tint/border grammar as the four evidence
     hues — pass is the reference's own green pair. */
  --fy-tint-pass: #edf8f1;      --fy-edge-pass: #9fddb1;
  --fy-tint-warn: #fdf4e6;      --fy-edge-warn: #e2bd7e;
  --fy-dash: #a1a1a1;

  /* SSCSB's verdicts. Not the diagram accent, not the link blue, and not the
     reference's red — a hue that means "fail" here may not also mean
     "emphasis" three sections up. */
  --fy-pass: #0f7a3d;
  --fy-fail: #c0362c;
  --fy-warn: #a35b00;
  --fy-na: #6b6b6b;
  /* NOTHING IS HATCHED. The hatch survived D2 as a legend swatch — and by then
     it was a legend for itself: the token was applied by exactly one rule,
     the swatch, because the pass bar had stopped drawing the unanswered set
     inside its track. A reader who learned "hatched = no answer" then scanned
     six full-green bars for hatching and concluded nothing was unanswered. The
     token stays only so the shared bridge resolves; it paints nothing. */
  --fy-hatch: none;

  --fy-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --fy-body: var(--fy-display);
  --fy-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  --fy-gutter: 56px;
  --fy-media-gutter: 32px;
  --fy-wrap: 1120px;
  --fy-media: 1376px;
  --fy-prose: 74ch;
  --fy-header-h: 64px;
  --fy-beat: 128px;

  --fy-figure-accent: var(--fy-accent);
  --fy-checkpoint-pending: rgba(255, 255, 255, 0.34);
  --fy-loop-ease-transfer: cubic-bezier(0.65, 0, 0.35, 1);
  --fy-loop-ease-settle: cubic-bezier(0.16, 1, 0.3, 1);
  --fy-loop-release-duration: 0.12s;
}

/* ══ base ════════════════════════════════════════════════════════════════ */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0; background: var(--fy-ground); color: var(--fy-text);
  font-family: var(--fy-body); font-size: 17px; line-height: 28px;
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
main { display: block; }
a { color: var(--fy-link); }
a:focus-visible, button:focus-visible, input:focus-visible, summary:focus-visible,
[tabindex]:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: 3px; }
h1, h2, h3, h4 { font-weight: 400; margin: 0; text-wrap: balance; }
/* NOTHING IS BOLD. It is the reference's single most-cited choice — a 126.7px
   display line at weight 400 with nothing on the page heavier — and this tree
   had no rule enforcing it, so 94 of 94 strong elements rendered at 700 and
   the honesty-rule paragraph carried five bold runs in eight lines. At 390 the
   bold lead wraps across two lines, which makes it the first thing the eye
   lands on. Emphasis here is size, colour, or a new line. */
strong, b { font-weight: 500; }
p { margin: 0; }
code { font-family: var(--fy-mono); font-size: 0.92em; }
.fy-vh {
  position: absolute; inline-size: 1px; block-size: 1px; padding: 0; border: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
.fy-skip {
  position: absolute; inset-inline-start: -9999px; inset-block-start: 0; z-index: 100;
  background: var(--fy-ink); color: #fff; padding: 12px 18px; text-decoration: none;
}
.fy-skip:focus { inset-inline-start: 0; }

.fy-wrapper { inline-size: min(100% - var(--fy-gutter) * 2, var(--fy-wrap)); margin-inline: auto; }
.fy-mediaframe { inline-size: min(100% - var(--fy-media-gutter) * 2, var(--fy-media)); margin-inline: auto; }
.fy-prose { max-inline-size: var(--fy-prose); }

/* ══ chrome: a static header that scrolls away for good ══════════════════ */
.fy-header {
  block-size: var(--fy-header-h); position: static; background: var(--fy-ground);
}
.fy-header-in {
  block-size: 100%; inline-size: min(100% - var(--fy-gutter) * 2, var(--fy-media));
  margin-inline: auto; display: flex; align-items: center; gap: 24px;
  padding-inline-end: 56px;
}
/* T9 · A MARK, NOT A TERMINAL PROMPT. Wide-tracked mono read as a command
   line; the reference's wordmark is compact and tight-set. */
.fy-wordmark {
  font-family: var(--fy-display); font-weight: 500; font-size: 16px; letter-spacing: -0.02em;
  color: var(--fy-ink); text-decoration: none; display: inline-flex; align-items: center;
  min-block-size: 44px; margin-inline-end: auto;
}
.fy-nav { display: flex; align-items: center; gap: 4px; }
.fy-nav a {
  color: var(--fy-text); text-decoration: none; font-size: 14px; line-height: 1.4;
  padding: 8px 12px; border-radius: 999px; display: inline-flex; align-items: center;
  min-block-size: 44px; white-space: nowrap;
}
.fy-nav a:hover { background: var(--fy-surface-2); }
.fy-nav a.is-here { background: var(--fy-surface-2); }

/* The one fixed element on the page, and only at desktop widths.
   It used to be drawn on no ground at all so it could sit over either the white
   chapters or the black block — which is exactly what made it bleed: a
   transparent disc over 14px type reads as a smudge on the type, not as a
   control. It is a PLATE now: opaque white, a hairline, and the reference's own
   1px shadow, so whatever is under it stays under it. On a phone it is removed
   entirely (see the ≤767 block) — the in-page field, the pill rail and the
   colophon's ↑ Top already carry search there, and 44px of fixed chrome in the
   corner of a 390px screen is the most expensive square on the page. */
.fy-find {
  position: fixed; inset-block-start: 12px; inset-inline-end: 24px; z-index: 40;
  inline-size: 44px; block-size: 44px; border-radius: 999px;
  display: grid; place-items: center; color: #5d5d5d; background: #ffffff;
  border: 1px solid #dedede; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
}
.fy-find:hover { background: var(--fy-surface-2); color: var(--fy-ink); }

/* ══ chrome: the colophon ════════════════════════════════════════════════ */
.fy-colophon { border-block-start: 1px solid var(--fy-hair); margin-block-start: 96px; }
.fy-colophon-in {
  inline-size: min(100% - var(--fy-gutter) * 2, var(--fy-wrap)); margin-inline: auto;
  padding-block: 32px 8px; display: flex; flex-wrap: wrap; gap: 8px 32px;
  align-items: baseline; justify-content: space-between;
}
.fy-col-line { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: baseline; }
.fy-col-host { font-family: var(--fy-mono); font-size: 14px; color: var(--fy-ink); }
.fy-col-meta { font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-col-links { display: flex; flex-wrap: wrap; gap: 0 20px; }
.fy-col-links a {
  font-size: 14px; color: var(--fy-text); text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; min-inline-size: 44px;
}
.fy-col-links a:hover { color: var(--fy-link); text-decoration: underline; text-underline-offset: 4px; }

/* ══ the hero aperture ═══════════════════════════════════════════════════ */
.fy-aperture { position: relative; }
/* THE TIMELINE'S INSET AND THE PANEL'S HEIGHT ARE THE SAME NUMBER, so they are
   the same custom property. A view-timeline-inset of calc(100% - var(...)) on
   an undefined property is invalid at computed-value time and silently falls
   back to auto — which happens to coincide with the intended inset at one
   viewport height and drifts everywhere else. Defining it here also makes it
   impossible for the panel and the inset to be changed apart. */
.fy-track { position: relative; --fy-window-viewport-height: 100svh; }
.fy-opening {
  min-block-size: calc(100svh - var(--fy-header-h));
  background: var(--fy-ground); position: relative; z-index: 0;
  padding: 72px var(--fy-gutter);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
}
/* The opening panel's own container is the 1120 wrap, not the 1376 media frame:
   the display line is set to fit INSIDE it, and a headline that hangs past its
   own container reads as a rendering fault rather than as scale. */
.fy-opening-in { inline-size: min(100%, var(--fy-wrap)); }
.fy-kicker {
  font-family: var(--fy-mono); font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--fy-muted); margin-block-end: 24px;
  text-wrap: balance;
}
/* THE PADDING IS AN OPTICAL SHIM, NOT SPACING. Measured at 1440, the two
   headline lines centred on 722.0 / 722.5 while the kicker, the context line and
   the arrow centred on 718.5–719.5: a centred line centres its ADVANCE-WIDTH
   box, and this face's sidebearings put the glyphs ~3px right of it. Six pixels
   of trailing padding moves the text back without moving the element, so the
   box centres a probe reads stay identical. */
.fy-headline {
  font-size: clamp(41px, 8.2vw, 138px); font-weight: 400; line-height: 1.02;
  letter-spacing: -0.04em; color: var(--fy-ink);
  text-wrap: balance; padding-inline-end: 6px;
}
.fy-context {
  margin-block-start: 28px; font-size: 18.4px; line-height: 30.4px;
  color: var(--fy-quiet); max-inline-size: 56ch; margin-inline: auto;
}
/* ONE quiet pill on the page axis. The label stays in the DOM for anything that
   reads the input by its accessible name, and leaves the page: a hero that has
   to caption its own search box is not the reference's hero. */
.fy-opening .hp-search { margin-block: 28px 0; text-align: start; max-inline-size: 520px; margin-inline: auto; }
.fy-opening .hp-search-label {
  position: absolute; inline-size: 1px; block-size: 1px; padding: 0; border: 0;
  margin: 0; min-block-size: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
.fy-opening .hp-search-input {
  border-radius: 999px; border: 1px solid var(--fy-hair); padding: 12px 20px;
  background: var(--fy-ground); text-align: center;
}
.fy-controls { min-block-size: 48px; margin-block-start: 28px; display: flex; justify-content: center; }
.fy-continue {
  inline-size: 48px; block-size: 48px; padding: 0; border: 0; border-radius: 50%;
  background: 0 0; color: rgb(115, 115, 115); cursor: pointer; display: grid; place-items: center;
  text-decoration: none;
}
.fy-continue:hover { background: #0000000a; }
.fy-continue:focus-visible { outline: solid 2px; outline-offset: 3px; }

.fy-response {
  min-block-size: max(540px, var(--fy-window-viewport-height)); z-index: 2;
  display: flex; align-items: center; justify-content: center;
}
.fy-response-left, .fy-response-right {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 84px var(--fy-gutter); text-align: center;
}
.fy-response-headline {
  font-size: clamp(50px, 9.2vw, 155px); font-weight: 400; line-height: 1.02;
  letter-spacing: -0.04em; color: #ffffff;
}
.fy-response-line {
  margin-block-start: 28px; font-size: 18.4px; line-height: 30.4px;
  color: var(--fy-dark-body); max-inline-size: 52ch;
}
.fy-bars { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

/* ══ the black opening block ═════════════════════════════════════════════ */
.fy-dark {
  background: var(--fy-dark); color: var(--fy-dark-ink); color-scheme: dark;
  position: static;
}
.fy-beat { padding-block: var(--fy-beat); }
.fy-beat-first { padding-block: 80px var(--fy-beat); }
.fy-beat-centred { text-align: center; }
.fy-dark h2 {
  font-size: clamp(26px, 2.25vw, 32px); font-weight: 400; line-height: 1.3;
  letter-spacing: -0.025em; color: var(--fy-dark-ink);
}
.fy-dark .fy-beat-body {
  font-size: 17px; line-height: 1.6; color: var(--fy-dark-body); margin-block-start: 16px;
  max-inline-size: 62ch;
}
.fy-beat-centred .fy-beat-body { margin-inline: auto; }
/* THE REFERENCE'S PULL-QUOTE: centred sans at ~24px with an em-dash attribution
   and no rule. The left rule plus indent took ~60px off a 344px measure at 390,
   giving a nine-line ragged block set inside a six-line paragraph. */
.fy-pullquote {
  font-size: 24px; line-height: 1.4; text-align: center;
  color: var(--fy-dark-ink); margin: 40px auto 0; max-inline-size: 44ch;
  padding: 0; border: 0; text-wrap: balance;
  /* "…is not a break-" / "in, and a full set…" — the reference never hyphenates
     display copy, and a centred 24px quote is the last place to start. */
  hyphens: none; -webkit-hyphens: none;
}
.fy-quote-by {
  display: block; margin-block-start: 16px; font-size: 14px; line-height: 21px;
  color: var(--fy-dark-quiet);
}

/* the stat figures */
.fy-metrics {
  display: grid; gap: 32px 48px; margin-block-start: 48px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}
.fy-metric-value {
  color: var(--fy-dark-ink); font-size: 48px; font-weight: 400; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; line-height: 1; display: block;
}
.fy-metric-final {
  clip-path: inset(50%); white-space: nowrap; border: 0; inline-size: 1px; block-size: 1px;
  padding: 0; position: absolute; overflow: hidden;
}
.fy-metric-caption {
  margin-block-start: 12px; font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet);
}

/* the bar chart */
.fy-chart-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-areas: "chart copy"; align-items: center; gap: clamp(48px, 6.5vw, 96px);
}
/* THE PLOT IS SVG; EVERY LABEL IS HTML. A label inside a viewBox renders at
   whatever the box scales to — 16px declared measured ~12px at 1440 and ~8-9px
   at 390 — so the type is set in real CSS pixels beside the drawing and
   positioned from the same plot geometry the bars use. The column rhythm below
   is the bars' own: a 60/584 left inset, a 32/584 right inset, nine equal
   columns and a 12/584 gap, which resolves each column to exactly one bar. */
.fy-chart-figure {
  grid-area: chart; margin: 0; min-inline-size: 0;
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0 10px;
}
.fy-chart-copy { grid-area: copy; min-inline-size: 0; }
.fy-chart-ylabel {
  grid-column: 1; grid-row: 1; align-self: center;
  writing-mode: vertical-rl; transform: rotate(180deg);
  font-size: 16px; line-height: 1.2; color: var(--fy-dark-ink);
}
.fy-plot-wrap { grid-column: 2; grid-row: 1; position: relative; aspect-ratio: 584 / 320; }
.fy-plot { inline-size: 100%; block-size: 100%; display: block; }
.fy-chart-values { position: absolute; inset: 0; pointer-events: none; }
.fy-chart-value {
  position: absolute; transform: translate(-50%, -6px);
  font-family: var(--fy-mono); font-size: 16px; line-height: 1;
  font-variant-numeric: tabular-nums; color: var(--fy-dark-ink);
}
.fy-chart-ids, .fy-chart-axis { grid-column: 2; }
/* IDS IN MONO, like every other identifier on this site — the chart was the one
   place the convention broke, on the same black block as the A1-A9 list that
   keeps it. */
.fy-chart-ids {
  grid-row: 2; display: grid; grid-template-columns: repeat(9, minmax(0, 1fr));
  column-gap: calc(12 / 584 * 100%);
  padding-inline: calc(60 / 584 * 100%) calc(32 / 584 * 100%);
  margin-block-start: 6px; text-align: center;
  font-family: var(--fy-mono); font-size: 16px; line-height: 1.2; color: var(--fy-dark-ink);
}
/* ONE centred axis word, which the reference has and this chart did not. */
.fy-chart-axis {
  grid-row: 3; margin-block-start: 10px; text-align: center;
  font-size: 16px; line-height: 1.2; color: var(--fy-dark-quiet);
}
.fy-baseline { stroke: var(--fy-dark-axis); stroke-width: 1px; vector-effect: non-scaling-stroke; }
/* TWO NEUTRAL FILLS, AND NO ACCENT. The brand blue used to single out two bars
   for a fact the chart could not show; the split is plotted now, and a chart
   about where an answer could come from has no business borrowing the colour
   that means emphasis on a diagram three sections up. */
.fy-bar { fill: var(--fy-dark-bar); }
.fy-bar-local { fill: url(#fy-chart-hatch); }
.fy-chart-key {
  display: flex; flex-wrap: wrap; gap: 4px 20px; margin-block-start: 20px;
  font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet);
}
.fy-chart-swatch {
  inline-size: 12px; block-size: 12px; border-radius: 2px; display: inline-block;
  margin-inline-end: 8px; vertical-align: -1px;
}
.fy-chart-swatch[data-fill="outside"] { background: var(--fy-dark-bar); }
.fy-chart-swatch[data-fill="local"] {
  background-color: rgba(255, 255, 255, 0.18);
  background-image: repeating-linear-gradient(45deg,
    rgba(255, 255, 255, 0.42) 0 3px, rgba(255, 255, 255, 0) 3px 7px);
}

/* the traced figures */
.fy-trace-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center; gap: clamp(48px, 6.5vw, 96px);
}
.fy-trace-copy { min-inline-size: 0; }
.fy-figure { margin: 0; min-inline-size: 0; color: var(--fy-dark-ink); }
.fy-drawing { inline-size: 100%; block-size: auto; display: block; overflow: visible; }
.fy-structure { fill: none; stroke: #454545; stroke-width: 1px; vector-effect: non-scaling-stroke; }
.fy-trace { fill: none; stroke: var(--fy-figure-accent); stroke-width: 2.5px; }
.fy-pipeline .fy-trace { vector-effect: none; }
.fy-triangle .fy-trace { vector-effect: non-scaling-stroke; }
.fy-checkpoint-base { fill: #000000; }
.fy-checkpoint { stroke-width: 1px; }
.fy-speed-node { stroke: var(--fy-figure-accent); stroke-width: 1.5px; }
/* OUTLINED BY DESIGN, NOT BY PROGRESS. The local lane is the one node that stays
   hollow after the trace reaches it, because that is what the diagram is saying:
   two of the three lanes produce evidence anybody can go and check, and the third
   produces evidence only the maintainer can make. It has to out-specify every
   branch that paints a reached node solid — an SVG fill presentation attribute
   cannot, because ANY CSS fill rule beats it, which is exactly how this shipped
   solid the first time. */
.fy-figure .fy-speed-node.fy-node-hollow { fill: none; }
/* The ranked figure's labels, in real CSS pixels over the drawing. */
.fy-drawing-box { position: relative; }
/* THE FOUR SYSTEMS, NAMED OVER THE BOARD THEY DIVIDE. Generic structural
   labels — Repository, Build, Production, Registry — not per-repository facts,
   so they are authored rather than derived; which PHASES sit in each is the
   derived half, and it is what sets the zone widths. HTML and not SVG text for
   the same reason the ranked figure's labels are: an SVG label renders at
   whatever the viewBox scales to, which put a declared 14px at ~8px on a phone.
   They sit in the empty band above the frame, so they cannot cross the trace or
   a checkpoint at any width. */
.fy-zone-labels { position: absolute; inset: 0; pointer-events: none; }
.fy-zone-label {
  position: absolute; inset-block-start: 0; transform: translateX(-50%);
  font-family: var(--fy-mono); font-size: 9px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--fy-dark-quiet); line-height: 1;
  white-space: nowrap;
}
.fy-speed-labels { position: absolute; inset: 0; pointer-events: none; }
/* max-content, because an absolutely positioned box with only an inline START
   offset shrink-to-fits against the space to its RIGHT — and the transform that
   right-anchors it runs after layout. The third label was therefore sized in a
   12% gutter and broke into four lines that hung out of the figure. */
.fy-speed-label {
  position: absolute; color: var(--fy-dark-ink); font-size: 14px; line-height: 1.25;
  inline-size: max-content; max-inline-size: min(46%, 240px); text-wrap: balance;
}
.fy-speed-label[data-place="above-center"] { transform: translate(-50%, -100%); text-align: center; }
.fy-speed-label[data-place="above-start"] { transform: translateY(-100%); text-align: start; }
.fy-speed-label[data-place="below-end"] { transform: translateX(-100%); text-align: end; }
.fy-rank-label {
  position: absolute; transform: translateY(-50%);
  color: var(--fy-dark-quiet); font-size: 12px; font-family: var(--fy-mono);
  letter-spacing: 0.06em; line-height: 1;
}
/* THE WEAKEST NODE IS HOLLOW AND DASHED — D7 specified both; only the hollow
   half landed, so the one node the figure sets apart was set apart by half a
   treatment. */
.fy-figure .fy-speed-node.fy-node-hollow { stroke-dasharray: 3 3; }
/* T12 · A GRID, so the six items form columns. Wrapped as a flex row its two
   rows started at 768 / 911 / 1039 and 768 / 946 / 1090 — six items in two rows
   and five different left edges. */
.fy-trace-legend {
  list-style: none; margin: 16px 0 0; padding: 0;
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 18px; font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet);
}
.fy-trace-legend li { display: flex; align-items: baseline; gap: 8px; }
.fy-trace-legend li[data-reached="true"] { color: var(--fy-dark-ink); }
.fy-legend-no { font-family: var(--fy-mono); font-size: 12px; color: var(--fy-accent); }

/* the attack list */
.fy-sourcing {
  max-inline-size: 800px; margin: 40px auto 0; text-align: start;
  font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet);
}
.fy-attacks { list-style: none; margin: 20px auto 0; padding: 0; max-inline-size: 800px; text-align: start; }
.fy-attack { border-block-start: 1px solid var(--fy-dark-rule); }
.fy-attack:last-child { border-block-end: 1px solid var(--fy-dark-rule); }
.fy-attack-trigger {
  inline-size: 100%; min-block-size: 56px; padding: 14px 0; background: 0 0; border: 0;
  color: var(--fy-dark-ink); font: inherit; text-align: start; cursor: pointer;
  display: flex; align-items: baseline; gap: 12px;
}
.fy-attack-id { font-family: var(--fy-mono); font-size: 13px; color: var(--fy-accent); flex: 0 0 auto; }
.fy-attack-name { font-size: 17px; flex: 1 1 auto; }
.fy-attack-mark { font-family: var(--fy-mono); font-size: 13px; color: var(--fy-dark-quiet); flex: 0 0 auto; }
.fy-attack-trigger[aria-expanded="true"] .fy-attack-mark { color: var(--fy-accent); }
.fy-chevron {
  flex: 0 0 auto; color: var(--fy-dark-quiet); transform: rotate(0deg);
  align-self: center;
}
.fy-attack-trigger[aria-expanded="true"] .fy-chevron { transform: rotate(180deg); color: var(--fy-accent); }
.fy-attack-panel { padding-block: 0 24px; display: grid; gap: 12px; }
.fy-attack-line { font-size: 17px; line-height: 1.6; color: var(--fy-dark-body); }
/* ONE RULE FOR BOTH COPIES OF THIS COMPONENT, AND THE LABEL TAKES ITS OWN LINE.
   T10 made this a two-column grid so the run-in label would hang the list. In a
   GRID each '<code>' is its own item and each ", " between them is an ANONYMOUS
   item, so auto-placement dealt them alternately into the two tracks: nine ids
   in column 2 and nine bare commas stacked in column 1, 179px from the token
   each belonged to — measured at x=320 against ids at x=499.4 (1440) and x=24
   against 203.4 (390), and up to 81 of them on a fully expanded page. It was
   the payoff of the one interaction the section's copy advertises.

   The label on its own line gives the ids the whole measure, restores ordinary
   inline layout (so a comma can never be dealt anywhere but hard against the
   token before it), and makes home's instance and methodology's '.tx-class-
   controls' — which wrapped back to the LABEL's edge while home hung at the
   list's — one behaviour instead of two. 'overflow-wrap: normal' plus 'nowrap'
   on the code keeps an identifier whole at 390, where 'branch-protection',
   'pr-template', 'maintainer-mfa' and 'publish-provenance' were splitting. */
.fy-attack-checks, :root .tx-class-controls {
  display: block; overflow-wrap: normal;
}
.fy-attack-checks { font-size: 14px; line-height: 1.7; color: var(--fy-dark-quiet); }
.fy-attack-checks > .fy-attack-label, :root .tx-class-controls > .tx-label {
  display: block; margin-block-end: 2px;
}
.fy-attack-checks code, :root .tx-class-controls code { white-space: nowrap; }
.fy-attack-checks code { color: var(--fy-dark-ink); }
.fy-attack-label {
  font-family: var(--fy-mono); font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--fy-dark-quiet); white-space: nowrap;
}
.fy-incident { font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet); }
.fy-incident a { color: var(--fy-dark-ink); }
.fy-incident-when { font-family: var(--fy-mono); margin-inline: 8px; }
/* ONE COMPONENT, BOTH PAGES. Methodology's 'reported' mark is a 999px pill;
   home's was a ~2px-radius rectangle among 999px chips, with 'margin-inline-
   start: 8px' stacked on top of the 8px '.fy-incident-when' already supplies
   and on top of the source space in the sourcing sentence — a double word space
   in front of it. The radius, the padding and the spacing are the values
   ':root .tx-reported' sets, so the two instances are the same object. */
.fy-reported {
  font-family: var(--fy-mono); font-size: 12px; border: 1px solid var(--fy-dark-rule);
  border-radius: 999px; padding: 0 8px; margin-inline-start: 0;
  color: var(--fy-dark-quiet); white-space: nowrap;
}

/* ══ the pill nav ════════════════════════════════════════════════════════ */
.fy-chapters {
  z-index: 20; inline-size: fit-content;
  max-inline-size: calc(100% - var(--fy-gutter) * 2);
  overscroll-behavior-x: contain; scrollbar-width: none;
  border: 1px solid var(--fy-hair); background: var(--fy-ground);
  border-radius: 999px; justify-content: start; gap: 4px;
  margin: 160px auto 24px; padding: 3px; display: flex;
  position: sticky; inset-block-start: 12px; overflow-x: auto;
  /* T16 · On its way out of its sticky container the segmented control slides
     up THROUGH this band, and two white 999px pills with no elevation between
     them read as one broken widget. The pass-through is the reference's own
     behaviour; what was missing is any cue that one is in front. */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.fy-chapters::-webkit-scrollbar { display: none; }
/* The secondary pages' variant. On home the nav arrives after a full black
   block and on methodology after a full-width figure, where the reference's
   160px of air is the point; two elements into a directory it is a hole. */
.fy-chapters-tight { margin-block-start: 32px; }
/* 44px, not the reference's 40px. The reference is a launch page; this is a
   directory whose shared component layer enforces a 44px tap target on every
   other control, and a nav that is the only navigation on a 13,000px page is
   the last place to make an exception. The pill's visual weight is unchanged —
   the extra 4px is padding, not type. */
.fy-chapters a {
  min-block-size: 44px; color: var(--fy-text); border-radius: 999px;
  flex: 0 0 auto; align-items: center; gap: 4px; padding: 10px 16px;
  font-size: 14px; line-height: 1.4; text-decoration: none; display: flex; white-space: nowrap;
}
.fy-chapters a span { font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: isolate; }
.fy-chapters a span::after { content: "."; }
.fy-chapters a[aria-current], .fy-chapters a:hover { background: var(--fy-surface-2); color: var(--fy-text); }
.fy-chapters a:focus-visible { outline: 2px solid var(--fy-accent); outline-offset: -2px; }
/* OVER A DARK SECTION THE NAV INVERTS. The reference never shows a white pill
   on black, and a 1px #e6e6e6 hairline on #000 is simply not there. The spy
   writes data-on-dark from whether the active section is inside .fy-dark,
   which is the same class the black block itself is painted by. */
.fy-chapters[data-on-dark="true"] { background: #000000; border-color: #333333; }
.fy-chapters[data-on-dark="true"] a { color: var(--fy-dark-ink); }
.fy-chapters[data-on-dark="true"] a[aria-current],
.fy-chapters[data-on-dark="true"] a:hover { background: #1a1a1a; color: #ffffff; }
.fy-chapter { padding-block: var(--fy-beat); }
/* EVERY anchor target clears the sticky nav, not just the ones this design
   names its own classes for. Two of the methodology's eight pills point at
   sections the SHARED modules render under their own class name, so a per-class rule
   landed those headings underneath the bar that had just been used to jump to
   them. One declaration, and it cannot go stale when a shared module renames a
   class. */
main [id] { scroll-margin-top: 88px; }
/* T17 · THE CLEARANCE ON THE FIRST LANDING IS THE NAV'S OWN BOTTOM MARGIN, and
   no scroll-margin can supply it. 88px is the nav's PINNED offset; on a page's
   first target the nav has not reached that offset, so it is still in flow
   DIRECTLY ABOVE the section — its bottom and the section's top are the same
   edge, at any scroll-margin. "01 Search" therefore landed with 0.0px of
   clearance while every other landing on every page cleared by 23.7-200px.
   24px of real air under the rail is the only thing that fixes it, and it is
   the gap the rail wanted anyway. */
.fy-chapter-head { text-align: center; max-inline-size: 900px; margin-inline: auto; }
.fy-chapter-num {
  font-family: var(--fy-mono); font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--fy-muted); margin-block-end: 20px;
}
.fy-chapter h2 { font-size: 64px; line-height: 1.05; letter-spacing: -1.28px; color: var(--fy-ink); }
.fy-chapter-lead {
  margin-block-start: 20px; font-size: 18.4px; line-height: 30.4px; color: var(--fy-quiet);
  max-inline-size: 68ch; margin-inline: auto;
}

/* ══ diagram: the overview groups ════════════════════════════════════════ */
.fy-overview { margin: 0; padding-block-start: 56px; display: grid; gap: 20px; }
.fy-ov-row { display: grid; grid-template-columns: minmax(220px, 260px) minmax(0, 1fr); gap: 40px; align-items: stretch; }
/* The shared row is the premise the three lanes are deltas from; a hairline
   under it says so without a heading. */
.fy-ov-row[data-ov="shared"] { padding-block-end: 20px; border-block-end: 1px solid var(--fy-hair); }
/* The L-shaped label-to-group bracket the reference draws: a hairline down the
   gutter with a short stub into the group it names. Purely decorative, so it
   goes when the row stacks. */
.fy-ov-label { padding-block: 8px; position: relative; }
.fy-ov-label::before {
  content: ""; position: absolute; inset-block: 10px; inset-inline-start: calc(100% + 20px);
  inline-size: 1px; background: var(--fy-hair);
}
.fy-ov-label::after {
  content: ""; position: absolute; inset-block-start: 32px; inset-inline-start: calc(100% + 20px);
  inline-size: 20px; block-size: 1px; background: var(--fy-hair);
}
.fy-ov-label h3 { font-size: 22px; font-weight: 500; color: var(--fy-ink); }
.fy-ov-label p { margin-block-start: 12px; font-size: 17px; line-height: 28px; color: var(--fy-quiet); }
.fy-ov-group {
  position: relative;
  border: 2px solid rgba(0, 0, 0, 0.44); border-radius: 16px; background: var(--fy-ground);
  padding: 16px; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
/* THE EMPHASIS IS ON THE SIGNED CI LANE, which is the strongest of the three.
   It used to be on the local lane — the weakest — while lanes 1 and 2 were
   drawn identically, which erased the signature and left a reader with the
   trust ordering backwards. */
.fy-ov-group[data-emphasis="true"] { border-color: var(--fy-accent); }
.fy-ov-marker {
  position: absolute; inset-block-start: -10px; inset-inline-start: 16px;
  background: var(--fy-ground); padding-inline: 8px; font-family: var(--fy-mono);
  font-size: 11px; letter-spacing: 0.06em; color: var(--fy-accent);
}
.fy-ov-panel { background: var(--fy-surface-3); border-radius: 8px; padding: 16px; }
/* The local lane's one extra card wears the same dashed weaker treatment the
   +local badge and the local lane chip wear, everywhere on this site. */
.fy-ov-panel[data-ov-panel="local"] {
  background: var(--fy-ground); border: 1px dashed var(--fy-na); grid-column: 1 / -1;
}
.fy-ov-panel[data-ov-panel="none"] { background: 0 0; border: 1px solid var(--fy-hair); }
.fy-ov-panel h4 { font-size: 17px; font-weight: 500; color: var(--fy-ink); }
.fy-ov-panel p { margin-block-start: 8px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
/* T11 · NUMERAL AND UNIT IN SEPARATE CELLS. Set inline, four counts of one and
   two digits put the word "checks" at four different x positions down a column
   of otherwise identical panels. */
.fy-ov-count {
  font-family: var(--fy-mono); font-variant-numeric: tabular-nums; color: var(--fy-text);
  display: inline-block; min-inline-size: 2.4ch; text-align: end;
}
/* The arithmetic a security reader does on this figure, closed on the figure:
   26 + 6 + 4 + 16 = 52, and the two that are missing are missing on purpose. */
.fy-ov-foot {
  display: block; margin-block-start: 8px; font-family: var(--fy-mono); font-size: 12px;
  color: var(--fy-muted);
}

/* ══ diagram: nested regions and node chips ══════════════════════════════ */
.fy-network {
  border: 1px solid var(--fy-line); border-radius: 8px; background: var(--fy-ground);
  padding: 24px; margin: 0;
}
.fy-network-head { margin-block-end: 20px; }
.fy-annotate {
  background: 0 0; border: 0; padding: 0; font: inherit; color: var(--fy-ink); cursor: pointer;
  font-size: 22px; font-weight: 500;
  text-decoration: underline; text-decoration-style: dotted;
  text-decoration-color: #c2c2c2; text-underline-offset: 6px;
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.fy-annotate:hover, .fy-annotate[aria-expanded="true"] {
  text-decoration-style: solid; text-decoration-color: currentcolor;
}
/* AN IRREGULAR COMPOSITION, NOT A LIST. The reference's grid is one tall narrow
   column, two stacked regions in a wide middle, two stacked narrow ones on the
   right, and a short full-width strip across the bottom. Which phase lands in
   which slot is computed from its control count, so the diagram rearranges
   itself rather than being redrawn. The full-width slot is a 1 / -1 span rather
   than a named area, so a seventh phase adds a row instead of landing on top of
   the sixth. */
.fy-regions {
  display: grid; gap: 16px;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 2fr) minmax(0, 0.92fr);
}
/* THE REGIONS ARE NEUTRAL. Four tints exist on this page and they encode the
   evidence class — what could be looked at to answer a check. A phase is not an
   evidence class, so a tinted phase region spends the same four colours on a
   second meaning, and the green one spends a verdict colour on decoration. */
.fy-region {
  border-radius: 8px; border: 1px solid var(--fy-edge-grey);
  background: var(--fy-tint-grey); padding: 16px;
}
.fy-region[data-slot="narrowA"] { grid-column: 1; grid-row: 1 / span 2; }
.fy-region[data-slot="wide1"] { grid-column: 2; grid-row: 1; }
.fy-region[data-slot="wide2"] { grid-column: 2; grid-row: 2; }
.fy-region[data-slot="narrowB"] { grid-column: 3; grid-row: 1; }
.fy-region[data-slot="narrowC"] { grid-column: 3; grid-row: 2; }
.fy-region[data-slot="full"] { grid-column: 1 / -1; }
.fy-region-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; }
.fy-region-title { font-size: 17px; font-weight: 500; color: var(--fy-ink); }
.fy-region-note { font-size: 14px; line-height: 21px; color: var(--fy-muted); margin-block-start: 4px; margin-block-end: 12px; }
/* The third level of nesting, and the reference's own offset stacked-card edge:
   a second dashed card peeking out behind the first, which is how that diagram
   says "there are more of these than the one you can see". The overhang is 6px
   inside a 16px region padding, so it can never reach the document edge. */
.fy-stack { position: relative; margin-block-start: 12px; }
.fy-stack::before {
  content: ""; position: absolute; inset-block: 6px -6px; inset-inline: 6px -6px;
  border: 1px dashed var(--fy-dash); border-radius: 8px; background: var(--fy-ground);
}
.fy-stack > * { position: relative; }
.fy-repeat {
  border: 1px dashed var(--fy-dash); border-radius: 8px;
  background: var(--fy-ground); padding: 12px;
}
/* The class-C group is the one place violet appears inside a region, and it is
   the same violet the explorer's local cards use — the class encoding, again. */
.fy-repeat[data-group="local"] {
  border-color: var(--fy-edge-violet); background: var(--fy-tint-violet);
}
/* THE COUNTER GETS ITS OWN CELL AND NEVER WRAPS. In a flex row it was free to
   break between the ellipsis and the number, which is how "1…" and "6" ended up
   on two lines at opposite ends of a two-line label. */
.fy-repeat-label {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 12px;
  font-size: 14px; color: var(--fy-muted); margin-block-end: 10px;
}
.fy-repeat-count {
  font-family: var(--fy-mono); font-size: 13px; color: var(--fy-muted);
  white-space: nowrap; font-variant-numeric: tabular-nums;
}
.fy-nodes { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
/* THE VERDICT WORD WRAPS; THE IDENTIFIER NEVER DOES. This pair used to live
   only inside the 767px block below, so at 1440 the chips in a narrow
   region shredded their ids mid-token: 'publish-provenance' set as
   'publis' / 'h-' / 'proven' in the five-across Distribution & publishing band,
   which is not a control id and cannot be searched for. The squeeze is round
   2's new verdict word — 'NOT IN THIS RECORD' is the longest in the set and
   carries 'flex: 0 0 auto', so it never yields and the label absorbed all of
   it. Letting the chip wrap to a second flex line gives the label the whole
   chip width, and 'overflow-wrap: normal' then confines any break to a real
   hyphen. An identifier is the one string on this page a reader copies out. */
.fy-node {
  min-block-size: 44px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--fy-ground); border: 1px solid var(--fy-edge-grey); border-radius: 8px;
  padding: 8px 12px; cursor: pointer; text-align: start; font: inherit;
  color: var(--fy-text); inline-size: 100%;
}
.fy-node:hover, .fy-node[aria-expanded="true"] { border-color: var(--fy-muted); }
.fy-node:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: 3px; }
/* The glyph carries the class, and so does its colour — the same four the key
   above the explorer names. Not a texture, not four shades of the same grey. */
.fy-node-icon { inline-size: 20px; block-size: 20px; flex: 0 0 auto; color: var(--fy-muted); }
.fy-node-icon[data-cls="A"], .fy-node-icon[data-cls="Aprime"] { color: #4a90d9; }
.fy-node-icon[data-cls="B"] { color: #6f6f74; }
.fy-node-icon[data-cls="C"] { color: #8b62e0; }
.fy-node-icon[data-cls="M"] { color: #262626; }
.fy-node-label { font-family: var(--fy-mono); font-size: 13px; line-height: 22px; overflow-wrap: normal; }
.fy-node-verdict {
  margin-inline-start: auto; font-family: var(--fy-mono); font-size: 11px;
  letter-spacing: 0.04em; text-transform: uppercase; flex: 0 0 auto;
  border: 1px solid currentcolor; border-radius: 999px; padding: 0 7px; line-height: 18px;
}
/* T14 · THE TINT REGISTER, WHERE THESE ARE TINTS. The reference's light palette
   fills a mark with a pastel and outlines it with the same hue two steps down;
   ours outlined a white pill in the most saturated green on the page. The
   semantics are untouched — colour AND shape AND word — and the word keeps the
   full-strength hue, so contrast goes up rather than down. Red stays red, and
   stays the fail state only. */
.fy-node[data-verdict="pass"] { border-color: var(--fy-edge-pass); }
.fy-node[data-verdict="pass"] .fy-node-verdict {
  color: var(--fy-pass); background: var(--fy-tint-pass); border-color: var(--fy-edge-pass);
}
.fy-node[data-verdict="fail"] { border-color: var(--fy-fail); }
.fy-node[data-verdict="fail"] .fy-node-verdict { color: var(--fy-fail); }
.fy-node[data-verdict="gap"] { border-color: var(--fy-edge-warn); border-style: dashed; }
.fy-node[data-verdict="gap"] .fy-node-verdict {
  color: var(--fy-warn); background: var(--fy-tint-warn); border-color: var(--fy-edge-warn);
}
/* THREE DATA STATES, THREE TREATMENTS. no answer and info were fourteen
   units of grey apart with a border-style between them; the only other thing
   telling them apart was the word. no answer is dashed with a STRUCK icon —
   the check did not happen — and info loses its pill entirely, because it is
   not a verdict at all and a pill is what a verdict looks like here. */
.fy-node[data-verdict="unverified"] { border-style: dashed; border-color: var(--fy-na); }
.fy-node[data-verdict="unverified"] .fy-node-icon { opacity: 0.55; }
.fy-node[data-verdict="unverified"] .fy-node-label { text-decoration: line-through; text-decoration-color: var(--fy-na); }
.fy-node[data-verdict="unverified"] .fy-node-verdict { color: var(--fy-na); border-style: dashed; }
.fy-node[data-verdict="info"] { border-color: var(--fy-line); }
.fy-node[data-verdict="info"] .fy-node-verdict { color: var(--fy-muted); border: 0; padding: 0; }
/* THE FIFTH STATE, AND IT IS NOT A VERDICT. The record holds no row for this
   control at all — so it gets the dotted register this page already spends on
   "not a thing that was scored", a muted id, and the words. Ten of the 54 were
   rendering as a bare chip with no badge beside siblings that all carried one,
   which reads as data that failed to render. */
.fy-node[data-verdict="absent"] { border-style: dotted; border-color: var(--fy-line); }
.fy-node[data-verdict="absent"] .fy-node-icon { opacity: 0.45; }
.fy-node[data-verdict="absent"] .fy-node-label { color: var(--fy-muted); }
.fy-node[data-verdict="absent"] .fy-node-verdict {
  color: var(--fy-muted); border-style: dotted; border-color: var(--fy-line);
}
/* THE LOCAL LANE, AT THE ROW. A green PASS here is the repository's owner
   asserting his own posture on his own laptop; the one beside it may be
   something an independent scan observed, and there was no way on the page to
   tell which. Dashed and named, the same treatment the header badge wears. */
.fy-node[data-lane="local"] { border-style: dashed; }
.fy-node-lane {
  font-family: var(--fy-mono); font-size: 11px; letter-spacing: 0.04em; flex: 0 0 auto;
  border: 1px dashed var(--fy-na); border-radius: 999px; padding: 0 7px; line-height: 18px;
  color: var(--fy-na); margin-inline-start: 6px;
}

/* ══ the toggletip ═══════════════════════════════════════════════════════ */
.fy-tip-holder { position: relative; }
.fy-tip {
  /* Absolutely positioned against its holder so it scrolls with the chip it
     belongs to, and shifted horizontally by the script when that would put it
     off screen — 340px anchored to a holder in the right-hand column pushed the
     document 6px sideways at 1440 and 17px at 390, which no CLOSED-state probe
     can see. The width is capped against the viewport for the same reason. */
  position: absolute; z-index: 50; inset-inline-start: 0; inset-block-start: calc(100% + 8px);
  inline-size: min(340px, calc(100vw - 16px)); background: var(--fy-ground);
  border: 1px solid var(--fy-line); border-radius: 10px;
  box-shadow: rgba(0, 0, 0, 0.15) 0 12px 40px; padding: 22px;
  font-size: 16px; line-height: 1.45; color: #181818; text-align: start;
}
.fy-tip[data-side="top"] { inset-block-start: auto; inset-block-end: calc(100% + 8px); }
.fy-tip-title { font-family: var(--fy-mono); font-size: 13px; color: var(--fy-muted); margin-block-end: 8px; }
.fy-tip-body { margin-block-end: 10px; }
.fy-tip-meta { font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-tip-links { margin-block-start: 12px; font-size: 14px; }
.fy-tip-close {
  position: absolute; inset-block-start: 6px; inset-inline-end: 6px;
  inline-size: 32px; block-size: 32px; border: 0; border-radius: 8px; background: 0 0;
  color: var(--fy-muted); cursor: pointer; font: inherit; line-height: 1;
}
.fy-tip-close:hover { background: #f5f5f5; color: #000; }

/* ══ the operating loop ══════════════════════════════════════════════════ */
.fy-loop {
  position: relative; inline-size: 100%; min-inline-size: 0; margin: 0;
  color: var(--fy-ink); background: var(--fy-ground);
  /* The card type is sized in cqw. WITHOUT a container those units silently
     resolve against the VIEWPORT, so at 1440 every clamp pinned to its maximum
     and an 18px title landed in a 164px circle. The container is what makes the
     type a property of the diagram rather than of the window. */
  container: factory-loop / inline-size;
}
.fy-loop-stage {
  inline-size: min(100%, 760px); margin-inline: auto; padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px;
  background-image: radial-gradient(rgba(0, 0, 0, 0.08) 0.7px, rgba(0, 0, 0, 0) 0.9px);
  background-size: 6px 6px;
}
/* The process box is WIDER than the stage it sits in, and that is the
   reference's own trick: a 5-point circle at radius 30% needs an 840px box to
   give 193px cards, but the dotted stage reads better at 760. So it overflows
   symmetrically and pulls back the empty band above and below the circle, which
   an aspect-ratio box would otherwise leave as 190px of dotted nothing. */
.fy-process {
  position: relative; inline-size: 118%; margin-inline: -9%;
  margin-block: -64px -112px; aspect-ratio: 1 / 1;
}
.fy-loop-cards { list-style: none; margin: 0; padding: 0; }
/* PERCENTAGE PADDING RESOLVES AGAINST THE CONTAINING BLOCK, NOT THE ELEMENT.
   7% padding on a 193px card inside an 840px process box computes to 58.6px
   a side — measured — which left 75px of text width inside a 193px circle and
   wrapped "One commit, one snapshot" onto FOUR lines. 26px is the inscribed
   square of a 193px circle with a little air, and it does not care what the box
   around it is; the compact rail overrides it anyway. */
.fy-loop-card {
  position: absolute; inset-block-start: var(--fy-circle-y); inset-inline-start: var(--fy-circle-x);
  inline-size: 23%; block-size: 23%; transform: translate(-50%, -50%);
  border-radius: 50%; background: var(--fy-ground); border: 1px solid rgba(0, 0, 0, 0);
  display: grid; place-content: center; text-align: center; padding: 26px;
}
.fy-card-ring { position: absolute; inset: -1px; overflow: visible; }
/* The resting ring: ZERO-LENGTH dashes with round caps, which is what renders a
   dot rather than a dash. The declaration is the reference's; what it renders at
   depends entirely on pathLength, and getting that wrong is silent. The circle
   is authored in a 100-unit viewBox scaled to a ~193px card, so one user unit is
   ~1.9px: unnormalised, 1.25-wide dots at a 1.9px pitch overlap into a solid
   hairline, and pathLength="1" collapses the whole ring to a single dot because
   the gap becomes the entire circumference. pathLength="150" makes one dash unit
   about 4px, which is the pitch the reference reads at. */
.fy-card-ring circle {
  fill: none; stroke: var(--fy-ink); stroke-width: 1.25px; stroke-linecap: round;
  stroke-dasharray: 0, 1; vector-effect: non-scaling-stroke;
}
.fy-active-ring, .fy-arrival-ring {
  border: 2px solid var(--fy-accent); border-radius: inherit; pointer-events: none;
  position: absolute; inset: -1px; opacity: 0;
}
.fy-card-meta { font-family: var(--fy-mono); font-size: 12px; line-height: 1.5; color: var(--fy-muted); }
/* The brief's own measured clamps, restored now that the container exists.
   Without the loop container these cqw units resolved
   against the VIEWPORT and every clamp pinned to its maximum. */
.fy-card-title {
  font-size: clamp(16px, 1.8cqw, 20px); font-weight: 500; letter-spacing: -0.01em;
  line-height: 1.26; margin-block-start: 6px; color: var(--fy-ink);
  text-wrap: balance; hyphens: manual;
}
.fy-card-body { font-size: clamp(13px, 1.35cqw, 15px); line-height: 1.5; color: var(--fy-muted); margin-block-start: 6px; }
.fy-connections { position: absolute; inset: 0; pointer-events: none; }
.fy-connector {
  position: absolute; inline-size: 120px; block-size: 120px;
  inset-block-start: var(--fy-edge-y); inset-inline-start: var(--fy-edge-x);
  transform: translate(-50%, -50%) rotate(var(--fy-edge-a));
}
.fy-connector svg { inline-size: 100%; block-size: 100%; overflow: visible; }
/* 0.75 is the brief's measured connector-base opacity; it shipped at 0.55
   for no recorded reason and the resting ring read fainter than the reference's. */
.fy-edge-base { stroke: var(--fy-accent); stroke-width: 1px; stroke-dasharray: 2 4; fill: none; opacity: 0.75; }
.fy-edge-highlight { stroke: var(--fy-accent); stroke-width: 1.5px; fill: none; opacity: 0; }
/* The packet rides the connector's OWN arc, so an active edge differs from a
   resting one in colour and opacity and in nothing else. */
.fy-packet {
  fill: var(--fy-ink); stroke: var(--fy-ground); stroke-width: 1px;
  offset-path: path("M 8 60 Q 60 40 112 60"); offset-distance: 0%; offset-rotate: 0deg;
}
.fy-connector[data-loop-edge="rescan"] .fy-packet { r: 3px; }
.fy-packet-group { opacity: 0; }
.fy-return-packet { display: none; }
/* A BOUNDED CIRCLE, not a patch of dots floating in the middle of the ring: a
   hairline ring says where the record ends, which is what makes the five cards
   read as orbiting something rather than as five cards with texture between
   them. 26% of the 840 process box is 218px — the reference's 220. */
.fy-context-store {
  position: absolute; inset-block-start: 50%; inset-inline-start: 50%;
  transform: translate(-50%, -50%); inline-size: 26%; block-size: 26%;
  border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.12); background: var(--fy-ground);
  display: grid; place-content: center; text-align: center; gap: 4px; padding: 22px;
}
.fy-context-pattern {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background-image: radial-gradient(color-mix(in srgb, var(--fy-ink) 17%, transparent) 0.65px, transparent 0.85px);
  background-size: 6px 6px;
}
/* CIRCULAR, and it must stay circular: a radial gradient on a rectangle with no
   radius paints a disc with four lit corners, which is what a "soft pulse"
   looked like before. The gradient reaches transparent by 72%, the brief's own
   stop, so the border-radius is belt to that braces. */
.fy-context-pulse {
  position: absolute; inset: -6%; border-radius: 50%; pointer-events: none; opacity: 0;
  background: radial-gradient(circle,
    color-mix(in srgb, var(--fy-accent) 5%, transparent) 12%,
    color-mix(in srgb, var(--fy-accent) 24%, transparent) 34%,
    color-mix(in srgb, var(--fy-accent) 15%, transparent) 52%, transparent 72%);
}
.fy-context-title { font-size: 15px; line-height: 1.2; position: relative; color: var(--fy-ink); }
.fy-context-sub { font-family: var(--fy-mono); font-size: 11px; line-height: 1.4; position: relative; color: var(--fy-muted); }
.fy-context-note {
  font-family: var(--fy-mono); font-size: 11px; line-height: 1.4; position: relative;
  color: var(--fy-quiet);
}

/* ══ the segmented explorer ══════════════════════════════════════════════ */
.fy-explorer { padding-block-start: 40px; }
/* TWO PILLS, TWO ROWS. The chapter nav pins at top 12 and is 48 tall, so this
   one pins at 12 + 48 + 12 = 72 and the pair stack as the reference's own frame
   shows them (reference/df-1440-reference-arch.png). Before this they
   interpenetrated: the segmented control scrolled under the nav and the phase
   names were sliced in half by a bar the reader had just used to get here.
   z-index sits BELOW the nav's 20, because when they do overlap the nav wins. */
.fy-segmented {
  display: flex; gap: 0; padding: 4px; border-radius: 999px; background: var(--fy-surface-2);
  inline-size: fit-content; max-inline-size: 100%; margin-inline: auto;
  overflow-x: auto; scrollbar-width: none; overscroll-behavior-x: contain;
  position: sticky; inset-block-start: 72px; z-index: 15;
}
/* Keyboard focus must never scroll a control under the pinned nav either. The
   targets with ids are covered by main [id]; these are the ones without. */
.fy-segmented, .fy-seg-option, .fy-refcard, .fy-node, .fy-attack, .fy-attack-trigger {
  scroll-margin-top: 88px;
}
.fy-segmented::-webkit-scrollbar { display: none; }
.fy-seg-option { position: relative; display: flex; flex: 0 0 auto; cursor: pointer; }
.fy-seg-input {
  position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
/* 44px, not the reference's 40px, for the same reason as the chapter pills: the
   radio is visually hidden, so the LABEL is the tap target, and this site's
   shared component layer holds every other control to 44. */
.fy-seg-label {
  inline-size: 100%; min-block-size: 44px; padding-inline: 16px; border-radius: 999px;
  color: var(--fy-quiet); text-align: center; white-space: nowrap;
  justify-content: center; align-items: center; line-height: 1.25; display: flex;
  font-size: 14px;
}
.fy-seg-input:checked + .fy-seg-label {
  background: var(--fy-ground); color: var(--fy-ink); box-shadow: rgba(0, 9, 68, 0.08) 0 1px 3px;
}
.fy-seg-input:focus-visible + .fy-seg-label { outline: 2px solid var(--fy-ring); outline-offset: -2px; }
/* ── the flow diagram the cards now live inside ─────────────────────────────
   The reference draws this component as a left-to-right flow — Inputs, a
   dotted working viewport, Outputs — on a dotted-grid stage, and that shape is
   the true one here: three evidence sources feed the checks, and the checks
   produce one record. Before this the cards were right and orphaned: fifty-four
   typed panels behind a phase picker with nothing saying where they came from
   or what they made.

   THE BANDS ARE WHAT MAKES THE WIRING LINE UP. Each band is its own two-column
   grid (content + a 56px wire) with align-content center, so the wire's row
   is exactly as tall as the column beside it — which is what lets the bracket's
   arms at 16 / 50 / 84 % land on the three input cards' centres, and what puts
   every band's content centre on the same y. A wire stretched to the GRID row
   instead would take its percentages from the tallest column on the page. */
/* DOTTED, not dashed. The column separators and the \`meta\` card inside this
   figure are dotted; the stage was the one off-grammar stroke in a diagram that
   otherwise matches the reference frame. */
.fy-flow {
  margin-block-start: 28px; border: 1px dotted var(--fy-edge-grey); border-radius: 8px;
  padding: 20px 24px 24px;
  background-image: radial-gradient(rgba(0, 0, 0, 0.08) 0.7px, rgba(0, 0, 0, 0) 0.9px);
  background-size: 6px 6px;
}
.fy-flow-grid {
  display: grid; align-items: stretch; row-gap: 16px;
  grid-template-columns: minmax(190px, 1fr) minmax(0, 3fr) minmax(190px, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
}
/* The three heads are ONE row of the OUTER grid, so they line up across the
   stage. They cannot live inside the bands: a band centres its content against
   the tallest column on the stage, which would push the Inputs head halfway
   down the page — measured, and it is what the first cut of this shipped. */
.fy-flow-head {
  grid-row: 1; font-family: var(--fy-mono); font-size: 13px;
  letter-spacing: 0.06em; color: var(--fy-muted); text-align: center;
}
.fy-flow-head[data-flow-head="in"] { grid-column: 1; padding-inline-end: 56px; }
.fy-flow-head[data-flow-head="checks"] { grid-column: 2; padding-inline-end: 56px; }
.fy-flow-head[data-flow-head="out"] { grid-column: 3; }
/* TOP-ANCHORED, so a header sits on its own content. Centred, the 13-card
   Checks band is ~2000px tall and its two neighbours centred against it — the
   Inputs head named a column that started a third of a screen below it, over
   empty dotted grid. Nothing is capped: the point of the figure is that it
   holds EVERY check, so the three stacks start together instead. The wire's
   own row is still exactly as tall as the column beside it, which is what
   keeps the bracket's arms on the three input cards' centres. */
.fy-flow-band {
  position: relative; grid-row: 2; display: grid; align-content: start;
  grid-template-columns: minmax(0, 1fr) 56px;
}
.fy-flow-band[data-flow-band="in"] { grid-column: 1; }
.fy-flow-band[data-flow-band="checks"] { grid-column: 2; }
.fy-flow-band[data-flow-band="out"] { grid-column: 3; grid-template-columns: minmax(0, 1fr); }
/* The column separators: the reference's faint dotted rules at the boundaries,
   drawn on the band rather than as items so they cannot fall out of step with
   the columns they divide, and lifted to start beside the heads. */
.fy-flow-band:not([data-flow-band="out"])::after {
  content: ""; position: absolute; inset-block: -36px 0; inset-inline-end: 0;
  border-inline-start: 1px dotted rgba(0, 0, 0, 0.16);
}
.fy-flow-col { grid-column: 1; display: grid; gap: 12px; align-content: start; }
.fy-flow-wire { grid-column: 2; position: relative; }
.fy-flow-lines {
  inline-size: 100%; block-size: 100%; display: block; overflow: visible;
  fill: none; stroke: #9a9a9a; stroke-width: 1px; vector-effect: non-scaling-stroke;
}
.fy-flow-lines path { vector-effect: non-scaling-stroke; }
.fy-flow-wire::after {
  content: ""; position: absolute; inset-inline-end: 4px; inset-block-start: 50%;
  inline-size: 7px; block-size: 7px; border-block-start: 1px solid #9a9a9a;
  border-inline-end: 1px solid #9a9a9a; transform: translateY(-50%) rotate(45deg);
}
.fy-flowcard {
  border-radius: 8px; padding: 14px 16px; display: grid; gap: 6px; align-content: start;
  --fy-ref-bg: var(--fy-surface); --fy-ref-edge: var(--fy-edge-grey); --fy-ref-ink: #181818;
  background: var(--fy-ref-bg); border: 1px solid var(--fy-ref-edge); color: var(--fy-ref-ink);
}
.fy-flowcard[data-reference-type="observed"] { --fy-ref-bg: #e8f3fe; --fy-ref-edge: var(--fy-edge-blue); }
.fy-flowcard[data-reference-type="artifact"] { --fy-ref-bg: var(--fy-surface); --fy-ref-edge: var(--fy-edge-grey); }
.fy-flowcard[data-reference-type="local"] { --fy-ref-bg: #ede5fc; --fy-ref-edge: var(--fy-edge-violet); }
/* The record is not an evidence class and takes no tint: the four tints encode
   the class and nothing else. It takes the reference's emphasis type instead —
   white on an ink hairline — because it is the thing the whole flow produces. */
.fy-flowcard-record { --fy-ref-bg: #ffffff; --fy-ref-edge: #262626; }
.fy-flowcard-title { font-size: 15px; font-weight: 500; }
.fy-flowcard-line { font-size: 14px; line-height: 20px; color: var(--fy-quiet); }
.fy-panel-port {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  border: 1px dotted var(--fy-dash); border-radius: 8px; padding: 20px;
}
.fy-panel-port:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: 3px; }
.fy-panel-note { font-size: 14px; line-height: 21px; color: var(--fy-muted); margin-block-end: 16px; }
.fy-cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.fy-refcard {
  min-block-size: 90px; border-radius: 8px; padding: 14px 16px; cursor: pointer;
  text-align: start; font: inherit; display: grid; gap: 6px; align-content: start;
  --fy-ref-bg: var(--fy-surface); --fy-ref-edge: var(--fy-edge-grey); --fy-ref-ink: #181818;
  background: var(--fy-ref-bg); border: 1px solid var(--fy-ref-edge); color: var(--fy-ref-ink);
}
.fy-refcard[data-reference-type="observed"] { --fy-ref-bg: #e8f3fe; --fy-ref-edge: var(--fy-edge-blue); }
.fy-refcard[data-reference-type="artifact"] { --fy-ref-bg: var(--fy-surface); --fy-ref-edge: var(--fy-edge-grey); }
.fy-refcard[data-reference-type="local"] { --fy-ref-bg: #ede5fc; --fy-ref-edge: var(--fy-edge-violet); }
/* "About the tool, never counted" is not a fifth kind of evidence — it is the
   absence of one, and a dotted border is how this page says "not a thing that
   was scored" everywhere else. */
.fy-refcard[data-reference-type="meta"] {
  --fy-ref-bg: #ffffff; --fy-ref-edge: #6f6f74; border-style: dotted;
}
.fy-refcard:hover, .fy-refcard:focus-visible, .fy-refcard[aria-expanded="true"] {
  border-color: color-mix(in srgb, var(--fy-ref-edge) 72%, var(--fy-ref-ink));
  background-color: color-mix(in srgb, var(--fy-ref-bg) 96%, var(--fy-ref-ink));
}
.fy-refcard-id { font-family: var(--fy-mono); font-size: 13px; overflow-wrap: anywhere; }
.fy-refcard-q { font-size: 14px; line-height: 20px; color: var(--fy-quiet); }
/* The key sits ABOVE the panel it explains, as the reference's does, and reads
   as dots plus one dotted-square glyph rather than as four filled swatches —
   a swatch the size of a word competes with the cards it is describing. */
.fy-legend {
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: center; align-items: center;
  margin-block: 24px 20px; font-size: 14px; color: var(--fy-muted);
}
.fy-legend-dot {
  inline-size: 11px; block-size: 11px; border-radius: 50%; display: inline-block;
  margin-inline-end: 8px; vertical-align: -1px;
  background: var(--fy-ref-bg, var(--fy-surface)); border: 1px solid var(--fy-ref-edge, var(--fy-edge-grey));
}
.fy-legend-dot[data-reference-type="observed"] { --fy-ref-bg: #a4cdfb; --fy-ref-edge: var(--fy-edge-blue); }
.fy-legend-dot[data-reference-type="artifact"] { --fy-ref-bg: var(--fy-surface); --fy-ref-edge: #9a9a9a; }
.fy-legend-dot[data-reference-type="local"] { --fy-ref-bg: #c9b1f6; --fy-ref-edge: var(--fy-edge-violet); }
.fy-legend-dot[data-reference-type="meta"] { --fy-ref-bg: #ffffff; --fy-ref-edge: #6f6f74; border-style: dotted; }
.fy-legend-frame {
  inline-size: 12px; block-size: 12px; border-radius: 2px; display: inline-block;
  margin-inline-end: 8px; vertical-align: -2px; border: 1px dotted var(--fy-dash);
}

/* ══ the scrollable table wrap ═══════════════════════════════════════════ */
.fy-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.fy-wrap:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: -2px; }
.fy-table { inline-size: 100%; border-collapse: collapse; font-size: 15px; }
.fy-table th, .fy-table td {
  text-align: start; padding: 14px 16px; border-block-end: 1px solid var(--fy-hair);
  vertical-align: top;
}
.fy-table thead th {
  font-family: var(--fy-mono); font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--fy-muted); font-weight: 400;
  border-block-end: 1px solid var(--fy-line); white-space: nowrap;
}
.fy-table td[data-label="Scanned"] { font-variant-numeric: tabular-nums; white-space: nowrap; }
`;

/**
 * The secondary pages — the directory listing, the per-repository sheet and the
 * methodology — set in the same grammar: a media-width frame, 8px diagram
 * surfaces, mono for ids and numerals, and the verdict hues doing the only
 * colour-coding on the page.
 */
export const PAGES_CSS = `
/* ══ page heads ══════════════════════════════════════════════════════════ */
.fy-pagehead { padding-block: 72px 40px; }
.fy-pagehead h1 {
  font-size: clamp(40px, 5vw, 64px); line-height: 1.05; letter-spacing: -0.03em; color: var(--fy-ink);
}
.fy-pagehead .fy-kicker { margin-block-end: 20px; }
.fy-pagehead-lead {
  margin-block-start: 20px; font-size: 18.4px; line-height: 30.4px;
  color: var(--fy-quiet); max-inline-size: 68ch;
}
.fy-section { padding-block: 56px; }
.fy-section h2 {
  font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -0.02em; color: var(--fy-ink);
}
.fy-section h3 { font-size: 22px; font-weight: 500; margin-block-start: 32px; color: var(--fy-ink); }
.fy-body { font-size: 17px; line-height: 28px; color: var(--fy-text); margin-block-start: 16px; max-inline-size: var(--fy-prose); }
.fy-note { font-size: 14px; line-height: 21px; color: var(--fy-muted); margin-block-start: 12px; max-inline-size: var(--fy-prose); }
.fy-crumbs { padding-block-start: 32px; font-size: 14px; }
.fy-crumbs a { display: inline-flex; align-items: center; min-block-size: 44px; }
/* E4 · Standalone links measured 17px tall — "Install the Action →",
   "How that is checked →", "Search, or request one →", the repository URL and
   "scan run" on the sheet. Each is the whole content of its own block, so the
   WCAG 2.5.8 inline-exception does not cover any of them, and this site holds
   every other control to 44. Links INSIDE running prose keep the exception and
   are deliberately not touched. */
.fy-arrow-link, .fy-tip-links a {
  display: inline-flex; align-items: center; min-block-size: 44px;
}
/* …BUT NOT BY INFLATING A SHARED LINE BOX. E4's inline-flex on the metadata
   line's links is what put "scan run" and the repository URL ~12px below the
   baseline of the text they sit inline with, and dropped "scan run" onto a line
   of its own starting mid-column — the first thing the eye catches in the
   sheet's first viewport, and exactly the fault round-1 m3 named on the
   "scored before v2" pill, relocated. An absolutely positioned hit area is out
   of flow, so the line box and the baseline are untouched. */
.fy-rm a { position: relative; }
.fy-rm a::after {
  content: ""; position: absolute; inset-inline: -4px; inset-block-start: 50%;
  block-size: 44px; transform: translateY(-50%);
}
/* THE SAME IDEA WHERE THE PILL'S SIZE IS THE POINT. The "local" marker in the
   verdict column reached its 44px by growing into a dashed ~46px CIRCLE beside
   a 20px PASS pill — a shape that appears nowhere else on the site, more than
   twice its neighbour's height, and a second wrong copy of a component the
   phase chips already draw correctly. Here the ELEMENT is the 44px target and
   the drawn pill is a pseudo at its neighbour's height. */
:root .fy-hit-pill {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; border: 0; padding: 0 10px; background: 0 0;
  text-decoration: none; white-space: nowrap;
}
/* 18px, NOT 22. The drawn pill is meant to read as a matched pair with the
   '.fy-oc-pass' chip beside it, and that chip renders at 18.0px — a 4px
   difference on a 20px object is a quarter taller, which is what "same
   component" stops meaning. */
:root .fy-hit-pill::before {
  content: ""; position: absolute; inset-inline: 0; inset-block-start: 50%;
  block-size: 18px; transform: translateY(-50%);
  border: 1px dashed currentcolor; border-radius: 999px;
}

/* ══ directory ═══════════════════════════════════════════════════════════ */
.fy-dir-controls { display: grid; gap: 16px; padding-block: 8px 32px; }
.fy-sortbar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; font-size: 14px; }
.fy-sortbar label {
  color: var(--fy-muted); display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; min-inline-size: 44px;
}
/* THE SELECT KEEPS ITS ID AND ITS ELEMENT — filter.js binds #dir-sort, and a
   design may restyle a control but never replace it — and wears the design's
   chrome instead of the platform's. The chevron is a background image rather
   than generated content, because generated content is exactly what a
   DOM-render capture drops, and a control whose only affordance vanishes from
   every screenshot is a control nobody can review. */
.fy-sortbar select {
  appearance: none; -webkit-appearance: none;
  min-block-size: 44px; border: 1px solid var(--fy-line); border-radius: 999px;
  padding-block: 0; padding-inline: 16px 40px; color: var(--fy-text);
  font-family: var(--fy-body); cursor: pointer;
  background-color: var(--fy-ground); background-repeat: no-repeat;
  background-position: right 15px center; background-size: 12px 8px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none' stroke='%235d5d5d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 1.75 6 6.25 11 1.75'/%3E%3C/svg%3E");
}
.fy-sortbar select:hover { border-color: var(--fy-muted); }
.fy-sortbar select:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: 2px; }
/* A bordered square in the design's radius, with real space to its label. The
   checked state is a background for the same reason the chevron is. */
.fy-sortbar .dir-check { gap: 10px; }
.fy-sortbar .dir-check input[type="checkbox"] {
  appearance: none; -webkit-appearance: none; flex: 0 0 auto;
  inline-size: 20px; block-size: 20px; margin: 0; cursor: pointer;
  border: 1px solid var(--fy-line); border-radius: 4px; background: var(--fy-ground);
}
.fy-sortbar .dir-check input[type="checkbox"]:checked {
  border-color: var(--fy-ink); background-color: var(--fy-ink);
  background-repeat: no-repeat; background-position: center; background-size: 12px 12px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 6.5 4.75 9.25 10 3.5'/%3E%3C/svg%3E");
}
.fy-sortbar .dir-check input[type="checkbox"]:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: 2px; }
/* Its own cell at the far end of the bar, not a third thing crowding the two
   controls it has nothing to do with. */
.fy-count {
  font-family: var(--fy-mono); font-variant-numeric: tabular-nums; color: var(--fy-muted);
  margin-inline-start: auto; text-align: end;
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.fy-grade {
  display: inline-flex; align-items: center; justify-content: center;
  inline-size: 44px; block-size: 44px; border-radius: 999px; flex: 0 0 auto;
  border: 2px solid var(--g, var(--fy-na)); color: var(--g, var(--fy-na));
  font-family: var(--fy-mono); font-size: 15px; font-variant-numeric: tabular-nums;
}
.fy-g-aplus, .fy-g-a, .fy-g-b { --g: var(--fy-pass); }
.fy-g-c, .fy-g-d { --g: var(--fy-warn); }
.fy-g-f { --g: var(--fy-fail); }
.fy-g-na { --g: var(--fy-na); }
.fy-prov {
  font-family: var(--fy-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--fy-warn); border: 1px solid var(--fy-warn); border-radius: 999px;
  padding: 0 8px; line-height: 18px; display: inline-block; margin-inline-start: 8px;
}
/* THE NAME IS THE LINK, AND IT LOOKS LIKE ONE. Ink-black with no underline, the
   repository name read as a heading: on a directory whose whole job is to be
   opened, the primary target was the one thing on the row that did not say it
   was a target. Blue and underlined, like every other link on the site, plus a
   trailing affordance that says where it goes. */
.fy-repo-link {
  font-family: var(--fy-mono); font-size: 15px; color: var(--fy-link);
  text-decoration: underline; text-underline-offset: 4px;
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.fy-repo-link:hover { text-decoration-thickness: 2px; }
.fy-record-link {
  display: inline-flex; align-items: center; min-block-size: 44px; margin-block-start: 4px;
  font-size: 14px; color: var(--fy-link); text-decoration: none;
}
.fy-record-link:hover { text-decoration: underline; text-underline-offset: 4px; }
.fy-desc { display: block; margin-block-start: 6px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-meta-line {
  display: block; margin-block-start: 8px; font-family: var(--fy-mono); font-size: 12px;
  color: var(--fy-muted); font-variant-numeric: tabular-nums;
}
/* Inline, it wrapped mid-pill in the 390 restack and drew half a border on each
   line. A verdict chip is one token or it is not a chip. */
.fy-cov-mark {
  border-radius: 999px; padding: 0 8px; border: 1px solid currentcolor;
  display: inline-block; white-space: nowrap;
}
.fy-cov-over { color: var(--fy-pass); }
.fy-cov-under { color: var(--fy-warn); border-style: dashed; }
.fy-cov-note {
  display: block; margin-block-start: 10px; font-size: 14px; line-height: 21px;
  color: var(--fy-text); max-inline-size: 64ch;
}
.fy-cov-tag {
  font-family: var(--fy-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--fy-warn); border: 1px solid var(--fy-warn); border-radius: 999px;
  padding: 0 8px; margin-inline-end: 8px; white-space: nowrap;
}
/* ATTENTION, NOT FAILURE — and this design's own anti-claim says so: red means
   "did not pass" here and nothing else. Both listings that render this box have
   ZERO fails and grade A+, and a reader who learned red = did not pass from a
   legend two screens up read a red-bordered alert as a failure. Amber is taken
   (it is the gap colour), so the contradiction family takes the neutral ink
   hairline the directory row already uses for the same fact. */
.fy-conflict {
  display: block; margin-block-start: 10px; padding: 10px 12px; border-radius: 8px;
  border: 1px solid var(--fy-ink); background: var(--fy-ground);
  font-size: 14px; line-height: 21px; color: var(--fy-text); max-inline-size: 64ch;
}
.fy-merge { margin-block-start: 10px; font-size: 14px; }
/* THE PILL LABELS THE FIRST LINE, NOT THE MIDDLE OF THE PARAGRAPH. The shared
   layer centres a summary vertically for its 44px tap floor, which is
   right for the one-line case and wrong here: measured at 390, the pill's
   centre sat 27px below the top of the three-line text it marks, so it read as
   floating beside nothing. */
.fy-merge summary { cursor: pointer; color: var(--fy-muted); }
/* Specificity, not order: the shared .fy-table summary rule is the 44px one and it is
   declared later in this stylesheet, so an equally-specific selector loses. */
.fy-table .fy-merge summary { align-items: flex-start; gap: 8px; }
.fy-table .fy-merge summary .fy-merge-tag { margin-inline-end: 0; }
/* A 999px RADIUS ON A TWO-LINE BOX IS AN ELLIPSE, NOT A PILL. 'DIFFERENT COMMIT'
   broke between its two words inside the capsule and set a ~60px egg beside the
   17px sentence it labels — on the directory's primary row, once per listing,
   at both widths, while the sheet hero draws the same fact correctly as an 8px
   box. One line, and it never shrinks below its own label: as a flex item in
   'summary''s inline-flex it was free to be squeezed under its content width. */
.fy-merge-tag {
  font-family: var(--fy-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  border: 1px solid var(--fy-line); border-radius: 999px; padding: 0 8px; margin-inline-end: 8px;
  white-space: nowrap; flex: 0 0 auto; display: inline-block;
}
.fy-merge p { margin-block-start: 10px; line-height: 21px; color: var(--fy-quiet); max-inline-size: 64ch; }
.fy-lane {
  font-family: var(--fy-mono); font-size: 11px; letter-spacing: 0.04em; white-space: nowrap;
  border-radius: 999px; padding: 2px 10px; display: inline-block;
  border: 1px solid var(--fy-line); color: var(--fy-muted);
}
.fy-lane-auth { border-color: var(--fy-pass); color: var(--fy-pass); }
.fy-lane-unsigned { border-color: var(--fy-warn); color: var(--fy-warn); }
.fy-lane-local { border-style: dashed; border-color: var(--fy-na); color: var(--fy-na); }
.fy-lane-ext { border-color: var(--fy-line); color: var(--fy-muted); }
.fy-lane-overlay { color: var(--fy-na); margin-inline-start: 6px; }
/* The four lane chips explained ON THE PAGE. The sentence that says the local
   lane is weaker than the action lane is the single most important qualifier
   the directory carries, and it lived in a title attribute. */
.fy-lane-key {
  display: grid; gap: 10px; padding-block: 20px 24px; max-inline-size: 78ch;
  border-block-start: 1px solid var(--fy-hair);
}
.fy-lane-key .fy-key-label { margin-block-end: 2px; }
.fy-lane-row {
  display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 12px;
  align-items: start; font-size: 14px; line-height: 21px; color: var(--fy-muted);
}
/* The same geometry on the card as on the sheet: the stack spans the full width
   of whatever holds it, and the percentage is right-aligned against one edge.
   Boxed to 190px in a table cell, the card's bars were a different instrument
   from the sheet's, drawn from the same numbers. */
.fy-phasebar { display: grid; gap: 4px; inline-size: 100%; min-inline-size: 190px; }
.fy-phasebar > * + * { margin-block-start: 6px; }
.fy-phase-key {
  display: flex; flex-wrap: wrap; gap: 4px 16px; align-items: center;
  font-size: 12px; line-height: 18px; color: var(--fy-muted); margin-block-end: 10px;
}
.fy-phase-key .fy-swatch { inline-size: 10px; block-size: 10px; margin-inline-end: 6px; }
.fy-phaserow {
  display: grid; grid-template-columns: 30px minmax(60px, 1fr) 52px;
  gap: 2px 8px; align-items: center;
}
.fy-phase-id { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); }
/* THE TRACK IS THE ANSWERED SET, and nothing that was never answered is drawn
   inside it: a third state painted as the empty tail of a pass-green bar is the
   visual grammar of shortfall. The count that used to be that tail is a line of
   its own underneath, in words. */
.fy-phase-track { block-size: 8px; border-radius: 999px; overflow: hidden; display: flex; background: var(--fy-surface-2); }
.fy-seg-pass { background: var(--fy-pass); }
.fy-seg-fail { background: var(--fy-fail); }
.fy-phase-pct { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); font-variant-numeric: tabular-nums; text-align: end; }
.fy-phase-note {
  grid-column: 2 / -1; font-size: 12px; line-height: 18px; color: var(--fy-muted);
  font-variant-numeric: tabular-nums;
}
.fy-phase-none { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); }
.fy-empty { padding: 24px 0; font-size: 15px; color: var(--fy-quiet); }
.fy-clear {
  display: inline-flex; align-items: center; min-block-size: 44px; margin-inline-start: 12px;
  background: 0 0; border: 1px solid var(--fy-line); border-radius: 999px; padding: 0 16px;
  font: inherit; font-size: 14px; color: var(--fy-text); cursor: pointer;
}
.fy-key {
  display: flex; flex-wrap: wrap; gap: 10px 24px; align-items: center;
  padding-block: 24px; font-size: 14px; color: var(--fy-muted); border-block-start: 1px solid var(--fy-hair);
}
.fy-key-label {
  font-family: var(--fy-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;
}
/* THE SEPARATOR TRAVELS WITH THE ITEM AFTER IT. The non-breaking space is the
   load-bearing half: the break opportunity is the ordinary space BEFORE the
   dot, so a wrap moves the dot down with its own item instead of stranding it
   at the end of the line above. */
.fy-sl > span + span::before { content: "\\B7\\A0"; }
/* …AND IT DOES NOT RENDER AT A LINE BOUNDARY. Written after layout by the
   page's own script (motion.ts §6), because whether a separator opens or closes
   a rendered line is a question only layout can answer. 'visibility' and not
   'content: none': hiding the glyph must not move a single box, or marking a
   separator would change the wrap that produced it. */
.fy-sl > span + span[data-sep="off"]::before,
.fy-rm + .fy-rm[data-sep="off"]::before { visibility: hidden; }
.fy-swatch { inline-size: 14px; block-size: 14px; border-radius: 4px; display: inline-block; margin-inline-end: 8px; vertical-align: -2px; }
.fy-swatch-pass { background: var(--fy-pass); }
.fy-swatch-fail { background: var(--fy-fail); }
/* P1–P6 against the names they stand for, on the one page that prints the bars
   without the names. They lived in a title, which a touch device never renders. */
.fy-phase-names { gap: 8px 20px; }
.fy-phase-name { display: inline-flex; align-items: baseline; gap: 6px; }

/* ══ the repository sheet ════════════════════════════════════════════════ */
/* ONE LEFT RAIL. The grade ring was a flex SIBLING of the title, so the title,
   the lane badges, the contradiction notice, the metadata line and the
   "scored under methodology v1" pill all sat 75px right of the rail that the
   breadcrumb, the ring itself, the two figures, the legend and the P1-P6 labels
   share — the eye read a straight edge down the page with one indented block
   punched into its middle. Stacking the ring puts every one of them on 161, at
   every width, with no margin-hang that runs out of margin below 1272px. */
.fy-repo-hero {
  display: flex; flex-direction: column; align-items: flex-start; gap: 16px;
  padding-block: 40px 24px;
}
.fy-repo-hero > div { inline-size: 100%; }
/* The verdict cell keeps its pills on ONE line box, which is what keeps the
   local marker inside the WCAG 2.5.8 inline exception when the table restacks
   into cards at 390 and blockifies every direct child of a cell. */
.fy-verdict-cell { display: inline; }
.fy-repo-title { font-size: clamp(30px, 4vw, 52px); line-height: 1.08; letter-spacing: -0.03em; color: var(--fy-ink); word-break: break-word; }
.fy-repo-meta { display: flex; flex-wrap: wrap; gap: 4px 6px; margin-block-start: 16px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-rm { white-space: nowrap; }
/* THE SEPARATOR BELONGS TO THE ITEM THAT FOLLOWS IT. As a trailing ::after it
   stayed behind when the item after it wrapped, so lines ended on a stranded
   middot — "… methodology v1 ·" and "scan run ·" on the sheet, "coverage 90.9% ·"
   on the directory. A leading ::before inside a nowrap item travels with it. */
.fy-rm + .fy-rm::before { content: "· "; }
.fy-rm-url { white-space: normal; overflow-wrap: anywhere; }
/* A FLAG, NOT A WARNING. Amber is this page's "gap" colour: painting a listing
   scored under an older methodology in it says something went wrong, when what
   happened is that the rules were versioned and this record names its version.
   Neutral grey, and it needs the 44px target because it is a link. */
/* B10 · ON ITS OWN ROW, because it cannot share a baseline with the line it
   sat in: it is a 44px pill among 21px text runs, and centring its label inside
   that pill puts the label ~12px below everything beside it. A flex-basis of
   100% starts a new line; fit-content clamps the pill back to its label. */
.fy-stale {
  color: var(--fy-muted); text-decoration: none; font-size: 13px;
  border: 1px solid var(--fy-line);
  border-radius: 999px; padding: 0 12px; display: inline-flex; align-items: center;
  min-block-size: 44px;
}
.fy-stale-row { flex: 0 0 100%; margin-block-start: 6px; }
.fy-stale:hover { border-color: var(--fy-muted); color: var(--fy-ink); }
.fy-figs { display: grid; gap: 32px 56px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); padding-block: 24px 40px; }
.fy-fig-num { font-size: 48px; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--fy-ink); }
.fy-fig-cap { margin-block-start: 12px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-cov-verdict { margin-block-start: 12px; font-family: var(--fy-mono); font-size: 12px; color: var(--fy-muted); line-height: 1.6; }
.fy-cov-verdict .fy-cv-note { font-family: var(--fy-body); display: block; margin-block-start: 6px; }
/* T13 · NARROWED TO THE MEASURE IT HOLDS. Every paragraph inside stopped at
   ~928px in a frame that ran to 1280, so ~350px of each card was empty on the
   right and the frame drew the eye straight to it. */
.fy-panel {
  border: 1px solid var(--fy-line); border-radius: 8px; padding: 24px; margin-block: 24px;
  background: var(--fy-ground); max-inline-size: calc(var(--fy-prose) + 48px);
}
.fy-panel-conflict { border-color: var(--fy-ink); }
.fy-panel h2 { font-size: 22px; font-weight: 500; letter-spacing: 0; }
.fy-panel .fy-body { font-size: 16px; line-height: 26px; }
.fy-cmd {
  margin-block-start: 16px; background: var(--fy-surface); border: 1px solid var(--fy-hair);
  border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-family: var(--fy-mono);
  font-size: 13px; line-height: 1.7;
}
.fy-btnrow { display: flex; flex-wrap: wrap; gap: 12px; margin-block-start: 20px; }
.fy-btn, .fy-btn-outline {
  display: inline-flex; align-items: center; min-block-size: 44px; padding: 0 20px;
  border-radius: 999px; font-size: 15px; text-decoration: none;
}
.fy-btn { background: var(--fy-ink); color: #fff; }
.fy-btn-outline { border: 1px solid var(--fy-line); color: var(--fy-text); }
.fy-ctl-bar {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-block: 20px;
  font-size: 14px; color: var(--fy-muted);
}
.fy-ctl-bar a {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; min-inline-size: 44px; border-radius: 999px;
  border: 1px solid var(--fy-hair); color: var(--fy-text); text-decoration: none;
  font-family: var(--fy-mono); font-size: 13px; padding-inline: 12px;
}
.fy-ctl-bar a:hover { background: var(--fy-surface-2); }
.fy-phaseband td {
  background: var(--fy-surface); font-family: var(--fy-mono); font-size: 12px;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--fy-muted);
}
.fy-ph-count { float: inline-end; text-transform: none; letter-spacing: 0; }
.fy-outcome {
  font-family: var(--fy-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  border: 1px solid currentcolor; border-radius: 999px; padding: 1px 9px; white-space: nowrap;
}
.fy-oc-pass { color: var(--fy-pass); background: var(--fy-tint-pass); border-color: var(--fy-edge-pass); }
.fy-oc-fail { color: var(--fy-fail); }
.fy-oc-gap {
  color: var(--fy-warn); background: var(--fy-tint-warn);
  border-color: var(--fy-edge-warn); border-style: dashed;
}
/* Measured 14 units of grey apart, differing on one channel plus the word.
   no answer keeps a pill and goes dashed; info loses the pill, because it
   is not a verdict and a pill is what a verdict looks like on this page. */
.fy-oc-unverified { color: var(--fy-na); border-style: dashed; }
.fy-oc-info { color: var(--fy-muted); border: 0; padding: 0; text-transform: none; letter-spacing: 0; }
.fy-oc-absent { color: var(--fy-muted); border-style: dotted; border-color: var(--fy-line); }
.fy-row-absent { opacity: 0.62; }
/* THE KEY DRAWS WHAT THE PAGE DRAWS. Six states, six real pills — a green one,
   a red one, an amber dashed one, a grey dashed one, plain text, and a dotted
   one — so a reader who learns the key is looking at the same components the
   table and the chips use. The three coloured squares it replaced matched
   nothing on either page, and one of them was a hatch nothing draws. */
.fy-verdict-key { gap: 10px 18px; }
.fy-vkey { display: inline-flex; align-items: center; }
/* A row whose verdict came only from a maintainer's own machine says so, and
   the word is a link to the panel that says what that signature proves. */
.fy-table tr[data-lane="local"] td[data-label="Verdict"] .fy-outcome { border-style: dashed; }
/* A link, and therefore a target: measured at 390 it was 51.2 x 32, because the
   card restack blockifies it out of the WCAG 2.5.8 inline exception. */
.fy-row-lane {
  font-family: var(--fy-mono); font-size: 11px; letter-spacing: 0.04em;
  color: var(--fy-na); margin-inline-start: 6px;
}
.fy-row-lane:hover { color: var(--fy-ink); }
/* The contradiction badge, in the hero, before any figure — and in the same
   neutral register as the directory row that carries the same fact. A provenance
   mismatch is not a verdict; red is. */
.fy-badge-conflict {
  display: block; margin-block-start: 12px; padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--fy-ink); background: var(--fy-ground); color: var(--fy-text);
  font-size: 14px; line-height: 21px; max-inline-size: 64ch; text-decoration: none;
}
.fy-badge-conflict + .fy-badge-conflict { margin-block-start: 8px; }
.fy-badge-conflict:hover { background: var(--fy-surface-2); }
.fy-raw { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); margin-inline-start: 8px; white-space: nowrap; }
.fy-oos { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); }
.fy-row-oos { opacity: 0.62; }
.fy-reason { display: block; font-size: 14px; line-height: 21px; color: var(--fy-quiet); }
.fy-table details { margin-block-start: 8px; font-size: 14px; }
.fy-table summary { cursor: pointer; color: var(--fy-muted); min-block-size: 44px; display: inline-flex; align-items: center; }
/* 45 OF 54 DISCLOSURES SAID NOTHING ABOUT OPENING. Round 2 gave '.tx-details
   summary' a rotating chevron and recorded that these two families already had
   one; read against the built CSS they did not — they had 'cursor: pointer' and
   then 'display: inline-flex', which is itself what suppresses the '::marker'.
   So the 41 'evidence (n)' rows on a sheet and the merge summaries on the
   directory were caption-coloured text that happened to be a button, on a page
   whose entire argument is that the evidence is there to be opened, and on a
   phone with no hover and no cursor to fall back on. Same glyph, same rotation,
   same three declarations as '.tx-details', so the site has one disclosure. The
   44px target above is untouched: the chevron is a flex item inside it. */
.fy-merge summary, .fy-table summary { display: inline-flex; align-items: center; list-style: none; }
.fy-merge summary::-webkit-details-marker,
.fy-table summary::-webkit-details-marker { display: none; }
.fy-merge summary::before, .fy-table summary::before {
  content: ""; inline-size: 7px; block-size: 7px; flex: 0 0 auto;
  margin-inline-end: 10px; margin-block-start: -3px;
  border-inline-end: 1.5px solid currentcolor; border-block-end: 1.5px solid currentcolor;
  transform: rotate(45deg);
}
.fy-merge[open] > summary::before,
.fy-table details[open] > summary::before { transform: rotate(-135deg); margin-block-start: 3px; }
.fy-table details ul { margin: 8px 0 0; padding-inline-start: 20px; color: var(--fy-quiet); line-height: 21px; }

/* ══ methodology ═════════════════════════════════════════════════════════ */
.fy-method-section { padding-block: 56px; scroll-margin-top: 88px; }
.fy-method-section > h2 {
  font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -0.02em; color: var(--fy-ink);
}
/* T10 · PARAGRAPH SPACING AT 1.5x THE LINE, so a paragraph break reads as one.
   At 16px against a 28px line the gap was narrower than the leading inside the
   paragraphs it was separating. */
.fy-method-section p { margin-block-start: 42px; font-size: 17px; line-height: 28px; max-inline-size: var(--fy-prose); }
.fy-method-section h2 + p, .fy-method-section h3 + p { margin-block-start: 16px; }
.fy-method-section ol, .fy-method-section ul { margin-block-start: 16px; max-inline-size: var(--fy-prose); line-height: 28px; }
.fy-method-section li { margin-block-start: 8px; }
.fy-method-section h3 { font-size: 22px; font-weight: 500; margin-block-start: 36px; color: var(--fy-ink); }
.fy-formula {
  margin-block-start: 24px; background: var(--fy-surface); border: 1px solid var(--fy-hair);
  border-radius: 8px; padding: 20px 24px; overflow-x: auto;
}
.fy-formula pre { margin: 0; font-family: var(--fy-mono); font-size: 14px; line-height: 1.8; }
.fy-grade-row { display: flex; flex-wrap: wrap; gap: 12px; margin-block-start: 24px; }
.method-table { inline-size: 100%; border-collapse: collapse; font-size: 15px; }
.method-table th, .method-table td {
  text-align: start; padding: 12px 14px; border-block-end: 1px solid var(--fy-hair); vertical-align: top;
}
.method-table thead th {
  font-family: var(--fy-mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--fy-muted); font-weight: 400; border-block-end: 1px solid var(--fy-line);
}
.method-table code { overflow-wrap: anywhere; }
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.cov-cmd {
  background: var(--fy-surface); border: 1px solid var(--fy-hair); border-radius: 8px;
  padding: 14px 16px; overflow-x: auto; font-family: var(--fy-mono); font-size: 13px; line-height: 1.7;
  margin-block-start: 16px;
}
.fy-honesty {
  border-block: 1px solid var(--fy-hair); padding-block: 32px; margin-block-start: 24px;
  scroll-margin-top: 88px;
}
.fy-honesty-head {
  font-family: var(--fy-mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--fy-muted);
}
.fy-honesty p + p { margin-block-start: 16px; }
`;

/**
 * Everything that changes at ≤767px, in one block.
 *
 * The rule that matters most: the opening panel stays exactly one viewport
 * minus the header, because the aperture's whole timing depends on it. Padding
 * comes down rather than the panel growing.
 */
export const RESPONSIVE_CSS = `
@media (max-width: 767px) {
  :root {
    --fy-gutter: 24px; --fy-media-gutter: 20px; --fy-header-h: 54px; --fy-beat: 64px;
  }
  .fy-header-in { padding-inline-end: 24px; }
  .fy-wordmark { font-size: 14px; }
  .fy-nav a { padding: 8px 10px; font-size: 13px; }
  /* GONE on a phone, not shrunk. A 44px fixed disc in the corner of a 390px
     screen sits over the one column the whole page is set in, and every route
     it offers is already on the page: the field in the hero, the pill rail, and
     ↑ Top in the colophon. */
  .fy-find { display: none; }

  .fy-opening { padding: 40px var(--fy-gutter); min-block-size: max(500px, calc(100svh - var(--fy-header-h))); }
  /* The brief's measured mobile display line: 41px, line-height 41.82 (1.02),
     letter-spacing -1.64 (-0.04em). Both fall out of the ratios above at 41px,
     and both are asserted so a change to either ratio is caught. */
  .fy-headline { font-size: clamp(41px, 8.2vw, 65px); padding-inline-end: 0; }
  .fy-headline br { display: none; }
  .fy-opening .hp-search { max-inline-size: none; }
  .fy-segmented { position: static; inset-block-start: auto; }
  .fy-context { margin-block-start: 18px; font-size: 16px; line-height: 26px; }
  .fy-opening .hp-search { margin-block-start: 20px; }
  .fy-controls { margin-block-start: 16px; }
  .fy-response { min-block-size: max(500px, var(--fy-window-viewport-height)); }
  .fy-response-left, .fy-response-right { padding: 40px var(--fy-gutter); }
  .fy-response-headline { font-size: clamp(48px, 10vw, 77px); }
  .fy-response-line { margin-block-start: 18px; font-size: 16px; line-height: 26px; }

  .fy-dark h2 { font-size: 32px; }
  /* 1-UP. Two 124px columns gave every caption a three-line label and left the
     fifth counter alone with the right half of its row empty. */
  .fy-metrics { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  .fy-metric-value { font-size: 42px; }
  .fy-kicker .fy-sep { display: none; }
  .fy-kicker span { display: block; }
  .fy-chapter h2 { font-size: 36px; letter-spacing: -0.72px; }
  .fy-chapter-lead { font-size: 17px; line-height: 28px; }

  /* The bar chart: copy first, then a plot stretched 1.35x vertically so the
     short bars stay legible on a narrow screen. The stretch is the WRAP's
     aspect-ratio now, not a transform on the plot — the SVG carries
     preserveAspectRatio="none", so the drawing stretches while every label,
     being HTML positioned in percentages of the same box, keeps its real size
     and lands where it did. The old counter-scaled label group is gone with it. */
  .fy-chart-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "copy" "chart"; gap: 36px; }
  .fy-plot-wrap { aspect-ratio: 584 / 432; }
  .fy-chart-ylabel, .fy-chart-axis { font-size: 12px; }
  .fy-chart-value { font-size: 11px; }
  /* The ids survive at 390 — nine unlabelled heights on a bare axis is not a
     chart, and the list that would decode them is several screens away. */
  .fy-chart-ids { font-size: 11px; column-gap: calc(12 / 584 * 100%); }

  .fy-trace-grid { grid-template-columns: minmax(0, 1fr); gap: 32px; }
  /* A zone is 51px wide at this width where it is 80 at 1440, so the label set
     comes down with it rather than running into its neighbour. */
  .fy-zone-label { font-size: 8px; letter-spacing: 0.04em; }
  /* THE RAIL SPANS THE GUTTERS. Capped at 278px inside a 344px column it cost
     three things at once: one pill less of capacity on the two longest pages,
     a left edge indented ~34px from every other element, and — because the
     opaque plate was NARROWER than the measure — a line passing under it was
     left visible on BOTH sides, so "ar … an" and "ings" survived beside the
     chrome as word fragments. The reference's own 390 rail is full-bleed; ours
     takes a 20px gutter and clips at the screen edge instead. */
  .fy-chapters {
    margin: 80px 20px 24px; inset-block-start: 8px;
    inline-size: calc(100% - 40px); max-inline-size: none;
  }
  .fy-chapters a { padding: 10px 12px; font-size: 13px; }

  .fy-ov-row { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .fy-ov-group { grid-template-columns: minmax(0, 1fr); }
  /* The bracket points across a gutter that no longer exists once the row
     stacks, so it goes rather than pointing at the edge of the screen. */
  .fy-ov-label::before, .fy-ov-label::after { content: none; }
  .fy-nodes { grid-template-columns: minmax(0, 1fr); }
  /* A NESTED CHIP KEEPS ITS ID IN ONE PIECE. Indent plus a verdict pill plus a
     "local" pill left ~95px for a mono identifier, so commit- / signing and
     ai-dep- / gate split across two lines — while the un-nested chips beside
     them did not. Identifiers are the one thing on this page a reader copies,
     and the chips that broke were the class-C ones the whole honesty argument
     is about. The group gives back its indent, the id stops breaking inside a
     token, and the pills wrap to a second line instead. */
  .fy-repeat { padding: 10px 8px; }
  .fy-stack::before { inset-block: 4px -4px; inset-inline: 4px -4px; }
  /* '.fy-node { flex-wrap: wrap }' and '.fy-node-label { overflow-wrap: normal }'
     used to be declared HERE, and only here. They are unconditional now: a
     narrow region at 1440 squeezes a chip exactly the way a 390 viewport does,
     and the fix that had already been written for one width was the fix the
     other needed. See the pair beside '.fy-node' above. */
  /* The composition collapses to one column in PHASES order, which is the
     source order — every slot rule is dropped rather than re-pointed. */
  .fy-regions { grid-template-columns: minmax(0, 1fr); }
  .fy-region[data-slot] { grid-column: 1; grid-row: auto; }
  .fy-network { padding: 16px; }
  .fy-annotate { font-size: 19px; }

  /* The circle becomes a vertical rail — and it keeps running.

     THE DESKTOP GEOMETRY MUST BE UNDONE HERE, EXPLICITLY. The process box
     carries inline-size 118%, margin-inline -9% and margin-block -64/-112px
     because the desktop stage is deliberately narrower than the ring it holds.
     None of that was reset for the rail, and none of it errors: measured at
     390, the store's title rendered SIX of its twenty-eight pixels with zero
     dark pixels in the glyph box, card 05 was cut by 63px, and every card lost
     10.7px of its right edge — three edges of clipping, and the phrase the
     whole loop is built around simply not on the page. The stage then carried
     overflow clip to contain the damage, which is what hid it.

     There is no hardcoded layout class any more either (Max-10): the rail is a
     property of the viewport, so the media query is the only thing that should
     know about it. */
  .fy-loop-stage { padding: 16px; }
  /* SYMMETRIC. The 20px the rail reserves for its return bracket was taken off
     the left only, so the cards sat 10px right of the stage's centre and the
     gutter the reference fills with a return line was reserved and empty. */
  .fy-process {
    inline-size: 100%; margin-inline: 0; margin-block: 0;
    aspect-ratio: auto; display: grid; grid-template-columns: minmax(0, 1fr);
    gap: 10px; padding-inline: 20px;
  }
  /* THE RAIL IS THE REFERENCE'S COMPACT RAIL, AND IT IS A LOOP. Five stacked
     cards with no connector and no return read as a numbered list on a phone —
     on the chapter named "The loop". The cards and the connectors live in two
     sibling containers, so both are flattened into the rail's own grid and the
     items carry the order the renderer derived; the fifth edge (05 back to 01)
     is the RETURN and is drawn in the gutter instead of the flow. */
  .fy-loop-cards, .fy-connections { display: contents; }
  .fy-loop-card, .fy-connector { order: var(--fy-rail-order, 0); }
  .fy-connector {
    display: block; position: relative; inset: auto; transform: none;
    inline-size: 100%; block-size: 22px;
  }
  .fy-connector svg { display: none; }
  /* The dotted run, aligned with the step-number gutter inside the cards. */
  .fy-connector::before {
    content: ""; position: absolute; inset-block: 0; inset-inline-start: 31px;
    border-inline-start: 1px dotted var(--fy-accent); opacity: 0.75;
  }
  .fy-connector[data-edge-state="running"]::before {
    border-inline-start-style: solid; opacity: 1;
  }
  /* RELATIVE, NOT STATIC. The active and arrival rings are absolutely
     positioned at inset -1px and take their containing block from the nearest
     POSITIONED ancestor — which, with a static card, is the whole loop:
     measured at 390 they were 310 x 686 and painted a blue box round the
     entire rail for the 120ms of their release animation. A still screenshot
     caught it; no geometry probe of the cards ever would have.

     And the offsets must be reset in the same breath. The desktop rule sets
     inset-block-start / inset-inline-start to the circle percentages, which a
     STATIC card ignores and a RELATIVE one obeys: the first cut of this fix
     scattered all five cards by their circle coordinates and pushed the
     document to 575px wide at 390. Measured, both times. */
  /* THE STEP NUMBER SITS IN A LEFT GUTTER BESIDE THE TITLE, which is the
     reference's own compact card — ours stacked it above, where it read as a
     caption rather than as a position in a sequence. The gutter is also what
     the connector's dotted run lines up with. */
  .fy-loop-card {
    position: relative; inset-block-start: auto; inset-inline-start: auto;
    transform: none; inline-size: 100%; block-size: auto; min-block-size: 84px;
    border-radius: 8px; border-color: color-mix(in srgb, var(--fy-ink) 44%, transparent);
    padding: 14px 16px; text-align: start;
    grid-template-columns: 30px minmax(0, 1fr); column-gap: 10px;
    place-content: start stretch; align-items: baseline;
  }
  .fy-card-meta { grid-column: 1; grid-row: 1; }
  .fy-card-title { grid-column: 2; grid-row: 1; font-size: 17px; margin-block-start: 0; }
  .fy-card-body { grid-column: 2; grid-row: 2; font-size: 13px; }
  .fy-card-ring { display: none; }
  .fy-context-store {
    position: static; transform: none; inline-size: 100%; block-size: auto; min-block-size: 64px;
    border-radius: 8px; border: 1px solid color-mix(in srgb, var(--fy-ink) 12%, transparent);
    background: var(--fy-ground); text-align: start; place-content: center start; padding: 16px;
    order: -1;
  }
  .fy-context-title { font-size: 16px; }
  .fy-context-sub, .fy-context-note { font-size: 12px; }
  /* The pattern and the pulse are properties of a DISC. The compact store is a
     card, so the halo that bled 9px of document past the right edge at 390 has
     nothing left to be a halo of — it goes, and the stage needs no clip. */
  .fy-context-pattern, .fy-context-pulse { display: none; }
  /* THE RETURN BRACKET, in the gutter the rail reserves for it: 05 back to 01,
     with the arrowhead at the top. Drawn with borders rather than the desktop
     arc — a path whose 120-unit box is squeezed into 20px renders as a smudge,
     which is what the rail shipped with. */
  .fy-connector[data-loop-edge="rescan"] {
    display: block; position: absolute; inline-size: 14px; block-size: auto;
    inset-block: 118px 26px; inset-inline-start: 3px; transform: none; order: 0;
  }
  .fy-connector[data-loop-edge="rescan"]::before {
    content: ""; position: absolute; inset-block: 0; inset-inline: 0 auto;
    inline-size: 14px; border: 1px dotted var(--fy-accent); border-inline-end: 0;
    border-start-start-radius: 7px; border-end-start-radius: 7px; opacity: 0.75;
  }
  .fy-connector[data-loop-edge="rescan"]::after {
    content: ""; position: absolute; inset-block-start: 0; inset-inline-start: 11px;
    inline-size: 6px; block-size: 6px; border-block-start: 1px solid var(--fy-accent);
    border-inline-end: 1px solid var(--fy-accent); transform: rotate(-45deg);
  }
  /* GATED ON THE EDGE ACTUALLY RUNNING, not on the layout being compact.
     Keyed on a layout class this rule outranked the reduced-motion and
     no-support branches on specificity — measured: a reduced-motion reader at
     390 got a static black dot parked at the top of the rail, the one moving
     part of the loop that survived the branch whose whole job is removing them.
     Keyed on the state the script writes, it cannot: under reduced motion the
     script never writes it. */
  .fy-connector[data-loop-edge="rescan"][data-edge-state="running"] .fy-return-packet {
    display: block; position: absolute; inline-size: 6px; block-size: 6px;
    border-radius: 50%; background: var(--fy-ink);
    box-shadow: 0 0 0 1px var(--fy-ground); inset-block-start: 0; inset-inline-start: 7px;
  }
  /* THE LISTING RESTACKS INTO CARDS, it does not side-scroll. A five-column
     results table in a 350px wrap means dragging sideways to find out who ran
     the scan and when — the two columns a reader most often wants — and the
     card grammar the reference uses for the same job puts them on screen. Every
     cell already carries a data-label; this is what prints it. The wrap stops
     being a scroll container at this width, because there is nothing left to
     scroll. */
  .fy-wrap { overflow-x: visible; }
  .fy-table thead {
    position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }
  .fy-table, .fy-table tbody, .fy-table tr, .fy-table td { display: block; inline-size: 100%; }
  .fy-table tr {
    border: 1px solid var(--fy-line); border-radius: 8px; padding: 16px;
    margin-block-end: 12px; background: var(--fy-ground);
  }
  .fy-table td {
    border: 0; padding: 8px 0; display: grid; gap: 4px; grid-template-columns: minmax(0, 1fr);
    /* Blockified by the grid, a lane chip stretched the full width of the card
       and stopped reading as a chip. */
    justify-items: start;
  }
  .fy-table td::before {
    content: attr(data-label); font-family: var(--fy-mono); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.08em; color: var(--fy-muted);
  }
  .fy-table td:empty { display: none; }
  .fy-table tr.fy-phaseband { padding: 10px 16px; background: var(--fy-surface); border-radius: 8px; }
  .fy-table tr.fy-phaseband td { padding: 0; }
  .fy-table tr.fy-phaseband td::before { content: none; }
  .fy-ph-count { float: none; display: block; margin-block-start: 4px; }
  .fy-panel-port { padding: 14px; }
  .fy-cards { grid-template-columns: minmax(0, 1fr); }

  /* EVERY LABEL-PLUS-ITEMS ROW BECOMES A LIST. Centred and wrapped, each of
     these captured its first item with the run-in label and then landed every
     wrapped line on a different left edge — which, for a KEY, defeats the one
     thing a key exists to do: let you scan a column of marks. The label takes
     its own line and the items align to one edge. */
  .fy-legend, .fy-trace-legend, .fy-verdict-key, .fy-phase-names, .fy-key {
    flex-direction: column; align-items: flex-start; justify-content: flex-start;
    text-align: start;
  }
  .fy-ctl-bar { justify-content: flex-start; }
  .fy-ctl-bar .fy-key-label, :root .design-switcher .ds-label { flex: 0 0 100%; }
  :root .design-switcher { justify-content: flex-start; }

  /* The flow turns the corner: inputs, then checks, then the record, with the
     wires redrawn as a short vertical run and a downward arrow. The stretched
     SVG brackets are HIDDEN rather than rotated — a path whose x and y are
     scaled independently cannot be rotated into a legible vertical. */
  .fy-flow { padding: 16px; }
  .fy-flow-grid { grid-template-columns: minmax(0, 1fr); grid-template-rows: none; row-gap: 14px; }
  .fy-flow-band, .fy-flow-band[data-flow-band="out"] { grid-template-columns: minmax(0, 1fr); }
  .fy-flow-band:not([data-flow-band="out"])::after { content: none; }
  /* Source order is heads-then-bands, which is what lets the heads be one row
     at desktop; the order property interleaves them again when stacked.

     THE ATTRIBUTE IS LOAD-BEARING IN THE SELECTOR, not decoration. Written as
     \`.fy-flow-head, .fy-flow-band\` these rules are (0,1,0) and LOSE to the
     desktop \`.fy-flow-head[data-flow-head="in"]\` family at (0,2,0), which is
     never overridden — so the three-column track survived the media query and
     \`grid-template-columns\` computed to \`0px 186px 130px\` at 390: "Inputs"
     broke to one character per line in a zero-width track, its cards overflowed
     their own column, "Checks" landed on top of them, and the Record card sat
     2186px below the head that names it. The document never widened, which is
     exactly why nothing else caught it. Matching the attribute makes these
     (0,2,0) too, and the later block wins. */
  .fy-flow-head[data-flow-head], .fy-flow-band[data-flow-band] {
    grid-column: 1; grid-row: auto;
  }
  .fy-flow-head[data-flow-head] { text-align: start; padding-inline-end: 0; }
  .fy-flow-head[data-flow-head="in"] { order: 1; }
  .fy-flow-band[data-flow-band="in"] { order: 2; }
  .fy-flow-head[data-flow-head="checks"] { order: 3; }
  .fy-flow-band[data-flow-band="checks"] { order: 4; }
  .fy-flow-head[data-flow-head="out"] { order: 5; }
  .fy-flow-band[data-flow-band="out"] { order: 6; }
  .fy-flow-col { grid-column: 1; grid-row: 1; }
  .fy-flow-wire { grid-column: 1; grid-row: 2; block-size: 26px; }
  .fy-flow-lines { display: none; }
  .fy-flow-wire::before {
    content: ""; position: absolute; inset-inline-start: 50%; inset-block: 0 8px;
    border-inline-start: 1px solid #9a9a9a;
  }
  .fy-flow-wire::after {
    inset-inline: auto; inset-inline-start: 50%; inset-block-start: auto; inset-block-end: 1px;
    transform: translateX(-50%) rotate(135deg);
  }
  .fy-figs { gap: 24px; }
  .fy-fig-num { font-size: 42px; }
  .fy-pagehead { padding-block: 40px 24px; }
  .fy-section, .fy-method-section, .fy-chapter { padding-block: 40px; }
  .fy-colophon-in { padding-block: 24px 8px; }
}

@media (max-height: 460px) and (orientation: landscape) {
  .fy-opening { min-block-size: auto; padding-block: 32px; }
  .fy-chapters { position: static; }
}
`;

/**
 * The shared component layer, reskinned into this register, plus the switcher.
 *
 * The shared stylesheet is written against bridge tokens and ships its own
 * accessibility floors — 16px form controls, 44px targets, nothing that can
 * push the document sideways. None of that is touched here. What IS touched is
 * the shape: square-ish 8px radii, hairlines instead of 2px rules, and the
 * panel headings set at the same weight as everything else on the page.
 */
export const OVERRIDES = `
:root .hp-search-label { letter-spacing: 0.12em; }
/* T8 · A PILL, NOT AN 8px RECTANGLE. 8px is this design's DIAGRAM radius, and
   every other control in the build — nav pills, segmented labels, the select,
   the chips, the grade rings — is 999. The hero's own rule declared the pill and
   lost the cascade to this one: both are (0,2,0) and this block is last. */
:root .hp-search-input {
  border-width: 1px; border-color: var(--fy-hair); border-radius: 999px;
  font-family: var(--fy-body); max-inline-size: 520px;
}
:root .hp-chip, :root .tx-chip { border-width: 1px; border-radius: 999px; }
:root .hp-card, :root .exposure, :root .hp-waiting { border-width: 1px; border-radius: 8px; }
:root .hp-panel-title { font-weight: 400; letter-spacing: -0.02em; }
:root .hp-panel-eyebrow { color: var(--fy-muted); letter-spacing: 0.12em; }
:root .hp-grade { border-width: 2px; font-weight: 400; }
/* The shared layer's six 600/700 weights, brought down to this tree's ceiling.
   A component layer that ships its own emphasis scale will keep shipping it. */
:root .hp-card-name, :root .hp-waiting-link, :root .hp-more,
:root .ex-name, :root .tx-chip-id { font-weight: 500; }
:root .tx-chip-id { color: var(--fy-accent); }
:root .tx-class { border-inline-start-width: 3px; border-radius: 8px; }
:root .dir-found { border-width: 1px; border-radius: 8px; }
:root .hp-unans-track { border-radius: 999px; overflow: hidden; background-color: var(--fy-surface-2); }
/* A FREQUENCY BAR, NOT A DEFICIT. It counts how many listings leave a check
   unanswered, in a track of its own — so it is drawn solid and neutral rather
   than hatched, and it is the last hatch in the design. */
:root .hp-unans-fill { background-color: var(--fy-na); background-image: none; }
:root .ex-row { border-inline-start-width: 3px; }
/* The glosses lose the serif with the family; the shared layer keeps them
   italic and muted, which is §B3's to finish. */
/* T10 · The glosses in the sans at a muted colour — a definition-list register
   rather than an inline aside, which is what italic grey inside running prose
   reads as. */
:root .term-def { font-family: var(--fy-body); font-style: normal; color: var(--fy-muted); }
.fy-dark :root .term-def, .fy-dark .term-def { color: var(--fy-dark-quiet); }
:root .key-note { max-inline-size: var(--fy-prose); }
/* Two targets the shared layer leaves under the floor, measured at both widths:
   the exposure panel's group links (32px) and the incident links inside the
   taxonomy explainer (28px). Both are standalone controls, not links inside a
   running sentence, so the WCAG 2.5.8 inline exemption does not cover them. */
:root .ex-name { min-block-size: 44px; align-items: center; }
/* A PROVENANCE MARK IN A VERDICT COLOUR. "reported" says this site has not
   opened the primary document — the same category as "scored under methodology
   v1", which D11 already moved off amber. The shared layer paints it in
   --hp-warn, which on this site is the gap colour. Neutral, and a 999px pill
   like every other chip here. */
:root .tx-reported {
  color: var(--fy-muted); border-color: var(--fy-line); border-radius: 999px;
  padding: 0 8px; margin-inline-start: 6px;
}
.fy-dark .tx-reported { color: var(--fy-dark-quiet); border-color: var(--fy-dark-rule); }
:root .tx-incident > a { display: inline-flex; align-items: center; min-block-size: 44px; }

/* ══ the shared layer, on the black ground ═══════════════════════════════
   The taxonomy explainer is set on the opening block's own black, and the
   shared components are written against bridge tokens — so the right way to
   move them onto it is to re-declare those tokens, not to restyle the
   components. Without this the nine class panels rendered white-on-white
   inside a black chapter: the headings survived, every control id and every
   incident line went to pale grey on pale grey. A component layer that takes
   its palette from variables will follow whatever the variables say, silently
   and completely. */
.fy-dark {
  --hp-surface: #0d0d0d;
  --hp-ground: #000000;
  --hp-ink: var(--fy-dark-ink);
  --hp-dim: var(--fy-dark-body);
  --hp-muted: var(--fy-dark-quiet);
  --hp-line: var(--fy-dark-rule);
  --hp-line-strong: rgba(255, 255, 255, 0.3);
  --hp-accent: #6fb0ff;
  --hp-pass: #57c98a;
  --hp-fail: #ff9a8f;
  --hp-warn: #e0a33a;
  --hp-hatch: repeating-linear-gradient(135deg,
    rgba(255, 255, 255, 0.32) 0 3px, rgba(255, 255, 255, 0) 3px 7px);
}
.fy-dark a { color: #6fb0ff; }
.fy-dark .fy-method-section > h2,
.fy-dark .tx-class-title,
.fy-dark h3 { color: var(--fy-dark-ink); }
.fy-dark .fy-method-section p,
.fy-dark .fy-method-section li { color: var(--fy-dark-body); }
.fy-dark code { color: var(--fy-dark-ink); }
.fy-dark .method-table th,
.fy-dark .method-table td { border-block-end-color: var(--fy-dark-rule); color: var(--fy-dark-body); }
.fy-dark .method-table thead th { color: var(--fy-dark-quiet); border-block-end-color: rgba(255, 255, 255, 0.3); }
.fy-dark .tx-details summary { color: var(--fy-dark-body); }
/* A DISCLOSURE THAT LOOKS LIKE ONE. The shared layer sets display:inline-flex
   on every summary for its 44px tap floor, and inline-flex suppresses
   the ::marker pseudo in this engine — so nine collapsed sections rendered as
   subheadings with nothing beside them, cursor:auto, no marker, no hover
   cue. On a phone, where there is no hover and no cursor, that is the only
   signal there was. The design already ships correct rules for the
   .fy-merge and .fy-table summaries; only this family was missed. */
:root .tx-details > summary { cursor: pointer; }
:root .tx-details > summary::-webkit-details-marker { display: none; }
:root .tx-details > summary::before {
  content: ""; inline-size: 7px; block-size: 7px; flex: 0 0 auto;
  margin-inline-end: 10px; margin-block-start: -3px;
  border-inline-end: 1.5px solid currentcolor; border-block-end: 1.5px solid currentcolor;
  transform: rotate(45deg);
}
:root .tx-details[open] > summary::before { transform: rotate(-135deg); margin-block-start: 3px; }
:root .tx-details > summary:hover { color: var(--fy-dark-ink); }
.fy-dark .fy-method-section { scroll-margin-top: 88px; }

/* The switcher sits in the colophon, in the flow. Bulletin measured a fixed
   one painting over body text at some scroll position on EVERY page, and
   reserving clearance at the end of a document cannot protect its middle. */
:root .design-switcher {
  position: static; z-index: auto; flex-wrap: wrap;
  inline-size: min(100% - var(--fy-gutter) * 2, var(--fy-wrap));
  max-inline-size: none; margin: 0 auto; padding-block: 8px 24px;
  display: flex; align-items: center; gap: 0 4px; background: 0 0; border: none;
  font-size: 14px;
}
:root .design-switcher .ds-label {
  display: inline-flex; align-items: center; min-block-size: 44px;
  font-family: var(--fy-mono); font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--fy-muted); padding-inline-end: 12px;
}
:root .design-switcher a {
  display: inline-flex; align-items: center; min-block-size: 44px; padding: 0 14px;
  border-radius: 999px; color: var(--fy-text); text-decoration: none; white-space: nowrap;
}
:root .design-switcher a:hover { background: var(--fy-surface-2); }
:root .design-switcher a[aria-current="true"] { background: var(--fy-surface-2); color: var(--fy-ink); }
/* No overlay, nothing to clear: the shared rule reserves a band at the end of
   every page for a switcher that floats, and this one does not. */
:root body { padding-block-end: 0; }
`;
