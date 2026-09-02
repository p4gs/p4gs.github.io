/**
 * Manual — the complete stylesheet. Committed light single-theme: explicit
 * paper backgrounds everywhere, no dark blocks. Editorial field-manual
 * register — centered measure, serif display, hairline rules used sparingly,
 * restraint as the motion language.
 */
export const CSS = `/* Manual — field-manual design (light, single theme) */
:root {
  --paper: #FBFAF7;
  --card: #FFFFFF;
  --ink: #211E1A;
  --dim: #5A544A;
  --line: #E3DFD6;
  --rust: #8A4B2D;
  --rust-deep: #6E3B22;
  --pass: #3E7A5E;
  --fail: #9B3B24;
  --warn: #8C6D1F;
  --burnt: #A3541E;
  --hatch: repeating-linear-gradient(45deg, #B9B2A4 0 3px, #EFEBE2 3px 6px);
  --serif: "Newsreader", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --sans: "Mona Sans", -apple-system, "Segoe UI", system-ui, sans-serif;
  --mono: "Commit Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
html { background: var(--paper); }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--rust); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
a:hover { color: var(--rust-deep); }
code { font-family: var(--mono); font-size: 0.86em; background: #F2EFE8; padding: 1px 5px; border-radius: 2px; }
pre code { background: none; padding: 0; border-radius: 0; }
:focus-visible { outline: 2px solid var(--rust); outline-offset: 2px; }
.mono-strong { font-family: var(--mono); font-weight: 700; font-size: 0.95em; }

/* ── Chrome ─────────────────────────────────────────────────────────── */
.m-top {
  display: flex; justify-content: space-between; align-items: baseline;
  flex-wrap: wrap; gap: 12px 28px;
  max-width: 1200px; margin: 0 auto;
  padding: 28px 40px 24px;
  border-bottom: 1px solid var(--line);
}
.m-wordmark {
  font-family: var(--serif); font-style: italic; font-weight: 500;
  font-size: 21px; color: var(--ink); text-decoration: none;
}
.m-wordmark:hover { color: var(--rust); }
.m-nav { display: flex; flex-wrap: wrap; gap: 8px 30px; font-size: 14.5px; }
.m-nav a { color: var(--ink); text-decoration: none; }
.m-nav a:hover { color: var(--rust); }
.m-nav a.active {
  color: var(--rust);
  text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1.5px;
}
main { padding-bottom: 40px; }
.m-foot {
  border-top: 1px solid var(--line);
  max-width: 1200px; margin: 56px auto 0;
  padding: 22px 40px 84px;
  text-align: center;
}
.m-foot p {
  margin: 0; font-family: var(--mono); font-size: 11.5px;
  letter-spacing: 0.1em; color: var(--dim);
}

/* ── Shared editorial pieces ────────────────────────────────────────── */
.eyebrow {
  font-family: var(--mono); font-size: 12.5px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--rust); margin: 0;
}
.page-title {
  font-family: var(--serif); font-weight: 400; letter-spacing: -0.01em;
  font-size: clamp(34px, 5.4vw, 46px); line-height: 1.12; margin: 14px 0 0;
}
.crumbs { max-width: 860px; margin: 26px auto 0; padding: 0 24px; font-size: 14px; }
.crumbs a { text-decoration: none; }
.crumbs a:hover { text-decoration: underline; }
.table-scroll { overflow-x: auto; }

/* ── Home: hero ─────────────────────────────────────────────────────── */
.hero {
  max-width: 880px; margin: 0 auto; padding: 84px 24px 52px;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 26px;
}
.hero-hl {
  font-family: var(--serif); font-weight: 400; letter-spacing: -0.01em;
  font-size: clamp(38px, 7.2vw, 62px); line-height: 1.08;
  max-width: 18ch; margin: 0;
  animation: m-fade 0.7s ease-out both;
}
.hero-hl em { font-style: italic; font-weight: 500; }
@keyframes m-fade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-hl { animation: none; }
}
.lede {
  font-size: 18.5px; line-height: 1.7; color: var(--dim);
  max-width: 56ch; margin: 0;
}
.hero-cta { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 20px; margin-top: 6px; }
.install {
  margin: 0; background: var(--ink); color: var(--paper);
  font-family: var(--mono); font-size: 14.5px;
  padding: 14px 24px; border-radius: 3px; overflow-x: auto; max-width: 100%;
}
.method-link { font-size: 15.5px; font-weight: 600; text-underline-offset: 5px; }

/* ── Home: the three tenets ─────────────────────────────────────────── */
.tenets {
  max-width: 980px; margin: 0 auto; padding: 0 24px;
  border-top: 1px solid var(--line);
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
}
.tenet { padding: 30px 28px 18px; border-right: 1px solid var(--line); }
.tenet:last-child { border-right: none; }
.tenet-num { font-family: var(--serif); font-style: italic; font-size: 34px; line-height: 1; color: var(--rust); }
.tenet-title { font-family: var(--sans); font-weight: 600; font-size: 16.5px; margin: 12px 0 0; }
.tenet-copy { font-size: 14.5px; line-height: 1.65; color: var(--dim); margin: 8px 0 0; }

/* ── Home: featured directory card ──────────────────────────────────── */
.feature { max-width: 980px; margin: 44px auto 0; padding: 0 24px; }
.feature-card {
  background: var(--card); border: 1px solid var(--line); border-radius: 4px;
  padding: 26px 32px;
  display: flex; align-items: center; gap: 32px;
}
.feature-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.feature-eyebrow {
  font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--rust); margin: 0;
}
.feature-name { font-size: 16px; margin: 0; }
.feature-name a { color: var(--ink); text-decoration: none; }
.feature-name a:hover { color: var(--rust); text-decoration: underline; }
.feature-meta { font-size: 13.5px; color: var(--dim); margin: 0; }
.feature-links { font-size: 13.5px; margin: 4px 0 0; }
.feature-seal { flex-shrink: 0; text-decoration: none; }
.feature-seal:hover .mseal { transform: scale(1.03); }

/* ── Seals: serif letter in a thin double circle ────────────────────── */
.mseal {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1.5px solid currentColor; border-radius: 50%;
  font-family: var(--serif); font-weight: 500; line-height: 1;
  background: var(--card);
  transition: transform 0.15s ease;
}
.mseal::after {
  content: ""; position: absolute; inset: 3px;
  border: 1px solid currentColor; border-radius: 50%; opacity: 0.55;
}
.mseal-lg { width: 88px; height: 88px; font-size: 44px; }
.mseal-md { width: 64px; height: 64px; font-size: 30px; }
.mseal-sm { width: 48px; height: 48px; font-size: 22px; }
.mseal-pass { color: var(--pass); }
.mseal-warn { color: var(--warn); }
.mseal-d { color: var(--burnt); }
.mseal-fail { color: var(--fail); }
.mseal-na { color: var(--dim); }
.mseal-wrap { display: inline-flex; flex-direction: column; align-items: center; gap: 5px; }
.m-prov { font-family: var(--serif); font-style: italic; font-size: 13px; color: var(--dim); }

/* ── Phase lines: thin understated bars ─────────────────────────────── */
.mbars { display: flex; flex-direction: column; gap: 8px; }
.mrow {
  display: grid; grid-template-columns: 148px minmax(0, 1fr) 64px;
  gap: 14px; align-items: center;
}
.mbars-compact .mrow { grid-template-columns: 26px minmax(0, 1fr) 52px; gap: 10px; }
.mphase-name { font-size: 13px; color: var(--dim); white-space: nowrap; }
.mbars-compact .mphase-name { font-family: var(--mono); font-size: 11px; }
.mbar { display: flex; gap: 2px; height: 6px; }
.mbar-empty { background: #F2EFE8; }
.mseg { height: 100%; min-width: 2px; }
.mseg-pass { background: var(--pass); }
.mseg-fail { background: var(--fail); }
.mseg-unv { background: var(--hatch); }
.mpct { font-family: var(--mono); font-size: 12.5px; text-align: right; color: var(--ink); }
.mbars-compact .mpct { font-size: 11.5px; }

/* ── Directory: editorial index ─────────────────────────────────────── */
.dir-head { max-width: 68ch; margin: 0 auto; padding: 56px 24px 8px; text-align: center; }
.dir-lede { font-size: 16.5px; line-height: 1.7; color: var(--dim); margin: 18px 0 0; }
#dir-filter {
  display: block; width: 100%; max-width: 32rem; margin: 34px auto 0;
  background: transparent; border: none; border-bottom: 1px solid var(--line);
  padding: 10px 2px; font-family: var(--sans); font-size: 16px; color: var(--ink);
  border-radius: 0;
}
#dir-filter::placeholder { color: var(--dim); font-style: italic; font-family: var(--serif); }
#dir-filter:focus { border-bottom-color: var(--rust); }

/* the scan-intake callout the merged field reveals (filter.js contract) */
#dir-scan {
  max-width: 32rem; margin: 24px auto 0;
  background: var(--card); border: 1px solid var(--line); border-radius: 4px;
  padding: 22px 26px; text-align: center;
}
#dir-scan[hidden] { display: none; }
.scan-copy { font-size: 14px; line-height: 1.65; color: var(--dim); margin: 0 0 16px; }
.scan-cta {
  font-family: var(--sans); cursor: pointer;
  max-width: 100%; overflow-wrap: anywhere;
}
.scan-cta:disabled { opacity: 0.55; cursor: default; }
.scan-status {
  font-family: var(--serif); font-style: italic; font-size: 14px;
  line-height: 1.6; color: var(--dim); margin: 14px 0 0; overflow-wrap: anywhere;
}
.scan-status[hidden] { display: none; }

/* the shared filter.js expects table.directory tbody tr — reset to entries */
table.directory { display: block; max-width: 860px; margin: 40px auto 0; padding: 0 24px; border-collapse: collapse; }
table.directory tbody { display: block; }
table.directory tr {
  display: grid; grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px 32px; align-items: start;
  padding: 30px 0; border-top: 1px solid var(--line);
}
table.directory td { display: block; padding: 0; }
.entry-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; }
.entry-name {
  font-family: var(--serif); font-weight: 500; letter-spacing: -0.005em;
  font-size: 27px; line-height: 1.2; color: var(--ink); text-decoration: none;
  overflow-wrap: anywhere;
}
.entry-name:hover { color: var(--rust); text-decoration: underline; text-underline-offset: 4px; }
.entry-lane {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--dim);
}
.entry-lane-auth { color: var(--pass); }
.entry-desc { font-size: 15.5px; line-height: 1.65; color: var(--ink); max-width: 62ch; margin: 10px 0 0; }
.entry-meta { font-family: var(--mono); font-size: 12px; color: var(--dim); margin: 10px 0 0; overflow-wrap: anywhere; }
.entry-meta em { font-family: var(--serif); font-style: italic; font-size: 13px; }
.entry-bars { max-width: 440px; margin-top: 16px; }
.entry-seal { padding-top: 6px; }

.legend {
  max-width: 860px; margin: 0 auto; padding: 16px 24px 0;
  border-top: 1px solid var(--line);
  font-size: 13px; color: var(--dim);
}
.legend-label {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.16em;
  text-transform: uppercase; margin-right: 8px;
}
.legend-item { white-space: nowrap; }
.sw { display: inline-block; width: 16px; height: 7px; margin-right: 5px; vertical-align: baseline; }
.sw-pass { background: var(--pass); }
.sw-fail { background: var(--fail); }
.sw-unv { background: var(--hatch); }

/* ── Repo detail: the manual entry ──────────────────────────────────── */
.plate { max-width: 760px; margin: 0 auto; padding: 40px 24px 0; text-align: center; }
.plate-title {
  font-family: var(--serif); font-weight: 400; letter-spacing: -0.01em;
  font-size: clamp(30px, 5.4vw, 44px); line-height: 1.12;
  margin: 18px 0 0; overflow-wrap: anywhere;
}
.colophon {
  font-family: var(--serif); font-style: italic; font-size: 14.5px;
  line-height: 1.9; color: var(--dim); margin: 14px auto 0; max-width: 58ch;
}
.colophon code { font-style: normal; }
.score-line { font-size: 15.5px; margin: 22px 0 0; }
.score-line em { font-family: var(--serif); }
.plate-bars { max-width: 560px; margin: 22px auto 0; text-align: left; }

.controls-sec { max-width: 860px; margin: 56px auto 0; padding: 0 24px; }
.sec-title {
  font-family: var(--serif); font-weight: 500; font-size: 27px;
  margin: 0; padding-top: 26px; border-top: 1px solid var(--line);
}
.sec-copy { font-size: 14px; color: var(--dim); margin: 10px 0 22px; max-width: 68ch; }
table.controls { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 14.5px; }
table.controls th {
  font-family: var(--mono); font-weight: 400; font-size: 10.5px;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim);
  text-align: left; padding: 0 18px 10px 0; border-bottom: 1px solid var(--ink);
}
table.controls td {
  padding: 13px 18px 13px 0; border-top: 1px solid var(--line);
  vertical-align: top;
}
table.controls tbody tr:first-child td { border-top: none; }
.c-phase { font-family: var(--mono); font-size: 12.5px; color: var(--dim); width: 3.2em; }
.c-verdict { font-weight: 600; white-space: nowrap; }
.v-pass { color: var(--pass); }
.v-fail { color: var(--fail); }
.v-gap { color: var(--burnt); }
.v-unverified { color: var(--dim); font-weight: 400; font-style: italic; }
.v-info { color: var(--dim); font-weight: 400; }
.raw { font-family: var(--mono); font-size: 11px; color: var(--dim); font-weight: 400; font-style: normal; }
.out-of-scope { opacity: 0.45; }
.oos {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--dim);
}
.reason { font-size: 13.5px; color: var(--dim); margin: 0 0 6px; max-width: 52ch; }
.fn summary {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--rust); cursor: pointer;
}
.fn[open] summary { margin-bottom: 6px; }
.fn ul {
  margin: 0; padding: 8px 0 2px 16px;
  border-top: 1px solid var(--line);
  font-size: 13px; line-height: 1.6; color: var(--dim);
}
.fn li { margin: 4px 0; overflow-wrap: anywhere; }

.note { max-width: 68ch; margin: 64px auto 0; padding: 30px 24px 0; border-top: 1px solid var(--line); }
.note-title { font-family: var(--serif); font-weight: 500; font-size: 26px; margin: 0; }
.note-copy { font-size: 15.5px; line-height: 1.7; color: var(--dim); margin: 12px 0 0; }
.note-copy strong { color: var(--ink); }
.btn-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 22px; }
.btn-fill, .btn-line {
  display: inline-block; font-size: 14.5px; font-weight: 600;
  padding: 12px 22px; border-radius: 3px; text-decoration: none;
}
.btn-fill { background: var(--rust); color: #FBFAF7; border: 1px solid var(--rust); }
.btn-fill:hover { background: var(--rust-deep); border-color: var(--rust-deep); color: #FBFAF7; }
.btn-line { border: 1px solid var(--rust); color: var(--rust); background: transparent; }
.btn-line:hover { color: var(--rust-deep); border-color: var(--rust-deep); }

/* ── Methodology: the set document ──────────────────────────────────── */
.doc { max-width: 70ch; margin: 0 auto; padding: 56px 24px 20px; }
.doc-head { text-align: center; }
.doc-lede { font-size: 17px; line-height: 1.7; color: var(--dim); margin: 18px auto 0; max-width: 58ch; }
.mv { font-family: var(--mono); font-size: 0.42em; vertical-align: 0.55em; letter-spacing: 0.08em; color: var(--rust); }
.pullquote {
  margin: 48px 0; padding: 4px 4px 4px 28px;
  border-left: 2px solid var(--rust);
}
.pullquote p {
  font-family: var(--serif); font-size: 21.5px; line-height: 1.55;
  font-style: italic; margin: 0;
}
.pullquote strong { font-weight: 600; }
.pullquote code { font-style: normal; font-size: 0.72em; }
.doc-sec { margin-top: 14px; }
.doc-sec h2 {
  font-family: var(--serif); font-weight: 500; letter-spacing: -0.005em;
  font-size: 28px; line-height: 1.2; margin: 46px 0 14px;
}
.doc-sec p { font-size: 15.5px; line-height: 1.75; margin: 14px 0; }
.doc-sec ol, .doc-sec ul { font-size: 15.5px; line-height: 1.75; padding-left: 24px; }
.doc-sec li { margin: 8px 0; }
.method-table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 14px; line-height: 1.6; }
.method-table th {
  font-family: var(--mono); font-weight: 400; font-size: 10.5px;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--dim);
  text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--ink);
}
.method-table td { padding: 13px 16px 13px 0; border-top: 1px solid var(--line); vertical-align: top; }
.method-table tbody tr:first-child td { border-top: none; }
.mt-class { white-space: nowrap; }
.mt-members { max-width: 22ch; }
.grade-table { min-width: 0; max-width: 26rem; }
.inkblock {
  background: var(--ink); color: var(--paper);
  font-family: var(--mono); font-size: 14px; line-height: 1.8;
  padding: 20px 26px; border-radius: 3px; overflow-x: auto; margin: 18px 0;
}
.seal-row { display: flex; flex-wrap: wrap; gap: 16px; margin: 22px 0 18px; }

/* ── Design switcher (four-up trial) ────────────────────────────────── */
.design-switcher {
  position: fixed; right: 18px; bottom: 18px; z-index: 50;
  display: flex; align-items: baseline; gap: 2px;
  background: var(--card); border: 1px solid var(--line); border-radius: 3px;
  box-shadow: 0 2px 12px rgba(33, 30, 26, 0.09);
  padding: 7px 12px; font-size: 13px;
}
.design-switcher .ds-label {
  font-family: var(--serif); font-style: italic; font-size: 13.5px;
  color: var(--dim); margin-right: 8px;
}
.design-switcher a { color: var(--ink); text-decoration: none; padding: 3px 7px; }
.design-switcher a:hover { color: var(--rust); }
.design-switcher a[aria-current="true"] {
  color: var(--rust); font-weight: 600;
  text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1.5px;
}

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .tenets { grid-template-columns: 1fr; }
  .tenet { border-right: none; border-top: 1px solid var(--line); padding: 24px 4px 16px; }
  .tenet:first-child { border-top: none; }
}
@media (max-width: 640px) {
  .m-top { padding: 22px 20px 18px; }
  .m-foot { padding-left: 20px; padding-right: 20px; }
  .hero { padding-top: 56px; }
  .feature-card { flex-direction: column-reverse; align-items: flex-start; gap: 18px; padding: 22px; }
  .mrow { grid-template-columns: 96px minmax(0, 1fr) 52px; gap: 10px; }
  .mphase-name { font-size: 11.5px; }
  table.directory { padding: 0 20px; }
  table.directory tr { gap: 16px 18px; }
  .entry-name { font-size: 22px; }
  .entry-seal .mseal { width: 48px; height: 48px; font-size: 22px; }
  .design-switcher { right: 10px; bottom: 10px; }
}
@media (max-width: 420px) {
  .hero-cta { flex-direction: column; }
  .plate-title { font-size: 27px; }
}
`;
