/**
 * Signal — the published scoring spec.
 *
 * This is the page OpenAI's chapter pills were built for: a long document with
 * a handful of named parts, read out of order, returned to. The rail is sticky
 * at every width and scrolls sideways on a phone rather than folding into a
 * menu — for four to six chapters that is strictly better than hiding the map
 * behind a button.
 *
 * The content is the site's honesty contract and is rendered from the shared
 * modules, not restated here: `methodology-shared.ts` (protocol, evidence
 * classes, changelog), `methodology-local.ts` (the local lane, mirrored byte
 * for byte from the tool's own docs), `threats-shared.ts` and
 * `compare-shared.ts`. Four designs cannot be allowed to drift on a rule this
 * site publishes as a contract.
 */
import { METHODOLOGY_VERSION } from "../../config";
import { define, defineTerm } from "../../glossary";
import { LOCAL_SECTION_ID, LOCAL_TITLE, localLaneBody } from "../../methodology-local";
import { CONTROL_CLASSES } from "../../reclassify";
import { compareSection } from "../compare-shared";
import { changelogItems, EVIDENCE_CLASS_RULES, scanProtocolIntro } from "../methodology-shared";
import { threatsSection } from "../threats-shared";
import { chipList, chipRuns, gradePill, legend } from "./components";
import { chapterRail, href, page } from "./layout";

const GRADE_PILL_ROW = (["A+", "A", "B", "C", "D", "F", "NA"] as const)
  .map((g) => gradePill(g, { size: "lg" }))
  .join("\n    ");

/**
 * The Scorecard crosswalk's "sscsb has nothing here" cell.
 *
 * `compare-shared.ts` emits a bare `<span class="cmp-none">—</span>` for it —
 * no `.cmp-mark`, so the pill's `border: 1px solid` / `radius: 999px` never
 * applies and only `border-style: dashed` does. The initial values fill in the
 * rest: `border-width: medium` (3px in Chrome) in `currentColor`, no radius.
 * Measured at BOTH widths: a 21x25 three-pixel dashed SQUARE around an em
 * dash, which reads as a missing-glyph tofu box — and which borrows this
 * design's dashed "nobody could answer" shape for a cell that carries no
 * status at all, the one thing this palette may not do.
 *
 * The stylesheet defuses the border (styles.ts, D15/D30). This replaces the
 * dash itself with WORDS, because the site's own non-negotiable is colour +
 * shape + text and a screen reader announced this one as "dash". The
 * substitution is exact and asserted by a test, so if the shared markup ever
 * changes the test fails rather than the page quietly reverting to a tofu box.
 * `compare-shared.ts` is shared by five designs, so emitting the label at
 * source is filed as a proposal rather than taken here.
 */
export const SHARED_NONE_SPAN = `<span class="cmp-none">—</span>`;
const NONE_LABEL = `<span class="cmp-nil">No sscsb equivalent</span>`;

/**
 * The nine attack-group incident disclosures.
 *
 * The section's own intro promises that every incident links to a primary
 * source, and round 2 shipped all nine `<details>` closed with a summary that
 * named no count — so a reader met none of them: xz, event-stream,
 * Shai-Hulud, Ultralytics, torchtriton. They open by default now, and the
 * summary carries how many incidents it holds, so the disclosure says what it
 * is worth before it is touched.
 */
function openIncidents(html: string): string {
  return html.replace(
    /<details class="tx-details">\s*<summary>([^<]*)<\/summary>\s*<ul class="tx-incidents">([\s\S]*?)<\/ul>/g,
    (_m, label: string, list: string) => {
      const n = (list.match(/<li class="tx-incident"/g) ?? []).length;
      return `<details class="tx-details" open>
      <summary>${label} · ${n === 1 ? "1 incident" : `${n} incidents`}</summary>
      <ul class="tx-incidents">${list}</ul>`;
    },
  );
}

