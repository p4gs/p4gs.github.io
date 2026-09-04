/**
 * The home page's working parts, written once for all four designs.
 *
 * The four designs keep their own voice, chrome and headings; what they may
 * NOT do is disagree about the search control's contract, about when a ranked
 * panel is allowed to appear, or about the words used for a grade whose
 * evidence is thin. Those three things are correctness, not styling, so they
 * live here and each design skins them with its own CSS.
 *
 * Class names are neutral (`hp-*`, `tx-*`) and every design's stylesheet
 * defines them.
 */

import { questionFor } from "../checks";
import { defineTerm } from "../glossary";
import { SCAN_API_URL, SUBMIT_URL } from "../config";
import {
  listedSlugs,
  recentlyScanned,
  topRated,
  unansweredAcrossDirectory,
  type ExemplarCard,
  type Panel,
} from "../exemplars";
import type { ScanRecord } from "../schema";
import { ATTACK_CLASSES } from "../threats";
import type { TrustInfo } from "../trust";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type Href = (path: string) => string;

/**
 * The listing index the home page embeds.
 *
 * `filter.js` decides "already listed" by looking for the typed slug among the
 * directory table's rows. The home page has no table, so lifting the control
 * as-is left `exact` permanently false and the page offered to scan
 * repositories that already have a listing. The index is that missing input:
 * filter.js unions it with any table rows it finds, so both pages answer the
 * same question the same way.
 *
 * Serialized with `<` escaped, so a slug can never close the script element.
 */
export function listingIndex(records: readonly ScanRecord[]): string {
  const json = JSON.stringify(listedSlugs(records)).replaceAll("<", "\\u003c");
  return `<script type="application/json" id="dir-index">${json}</script>`;
}

/**
 * The search-and-submit control: one field that finds a listing or asks for a
 * scan of one that does not exist yet.
 *
 * Renders exactly the contract `site/public/filter.js` documents, plus the
 * index above. `label` and `placeholder` are the design's to choose; the ids
 * are not.
 */
export function searchControl(
  h: Href,
  records: readonly ScanRecord[],
  opts: { label: string; placeholder: string; scanCopy: string } ,
): string {
  const examples = records
    .slice(0, 3)
    .map(
      (r) =>
        `<a class="hp-chip" href="${h(
          `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`,
        )}">${esc(`${r.repo.owner}/${r.repo.name}`)}</a>`,
    )
    .join("");
  const chips = examples
    ? `<p class="hp-chips"><span class="hp-chips-label">Already listed</span>${examples}</p>`
    : "";
  return `<div class="hp-search">
  <label class="hp-search-label" for="dir-filter">${esc(opts.label)}</label>
  <input type="search" id="dir-filter" class="hp-search-input"
    placeholder="${esc(opts.placeholder)}"
    aria-label="Search the directory, or type owner/repo to ask for a scan">
  <div id="dir-found" class="dir-found" hidden data-detail-base="${esc(h("directory/"))}">
    <p class="dir-found-copy">Already listed.</p>
    <a id="dir-found-link" class="btn-outline" href="${h("directory/")}">Open the listing →</a>
  </div>
  <div id="dir-scan" class="dir-scan" hidden
    data-api="${esc(SCAN_API_URL)}" data-fallback="${esc(SUBMIT_URL)}">
    <p class="dir-scan-copy">${esc(opts.scanCopy)}</p>
    <button type="button" id="dir-scan-cta" class="btn">Scan it</button>
    <p id="dir-scan-status" class="dir-scan-status" aria-live="polite" hidden></p>
  </div>
  ${chips}
</div>
${listingIndex(records)}
<script src="${h("filter.js")}" defer></script>`;
}

/**
 * The directory's own vocabulary, defined once beside the listings.
 *
 * scorecard.dev's discipline: explain the term where it is first used, in the
 * sentence, rather than in a glossary nobody scrolls to. `test/home.test.ts`
 * fails if a page uses one of these terms without carrying its definition, so
 * this block is load-bearing rather than decorative.
 */
