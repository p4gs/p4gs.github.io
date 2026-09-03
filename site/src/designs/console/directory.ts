/** Console directory listing + per-repo telemetry detail pages. */
import { ACTION_REPO_URL, SCAN_API_URL, SUBMIT_URL } from "../../config";
import { factSentences } from "../shared-facts";
import { lookupFacts, type ListingFacts } from "../../listing";
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
  lookupLocalTrust,
  lookupTrust,
  resolveTrustKind,
  type TrustInfo,
  type TrustKind,
} from "../../trust";
import { compactMeters, gradeBadge, meterStack, PHASE_NAMES } from "./components";
import { escapeHtml, page } from "./layout";
import type { DesignCtx } from "../types";

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
const LANE_CHIP: Readonly<Record<TrustKind, string>> = {
  verified: `<span class="lane lane-auth" title="Authenticated scan from the repository's own CI; signature verified against its workflow identity">auth ✓ verified</span>`,
  "unsigned-action": `<span class="lane lane-unsigned" title="Authenticated-lane record without a verified signature — an unverified claim">auth · unsigned</span>`,
  local: `<span class="lane lane-local" title="Workstation scan signed by a key this repository commits in .sscsb/policy/allowed_signers — attributable, but weaker than the action lane, which proves the repository's own CI ran the scan. Its local-environment verdicts count on their own; anything a repository scan could observe waits for an independent record to agree.">local · signed</span>`,
  external: `<span class="lane lane-ext" title="Outside-in scan by the directory; GitHub-side checks ran with public-only visibility">external</span>`,
};

function laneChip(kind: TrustKind): string {
  return LANE_CHIP[kind];
}

/** Secondary mark: a signed local record filled in class-C rows on this listing. */
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
  return `${overall} · coverage ${r.score.evidence_coverage_percent}%${prov}`;
}

/** Console voice: a diagnostic line, not a scolding. Facts from coverage.ts. */
/**
 * The row's coverage note, plus the anchor caveat when the documented one-line
 * fix would refuse here. The caveat comes from coverage.ts so all four designs
 * say the same true thing about what the maintainer has to do first.
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
    coverage ${f.coverage}% · ${plural(f.localResolvable)} unverified — local-environment
    checks, invisible to any repo scan. Fix: <code>${LOCAL_SCAN_COMMAND}</code></span>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<span class="cov-note"><span class="cov-tag">${head}</span>
    coverage ${f.coverage}% · <code>${LOCAL_SCAN_COMMAND}</code> settles ${plural(
      f.localResolvable,
    )} of them — projected ${f.projectedCoverage}%, still under the floor.</span>`;
  }
  if (f.state === "local-applied") {
    return `<span class="cov-note"><span class="cov-tag">${head}</span>
    coverage ${f.coverage}% · a signed local scan resolved ${plural(
      f.resolvedByLocal,
    )}; ${plural(f.unverified)} still carry no verdict.</span>`;
  }
  return `<span class="cov-note"><span class="cov-tag">${head}</span>
  coverage ${f.coverage}% · ${plural(f.unverified)} unverifiable by any lane here.</span>`;
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
    .map((n) => `<span class="cov-note cov-conflict">${escapeHtml(n)}</span>`)
    .join("");
}

/** The same findings as a detail-page section, with the per-control ids. */
function renderFactsSection(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return `<section class="panel panel-conflict">
  <h2 class="panel-title">What the evidence merge found</h2>
  ${notes.map((n) => `<p class="body-copy">${escapeHtml(n)}</p>`).join("\n  ")}
  ${
    lf.contradictions.length
      ? `<p class="body-copy">Each contradicted control is listed below as a
  <strong>gap</strong>, and its row names the sources and the verdict each gave.</p>`
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
  <td class="grade-cell">${gradeBadge(r.score, "sm")}</td>
  <td class="repo-cell"><a class="repo-name" href="${ctx.h(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      <span class="desc">${escapeHtml(r.repo.description)}</span>
      <span class="meta-line">${metaLine(r)}</span>
      ${coverageNote(f)}${factNotes(lf, r.score)}</td>
  <td class="bars-cell">${compactMeters(r.score)}</td>
  <td class="lane-cell">${laneChip(kind)}${localOverlayChip(lt)}</td>
  <td class="date-cell">${escapeHtml(r.scanned_at.slice(0, 10))}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<div class="page-head">
  <div class="page-head-copy">
    <p class="eyebrow"><span class="live-dot" aria-hidden="true">●</span> Directory feed</p>
    <h1 class="page-title">Scan directory</h1>
    <p class="body-copy">Repositories scanned with sscsb, scored by the
    <a href="${ctx.h("methodology/")}">published methodology</a>. Every listing passed
    a maintainer's review before appearing here.</p>
  </div>
</div>
<div class="dir-controls">
  <label class="dir-filter-label" for="dir-filter">SEARCH · OR SUBMIT OWNER/REPO</label>
  <input type="search" id="dir-filter"
    placeholder="⌕ search the directory — or type owner/repo to submit…"
    aria-label="Search the directory, or submit a repository by typing owner/repo or a GitHub URL">
  <div id="dir-scan" hidden data-api="${SCAN_API_URL}" data-fallback="${SUBMIT_URL}">
    <p class="scan-copy"><span class="scan-eyebrow">NO RECORD</span>
    This repository isn't in the directory yet — run an unauthenticated sscsb scan.
    A maintainer reviews every result before it's published.</p>
    <button type="button" class="btn" id="dir-scan-cta">Scan now</button>
    <p id="dir-scan-status" class="scan-status" aria-live="polite" hidden></p>
  </div>
  <div class="dir-sortbar">
    <label for="dir-sort">SORT</label>
    <select id="dir-sort">
      <option value="grade">grade, then coverage</option>
      <option value="coverage">evidence coverage</option>
      <option value="scanned">last scanned</option>
      <option value="name">name</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      COVERAGE &lt; ${COVERAGE_FLOOR_PROVISIONAL}% ONLY</label>
    <span id="dir-count" class="dir-count"></span>
  </div>
</div>
<div class="table-scroll">
<table class="directory">
  <thead><tr><th>Grade</th><th>Repository</th><th>Phase telemetry</th><th>Lane</th><th>Scanned</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>
<div class="key-row">
  <span class="key-label">KEY</span>
  <span class="key-item"><span class="key-swatch key-pass"></span>pass</span>
  <span class="key-item"><span class="key-swatch key-fail"></span>fail / gap</span>
  <span class="key-item"><span class="key-swatch key-unv"></span>unverified — outside the math</span>
  <span class="key-item">${LANE_CHIP.local}maintainer-signed workstation scan — its local-environment verdicts count on their own</span>
</div>
<script src="${ctx.h("filter.js")}" defer></script>`;
  return page(ctx, { title: "Scan Directory", body });
}

