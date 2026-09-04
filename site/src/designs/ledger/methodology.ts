/** The published scoring spec — the site's honesty contract, versioned. */
import { METHODOLOGY_VERSION } from "../../config";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { define, defineTerm } from "../../glossary";
import { CONTROL_CLASSES } from "../../reclassify";
import { threatsSection, THREATS_SECTION_ID } from "../threats-shared";
import {
  changelogItems,
  EVIDENCE_CLASS_RULES,
  scanProtocolIntro,
} from "../methodology-shared";
import { seal } from "./components";
import { href, page } from "./layout";

/** The grade-seal demo row: letters at 64px with alternating small tilts. */
const SEAL_TILTS = [-4, 2, -3, 3, -2, 4];
const GRADE_SEALS = (["A+", "A", "B", "C", "D", "F"] as const)
  .map((g, i) => seal(g, { size: 64, rotation: SEAL_TILTS[i] }))
  .join("\n      ");

export function renderMethodology(): string {
  const classTable = Object.entries(EVIDENCE_CLASS_RULES)
    .map(([key, d]) => {
      const members = Object.entries(CONTROL_CLASSES)
        .filter(([, cls]) => cls === key)
        .map(([id]) => `<code>${id}</code>`)
        .join(", ");
      return `<tr><td><strong>${d.name}</strong></td><td>${members}</td><td>${d.rule}</td></tr>`;
    })
    .join("\n");

  const rail = `<aside class="rail">
  <div class="rail-sticky">
    <div class="rail-head">LEDGER · v${METHODOLOGY_VERSION}</div>
    <nav aria-label="Methodology sections">
      <a class="rail-item rail-item-first" href="${href("methodology/#protocol")}"><span class="rail-dot" aria-hidden="true"></span>the protocol</a>
      <a class="rail-item rail-item-sub" href="${href(`methodology/#${THREATS_SECTION_ID}`)}">what the checks are for</a>
      <a class="rail-item rail-item-sub" href="${href("methodology/#evidence-classes")}">evidence classes</a>
      <a class="rail-item rail-item-sub" href="${href("methodology/#formula")}">the formula</a>
      <a class="rail-item rail-item-sub" href="${href("methodology/#grades")}">grades</a>
      <a class="rail-item rail-item-sub" href="${href("methodology/#trust")}">trust chain</a>
      <a class="rail-item rail-item-sub" href="${href("methodology/#local")}">the local lane</a>
      <a class="rail-item rail-item-sub" href="${href("methodology/#changelog")}">changelog</a>
    </nav>
  </div>
</aside>`;

  const body = `
<div class="method-grid">
${rail}
<div class="method-main">
  <div class="method-section">
    <h1 class="page-title">Scoring methodology <span class="mv">v${METHODOLOGY_VERSION}</span></h1>
    <p class="lede" style="font-size:17px">This directory measures
    <strong style="color:var(--ink)">sscsb-control adoption</strong> — not general
    security. The rules below are versioned; every repo page names the version
    that scored it.</p>
  </div>

  <div class="card">
    <div class="card-head"><span style="font-size:12px;font-weight:700;letter-spacing:0.08em">THE HONESTY RULE</span></div>
    <div class="honesty-body">The scanner runs <code>sscsb init</code> before verifying —
    which installs the very files many controls check for. So we snapshot the file
    list first: <strong>evidence the scanner created never counts.</strong> And a
    check that could not run is <strong class="term">unverified</strong>
    ${define("unverified")}. That is a third state: shown hatched, and left out of the
    sums entirely. An unperformed check is never a verdict.</div>
  </div>

  <section class="method-section prose" id="protocol">
    <h2>The scan protocol</h2>
    ${scanProtocolIntro(METHODOLOGY_VERSION)}
    <ol>
    <li>Shallow-clone the repository's default branch. <strong>The target's code is never executed.</strong></li>
    <li>Snapshot the committed file list (<code>git ls-files</code>).</li>
    <li>Run <code>sscsb init</code>, then <code>sscsb verify --format json</code> and <code>sscsb report --format json</code>.</li>
    <li>Reclassify: any control whose passing evidence was created by init scores <strong>gap</strong>, per the class rules below.</li>
    <li>Delete the clone. A maintainer reviews every record before it publishes.</li>
    </ol>
  </section>

${threatsSection(href)}

  <section class="method-section prose" id="evidence-classes">
    <h2>Evidence classes</h2>
    <p>Not every check can be answered from the same place. These five groups say who
    could see what, and each repository page names the group beside every check.</p>
    <div class="table-scroll">
    <table class="method-table">
    <thead><tr><th>Class</th><th>Controls</th><th>Rule</th></tr></thead>
    <tbody>
${classTable}
    </tbody>
    </table>
    </div>
    <h2>Scope</h2>
    <p>A control is in scope when it is enabled by sscsb's defaults <em>or</em> by the
    repository's own committed <code>.sscsb/config.toml</code>. Disabling a default-on
    control scores a gap — the denominator cannot be shrunk. Enabling an optional
    control puts it in scope against real evidence — never free points.</p>
  </section>

  <section class="method-section" id="formula">
    <div class="method-section-label">The formula</div>
    <pre class="inkblock"><code>countable = pass + fail + gap
phase %   = 100 · pass / countable
overall   = Σ pass / Σ countable
coverage  = Σ countable / |scope|</code></pre>
    <p class="grade-copy">Read it in words: ${defineTerm("countable")}. A
    ${defineTerm("gap")}. Checks nobody could answer are <strong>never</strong> in any
    sum, and a phase where nothing was answered reads "no evidence" — not 0%.</p>
  </section>

  <section class="method-section" id="grades">
    <div class="method-section-label">Grades · sealed</div>
    <div class="seal-row">
      ${GRADE_SEALS}
    </div>
    <p class="grade-copy"><span class="mono" style="font-weight:700">A+ = exactly 100%</span>
    · A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 60 · F below. Then ${defineTerm("coverage")}:
    under 50% there is no letter at all
    (<span class="mono" style="font-weight:700">NA</span>). Under 75% the letter is
    ${defineTerm("provisional")}.</p>
    <div class="prose">
      <div class="table-scroll">
      <table class="method-table">
      <thead><tr><th>Grade</th><th>Overall</th></tr></thead>
      <tbody>
      <tr><td><strong>A+</strong></td><td>exactly 100%</td></tr>
      <tr><td><strong>A</strong></td><td>≥ 90%, &lt; 100%</td></tr>
      <tr><td><strong>B</strong></td><td>≥ 80%, &lt; 90%</td></tr>
      <tr><td><strong>C</strong></td><td>≥ 70%, &lt; 80%</td></tr>
      <tr><td><strong>D</strong></td><td>≥ 60%, &lt; 70%</td></tr>
      <tr><td><strong>F</strong></td><td>&lt; 60%</td></tr>
      </tbody>
      </table>
      </div>
      <p>Evidence coverage below 50% yields <strong>NA</strong> — insufficient evidence for any
      letter. Coverage between 50% and 75% marks the letter <em>provisional</em>. This
      inherits sscsb's own doctrine: exit code 0 is not a clean bill of health, and an
      unperformed check is never converted into a verdict.</p>
    </div>
  </section>

  <section class="method-section prose" id="trust">
    <h2>Authenticated records: the trust chain</h2>
    <p>Three things can produce a record, and they see different amounts. That is the
    ${defineTerm("lane")}, shown as a badge on every listing. It decides nothing about
    the score. It tells you how far the scanner could see. Where a build leaves a signed
    receipt for what it produced, that receipt is an ${defineTerm("attestation")}.</p>
    <p>The checks that matter most — branch protection, Actions token permissions,
    security-feature enablement — are <em>repository settings</em>, readable only
    with repository credentials. The only place a complete scan can run is the
    repository's own CI, which raises the obvious question: when a repository hands
    in its own report card, why believe it? The answer is
    <a href="https://github.com/ossf/scorecard-action">OpenSSF Scorecard</a>'s, adopted
    deliberately.</p>
    <ol>
    <li><strong>Verified scanner.</strong> The action installs an sscsb release
    only after checking its Sigstore bundle. The bundle is checked against the tool
    repository's own release-workflow identity, at that exact tag. The scanner proves its
    own provenance before assessing anyone else's.</li>
    <li><strong>Signed record.</strong> With <code>id-token: write</code>, the action
    signs <code>scan-record.json</code> using ${defineTerm("keyless")}. Fulcio issues a short-lived
    certificate whose identity <em>is</em> the producing workflow: repository, workflow
    path, and branch ref. GitHub's OIDC issuer burns those in; the record does not assert
    them. The signature is then logged to Rekor.</li>
    <li><strong>Pinned verification.</strong> Ingest runs <code>cosign verify-blob</code>
    pinned to <code>https://github.com/OWNER/REPO/.github/workflows/sscsb-scan.yml@refs/heads/&lt;default branch&gt;</code>
    — the default branch fetched <em>live</em> from GitHub, never read from the
    record — and to the commit the record claims. A third party cannot mint that
    identity. A feature-branch or renamed-workflow signature does not verify. A record
    whose bundle fails verification is rejected outright. And the directory publishes the
    bundle beside every verified record, so anyone can re-run the check.</li>
    <li><strong>Human gate, still.</strong> Verified or not, nothing lists without a
    maintainer's <code>publish</code> label. An action-lane record that arrives
    <em>unsigned</em> is listed only as an unverified claim.</li>
    </ol>
    <p><strong>What this deliberately does not prove:</strong> that the workflow which
    signed the record was unmodified. A maintainer who edits their own
    <code>sscsb-scan.yml</code> can sign whatever it emits. OpenSSF Scorecard closes
    that gap. It fetches the producing workflow at the certificate's commit and
    rule-checks it: allow-listed steps only, no environment redirection, hosted runners.
    That is this directory's ingestion-hardening milestone. Until then, the human publish
    gate is the backstop.</p>
  </section>

  <section class="method-section prose" id="${LOCAL_SECTION_ID}">
    <h2>${LOCAL_TITLE}</h2>
    <p>About a dozen checks describe a developer's own machine, where no scan can look.
    A maintainer answers them by running the scan there and signing the result. The key
    they sign with is one the repository already publishes, in its
    ${defineTerm("anchor")}.</p>
    ${localLaneBody(href, "inkblock")}
  </section>

  <section class="method-section prose" id="changelog">
    <h2>Changelog</h2>
    <ul>
    ${changelogItems(href(`methodology/#${LOCAL_SECTION_ID}`), { includeProvenance: true })}
    </ul>
  </section>
</div>
</div>`;
  return page({ title: "Scoring Methodology", body, active: "methodology" });
}
