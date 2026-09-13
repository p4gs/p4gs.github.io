/**
 * Signal — the directory table and the per-repository detail page.
 *
 * THE TABLE IS THE HERO. Paperclip's fill-less hairline grammar, hardened for
 * a table it never had to render: zebra striping (at fifty rows hairlines
 * alone stop the eye tracking), tabular numerals on every figure, 52px rows,
 * and a sticky header that clears the condensed header pill. Hover is a tint
 * and nothing else — no lift, no shadow, no scale, because a row that moves
 * under the cursor is a row you lose your place in.
 *
 * The shipped `filter.js` contract is kept exactly: the rows ARE
 * `table.directory tbody tr` carrying `data-name` and the sort/filter
 * attributes, and filter.js toggles their INLINE display (`""` restores
 * whatever the stylesheet says). That is what lets the same rows be a table at
 * 1440 and a stacked card list at 390 with no second code path.
 *
 * The detail page uses OpenAI's nested-container grammar for the control grid:
 * each phase is a container, each control a row inside it, each row expanding
 * in place rather than into a modal — a compliance reader opens five in a row
 * and compares them.
 */
import { ACTION_REPO_URL, SCAN_API_URL, SUBMIT_URL } from "../../config";
import {
  anchorCaveat,
  coverageFacts,
  LOCAL_SCAN_COMMAND,
  plural,
  type CoverageFacts,
} from "../../coverage";
import { define, defineTerm, GLOSSARY } from "../../glossary";
import type { ListingFacts } from "../../listing";
import type { ScanRecord, Score } from "../../schema";
import { COVERAGE_FLOOR_PROVISIONAL } from "../../scoring";
import {
  LANE_TITLE,
  LOCAL_RECORD_PUBLISHED,
  LOCAL_SIGNATURE_NAMESPACE,
  LOCAL_SIGNATURE_PUBLISHED,
  localOverlayCount,
  resolveTrustKind,
  type TrustInfo,
  trustKeyOf,
  type TrustKind,
} from "../../trust";
import {
  listingShareUrl,
  LOCAL_METHODOLOGY_SHARE_URL,
  METHODOLOGY_SHARE_URL,
  shareUrl,
} from "../share-urls";
import { factSentences } from "../shared-facts";
import { exposurePanel } from "../threats-shared";
import {
  countMark,
  gradeBadge,
  legend,
  mark,
  meter,
  PHASE_NAMES,
  pctText,
  statusChip,
  tally,
  type MarkState,
} from "./components";
import { chapterRail, escapeHtml, factsFor, href, page } from "./layout";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

function repoSlugPath(r: ScanRecord): string {
  return `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
}

/**
 * The evidence-source chip.
 *
 * The state comes from the shared resolver in `trust.ts` — sidecar
 * authoritative, run URL only as a fallback — so no design can show a verified
 * mark without a verified sidecar. The local chip is deliberately the quietest
 * of the four: it is a real signature but WEAKER evidence than CI, and the
 * styling has to say so before the title attribute does.
 *
 * The titles come from `trust.ts` LANE_TITLE, not from here — what a lane mark
 * MEANS is the provenance contract, not this design’s copy. Only the visible
 * label below is Signal’s own voice.
 */
const LANE_TEXT: Readonly<Record<TrustKind, string>> = {
  verified: "signed CI",
  "unsigned-action": "CI · unsigned",
  local: "local · signed",
  external: "external",
};

const LANE_CLASS: Readonly<Record<TrustKind, string>> = {
  verified: "lane-verified",
  "unsigned-action": "lane-unsigned",
  local: "lane-local",
  external: "lane-ext",
};

function laneChip(kind: TrustKind): string {
  return `<span class="lane ${LANE_CLASS[kind]}" title="${escapeHtml(
    LANE_TITLE[kind],
  )}">${escapeHtml(LANE_TEXT[kind])}</span>`;
}

/** A signed local record filled some rows nothing else could reach. */
function localOverlayChip(lt: TrustInfo | undefined): string {
  const n = localOverlayCount(lt);
  if (n === 0) return "";
  const title = `+${plural(n)} resolved by a local scan signed by ${
    lt?.signer ?? "an approved signer"
  }, verified against this repository's committed allowed_signers`;
  return `<span class="lane lane-overlay" title="${escapeHtml(title)}">+ local ${n}</span>`;
}

/**
 * The row's coverage note, plus the anchor caveat when the documented one-line
 * fix would refuse here. The caveat comes from `coverage.ts` so every design
 * says the same true thing about what a maintainer actually has to run.
 */
function coverageNote(f: CoverageFacts): string {
  const body = coverageNoteBody(f);
  const caveat = anchorCaveat(f);
  return body && caveat
    ? `${body}<p class="rn rn-caveat">${escapeHtml(caveat)}</p>`
    : body;
}

function coverageNoteBody(f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor ? "No letter" : "Provisional";
  if (f.state === "fixable-by-local") {
    return `<p class="rn rn-warn"><strong>${head}</strong> — ${f.coverage}% answered.
    ${plural(f.localResolvable)} can only be answered on a maintainer's own machine.
    <code>${LOCAL_SCAN_COMMAND}</code> answers them.</p>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<p class="rn rn-warn"><strong>${head}</strong> — ${f.coverage}% answered.
    <code>${LOCAL_SCAN_COMMAND}</code> would settle ${plural(f.localResolvable)} of them,
    taking it to ${f.projectedCoverage}% — still short. The rest of the gap is in controls
    a repository scan can see, and they are still unanswered.</p>`;
  }
  if (f.state === "local-applied") {
    return `<p class="rn rn-warn"><strong>${head}</strong> — ${f.coverage}% answered.
    A signed local scan already settled ${plural(f.resolvedByLocal)};
    ${plural(f.unverified)} still have no verdict.</p>`;
  }
  return `<p class="rn rn-warn"><strong>${head}</strong> — ${f.coverage}% answered.
  ${plural(f.unverified)} could not be answered by any source here.</p>`;
}