const OUTCOME_LABEL: Readonly<Record<string, string>> = {
  pass: "Pass",
  fail: "Fail",
  gap: "Gap",
  unverified: "Unverified",
  info: "Info",
};

/**
 * Prefilled new-issue link ON THE TARGET REPO suggesting the action (copied
 * from ledger/directory.ts nudgeIssueUrl — designs never import each other).
 */
function nudgeIssueUrl(r: ScanRecord): string {
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

/** The coverage readout: what is missing, why, and the one-line fix. */
/**
 * The detail page's coverage section, plus the anchor caveat when the
 * documented one-line fix would refuse here. Written once in coverage.ts so
 * four designs cannot disagree about what a maintainer actually has to run.
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
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} carry no verdict, and
  <strong>${plural(f.localResolvable)}</strong> of those are local-environment checks:
  commit signing, AI trailers, dependency gates. They live on a maintainer's machine
  and no repository scan can see them, so they are shown and never counted.</p>
  <p class="body-copy">${f.anchorReady === false
    ? "Two steps, in order — the anchor first, then the scan:"
    : "One line closes the gap:"}</p>
  <pre class="cov-cmd"><code>${escapeHtml(f.nudgeCommands.join("\n"))}</code></pre>
  <p class="body-copy">It scans locally, signs the record with the git signing key this
  repository already commits in <code>.sscsb/policy/allowed_signers</code>, and opens the
  submission. Those controls are the ones no repository scan can observe, so a signed
  local record is the only evidence that can exist for them
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
  ${plural(f.localResolvable)} of the ${plural(f.unverified)} without a verdict —
  projected <strong>${f.projectedCoverage}%</strong>, still under the floor. The remaining
  gap is in controls a repository scan can observe.</p>
</section>`;
  }
  if (f.state === "local-applied") {
    return `<section class="nudge nudge-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">A signed local scan already resolved ${plural(f.resolvedByLocal)};
  coverage is still <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor, with ${plural(f.unverified)} outside every
  denominator.</p>
</section>`;
  }
  return `<section class="nudge nudge-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage reads <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor: ${plural(f.unverified)} could not be verified by any
  lane available here. Shown, never counted.</p>
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
    ? `<p class="body-copy">No repository-observable scan exists for this listing, so every
  control outside the local-environment class stays <strong>unverified</strong> — a
  workstation record cannot speak for them.</p>`
    : `<p class="body-copy">It contributed <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class comes from the repository-observable record; a local scan
  never overturns one and never widens the scope it is measured against.</p>`;
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
  more — it is <em>weaker</em> than an authenticated scan, which proves the repository's
  own CI produced the record.</p>
  ${contribution}
  <p class="body-copy">Re-verify it yourself: <a href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a> ·
  <a href="${sigHref}">detached signature</a></p>
  <pre class="cov-cmd"><code>ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
</section>`;
}

/** Provenance panel: which lane, and what was proven. One block per state. */
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
  <p class="body-copy">Produced in the repository's <strong>own CI</strong> and keyless-signed
  there. Before listing it, the directory verified the Sigstore bundle against the
  certificate identity <code>${escapeHtml(t.identity ?? "")}</code>${
      t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
    }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""} — the
  repository, workflow path, and default branch are burned into that certificate by
  GitHub's OIDC issuer, not asserted by the record.</p>
  <p class="body-copy">Re-verify it yourself: <a href="${recordHref}">scan-record.json</a> ·
  <a href="${bundleHref}">signature bundle</a></p>
