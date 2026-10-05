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
  /* FAIL CANNOT BE HUE ALONE. The third state earns a pattern precisely so it
     survives greyscale, print and a protanope; fail did not, so a phase bar
     showed two solid dark segments under one percentage with no way to tell
     which part failed — on the one page whose honesty rule leans on red. The
     counter-diagonal makes the three states read pass = solid, fail = "/",
     unverified = "\\" before colour is considered at all. */
  --hatch-fail: repeating-linear-gradient(-45deg, #C02A12 0 2px, #EFEBE3 2px 5px);

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
/* Same markup, the other half: directoryTermsNote nests <strong class="term">
   inside a bare <strong>, so that one term computes 900 while its five
   siblings compute 700. It paints the same today only because Source Sans 3
   ships no 900 and this Chrome declines to synthesise one — two accidents, not
   a design. Pinned, so the bold-italic regression cannot come back. */
.key-note strong.term { font-weight: 700; }
:focus-visible { outline: 3px solid var(--hot); outline-offset: 2px; }
::selection { background: var(--hot); color: #fff; }
code { font-family: var(--mono); font-size: 0.9em; }
.mono { font-family: var(--mono); }
/* Present to a screen reader, absent on the page. Used where a chip and the
   text beside it would otherwise run together in the accessible name —
   'summary.textContent' read "Mergelocal 3cb129084db2 ≠ scan …", announced as
   one word. */
.vh {
  position: absolute; inline-size: 1px; block-size: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
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
/* The board's six bars carry visibly hatched tails beside the number 100%, and
   the front page — the one a first-time reader meets — printed no key at all
   while the directory and the repo sheet both print one. */
.slab-key {
  display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-4);
  margin-block-start: var(--sp-3); font-family: var(--mono);
  font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--ink-3);
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
/* font-weight 400 for the third time on this page, and the reason has not
   changed: the request loads Anton's 400 face ONLY, so a UA <h2> bold makes
   Chrome smear a synthetic one. Measured on the shipped element — 3,639 pixels
   differ between it and the same element at 400, and forcing 900 is
   byte-identical to the shipped 700, which is the signature of one fixed
   synthetic stroke rather than a weight axis. Every Anton heading here now
   states the weight it actually has. */
.section-head {
  font-family: var(--display); font-weight: 400;
  font-size: clamp(1.6rem, 1rem + 2.4vw, 2.5rem);
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
.seg-fail { background: var(--hatch-fail); }
.seg-unv { background: var(--hatch); }
.pr-pct, .cp-pct {
  font-family: var(--mono); font-size: var(--t--3); font-variant-numeric: tabular-nums;
  text-align: end; color: var(--ink-2); white-space: nowrap;
}
.pr-pct.pct-low, .cp-pct.pct-low { color: var(--rust); }
/* "no checks in scope" is longer than "no evidence" and this track is sized to
   its content, so it is allowed to take two lines rather than push the grid. */
.pr-pct.pct-none, .cp-pct.pct-none { color: var(--ink-3); white-space: normal; }
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

/* A SECOND HUE, PAINTED BY THE BROWSER. <input type="search"> keeps
   appearance:auto, so the moment the field has content Chrome draws its own
   ::-webkit-search-cancel-button — sampled off the captures at #40649F, a
   system blue — inside the home hero, a hundred pixels above the one hot CTA.
   iOS Safari draws a grey filled circle in the same place. Either way it is UA
   chrome in the one area of the page where the register allows exactly two
   colours, on the two most-visited pages. The affordance is redrawn below, in
   this design's own ink. */
input[type="search"] { appearance: none; -webkit-appearance: none; }
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-results-button {
  appearance: none; -webkit-appearance: none; display: none;
}

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
/* '.dir-sortbar label' uppercases every label in the row and beat this on
   specificity, so the sentence-case this line has always asked for was dead
   and the directory's fold read as a mono eyebrow while the repo sheet's
   identical control read as a sentence. One widget class, one treatment —
   and the treatment is the one the source already chose. */
.dir-sortbar label.dir-check {
  cursor: pointer; text-transform: none; letter-spacing: 0; color: var(--ink-2);
}
.dir-count { margin-inline-start: auto; color: var(--ink); }

/* FILTERING TO NOTHING MUST SAY SO. Ticking the coverage box took the listings
   from three to zero and left the space between the control row and the KEY
   simply blank — the only feedback a 13px count at the far end of the row the
   thumb had just covered. A page that empties itself reads as a page that
   broke. The strip below is the same dashed "waiting" box the front page uses
   for a state with nothing in it, and it carries the way out. */
.dir-empty {
  border: 2px dashed var(--rule); padding: var(--sp-5);
  margin-block: var(--sp-4); color: var(--ink-2);
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3) var(--sp-4);
}
.dir-empty-copy { font-size: var(--t--1); flex: 1 1 22ch; }
/* Two sentences ship, exactly one is shown, and which one is a fact about the
   CONTROLS rather than a guess from the row count — the script sets
   'data-reason' from their state. Display, not visibility: the unused sentence
   leaves the accessibility tree too, so a screen reader is never read both. */
.dir-empty .dir-empty-coverage { display: none; }
/* :has() is load-bearing here, not decoration. The coverage sentence is a
   FINDING about this board, so it is rendered only when it is true of it — on a
   board that does carry a short listing there is nothing to swap TO, and hiding
   the generic sentence would leave an empty dashed box. The swap is therefore
   conditioned on the replacement existing. */
.dir-empty[data-reason="coverage"]:has(.dir-empty-coverage) .dir-empty-match { display: none; }
.dir-empty[data-reason="coverage"] .dir-empty-coverage { display: block; }
/* THE HEADER GOES WITH THE ROWS. A thead standing over an empty tbody is 43px
   of ruled column headings on blank paper inside a 2px box, which is this
   page's own "the table broke" shape — measured at 1440, table height 671px
   -> 43px with the headings still painted. There is nothing left for them to
   label, so the scroll box leaves the flow until a row comes back. */
.table-scroll-dir.is-empty { display: none; }
.dir-clear {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; padding: 10px 18px; font-family: var(--mono);
  font-size: var(--t--2); text-transform: uppercase; letter-spacing: 0.1em;
  background: var(--paper-2); color: var(--ink); border: 2px solid var(--rule);
  cursor: pointer;
}
.dir-clear:hover { background: var(--ink); color: var(--paper-2); }

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

/* ---------- the coverage number's verdict ----------
   'coverage 87.1%' is a measurement; which side of the 75% floor it falls on
   is the judgement, and it was nowhere on the page that shows the number.
   NEVER COLOUR ALONE: cleared is a SOLID ink rule, short is a DASHED accent
   rule, and the words differ — so the two states survive greyscale, print and
   a protanope, which is the same contract the phase bars keep. */
.cov-mark {
  font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.08em;
  font-size: var(--t--3); white-space: nowrap; padding: 2px 6px;
  border: 2px solid var(--ink); color: var(--ink); background: transparent;
}
.cov-mark-under { border-style: dashed; border-color: var(--hot); color: var(--hot); }
/* Under the 84px numeral it takes a line of its own: the figure is the thing a
   reader remembers, and the verdict rides directly under it. */
/* 56ch, not 46: at 46 the note ran "How coverage is / scored →" and left the
   link's arrow alone on a line, which in an 11px mono caption reads as a
   mistake. 'pretty' keeps the last line from orphaning as the copy changes. */
.cov-verdict {
  margin-block-start: var(--sp-3); font-family: var(--mono);
  font-size: var(--t--3); line-height: 1.7; color: var(--ink-3);
  max-inline-size: 56ch; text-wrap: pretty;
}
/* The verdict leads with the mark and explains itself under it. Set as one
   running line the sentence wrapped INSIDE itself beside the chip ("The grade
   is not / provisional."), which reads as a line that ran out of room rather
   than as a considered caption. Stamp, then note. */
.cov-verdict .cov-mark { display: inline-block; }
.cov-verdict .cv-note { display: block; margin-block-start: var(--sp-2); }
.cov-verdict a { color: var(--ink-2); }
.cov-verdict a:hover { color: var(--hot); }

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
/* The 8px inset belongs to the chip's INLINE use, sitting after a lane stamp in
   a table cell. Leaking into the legend it put two stacked dashed chips on two
   different left edges — in a register whose whole apparatus is hard rules and
   a shared grid, 8px is the difference between composed and not. */
.key-row .lane-local-overlay { margin-inline-start: 0; }
/* "n controls…" opened on a bare lowercase n, which at the head of a mono
   legend line reads as a dropped glyph rather than as a placeholder. */
.kv { font-family: var(--mono); font-style: italic; color: var(--ink); }
/* THE PHASE CODES NEEDED A KEY. Each listing card carries six bars labelled
   P1…P6 and the only place their names existed was a 'title' attribute, which
   a phone cannot fire. The home board spells the same six out and the repo
   sheet spells them out in full, so the directory was the one surface that
   showed a reader codes with no way to decode them. */
.key-phases {
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
  padding-block: var(--sp-3); border-block-end: 1px solid var(--hair);
}
.key-phases .kp-label {
  text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink-3);
  margin-inline-end: var(--sp-3);
}
.key-phases code { color: var(--ink); font-weight: 600; }
.key-swatch { inline-size: 26px; block-size: 10px; display: inline-block; border: 1px solid var(--rule); }
.key-pass { background: var(--ink); }
.key-fail { background: var(--hatch-fail); }
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
/* SEPARATORS RIDE THE TAIL, NEVER THE HEAD. Joined with literal middots this
   rule wrapped so the last visual line opened with an orphaned "· scan run":
   a separator set between two items travels with the second one. Drawn as an
   ::after on the item BEFORE it, a wrap always leaves it at the end of a line. */
.repo-meta {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--sp-3);
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
  line-height: 1.9; margin-block-start: var(--sp-3);
}
.repo-meta > * { white-space: nowrap; min-inline-size: 0; }
.repo-meta > .rm-url { white-space: normal; overflow-wrap: anywhere; }
.repo-meta > span.rm-item:not(:last-of-type)::after {
  content: "\\00a0·"; color: var(--ink-3);
}
.detail-figs {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gut);
  padding-block: var(--sp-5); border-block-end: 2px solid var(--rule);
}
.detail-figs .fig { padding: 0; }
.score-line { margin-block-start: var(--sp-4); font-size: var(--t--1); color: var(--ink-2); }
/* No cap. At 1160px of measure the 980px cap stopped the six bars 204px short
   of the 2px rule that spans the page above them, so the block read as
   left-aligned inside its own container rather than set on the grid. */
