/**
 * Bulletin directory — the broadsheet listing, and the per-repository sheet.
 *
 * The table is set like a newspaper table of results: ruled, dense, strong
 * column heads, no card soup. Below 760px each row restacks into a labelled
 * block (the `data-label` on every cell is what the stylesheet prints), so the
 * page never scrolls sideways and the rows stay readable on a phone. The DOM
 * contract `site/public/filter.js` pins — the ids, the `data-*` attributes and
 * `table.directory tbody tr` — is unchanged: only the presentation moves.
 *
 * Every honesty rule the site publishes is rendered here, and none of them is
 * this design's to reword:
 *   - the lane mark comes from `trust.ts`, so no design can show a verified
 *     mark without a verified sidecar, and the local mark reads weaker;
 *   - a listing under the coverage floor says WHICH checks are unanswered and
 *     what the one-line fix is, from `coverage.ts`;
 *   - a contradiction between evidence sources is named on the row AND on the
 *     detail page, from `shared-facts.ts`. Scoring a disagreement down while
 *     saying nothing about it is the silent downgrade this site exists to
 *     argue against.
 */
import { ACTION_REPO_URL, METHODOLOGY_VERSION, SCAN_API_URL, SUBMIT_URL } from "../../config";
import {
  anchorCaveat,
  coverageFacts,
  LOCAL_SCAN_COMMAND,
  plural,
  type CoverageFacts,
} from "../../coverage";
import { define, defineTerm } from "../../glossary";
import { lookupFacts, shortSha, type ListingFacts } from "../../listing";
import type { ScanRecord, Score } from "../../schema";
import { COVERAGE_FLOOR_PROVISIONAL } from "../../scoring";
import {
  LANE_TITLE,
  LOCAL_RECORD_PUBLISHED,
  LOCAL_SIGNATURE_NAMESPACE,
  LOCAL_SIGNATURE_PUBLISHED,
  localOverlayCount,
  lookupLocalTrust,
  lookupTrust,
  resolveTrustKind,
  type TrustInfo,
  type TrustKind,
} from "../../trust";
import { directoryTermsNote } from "../home-shared";
import {
  listingShareUrl,
  LOCAL_METHODOLOGY_SHARE_URL,
  METHODOLOGY_SHARE_URL,
  shareUrl,
} from "../share-urls";
import {
  awaitingSentence,
  contradictionSentence,
  factSentences,
  selfReportSentence,
  staleSentence,
} from "../shared-facts";
import { exposurePanel } from "../threats-shared";
import { compactRules, gradeBadge, phaseRules, PHASE_NAMES, PHASE_SHORT } from "./components";
import { escapeHtml, page } from "./layout";
import type { DesignCtx } from "../types";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

/**
 * What P1…P6 mean, printed once under the KEY.
 *
 * The short names are the ones the front page's board already uses, so a
 * reader who learns the six there reads the same six here. The long names stay
 * on the repo sheet, which has the width for them.
 */
const PHASE_LEGEND = Object.entries(PHASE_SHORT)
  .map(([n, name]) => `<code>P${n}</code> ${escapeHtml(name.toLowerCase())}`)
  .join(' <span class="mn-sep">·</span> ');

/**
 * FILTERING TO ZERO MUST SAY SO, AND OFFER THE WAY BACK.
 *
 * Driven live at 390px: ticking "Coverage under 75% only" took the visible
 * rows from three to zero and no empty-state node existed in the DOM at any
 * point. The whole listing area went blank, and the only feedback was a 13px
 * count at the far end of a row the thumb had just covered — so the result
 * read as a page that broke rather than a filter that matched nothing, with no
 * reset except finding the same checkbox again.
 *
 * `filter.js` is shared and owns the rows; this does not reach into it. It
 * watches the two things that file's own documented contract guarantees — it
 * sets `display` on `table.directory tbody tr`, and it listens for `input` on
 * `#dir-filter` and `change` on `#dir-incomplete` — so the strip is toggled by
 * observing the rows, and "clear" is expressed by resetting those controls and
 * firing the events the shared script already handles. Nothing here can
 * disagree with the count it prints, because both read the same rows.
 */
