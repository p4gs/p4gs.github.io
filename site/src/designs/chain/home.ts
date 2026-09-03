/**
 * Chain — product homepage. The hero object is the verification chain itself,
 * shown with the REAL values from sscsb's own directory record (the self-scan
 * of p4gs/sscs-bootstrapper: 100 / 100 / 50 / 100 / 100, Provenance flagged).
 * A snapshot, not a live read — labeled as such and linked to the directory
 * where the current record lives.
 */
import { ACTION_REPO_URL } from "../../config";
import { LOCAL_SCAN_COMMAND } from "../../coverage";
import { CHAIN_SCRIPT, heroChain, legendRow, type ChainPhase } from "./components";
import { href, page } from "./layout";

/** Self-scan phase percents (p4gs/sscs-bootstrapper, methodology v1). */
const SELF_SCAN: ReadonlyArray<ChainPhase> = [
  { phase: 1, percent: 100 },
  { phase: 2, percent: 100 },
  { phase: 3, percent: 50 },
  { phase: 4, percent: 100 },
  { phase: 5, percent: 100 },
];

export function renderHome(repoCount: number): string {
  const repos = `${repoCount} ${repoCount === 1 ? "repository" : "repositories"}`;
  const body = `
<section class="hero">
  <p class="eyebrow mono">COMMIT → RELEASE, ACCOUNTED FOR</p>
  <h1 class="display-hl">Every link in the chain, verified&nbsp;in&nbsp;the&nbsp;open.</h1>
  <p class="lede">sscsb walks your supply chain phase by phase and shows its work —
  what passed, what failed, and what genuinely couldn't be checked.</p>
</section>

<section class="card chain-card">
  ${heroChain(SELF_SCAN, { animate: true })}
  ${legendRow()}
  <p class="chain-caption">sscsb's own repository, scanned by sscsb — a snapshot from
  the <a href="${href("directory/")}">public directory</a>. Provenance is mid-adoption,
  and the chain says so.</p>
</section>

<section class="cta-row">
  <a class="btn-dark" href="${href("directory/?submit=1")}">Scan your repository</a>
  <span class="install-card mono">brew install p4gs/p4gs/sscsb</span>
</section>

<section class="feature-strip" aria-label="What this site is">
  <div class="card feature-card">
    <h2 class="feature-title">Public directory</h2>
    <p class="feature-copy">${repos} scanned with sscsb itself and scored by a
    published, versioned methodology. Every record passes a maintainer's review
    before it appears.</p>
    <a class="arrow-link" href="${href("directory/")}">Browse the directory →</a>
  </div>
  <div class="card feature-card">
    <h2 class="feature-title">Honest math</h2>
    <p class="feature-copy">A check that could not run is <strong>unverified — a third
    state</strong>, shown hatched and kept outside every denominator. An unperformed
    check is never a verdict, and A+ means exactly&nbsp;100%.</p>
    <a class="arrow-link" href="${href("methodology/")}">Read the methodology →</a>
  </div>
  <div class="card feature-card">
    <h2 class="feature-title">Authenticated lane</h2>
    <p class="feature-copy">External scans are honest about their limits. Run
    <span class="code-chip">sscsb-action</span> in your own CI to publish a record
    that sees what an outside scan cannot — through the same reviewed gate.</p>
    <a class="arrow-link" href="${ACTION_REPO_URL}">Install the Action →</a>
  </div>
  <div class="card feature-card">
    <h2 class="feature-title">Local lane</h2>
    <p class="feature-copy">Ten or eleven controls describe the development machine,
    where no scan can reach — which is why a well-run repo can still read
    <em>provisional</em>. <span class="code-chip">${LOCAL_SCAN_COMMAND}</span> signs a
    record with the git key your repository already commits in
    <span class="code-chip">allowed_signers</span>. A shorter chain than CI, so it
    forges those links and no others.</p>
    <a class="arrow-link" href="${href("methodology/#local")}">How it is verified →</a>
  </div>
</section>
${CHAIN_SCRIPT}`;
  return page({ title: "SSCS Bootstrapper", body, active: "home" });
}
