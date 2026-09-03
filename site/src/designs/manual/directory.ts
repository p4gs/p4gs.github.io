/**
 * Manual — the directory as an editorial index and the per-repo manual entry.
 *
 * The index keeps the shared filter.js contract — one #dir-filter input that
 * both searches the index and takes an owner/repo submission (revealing the
 * #dir-scan callout), plus `table.directory tbody tr` rows carrying
 * data-name — but the table is
 * CSS-reset to block/grid layout so each row reads as a ruled entry, not a
 * data grid.
 */
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
import type { DesignCtx } from "../types";
import { gradeSeal, PHASE_NAMES, phaseBars } from "./components";
import { escapeHtml, page } from "./layout";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

function repoSlugPath(r: ScanRecord): string {
  return `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
}

/**
 * Lane label, three-state. The state comes from the shared resolver in
 * trust.ts (sidecar authoritative, URL heuristic as fallback) so no design
 * can show a verified mark without a verified sidecar.
 */
const LANE_LABEL: Readonly<Record<TrustKind, string>> = {
  verified: `<span class="entry-lane entry-lane-auth" title="Authenticated scan from the repository's own CI; signature verified against its workflow identity">authenticated · verified</span>`,
  "unsigned-action": `<span class="entry-lane entry-lane-unsigned" title="Authenticated-lane record without a verified signature — an unverified claim">authenticated · unsigned</span>`,
  local: `<span class="entry-lane entry-lane-local" title="Workstation scan signed by a key this repository commits in .sscsb/policy/allowed_signers — attributable, but weaker than the authenticated lane, which proves the repository's own CI ran the scan. Its local-environment verdicts count on their own; anything a repository scan could observe waits for an independent record to agree.">local · maintainer-signed</span>`,
  external: `<span class="entry-lane" title="Outside-in scan by the directory; GitHub-side checks ran with public-only visibility">external scan</span>`,
};

function laneLabel(kind: TrustKind): string {
  return LANE_LABEL[kind];
}

/** Secondary mark: a signed local record filled in class-C rows on this entry. */
function localOverlayLabel(lt: TrustInfo | undefined): string {
  const n = localOverlayCount(lt);
  if (n === 0) return "";
  const title = `+${plural(n)} resolved by a local scan signed by ${
    lt?.signer ?? "an approved signer"
  }, verified against this repository's committed allowed_signers`;
  return `<span class="entry-lane entry-lane-overlay" title="${escapeHtml(title)}">+ local ${n}</span>`;
}

/**
 * Manual's voice: the entry annotates its own limits, like a footnote in a
 * reference work. Facts from coverage.ts; the sentence is this design's.
 */
/**
 * The row's coverage note, plus the anchor caveat when the documented one-line
 * fix would refuse here. The caveat comes from coverage.ts so all four designs
 * say the same true thing about what the maintainer has to do first.
 */
function coverageNote(f: CoverageFacts): string {
  const body = coverageNoteBody(f);
  const caveat = anchorCaveat(f);
  return body && caveat
    ? `${body}<span class="entry-cov entry-caveat">${escapeHtml(caveat)}</span>`
    : body;
}

function coverageNoteBody(f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter is awarded — coverage ${f.coverage}%.`
    : `The seal is <em>provisional</em>: coverage ${f.coverage}%.`;
  if (f.state === "fixable-by-local") {
    return `<p class="entry-cov">${head} ${plural(
      f.localResolvable,
    )} describe the maintainer's own machine, where no repository scan can look.
    One line settles them: <code>${LOCAL_SCAN_COMMAND}</code></p>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<p class="entry-cov">${head} ${plural(
      f.localResolvable,
    )} describe the maintainer's own machine; <code>${LOCAL_SCAN_COMMAND}</code> settles
    those and takes coverage to ${f.projectedCoverage}% — short of the floor, because the
    remaining gap is not one a local scan can reach.</p>`;
  }
  if (f.state === "local-applied") {
    return `<p class="entry-cov">${head} A signed local scan has already settled ${plural(
      f.resolvedByLocal,
    )}; ${plural(f.unverified)} remain unverified, and outside every denominator.</p>`;
  }
  return `<p class="entry-cov">${head} ${plural(
    f.unverified,
  )} went unverified by every lane available here, and are excluded from the arithmetic.</p>`;
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}% overall`;
  const prov = r.score.provisional ? ` · <em>provisional</em>` : "";
  return `${overall} · coverage ${r.score.evidence_coverage_percent}%${prov} · scanned ${escapeHtml(
    r.scanned_at.slice(0, 10),
  )} · sscsb ${escapeHtml(r.scanner.sscsb_version)}`;
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
    .map((n) => `<span class="entry-cov entry-conflict">${escapeHtml(n)}</span>`)
    .join("");
}

