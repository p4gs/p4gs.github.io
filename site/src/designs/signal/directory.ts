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
import { define, defineTerm } from "../../glossary";
import type { ListingFacts } from "../../listing";
import type { ScanRecord, Score } from "../../schema";
import { COVERAGE_FLOOR_PROVISIONAL } from "../../scoring";
import {
  localOverlayCount,
  LOCAL_RECORD_PUBLISHED,
  LOCAL_SIGNATURE_NAMESPACE,
  LOCAL_SIGNATURE_PUBLISHED,
  resolveTrustKind,
  trustKeyOf,
  type TrustInfo,
  type TrustKind,
} from "../../trust";
import { directoryTermsNote } from "../home-shared";
import { factSentences } from "../shared-facts";
import { exposurePanel } from "../threats-shared";
import {
  countMark,
  gradeBadge,
  gradePill,
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
 * of the four: it is a real signature and a SHORTER chain than CI, and the
 * styling has to say so before the title attribute does.
 */
function laneChip(kind: TrustKind): string {
  switch (kind) {
    case "verified":
      return `<span class="lane lane-verified" title="Authenticated scan from the repository's own CI; signature verified against its workflow identity">signed CI</span>`;
    case "unsigned-action":
      return `<span class="lane lane-unsigned" title="Authenticated-lane record without a verified signature — an unverified claim">CI · unsigned</span>`;
    case "local":
      return `<span class="lane lane-local" title="Workstation scan signed by a key this repository commits in .sscsb/policy/allowed_signers — attributable, but a shorter chain than the authenticated lane, which proves the repository's own CI ran the scan. Its local-environment verdicts count on their own; anything a repository scan could observe waits for an independent record to agree.">local · signed</span>`;
    default:
      return `<span class="lane lane-ext" title="Outside-in scan by the directory; GitHub-side checks ran with public-only visibility">external</span>`;
  }
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
    taking it to ${f.projectedCoverage}% — still short. The rest fail elsewhere.</p>`;
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
 * The merge's findings, in the row. A contradiction is scored as a gap, and a
 * gap that does not say why is a silent downgrade — the opposite of the point.
 */
function factNotes(lf: ListingFacts, directory: Score): string {
  return factSentences(lf, directory)
    .map((n) => `<p class="rn rn-conflict">${escapeHtml(n)}</p>`)
    .join("");
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

function verdictCell(score: Score): string {
  const t = tally(score);
  return `${countMark("pass", t.pass)}${countMark("fail", t.fail)}${countMark(
    "gap",
    t.gap,
  )}${countMark("unverified", t.unverified)}`;
}

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
      const desc = r.repo.description
        ? `<span class="row-desc">${escapeHtml(r.repo.description)}</span>`
        : `<span class="row-desc row-desc-none">No description published.</span>`;
      return `<tr class="row" data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}" data-coverage="${r.score.evidence_coverage_percent}" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${f.belowFloor ? "0" : "1"}" data-contradictions="${lf.contradictions.length}">
  <td class="c-repo" data-label="Repository">
    <a class="row-link" href="${href(repoSlugPath(r))}"><span class="row-owner">${escapeHtml(
      r.repo.owner,
    )}/</span><span class="row-name">${escapeHtml(r.repo.name)}</span></a>
    ${desc}
    ${coverageNote(f)}${factNotes(lf, r.score)}
  </td>
  <td class="c-grade" data-label="Grade">${gradePill(r.score.grade)}</td>
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
  data-api="${SCAN_API_URL}" data-fallback="${SUBMIT_URL}">
  <p class="scan-copy"><strong>No record for this repository yet.</strong>
  Request an unauthenticated sscsb scan. A maintainer reviews every record before it
  enters the directory.</p>
  <button type="button" class="btn" id="dir-scan-cta">Scan now</button>
  <p class="scan-status" id="dir-scan-status" aria-live="polite" hidden></p>
</div>

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
${legend()}
${directoryTermsNote(href)}
<script src="${href("filter.js")}" defer></script>`;
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
      `https://tools.sensiblesecurity.xyz/sscsb/directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`,
      ``,
      `External scans cannot see local-environment controls or private GitHub settings, so parts of the score show as unverified. Running the sscsb-action in this repo's own CI publishes an authenticated record instead:`,
      `${ACTION_REPO_URL}#quickstart`,
      ``,
      `Scoring methodology: https://tools.sensiblesecurity.xyz/sscsb/methodology/`,
    ].join("\n"),
  );
  return `${r.repo.url}/issues/new?title=${title}&body=${body}`;
}

