/**
 * Signal — the complete stylesheet.
 *
 * ONE THEME, COMMITTED. Warm paper, warm ink, one cool accent, every surface
 * painting an explicit background (sanctioned by the Design contract). There
 * is no dark mode here on purpose: this page's core job is to render pass /
 * fail / gap / unverified, and a second palette is a second set of status
 * hues to keep honest. One is enough to get right.
 *
 * THE ACCENT IS BLUE FOR A REASON. Colour on this site is DATA. Green, amber
 * and red are spoken for by control state, so the brand accent has to be a hue
 * that can never be misread as a verdict. That single decision cascades: the
 * hero has no coloured artwork, the hover state is a tint rather than a hue,
 * and nothing decorative is ever green.
 *
 * TYPE. Inter Tight for display, Inter for body and tables, JetBrains Mono for
 * data. Tracking goes negative as size goes up (-0.03em at display, 0 at body)
 * and the weight ceiling is 600 — size makes hierarchy, weight does not. Mono
 * uppercase with +0.08em tracking is a SEMANTIC signal: it marks machine
 * truth — identifiers, column headers, labels — and never sets a sentence.
 */

export const CSS = `/* Signal — warm paper, hairline structure, one cool accent. */

/* ── tokens ─────────────────────────────────────────────────────────────── */
:root {
  /* Surfaces — warm paper, never clinical white. */
  --paper:      #FBFAF7;
  --paper-2:    #F4F2ED;
  --paper-3:    #EDEAE3;
  --surface:    #FFFFFF;

  /* Ink — warm near-black, never pure #000. */
  --ink:        #1A1714;
  --ink-2:      #4A443D;
  --ink-3:      #7A736A;
  --hairline:   rgba(26, 23, 20, 0.12);
  --hairline-2: rgba(26, 23, 20, 0.06);

  /* Brand accent — deliberately outside the status range. */
  --accent:      #2B5FD9;
  --accent-ink:  #1E45A0;
  --accent-wash: #EAF0FE;

  /* Status — reserved, never decorative. */
  --pass:      #1F7A4D;  --pass-wash:      #E6F4EC;
  --degraded:  #9A6407;  --degraded-wash:  #FBF0DC;
  --fail:      #B3261E;  --fail-wash:      #FBE9E7;
  --unknown:   #7A736A;  --unknown-wash:   #EFEDE8;

  --shadow-pill: 0 24px 56px -20px rgba(26,23,20,.18), 0 8px 20px -12px rgba(26,23,20,.12);
  --shadow-card: 0 8px 32px rgba(26,23,20,.08);

  --ease:      cubic-bezier(.2,.8,.2,1);
  --dur-morph: .42s;
  --dur-quick: .16s;

  --maxw:      1200px;
  --maxw-wide: 1360px;
  --gutter:    clamp(1.25rem, 4vw, 3rem);
  --section:   clamp(48px, 7vw, 96px);
  --measure:   68ch;
  --chrome:    64px;

  --display: "Inter Tight", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --body:    "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --t-display: clamp(2.5rem, 4.4vw + .5rem, 4.5rem);
  --t-h1:      clamp(2rem, 3vw + .5rem, 3rem);
  --t-h2:      1.75rem;
  --t-h3:      1.25rem;
  --t-lead:    1.125rem;
  --t-sm:      0.9375rem;
  --t-xs:      0.8125rem;
}

/* ── base ───────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; background: var(--paper); scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.6;
  font-feature-settings: "cv05" 1;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--display); font-weight: 600; margin: 0; }
h1 { letter-spacing: -0.025em; }
h2 { letter-spacing: -0.02em; }
h3 { letter-spacing: -0.01em; }
p { margin: 0 0 1em; }
a { color: var(--accent-ink); text-underline-offset: 3px; text-decoration-thickness: 1px; }
a:hover { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
code, .mono, .num { font-family: var(--mono); font-variant-numeric: tabular-nums; }
code {
  font-size: 0.84em; background: var(--paper-2); color: var(--ink);
  padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere;
}
pre.code {
  font-family: var(--mono); font-size: var(--t-xs); line-height: 1.6;
  background: var(--paper-2); border: 1px solid var(--hairline); border-radius: 10px;
  padding: 14px 16px; overflow-x: auto; margin: 0 0 18px;
}
pre.code code { background: none; padding: 0; font-size: inherit; }
.num { font-variant-numeric: tabular-nums; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.sg-skip {
  position: absolute; inset-inline-start: -9999px; top: 0; z-index: 100;
  background: var(--surface); color: var(--ink); padding: 12px 18px;
  border: 1px solid var(--hairline); border-radius: 0 0 999px 0;
}
.sg-skip:focus { inset-inline-start: 0; }
.body-copy { color: var(--ink-2); max-inline-size: var(--measure); }
.sg-eyebrow {
  font-family: var(--mono); font-size: var(--t-xs); font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
  margin: 0 0 14px;
}

/* ── the header, and its pill morph ─────────────────────────────────────
   At rest a full-bleed bar owns the glass and the hairline. Past 24px of
   scroll the bar goes transparent and the INNER element becomes a floating
   pill that takes the blur, the border and the shadow with it. Nothing fades:
   it is one continuous geometric morph of a single element, so there is no
   moment where two pieces of chrome are both on screen.

   The threshold is a single scrollY > 24 with no hysteresis, applied by a
   class toggle inside requestAnimationFrame (see layout.ts). The header NEVER
   dissolves — search and navigation stay reachable at every scroll position
   and every width, which is the whole difference between a landing page and a
   page with a table on it. */
.sg-head {
  position: sticky; top: 0; z-index: 50;
  block-size: var(--chrome);
  background: color-mix(in oklab, var(--paper) 88%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  backdrop-filter: blur(18px) saturate(1.6);
  border-block-end: 1px solid var(--hairline);
  transition: background-color var(--dur-morph) var(--ease),
              border-color var(--dur-morph) var(--ease);
}
.sg-head-in {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  block-size: 100%; max-inline-size: 100%; margin-inline: auto;
  padding-inline: var(--gutter);
  border: 1px solid transparent; border-radius: 0;
  background: transparent; box-shadow: none; transform: translateY(0);
  transition: max-inline-size var(--dur-morph) var(--ease),
              transform var(--dur-morph) var(--ease),
              border-radius var(--dur-morph) var(--ease),
              box-shadow var(--dur-morph) var(--ease),
              border-color var(--dur-morph) var(--ease),
              padding var(--dur-morph) var(--ease),
              background-color var(--dur-morph) var(--ease);
}
.sg-head.is-floating {
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  border-block-end-color: transparent;
}
.sg-head.is-floating .sg-head-in {
  max-inline-size: min(1100px, 100% - 24px);
  border-radius: 999px;
  background: color-mix(in oklab, var(--surface) 92%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  backdrop-filter: blur(18px) saturate(1.6);
  border-color: var(--hairline);
  box-shadow: var(--shadow-pill);
  transform: translateY(10px);
  padding-inline: 18px;
}
/* The 44px floor applies here too. The shared block's nav-a rule cannot reach
   the wordmark — it is a sibling of the nav element, not inside it — and
   measured live it was 72x27 at 1440 and 20x20 at 390. */
.sg-mark {
  display: inline-flex; align-items: center; gap: 8px;
  min-block-size: 44px; min-inline-size: 44px; padding-inline-end: 4px;
  font-family: var(--display); font-weight: 600; font-size: 17px;
  letter-spacing: -0.02em; color: var(--ink); text-decoration: none;
  flex-shrink: 0;
}
.sg-mark svg { color: var(--accent); }
.sg-nav { display: flex; align-items: center; gap: 2px; min-inline-size: 0; }
.sg-nav a {
  padding: 6px 12px; border-radius: 999px; text-decoration: none;
  font-size: var(--t-sm); font-weight: 500; color: var(--ink-2);
  white-space: nowrap;
  transition: background-color var(--dur-quick) var(--ease), color var(--dur-quick) var(--ease);
}
.sg-nav a:hover { background: var(--paper-3); color: var(--ink); }
.sg-nav a.is-on { background: var(--accent-wash); color: var(--accent-ink); }
.sg-nav-icon { padding-inline: 10px; color: var(--ink-3); }

/* ── the numbered chapter rail (OpenAI's pattern) ───────────────────────── */
/* +22px, not the reference's +12: the header pill floats 10px below the bar,
   so its bottom edge sits at 73px. At +12 the rail's top landed 3px under the
   pill's long-throw shadow and the two chrome objects read as one crowded
   stack. The mask is the overflow affordance — on a phone the rail scrolls
   sideways, and a hard cut at the edge reads as clipping rather than as
   "there is more this way". */
.sg-rail {
  position: sticky; top: calc(var(--chrome) + 22px); z-index: 30;
  margin-block: 28px; max-inline-size: 100%;
  overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent 100%);
  mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent 100%);
}
.sg-rail::-webkit-scrollbar { display: none; }
/* 50px, not the reference's 48: the items inside it are held to the 44px tap
   floor, and 44 + 2x3px padding is 50. Shrinking the container to match the
   reference would mean shrinking the targets, which is the one thing this
   design does not copy from the four sites it learned from. */
.sg-rail-in {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 3px; min-block-size: 50px;
  background: color-mix(in oklab, var(--surface) 92%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  backdrop-filter: blur(18px) saturate(1.6);
  border: 1px solid var(--hairline); border-radius: 999px;
  box-shadow: var(--shadow-card);
}
.sg-rail a {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; min-block-size: 44px; border-radius: 999px;
  font-size: var(--t-sm); font-weight: 500; color: var(--ink-2);
  text-decoration: none; white-space: nowrap;
  transition: background-color var(--dur-quick) var(--ease), color var(--dur-quick) var(--ease);
}
.sg-rail a:hover { background: var(--paper-2); color: var(--ink); }
.sg-rail a[aria-current="true"] { background: var(--accent-wash); color: var(--accent-ink); }
.sg-rail-n {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.06em; color: var(--ink-3);
}
.sg-rail a[aria-current="true"] .sg-rail-n { color: var(--accent); }

/* ── page frame ─────────────────────────────────────────────────────────── */
main {
  display: block; max-inline-size: var(--maxw-wide); margin-inline: auto;
  padding: 0 var(--gutter) var(--section);
}
.sg-foot { border-block-start: 1px solid var(--hairline); background: var(--paper); }
.sg-foot-in {
  max-inline-size: var(--maxw-wide); margin-inline: auto;
  padding: 26px var(--gutter);
  display: flex; flex-wrap: wrap; gap: 8px 24px; justify-content: space-between;
  font-size: var(--t-xs); color: var(--ink-3);
}
.crumbs { padding-block: 24px 4px; font-size: var(--t-sm); }
.crumbs a { text-decoration: none; }
.page-head { padding-block: 56px 8px; }
.page-title {
  font-size: var(--t-h1); letter-spacing: -0.025em; color: var(--ink);
  margin: 0 0 14px;
}
.page-lede { font-size: var(--t-lead); color: var(--ink-2); max-inline-size: var(--measure); }

/* ── hero ───────────────────────────────────────────────────────────────── */
.sg-hero {
  display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(28px, 4vw, 64px); align-items: start;
  padding-block: 72px 64px;
}
.sg-hero-copy { min-inline-size: 0; }
.sg-display {
  font-family: var(--display); font-size: var(--t-display); font-weight: 600;
  line-height: 1.02; letter-spacing: -0.03em; color: var(--ink);
  margin: 0 0 20px; max-inline-size: 15ch;
}
.sg-display .hl { font-style: normal; color: var(--accent-ink); }
.sg-lede {
  font-size: var(--t-lead); color: var(--ink-2); max-inline-size: var(--measure);
  margin: 0 0 8px;
}
/* Spans the whole hero, under both columns. Held at one column per stat with
   a 150px floor because a wrapped date ("2026-09-" / "03") reads as a
   rendering fault, not as a line break. */
.sg-stats {
  grid-column: 1 / -1;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin-block-start: 40px;
  border-block-start: 1px solid var(--hairline);
}
.sg-stat {
  display: flex; flex-direction: column; gap: 4px;
  padding: 16px 18px 14px;
  border-inline-end: 1px solid var(--hairline-2);
}
.sg-stat:last-child { border-inline-end: 0; }
.sg-stat:first-child { padding-inline-start: 0; }
.sg-stat-label {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
}
.sg-stat-value {
  font-family: var(--display); font-size: clamp(22px, 2vw, 28px); font-weight: 600;
  letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ink);
  white-space: nowrap;
}
.sg-stat-note { font-size: var(--t-xs); color: var(--ink-3); }

/* The pipeline figure: authored, hairline, mono-labelled. Never a screenshot. */
.sg-pipe {
  margin: 0; padding: 22px; background: var(--surface);
  border: 1px solid var(--hairline); border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.sg-pipe-cap {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
  margin-block-end: 16px;
}
.sg-pipe-flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.sg-pipe-node {
  display: grid; grid-template-columns: 34px minmax(0, 1fr);
  gap: 4px 12px; align-items: baseline;
  padding: 14px 0; border-block-end: 1px solid var(--hairline-2);
  position: relative;
}
.sg-pipe-node:last-child { border-block-end: 0; padding-block-end: 0; }
.sg-pipe-node:first-child { padding-block-start: 0; }
.sg-pipe-n {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em;
  color: var(--accent); grid-row: span 2;
}
.sg-pipe-name {
  font-family: var(--mono); font-size: var(--t-sm); font-weight: 500;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink);
}
.sg-pipe-note { font-size: var(--t-xs); color: var(--ink-3); grid-column: 2; }

/* ── buttons ────────────────────────────────────────────────────────────── */
.btn, .btn-outline {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; padding: 10px 22px; border-radius: 999px;
  font-family: var(--body); font-size: var(--t-sm); font-weight: 500;
  text-decoration: none; cursor: pointer; border: 1px solid transparent;
  transition: background-color var(--dur-quick) var(--ease),
              border-color var(--dur-quick) var(--ease),
              color var(--dur-quick) var(--ease);
}
.btn { background: var(--ink); color: var(--paper); }
.btn:hover { background: var(--accent-ink); color: #fff; }
.btn[disabled] { opacity: 0.55; cursor: default; }
.btn-outline { background: var(--surface); color: var(--ink); border-color: var(--hairline); }
.btn-outline:hover { border-color: var(--accent); color: var(--accent-ink); }
.btn-row { display: flex; flex-wrap: wrap; gap: 10px; margin-block-start: 18px; }
.sg-cta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
  padding-block: 8px var(--section);
}
.sg-install {
  font-size: var(--t-sm); padding: 11px 18px; border-radius: 999px;
  background: var(--surface); border: 1px solid var(--hairline); color: var(--ink-2);
}

/* ── feature row ────────────────────────────────────────────────────────── */
.sg-features {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  border-block-start: 1px solid var(--hairline);
}
.sg-feature {
  padding: 30px 26px 30px 0; border-inline-end: 1px solid var(--hairline-2);
}
.sg-feature:last-child { border-inline-end: 0; }
.sg-feature-title { font-size: var(--t-h3); margin: 0 0 10px; }
.sg-feature-copy { font-size: var(--t-sm); color: var(--ink-2); }
.sg-arrow {
  display: inline-flex; align-items: center; min-block-size: 44px;
  font-size: var(--t-sm); font-weight: 500; text-decoration: none;
}
.sg-arrow:hover { text-decoration: underline; }

/* ── status marks: colour AND shape AND text, always all three ──────────── */
.mk { display: inline-block; vertical-align: -2px; flex-shrink: 0; }
.mk-pass { color: var(--pass); }
.mk-fail { color: var(--fail); }
.mk-gap { color: var(--degraded); }
.mk-unverified, .mk-info { color: var(--unknown); }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px;
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; white-space: nowrap;
}
.chip-pass { background: var(--pass-wash); color: var(--pass); }
.chip-fail { background: var(--fail-wash); color: var(--fail); }
.chip-gap { background: var(--degraded-wash); color: var(--degraded); }
.chip-unverified, .chip-info { background: var(--unknown-wash); color: var(--unknown); }
.cmark {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--mono); font-size: var(--t-xs); font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}
.cmark + .cmark { margin-inline-start: 10px; }
.sg-legend {
  display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center;
  padding: 12px 0; font-size: var(--t-xs); color: var(--ink-2);
}
.sg-legend .lg { display: inline-flex; align-items: center; gap: 6px; }

/* ── grades ─────────────────────────────────────────────────────────────── */
.grade {
  display: inline-flex; align-items: center; justify-content: center;
  min-inline-size: 38px; min-block-size: 26px; padding: 2px 10px;
  border-radius: 999px; border: 1px solid var(--hairline);
  font-family: var(--mono); font-size: var(--t-xs); font-weight: 500;
  background: var(--surface); color: var(--ink);
}
.grade-lg { min-inline-size: 62px; min-block-size: 40px; font-size: 20px; padding: 4px 16px; }
.gr-top { border-color: color-mix(in oklab, var(--pass) 45%, transparent); color: var(--pass); background: var(--pass-wash); }
.gr-mid { border-color: color-mix(in oklab, var(--degraded) 45%, transparent); color: var(--degraded); background: var(--degraded-wash); }
.gr-low { border-color: color-mix(in oklab, var(--fail) 45%, transparent); color: var(--fail); background: var(--fail-wash); }
.gr-na  { border-color: var(--hairline); color: var(--ink-3); background: var(--paper-2); }
.prov {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em;
  color: var(--degraded); font-style: normal;
}
.pill-row { display: flex; flex-wrap: wrap; gap: 10px; margin-block: 4px 18px; }
.grade-key { font-family: var(--mono); font-size: var(--t-xs); }

/* ── meters ─────────────────────────────────────────────────────────────── */
.meter {
  display: block; block-size: 4px; inline-size: 100%; max-inline-size: 92px;
  margin-block-start: 6px; background: var(--paper-3); border-radius: 999px;
  overflow: hidden;
}
.meter-fill { display: block; block-size: 100%; background: var(--ink-3); }
.meter-score .meter-fill { background: var(--accent); }
.meter-coverage .meter-fill { background: var(--ink-3); }
.meter-empty { opacity: 0.5; }

/* ── evidence-source chips ──────────────────────────────────────────────── */
.lane {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 999px;
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.05em; white-space: nowrap;
  border: 1px solid var(--hairline); background: var(--surface); color: var(--ink-2);
}
.lane-verified { border-color: color-mix(in oklab, var(--accent) 40%, transparent); background: var(--accent-wash); color: var(--accent-ink); }
.lane-unsigned { border-style: dashed; color: var(--ink-3); }
/* Weaker than the action lane, and drawn that way: no fill, dashed edge. */
.lane-local { border-style: dashed; border-color: var(--hairline); color: var(--ink-2); background: var(--paper-2); }
.lane-ext { color: var(--ink-3); background: var(--paper-2); }
.lane-overlay { border-style: dashed; color: var(--ink-3); }
.lane + .lane { margin-inline-start: 6px; }

/* ── directory: controls bar ────────────────────────────────────────────── */
.dir-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px;
  padding-block: 20px 16px;
}
.dir-search { flex: 1 1 280px; min-inline-size: 0; }
.dir-search input {
  inline-size: 100%; max-inline-size: 420px;
  min-block-size: 48px; padding: 12px 20px;
  border: 1px solid var(--hairline); border-radius: 999px;
  background: var(--surface); color: var(--ink);
  font-family: var(--mono); font-size: 16px;
}
.dir-search input::placeholder { color: var(--ink-3); }
.dir-controls {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px;
  font-size: var(--t-xs); color: var(--ink-3);
}
.dir-controls-label {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--ink-3);
}
.dir-controls select {
  min-block-size: 44px; padding: 8px 14px; border-radius: 999px;
  border: 1px solid var(--hairline); background: var(--surface); color: var(--ink);
  font-family: var(--body); font-size: 16px;
}
.dir-check { display: inline-flex; align-items: center; gap: 8px; font-size: var(--t-xs); color: var(--ink-2); }
.dir-count { font-family: var(--mono); font-size: var(--t-xs); color: var(--ink-3); }
.scan-card {
  margin-block-end: 18px; padding: 18px 20px;
  background: var(--surface); border: 1px solid var(--accent);
  border-radius: 12px; max-inline-size: 620px;
}
.scan-copy { font-size: var(--t-sm); color: var(--ink-2); margin: 0 0 12px; }
.scan-status { font-family: var(--mono); font-size: var(--t-xs); color: var(--ink-2); margin: 10px 0 0; }
.dir-scan { margin-block-start: 14px; }

/* ── directory: the hairline table ──────────────────────────────────────── */
/* overflow:clip, NOT overflow:hidden. Measured live at 1440: with hidden the
   wrapper becomes the sticky containing block, so the sticky thead sticks to a
   box that never scrolls — at scrollY 900 the header row's top read -382, i.e.
   it had scrolled off with the page while still claiming to be sticky. clip
   trims the rounded corners without creating a scroll container, so the header
   resolves against the viewport and actually stays put. */
.table-wrap {
  background: var(--surface); border: 1px solid var(--hairline);
  border-radius: 12px; overflow: clip;
}
table.directory {
  inline-size: 100%; border-collapse: collapse;
  font-size: var(--t-sm); font-variant-numeric: tabular-nums;
}
.directory thead th {
  position: sticky; top: calc(var(--chrome) + 22px); z-index: 20;
  background: var(--surface);
  border-block-end: 1px solid var(--hairline);
  padding: 12px 16px; text-align: start;
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
  white-space: nowrap;
}
.directory tbody tr {
  border-block-end: 1px solid var(--hairline-2);
  transition: background-color var(--dur-quick) var(--ease);
}
.directory tbody tr:last-child { border-block-end: 0; }
/* Zebra, because at fifty rows hairlines alone stop the eye tracking. */
.directory tbody tr:nth-child(even) { background: var(--paper-2); }
/* Tint only. No lift, no shadow, no scale: a row that moves is a row you
   lose your place in. */
.directory tbody tr:hover { background: var(--paper-3); }
.directory td { padding: 12px 16px; vertical-align: top; }
.directory .c-num, .directory .c-date { text-align: start; white-space: nowrap; }
.directory th.c-repo { inline-size: 40%; }
.row-link {
  display: inline-flex; align-items: center; min-block-size: 32px;
  font-family: var(--mono); font-size: var(--t-sm); text-decoration: none;
  overflow-wrap: anywhere;
}
.row-owner { color: var(--ink-3); }
.row-name { color: var(--ink); font-weight: 500; }
.row-link:hover .row-name { color: var(--accent-ink); text-decoration: underline; }
.row-desc {
  display: block; margin-block-start: 4px;
  font-size: var(--t-xs); color: var(--ink-3); line-height: 1.5;
  max-inline-size: 52ch;
}
.row-desc-none { font-style: italic; }
.rn {
  margin: 8px 0 0; padding-inline-start: 10px;
  border-inline-start: 2px solid var(--hairline);
  font-size: var(--t-xs); line-height: 1.55; color: var(--ink-2);
  max-inline-size: 60ch;
}
.rn code { font-size: 0.95em; }
.rn-warn { border-inline-start-color: var(--degraded); }
.rn-caveat { border-inline-start-color: var(--degraded); color: var(--ink-3); }
.rn-conflict { border-inline-start-color: var(--fail); }
.c-marks { white-space: nowrap; }

/* ── repo detail ────────────────────────────────────────────────────────── */
.repo-head {
  display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between;
  gap: 16px 24px; padding-block: 12px 20px;
  border-block-end: 1px solid var(--hairline);
}
.repo-head-main { min-inline-size: 0; }
.repo-title {
  font-family: var(--mono); font-size: clamp(1.5rem, 3.4vw, 2.25rem); font-weight: 500;
  letter-spacing: -0.02em; overflow-wrap: anywhere; margin: 0 0 10px;
}
.repo-meta { font-size: var(--t-xs); color: var(--ink-3); line-height: 1.9; margin: 0; }
.repo-head-grade { display: flex; align-items: center; gap: 10px; }
.scoreboard {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  border-block-end: 1px solid var(--hairline);
}
.sb-cell {
  display: flex; flex-direction: column; gap: 4px;
  padding: 22px 22px 20px; border-inline-end: 1px solid var(--hairline-2);
}
.sb-cell:first-child { padding-inline-start: 0; }
.sb-cell:last-child { border-inline-end: 0; }
.sb-label {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
}
.sb-value {
  font-family: var(--display); font-size: 32px; font-weight: 600;
  letter-spacing: -0.025em; font-variant-numeric: tabular-nums;
}
.sb-tally { display: flex; flex-wrap: wrap; gap: 10px; padding-block: 6px; }
.sb-tally .cmark + .cmark { margin-inline-start: 0; }
.sb-note { font-size: var(--t-xs); color: var(--ink-3); line-height: 1.5; }
.sb-cell .meter { max-inline-size: 140px; }
.section-title { font-size: var(--t-h2); margin: 0 0 10px; }
.controls-section { padding-block-start: 8px; }
.terms-note {
  font-size: var(--t-xs); color: var(--ink-3); line-height: 1.6;
  max-inline-size: 70ch; margin-block: 24px 0;
}

/* Control families: nested containers, hairlines inside. */
.family {
  background: var(--surface); border: 1px solid var(--hairline);
  border-radius: 12px; padding: 18px 20px; margin-block-end: 16px;
}
/* Tinted ONLY when the whole family is failing. Tint everything and nothing
   reads. */
.family-failing { border-color: color-mix(in oklab, var(--fail) 40%, transparent); background: color-mix(in oklab, var(--fail-wash) 55%, var(--surface)); }
.family-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
}
.family-title { font-size: var(--t-h3); }
.family-count {
  font-family: var(--mono); font-size: var(--t-xs); font-weight: 500;
  letter-spacing: 0.06em; color: var(--ink-2);
  padding: 3px 10px; border-radius: 999px; background: var(--paper-2);
  white-space: nowrap;
}
.family-meta {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em;
  color: var(--ink-3); margin: 6px 0 4px;
}
.ctl-list { list-style: none; margin: 0; padding: 0; }
.ctl {
  display: grid; grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 6px 12px; align-items: start;
  padding: 12px 0; border-block-end: 1px solid var(--hairline-2);
}
.ctl:last-child { border-block-end: 0; padding-block-end: 0; }
.ctl-mk { padding-block-start: 1px; }
.ctl-body { min-inline-size: 0; }
.ctl-id { display: block; font-size: var(--t-sm); }
.ctl-id code { background: none; padding: 0; font-size: var(--t-sm); color: var(--ink); }
.ctl-oos, .ctl-raw {
  display: inline-block; margin-inline-start: 8px;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ink-3);
  border: 1px solid var(--hairline); border-radius: 999px; padding: 1px 7px;
}
.ctl-reason { font-size: var(--t-xs); color: var(--ink-2); margin: 4px 0 0; line-height: 1.5; }
.ctl-evidence { margin-block-start: 6px; font-size: var(--t-xs); color: var(--ink-2); }
.ctl-evidence summary {
  cursor: pointer; font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3);
}
.ctl-evidence ul {
  margin: 8px 0 0; padding: 10px 12px; list-style: none;
  background: var(--paper-2); border-radius: 8px;
  font-family: var(--mono); font-size: var(--t-xs); line-height: 1.6;
  overflow-wrap: anywhere;
}
.ctl-out { opacity: 0.72; }

/* ── panels ─────────────────────────────────────────────────────────────── */
.panel {
  background: var(--surface); border: 1px solid var(--hairline);
  border-radius: 12px; padding: clamp(18px, 3vw, 26px);
  margin-block: 22px;
}
.panel-title { font-size: var(--t-h3); margin: 0 0 12px; }
.panel-lead { margin-block-start: 8px; }
.panel-act { border-color: color-mix(in oklab, var(--accent) 30%, transparent); }
.panel-lane { background: var(--paper-2); }
.panel-flag { border-inline-start: 3px solid var(--fail); }

/* ── methodology ────────────────────────────────────────────────────────── */
.method-section { padding-block: 10px 26px; scroll-margin-block-start: calc(var(--chrome) + 72px); }
.method-section h2 { font-size: var(--t-h2); margin: 26px 0 12px; }
.method-section h3 { font-size: var(--t-h3); margin: 22px 0 10px; }
.prose p, .prose li { color: var(--ink-2); max-inline-size: var(--measure); }
.prose ol, .prose ul { padding-inline-start: 20px; }
.prose li { margin-block-end: 8px; }
.method-table {
  inline-size: 100%; border-collapse: collapse; font-size: var(--t-sm);
  background: var(--surface);
}
.method-table th, .method-table td {
  padding: 10px 14px; text-align: start; vertical-align: top;
  border-block-end: 1px solid var(--hairline-2);
}
.method-table thead th {
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
  border-block-end: 1px solid var(--hairline); white-space: nowrap;
}
.method-table tbody tr:nth-child(even) { background: var(--paper-2); }
.table-scroll {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  border: 1px solid var(--hairline); border-radius: 12px; margin-block-end: 18px;
}
.cmp-mark {
  display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; white-space: nowrap;
  border: 1px solid var(--hairline); background: var(--paper-2); color: var(--ink-2);
}
.cmp-covered { background: var(--accent-wash); color: var(--accent-ink); border-color: color-mix(in oklab, var(--accent) 35%, transparent); }
.cmp-partial { background: var(--paper-3); }
.cmp-none { color: var(--ink-3); border-style: dashed; }
.cmp-risk { font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
.cmp-note { font-size: var(--t-xs); color: var(--ink-3); margin-block-start: 6px; }
.cmp-footnote { font-size: var(--t-xs); color: var(--ink-3); }

/* ── the design switcher (styled here; markup comes from the build) ──────
   It is position:fixed, so mid-page it sits over whatever is at the bottom of
   the viewport. Bottom-RIGHT, because the reading column and the directory's
   repository names are on the left — measured at 1440 the bottom-left position
   covered the first column of the table. The shared block reserves its
   measured height at the end of the document, which is the only place the
   clearance can be reserved. */
.design-switcher {
  position: fixed; inset-inline-end: 12px; inset-block-end: 10px; z-index: 45;
  display: flex; align-items: center; gap: 2px; flex-wrap: wrap;
  padding: 5px 8px; border-radius: 999px;
  background: color-mix(in oklab, var(--surface) 92%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  backdrop-filter: blur(18px) saturate(1.6);
  border: 1px solid var(--hairline); box-shadow: var(--shadow-pill);
}
.design-switcher .ds-label {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ink-3); padding-inline: 6px;
}
.design-switcher a {
  display: inline-flex; align-items: center;
  padding: 4px 10px; border-radius: 999px; text-decoration: none;
  font-size: var(--t-xs); font-weight: 500; color: var(--ink-2);
}
.design-switcher a:hover { background: var(--paper-2); color: var(--ink); }
.design-switcher a[aria-current="true"] { background: var(--accent-wash); color: var(--accent-ink); }

/* ── responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 1000px) {
  .sg-hero { grid-template-columns: minmax(0, 1fr); padding-block: 48px 40px; }
  .sg-feature { padding-inline-end: 20px; }
}
@media (max-width: 767px) {
  .page-head { padding-block-start: 36px; }
  .sg-stat:first-child { padding-inline-start: 18px; }
  .sg-stat { border-inline-end: 0; border-block-end: 1px solid var(--hairline-2); padding-inline-start: 0; }
  .sg-feature { padding: 22px 0; border-inline-end: 0; border-block-end: 1px solid var(--hairline-2); }
  .sb-cell { padding-inline: 0; border-inline-end: 0; border-block-end: 1px solid var(--hairline-2); }
  .repo-head { flex-direction: column; }

  /* The table becomes a card list, with the rules intact. filter.js toggles
     the row's INLINE display, and "" restores whatever is set here — so the
     same rows are a table at 1440 and cards at 390 with no second code path. */
  .table-wrap { border: 0; border-radius: 0; background: none; overflow: visible; }
  table.directory, .directory tbody, .directory td { display: block; inline-size: 100%; }
  .directory thead { display: none; }
  .directory tbody tr {
    display: flex; flex-direction: column;
    background: var(--surface); border: 1px solid var(--hairline);
    border-radius: 12px; padding: 14px 16px; margin-block-end: 12px;
  }
  .directory tbody tr:nth-child(even) { background: var(--surface); }
  .directory tbody tr:hover { background: var(--surface); }
  .directory td { padding: 5px 0; border: 0; }
  /* Status first, name second: on a phone people scan for what is wrong. */
  .directory .c-marks { order: 1; padding-block-end: 8px; }
  .directory .c-repo { order: 2; }
  .directory .c-grade { order: 3; }
  .directory .c-num { order: 4; }
  .directory .c-lane { order: 5; }
  .directory .c-date { order: 6; }
  .directory .c-grade::before,
  .directory .c-num::before,
  .directory .c-lane::before,
  .directory .c-date::before {
    content: attr(data-label) " ";
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--ink-3);
    display: inline-block; min-inline-size: 74px;
  }
  .directory .c-num .meter { display: inline-block; vertical-align: middle; margin: 0 0 0 10px; max-inline-size: 70px; }
  .row-desc { max-inline-size: none; }
}
@media (max-width: 560px) {
  /* The pill condenses; it never leaves and it never becomes a hamburger.
     What goes is the one link the brief does not call persistent — "Action" —
     so the wordmark, Directory, Methodology and GitHub all stay reachable at
     every scroll position and every width. */
  .sg-nav a { padding-inline: 9px; font-size: var(--t-xs); }
  .sg-nav-ext { display: none; }
  .sg-mark { font-size: 15px; gap: 6px; }
  .design-switcher { inset-inline: 10px 10px; max-inline-size: calc(100vw - 20px); }
  .sg-head.is-floating .sg-head-in { padding-inline: 12px; }
}
`;

