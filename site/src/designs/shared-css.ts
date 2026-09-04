/**
 * The stylesheet for the parts every design now shares — the home search
 * control, the three exemplar panels, the taxonomy chips and explainer, and
 * the per-repository exposure panel — plus one block of mobile hardening that
 * has to hold in all four.
 *
 * Each design keeps its own palette and type: it passes its own token names in
 * and the rules below are written against bridge variables, so a design can be
 * restyled without this file knowing anything about it. What may NOT vary is
 * the structure and the accessibility floors: 16px form controls (below that
 * iOS Safari zooms the viewport on focus and the page is then wider than the
 * screen), 44px tap targets, and nothing that can push the document sideways.
 *
 * The ledger design does not use this: it rides `site/public/style.css`, where
 * the same rules are written directly.
 */

export interface SharedTokens {
  /** Card/panel background. */
  surface: string;
  /** Page background — used for the taxonomy strip's rules. */
  ground: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  dim: string;
  /** Tertiary text / labels. */
  muted: string;
  /** Hairline. */
  line: string;
  /** Strong rule / card border. */
  lineStrong: string;
  /** Link and highlight colour. */
  accent: string;
  pass: string;
  fail: string;
  warn: string;
  /** A repeating-linear-gradient for the "nobody could answer this" state. */
  hatch: string;
  mono: string;
  display: string;
  /** Corner radius, e.g. "0" or "12px". */
  radius: string;
  /** Full box-shadow value for a card, or "none". */
  cardShadow: string;
}