/**
 * The merge's findings, in the row.
 *
 * ROUND-2 CORRECTION. Every finding used to be printed in full inside the
 * Repository cell, so three listings carrying the same ~130-word self-report
 * paragraph turned a 52px hairline row into a 330px wall of identical grey
 * prose — at fifty listings the table would have stopped being a table. The
 * findings are still ON the row, because a gap that does not say why is a
 * silent downgrade, but only the one finding the contract names stays open:
 *
 *  - A CONTRADICTION is always visible. types.ts requires the disagreement to
 *    be named on the listing AND the detail page, and a reader must not have
 *    to open anything to meet the most interesting fact about that record.
 *  - Everything else — a stale local record, assertions held back, the
 *    submitter's own score block — is a footnote about provenance, and rides
 *    in a closed `<details>` that counts itself in its own summary.
 *
 * `factSentences` puts the contradiction first, so the split is positional
 * rather than a second copy of the rule.
 */
function factNotes(lf: ListingFacts, directory: Score): string {
  const all = factSentences(lf, directory);
  const contradicted = lf.contradictions.length > 0;
  const open = contradicted ? all.slice(0, 1) : [];
  const folded = contradicted ? all.slice(1) : all;
  const head = open
    .map((n) => `<p class="rn rn-contra">${escapeHtml(n)}</p>`)
    .join("");
  if (folded.length === 0) return head;
  const label = `${folded.length} ${folded.length === 1 ? "note" : "notes"} on this record`;
  return `${head}<details class="row-notes"><summary>${escapeHtml(label)}</summary>${folded
    .map((n) => `<p class="rn rn-note">${escapeHtml(n)}</p>`)
    .join("")}</details>`;
}

/** The same findings as a detail-page section, beside the per-control ids. */
function renderFactsSection(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return `<section class="panel panel-flag">
  <h2 class="panel-title">What the evidence merge found</h2>
  ${notes.map((n) => `<p class="body-copy">${escapeHtml(n)}</p>`).join("\n  ")}
  ${
    lf.contradictions.length
      ? `<p class="body-copy">Each contradicted control is listed below as a
  <strong>gap</strong>. Its row names the sources and the verdict each gave.</p>`
      : ""
  }
</section>`;
}

/**
 * The closing glossary, as the definition list it always was.
 *
 * Round 2 shipped the shared `directoryTermsNote` paragraph: four definitions,
 * four em-dash asides, a semicolon and a trailing parenthetical link in one
 * ~660px block of alternating bold terms and grey italic glosses. The device
 * works once; at four consecutive definitions the reader cannot scan for a
 * term, which is the only reason a glossary exists. On a phone it was a ~430px
 * run-on.
 *
 * The WORDS are not Signal's: every definition comes out of `glossary.ts`, the
 * same source the shared paragraph reads, so the site's vocabulary cannot
 * drift between designs — only its presentation does. `data-defines` still
 * rides on every gloss, which is what `home.test.ts` checks, and the `#trust`
 * link the shared note owes the methodology is kept verbatim.
 *
 * The three framing sentences that carry an actual claim ("a low second number
 * is not a mark against the project") stay as prose above the list, because
 * they are an argument, not a definition.
 */
function keyGlossary(): string {
  // "provisional" is on this page twice — the grade chip and the row's
  // coverage note — so its definition has to be here too; home.test.ts fails
  // if a term appears without one, which is exactly the contract this list
  // inherits from the shared paragraph it replaces.
  const terms = ["countable", "coverage", "provisional", "unverified", "gap", "lane"] as const;
  const rows = terms
    .map((k) => {
      const e = GLOSSARY[k]!;
      return `  <dt class="kg-term">${escapeHtml(e.term)}</dt>
  <dd class="kg-def" data-defines="${k}">${escapeHtml(e.plain)}</dd>`;
    })
    .join("\n");
  return `<section class="key-gloss-block" aria-labelledby="key-gloss-h">
<h2 class="key-gloss-h" id="key-gloss-h">What the columns mean</h2>
<p class="key-note">Two numbers ride with every listing: how many checks passed, and how
many produced an answer at all. A low second number is not a mark against the project —
it means the scan could not see far enough. Each listing says which checks went
unanswered, and why (<a href="${href("methodology/#trust")}">how that is checked</a>).</p>
<dl class="key-gloss">
${rows}
</dl>
</section>`;
}

function verdictCell(score: Score): string {
  const t = tally(score);
  return `${countMark("pass", t.pass)}${countMark("fail", t.fail)}${countMark(
    "gap",
    t.gap,
  )}${countMark("unverified", t.unverified)}`;
}

