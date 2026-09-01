/** Shared page chrome. All hrefs are BASE_PATH-prefixed by construction. */
import { ACTION_REPO_URL, BASE_PATH, METHODOLOGY_VERSION, REPO_URL } from "../config";

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Internal link helper — the only sanctioned way to build an internal href. */
export function href(path: string): string {
  return `${BASE_PATH}${path.replace(/^\//, "")}`;
}

/** Google Fonts: Archivo (display), Public Sans (body), Spline Sans Mono (data). */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=Public+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500;700&display=swap">`;

export type ActivePage = "directory" | "methodology";

export function page(opts: {
  title: string;
  body: string;
  head?: string;
  active?: ActivePage;
}): string {
  const nav = (target: ActivePage, label: string, path: string) =>
    `<a href="${href(path)}"${opts.active === target ? ' class="active"' : ""}>${label}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
${FONTS_HEAD}
<link rel="stylesheet" href="${href("style.css")}">
${opts.head ?? ""}
</head>
<body>
<header class="topbar">
  <div class="topbar-in">
    <a class="wordmark" href="${href("")}">sscsb<span class="caret">▮</span></a>
    <nav class="topnav">
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
</body>
</html>`;
}
