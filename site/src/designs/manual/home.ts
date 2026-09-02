/**
 * Manual — the homepage: a centered field-manual title plate, the three
 * tenets (a real i./ii./iii. sequence), and one featured directory entry
 * wearing its real seal.
 */
import { SUBMIT_URL } from "../../config";
import type { DesignCtx } from "../types";
import { seal } from "./components";
import { escapeHtml, page } from "./layout";

const TENETS: ReadonlyArray<[string, string, string]> = [
  [
    "i.",
    "The commit is the boundary",
    "Secrets blocked at the hook, humans sign on protected branches, and AI involvement is declared in trailers — not discovered in an incident review.",
  ],
  [
    "ii.",
    "Evidence, then verdicts",
    "SBOMs, dual scanners, keyless signatures and SLSA provenance — every claim bound to a digest something else can check.",
  ],
  [
    "iii.",
    "A directory with a spine",
    "Public grades under a versioned methodology that refuses to count evidence the scanner created — or checks that never ran.",
  ],
];

export function renderHome(repoCount: number, ctx: DesignCtx): string {
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
  <p class="lede">Forty-four controls across five phases — from the commit boundary to
  continuous posture — bootstrapped in one command and reported with a bluntness
  your auditor will find unfamiliar. An unperformed check is never a verdict.</p>
  <div class="hero-cta">
    <pre class="install"><code>brew install p4gs/p4gs/sscsb</code></pre>
    <a class="method-link" href="${ctx.h("methodology/")}">Read the methodology</a>
  </div>
</section>

<section class="tenets" aria-label="The three tenets">
  ${tenets}
</section>

<section class="feature" aria-label="From the directory">
  <div class="feature-card">
    <div class="feature-copy">
      <p class="feature-eyebrow">From the directory</p>
      <p class="feature-name"><a href="${ctx.h(featuredPath)}"><span class="mono-strong">p4gs/sscs-bootstrapper</span></a> — the tool, scanned by itself.</p>
      <p class="feature-meta">81.8% overall · coverage 73.3% · <em>provisional</em> · methodology v1</p>
      <p class="feature-links"><a href="${ctx.h("directory/")}">Browse all ${escapeHtml(
        String(repoCount),
      )} ${repoCount === 1 ? "repository" : "repositories"}</a> · <a href="${SUBMIT_URL}">submit yours</a></p>
    </div>
    <a class="feature-seal" href="${ctx.h(featuredPath)}" aria-label="p4gs/sscs-bootstrapper scan report — grade B, provisional">${seal(
      "B",
      { label: "grade B, provisional" },
    )}</a>
  </div>
</section>`;
  return page(ctx, { title: "SSCS Bootstrapper", body });
}
