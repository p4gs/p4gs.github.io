/**
 * Signal — the home page.
 *
 * "The instrument, not the billboard." There is nothing to sell here: no
 * pricing, no waitlist, no beta. So the hero's whole job is to state the
 * premise and put the directory one interaction away. The search box is the
 * primary action and sits above the fold; the live stat row takes the place a
 * "Get started" button would have occupied on a product page.
 *
 * The pipeline figure beside it is drawn, not screenshotted — four nodes on
 * hairline connectors with mono labels. A product screenshot would date, and
 * would show a UI rather than the claim the page is actually making.
 */
import { ACTION_REPO_URL } from "../../config";
import type { ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import type { DesignCtx } from "../types";
import { stat } from "./components";
import { href, page } from "./layout";
import { CONTROL_COUNT } from "../../reclassify";

/** The median of the listings that produced any answer at all. */
function medianPassed(records: readonly ScanRecord[]): string {
  const vs = records
    .map((r) => r.score.overall_percent)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (vs.length === 0) return "—";
  const mid = Math.floor(vs.length / 2);
  const m = vs.length % 2 === 1 ? vs[mid]! : (vs[mid - 1]! + vs[mid]!) / 2;
  return `${Math.round(m)}%`;
}

function answeredChecks(records: readonly ScanRecord[]): number {
  return records.reduce(
    (total, r) =>
      total + r.score.phases.reduce((n, p) => n + p.pass + p.fail + p.gap, 0),
    0,
  );
}

function lastScan(records: readonly ScanRecord[]): string {
  const days = records.map((r) => r.scanned_at.slice(0, 10)).sort();
  return days.length ? days[days.length - 1]! : "—";
}

/** source → resolve → evaluate → sign, in the brand's own hand. */
const PIPELINE = `<figure class="sg-pipe" aria-label="How a scan is produced: read the repository, resolve what it declares, evaluate each check, sign the result">
  <figcaption class="sg-pipe-cap">How one record is made</figcaption>
  <ol class="sg-pipe-flow">
    <li class="sg-pipe-node"><span class="sg-pipe-n">01</span><span class="sg-pipe-name">source</span><span class="sg-pipe-note">clone, never execute</span></li>
    <li class="sg-pipe-node"><span class="sg-pipe-n">02</span><span class="sg-pipe-name">resolve</span><span class="sg-pipe-note">snapshot before setup</span></li>
    <li class="sg-pipe-node"><span class="sg-pipe-n">03</span><span class="sg-pipe-name">evaluate</span><span class="sg-pipe-note">${CONTROL_COUNT} checks, each answered or left unanswered</span></li>
    <li class="sg-pipe-node"><span class="sg-pipe-n">04</span><span class="sg-pipe-name">sign</span><span class="sg-pipe-note">the record, in the open</span></li>
  </ol>
</figure>`;

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const n = records.length;
  const repos = `${n} ${n === 1 ? "repository" : "repositories"}`;
  const body = `
<section class="sg-hero">
  <div class="sg-hero-copy">
    <p class="sg-eyebrow">SUPPLY-CHAIN SECURITY · SCANNED IN PUBLIC</p>
    <h1 class="sg-display">What each repository can <em class="hl">prove</em>&nbsp;— and what nobody could check.</h1>
    <p class="sg-lede">Every listing here is a public record of one scan of one commit.</p>
    ${searchControl(href, records, {
      label: "Find a repository — or ask for one to be scanned",
      placeholder: "owner/repo",
      scanCopy:
        "Not on file yet. Ask for a scan — a person reviews every result before it appears.",
    })}
  </div>
  ${PIPELINE}
  <div class="sg-stats" role="group" aria-label="Directory at a glance">
    ${stat("Listings", String(n))}
    ${stat("Checks answered", String(answeredChecks(records)))}
    ${stat("Median passed", medianPassed(records))}
    ${stat("Last scan", lastScan(records))}
  </div>
</section>

<div class="hp-panels">
${exemplarPanels(href, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(href)}

<section class="sg-cta">
  <a class="btn" href="${href("directory/")}">Browse ${repos}</a>
  <code class="sg-install">brew install p4gs/p4gs/sscsb</code>
</section>

<section class="sg-features" aria-label="What this site is">
  <article class="sg-feature">
    <h2 class="sg-feature-title">Honest arithmetic</h2>
    <p class="sg-feature-copy">A check that could not run is a third state. It is shown as
    a dashed ring and left out of the sums. An unanswered check is never a verdict, and
    A+ means every answered check passed.</p>
    <a class="sg-arrow" href="${href("methodology/")}">How scoring works →</a>
  </article>
  <article class="sg-feature">
    <h2 class="sg-feature-title">Run it in your own build</h2>
    <p class="sg-feature-copy">A scan from outside sees only what anyone can see. Run
    sscsb in your own build and it sees the rest. It then signs the result, so the
    signature proves where the record came from.</p>
    <a class="sg-arrow" href="${ACTION_REPO_URL}">Install the Action →</a>
  </article>
  <article class="sg-feature">
    <h2 class="sg-feature-title">The checks only you can answer</h2>
    <p class="sg-feature-copy">About a dozen checks describe a developer's own laptop,
    where no scan can reach. A maintainer answers those by running the scan there and
    signing it. The key they sign with is one the project already publishes.</p>
    <a class="sg-arrow" href="${href("methodology/#local")}">How that is checked →</a>
  </article>
</section>`;
  return page({ title: "SSCS Bootstrapper", body, active: "home" });
}
