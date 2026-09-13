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
import { CONTRACT_TEXT } from "../../local-contract";
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
import { escapeHtml, page } from "./layout";
import type { DesignCtx } from "../types";

const GRADE_SLABS = (["A+", "A", "B", "C", "D", "F"] as const)
  .map((g) => gradeSlab(g, "md"))
  .join("\n      ");

/**
 * A ruled section head with its ordinal set as a poster numeral.
 *
 * `rail: false` is for a section whose content is a WIDE TABLE rather than a
 * measure of prose — there the right column is not dead, it is the table, and
 * a 208px running head would be taken out of the columns instead of out of
 * empty paper.
 */
function head(n: string, title: string, id?: string, opts: { rail?: boolean } = {}): string {
  return `<div class="sec-head"${id ? ` id="${id}"` : ""}>
    <span class="sec-num" aria-hidden="true">${n}</span>
    <h2 class="sec-title">${title}</h2>
  </div>${opts.rail === false ? "" : rail(n, title)}`;
}

/**
 * The running head that fills the right column at desk width.
 *
 * A 72ch measure inside a 1160px column left the right half of the page empty
 * for five consecutive screens in section 07 — the longest stretch of the
 * site's longest document, with no rule, no eyebrow and no marginalia in it.
 * A broadsheet puts a running head there, so this one does: the ordinal at
 * poster scale and the title in mono caps, sticky for the length of the
 * section. It states nothing the `.sec-head` above does not, which is exactly
 * why it is `aria-hidden` — it is apparatus, and it is CSS-gated to the widths
 * where the column is genuinely spare.
 */
function rail(n: string, title: string): string {
  return `<div class="sec-rail" aria-hidden="true"><span class="sec-rail-in">
    <span class="sec-rail-num">${n}</span>
    <span class="sec-rail-title">${title}</span>
  </span></div>`;
}

/**
 * The contract block, set as a key/value table instead of a wrapped `<pre>`.
 *
 * Round 1 stopped it clipping by wrapping it; measured at 390px that traded a
 * visible defect for a silent one, because a continuation line lands flush at
 * the KEY column — `record-fields  schema_version methodology_version repo
 * scanned_at scanner` wraps to a line reading `request_issue controls score`,
 * which parses as a key and a value two lines under the real key
 * `methodology-version  2`. On a byte-precision signing contract a reader must
 * be able to tell a key from the tail of a value, and a hanging indent cannot
 * do it (`text-indent` applies to the first line of a block; a forced break
 * inside a `<pre>` does not restart it, and `each-line` is unsupported).
 *
 * NOTHING IS REWORDED. The rows are parsed out of `CONTRACT_TEXT`, the same
 * bytes both trees pin a digest over; the header line becomes the table's own
 * header. `test/bulletin-round4.test.ts` fails if the shared `<pre>` this
 * replaces ever stops matching, so a refactor upstream cannot silently put the
 * old block back.
 */
function contractTable(): string {
  const [header = "", ...lines] = CONTRACT_TEXT.split("\n");
  const rows = lines
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const at = line.search(/\s{2,}/);
      const key = at === -1 ? line.trim() : line.slice(0, at);
      const val = at === -1 ? "" : line.slice(at).trim();
      return `    <tr><td class="ct-key">${escapeHtml(key)}</td><td class="ct-val">${escapeHtml(
        val,
      )}</td></tr>`;
    })
    .join("\n");
  return `<table class="contract-table">
  <thead><tr><th class="contract-head" colspan="2" scope="colgroup">${escapeHtml(
    header,
  )}</th></tr></thead>
  <tbody>
${rows}
  </tbody>
  </table>`;
}

/**
 * `esc` in `methodology-local.ts` escapes `&`, `<` and `>` only, and
 * CONTRACT_TEXT carries none of the three — so this is the exact string that
 * module emits for the contract block. Reconstructed rather than matched by
 * pattern, so a change on either side fails the test rather than the page.
 */
const CONTRACT_PRE = `<pre class="cov-cmd"><code>${CONTRACT_TEXT}</code></pre>`;

