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
  --fy-tint-green: #edf8f1;     --fy-edge-green: #9fddb1;
  --fy-tint-grey: #f7f7f8;      --fy-edge-grey: #d0d0d4;
  --fy-dash: #a1a1a1;

  /* SSCSB's verdicts. Not the diagram accent, not the link blue, and not the
     reference's red — a hue that means "fail" here may not also mean
     "emphasis" three sections up. */
  --fy-pass: #0f7a3d;
  --fy-fail: #c0362c;
  --fy-warn: #a35b00;
  --fy-na: #6b6b6b;
  --fy-hatch: repeating-linear-gradient(135deg,
    rgba(0, 0, 0, 0.26) 0 3px, rgba(0, 0, 0, 0) 3px 7px);

  --fy-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  --fy-body: var(--fy-display);
  --fy-serif: "Source Serif 4", "Iowan Old Style", Georgia, "Times New Roman", serif;
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
.fy-wordmark {
  font-family: var(--fy-mono); font-weight: 500; font-size: 15px; letter-spacing: 0.08em;
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

/* The one fixed element on the page, and it is 40px in a corner nothing else
   uses. Drawn in mid-grey on no ground at all, so it reads on the white
   chapters AND on the black opening block — a fixed element cannot ask what
   is underneath it. */
.fy-find {
  position: fixed; inset-block-start: 12px; inset-inline-end: 24px; z-index: 40;
  inline-size: 40px; block-size: 40px; border-radius: 999px;
  display: grid; place-items: center; color: #8a8a8a; background: 0 0;
  border: 1px solid rgba(128, 128, 128, 0.42); text-decoration: none;
}
.fy-find:hover { background: rgba(128, 128, 128, 0.16); color: #4d4d4d; }

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
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.fy-col-links a:hover { color: var(--fy-link); text-decoration: underline; text-underline-offset: 4px; }

/* ══ the hero aperture ═══════════════════════════════════════════════════ */
.fy-aperture { position: relative; }
.fy-track { position: relative; }
.fy-opening {
  min-block-size: calc(100svh - var(--fy-header-h));
  background: var(--fy-ground); position: relative; z-index: 0;
  padding: 84px var(--fy-gutter);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
}
.fy-opening-in { inline-size: min(100%, var(--fy-media)); }
.fy-kicker {
  font-family: var(--fy-mono); font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--fy-muted); margin-block-end: 24px;
}
.fy-headline {
  font-size: clamp(47px, 8.8vw, 148px); font-weight: 400; line-height: 1.02;
  letter-spacing: -0.04em; color: var(--fy-ink);
}
.fy-context {
  margin-block-start: 28px; font-size: 18.4px; line-height: 30.4px;
  color: var(--fy-quiet); max-inline-size: 56ch; margin-inline: auto;
}
.fy-opening .hp-search { margin-block: 32px 0; text-align: start; max-inline-size: 520px; margin-inline: auto; }
.fy-controls { min-block-size: 48px; margin-block-start: 28px; display: flex; justify-content: center; }
.fy-continue {
  inline-size: 48px; block-size: 48px; padding: 0; border: 0; border-radius: 50%;
  background: 0 0; color: rgb(115, 115, 115); cursor: pointer; display: grid; place-items: center;
  text-decoration: none;
}
.fy-continue:hover { background: #0000000a; }
.fy-continue:focus-visible { outline: solid 2px; outline-offset: 3px; }

.fy-response {
  min-block-size: max(540px, 100svh); z-index: 2;
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
.fy-pullquote {
  font-family: var(--fy-serif); font-style: italic; font-size: 22px; line-height: 1.5;
  color: var(--fy-dark-ink); margin-block: 28px 0; max-inline-size: 60ch;
  padding-inline-start: 20px; border-inline-start: 1px solid var(--fy-dark-rule);
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
.fy-chart-figure { grid-area: chart; margin: 0; min-inline-size: 0; }
.fy-chart-copy { grid-area: copy; min-inline-size: 0; }
.fy-plot { inline-size: 100%; display: block; overflow: visible; }
.fy-axis-label, .fy-data-label { fill: var(--fy-dark-ink); font-size: 16px; font-family: var(--fy-body); }
.fy-data-label { font-variant-numeric: tabular-nums; }
.fy-baseline { stroke: var(--fy-dark-axis); stroke-width: 1px; }
.fy-bar { fill: var(--fy-dark-bar); }
.fy-bar-marked { fill: var(--fy-accent); }
.fy-chart-caption { margin-block-start: 20px; font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet); }

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
.fy-maze .fy-trace { vector-effect: none; }
.fy-triangle .fy-trace { vector-effect: non-scaling-stroke; }
.fy-checkpoint-base { fill: #000000; }
.fy-checkpoint { stroke-width: 1px; }
.fy-speed-node { stroke: var(--fy-figure-accent); stroke-width: 1.5px; }
.fy-speed-label {
  fill: var(--fy-dark-ink); font-size: 14px; font-family: var(--fy-body);
}
.fy-trace-legend {
  list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-wrap: wrap;
  gap: 6px 18px; font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet);
}
.fy-trace-legend li { display: flex; align-items: baseline; gap: 8px; }
.fy-trace-legend li[data-reached="true"] { color: var(--fy-dark-ink); }
.fy-legend-no { font-family: var(--fy-mono); font-size: 12px; color: var(--fy-accent); }

/* the attack list */
.fy-attacks { list-style: none; margin: 40px auto 0; padding: 0; max-inline-size: 800px; text-align: start; }
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
.fy-attack-panel { padding-block: 0 24px; display: grid; gap: 12px; }
.fy-attack-line { font-size: 17px; line-height: 1.6; color: var(--fy-dark-body); }
.fy-attack-checks { font-size: 14px; line-height: 1.7; color: var(--fy-dark-quiet); overflow-wrap: anywhere; }
.fy-attack-checks code { color: var(--fy-dark-ink); }
.fy-attack-label {
  font-family: var(--fy-mono); font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--fy-dark-quiet); margin-inline-end: 8px;
}
.fy-incident { font-size: 14px; line-height: 21px; color: var(--fy-dark-quiet); }
.fy-incident a { color: var(--fy-dark-ink); }
.fy-incident-when { font-family: var(--fy-mono); margin-inline: 8px; }
.fy-reported {
  font-family: var(--fy-mono); font-size: 12px; border: 1px solid var(--fy-dark-rule);
  padding: 0 6px; margin-inline-start: 8px;
}

/* ══ the pill nav ════════════════════════════════════════════════════════ */
.fy-chapters {
  z-index: 20; inline-size: fit-content;
  max-inline-size: calc(100% - var(--fy-gutter) * 2);
  overscroll-behavior-x: contain; scrollbar-width: none;
  border: 1px solid var(--fy-hair); background: var(--fy-ground);
  border-radius: 999px; justify-content: start; gap: 4px;
  margin: 160px auto 0; padding: 3px; display: flex;
  position: sticky; inset-block-start: 12px; overflow-x: auto;
}
.fy-chapters::-webkit-scrollbar { display: none; }
.fy-chapters a {
  min-block-size: 40px; color: var(--fy-text); border-radius: 999px;
  flex: 0 0 auto; align-items: center; gap: 4px; padding: 8px 16px;
  font-size: 14px; line-height: 1.4; text-decoration: none; display: flex; white-space: nowrap;
}
.fy-chapters a span { font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: isolate; }
.fy-chapters a span::after { content: "."; }
.fy-chapters a[aria-current], .fy-chapters a:hover { background: var(--fy-surface-2); color: var(--fy-text); }
.fy-chapters a:focus-visible { outline: 2px solid var(--fy-accent); outline-offset: -2px; }
.fy-chapter { scroll-margin-top: 88px; padding-block: var(--fy-beat); }
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
.fy-ov-label { padding-block: 8px; }
.fy-ov-label h3 { font-size: 22px; font-weight: 500; color: var(--fy-ink); }
.fy-ov-label p { margin-block-start: 12px; font-size: 17px; line-height: 28px; color: var(--fy-quiet); }
.fy-ov-group {
  border: 2px solid rgba(0, 0, 0, 0.44); border-radius: 16px; background: var(--fy-ground);
  padding: 16px; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.fy-ov-group[data-emphasis="true"] { border-color: var(--fy-accent); }
.fy-ov-panel { background: var(--fy-surface-3); border-radius: 8px; padding: 16px; }
.fy-ov-panel h4 { font-size: 17px; font-weight: 500; color: var(--fy-ink); }
.fy-ov-panel p { margin-block-start: 8px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-ov-count { font-family: var(--fy-mono); font-variant-numeric: tabular-nums; color: var(--fy-text); }

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
.fy-regions { display: grid; gap: 16px; }
.fy-region { border-radius: 8px; border: 1px solid var(--fy-edge-grey); background: var(--fy-tint-grey); padding: 16px; }
.fy-region[data-tint="blue"] { background: var(--fy-tint-blue); border-color: var(--fy-edge-blue); }
.fy-region[data-tint="violet"] { background: var(--fy-tint-violet); border-color: var(--fy-edge-violet); }
.fy-region[data-tint="green"] { background: var(--fy-tint-green); border-color: var(--fy-edge-green); }
.fy-region[data-tint="grey"] { background: var(--fy-tint-grey); border-color: var(--fy-edge-grey); }
.fy-region-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; }
.fy-region-title { font-size: 17px; font-weight: 500; color: var(--fy-ink); }
.fy-region-note { font-size: 14px; line-height: 21px; color: var(--fy-muted); margin-block-start: 4px; }
.fy-repeat {
  margin-block-start: 12px; border: 1px dashed var(--fy-dash); border-radius: 8px;
  background: var(--fy-ground); padding: 12px;
}
.fy-repeat-label {
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  font-size: 14px; color: var(--fy-muted); margin-block-end: 10px;
}
.fy-repeat-count { font-family: var(--fy-mono); font-size: 13px; color: var(--fy-muted); }
.fy-nodes { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.fy-node {
  min-block-size: 44px; display: flex; align-items: center; gap: 10px;
  background: var(--fy-ground); border: 1px solid var(--fy-edge-grey); border-radius: 8px;
  padding: 8px 12px; cursor: pointer; text-align: start; font: inherit;
  color: var(--fy-text); inline-size: 100%;
}
.fy-node:hover, .fy-node[aria-expanded="true"] { border-color: var(--fy-muted); }
.fy-node:focus-visible { outline: 2px solid var(--fy-ring); outline-offset: 3px; }
.fy-node-icon { inline-size: 20px; block-size: 20px; flex: 0 0 auto; color: var(--fy-muted); }
.fy-node-label { font-family: var(--fy-mono); font-size: 13px; line-height: 22px; overflow-wrap: anywhere; }
.fy-node-verdict {
  margin-inline-start: auto; font-family: var(--fy-mono); font-size: 11px;
  letter-spacing: 0.04em; text-transform: uppercase; flex: 0 0 auto;
  border: 1px solid currentcolor; border-radius: 999px; padding: 0 7px; line-height: 18px;
}
.fy-node[data-verdict="pass"] { border-color: var(--fy-pass); }
.fy-node[data-verdict="pass"] .fy-node-verdict { color: var(--fy-pass); }
.fy-node[data-verdict="fail"] { border-color: var(--fy-fail); }
.fy-node[data-verdict="fail"] .fy-node-verdict { color: var(--fy-fail); }
.fy-node[data-verdict="gap"] { border-color: var(--fy-warn); border-style: dashed; }
.fy-node[data-verdict="gap"] .fy-node-verdict { color: var(--fy-warn); }
.fy-node[data-verdict="unverified"] { border-style: dotted; border-color: var(--fy-na); }
.fy-node[data-verdict="unverified"] .fy-node-icon { background-image: var(--fy-hatch); }
.fy-node[data-verdict="unverified"] .fy-node-verdict { color: var(--fy-na); }
.fy-node[data-verdict="info"] { border-color: var(--fy-line); }
.fy-node[data-verdict="info"] .fy-node-verdict { color: var(--fy-muted); }

/* ══ the toggletip ═══════════════════════════════════════════════════════ */
.fy-tip-holder { position: relative; }
.fy-tip {
  position: absolute; z-index: 50; inset-inline-start: 0; inset-block-start: calc(100% + 8px);
  inline-size: min(340px, calc(100vw - 32px)); background: var(--fy-ground);
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
}
.fy-loop-stage {
  inline-size: min(100%, 760px); margin-inline: auto; padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px;
  background-image: radial-gradient(rgba(0, 0, 0, 0.08) 0.7px, rgba(0, 0, 0, 0) 0.9px);
  background-size: 6px 6px;
}
.fy-process { position: relative; inline-size: 100%; aspect-ratio: 1 / 1; }
.fy-loop-cards { list-style: none; margin: 0; padding: 0; }
.fy-loop-card {
  position: absolute; inset-block-start: var(--fy-circle-y); inset-inline-start: var(--fy-circle-x);
  inline-size: 23%; block-size: 23%; transform: translate(-50%, -50%);
  border-radius: 50%; background: var(--fy-ground); border: 1px solid rgba(0, 0, 0, 0);
  display: grid; place-content: center; text-align: center; padding: 8%;
}
.fy-card-ring { position: absolute; inset: -1px; overflow: visible; }
.fy-card-ring circle {
  fill: none; stroke: var(--fy-ink); stroke-width: 1.25px; stroke-linecap: round;
  stroke-dasharray: 0, 1;
}
.fy-active-ring, .fy-arrival-ring {
  border: 2px solid var(--fy-accent); border-radius: inherit; pointer-events: none;
  position: absolute; inset: -1px; opacity: 0;
}
.fy-card-meta { font-family: var(--fy-mono); font-size: 12px; line-height: 1.5; color: var(--fy-muted); }
.fy-card-title {
  font-size: clamp(14px, 1.8cqw, 18px); font-weight: 500; letter-spacing: -0.01em;
  line-height: 1.26; margin-block-start: 6px; color: var(--fy-ink);
}
.fy-card-body { font-size: clamp(11px, 1.35cqw, 13px); line-height: 1.5; color: var(--fy-muted); margin-block-start: 6px; }
.fy-connections { position: absolute; inset: 0; pointer-events: none; }
.fy-connector {
  position: absolute; inline-size: 120px; block-size: 120px;
  inset-block-start: var(--fy-edge-y); inset-inline-start: var(--fy-edge-x);
  transform: translate(-50%, -50%) rotate(var(--fy-edge-a));
}
.fy-connector svg { inline-size: 100%; block-size: 100%; overflow: visible; }
.fy-edge-base { stroke: var(--fy-accent); stroke-width: 1px; stroke-dasharray: 2 4; fill: none; opacity: 0.55; }
.fy-edge-highlight { stroke: var(--fy-accent); stroke-width: 1.5px; fill: none; opacity: 0; }
.fy-packet { fill: var(--fy-ink); stroke: var(--fy-ground); stroke-width: 1px; offset-path: path("M 8 60 H 112"); offset-distance: 0%; offset-rotate: 0deg; }
.fy-connector[data-loop-edge="rescan"] .fy-packet { r: 3px; }
.fy-packet-group { opacity: 0; }
.fy-return-packet { display: none; }
.fy-context-store {
  position: absolute; inset-block-start: 50%; inset-inline-start: 50%;
  transform: translate(-50%, -50%); inline-size: 26%; block-size: 26%;
  border-radius: 50%; display: grid; place-content: center; text-align: center; gap: 2px;
}
.fy-context-pattern {
  position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  background-image: radial-gradient(color-mix(in srgb, var(--fy-ink) 17%, transparent) 0.65px, transparent 0.85px);
  background-size: 6px 6px;
}
.fy-context-pulse {
  position: absolute; inset: -6%; border-radius: 50%; pointer-events: none; opacity: 0;
  background: radial-gradient(circle,
    color-mix(in srgb, var(--fy-accent) 5%, transparent) 12%,
    color-mix(in srgb, var(--fy-accent) 24%, transparent) 34%,
    color-mix(in srgb, var(--fy-accent) 15%, transparent) 52%, transparent 72%);
}
.fy-context-title { font-size: 16px; position: relative; color: var(--fy-ink); }
.fy-context-sub { font-family: var(--fy-mono); font-size: 12px; position: relative; color: var(--fy-muted); }
.fy-loop-caption {
  text-align: center; font-family: var(--fy-mono); font-size: 12px; line-height: 1.5;
  color: var(--fy-muted); margin-block-start: 16px;
}

/* ══ the segmented explorer ══════════════════════════════════════════════ */
.fy-explorer { padding-block-start: 40px; }
.fy-segmented {
  display: flex; gap: 0; padding: 4px; border-radius: 999px; background: var(--fy-surface-2);
  inline-size: fit-content; max-inline-size: 100%; margin-inline: auto;
  overflow-x: auto; scrollbar-width: none; overscroll-behavior-x: contain;
}
.fy-segmented::-webkit-scrollbar { display: none; }
.fy-seg-option { position: relative; display: flex; flex: 0 0 auto; cursor: pointer; }
.fy-seg-input {
  position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
.fy-seg-label {
  inline-size: 100%; min-block-size: 40px; padding-inline: 16px; border-radius: 999px;
  color: var(--fy-quiet); text-align: center; white-space: nowrap;
  justify-content: center; align-items: center; line-height: 1.25; display: flex;
  font-size: 14px;
}
.fy-seg-input:checked + .fy-seg-label {
  background: var(--fy-ground); color: var(--fy-ink); box-shadow: rgba(0, 9, 68, 0.08) 0 1px 3px;
}
.fy-seg-input:focus-visible + .fy-seg-label { outline: 2px solid var(--fy-ring); outline-offset: -2px; }
.fy-panel-port {
  margin-block-start: 32px; overflow-x: auto; -webkit-overflow-scrolling: touch;
  border: 1px solid var(--fy-hair); border-radius: 8px; padding: 20px;
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
.fy-refcard[data-reference-type="meta"] { --fy-ref-bg: #ffffff; --fy-ref-edge: #262626; }
.fy-refcard:hover, .fy-refcard:focus-visible, .fy-refcard[aria-expanded="true"] {
  border-color: color-mix(in srgb, var(--fy-ref-edge) 72%, var(--fy-ref-ink));
  background-color: color-mix(in srgb, var(--fy-ref-bg) 96%, var(--fy-ref-ink));
}
.fy-refcard-id { font-family: var(--fy-mono); font-size: 13px; overflow-wrap: anywhere; }
.fy-refcard-q { font-size: 14px; line-height: 20px; color: var(--fy-quiet); }
.fy-legend {
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: center;
  margin-block-start: 24px; font-size: 14px; color: var(--fy-muted);
}
.fy-legend-swatch {
  inline-size: 14px; block-size: 14px; border-radius: 4px; display: inline-block;
  margin-inline-end: 8px; vertical-align: -2px; border: 1px solid var(--fy-edge-grey);
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

/* ══ directory ═══════════════════════════════════════════════════════════ */
.fy-dir-controls { display: grid; gap: 16px; padding-block: 8px 32px; }
.fy-sortbar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; font-size: 14px; }
.fy-sortbar label { color: var(--fy-muted); }
.fy-sortbar select {
  border: 1px solid var(--fy-line); border-radius: 8px; padding: 8px 12px;
  background: var(--fy-ground); color: var(--fy-text); font-family: var(--fy-body);
}
.fy-count { font-family: var(--fy-mono); font-variant-numeric: tabular-nums; color: var(--fy-muted); }
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
.fy-repo-link { font-family: var(--fy-mono); font-size: 15px; color: var(--fy-ink); text-decoration: none; }
.fy-repo-link:hover { color: var(--fy-link); text-decoration: underline; text-underline-offset: 4px; }
.fy-desc { display: block; margin-block-start: 6px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-meta-line {
  display: block; margin-block-start: 8px; font-family: var(--fy-mono); font-size: 12px;
  color: var(--fy-muted); font-variant-numeric: tabular-nums;
}
.fy-cov-mark { border-radius: 999px; padding: 0 8px; border: 1px solid currentcolor; }
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
.fy-conflict {
  display: block; margin-block-start: 10px; padding: 10px 12px; border-radius: 8px;
  border: 1px solid var(--fy-fail); background: var(--fy-ground);
  font-size: 14px; line-height: 21px; color: var(--fy-text); max-inline-size: 64ch;
}
.fy-merge { margin-block-start: 10px; font-size: 14px; }
.fy-merge summary { cursor: pointer; color: var(--fy-muted); }
.fy-merge-tag {
  font-family: var(--fy-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  border: 1px solid var(--fy-line); border-radius: 999px; padding: 0 8px; margin-inline-end: 8px;
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
.fy-lane-overlay { border-style: dashed; border-color: var(--fy-na); color: var(--fy-na); margin-inline-start: 6px; }
.fy-phasebar { display: grid; gap: 4px; min-inline-size: 190px; }
.fy-phaserow { display: grid; grid-template-columns: 30px minmax(60px, 1fr) 52px; gap: 8px; align-items: center; }
.fy-phase-id { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); }
.fy-phase-track { block-size: 8px; border-radius: 999px; overflow: hidden; display: flex; background: var(--fy-surface-2); }
.fy-seg-pass { background: var(--fy-pass); }
.fy-seg-fail { background: var(--fy-fail); }
.fy-seg-unv { background-image: var(--fy-hatch); background-color: var(--fy-surface-2); }
.fy-phase-pct { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); font-variant-numeric: tabular-nums; text-align: end; }
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
.fy-swatch { inline-size: 14px; block-size: 14px; border-radius: 4px; display: inline-block; margin-inline-end: 8px; vertical-align: -2px; }
.fy-swatch-pass { background: var(--fy-pass); }
.fy-swatch-fail { background: var(--fy-fail); }
.fy-swatch-unv { background-image: var(--fy-hatch); background-color: var(--fy-surface-2); }

/* ══ the repository sheet ════════════════════════════════════════════════ */
.fy-repo-hero { display: flex; flex-wrap: wrap; gap: 24px 32px; align-items: flex-start; padding-block: 40px 24px; }
.fy-repo-title { font-size: clamp(30px, 4vw, 52px); line-height: 1.08; letter-spacing: -0.03em; color: var(--fy-ink); word-break: break-word; }
.fy-repo-meta { display: flex; flex-wrap: wrap; gap: 4px 6px; margin-block-start: 16px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-rm { white-space: nowrap; }
.fy-rm:not(:last-child)::after { content: " ·"; }
.fy-rm-url { white-space: normal; overflow-wrap: anywhere; }
.fy-stale { color: var(--fy-warn); text-decoration: none; border: 1px solid var(--fy-warn); border-radius: 999px; padding: 0 8px; }
.fy-figs { display: grid; gap: 32px 56px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); padding-block: 24px 40px; }
.fy-fig-num { font-size: 48px; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--fy-ink); }
.fy-fig-cap { margin-block-start: 12px; font-size: 14px; line-height: 21px; color: var(--fy-muted); }
.fy-cov-verdict { margin-block-start: 12px; font-family: var(--fy-mono); font-size: 12px; color: var(--fy-muted); line-height: 1.6; }
.fy-cov-verdict .fy-cv-note { font-family: var(--fy-body); display: block; margin-block-start: 6px; }
.fy-panel {
  border: 1px solid var(--fy-line); border-radius: 8px; padding: 24px; margin-block: 24px;
  background: var(--fy-ground);
}
.fy-panel-conflict { border-color: var(--fy-fail); }
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
.fy-oc-pass { color: var(--fy-pass); }
.fy-oc-fail { color: var(--fy-fail); }
.fy-oc-gap { color: var(--fy-warn); }
.fy-oc-unverified { color: var(--fy-na); border-style: dotted; }
.fy-oc-info { color: var(--fy-muted); }
.fy-raw { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); margin-inline-start: 8px; }
.fy-oos { font-family: var(--fy-mono); font-size: 11px; color: var(--fy-muted); }
.fy-row-oos { opacity: 0.62; }
.fy-reason { display: block; font-size: 14px; line-height: 21px; color: var(--fy-quiet); }
.fy-table details { margin-block-start: 8px; font-size: 14px; }
.fy-table summary { cursor: pointer; color: var(--fy-muted); min-block-size: 44px; display: inline-flex; align-items: center; }
.fy-table details ul { margin: 8px 0 0; padding-inline-start: 20px; color: var(--fy-quiet); line-height: 21px; }

/* ══ methodology ═════════════════════════════════════════════════════════ */
.fy-method-section { padding-block: 56px; scroll-margin-top: 88px; }
.fy-method-section > h2 {
  font-size: clamp(28px, 3vw, 40px); line-height: 1.15; letter-spacing: -0.02em; color: var(--fy-ink);
}
.fy-method-section p { margin-block-start: 16px; font-size: 17px; line-height: 28px; max-inline-size: var(--fy-prose); }
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
  .fy-header-in { padding-inline-end: 48px; }
  .fy-wordmark { font-size: 14px; }
  .fy-nav a { padding: 8px 10px; font-size: 13px; }
  .fy-find { inset-block-start: 7px; inset-inline-end: 6px; inline-size: 40px; block-size: 40px; }

  .fy-opening { padding: 40px var(--fy-gutter); min-block-size: max(500px, calc(100svh - var(--fy-header-h))); }
  .fy-headline { font-size: clamp(41px, 8.2vw, 65px); }
  .fy-headline br { display: none; }
  .fy-context { margin-block-start: 18px; font-size: 16px; line-height: 26px; }
  .fy-opening .hp-search { margin-block-start: 20px; }
  .fy-controls { margin-block-start: 16px; }
  .fy-response { min-block-size: max(500px, 100svh); }
  .fy-response-left, .fy-response-right { padding: 40px var(--fy-gutter); }
  .fy-response-headline { font-size: clamp(48px, 10vw, 77px); }
  .fy-response-line { margin-block-start: 18px; font-size: 16px; line-height: 26px; }

  .fy-dark h2 { font-size: 32px; }
  .fy-metrics { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 24px 28px; }
  .fy-metric-value { font-size: 42px; }
  .fy-chapter h2 { font-size: 36px; letter-spacing: -0.72px; }
  .fy-chapter-lead { font-size: 17px; line-height: 28px; }

  /* The bar chart's one genuinely clever trick: copy first, then a plot
     stretched 1.35x vertically with the label group counter-scaled, so the
     short bars stay legible on a narrow screen without the numbers stretching
     with them. */
  .fy-chart-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "copy" "chart"; gap: 36px; }
  .fy-chart-figure { --fy-stretch: 1.35; aspect-ratio: 580 / calc(320 * var(--fy-stretch)); position: relative; overflow: hidden; }
  .fy-plot { block-size: auto; transform: scaleY(var(--fy-stretch)); transform-origin: 0 0; position: absolute; inset-block-start: 0; inset-inline-start: 0; }
  .fy-axis-label, .fy-data-label { font-size: 20px; }
  .fy-label-scale { transform: scaleY(calc(1 / var(--fy-stretch))); transform-origin: 0 0; }

  .fy-trace-grid { grid-template-columns: minmax(0, 1fr); gap: 32px; }
  .fy-chapters {
    margin-top: 80px; inset-block-start: 8px;
    max-inline-size: calc(100% - var(--fy-gutter) * 2 - 64px);
  }
  .fy-chapters a { padding: 8px 12px; font-size: 13px; }

  .fy-ov-row { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .fy-ov-group { grid-template-columns: minmax(0, 1fr); }
  .fy-nodes { grid-template-columns: minmax(0, 1fr); }
  .fy-network { padding: 16px; }
  .fy-annotate { font-size: 19px; }

  /* The circle becomes a vertical rail — and it keeps running. */
  .fy-loop-stage { padding: 16px; }
  .fy-compact .fy-process { aspect-ratio: auto; display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; padding-inline-start: 20px; }
  .fy-compact .fy-loop-card {
    position: static; transform: none; inline-size: 100%; block-size: auto; min-block-size: 96px;
    border-radius: 8px; border-color: color-mix(in srgb, var(--fy-ink) 44%, transparent);
    padding: 16px; place-content: start; text-align: start;
  }
  .fy-compact .fy-card-title { font-size: 17px; }
  .fy-compact .fy-card-body { font-size: 13px; }
  .fy-compact .fy-card-ring { display: none; }
  .fy-compact .fy-context-store {
    position: static; transform: none; inline-size: 100%; block-size: auto; min-block-size: 64px;
    border-radius: 8px; border: 1px solid color-mix(in srgb, var(--fy-ink) 12%, transparent);
    background: var(--fy-ground); text-align: start; place-content: center start; padding: 16px;
    order: -1;
  }
  .fy-compact .fy-connections { position: static; }
  .fy-compact .fy-connector { display: none; }
  .fy-compact .fy-connector[data-loop-edge="rescan"] {
    display: block; position: absolute; inline-size: 20px; block-size: auto;
    inset-block: 120px 16px; inset-inline-start: 0; transform: none;
  }
  .fy-compact .fy-connector[data-loop-edge="rescan"] .fy-return-packet {
    display: block; position: absolute; inline-size: 6px; block-size: 6px;
    border-radius: 50%; background: var(--fy-ink);
    box-shadow: 0 0 0 1px var(--fy-ground); inset-block-start: 0; inset-inline-start: 7px;
  }
  .fy-compact .fy-connector[data-loop-edge="rescan"] svg { block-size: 100%; }

  .fy-panel-port { padding: 14px; }
  .fy-cards { grid-template-columns: minmax(0, 1fr); }
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
:root .hp-search-input { border-width: 1px; border-color: var(--fy-line); border-radius: 8px; font-family: var(--fy-body); }
:root .hp-chip, :root .tx-chip { border-width: 1px; border-radius: 999px; }
:root .hp-card, :root .exposure, :root .hp-waiting { border-width: 1px; border-radius: 8px; }
:root .hp-panel-title { font-weight: 400; letter-spacing: -0.02em; }
:root .hp-panel-eyebrow { color: var(--fy-muted); letter-spacing: 0.12em; }
:root .hp-grade { border-width: 2px; font-weight: 400; }
:root .tx-chip-id { color: var(--fy-accent); }
:root .tx-class { border-inline-start-width: 3px; border-radius: 8px; }
:root .dir-found { border-width: 1px; border-radius: 8px; }
:root .hp-unans-track { border-radius: 999px; overflow: hidden; }
:root .hp-unans-fill { background-color: var(--fy-surface-2); }
:root .ex-row { border-inline-start-width: 3px; }
:root .term-def { font-family: var(--fy-serif); font-style: italic; }
:root .key-note { max-inline-size: var(--fy-prose); }

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
