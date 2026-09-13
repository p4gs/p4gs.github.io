/**
 * Factory directory — the listing table, and the per-repository sheet.
 *
 * Same grammar as the home page: a media-width frame, 8px diagram surfaces,
 * mono for ids and numerals, and the verdict hues doing the only colour-coding
 * anywhere. The wide tables sit in the scrollable wrap (§4.11) so a phone can
 * reach the far columns with a thumb and a keyboard can reach them with Tab.
 *
 * EVERY HONESTY RULE THE SITE PUBLISHES IS RENDERED HERE, and none of them is
 * this design's to reword:
 *   - the lane mark comes from `trust.ts`, so no design can mint a verified
 *     mark of its own, and the local mark reads WEAKER than the action lane;
 *   - a listing under the floor says WHICH checks are unanswered and what the
 *     one-line fix is, from `coverage.ts` — and says so in the words of the
 *     command that would actually run, including when that command would
 *     refuse;
 *   - a contradiction between evidence sources is named on the row AND on the
 *     sheet, from `shared-facts.ts`. Scoring a disagreement down while saying
 *     nothing about it is the silent downgrade this site exists to argue
 *     against;
 *   - `unverified` is a third state: hatched, named, and in no denominator.
 */
import { ACTION_REPO_URL, METHODOLOGY_VERSION, SCAN_API_URL, SUBMIT_URL } from "../../config";
import {
  ANCHOR_REGEN_COMMANDS,
  anchorCaveat,
  coverageFacts,
  LOCAL_SCAN_COMMAND,
  plural,
  type CoverageFacts,
} from "../../coverage";
import { define, defineTerm } from "../../glossary";
import { lookupFacts, shortSha, type ListingFacts } from "../../listing";
import { COVERAGE_FLOOR_NA, COVERAGE_FLOOR_PROVISIONAL, PHASE_NAMES } from "../../scoring";
import type { ControlRecord, PhaseScore, ScanRecord, Score } from "../../schema";
import {
  LANE_TITLE,
  localOverlayCount,
  LOCAL_RECORD_PUBLISHED,
  LOCAL_SIGNATURE_NAMESPACE,
  LOCAL_SIGNATURE_PUBLISHED,
  lookupLocalTrust,
  lookupTrust,
  resolveTrustKind,
  type TrustInfo,
  type TrustKind,
} from "../../trust";
import { directoryTermsNote } from "../home-shared";
import {
  awaitingSentence,
  contradictionSentence,
  factSentences,
  selfReportSentence,
  staleSentence,
} from "../shared-facts";
import { exposurePanel } from "../threats-shared";
import {
  LOCAL_METHODOLOGY_SHARE_URL,
  listingShareUrl,
  METHODOLOGY_SHARE_URL,
  shareUrl,
} from "../share-urls";
import type { DesignCtx } from "../types";
import { nestedDiagram, tableWrap } from "./components";
import { escapeHtml, page } from "./layout";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

const GRADE_SLUG: Readonly<Record<string, string>> = {
  "A+": "aplus", A: "a", B: "b", C: "c", D: "d", F: "f", NA: "na",
};