const DIR_EMPTY_SCRIPT = `<script>
(function () {
  var note = document.getElementById("dir-empty");
  var tbody = document.querySelector("table.directory tbody");
  if (!note || !tbody) return;
  var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
  if (rows.length === 0) return;
  var search = document.getElementById("dir-filter");
  var only = document.getElementById("dir-incomplete");
  var clear = document.getElementById("dir-clear");
  function shown() {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].style.display !== "none") return true;
    }
    return false;
  }
  function sync() { note.hidden = shown(); }
  new MutationObserver(sync).observe(tbody, {
    attributes: true, attributeFilter: ["style"], subtree: true,
  });
  if (clear) {
    clear.addEventListener("click", function () {
      if (search) {
        search.value = "";
        search.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (only && only.checked) {
        only.checked = false;
        only.dispatchEvent(new Event("change", { bubbles: true }));
      }
      sync();
      if (search) search.focus();
    });
  }
  sync();
})();
</script>`;

export function repoSlugPath(r: ScanRecord): string {
  return `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
}

/**
 * The lane stamp, four states. The state comes from the shared resolver in
 * `trust.ts` — sidecar authoritative, URL heuristic only as a fallback — so no
 * design can mint a verified mark of its own. The local stamp is deliberately
 * the quiet one: dashed, unfilled, no accent. It is attributable evidence, and
 * it is weaker than the action lane.
 */
const LANE_CHIP: Readonly<Record<TrustKind, string>> = {
  verified: `<span class="lane lane-auth" title="${escapeHtml(LANE_TITLE.verified)}">CI · verified</span>`,
  "unsigned-action": `<span class="lane lane-unsigned" title="${escapeHtml(LANE_TITLE["unsigned-action"])}">CI · unsigned</span>`,
  local: `<span class="lane lane-local" title="${escapeHtml(LANE_TITLE.local)}">Local · signed</span>`,
  external: `<span class="lane lane-ext" title="${escapeHtml(LANE_TITLE.external)}">Outside-in</span>`,
};

function laneChip(kind: TrustKind): string {
  return LANE_CHIP[kind];
}

/** Secondary stamp: a signed local record filled class-C rows on this listing. */
function localOverlayChip(lt: TrustInfo | undefined): string {
  const n = localOverlayCount(lt);
  if (n === 0) return "";
  const title = `+${plural(n)} resolved by a local scan signed by ${
    lt?.signer ?? "an approved signer"
  }, verified against this repository's committed allowed_signers`;
  return `<span class="lane lane-local-overlay" title="${escapeHtml(title)}">+local ${n}</span>`;
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const prov = r.score.provisional ? ` · <em class="prov-flag">provisional</em>` : "";
  return `${overall} passed · coverage ${r.score.evidence_coverage_percent}%${prov}`;
}

/**
 * The row's coverage note, plus the anchor caveat when the documented one-line
 * fix would refuse here. Both come from `coverage.ts`, so every design says the
 * same true thing about what a maintainer actually has to run.
 */
function coverageNote(f: CoverageFacts): string {
  const body = coverageNoteBody(f);
  const caveat = anchorCaveat(f);
  return body && caveat
    ? `${body}<span class="cov-note cov-caveat">${escapeHtml(caveat)}</span>`
    : body;
}

function coverageNoteBody(f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor ? "NO LETTER" : "PROVISIONAL";
  if (f.state === "fixable-by-local") {
    return `<span class="cov-note"><span class="cov-tag">${head}</span>
    Coverage ${f.coverage}%. ${plural(f.localResolvable)} went unanswered because they
    describe a developer's machine, where no repository scan can look.
    One line settles them: <code>${LOCAL_SCAN_COMMAND}</code></span>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<span class="cov-note"><span class="cov-tag">${head}</span>
    Coverage ${f.coverage}%. <code>${LOCAL_SCAN_COMMAND}</code> settles ${plural(
      f.localResolvable,
    )} of them. That projects to ${f.projectedCoverage}%, still under the floor.</span>`;
  }
  if (f.state === "local-applied") {
    return `<span class="cov-note"><span class="cov-tag">${head}</span>
    Coverage ${f.coverage}%. A signed local scan already settled ${plural(
      f.resolvedByLocal,
    )}; ${plural(f.unverified)} still carry no verdict.</span>`;
  }
  return `<span class="cov-note"><span class="cov-tag">${head}</span>
  Coverage ${f.coverage}%. ${plural(f.unverified)} could not be answered by any lane
  available here.</span>`;
}

const pct = (v: number | null): string => (v === null ? "no evidence" : `${v}%`);