export function directoryTermsNote(h: Href): string {
  return `<p class="key-note">Two numbers ride with every listing. One is how many of the
${defineTerm("countable")} passed. The other is ${defineTerm("coverage")}. A low second
number is not a mark against the project: it means the scan could not see far enough.
Each listing says which checks went unanswered, and why. Where a letter is
${defineTerm("provisional")}, that is the reason. A check that went unanswered is
${defineTerm("unverified")}; one that was looked for and not found is a
${defineTerm("gap")}. The <strong>${defineTerm("lane")}</strong> column says who ran the
scan (<a href="${h("methodology/#trust")}">how that is checked</a>).</p>`;
}

const GRADE_SLUG: Readonly<Record<string, string>> = {
  "A+": "aplus", A: "a", B: "b", C: "c", D: "d", F: "f", NA: "na",
};

/**
 * One exemplar card. Fixed height by CSS, name truncated, description clamped:
 * a 60-character repository name and a 400-character description have to
 * produce the same grid, or the panel reflows into a mess at the first
 * unusual listing.
 *
 * Four facts, all plain English. No word from the retired vocabulary appears
 * here — "coverage" is "checks answered", "provisional" is the sentence about
 * what could not be checked.
 */
export function exemplarCard(h: Href, c: ExemplarCard): string {
  const passed = c.passedPercent === null ? "no answers yet" : `${c.passedPercent}% passed`;
  return `<a class="hp-card" href="${h(c.path)}">
  <span class="hp-card-head">
    <span class="hp-grade hp-grade-${GRADE_SLUG[c.grade] ?? "na"}">${esc(c.grade)}</span>
    <span class="hp-src" title="${esc(c.sourceLong)}">${esc(c.sourceShort)}</span>
  </span>
  <span class="hp-card-name">${esc(c.slug)}</span>
  <span class="hp-card-desc">${esc(c.description)}</span>
  <span class="hp-card-facts">
    <span class="hp-fact">${esc(passed)}</span>
    <span class="hp-fact">${c.answeredPercent}% answered</span>
    <span class="hp-fact hp-fact-date">${esc(c.scannedDate)}</span>
  </span>
  ${c.incompleteNote ? `<span class="hp-card-note">${esc(c.incompleteNote)}</span>` : ""}
</a>`;
}

/** A panel that is waiting for the directory to grow, saying so out loud. */
function waitingPanel(text: string, link?: { href: string; label: string }): string {
  return `<div class="hp-waiting">
  <p class="hp-waiting-copy">${esc(text)}</p>
  ${link ? `<a class="hp-waiting-link" href="${link.href}">${esc(link.label)}</a>` : ""}
</div>`;
}

function panelBody(h: Href, p: Panel<ExemplarCard>, link: { href: string; label: string }): string {
  return p.ready
    ? `<div class="hp-cards">${p.items.map((c) => exemplarCard(h, c)).join("\n")}</div>`
    : waitingPanel(p.waitingFor, link);
}

export interface PanelCopy {
  eyebrow: string;
  title: string;
  line: string;
}

export const TOP_RATED_COPY: PanelCopy = {
  eyebrow: "Best scoring",
  title: "Top rated",
  line: "The listings that passed the most of what could be checked.",
};

export const RECENT_COPY: PanelCopy = {
  eyebrow: "Freshest evidence",
  title: "Recently scanned",
  line: "A scan is a snapshot of one commit. These are the newest.",
};

export const UNANSWERED_COPY: PanelCopy = {
  eyebrow: "Across every listing",
  title: "Still unchecked",
  line: "The checks that most often have no answer here — and why.",
};

function panel(inner: string, copy: PanelCopy, id: string): string {
  return `<section class="hp-panel" id="${id}" aria-labelledby="${id}-h">
  <p class="hp-panel-eyebrow">${esc(copy.eyebrow)}</p>
  <h2 class="hp-panel-title" id="${id}-h">${esc(copy.title)}</h2>
  <p class="hp-panel-line">${esc(copy.line)}</p>
  ${inner}
</section>`;
}