export function renderMethodology(): string {
  const classTable = Object.entries(EVIDENCE_CLASS_RULES)
    .map(([key, d]) => {
      const members = chipList(
        Object.entries(CONTROL_CLASSES)
          .filter(([, cls]) => cls === key)
          .map(([id]) => id),
      );
      return `<tr><td data-label="Class"><strong>${d.name}</strong></td><td data-label="Controls">${members}</td><td data-label="Rule">${d.rule}</td></tr>`;
    })
    .join("\n");

  const body = `
<header class="page-head">
  <p class="sg-eyebrow">THE RULES · v${METHODOLOGY_VERSION}</p>
  <h1 class="page-title">Scoring methodology</h1>
  <p class="page-lede">This directory measures <strong>sscsb-control adoption</strong>.
  It is not a general security audit. The rules below are versioned, and every repository
  page names the version that scored it.</p>
</header>

${chapterRail([
  { id: "honesty", label: "The honesty rule" },
  { id: "protocol", label: "The scan" },
  { id: "threats", label: "What checks are for" },
  { id: "evidence-classes", label: "Evidence" },
  { id: "grades", label: "Scoring" },
  { id: LOCAL_SECTION_ID, label: "Local records" },
])}

<section class="method-section panel-lead" id="honesty">
  <h2 class="panel-title">The honesty rule</h2>
  <p class="body-copy">The scanner runs <code>sscsb init</code> before verifying. That
  installs the very files many controls check for. So we snapshot the file list first:
  <strong>evidence the scanner created never counts.</strong> And a check that could not
  run is <strong>unverified — a third state</strong> ${define("unverified")}. It is drawn
  as a dashed ring and left out of the sums entirely. An unperformed check is never a
  verdict.</p>
  ${legend()}
  <p class="body-copy">Three things can produce a record, and they see different amounts.
  That is the ${defineTerm("lane")}, shown as a badge on every listing. It decides nothing
  about the score. It tells you how far the scanner could see.</p>
</section>

<section class="method-section prose" id="trust">
  <h2>Who ran the scan</h2>
  <p>An <strong>external</strong> record was produced here, from outside the project. An
  <strong>authenticated</strong> record was produced by the repository's own CI and signed
  there, so the signature proves which workflow made it. A <strong>local</strong> record
  was signed by a maintainer on their own machine, with a key the repository itself
  publishes.</p>
  <p>Where a build leaves a signed receipt for what it produced, that receipt is an
  ${defineTerm("attestation")}. It is made with ${defineTerm("keyless")}.</p>
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

${chipRuns(openIncidents(threatsSection(href)))}
${compareSection(href).replaceAll(SHARED_NONE_SPAN, NONE_LABEL)}

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
  control scores a gap — the denominator cannot be shrunk. Enabling an optional control
  puts it in scope against real evidence, never free points.</p>
</section>

<section class="method-section" id="formula">
  <h2>The formula</h2>
  <pre class="code"><code>countable = pass + fail + gap
phase %   = 100 · pass / countable
overall   = Σ pass / Σ countable
coverage  = Σ countable / |scope|</code></pre>
  <p class="body-copy">Unverified and info are <strong>never</strong> in any sum
  ${define("countable")}. A phase where nothing was answered reads "no evidence", not 0%.
  A defence looked for and not found is a ${defineTerm("gap")}.</p>
</section>

<section class="method-section" id="grades">
  <h2>Grades</h2>
  <div class="pill-row">
  ${GRADE_PILL_ROW}
  </div>
  <p class="body-copy"><span class="grade-key">A+ = exactly 100%</span> · A ≥ 90 · B ≥ 80
  · C ≥ 70 · D ≥ 60 · F below. Then ${defineTerm("coverage")}: under 50% earns
  <span class="grade-key">NA</span>, insufficient evidence for any letter. Under 75% the
  letter is ${defineTerm("provisional")}.</p>
  <div class="prose">
    <div class="table-scroll">
    <table class="method-table">
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
  <h2>${LOCAL_TITLE}</h2>
  <p>About a dozen checks describe a developer's own machine, where no scan can look. A
  maintainer answers them by running the scan there and signing the result. The key they
  sign with is one the repository already publishes, in its ${defineTerm("anchor")}.</p>
  ${localLaneBody(href, "code")}
</section>

<section class="method-section prose" id="changelog">
  <h2>Changelog</h2>
  <ul>
  ${changelogItems(href(`methodology/#${LOCAL_SECTION_ID}`))}
  </ul>
</section>`;
  return page({ title: "Scoring Methodology", body, active: "methodology" });
}