/**
 * The merge findings as one scannable mono line: the two commits that differ,
 * how many verdicts are held back, and the two scores side by side.
 *
 * Derived from the SAME `ListingFacts` fields the sentences are derived from,
 * never re-worded from them — this is an index to the fold below it, and the
 * fold carries `shared-facts.ts` verbatim.
 */
function mergeSummary(lf: ListingFacts, directory: Score): string {
  const bits: string[] = [];
  if (lf.staleAgainstBase) {
    bits.push(
      `local ${shortSha(lf.staleAgainstBase.local)} ≠ scan ${shortSha(
        lf.staleAgainstBase.base,
      )}`,
    );
  }
  if (lf.awaitingIndependent.length > 0) {
    bits.push(`${lf.awaitingIndependent.length} held for a second source`);
  }
  const s = lf.selfReported;
  if (s) {
    bits.push(
      `self-reported ${s.grade} ${pct(s.overall_percent)} vs DIRECTORY ${
        directory.grade
      } ${pct(directory.overall_percent)}`,
    );
  }
  return bits.map(escapeHtml).join(' <span class="mn-sep">·</span> ');
}

/**
 * What the evidence merge found, in this design's chrome. A design MUST render
 * these: a contradiction is scored as a gap, and a gap that does not say why is
 * a silent downgrade.
 *
 * A CONTRADICTION stays open, in full, on the hot rule — two verified sources
 * disagreed and the control was scored down for it, which is the one thing on
 * this page the reader cannot be asked to expand.
 *
 * The other three findings fold. Printed in full they were ~95 identical words
 * under every listing — measured: three rows, 812-884px each, roughly 40% of
 * the page at 13px — with the one fact that differs between them buried
 * mid-sentence, and they lit the hot rule on rows that had nothing wrong. The
 * summary line above the fold carries the differing facts; the sentences
 * inside are the shared ones, not a paraphrase.
 */
function factNotes(lf: ListingFacts, directory: Score): string {
  const contradiction = contradictionSentence(lf);
  const head = contradiction
    ? `<span class="cov-note cov-conflict">${escapeHtml(contradiction)}</span>`
    : "";
  const folded = [
    staleSentence(lf),
    awaitingSentence(lf),
    selfReportSentence(lf, directory),
  ].filter((s): s is string => s !== null);
  if (folded.length === 0) return head;
  return `${head}<details class="merge-note">
  <summary><span class="mn-tag">Merge</span><span class="vh"> — </span>${mergeSummary(
    lf,
    directory,
  )}</summary>
  ${folded.map((n) => `<p>${escapeHtml(n)}</p>`).join("\n  ")}
</details>`;
}

/** The same findings as a section on the detail sheet. */
function renderFactsSection(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return `<section class="panel panel-conflict" id="merge">
  <h2 class="panel-title">What the evidence merge found</h2>
  ${notes.map((n) => `<p class="body-copy">${escapeHtml(n)}</p>`).join("\n  ")}
  ${
    lf.contradictions.length
      ? `<p class="body-copy">Each contradicted control is listed below as a
  <strong>gap</strong>. Its row names the sources, and the verdict each one gave.</p>`
      : ""
  }
</section>`;
}

