/**
 * Manual — the homepage: a centered field-manual title plate, the three
 * tenets (a real i./ii./iii. sequence), and one featured directory entry
 * wearing its real seal.
 */
import type { ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import type { DesignCtx } from "../types";
import { seal } from "./components";
import { escapeHtml, page } from "./layout";

const TENETS: ReadonlyArray<[string, string, string]> = [
  [
    "i.",
    "The commit is the boundary",
    "Keys never reach the repository, people sign what lands on the main branch, and any AI involvement is written down at the time — not found later in an incident review.",
  ],
  [
    "ii.",
    "Evidence, then verdicts",
    "A parts list, two scanners, and a signed receipt for every build — each claim tied to the exact file it describes, so something else can check it.",
  ],
  [
    "iii.",
    "A directory with a spine",
    "Public grades under published rules that refuse to count evidence the scanner itself created, or checks that never ran.",
  ],
];

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const repoCount = records.length;
  const tenets = TENETS.map(
    ([num, title, copy]) => `<div class="tenet">
    <div class="tenet-num" aria-hidden="true">${num}</div>
    <h2 class="tenet-title">${title}</h2>
    <p class="tenet-copy">${copy}</p>
  </div>`,
  ).join("\n  ");

  const featuredPath = "directory/p4gs--sscs-bootstrapper/";
  const body = `
<section class="hero">
  <p class="eyebrow">A field manual for the software supply chain</p>
  <h1 class="hero-hl">Security you can actually <em>verify</em>, not just claim.</h1>
  <p class="lede">An unperformed check is never a verdict.</p>
  ${searchControl(ctx.h, records, {
    label: "Look up a repository — or ask for one to be scanned",
    placeholder: "owner/repo",
    scanCopy:
      "No entry yet. Ask for a scan — every result is reviewed by a person before it appears.",
  })}
  <div class="hero-cta">
    <pre class="install"><code>brew install p4gs/p4gs/sscsb</code></pre>
    <a class="method-link" href="${ctx.h("methodology/")}">How scoring works</a>
  </div>
</section>

<div class="hp-panels">
${exemplarPanels(ctx.h, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(ctx.h)}

<section class="tenets" aria-label="The three tenets">
  ${tenets}
</section>

<section class="feature" aria-label="From the directory">
  <div class="feature-card">
    <div class="feature-copy">
      <p class="feature-eyebrow">From the directory</p>
      <p class="feature-name"><a href="${ctx.h(featuredPath)}"><span class="mono-strong">p4gs/sscs-bootstrapper</span></a> — the tool, scanned by itself.</p>
      <p class="feature-meta">81.8% of answered checks passed · 73.3% of checks answered · rules v1</p>
      <p class="feature-links"><a href="${ctx.h("directory/")}">Browse all ${escapeHtml(
        String(repoCount),
      )} ${repoCount === 1 ? "repository" : "repositories"}</a> · <a href="${ctx.h("directory/?submit=1")}">submit yours</a></p>
    </div>
    <a class="feature-seal" href="${ctx.h(featuredPath)}" aria-label="p4gs/sscs-bootstrapper scan report — grade B">${seal(
      "B",
      { label: "grade B" },
    )}</a>
  </div>
</section>`;
  return page(ctx, { title: "SSCS Bootstrapper", body });
}