/** The same findings as a detail-page section, with the per-control ids. */
function renderFactsSection(lf: ListingFacts, directory: Score): string {
  const notes = factSentences(lf, directory);
  if (notes.length === 0) return "";
  return `<section class="note note-conflict">
  <h2 class="note-title">What the evidence merge found</h2>
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
      const desc = r.repo.description
        ? `<p class="entry-desc">${escapeHtml(r.repo.description)}</p>`
        : "";
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}" data-coverage="${r.score.evidence_coverage_percent}" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${f.belowFloor ? "0" : "1"}" data-contradictions="${lf.contradictions.length}">
  <td class="entry-main">
    <div class="entry-head">
      <a class="entry-name" href="${ctx.h(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      ${laneLabel(kind)}${localOverlayLabel(lt)}
    </div>
    ${desc}
    <p class="entry-meta">${metaLine(r)}</p>
    ${coverageNote(f)}${factNotes(lf, r.score)}
    <div class="entry-bars">${phaseBars(r.score, { compact: true })}</div>
  </td>
  <td class="entry-seal">${gradeSeal(r.score, {
    size: "md",
    label: `grade ${r.score.grade}${r.score.provisional ? ", provisional" : ""}`,
  })}</td>
</tr>`;
    })
    .join("\n");

  const body = `
<section class="dir-head">
  <p class="eyebrow">The public record</p>
  <h1 class="page-title">The directory</h1>
  <p class="dir-lede">Repositories scanned with sscsb and scored under the
  <a href="${ctx.h("methodology/")}">published methodology</a>. Every listing passed a
  maintainer's review before appearing here; every seal names its own limits.
  To submit a repository, type its <code>owner/repo</code> into the field below.</p>
  <input type="search" id="dir-filter"
    placeholder="Search the directory, or submit owner/repo…"
    aria-label="Search the directory, or submit a repository as owner/repo">
  <div id="dir-scan" hidden data-api="${SCAN_API_URL}" data-fallback="${SUBMIT_URL}">
    <p class="scan-copy">This repository isn't in the directory yet. Run an unauthenticated
    sscsb scan — a maintainer reviews every result before it is published.</p>
    <button type="button" id="dir-scan-cta" class="btn-fill scan-cta">Scan now</button>
    <p id="dir-scan-status" class="scan-status" aria-live="polite" hidden></p>
  </div>
  <p class="dir-sortbar">
    <label for="dir-sort">Arrange</label>
    <select id="dir-sort">
      <option value="grade">by seal, then coverage</option>
      <option value="coverage">by evidence coverage</option>
      <option value="scanned">by date scanned</option>
      <option value="name">alphabetically</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      show only entries under the ${COVERAGE_FLOOR_PROVISIONAL}% coverage floor</label>
    <span id="dir-count" class="dir-count"></span>
  </p>
</section>
<table class="directory" aria-label="Scanned repositories">
  <tbody>
${rows}
  </tbody>
</table>
<p class="legend"><span class="legend-label">Legend</span>
  <span class="legend-item"><span class="sw sw-pass" aria-hidden="true"></span>pass</span> ·
  <span class="legend-item"><span class="sw sw-fail" aria-hidden="true"></span>fail / gap</span> ·
  <span class="legend-item"><span class="sw sw-unv" aria-hidden="true"></span>unverified — shown, never counted</span> ·
  grades A+–F per the methodology, <em>NA</em> = insufficient evidence, <em>provisional</em> = coverage under ${COVERAGE_FLOOR_PROVISIONAL}%.
  ${LANE_LABEL.local} marks a maintainer-signed workstation scan — its local-environment verdicts count on their own,
  and weaker evidence than a record the repository's own CI produced.</p>
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

/** Prefilled new-issue link ON THE TARGET REPO suggesting the action. */
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

/** The errata note: what this entry could not establish, and how it would be. */
/**
 * The detail page's coverage section, plus the anchor caveat when the
 * documented one-line fix would refuse here. Written once in coverage.ts so
 * four designs cannot disagree about what a maintainer actually has to run.
 */
function coverageNoteSection(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  const body = coverageNoteSectionBody(r, f, ctx);
  const caveat = anchorCaveat(f);
  if (!body || !caveat) return body;
  return `${body}
