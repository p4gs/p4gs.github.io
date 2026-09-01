/**
 * The domain-root landing page (tools.sensiblesecurity.xyz/) — the router for
 * every tool hosted under this domain. Deliberately tiny and dependency-free;
 * each tool's real site lives at its own path.
 */
import { BASE_PATH } from "../config";
import { escapeHtml } from "./layout";

export function renderLanding(repoCount: number): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sensible Security Tools</title>
<link rel="stylesheet" href="${BASE_PATH}style.css">
</head>
<body>
<main style="max-width:640px;margin:0 auto;padding:72px 24px">
<h1 style="font-family:ui-monospace,Menlo,monospace">tools.sensiblesecurity.xyz</h1>
<p>Open-source security tooling by <a href="https://github.com/p4gs">p4gs</a>.</p>
<ul>
  <li><a href="${BASE_PATH}">SSCS Bootstrapper</a> — software supply chain security,
      bootstrapped in one command; includes the
      <a href="${BASE_PATH}directory/">public scan directory</a>
      (${escapeHtml(String(repoCount))} ${repoCount === 1 ? "repo" : "repos"} listed).</li>
</ul>
<p style="font-size:14px;opacity:.7">Each tool lives at its own path under this domain.</p>
</main>
</body>
</html>`;
}