export function repoSlugPath(r: ScanRecord): string {
  return `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
}

/**
 * The grade, as a ring. Its accessible name spells the letter out, because
 * "A+" set in a 44px circle is an image to anything that cannot see it.
 */
function gradeChip(score: Score, extraClass = ""): string {
  const slug = GRADE_SLUG[score.grade] ?? "na";
  return `<span class="fy-grade fy-g-${slug} ${extraClass}" role="img"
    aria-label="grade ${escapeHtml(score.grade)}">${escapeHtml(score.grade)}</span>`;
}

/** The grade plus the tag that must travel with it wherever it is shown. */
function gradeWithTag(score: Score): string {
  return `${gradeChip(score)}${
    score.provisional
      ? `<span class="fy-prov" title="Evidence coverage below ${COVERAGE_FLOOR_PROVISIONAL}%">provisional</span>`
      : ""
  }`;
}

/**
 * The lane stamp, four states, from the shared resolver — so no design can
 * show a verified mark without a verified sidecar. The local stamp is
 * deliberately the quiet one: dashed, unfilled, no accent. It is attributable
 * evidence, and it is weaker than the action lane.
 */
const LANE_CHIP: Readonly<Record<TrustKind, string>> = {
  verified: `<span class="fy-lane fy-lane-auth" title="${escapeHtml(LANE_TITLE.verified)}">CI &middot; verified</span>`,
  "unsigned-action": `<span class="fy-lane fy-lane-unsigned" title="${escapeHtml(LANE_TITLE["unsigned-action"])}">CI &middot; unsigned</span>`,
  local: `<span class="fy-lane fy-lane-local" title="${escapeHtml(LANE_TITLE.local)}">Local &middot; signed</span>`,
  external: `<span class="fy-lane fy-lane-ext" title="${escapeHtml(LANE_TITLE.external)}">Outside-in</span>`,
};

function localOverlayChip(lt: TrustInfo | undefined): string {
  const n = localOverlayCount(lt);
  if (n === 0) return "";
  const title = `+${plural(n)} resolved by a local scan signed by ${
    lt?.signer ?? "an approved signer"
  }, verified against this repository's committed allowed_signers`;
  return `<span class="fy-lane fy-lane-overlay" title="${escapeHtml(title)}">+local ${n}</span>`;
}

/* ══ the coverage verdict ════════════════════════════════════════════════ */

/**
 * A number on its own is a measurement, not a verdict. The rule that turns
 * `coverage 67.7%` into a judgement lives on the methodology page; this puts
 * the judgement beside the number, every time, in both directions.
 */
function floorVerdict(f: CoverageFacts): { mark: string; over: boolean } {
  if (f.belowNaFloor) return { mark: `under the ${COVERAGE_FLOOR_NA}% floor`, over: false };
  if (f.belowFloor) return { mark: `under the ${COVERAGE_FLOOR_PROVISIONAL}% floor`, over: false };
  return { mark: `clears the ${COVERAGE_FLOOR_PROVISIONAL}% floor`, over: true };
}

function metaLine(r: ScanRecord, f: CoverageFacts): string {
  const overall = r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const v = floorVerdict(f);
  const mark = v.over
    ? ` &middot; <span class="fy-cov-mark fy-cov-over">${escapeHtml(v.mark)}</span>`
    : "";
  const prov = r.score.provisional ? ` &middot; <em>provisional</em>` : "";
  return `${overall} passed &middot; coverage ${r.score.evidence_coverage_percent}%${mark}${prov}`;
}

function coverageVerdictLine(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  const v = floorVerdict(f);
  const mark = `<span class="fy-cov-mark ${
    v.over ? "fy-cov-over" : "fy-cov-under"
  }">${escapeHtml(v.mark)}</span>`;
  if (v.over) {
    const letter = r.score.provisional ? "" : "The grade is not provisional. ";
    return `<p class="fy-cov-verdict">${mark}<span class="fy-cv-note">${escapeHtml(letter)}<a
    href="${ctx.h("methodology/#grades")}">How coverage is scored &rarr;</a></span></p>`;
  }
  const letter = f.belowNaFloor ? "There is no letter at all." : "The letter is provisional.";
  return `<p class="fy-cov-verdict">${mark}<span class="fy-cv-note">${escapeHtml(
    letter,
  )} ${escapeHtml(plural(f.unverified))} carry no verdict.
  <a href="#coverage">What is missing, and the fix &rarr;</a></span></p>`;
}

/** The row's coverage note, plus the caveat when the one-line fix would refuse. */
function coverageNote(f: CoverageFacts): string {
  const body = coverageNoteBody(f);
  const caveat = anchorCaveat(f);
  return body && caveat
    ? `${body}<span class="fy-cov-note">${escapeHtml(caveat)}</span>`
    : body;
}

