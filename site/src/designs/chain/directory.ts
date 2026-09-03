/**
 * Chain — directory card grid + per-repo detail pages.
 *
 * The grid keeps the shipped filter.js contract exactly: an input with
 * id="dir-filter" (which doubles as the scan-submission field — filter.js
 * reveals #dir-scan when the query parses as owner/repo with no exact row)
 * and cards that ARE `table.directory tbody tr` elements
 * carrying data-name (filter.js toggles their inline display; "" restores
 * the stylesheet value, so the CSS grid survives filtering). The table is
 * restyled into a card grid; a visually-hidden header row keeps the markup
 * honest for assistive tech.
 */
import { ACTION_REPO_URL, SCAN_API_URL, SUBMIT_URL } from "../../config";
import { factSentences } from "../shared-facts";
import type { ListingFacts } from "../../listing";
import {
  anchorCaveat,
  coverageFacts,
  LOCAL_SCAN_COMMAND,
  plural,
  type CoverageFacts,
} from "../../coverage";
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
import {
  CHAIN_SCRIPT,
  CHECK_ICON_PATH,
  gradeBadge,
  gradePill,
  heroChain,
  icon,
  legendRow,
  miniChain,
  PHASE_ICONS,
  PHASE_NAMES,
  phasePctText,
  phaseState,
} from "./components";
import { escapeHtml, factsFor, href, page } from "./layout";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

function repoSlugPath(r: ScanRecord): string {
  return `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
}

/**
 * Lane chip, three-state. The state comes from the shared resolver in
 * trust.ts (sidecar authoritative, URL heuristic as fallback) so no design
 * can show a verified mark without a verified sidecar.
 */
function laneChip(kind: TrustKind): string {
  switch (kind) {
    case "verified":
      return `<span class="lane lane-auth" title="Authenticated scan from the repository's own CI; signature verified against its workflow identity">${icon(CHECK_ICON_PATH, 12)}verified</span>`;
    case "unsigned-action":
      return `<span class="lane lane-unsigned" title="Authenticated-lane record without a verified signature — an unverified claim">authenticated · unsigned</span>`;
    case "local":
      return `<span class="lane lane-local" title="Workstation scan signed by a key this repository commits in .sscsb/policy/allowed_signers — attributable, but a shorter chain than the authenticated lane, which proves the repository's own CI ran the scan. Its local-environment verdicts count on their own; anything a repository scan could observe waits for an independent record to agree.">local · signed</span>`;
    default:
      return `<span class="lane lane-ext" title="Outside-in scan by the directory; GitHub-side checks ran with public-only visibility">external</span>`;
  }
}

/** The extra link in the chain: a signed local record filling class-C rows. */
function localOverlayChip(lt: TrustInfo | undefined): string {
  const n = localOverlayCount(lt);
  if (n === 0) return "";
  const title = `+${plural(n)} resolved by a local scan signed by ${
    lt?.signer ?? "an approved signer"
  }, verified against this repository's committed allowed_signers`;
  return `<span class="lane lane-local-overlay" title="${escapeHtml(title)}">+ local ${n}</span>`;
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const prov = r.score.provisional ? ` · <em class="prov">provisional</em>` : "";
  return `${overall} overall · ${r.score.evidence_coverage_percent}% coverage${prov}`;
}

/** Chain's voice: name the missing link, and the one command that forges it. */
/**
 * The row's coverage note, plus the anchor caveat when the documented one-line
 * fix would refuse here. The caveat comes from coverage.ts so all four designs
 * say the same true thing about what the maintainer has to do first.
 */
function coverageNote(f: CoverageFacts): string {
  const body = coverageNoteBody(f);
  const caveat = anchorCaveat(f);
  return body && caveat
    ? `${body}<span class="rc-cov rc-caveat">${escapeHtml(caveat)}</span>`
    : body;
}