</section>`;
  }
  if (kind === "unsigned-action") {
    return `<section class="nudge nudge-unsigned">
  <h2 class="nudge-title">Authenticated scan — unsigned</h2>
  <p class="body-copy">Submitted from the repository's own CI but carrying <strong>no verified
  signature</strong>, so the directory can only list it as an unverified claim. Granting
  the scan job <code>id-token: write</code> lets
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next record under
  the workflow's own identity; no secret is involved.</p>
</section>`;
  }
  return `<section class="nudge">
  <h2 class="nudge-title">Improve this score</h2>
  <p class="body-copy">This is an <strong>external</strong> scan — controls that live in the
  development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Repo maintainers can publish an <strong>authenticated</strong>
  scan by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
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
  const controlRows = r.controls
    .map((c) => {
      const label = OUTCOME_LABEL[c.scan_outcome] ?? c.scan_outcome;
      const raw =
        c.reclassified || c.raw_outcome !== c.scan_outcome
          ? `<span class="raw" title="sscsb verify raw outcome">raw: ${escapeHtml(c.raw_outcome)}</span>`
          : "";
      const reason = c.reason ? `<div class="reason">${escapeHtml(c.reason)}</div>` : "";
      const msgs = c.messages.length
        ? `<details><summary>evidence</summary><ul>${c.messages
            .map((m) => `<li>${escapeHtml(m)}</li>`)
            .join("")}</ul></details>`
        : "";
      return `<tr class="oc-${escapeHtml(c.scan_outcome)}${c.in_scope ? "" : " out-of-scope"}">
  <td>${c.phase}</td>
  <td><code>${escapeHtml(c.id)}</code>${c.in_scope ? "" : ' <span class="oos">out of scope</span>'}</td>
  <td class="outcome"><span class="oc-chip">${escapeHtml(label)}</span> ${raw}</td>
  <td>${reason}${msgs}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<nav class="crumbs"><a href="${ctx.h("directory/")}">← Directory</a></nav>
<div class="repo-hero">
  ${gradeBadge(r.score, "lg")}
  <h1 class="repo-title">${escapeHtml(slug)}</h1>
  ${laneChip(kind)}${localOverlayChip(lt)}
</div>
<p class="repo-meta">
  <a href="${escapeHtml(r.repo.url)}">${escapeHtml(r.repo.url)}</a> ·
  scanned ${escapeHtml(r.scanned_at.slice(0, 10))} at
  <code>${escapeHtml(r.repo.commit.slice(0, 12))}</code> on
  <code>${escapeHtml(r.repo.default_branch)}</code> ·
  sscsb ${escapeHtml(r.scanner.sscsb_version)} ·
  methodology v${r.methodology_version} ·
  <a href="${escapeHtml(r.scanner.workflow_run_url)}">scan run</a>
</p>
<p class="score-line">Overall: <strong>${
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`
  }</strong> · evidence coverage: ${r.score.evidence_coverage_percent}%${
    r.score.provisional ? ` · <em class="prov-flag">provisional</em>` : ""
  }</p>
<div class="detail-meters">${meterStack(r.score.phases)}</div>
${provenance(r, t, kind, ctx, lt)}
${lt && kind !== "local" ? localProvenance(r, lt, false, ctx) : ""}
${renderFactsSection(lookupFacts(ctx.facts, r), r.score)}
${coveragePanel(r, facts, ctx)}
<h2 class="controls-title">All controls</h2>
<p class="transparency-note">Raw sscsb verdicts and every reclassification are shown —
transparency about what was and wasn't verifiable is the product.
Phases: ${Object.entries(PHASE_NAMES)
    .map(([n, name]) => `${n} = ${escapeHtml(name)}`)
    .join(", ")}.</p>
<div class="table-scroll">
<table class="controls">
  <thead><tr><th>Phase</th><th>Control</th><th>Verdict</th><th>Detail</th></tr></thead>
  <tbody>
${controlRows}
  </tbody>
</table>
</div>`;
  return page(ctx, { title: `${slug} — Scan`, body });
}
