/**
 * Console — complete stylesheet. Dark-committed instrument panel: one theme,
 * explicit backgrounds everywhere, no prefers-color-scheme blocks. Identity:
 * dot-grid ground, glassy panels, luminous meters, mono instrument labels,
 * glow reserved for live/status elements (the live dot, grade chips, pass
 * segments) — never on plain chrome.
 */
export const CSS = `/* Console — dark instrument panel (single theme, dark-committed). */

/* ---------- tokens ---------- */
:root {
  --ground-0: #0C1220;
  --ground-1: #0E1626;
  --panel: rgba(16, 26, 46, 0.85);
  --panel-soft: rgba(16, 26, 46, 0.6);
  --panel-solid: #101A2E;
  --well: #0A1120;
  --line: #24344F;
  --line-soft: #1E2A42;
  --track: #1A2740;
  --ink: #DFE5F0;
  --bright: #F2F5FA;
  --dim: #A7B4CC;
  --faint: #5B6B8A;
  --accent: #6FD3E8;
  --accent-hi: #9AE2F1;
  --accent-ink: #08111E;
  --pass: #52D6A3;
  --fail: #E86A5A;
  --warn: #F2A85C;
  --hatch: repeating-linear-gradient(45deg, #3A4763 0 3px, #141D31 3px 6px);
  --meter-grad: linear-gradient(90deg, #52D6A3, #6FD3E8);
  --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --sans: "Geist", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --radius: 14px;
}

/* ---------- ground ---------- */
* , *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink);
  background-color: var(--ground-0);
  background-image:
    radial-gradient(circle at 1px 1px, rgba(111, 211, 232, 0.07) 1px, transparent 0),
    linear-gradient(180deg, var(--ground-0) 0%, var(--ground-1) 100%);
  background-size: 28px 28px, 100% 100%;
  background-repeat: repeat, no-repeat;
}
a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-hi); text-decoration: underline; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
::selection { background: rgba(111, 211, 232, 0.25); }
code { font-family: var(--mono); font-size: 0.92em; color: var(--ink); }
.mono { font-family: var(--mono); }

main { max-width: 1180px; margin: 0 auto; padding: 0 32px 72px; }

/* ---------- topbar ---------- */
.topbar { border-bottom: 1px solid var(--line-soft); background: rgba(12, 18, 32, 0.7); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 20; }
.topbar-in { max-width: 1180px; margin: 0 auto; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.wordmark { display: inline-flex; align-items: center; gap: 10px; color: var(--bright); }
.wordmark:hover { text-decoration: none; color: var(--bright); }
.wm-dot { width: 9px; height: 9px; border-radius: 2px; background: var(--accent); box-shadow: 0 0 12px rgba(111, 211, 232, 0.7); }
.wm-name { font-family: var(--mono); font-weight: 700; font-size: 15px; letter-spacing: 0.04em; }
.wm-ver { font-family: var(--mono); font-size: 11px; color: var(--faint); border: 1px solid var(--line-soft); border-radius: 4px; padding: 2px 7px; }
.topnav { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.topnav a { font-size: 14px; color: var(--dim); }
.topnav a:hover { color: var(--ink); text-decoration: none; }
.topnav a.active { color: var(--accent); }
.topnav a.ext { color: var(--accent); }

/* ---------- shared blocks ---------- */
.eyebrow { font-family: var(--mono); font-size: 12px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin: 0 0 6px; }
.eyebrow .live-dot { display: inline-block; text-shadow: 0 0 10px rgba(111, 211, 232, 0.8); }
.page-title { font-size: 34px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; color: var(--bright); margin: 0 0 10px; }
.body-copy { color: var(--dim); max-width: 62ch; }
.body-copy strong { color: var(--ink); }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
.panel-pad { padding: 22px 24px; }

.btn { display: inline-block; background: var(--accent); color: var(--accent-ink); border-radius: 8px; padding: 12px 20px; font-weight: 600; font-size: 15px; }
.btn:hover { background: var(--accent-hi); color: var(--accent-ink); text-decoration: none; }
.btn-outline { display: inline-block; border: 1px solid var(--line); color: var(--ink); border-radius: 8px; padding: 11px 19px; font-weight: 500; font-size: 15px; background: var(--panel-solid); }
.btn-outline:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
.btn-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }

/* ---------- grade chips (status elements — glow allowed) ---------- */
.grade-chip {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-weight: 700; line-height: 1;
  background: var(--well); border: 1px solid var(--line); border-radius: 8px;
}
.gc-sm { min-width: 34px; height: 34px; padding: 0 7px; font-size: 15px; }
.gc-md { min-width: 46px; height: 46px; padding: 0 9px; font-size: 20px; }
.gc-lg { min-width: 60px; height: 60px; padding: 0 11px; font-size: 27px; border-radius: 10px; }
.g-pass { color: var(--pass); border-color: rgba(82, 214, 163, 0.5); text-shadow: 0 0 9px rgba(82, 214, 163, 0.55); box-shadow: 0 0 14px rgba(82, 214, 163, 0.18), inset 0 0 10px rgba(82, 214, 163, 0.08); }
.g-warn { color: var(--warn); border-color: rgba(242, 168, 92, 0.5); text-shadow: 0 0 9px rgba(242, 168, 92, 0.5); box-shadow: 0 0 14px rgba(242, 168, 92, 0.15), inset 0 0 10px rgba(242, 168, 92, 0.07); }
.g-fail { color: var(--fail); border-color: rgba(232, 106, 90, 0.55); text-shadow: 0 0 9px rgba(232, 106, 90, 0.5); box-shadow: 0 0 14px rgba(232, 106, 90, 0.18), inset 0 0 10px rgba(232, 106, 90, 0.08); }
.g-na { color: var(--faint); border-color: var(--line); }
.prov-tag { font-family: var(--mono); font-size: 11px; color: var(--warn); border: 1px solid rgba(242, 168, 92, 0.45); border-radius: 4px; padding: 2px 7px; letter-spacing: 0.04em; vertical-align: middle; }
.prov-flag { color: var(--warn); font-style: normal; }

/* ---------- meters ---------- */
.meter { margin: 0; }
.meter-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 12.5px; color: var(--dim); margin-bottom: 5px; }
.meter-pct { font-family: var(--mono); font-variant-numeric: tabular-nums; color: var(--dim); }
.meter-pct.pct-ok { color: var(--ink); }
.meter-pct.pct-low { color: var(--warn); }
.meter-pct.pct-none { color: var(--faint); }
.meter-track { display: flex; height: 6px; border-radius: 3px; background: var(--track); overflow: hidden; }
.mfill { display: block; height: 100%; width: var(--w); }
.m-pass { background: var(--meter-grad); box-shadow: 0 0 10px rgba(82, 214, 163, 0.5); }
.m-fail { background: var(--fail); opacity: 0.85; }
.m-unv { background: var(--hatch); }
.meter-stack { display: flex; flex-direction: column; gap: 13px; }

/* home-hero orchestrated fill: script adds .is-live after first paint */
.tm-anim .mfill { width: 0; transition: width 0.9s cubic-bezier(0.22, 0.9, 0.3, 1); }
.tm-anim .meter:nth-child(1) .mfill { transition-delay: 0.05s; }
.tm-anim .meter:nth-child(2) .mfill { transition-delay: 0.17s; }
.tm-anim .meter:nth-child(3) .mfill { transition-delay: 0.29s; }
.tm-anim .meter:nth-child(4) .mfill { transition-delay: 0.41s; }
.tm-anim .meter:nth-child(5) .mfill { transition-delay: 0.53s; }
.tm-anim.is-live .mfill { width: var(--w); }
@media (prefers-reduced-motion: reduce) {
  .tm-anim .mfill { transition: none; width: var(--w); }
}

/* compact per-row meters (directory) */
.pmeters { display: flex; flex-direction: column; gap: 5px; min-width: 210px; }
.pmeter { display: grid; grid-template-columns: 26px 1fr 48px; align-items: center; gap: 8px; }
.pm-label { font-family: var(--mono); font-size: 11px; color: var(--faint); }
.pm-track { display: flex; height: 5px; border-radius: 2.5px; background: var(--track); overflow: hidden; }
.pm-pct { font-family: var(--mono); font-size: 11px; font-variant-numeric: tabular-nums; text-align: right; color: var(--dim); }
.pm-pct.pct-low { color: var(--warn); }
.pm-pct.pct-none { color: var(--faint); }
.bar-empty { font-family: var(--mono); font-size: 11px; color: var(--faint); }

/* ---------- hero ---------- */
.hero { display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 56px; align-items: center; padding: 68px 0 56px; }
.hero-hl { font-size: clamp(34px, 5.5vw, 54px); font-weight: 600; line-height: 1.06; letter-spacing: -0.025em; color: var(--bright); margin: 14px 0 0; }
.hero .lede { font-size: 17px; line-height: 1.65; color: var(--dim); max-width: 48ch; margin: 20px 0 0; }
.hero-cta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 26px; }
.install-pill { font-family: var(--mono); background: var(--panel-solid); border: 1px solid var(--line); border-radius: 8px; padding: 12px 18px; font-size: 14px; color: var(--ink); margin: 0; overflow-x: auto; }
.install-pill .prompt { color: var(--faint); }
.hero-count { font-family: var(--mono); font-size: 12px; color: var(--dim); margin: 14px 0 0; }

.telemetry { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; backdrop-filter: blur(6px); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45); }
.tm-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
.tm-repo { font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em; color: var(--dim); }
.tm-repo:hover { color: var(--accent); }
.tm-foot { font-family: var(--mono); font-size: 11.5px; color: var(--dim); margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line-soft); }

/* ---------- stat tiles ---------- */
.stat-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 8px 0 40px; }
.stat-tile { background: var(--panel-soft); border: 1px solid var(--line-soft); border-radius: 10px; padding: 20px 22px; }
.stat-val { font-family: var(--mono); font-size: 24px; font-weight: 700; color: var(--bright); }
.stat-val.accent { color: var(--accent); text-shadow: 0 0 12px rgba(111, 211, 232, 0.4); }
.stat-copy { font-size: 13px; color: var(--dim); margin-top: 4px; }

/* ---------- lanes strip (home) ---------- */
.lane-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.lane-cellblock { background: var(--panel-soft); border: 1px solid var(--line-soft); border-radius: 10px; padding: 22px 24px; }
.lane-cellblock h2 { font-size: 18px; font-weight: 600; color: var(--bright); margin: 8px 0 8px; }
.lane-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; color: var(--faint); }

/* ---------- directory ---------- */
.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; padding: 48px 0 22px; }
.dir-controls { margin: 0 0 14px; }
#dir-filter { width: 100%; max-width: 420px; font-family: var(--mono); font-size: 14px; color: var(--ink); background: var(--panel-solid); border: 1px solid var(--line); border-radius: 8px; padding: 11px 14px; }
#dir-filter::placeholder { color: var(--faint); }
#dir-filter:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
.dir-filter-label { display: block; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; color: var(--faint); margin-bottom: 7px; }

/* unified scan intake — revealed by filter.js when the query is a repo slug
   with no directory row (quiet callout, not a hero) */
#dir-scan { margin-top: 12px; max-width: 640px; background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
#dir-scan[hidden] { display: none; }
.scan-copy { flex: 1 1 260px; font-size: 13px; color: var(--dim); margin: 0; }
.scan-eyebrow { display: inline-block; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--accent); border: 1px solid rgba(111, 211, 232, 0.4); border-radius: 4px; padding: 1px 7px; margin-right: 8px; vertical-align: middle; white-space: nowrap; }
#dir-scan .btn { white-space: nowrap; }
.scan-status { flex-basis: 100%; font-family: var(--mono); font-size: 12.5px; color: var(--dim); margin: 0; border-top: 1px solid var(--line-soft); padding-top: 10px; }
.scan-status a { color: var(--accent); }

.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); }
table.directory { width: 100%; border-collapse: collapse; min-width: 860px; }
table.directory th { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); text-align: left; padding: 13px 16px; border-bottom: 1px solid var(--line); }
table.directory td { padding: 15px 16px; border-top: 1px solid var(--line-soft); vertical-align: middle; }
table.directory tbody tr:first-child td { border-top: none; }
table.directory tbody tr:hover { background: rgba(111, 211, 232, 0.04); }
.repo-name { font-family: var(--mono); font-size: 14.5px; font-weight: 500; color: var(--bright); }
.repo-name:hover { color: var(--accent); }
.desc { display: block; font-size: 13px; color: var(--dim); max-width: 46ch; margin-top: 3px; }
.meta-line { display: block; font-family: var(--mono); font-size: 11.5px; color: var(--dim); margin-top: 5px; }
.date-cell { font-family: var(--mono); font-size: 12.5px; color: var(--dim); white-space: nowrap; }

.lane { display: inline-block; font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em; border-radius: 6px; padding: 3px 9px; white-space: nowrap; }
.lane-auth { color: var(--accent); border: 1px solid rgba(111, 211, 232, 0.55); box-shadow: 0 0 10px rgba(111, 211, 232, 0.15); }
.lane-ext { color: var(--dim); border: 1px solid var(--line); }

.key-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--dim); margin-top: 14px; }
.key-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; color: var(--faint); }
.key-item { display: inline-flex; align-items: center; gap: 7px; }
.key-swatch { width: 22px; height: 8px; border-radius: 2px; display: inline-block; border: 1px solid var(--line-soft); }
.key-pass { background: var(--meter-grad); border-color: transparent; }
.key-fail { background: var(--fail); border-color: transparent; }
.key-unv { background: var(--hatch); }

/* ---------- repo detail ---------- */
.crumbs { padding: 28px 0 0; font-family: var(--mono); font-size: 13px; }
.repo-hero { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 22px 0 6px; }
.repo-title { font-family: var(--mono); font-size: clamp(22px, 4vw, 32px); font-weight: 600; letter-spacing: -0.01em; color: var(--bright); margin: 0; overflow-wrap: anywhere; }
.repo-meta { font-family: var(--mono); font-size: 12.5px; color: var(--dim); line-height: 2; margin: 6px 0 0; overflow-wrap: anywhere; }
.score-line { font-size: 15px; color: var(--dim); margin: 12px 0 18px; }
.score-line strong { color: var(--bright); font-family: var(--mono); }
.detail-meters { max-width: 720px; }

.nudge { margin: 34px 0 10px; background: var(--panel); border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: var(--radius); padding: 24px 26px; }
.nudge-title { font-size: 20px; font-weight: 600; color: var(--bright); margin: 0 0 8px; }

.controls-title { font-size: 22px; font-weight: 600; color: var(--bright); margin: 38px 0 8px; }
.transparency-note { font-size: 13.5px; color: var(--dim); max-width: 78ch; margin: 0 0 14px; }
table.controls { width: 100%; border-collapse: collapse; min-width: 720px; }
table.controls th { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--line); }
table.controls td { padding: 12px 14px; border-top: 1px solid var(--line-soft); vertical-align: top; font-size: 13.5px; }
table.controls tbody tr:first-child td { border-top: none; }
table.controls .outcome { font-family: var(--mono); font-size: 12.5px; white-space: nowrap; }
tr.oc-pass .outcome { color: var(--pass); }
tr.oc-fail .outcome { color: var(--fail); }
tr.oc-gap .outcome { color: var(--warn); }
tr.oc-unverified .outcome { color: var(--dim); }
tr.oc-unverified .outcome .oc-chip { background: var(--hatch); border-radius: 3px; padding: 1px 6px; }
tr.oc-info .outcome { color: var(--faint); }
tr.out-of-scope td { opacity: 0.45; }
.oos { font-family: var(--mono); font-size: 10.5px; color: var(--faint); border: 1px solid var(--line-soft); border-radius: 4px; padding: 1px 6px; }
.raw { display: inline-block; font-family: var(--mono); font-size: 10.5px; color: var(--warn); border: 1px dashed rgba(242, 168, 92, 0.5); border-radius: 4px; padding: 1px 6px; margin-left: 7px; }
.reason { color: var(--dim); }
table.controls details { margin-top: 4px; }
table.controls summary { cursor: pointer; font-family: var(--mono); font-size: 12px; color: var(--accent); }
table.controls details ul { margin: 6px 0 2px; padding-left: 18px; color: var(--dim); font-size: 12.5px; }
table.controls details li { font-family: var(--mono); overflow-wrap: anywhere; }

/* ---------- methodology ---------- */
.method-wrap { max-width: 860px; }
.method-nav { display: flex; gap: 16px; flex-wrap: wrap; font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em; margin: 8px 0 30px; }
.method-nav a { color: var(--dim); border: 1px solid var(--line-soft); border-radius: 6px; padding: 4px 11px; }
.method-nav a:hover { color: var(--accent); border-color: var(--accent); text-decoration: none; }
.method-section { margin: 36px 0; }
.method-section h2 { font-size: 22px; font-weight: 600; color: var(--bright); margin: 0 0 10px; }
.method-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
.prose p, .prose li { color: var(--dim); }
.prose strong { color: var(--ink); }
.prose ol, .prose ul { padding-left: 22px; }
.prose li { margin: 6px 0; }

.honesty { border-left: 3px solid var(--accent); }
.honesty-head { font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: var(--accent); padding: 14px 24px 0; }
.honesty-body { color: var(--dim); padding: 8px 24px 20px; }
.honesty-body strong { color: var(--ink); }

.terminal { background: var(--well); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.terminal-head { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 11px; color: var(--dim); letter-spacing: 0.1em; padding: 9px 16px; border-bottom: 1px solid var(--line-soft); background: var(--panel-solid); }
.terminal-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px rgba(111, 211, 232, 0.6); }
.terminal pre { margin: 0; padding: 18px 20px; font-family: var(--mono); font-size: 13.5px; line-height: 1.8; color: var(--ink); overflow-x: auto; }
.terminal .t-dim { color: var(--faint); }

table.method-table { width: 100%; border-collapse: collapse; min-width: 640px; }
table.method-table th { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dim); text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--line); }
table.method-table td { padding: 13px 14px; border-top: 1px solid var(--line-soft); vertical-align: top; font-size: 13.5px; color: var(--dim); }
table.method-table tbody tr:first-child td { border-top: none; }
table.method-table td strong { color: var(--ink); }
table.method-table code { color: var(--accent); font-size: 12px; }

.grade-row { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin: 14px 0 16px; }
.grade-copy { font-size: 14px; color: var(--dim); max-width: 72ch; }
.mv { font-family: var(--mono); font-size: 15px; color: var(--faint); font-weight: 400; vertical-align: middle; }

/* ---------- footer ---------- */
.site-footer { border-top: 1px solid var(--line-soft); margin-top: 40px; }
.footer-in { max-width: 1180px; margin: 0 auto; padding: 22px 32px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-family: var(--mono); font-size: 12px; color: var(--dim); }
.footer-in .domain { color: var(--faint); }

/* ---------- design switcher (shared markup, styled here) ---------- */
.design-switcher {
  position: fixed; right: 16px; bottom: 16px; z-index: 50;
  display: flex; align-items: center; gap: 10px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
  padding: 8px 14px; font-family: var(--mono); font-size: 12px;
  backdrop-filter: blur(8px); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}
.design-switcher .ds-label { color: var(--faint); letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; }
.design-switcher a { color: var(--dim); }
.design-switcher a:hover { color: var(--ink); text-decoration: none; }
.design-switcher a[aria-current="true"] { color: var(--accent); text-shadow: 0 0 8px rgba(111, 211, 232, 0.5); }

/* ---------- responsive ---------- */
@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; gap: 36px; padding-top: 44px; }
  .telemetry { max-width: 520px; }
  .stat-tiles { grid-template-columns: repeat(2, 1fr); }
  .lane-strip { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  main { padding: 0 18px 56px; }
  .topbar-in { padding: 14px 18px; }
  .footer-in { padding: 18px; }
  .page-head { padding-top: 32px; }
  .design-switcher { right: 10px; bottom: 10px; padding: 6px 10px; gap: 8px; }
}
@media (max-width: 420px) {
  .stat-tiles { grid-template-columns: 1fr; }
  .hero-cta { align-items: stretch; flex-direction: column; }
  .btn { text-align: center; }
}
`;
