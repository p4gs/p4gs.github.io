/** The published scoring spec — the site's honesty contract, versioned. */
import { METHODOLOGY_VERSION } from "../../config";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { CONTROL_CLASSES } from "../../reclassify";
import { seal } from "./components";
import { href, page } from "./layout";

const CLASS_DESCRIPTIONS: Readonly<Record<string, { name: string; rule: string }>> = {
  A: {
    name: "A — committed artifacts",
    rule: "The control's evidence is files committed to the repository. If any registered artifact was created by the scanner's own `sscsb init` (absent from the pre-init file snapshot), the control scores <strong>gap</strong> — evidence the scanner installed seconds earlier is never the repository's evidence. A pre-existing artifact that fails sscsb's shape checks is a real <strong>fail</strong>. For tool-backed controls (secrets, sbom, vuln-scan, sast, provenance-verify) whose raw verdict only reflects scanner-machine tool availability, the committed artifacts decide instead.",
  },
  Aprime: {
    name: "A′ — static audits of committed workflows",
    rule: "actions-audit, workflow-audit-extended, and harden-runner parse every workflow file. With zero pre-existing workflows the verdict would be vacuous, so it scores <strong>unverified</strong>. Otherwise the raw verdict maps directly: sscsb's own installed templates pass its audit by construction, so init can only pollute toward pass — a fail always implicates the repository's own workflows.",
  },
  B: {
    name: "B — live remote checks",
    rule: "branch-protection and Scorecard query GitHub itself; init cannot influence them, so raw verdicts map directly. Scorecard's live alert feed requires permissions a cross-repo scan lacks — that half is recorded as unverified, never guessed.",
  },
  C: {
    name: "C — local environment",
    rule: "Commit signing, signing-model posture, AI trailers, package-trust hooks and similar controls describe the <em>development machine</em>, which no repository scan can observe — from inside CI or out. A repository scan therefore records them as <strong>unverified</strong>: an unperformed check is a third state, never a pass or fail. Class C is the one class a signed local record can settle <strong>by itself</strong>, because there the maintainer's signed word is the best evidence that can exist. It is <em>not</em> the only class a local record may resolve: a local record votes on every control it holds, and its verdict on a class A, A′ or B row becomes countable as soon as an independent record agrees with it — and scores a gap if one disagrees. See “the local lane” below.",
  },
  M: {
    name: "M — meta / informational",
    rule: "compliance-map (about sscsb itself) and secure-repo (an external service pointer) are excluded from scoring entirely.",
  },
};

/** The grade-seal demo row: letters at 64px with alternating small tilts. */
const SEAL_TILTS = [-4, 2, -3, 3, -2, 4];
const GRADE_SEALS = (["A+", "A", "B", "C", "D", "F"] as const)
  .map((g, i) => seal(g, { size: 64, rotation: SEAL_TILTS[i] }))
  .join("\n      ");