/** The shared local-lane body, with the contract block set as a table. */
export function localLaneBodyWithContractTable(h: (path: string) => string): string {
  const body = localLaneBody(h, "cov-cmd");
  return body.includes(CONTRACT_PRE)
    ? body.replace(CONTRACT_PRE, contractTable())
    : body;
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

  // THE INDEX IS THE PAGE'S ONLY NAVIGATION, so it sticks at every width and it
  // says where you are.
  //
  // Two measurements drive the shape. The full titles hold 1,394px of links, so
  // they fit neither a 358px phone strip nor a 1160px column — six of eight
  // entries sat off-screen at rest on a page that is 31,000px long. And the
  // desk build had no sticky index at all: the eight pills appeared once and
  // were then eighteen thousand pixels away, at the width where a reader is
  // most likely to be scanning rather than reading.
  //
  // So: short labels everywhere (ordinals alone would fit and mean nothing),
  // the long title kept as the anchor's accessible name, one row that follows
  // the reader down, and a way back to the top in the same strip rather than a
  // second bar of permanent chrome. The current section is marked by the
  // scroll-spy at the foot of this file.
  const link = (short: string, long: string, path: string) =>
    `<a href="${ctx.h(path)}"><span class="si-short" aria-hidden="true">${escapeHtml(
      short,
    )}</span><span class="si-long">${long}</span></a>`;
  const index = `<nav class="sec-index" aria-label="Methodology sections">
  <a class="sec-top" href="#content" aria-label="Back to the top of the page">&#8593; Top</a>
  ${link("01 Protocol", "01 The scan protocol", "methodology/#protocol")}
  ${link("02 Threats", "02 What the checks are for", `methodology/#${THREATS_SECTION_ID}`)}
  ${link("03 Scorecard", `03 ${COMPARE_TITLE}`, `methodology/#${COMPARE_SECTION_ID}`)}
  ${link("04 Evidence", "04 Evidence classes", "methodology/#evidence-classes")}
  ${link("05 Formula", "05 The formula", "methodology/#formula")}
  ${link("06 Grades", "06 Grades", "methodology/#grades")}
  ${link("07 Local lane", `07 ${LOCAL_TITLE}`, `methodology/#${LOCAL_SECTION_ID}`)}
  ${link("08 Changelog", "08 Changelog", "methodology/#changelog")}
</nav>`;

  const body = `
<section class="pagehead">
  <p class="kicker">The spec · versioned</p>
  <h1 class="banner banner-sm">Scoring methodology <span class="mv">v${METHODOLOGY_VERSION}</span></h1>
  <p class="standfirst">This directory measures <strong>sscsb-control adoption</strong>.
  It is not a general security audit. The rules below are versioned, and every listing
  names the version that scored it.</p>
</section>
${index}

<section class="honesty">
  <p class="honesty-head">The honesty rule</p>
  <p class="honesty-body">The scanner runs <code>sscsb init</code> before it verifies,
  which installs the very files many controls look for. So it snapshots the file list
  first: <strong>evidence the scanner created never counts.</strong> A check that could
  not run is <strong>unverified — a third state</strong> ${define("unverified")}. It is
  shown hatched, and left out of the sums entirely. An unperformed check is never a
  verdict.</p>
  <p class="honesty-body" id="trust">Three things can produce a record, and they see
  different amounts. That is the ${defineTerm("lane")}, stamped on every listing. It
  decides nothing about the score. It tells you how far the scanner could see. An
  <strong>external</strong> record was produced here, from outside the project; an
  <strong>authenticated</strong> one by the repository's own CI, signed there, so the
  signature proves which workflow made it; a <strong>local</strong> one by a maintainer
  on their own machine, with a key the repository itself publishes. Where a build
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
  ${head("04", "Evidence classes", "evidence-classes", { rail: false })}
  <div class="table-scroll">
  <table class="method-table cls-table">
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
  ${localLaneBodyWithContractTable(ctx.h)}
</section>

<section class="method-section prose">
  ${head("08", "Changelog", "changelog")}
  <ul>
  ${changelogItems(ctx.h(`methodology/#${LOCAL_SECTION_ID}`))}
  </ul>
</section>
${SEC_SPY}`;
  return page(ctx, { title: "Scoring Methodology", body });
}

/**
 * The section index's scroll-spy.
 *
 * Measured before this existed: across all thirty-eight phone slices of a
 * 31,412px page — including the ones deep inside section 07 — the strip read
 * "01 PROTOCOL 02 THREATS 03 SCORECARD", pinned left, unchanged. Not one link
 * carried a class or `aria-current`. The one piece of wayfinding on the site's
 * longest document told a reader where they could GO and never where they
 * WERE, and 2.5 of its 8 destinations were reachable without a sideways drag.
 *
 * It reads positions rather than observing intersections on purpose: several
 * of the anchors are the short `.sec-head` band rather than the section box,
 * and an IntersectionObserver over a 60px band flickers its active state on
 * and off as a reader scrolls through six thousand pixels of the section under
 * it. Walking up to the enclosing <section> and asking which one the sticky
 * bar is currently sitting inside is the same question with a stable answer.
 *
 * The strip also scrolls ITSELF, by assignment rather than scrollIntoView():
 * scrollIntoView on a sticky element inside a scroll container can move the
 * page as well as the strip, and moving the page during a scroll is the one
 * thing this must never do.
 */
const SEC_SPY = `<script>
(function () {
  var nav = document.querySelector("nav.sec-index");
  if (!nav) return;
  var links = [];
  Array.prototype.forEach.call(nav.querySelectorAll("a[href]"), function (a) {
    if (a.classList.contains("sec-top")) return;
    var hash = a.getAttribute("href").split("#")[1];
    if (!hash) return;
    var el = document.getElementById(hash);
    if (!el) return;
    links.push({ a: a, el: el.closest("section") || el });
  });
  if (links.length === 0) return;
  var current = null;
  function paint() {
    // +24, not +8: an anchor jump lands its target at scroll-margin 68px while
    // the bar's bottom is 48px, so a tighter edge left the PREVIOUS section
    // marked current for the first screen after every jump — measured.
    var edge = nav.getBoundingClientRect().bottom + 24;
    var found = links[0];
    for (var i = 0; i < links.length; i++) {
      if (links[i].el.getBoundingClientRect().top <= edge) found = links[i];
    }
    if (found === current) return;
    if (current) current.a.removeAttribute("aria-current");
    found.a.setAttribute("aria-current", "true");
    current = found;
    var a = found.a;
    var target = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
    var max = nav.scrollWidth - nav.clientWidth;
    nav.scrollLeft = Math.max(0, Math.min(max, target));
  }
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; paint(); });
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  paint();
})();
</script>`;
