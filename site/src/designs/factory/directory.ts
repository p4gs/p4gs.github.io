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
import { define } from "../../glossary";
import { CONTROL_COUNT, CONTROL_REGISTRY } from "../../reclassify";
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
import {
  ABSENT,
  allControlIds,
  chapterNav,
  nestedDiagram,
  sepList,
  tableWrap,
  VERDICT_WORD,
  verdictKey,
  type Chapter,
} from "./components";
import { escapeHtml, page } from "./layout";

/**
 * The two secondary pages carry the same pill nav as home and methodology.
 *
 * They did not, and the measurement pass caught it: `nav.fy-chapters` returned
 * null on both, so a reader who learned the navigation on the home page lost it
 * the moment they opened a listing — on the longest page the site serves, where
 * the controls table alone runs to 54 rows. Both lists are fixed rather than
 * derived because both pages render exactly these sections, unconditionally;
 * every conditional panel on the sheet (#merge, #coverage) is reachable from
 * the section above it and would make a pill that sometimes points at nothing.
 */
const DIRECTORY_CHAPTERS: readonly Chapter[] = [
  { id: "directory-search", no: "01", label: "Search" },
  { id: "directory-listings", no: "02", label: "Listings" },
  { id: "directory-key", no: "03", label: "The columns" },
];

const SHEET_CHAPTERS: readonly Chapter[] = [
  { id: "sheet-record", no: "01", label: "The record" },
  { id: "sheet-phases", no: "02", label: "Phases" },
  { id: "sheet-diagram", no: "03", label: "What ran" },
  { id: "exposure", no: "04", label: "Defences" },
  { id: "sheet-lane", no: "05", label: "Who ran it" },
  { id: "sheet-controls", no: "06", label: "All checks" },
];

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
      ? `<span class="fy-prov">provisional</span>`
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
  verified: `<span class="fy-lane fy-lane-auth">CI &middot; verified</span>`,
  "unsigned-action": `<span class="fy-lane fy-lane-unsigned">CI &middot; unsigned</span>`,
  local: `<span class="fy-lane fy-lane-local">Local &middot; signed</span>`,
  external: `<span class="fy-lane fy-lane-ext">Outside-in</span>`,
};

/**
 * What each of those four chips means, on the page rather than on hover.
 *
 * The sentences are `trust.ts`'s own — including the one that says the local
 * lane is WEAKER than the action lane, which is the single most important
 * qualifier the directory carries and which lived in a `title` attribute no
 * touch reader has ever seen.
 */
const LANE_ORDER: readonly TrustKind[] = ["verified", "unsigned-action", "local", "external"];

/**
 * The gloss on `no answer`, in Factory's own words.
 *
 * The shared glossary says `unverified — nobody could answer this check`, which
 * is the identical construction the hero was corrected away from, and it is false
 * on a sheet where eight of those checks were answered by the maintainer on their
 * own machine with the signature verified two sections below. The shared entry
 * still feeds the other five designs; overriding the wording here is what this
 * design can do without editing a shared module.
 */
const UNVERIFIED_GLOSS =
  "<strong>no answer</strong> &mdash; no lane available here could answer it, which is not the " +
  "same as failing it.";

/** The shared glossary's wording for the same state, verbatim. */
const SHARED_UNVERIFIED_GLOSS = "nobody could answer this check";
const FACTORY_UNVERIFIED_GLOSS = "no lane available here could answer it";

/**
 * The same override, applied to a SHARED block Factory renders whole.
 *
 * `directoryTermsNote` is `home-shared.ts`'s, and it carries the glossary's
 * plain gloss inside a sentence this design has no other way to reach. Rewriting
 * the shared module would change the other five designs; rewriting the OUTPUT is
 * the shape `heroSearch` already uses for the same class of problem — and it
 * fails loudly rather than silently shipping the sentence if the shared copy
 * moves under it.
 */
function withFactoryGloss(html: string, where: string): string {
  if (!html.includes(SHARED_UNVERIFIED_GLOSS)) {
    throw new Error(`factory: ${where} no longer carries the shared unverified gloss`);
  }
  return html.replaceAll(SHARED_UNVERIFIED_GLOSS, FACTORY_UNVERIFIED_GLOSS);
}

