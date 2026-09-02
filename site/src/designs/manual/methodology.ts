/**
 * Manual — the methodology as a beautifully set document: serif section
 * heads, the honesty rule as a pull-quote, the formula in an ink-on-paper
 * block. Content parity with the ledger spec: protocol, evidence classes,
 * scope, formula, grades (with the seal row), changelog — nothing dropped.
 */
import { METHODOLOGY_VERSION } from "../../config";
import { CONTROL_CLASSES } from "../../reclassify";
import type { DesignCtx } from "../types";
import { seal } from "./components";
import { page } from "./layout";

const CLASS_DESCRIPTIONS: Readonly<Record<string, { name: string; rule: string }>> = {
  A: {
    name: "A — committed artifacts",
    rule: "The control's evidence is files committed to the repository. If any registered artifact was created by the scanner's own <code>sscsb init</code> (absent from the pre-init file snapshot), the control scores <strong>gap</strong> — evidence the scanner installed seconds earlier is never the repository's evidence. A pre-existing artifact that fails sscsb's shape checks is a real <strong>fail</strong>. For tool-backed controls (secrets, sbom, vuln-scan, sast, provenance-verify) whose raw verdict only reflects scanner-machine tool availability, the committed artifacts decide instead.",
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
    rule: "Commit signing, signing-model posture, AI trailers, package-trust hooks and similar controls describe the <em>development machine</em>, which a repository scan cannot observe. They always score <strong>unverified</strong> — an unperformed check is a third state, never a pass or fail.",
  },
  M: {
    name: "M — meta / informational",
    rule: "compliance-map (about sscsb itself) and secure-repo (an external service pointer) are excluded from scoring entirely.",
  },
};

/** The grade seals, set small, as a specimen row. */
const GRADE_SEALS = (["A+", "A", "B", "C", "D", "F"] as const)
  .map((g) => seal(g, { size: "sm" }))
  .join("\n    ");

export function renderMethodology(ctx: DesignCtx): string {
  const classRows = Object.entries(CLASS_DESCRIPTIONS)
    .map(([key, d]) => {
      const members = Object.entries(CONTROL_CLASSES)
        .filter(([, cls]) => cls === key)
        .map(([id]) => `<code>${id}</code>`)
        .join(", ");
      return `<tr><td class="mt-class"><strong>${d.name}</strong></td><td class="mt-members">${members}</td><td>${d.rule}</td></tr>`;
    })
    .join("\n");

  const body = `
<article class="doc">
  <header class="doc-head">
    <p class="eyebrow">The honesty contract, versioned</p>
    <h1 class="page-title">Scoring methodology <span class="mv">v${METHODOLOGY_VERSION}</span></h1>
    <p class="doc-lede">This directory measures <strong>sscsb-control adoption</strong> — not
    general security. The rules below are versioned; every repo page names the
    version that scored it.</p>
  </header>

  <blockquote class="pullquote">
    <p>The scanner runs <code>sscsb init</code> before verifying — which installs the
    very files many controls check for. So we snapshot the file list first:
    <strong>evidence the scanner created never counts.</strong> And a check that could
    not run is unverified — a third state, shown hatched, outside every denominator.
    <em>An unperformed check is never a verdict.</em></p>
  </blockquote>

  <section class="doc-sec" id="protocol">
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

  <section class="doc-sec" id="evidence-classes">
    <h2>Evidence classes</h2>
    <div class="table-scroll">
    <table class="method-table">
    <thead><tr><th>Class</th><th>Controls</th><th>Rule</th></tr></thead>
    <tbody>
${classRows}
    </tbody>
    </table>
    </div>
    <h2>Scope</h2>
    <p>A control is in scope when it is enabled by sscsb's defaults <em>or</em> by the
    repository's own committed <code>.sscsb/config.toml</code>. Disabling a default-on
    control scores a gap — the denominator cannot be shrunk. Enabling an optional
    control puts it in scope against real evidence — never free points.</p>
  </section>

  <section class="doc-sec" id="formula">
    <h2>The formula</h2>
    <pre class="inkblock"><code>countable = pass + fail + gap
phase %   = 100 · pass / countable
overall   = Σ pass / Σ countable
coverage  = Σ countable / |scope|</code></pre>
    <p>Unverified and info are <strong>never</strong> in any denominator, and zero
    countable controls in a phase means &ldquo;no evidence&rdquo; — not 0%.</p>
  </section>

  <section class="doc-sec" id="grades">
    <h2>Grades</h2>
    <div class="seal-row" role="img" aria-label="The grade seals, A+ through F">
    ${GRADE_SEALS}
    </div>
    <p><span class="mono-strong">A+ = exactly 100%</span> · A ≥ 90 · B ≥ 80 · C ≥ 70 ·
    D ≥ 60 · F below. Coverage under 50% earns <span class="mono-strong">NA</span> —
    insufficient evidence for any letter; under 75% the letter is <em>provisional</em>.</p>
    <div class="table-scroll">
    <table class="method-table grade-table">
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
  </section>

  <section class="doc-sec" id="changelog">
    <h2>Changelog</h2>
    <ul>
    <li><strong>v1</strong> — initial methodology: diff-based init reclassification, five evidence classes, academic grade scale with A+ reserved for exactly 100%.</li>
    </ul>
  </section>
</article>`;
  return page(ctx, { title: "Scoring Methodology", body });
}