function coverageNoteBody(f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor ? "NO LETTER" : "PROVISIONAL";
  const tag = `<span class="fy-cov-tag">${head}</span>`;
  if (f.state === "fixable-by-local") {
    return `<span class="fy-cov-note">${tag}
    Coverage ${f.coverage}%. ${plural(f.localResolvable)} went unanswered because they describe
    a developer's machine, where no repository scan can look. One line settles them:
    <code>${LOCAL_SCAN_COMMAND}</code></span>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<span class="fy-cov-note">${tag}
    Coverage ${f.coverage}%. <code>${LOCAL_SCAN_COMMAND}</code> settles ${plural(
      f.localResolvable,
    )} of them. That projects to ${f.projectedCoverage}%, still under the floor.</span>`;
  }
  if (f.state === "local-applied") {
    return `<span class="fy-cov-note">${tag}
    Coverage ${f.coverage}%. A signed local scan already settled ${plural(
      f.resolvedByLocal,
    )}; ${plural(f.unverified)} still carry no verdict.</span>`;
  }
  return `<span class="fy-cov-note">${tag}
  Coverage ${f.coverage}%. ${plural(f.unverified)} could not be answered by any lane
  available here.</span>`;
}

/* ══ what the evidence merge found ═══════════════════════════════════════ */

const pct = (v: number | null): string => (v === null ? "no evidence" : `${v}%`);

function mergeSummary(lf: ListingFacts, directory: Score): string {
  const bits: string[] = [];
  if (lf.staleAgainstBase) {
    bits.push(
      `local ${shortSha(lf.staleAgainstBase.local)} ≠ scan ${shortSha(lf.staleAgainstBase.base)}`,
    );
  }
  if (lf.awaitingIndependent.length > 0) {
    bits.push(`${lf.awaitingIndependent.length} held for a second source`);
  }
  const s = lf.selfReported;
  if (s) {
    bits.push(
      `self-reported ${s.grade} ${pct(s.overall_percent)} vs DIRECTORY ${directory.grade} ${pct(
        directory.overall_percent,
      )}`,
    );
  }
  return bits.map(escapeHtml).join(" &middot; ");
}

/**
 * A CONTRADICTION stays open, in full: two verified sources disagreed and the
 * control was scored down for it, which is the one thing on this row a reader
 * cannot be asked to expand. The other three findings fold, with the facts that
 * differ between listings carried in the summary above the fold.
 */
function factNotes(lf: ListingFacts, directory: Score): string {
  const contradiction = contradictionSentence(lf);
  const head = contradiction
    ? `<span class="fy-conflict">${escapeHtml(contradiction)}</span>`
    : "";
  const folded = [
    staleSentence(lf),
    awaitingSentence(lf),
    selfReportSentence(lf, directory),
  ].filter((s): s is string => s !== null);
  if (folded.length === 0) return head;
  return `${head}<details class="fy-merge">
  <summary><span class="fy-merge-tag">Merge</span>${mergeSummary(lf, directory)}</summary>
  ${folded.map((n) => `<p>${escapeHtml(n)}</p>`).join("\n  ")}
</details>`;
}

function factsSection(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return `<section class="fy-panel fy-panel-conflict" id="merge">
  <h2>What the evidence merge found</h2>
  ${notes.map((n) => `<p class="fy-body">${escapeHtml(n)}</p>`).join("\n  ")}
  ${
    lf.contradictions.length
      ? `<p class="fy-body">Each contradicted control is listed below as a <strong>gap</strong>.
  Its row names the sources, and the verdict each one gave.</p>`
      : ""
  }
</section>`;
}

/* ══ phase bars ══════════════════════════════════════════════════════════ */

function phaseLabel(p: PhaseScore): string {
  if (p.percent !== null) return `${p.percent}%`;
  const n = p.pass + p.fail + p.gap + p.unverified;
  return n === 0 ? "n/a" : "—";
}

/**
 * The three-state bar. The span is pass + fail + gap + unverified, so a bar can
 * read 100% beside a hatched stretch showing exactly what nobody could check —
 * which is the whole point of splitting the two numbers.
 */