<section class="note"><p class="note-copy">${escapeHtml(caveat)}</p></section>`;
}

function coverageNoteSectionBody(r: ScanRecord, f: CoverageFacts, ctx: DesignCtx): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter — insufficient evidence`
    : "Why this seal is provisional";
  if (f.state === "fixable-by-local") {
    return `<section class="note">
  <h2 class="note-title">${escapeHtml(head)}</h2>
  <p class="note-copy">Evidence coverage stands at <strong>${f.coverage}%</strong>, below the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} carry no verdict at all;
  <strong>${plural(f.localResolvable)}</strong> of them — commit signing, AI trailers,
  dependency gates — describe the maintainer's own machine, which no repository scan
  can look at. They count against nobody. They are simply absent.</p>
  <p class="note-copy">${f.anchorReady === false
    ? "A maintainer settles them by approving the scan in this repository's own anchor first, then running:"
    : "A maintainer settles them in one line:"}
  <code class="cov-cmd">${escapeHtml(f.nudgeCommands.join(" \u00b7 "))}</code> — it scans locally, signs the record
  with the git signing key this repository already commits in
  <code>.sscsb/policy/allowed_signers</code>, and opens the submission. These are the
  controls no repository scan can observe, so a signed local record is the only evidence
  that can exist for them (<a href="${ctx.h("methodology/#local")}">the reasoning</a>).</p>
  <div class="btn-row">
    <a class="btn-fill" href="${escapeHtml(localNudgeIssueUrl(r, f))}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<section class="note">
  <h2 class="note-title">${escapeHtml(head)}</h2>
  <p class="note-copy">Evidence coverage stands at <strong>${f.coverage}%</strong>, below the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. <strong>${plural(f.localResolvable)}</strong> of the
  ${plural(f.unverified)} without a verdict describe the maintainer's own machine, and
  <code class="cov-cmd">${LOCAL_SCAN_COMMAND}</code> would settle exactly those — taking
  coverage to <strong>${f.projectedCoverage}%</strong>. That is still under the floor, so a
  local scan is worth running and will not on its own lift the seal: the remaining gap is
  in controls a repository scan can see.</p>
</section>`;
  }
  if (f.state === "local-applied") {
    return `<section class="note">
  <h2 class="note-title">${escapeHtml(head)}</h2>
  <p class="note-copy">A signed local scan has already settled ${plural(f.resolvedByLocal)}.
  Coverage still stands at <strong>${f.coverage}%</strong>, below the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor, with ${plural(f.unverified)} outside every
  denominator.</p>
</section>`;
  }
  return `<section class="note">
  <h2 class="note-title">${escapeHtml(head)}</h2>
  <p class="note-copy">Evidence coverage stands at <strong>${f.coverage}%</strong>, below the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor: ${plural(f.unverified)} went unverified by every
  lane available here. Shown in full, counted nowhere.</p>
</section>`;
}