/**
 * P1–P6 against the names they stand for.
 *
 * The directory is the one page that prints the phase bars WITHOUT printing the
 * phase names: the names lived in a `title`, which never renders at all on a
 * touch device, so a phone reader met six bars, no names and no hover.
 */
function phaseKeyLine(): string {
  const items = Object.keys(PHASE_NAMES)
    .map(Number)
    .sort((a, b) => a - b)
    .map(
      (p) =>
        `  <span class="fy-phase-name"><span class="fy-phase-id">P${p}</span>${escapeHtml(
          PHASE_NAMES[p] ?? "",
        )}</span>`,
    )
    .join("\n");
  return `<p class="fy-key fy-phase-names">
  <span class="fy-key-label">Phases</span>
${items}
</p>`;
}

function laneKey(): string {
  const rows = LANE_ORDER.map(
    (k) => `  <span class="fy-lane-row">${LANE_CHIP[k]}<span>${escapeHtml(
      LANE_TITLE[k],
    )}</span></span>`,
  ).join("\n");
  return `<section class="fy-lane-key" aria-label="What each evidence source means">
  <p class="fy-key-label">Evidence source</p>
${rows}
</section>`;
}

/**
 * The local overlay badge — as words, and as a link to the rows it names.
 *
 * `+local 6` was uncountable: six WHAT, resolved by whom, and which six? The
 * number was right and the sentence that explained it lived in a `title`.
 */
function localOverlayChip(lt: TrustInfo | undefined, href?: string): string {
  const n = localOverlayCount(lt);
  if (n === 0) return "";
  const label = `+${n} from a local signed record`;
  return href
    ? `<a class="fy-lane fy-lane-overlay fy-hit-pill" href="${href}">${escapeHtml(label)}</a>`
    : `<span class="fy-lane fy-lane-overlay fy-hit-pill">${escapeHtml(label)}</span>`;
}

/**
 * The contradiction badge, in the words D4 settles on — never "MERGE", never
 * "≠", which are internal notation a reader has no way to decode.
 */
/**
 * The stale-commit sentence, shared by the sheet's badge and the directory row.
 *
 * The row printed `self-reported A+ 100% vs this listing A+ 100%` for the same
 * fact — "vs" between two equal values still reads as a grade dispute, and the
 * sheet had already resolved it as "Both score A+."
 */
export function staleCommitSentence(lf: ListingFacts, score: Score): string {
  if (!lf.staleAgainstBase) return "";
  const self = lf.selfReported;
  const both = self && self.grade === score.grade ? ` Both score ${score.grade}.` : "";
  return `DIFFERENT COMMIT — the maintainer's local record describes ${shortSha(
    lf.staleAgainstBase.local,
  )}, this listing scans ${shortSha(lf.staleAgainstBase.base)}.${both}`;
}

/**
 * BOTH BADGES WHEN BOTH ARE TRUE. This returned on `staleAgainstBase` before it
 * ever tested `contradictions`, so a listing carrying both showed the commit
 * mismatch and swallowed the contradiction — which `types.ts` requires on the
 * sheet, and which is the more serious of the two.
 */