function phaseBars(phases: readonly PhaseScore[]): string {
  const rows = phases
    .map((p) => {
      const name = PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`;
      const failGap = p.fail + p.gap;
      const total = p.pass + failGap + p.unverified;
      const aria = `${name}: ${phaseLabel(p)}${
        p.unverified > 0 ? ` (${p.unverified} unverified — not counted)` : ""
      }`;
      const w = (n: number) => ((100 * n) / total).toFixed(1);
      const seg = (cls: string, n: number, title: string) =>
        n === 0 ? "" : `<span class="${cls}" style="width:${w(n)}%" title="${title}: ${n}"></span>`;
      const track =
        total === 0
          ? `<span class="fy-phase-none">no checks in scope</span>`
          : `<span class="fy-phase-track">${seg("fy-seg-pass", p.pass, "pass")}${seg(
              "fy-seg-fail",
              failGap,
              "fail or gap",
            )}${seg("fy-seg-unv", p.unverified, "unverified")}</span>`;
      return `<span class="fy-phaserow" role="img" aria-label="${escapeHtml(aria)}">
      <span class="fy-phase-id" aria-hidden="true" title="${escapeHtml(name)}">P${p.phase}</span>
      ${track}
      <span class="fy-phase-pct" aria-hidden="true">${phaseLabel(p)}</span>
    </span>`;
    })
    .join("\n");
  return `<span class="fy-phasebar">\n${rows}\n</span>`;
}

/* ══ the directory ═══════════════════════════════════════════════════════ */

const DIR_EMPTY_SCRIPT = "";

export function renderDirectory(records: ScanRecord[], ctx: DesignCtx): string {
  const lowestCoverage =
    records.length === 0
      ? null
      : Math.min(...records.map((r) => r.score.evidence_coverage_percent));
  const noneBelowFloor =
    records.length > 0 &&
    records.every(
      (r) => !coverageFacts(r, localOverlayCount(lookupLocalTrust(ctx.localTrust, r))).belowFloor,
    );
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
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(
        r.score.grade,
      )}" data-lane="${kind}" data-coverage="${
        r.score.evidence_coverage_percent
      }" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${
        f.belowFloor ? "0" : "1"
      }" data-contradictions="${lf.contradictions.length}">
  <td data-label="Grade">${gradeWithTag(r.score)}</td>
  <td data-label="Repository">
    <a class="fy-repo-link" href="${ctx.h(repoSlugPath(r))}">${escapeHtml(slug)}</a>
    <span class="fy-desc">${escapeHtml(r.repo.description)}</span>
    <span class="fy-meta-line">${metaLine(r, f)}</span>
    ${coverageNote(f)}${factNotes(lf, r.score)}</td>
  <td data-label="Phases">${phaseBars(r.score.phases)}</td>
  <td data-label="Evidence source">${LANE_CHIP[kind]}${localOverlayChip(lt)}</td>
  <td data-label="Scanned">${escapeHtml(r.scanned_at.slice(0, 10))}</td>
</tr>`;
    })
    .join("\n");

  const table = `<table class="directory fy-table">
  <thead><tr><th>Grade</th><th>Repository</th><th>Phases</th><th>Evidence source</th><th>Scanned</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>`;

  const body = `<div class="fy-wrapper">
<section class="fy-pagehead">
  <p class="fy-kicker">The directory</p>
  <h1>Every scan on the record</h1>
  <p class="fy-pagehead-lead">Repositories scanned with sscsb, scored by the
  <a href="${ctx.h("methodology/")}">published methodology</a>. A person reviewed every
  listing before it appeared.</p>
</section>

<div class="fy-dir-controls">
  <label class="hp-search-label" for="dir-filter">Search — or type owner/repo to ask for a scan</label>
  <input type="search" id="dir-filter" class="hp-search-input" placeholder="owner/repo"
    aria-label="Search the directory, or submit a repository by typing owner/repo or a GitHub URL">
  <div id="dir-scan" class="dir-scan" hidden data-api="${escapeHtml(
    SCAN_API_URL,
  )}" data-fallback="${escapeHtml(SUBMIT_URL)}">
    <p class="dir-scan-copy">Not listed yet. A scan can be run from outside, and a person
    reviews the result before it publishes.</p>
    <button type="button" class="fy-btn" id="dir-scan-cta">Scan now</button>
    <p id="dir-scan-status" class="dir-scan-status" aria-live="polite" hidden></p>
  </div>
  <div class="fy-sortbar">
    <label for="dir-sort">Sort</label>
    <select id="dir-sort">
      <option value="grade">grade, then coverage</option>
      <option value="coverage">evidence coverage</option>
      <option value="scanned">last scanned</option>
      <option value="name">name</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      Coverage under ${COVERAGE_FLOOR_PROVISIONAL}% only</label>
    <span id="dir-count" class="fy-count"></span>
  </div>
</div>
</div>

<div class="fy-mediaframe">
${tableWrap(table, "The directory listing")}
</div>

<div class="fy-wrapper">
<p class="fy-empty" id="dir-empty" data-reason="match" hidden>
  <span class="dir-empty-copy">No listing matches that. Every repository is shown when the
  search box is empty and the filter is off.</span>
  ${
    noneBelowFloor
      ? `<span class="dir-empty-copy">No listing is under the ${COVERAGE_FLOOR_PROVISIONAL}%
  coverage floor. The lowest on the board is ${lowestCoverage}%.</span>`
      : ""
  }
  <button type="button" class="fy-clear" id="dir-clear">Clear the filters</button>
</p>
<p class="fy-key">
  <span class="fy-key-label">Key</span>
  <span><span class="fy-swatch fy-swatch-pass"></span>pass</span>
  <span><span class="fy-swatch fy-swatch-fail"></span>fail / gap</span>
  <span><span class="fy-swatch fy-swatch-unv"></span>${defineTerm("unverified")}</span>
  <span>${LANE_CHIP.local} a maintainer ran this on their own machine and signed it</span>
</p>
${directoryTermsNote(ctx.h)}
<script src="${ctx.h("filter.js")}" defer></script>
${DIR_EMPTY_SCRIPT}
</div>`;
  return page(ctx, { title: "Scan Directory", body });
}

