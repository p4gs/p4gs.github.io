/**
 * Bulletin — complete stylesheet. A Swiss/brutalist poster grid, committed to
 * ONE light theme: warm off-white paper, near-black ink, and a single hot
 * accent used only where state matters (a fail, the active nav item, one CTA).
 *
 * The rules of the register, all of them load-bearing:
 *   - hard 2px rules instead of cards. No drop shadows anywhere, no rounded
 *     corners (`--hp-radius` is `0` and every local border-radius is absent).
 *   - the numbers that matter are set at poster scale in a heavy grotesk.
 *     A grade, a percentage and a control count are the content; everything
 *     else is apparatus.
 *   - tables are set like a broadsheet: ruled, dense, strong column heads.
 *   - a strict 12-column grid on desktop that collapses to ONE column on a
 *     phone. Nothing half-collapses into a two-up that then overflows.
 *
 * MOBILE IS A CORRECTNESS TARGET, NOT A COURTESY. Below 760px EVERY table
 * restacks — the directory, the control sheet, and the methodology's shared
 * tables too. The first two print the `data-label` each cell carries; the
 * shared ones (the Scorecard comparison and the every-check index, whose
 * markup five designs render and none of them owns) are labelled by column
 * POSITION instead, and told apart by the `data-coverage` attribute the
 * four-column comparison puts on its rows. Keeping those two in a scroller was
 * measured and rejected: a 747px table in a 354px box hid the sscsb-mapping
 * column, which is the only reason that table exists, and cut questions
 * mid-word. The only horizontal scrollers left are the two sticky NAV strips
 * (the methodology index, the jump-to-phase bar), and both carry the edge
 * shadow that says so.
 */