.detail-rules { padding-block: var(--sp-5); }
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

/* THE CONTRACT IS KEY/VALUE DATA, SO IT IS SET AS A TABLE.
 *
 * Round 1 stopped this block clipping by wrapping it ('white-space:pre-wrap'),
 * which traded a visible defect for a silent one: in a 354px column every
 * continuation line landed flush at the KEY column, so 'record-fields
 * schema_version methodology_version repo scanned_at scanner' wrapped to a
 * line reading 'request_issue controls score' — which parses as a key and a
 * value, two lines under the real key 'methodology-version  2'. On a
 * byte-precision signing contract a reader could not tell a key from the tail
 * of a value, and nothing on the page said so.
 *
 * A hanging indent cannot fix it: 'text-indent' applies to the first line of a
 * BLOCK, and a forced break inside a <pre> does not restart it ('each-line' is
 * not supported here). So the twelve lines are parsed out of CONTRACT_TEXT —
 * the same bytes, never retyped — and set as rows. The slab keeps its ink
 * ground and mono face at desk width; below 760px the key becomes a label line
 * above its value, which is the one arrangement that cannot be misread.
 */
table.contract-table {
  inline-size: 100%; border-collapse: collapse;
  background: var(--ink); color: var(--paper-2);
  border: 2px solid var(--rule); margin-block: var(--sp-4);
  font-family: var(--mono); font-size: var(--t--2); line-height: 1.6;
}
.contract-head {
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--paper-2); text-align: start;
  padding: var(--sp-3) var(--sp-4); border-block-end: 1px solid #4A443C;
}
table.contract-table td { padding: 2px var(--sp-4); vertical-align: top; }
table.contract-table tbody tr:first-child td { padding-block-start: var(--sp-3); }
table.contract-table tbody tr:last-child td { padding-block-end: var(--sp-3); }
table.contract-table .ct-key { color: #B9B1A5; white-space: nowrap; inline-size: 1%; }
table.contract-table .ct-val { color: var(--paper-2); overflow-wrap: anywhere; }

/* The class column was ~145px, so 'A′ — static audits of committed workflows'
   set on four lines and pushed the prime mark onto a line of its own — which
   makes A and A′ harder to tell apart, the exact distinction the table exists
   to draw. There is room at 1160px; the third column does not need to be the
   widest. */
@media (min-width: 761px) {
  table.cls-table { table-layout: fixed; }
  /* rem, not ch: a 'ch' on a <th> resolves against the TH's own 11px mono face,
     so '22ch' came out at the same 145px the column already had and the fix
     measured as a no-op. */
  table.cls-table th:nth-child(1) { inline-size: 20rem; }
  table.cls-table th:nth-child(2) { inline-size: 19rem; }
}

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

/* font-weight 400 for the same reason .repo-title carries it: only Anton's 400
   face is loaded, and the UA's <h2> bold was a synthetic-bold risk standing one
   browser default away from a smeared heading. */
.controls-title {
  font-family: var(--display); font-weight: 400; text-transform: uppercase;
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
/* A band is ONE rule-and-label line. Set as running text the count broke onto
   a second line in four of the six bands at phone width ("PHASE 4 — CODE &
   BUILD HARDENING" / "7 CHECKS"), which turns a divider into a two-line block;
   the band is laid out as a row at phone width, below. */
.ph-count {
  color: var(--ink-3); letter-spacing: 0.1em; margin-inline-start: var(--sp-3);
  white-space: nowrap;
}
/* A phase the taxonomy names and this record has nothing for. Printed, because
   the hero band prints its bar; quiet, because there is nothing under it. */
tr.ph-empty td { color: var(--ink-3); border-block-end: 1px dashed var(--hair); }

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
  display: inline-flex; align-items: center;
  font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--ink-3); margin-inline-end: var(--sp-2);
}
/* The phone gets the short word, the desk gets the sentence — one of the two
   is always hidden, never both. Hiding the label outright (which this did) left
   a bare row reading "P1 P2 P3 P4 P5 P6" above a table, which a thumb reads as
   column headings; the ONE navigation aid on a 12,000px page was invisible as a
   control, and only the desktop reader — who got both the label and a hover
   underline — was ever told it existed. */
