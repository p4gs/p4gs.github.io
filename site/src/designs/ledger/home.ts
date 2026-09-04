/**
 * Ledger home — search first.
 *
 * The page's job changed. It used to be a brochure with the directory one
 * click away and the search box stranded there; three of the sites worth
 * copying lead with one input, and ours does more than any of theirs (it finds
 * a listing OR asks for a scan of one that does not exist). So the input is
 * the first thing under the headline, the three panels prove the directory is
 * real, and the prose is a fraction of what it was.
 *
 * Copy discipline, measured against scorecard.dev: their sub-headline is 8
 * words; this one is 7. The old lede was 33 words in its first sentence and
 * used 27 undefined terms across the page. This page uses none of them —
 * `src/glossary.ts` lists what was retired and `test/home.test.ts` fails if
 * one comes back.
 */
import { ACTION_REPO_URL } from "../../config";
import type { ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import type { DesignCtx } from "../types";
import { href, page } from "./layout";

/**
 * The receipt stays. It is the page's strongest hand — a terminal transcript
 * where readers accept tool names they do not know, which is exactly where
 * jargon belongs and nowhere else.
 */
const RECEIPT = `<div class="card receipt-card">
  <div class="card-head">
    <span class="receipt-head-title">VERIFICATION RECEIPT</span>
    <span class="receipt-head-ver">sscsb 0.3.0</span>
  </div>
  <div class="receipt-body">
    <div><code><span class="r-dim">$</span> sscsb verify</code></div>
    <div><code><span class="r-pass">[PASS]</span> secrets <span class="r-dim">· no keys in the code</span></code></div>
    <div><code><span class="r-pass">[PASS]</span> commit-signing <span class="r-dim">· humans sign main</span></code></div>
    <div><code><span class="r-pass">[PASS]</span> branch-protection <span class="r-dim">· PR review</span></code></div>
    <div><code><span class="r-pass">[PASS]</span> slsa-provenance <span class="r-dim">· build receipts</span></code></div>
    <div><code><span class="r-fail">[FAIL]</span> harden-runner <span class="r-dim">· 1 job unwatched</span></code></div>
    <div><code><span class="r-skip">[·····]</span> signing-model <span class="r-dim">· nobody can check</span></code></div>
    <div class="receipt-sum"><code>verify: <strong>1 failed, 1 unanswered</strong></code></div>
  </div>
</div>`;

const PHASE_STRIP = [
  ["PHASE-1", "Commit integrity"],
  ["PHASE-2", "Dependencies"],
  ["PHASE-3", "Build receipts"],
  ["PHASE-4", "Code &amp; build hardening"],
  ["PHASE-5", "Ongoing posture"],
]
  .map(
    ([eyebrow, title]) => `<div class="phase-cell">
    <div class="phase-cell-eyebrow">${eyebrow}</div>
    <div class="phase-cell-title">${title}</div>
  </div>`,
  )
  .join("\n  ");

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const n = records.length;
  const body = `
<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">phase-0 · bootstrap</p>
    <h1 class="display-hl">Supply chain<br>security,<br>stamped&nbsp;in.</h1>
    <p class="lede">An unperformed check is never a verdict.</p>
    ${searchControl(href, records, {
      label: "Find a repository — or ask for one to be scanned",
      placeholder: "owner/repo",
      scanCopy:
        "Not listed yet. Ask for a scan — every result is reviewed by a person before it appears.",
    })}
    <p class="hero-count">${n} ${n === 1 ? "repository" : "repositories"} on the public record ·
    <a class="arrow-link" href="${href("directory/")}">browse them all →</a></p>
  </div>
  ${RECEIPT}
</section>

<section class="phase-strip" aria-label="The five phases">
  ${PHASE_STRIP}
</section>

<div class="hp-panels">
${exemplarPanels(href, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(href)}

<section class="twocol">
  <div class="col-block">
    <h2 class="h2-display">Scan your own</h2>
    <p class="body-copy">A scan from outside sees only what anyone can see. Run sscsb in your
    own build and it sees the rest — through the same review before publishing.</p>
    <div class="btn-row">
      <a class="btn" href="${ACTION_REPO_URL}">Install the Action</a>
      <a class="btn-outline" href="${href("methodology/")}">How scoring works</a>
    </div>
  </div>
  <div class="col-block">
    <h2 class="h2-display">Install the tool</h2>
    <p class="body-copy">44 checks, five phases, one command. It sets them up and then tells
    you, bluntly, which ones it could not answer.</p>
    <pre class="install-cmd"><code>brew install p4gs/p4gs/sscsb</code></pre>
  </div>
</section>`;
  return page({ title: "SSCS Bootstrapper", body });
}