/** The local-lane note: exactly what the SSH signature establishes, and what it does not. */
function localNote(r: ScanRecord, lt: TrustInfo, primary: boolean, ctx: DesignCtx): string {
  const recordHref = ctx.h(`${repoSlugPath(r)}${LOCAL_RECORD_PUBLISHED}`);
  const sigHref = ctx.h(`${repoSlugPath(r)}${LOCAL_SIGNATURE_PUBLISHED}`);
  const n = lt.resolved.length;
  const contribution = primary
    ? `<p class="note-copy">No repository-observable scan exists for this entry, so every
  control outside the local-environment class remains <strong>unverified</strong>: a
  workstation record has no standing to speak for them.</p>`
    : `<p class="note-copy">It settled <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class on this page is the repository-observable record's; a local
  scan never overturns one, and never widens the scope it is measured against.</p>`;
  return `<section class="note">
  <h2 class="note-title">Local scan — signature verified</h2>
  <p class="note-copy">A maintainer ran sscsb on their own machine and signed the record with
  their git signing key. Before listing it, the directory verified that detached SSH
  signature with <code>ssh-keygen -Y verify</code> against
  <code>.sscsb/policy/allowed_signers</code> <strong>fetched from this repository</strong> at
  commit <code>${escapeHtml((lt.commit ?? "").slice(0, 12))}</code> — committed content the
  submitter does not supply. The verifying principal was
  <code>${escapeHtml(lt.signer ?? "")}</code>${
    lt.key_fingerprint ? ` (<code>${escapeHtml(lt.key_fingerprint)}</code>)` : ""
  }${lt.verified_at ? `, on ${escapeHtml(lt.verified_at.slice(0, 10))}` : ""}.</p>
  <p class="note-copy"><strong>What that establishes, precisely:</strong> a holder of a key
  this repository commits as an approved signer asserts this result at that commit.
  Nothing beyond it. That is attributable and auditable, and it is <em>weaker</em> than an
  authenticated scan, which establishes that the repository's own CI produced the
  record.</p>
  ${contribution}
  <pre class="inkblock"><code>ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
  <div class="btn-row">
    <a class="btn-fill" href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a>
    <a class="btn-line" href="${sigHref}">Detached signature</a>
  </div>
</section>`;
}