.ctl-label-short { display: none; }
/* A RESTING AFFORDANCE, because a phone can never fire :hover. The underline
   was there all along and painted transparent until a pointer arrived. */
.ctl-jump {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; min-inline-size: 44px; padding-inline: var(--sp-2);
  font-family: var(--mono); font-size: var(--t--2); letter-spacing: 0.06em;
  text-decoration: none; color: var(--ink-2); border-block-end: 2px solid var(--hair);
}
.ctl-jump:hover { color: var(--hot); border-block-end-color: var(--hot); }
.ctl-hide {
  display: inline-flex; align-items: center; gap: var(--sp-2); cursor: pointer;
  min-block-size: 44px; margin-inline-start: auto; padding-inline: var(--sp-2);
  font-family: var(--mono); font-size: var(--t--2); color: var(--ink-2);
}
/* A return path from inside a 12,000px table, in the strip that is already
   sticky — cheaper than a second bar of permanent chrome, which is what a
   sticky masthead would have cost every page on the site. */
.ctl-top {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; padding-inline: var(--sp-2); flex: 0 0 auto;
  font-family: var(--mono); font-size: var(--t--2); letter-spacing: 0.08em;
  text-transform: uppercase; text-decoration: none; color: var(--ink-2);
  border-block-end: 2px solid var(--hair);
}
.ctl-top:hover { color: var(--hot); border-block-end-color: var(--hot); }
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
/* THE RAW VERDICT IS CONTEXT, EXCEPT WHERE IT IS TENSION. All 27 of these wore
   the accent family against 44 rows: 11 on rows the sheet already greys out as
   out-of-scope, 6 where raw and final both say pass. Louder than the ink-filled
   PASS chip beside them, which is the hierarchy upside down, and at 390 they
   made a red rail down the right edge of the table. Hairline by default; the
   accent only where a verdict actually changed inside the scored scope. */
.raw {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  color: var(--ink-3); border: 1px dashed var(--hair); padding: 1px 5px;
  margin-inline-start: var(--sp-2);
}
.raw-changed { color: var(--rust); border-color: var(--rust); }
.reason { color: var(--ink-2); font-size: var(--t--1); display: inline; }
/* The evidence fold. summary{display:inline-flex} in the shared layer
   suppresses the disclosure marker, so 42 rows ended in the bare word
   "evidence" on a line of its own — a dead label, not a control. It gets the
   marker back, an underline, a count, and a seat on the same line as the
   detail it belongs to. */
/* The disclosure gets a FIXED HOME. Inlined at the end of flowing prose it
   landed at a different x on every row and left two-character widows
   ("…that can exist for / it ▸ EVIDENCE (6)"), so the one element in a
   fifty-four-row list a thumb is hunting for was the one with no consistent
   position. A block start means every row's evidence begins on the same edge. */
table.controls details { display: block; margin-block-start: 0; }
table.controls td.c-detail { text-wrap: pretty; }

/* The reclassification notes. Four rationales covered 25 of 44 rows, two of
   them three lines long, printed verbatim every time — the "decorates where it
   should scan" defect the directory was cured of, still standing on the page
   whose table is six times longer. Each prints once here, under the KEY; the
   row keeps its leading clause and a link. */
.rc-notes {
  list-style: none; margin: 0 0 var(--sp-5); padding: 0 0 var(--sp-4);
  display: grid; gap: var(--sp-3);
  border-block-end: 1px solid var(--hair);
}
.rc-notes li {
  font-size: var(--t--2); line-height: 1.55; color: var(--ink-2);
  max-inline-size: 84ch; border-inline-start: 2px solid var(--rule);
  padding-inline-start: var(--sp-3); scroll-margin-block-start: 96px;
}
.rc-notes li:target { background: var(--paper-2); border-inline-start-width: 6px; }
.rc-no {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--paper-2);
  background: var(--ink); padding: 1px 6px; margin-inline-end: var(--sp-2);
}
.rc-ell { color: var(--ink-3); }
/* .reason a already claims a 13px inline pad two hundred lines up and wins on
   specificity, which left this 43px — one pixel under the floor. */
