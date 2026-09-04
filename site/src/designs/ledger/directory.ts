/** Directory listing + per-repo detail pages. */
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
  scanLaneOf,
  trustKeyOf,
  trustKind,
  type TrustInfo,
  type TrustKind,
} from "../../trust";
import { define, defineTerm } from "../../glossary";
import { directoryTermsNote } from "../home-shared";
import { exposurePanel } from "../threats-shared";
import { gradeBadge, PHASE_NAMES, phaseBars } from "./components";
import { escapeHtml, factsFor, href, page } from "./layout";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

export function repoSlugPath(r: ScanRecord): string {
  return `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
}

/**
 * Which lane produced the record. Authenticated scans run in the target
 * repository's own CI, so their workflow_run_url lives outside this site's
 * repo; external scans run in this repo's directory-scan workflow.
 */
export function scanLane(r: ScanRecord): "auth" | "external" {
  return scanLaneOf(r) === "action" ? "auth" : "external";
}

const LANE_LABEL: Readonly<Record<TrustKind, { text: string; title: string }>> = {
  verified: {
    text: "✓ verified",
    title: "Authenticated scan from the repository's own CI; signature verified against its workflow identity",
  },
  "unsigned-action": {
    text: "action · unsigned",
    title: "Authenticated-lane record without a verified signature — an unverified claim",
  },
  local: {
    text: "local · signed",
    title:
      "Workstation scan, signed by a key this repository commits in .sscsb/policy/allowed_signers. Attributable — but weaker than the action lane, which proves the repository's own CI ran the scan. Its local-environment verdicts count on their own; anything a repository scan could observe waits for an independent record to agree.",
  },
  external: {
    text: "external",
    title: "Outside-in scan by the directory; GitHub-side checks ran with public-only visibility",
  },
};

/**
 * Lane marker for the listing and the detail hero. The trust sidecar (written
 * at ingest after signature verification) is authoritative; a record with no
 * sidecar falls back to the URL heuristic, and an authenticated-lane record
 * that was never verified is labeled as the unverified claim it is.
 */
export function laneBadge(
  t: TrustInfo | undefined,
  r?: ScanRecord,
  local?: TrustInfo,
): string {
  const kind: TrustKind = r ? resolveTrustKind(r, t, local) : trustKind(t);
  const l = LANE_LABEL[kind];
  return `<span class="lane lane-${kind}" title="${escapeHtml(l.title)}">${escapeHtml(l.text)}</span>`;
}

/**
 * The overlay mark: a listing whose BASE is a repo-observable scan, with a
 * signed local record filling in class-C rows. Deliberately a second, smaller
 * mark — the lane badge must keep naming the strongest evidence for the score.
 */
export function localOverlayBadge(local: TrustInfo | undefined): string {
  const n = localOverlayCount(local);
  if (n === 0) return "";
  const title = `+${plural(n)} resolved by a local scan signed by ${
    local?.signer ?? "an approved signer"
  }, verified against this repository's committed allowed_signers`;
  return `<span class="lane lane-local-overlay" title="${escapeHtml(title)}">+ local ${n}</span>`;
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const prov = r.score.provisional ? ` · <em class="prov-flag">provisional</em>` : "";
  return `${overall} · coverage ${r.score.evidence_coverage_percent}%${prov}`;
}