/* ══ the repository sheet ════════════════════════════════════════════════ */

const OUTCOME_LABEL: Readonly<Record<string, string>> = {
  pass: "Pass", fail: "Fail", gap: "Gap", unverified: "Unverified", info: "Info",
};

/** Prefilled new-issue link ON THE TARGET REPO suggesting the Action. */
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

/** Prefilled new-issue link ON THE TARGET REPO asking for a signed local scan. */
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
      `It runs the scan locally, signs the record with the git signing key this repository already commits in .sscsb/policy/allowed_signers, and opens the submission. The directory verifies that signature against your own committed allowed_signers file before listing anything, and your record is then merged with every other evidence source we hold: where they agree that verdict stands, where they disagree the control is scored as a gap, and where a repository scan could observe a control your self-report waits for an independent record to agree with it.`,
      ``,
      `Methodology: ${LOCAL_METHODOLOGY_SHARE_URL}`,
    ].join("\n"),
  );
  return `${r.repo.url}/issues/new?title=${title}&body=${body}`;
}

function coveragePanel(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  const body = coveragePanelBody(r, f, ctx);
  const caveat = anchorCaveat(f);
  if (!body || !caveat) return body;
  return `${body}
<section class="fy-panel"><p class="fy-body">${escapeHtml(caveat)}</p></section>`;
}

function coveragePanelBody(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter — insufficient evidence (${f.coverage}% coverage)`
    : "Why this grade is provisional";
  const open = `<section class="fy-panel" id="coverage">
  <h2>${escapeHtml(head)}</h2>`;
  if (f.state === "fixable-by-local") {
    return `${open}
  <p class="fy-body">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} carry no verdict.
  <strong>${plural(f.localResolvable)}</strong> of those describe a developer's own machine:
  commit signing, AI trailers, dependency gates. No repository scan can see them, so they
  are shown and never counted.</p>
  <p class="fy-body">${
    f.anchorReady === false
      ? "Two steps, in order — the anchor first, then the scan:"
      : "One line closes the gap:"
  }</p>
  <pre class="fy-cmd"><code>${escapeHtml(f.nudgeCommands.join("\n"))}</code></pre>
  <p class="fy-body">It scans locally, signs the record with the git signing key this
  repository already commits in <code>.sscsb/policy/allowed_signers</code>, and opens the
  submission. Those checks are the ones no repository scan can observe
  (<a href="${ctx.h("methodology/#local")}">how it is scored</a>).</p>
  <div class="fy-btnrow">
    <a class="fy-btn" href="${escapeHtml(
      localNudgeIssueUrl(r, f),
    )}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `${open}
  <p class="fy-body">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. <code>${LOCAL_SCAN_COMMAND}</code> resolves
  ${plural(f.localResolvable)} of the ${plural(f.unverified)} without a verdict. That projects
  to <strong>${f.projectedCoverage}%</strong>, still under the floor.</p>
  <div class="fy-btnrow">
    <a class="fy-btn" href="${escapeHtml(
      localNudgeIssueUrl(r, f),
    )}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "local-applied") {
    return `${open}
  <p class="fy-body">A signed local scan already resolved ${plural(f.resolvedByLocal)}. Coverage
  is still <strong>${f.coverage}%</strong>, under the ${COVERAGE_FLOOR_PROVISIONAL}% floor,
  with ${plural(f.unverified)} outside every denominator.</p>