.reason a.rc-ref, a.rc-ref {
  display: inline-block; padding-block: 14px; font-family: var(--mono);
  font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--ink-2); text-decoration: underline;
  text-decoration-color: var(--hair); text-underline-offset: 3px;
}
.reason a.rc-ref:hover, a.rc-ref:hover { color: var(--hot); text-decoration-color: var(--hot); }
/* THE FIRST BASELINE OF EVERY CELL IN A ROW AGREES — that is what makes a
   ruled table read as a ledger. The fold's 12px of leading padding put
   "EVIDENCE (n)" about 15px below the control name and the verdict chip beside
   it, and on the rows with no detail text at all (branch-protection,
   actions-audit, octo-sts, harden-runner…) it floated alone in an otherwise
   empty band, which reads as a paragraph that failed to render. The 44px tap
   area is kept — it just hangs BELOW the text now instead of pushing it down. */
table.controls summary {
  display: list-item; list-style: disclosure-closed inside; min-block-size: 0;
  cursor: pointer; font-family: var(--mono); font-size: var(--t--2);
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink);
  text-decoration: underline; text-underline-offset: 3px;
  padding-block: var(--sp-1) var(--sp-5);
}
/* …and where there IS a reason above it, the fold gets its breathing room back
   from the text rather than from the cell's top edge. */
table.controls .reason + details { margin-block-start: var(--sp-1); }
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
/* STICKY AT EVERY WIDTH, not only on a phone. The mobile build got a sticky
   single-row strip in round 2 and the desk did not, so the width where a
   reader is most likely to be SCANNING rather than reading was the one with no
   return path on an 18,900px document — the eight pills appeared once at the
   top and were then eighteen thousand pixels away. The phone treatment is the
   right treatment; it is simply lifted to all widths here, short labels
   included, which is what lets eight destinations plus a way back fit one row
   at 1160px instead of wrapping into two. */
.sec-index {
  position: sticky; inset-block-start: 0; z-index: 20;
  display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 0;
  background: var(--paper);
  border-block: 2px solid var(--rule);
  padding-block: 0; scrollbar-width: none;
}
.sec-index::-webkit-scrollbar { display: none; }
.sec-index a {
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.08em; text-decoration: none; color: var(--ink-2);
  border: none; border-block-end: 2px solid transparent; white-space: nowrap;
  padding: 6px var(--sp-3);
  display: inline-flex; align-items: center; min-block-size: 44px;
}
.sec-index a:hover { color: var(--hot); border-block-end-color: var(--hot); }
/* The strip said where you COULD go and never where you ARE. Across all
   thirty-eight phone slices — including the ones deep inside section 07 — it
   read "01 PROTOCOL 02 THREATS 03 SCORECARD", pinned left, unchanged. The
   current section is filled INK rather than accent: it survives greyscale, it
   does not spend the one hot colour on a position, and it cannot be confused
   with the masthead's active page. */