export function renderDirectory(records: ScanRecord[], ctx: DesignCtx): string {
  const sorted = [...records].sort((a, b) => {
    const g = (GRADE_ORDER[a.score.grade] ?? 9) - (GRADE_ORDER[b.score.grade] ?? 9);
    if (g !== 0) return g;
    return b.score.evidence_coverage_percent - a.score.evidence_coverage_percent;
  });
  const rows = sorted
    .map((r) => {
      const slug = `${r.repo.owner}/${r.repo.name}`;
      const lt = lookupLocalTrust(ctx.localTrust, r);
      const kind = resolveTrustKind(r, lookupTrust(ctx.trust, r), lt);
      const lf = lookupFacts(ctx.facts, r);
      const f = coverageFacts(r, localOverlayCount(lt));
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}" data-coverage="${r.score.evidence_coverage_percent}" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${f.belowFloor ? "0" : "1"}" data-contradictions="${lf.contradictions.length}">
  <td class="c-grade" data-label="Grade">${gradeBadge(r.score, "sm")}</td>
  <td class="c-repo" data-label="Repository"><a class="repo-name" href="${ctx.h(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      <span class="desc">${escapeHtml(r.repo.description)}</span>
      <span class="meta-line">${metaLine(r)}</span>
      ${coverageNote(f)}${factNotes(lf, r.score)}</td>
  <td class="c-phases" data-label="Phases">${compactRules(r.score)}</td>
  <td class="c-lane" data-label="Evidence source">${laneChip(kind)}${localOverlayChip(lt)}</td>
  <td class="c-date" data-label="Scanned">${escapeHtml(r.scanned_at.slice(0, 10))}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<section class="pagehead">
  <p class="kicker">The directory</p>
  <h1 class="banner banner-sm">Every scan on the record</h1>
  <p class="standfirst">Repositories scanned with sscsb, scored by the
  <a href="${ctx.h("methodology/")}">published methodology</a>. A person reviewed
  every listing before it appeared here.</p>
</section>
<div class="dir-controls">
  <label class="dir-filter-label" for="dir-filter">Search — or type owner/repo to ask for a scan</label>
  <input type="search" id="dir-filter"
    placeholder="owner/repo"
    aria-label="Search the directory, or submit a repository by typing owner/repo or a GitHub URL">
  <div id="dir-scan" hidden data-api="${escapeHtml(SCAN_API_URL)}" data-fallback="${escapeHtml(SUBMIT_URL)}">
    <p class="scan-copy"><span class="scan-eyebrow">No record</span>
    This repository is not in the directory yet. A scan can be run from outside,
    and a person reviews the result before it publishes.</p>
    <button type="button" class="btn" id="dir-scan-cta">Scan now</button>
    <p id="dir-scan-status" class="scan-status" aria-live="polite" hidden></p>
  </div>
  <div class="dir-sortbar">
    <label for="dir-sort">Sort</label>
    <select id="dir-sort">
      <option value="grade">grade, then coverage</option>
      <option value="coverage">evidence coverage</option>
      <option value="scanned">last scanned</option>
      <option value="name">name</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      Coverage under ${COVERAGE_FLOOR_PROVISIONAL}% only</label>
    <span id="dir-count" class="dir-count"></span>
  </div>
</div>
<div class="table-scroll table-scroll-dir">
<table class="directory">
  <thead><tr><th>Grade</th><th>Repository</th><th>Phases</th><th>Evidence source</th><th>Scanned</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>
<p class="dir-empty" id="dir-empty" hidden>
  <span class="dir-empty-copy">No listing matches that. Every repository on the board is
  shown when the search box is empty and the coverage filter is off.</span>
  <button type="button" class="dir-clear" id="dir-clear">Clear the filters</button>
</p>
<div class="key-row">
  <span class="key-label">Key</span>
  <span class="key-item"><span class="key-swatch key-pass"></span>pass</span>
  <span class="key-item"><span class="key-swatch key-fail"></span>fail / gap</span>
  <span class="key-item"><span class="key-swatch key-unv"></span>${defineTerm("unverified")}</span>
  <span class="key-item">${LANE_CHIP.local} a maintainer ran this on their own machine and
  signed it — the only evidence that can exist for the checks only they can see</span>
  <span class="key-item"><span class="lane lane-local-overlay">+local <em class="kv">n</em></span>
  <em class="kv">n</em> controls on that listing were settled by a maintainer's signed
  local scan</span>
</div>
<!-- Each card's six bars are labelled P1…P6 and their names lived only in a
     'title' attribute, which a phone cannot fire. The home board spells the
     same six out and the repo sheet spells them out in full, so this was the
     one surface that showed a reader codes with no key. -->
<p class="key-phases"><span class="kp-label">Phases</span>${PHASE_LEGEND}</p>
${directoryTermsNote(ctx.h)}
<script src="${ctx.h("filter.js")}" defer></script>
${DIR_EMPTY_SCRIPT}`;
  return page(ctx, { title: "Scan Directory", body });
}

const OUTCOME_LABEL: Readonly<Record<string, string>> = {
  pass: "Pass",
  fail: "Fail",
  gap: "Gap",
  unverified: "Unverified",
  info: "Info",
};

/** Prefilled new-issue link ON THE TARGET REPO suggesting the action. */
function nudgeIssueUrl(r: ScanRecord): string {
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
 * The coverage readout: what is missing, why, and the one-line fix — plus the
 * anchor caveat where that command would refuse. Facts from `coverage.ts`.
 */
function coveragePanel(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  const body = coveragePanelBody(r, f, ctx);
  const caveat = anchorCaveat(f);
  if (!body || !caveat) return body;
  return `${body}
<section class="nudge nudge-coverage"><p class="body-copy">${escapeHtml(caveat)}</p></section>`;
}

function coveragePanelBody(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter — insufficient evidence (${f.coverage}% coverage)`
    : "Why this grade is provisional";
  if (f.state === "fixable-by-local") {
    return `<section class="nudge nudge-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} carry no verdict.
  <strong>${plural(f.localResolvable)}</strong> of those describe a developer's own
  machine: commit signing, AI trailers, dependency gates. No repository scan can see
  them, so they are shown and never counted.</p>
  <p class="body-copy">${
    f.anchorReady === false
      ? "Two steps, in order — the anchor first, then the scan:"
      : "One line closes the gap:"
  }</p>
  <pre class="cov-cmd"><code>${escapeHtml(f.nudgeCommands.join("\n"))}</code></pre>
  <p class="body-copy">It scans locally, signs the record with the git signing key this
  repository already commits in <code>.sscsb/policy/allowed_signers</code>, and opens the
  submission. Those checks are the ones no repository scan can observe, so a signed local
  record is the only evidence that can exist for them
  (<a href="${ctx.h("methodology/#local")}">how it is scored</a>).</p>
  <div class="btn-row">
    <a class="btn" href="${escapeHtml(localNudgeIssueUrl(r, f))}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<section class="nudge nudge-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. <code>${LOCAL_SCAN_COMMAND}</code> resolves
  ${plural(f.localResolvable)} of the ${plural(f.unverified)} without a verdict. That
  projects to <strong>${f.projectedCoverage}%</strong>, still under the floor. The rest
  of the gap is in checks a repository scan can observe.</p>
</section>`;
  }
  if (f.state === "local-applied") {
    return `<section class="nudge nudge-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">A signed local scan already resolved ${plural(f.resolvedByLocal)}.
  Coverage is still <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor, with ${plural(f.unverified)} outside every
  denominator.</p>
</section>`;
  }
  return `<section class="nudge nudge-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} could not be verified by
  any lane available here. Shown, never counted.</p>
</section>`;
}

/** The local-lane provenance panel: exactly what the SSH signature proves. */
function localProvenance(
  r: ScanRecord,
  lt: TrustInfo,
  primary: boolean,
  ctx: DesignCtx,
): string {
  const recordHref = ctx.h(`${repoSlugPath(r)}${LOCAL_RECORD_PUBLISHED}`);
  const sigHref = ctx.h(`${repoSlugPath(r)}${LOCAL_SIGNATURE_PUBLISHED}`);
  const n = lt.resolved.length;
  const contribution = primary
    ? `<p class="body-copy">No repository-observable scan exists for this listing. Every
  control outside the local-environment class therefore stays <strong>unverified</strong>.
  A workstation record cannot speak for them.</p>`
    : `<p class="body-copy">It contributed <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class comes from the repository-observable record. A local scan never
  overturns one, and never widens the scope it is measured against.</p>`;
  return `<section class="nudge nudge-local">
  <h2 class="nudge-title">Local scan — signature verified</h2>
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
  more. It is <em>weaker</em> than an authenticated scan, which proves the repository's
  own CI produced the record.</p>
  ${contribution}
  <p class="body-copy">Re-verify it yourself: <a href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a> ·
  <a href="${sigHref}">detached signature</a></p>
  <pre class="cov-cmd"><code>ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
</section>`;
}

/** Provenance: which lane produced this record, and what it proves. */
function provenance(
  r: ScanRecord,
  t: TrustInfo | undefined,
  kind: TrustKind,
  ctx: DesignCtx,
  lt?: TrustInfo,
): string {
  if (kind === "local" && lt) return localProvenance(r, lt, true, ctx);
  if (kind === "verified" && t) {
    const recordHref = ctx.h(`${repoSlugPath(r)}scan-record.json`);
    const bundleHref = ctx.h(`${repoSlugPath(r)}scan-record.json.sigstore.json`);
    return `<section class="nudge nudge-verified">
  <h2 class="nudge-title">Authenticated scan — signature verified</h2>
  <p class="body-copy">Produced in the repository's <strong>own CI</strong> and
  keyless-signed there. Before listing it, the directory verified the Sigstore bundle
  against the certificate identity <code>${escapeHtml(t.identity ?? "")}</code>${
      t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
    }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""}.
  The repository, the workflow path and the default branch are burned into that
  certificate by GitHub's OIDC issuer. The record does not assert them.</p>
  <p class="body-copy">Re-verify it yourself: <a href="${recordHref}">scan-record.json</a> ·
  <a href="${bundleHref}">signature bundle</a></p>
</section>`;
  }
  if (kind === "unsigned-action") {
    return `<section class="nudge nudge-unsigned">
  <h2 class="nudge-title">Authenticated scan — unsigned</h2>
  <p class="body-copy">Submitted from the repository's own CI, but carrying <strong>no
  verified signature</strong>. The directory can only list it as an unverified claim.
  Granting the scan job <code>id-token: write</code> lets
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next record under
  the workflow's own identity. No secret is involved.</p>
</section>`;
  }
  return `<section class="nudge">
  <h2 class="nudge-title">Improve this score</h2>
  <p class="body-copy">This is an <strong>external</strong> scan. Controls that live in
  the development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Maintainers can publish an <strong>authenticated</strong> scan
  by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
  <div class="btn-row">
    <a class="btn" href="${ACTION_REPO_URL}#quickstart">Install the Action</a>
    <a class="btn-outline" href="${escapeHtml(nudgeIssueUrl(r))}">Suggest it to the maintainers</a>
  </div>
</section>`;
}

export function renderRepoDetail(r: ScanRecord, ctx: DesignCtx): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const t = lookupTrust(ctx.trust, r);
  const lt = lookupLocalTrust(ctx.localTrust, r);
  const kind = resolveTrustKind(r, t, lt);
  const facts = coverageFacts(r, localOverlayCount(lt));
  const passed =
    r.score.overall_percent === null ? "—" : `${r.score.overall_percent}%`;
  // Grouped into ruled phase bands rather than carrying a Phase column: the
  // column spent ~60px on a single digit in all 54 rows (about 3,200px of a
  // phone page), and a band names the phase once for every row under it —
  // which is what a results table has always done. The bands double as the
  // anchors the jump strip above the table uses.
  const byPhase = new Map<number, ScanRecord["controls"][number][]>();
  for (const c of r.controls) {
    const seen = byPhase.get(c.phase);
    if (seen) seen.push(c);
    else byPhase.set(c.phase, [c]);
  }
  // EVERY phase the taxonomy names, not only the ones this record has rows
  // for. The hero band renders all six from PHASE_NAMES — "Distribution &
  // publishing" included — while the table stopped at five and the jump strip
  // at P5, so a reader who counts six bands above and five below is reading a
  // contradiction the page never owns. An empty band says the true thing.
  const phaseNumbers = [
    ...new Set([...Object.keys(PHASE_NAMES).map(Number), ...byPhase.keys()]),
  ].sort((a, b) => a - b);
  const outOfScope = r.controls.filter((c) => !c.in_scope).length;

  /**
   * REPEATED RATIONALES BECOME FOOTNOTES.
   *
   * Four sentences covered 25 of this record's 44 rows, two of them three
   * lines at desk width and five on a phone — roughly a thousand pixels of
   * identical prose pushing each row's real signal apart. It is the same
   * "decorates where it should scan" defect the directory was cured of, left
   * standing on the page whose table is six times longer.
   *
   * Nothing is dropped. A rationale prints IN FULL, once, under the KEY above
   * the table; every row it covers keeps its own leading clause and a link to
   * the rest, and carries the whole sentence in `title` besides.
   *
   * The rule is structural rather than a match against particular wording: a
   * reason folds only when it appears more than once, runs past 60 characters,
   * and has a `:` or `;` whose head can stand as the row's line. A
   * contradiction names the commits that disagree, so it is unique to its row,
   * so this can never fold one.
   */
  const reasonCounts = new Map<string, number>();
  for (const c of r.controls) {
    if (c.reason) reasonCounts.set(c.reason, (reasonCounts.get(c.reason) ?? 0) + 1);
  }
  const reasonHead = (s: string): string | null => {
    const i = s.search(/[:;]/);
    if (i <= 0) return null;
    const head = s.slice(0, i).trim();
    return head.length > 0 && head.length <= 90 ? head : null;
  };
  const reasonNotes: string[] = [];
  const noteOf = new Map<string, number>();
  for (const [reason, n] of reasonCounts) {
    if (n < 2 || reason.length <= 60 || reasonHead(reason) === null) continue;
    noteOf.set(reason, reasonNotes.length + 1);
    reasonNotes.push(reason);
  }
  const notesBlock = reasonNotes.length
    ? `<ol class="rc-notes">
${reasonNotes
  .map(
    (n, i) =>
      `  <li id="rc-${i + 1}"><span class="rc-no">Note ${i + 1}</span>${escapeHtml(n)}</li>`,
  )
  .join("\n")}
</ol>`
    : "";

  const controlRow = (c: ScanRecord["controls"][number]): string => {
    const label = OUTCOME_LABEL[c.scan_outcome] ?? c.scan_outcome;
    // The raw verdict is CONTEXT on most rows and TENSION on a few. All 27 of
    // them wore the accent family — including 11 rows the design already greys
    // out as out-of-scope, and 6 where raw and final both say pass — which put
    // them above the ink-filled PASS chip beside them and inverted the
    // hierarchy. The accent now marks only a verdict that actually CHANGED
    // inside the scored scope; the rest are hairline.
    const rawChanged = c.in_scope && c.raw_outcome !== c.scan_outcome;
    const raw =
      c.reclassified || c.raw_outcome !== c.scan_outcome
        ? ` <span class="raw${
            rawChanged ? " raw-changed" : ""
          }" title="sscsb verify raw outcome">raw: ${escapeHtml(c.raw_outcome)}</span>`
        : "";
    const note = c.reason ? noteOf.get(c.reason) : undefined;
    const reason = !c.reason
      ? ""
      : note
        ? `<span class="reason">${escapeHtml(
            reasonHead(c.reason) ?? c.reason,
          )}<span class="rc-ell">…</span> <a class="rc-ref" href="#rc-${note}" title="${escapeHtml(
            c.reason,
          )}">note ${note}</a></span>`
        : `<span class="reason">${escapeHtml(c.reason)}</span>`;
    // The count goes in the label: "evidence" alone read as a dead word, and a
    // reader cannot tell how much is behind a disclosure that says nothing.
    const msgs = c.messages.length
      ? `<details><summary>evidence (${c.messages.length})</summary><ul>${c.messages
          .map((m) => `<li>${escapeHtml(m)}</li>`)
          .join("")}</ul></details>`
      : "";
    return `<tr class="oc-${escapeHtml(c.scan_outcome)}${c.in_scope ? "" : " out-of-scope"}">
  <td class="c-control" data-label="Control"><code>${escapeHtml(c.id)}</code>${
    c.in_scope ? "" : ' <span class="oos">out of scope</span>'
  }</td>
  <td class="c-verdict outcome" data-label="Verdict"><span class="oc-chip">${escapeHtml(label)}</span>${raw}</td>
  <td class="c-detail" data-label="Detail">${reason}${msgs}</td>
</tr>`;
  };
  const controlRows = phaseNumbers
    .map((p) => {
      const list = byPhase.get(p) ?? [];
      const band = `<tr class="ph-head${
        list.length === 0 ? " ph-empty" : ""
      }" id="phase-${p}"><td colspan="3">Phase ${p} — ${escapeHtml(
        PHASE_NAMES[p] ?? "",
      )}<span class="ph-count">${
        list.length === 0
          ? "no checks in this record"
          : escapeHtml(plural(list.length, "check"))
      }</span></td></tr>`;
      return [band, ...list.map(controlRow)].join("\n");
    })
    .join("\n");
  // THE STRIP IS THE ONLY NAVIGATION ON A 12,000px PAGE, so every reader gets
  // told what it is. The label was hidden below 760px to save width, which left
  // a bare row reading "P1 P2 P3 P4 P5 P6" above a table — six two-character
  // tokens a thumb reads as column headings, explained only by a `title`
  // attribute that touch never fires. The phone gets the short word instead of
  // no word: "Phase" is 44px where "Jump to phase" is 109px of a 358px strip
  // that also has to hold six 44px pills. Each pill also carries its phase name
  // as its accessible name, because "P3" is not one.
  const jump = (p: number) => {
    const name = PHASE_NAMES[p] ?? `Phase ${p}`;
    return `<a class="ctl-jump" href="#phase-${p}" title="${escapeHtml(
      name,
    )}" aria-label="Jump to phase ${p} — ${escapeHtml(name)}">P${p}</a>`;
  };
  const jumpStrip = `<input type="checkbox" id="ctl-hide-oos" class="ctl-toggle">
<div class="ctl-bar">
  <span class="ctl-bar-label"><span class="ctl-label-long">Jump to phase</span><span class="ctl-label-short">Phase</span></span>
  ${phaseNumbers.map(jump).join("\n  ")}
  ${
    outOfScope > 0
      ? `<label class="ctl-hide" for="ctl-hide-oos"><span class="ctl-box" aria-hidden="true"></span>Hide ${outOfScope} out-of-scope checks</label>`
      : ""
  }
  <a class="ctl-top" href="#content">&#8593; Top</a>
</div>`;
  const body = `
<nav class="crumbs"><a href="${ctx.h("directory/")}">← Directory</a></nav>
<section class="repo-hero">
  <div class="repo-hero-slab">${gradeBadge(r.score, "xl")}</div>
  <div class="repo-hero-copy">
    <h1 class="repo-title">${escapeHtml(slug)}</h1>
    <p class="repo-lane">${laneChip(kind)}${localOverlayChip(lt)}</p>
    <!-- The separators are the LAYOUT's, not the copy's. Joined with literal
         middots this line wrapped so that its last visual line opened with an
         orphaned "· scan run": a separator travels with the item that follows
         it. Each fact is its own box now and the middot is drawn on the TAIL
         of the box before it, so a wrap always leaves it at the end of a line.
         The stale-methodology flag sits after them all, on its own line at
         phone width, where it reads as a flag rather than as punctuation. -->
    <p class="repo-meta">
      <span class="rm-item rm-url"><a href="${escapeHtml(r.repo.url)}">${escapeHtml(
        r.repo.url,
      )}</a></span>
      <span class="rm-item">scanned ${escapeHtml(r.scanned_at.slice(0, 10))} at
      <code>${escapeHtml(r.repo.commit.slice(0, 12))}</code> on
      <code>${escapeHtml(r.repo.default_branch)}</code></span>
      <span class="rm-item">sscsb ${escapeHtml(r.scanner.sscsb_version)}</span>
      <span class="rm-item">methodology v${r.methodology_version}</span>
      <span class="rm-item"><a href="${escapeHtml(
        r.scanner.workflow_run_url,
      )}">scan run</a></span>${
        r.methodology_version < METHODOLOGY_VERSION
          ? `<a class="meta-stale" href="${ctx.h(
              "methodology/#changelog",
            )}" title="This record was scored before methodology v${METHODOLOGY_VERSION}"><span>scored before v${METHODOLOGY_VERSION}</span></a>`
          : ""
      }
    </p>
  </div>