export function renderMethodology(): string {
  const classTable = Object.entries(CLASS_DESCRIPTIONS)
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
    check that could not run is <strong>unverified — a third state</strong>, shown
    hatched, outside every denominator. An unperformed check is never a verdict.</div>
  </div>

  <section class="method-section prose" id="protocol">
    <h2>The scan protocol</h2>
    <p>This directory measures <strong>sscsb-control adoption</strong> — how much of the
    supply-chain posture sscsb can bootstrap and verify a repository has actually
    committed to. It is not a general security audit, and in methodology v${METHODOLOGY_VERSION} a
    repository using an equivalent tool sscsb doesn't model (Dependabot in place of
    Renovate, say) scores a gap for that control. Tool-equivalence mapping is a
    roadmap item for a future methodology version; every version bump is recorded
    here and displayed on each repo's page.</p>
    <ol>
    <li>Shallow-clone the repository's default branch. <strong>The target's code is never executed.</strong></li>
    <li>Snapshot the committed file list (<code>git ls-files</code>).</li>
    <li>Run <code>sscsb init</code>, then <code>sscsb verify --format json</code> and <code>sscsb report --format json</code>.</li>
    <li>Reclassify: any control whose passing evidence was created by init scores <strong>gap</strong>, per the class rules below.</li>
    <li>Delete the clone. A maintainer reviews every record before it publishes.</li>
    </ol>
  </section>

  <section class="method-section prose" id="evidence-classes">
    <h2>Evidence classes</h2>
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
    <p class="grade-copy">Unverified and info are <strong>never</strong> in any
    denominator, and zero countable controls in a phase means "no evidence" —
    not 0%.</p>
  </section>

  <section class="method-section" id="grades">
    <div class="method-section-label">Grades · sealed</div>
    <div class="seal-row">
      ${GRADE_SEALS}
    </div>
    <p class="grade-copy"><span class="mono" style="font-weight:700">A+ = exactly 100%</span>
    · A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 60 · F below. Coverage under 50% earns
    <span class="mono" style="font-weight:700">NA</span> — insufficient evidence for
    any letter; under 75% the letter is <em>provisional</em>.</p>
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
    <p>The checks that matter most — branch protection, Actions token permissions,
    security-feature enablement — are <em>repository settings</em>, readable only
    with repository credentials. The only place a complete scan can run is the
    repository's own CI, which raises the obvious question: when a repository hands
    in its own report card, why believe it? The answer is
    <a href="https://github.com/ossf/scorecard-action">OpenSSF Scorecard</a>'s, adopted
    deliberately.</p>
    <ol>
    <li><strong>Verified scanner.</strong> The action installs an sscsb release
    only after checking its Sigstore bundle against the tool repository's own
    release-workflow identity at that exact tag — the scanner proves its own
    provenance before assessing anyone else's.</li>
    <li><strong>Signed record.</strong> With <code>id-token: write</code>, the action
    keyless-signs <code>scan-record.json</code>. Fulcio issues a short-lived
    certificate whose identity <em>is</em> the producing workflow — repository,
    workflow path, and branch ref, burned in by GitHub's OIDC issuer rather than
    asserted by the record — and the signature is logged to Rekor.</li>
    <li><strong>Pinned verification.</strong> Ingest runs <code>cosign verify-blob</code>
    pinned to <code>https://github.com/OWNER/REPO/.github/workflows/sscsb-scan.yml@refs/heads/&lt;default branch&gt;</code>
    — the default branch fetched <em>live</em> from GitHub, never read from the
    record — and to the commit the record claims. A third party cannot mint that
    identity; a feature-branch or renamed-workflow signature does not verify; a
    record whose bundle fails verification is rejected outright, and the
    directory publishes the bundle beside every verified record so anyone can
    re-run the check.</li>
    <li><strong>Human gate, still.</strong> Verified or not, nothing lists without a
    maintainer's <code>publish</code> label. An action-lane record that arrives
    <em>unsigned</em> is listed only as an unverified claim.</li>
    </ol>
    <p><strong>What this deliberately does not prove:</strong> that the workflow which
    signed the record was unmodified. A maintainer who edits their own
    <code>sscsb-scan.yml</code> can sign whatever it emits. OpenSSF Scorecard closes
    that gap by fetching the producing workflow at the certificate's commit and
    rule-checking it (allow-listed steps only, no environment redirection,
    hosted runners); that is this directory's ingestion-hardening milestone, and
    the human publish gate is the backstop until then.</p>
  </section>

  <section class="method-section prose" id="${LOCAL_SECTION_ID}">
    <h2>${LOCAL_TITLE}</h2>
    ${localLaneBody(href, "inkblock")}
  </section>

  <section class="method-section prose" id="changelog">
    <h2>Changelog</h2>
    <ul>
    <li><strong>v1</strong> — initial methodology: diff-based init reclassification, five evidence classes, academic grade scale with A+ reserved for exactly 100%.</li>
    <li><strong>v1, 2026-09</strong> — authenticated records are signed and verified against the producing workflow's identity (scoring unchanged; provenance is displayed, not scored).</li>
    <li><strong>v1, 2026-09</strong> — the <a href="${href(`methodology/#${LOCAL_SECTION_ID}`)}">local lane</a>: a maintainer-signed workstation record, verified against the repository's own committed <code>allowed_signers</code>, joins the action and external records as an evidence source. Verdicts are merged per control: sources that disagree score a <strong>gap</strong> with a named contradiction, and a local assertion about a control a repository scan could observe is not counted until an independent record agrees with it. Class rules, the formula and the grade scale are unchanged.</li>
    </ul>
  </section>
</div>
</div>`;
  return page({ title: "Scoring Methodology", body, active: "methodology" });
}