/**
 * The zero-result state — the one place this page made a promise it did not keep.
 *
 * The lede says "type any owner/repo to search the record", and filtering to a
 * string that matched nothing left a void: zero visible rows, no message
 * anywhere in `main`, and at 1440 an orphan 43px header row ("Repository Grade
 * Passed Answered Verdicts Source Scanned") with an empty body under it. The
 * only feedback was a 13px mono count up in the controls bar flipping to "0 of
 * 3 shown". On a site whose whole register is honesty about what it can and
 * cannot show, the search box was the one control that said nothing.
 *
 * `public/filter.js` is shared by five designs, so the proper fix — teaching
 * the shared handler about an empty state — is filed as a proposal. This is
 * Signal's local workaround and it deliberately does not reimplement any of
 * filter.js's logic: it listens to the SAME three controls, AFTER filter.js
 * (this script is parsed after the deferred `filter.js`, so its listeners are
 * registered second and run second), and only reads back how many rows
 * filter.js left visible. If filter.js is absent the page is unchanged.
 */
const DIR_EMPTY_SCRIPT = `<script>(function(){
  var empty=document.getElementById("dir-empty");
  var q=document.getElementById("dir-empty-q");
  var input=document.getElementById("dir-filter");
  var table=document.querySelector("table.directory");
  var wrap=document.querySelector(".table-wrap");
  if(!empty||!q||!input||!table||!wrap)return;
  var rows=Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
  if(!rows.length)return;
  var sync=function(){
    var shown=0;
    for(var i=0;i<rows.length;i++){if(rows[i].style.display!=="none")shown++;}
    var none=shown===0;
    q.textContent=input.value.trim();
    empty.hidden=!none;
    // The header row is the other half: hidden, the 43px orphan thead goes
    // with it, so the region is a message rather than a labelled void.
    wrap.hidden=none;
  };
  var later=function(){setTimeout(sync,0);};
  input.addEventListener("input",later);
  var sort=document.getElementById("dir-sort");
  if(sort)sort.addEventListener("change",later);
  var inc=document.getElementById("dir-incomplete");
  if(inc)inc.addEventListener("change",later);
  later();
})();</script>`;

export function renderDirectory(
  records: ScanRecord[],
  trust: ReadonlyMap<string, TrustInfo> = new Map(),
  localTrust: ReadonlyMap<string, TrustInfo> = new Map(),
): string {
  const sorted = [...records].sort((a, b) => {
    const g = (GRADE_ORDER[a.score.grade] ?? 9) - (GRADE_ORDER[b.score.grade] ?? 9);
    if (g !== 0) return g;
    return b.score.evidence_coverage_percent - a.score.evidence_coverage_percent;
  });
  const rows = sorted
    .map((r) => {
      const slug = `${r.repo.owner}/${r.repo.name}`;
      const lt = localTrust.get(trustKeyOf(r));
      const kind = resolveTrustKind(r, trust.get(trustKeyOf(r)), lt);
      const lf = factsFor(r);
      const f = coverageFacts(r, localOverlayCount(lt));
      // The description is clamped to one line at >=768px so a 400-character
      // sentence cannot set the row height (round 3, D24 — the table is a
      // table). The clamp stays; what it owed the reader was a way to see the
      // rest without leaving the page, and the full string on `title` is that,
      // at zero cost to row density.
      const desc = r.repo.description
        ? `<span class="row-desc" title="${escapeHtml(r.repo.description)}">${escapeHtml(
            r.repo.description,
          )}</span>`
        : `<span class="row-desc row-desc-none">No description published.</span>`;
      return `<tr class="row" data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}" data-coverage="${r.score.evidence_coverage_percent}" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${f.belowFloor ? "0" : "1"}" data-contradictions="${lf.contradictions.length}">
  <td class="c-repo" data-label="Repository">
    <a class="row-link" href="${href(repoSlugPath(r))}"><span class="row-owner">${escapeHtml(
      r.repo.owner,
    )}/</span><span class="row-name">${escapeHtml(r.repo.name)}</span></a>
    <div class="row-sub">${desc}${factNotes(lf, r.score)}</div>
    ${coverageNote(f)}
  </td>
  <td class="c-grade" data-label="Grade">${gradeBadge(r.score)}</td>
  <td class="c-num" data-label="Passed"><span class="num">${escapeHtml(
    pctText(r.score.overall_percent),
  )}</span>${meter(r.score.overall_percent, "score")}</td>
  <td class="c-num" data-label="Answered"><span class="num">${
    r.score.evidence_coverage_percent
  }%</span>${meter(r.score.evidence_coverage_percent, "coverage")}</td>
  <td class="c-marks" data-label="Verdicts">${verdictCell(r.score)}</td>
  <td class="c-lane" data-label="Source">${laneChip(kind)}${localOverlayChip(lt)}</td>
  <td class="c-date" data-label="Scanned"><span class="num">${escapeHtml(
    r.scanned_at.slice(0, 10),
  )}</span></td>
</tr>`;
    })
    .join("\n");
  const body = `
<header class="page-head">
  <p class="sg-eyebrow">PUBLIC RECORD · ${escapeHtml(String(records.length))} LISTED</p>
  <h1 class="page-title">Scan directory</h1>
  <p class="page-lede">Repositories scanned with sscsb, scored by the
  <a href="${href("methodology/")}">published methodology</a>. A maintainer reviewed every
  listing before it appeared. Type any <code>owner/repo</code> to search the record — or
  to put one that is not in it yet into the scan queue.</p>
</header>

<div class="dir-bar">
  <div class="dir-search">
    <label class="sr-only" for="dir-filter">Search the directory</label>
    <input type="search" id="dir-filter" placeholder="owner/repo"
      aria-label="Search the directory, or submit a repository to scan (owner/repo or GitHub URL)">
  </div>
  <div class="dir-controls">
    <label class="dir-controls-label" for="dir-sort">Order</label>
    <select id="dir-sort">
      <option value="grade">grade, then answered</option>
      <option value="coverage">most answered</option>
      <option value="scanned">last scanned</option>
      <option value="name">name</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      under ${COVERAGE_FLOOR_PROVISIONAL}% answered</label>
    <span id="dir-count" class="dir-count"></span>
  </div>
</div>
<div class="scan-card" id="dir-scan" hidden
  data-api="${escapeHtml(SCAN_API_URL)}" data-fallback="${escapeHtml(SUBMIT_URL)}">
  <p class="scan-copy"><strong>No record for this repository yet.</strong>
  Request an unauthenticated sscsb scan. A maintainer reviews every record before it
  enters the directory.</p>
  <button type="button" class="btn" id="dir-scan-cta">Scan now</button>
  <p class="scan-status" id="dir-scan-status" aria-live="polite" hidden></p>
</div>

<div class="legend-top">${legend()}</div>
<div class="table-wrap">
<table class="directory">
  <thead>
    <tr>
      <th scope="col" class="c-repo">Repository</th>
      <th scope="col" class="c-grade">Grade</th>
      <th scope="col" class="c-num">Passed</th>
      <th scope="col" class="c-num">Answered</th>
      <th scope="col" class="c-marks">Verdicts</th>
      <th scope="col" class="c-lane">Source</th>
      <th scope="col" class="c-date">Scanned</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>
<p class="dir-empty" id="dir-empty" hidden>Nothing in the record matches
  <code id="dir-empty-q"></code>. Three repositories are listed so far, and a repository
  that is not one of them has simply not been scanned — it is not a verdict about it.
  Type a full <code>owner/repo</code> and the scan queue opens above; or
  <a href="${href("directory/")}">clear the filter</a> to see every listing.</p>
<div class="legend-bottom">${legend()}</div>
${keyGlossary()}
<script src="${href("filter.js")}" defer></script>
${DIR_EMPTY_SCRIPT}`;
  return page({ title: "Scan Directory", body, active: "directory" });
}

