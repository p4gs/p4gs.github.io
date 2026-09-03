/**
 * Chain — the published scoring spec, explained as the chain: the honesty
 * rule up front (broken-vs-verified link motif), the protocol, evidence
 * classes, scope, the formula in a dark panel, grades, and the changelog.
 * Same versioned content as the site's honesty contract everywhere else.
 */
import { METHODOLOGY_VERSION } from "../../config";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { CONTROL_CLASSES } from "../../reclassify";
import { gradePill } from "./components";
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

/** Broken link → verified link: the honesty rule as a picture. */
const HONESTY_MOTIF = `<svg class="honesty-motif" width="132" height="28" viewBox="0 0 132 28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <g stroke="#D6742C">
    <rect x="2" y="9" width="15" height="10" rx="3.5"></rect>
    <rect x="29" y="9" width="15" height="10" rx="3.5"></rect>
    <path d="M21.5 10l-2.5 4M27 10l-2.5 4"></path>
  </g>
  <g stroke="#46564F">
    <path d="M56 14h14M66 10l4 4-4 4"></path>
  </g>
  <g stroke="#0E8A72">
    <rect x="82" y="9" width="15" height="10" rx="3.5"></rect>
    <rect x="107" y="9" width="15" height="10" rx="3.5"></rect>
    <path d="M97 14h10"></path>
  </g>
</svg>`;

const GRADE_PILL_ROW = (["A+", "A", "B", "C", "D", "F", "NA"] as const)
  .map((g) => gradePill(g, { size: "lg" }))
  .join("\n    ");

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

  const body = `
<div class="method-wrap">
  <div class="page-head-copy method-head">
    <p class="eyebrow mono">THE CHAIN, EXPLAINED · v${METHODOLOGY_VERSION}</p>
    <h1 class="page-title">Scoring methodology</h1>
    <p class="body-copy">This directory measures <strong>sscsb-control adoption</strong> —
    not general security. The rules below are versioned; every repo page names the
    version that scored it.</p>
  </div>

  <section class="card honesty-card">
    ${HONESTY_MOTIF}
    <h2 class="honesty-title">The honesty rule</h2>
    <p class="honesty-body">The scanner runs <code>sscsb init</code> before verifying —
    which installs the very files many controls check for. So we snapshot the file
    list first: <strong>evidence the scanner created never counts.</strong> And a
    check that could not run is <strong>unverified — a third state</strong>, shown
    hatched, outside every denominator. An unperformed check is never a verdict.
    A chain with a missing link is shown with the link missing.</p>
  </section>

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
    <h2>The formula</h2>
    <pre class="inkblock mono"><code>countable = pass + fail + gap
phase %   = 100 · pass / countable
overall   = Σ pass / Σ countable
coverage  = Σ countable / |scope|</code></pre>
    <p class="grade-copy">Unverified and info are <strong>never</strong> in any
    denominator, and zero countable controls in a phase means "no evidence" —
    not 0%.</p>
  </section>

  <section class="method-section" id="grades">
    <h2>Grades</h2>
    <div class="pill-row">
    ${GRADE_PILL_ROW}
    </div>
    <p class="grade-copy"><span class="mono grade-key">A+ = exactly 100%</span>
    · A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 60 · F below. Coverage under 50% earns
    <span class="mono grade-key">NA</span> — insufficient evidence for
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

  <section class="method-section prose" id="${LOCAL_SECTION_ID}">
    <h2>${LOCAL_TITLE}</h2>
    ${localLaneBody(href, "inkblock mono")}
  </section>

  <section class="method-section prose" id="changelog">
    <h2>Changelog</h2>
    <ul>
    <li><strong>v1</strong> — initial methodology: diff-based init reclassification, five evidence classes, academic grade scale with A+ reserved for exactly 100%.</li>
    <li><strong>v1, 2026-09</strong> — the <a href="${href(`methodology/#${LOCAL_SECTION_ID}`)}">local lane</a>: a maintainer-signed workstation record, verified against the repository's own committed <code>allowed_signers</code>, joins the action and external records as an evidence source. Verdicts are merged per control: sources that disagree score a <strong>gap</strong> with a named contradiction, and a local assertion about a control a repository scan could observe is not counted until an independent record agrees with it. Class rules, the formula and the grade scale are unchanged.</li>
    </ul>
  </section>
</div>`;
  return page({ title: "Scoring Methodology", body, active: "methodology" });
}
