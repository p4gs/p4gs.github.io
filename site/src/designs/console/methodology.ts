/**
 * Console methodology — dark editorial-console. Every content section from
 * the site's published scoring spec is preserved: the honesty rule, the scan
 * protocol, evidence classes, scope, the formula (terminal panel), grades
 * (glowing chips), and the changelog.
 */
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
import { gradeChip } from "./components";
import { page } from "./layout";
import type { DesignCtx } from "../types";

const GRADE_CHIPS = (["A+", "A", "B", "C", "D", "F"] as const)
  .map((g) => gradeChip(g, "md"))
  .join("\n      ");

export function renderMethodology(ctx: DesignCtx): string {
  const classTable = Object.entries(EVIDENCE_CLASS_RULES)
    .map(([key, d]) => {
      const members = Object.entries(CONTROL_CLASSES)
        .filter(([, cls]) => cls === key)
        .map(([id]) => `<code>${id}</code>`)
        .join(", ");
      return `<tr><td><strong>${d.name}</strong></td><td>${members}</td><td>${d.rule}</td></tr>`;
    })
    .join("\n");

  const sectionNav = `<nav class="method-nav" aria-label="Methodology sections">
  <a href="${ctx.h("methodology/#protocol")}">protocol</a>
  <a href="${ctx.h(`methodology/#${THREATS_SECTION_ID}`)}">what the checks are for</a>
  <a href="${ctx.h("methodology/#evidence-classes")}">evidence classes</a>
  <a href="${ctx.h("methodology/#formula")}">formula</a>
  <a href="${ctx.h("methodology/#grades")}">grades</a>
  <a href="${ctx.h("methodology/#local")}">local lane</a>
  <a href="${ctx.h("methodology/#changelog")}">changelog</a>
</nav>`;

  const body = `
<div class="method-wrap">
  <div class="method-section" style="margin-top:48px">
    <p class="eyebrow">Spec · versioned</p>
    <h1 class="page-title">Scoring methodology <span class="mv">v${METHODOLOGY_VERSION}</span></h1>
    <p class="body-copy" style="font-size:17px">This directory measures
    <strong>sscsb-control adoption</strong> — not general security. The rules
    below are versioned; every repo page names the version that scored it.</p>
    ${sectionNav}
  </div>

  <div class="panel honesty">
    <div class="honesty-head">THE HONESTY RULE</div>
    <div class="honesty-body">The scanner runs <code>sscsb init</code> before verifying —
    which installs the very files many controls check for. So we snapshot the file
    list first: <strong>evidence the scanner created never counts.</strong> And a
    check that could not run is <strong>unverified — a third state</strong>
    ${define("unverified")}. It is shown hatched, and left out of the sums entirely. An unperformed
    check is never a verdict.</div>
  <p class="tx-defs">Three things can produce a record, and they see different
    amounts. That is the ${defineTerm("lane")}, shown as a badge on every listing. It
    decides nothing about the score. It tells you how far the scanner could see. Where a
    build leaves a signed receipt for what it produced, that receipt is an
    ${defineTerm("attestation")}; it is made with ${defineTerm("keyless")}.</p>
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

${threatsSection(ctx.h)}

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
    <div class="method-label">The formula</div>
    <div class="terminal">
      <div class="terminal-head"><span class="terminal-dot" aria-hidden="true"></span>score.formula · v${METHODOLOGY_VERSION}</div>
      <pre><code>countable <span class="t-dim">=</span> pass + fail + gap
phase %   <span class="t-dim">=</span> 100 · pass / countable
overall   <span class="t-dim">=</span> Σ pass / Σ countable
coverage  <span class="t-dim">=</span> Σ countable / |scope|</code></pre>
    </div>
    <p class="grade-copy" style="margin-top:12px">Unverified and info are <strong>never</strong> in any
    sum ${define("countable")}. A phase where nothing was answered reads "no
    evidence" — not 0%. A ${defineTerm("gap")}.</p>
  </section>

  <section class="method-section" id="grades">
    <div class="method-label">Grades</div>
    <div class="grade-row">
      ${GRADE_CHIPS}
    </div>
    <p class="grade-copy"><span class="mono" style="font-weight:700">A+ = exactly 100%</span>
    · A ≥ 90 · B ≥ 80 · C ≥ 70 · D ≥ 60 · F below. Then ${defineTerm("coverage")}: under 50% earns
    <span class="mono" style="font-weight:700">NA</span> — insufficient evidence for
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
    ${localLaneBody(ctx.h, "cov-cmd")}
  </section>

  <section class="method-section prose" id="changelog">
    <h2>Changelog</h2>
    <ul>
    ${changelogItems(ctx.h(`methodology/#${LOCAL_SECTION_ID}`))}
    </ul>
  </section>
</div>`;
  return page(ctx, { title: "Scoring Methodology", body });
}