.sec-index a[aria-current="true"] {
  background: var(--ink); color: var(--paper-2); border-block-end-color: var(--ink);
}
.sec-index a[aria-current="true"]:hover { background: var(--hot); border-block-end-color: var(--hot); color: #fff; }
.sec-top {
  flex: 0 0 auto; border-inline-end: 1px solid var(--hair);
  margin-inline-end: var(--sp-2);
}
/* Eight titles will not fit a phone and they do not fit a 1160px column
   either, so the strip carries the SHORT titles at every width — ordinals
   alone would fit and say nothing. The long title stays the anchor's text, so
   the accessible name and the page's own headings still agree. */
.sec-index a .si-long { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* It scrolls, so it says so — the same edge shadow the tables use. */
.sec-index {
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

.method-section { padding-block: var(--sp-6); border-block-end: 1px solid var(--hair); position: relative; }
/* THE RIGHT HALF OF THE PAGE WAS EMPTY FOR FIVE CONSECUTIVE SCREENS. A 72ch
   measure inside a 1160px column is the right measure and the wrong
   composition: section 07 alone ran ~6,000px of prose with nothing beside it —
   no rule, no eyebrow, no marginalia — which is the single strongest
   "unfinished" tell a poster grid has.
   A broadsheet answers this with a running head, so that is what goes there:
   the section's ordinal at poster scale and its title in mono caps, pinned
   beside the reader for the whole section. It is apparatus, not content — the
   sec-head above states both already — so it is aria-hidden and it never
   appears where the column is needed for the text. */
.sec-rail { display: none; }
@media (min-width: 1100px) {
  .method-section:has(> .sec-rail) { padding-inline-end: calc(13rem + var(--gut)); }
  /* THE RAIL STARTS UNDER THE BAND, WHICH IS WHAT THE BAND IS FOR.
     The second half of the struck-through numeral, and the one the rail's own
     rule was hiding. '.sec-head' deliberately spans the FULL page width (see
     the negative inline-end margin below) — 'full-width rule, then two columns
     under it'. But the rail was inset from the section's CONTENT top, which is
     the head's own top, so the folio started level with the head rather than
     under it and the band's 2px rule ran straight through the ghost numeral.
     Measured at 1440: the band at y=1104 crossing a numeral spanning
     1069-1128, i.e. 59.3% down the glyph.

     The head is one flex line of clamped type, measured at exactly 51px from
     1100px through 2560px, plus its 16px block-end margin = 67px. 'var(--sp-8)'
     is 72px, so the rail clears it with the offset taken from the scale rather
     than from a sampled literal. Over-shooting costs nothing — the rail sticks
     at 96px a moment later either way — and the ONE change that would bring
     the collision back is a section title long enough to wrap the head onto a
     second line. If a title grows, re-run the crossing check (every border
     that spans the numeral horizontally, at 1100/1280/1440/1920/2560) rather
     than eyeballing it: at 1440 the overlap was four pixels. */
  .sec-rail {
    display: block; position: absolute; inline-size: 13rem;
    inset-inline-end: 0;
    inset-block-start: calc(var(--sp-6) + var(--sp-8));
    inset-block-end: var(--sp-6);
    pointer-events: none;
  }
  /* THE RULE MUST NOT CROSS THE NUMERAL — AND THE REASON IT DID IS display.
     'sec-rail-in' is a <span> carrying two block children, and nothing here
     ever blockified it: 'position: sticky' does NOT (only absolute and fixed
     do). So it stayed an INLINE box broken up by its own block children, where
     vertical padding and a block-start border contribute nothing to layout.
     Its 12px of padding had simply never existed, the 2px rule was painted on
     an empty first fragment sitting exactly at the numeral's box top, and
     Anton at line-height .82 overshoots that top by 2.4px — so the rule landed
     INSIDE the glyph on all eight sections. Measured at 1440 before: ink top
     873.3 against a rule at 875.8-877.8, 4.4px of overlap.

     Raising the padding alone would have changed nothing, which is how this
     survived a round of fixing. 'display: block' is the fix; the padding then
     does what it always said it did, and the tight 0.82 poster setting is kept
     because it was never the fault. Clearance is now 'padding - 2.4px'.
     Re-measure against section 07 — its two-line title makes the rail
     tallest — whenever the face, the size or the line-height changes. */
  .sec-rail-in {
    display: block;
    position: sticky; inset-block-start: 96px;
    border-block-start: 2px solid var(--rule); padding-block-start: var(--sp-3);
  }
  .sec-rail-num {
    display: block; font-family: var(--display); font-weight: 400;
    font-size: 4.5rem; line-height: 0.82; color: var(--hair);
    font-variant-numeric: tabular-nums;
  }
  .sec-rail-title {
    display: block; margin-block-start: var(--sp-3);
    font-family: var(--mono); font-size: var(--t--3); text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--ink-3);
  }
  /* The BAND still spans the page. Held inside the text column its 2px rule
     stopped 240px short of every other rule on the page, which reads as the
     column being the page rather than as a column on it. Full-width rule,
     then two columns under it — which is the arrangement a broadsheet has
     always used for a running head. */
  .method-section:has(> .sec-rail) > .sec-head {
    margin-inline-end: calc(-1 * (13rem + var(--gut)));
  }
}
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
/* SUBHEADS GET THE PAGE'S OWN ANATOMY. Section 07 alone runs six thousand
   pixels of an eighteen-thousand-pixel document, and its subheads were set in
   the body face at 19-22px — so the longest stretch of the site's longest page
   read as a plain web article dropped inside a poster grid, with none of the
   ruled display type every H2 above it carries. Anton, uppercase, 400 (the only
   face loaded), over a hard rule: the same anatomy, one step down. */
.method-section h3, .prose h3 {
  font-family: var(--display); font-weight: 400; letter-spacing: 0.01em;
  font-size: clamp(1.15rem, 0.85rem + 1.1vw, 1.65rem); line-height: 1.05;
  text-transform: uppercase; color: var(--ink);
  margin-block: var(--sp-6) var(--sp-3);
  border-block-start: 2px solid var(--rule); padding-block-start: var(--sp-3);
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
/* THE HOT RULE MARKS A CONTRADICTION, NOT AN IMPORTANT PANEL. This panel wore
   the identical 8px hot rule the repo sheet gives "What the evidence merge
   found", where it genuinely means two verified sources disagreed — so one
   token meant "read this first" on one page and "these sources conflict" on
   the next. The anchor panel keeps its extra weight; it takes it in ink. */
.honesty {
  margin-block: var(--sp-6); padding: var(--sp-5);
  background: var(--paper-2); border: 2px solid var(--rule);
  border-inline-start-width: 8px; border-inline-start-color: var(--ink);
  display: grid; grid-template-columns: minmax(140px, 2fr) minmax(0, 7fr);
  gap: var(--sp-3) var(--gut);
}
.honesty-head {
  grid-column: 1; font-family: var(--mono); font-size: var(--t--2);
  text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink);
}
/* THE MEASURE, ON THE ONE PANEL THAT GOT MISSED. Every other prose block in
   this stylesheet is capped — '.prose p' at 72ch, '.cmp-note' at 62ch, and
   '.formula-slab' was given 72ch for precisely this reason. This one was not,
   so 'grid-column: 2' of the 7fr track filled 834px and set the statement the
   whole site rests on at 107 characters per line. Measured at 1440 before:
   x=440 to x=1274, opening line 107 characters. The 7fr track stays — the cap
   does the work, and the panel's right edge becomes intentional margin rather
   than an overrun measure. */
.honesty-body {
  grid-column: 2; color: var(--ink-2); line-height: 1.6;
  max-inline-size: 62ch;
}

/* Four short mono lines set as a 1156px slab beside 72ch of prose made the
   page's least text-heavy element its widest. Same treatment the one-line
   commands already have. */
.formula-slab {
  background: var(--ink); color: var(--paper-2); border: 2px solid var(--rule);
  overflow-x: auto; max-inline-size: 72ch;
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
/* 62ch, because the note column ran ~90 characters at 13px while the column
   beside it ragged to three lines at ~32. Capping the note here rather than on
   the cell is deliberate: a max-inline-size on a <td> is ignored by table
   layout, and this <div> is a real block. */
.cmp-note {
  margin-block-start: var(--sp-2); color: var(--ink-3);
  font-size: var(--t--2); line-height: 1.45; max-inline-size: 62ch;
}
.cmp-footnote { color: var(--ink-3); font-size: var(--t--2); }
.cmp-table { min-inline-size: 760px; }
/* Only the FOUR-column comparison, told apart by the data-coverage its rows
   carry — the three-column "what sscsb checks that Scorecard cannot" table
   beside it would have had its Checks column squeezed by the same numbers. */
@media (min-width: 761px) {
  table.cmp-table:has(tbody tr[data-coverage]) { table-layout: fixed; }
  table.cmp-table:has(tbody tr[data-coverage]) th:nth-child(1) { inline-size: 18%; }
  table.cmp-table:has(tbody tr[data-coverage]) th:nth-child(2) { inline-size: 30%; }
  table.cmp-table:has(tbody tr[data-coverage]) th:nth-child(3) { inline-size: 12%; }
}

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
/* IT IS NOT FIXED ANY MORE, AND THAT IS THE WHOLE FIX.
   A fixed overlay is measured over body text at SOME scroll position on every
   page, and two rounds of shrinking it did not change that. Round 1: two rows,
   370x98, standing on the grade slab and on the first listing's score line at
   every scroll position. Round 2: a 174x48 chip that still painted over nine
   separate text runs in the Scorecard comparison between scrollY 8100 and
   9900, cut the last glyph of ALL ANSWERED CHECKS PASSED on the repo sheet,
   and on a phone covered "100% passed · coverage 90.9%" outright at rest.
   --switcher-clearance reserves room at the END of a document; nothing it
   can do protects the MIDDLE of one.
   So the strip is set in the colophon, in the flow, where a broadsheet prints
   its apparatus. It covers nothing at any width or any scroll position, the
   label comes back because there is now room for it, and the navigation a long
   page actually needs — the sticky section index, the jump-to-phase bar, the
   colophon's own back-to-top — is navigation that was built for the job. */
.design-switcher {
  position: static; z-index: auto;
  /* The wrap MINUS its padding, so the hairline above it starts and ends on
     exactly the same x as the colophon line it sits under. */
  inline-size: calc(100% - 2 * var(--pad));
  max-inline-size: calc(var(--wrap) - 2 * var(--pad));
  margin: 0 auto; padding: var(--sp-3) 0 var(--sp-5);
  display: flex; align-items: center; gap: 0 var(--sp-1); flex-wrap: wrap;
  background: transparent; border: none;
  border-block-start: 1px solid var(--hair);
  font-family: var(--mono); font-size: var(--t--3);
}
.design-switcher .ds-label {
  display: inline-flex; align-items: center; min-block-size: 44px;
  text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink-3);
  padding-inline-end: var(--sp-3); white-space: nowrap;
}
.design-switcher a {
  display: inline-flex; align-items: center; justify-content: center;
  min-block-size: 44px; padding-inline: var(--sp-3);
  color: var(--ink-2); text-decoration: none; text-transform: uppercase;
  letter-spacing: 0.06em; white-space: nowrap;
  border-block-end: 2px solid transparent;
}
.design-switcher a:hover { color: var(--hot); border-block-end-color: var(--hot); }
/* The same mark the masthead's active item takes — one accent, one meaning. */
.design-switcher a[aria-current="true"] { color: var(--hot); border-block-end-color: var(--hot); }

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
  /* ---------- THE SMALLEST STEP IS RAISED, AND DARKENED, ON A PHONE ----------
     11px was doing too much load-bearing work here. Measured live at 390 across
     all four pages: 'raw' x18, 'oos' x13, 'oc-chip' x17 and 'th' x3 on the repo
     sheet; 'cmp-risk' x20, 'th' x15 and 'tx-q-groups' x54 on the methodology;
     the phase-bar labels 'pr-name'/'pr-pct' x11 on the home slab — 157 elements
     on the repo page alone. Most of them sat at --ink-3 on paper: 4.70:1, which
     clears AA by 0.20 and is fine on a 1440 desktop. But these are the chips a
     reader scans for VERDICT STATE on a phone held at arm's length, and they
     were simultaneously the smallest and the palest type on the page.

     Two token overrides do the whole job, and they are tokens rather than a
     list of selectors on purpose: a selector list is a claim about SPELLING
     that goes stale the first time a new chip is added, while --t--3 is used
     39 times and a new chip inherits the floor for free.

       --t--3  11px -> 12px  (one notch; --t--2 stays 13px so the ramp stays
                              monotonic and nothing on the scale inverts)
       --ink-3 #6E675C -> #5C564C  (4.70:1 -> 6.11:1 on paper)

     Desktop keeps 11px and the lighter grey: at reading distance on a large
     screen the quieter value is the better composition, and it is not where
     this was failing. */
  :root {
    --t--3: 0.75rem;
    --ink-3: #5C564C;
  }
  /* THE em COMPOUNDING STOPS HERE, AS AN EFFECT AND NOT AS A LIST. 'code' is
     0.9em of its parent, which is right in running prose — mono runs optically
     large beside the body face — and wrong the moment a 'code' lands inside a
     box already set at the smallest step. Measured at 390 before: the control
     identifiers in the restacked question cards rendered at 9.9px, 54 of them,
     the smallest text anywhere on the site. 'max()' states the floor once:
     nothing nested, however deep, can take mono below 12px, and every 'code'
     inside a 14px-or-larger parent keeps its 0.9em optical match untouched. */
  code { font-size: max(0.9em, 0.75rem); }

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
  /* The contract, key ABOVE value. This is the arrangement a wrapped <pre>
     could not produce and the reason the block is a table at all. */
  table.contract-table, table.contract-table thead, table.contract-table tbody,
  table.contract-table tr, table.contract-table td,
  table.contract-table th { display: block; inline-size: 100%; }
  table.contract-table tr { padding: var(--sp-2) var(--sp-4); }
  table.contract-table tbody tr + tr { border-block-start: 1px solid #332E28; }
  table.contract-table td,
  table.contract-table tbody tr:first-child td,
  table.contract-table tbody tr:last-child td { padding: 0; }
  table.contract-table .ct-key { inline-size: auto; white-space: normal; letter-spacing: 0.08em; text-transform: uppercase; font-size: var(--t--3); }

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
  /* Explicit rows. DOM order is id / question / groups; the QUESTION leads —
     it is the reason the row exists, and 54 cards that spent their first line
     on an identifier and a group code made the reader read the label before
     the content every time. The id and the groups sit under it as one quiet
     mono line. */
  table.tx-q-table td:nth-child(2) { grid-row: 1; grid-column: 1 / -1; color: var(--ink); }
  /* THE IDENTIFIER OUTRANKS THE GROUP CODE. 'ai-trailers' is the datum a reader
     looks UP; 'A1 A6' is the datum they skim past — and the restack had them
     the wrong way round, the id at 9.9px in the muted token under group codes
     at 11px. The id is this row's name, so it is set a step ABOVE the groups
     and in ink: 13px ink against 12px muted. Absolute steps from the scale, not
     'em', so no future nesting can shrink either of them again. */
  table.tx-q-table td:nth-child(1) {
    grid-row: 2; grid-column: 1; font-family: var(--mono);
    font-size: var(--t--2); color: var(--ink);
  }
  table.tx-q-table td:nth-child(1) code {
    font-size: 1em; font-weight: 500; color: var(--ink);
  }
  table.tx-q-table td:nth-child(3) {
    grid-row: 2; grid-column: 2; text-align: end;
    font-size: var(--t--3); color: var(--ink-3);
  }
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

  /* THE JUMP STRIP WRAPS, IT DOES NOT SCROLL. As one scrolling row it held
     558px of content in a 358px box, so the single control that changes what
     the table shows — worth 13 rows and 1,646px of page — sat 200px
     off-screen reading "Hide th", riding the top of an 11,817px page behind a
     14px fade. A sticky strip that fights vertical scroll to reveal its own
     purpose is not a control. Two rows cost ~92px of sticky and every word is
     legible; the anchors below are re-offset to match. */
  .ctl-bar {
    flex-wrap: wrap; overflow-x: visible; row-gap: 0;
    padding-block: 0; background-image: none;
  }
  /* "Jump to phase" is 109px of a 358px strip that also has to hold six 44px
     pills; "Phase" is 44px and says the same thing above them. */
  .ctl-label-long { display: none; }
  .ctl-label-short { display: inline; }
  .ctl-bar-label { margin-inline-end: var(--sp-1); letter-spacing: 0.12em; }
  .ctl-jump { flex: 0 0 auto; padding-inline: var(--sp-1); }
  .ctl-hide {
    flex: 1 1 auto; margin-inline-start: 0; padding-inline: 0;
    white-space: normal; min-block-size: 44px;
    border-block-start: 1px solid var(--hair);
  }
  .ctl-top { border-block-start: 1px solid var(--hair); border-block-end: none; }
  table.controls tr[id], .rc-notes li { scroll-margin-block-start: 96px; }

  /* A band is one line: phase on the left, count hard right. */
  table.controls tr.ph-head td {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: var(--sp-2); flex-wrap: nowrap;
  }
  .ph-count { flex: 0 0 auto; }
  /* The UNVERIFIED chip and the dashed "raw: degraded" chip claimed the rest of
     the line and broke 'signing-model' mid-name. The identifier is the row's
     name; the chips can take the line below it. */
  table.controls td.c-control { display: flex; flex-wrap: wrap; gap: var(--sp-1); }
  table.controls td.c-control code { flex: 1 0 100%; overflow-wrap: normal; word-break: keep-all; }

  /* Six phase names in a ~90px label column wrapped five of the six onto two
     lines. On a phone the bar does not need to sit beside its name — the name
     takes the line, the bar takes the full measure under it. */
  .detail-rules .prule {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "name pct" "bar bar";
    row-gap: var(--sp-1); align-items: baseline;
  }
  .detail-rules .pr-name { grid-area: name; overflow-wrap: normal; }
  .detail-rules .pr-pct { grid-area: pct; }
  .detail-rules .pr-bar, .detail-rules .pr-bar-none { grid-area: bar; }

  /* The stale-methodology flag reads as a flag on its own line, not as
     punctuation dropped mid-rule. */
  .repo-meta > .meta-stale { flex: 1 0 100%; margin-block-start: var(--sp-1); }
}

@media (max-width: 420px) {
  .slab-nums { gap: var(--sp-4); }
  .btn, .btn-outline { inline-size: 100%; }
  .btn-row { flex-direction: column; align-items: stretch; }
  /* MAKE THE LONG TOKEN FIT RATHER THAN BREAK IT. overflow-wrap:anywhere
     stopped the re-verify command clipping, but it split the signing principal
     mid-character — "…users.noreply.github.co / m" — in the one block whose
     entire purpose is "check this yourself". At 11px Plex Mono the 38-character
     principal is ~250px inside a 302px box, so it fits whole, and the backslash
     continuations still do the breaking. It also lets more of the local-lane
     contract's key/value lines survive without wrapping at all. */
  .cov-cmd, .prose pre.cov-cmd { font-size: var(--t--3); line-height: 1.6; }
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

/* The "already listed" row is the one place the front page asks the reader to
   act, and it ragged at both widths — the eyebrow orphaned inline with the
   first chip at 390, one chip alone on a second row at 1440. Every other
   eyebrow on this site sits on its own line above a ruled block. */
:root .hp-chips { display: flex; flex-wrap: wrap; align-items: stretch; gap: var(--sp-2); }
:root .hp-chips .hp-chips-label { flex: 1 0 100%; margin-block-end: var(--sp-1); }
:root .hp-chips .hp-chip { flex: 1 1 150px; justify-content: center; min-block-size: 44px; }

/* THE GLOSSARY IS SET IN COLUMNS, which is what a broadsheet does with six
   definitions under a rule. Held to 70ch by the shared layer it drew 522px of
   the densest prose on the page and left 718px of blank paper beside it,
   directly under a full-width 2px rule and immediately below a KEY that IS
   properly laid out. column-width rather than column-count: one flow on a
   phone, two at tablet, three at desk, all of them a comfortable measure. */
:root .key-note {
  max-inline-size: none; column-width: 52ch; column-gap: var(--gut);
  column-rule: 1px solid var(--hair);
}
/* 34ch gave FOUR columns at desk width, so a column opened mid-sentence twice
   and the block's bottom edge ragged five lines against seven. 52ch gives two,
   which is one break instead of three and a measure a reader can hold. The
   terms are what a reader arrives hunting for — "what does unverified mean" —
   so each one is ruled rather than buried in the grey. */
:root .key-note .term { border-block-end: 2px solid var(--ink); }

/* Ten ruled boxes, each 1160px wide with its text stopping at 714-765px, run
   one under another for ~2,800px: on a poster grid a 2px-ruled box that fills
   half its own width is the strongest "template" tell available. Two up, and
   the ninth — odd and last — takes the measure rather than leaving a hole. */
@media (min-width: 1000px) {
  :root .tx-classes {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: var(--gut);
  }
  /* Nine boxes in two columns leaves the ninth alone on its row. Spanning it
     made that visible rather than hidden — a 1160px box whose content stops at
     ~540px, the grid's own arithmetic on display — so where it has to span, it
     uses the width it takes. */
  :root .tx-classes > .tx-class:last-child:nth-child(odd) {
    grid-column: 1 / -1; column-width: 34ch; column-gap: var(--gut);
  }
  :root .tx-classes > .tx-class:last-child:nth-child(odd) > * { break-inside: avoid; }
}
/* Nine items fill three columns exactly, so at the width where there is room
   for it there is no orphan to compose around at all. */
@media (min-width: 1240px) {
  :root .tx-classes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  :root .tx-classes > .tx-class:last-child:nth-child(odd) { grid-column: auto; column-width: auto; }
}

/* THE SAME CLOSING SENTENCE UNDER ALL NINE GROUPS. "That is not the same as
   being safe from this group." is the panel's caveat, and the panel intro two
   lines above already carries it; nine verbatim copies flatten the rhythm of
   the best-composed block on the page and cost ~360px on a phone. It is shown
   ONCE, under the last group, where it reads as the footnote it is.
   (The selector picks exactly this sentence: it is the only .ex-detail-quiet
   with no .ex-detail-label inside it. The sentence itself lives in
   threats-shared.ts, which four other designs render — the proper fix is
   there, and it is in sharedFileProposals.) */
:root .ex-list > .ex-row:not(:last-child) .ex-detail-quiet:not(:has(.ex-detail-label)) {
  display: none;
}
:root .ex-list > .ex-row:last-child .ex-detail-quiet:not(:has(.ex-detail-label)) {
  margin-block-start: var(--sp-2); padding-block-start: var(--sp-2);
  border-block-start: 1px solid var(--hair);
}

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

/* ONE WIDGET CLASS, ONE TREATMENT. The directory's coverage checkbox kept
   appearance:auto, so it drew the native control — a 20x20 white-filled,
   1px grey, ROUNDED box, and system blue when checked. That made it the only
   rounded corner, the only pure-white fill and the only 1px border on a page
   whose stated rule is hard 2px rules and no rounded-card soup, on the site's
   index page — while the repo sheet's equivalent fold drew a hard ink square
   correctly. This is that square, ported. accent-color is belt and braces for
   any engine that ignores appearance:none on a checkbox. */
:root .dir-check input[type="checkbox"] {
  appearance: none; -webkit-appearance: none;
  inline-size: 20px; block-size: 20px; flex: 0 0 auto; margin: 0;
  border: 2px solid var(--rule); border-radius: 0; background: var(--paper-2);
  display: inline-grid; place-content: center; cursor: pointer;
  accent-color: var(--hot);
}
:root .dir-check input[type="checkbox"]::after {
  content: ""; inline-size: 10px; block-size: 10px; background: var(--paper-2);
}
:root .dir-check input[type="checkbox"]:checked::after { background: var(--ink); }
:root .dir-check input[type="checkbox"]:focus-visible { outline: 3px solid var(--hot); outline-offset: 2px; }

/* THE PHONE AND THE DESKTOP SHOW THE SAME PAGE, NOT TWO READINGS OF IT.
   A phone met two dashed "nothing here yet" panels back to back — 644px, 12%
   of the page, both ending in the same link. Round 4 answered that in CSS, by
   clip-pathing the second panel's eyebrow and heading away and welding the two
   dashed boxes into one. That produced a worse fault than the one it fixed:
   the second panel's copy ("…ordering them by date would be ordering noise")
   then rendered under the heading TOP RATED, where it is a non-sequitur, while
   a screen reader still heard the correct two-section structure. The two
   widths disagreed about what the page contained.

   'home.ts' now renders a single honest panel for that state —
   '.hp-panel-merged', one eyebrow, one heading, both sentences, one link — and
   this is the swap. Exactly one structure is in the document at each width,
   'display: none' rather than a clip, so what is seen and what is announced
   are the same page. The merged panel exists in the markup only when BOTH
   panels are waiting, so above 760px it is simply never displayed. */
.hp-panel-merged { display: none; }
.hp-panel-merged .hp-waiting-copy + .hp-waiting-copy { margin-block-start: var(--sp-3); }
/* The panel line is what separates a heading from its dashed box on the two
   panels this replaces, and below 760px that line is suppressed — so with no
   standfirst of its own the Anton heading sat directly on the border. */
.hp-panel-merged > .hp-waiting { margin-block-start: var(--sp-4); }

@media (max-width: 760px) {
  :root .hp-panel:has(> .hp-waiting) .hp-panel-line { display: none; }

  :root .hp-panels > .hp-panel-merged { display: block; }
  /* Its presence in the document is the signal that both of the pair are
     waiting, so the pair itself is what gets suppressed — no :has() chain, no
     row of selectors that has to stay in step with what the template emits. */
  :root .hp-panels:has(> .hp-panel-merged) > #top-rated,
  :root .hp-panels:has(> .hp-panel-merged) > #recently-scanned { display: none; }

  /* Two 150px chips per row leaves the third spanning the full width with its
     label centred — three boxes, three shapes and two text alignments directly
     under the hero. The register promises one column on a phone. */
  :root .hp-chips .hp-chip { flex: 1 0 100%; justify-content: flex-start; padding-inline: var(--sp-3); }
}

/* ---------- the switcher, shaped against the shared layer ---------- */
/* The shared layer styles a FLOATING box: a 100vw cap, wrapping, and its own
   tap floor. In the colophon none of that applies — see the block in CSS above
   for why it is no longer floating at all. */
:root .design-switcher {
  position: static; flex-wrap: wrap;
  inline-size: calc(100% - 2 * var(--pad));
  max-inline-size: calc(var(--wrap) - 2 * var(--pad));
  padding: var(--sp-3) 0 var(--sp-5);
}
:root .design-switcher a { padding: 0 var(--sp-3); min-block-size: 44px; }
/* No overlay, nothing to clear. The shared rule reserves a band at the end of
   every page for a fixed switcher to sit in; this one sits in the colophon,
   and an empty 68px strip below the footer rule is just a hole. */
:root body { padding-block-end: 0; }
`;
