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
 * MOBILE IS A CORRECTNESS TARGET, NOT A COURTESY. Below 760px the directory
 * and the control table restack into labelled blocks (`td::before` prints the
 * `data-label` each cell carries), because a broadsheet row on a 390px screen
 * is either a sideways-scrolling page or an unreadable squeeze, and the first
 * of those is a defect. Tables that cannot restack — the Scorecard comparison
 * and the every-check index, whose markup is shared across all designs — keep
 * their own scroller, and that scroller is given a VISIBLE affordance: an
 * always-drawn scrollbar plus the classic edge shadow that retracts at each
 * end, so a clipped table never looks like a finished one.
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
  --rust: #8A4418;
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
  display: inline-flex; align-items: center; min-block-size: 44px; gap: var(--sp-2);
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
table.method-table code { color: var(--hot); }

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
.cov-conflict { border-inline-start-color: var(--hot); }

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
.repo-title {
  font-family: var(--display); text-transform: uppercase;
  font-size: clamp(1.7rem, 1rem + 3.4vw, 3rem); line-height: 0.98;
  letter-spacing: 0.005em; overflow-wrap: anywhere;
}
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
.detail-rules { max-inline-size: 720px; padding-block: var(--sp-5); }

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

.cov-cmd {
  overflow-x: auto; background: var(--ink); color: var(--paper-2);
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
table.controls td { font-size: var(--t--1); }
table.controls .outcome { font-family: var(--mono); font-size: var(--t--2); white-space: nowrap; }
.oc-chip {
  display: inline-block; padding: 2px 7px; border: 1px solid currentColor;
  text-transform: uppercase; letter-spacing: 0.08em; font-size: var(--t--3);
}
tr.oc-pass .outcome { color: var(--ink); }
tr.oc-pass .oc-chip { background: var(--ink); color: var(--paper-2); border-color: var(--ink); }
tr.oc-fail .outcome { color: var(--hot); }
tr.oc-fail .oc-chip { background: var(--hot); color: #fff; border-color: var(--hot); }
tr.oc-gap .outcome { color: var(--rust); }
tr.oc-unverified .outcome { color: var(--ink-2); }
tr.oc-unverified .oc-chip { background: var(--hatch); }
tr.oc-info .outcome { color: var(--ink-3); }
tr.out-of-scope td { opacity: 0.55; }
.oos { font-family: var(--mono); font-size: var(--t--3); color: var(--ink-3); border: 1px solid var(--hair); padding: 1px 5px; }
.raw {
  display: inline-block; font-family: var(--mono); font-size: var(--t--3);
  color: var(--rust); border: 1px dashed var(--rust); padding: 1px 5px;
  margin-inline-start: var(--sp-2);
}
.reason { color: var(--ink-2); font-size: var(--t--1); }
table.controls details { margin-block-start: var(--sp-2); }
table.controls summary { cursor: pointer; font-family: var(--mono); font-size: var(--t--2); color: var(--ink); }
table.controls details ul { margin: var(--sp-2) 0 0; padding-inline-start: 18px; color: var(--ink-2); font-size: var(--t--2); }
table.controls details li { font-family: var(--mono); overflow-wrap: anywhere; }

/* ---------- methodology ---------- */
.sec-index {
  display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-4);
  margin-block-start: var(--sp-5);
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
.prose pre {
  overflow-x: auto; background: var(--ink); color: var(--paper-2);
  border: 2px solid var(--rule); padding: var(--sp-4); margin-block: var(--sp-4);
  font-family: var(--mono); font-size: var(--t--2); line-height: 1.7;
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

.tx-details summary {
  font-family: var(--mono); font-size: var(--t--2); text-transform: uppercase;
  letter-spacing: 0.1em; cursor: pointer; color: var(--ink);
}

/* ---------- design switcher (shared markup, styled here) ---------- */
.design-switcher {
  position: fixed; inset-inline-end: 12px; inset-block-end: 12px; z-index: 50;
  display: flex; align-items: center; gap: 0; flex-wrap: wrap;
  background: var(--paper-2); border: 2px solid var(--rule);
  padding: 3px; font-family: var(--mono); font-size: var(--t--3);
}
.design-switcher .ds-label {
  text-transform: uppercase; letter-spacing: 0.14em; color: var(--ink-3);
  padding-inline: var(--sp-2);
}
.design-switcher a {
  color: var(--ink-2); text-decoration: none; text-transform: uppercase;
  letter-spacing: 0.06em;
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
  .banner br { display: none; }
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
  table.directory td::before, table.controls td::before {
    content: attr(data-label); display: block; font-family: var(--mono);
    font-size: var(--t--3); text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-3); margin-block-end: var(--sp-1);
  }
  table.directory td.c-repo::before { display: none; }
  .c-grade { inline-size: auto; }
  .desc, .body-copy, .cov-note, .prose p, .prose li { max-inline-size: none; }
  .cprules { min-inline-size: 0; }
  .prule {
    grid-template-columns: minmax(80px, 9ch) minmax(0, 1fr) minmax(5.5ch, auto);
    gap: var(--sp-2);
  }
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
`;