</section>`;
  }
  return `${open}
  <p class="fy-body">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} could not be verified by any
  lane available here. Shown, never counted.</p>
</section>`;
}

/** What a verified SSH signature on a maintainer's record does and does not prove. */
function localProvenance(r: ScanRecord, lt: TrustInfo, primary: boolean, ctx: DesignCtx): string {
  const recordHref = ctx.h(`${repoSlugPath(r)}${LOCAL_RECORD_PUBLISHED}`);
  const sigHref = ctx.h(`${repoSlugPath(r)}${LOCAL_SIGNATURE_PUBLISHED}`);
  const n = lt.resolved.length;
  const contribution = primary
    ? `<p class="fy-body">No repository-observable scan exists for this listing. Every control
  outside the local-environment class therefore stays <strong>unverified</strong>. A
  workstation record cannot speak for them.</p>`
    : `<p class="fy-body">It contributed <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class comes from the repository-observable record. A local scan never
  overturns one, and never widens the scope it is measured against.</p>`;
  return `<section class="fy-panel">
  <h2>Local scan — signature verified</h2>
  <p class="fy-body">A maintainer ran sscsb on their own machine and signed the record with
  their git signing key. The directory verified that detached SSH signature with
  <code>ssh-keygen -Y verify</code> against <code>.sscsb/policy/allowed_signers</code>
  <strong>fetched from this repository</strong> at commit
  <code>${escapeHtml((lt.commit ?? "").slice(0, 12))}</code> — committed content the submitter
  does not supply. Verifying principal <code>${escapeHtml(lt.signer ?? "")}</code>${
    lt.key_fingerprint ? ` (<code>${escapeHtml(lt.key_fingerprint)}</code>)` : ""
  }${lt.verified_at ? ` on ${escapeHtml(lt.verified_at.slice(0, 10))}` : ""}.</p>
  <p class="fy-body"><strong>What that proves, exactly:</strong> a holder of a key this
  repository commits as an approved signer asserts this result at that commit. Nothing more.
  It is <em>weaker</em> than an authenticated scan, which proves the repository's own CI
  produced the record.</p>
  ${contribution}
  <p class="fy-body">Re-verify it yourself:
  <a href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a> &middot;
  <a href="${sigHref}">detached signature</a></p>
  <pre class="fy-cmd"><code>ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
</section>`;
}

/** Which lane produced this record, and what that lane proves. */
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
    return `<section class="fy-panel">
  <h2>Authenticated scan — signature verified</h2>
  <p class="fy-body">Produced in the repository's <strong>own CI</strong> and keyless-signed
  there. Before listing it, the directory verified the Sigstore bundle against the certificate
  identity <code>${escapeHtml(t.identity ?? "")}</code>${
    t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""}. The repository, the
  workflow path and the default branch are burned into that certificate by GitHub's OIDC
  issuer. The record does not assert them.</p>
  <p class="fy-body">Re-verify it yourself: <a href="${recordHref}">scan-record.json</a> &middot;
  <a href="${bundleHref}">signature bundle</a></p>
</section>`;
  }
  if (kind === "unsigned-action") {
    return `<section class="fy-panel">
  <h2>Authenticated scan — unsigned</h2>
  <p class="fy-body">Submitted from the repository's own CI, but carrying <strong>no verified
  signature</strong>. The directory can only list it as an unverified claim. Granting the scan
  job <code>id-token: write</code> lets
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next record under the
  workflow's own identity. No secret is involved.</p>