</section>
<section class="detail-figs" aria-label="The two numbers on this listing">
  <div class="fig"><div class="fig-num">${escapeHtml(passed)}</div>
    <div class="fig-cap">of the answered checks passed</div></div>
  <div class="fig"><div class="fig-num">${r.score.evidence_coverage_percent}%</div>
    <div class="fig-cap">of the checks were answered at all</div></div>
</section>
${
  r.score.provisional
    ? `<p class="score-line"><em class="prov-flag">provisional</em> ${define("provisional")}</p>`
    : ""
}
<div class="detail-rules">${phaseRules(r.score.phases)}</div>
${exposurePanel(ctx.h, r)}
${provenance(r, t, kind, ctx, lt)}
${lt && kind !== "local" ? localProvenance(r, lt, false, ctx) : ""}
${renderFactsSection(lookupFacts(ctx.facts, r), r.score)}
${coveragePanel(r, facts, ctx)}
<h2 class="controls-title">All controls</h2>
<p class="transparency-note">Raw sscsb verdicts and every reclassification are shown.
Being transparent about what was and was not verifiable is the product. The checks run in
six phases, named on the band above each group.</p>
<div class="key-row">
  <span class="key-label">Key</span>
  <span class="key-item"><span class="key-swatch key-pass"></span>pass</span>
  <span class="key-item"><span class="key-swatch key-fail"></span>fail / gap</span>
  <span class="key-item"><span class="key-swatch key-unv"></span>${defineTerm("unverified")}</span>
</div>
${notesBlock}
${jumpStrip}
<div class="table-scroll table-scroll-controls">
<table class="controls">
  <thead><tr><th>Control</th><th>Verdict</th><th>Detail</th></tr></thead>
  <tbody>
${controlRows}
  </tbody>
</table>
</div>`;
  return page(ctx, { title: `${slug} — Scan`, body });
}