/**
 * The aggregate panel — the one that replaces a "worst repos" list.
 *
 * It has the same visual weight and feeds the same peer pressure, and it names
 * no repository: it is about EVIDENCE, not about parties. Ranking third-party
 * projects by worst grade would measure adoption of this tool rather than
 * security, would rest on consent collected from whoever filed the request
 * rather than from the owner, and would contradict an invariant this codebase
 * states twice — "never a ranking of maintainers" (coverage.ts, directory.ts).
 */
export function unansweredPanel(h: Href, records: readonly ScanRecord[]): string {
  const s = unansweredAcrossDirectory(records);
  if (s.checks.length === 0) {
    return panel(
      waitingPanel(
        records.length === 0
          ? "Nothing has been scanned yet, so there is nothing left unchecked."
          : "Every check on every listing produced an answer.",
        { href: h("methodology/"), label: "How scoring works" },
      ),
      UNANSWERED_COPY,
      "still-unchecked",
    );
  }
  const rows = s.checks
    .map((c) => {
      const pct = Math.round((100 * c.listings) / Math.max(1, c.ofListings));
      return `<li class="hp-unans-row">
    <span class="hp-unans-q">${esc(questionFor(c.id))}
      <code class="hp-unans-id">${esc(c.id)}</code></span>
    <span class="hp-unans-track" aria-hidden="true"><span class="hp-unans-fill" style="width:${pct}%"></span></span>
    <span class="hp-unans-count">${c.listings} of ${c.ofListings}</span>
    <span class="hp-unans-why">${
      c.onlyMaintainerCanAnswer
        ? "only a maintainer's own machine can answer this"
        : "no source could answer it"
    }</span>
  </li>`;
    })
    .join("\n");
  const tail =
    s.maintainerOnly > 0
      ? `<p class="hp-unans-foot">${s.maintainerOnly} of these ${s.checks.length} describe a
    developer's own machine. No scan from outside can see them — a maintainer answers them
    by running the scan themselves and signing the result.
    <a href="${h("methodology/#local")}">How that is checked →</a></p>`
      : `<p class="hp-unans-foot">A check with no answer is never counted as a failure.
    <a href="${h("methodology/")}">How scoring works →</a></p>`;
  return panel(`<ul class="hp-unans">\n${rows}\n</ul>\n${tail}`, UNANSWERED_COPY, "still-unchecked");
}

/** All three exemplar panels, in reading order. */
export function exemplarPanels(
  h: Href,
  records: readonly ScanRecord[],
  trust?: ReadonlyMap<string, TrustInfo>,
  localTrust?: ReadonlyMap<string, TrustInfo>,
): string {
  const browse = { href: h("directory/"), label: "Browse every listing →" };
  return [
    panel(panelBody(h, topRated(records, trust, localTrust), browse), TOP_RATED_COPY, "top-rated"),
    panel(
      panelBody(h, recentlyScanned(records, trust, localTrust), browse),
      RECENT_COPY,
      "recently-scanned",
    ),
    unansweredPanel(h, records),
  ].join("\n");
}

/**
 * The compact taxonomy: nine chips, each a link into the full explainer.
 *
 * The full version lives on /methodology/ rather than on a page of its own,
 * because the taxonomy IS scoring methodology — it is the answer to "what is
 * this check for" — and a fifth page would have to be written four times for
 * no reader benefit. Every chip deep-links to its own section there.
 */
export function threatStrip(h: Href): string {
  const chips = ATTACK_CLASSES.map(
    (c) => `<a class="tx-chip" href="${h(`methodology/#threat-${c.id.toLowerCase()}`)}">
    <span class="tx-chip-id">${c.id}</span><span class="tx-chip-name">${esc(c.name)}</span></a>`,
  ).join("\n  ");
  return `<section class="tx-strip" aria-labelledby="tx-strip-h">
  <p class="hp-panel-eyebrow">What the checks are for</p>
  <h2 class="hp-panel-title" id="tx-strip-h">Nine ways supply chains get attacked</h2>
  <p class="hp-panel-line">Every check defends against at least one of these — or says
  plainly that it defends against none, and only tells outsiders what a project does.</p>
  <div class="tx-chips">
  ${chips}
  </div>
  <a class="hp-more" href="${h("methodology/#threats")}">Each one, with what it looked like when it happened →</a>
</section>`;
}