function coverageNoteBody(f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor ? "No letter" : "Provisional";
  if (f.state === "fixable-by-local") {
    return `<div class="rc-cov"><strong>${head}</strong> — coverage ${f.coverage}%.
    ${plural(f.localResolvable)} have no link to follow: they live on a maintainer's
    machine, where no repository scan reaches.
    <code>${LOCAL_SCAN_COMMAND}</code> forges it.</div>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<div class="rc-cov"><strong>${head}</strong> — coverage ${f.coverage}%.
    <code>${LOCAL_SCAN_COMMAND}</code> would forge ${plural(f.localResolvable)} of the
    missing links, taking coverage to ${f.projectedCoverage}% — still short. The rest of
    the chain breaks elsewhere.</div>`;
  }
  if (f.state === "local-applied") {
    return `<div class="rc-cov"><strong>${head}</strong> — coverage ${f.coverage}%.
    A signed local scan already linked ${plural(f.resolvedByLocal)};
    ${plural(f.unverified)} still have no verdict.</div>`;
  }
  return `<div class="rc-cov"><strong>${head}</strong> — coverage ${f.coverage}%.
  ${plural(f.unverified)} could not be linked by any lane here.</div>`;
}


/**
 * The merge's findings on this listing, in the design's own chrome: a
 * contradiction across evidence sources, a local record bound to a different
 * commit than the scan it sits beside, and local assertions held back until
 * something independent agrees with them.
 *
 * A design MUST render these. A contradiction is scored as a gap, and a gap
 * that does not say why is a silent downgrade — the opposite of the point.
 */
function factNotes(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return notes
    .map((n) => `<span class="rc-cov rc-conflict">${escapeHtml(n)}</span>`)
    .join("");
}

/** The same findings as a detail-page section, with the per-control ids. */
function renderFactsSection(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return `<section class="card chain-card conflict-card">
  <h2 class="card-title">What the evidence merge found</h2>
  ${notes.map((n) => `<p class="body-copy">${escapeHtml(n)}</p>`).join("\n  ")}
  ${
    lf.contradictions.length
      ? `<p class="body-copy">Each contradicted control is listed below as a
  <strong>gap</strong>, and its row names the sources and the verdict each gave.</p>`
      : ""
  }
</section>`;
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
  const cards = sorted
    .map((r) => {
      const slug = `${r.repo.owner}/${r.repo.name}`;
      const lt = localTrust.get(trustKeyOf(r));
      const kind = resolveTrustKind(r, trust.get(trustKeyOf(r)), lt);
      const lf = factsFor(r);
      const f = coverageFacts(r, localOverlayCount(lt));
      const desc = r.repo.description
        ? `<p class="rc-desc">${escapeHtml(r.repo.description)}</p>`
        : `<p class="rc-desc rc-desc-empty">No description published.</p>`;
      return `<tr class="repo-card" data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}" data-coverage="${r.score.evidence_coverage_percent}" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${f.belowFloor ? "0" : "1"}" data-contradictions="${lf.contradictions.length}">
<td class="repo-card-in">
  <div class="rc-head">
    <a class="repo-link" href="${href(repoSlugPath(r))}">${escapeHtml(slug)}</a>
    ${gradePill(r.score.grade)}
  </div>
  ${desc}
  ${miniChain(r.score)}
  <div class="rc-meta">${metaLine(r)}</div>
  ${coverageNote(f)}${factNotes(lf, r.score)}
  <div class="rc-foot">${laneChip(kind)}${localOverlayChip(lt)}<span class="rc-date mono">${escapeHtml(r.scanned_at.slice(0, 10))}</span></div>
</td>
</tr>`;
    })
    .join("\n");
  const body = `
<div class="page-head">
  <div class="page-head-copy">
    <p class="eyebrow mono">CHAIN OF CUSTODY · PUBLIC RECORD</p>
    <h1 class="page-title">Scan directory</h1>
    <p class="body-copy">Repositories scanned with sscsb, scored by the
    <a href="${href("methodology/")}">published methodology</a>. Every listing passed
    a maintainer's review before appearing here. Type any <code>owner/repo</code>
    below to search the record — or to put a repository that isn't in it yet
    into the scan queue.</p>
  </div>
</div>
<div class="dir-controls">
  <input type="search" id="dir-filter" placeholder="⌕ search — or submit any owner/repo…"
    aria-label="Search the directory, or submit a repository to scan (owner/repo or GitHub URL)">
  <div class="card scan-card" id="dir-scan" hidden
    data-api="${SCAN_API_URL}" data-fallback="${SUBMIT_URL}">
    <p class="scan-copy"><strong>No record for this repository yet.</strong>
    Request an unauthenticated sscsb scan — a maintainer reviews every record
    before it enters the directory.</p>
    <button type="button" class="btn" id="dir-scan-cta">Scan now</button>
    <p class="scan-status mono" id="dir-scan-status" aria-live="polite" hidden></p>
  </div>
  <div class="dir-sortbar mono">
    <label for="dir-sort">ORDER</label>
    <select id="dir-sort">
      <option value="grade">grade, then coverage</option>
      <option value="coverage">evidence coverage</option>
      <option value="scanned">last scanned</option>
      <option value="name">name</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      only chains under ${COVERAGE_FLOOR_PROVISIONAL}% coverage</label>
    <span id="dir-count" class="dir-count"></span>
  </div>
</div>
<table class="directory">
  <thead class="sr-only"><tr><th scope="col">Repository scan record</th></tr></thead>
  <tbody>
${cards}
  </tbody>
</table>
${legendRow()}
<script src="${href("filter.js")}" defer></script>`;
  return page({ title: "Scan Directory", body, active: "directory" });
}

