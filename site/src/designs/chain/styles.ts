/**
 * Chain — complete stylesheet. Single light theme, committed deliberately:
 * every surface paints an explicit background (sanctioned by the Design
 * contract). Tokens from the approved direction board; the amber/teal "ink"
 * variants exist because the raw accent hues fall short of AA for small
 * text — graphics keep the board colors, text uses the darkened inks.
 */
export const CSS = `/* Chain — chain-of-custody design. Light, spatial, diagram-led. */
:root {
  --ground1: #F6F8F7;
  --ground2: #EDF3F0;
  --card: #FFFFFF;
  --line: #DCE5E0;
  --line-soft: #ECF1EE;
  --ink: #14201C;
  --dim: #46564F;
  --accent: #0E8A72;
  --accent-ink: #0B6B59;
  --accent-tint: #E5F4EF;
  --warn: #D6742C;
  --warn-ink: #A9561A;
  --warn-tint: #FAEFE3;
  --fail: #B0402A;
  --fail-tint: #F7E9E4;
  --none: #9FB0A8;
  --hatch: repeating-linear-gradient(45deg, #9FB0A8 0 2px, #E7EDEA 2px 4px);
  --shadow: 0 18px 50px rgba(20, 32, 28, 0.08);
  --r-card: 18px;
  --r-tile: 16px;
  --font-display: "Sora", system-ui, sans-serif;
  --font-body: "Inter Tight", system-ui, sans-serif;
  --font-mono: "Martian Mono", ui-monospace, "SF Mono", monospace;
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--font-body);
  /* 16px floor: below it iOS Safari zooms on form focus, and small body copy
     is the first thing to fail on a phone. */
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink);
  background: linear-gradient(160deg, var(--ground1) 0%, var(--ground2) 100%) fixed;
  background-color: var(--ground1);
}
a { color: var(--accent-ink); text-decoration-thickness: 1px; text-underline-offset: 2px; }
a:hover { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
code {
  font-family: var(--font-mono);
  font-size: 0.82em;
  background: var(--line-soft);
  padding: 1px 5px;
  border-radius: 5px;
}
.mono { font-family: var(--font-mono); }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ---------- chrome ---------- */
main { max-width: 1060px; margin: 0 auto; padding: 0 24px 72px; }
.topbar { background: transparent; }
.topbar-in {
  max-width: 1060px; margin: 0 auto; padding: 22px 24px;
  display: flex; justify-content: space-between; align-items: center; gap: 18px;
}
.wordmark {
  display: inline-flex; align-items: center; gap: 9px;
  font-family: var(--font-display); font-weight: 700; font-size: 17px;
  color: var(--ink); text-decoration: none;
}
.wordmark svg { color: var(--accent); }
.topnav { display: flex; align-items: center; gap: 6px 24px; flex-wrap: wrap; }
.topnav a {
  font-size: 14.5px; font-weight: 500; color: var(--dim); text-decoration: none;
  padding: 4px 2px; border-radius: 6px;
}
.topnav a:hover { color: var(--accent-ink); }
.topnav a.active {
  color: var(--accent-ink);
  box-shadow: inset 0 -2px 0 var(--accent);
}
.site-footer { border-top: 1px solid var(--line); background: var(--ground2); }
.footer-in {
  max-width: 1060px; margin: 0 auto; padding: 20px 24px;
  display: flex; justify-content: space-between; gap: 10px 24px; flex-wrap: wrap;
  font-size: 12.5px; color: var(--dim);
}

/* ---------- shared bits ---------- */
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow);
}
.eyebrow {
  font-family: var(--font-mono); font-size: 11.5px; font-weight: 400;
  letter-spacing: 0.2em; color: var(--accent-ink); margin: 0 0 14px;
}
.page-title {
  font-family: var(--font-display); font-weight: 700; font-size: 34px;
  line-height: 1.1; letter-spacing: -0.01em; margin: 0 0 12px;
}
.body-copy { color: var(--dim); margin: 0; max-width: 62ch; }
.btn, .btn-outline, .btn-dark {
  display: inline-block; border-radius: 12px; padding: 12px 20px;
  font-weight: 600; font-size: 14.5px; text-decoration: none; border: 1px solid transparent;
}
.btn { background: var(--accent); color: #FFFFFF; }
.btn:hover { background: var(--accent-ink); color: #FFFFFF; }
.btn-outline { background: var(--card); color: var(--accent-ink); border-color: var(--accent); }
.btn-outline:hover { background: var(--accent-tint); }
.btn-dark { background: var(--ink); color: var(--ground1); padding: 15px 24px; font-size: 15px; }
.btn-dark:hover { background: #22332C; color: #FFFFFF; }
.btn-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
.code-chip {
  font-family: var(--font-mono); font-size: 0.82em;
  background: var(--accent-tint); color: var(--accent-ink);
  padding: 1px 6px; border-radius: 6px;
}
.arrow-link { font-weight: 600; font-size: 14.5px; text-decoration: none; }
.table-scroll { overflow-x: auto; }
.prov {
  font-style: normal; font-family: var(--font-mono); font-size: 10.5px;
  color: var(--warn-ink); background: var(--warn-tint);
  border: 1px solid var(--warn); border-radius: 999px; padding: 1px 8px;
  white-space: nowrap; vertical-align: middle;
}

/* ---------- grade pills ---------- */
.pill {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 40px; padding: 3px 12px; border-radius: 999px;
  font-family: var(--font-display); font-weight: 700; font-size: 15px;
  border: 1px solid;
}
.pill-lg { min-width: 52px; padding: 6px 16px; font-size: 19px; }
.g-ap, .g-a, .g-b { background: var(--accent-tint); color: var(--accent-ink); border-color: var(--accent); }
.g-c, .g-d { background: var(--warn-tint); color: var(--warn-ink); border-color: var(--warn); }
.g-f { background: var(--fail-tint); color: var(--fail); border-color: var(--fail); }
.g-na { background: var(--line-soft); color: var(--dim); border-color: var(--none); }

/* ---------- home hero ---------- */
.hero { text-align: center; padding: 56px 0 34px; display: flex; flex-direction: column; align-items: center; }
.display-hl {
  font-family: var(--font-display); font-weight: 700;
  font-size: clamp(26px, 7vw, 56px); line-height: 1.05; letter-spacing: -0.02em;
  margin: 8px 0 18px; max-inline-size: 20ch;
}
.lede { font-size: 17.5px; line-height: 1.65; color: var(--dim); max-width: 56ch; margin: 0 auto; }

/* ---------- the hero chain ---------- */
.chain-card { padding: 40px 44px 26px; margin: 10px 0 28px; }
.hero-chain { display: flex; align-items: flex-start; }
.ch-node {
  flex: 1 1 0; min-width: 0;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.ch-tile {
  position: relative; width: 56px; height: 56px; border-radius: var(--r-tile);
  display: flex; align-items: center; justify-content: center; border: 2px solid;
}
.st-ok .ch-tile, .pg-tile.st-ok { background: var(--accent-tint); border-color: var(--accent); color: var(--accent); }
.st-warn .ch-tile, .pg-tile.st-warn { background: var(--warn-tint); border-color: var(--warn); color: var(--warn); }
.st-none .ch-tile, .pg-tile.st-none { background: var(--hatch); border-color: var(--none); color: var(--dim); }
.ch-bead {
  position: absolute; top: -8px; right: -8px; width: 19px; height: 19px;
  border-radius: 50%; background: var(--warn); color: #FFFFFF;
  font: 700 11px/19px var(--font-body); text-align: center;
  box-shadow: 0 0 0 2px var(--card);
}
.ch-name { font-weight: 600; font-size: 14.5px; text-align: center; }
.ch-pct { font-size: 11px; }
.st-ok .ch-pct { color: var(--accent-ink); }
.st-warn .ch-pct { color: var(--warn-ink); }
.st-none .ch-pct { color: var(--dim); }
.ch-conn {
  flex: 0 2 64px; min-width: 14px; height: 3px; margin-top: 27px;
  border-radius: 2px; background: var(--line-soft); overflow: hidden;
}
.ch-conn i {
  display: block; width: 100%; height: 100%; border-radius: 2px;
  background: linear-gradient(var(--conn-dir, 90deg), var(--c1), var(--c2));
  transform-origin: left top;
}
.chain-legend {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 28px;
  margin-top: 30px; padding-top: 22px; border-top: 1px solid var(--line-soft);
  font-size: 13px; color: var(--dim);
}
.lg-item { display: inline-flex; align-items: center; gap: 7px; }
.lg-swatch { width: 11px; height: 11px; border-radius: 3px; }
.lg-ok { background: var(--accent); }
.lg-warn { background: var(--warn); }
.lg-hatch { background: var(--hatch); border: 1px solid var(--none); }
.chain-caption {
  margin: 16px 0 0; text-align: center; font-size: 13px; color: var(--dim);
}

/* the one motion moment: the chain verifies left→right on load */
.chain-go .ch-node {
  animation: ch-nodepop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.15) both;
  animation-delay: calc(var(--i) * 0.26s);
}
.chain-go .ch-conn i {
  animation: ch-sweep 0.34s ease-out both;
  animation-delay: calc(var(--i) * 0.26s + 0.15s);
}
.chain-go .ch-bead {
  animation: ch-beadpop 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.4) both;
  animation-delay: calc(var(--i) * 0.26s + 0.34s);
}
@keyframes ch-nodepop { from { opacity: 0; transform: translateY(8px) scale(0.88); } }
@keyframes ch-sweep { from { transform: scale(0, 1); } }
@keyframes ch-sweep-v { from { transform: scale(1, 0); } }
@keyframes ch-beadpop { from { opacity: 0; transform: scale(0); } }
@media (prefers-reduced-motion: reduce) {
  .chain-go .ch-node, .chain-go .ch-conn i, .chain-go .ch-bead { animation: none !important; }
}

/* ---------- home: CTA + feature strip ---------- */
.cta-row { display: flex; justify-content: center; align-items: stretch; gap: 14px; flex-wrap: wrap; padding: 4px 0 44px; }
.install-card {
  display: inline-flex; align-items: center;
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
  padding: 15px 20px; font-size: 13px; color: var(--ink);
}
.feature-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
.feature-card { padding: 24px 26px; display: flex; flex-direction: column; gap: 10px; }
.feature-title { font-family: var(--font-display); font-weight: 600; font-size: 18px; margin: 0; }
.feature-copy { color: var(--dim); font-size: 14.5px; margin: 0; flex: 1; }

/* ---------- directory ---------- */
.page-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 18px 28px; flex-wrap: wrap; padding: 44px 0 6px;
}
.dir-controls { padding: 18px 0 22px; }
#dir-filter {
  width: 100%; max-width: 420px;
  font-family: var(--font-body); font-size: 14.5px; color: var(--ink);
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
  padding: 11px 16px;
}
#dir-filter::placeholder { color: var(--dim); opacity: 0.75; }
button.btn { font-family: var(--font-body); cursor: pointer; }
button.btn:disabled { background: var(--none); cursor: default; }
.scan-card {
  margin-top: 14px; max-width: 560px;
  padding: 18px 22px;
  border-left: 4px solid var(--accent);
}
.scan-card[hidden] { display: none; }
.scan-copy { margin: 0 0 14px; color: var(--dim); font-size: 14.5px; max-width: 52ch; }
.scan-copy strong { color: var(--ink); }
.scan-status { margin: 12px 0 0; font-size: 12.5px; color: var(--dim); }
.scan-status[hidden] { display: none; }
table.directory { display: block; width: 100%; border-collapse: collapse; }
table.directory tbody {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;
}
.repo-card {
  display: block; position: relative;
  background: var(--card); border: 1px solid var(--line); border-radius: var(--r-card);
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.repo-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.repo-card-in { display: flex; flex-direction: column; gap: 12px; padding: 22px 24px; }
.rc-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.repo-link {
  font-family: var(--font-display); font-weight: 600; font-size: 17px;
  color: var(--ink); text-decoration: none; word-break: break-word;
}
.repo-link::after { content: ""; position: absolute; inset: 0; border-radius: var(--r-card); }
.repo-link:focus-visible { outline: none; }
.repo-link:focus-visible::after { outline: 2px solid var(--accent); outline-offset: 2px; }
.rc-desc { margin: 0; font-size: 13.5px; color: var(--dim); }
.rc-desc-empty { font-style: italic; opacity: 0.7; }
.rc-meta { font-size: 12.5px; color: var(--dim); }
.rc-foot {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  border-top: 1px solid var(--line-soft); padding-top: 12px; margin-top: auto;
}
.rc-date { font-size: 11px; color: var(--dim); }
.lane {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--font-mono); font-size: 10.5px; border-radius: 999px;
  padding: 2px 9px; border: 1px solid;
}
.lane-auth { background: var(--accent-tint); color: var(--accent-ink); border-color: var(--accent); }
.lane-ext { background: var(--line-soft); color: var(--dim); border-color: var(--line); }
.lane-unsigned { background: rgba(214, 116, 44, 0.12); color: var(--warn-ink); border-color: var(--warn); }
/* Local lane: a real link, drawn as a shorter one than the authenticated mark. */
.lane-local { background: transparent; color: var(--dim); border-style: dashed; border-color: var(--line); }
.lane-local-overlay {
  background: transparent; color: var(--dim);
  border-style: dashed; border-color: var(--line); font-size: 10px;
}
.rc-cov {
  margin-top: 8px; font-size: 12.5px; line-height: 1.55;
  color: var(--warn-ink); border-left: 2px solid var(--warn); padding-left: 10px;
}
.rc-cov code { font-family: var(--mono); font-size: 12px; white-space: nowrap; }
.dir-sortbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 12px;
  font-size: 11px; letter-spacing: 0.08em; color: var(--dim);
}
.dir-sortbar select {
  font: inherit; letter-spacing: 0; padding: 4px 8px; border-radius: 6px;
  border: 1px solid var(--line); background: var(--card); color: var(--ink);
}
.dir-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.dir-count { margin-left: auto; }

/* mini chain */
.mini-chain { display: flex; align-items: flex-start; gap: 6px; }
.mc-ph { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.mc-dot { width: 12px; height: 12px; border-radius: 4px; }
.mc-ph.st-ok .mc-dot { background: var(--accent); }
.mc-ph.st-warn .mc-dot { background: var(--warn); }
.mc-ph.st-none .mc-dot { background: var(--hatch); box-shadow: inset 0 0 0 1px var(--none); }
.mc-pct { font-size: 10px; line-height: 1; }
.mc-ph.st-ok .mc-pct { color: var(--accent-ink); }
.mc-ph.st-warn .mc-pct { color: var(--warn-ink); }
.mc-ph.st-none .mc-pct { color: var(--dim); }
.mc-link { width: 16px; height: 2px; border-radius: 1px; background: var(--line); margin-top: 5px; }

/* ---------- repo detail ---------- */
.crumbs { padding: 30px 0 4px; font-size: 14px; }
.crumbs a { text-decoration: none; font-weight: 500; }
.repo-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 8px 0 4px; }
.repo-title {
  font-family: var(--font-display); font-weight: 700; font-size: clamp(24px, 4vw, 34px);
  letter-spacing: -0.01em; margin: 0; word-break: break-word;
}
.repo-meta { font-size: 13px; color: var(--dim); margin: 4px 0 0; max-width: none; }
.score-line { font-size: 15px; margin: 10px 0 0; }
.chain-card-detail { margin-top: 22px; }
.transparency-note { font-size: 13px; color: var(--dim); margin: 0 0 18px; }

.phase-group { margin: 0 0 18px; overflow: hidden; }
.pg-head {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 22px; border-bottom: 1px solid var(--line-soft);
}
.pg-tile {
  flex: none; width: 38px; height: 38px; border-radius: 12px; border: 2px solid;
  display: flex; align-items: center; justify-content: center;
}
.pg-title-wrap { flex: 1; min-width: 0; }
.pg-title { font-family: var(--font-display); font-weight: 600; font-size: 16px; margin: 0; }
.pg-counts { font-size: 12px; color: var(--dim); }
.pg-pct { font-size: 13px; font-weight: 700; white-space: nowrap; }
.pg-pct.st-ok { color: var(--accent-ink); }
.pg-pct.st-warn { color: var(--warn-ink); }
.pg-pct.st-none { color: var(--dim); }
.ctl-list { list-style: none; margin: 0; padding: 6px 0; }
.ctl {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 10px 22px; border-bottom: 1px solid var(--line-soft);
}
.ctl:last-child { border-bottom: 0; }
.ctl-oos { opacity: 0.55; }
.ctl-mark {
  flex: none; width: 84px; text-align: center;
  font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
  border-radius: 999px; border: 1px solid; padding: 2px 0; margin-top: 2px;
}
.ctl-mark.oc-pass { background: var(--accent-tint); color: var(--accent-ink); border-color: var(--accent); }
.ctl-mark.oc-fail { background: var(--fail-tint); color: var(--fail); border-color: var(--fail); }
.ctl-mark.oc-gap { background: var(--warn-tint); color: var(--warn-ink); border-color: var(--warn); }
.ctl-mark.oc-unverified { background: var(--hatch); color: var(--ink); border-color: var(--none); }
.ctl-mark.oc-info { background: var(--line-soft); color: var(--dim); border-color: var(--line); }
.ctl-main { min-width: 0; font-size: 14px; }
.oos {
  font-family: var(--font-mono); font-size: 10px; color: var(--dim);
  border: 1px dashed var(--none); border-radius: 999px; padding: 1px 7px; margin-left: 6px;
}
.raw {
  font-family: var(--font-mono); font-size: 10.5px; color: var(--warn-ink);
  background: var(--warn-tint); border-radius: 6px; padding: 1px 6px; margin-left: 6px;
}
.ctl-reason { font-size: 13px; color: var(--dim); margin-top: 3px; }
.ctl-evidence { margin-top: 4px; font-size: 13px; }
.ctl-evidence summary {
  cursor: pointer; color: var(--accent-ink); font-weight: 500; font-size: 12.5px;
}
.ctl-evidence ul { margin: 6px 0 2px; padding-left: 20px; color: var(--dim); }
.ctl-evidence li { overflow-wrap: anywhere; }

.improve-card { padding: 26px 28px; margin: 26px 0 0; border-left: 4px solid var(--accent); }
.improve-title { font-family: var(--font-display); font-weight: 600; font-size: 19px; margin: 0 0 10px; }

/* ---------- methodology ---------- */
.method-wrap { max-width: 780px; margin: 0 auto; }
.method-head { padding: 44px 0 10px; }
.honesty-card {
  background: var(--accent-tint); border-color: var(--accent);
  padding: 26px 28px; margin: 22px 0 10px;
}
.honesty-motif { display: block; margin-bottom: 12px; max-width: 100%; }
.honesty-title { font-family: var(--font-display); font-weight: 600; font-size: 19px; margin: 0 0 10px; }
.honesty-body { margin: 0; color: var(--ink); }
.honesty-body code { background: rgba(255, 255, 255, 0.75); }
.method-section { padding: 22px 0 6px; }
.method-section h2 {
  font-family: var(--font-display); font-weight: 600; font-size: 22px;
  letter-spacing: -0.01em; margin: 18px 0 10px;
}
.prose p, .prose li { color: var(--dim); }
.prose strong, .prose code { color: var(--ink); }
.prose ol, .prose ul { padding-left: 22px; }
.method-table {
  width: 100%; min-width: 560px; border-collapse: collapse; font-size: 13.5px;
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
}
.method-table th, .method-table td {
  text-align: left; vertical-align: top; padding: 10px 14px;
  border-bottom: 1px solid var(--line-soft);
}
.method-table th {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
  color: var(--dim); text-transform: uppercase;
}
.method-table tr:last-child td { border-bottom: 0; }
.method-table td { color: var(--dim); }
.method-table td strong, .method-table td code { color: var(--ink); }
.inkblock {
  background: var(--ink); color: var(--ground2); border-radius: var(--r-tile);
  padding: 22px 26px; overflow-x: auto; margin: 8px 0 14px;
  font-size: 13px; line-height: 1.8;
}
.inkblock code { background: transparent; color: inherit; font-size: inherit; padding: 0; }
.pill-row { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 0 14px; }
.grade-copy { color: var(--dim); font-size: 14.5px; }
.grade-key { color: var(--ink); font-weight: 700; font-size: 0.9em; }

/* ---------- design switcher ---------- */
.design-switcher {
  position: fixed; right: 16px; bottom: 16px; z-index: 50;
  display: flex; align-items: center; gap: 2px;
  background: var(--card); border: 1px solid var(--line); border-radius: 999px;
  box-shadow: var(--shadow); padding: 5px 8px;
}
.design-switcher .ds-label {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--dim); padding: 0 6px;
}
.design-switcher a {
  font-size: 12.5px; font-weight: 600; color: var(--dim); text-decoration: none;
  padding: 4px 10px; border-radius: 999px;
}
.design-switcher a:hover { color: var(--accent-ink); background: var(--line-soft); }
.design-switcher a[aria-current="true"] { background: var(--accent-tint); color: var(--accent-ink); }

/* ---------- responsive ---------- */
@media (max-width: 860px) {
  .page-head { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 720px) {
  .chain-card { padding: 28px 22px 20px; }
  .hero-chain { flex-direction: column; align-items: center; }
  .ch-node { flex: none; width: 100%; max-width: 260px; }
  .ch-conn {
    flex: none; width: 3px; height: 30px; min-width: 0; margin: 10px 0;
    --conn-dir: 180deg;
  }
  .chain-go .ch-conn i { animation-name: ch-sweep-v; }
  .hero { padding-top: 40px; }
  .topbar-in { flex-direction: column; align-items: flex-start; gap: 10px; }
  .footer-in { flex-direction: column; }
  .ctl { flex-direction: column; gap: 6px; padding: 12px 18px; }
  .ctl-mark { margin-top: 0; }
  .pg-head { padding: 14px 18px; flex-wrap: wrap; }
}
@media (max-width: 480px) {
  main { padding-left: 16px; padding-right: 16px; }
  .topbar-in, .footer-in { padding-left: 16px; padding-right: 16px; }
  table.directory tbody { grid-template-columns: 1fr; }
  .repo-card-in { padding: 18px 18px; }
  .cta-row { flex-direction: column; align-items: stretch; text-align: center; }
  .install-card { justify-content: center; }
  .design-switcher { right: 10px; bottom: 10px; }
  .chain-legend { gap: 8px 16px; font-size: 12px; }
}
`;