export const CSS = `/* Bulletin — Swiss/brutalist broadsheet (single light theme). */

/* ---------- tokens ---------- */
:root {
  /* Ink on paper. Two paper values only: the ground, and the panel it sits on. */
  --paper: #EFEBE3;
  --paper-2: #F8F5EE;
  --ink: #141210;
  --ink-2: #38332C;
  --ink-3: #6E675C;
  --rule: #141210;
  --hair: #C7BFB0;
  /* The ONE hot accent. 4.9:1 on paper, 5.9:1 under white — safe as text and
     as a fill. --rust is a darker tint of the same hue, never a second hue. */
  --hot: #C02A12;
  --hot-wash: #F6E3DC;
  /* Sampled from the captures, #8A4418 sat at hue 24° beside the accent's 8°
     and read as a second colour — brown — which is exactly what the line above
     forbids. This is the accent darkened toward the ink, same hue family. */
  --rust: #8F200C;
  --hatch: repeating-linear-gradient(45deg, #141210 0 2px, #EFEBE3 2px 5px);

  --display: "Anton", "Haettenschweiler", "Arial Narrow Bold", Impact, "Franklin Gothic Bold", sans-serif;
  --sans: "Source Sans 3", "Source Sans Pro", Seravek, "Segoe UI", Tahoma, Verdana, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;

  /* Type scale — a fifth-based ramp, not a pile of one-off sizes. */
  --t--3: 0.6875rem;
  --t--2: 0.8125rem;
  --t--1: 0.9375rem;
  --t-0: 1rem;
  --t-1: 1.125rem;
  --t-2: 1.375rem;
  --t-3: 1.75rem;
  --banner: clamp(2.4rem, 1.1rem + 6.1vw, 5.25rem);
  --banner-sm: clamp(1.8rem, 1.1rem + 3.2vw, 3rem);
  --fig: clamp(2.75rem, 1.5rem + 5.4vw, 4.75rem);

  /* Spacing — a 4px grid, named, used everywhere. */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 72px;
  --gut: clamp(16px, 2.4vw, 30px);
  --pad: clamp(16px, 3vw, 40px);
  --wrap: 1240px;
}

/* ---------- ground ---------- */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--sans);
  font-size: var(--t-0);
  line-height: 1.55;
  color: var(--ink);
  background-color: var(--paper);
  /* Paper, not a flat fill: a very faint ruled grain at the page's own gutter
     rhythm. It reads as newsprint stock, and it is the only texture here. */
  background-image: repeating-linear-gradient(
    to bottom, rgba(20, 18, 16, 0.028) 0 1px, transparent 1px 4px);
}
a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
a:hover { color: var(--hot); text-decoration-thickness: 2px; }

/* TOUCH TARGETS IN RUNNING PROSE. Vertical padding on an INLINE box grows the
   hit rectangle without moving a single line of type — the line box is sized
   by line-height, not by an inline element's padding — so a 22px link becomes
   a 46px target and the broadsheet measure is untouched. Measured at 390px:
   every one of these was 17-25px before. Block-level links get a real
   min-block-size instead, further down. */
.standfirst a, .key-note a, .body-copy a, .hero-count a, .slab-line a,
.cov-note a, .scan-copy a, .transparency-note a, .score-line a,
.prose p a, .prose li a, .reason a, .ex-line a, .ex-detail a, .ex-foot a,
.tx-class-line a, .tx-class-controls a, .tx-defs a, .hp-panel-line a,
.cmp-note a, .cmp-footnote a, .honesty-body a { padding-block: 13px; }
/* The 11px mono lines (the slab footnote, the repo meta rule) start at 17px,
   so they need the deeper pad to clear 44. */
.slab-foot a, .repo-meta a, .hp-unans-foot a, .tx-lineage a,
.tx-sourcing a, .hp-card-note a { padding-block: 14px; }
/* A definition is italic, never bold: directoryTermsNote wraps one of the
   five in a <strong>, which made that one definition render bold-italic while
   its four siblings were regular. Stated here so the odd one out matches. */
.term-def { font-weight: 400; }
:focus-visible { outline: 3px solid var(--hot); outline-offset: 2px; }
::selection { background: var(--hot); color: #fff; }
code { font-family: var(--mono); font-size: 0.9em; }
.mono { font-family: var(--mono); }
h1, h2, h3, h4 { margin: 0; }
p { margin: 0; }

.skip-link {
  position: absolute; inset-block-start: -60px; inset-inline-start: var(--sp-3);
  z-index: 100; background: var(--ink); color: var(--paper-2);
  font-family: var(--mono); font-size: var(--t--2); padding: 10px 14px;
  text-decoration: none;
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.skip-link:focus { inset-block-start: var(--sp-3); color: var(--paper-2); }

/* Anchors clear the sticky strips (the methodology index on a phone, the
   jump-to-phase bar on the repo sheet); :where() keeps the specificity at zero
   so nothing has to fight it. */
:where(main [id], main tr[id]) { scroll-margin-block-start: 68px; }

main {
  max-inline-size: var(--wrap);
  margin: 0 auto;
  padding-inline: var(--pad);
  padding-block-end: var(--sp-8);
}

/* ---------- masthead ---------- */
.masthead { border-block-end: 2px solid var(--rule); background: var(--paper); }
.mast-in {
  max-inline-size: var(--wrap); margin: 0 auto;
  padding: var(--sp-4) var(--pad) 0;
  display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--sp-1) var(--sp-5);
}
.wordmark { text-decoration: none; color: var(--ink); }
.wordmark:hover { color: var(--hot); }
.wm-mark {
  font-family: var(--display); font-size: clamp(26px, 3.4vw, 40px);
  line-height: 1; letter-spacing: 0.015em; text-transform: uppercase;
}
.mast-strap {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--ink-3);
}
.mast-edition {
  margin-inline-start: auto; font-family: var(--mono); font-size: var(--t--3);
  color: var(--ink-3); display: flex; gap: var(--sp-2); align-items: baseline;
}
.ed-k { text-transform: uppercase; letter-spacing: 0.14em; }
.ed-v { color: var(--ink); }

.topnav {
  flex: 1 0 100%; display: flex; flex-wrap: wrap; gap: 0 clamp(14px, 2.6vw, 34px);
  margin-block-start: var(--sp-3); border-block-start: 1px solid var(--hair);
}
.topnav a {
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--ink-2); text-decoration: none;
  display: inline-flex; align-items: center; min-block-size: 44px;
  border-block-end: 3px solid transparent; margin-block-end: -1px;
}
.topnav a:hover { color: var(--hot); }
.topnav a.active { color: var(--hot); border-block-end-color: var(--hot); }

/* ---------- colophon ---------- */
.colophon { border-block-start: 2px solid var(--rule); background: var(--paper); }
.colophon-in {
  max-inline-size: var(--wrap); margin: 0 auto; padding: var(--sp-5) var(--pad);
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--sp-3);
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
}
.col-domain { color: var(--ink); }
/* The repo sheet runs to 20,000px and the methodology to 27,000px. Neither had
   any way back up but a scroll. */
.col-top {
  display: inline-flex; align-items: center; min-block-size: 44px;
  text-transform: uppercase; letter-spacing: 0.12em; text-decoration: none;
  border-block-end: 2px solid var(--ink); color: var(--ink);
}
.col-top:hover { color: var(--hot); border-block-end-color: var(--hot); }

/* ---------- poster grid ---------- */
.poster {
  display: grid; grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gut); padding-block: var(--sp-7) var(--sp-7);
  border-block-end: 2px solid var(--rule);
}
.poster-lead { grid-column: 1 / 8; min-inline-size: 0; }
.poster-slab {
  grid-column: 8 / 13; min-inline-size: 0;
  border-inline-start: 2px solid var(--rule); padding-inline-start: var(--gut);
}

/* Kickers are INK, not accent. The register allows exactly one hot colour and
   spends it on state — a fail, the active nav item, the one call to action. A
   section label is structure; the 2px rule under it is what makes it read. */
.kicker {
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.18em; color: var(--ink);
  padding-block-end: var(--sp-2); border-block-end: 2px solid var(--rule);
  margin-block-end: var(--sp-4);
}
.banner {
  font-family: var(--display); font-weight: 400; text-transform: uppercase;
  font-size: var(--banner); line-height: 0.92; letter-spacing: 0.005em;
  color: var(--ink);
}
/* The poster's one sentence. A hard <br> set it as a two-word second line at
   desk width and orphaned "PASS." on a phone; a measure plus balancing lets
   the line break where the clause breaks, at every width. */
.poster-lead .banner { max-inline-size: 13ch; text-wrap: balance; }
.banner-sm { font-size: var(--banner-sm); line-height: 0.98; }
.standfirst {
  font-size: var(--t-1); line-height: 1.5; color: var(--ink-2);
  max-inline-size: 48ch; margin-block-start: var(--sp-4);
}
.hero-count {
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
  margin-block-start: var(--sp-4);
}

/* the score slab — the one thing a reader remembers */
.slab-kicker {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--ink-3); margin-block-end: var(--sp-2);
}
.slab-head { display: flex; align-items: flex-end; gap: var(--sp-3); flex-wrap: wrap; }
.slab-repo {
  font-family: var(--mono); font-size: var(--t--1); font-weight: 500;
  overflow-wrap: anywhere; display: inline-flex; align-items: center;
  min-block-size: 44px;
}
.slab-nums {
  display: flex; flex-wrap: wrap; gap: var(--sp-5); margin: var(--sp-4) 0 var(--sp-4);
  padding-block: var(--sp-3); border-block: 2px solid var(--rule);
}
.slab-nums div { min-inline-size: 0; }
.slab-nums dt {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.14em; color: var(--ink-3);
}
.slab-nums dd {
  margin: 0; font-family: var(--display); font-size: clamp(1.9rem, 1.2rem + 2.4vw, 3rem);
  line-height: 1; font-variant-numeric: tabular-nums;
}
.slab-line, .slab-foot {
  font-size: var(--t--2); color: var(--ink-2); margin-block-start: var(--sp-4);
  line-height: 1.5;
}

/* ---------- figure band ---------- */
.figband {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0;
  border-block-end: 2px solid var(--rule);
}
.fig { padding: var(--sp-5) var(--gut) var(--sp-5) 0; min-inline-size: 0; }
.figband .fig + .fig { border-inline-start: 1px solid var(--hair); padding-inline-start: var(--gut); }
.fig-num {
  font-family: var(--display); font-size: var(--fig); line-height: 0.85;
  letter-spacing: 0.005em; font-variant-numeric: tabular-nums; color: var(--ink);
}
.fig-hot .fig-num { color: var(--hot); }
.fig-cap {
  font-size: var(--t--1); color: var(--ink-2); margin-block-start: var(--sp-3);
  max-inline-size: 26ch; line-height: 1.4;
}

/* ---------- home: the three lanes ---------- */
.lanes { padding-block: var(--sp-7); border-block-start: 2px solid var(--rule); }
.section-head {
  font-family: var(--display); font-size: clamp(1.6rem, 1rem + 2.4vw, 2.5rem);
  text-transform: uppercase; line-height: 1; letter-spacing: 0.01em;
  margin-block-end: var(--sp-5);
}
.lane-cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gut); }
.lane-col { border-block-start: 2px solid var(--rule); padding-block-start: var(--sp-3); min-inline-size: 0; }
.lane-num {
  font-family: var(--display); font-size: clamp(1.6rem, 1rem + 1.6vw, 2.25rem);
  line-height: 1; color: var(--ink-3);
}
.lane-col h3 {
  font-family: var(--sans); font-size: var(--t-2); font-weight: 700;
  margin-block: var(--sp-2) var(--sp-2); letter-spacing: -0.01em;
}
.rule-link {
  display: inline-flex; align-items: center; min-block-size: 44px;
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.1em; text-decoration: none; color: var(--ink);
  border-block-end: 2px solid var(--ink); margin-block-start: var(--sp-3);
}
.rule-link:hover { color: var(--hot); border-block-end-color: var(--hot); }
.rule-link-hot { color: var(--hot); border-block-end-color: var(--hot); }
.rule-link-hot:hover { background: var(--hot); color: #fff; padding-inline: var(--sp-2); }

.body-copy { color: var(--ink-2); max-inline-size: 62ch; line-height: 1.55; }
.body-copy strong { color: var(--ink); }

/* ---------- page head (directory, methodology) ---------- */
.pagehead { padding-block: var(--sp-7) var(--sp-5); border-block-end: 2px solid var(--rule); }
.mv { font-family: var(--mono); font-size: 0.42em; color: var(--ink-3); vertical-align: middle; }

/* ---------- grade slab ---------- */
.grade-slab {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--display); line-height: 1; letter-spacing: 0.01em;
  border: 2px solid currentColor; background: var(--paper-2);
}
.gs-sm { min-inline-size: 44px; block-size: 44px; padding: 0 var(--sp-2); font-size: 1.3rem; }
.gs-md { min-inline-size: 54px; block-size: 54px; padding: 0 var(--sp-3); font-size: 1.75rem; }
.gs-xl {
  min-inline-size: clamp(74px, 12vw, 118px); block-size: clamp(74px, 12vw, 118px);
  padding: 0 var(--sp-3); font-size: clamp(2.4rem, 1.2rem + 4.4vw, 4.25rem);
}
.gr-ink { color: var(--ink); }
.gr-rust { color: var(--rust); }
.gr-hot { color: var(--hot); background: var(--hot-wash); }
.gr-quiet { color: var(--ink-3); border-style: dashed; }
.prov-tag {
  display: inline-flex; align-items: center; font-family: var(--mono);
  font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--rust); border: 1px solid var(--rust); padding: 2px 6px;
  margin-inline-start: var(--sp-2); vertical-align: middle;
}
.prov-flag { font-style: normal; color: var(--rust); font-weight: 600; }

/* ---------- phase rules ---------- */
.prules { display: grid; gap: var(--sp-2); }
/* The percent column is minmax(5.5ch, auto), not a fixed 5.5ch. A phase with
   nothing answered reads "no evidence" rather than 0%, and that label does not
   fit 5.5ch: measured at a 390px viewport it pushed a nowrap span 29px past its
   track, which walked up through .prules → .poster-slab → main and made the
   whole document 403px wide on a 390px screen. Sizing the track to its content
   costs one slightly shorter bar on the one row that has no bar to draw. */
.prule {
  display: grid;
  grid-template-columns: minmax(90px, 11ch) minmax(0, 1fr) minmax(5.5ch, auto);
  align-items: center; gap: var(--sp-3);
}
.pr-name { font-family: var(--mono); font-size: var(--t--3); color: var(--ink-2); overflow-wrap: anywhere; }
.pr-bar, .cp-bar {
  display: flex; block-size: 10px; background: var(--paper-2);
  border: 1px solid var(--rule); overflow: hidden;
}
.seg { display: block; block-size: 100%; }
.seg-pass { background: var(--ink); }
.seg-fail { background: var(--hot); }
.seg-unv { background: var(--hatch); }
.pr-pct, .cp-pct {
  font-family: var(--mono); font-size: var(--t--3); font-variant-numeric: tabular-nums;
  text-align: end; color: var(--ink-2); white-space: nowrap;
}
.pr-pct.pct-low, .cp-pct.pct-low { color: var(--rust); }
.pr-pct.pct-none, .cp-pct.pct-none { color: var(--ink-3); }
/* No controls in scope: the bar becomes a dashed baseline carrying "n/a",
   rather than a 10px box that clips the label it was asked to hold. */
.pr-bar-none, .cp-bar-none {
  border: none; background: none; overflow: visible;
  block-size: auto; align-items: center;
  border-block-end: 1px dashed var(--hair);
}
.bar-empty { font-family: var(--mono); font-size: var(--t--3); color: var(--ink-3); }

.cprules { display: grid; gap: var(--sp-1); min-inline-size: 190px; }
.cprule {
  display: grid;
  grid-template-columns: 2.5ch minmax(0, 1fr) minmax(4.5ch, auto);
  align-items: center; gap: var(--sp-2);
}
.cp-label { font-family: var(--mono); font-size: var(--t--3); color: var(--ink-3); }
.cp-bar { block-size: 8px; }

/* ---------- directory controls ---------- */
.dir-controls { padding-block: var(--sp-5) var(--sp-4); }
.dir-filter-label {
  display: flex; align-items: flex-end; min-block-size: 44px; padding-block-end: var(--sp-2);
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--ink-3);
}
#dir-filter {
  inline-size: 100%; max-inline-size: 520px; padding: 12px 14px;
  min-block-size: 44px; border: 2px solid var(--rule); background: var(--paper-2);
  color: var(--ink); font-family: var(--mono); font-size: 16px;
}
#dir-filter::placeholder { color: var(--ink-3); }

#dir-scan {
  margin-block-start: var(--sp-4); max-inline-size: 640px; background: var(--paper-2);
  border: 2px solid var(--rule); border-inline-start-width: 8px;
  border-inline-start-color: var(--hot);
  padding: var(--sp-4); display: flex; align-items: center; gap: var(--sp-4);
  flex-wrap: wrap;
}
.scan-copy { flex: 1 1 240px; font-size: var(--t--1); color: var(--ink-2); }
.scan-eyebrow {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  text-transform: uppercase; letter-spacing: 0.14em; color: #fff;
  background: var(--hot); padding: 2px 7px; margin-inline-end: var(--sp-2);
  white-space: nowrap;
}
.scan-status {
  flex-basis: 100%; font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
  border-block-start: 1px solid var(--hair); padding-block-start: var(--sp-3);
}

.dir-sortbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3);
  margin-block-start: var(--sp-4); font-family: var(--mono); font-size: var(--t--2);
  color: var(--ink-3);
}
.dir-sortbar label {
  text-transform: uppercase; letter-spacing: 0.12em;
  display: inline-flex; align-items: center; min-block-size: 44px;
  min-inline-size: 44px; gap: var(--sp-2);
}
.dir-sortbar select {
  font-family: var(--mono); font-size: 16px; letter-spacing: 0; padding: 8px 10px;
  background: var(--paper-2); color: var(--ink); border: 2px solid var(--rule);
  min-block-size: 44px;
}
.dir-check { cursor: pointer; text-transform: none; letter-spacing: 0; }
.dir-count { margin-inline-start: auto; color: var(--ink); }

/* ---------- broadsheet tables ---------- */
.table-scroll {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  border: 2px solid var(--rule); background-color: var(--paper-2);
  /* Visible affordance for a table wider than its box: an edge shadow that
     retracts at each end, plus a scrollbar drawn even where the platform
     would hide it. A clipped table must never look like a finished one. */
  background-image:
    linear-gradient(to right, var(--paper-2) 40%, rgba(248, 245, 238, 0)),
    linear-gradient(to left, var(--paper-2) 40%, rgba(248, 245, 238, 0)),
    linear-gradient(to right, rgba(20, 18, 16, 0.3), rgba(20, 18, 16, 0)),
    linear-gradient(to left, rgba(20, 18, 16, 0.3), rgba(20, 18, 16, 0));
  background-position: left center, right center, left center, right center;
  background-repeat: no-repeat;
  background-size: 46px 100%, 46px 100%, 16px 100%, 16px 100%;
  background-attachment: local, local, scroll, scroll;
  scrollbar-width: thin;
  scrollbar-color: var(--ink) var(--paper);
}
.table-scroll::-webkit-scrollbar { block-size: 12px; }
.table-scroll::-webkit-scrollbar-track { background: var(--paper); border-block-start: 1px solid var(--hair); }
.table-scroll::-webkit-scrollbar-thumb { background: var(--ink); }

table.directory, table.controls, table.method-table {
  inline-size: 100%; border-collapse: collapse; background: transparent;
}
table.directory { min-inline-size: 880px; }
table.controls { min-inline-size: 700px; }
table.method-table { min-inline-size: 560px; }
table.method-table-narrow { min-inline-size: 0; }
table.directory th, table.controls th, table.method-table th {
  font-family: var(--mono); font-size: var(--t--3); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.14em; color: var(--ink);
  text-align: start; padding: var(--sp-3) var(--sp-4);
  border-block-end: 2px solid var(--rule); background: var(--paper);
  white-space: nowrap;
}
table.directory td, table.controls td, table.method-table td {
  padding: var(--sp-4); border-block-start: 1px solid var(--hair);
  vertical-align: top;
}
table.directory tbody tr:first-child td,
table.controls tbody tr:first-child td,
table.method-table tbody tr:first-child td { border-block-start: none; }
table.directory tbody tr:hover { background: rgba(20, 18, 16, 0.035); }
table.method-table td { font-size: var(--t--1); color: var(--ink-2); }
table.method-table td strong { color: var(--ink); }
/* A control id is STRUCTURE — there are about eighty of them on this page, and
   painting every one hot made red the second most frequent colour here, which
   is the same as having no accent at all. The accent stays on NOT CHECKED, on
   a fail and on a gap. Weight and the mono face carry the identifier. */
table.method-table code, .tx-class-controls code, .ex-detail code,
.tx-defs code { color: var(--ink); font-weight: 500; }

.c-grade { inline-size: 1%; white-space: nowrap; }
.c-date { font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2); white-space: nowrap; }
.repo-name {
  font-family: var(--mono); font-size: var(--t-0); font-weight: 600;
  color: var(--ink); text-decoration: none; border-block-end: 2px solid var(--ink);
  display: inline-flex; align-items: center; min-block-size: 44px;
  overflow-wrap: anywhere;
}
.repo-name:hover { color: var(--hot); border-block-end-color: var(--hot); }
.desc { display: block; font-size: var(--t--1); color: var(--ink-2); max-inline-size: 46ch; margin-block-start: var(--sp-1); }
.meta-line {
  display: block; font-family: var(--mono); font-size: var(--t--2);
  color: var(--ink-2); margin-block-start: var(--sp-2);
}

/* ---------- lane stamps ---------- */
.lane {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 8px;
  white-space: nowrap; border: 2px solid var(--ink); color: var(--ink);
  background: var(--paper-2);
}
/* Filled: the repository's own CI proved it. */
.lane-auth { background: var(--ink); color: var(--paper-2); }
.lane-unsigned { border-color: var(--hot); color: var(--hot); border-style: dashed; }
/* Deliberately the quietest stamp on the page. Attributable, and weaker than
   the action lane — the styling may never read as equal to it. */
.lane-local { border-style: dashed; border-color: var(--ink-3); color: var(--ink-2); }
.lane-ext { border-color: var(--hair); color: var(--ink-2); }
.lane-local-overlay {
  margin-inline-start: var(--sp-2); border-style: dashed; border-color: var(--ink-3);
  color: var(--ink-2); font-size: var(--t--3);
}

/* ---------- coverage + conflict notes ---------- */
.cov-note {
  display: block; margin-block-start: var(--sp-3); font-size: var(--t--2);
  line-height: 1.55; color: var(--ink-2); max-inline-size: 62ch;
  border-inline-start: 4px solid var(--rust); padding-inline-start: var(--sp-3);
}
.cov-tag {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  text-transform: uppercase; letter-spacing: 0.12em; color: #fff;
  background: var(--rust); padding: 1px 6px; margin-inline-end: var(--sp-2);
}
.cov-note code { color: var(--ink); font-weight: 500; overflow-wrap: anywhere; }
.cov-caveat { border-inline-start-style: dashed; }
/* The hot rule is for a CONTRADICTION — verified sources that disagree. It was
   firing on every row's provenance notes, which spent the accent on the normal
   state of a page with no failures on it. */
.cov-conflict { border-inline-start-color: var(--hot); }

/* The merge summary: one scannable mono line per row, with the full sentences
   one tap underneath. The long text is not dropped — a claim about evidence
   has exactly one wording, in shared-facts.ts — it is folded, because printing
   the same ninety-five words under all three listings buried the one thing
   that differs between them. */
.merge-note {
  display: block; margin-block-start: var(--sp-3); font-size: var(--t--2);
  color: var(--ink-2); max-inline-size: 62ch;
  border-inline-start: 4px solid var(--ink); padding-inline-start: var(--sp-3);
}
.merge-note > summary {
  display: list-item; list-style: disclosure-closed inside;
  cursor: pointer; font-family: var(--mono); font-size: var(--t--3);
  line-height: 1.5; color: var(--ink); padding-block: var(--sp-2);
  overflow-wrap: anywhere;
}
.merge-note[open] > summary { list-style-type: disclosure-open; }
.merge-note > summary::marker { color: var(--ink-3); }
.merge-note > summary:hover { color: var(--hot); }
.mn-tag {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--paper-2);
  background: var(--ink); padding: 1px 6px; margin-inline-end: var(--sp-2);
}
.mn-sep { color: var(--ink-3); }
.merge-note p {
  font-size: var(--t--2); line-height: 1.55; color: var(--ink-2);
  padding-block-end: var(--sp-3);
}
.merge-note p + p { border-block-start: 1px solid var(--hair); padding-block-start: var(--sp-3); }

.key-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3) var(--sp-5);
  padding-block: var(--sp-4); font-size: var(--t--1); color: var(--ink-2);
  border-block-end: 1px solid var(--hair);
}
.key-label {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--ink-3);
}
.key-item { display: inline-flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.key-swatch { inline-size: 26px; block-size: 10px; display: inline-block; border: 1px solid var(--rule); }
.key-pass { background: var(--ink); }
.key-fail { background: var(--hot); }
.key-unv { background: var(--hatch); }

/* ---------- repo sheet ---------- */
.crumbs { padding-block: var(--sp-5) 0; font-family: var(--mono); font-size: var(--t--2); }
.repo-hero {
  display: flex; align-items: flex-start; gap: var(--gut); flex-wrap: wrap;
  padding-block: var(--sp-5); border-block-end: 2px solid var(--rule);
}
.repo-hero-slab { flex: 0 0 auto; display: flex; align-items: flex-start; flex-wrap: wrap; gap: var(--sp-2); }
.repo-hero-copy { flex: 1 1 320px; min-inline-size: 0; }
/* font-weight 400 is not decoration: only Anton's 400 face is loaded, so the
   UA's own <h1> bold made Chrome synthesise one — a smeared, off-register
   headline where every other Anton line on the site is the real face.
   text-transform stays off because a repository slug is case-sensitive: the
   same identifier is set in lowercase mono two lines below. */
.repo-title {
  font-family: var(--display); font-weight: 400; text-transform: none;
  font-size: clamp(1.7rem, 1rem + 3.4vw, 3rem); line-height: 0.98;
  letter-spacing: 0.005em; overflow-wrap: anywhere;
}
/* The hit area is on the link, the dashed box on the span inside it: a 44px
   target without a 44px chip in the middle of a meta rule. */
.repo-meta .meta-stale {
  display: inline-block; padding-block: 13px; text-decoration: none;
  color: var(--rust); white-space: nowrap;
}
.repo-meta .meta-stale span {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.08em; border: 1px dashed currentColor; padding: 1px 5px;
}
.repo-meta .meta-stale:hover { color: var(--hot); }
.repo-lane { margin-block-start: var(--sp-3); }
.repo-meta {
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
  line-height: 1.9; margin-block-start: var(--sp-3); overflow-wrap: anywhere;
}
.detail-figs {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gut);
  padding-block: var(--sp-5); border-block-end: 2px solid var(--rule);
}
.detail-figs .fig { padding: 0; }
.score-line { margin-block-start: var(--sp-4); font-size: var(--t--1); color: var(--ink-2); }
.detail-rules { max-inline-size: 980px; padding-block: var(--sp-5); }
/* Six phase names in an 11ch column wrapped five of them onto two lines while
   440px of the row sat empty to the right of the percentages. The bar is the
   content; give the label the width it needs and the bar the rest. */
@media (min-width: 760px) {
  .detail-rules .prule { grid-template-columns: minmax(200px, 27ch) minmax(0, 1fr) minmax(5.5ch, auto); }
  .detail-rules .pr-name { font-size: var(--t--2); }
  .detail-rules .pr-bar { block-size: 14px; }
}

.panel, .nudge {
  margin-block: var(--sp-6) var(--sp-4); background: var(--paper-2);
  border: 2px solid var(--rule); padding: var(--sp-5);
}
.panel-title, .nudge-title {
  font-family: var(--sans); font-size: var(--t-2); font-weight: 700;
  letter-spacing: -0.01em; margin-block-end: var(--sp-3);
}
.panel > .body-copy + .body-copy, .nudge > .body-copy + .body-copy { margin-block-start: var(--sp-3); }
.nudge-coverage { border-inline-start-width: 8px; border-inline-start-color: var(--rust); }
.nudge-verified { border-inline-start-width: 8px; border-inline-start-color: var(--ink); }
.nudge-unsigned { border-inline-start-width: 8px; border-inline-start-color: var(--hot); }
.nudge-local { border-style: dashed; }
.panel-conflict { border-inline-start-width: 8px; border-inline-start-color: var(--hot); }

/* A copy-me command wraps rather than clips, at every width: the continuations
   are already backslashed and the contract block is key/value lines, so there
   is nothing here that a wrap can corrupt — and a command cut mid-token at the
   panel edge is not a command anyone can run. */
.cov-cmd {
  white-space: pre-wrap; overflow-wrap: anywhere;
  background: var(--ink); color: var(--paper-2);
  border: 2px solid var(--rule); padding: var(--sp-4);
  font-family: var(--mono); font-size: var(--t--2); line-height: 1.7;
  margin-block: var(--sp-4);
}
.cov-cmd code { color: inherit; }

.btn, .btn-outline {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; padding: 10px 18px; font-family: var(--mono);
  font-size: var(--t--2); text-transform: uppercase; letter-spacing: 0.1em;
  text-decoration: none; border: 2px solid var(--rule); cursor: pointer;
}
.btn { background: var(--hot); color: #fff; border-color: var(--hot); }
.btn:hover { background: var(--ink); border-color: var(--ink); color: #fff; }
.btn-outline { background: var(--paper-2); color: var(--ink); }
.btn-outline:hover { background: var(--ink); color: var(--paper-2); }
.btn-row { display: flex; gap: var(--sp-3); flex-wrap: wrap; margin-block-start: var(--sp-4); }

.controls-title {
  font-family: var(--display); text-transform: uppercase;
  font-size: clamp(1.5rem, 1rem + 2vw, 2.25rem); line-height: 1;
  margin-block: var(--sp-7) var(--sp-3);
}
.transparency-note { font-size: var(--t--1); color: var(--ink-2); max-inline-size: 78ch; margin-block-end: var(--sp-4); }
/* A fifty-four-row results table wants a broadsheet's row height, not a card's
   padding: the detail sits inline after the reason and the evidence list folds
   into the same cell, so a row costs one line plus whatever it has to say. */
table.controls td { font-size: var(--t--1); padding: var(--sp-2) var(--sp-4); vertical-align: top; }
table.controls .outcome { font-family: var(--mono); font-size: var(--t--2); white-space: nowrap; }
.oc-chip {
  display: inline-block; padding: 2px 7px; border: 1px solid currentColor;
  text-transform: uppercase; letter-spacing: 0.08em; font-size: var(--t--3);
}

/* The phase bands. The Phase column was a 60px label carrying one digit on
   every one of 54 rows; a ruled band names the phase once and the rows below
   it belong to it — which is how a results table has always done this. */
tr.ph-head td {
  padding: var(--sp-5) var(--sp-4) var(--sp-2);
  border-block-start: 2px solid var(--rule);
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--ink);
}
table.controls tbody tr.ph-head:first-child td { border-block-start: none; }
.ph-count { color: var(--ink-3); letter-spacing: 0.1em; margin-inline-start: var(--sp-3); }

/* Jump-to-phase strip + the out-of-scope fold. The checkbox is a real input,
   placed before the bar so the fold is a sibling selector rather than script:
   filter.js owns the directory's rows and this page has no JS of its own. */
.ctl-toggle {
  position: absolute; inline-size: 0; block-size: 0; opacity: 0;
  margin: 0; padding: 0; border: 0; appearance: none;
}
.ctl-bar {
  position: sticky; inset-block-start: 0; z-index: 20;
  display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--sp-2);
  background: var(--paper); border-block: 2px solid var(--rule);
  padding-block: var(--sp-1); margin-block-end: var(--sp-4);
}
.ctl-bar-label {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--ink-3); margin-inline-end: var(--sp-2);
}
.ctl-jump {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; min-inline-size: 44px; padding-inline: var(--sp-2);
  font-family: var(--mono); font-size: var(--t--2); letter-spacing: 0.06em;
  text-decoration: none; color: var(--ink-2); border-block-end: 2px solid transparent;
}
.ctl-jump:hover { color: var(--hot); border-block-end-color: var(--hot); }
.ctl-hide {
  display: inline-flex; align-items: center; gap: var(--sp-2); cursor: pointer;
  min-block-size: 44px; margin-inline-start: auto; padding-inline: var(--sp-2);
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
}
.ctl-box {
  inline-size: 20px; block-size: 20px; flex: 0 0 auto;
  border: 2px solid var(--rule); background: var(--paper-2);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 15px; line-height: 1; color: var(--ink);
}
.ctl-toggle:checked + .ctl-bar .ctl-box::after { content: "\\2715"; }
.ctl-toggle:checked + .ctl-bar .ctl-hide { color: var(--ink); }
.ctl-toggle:focus-visible + .ctl-bar .ctl-hide { outline: 3px solid var(--hot); outline-offset: 2px; }
.ctl-toggle:checked ~ .table-scroll-controls tr.out-of-scope { display: none; }
tr.oc-pass .outcome { color: var(--ink); }
tr.oc-pass .oc-chip { background: var(--ink); color: var(--paper-2); border-color: var(--ink); }
tr.oc-fail .outcome { color: var(--hot); }
tr.oc-fail .oc-chip { background: var(--hot); color: #fff; border-color: var(--hot); }
tr.oc-gap .outcome { color: var(--rust); }
tr.oc-unverified .outcome { color: var(--ink-2); }
/* THE HATCH IS A SWATCH, NOT A BACKGROUND. Painted behind the letters it made
   the one state this site's honesty rule depends on — a check nobody could
   answer — the only verdict on the page you cannot read. */
tr.oc-unverified .oc-chip {
  position: relative; background: var(--paper-2); color: var(--ink);
  border-color: var(--ink); padding-inline-start: 24px;
}
tr.oc-unverified .oc-chip::before {
  content: ""; position: absolute; inset: 0 auto 0 0; inline-size: 16px;
  background: var(--hatch); border-inline-end: 1px solid var(--ink);
}
tr.oc-info .outcome { color: var(--ink-3); }
tr.out-of-scope td { opacity: 0.55; }
.oos {
  font-family: var(--mono); font-size: var(--t--3); color: var(--ink-3);
  border: 1px solid var(--hair); padding: 1px 5px;
  display: inline-block; white-space: nowrap;
}
.raw {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  color: var(--rust); border: 1px dashed var(--rust); padding: 1px 5px;
  margin-inline-start: var(--sp-2);
}
.reason { color: var(--ink-2); font-size: var(--t--1); display: inline; }
/* The evidence fold. summary{display:inline-flex} in the shared layer
   suppresses the disclosure marker, so 42 rows ended in the bare word
   "evidence" on a line of its own — a dead label, not a control. It gets the
   marker back, an underline, a count, and a seat on the same line as the
   detail it belongs to. */
table.controls details { display: inline-block; margin-inline-start: var(--sp-3); vertical-align: baseline; }
table.controls td.c-detail > details:only-child { margin-inline-start: 0; }
table.controls summary {
  display: list-item; list-style: disclosure-closed inside; min-block-size: 0;
  cursor: pointer; font-family: var(--mono); font-size: var(--t--2);
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink);
  text-decoration: underline; text-underline-offset: 3px;
  padding-block: var(--sp-3);
}
table.controls details[open] > summary { list-style-type: disclosure-open; }
table.controls summary::marker { color: var(--ink-3); }
table.controls summary:hover { color: var(--hot); }
table.controls details ul { margin: var(--sp-2) 0 0; padding-inline-start: 18px; color: var(--ink-2); font-size: var(--t--2); }
table.controls details li { font-family: var(--mono); overflow-wrap: anywhere; }

/* ---------- methodology ---------- */
/* The section index is a sibling of the sections rather than a tail on the
   page head, because that is what lets it stick: on a 27,000px page the eight
   pills are the only navigation there is, and 27,000px away they are not
   navigation. */
.sec-index {
  display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-4);
  padding-block: var(--sp-4);
  border-block-end: 2px solid var(--rule);
}
.sec-index a {
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.08em; text-decoration: none; color: var(--ink-2);
  border: 2px solid var(--hair); padding: 6px 10px;
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.sec-index a:hover { border-color: var(--hot); color: var(--hot); }

.method-section { padding-block: var(--sp-6); border-block-end: 1px solid var(--hair); }
.sec-head {
  display: flex; align-items: baseline; gap: var(--sp-4);
  border-block-end: 2px solid var(--rule); padding-block-end: var(--sp-2);
  margin-block-end: var(--sp-4); flex-wrap: wrap;
}
.sec-num {
  font-family: var(--display); font-size: clamp(1.8rem, 1rem + 2.6vw, 2.75rem);
  line-height: 0.9; color: var(--ink-3); flex: 0 0 auto;
}
.sec-title, .method-section > h2 {
  font-family: var(--display); text-transform: uppercase;
  font-size: clamp(1.4rem, 0.9rem + 2vw, 2.25rem); line-height: 1;
  letter-spacing: 0.01em; font-weight: 400;
}
/* The shared sections (threats, Scorecard) bring their own <h2> with no
   ordinal. They get the same rule AND the ordinal the section index promises,
   printed here rather than in their markup — that markup is rendered by every
   design, and none of the others is numbered. */
.tx-section > h2, .cmp-section > h2 {
  border-block-end: 2px solid var(--rule); padding-block-end: var(--sp-2);
  margin-block-end: var(--sp-4);
}
.tx-section > h2::before, .cmp-section > h2::before {
  font-size: 1.22em; color: var(--ink-3); margin-inline-end: var(--sp-4);
}
.tx-section > h2::before { content: "02"; }
.cmp-section > h2::before { content: "03"; }
.method-section h3, .prose h3 {
  font-family: var(--sans); font-size: var(--t-2); font-weight: 700;
  margin-block: var(--sp-5) var(--sp-2); letter-spacing: -0.01em;
}
.prose p, .prose li { color: var(--ink-2); max-inline-size: 72ch; }
.prose p + p { margin-block-start: var(--sp-3); }
.prose strong { color: var(--ink); }
.prose ol, .prose ul { padding-inline-start: 22px; margin-block: var(--sp-3); }
.prose li { margin-block: var(--sp-2); }
/* A one-line command set as a 1160px black slab beside a 72ch measure is the
   page alternating half-width and full-width every few hundred pixels. The
   block takes the measure its own content needs. */
.prose pre {
  overflow-x: auto; background: var(--ink); color: var(--paper-2);
  border: 2px solid var(--rule); padding: var(--sp-4); margin-block: var(--sp-4);
  font-family: var(--mono); font-size: var(--t--2); line-height: 1.7;
  max-inline-size: 80ch;
}
.prose pre code { color: inherit; }

/* A broadsheet standfirst: the label rides the left column, the copy the
   right. Set as one full-width block it left a void the width of the page
   beside a 72ch measure, which reads as a layout that has not been finished. */
.honesty {
  margin-block: var(--sp-6); padding: var(--sp-5);
  background: var(--paper-2); border: 2px solid var(--rule);
  border-inline-start-width: 8px; border-inline-start-color: var(--hot);
  display: grid; grid-template-columns: minmax(140px, 2fr) minmax(0, 7fr);
  gap: var(--sp-3) var(--gut);
}
.honesty-head {
  grid-column: 1; font-family: var(--mono); font-size: var(--t--2);
  text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink);
}
.honesty-body { grid-column: 2; color: var(--ink-2); line-height: 1.6; }

.formula-slab {
  background: var(--ink); color: var(--paper-2); border: 2px solid var(--rule);
  overflow-x: auto;
}
.formula-slab pre {
  margin: 0; padding: var(--sp-5); font-family: var(--mono);
  font-size: clamp(0.8125rem, 0.7rem + 0.5vw, 1rem); line-height: 1.9;
}
.formula-slab .t-dim { color: #9A938A; }

.grade-row { display: flex; gap: var(--sp-3); flex-wrap: wrap; margin-block: var(--sp-4); }

/* Scorecard comparison (shared markup, styled here). */
.cmp-risk { font-family: var(--mono); color: var(--ink-3); font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.08em; }
.cmp-mark { font-family: var(--mono); font-size: var(--t--3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
.cmp-mark.cmp-covered { color: var(--ink); }
.cmp-mark.cmp-partial { color: var(--rust); }
.cmp-mark.cmp-none { color: var(--hot); }
.cmp-note { margin-block-start: var(--sp-2); color: var(--ink-3); font-size: var(--t--2); line-height: 1.45; }
.cmp-footnote { color: var(--ink-3); font-size: var(--t--2); }
.cmp-table { min-inline-size: 760px; }

/* Same fold, same defect: the shared layer's display:inline-flex eats the
   disclosure marker, so nine "What this looks like when it happens" lines read
   as headings nobody can open. */
.tx-details summary {
  display: list-item; list-style: disclosure-closed inside;
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.1em; cursor: pointer; color: var(--ink);
  text-decoration: underline; text-underline-offset: 4px;
  padding-block: var(--sp-2);
}
.tx-details[open] > summary { list-style-type: disclosure-open; }
.tx-details summary::marker { color: var(--ink-3); }
.tx-details summary:hover { color: var(--hot); }

/* ---------- design switcher (shared markup, styled here) ---------- */
/* This is review chrome, and it is fixed, so at every scroll position it sits
   on top of whatever is at the bottom of the viewport. Two measurements drove
   this shape: at 390px it wrapped to 370x98 and stood over the grade slab and
   the first listing's score line — 11% of the screen, permanently; at 1440 the
   407x54 bar overlapped the figure band's fourth numeral at rest.
   So: a compact chip naming the CURRENT design at desk width, opening to the
   full list on hover or keyboard focus (the links stay in the DOM and stay
   focusable, they are only clipped), and one full-bleed 44px row docked to the
   bottom edge on a phone, where a fixed corner box has nowhere safe to sit. */
.design-switcher {
  position: fixed; inset-inline-end: 12px; inset-block-end: 12px; z-index: 50;
  display: flex; align-items: stretch; gap: 0; flex-wrap: nowrap;
  background: var(--paper-2); border: 2px solid var(--rule);
  padding: 0; font-family: var(--mono); font-size: var(--t--3);
}
.design-switcher .ds-label {
  display: inline-flex; align-items: center; order: -2;
  text-transform: uppercase; letter-spacing: 0.14em; color: var(--ink-3);
  padding-inline: var(--sp-3); white-space: nowrap;
  border-inline-end: 1px solid var(--hair);
}
.design-switcher a {
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--ink-2); text-decoration: none; text-transform: uppercase;
  letter-spacing: 0.06em; white-space: nowrap; padding-inline: var(--sp-3);
}
.design-switcher a:hover { background: var(--ink); color: var(--paper-2); }
.design-switcher a[aria-current="true"] { background: var(--hot); color: #fff; }

/* Panels are broadsheet blocks, not centred cards: at desk width the heading
   rides a narrow left column and the body runs in the wide one. Set as a
   single column, a full-bleed bordered box held a 62ch measure and left half
   its own width empty, which reads as a layout nobody finished. */
@media (min-width: 900px) {
  .panel, .nudge {
    display: grid; grid-template-columns: minmax(150px, 3fr) minmax(0, 8fr);
    gap: var(--sp-3) var(--gut); align-items: start;
  }
  .panel > *, .nudge > * { grid-column: 2; }
  .panel > .panel-title, .nudge > .nudge-title {
    grid-column: 1; grid-row: 1; margin-block-end: 0;
  }
  .panel .body-copy, .nudge .body-copy { max-inline-size: 74ch; }
  /* The exposure panel is deliberately NOT a sidehead: its body is a nine-row
     list that wants the full measure, and a side column beside it would be a
     thousand pixels of empty gutter rather than a device. */
  .exposure .body-copy { max-inline-size: 80ch; }
}

/* ---------- the grid collapses, in one step ---------- */
@media (max-width: 1000px) {
  .poster { grid-template-columns: 1fr; gap: var(--sp-6); }
  .poster-lead, .poster-slab { grid-column: 1 / -1; }
  .poster-slab {
    border-inline-start: none; padding-inline-start: 0;
    border-block-start: 2px solid var(--rule); padding-block-start: var(--sp-5);
  }
  .lane-cols { grid-template-columns: 1fr; gap: var(--sp-5); }
  .figband { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .figband .fig:nth-child(3) { border-inline-start: none; padding-inline-start: 0; }
  .figband .fig:nth-child(n + 3) { border-block-start: 1px solid var(--hair); padding-block-start: var(--sp-5); }
}

@media (max-width: 760px) {
  .figband { grid-template-columns: 1fr; }
  .figband .fig + .fig {
    border-inline-start: none; padding-inline-start: 0;
    border-block-start: 1px solid var(--hair); padding-block-start: var(--sp-4);
  }
  .fig-cap { max-inline-size: none; }
  .detail-figs { grid-template-columns: 1fr; gap: var(--sp-5); }
  .mast-edition { margin-inline-start: 0; flex-basis: 100%; }
  .honesty { grid-template-columns: 1fr; }
  .honesty-head, .honesty-body { grid-column: 1; }

  /* The broadsheet restacks. filter.js only ever sets display:none / "" on a
     row, so the row's shown state comes back to whatever this stylesheet says
     — which is how a table can restack without touching the shared script. */
  .table-scroll-dir, .table-scroll-controls {
    overflow-x: visible; background-image: none;
  }
  table.directory, table.controls { min-inline-size: 0; display: block; }
  table.directory thead, table.controls thead {
    position: absolute; inline-size: 1px; block-size: 1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  table.directory tbody, table.controls tbody,
  table.directory tr, table.controls tr,
  table.directory td, table.controls td { display: block; inline-size: 100%; }
  table.directory tr, table.controls tr {
    padding: var(--sp-4); border-block-end: 2px solid var(--rule);
  }
  table.directory tbody tr:last-child, table.controls tbody tr:last-child { border-block-end: none; }
  table.directory td, table.controls td {
    border-block-start: none; padding: var(--sp-2) 0;
  }
  table.directory td::before {
    content: attr(data-label); display: block; font-family: var(--mono);
    font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-3); margin-block-end: var(--sp-1);
  }
  table.directory td.c-repo::before { display: none; }
  .c-grade { inline-size: auto; }

  /* THE CONTROL TABLE IS A LIST, NOT 54 CARDS. Read literally, the restack
     spent ~60px per row printing "PHASE" over a single digit and another
     label over an empty detail cell: 54 rows came to 14,700px. The phase is
     named once per band, the control and its verdict share a line, and only
     the detail — when there is one — takes the full width. */
  table.controls tr {
    display: grid; grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--sp-3); row-gap: var(--sp-1);
    padding: var(--sp-3) var(--sp-3); align-items: baseline;
  }
  table.controls tr.ph-head { display: block; padding: 0; border-block-end: none; }
  table.controls td::before { display: none; }
  table.controls td.c-control { grid-column: 1; }
  table.controls td.c-verdict { grid-column: 2; text-align: end; }
  table.controls td.c-detail { grid-column: 1 / -1; }
  table.controls td.c-detail:empty { display: none; }
  table.controls td { padding: 0; inline-size: auto; }
  table.controls summary { padding-block: var(--sp-3); }
  tr.ph-head td { padding: var(--sp-5) var(--sp-3) var(--sp-2); inline-size: auto; }
  .desc, .body-copy, .cov-note, .prose p, .prose li, .merge-note { max-inline-size: none; }
  .cprules { min-inline-size: 0; }
  .prule {
    grid-template-columns: minmax(80px, 9ch) minmax(0, 1fr) minmax(5.5ch, auto);
    gap: var(--sp-2);
  }

  /* THE METHODOLOGY'S TABLES RESTACK TOO. They were the only ones that did not,
     and they are the densest data on the site: measured live, a 747px table in
     a 354px box hid the whole sscsb-mapping column — the reason that table
     exists — and cut questions mid-word. Their markup is shared by five
     designs, so where there is no data-label the column POSITION carries the
     label; the two shared tables are told apart by the data-coverage attribute
     the four-column one puts on its rows. */
  .table-scroll { overflow-x: visible; background-image: none; }
  table.method-table { min-inline-size: 0; display: block; }
  table.method-table thead {
    position: absolute; inline-size: 1px; block-size: 1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  table.method-table tbody, table.method-table tr, table.method-table td {
    display: block; inline-size: 100%;
  }
  table.method-table tr {
    padding: var(--sp-3) var(--sp-3); border-block-end: 2px solid var(--rule);
  }
  table.method-table tbody tr:last-child { border-block-end: none; }
  table.method-table td { border-block-start: none; padding: var(--sp-1) 0; }
  table.method-table td[data-label]::before {
    content: attr(data-label); display: block; font-family: var(--mono);
    font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-3); margin-block-end: var(--sp-1);
  }
  /* The two-column grade table already fits 354px; a table that fits stays a
     table. */
  table.method-table-narrow, table.method-table-narrow thead,
  table.method-table-narrow tbody, table.method-table-narrow tr,
  table.method-table-narrow td { display: revert; }
  table.method-table-narrow td::before { display: none; }
  table.method-table-narrow tr { padding: 0; border-block-end: none; }
  table.method-table-narrow td { padding: var(--sp-3) var(--sp-4); }

  /* "Every check, as a question": id and groups on one line, the question
     under them at full width. */
  table.tx-q-table { min-inline-size: 0; }
  table.tx-q-table tbody tr {
    display: grid; grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--sp-3); row-gap: var(--sp-1); align-items: baseline;
  }
  table.tx-q-table td { inline-size: auto; }
  /* Explicit rows, because DOM order is id / question / groups and the row we
     want is id + groups, then the question under both. */
  table.tx-q-table td:nth-child(1) { grid-row: 1; grid-column: 1; font-family: var(--mono); }
  table.tx-q-table td:nth-child(3) { grid-row: 1; grid-column: 2; text-align: end; }
  table.tx-q-table td:nth-child(2) { grid-row: 2; grid-column: 1 / -1; color: var(--ink); }
  table.tx-q-table td:nth-child(3)::before {
    content: "grp "; font-family: var(--mono); font-size: var(--t--3);
    color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.1em;
  }

  /* Scorecard comparison: name + verdict on one line, then what it looks for,
     then the sscsb mapping — the column that used to be off-screen. */
  table.cmp-table { min-inline-size: 0; }
  table.cmp-table tbody tr[data-coverage] {
    display: grid; grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--sp-3); row-gap: var(--sp-1);
  }
  table.cmp-table tr[data-coverage] td { inline-size: auto; }
  table.cmp-table tr[data-coverage] td:nth-child(1) { grid-row: 1; grid-column: 1; }
  table.cmp-table tr[data-coverage] td:nth-child(3) { grid-row: 1; grid-column: 2; text-align: end; }
  table.cmp-table tr[data-coverage] td:nth-child(2) { grid-row: 2; grid-column: 1 / -1; }
  table.cmp-table tr[data-coverage] td:nth-child(4) { grid-row: 3; grid-column: 1 / -1; }
  table.cmp-table tr[data-coverage] td:nth-child(4)::before { content: "sscsb checks"; }
  table.cmp-table tr:not([data-coverage]) td:nth-child(3)::before { content: "sscsb checks"; }
  table.cmp-table td:nth-child(4)::before,
  table.cmp-table tr:not([data-coverage]) td:nth-child(3)::before {
    display: block; font-family: var(--mono); font-size: var(--t--3);
    text-transform: uppercase; letter-spacing: 0.14em; color: var(--ink-3);
    margin-block-end: var(--sp-1);
  }

  /* A copy-me command that clips mid-token is not a copy-me command. The
     backslash continuations already make every one of these wrap-safe. */
  .prose pre, .formula-slab pre {
    white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .prose pre { max-inline-size: none; }

  /* Eight pills wrapping into six rows before any content starts, on a page
     27,000px long, is not an index. One row that follows you down is. */
  .sec-index {
    position: sticky; inset-block-start: 0; z-index: 20;
    flex-wrap: nowrap; overflow-x: auto; gap: 0;
    background: var(--paper); border-block-start: 2px solid var(--rule);
    padding-block: 0; scrollbar-width: none;
  }
  .sec-index::-webkit-scrollbar { display: none; }
  .sec-index a { border: none; border-block-end: 2px solid transparent; white-space: nowrap; padding: 6px var(--sp-3); }
  .sec-index a:hover { border-block-end-color: var(--hot); }

  /* The jump strip is sticky, so it is a tax on every screen: one scrolling
     row, no label — P1-P6 say what they are. */
  .ctl-bar {
    flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none;
    padding-block: 0;
  }
  .ctl-bar::-webkit-scrollbar { display: none; }
  /* The same edge shadow the tables use, so a strip that scrolls says so. */
  .sec-index, .ctl-bar {
    background-image:
      linear-gradient(to right, var(--paper) 40%, rgba(239, 235, 227, 0)),
      linear-gradient(to left, var(--paper) 40%, rgba(239, 235, 227, 0)),
      linear-gradient(to right, rgba(20, 18, 16, 0.28), rgba(20, 18, 16, 0)),
      linear-gradient(to left, rgba(20, 18, 16, 0.28), rgba(20, 18, 16, 0));
    background-position: left center, right center, left center, right center;
    background-repeat: no-repeat;
    background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
    background-attachment: local, local, scroll, scroll;
  }
  .ctl-bar-label { display: none; }
  .ctl-hide { margin-inline-start: var(--sp-3); white-space: nowrap; flex: 0 0 auto; }
  .ctl-jump { flex: 0 0 auto; }
}

@media (max-width: 420px) {
  .slab-nums { gap: var(--sp-4); }
  .btn, .btn-outline { inline-size: 100%; }
  .btn-row { flex-direction: column; align-items: stretch; }
}
`;