</section>`;
  }
  return `<section class="fy-panel">
  <h2>Improve this score</h2>
  <p class="fy-body">This is an <strong>external</strong> scan. Controls that live in the
  development environment show as unverified, and GitHub-side checks ran with public-only
  visibility. Maintainers can publish an <strong>authenticated</strong> scan by running the
  <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
  <div class="fy-btnrow">
    <a class="fy-btn" href="${ACTION_REPO_URL}#quickstart">Install the Action</a>
    <a class="fy-btn-outline" href="${escapeHtml(
      nudgeIssueUrl(r),
    )}">Suggest it to the maintainers</a>
  </div>
</section>`;
}

export function renderRepoDetail(r: ScanRecord, ctx: DesignCtx): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const t = lookupTrust(ctx.trust, r);
  const lt = lookupLocalTrust(ctx.localTrust, r);
  const kind = resolveTrustKind(r, t, lt);
  const facts = coverageFacts(r, localOverlayCount(lt));
  const passed = r.score.overall_percent === null ? "—" : `${r.score.overall_percent}%`;
  const verdicts = new Map<string, ControlRecord>(r.controls.map((c) => [c.id, c]));

  const byPhase = new Map<number, ControlRecord[]>();
  for (const c of r.controls) {
    const seen = byPhase.get(c.phase);
    if (seen) seen.push(c);
    else byPhase.set(c.phase, [c]);
  }
  // EVERY phase the taxonomy names, not only the ones this record holds rows
  // for. A reader who counts six bands in the diagram above and five in the
  // table below is reading a contradiction the page never owns.
  const phaseNumbers = [
    ...new Set([...Object.keys(PHASE_NAMES).map(Number), ...byPhase.keys()]),
  ].sort((a, b) => a - b);
  const outOfScope = r.controls.filter((c) => !c.in_scope).length;

  const controlRow = (c: ControlRecord): string => {
    const label = OUTCOME_LABEL[c.scan_outcome] ?? c.scan_outcome;
    const raw =
      c.reclassified || c.raw_outcome !== c.scan_outcome
        ? ` <span class="fy-raw" title="sscsb verify raw outcome">raw: ${escapeHtml(
            c.raw_outcome,
          )}</span>`
        : "";
    const reason = c.reason ? `<span class="fy-reason">${escapeHtml(c.reason)}</span>` : "";
    const msgs = c.messages.length
      ? `<details><summary>evidence (${c.messages.length})</summary><ul>${c.messages
          .map((m) => `<li>${escapeHtml(m)}</li>`)
          .join("")}</ul></details>`
      : "";
    return `<tr class="${c.in_scope ? "" : "fy-row-oos"}">
  <td data-label="Control"><code>${escapeHtml(c.id)}</code>${
    c.in_scope ? "" : ' <span class="fy-oos">out of scope</span>'
  }</td>
  <td data-label="Verdict"><span class="fy-outcome fy-oc-${escapeHtml(
    c.scan_outcome,
  )}">${escapeHtml(label)}</span>${raw}</td>
  <td data-label="Detail">${reason}${msgs}</td>
</tr>`;
  };

  const controlRows = phaseNumbers
    .map((p) => {
      const list = byPhase.get(p) ?? [];
      const band = `<tr class="fy-phaseband" id="phase-${p}"><td colspan="3">Phase ${p} — ${escapeHtml(
        PHASE_NAMES[p] ?? "",
      )}<span class="fy-ph-count">${
        list.length === 0 ? "no checks in this record" : escapeHtml(plural(list.length, "check"))
      }</span></td></tr>`;
      return [band, ...list.map(controlRow)].join("\n");
    })
    .join("\n");

  const controlsTable = `<table class="fy-table controls">
  <thead><tr><th>Control</th><th>Verdict</th><th>Detail</th></tr></thead>
  <tbody>
${controlRows}
  </tbody>
