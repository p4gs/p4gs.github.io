/**
 * The domain-root landing page (tools.sensiblesecurity.xyz/) — the registry of
 * instruments hosted under this domain. Deliberately tiny and dependency-free;
 * each tool's real site lives at its own path.
 */
import { BASE_PATH } from "../../config";
import { escapeHtml, FONTS_HEAD } from "./layout";

export function renderLanding(repoCount: number): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sensible Security Tools</title>
${FONTS_HEAD}
<link rel="stylesheet" href="${BASE_PATH}style.css">
</head>
<body>
<header class="landing-bar">
  <div class="landing-bar-in">
    <span class="landing-domain">tools.sensiblesecurity.xyz</span>
    <a class="landing-gh" href="https://github.com/p4gs">github.com/p4gs ↗</a>
  </div>
</header>
<main>
  <section class="landing-hero">
    <p class="eyebrow">registry of instruments</p>
    <h1 class="landing-display">Sensible security, in&nbsp;tool&nbsp;form.</h1>
    <p class="lede">Open-source security engineering by p4gs. Each tool lives at its
    own path under this domain, with its evidence in the open.</p>
  </section>
  <section class="card registry-card">
    <div class="reg-left">
      <div class="reg-name-row">
        <span class="reg-name">SSCS Bootstrapper</span>
        <span class="reg-path">/sscsb</span>
      </div>
      <p class="reg-copy">Software supply chain security bootstrapped in one command —
      plus the public scan directory: repositories graded A+ to F under a published
      methodology, with authenticated scans from their own CI.</p>
      <nav class="reg-links">
        <a href="${BASE_PATH}">Tool</a>
        <a href="${BASE_PATH}directory/">Directory</a>
        <a href="${BASE_PATH}methodology/">Methodology</a>
      </nav>
    </div>
    <div class="reg-stats">
      <span class="stat-label">DIRECTORY</span>
      <span class="stat"><strong>${escapeHtml(String(repoCount))}</strong> ${
        repoCount === 1 ? "repo" : "repos"
      } scanned</span>
      <span class="stat"><strong>44</strong> controls each</span>
      <span class="stat"><strong>2</strong> lanes · ext + auth</span>
    </div>
  </section>
</main>
<footer class="landing-foot">
  <div class="landing-foot-in">More instruments will be registered here as they ship.</div>
</footer>
</body>
</html>`;
}