/**
 * Rules that must beat `shared-css.ts`, which is concatenated AFTER this file
 * and would otherwise win at equal specificity. Only shape is corrected here —
 * the shared components' STRUCTURE and accessibility floors are left exactly
 * as they are, because those are the parts no design is allowed to vary.
 */
export const OVERRIDES = `
/* ---------- shared components, in this register ---------- */
:root .hp-grade {
  border-radius: 0; border-width: 2px; font-family: var(--display);
  inline-size: 46px; block-size: 46px; font-weight: 400; font-size: 1.2rem;
}
:root .hp-card, :root .exposure { border-width: 2px; border-color: var(--rule); }
:root .hp-card:hover { border-color: var(--hot); background: var(--paper-2); }
:root .hp-panel-title, :root .tx-class-title {
  text-transform: uppercase; line-height: 1; font-weight: 400;
  letter-spacing: 0.01em;
}
/* Same accent discipline as .kicker: the panel eyebrows and the attack-class
   ids are structure, so they are ink. The hot colour stays on state. */
:root .hp-panel-eyebrow {
  padding-block-end: var(--sp-2); border-block-end: 2px solid var(--rule);
  margin-block-end: var(--sp-3); color: var(--ink);
}
:root .tx-chip-id { color: var(--ink); }
:root .hp-chip, :root .tx-chip { border-width: 2px; }
:root .hp-chip:hover, :root .tx-chip:hover { background: var(--ink); color: var(--paper-2); border-color: var(--ink); }
:root .hp-search-input { font-family: var(--mono); }
:root .hp-waiting { border-width: 2px; }
:root .tx-class { border-inline-start-width: 6px; border-inline-start-color: var(--rule); }
:root .tx-strip { border-block-start-width: 2px; border-block-start-color: var(--rule); }
:root .hp-unans-track { block-size: 10px; border: 1px solid var(--rule); background: var(--paper-2); }
:root .ex-row { border-inline-start-width: 6px; }
/* A9's title runs to two lines; centred, its group id floated to the middle of
   them while A1-A3's sat on the baseline. */
:root .ex-name { align-items: baseline; min-block-size: 44px; }
/* Chips are 2px ink rules like everything else here, not a 1px hairline card:
   this was the one place the shared component layer showed through. */
:root .tx-chip, :root .hp-chip { border-width: 2px; border-color: var(--rule); background: transparent; }
/* A full-width row of body text is a link target too. */
:root .tx-incident > a { display: inline-flex; align-items: center; min-block-size: 44px; }

/* Two waiting states stacked back to back ran ~1,400px of mostly blank paper
   through the middle of the front page. Side by side under one band they read
   as a composed pair; the aggregate panel below keeps the full measure. */
@media (min-width: 1000px) {
  :root .hp-panels { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--gut); }
  :root .hp-panels > #still-unchecked { grid-column: 1 / -1; }
}

/* The fold's checkbox is a mechanism, not a control: the LABEL is the 44px
   target. Sized here because the shared layer pins every checkbox to 20px. */
:root input.ctl-toggle { inline-size: 0; block-size: 0; }

/* ---------- the switcher, shaped against the shared layer ---------- */
:root .design-switcher { flex-wrap: nowrap; padding: 0; }
:root .design-switcher a { padding: 0 var(--sp-3); min-block-size: 44px; }

@media (min-width: 761px) {
  /* Collapsed to "DESIGN | BULLETIN ▸" — the current design is ordered to the
     front, and the other four are clipped to zero width rather than removed,
     so they keep their place in the tab order and a keyboard :focus-within
     opens the strip exactly as a hover does. */
  :root .design-switcher { overflow: hidden; }
  :root .design-switcher a[aria-current="true"] { order: -1; }
  :root .design-switcher a[aria-current="true"]::after { content: "\\00a0▸"; }
  :root .design-switcher:hover a[aria-current="true"]::after,
  :root .design-switcher:focus-within a[aria-current="true"]::after { content: "\\00a0▾"; }
  /* Collapsed to zero area, NOT to display:none or visibility:hidden — a
     zero-area link keeps its seat in the tab order, so tabbing into the strip
     is what opens it. It is not a tap target while it is closed, and it is a
     44px one the moment it is not. */
  :root .design-switcher a:not([aria-current="true"]) {
    max-inline-size: 0; max-block-size: 0; padding: 0; overflow: hidden;
    min-block-size: 0;
  }
  :root .design-switcher:hover a:not([aria-current="true"]),
  :root .design-switcher:focus-within a:not([aria-current="true"]) {
    max-inline-size: 12rem; max-block-size: none; min-block-size: 44px;
    padding-inline: var(--sp-3);
  }
}

@media (max-width: 760px) {
  /* One 44px row docked to the bottom edge. The label goes: five names fit
     across 390px without it, and "Design" is what the nav's aria-label already
     says. */
  :root .design-switcher {
    inset-inline: 0; inset-block-end: 0; max-inline-size: none;
    border-inline: none; border-block-end: none;
    border-block-start: 2px solid var(--rule);
    padding-block-end: env(safe-area-inset-bottom, 0px);
  }
  :root .design-switcher .ds-label { display: none; }
  :root .design-switcher a {
    flex: 1 1 0; min-inline-size: 0; padding: 0 2px;
    font-size: 10px; letter-spacing: 0.02em; min-block-size: 44px;
  }
  :root .design-switcher a + a { border-inline-start: 1px solid var(--hair); }
}
`;
