/**
 * Factory methodology — the published spec, in the same grammar as the home
 * page: the operating loop at the top, numbered chapter pills that follow the
 * reader down, and the attack-class explainer set on the black ground the
 * opening block uses.
 *
 * THE CONTENT IS NOT THIS DESIGN'S. The evidence-class rules, the scan
 * protocol, the taxonomy, the Scorecard comparison, the local-lane spec and the
 * changelog all come from the shared modules, because a published rule with six
 * copies is a rule that has already started to drift. What varies here is the
 * shell it is set in.
 */
import { METHODOLOGY_VERSION } from "../../config";
import { define, defineTerm } from "../../glossary";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { CONTROL_CLASSES } from "../../reclassify";
import { COVERAGE_FLOOR_NA, COVERAGE_FLOOR_PROVISIONAL } from "../../scoring";
import { compareSection, COMPARE_SECTION_ID, COMPARE_TITLE } from "../compare-shared";
import { changelogItems, EVIDENCE_CLASS_RULES, scanProtocolIntro } from "../methodology-shared";
import { threatsSection, THREATS_SECTION_ID } from "../threats-shared";
import type { DesignCtx } from "../types";
import { chapterNav, loopFigure, type Chapter } from "./components";
import { escapeHtml, page } from "./layout";

/**
 * Eight pills, and every label short enough that the strip stays a pill.
 *
 * Measured at 1440 with the long labels: 1230px against the reference's 728px,
 * within 37px of the fixed search affordance and no longer reading as one
 * control. The section headings carry the full titles — the pill only has to
 * be recognisable once you have read one.
 */
const CHAPTERS: readonly Chapter[] = [
  { id: "protocol", no: "01", label: "Protocol" },
  { id: THREATS_SECTION_ID, no: "02", label: "Threats" },
  { id: COMPARE_SECTION_ID, no: "03", label: "Scorecard" },
  { id: "evidence-classes", no: "04", label: "Evidence" },
  { id: "formula", no: "05", label: "Formula" },
  { id: "grades", no: "06", label: "Grades" },
  { id: LOCAL_SECTION_ID, no: "07", label: "Local" },
  { id: "changelog", no: "08", label: "Changelog" },
];