/* ────────────────────────── the detail page ───────────────────────────── */

const OUTCOME_STATE: Readonly<Record<string, MarkState>> = {
  pass: "pass",
  fail: "fail",
  gap: "gap",
  unverified: "unverified",
  info: "info",
};

/** Prefilled new-issue link ON THE TARGET REPO suggesting the action. */
export function nudgeIssueUrl(r: ScanRecord): string {
  const title = encodeURIComponent("Publish an authenticated sscsb supply-chain scan");
  const body = encodeURIComponent(
    [
      `This repository is listed in the SSCS Bootstrapper public directory with an external (unauthenticated) scan:`,
      listingShareUrl(r.repo.owner, r.repo.name),
      ``,
      `External scans cannot see local-environment controls or private GitHub settings, so parts of the score show as unverified. Running the sscsb-action in this repo's own CI publishes an authenticated record instead:`,
      `${ACTION_REPO_URL}#quickstart`,
      ``,
      `Scoring methodology: ${METHODOLOGY_SHARE_URL}`,
    ].join("\n"),
  );
  return `${r.repo.url}/issues/new?title=${title}&body=${body}`;
}

/**
 * A reason sentence long enough, and repeated often enough inside one family,
 * that printing it on every row stops the column being readable.
 *
 * Measured on p4gs/sscsb-action: one 200-character sentence ("resolved by a
 * signed local scan: this control lives in the development environment, so a
 * workstation record signed by a key this repository commits in
 * .sscsb/policy/allowed_signers is the only evidence that can exist for it")
 * appeared six times across a 42-row control grid, two full lines of body copy
 * each. Scanning down the column the eye cannot tell which rows differ — the
 * same failure the nine identical attack-group disclaimers had.
 *
 * Both thresholds matter. THREE occurrences, because two is a coincidence and
 * hoisting it would cost a reader a lookup for nothing. EIGHTY characters,
 * because the short reasons repeat too ("optional control not enabled by this
 * repository", 3x in two families) and a six-word reason is cheaper to read in
 * place than to chase upwards.
 */
const HOIST_MIN_REPEATS = 3;
const HOIST_MIN_CHARS = 80;

/** What a hoisted row shows instead: the reason's own opening clause. */
function reasonTag(reason: string): string {
  const head = reason.split(/[:—]/)[0]!.trim();
  return head.length > 0 && head.length <= 48 ? head : "see the note above";
}

