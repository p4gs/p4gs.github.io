/**
 * Console page chrome — ctx-native: every render takes the DesignCtx and all
 * internal hrefs go through ctx.h(), so links stay inside this design's tree.
 */
import { ACTION_REPO_URL, METHODOLOGY_VERSION, REPO_URL } from "../../config";
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
 * The alternate design trees publish the same pages under `_d/<id>/`. Without
 * this, a crawler sees four copies of every page and picks one; with it, the
 * default design is the copy that counts, which is the same answer a
 * first-time visitor gets.
 */
export function canonicalLink(ctx: DesignCtx): string {
  return ctx.canonical
    ? `\n<link rel="canonical" href="${escapeHtml(ctx.canonical)}">`
    : "";
}

/** Geist (UI) + Geist Mono (instrument labels), with real fallback stacks in CSS. */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;700&display=swap">`;

export function page(
  ctx: DesignCtx,
  opts: { title: string; body: string; head?: string },
): string {
  const nav = (target: string, label: string, path: string) =>
    `<a href="${ctx.h(path)}"${ctx.active === target ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(opts.title)}</title>${canonicalLink(ctx)}
${FONTS_HEAD}
<link rel="stylesheet" href="${ctx.h("style.css")}">
${opts.head ?? ""}
</head>
<body>
<header class="topbar">
  <div class="topbar-in">
    <a class="wordmark" href="${ctx.h("")}"><span class="wm-dot" aria-hidden="true"></span><span class="wm-name">SSCSB</span><span class="wm-ver">v0.3.0</span></a>
    <nav class="topnav" aria-label="Main">
      ${nav("directory", "Directory", "directory/")}
      ${nav("methodology", "Methodology", "methodology/")}
      <a href="${ACTION_REPO_URL}">Action</a>
      <a class="ext" href="${REPO_URL}">GitHub ↗</a>
    </nav>
  </div>
</header>
<main>
${opts.body}
</main>
<footer class="site-footer">
  <div class="footer-in">
    <span class="domain">tools.sensiblesecurity.xyz/sscsb</span>
    <span>Open source · Apache-2.0 · methodology v${METHODOLOGY_VERSION}</span>
  </div>
</footer>
${ctx.switcher}
</body>
</html>`;
}
