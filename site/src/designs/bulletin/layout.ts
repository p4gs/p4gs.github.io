/**
 * Bulletin page chrome — a broadsheet masthead over a hard 2px rule, a ruled
 * nav, and a colophon footer.
 *
 * Ctx-native, the shape `console/` uses: every renderer takes the DesignCtx
 * and every internal href goes through `ctx.h()`, so links stay inside this
 * design's own tree and nothing is threaded through module-level state. The
 * `setCtx` variant in `ledger/` and `chain/` does the same job with a module
 * global; a design with no module state cannot leak one render into the next,
 * which matters here because the test suite renders every design in one
 * process.
 */
import { ACTION_REPO_URL, METHODOLOGY_VERSION, REPO_URL, SCHEMA_VERSION, SITE_HOST_LABEL } from "../../config";
import type { DesignCtx } from "../types";

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
 *
 * The alternate trees publish the same pages under `_d/<id>/`. Without this a
 * crawler sees one copy per design and picks one; with it, the default design
 * is the copy that counts — the same page a first-time visitor gets.
 */
export function canonicalLink(ctx: DesignCtx): string {
  return ctx.canonical
    ? `\n<link rel="canonical" href="${escapeHtml(ctx.canonical)}">`
    : "";
}

/**
 * Anton (poster display + the oversized numerals), Source Sans 3 (humanist
 * body), IBM Plex Mono (data). Three families none of the other designs use,
 * each with a real fallback stack in the stylesheet: Anton falls back to the
 * condensed-heavy line (Haettenschweiler / Arial Narrow Bold / Impact), Source
 * Sans 3 to the humanist UI line, IBM Plex Mono to the platform monospace.
 *
 * THE ITALIC AXIS IS NOT OPTIONAL. The stylesheet asks for italics in
 * `.term-def` and in `<em>` — 25 elements on the methodology page alone — and
 * the request used to declare weights only. Measured: `Source Sans 3 italic
 * 400` and `Source Sans 3 400` returned the IDENTICAL 739.516px advance at
 * 40px, which is the signature of a SLANTED upright, not a loaded italic face.
 * (`document.fonts.check("italic 400 16px …")` answers true either way — it
 * reports renderability including synthesis, so it is not evidence.) Asking
 * for `ital,wght` loads the real cut.
 */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">`;

/** The masthead nav. Mono, uppercase, ruled; the active item takes the accent. */
function nav(ctx: DesignCtx): string {
  const item = (target: string, label: string, path: string) =>
    `<a href="${ctx.h(path)}"${
      ctx.active === target ? ' class="active" aria-current="page"' : ""
    }>${label}</a>`;
  return `<nav class="topnav" aria-label="Main">
      ${item("directory", "Directory", "directory/")}
      ${item("methodology", "Methodology", "methodology/")}
      <a href="${ACTION_REPO_URL}">Action</a>
      <a href="${REPO_URL}">Source</a>
    </nav>`;
}

export function page(
  ctx: DesignCtx,
  opts: { title: string; body: string; head?: string },
): string {
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
<body>
<a class="skip-link" href="#content">Skip to content</a>
<header class="masthead">
  <div class="mast-in">
    <a class="wordmark" href="${ctx.h("")}"><span class="wm-mark">SSCSB</span></a>
    <p class="mast-strap">Supply-chain scans, on the record</p>
    <p class="mast-edition">
      <span class="ed-k">Method</span><span class="ed-v">v${METHODOLOGY_VERSION}</span>
      <span class="ed-k">Schema</span><span class="ed-v">v${SCHEMA_VERSION}</span>
    </p>
    ${nav(ctx)}
  </div>
</header>
<main id="content">
${opts.body}
</main>
<footer class="colophon">
  <div class="colophon-in">
    <span class="col-domain">${SITE_HOST_LABEL}</span>
    <span class="col-meta">Open source · Apache-2.0 · methodology v${METHODOLOGY_VERSION}</span>
    <a class="col-top" href="#content">&#8593; Top</a>
  </div>
  <!-- THE SWITCHER IS COLOPHON, NOT OVERLAY. Rendered as a fixed box it was
       measured painting over body text at some scroll position on every page,
       twice over: two rows standing on the grade slab in round 1, and a 174x48
       chip cutting nine text runs out of the Scorecard comparison in round 2.
       Reserving clearance at the END of a document cannot protect its MIDDLE,
       so the only fix that holds at every width and every scroll position is
       to put it in the document. A broadsheet prints its apparatus in the
       colophon; so does this. -->
  ${ctx.switcher}
</footer>
</body>
</html>`;
}