function sharedReasons(controls: readonly ScanRecord["controls"][number][]): string[] {
  const counts = new Map<string, number>();
  for (const c of controls) {
    if (c.reason) counts.set(c.reason, (counts.get(c.reason) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([r, n]) => n >= HOIST_MIN_REPEATS && r.length > HOIST_MIN_CHARS)
    .map(([r]) => r);
}

function controlRow(
  c: ScanRecord["controls"][number],
  hoisted: ReadonlySet<string> = new Set(),
  fixHref = "",
): string {
  const state = OUTCOME_STATE[c.scan_outcome] ?? "unverified";
  const raw =
    c.reclassified || c.raw_outcome !== c.scan_outcome
      ? `<span class="ctl-raw" title="sscsb verify raw outcome">raw: ${escapeHtml(
          c.raw_outcome,
        )}</span>`
      : "";
  const oos = c.in_scope ? "" : `<span class="ctl-oos">out of scope</span>`;
  // AN UNVERIFIED ROW SAYS WHY, AND NOW ALSO WHERE THE ANSWER COMES FROM. The
  // task this directory exists to serve is "see why a listing is under the
  // coverage floor and what the one-line fix is", and the second half used to
  // live ~6,000px away with nothing on the row pointing at it. The target is
  // whichever section of THIS page actually carries the remedy for this
  // listing, resolved once in renderRepoDetail rather than guessed per row.
  const fix = state === "unverified" && fixHref
    ? `<a class="ctl-fix" href="${fixHref}">how to answer this →</a>`
    : "";
  const reason = !c.reason
    ? fix
      ? `<p class="ctl-reason">${fix}</p>`
      : ""
    : hoisted.has(c.reason)
      ? `<p class="ctl-reason ctl-reason-shared"><span class="ctl-src">${escapeHtml(
          reasonTag(c.reason),
        )}</span>${fix}</p>`
      : `<p class="ctl-reason">${escapeHtml(c.reason)}${fix}</p>`;
  // A bare "EVIDENCE" label read as an unfinished caption 42 times per page —
  // nothing said it opened. The count gives the label weight and tells a
  // reader what they get for the tap; the caret comes from the stylesheet.
  const msgs = c.messages.length
    ? `<details class="ctl-evidence"><summary>evidence · ${c.messages.length}</summary><ul>${c.messages
        .map((m) => `<li>${escapeHtml(m)}</li>`)
        .join("")}</ul></details>`
    : "";
  // THE IDENTIFIER AND ITS VERDICT SHARE A LINE, and the row's prose gets the
  // width. Rounds 1-3 put the chip in a grid cell of its own: at 1440 that
  // left ~950px of nothing between a 145px identifier and a 70px pill, 42
  // times; at 390 the phone fix moved it onto its own ROW, a 50px pill alone
  // in a 272px cell, for ~26px of dead height on each of 44 rows. Wrapping the
  // two in `.ctl-head` lets the stylesheet have it both ways — a flex line on
  // a phone (the chip pushed right, dropping under a long identifier only when
  // it genuinely does not fit) and, via `display: contents` at >=1024px, two
  // separate cells of a four-column grid whose third column is the reason.
  const body = reason || msgs ? `<div class="ctl-body">${reason}${msgs}</div>` : "";
  return `<li class="ctl ctl-${escapeHtml(c.scan_outcome)}${c.in_scope ? "" : " ctl-out"}">
  <span class="ctl-mk">${mark(state, 18)}</span>
  <span class="ctl-head"><span class="ctl-id"><code>${escapeHtml(
    c.id,
  )}</code>${oos}${raw}</span>${statusChip(state)}</span>
  ${body}
</li>`;
}

/** One phase, as a nested container: family header, then its control rows. */
function phaseGroup(r: ScanRecord, phase: number, fixHref = ""): string {
  const controls = r.controls.filter((c) => c.phase === phase);
  // A family with nothing in scope rendered as a full card reading
  // "0 pass · 0 fail · 0 gap · 0 unanswered" beside a "no evidence" chip —
  // an empty container claiming to be a section. Nothing is hidden by this:
  // a phase with no controls contributes to no sum and has no verdicts.
  if (controls.length === 0) return "";
  const p = r.score.phases.find((s) => s.phase === phase);
  const counts = p
    ? `${p.pass} pass · ${p.fail} fail · ${p.gap} gap · ${p.unverified} unanswered`
    : "no verdicts";
  // THE CHIP CARRIES ITS DENOMINATOR. It is the largest, most scannable
  // element in the family header, and rounds 1-3 let it read a bare "100%" for
  // a family that had left a check unanswered — collapsing, in the one element
  // a skimmer actually reads, the two numbers every other surface on this site
  // spends paragraphs keeping apart. The fraction is the pass rate over what
  // was ANSWERED (unverified is never in a denominator, per types.ts), and the
  // unanswered count rides inside the same pill so it cannot be skimmed past.
  const countable = p ? p.pass + p.fail + p.gap : 0;
  const pct = p ? pctText(p.percent) : "no evidence";
  const chipText = p && p.percent !== null ? `${p.pass}/${countable} passed` : "no evidence";
  const chipTitle =
    p && p.percent !== null
      ? `${pct} of the ${countable} answered checks in this family passed${
          p.unverified ? `; ${plural(p.unverified)} could not be answered and are not counted` : ""
        }`
      : "No check in this family produced an answer";
  const chipSub =
    p && p.unverified > 0
      ? `<span class="family-count-sub">${p.unverified} unanswered</span>`
      : "";
  const allFailing = !!p && p.percent !== null && p.percent === 0 && p.fail + p.gap > 0;
  const shared = sharedReasons(controls);
  const hoisted = new Set(shared);
  const notes = shared
    .map((r) => {
      const n = controls.filter((c) => c.reason === r).length;
      return `<p class="family-note"><span class="family-note-n">${n} controls here</span>
    ${escapeHtml(r)}</p>`;
    })
    .join("\n  ");
  return `<section class="family${allFailing ? " family-failing" : ""}" id="phase-${phase}">
  <header class="family-head">
    <h2 class="family-title">${escapeHtml(PHASE_NAMES[phase] ?? `Phase ${phase}`)}</h2>
    <span class="family-count" title="${escapeHtml(chipTitle)}">${escapeHtml(
      chipText,
    )}${chipSub}</span>
  </header>
  <p class="family-meta">${escapeHtml(counts)}</p>
  ${notes}
  <ul class="ctl-list">
${controls.map((c) => controlRow(c, hoisted, fixHref)).join("\n")}
  </ul>
</section>`;
}

/** Prefilled new-issue link ON THE TARGET REPO asking for a local scan. */
function localNudgeIssueUrl(r: ScanRecord, f: CoverageFacts): string {
  const title = encodeURIComponent("Publish a signed local sscsb scan");
  const slug = `${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}`;
  const body = encodeURIComponent(
    [
      `This repository's listing in the SSCS Bootstrapper public directory is marked provisional — evidence coverage is ${f.coverage}%:`,
      shareUrl(`directory/${slug}/`),
      ``,
      `${plural(f.localResolvable)} are local-environment checks: commit signing, AI trailers, dependency gates and similar controls that live on a maintainer's machine, so no repository scan can ever observe them. They are shown as unverified and excluded from every denominator.`,
      ``,
      f.anchorReady === false
        ? `A maintainer settles them by first approving the scan in this repository's own allowed_signers, then running the scan:`
        : `A maintainer can close that gap in one line:`,
      ``,
      ...f.nudgeCommands.map((c) => `    ${c}`),
      ``,
      `It runs the scan locally, signs the record with the git signing key this repository already commits in .sscsb/policy/allowed_signers, and opens the submission. The directory verifies that signature against your own committed allowed_signers file before listing anything, and your record is then merged with every other evidence source we hold: where they agree that verdict stands, where they disagree the control is scored as a gap, and where a repository scan could observe a control your self-report waits for an independent record to agree with it. The local-environment controls are the ones nobody else can check, and there your signed word counts on its own.`,
      ``,
      `Methodology: ${LOCAL_METHODOLOGY_SHARE_URL}`,
    ].join("\n"),
  );
  return `${r.repo.url}/issues/new?title=${title}&body=${body}`;
}

/**
 * The detail page's coverage section, plus the anchor caveat when the
 * documented one-line fix would refuse here. Written once in `coverage.ts` so
 * the designs cannot disagree about what a maintainer actually has to run.
 */
function coverageCard(r: ScanRecord, f: CoverageFacts): string {
  const body = coverageCardBody(r, f);
  const caveat = anchorCaveat(f);
  if (!body || !caveat) return body;
  return `${body}
<section class="panel"><p class="body-copy">${escapeHtml(caveat)}</p></section>`;
}

function coverageCardBody(r: ScanRecord, f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter — insufficient evidence (${f.coverage}% coverage)`
    : "Why this grade is provisional";
  if (f.state === "fixable-by-local") {
    return `<section class="panel panel-act" id="improve">
  <h2 class="panel-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} have no verdict at all.
  <strong>${plural(f.localResolvable)}</strong> of them are local-environment checks —
  commit signing, AI trailers, dependency gates. Their evidence exists only on a
  maintainer's machine, and no repository scan reaches it.</p>
  <p class="body-copy">${
    f.anchorReady === false
      ? "Two steps, in this order — the repository has to approve the scan before it can run one:"
      : "One command settles them:"
  }</p>
  <pre class="code"><code>${escapeHtml(f.nudgeCommands.join("\n"))}</code></pre>
  <p class="body-copy">It scans locally, signs the record with the git signing key this
  repository already commits in <code>.sscsb/policy/allowed_signers</code>, and opens the
  submission. No repository scan can answer these, so a signed local record is the only
  evidence that can exist for them
  (<a href="${href("methodology/#local")}">how it is scored</a>).</p>
  <div class="btn-row">
    <a class="btn" href="${escapeHtml(localNudgeIssueUrl(r, f))}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<section class="panel panel-act" id="improve">
  <h2 class="panel-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. <code>${LOCAL_SCAN_COMMAND}</code> would settle
  ${plural(f.localResolvable)} of the ${plural(f.unverified)} with no verdict. That takes
  coverage to <strong>${f.projectedCoverage}%</strong>, still short of the floor. Worth
  running; not enough on its own, because the rest are checks a repository scan can
  see.</p>
</section>`;
  }
  if (f.state === "local-applied") {
    return `<section class="panel panel-act" id="improve">
  <h2 class="panel-title">${escapeHtml(head)}</h2>
  <p class="body-copy">A signed local scan already settled ${plural(f.resolvedByLocal)}.
  Coverage is still <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor, with ${plural(f.unverified)} outside every
  denominator.</p>
</section>`;
  }
  return `<section class="panel panel-act" id="improve">
  <h2 class="panel-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} could not be answered by
  any source available here. Shown, never counted.</p>
</section>`;
}

/** Exactly what the SSH signature proves — and, as plainly, what it does not. */
function localCard(r: ScanRecord, lt: TrustInfo, primary: boolean): string {
  const recordHref = href(`${repoSlugPath(r)}${LOCAL_RECORD_PUBLISHED}`);
  const sigHref = href(`${repoSlugPath(r)}${LOCAL_SIGNATURE_PUBLISHED}`);
  const n = lt.resolved.length;
  const contribution = primary
    ? `<p class="body-copy">No repository-observable scan exists for this listing. So every
  control outside the local-environment class stays <strong>unverified</strong>, and a
  workstation record cannot supply one.</p>`
    : `<p class="body-copy">It settled <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class comes from the repository-observable record above. A local
  scan never overturns one, and never widens the scope it is measured against.</p>`;
  return `<section class="panel panel-lane" id="${primary ? "provenance" : "provenance-local"}">
  <h2 class="panel-title">Local scan — signature verified</h2>
  <p class="body-copy">A maintainer ran sscsb on their own machine and signed the record
  with their git signing key. The directory verified that detached SSH signature with
  <code>ssh-keygen -Y verify</code> against <code>.sscsb/policy/allowed_signers</code>
  <strong>fetched from this repository</strong> at commit
  <code>${escapeHtml((lt.commit ?? "").slice(0, 12))}</code> — committed content the
  submitter does not supply. Verifying principal
  <code>${escapeHtml(lt.signer ?? "")}</code>${
    lt.key_fingerprint ? ` (<code>${escapeHtml(lt.key_fingerprint)}</code>)` : ""
  }${lt.verified_at ? ` on ${escapeHtml(lt.verified_at.slice(0, 10))}` : ""}.</p>
  <p class="body-copy"><strong>What that proves, exactly:</strong> a holder of a key this
  repository commits as an approved signer asserts this result at that commit. Nothing
  further. It is a real signature, and it is <em>weaker</em> than an authenticated scan,
  which proves the repository's own CI produced the record.</p>
  ${contribution}
  <pre class="code"><code>ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
  <div class="btn-row">
    <a class="btn" href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a>
    <a class="btn-outline" href="${sigHref}">Detached signature</a>
  </div>
</section>`;
}

function provenanceCard(
  r: ScanRecord,
  t: TrustInfo | undefined,
  kind: TrustKind,
  lt?: TrustInfo,
): string {
  if (kind === "local" && lt) return localCard(r, lt, true);
  if (kind === "external") {
    return `<section class="panel panel-act" id="provenance">
  <h2 class="panel-title">Improve this score</h2>
  <p class="body-copy">This is an <strong>external</strong> scan. Controls that live in
  the development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Maintainers can publish an <strong>authenticated</strong> scan
  by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
  <div class="btn-row">
    <a class="btn" href="${ACTION_REPO_URL}">Install the Action</a>
    <a class="btn-outline" href="${escapeHtml(nudgeIssueUrl(r))}">Suggest it to the maintainers</a>
  </div>
</section>`;
  }
  if (kind === "unsigned-action" || !t) {
    return `<section class="panel panel-act" id="provenance">
  <h2 class="panel-title">Authenticated scan — unsigned</h2>
  <p class="body-copy">This record was submitted from the repository's own CI but carried
  <strong>no verified signature</strong>. The directory can therefore only list it as an
  unverified claim. Granting the scan job <code>id-token: write</code> lets the
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next record under
  the workflow's own identity. No secret is involved.</p>
  <div class="btn-row">
    <a class="btn" href="${ACTION_REPO_URL}#signed-records">Signed records</a>
  </div>
</section>`;
  }
  const recordHref = href(`${repoSlugPath(r)}scan-record.json`);
  const bundleHref = href(`${repoSlugPath(r)}scan-record.json.sigstore.json`);
  return `<section class="panel panel-lane" id="provenance">
  <h2 class="panel-title">Authenticated scan — signature verified</h2>
  <p class="body-copy">This record was produced in the repository's <strong>own CI</strong>
  and keyless-signed there. Before listing it, the directory verified the Sigstore bundle
  against the certificate identity <code>${escapeHtml(t.identity ?? "")}</code>${
    t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""}.
  The repository, workflow path and default branch are burned into that certificate by
  GitHub's OIDC issuer, not asserted by the record. The marks above are the work list:
  adopt the flagged controls, re-run the action, and the next record replaces this
  one.</p>
  <div class="btn-row">
    <a class="btn" href="${recordHref}">scan-record.json</a>
    <a class="btn-outline" href="${bundleHref}">Signature bundle</a>
    <a class="btn-outline" href="${ACTION_REPO_URL}">Action docs</a>
  </div>
</section>`;
}

/**
 * The attack-group panel's state column, compacted.
 *
 * `threats-shared.ts` labels an all-passing group "All answered checks passed"
 * — nine words of mono caps, right-aligned, repeated on every one of nine rows
 * for a repository that evidenced all nine groups. Two rounds of judges read
 * that column as templated output rather than as a designed record, and they
 * are right: as a repeated value it is a status, and a status column's job is
 * to be scannable.
 *
 * It is SHORTENED, never removed, and never removed from SOME rows — this site
 * renders status as colour + shape + text on every row without exception, and
 * hiding eight of nine labels would be exactly the "colour alone" failure the
 * palette exists to prevent. The row keeps its green left rule (shape), its
 * words, and the full sentence on `title`; the panel's intro already carries
 * the caveat that a full set of answered checks is not safety, so the
 * disclaimer is not lost either.
 *
 * `threats-shared.ts` is shared by five designs, so the substitution is done
 * here on the rendered string and asserted by a test rather than edited at
 * source; the proposal to shorten `STATE_LABEL` is filed.
 */
const SHARED_EX_STATE = `<span class="ex-state">All answered checks passed</span>`;

/**
 * The same disclaimer, nine times.
 *
 * `threats-shared.ts` prints one sentence on every all-passing group, so a
 * repository that evidenced all nine carried nine verbatim copies of it —
 * flagged in round 1, still flagged in round 3. Round 2 hid the copies from
 * the second row onward in CSS, which left the FIRST row alone carrying a
 * third line no other row had: a leftover rather than a say-it-once.
 *
 * It is said once, above the list, where it governs every row that reads "All
 * passed" — and the per-row copies leave the MARKUP rather than merely the
 * paint, so a reader using a screen reader or reader mode meets it once too.
 * Nothing is lost: each row still states its own verdict in colour, shape and
 * words, and the full sentence stays on the state label's `title`.
 */
export const SHARED_EX_QUIET = `<span class="ex-detail ex-detail-quiet">Every sscsb check here that produced an answer passed. That is not the same as being safe from this group.</span>`;

const HOISTED_EX_NOTE = `<p class="ex-note">Where a group reads <strong>All passed</strong>: every sscsb check there that produced an answer passed. That is not the same as being safe from this group.</p>`;

function compactExposureStates(html: string): string {
  const shortened = html.replaceAll(
    SHARED_EX_STATE,
    `<span class="ex-state ex-state-ok" title="Every sscsb check here that produced an answer passed. That is not the same as being safe from this group.">All passed</span>`,
  );
  if (!shortened.includes(SHARED_EX_QUIET)) return shortened;
  return shortened
    .replaceAll(SHARED_EX_QUIET, "")
    .replace(`<ul class="ex-list">`, `${HOISTED_EX_NOTE}\n  <ul class="ex-list">`);
}

export function renderRepoDetail(r: ScanRecord, t?: TrustInfo, lt?: TrustInfo): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const kind = resolveTrustKind(r, t, lt);
  const facts = coverageFacts(r, localOverlayCount(lt));
  const t0 = tally(r.score);
  // Where the remedy for an unanswered check actually lives ON THIS PAGE.
  // Resolved once, from the same conditions that decide which cards render, so
  // a row can never link to a section this listing does not have.
  const fixHref =
    facts.state !== "complete"
      ? "#improve"
      : lt && kind !== "local"
        ? "#provenance-local"
        : "#provenance";
  const phases = [1, 2, 3, 4, 5, 6]
    .map((p) => phaseGroup(r, p, fixHref))
    .filter(Boolean)
    .join("\n");
  const body = `
<nav class="crumbs" aria-label="Breadcrumb"><a href="${href("directory/")}">← Directory</a></nav>
<header class="repo-head">
  <div class="repo-head-main">
    <h1 class="repo-title"><span class="row-owner">${escapeHtml(
      r.repo.owner,
    )}/</span>${escapeHtml(r.repo.name)}</h1>
    <p class="repo-meta">
      <span class="rm-fact"><a href="${escapeHtml(r.repo.url)}">${escapeHtml(
        r.repo.url,
      )}</a></span><span class="rm-sep"> · </span><span class="rm-fact">scanned ${escapeHtml(
        r.scanned_at.slice(0, 10),
      )} at <code>${escapeHtml(r.repo.commit.slice(0, 12))}</code> on <code>${escapeHtml(
        r.repo.default_branch,
      )}</code></span><span class="rm-sep"> · </span><span class="rm-fact">sscsb ${escapeHtml(
        r.scanner.sscsb_version,
      )}</span><span class="rm-sep"> · </span><span class="rm-fact">methodology v${
        r.methodology_version
      }</span><span class="rm-sep"> · </span><span class="rm-fact"><a class="rm-run" href="${escapeHtml(
        r.scanner.workflow_run_url,
      )}">scan run</a></span><span class="rm-sep"> · </span><span class="rm-fact">${laneChip(
        kind,
      )}${localOverlayChip(lt)}</span>
    </p>
  </div>
  <div class="repo-head-grade">${gradeBadge(r.score, { size: "lg" })}</div>