function controlRow(c: ScanRecord["controls"][number]): string {
  const state = OUTCOME_STATE[c.scan_outcome] ?? "unverified";
  const raw =
    c.reclassified || c.raw_outcome !== c.scan_outcome
      ? `<span class="ctl-raw" title="sscsb verify raw outcome">raw: ${escapeHtml(
          c.raw_outcome,
        )}</span>`
      : "";
  const oos = c.in_scope ? "" : `<span class="ctl-oos">out of scope</span>`;
  const reason = c.reason ? `<p class="ctl-reason">${escapeHtml(c.reason)}</p>` : "";
  const msgs = c.messages.length
    ? `<details class="ctl-evidence"><summary>evidence</summary><ul>${c.messages
        .map((m) => `<li>${escapeHtml(m)}</li>`)
        .join("")}</ul></details>`
    : "";
  return `<li class="ctl ctl-${escapeHtml(c.scan_outcome)}${c.in_scope ? "" : " ctl-out"}">
  <span class="ctl-mk">${mark(state, 18)}</span>
  <div class="ctl-body">
    <span class="ctl-id"><code>${escapeHtml(c.id)}</code>${oos}${raw}</span>
    ${reason}${msgs}
  </div>
  ${statusChip(state)}
</li>`;
}

/** One phase, as a nested container: family header, then its control rows. */
function phaseGroup(r: ScanRecord, phase: number): string {
  const controls = r.controls.filter((c) => c.phase === phase);
  if (controls.length === 0 && !r.score.phases.some((p) => p.phase === phase)) return "";
  const p = r.score.phases.find((s) => s.phase === phase);
  const counts = p
    ? `${p.pass} pass · ${p.fail} fail · ${p.gap} gap · ${p.unverified} unanswered`
    : "no verdicts";
  const pct = p ? pctText(p.percent) : "no evidence";
  const allFailing = !!p && p.percent !== null && p.percent === 0 && p.fail + p.gap > 0;
  return `<section class="family${allFailing ? " family-failing" : ""}" id="phase-${phase}">
  <header class="family-head">
    <h2 class="family-title">${escapeHtml(PHASE_NAMES[phase] ?? `Phase ${phase}`)}</h2>
    <span class="family-count">${escapeHtml(pct)}</span>
  </header>
  <p class="family-meta">${escapeHtml(counts)}</p>
  <ul class="ctl-list">
${controls.map(controlRow).join("\n")}
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
      `https://tools.sensiblesecurity.xyz/sscsb/directory/${slug}/`,
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
      `Methodology: https://tools.sensiblesecurity.xyz/sscsb/methodology/#local`,
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

export function renderRepoDetail(r: ScanRecord, t?: TrustInfo, lt?: TrustInfo): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const kind = resolveTrustKind(r, t, lt);
  const facts = coverageFacts(r, localOverlayCount(lt));
  const t0 = tally(r.score);
  const phases = [1, 2, 3, 4, 5, 6]
    .map((p) => phaseGroup(r, p))
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
      <a href="${escapeHtml(r.repo.url)}">${escapeHtml(r.repo.url)}</a> ·
      scanned ${escapeHtml(r.scanned_at.slice(0, 10))} at
      <code>${escapeHtml(r.repo.commit.slice(0, 12))}</code> on
      <code>${escapeHtml(r.repo.default_branch)}</code> ·
      sscsb ${escapeHtml(r.scanner.sscsb_version)} ·
      methodology v${r.methodology_version} ·
      <a href="${escapeHtml(r.scanner.workflow_run_url)}">scan run</a> ·
      ${laneChip(kind)}${localOverlayChip(lt)}
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

${chapterRail([
  { id: "exposure", label: "Defences found" },
  { id: "controls", label: "Every check" },
  { id: "provenance", label: "Who ran it" },
])}

${exposurePanel(href, r)}

<section id="controls" class="controls-section">
  <h2 class="section-title">Every check, with its raw verdict</h2>
  <p class="body-copy">Raw sscsb verdicts and every reclassification are shown.
  Transparency about what was and wasn't verifiable is the product.</p>
${phases}
</section>

${provenanceCard(r, t, kind, lt)}
${lt && kind !== "local" ? localCard(r, lt, false) : ""}
${renderFactsSection(factsFor(r), r.score)}
${coverageCard(r, facts)}
<p class="terms-note">${defineTerm("lane")} —
<a href="${href("methodology/#trust")}">how that is checked</a>.</p>`;
  return page({ title: `${slug} — Scan`, body, active: "directory" });
}