const OUTCOME_LABEL: Readonly<Record<string, string>> = {
  pass: "Pass",
  fail: "Fail",
  gap: "Gap",
  unverified: "Unverified",
  info: "Info",
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
  const label = OUTCOME_LABEL[c.scan_outcome] ?? c.scan_outcome;
  const raw =
    c.reclassified || c.raw_outcome !== c.scan_outcome
      ? ` <span class="raw" title="sscsb verify raw outcome">raw: ${escapeHtml(c.raw_outcome)}</span>`
      : "";
  const oos = c.in_scope ? "" : ` <span class="oos">out of scope</span>`;
  const reason = c.reason ? `<div class="ctl-reason">${escapeHtml(c.reason)}</div>` : "";
  const msgs = c.messages.length
    ? `<details class="ctl-evidence"><summary>evidence</summary><ul>${c.messages
        .map((m) => `<li>${escapeHtml(m)}</li>`)
        .join("")}</ul></details>`
    : "";
  return `<li class="ctl oc-${escapeHtml(c.scan_outcome)}${c.in_scope ? "" : " ctl-oos"}">
  <span class="ctl-mark oc-${escapeHtml(c.scan_outcome)}">${escapeHtml(label)}</span>
  <div class="ctl-main"><code>${escapeHtml(c.id)}</code>${oos}${raw}${reason}${msgs}</div>
</li>`;
}