</header>

<div class="scoreboard">
  <div class="sb-cell">
    <span class="sb-label">Of the answered checks</span>
    <span class="sb-value">${escapeHtml(pctText(r.score.overall_percent))}</span>
    ${meter(r.score.overall_percent, "score")}
    <span class="sb-note">passed</span>
  </div>
  <div class="sb-cell">
    <span class="sb-label">Answered at all</span>
    <span class="sb-value">${r.score.evidence_coverage_percent}%</span>
    ${meter(r.score.evidence_coverage_percent, "coverage")}
    <span class="sb-note">${
      r.score.provisional
        ? `<em class="prov">provisional</em> ${define("provisional")}`
        : "of the checks in scope"
    }</span>
  </div>
  <div class="sb-cell sb-marks">
    <span class="sb-label">Every verdict</span>
    <span class="sb-tally">${countMark("pass", t0.pass)}${countMark(
      "fail",
      t0.fail,
    )}${countMark("gap", t0.gap)}${countMark("unverified", t0.unverified)}</span>
    <span class="sb-note">unanswered checks are never counted</span>
  </div>
</div>
${legend()}
<p class="terms-note terms-note-stats">${defineTerm("lane")} —
<a href="${href("methodology/#trust")}">how that is checked</a>.</p>

${chapterRail([
  { id: "exposure", label: "Defences found" },
  { id: "controls", label: "Every check" },
  { id: "provenance", label: "Who ran it" },
])}

${compactExposureStates(exposurePanel(href, r))}

<section id="controls" class="controls-section">
  <h2 class="section-title">Every check, with its raw verdict</h2>
  <p class="body-copy">Raw sscsb verdicts and every reclassification are shown.
  Transparency about what was and wasn't verifiable is the product.</p>
${phases}
</section>

${provenanceCard(r, t, kind, lt)}
${lt && kind !== "local" ? localCard(r, lt, false) : ""}
${renderFactsSection(factsFor(r), r.score)}
${coverageCard(r, facts)}`;
  return page({ title: `${slug} — Scan`, body, active: "directory" });
}
