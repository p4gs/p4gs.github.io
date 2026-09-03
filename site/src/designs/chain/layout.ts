/**
 * Chain — shared page chrome. All hrefs are ctx-scoped by construction: the
 * four-up build sets the render context per page via setCtx(); outside the
 * build (tests, direct calls) the default keeps BASE_PATH-rooted,
 * switcherless behavior. No cross-imports from other designs.
 */
import { ACTION_REPO_URL, BASE_PATH, METHODOLOGY_VERSION, REPO_URL } from "../../config";
import { lookupFacts, type ListingFacts } from "../../listing";
import type { DesignCtx } from "../types";

let ctx: DesignCtx = {
  prefix: BASE_PATH,
  h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
  switcher: "",
  active: "",
};
export function setCtx(next: DesignCtx): void {
  ctx = next;
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * What the evidence merge did for one listing — contradictions, a stale local
 * record, assertions held back awaiting independent observation. Read through
 * the render context so a design never has to be handed it explicitly.
 */
export function factsFor(r: Parameters<typeof lookupFacts>[1]): ListingFacts {
  return lookupFacts(ctx.facts, r);
}

/** Internal link helper — the only sanctioned way to build an internal href. */
export function href(path: string): string {
  return ctx.h(path);
}

/** Google Fonts: Sora (display), Inter Tight (body), Martian Mono (data). */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter+Tight:wght@400;500;600&family=Martian+Mono:wght@400;700&display=swap">`;

/** The two-links wordmark glyph (inline stroke SVG, 2px, 22 grid). */
const WORDMARK_GLYPH = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="8" width="7" height="7" rx="1.5"></rect><rect x="13" y="8" width="7" height="7" rx="1.5"></rect><path d="M9 11.5h4"></path></svg>`;

export type ActivePage = "home" | "directory" | "methodology";

export function page(opts: {
  title: string;
  body: string;
  active?: ActivePage;
}): string {
  const active = opts.active ?? ctx.active;
  const nav = (target: ActivePage, label: string, path: string) =>
    `<a href="${href(path)}"${active === target ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
${FONTS_HEAD}
<link rel="stylesheet" href="${href("style.css")}">
</head>
<body>
<header class="topbar">
  <div class="topbar-in">
    <a class="wordmark" href="${href("")}">${WORDMARK_GLYPH}<span>sscsb</span></a>
    <nav class="topnav" aria-label="Site">
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
    <span class="mono">tools.sensiblesecurity.xyz/sscsb</span>
    <span>Open source · Apache-2.0 · methodology v${METHODOLOGY_VERSION}</span>
  </div>
</footer>
${ctx.switcher}
</body>
</html>`;
}