function conflictBadge(lf: ListingFacts, score: Score, href: string): string {
  const out: string[] = [];
  if (lf.staleAgainstBase) {
    out.push(
      `<a class="fy-badge-conflict" href="${href}">${escapeHtml(
        staleCommitSentence(lf, score),
      )}</a>`,
    );
  }
  if (lf.contradictions.length > 0) {
    out.push(`<a class="fy-badge-conflict" href="${href}">SOURCES DISAGREE &mdash;
    ${escapeHtml(plural(lf.contradictions.length))} scored a gap because two records answered
    them differently.</a>`);
  }
  return out.join("\n    ");
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

/** How many rows this record holds for each phase — 0 is a fact, not a blank. */
function rowsPerPhase(r: ScanRecord): Map<number, number> {
  const out = new Map<number, number>();
  for (const p of Object.keys(PHASE_NAMES).map(Number)) out.set(p, 0);
  for (const c of r.controls) out.set(c.phase, (out.get(c.phase) ?? 0) + 1);
  return out;
}

/** The registry controls this record holds no row for at all. */
function absentIds(r: ScanRecord): string[] {
  const held = new Set(r.controls.map((c) => c.id));
  return allControlIds().filter((id) => !held.has(id));
}

function metaLine(r: ScanRecord, f: CoverageFacts): string {
  const overall = r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const v = floorVerdict(f);
  // No separator baked into the item: sepList owns every one on this line, and
  // a hand-written leading middot here is one the wrap can strand.
  const mark = v.over
    ? `<span class="fy-cov-mark fy-cov-over">${escapeHtml(v.mark)}</span>`
    : "";
  const prov = r.score.provisional ? `<em>provisional</em>` : "";
  // A PERCENTAGE WITH NO DENOMINATOR ON THE PAGE. The directory is the one place
  // the number appeared with nothing to read it against; a reader who has just
  // been told "54 checks" reads 90.9% against 54.
  const scoped = r.controls.filter((c) => c.in_scope).length;
  const answered = r.controls.filter(
    (c) =>
      c.in_scope &&
      (c.scan_outcome === "pass" || c.scan_outcome === "fail" || c.scan_outcome === "gap"),
  ).length;
  return sepList([
    `${overall} passed`,
    `coverage ${r.score.evidence_coverage_percent}%`,
    `${answered} of ${scoped} in scope`,
    mark,
    prov,
  ]);
}

function coverageVerdictLine(
  r: ScanRecord,
  f: CoverageFacts,
  ctx: DesignCtx,
  lf?: ListingFacts,
): string {
  const v = floorVerdict(f);
  const mark = `<span class="fy-cov-mark ${
    v.over ? "fy-cov-over" : "fy-cov-under"
  }">${escapeHtml(v.mark)}</span>`;
  if (v.over) {
    // "The grade is not provisional" is true about COVERAGE and says nothing
    // about whether the sources agreed. Where they did not, it is qualified in
    // the same breath rather than left to stand alone above a panel seven
    // sections down that contradicts the impression it leaves.
    const conflicted = !!lf && (lf.contradictions.length > 0 || lf.staleAgainstBase !== null);
    const letter = r.score.provisional
      ? ""
      : conflicted
        ? "The grade is not provisional — but the evidence sources did not agree. "
        : "The grade is not provisional. ";
    return `<p class="fy-cov-verdict">${mark}<span class="fy-cv-note">${escapeHtml(letter)}${
      conflicted ? `<a href="#merge">What the merge found&nbsp;&rarr;</a> &middot; ` : ""
    }<a
    href="${ctx.h("methodology/#grades")}">How coverage is scored&nbsp;&rarr;</a></span></p>`;
  }
  const letter = f.belowNaFloor ? "There is no letter at all." : "The letter is provisional.";
  return `<p class="fy-cov-verdict">${mark}<span class="fy-cv-note">${escapeHtml(
    letter,
  )} ${escapeHtml(plural(f.unverified))} carry no verdict.
  <a href="#coverage">What is missing, and the fix&nbsp;&rarr;</a></span></p>`;
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
    // Never "≠". It is a mathematician's symbol standing in for the most
    // interesting fact this listing holds, on a page read by people who came
    // to find out whether a repository is worth trusting.
    bits.push(
      `local record at ${shortSha(lf.staleAgainstBase.local)}, this scan at ${shortSha(
        lf.staleAgainstBase.base,
      )}`,
    );
  }
  if (lf.awaitingIndependent.length > 0) {
    bits.push(`${lf.awaitingIndependent.length} held for a second source`);
  }
  const s = lf.selfReported;
  if (s) {
    // NEVER "vs" BETWEEN TWO EQUAL VALUES. It reads as a grade dispute where
    // there is none — and the sheet already resolves the same pair as
    // "Both score A+."
    bits.push(
      s.grade === directory.grade && s.overall_percent === directory.overall_percent
        ? `both score ${s.grade} ${pct(s.overall_percent)}`
        : `self-reported ${s.grade} ${pct(s.overall_percent)}, this listing ${
            directory.grade
          } ${pct(directory.overall_percent)}`,
    );
  }
  return sepList(bits.map(escapeHtml));
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
  const tag = lf.staleAgainstBase ? "Different commit" : "What the sources said";
  return `${head}<details class="fy-merge">
  <summary><span class="fy-merge-tag">${tag}</span>${mergeSummary(lf, directory)}</summary>
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
 * The phase bars — and the two numbers they hold are kept apart.
 *
 * WHAT THIS USED TO DO, AND WHY IT WAS THE WORST THING ON THE PAGE. The track
 * spanned pass + fail + gap + unverified, so a phase with five answered checks
 * and two nobody could answer drew a green bar filled to 71.4 % with a hatched
 * remainder — and printed **100%** at the end of it. A sighted reader had no
 * legend, no count and no label for the hatch: they either read the bar as a
 * proportion and concluded the number was inflated, or read the number and
 * concluded the bar meant nothing. And the hatch WAS the unanswered set, drawn
 * as the empty tail of a pass-green progress bar — the visual grammar of
 * shortfall, which is precisely the third state rendered as a deficit that
 * `threats.ts` forbids. The sentence that explained it existed, written well,
 * in an `aria-label`, where no sighted desktop reader and no touch reader will
 * ever meet it.
 *
 * So: the green segment is the phase's OWN percent of a track that is the
 * answered set and nothing else, and the unanswered count is a separate line
 * underneath, in the aria-label's own words, on the visible layer.
 */
function phaseBars(
  phases: readonly PhaseScore[],
  opts: { legend?: boolean; rows?: ReadonlyMap<number, number> } = {},
): string {
  // The bar's own two segments, drawn as the track draws them — and the same
  // six words the chips and the table use, so a reader meets one vocabulary.
  const legend = opts.legend
    ? `<span class="fy-phase-key" aria-hidden="true">
      <span><span class="fy-swatch fy-swatch-pass"></span>pass</span>
      <span><span class="fy-swatch fy-swatch-fail"></span>did not pass</span>
      <span>no answer is never in the track, and never counted</span>
    </span>\n`
    : "";
  const rows = phases
    .map((p) => {
      const name = PHASE_NAMES[p.phase] ?? `Phase ${p.phase}`;
      const failGap = p.fail + p.gap;
      const answered = p.pass + failGap;
      // The track is the ANSWERED set. Its two segments are the phase's own
      // percent and its complement, so the green bar's width IS its own number.
      const w = (n: number) => ((100 * n) / answered).toFixed(1);
      // No `title` on a segment: the counts are printed under the bar now, and a
      // hover-only number on a 8px sliver is not a place a fact may live.
      const seg = (cls: string, n: number) =>
        n === 0 ? "" : `<span class="${cls}" style="width:${w(n)}%"></span>`;
      const empty = answered === 0 && p.unverified === 0;
      // AN EMPTY BAR HAS TWO CAUSES AND THEY ARE NOT THE SAME FACT. "no checks
      // in scope" is a decision this record made about this repository; "no rows
      // in this record" is the record saying nothing at all. P6 asserted the
      // first while the table one section below said the second, for the same
      // phase — and the phase a package consumer cares about most is the one
      // reported on the weakest evidence.
      const held = opts.rows?.get(p.phase);
      const emptyWord = held === 0 ? "no rows in this record" : "no checks in scope";
      // …and it is said ONCE. The mono track slot and the sans note under it
      // printed the same sentence in two registers, one directly above the other.
      const track = empty
        ? `<span class="fy-phase-none">${emptyWord}</span>`
        : answered === 0
          ? `<span class="fy-phase-none">nothing answered</span>`
          : `<span class="fy-phase-track">${seg("fy-seg-pass", p.pass)}${seg("fy-seg-fail", failGap)}</span>`;
      const note = empty
        ? ""
        : answered === 0
          ? `${plural(p.unverified)} with no answer (not counted)`
          : `${phaseLabel(p)} of ${answered} answered${
              p.unverified > 0 ? ` &middot; ${p.unverified} no answer (not counted)` : ""
            }`;
      const aria = `${name}: ${(note || emptyWord).replaceAll("&middot;", ",")}`;
      return `<span class="fy-phaserow" role="img" aria-label="${escapeHtml(aria)}">
      <span class="fy-phase-id" aria-hidden="true" title="${escapeHtml(name)}">P${p.phase}</span>
      ${track}
      <span class="fy-phase-pct" aria-hidden="true">${phaseLabel(p)}</span>${
        note ? `\n      <span class="fy-phase-note" aria-hidden="true">${note}</span>` : ""
      }
    </span>`;
    })
    .join("\n");
  return `<span class="fy-phasebar">\n${legend}${rows}\n</span>`;
}

/* ══ the directory ═══════════════════════════════════════════════════════ */

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
    ${coverageNote(f)}${factNotes(lf, r.score)}
    <a class="fy-record-link" href="${ctx.h(repoSlugPath(r))}">View record&nbsp;&rarr;</a></td>
  <td data-label="Phases">${phaseBars(r.score.phases, { rows: rowsPerPhase(r) })}</td>
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
</div>

${chapterNav(DIRECTORY_CHAPTERS, { tight: true })}

<div class="fy-wrapper">
<div class="fy-dir-controls" id="directory-search">
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

<div class="fy-mediaframe" id="directory-listings">
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
<section id="directory-key" aria-label="What the columns mean">
${verdictKey()}
<p class="fy-note">${UNVERIFIED_GLOSS}</p>
${phaseKeyLine()}
${laneKey()}
${withFactoryGloss(directoryTermsNote(ctx.h), "directoryTermsNote")}
</section>
<script src="${ctx.h("filter.js")}" defer></script>
</div>`;
  return page(ctx, { title: "Scan Directory", body });
}

