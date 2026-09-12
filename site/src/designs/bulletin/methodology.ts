/**
 * Bulletin methodology — the spec, set as a numbered broadsheet.
 *
 * Each section carries an oversized ordinal in the left column and sits under
 * a hard rule, so a reader can find the formula or the grade scale by scanning
 * numerals rather than reading headings. The CONTENT is not this design's: the
 * evidence-class rules, the scan protocol, the attack-class taxonomy, the
 * Scorecard comparison, the local-lane spec and the changelog all come from
 * the shared modules, because a published rule with four copies is a rule that
 * has already started to drift.
 */
import { METHODOLOGY_VERSION } from "../../config";
import { define, defineTerm } from "../../glossary";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { CONTROL_CLASSES } from "../../reclassify";
import { compareSection, COMPARE_SECTION_ID, COMPARE_TITLE } from "../compare-shared";
import {
  changelogItems,
  EVIDENCE_CLASS_RULES,
  scanProtocolIntro,
} from "../methodology-shared";
import { threatsSection, THREATS_SECTION_ID } from "../threats-shared";
import { gradeSlab } from "./components";
import { page } from "./layout";
import type { DesignCtx } from "../types";

const GRADE_SLABS = (["A+", "A", "B", "C", "D", "F"] as const)
  .map((g) => gradeSlab(g, "md"))
  .join("\n      ");

/** A ruled section head with its ordinal set as a poster numeral. */
function head(n: string, title: string, id?: string): string {
  return `<div class="sec-head"${id ? ` id="${id}"` : ""}>
    <span class="sec-num" aria-hidden="true">${n}</span>
    <h2 class="sec-title">${title}</h2>
  </div>`;
}