function phaseGroup(r: ScanRecord, phase: number): string {
  const controls = r.controls.filter((c) => c.phase === phase);
  const p = r.score.phases.find((s) => s.phase === phase);
  const st = p ? phaseState(p) : "none";
  const pct = p ? phasePctText(p) : "no evidence";
  const counts = p
    ? `${p.pass} pass · ${p.fail + p.gap} fail/gap · ${p.unverified} unverified`
    : "";
  return `<section class="card phase-group st-${st}" aria-label="${escapeHtml(
    `${PHASE_NAMES[phase] ?? `Phase ${phase}`}: ${pct}`,
  )}">
  <header class="pg-head">
    <span class="pg-tile st-${st}" aria-hidden="true">${icon(PHASE_ICONS[phase] ?? "", 20)}</span>
    <div class="pg-title-wrap">
      <h2 class="pg-title">Phase ${phase} — ${escapeHtml(PHASE_NAMES[phase] ?? "")}</h2>
      <span class="pg-counts">${counts}</span>
    </div>
    <span class="pg-pct mono st-${st}">${escapeHtml(pct)}</span>
  </header>
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

/** The missing-link card: which links are absent, and the one command that forges them. */
/**
 * The detail page's coverage section, plus the anchor caveat when the
 * documented one-line fix would refuse here. Written once in coverage.ts so
 * four designs cannot disagree about what a maintainer actually has to run.
 */
function coverageCard(r: ScanRecord, f: CoverageFacts): string {
  const body = coverageCardBody(r, f);
  const caveat = anchorCaveat(f);
  if (!body || !caveat) return body;
  return `${body}
<section class="card chain-card"><p class="body-copy">${escapeHtml(caveat)}</p></section>`;
}

function coverageCardBody(r: ScanRecord, f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter — insufficient evidence (${f.coverage}% coverage)`
    : "Why this grade is provisional";
  if (f.state === "fixable-by-local") {
    return `<section class="card improve-card">
  <h2 class="improve-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} have no verdict at all;
  <strong>${plural(f.localResolvable)}</strong> of them are local-environment checks —
  commit signing, AI trailers, dependency gates — whose evidence exists only on a
  maintainer's machine. No repository scan reaches it, so the chain simply stops there.</p>
  <p class="body-copy">${f.anchorReady === false
    ? "Two links, in this order — the repository has to approve the scan before it can forge one:"
    : "One command forges that link:"}</p>
  <pre class="inkblock mono"><code>${escapeHtml(f.nudgeCommands.join("\n"))}</code></pre>
  <p class="body-copy">It scans locally, signs the record with the git signing key this
  repository already commits in <code>.sscsb/policy/allowed_signers</code>, and opens the
  submission. These are the links no repository scan can forge, so a signed local record
  is the only evidence that can exist for them
  (<a href="${href("methodology/#local")}">how it is scored</a>).</p>
  <div class="btn-row">
    <a class="btn" href="${escapeHtml(localNudgeIssueUrl(r, f))}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<section class="card improve-card">
  <h2 class="improve-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. <code>${LOCAL_SCAN_COMMAND}</code> would forge
  ${plural(f.localResolvable)} of the ${plural(f.unverified)} missing links — taking
  coverage to <strong>${f.projectedCoverage}%</strong>, still short of the floor. Worth
  running; not on its own enough, because the rest of the chain breaks in controls a
  repository scan can see.</p>
</section>`;
  }
  if (f.state === "local-applied") {
    return `<section class="card improve-card">
  <h2 class="improve-title">${escapeHtml(head)}</h2>
  <p class="body-copy">A signed local scan already forged ${plural(f.resolvedByLocal)}.
  Coverage is still <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor, with ${plural(f.unverified)} outside every
  denominator.</p>
</section>`;
  }
  return `<section class="card improve-card">
  <h2 class="improve-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor: ${plural(f.unverified)} could not be linked by any
  lane available here. Shown, never counted.</p>
</section>`;
}

/** The local link in the chain: exactly what the SSH signature proves. */
function localCard(r: ScanRecord, lt: TrustInfo, primary: boolean): string {
  const recordHref = href(`${repoSlugPath(r)}${LOCAL_RECORD_PUBLISHED}`);
  const sigHref = href(`${repoSlugPath(r)}${LOCAL_SIGNATURE_PUBLISHED}`);
  const n = lt.resolved.length;
  const contribution = primary
    ? `<p class="body-copy">No repository-observable scan exists for this listing, so every
  control outside the local-environment class stays <strong>unverified</strong> — the
  chain has no link there, and a workstation record cannot supply one.</p>`
    : `<p class="body-copy">It forged <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class comes from the repository-observable record above; a local
  scan never overturns one, and never widens the scope it is measured against.</p>`;
  return `<section class="card improve-card">
  <h2 class="improve-title">Local scan — signature verified</h2>
  <p class="body-copy">A maintainer ran sscsb on their own machine and signed the record
  with their git signing key. The directory verified that detached SSH signature with
  <code>ssh-keygen -Y verify</code> against <code>.sscsb/policy/allowed_signers</code>
  <strong>fetched from this repository</strong> at commit
  <code>${escapeHtml((lt.commit ?? "").slice(0, 12))}</code> — committed content the submitter
  does not supply. Verifying principal <code>${escapeHtml(lt.signer ?? "")}</code>${
    lt.key_fingerprint ? ` (<code>${escapeHtml(lt.key_fingerprint)}</code>)` : ""
  }${lt.verified_at ? ` on ${escapeHtml(lt.verified_at.slice(0, 10))}` : ""}.</p>
  <p class="body-copy"><strong>What that proves, exactly:</strong> a holder of a key this
  repository commits as an approved signer asserts this result at that commit — nothing
  further. It is a real link, and a <em>shorter chain</em> than an authenticated scan,
  which proves the repository's own CI produced the record.</p>
  ${contribution}
  <pre class="inkblock mono"><code>ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
  <div class="btn-row">
    <a class="btn" href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a>
    <a class="btn-outline" href="${sigHref}">Detached signature</a>
  </div>
</section>`;
}

