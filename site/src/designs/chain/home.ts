/**
 * Chain — product homepage. The hero object is the verification chain itself,
 * shown with the REAL values from sscsb's own directory record (the self-scan
 * of p4gs/sscs-bootstrapper: 100 / 100 / 50 / 100 / 100, Provenance flagged).
 * A snapshot, not a live read — labeled as such and linked to the directory
 * where the current record lives.
 */
import { ACTION_REPO_URL } from "../../config";
import type { ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import type { DesignCtx } from "../types";
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

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const repoCount = records.length;
  const repos = `${repoCount} ${repoCount === 1 ? "repository" : "repositories"}`;
  const body = `
<section class="hero">
  <p class="eyebrow mono">COMMIT → RELEASE, ACCOUNTED FOR</p>
  <h1 class="display-hl">Every link in the chain, verified&nbsp;in&nbsp;the&nbsp;open.</h1>
  <p class="lede">What passed, what failed, and what nobody could check.</p>
  ${searchControl(href, records, {
    label: "Follow a repository's chain — or ask for one to be scanned",
    placeholder: "owner/repo",
    scanCopy:
      "No chain on file yet. Ask for a scan — every result is reviewed by a person before it appears.",
  })}
</section>

<section class="card chain-card">
  ${heroChain(SELF_SCAN, { animate: true })}
  ${legendRow()}
  <p class="chain-caption">sscsb's own repository, scanned by sscsb — a snapshot from
  the <a href="${href("directory/")}">public directory</a>. Build receipts are
  mid-adoption, and the chain says so.</p>
</section>

<div class="hp-panels">
${exemplarPanels(href, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(href)}

<section class="cta-row">
  <a class="btn-dark" href="${href("directory/")}">Browse ${repos}</a>
  <span class="install-card mono">brew install p4gs/p4gs/sscsb</span>
</section>

<section class="feature-strip" aria-label="What this site is">
  <div class="card feature-card">
    <h2 class="feature-title">Honest math</h2>
    <p class="feature-copy">A check that could not run is a <strong>third state</strong>,
    shown hatched and never counted either way. An unperformed check is never a verdict,
    and A+ means every answered check passed.</p>
    <a class="arrow-link" href="${href("methodology/")}">How scoring works →</a>
  </div>
  <div class="card feature-card">
    <h2 class="feature-title">Run it in your build</h2>
    <p class="feature-copy">A scan from outside sees only what anyone can see. Run sscsb in
    your own build and it sees the rest, then signs the result so the signature proves
    where it came from.</p>
    <a class="arrow-link" href="${ACTION_REPO_URL}">Install the Action →</a>
  </div>
  <div class="card feature-card">
    <h2 class="feature-title">The links only you can forge</h2>
    <p class="feature-copy">About a dozen checks describe a developer's own laptop, where
    no scan can reach. A maintainer answers those by running the scan there and signing
    it with a key the repository already publishes.</p>
    <a class="arrow-link" href="${href("methodology/#local")}">How that is checked →</a>
  </div>
</section>
${CHAIN_SCRIPT}`;
  return page({ title: "SSCS Bootstrapper", body, active: "home" });
}