/** The closing editorial note: honest about the lane the record came from and what was proven. */
function closingNote(
  r: ScanRecord,
  t: TrustInfo | undefined,
  kind: TrustKind,
  ctx: DesignCtx,
  lt?: TrustInfo,
): string {
  if (kind === "local" && lt) return localNote(r, lt, true, ctx);
  if (kind === "external") {
    return `<section class="note">
  <h2 class="note-title">Improve this score</h2>
  <p class="note-copy">This is an <strong>external</strong> scan — controls that live in the
  development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Repo maintainers can publish an <strong>authenticated</strong>
  scan by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI,
  through the same reviewed gate as every listing.</p>
  <div class="btn-row">
    <a class="btn-fill" href="${escapeHtml(nudgeIssueUrl(r))}">Suggest it to the maintainers</a>
    <a class="btn-line" href="${ACTION_REPO_URL}#quickstart">Install it yourself (PR)</a>
  </div>
</section>`;
  }
  if (kind === "unsigned-action" || !t) {
    return `<section class="note">
  <h2 class="note-title">Authenticated scan — unsigned</h2>
  <p class="note-copy">This record was submitted from the repository's own CI but carried
  <strong>no verified signature</strong>, so the directory can only list it as an
  unverified claim. Granting the scan job <code>id-token: write</code> lets the
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next record under
  the workflow's own identity; no secret is involved.</p>
  <div class="btn-row">
    <a class="btn-fill" href="${escapeHtml(r.scanner.workflow_run_url)}">View the scan run</a>
    <a class="btn-line" href="${ACTION_REPO_URL}#signed-records">Signed records</a>
  </div>
</section>`;
  }
  const recordHref = ctx.h(`${repoSlugPath(r)}scan-record.json`);
  const bundleHref = ctx.h(`${repoSlugPath(r)}scan-record.json.sigstore.json`);
  return `<section class="note">
  <h2 class="note-title">Authenticated scan — signature verified</h2>
  <p class="note-copy">This record was produced in the repository's <strong>own CI</strong> and
  keyless-signed there. Before listing it, the directory verified the Sigstore bundle
  against the certificate identity <code>${escapeHtml(t.identity ?? "")}</code>${
    t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""} — the
  repository, workflow path, and default branch are burned into that certificate by
  GitHub's OIDC issuer, not asserted by the record. Controls still marked unverified
  live in the development environment, which no CI scan can observe; that is a limit
  of the method, stated rather than hidden.</p>
  <div class="btn-row">
    <a class="btn-fill" href="${recordHref}">scan-record.json</a>
    <a class="btn-line" href="${bundleHref}">Signature bundle</a>
    <a class="btn-line" href="${escapeHtml(r.scanner.workflow_run_url)}">View the scan run</a>
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
          ? ` <span class="raw" title="sscsb verify raw outcome">raw: ${escapeHtml(c.raw_outcome)}</span>`
          : "";
      const reason = c.reason ? `<p class="reason">${escapeHtml(c.reason)}</p>` : "";
      const msgs = c.messages.length
        ? `<details class="fn"><summary>evidence</summary><ul>${c.messages
            .map((m) => `<li>${escapeHtml(m)}</li>`)
            .join("")}</ul></details>`
        : "";
      return `<tr class="oc-${escapeHtml(c.scan_outcome)}${c.in_scope ? "" : " out-of-scope"}">
  <td class="c-phase">${c.phase}</td>
  <td class="c-id"><code>${escapeHtml(c.id)}</code>${c.in_scope ? "" : ' <span class="oos">out of scope</span>'}</td>
  <td class="c-verdict v-${escapeHtml(c.scan_outcome)}">${escapeHtml(label)}${raw}</td>
  <td class="c-detail">${reason}${msgs}</td>
</tr>`;
    })
    .join("\n");

  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const body = `
<nav class="crumbs"><a href="${ctx.h("directory/")}">← Directory</a></nav>
<section class="plate">
  ${gradeSeal(r.score, {
    label: `grade ${r.score.grade}${r.score.provisional ? ", provisional" : ""}`,
  })}
  <h1 class="plate-title">${escapeHtml(slug)}</h1>
  <p class="plate-lane">${laneLabel(kind)}${localOverlayLabel(lt)}</p>
  <p class="colophon">Scanned ${escapeHtml(r.scanned_at.slice(0, 10))} at
  <code>${escapeHtml(r.repo.commit.slice(0, 12))}</code> on
  <code>${escapeHtml(r.repo.default_branch)}</code> ·
  sscsb ${escapeHtml(r.scanner.sscsb_version)} ·
  methodology v${r.methodology_version} ·
  <a href="${escapeHtml(r.repo.url)}">repository</a> ·
  <a href="${escapeHtml(r.scanner.workflow_run_url)}">scan run</a></p>
  <p class="score-line">Overall <strong>${overall}</strong> · evidence coverage ${
    r.score.evidence_coverage_percent
  }%${r.score.provisional ? ` · <em>provisional</em>` : ""}</p>
  <div class="plate-bars">${phaseBars(r.score)}</div>
</section>
<section class="controls-sec">
  <h2 class="sec-title">All controls</h2>
  <p class="sec-copy">Raw sscsb verdicts and every reclassification are shown —
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
  </div>
</section>
${closingNote(r, t, kind, ctx, lt)}
${lt && kind !== "local" ? localNote(r, lt, false, ctx) : ""}
${renderFactsSection(lookupFacts(ctx.facts, r), r.score)}
${coverageNoteSection(r, facts, ctx)}`;
  return page(ctx, { title: `${slug} — Scan`, body });
}
