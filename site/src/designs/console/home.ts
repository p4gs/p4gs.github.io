/**
 * Console home — live-verification hero with a glass telemetry card, the four
 * stat tiles, and the two scan lanes. One orchestrated motion moment: the
 * meters fill on load (staggered CSS transitions armed by a tiny inline
 * script; prefers-reduced-motion and no-JS both show the final state).
 */
import { ACTION_REPO_URL } from "../../config";
import type { PhaseScore } from "../../schema";
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
  ["44", "verifiable controls", ""],
  ["2", "scan lanes — external &amp; authenticated", ""],
  ["A+", "reserved for exactly 100%", " accent"],
  ["0", "unverified checks counted — ever", ""],
]
  .map(
    ([val, copy, cls]) => `<div class="stat-tile">
    <div class="stat-val${cls}">${val}</div>
    <div class="stat-copy">${copy}</div>
  </div>`,
  )
  .join("\n  ");

export function renderHome(repoCount: number, ctx: DesignCtx): string {
  const telemetry = `<div class="telemetry">
    <div class="tm-head">
      <a class="tm-repo" href="${ctx.h("directory/p4gs--sscs-bootstrapper/")}">p4gs/sscs-bootstrapper</a>
      ${gradeChip("B", "md")}
    </div>
    ${meterStack(FLAGSHIP_PHASES, { short: true, animate: true })}
    <div class="tm-foot">overall 81.8% · coverage 73.3% · <span class="prov-flag">provisional</span> · scanned 2026-09-01</div>
  </div>`;

  const body = `
<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow"><span class="live-dot" aria-hidden="true">●</span> Live verification</p>
    <h1 class="hero-hl">Your supply chain,<br>on instruments.</h1>
    <p class="lede">44 controls across five phases, verified with evidence and
    reported without spin. A check that couldn't run reads as unverified —
    never as a pass.</p>
    <div class="hero-cta">
      <pre class="install-pill"><code><span class="prompt">$</span> brew install p4gs/p4gs/sscsb</code></pre>
      <a class="btn" href="${ctx.h("directory/")}">Open the directory</a>
    </div>
    <p class="hero-count">${repoCount} ${repoCount === 1 ? "repository" : "repositories"} on the public record</p>
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

<section class="lane-strip" aria-label="Scan lanes">
  <div class="lane-cellblock">
    <p class="lane-eyebrow">LANE · EXTERNAL</p>
    <h2>The public directory</h2>
    <p class="body-copy">Every listed repository was scanned with sscsb itself and
    scored by a published, versioned methodology. Evidence the scanner created
    never counts, and checks that couldn't run stay hatched on the meter —
    shown, not spun.</p>
    <div class="btn-row">
      <a class="btn-outline" href="${ctx.h("directory/")}?submit=1">Submit a repo</a>
      <a class="btn-outline" href="${ctx.h("methodology/")}">Read the methodology</a>
    </div>
  </div>
  <div class="lane-cellblock">
    <p class="lane-eyebrow">LANE · AUTHENTICATED</p>
    <h2>Authenticated scans</h2>
    <p class="body-copy">External scans are honest about their limits. Run
    <code>sscsb-action</code> in your own CI to publish a record that sees what
    an outside scan cannot — through the same reviewed gate.</p>
    <div class="btn-row">
      <a class="btn" href="${ACTION_REPO_URL}">Install the Action</a>
    </div>
  </div>
</section>`;
  return page(ctx, { title: "SSCS Bootstrapper", body });
}