/**
 * Why the seal is provisional, and the one line that fixes it. Ledger's voice:
 * the entry states its own defect. Facts from coverage.ts; wording is ours.
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
    ? `${body}<span class="cov-note cov-caveat">${escapeHtml(caveat)}</span>`
    : body;
}

function coverageNoteBody(f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `Insufficient evidence for a letter — coverage ${f.coverage}%.`
    : `Provisional — coverage ${f.coverage}%.`;
  if (f.state === "fixable-by-local") {
    return `<span class="cov-note">${head} ${plural(
      f.localResolvable,
    )} unverified because they live on the maintainer's machine, not in the repository.
    The maintainer closes this in one line: <code>${LOCAL_SCAN_COMMAND}</code></span>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<span class="cov-note">${head} ${plural(
      f.localResolvable,
    )} live on the maintainer's machine — <code>${LOCAL_SCAN_COMMAND}</code> settles those,
    but coverage would still reach only ${f.projectedCoverage}%: the rest of the gap is
    elsewhere.</span>`;
  }
  if (f.state === "local-applied") {
    return `<span class="cov-note">${head} A signed local scan already resolved ${plural(
      f.resolvedByLocal,
    )}; ${plural(f.unverified)} remain outside every denominator.</span>`;
  }
  return `<span class="cov-note">${head} ${plural(
    f.unverified,
  )} could not be verified by any lane and are excluded from every denominator.</span>`;
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
  return `<section class="trust trust-conflict">
  <h2 class="nudge-title">What the evidence merge found</h2>
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
  const rows = sorted
    .map((r) => {
      const slug = `${r.repo.owner}/${r.repo.name}`;
      const t = trust.get(trustKeyOf(r));
      const lt = localTrust.get(trustKeyOf(r));
      const kind = resolveTrustKind(r, t, lt);
      const lf = factsFor(r);
      const f = coverageFacts(r, localOverlayCount(lt));
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${escapeHtml(kind)}" data-coverage="${r.score.evidence_coverage_percent}" data-scanned="${escapeHtml(r.scanned_at.slice(0, 10))}" data-complete="${f.belowFloor ? "0" : "1"}" data-contradictions="${lf.contradictions.length}">
  <td class="seal-cell">${gradeBadge(r.score, { rotationKey: slug })}</td>
  <td class="repo-cell"><a class="repo-name" href="${href(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      <span class="desc">${escapeHtml(r.repo.description)}</span>
      <span class="meta-line">${metaLine(r)}</span>
      ${coverageNote(f)}${factNotes(lf, r.score)}</td>
  <td class="bars-cell">${phaseBars(r.score, { compact: true })}</td>
  <td class="lane-cell">${laneBadge(t, r, lt)}${localOverlayBadge(lt)}</td>
  <td class="date-cell">${escapeHtml(r.scanned_at.slice(0, 10))}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<div class="page-head">
  <div class="page-head-copy">
    <p class="eyebrow">ledger · public record</p>
    <h1 class="page-title">Scan directory</h1>
    <p class="body-copy">Every repository here was scanned with sscsb and scored by
    <a href="${href("methodology/")}">published rules</a>. A person reviewed each result
    before it appeared. The <strong>${defineTerm("lane")}</strong> column says who ran the
    scan. <strong>✓ verified</strong> means the repository's own build ran it and signed
    the result (<a href="${href("methodology/#trust")}">how that is checked</a>).</p>
  </div>
</div>
<div class="dir-controls">
  <label class="dir-controls-label" for="dir-filter">Search the ledger — or submit a repository</label>
  <input type="search" id="dir-filter" placeholder="owner/repo"
    aria-label="Search the directory, or enter owner/repo to submit a repository for scanning">
  <div id="dir-scan" class="dir-scan" hidden
    data-api="${escapeHtml(SCAN_API_URL)}" data-fallback="${escapeHtml(SUBMIT_URL)}">
    <p class="dir-scan-copy">Not in the ledger yet. Request an unauthenticated sscsb scan —
    every record passes a maintainer's review before it's published.</p>
    <button type="button" id="dir-scan-cta" class="btn">Scan now</button>
    <p id="dir-scan-status" class="dir-scan-status" aria-live="polite" hidden></p>
  </div>
  <div class="dir-sortbar">
    <label for="dir-sort">Order the ledger</label>
    <select id="dir-sort">
      <option value="grade">by seal, then coverage</option>
      <option value="coverage">by evidence coverage</option>
      <option value="scanned">by date scanned</option>
      <option value="name">by name</option>
    </select>
    <label class="dir-check"><input type="checkbox" id="dir-incomplete">
      only entries below the ${COVERAGE_FLOOR_PROVISIONAL}% coverage floor</label>
    <span id="dir-count" class="dir-count"></span>
  </div>
</div>
<div class="table-scroll">
<table class="directory">
  <thead><tr><th>Seal</th><th>Repository</th><th>Phases</th><th>Evidence source</th><th>Scanned</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>
<div class="key-row">
  <span class="key-label">KEY</span>
  <span class="key-item"><span class="key-swatch key-pass"></span>pass</span>
  <span class="key-item"><span class="key-swatch key-fail"></span>fail / gap</span>
  <span class="key-item"><span class="key-swatch hatch"></span>${defineTerm("unverified")}</span>
  <span class="key-item"><span class="lane lane-local">local · signed</span>a maintainer ran this on their own machine and signed it — the only evidence that can exist for the checks only they can see</span>
</div>
${directoryTermsNote(href)}
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

/** Prefilled new-issue link ON THE TARGET REPO asking for a local scan. */
export function localNudgeIssueUrl(r: ScanRecord, f: CoverageFacts): string {
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
 * The coverage panel on a detail page: what is missing, why, and the one-line
 * fix. This is the whole "peer pressure" mechanism — it is transparency about
 * what was and wasn't verified, addressed to the repository, never a ranking.
 */
/**
 * The detail page's coverage section, plus the anchor caveat when the
 * documented one-line fix would refuse here. Written once in coverage.ts so
 * four designs cannot disagree about what a maintainer actually has to run.
 */
export function renderCoverageSection(r: ScanRecord, f: CoverageFacts): string {
  const body = renderCoverageSectionBody(r, f);
  const caveat = anchorCaveat(f);
  if (!body || !caveat) return body;
  return `${body}
<section class="trust trust-coverage"><p class="body-copy">${escapeHtml(caveat)}</p></section>`;
}

function renderCoverageSectionBody(r: ScanRecord, f: CoverageFacts): string {
  if (f.state === "complete") return "";
  const head = f.belowNaFloor
    ? `No letter — insufficient evidence (coverage ${f.coverage}%)`
    : `Why this seal is provisional`;
  if (f.state === "fixable-by-local") {
    return `<section class="trust trust-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} carry no verdict at all.
  <strong>${plural(f.localResolvable)}</strong> of those are local-environment checks:
  commit signing, AI trailers, dependency gates. They live on a maintainer's
  machine and are invisible to any repository scan. They are not counted against
  this repository; they are simply missing.</p>
  <p class="body-copy">${f.anchorReady === false
    ? "A maintainer closes the gap by first approving the scan in this repository's own anchor, then running it:"
    : "A maintainer closes the gap in one line:"}</p>
  <pre><code>${escapeHtml(f.nudgeCommands.join("\n"))}</code></pre>
  <p class="body-copy">That scans locally, signs the record with the git signing key this
  repository already commits in <code>.sscsb/policy/allowed_signers</code>, and opens the
  submission. These controls are the ones no repository scan can observe, so a signed
  local record is the only evidence that can exist for them
  (<a href="${href("methodology/#local")}">how it is scored</a>).</p>
  <div class="btn-row">
    <a class="btn" href="${escapeHtml(localNudgeIssueUrl(r, f))}">Ask the maintainers for a local scan</a>
  </div>
</section>`;
  }
  if (f.state === "partly-fixable-by-local") {
    return `<section class="trust trust-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. <code>${LOCAL_SCAN_COMMAND}</code> would settle
  <strong>${plural(f.localResolvable)}</strong> of the ${plural(f.unverified)} without a
  verdict — taking coverage to <strong>${f.projectedCoverage}%</strong>. That is still
  under the floor: the rest of the gap is in controls a repository scan can see, so a
  local scan helps here without lifting the provisional mark on its own.</p>
</section>`;
  }
  if (f.state === "local-applied") {
    return `<section class="trust trust-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">A signed local scan already resolved ${plural(f.resolvedByLocal)},
  and coverage is still <strong>${f.coverage}%</strong> — under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor. ${plural(f.unverified)} remain without a verdict and
  stay outside every denominator.</p>
</section>`;
  }
  return `<section class="trust trust-coverage">
  <h2 class="nudge-title">${escapeHtml(head)}</h2>
  <p class="body-copy">Evidence coverage is <strong>${f.coverage}%</strong>, under the
  ${COVERAGE_FLOOR_PROVISIONAL}% floor: ${plural(f.unverified)} could not be verified by any
  lane available here. They are shown, and excluded from every denominator — an
  unperformed check is never a verdict.</p>
</section>`;
}

/** The local-lane provenance block: exactly what the SSH signature proves. */
export function renderLocalTrustSection(r: ScanRecord, lt: TrustInfo, primary: boolean): string {
  const recordHref = href(`${repoSlugPath(r)}${LOCAL_RECORD_PUBLISHED}`);
  const sigHref = href(`${repoSlugPath(r)}${LOCAL_SIGNATURE_PUBLISHED}`);
  const n = lt.resolved.length;
  const contribution = primary
    ? `<p class="body-copy">There is no repository-observable scan for this listing, so every
  control outside the local-environment class stays <strong>unverified</strong> — a
  workstation record cannot speak for them.</p>`
    : `<p class="body-copy">It contributed <strong>${plural(n)}</strong>${
        n ? `: ${lt.resolved.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}` : ""
      }. Every other class on this page comes from the repository-observable
  record above; a local scan may never overturn one, and may never widen the
  scope it is measured against.</p>`;
  return `<section class="trust trust-local">
  <h2 class="nudge-title">Local scan — signature verified</h2>
  <p class="body-copy">A maintainer ran sscsb on their own machine and signed the record
  with their git signing key. The directory verified that detached SSH signature with
  <code>ssh-keygen -Y verify</code> against
  <code>.sscsb/policy/allowed_signers</code> <strong>fetched from this repository</strong> at
  commit <code>${escapeHtml((lt.commit ?? "").slice(0, 12))}</code> — committed content the
  submitter does not supply. The verifying principal was
  <code>${escapeHtml(lt.signer ?? "")}</code>${
    lt.key_fingerprint ? ` (<code>${escapeHtml(lt.key_fingerprint)}</code>)` : ""
  }${lt.verified_at ? ` on ${escapeHtml(lt.verified_at.slice(0, 10))}` : ""}.</p>
  <p class="body-copy"><strong>What that proves, exactly:</strong> a holder of a key this
  repository commits as an approved signer asserts this result at that commit. Nothing
  more. It is attributable and auditable, and it is <em>weaker</em> than an authenticated
  scan, which proves the repository's own CI produced the record.</p>
  ${contribution}
  <p class="body-copy">Re-verify it yourself: <a href="${recordHref}">${LOCAL_RECORD_PUBLISHED}</a> ·
  <a href="${sigHref}">detached signature</a></p>
  <pre><code>curl -sO https://raw.githubusercontent.com/${escapeHtml(r.repo.owner)}/${escapeHtml(
    r.repo.name,
  )}/${escapeHtml(lt.commit ?? "")}/.sscsb/policy/allowed_signers
ssh-keygen -Y verify -f allowed_signers \\
  -I "${escapeHtml(lt.signer ?? "")}" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PUBLISHED} &lt; ${LOCAL_RECORD_PUBLISHED}</code></pre>
</section>`;
}

/** The provenance section of a detail page: what lane, and what was proven. */
export function renderTrustSection(
  r: ScanRecord,
  t: TrustInfo | undefined,
  lt?: TrustInfo,
): string {
  const kind: TrustKind = resolveTrustKind(r, t, lt);
  if (kind === "local" && lt) return renderLocalTrustSection(r, lt, true);
  if (kind === "verified" && t) {
    const bundleHref = href(`${repoSlugPath(r)}scan-record.json.sigstore.json`);
    const recordHref = href(`${repoSlugPath(r)}scan-record.json`);
    return `<section class="trust trust-verified">
  <h2 class="nudge-title">Authenticated scan — signature verified</h2>
  <p class="body-copy">This record was produced in the repository's <strong>own CI</strong> and
  keyless-signed there. Before listing it, the directory verified the Sigstore
  bundle against the certificate identity
  <code>${escapeHtml(t.identity ?? "")}</code>${
    t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""}.
  The repository, workflow path, and default branch are burned into that certificate
  by GitHub's OIDC issuer, not asserted by the record.</p>
  <p class="body-copy">Re-verify it yourself: <a href="${recordHref}">scan-record.json</a> ·
  <a href="${bundleHref}">signature bundle</a></p>
  <pre><code>cosign verify-blob scan-record.json --bundle scan-record.json.sigstore.json \\
  --certificate-identity "${escapeHtml(t.identity ?? "")}" \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com</code></pre>
</section>`;
  }
  if (kind === "unsigned-action") {
    return `<section class="trust trust-unsigned">
  <h2 class="nudge-title">Authenticated scan — unsigned</h2>
  <p class="body-copy">This record was submitted from the repository's own CI but carried
  <strong>no verified signature</strong>, so the directory can only list it as an
  unverified claim. Granting the scan job <code>id-token: write</code> lets
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next
  record under the workflow's own identity; no secret is involved.</p>
</section>`;
  }
  return `<section class="nudge">
  <h2 class="nudge-title">Improve this score</h2>
  <p class="body-copy">This is an <strong>external</strong> scan — controls that live in the
  development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Repo maintainers can publish an <strong>authenticated</strong>
  scan by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
  <div class="btn-row">
    <a class="btn" href="${escapeHtml(nudgeIssueUrl(r))}">Suggest it to the maintainers</a>
    <a class="btn-outline" href="${ACTION_REPO_URL}#quickstart">Install it yourself (PR)</a>
  </div>
</section>`;
}

export function renderRepoDetail(r: ScanRecord, t?: TrustInfo, lt?: TrustInfo): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
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
  <td class="outcome">${escapeHtml(label)} ${raw}</td>
  <td>${reason}${msgs}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<nav class="crumbs"><a href="${href("directory/")}">← Directory</a></nav>
<div class="repo-hero">
  ${gradeBadge(r.score, { size: 74, rotationKey: slug })}
  <h1 class="repo-title">${escapeHtml(slug)}</h1>
  ${laneBadge(t, r, lt)}${localOverlayBadge(lt)}
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
<p class="score-line"><strong>${
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`
  }</strong> of the answered checks passed · <strong>${
    r.score.evidence_coverage_percent
  }%</strong> of the checks were answered at all${
    r.score.provisional
      ? ` · <em class="prov-flag">provisional</em> ${define("provisional")}`
      : ""
  }</p>
${phaseBars(r.score)}
${exposurePanel(href, r)}
${renderTrustSection(r, t, lt)}
${lt && resolveTrustKind(r, t, lt) !== "local" ? renderLocalTrustSection(r, lt, false) : ""}
${renderFactsSection(factsFor(r), r.score)}
${renderCoverageSection(r, facts)}
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
  return page({ title: `${slug} — Scan`, body, active: "directory" });
}