/**
 * Rules that must win over `shared-css.ts`, which is concatenated after the
 * block above so its accessibility floors (the 16px form-control minimum, the
 * 44px tap targets, the measured switcher clearance) cannot be undone by a
 * design. These are presentation-only overrides of the shared components'
 * default look — never of a floor.
 */
export const CSS_AFTER = `
/* ── Signal's skin for the shared components ────────────────────────────── */
.hp-search { margin-block: 18px 6px; }
.hp-search-input {
  max-inline-size: 460px; border-width: 1px; border-radius: 999px;
  padding: 14px 22px; min-block-size: 52px; border-color: var(--hairline);
}
.hp-search-input:focus-visible { border-color: var(--accent); }
.hp-search-label {
  font-family: var(--mono); letter-spacing: 0.08em; color: var(--ink-3);
  align-items: center; min-block-size: 0; padding-block-end: 8px;
}
.hp-chip { border-width: 1px; border-radius: 999px; font-size: var(--t-xs); }
.hp-chip:hover { border-color: var(--accent); color: var(--accent-ink); }
.hp-chips-label { letter-spacing: 0.08em; }
.dir-found {
  border-width: 1px; border-color: var(--accent); border-radius: 12px;
  max-inline-size: 460px;
}
.dir-scan {
  padding: 16px 18px; background: var(--surface);
  border: 1px solid var(--accent); border-radius: 12px; max-inline-size: 460px;
}
.dir-scan-copy { font-size: var(--t-sm); color: var(--ink-2); margin: 0 0 12px; }
.dir-scan-status { font-family: var(--mono); font-size: var(--t-xs); margin: 10px 0 0; }
.hp-panels { padding-block: var(--section) 0; gap: clamp(36px, 5vw, 56px); }
.hp-panel-eyebrow {
  font-family: var(--mono); letter-spacing: 0.08em; color: var(--ink-3);
  font-size: var(--t-xs);
}
.hp-panel-title { font-family: var(--display); letter-spacing: -0.02em; color: var(--ink); }
.hp-panel-line { color: var(--ink-2); }
.hp-card {
  border-width: 1px; border-radius: 12px; border-color: var(--hairline);
  box-shadow: none; background: var(--surface);
  transition: border-color var(--dur-quick) var(--ease), background-color var(--dur-quick) var(--ease);
}
.hp-card:hover { border-color: var(--accent); background: var(--paper-2); }
.hp-grade { border-radius: 999px; font-family: var(--mono); font-weight: 500; }
.hp-card-name { font-family: var(--mono); font-weight: 500; }
.hp-waiting { border-width: 1px; border-radius: 12px; border-color: var(--hairline); }
.hp-unans-track { block-size: 4px; border-radius: 999px; overflow: hidden; background: var(--paper-3); }
.hp-unans-fill { background: var(--ink-3); }
.tx-strip { border-block-start-width: 1px; border-block-start-color: var(--hairline); padding-block: var(--section) 0; }
.tx-chip { border-width: 1px; border-radius: 999px; border-color: var(--hairline); }
.tx-chip:hover { border-color: var(--accent); color: var(--accent-ink); }
.tx-chip-id { font-family: var(--mono); font-weight: 500; color: var(--accent); }
.tx-class {
  border-inline-start-width: 2px; border-inline-start-color: var(--hairline);
  border-radius: 0 12px 12px 0; background: var(--surface);
  scroll-margin-block-start: calc(var(--chrome) + 72px);
}
.tx-class-title { font-family: var(--display); letter-spacing: -0.01em; }
.tx-details summary {
  cursor: pointer; font-family: var(--mono); font-size: 11px;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3);
}
.tx-reported { border-radius: 999px; }
.exposure {
  border-width: 1px; border-radius: 12px; border-color: var(--hairline);
  scroll-margin-block-start: calc(var(--chrome) + 72px);
}
.nudge-title { font-family: var(--display); font-size: var(--t-h3); font-weight: 600; margin: 0 0 10px; }
.ex-row { border-inline-start-width: 2px; }
.ex-name { font-family: var(--body); }
.ex-state { font-family: var(--mono); letter-spacing: 0.08em; }
.key-note { color: var(--ink-2); }
.term { font-weight: 600; }
.term-def { color: var(--ink-3); }
#every-check, #threats, #threat-posture, #local, #honesty, #controls, #provenance,
#improve, #protocol, #evidence-classes, #formula, #grades, #changelog, #trust,
#vs-scorecard { scroll-margin-block-start: calc(var(--chrome) + 72px); }
`;