export function sharedComponentCss(t: SharedTokens): string {
  return `
/* ── shared components (home panels, taxonomy, exposure) ───────────────── */
:root {
  --hp-surface: ${t.surface};
  --hp-ground: ${t.ground};
  --hp-ink: ${t.ink};
  --hp-dim: ${t.dim};
  --hp-muted: ${t.muted};
  --hp-line: ${t.line};
  --hp-line-strong: ${t.lineStrong};
  --hp-accent: ${t.accent};
  --hp-pass: ${t.pass};
  --hp-fail: ${t.fail};
  --hp-warn: ${t.warn};
  --hp-hatch: ${t.hatch};
  --hp-mono: ${t.mono};
  --hp-display: ${t.display};
  --hp-radius: ${t.radius};
  --hp-shadow: ${t.cardShadow};
  --tap: 44px;
  --hp-s--2: clamp(0.78rem, 0.755rem + 0.13vw, 0.8125rem);
  --hp-s--1: clamp(0.875rem, 0.85rem + 0.13vw, 0.9375rem);
  --hp-s-0:  clamp(1rem, 0.98rem + 0.1vw, 1.0625rem);
  --hp-s-1:  clamp(1.0625rem, 1.02rem + 0.23vw, 1.1875rem);
  --hp-s-3:  clamp(1.4375rem, 1.24rem + 0.97vw, 1.875rem);
}

/* ── mobile hardening, in every design ─────────────────────────────────── */
html { -webkit-text-size-adjust: 100%; }
body { min-block-size: 100dvh; overflow-wrap: break-word; }
/* Under 16px a focused form control makes iOS Safari zoom the page, and the
   page is then wider than the screen. This is a correctness floor. */
/* Accessibility floor, deliberately !important. Under 16px, iOS Safari zooms
   the viewport when a text field or select takes focus, and the page is then
   wider than the screen — the exact horizontal-overflow bug this whole pass
   exists to remove. A design may restyle these controls any way it likes; it
   may not put them back under 16px. Measured live: console #dir-filter was
   14px and #dir-sort 11px, chain 14.5px and 11px, manual #dir-sort 13.5px.
   Checkboxes are exempt — they carry no text and do not trigger the zoom. */
input:not([type="checkbox"]):not([type="radio"]), select, textarea {
  font-size: max(16px, 1em) !important;
}
input[type="search"], select { min-block-size: var(--tap); }
input[type="checkbox"], input[type="radio"] { inline-size: 20px; block-size: 20px; }
.table-scroll, pre { overflow-x: auto; -webkit-overflow-scrolling: touch; }
nav a, .btn, .btn-outline, .btn-dark, summary {
  min-block-size: var(--tap); display: inline-flex; align-items: center;
}
summary { justify-content: flex-start; }
.design-switcher { max-inline-size: calc(100vw - 20px); flex-wrap: wrap; }
.design-switcher a { min-block-size: var(--tap); padding: 6px 10px; }
/* Clearance for the FIXED switcher, on <body> rather than <main>: scrolled to
   the end of the page the switcher covers the FOOTER, which is outside main,
   so main's own bottom padding could never reach it. The switcher's script
   measures itself into --switcher-clearance (its height is 56px at 390px wide
   and 102px at 320px, where the links wrap onto three rows); the literal is
   the no-JS fallback, sized for that worst case. */
body { padding-block-end: var(--switcher-clearance, 132px); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
/* Landscape phones are height-constrained, not width-constrained. */
@media (max-height: 460px) and (orientation: landscape) {
  .hero { padding-block: 20px 24px; }
  .rail-sticky, .method-nav { position: static; }
}

/* ── the search-and-submit control ─────────────────────────────────────── */
.hp-search { margin-block: 14px; }
.hp-search-label {
  display: block; margin-block-end: 8px;
  font-family: var(--hp-mono); font-size: var(--hp-s--2); font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--hp-muted);
}
.hp-search-input {
  inline-size: 100%; max-inline-size: 520px; padding: 12px 16px;
  min-block-size: var(--tap); border-radius: var(--hp-radius);
  border: 2px solid var(--hp-line-strong); background: var(--hp-surface);
  color: var(--hp-ink); font-family: var(--hp-mono); font-size: 16px;
}
.hp-search-input::placeholder { color: var(--hp-muted); }
.hp-chips {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  margin-block: 10px 0; font-size: var(--hp-s--2);
}
.hp-chips-label {
  font-family: var(--hp-mono); font-size: var(--hp-s--2);
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--hp-muted);
}
.hp-chip {
  display: inline-flex; align-items: center; min-block-size: 36px;
  padding: 4px 10px; border: 1.5px solid var(--hp-line);
  border-radius: var(--hp-radius);
  font-family: var(--hp-mono); font-size: var(--hp-s--2);
  color: var(--hp-ink); text-decoration: none; background: var(--hp-surface);
}
.hp-chip:hover { border-color: var(--hp-accent); color: var(--hp-accent); }
/* A relative block that pushes the page down, never a floating dropdown. */
.dir-found {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  max-inline-size: 520px; margin-block-start: 14px; padding: 14px 16px;
  background: var(--hp-surface); border: 2px solid var(--hp-pass);
  border-radius: var(--hp-radius);
}
.dir-found-copy { margin: 0; font-size: var(--hp-s--1); color: var(--hp-dim); }
/* A class setting display:flex beats the user-agent rule that hides [hidden],
   so without this the "already listed" block is visible on every page load —
   it announced a match before anything had been typed. */
.dir-found[hidden], .dir-scan[hidden], [hidden] { display: none !important; }


/* ── exemplar panels ───────────────────────────────────────────────────── */
.hp-panels { display: grid; gap: clamp(28px, 5vw, 48px); padding-block: clamp(32px, 5vw, 56px); }
.hp-panel, .tx-strip { container-type: inline-size; min-inline-size: 0; }
.hp-panel-eyebrow {
  font-family: var(--hp-mono); font-size: var(--hp-s--2); font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--hp-accent);
  margin: 0 0 6px;
}
.hp-panel-title {
  font-family: var(--hp-display); font-size: var(--hp-s-3);
  letter-spacing: -0.01em; margin: 0; color: var(--hp-ink);
}
.hp-panel-line { font-size: var(--hp-s-0); color: var(--hp-dim); margin: 8px 0 20px; max-inline-size: 60ch; }

/* Container queries: how many cards fit is a property of the PANEL's width,
   not the window's. */
.hp-cards { display: grid; grid-template-columns: 1fr; gap: 16px; }
@container (min-width: 640px) { .hp-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (min-width: 900px) { .hp-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; } }

.hp-card {
  display: grid; grid-template-rows: auto auto 1fr auto auto; gap: 8px;
  min-block-size: 224px; padding: 16px; text-decoration: none; color: var(--hp-ink);
  background: var(--hp-surface); border: 1.5px solid var(--hp-line-strong);
  border-radius: var(--hp-radius); box-shadow: var(--hp-shadow);
}
.hp-card:hover { border-color: var(--hp-accent); }
.hp-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.hp-grade {
  display: inline-flex; align-items: center; justify-content: center;
  inline-size: 40px; block-size: 40px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--g, var(--hp-muted)); color: var(--g, var(--hp-muted));
  font-family: var(--hp-mono); font-weight: 700; font-size: var(--hp-s--1);
}
.hp-grade-aplus, .hp-grade-a, .hp-grade-b { --g: var(--hp-pass); }
.hp-grade-c { --g: var(--hp-warn); }
.hp-grade-d { --g: var(--hp-warn); }
.hp-grade-f { --g: var(--hp-fail); }
.hp-grade-na { --g: var(--hp-muted); }
.hp-src { font-family: var(--hp-mono); font-size: var(--hp-s--2); color: var(--hp-dim); text-align: end; line-height: 1.3; }
.hp-card-name {
  font-family: var(--hp-mono); font-size: var(--hp-s-0); font-weight: 700;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hp-card-desc {
  font-size: var(--hp-s--1); color: var(--hp-muted); line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  line-clamp: 2; overflow: hidden;
}
.hp-card-facts {
  display: flex; flex-wrap: wrap; gap: 4px 12px;
  font-family: var(--hp-mono); font-size: var(--hp-s--2); color: var(--hp-dim);
  border-block-start: 1px dashed var(--hp-line); padding-block-start: 8px;
}
.hp-fact-date { margin-inline-start: auto; }
.hp-card-note {
  font-size: var(--hp-s--2); color: var(--hp-warn); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  line-clamp: 2; overflow: hidden;
}
.hp-waiting {
  padding: clamp(16px, 3vw, 24px); background: var(--hp-surface);
  border: 2px dashed var(--hp-line-strong); border-radius: var(--hp-radius);
  display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
}
.hp-waiting-copy { margin: 0; font-size: var(--hp-s--1); color: var(--hp-dim); line-height: 1.55; max-inline-size: 62ch; }
.hp-waiting-link {
  font-weight: 600; font-size: var(--hp-s--1); color: var(--hp-ink);
  text-decoration: underline; text-underline-offset: 4px;
  display: inline-flex; align-items: center; min-block-size: var(--tap);
}
.hp-unans { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.hp-unans-row {
  display: grid; gap: 4px 12px; align-items: center; grid-template-columns: minmax(0, 1fr);
  padding-block-end: 10px; border-block-end: 1px solid var(--hp-line);
}
@container (min-width: 620px) {
  .hp-unans-row { grid-template-columns: minmax(140px, 1fr) minmax(80px, 2fr) auto minmax(0, 2fr); }
}
.hp-unans-id { font-family: var(--hp-mono); font-size: var(--hp-s--1); overflow-wrap: anywhere; }
.hp-unans-q { font-size: var(--hp-s--1); color: var(--hp-ink); line-height: 1.4; }
.hp-unans-q .hp-unans-id {
  display: block; font-family: var(--hp-mono); font-size: var(--hp-s--2);
  color: var(--hp-muted); margin-block-start: 2px;
}
.tx-questions { margin-block-start: 24px; }
.tx-q-table { min-inline-size: 640px; }
.tx-q-groups { font-family: var(--hp-mono); white-space: nowrap; }

.hp-unans-track { display: block; block-size: 8px; background: var(--hp-line); }
.hp-unans-fill { display: block; block-size: 100%; background: var(--hp-hatch); }
.hp-unans-count {
  font-family: var(--hp-mono); font-size: var(--hp-s--2); color: var(--hp-dim);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.hp-unans-why { font-size: var(--hp-s--2); color: var(--hp-muted); }
.hp-unans-foot { font-size: var(--hp-s--1); color: var(--hp-dim); line-height: 1.55; max-inline-size: 68ch; margin-block-start: 16px; }
.hp-more {
  display: inline-flex; align-items: center; min-block-size: var(--tap);
  font-weight: 600; font-size: var(--hp-s--1); color: var(--hp-ink);
  text-decoration: underline; text-underline-offset: 4px;
}
.hero-count { font-size: var(--hp-s--1); color: var(--hp-dim); }

/* ── taxonomy ──────────────────────────────────────────────────────────── */
.tx-strip { padding-block: clamp(24px, 4vw, 40px); border-block-start: 1.5px solid var(--hp-line); }
.tx-chips { display: grid; grid-template-columns: 1fr; gap: 8px; margin-block-end: 18px; }
@container (min-width: 560px) { .tx-chips { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (min-width: 880px) { .tx-chips { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.tx-chip {
  display: flex; align-items: center; gap: 10px; min-block-size: var(--tap); padding: 8px 12px;
  background: var(--hp-surface); border: 1.5px solid var(--hp-line);
  border-radius: var(--hp-radius); color: var(--hp-ink); text-decoration: none;
  font-size: var(--hp-s--1);
}
.tx-chip:hover { border-color: var(--hp-accent); color: var(--hp-accent); }
.tx-chip-id { font-family: var(--hp-mono); font-weight: 700; font-size: var(--hp-s--2); color: var(--hp-accent); flex-shrink: 0; }
.tx-classes { display: grid; gap: 20px; }
.tx-class {
  padding: 16px; background: var(--hp-surface);
  border-inline-start: 3px solid var(--hp-line-strong); border-radius: var(--hp-radius);
}
.tx-class-title { font-family: var(--hp-display); font-size: var(--hp-s-1); margin: 0 0 6px; color: var(--hp-ink); }
.tx-class-line { margin: 0 0 8px; font-size: var(--hp-s-0); color: var(--hp-ink); }
.tx-class-controls { margin: 0 0 8px; font-size: var(--hp-s--1); overflow-wrap: anywhere; }
.tx-label {
  font-family: var(--hp-mono); font-size: var(--hp-s--2); text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--hp-muted); margin-inline-end: 6px;
}
.tx-lineage { margin: 8px 0 0; font-family: var(--hp-mono); font-size: var(--hp-s--2); color: var(--hp-muted); }
.tx-incidents { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 12px; }
.tx-incident { display: grid; gap: 3px; font-size: var(--hp-s--1); }
.tx-incident-when { font-family: var(--hp-mono); font-size: var(--hp-s--2); color: var(--hp-muted); }
.tx-incident-what { color: var(--hp-dim); line-height: 1.5; }
.tx-reported {
  display: inline-block; font-family: var(--hp-mono); font-size: var(--hp-s--2);
  color: var(--hp-warn); border: 1px solid var(--hp-warn); padding: 0 6px; margin-inline-start: 6px;
}
.tx-sourcing { font-size: var(--hp-s--1); color: var(--hp-dim); }
.tx-defs { font-size: var(--hp-s-0); color: var(--hp-dim); line-height: 1.6; }
.tx-class-posture { border-inline-start-color: var(--hp-muted); border-inline-start-style: dashed; }

/* ── exposure panel ────────────────────────────────────────────────────── */
.exposure {
  margin-block: 32px; padding: clamp(16px, 3vw, 26px);
  background: var(--hp-surface); border: 1.5px solid var(--hp-line-strong);
  border-radius: var(--hp-radius);
}
.exposure .body-copy { color: var(--hp-dim); font-size: var(--hp-s--1); line-height: 1.55; margin: 0 0 18px; }
.ex-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.ex-row { display: grid; gap: 5px; padding-inline-start: 12px; border-inline-start: 3px solid var(--hp-line); }
/* Marks the EVIDENCE state, not a severity ranking — the scan has no data
   with which to rank one group above another. */
.ex-none-found { border-inline-start-color: var(--hp-fail); }
.ex-partial { border-inline-start-color: var(--hp-warn); }
.ex-evidenced { border-inline-start-color: var(--hp-pass); }
.ex-not-observed { border-inline-start-color: var(--hp-muted); border-inline-start-style: dashed; }
.ex-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 14px; }
.ex-name {
  font-weight: 600; font-size: var(--hp-s-0); color: var(--hp-ink); text-decoration: none;
  display: inline-flex; align-items: center; gap: 8px; min-block-size: 32px;
}
.ex-name:hover { color: var(--hp-accent); }
.ex-state {
  font-family: var(--hp-mono); font-size: var(--hp-s--2); text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--hp-muted);
}
.ex-line { font-size: var(--hp-s--1); color: var(--hp-dim); }
.ex-detail { font-size: var(--hp-s--2); color: var(--hp-dim); line-height: 1.5; overflow-wrap: anywhere; }
.ex-detail-quiet { color: var(--hp-muted); }
.ex-detail-label {
  font-family: var(--hp-mono); text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--hp-muted); margin-inline-end: 6px;
}
.ex-foot { margin-block-start: 18px; font-size: var(--hp-s--2); color: var(--hp-muted); line-height: 1.55; overflow-wrap: anywhere; }


/* ── tap targets, measured at 390px ────────────────────────────────────
   Each selector below was observed under 44px in a real render and is a
   standalone control, not a link inside a sentence (WCAG 2.5.8 exempts
   those). Named per design because the three alternates each ship their own
   class for the same thing. */
.wordmark, .m-wordmark,
.tm-repo, .method-link, .arrow-link, .entry-name, .repo-link {
  display: inline-flex; align-items: center; min-block-size: var(--tap);
}
.hp-search-label, .dir-filter-label, .dir-controls-label {
  display: flex; align-items: flex-end; min-block-size: var(--tap); padding-block-end: 6px;
}
.dir-check, .dir-sortbar label, .m-sortbar label {
  min-block-size: var(--tap); display: inline-flex; align-items: center;
}
.design-switcher a { min-block-size: var(--tap); }
.hp-chip { min-block-size: var(--tap); }

/* ── inline term definitions ───────────────────────────────────────────── */
.term { color: var(--hp-ink); }
.term-def { color: var(--hp-muted); font-style: italic; }
.key-note { font-size: var(--hp-s--1); color: var(--hp-dim); line-height: 1.6; max-inline-size: 70ch; margin-block: 6px 24px; }
`;
}
