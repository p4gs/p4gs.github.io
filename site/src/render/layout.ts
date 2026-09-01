/** Shared page chrome. All hrefs are BASE_PATH-prefixed by construction. */
import { BASE_PATH, REPO_URL, SITE_NAME } from "../config";

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

export function page(opts: { title: string; body: string; head?: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<link rel="stylesheet" href="${href("style.css")}">
${opts.head ?? ""}
</head>
<body>
<header class="site-header">
  <a class="brand" href="${href("")}">${escapeHtml(SITE_NAME)}</a>
  <nav>
    <a href="${href("directory/")}">Directory</a>
    <a href="${href("methodology/")}">Methodology</a>
    <a href="${REPO_URL}">GitHub</a>
  </nav>
</header>
<main>
${opts.body}
</main>
<footer class="site-footer">
  <p>${escapeHtml(SITE_NAME)} — opinionated, modular software supply chain security.
  <a href="${REPO_URL}">Source</a> · <a href="${href("methodology/")}">Scoring methodology</a></p>
</footer>
</body>
</html>`;
}
