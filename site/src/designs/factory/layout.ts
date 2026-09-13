/**
 * Factory page chrome — a static 64px header that scrolls away for good, one
 * fixed search affordance in the top-right corner, and a colophon that carries
 * the switcher in the document flow.
 *
 * Ctx-native, the shape `bulletin/` uses: every renderer takes the DesignCtx
 * and every internal href goes through `ctx.h()`, so links stay inside this
 * design's own tree and nothing is threaded through module-level state.
 *
 * THE HEADER'S HEIGHT IS LOAD-BEARING, not decoration. The hero aperture's
 * scroll-driven animation is wired so its progress equals `scrollY /
 * innerHeight` over exactly the first viewport — which is only true when the
 * opening panel is `100svh` MINUS the header and the header is exactly the
 * height the panel subtracts. So the header is a fixed 64px (54 at ≤767px),
 * set from the same custom property the panel reads, and the page is flush
 * against it: no margin, no padding, nothing between them.
 */
import {
  ACTION_REPO_URL,
  METHODOLOGY_VERSION,
  REPO_URL,
  SCHEMA_VERSION,
  SITE_HOST_LABEL,
} from "../../config";
import type { DesignCtx } from "../types";
import { MOTION_SCRIPT } from "./motion";

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * `<link rel="canonical">` for this page: always the DEFAULT design's URL.
 * The alternate trees are a design trial, not six publications.
 */
export function canonicalLink(ctx: DesignCtx): string {
  return ctx.canonical
    ? `\n<link rel="canonical" href="${escapeHtml(ctx.canonical)}">`
    : "";
}

/**
 * TWO FAMILIES, and that is the whole typographic vocabulary: Inter for display
 * AND body — the reference's display weight is 400 and nothing on it is bold —
 * and JetBrains Mono for ids, numerals and data.
 *
 * SOURCE SERIF 4 IS GONE. It existed for one editorial pull-quote per page and
 * for the inline term glosses — a third family, with an italic axis, requested
 * on every page of the site so that two paragraphs could be set in it. The
 * reference sets its own pull-quote in the sans, and two families is the whole
 * typographic vocabulary this design gets.
 */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap">`;

/**
 * The header nav. Two destinations only, because the header is 64px tall and
 * every item in it has to clear a 44px tap target beside a wordmark — the
 * Action and the source are in the colophon, where there is room to name them.
 */
function nav(ctx: DesignCtx): string {
  const item = (target: string, label: string, path: string) =>
    `<a href="${ctx.h(path)}"${
      ctx.active === target ? ' class="is-here" aria-current="page"' : ""
    }>${label}</a>`;
  return `<nav class="fy-nav" aria-label="Main">
      ${item("directory", "Directory", "directory/")}
      ${item("methodology", "Methodology", "methodology/")}
    </nav>`;
}

/**
 * The fixed top-right search affordance.
 *
 * The reference ships this slot at `opacity: 0`; ours is visible, because on a
 * directory the one thing a reader always wants is the box that finds a
 * listing, and the header it lives beside scrolls away after the first
 * viewport. It is drawn in mid-grey on no ground at all, so it reads on the
 * white chapters AND on the black opening block without knowing which one is
 * under it — a `position: fixed` element cannot ask.
 */
function searchAffordance(ctx: DesignCtx): string {
  return `<a class="fy-find" href="${ctx.h("directory/#dir-filter")}" title="Find a repository">
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
    <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
    <path d="M13.4 13.4 17 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
  </svg><span class="fy-vh">Find a repository</span></a>`;
}

export interface PageOpts {
  title: string;
  body: string;
  head?: string;
  /**
   * The home page runs the aperture straight off the header, so `main` takes
   * no padding there. Every other page is ordinary prose and does.
   */
  flush?: boolean;
}

export function page(ctx: DesignCtx, opts: PageOpts): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(opts.title)}</title>${canonicalLink(ctx)}
${FONTS_HEAD}
<link rel="stylesheet" href="${ctx.h("style.css")}">
${opts.head ?? ""}
</head>
<body class="${opts.flush ? "fy-flush" : "fy-paged"}">
<a class="fy-skip" href="#content">Skip to content</a>
<header class="fy-header">
  <div class="fy-header-in">
    <a class="fy-wordmark" href="${ctx.h("")}">SSCSB</a>
    ${nav(ctx)}
  </div>
</header>
${searchAffordance(ctx)}
<main id="content">
${opts.body}
</main>
<!-- ONE inline script for the whole design, emitted here so no renderer can
     forget it and no page can end up with two. It checks
     prefers-reduced-motion before it observes anything, and everything it
     touches is already correct in the markup above without it. -->
<script>${MOTION_SCRIPT}</script>
<footer class="fy-colophon">
  <div class="fy-colophon-in">
    <p class="fy-col-line">
      <span class="fy-col-host">${SITE_HOST_LABEL}</span>
      <span class="fy-col-meta">Open source · Apache-2.0 · methodology v${METHODOLOGY_VERSION} ·
      record schema v${SCHEMA_VERSION}</span>
    </p>
    <p class="fy-col-links">
      <a href="${ACTION_REPO_URL}">The Action</a>
      <a href="${REPO_URL}">Source</a>
      <a class="fy-col-top" href="#content">&#8593; Top</a>
    </p>
  </div>
  <!-- THE SWITCHER IS COLOPHON, NOT OVERLAY. Measured on Bulletin: rendered
       fixed it painted over body text at some scroll position on every page,
       twice over, and reserving clearance at the END of a document cannot
       protect its MIDDLE. This page already carries one fixed element (the
       search affordance, 40px square in a corner nothing else occupies);
       a second one that grows with the number of designs is not a trade worth
       making. -->
  ${ctx.switcher}
</footer>
</body>
</html>`;
}
