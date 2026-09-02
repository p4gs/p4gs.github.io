/**
 * Manual — shared page chrome for the Field Manual design.
 *
 * Light single-theme editorial register: paper ground, serif display, mono
 * data. Every internal href goes through ctx.h(); ctx.switcher lands
 * immediately before </body>. No hidden module state — ctx is passed in.
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
 * Google Fonts: Newsreader (display serif, optical sizing + italics),
 * Mona Sans (body), Commit Mono (data). Real fallback stacks live in the CSS.
 */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Mona+Sans:wght@400;500;600&family=Commit+Mono:wght@400;700&display=swap">`;

export function page(
  ctx: DesignCtx,
  opts: { title: string; body: string },
): string {
  const nav = (target: string, label: string, path: string) =>
    `<a href="${ctx.h(path)}"${ctx.active === target ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
${FONTS_HEAD}
<link rel="stylesheet" href="${ctx.h("style.css")}">
</head>
<body>
<header class="m-top">
  <a class="m-wordmark" href="${ctx.h("")}">SSCS Bootstrapper</a>
  <nav class="m-nav" aria-label="Site">
    ${nav("directory", "Directory", "directory/")}
    ${nav("methodology", "Methodology", "methodology/")}
    <a href="${ACTION_REPO_URL}">Action</a>
    <a href="${REPO_URL}">GitHub&nbsp;↗</a>
  </nav>
</header>
<main>
${opts.body}
</main>
<footer class="m-foot">
  <p>tools.sensiblesecurity.xyz/sscsb · open source · Apache-2.0 · methodology v${METHODOLOGY_VERSION}</p>
</footer>
${ctx.switcher}
</body>
</html>`;
}