function improveCard(
  r: ScanRecord,
  t: TrustInfo | undefined,
  kind: TrustKind,
  lt?: TrustInfo,
): string {
  if (kind === "local" && lt) return localCard(r, lt, true);
  if (kind === "external") {
    return `<section class="card improve-card">
  <h2 class="improve-title">Improve this score</h2>
  <p class="body-copy">This is an <strong>external</strong> scan — controls that live in the
  development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Repo maintainers can publish an <strong>authenticated</strong>
  scan by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
  <div class="btn-row">
    <a class="btn" href="${ACTION_REPO_URL}">Install the Action</a>
    <a class="btn-outline" href="${escapeHtml(nudgeIssueUrl(r))}">Suggest it to the maintainers</a>
  </div>
</section>`;
  }
  if (kind === "unsigned-action" || !t) {
    return `<section class="card improve-card">
  <h2 class="improve-title">Authenticated scan — unsigned</h2>
  <p class="body-copy">This record was submitted from the repository's own CI but carried
  <strong>no verified signature</strong>, so the directory can only list it as an
  unverified claim. Granting the scan job <code>id-token: write</code> lets the
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next record under
  the workflow's own identity; no secret is involved. Amber and hatched links above are
  the work list.</p>
  <div class="btn-row">
    <a class="btn" href="${ACTION_REPO_URL}#signed-records">Signed records</a>
  </div>
</section>`;
  }
  const recordHref = href(`${repoSlugPath(r)}scan-record.json`);
  const bundleHref = href(`${repoSlugPath(r)}scan-record.json.sigstore.json`);
  return `<section class="card improve-card">
  <h2 class="improve-title">Authenticated scan — signature verified</h2>
  <p class="body-copy">This record was produced in the repository's <strong>own CI</strong> and
  keyless-signed there. Before listing it, the directory verified the Sigstore bundle
  against the certificate identity <code>${escapeHtml(t.identity ?? "")}</code>${
    t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""} — the
  repository, workflow path, and default branch are burned into that certificate by
  GitHub's OIDC issuer, not asserted by the record. Amber and hatched links above are
  the work list: adopt the flagged controls, re-run the action, and the next record
  replaces this one.</p>
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
  const chainPhases = r.score.phases.map((p) => ({ phase: p.phase, percent: p.percent }));
  const body = `
<nav class="crumbs" aria-label="Breadcrumb"><a href="${href("directory/")}">← Directory</a></nav>
<div class="repo-head">
  <h1 class="repo-title">${escapeHtml(slug)}</h1>
  ${gradeBadge(r.score, { size: "lg" })}
</div>
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
<p class="score-line">Overall: <strong>${
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`
  }</strong> · evidence coverage: ${r.score.evidence_coverage_percent}%${
    r.score.provisional ? ` · <em class="prov">provisional</em>` : ""
  }</p>
<section class="card chain-card chain-card-detail">
  ${heroChain(chainPhases, { animate: true })}
  ${legendRow()}
</section>
<p class="transparency-note">Raw sscsb verdicts and every reclassification are shown —
transparency about what was and wasn't verifiable is the product.</p>
${[1, 2, 3, 4, 5].map((phase) => phaseGroup(r, phase)).join("\n")}
${improveCard(r, t, kind, lt)}
${lt && kind !== "local" ? localCard(r, lt, false) : ""}
${renderFactsSection(factsFor(r), r.score)}
${coverageCard(r, facts)}
${CHAIN_SCRIPT}`;
  return page({ title: `${slug} — Scan`, body, active: "directory" });
}
