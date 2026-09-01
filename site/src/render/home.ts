/** Product homepage: what sscsb is, install, and the directory hook. */
import { ACTION_REPO_URL, REPO_URL, SUBMIT_URL } from "../config";
import { href, page } from "./layout";

export function renderHome(repoCount: number): string {
  const body = `
<section class="hero">
  <h1>Software supply chain security,<br>bootstrapped in one command.</h1>
  <p class="lede"><strong>sscsb</strong> stands up 44 individually toggleable controls across
  five phases — secret scanning, commit signing policy, SBOMs, vulnerability
  scanning, SAST, dependency trust, SLSA provenance, and continuous posture —
  opinionated for solo developers and small teams in AI-heavy workflows.</p>
  <pre class="install"><code>brew install p4gs/p4gs/sscsb
cd your-repo && sscsb init</code></pre>
  <p class="hero-links">
    <a class="btn" href="${href("directory/")}">Browse the directory (${repoCount} repos)</a>
    <a class="btn btn-secondary" href="${SUBMIT_URL}">Submit your repo for a scan</a>
  </p>
</section>

<section class="phases-overview">
  <h2>Five phases, one boundary at a time</h2>
  <ol>
    <li><strong>Commit integrity</strong> — secret scanning hooks, human-only signing on protected branches, AI provenance trailers, branch protection.</li>
    <li><strong>Dependencies &amp; SBOM</strong> — Syft SBOMs, Trivy + OSV-Scanner, Renovate, a package-trust gate, OpenSSF Scorecard.</li>
    <li><strong>Provenance</strong> — Sigstore keyless signing, SLSA Build L3, GitHub attestations, immutable releases, Harden-Runner.</li>
    <li><strong>SAST &amp; CI hardening</strong> — OpenGrep, CodeQL, ClusterFuzzLite, extended workflow audits.</li>
    <li><strong>Continuous posture</strong> — OpenVEX, Security Insights, Best Practices Badge, OSPS Baseline, a compliance map across SLSA/SSDF/CRA.</li>
  </ol>
  <p>Every control verifies with evidence, and an unperformed check is reported as
  <em>degraded</em>, never silently passed — <a href="${REPO_URL}#readme">read the philosophy</a>.</p>
</section>

<section class="action-teaser">
  <h2>Authenticated scans, from your own CI</h2>
  <p>External directory scans are honest about their limits: local-environment
  controls show as unverified. The <a href="${ACTION_REPO_URL}">sscsb-action</a>
  runs sscsb inside your repository's own workflow, sees what an external scan
  cannot, and submits an authenticated record through the same reviewed
  publish gate.</p>
</section>

<section class="directory-teaser">
  <h2>The public directory</h2>
  <p>Like OpenSSF Scorecard's directory, but for supply-chain <em>control adoption</em>:
  every listed repository was scanned with sscsb itself, scored with a
  <a href="${href("methodology/")}">published, versioned methodology</a> that never
  counts evidence the scanner created and never converts an unperformed check
  into a verdict. Submit any public GitHub repository — scans run automatically
  in an isolated job, and a maintainer reviews every listing before it publishes.</p>
</section>`;
  return page({ title: "SSCS Bootstrapper", body });
}