export function renderMethodology(ctx: DesignCtx): string {
  const classTable = Object.entries(EVIDENCE_CLASS_RULES)
    .map(([key, d]) => {
      const members = Object.entries(CONTROL_CLASSES)
        .filter(([, cls]) => cls === key)
        .map(([id]) => `<code>${id}</code>`)
        .join(", ");
      return `<tr><td data-label="Class"><strong>${d.name}</strong></td><td data-label="Controls">${members}</td><td data-label="Rule">${d.rule}</td></tr>`;
    })
    .join("\n");

  const index = `<nav class="sec-index" aria-label="Methodology sections">
  <a href="${ctx.h("methodology/#protocol")}">01 Protocol</a>
  <a href="${ctx.h(`methodology/#${THREATS_SECTION_ID}`)}">02 What the checks are for</a>
  <a href="${ctx.h(`methodology/#${COMPARE_SECTION_ID}`)}">03 ${COMPARE_TITLE}</a>
  <a href="${ctx.h("methodology/#evidence-classes")}">04 Evidence classes</a>
  <a href="${ctx.h("methodology/#formula")}">05 The formula</a>
  <a href="${ctx.h("methodology/#grades")}">06 Grades</a>
  <a href="${ctx.h(`methodology/#${LOCAL_SECTION_ID}`)}">07 The local lane</a>
  <a href="${ctx.h("methodology/#changelog")}">08 Changelog</a>
</nav>`;

  const body = `
<section class="pagehead">
  <p class="kicker">The spec · versioned</p>
  <h1 class="banner banner-sm">Scoring methodology <span class="mv">v${METHODOLOGY_VERSION}</span></h1>
  <p class="standfirst">This directory measures <strong>sscsb-control adoption</strong>.
  It is not a general security audit. The rules below are versioned, and every listing
  names the version that scored it.</p>
  ${index}
</section>

<section class="honesty">
  <p class="honesty-head">The honesty rule</p>
  <p class="honesty-body">The scanner runs <code>sscsb init</code> before it verifies,
  which installs the very files many controls look for. So it snapshots the file list
  first: <strong>evidence the scanner created never counts.</strong> A check that could
  not run is <strong>unverified — a third state</strong> ${define("unverified")}. It is
  shown hatched, and left out of the sums entirely. An unperformed check is never a
  verdict.</p>
  <p class="honesty-body">Three things can produce a record, and they see different
  amounts. That is the ${defineTerm("lane")}, stamped on every listing. It decides
  nothing about the score. It tells you how far the scanner could see. Where a build
  leaves a signed receipt for what it produced, that receipt is an
  ${defineTerm("attestation")}; it is made with ${defineTerm("keyless")}.</p>
</section>

<section class="method-section prose">
  ${head("01", "The scan protocol", "protocol")}
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
${compareSection(ctx.h)}

<section class="method-section prose">
  ${head("04", "Evidence classes", "evidence-classes")}
  <div class="table-scroll">
  <table class="method-table">
  <thead><tr><th>Class</th><th>Controls</th><th>Rule</th></tr></thead>
  <tbody>
${classTable}
  </tbody>
  </table>
  </div>
  <h3>Scope</h3>
  <p>A control is in scope when sscsb's defaults enable it, <em>or</em> when the
  repository's own committed <code>.sscsb/config.toml</code> does. Disabling a
  default-on control scores a gap — the denominator cannot be shrunk. Enabling an
  optional control puts it in scope against real evidence, never free points.</p>
</section>

<section class="method-section">
  ${head("05", "The formula", "formula")}
  <div class="formula-slab">
    <pre><code>answered <span class="t-dim">=</span> pass + fail + gap
phase %  <span class="t-dim">=</span> 100 · pass / answered
overall  <span class="t-dim">=</span> Σ pass / Σ answered
coverage <span class="t-dim">=</span> Σ answered / |scope|</code></pre>
  </div>
  <p class="body-copy">Unverified and info are <strong>never</strong> in any sum
  ${define("countable")}. A phase where nothing was answered reads "no evidence", not
  0%. A defence looked for and not found is a ${defineTerm("gap")}.</p>
</section>

<section class="method-section">
  ${head("06", "Grades", "grades")}
  <div class="grade-row">
    ${GRADE_SLABS}
  </div>
  <p class="body-copy"><strong class="mono">A+ is exactly 100%</strong> · A ≥ 90 · B ≥ 80 ·
  C ≥ 70 · D ≥ 60 · F below. Then ${defineTerm("coverage")}: under 50% earns
  <strong class="mono">NA</strong>, which is no letter at all; under 75% the letter is
  ${defineTerm("provisional")}.</p>
  <div class="prose">
    <div class="table-scroll">
    <table class="method-table method-table-narrow">
    <thead><tr><th>Grade</th><th>Overall</th></tr></thead>
    <tbody>
    <tr><td data-label="Grade"><strong>A+</strong></td><td data-label="Overall">exactly 100%</td></tr>
    <tr><td data-label="Grade"><strong>A</strong></td><td data-label="Overall">≥ 90%, &lt; 100%</td></tr>
    <tr><td data-label="Grade"><strong>B</strong></td><td data-label="Overall">≥ 80%, &lt; 90%</td></tr>
    <tr><td data-label="Grade"><strong>C</strong></td><td data-label="Overall">≥ 70%, &lt; 80%</td></tr>
    <tr><td data-label="Grade"><strong>D</strong></td><td data-label="Overall">≥ 60%, &lt; 70%</td></tr>
    <tr><td data-label="Grade"><strong>F</strong></td><td data-label="Overall">&lt; 60%</td></tr>
    </tbody>
    </table>
    </div>
    <p>Evidence coverage below 50% yields <strong>NA</strong> — insufficient evidence for
    any letter. Coverage between 50% and 75% marks the letter <em>provisional</em>. This
    inherits sscsb's own doctrine: exit code 0 is not a clean bill of health, and an
    unperformed check is never converted into a verdict.</p>
  </div>
</section>

<section class="method-section prose" id="${LOCAL_SECTION_ID}">
  ${head("07", LOCAL_TITLE)}
  <p>About a dozen checks describe a developer's own machine, where no scan can look.
  A maintainer answers them by running the scan there and signing the result. The key
  they sign with is one the repository already publishes, in its
  ${defineTerm("anchor")}.</p>
  ${localLaneBody(ctx.h, "cov-cmd")}
</section>

<section class="method-section prose">
  ${head("08", "Changelog", "changelog")}
  <ul>
  ${changelogItems(ctx.h(`methodology/#${LOCAL_SECTION_ID}`))}
  </ul>
</section>`;
  return page(ctx, { title: "Scoring Methodology", body });
}
