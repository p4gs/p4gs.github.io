/**
 * Chain — the published scoring spec, explained as the chain: the honesty
 * rule up front (broken-vs-verified link motif), the protocol, evidence
 * classes, scope, the formula in a dark panel, grades, and the changelog.
 * Same versioned content as the site's honesty contract everywhere else.
 */
import { METHODOLOGY_VERSION } from "../../config";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { define, defineTerm } from "../../glossary";
import { CONTROL_CLASSES } from "../../reclassify";
import { threatsSection } from "../threats-shared";
import {
  changelogItems,
  EVIDENCE_CLASS_RULES,
  scanProtocolIntro,
} from "../methodology-shared";
import { gradePill } from "./components";
import { href, page } from "./layout";

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
  const classTable = Object.entries(EVIDENCE_CLASS_RULES)
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
    check that could not run is <strong>unverified — a third state</strong>
    ${define("unverified")}. It is shown hatched, and left out of the sums entirely. An unperformed
    check is never a verdict. A chain with a missing link is shown with the link missing.</p>
    <p class="tx-defs">Three things can produce a record, and they see different
    amounts. That is the ${defineTerm("lane")}, shown as a badge on every listing. It
    decides nothing about the score. It tells you how far the scanner could see. Where a
    build leaves a signed receipt for what it produced, that receipt is an
    ${defineTerm("attestation")}; it is made with ${defineTerm("keyless")}.</p>
  </section>

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
    sum ${define("countable")}. A phase where nothing was answered reads "no
    evidence" — not 0%. A ${defineTerm("gap")}.</p>
  </section>

  <section class="method-section" id="grades">
    <h2>Grades</h2>
    <div class="pill-row">
    ${GRADE_PILL_ROW}
    </div>
    <p class="grade-copy"><span class="mono grade-key">A+ = exactly 100%</span>
    · A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 60 · F below. Then ${defineTerm("coverage")}: under 50% earns
    <span class="mono grade-key">NA</span> — insufficient evidence for
    any letter; under 75% the letter is ${defineTerm("provisional")}.</p>
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
    <p>About a dozen checks describe a developer's own machine, where no scan can look.
    A maintainer answers them by running the scan there and signing the result. The key
    they sign with is one the repository already publishes, in its
    ${defineTerm("anchor")}.</p>
    ${localLaneBody(href, "inkblock mono")}
  </section>

  <section class="method-section prose" id="changelog">
    <h2>Changelog</h2>
    <ul>
    ${changelogItems(href(`methodology/#${LOCAL_SECTION_ID}`))}
    </ul>
  </section>
</div>`;
  return page({ title: "Scoring Methodology", body, active: "methodology" });
}