/* ══ the repository sheet ════════════════════════════════════════════════ */

/**
 * D16 · A maintainer's home directory is not evidence, and it is not ours to
 * publish.
 *
 * Local-lane evidence messages carry absolute workstation paths
 * (`/Users/<name>/.ssh/…`) straight onto a public page — a real name, and the
 * shape of a machine nobody asked to have described. The scanner's own output
 * wants fixing upstream and a sweep of the other five designs is Remaining Work
 * in the ISA; this is the render-time floor, so no Factory page ships one while
 * that is pending.
 */
export function redactHome(s: string): string {
  return s.replace(/(^|[\s"'`(\[<=:])\/(?:Users|home)\/[^/\s"'`)\]>]+\//g, "$1~/");
}

/**
 * The table says what the chip says. `Info` and `Unverified` were internal
 * tokens standing where the figure above already used plain English, so one
 * page named the same state two ways and neither name was in any key.
 */
const OUTCOME_LABEL = VERDICT_WORD;

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
    // "OUTSIDE EVERY DENOMINATOR" IS FALSE UNDER THE SITE'S OWN FORMULA. §05
    // prints `coverage = Σ answered / |scope|`, and an unanswered in-scope check
    // is inside that denominator — which is exactly why coverage reads 90.9%
    // and not 100%. It is outside the GRADE's denominator only, and saying
    // otherwise understates what an unanswered check costs.
    return `${open}
  <p class="fy-body">A signed local scan already resolved ${plural(f.resolvedByLocal)}. Coverage
  is still <strong>${f.coverage}%</strong>, under the ${COVERAGE_FLOOR_PROVISIONAL}% floor:
  ${plural(f.unverified)} are never counted toward the grade, and always counted in evidence
  coverage. That is the permanent ceiling.</p>
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
  <!-- THE REDACTION IS RENDER-ONLY, AND THE PAGE SAYS SO. The rendered evidence
       above shows a tilde path; the signed bytes linked from this paragraph cannot
       be rewritten without breaking the signature, so they still carry the
       absolute workstation paths. That is not a rendering bug — it is an
       undisclosed one unless the page discloses it. -->
  <p class="fy-note">The signed bytes are republished verbatim, and contain the workstation paths
  this page redacts.</p>
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
  const lf = lookupFacts(ctx.facts, r);
  const passed = r.score.overall_percent === null ? "—" : `${r.score.overall_percent}%`;
  const verdicts = new Map<string, ControlRecord>(r.controls.map((c) => [c.id, c]));
  const localResolved = new Set<string>(lt?.lane === "local" ? lt.resolved : []);

  // THE DENOMINATORS, from the rows the table below shows. A reader who has
  // just been taught "54 checks in the standard set" reads a bare 87.1% against
  // 54 and infers ~47 answered; the true figure was 27 of 31 in scope, off by a
  // factor of 1.7 in the flattering direction, with nothing on the page to
  // catch it. The strings 31 and 27 appeared zero times in the rendered page.
  const scoped = r.controls.filter((c) => c.in_scope);
  const answeredRows = scoped.filter(
    (c) => c.scan_outcome === "pass" || c.scan_outcome === "fail" || c.scan_outcome === "gap",
  );
  const passedRows = scoped.filter((c) => c.scan_outcome === "pass");
  // THREE COUNTS, EACH FROM THE ROWS THAT SUPPORT IT. `CONTROL_COUNT - scoped`
  // folded two different facts into one number and called the whole thing "out
  // of scope": the 11 the record marks out of scope, and the 10 the record holds
  // no row for at all. Asserting out-of-scope for the second group is the guess
  // `threats.ts` forbids, and it runs in the flattering direction — those ten sit
  // outside the coverage denominator, and counting them as unanswered would put
  // coverage under the floor, so "clears the 75% floor" rested on the guess.
  const absent = absentIds(r);
  const outOfScopeRows = r.controls.filter((c) => !c.in_scope);

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
          .map((m) => `<li>${escapeHtml(redactHome(m))}</li>`)
          .join("")}</ul></details>`
      : "";
    // A local-lane row is the repository's owner asserting his own posture on
    // his own laptop. Drawn exactly like a row an independent scan observed, it
    // is the one thing on this table a reader cannot check — so it is marked.
    const local =
      localResolved.has(c.id) &&
      (c.scan_outcome === "pass" || c.scan_outcome === "fail" || c.scan_outcome === "gap");
    return `<tr class="${c.in_scope ? "" : "fy-row-oos"}"${local ? ' data-lane="local"' : ""}>
  <td data-label="Control"><code>${escapeHtml(c.id)}</code>${
    c.in_scope || c.scan_outcome === "info" ? "" : ' <span class="fy-oos">out of scope</span>'
  }</td>
  <td data-label="Verdict"><span class="fy-verdict-cell"><span class="fy-outcome fy-oc-${escapeHtml(
    c.scan_outcome,
  )}">${escapeHtml(label)}</span>${
    local ? `<a class="fy-row-lane fy-hit-pill" href="#sheet-lane">local</a>` : ""
  }${raw}</span></td>
  <td data-label="Detail">${reason}${msgs}</td>
</tr>`;
  };

  // A REGISTRY CONTROL WITH NO ROW GETS A ROW SAYING SO. "see the table" pointed
  // at a table those ten checks were absent from, which is the one place a reader
  // would go to find out what happened to them.
  const absentRow = (id: string): string => `<tr class="fy-row-absent">
  <td data-label="Control"><code>${escapeHtml(id)}</code></td>
  <td data-label="Verdict"><span class="fy-outcome fy-oc-${ABSENT}">${escapeHtml(
    VERDICT_WORD[ABSENT]!,
  )}</span></td>
  <td data-label="Detail"><span class="fy-reason">The record holds no row for this check, and
  says nothing about it either way.</span></td>
</tr>`;

  const controlRows = phaseNumbers
    .map((p) => {
      const list = byPhase.get(p) ?? [];
      const missing = absent.filter((id) => CONTROL_REGISTRY[id]!.phase === p);
      const counts = [
        list.length > 0 ? escapeHtml(plural(list.length, "check")) : "",
        missing.length > 0 ? `${missing.length} not in this record` : "",
      ].filter((s) => s !== "");
      const band = `<tr class="fy-phaseband" id="phase-${p}"><td colspan="3">Phase ${p} — ${escapeHtml(
        PHASE_NAMES[p] ?? "",
      )}<span class="fy-ph-count">${
        counts.length === 0 ? "no checks in this record" : counts.join(" &middot; ")
      }</span></td></tr>`;
      const absentBand =
        missing.length === 0
          ? []
          : [
              `<tr class="fy-phaseband fy-band-absent"><td colspan="3">Not in this record<span class="fy-ph-count">${
                missing.length
              } of the ${CONTROL_COUNT}</span></td></tr>`,
            ];
      return [band, ...list.map(controlRow), ...absentBand, ...missing.map(absentRow)].join("\n");
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
</div>

${chapterNav(SHEET_CHAPTERS, { tight: true })}

<div class="fy-wrapper">
<section class="fy-repo-hero" id="sheet-record">
  ${gradeWithTag(r.score)}
  <div style="min-width:0">
    <h1 class="fy-repo-title">${escapeHtml(slug)}</h1>
    <!-- THE CONTRADICTION IS IN THE HERO, BEFORE ANY FIGURE. types.ts requires
         it "on the listing row AND on the detail page" precisely because it is
         the most interesting fact the directory holds about a repository — and
         it was on the detail page, in the seventh section, ~86KB of markup
         BELOW every number a reader acts on. A visitor arriving from a shared
         link read A+ / 100% / not provisional and left. -->
    <p style="margin-top:12px">${LANE_CHIP[kind]}${localOverlayChip(lt, "#sheet-lane")}</p>
    ${conflictBadge(lf, r.score, "#merge")}
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
          ? `<span class="fy-stale-row"><a class="fy-stale" href="${ctx.h(
              "methodology/#changelog",
            )}">scored under methodology v${r.methodology_version}&nbsp;&rarr;</a></span>`
          : ""
      }
    </p>
  </div>
</section>

<section class="fy-figs" aria-label="The two numbers on this listing">
  <div>
    <p class="fy-fig-num">${escapeHtml(passed)}</p>
    <p class="fy-fig-cap">${passedRows.length} of the ${answeredRows.length} checks that were
    answered passed. A check with no answer is not one of them.</p>
  </div>
  <div>
    <p class="fy-fig-num">${r.score.evidence_coverage_percent}%</p>
    <p class="fy-fig-cap">${answeredRows.length} of the ${scoped.length} checks in scope for this
    listing were answered. Of the ${CONTROL_COUNT} standard checks, ${outOfScopeRows.length} are
    marked out of scope for this repository and ${absent.length} do not appear in this record at
    all &mdash; <a href="#sheet-controls">see the table</a>.</p>
    ${coverageVerdictLine(r, facts, ctx, lf)}
  </div>
</section>
${
  r.score.provisional
    ? `<p class="fy-note"><em>provisional</em> ${define("provisional")}</p>`
    : ""
}
<div id="sheet-phases" style="padding-block:16px 40px">${phaseBars(r.score.phases, {
    legend: true,
    rows: rowsPerPhase(r),
  })}</div>
</div>

<div class="fy-mediaframe">
${nestedDiagram({
  scope: "sheet",
  href: ctx.h("methodology/#every-check"),
  title: "What this scan checked",
  titleTip:
    "The standard set, grouped by phase. Each chip carries this listing's verdict; a chip with no verdict is a check this record holds no row for.",
  verdicts,
  localResolved,
})}
</div>

<div class="fy-wrapper">
${exposurePanel(ctx.h, r)}
<div id="sheet-lane">
${provenance(r, t, kind, ctx, lt)}
${lt && kind !== "local" ? localProvenance(r, lt, false, ctx) : ""}
</div>
${factsSection(lf, r.score)}
${coveragePanel(r, facts, ctx)}

<section class="fy-section" id="sheet-controls">
  <h2>All controls</h2>
  <p class="fy-body">Raw sscsb verdicts and every reclassification are shown. Being
  transparent about what was and was not verifiable is the product. The checks run in
  ${phaseNumbers.length} phases, named on the band above each group.</p>
  ${verdictKey()}
  <p class="fy-note">${UNVERIFIED_GLOSS}</p>
  <p class="fy-ctl-bar"><span class="fy-key-label">Jump to phase</span>
  ${jump}
  </p>
  ${
    outOfScope > 0
      ? `<p class="fy-note">${outOfScope} out-of-scope checks are greyed, and ${absent.length} of
  the ${CONTROL_COUNT} appear in no row of this record at all.</p>`
      : ""
  }
</section>
</div>

<div class="fy-mediaframe">
${tableWrap(controlsTable, `Every control on ${slug}`)}
</div>`;
  return page(ctx, { title: `${slug} — Scan`, body });
}
