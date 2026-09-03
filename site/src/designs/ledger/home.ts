/** Product homepage: the verification receipt, five phases, and the directory hook. */
import { ACTION_REPO_URL } from "../../config";
import { LOCAL_SCAN_COMMAND } from "../../coverage";
import { seal } from "./components";
import { href, page } from "./layout";

const RECEIPT = `<div class="card">
  <div class="card-head">
    <span class="receipt-head-title">VERIFICATION RECEIPT</span>
    <span class="receipt-head-ver">sscsb 0.3.0</span>
  </div>
  <div class="receipt-body">
    <div><span class="r-dim">$</span> sscsb verify</div>
    <div><span class="r-pass">[PASS]</span> secrets <span class="r-dim">· trufflehog + gitleaks</span></div>
    <div><span class="r-pass">[PASS]</span> commit-signing <span class="r-dim">· human-only on main</span></div>
    <div><span class="r-pass">[PASS]</span> branch-protection <span class="r-dim">· PRs · sigs · checks</span></div>
    <div><span class="r-pass">[PASS]</span> slsa-provenance <span class="r-dim">· build L3</span></div>
    <div><span class="r-fail">[FAIL]</span> harden-runner <span class="r-dim">· 1 job unmonitored</span></div>
    <div><span class="r-skip">[·····]</span> signing-model <span class="r-dim">· awaiting attestation</span></div>
    <div class="receipt-sum">verify: <strong>1 failed, 1 degraded</strong></div>
  </div>
</div>`;

const PHASE_STRIP = [
  ["PHASE-1", "Commit integrity", "Secrets blocked at the hook. Humans sign; AI declares."],
  ["PHASE-2", "Dependencies", "SBOMs, dual scanners, a trust gate for every new package."],
  ["PHASE-3", "Provenance", "Keyless signatures and SLSA attestations, bound to digests."],
  ["PHASE-4", "SAST & CI", "OpenGrep, CodeQL, egress-monitored, pinned workflows."],
  ["PHASE-5", "Posture", "VEX, Security Insights, a compliance map that stays true."],
]
  .map(
    ([eyebrow, title, copy]) => `<div class="phase-cell">
    <div class="phase-cell-eyebrow">${eyebrow}</div>
    <div class="phase-cell-title">${title}</div>
    <div class="phase-cell-copy">${copy}</div>
  </div>`,
  )
  .join("\n  ");

export function renderHome(_repoCount: number): string {
  const body = `
<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">phase-0 · bootstrap</p>
    <h1 class="display-hl">Supply chain<br>security,<br>stamped&nbsp;in.</h1>
    <p class="lede">44 verifiable controls across five phases — secret scanning, signing
    policy, SBOMs, provenance, SAST — bootstrapped into any repo in one command.
    An unperformed check is never a verdict.</p>
    <div class="hero-cta">
      <pre class="install-cmd"><code>brew install p4gs/p4gs/sscsb</code></pre>
      <a class="arrow-link" href="${href("directory/")}">Browse the directory →</a>
    </div>
  </div>
  ${RECEIPT}
</section>

<section class="phase-strip" aria-label="The five phases">
  ${PHASE_STRIP}
</section>

<section class="twocol">
  <div class="col-block">
    <h2 class="h2-display">The public directory</h2>
    <p class="body-copy">Every listed repository was scanned with sscsb itself and scored by
    a published, versioned methodology. Evidence the scanner created never counts.
    Checks that couldn't run are shown, not spun.</p>
    <div class="seal-demo">
      ${seal("B", { size: 74, rotationKey: "demo-B" })}
      <p class="seal-demo-copy">Grades are inspection seals:
      <strong class="mono">A+</strong> is reserved for exactly&nbsp;100%.
      Unverified controls sit outside every denominator.</p>
    </div>
  </div>
  <div class="col-block">
    <h2 class="h2-display">Authenticated scans</h2>
    <p class="body-copy">External scans are honest about their limits. Run
    <span class="code-chip">sscsb-action</span> in your own CI to publish a record
    that sees what an outside scan cannot — through the same reviewed gate.</p>
    <div class="btn-row">
      <a class="btn" href="${ACTION_REPO_URL}">Install the Action</a>
      <a class="btn-outline" href="${href("directory/")}?submit=1">Submit a repo to the directory</a>
    </div>
  </div>
  <div class="col-block">
    <h2 class="h2-display">Local scans</h2>
    <p class="body-copy">Ten or eleven controls describe the development machine,
    which no repository scan can observe — the reason a well-run repository can still
    read <em>provisional</em>. <span class="code-chip">${LOCAL_SCAN_COMMAND}</span>
    signs a record with the git key your repository already commits in
    <span class="code-chip">allowed_signers</span>. Weaker evidence than CI, so it
    resolves exactly those controls and nothing else.</p>
    <div class="btn-row">
      <a class="btn-outline" href="${href("methodology/#local")}">How it is verified</a>
    </div>
  </div>
</section>`;
  return page({ title: "SSCS Bootstrapper", body });
}
