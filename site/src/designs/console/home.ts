/**
 * Console home — live-verification hero with a glass telemetry card, the four
 * stat tiles, and the three scan lanes. One orchestrated motion moment: the
 * meters fill on load (staggered CSS transitions armed by a tiny inline
 * script; prefers-reduced-motion and no-JS both show the final state).
 */
import { ACTION_REPO_URL } from "../../config";
import type { PhaseScore, ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import { gradeChip, meterStack } from "./components";
import { page } from "./layout";
import type { DesignCtx } from "../types";

/**
 * The flagship telemetry: p4gs/sscs-bootstrapper's live directory record
 * (site/data/repos/p4gs--sscs-bootstrapper.json as scanned 2026-09-01) —
 * phases 100/100/50/100/100, grade B, overall 81.8%, coverage 73.3%.
 */
const FLAGSHIP_PHASES: readonly PhaseScore[] = [
  { phase: 1, pass: 4, fail: 0, gap: 0, unverified: 5, info: 0, percent: 100 },
  { phase: 2, pass: 3, fail: 0, gap: 0, unverified: 2, info: 0, percent: 100 },
  { phase: 3, pass: 4, fail: 0, gap: 4, unverified: 0, info: 0, percent: 50 },
  { phase: 4, pass: 4, fail: 0, gap: 0, unverified: 0, info: 0, percent: 100 },
  { phase: 5, pass: 3, fail: 0, gap: 0, unverified: 1, info: 0, percent: 100 },
];

const STAT_TILES = [
  ["44", "checks, across five phases", ""],
  ["3", "ways to get scanned — from outside, from your build, from your machine", ""],
  ["A+", "means every answered check passed", " accent"],
  ["0", "checks nobody could answer are ever counted against you", ""],
]
  .map(
    ([val, copy, cls]) => `<div class="stat-tile">
    <div class="stat-val${cls}">${val}</div>
    <div class="stat-copy">${copy}</div>
  </div>`,
  )
  .join("\n  ");

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const repoCount = records.length;
  const telemetry = `<div class="telemetry">
    <div class="tm-head">
      <a class="tm-repo" href="${ctx.h("directory/p4gs--sscs-bootstrapper/")}">p4gs/sscs-bootstrapper</a>
      ${gradeChip("B", "md")}
    </div>
    ${meterStack(FLAGSHIP_PHASES, { short: true, animate: true })}
    <div class="tm-foot">81.8% of answered checks passed · 73.3% answered · scanned 2026-09-01</div>
  </div>`;

  const body = `
<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow"><span class="live-dot" aria-hidden="true">●</span> Live verification</p>
    <h1 class="hero-hl">Your supply chain,<br>on instruments.</h1>
    <p class="lede">A check that could not run is never a pass.</p>
    ${searchControl(ctx.h, records, {
      label: "Find a repository — or ask for one to be scanned",
      placeholder: "owner/repo",
      scanCopy:
        "Not on the board yet. Ask for a scan — every result is reviewed by a person before it appears.",
    })}
    <p class="hero-count">${repoCount} ${repoCount === 1 ? "repository" : "repositories"} on the public record ·
    <a href="${ctx.h("directory/")}">open the directory</a></p>
  </div>
  ${telemetry}
</section>
<noscript><style>.tm-anim .mfill{width:var(--w)}</style></noscript>
<script>(function(){
  var t=document.querySelector(".tm-anim");
  if(!t)return;
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.classList.add("is-live");});});
})();</script>

<section class="stat-tiles" aria-label="Directory facts">
  ${STAT_TILES}
</section>

<div class="hp-panels">
${exemplarPanels(ctx.h, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(ctx.h)}

<section class="lane-strip" aria-label="How a scan gets run">
  <div class="lane-cellblock">
    <p class="lane-eyebrow">FROM OUTSIDE</p>
    <h2>The public directory</h2>
    <p class="body-copy">Anyone can ask for any public repository to be scanned. The scan
    sees only what anyone can see, and the meter says which checks it could not answer.</p>
    <div class="btn-row">
      <a class="btn-outline" href="${ctx.h("methodology/")}">How scoring works</a>
    </div>
  </div>
  <div class="lane-cellblock">
    <p class="lane-eyebrow">FROM YOUR BUILD</p>
    <h2>Run it yourself</h2>
    <p class="body-copy">Run sscsb in your own build and it sees settings an outside scan
    cannot, then signs the result so the signature proves where it came from.</p>
    <div class="btn-row">
      <a class="btn" href="${ACTION_REPO_URL}">Install the Action</a>
    </div>
  </div>
  <div class="lane-cellblock">
    <p class="lane-eyebrow">FROM YOUR MACHINE</p>
    <h2>The rest of the checks</h2>
    <p class="body-copy">About a dozen checks describe a developer's own laptop, where no
    scan can reach. A maintainer answers those by running the scan there and signing it.</p>
    <div class="btn-row">
      <a class="btn-outline" href="${ctx.h("methodology/#local")}">How that is checked</a>
    </div>
  </div>
</section>`;
  return page(ctx, { title: "SSCS Bootstrapper", body });
}