</table>`;

  const jump = phaseNumbers
    .map((p) => {
      const name = PHASE_NAMES[p] ?? `Phase ${p}`;
      return `<a href="#phase-${p}" title="${escapeHtml(
        name,
      )}" aria-label="Jump to phase ${p} — ${escapeHtml(name)}">P${p}</a>`;
    })
    .join("\n  ");

  const body = `<div class="fy-wrapper">
<nav class="fy-crumbs" aria-label="Breadcrumb"><a href="${ctx.h(
    "directory/",
  )}">&larr; Directory</a></nav>

<section class="fy-repo-hero">
  ${gradeWithTag(r.score)}
  <div style="flex:1 1 320px;min-width:0">
    <h1 class="fy-repo-title">${escapeHtml(slug)}</h1>
    <p style="margin-top:12px">${LANE_CHIP[kind]}${localOverlayChip(lt)}</p>
    <p class="fy-repo-meta">
      <span class="fy-rm fy-rm-url"><a href="${escapeHtml(r.repo.url)}">${escapeHtml(
        r.repo.url,
      )}</a></span>
      <span class="fy-rm">scanned ${escapeHtml(r.scanned_at.slice(0, 10))} at
      <code>${escapeHtml(r.repo.commit.slice(0, 12))}</code> on
      <code>${escapeHtml(r.repo.default_branch)}</code></span>
      <span class="fy-rm">sscsb ${escapeHtml(r.scanner.sscsb_version)}</span>
      <span class="fy-rm">methodology v${r.methodology_version}</span>
      <span class="fy-rm"><a href="${escapeHtml(
        r.scanner.workflow_run_url,
      )}">scan run</a></span>${
        r.methodology_version < METHODOLOGY_VERSION
          ? `<a class="fy-stale" href="${ctx.h(
              "methodology/#changelog",
            )}" title="Scored before methodology v${METHODOLOGY_VERSION}">scored before v${METHODOLOGY_VERSION}</a>`
          : ""
      }
    </p>
  </div>
</section>

<section class="fy-figs" aria-label="The two numbers on this listing">
  <div>
    <p class="fy-fig-num">${escapeHtml(passed)}</p>
    <p class="fy-fig-cap">of the answered checks passed</p>
  </div>
  <div>
    <p class="fy-fig-num">${r.score.evidence_coverage_percent}%</p>
    <p class="fy-fig-cap">of the checks were answered at all</p>
    ${coverageVerdictLine(r, facts, ctx)}
  </div>
</section>
${
  r.score.provisional
    ? `<p class="fy-note"><em>provisional</em> ${define("provisional")}</p>`
    : ""
}
<div style="padding-block:16px 40px">${phaseBars(r.score.phases)}</div>
</div>

<div class="fy-mediaframe">
${nestedDiagram({
  scope: "sheet",
  href: ctx.h("methodology/#every-check"),
  title: "What this scan checked",
  titleTip:
    "The standard set, grouped by phase. Each chip carries this listing's verdict; a chip with no verdict is a check this record holds no row for.",
  verdicts,
})}
</div>

<div class="fy-wrapper">
${exposurePanel(ctx.h, r)}
${provenance(r, t, kind, ctx, lt)}
${lt && kind !== "local" ? localProvenance(r, lt, false, ctx) : ""}
${factsSection(lookupFacts(ctx.facts, r), r.score)}
${coveragePanel(r, facts, ctx)}

<section class="fy-section">
  <h2>All controls</h2>
  <p class="fy-body">Raw sscsb verdicts and every reclassification are shown. Being
  transparent about what was and was not verifiable is the product. The checks run in
  ${phaseNumbers.length} phases, named on the band above each group.</p>
  <p class="fy-key">
    <span class="fy-key-label">Key</span>
    <span><span class="fy-swatch fy-swatch-pass"></span>pass</span>
    <span><span class="fy-swatch fy-swatch-fail"></span>fail / gap</span>
    <span><span class="fy-swatch fy-swatch-unv"></span>${defineTerm("unverified")}</span>
  </p>
  <p class="fy-ctl-bar"><span class="fy-key-label">Jump to phase</span>
  ${jump}
  ${outOfScope > 0 ? `<span>${outOfScope} out-of-scope checks are greyed.</span>` : ""}
  </p>
</section>
</div>

<div class="fy-mediaframe">
${tableWrap(controlsTable, `Every control on ${slug}`)}
</div>`;
  return page(ctx, { title: `${slug} — Scan`, body });
}