const GRADES: ReadonlyArray<[string, string]> = [
  ["A+", "exactly 100%"],
  ["A", "at least 90%, under 100%"],
  ["B", "at least 80%, under 90%"],
  ["C", "at least 70%, under 80%"],
  ["D", "at least 60%, under 70%"],
  ["F", "under 60%"],
];

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

  const gradeRows = GRADES.map(
    ([g, rule]) =>
      `<tr><td data-label="Grade"><strong>${escapeHtml(g)}</strong></td><td data-label="Overall">${escapeHtml(
        rule,
      )}</td></tr>`,
  ).join("\n");

  const body = `<div class="fy-wrapper">
<section class="fy-pagehead">
  <p class="fy-kicker">The spec &middot; versioned</p>
  <h1>Scoring methodology v${METHODOLOGY_VERSION}</h1>
  <p class="fy-pagehead-lead">This directory measures <strong>sscsb-control adoption</strong>.
  It is not a general security audit. The rules below are versioned, and every listing names
  the version that scored it.</p>
</section>

<section class="fy-honesty" id="trust">
  <p class="fy-honesty-head">The honesty rule</p>
  <p class="fy-body">The scanner runs <code>sscsb init</code> before it verifies, which
  installs the very files many controls look for. So it snapshots the file list first:
  <strong>evidence the scanner created never counts.</strong> A check that could not run is
  <strong>unverified — a third state</strong> ${define("unverified")}. It is shown hatched,
  and left out of the sums entirely.</p>
  <p class="fy-body">Three things can produce a record, and they see different amounts. That
  is the ${defineTerm("lane")}. It decides nothing about the score. It says how far the
  scanner could see. An <strong>external</strong> record was produced here, from outside the
  project. An <strong>authenticated</strong> one was produced by the repository's own CI and
  signed there, so the signature proves which workflow made it. A <strong>local</strong> one
  was produced by a maintainer on their own machine, with a key the repository itself
  publishes. Where a build leaves a signed receipt for what it produced, that receipt is an
  ${defineTerm("attestation")}; it is made with ${defineTerm("keyless")}.</p>
</section>

<section class="fy-section" aria-label="How a listing is produced">
  ${loopFigure()}
</section>
</div>

${chapterNav(CHAPTERS)}

<div class="fy-wrapper">
<section class="fy-method-section" id="protocol">
  <h2>01 — The scan protocol</h2>
  ${scanProtocolIntro(METHODOLOGY_VERSION)}
  <ol>
  <li>Shallow-clone the repository's default branch. <strong>The target's code is never executed.</strong></li>
  <li>Snapshot the committed file list (<code>git ls-files</code>).</li>
  <li>Run <code>sscsb init</code>, then <code>sscsb verify --format json</code> and <code>sscsb report --format json</code>.</li>
  <li>Reclassify: any control whose passing evidence was created by init scores <strong>gap</strong>, per the class rules below.</li>
  <li>Delete the clone. A maintainer reviews every record before it publishes.</li>
  </ol>
</section>
</div>

<div class="fy-dark">
  <div class="fy-wrapper">
${threatsSection(ctx.h)}
  </div>
</div>

<div class="fy-wrapper">
${compareSection(ctx.h)}

<section class="fy-method-section" id="evidence-classes">
  <h2>04 — Evidence classes</h2>
  <div class="table-scroll" tabindex="0" role="region" aria-label="Evidence classes">
  <table class="method-table">
  <thead><tr><th>Class</th><th>Controls</th><th>Rule</th></tr></thead>
  <tbody>
${classTable}
  </tbody>
  </table>
  </div>
  <h3>Scope</h3>
  <p>A control is in scope when sscsb's defaults enable it, <em>or</em> when the repository's
  own committed <code>.sscsb/config.toml</code> does. Disabling a default-on control scores a
  gap — the denominator cannot be shrunk. Enabling an optional control puts it in scope
  against real evidence, never free points.</p>
</section>

<section class="fy-method-section" id="formula">
  <h2>05 — The formula</h2>
  <div class="fy-formula">
    <pre><code>answered = pass + fail + gap
phase %  = 100 · pass / answered
overall  = Σ pass / Σ answered
coverage = Σ answered / |scope|</code></pre>
  </div>
  <p>Unverified and info are <strong>never</strong> in any sum ${define("countable")}. A phase
  where nothing was answered reads "no evidence", not 0%. A defence looked for and not found
  is a ${defineTerm("gap")}.</p>
</section>

<section class="fy-method-section" id="grades">
  <h2>06 — Grades</h2>
  <p><strong>A+ is exactly 100%</strong>. Then ${defineTerm("coverage")}: under
  ${COVERAGE_FLOOR_NA}% earns <strong>NA</strong>, which is no letter at all. Under
  ${COVERAGE_FLOOR_PROVISIONAL}% the letter is ${defineTerm("provisional")}.</p>
  <div class="table-scroll" tabindex="0" role="region" aria-label="The grade scale">
  <table class="method-table">
  <thead><tr><th>Grade</th><th>Overall</th></tr></thead>
  <tbody>
${gradeRows}
  </tbody>
  </table>
  </div>
  <p>This inherits sscsb's own doctrine: exit code 0 is not a clean bill of health, and an
  unperformed check is never converted into a verdict.</p>
</section>

<section class="fy-method-section" id="${LOCAL_SECTION_ID}">
  <h2>07 — ${escapeHtml(LOCAL_TITLE)}</h2>
  <p>About a dozen checks describe a developer's own machine, where no scan can look. A
  maintainer answers them by running the scan there and signing the result. The key they sign
  with is one the repository already publishes, in its ${defineTerm("anchor")}.</p>
  ${localLaneBody(ctx.h, "cov-cmd")}
</section>

<section class="fy-method-section" id="changelog">
  <h2>08 — Changelog</h2>
  <ul>
  ${changelogItems(ctx.h(`methodology/#${LOCAL_SECTION_ID}`))}
  </ul>
</section>
</div>`;
  return page(ctx, { title: "Scoring Methodology", body });
}
