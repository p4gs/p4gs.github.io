/** Directory listing + per-repo detail pages. */
import { ACTION_REPO_URL, SITE_REPO_URL, SUBMIT_URL } from "../config";
import { recordFilename, type ScanRecord } from "../schema";
import { trustKind, type TrustInfo, type TrustKind } from "../trust";
import { gradeBadge, PHASE_NAMES, phaseBars } from "./components";
import { escapeHtml, href, page } from "./layout";

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
  return r.scanner.workflow_run_url.startsWith(`${SITE_REPO_URL}/`) ? "external" : "auth";
}

function trustKey(r: ScanRecord): string {
  return recordFilename(r.repo.owner, r.repo.name).replace(/\.json$/, "");
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
export function laneBadge(t: TrustInfo | undefined, r?: ScanRecord): string {
  const kind: TrustKind = t
    ? trustKind(t)
    : r && scanLane(r) === "auth"
      ? "unsigned-action"
      : "external";
  const l = LANE_LABEL[kind];
  return `<span class="lane lane-${kind}" title="${escapeHtml(l.title)}">${escapeHtml(l.text)}</span>`;
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const prov = r.score.provisional ? ` · <em class="prov-flag">provisional</em>` : "";
  return `${overall} · coverage ${r.score.evidence_coverage_percent}%${prov}`;
}

export function renderDirectory(
  records: ScanRecord[],
  trust: ReadonlyMap<string, TrustInfo> = new Map(),
): string {
  const sorted = [...records].sort((a, b) => {
    const g = (GRADE_ORDER[a.score.grade] ?? 9) - (GRADE_ORDER[b.score.grade] ?? 9);
    if (g !== 0) return g;
    return b.score.evidence_coverage_percent - a.score.evidence_coverage_percent;
  });
  const rows = sorted
    .map((r) => {
      const slug = `${r.repo.owner}/${r.repo.name}`;
      const t = trust.get(trustKey(r));
      const kind = t ? trustKind(t) : scanLane(r) === "auth" ? "unsigned-action" : "external";
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${escapeHtml(kind)}">
  <td class="seal-cell">${gradeBadge(r.score, { rotationKey: slug })}</td>
  <td class="repo-cell"><a class="repo-name" href="${href(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      <span class="desc">${escapeHtml(r.repo.description)}</span>
      <span class="meta-line">${metaLine(r)}</span></td>
  <td class="bars-cell">${phaseBars(r.score, { compact: true })}</td>
  <td class="lane-cell">${laneBadge(t, r)}</td>
  <td class="date-cell">${escapeHtml(r.scanned_at.slice(0, 10))}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<div class="page-head">
  <div class="page-head-copy">
    <p class="eyebrow">ledger · public record</p>
    <h1 class="page-title">Scan directory</h1>
    <p class="body-copy">Repositories scanned with sscsb, scored by the
    <a href="${href("methodology/")}">published methodology</a>. Every listing passed
    a maintainer's review before appearing here. <strong>✓ verified</strong> listings
    were produced in the repository's own CI and cryptographically verified against
    its workflow identity (<a href="${href("methodology/#trust")}">how</a>).</p>
  </div>
  <a class="btn" href="${SUBMIT_URL}">Submit a repository</a>
</div>
<div class="dir-controls">
  <input type="search" id="dir-filter" placeholder="⌕ filter by owner/repo…" aria-label="Filter repositories">
</div>
<div class="table-scroll">
<table class="directory">
  <thead><tr><th>Seal</th><th>Repository</th><th>Phase coverage</th><th>Lane</th><th>Scanned</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
</div>
<div class="key-row">
  <span class="key-label">KEY</span>
  <span class="key-item"><span class="key-swatch key-pass"></span>pass</span>
  <span class="key-item"><span class="key-swatch key-fail"></span>fail / gap</span>
  <span class="key-item"><span class="key-swatch hatch"></span>unverified — outside every denominator</span>
</div>
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

/** The provenance section of a detail page: what lane, and what was proven. */
export function renderTrustSection(r: ScanRecord, t: TrustInfo | undefined): string {
  const kind: TrustKind = t
    ? trustKind(t)
    : scanLane(r) === "auth"
      ? "unsigned-action"
      : "external";
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
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""} — the
  repository, workflow path, and default branch are burned into that certificate
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

export function renderRepoDetail(r: ScanRecord, t?: TrustInfo): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
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
  ${laneBadge(t, r)}
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
${phaseBars(r.score)}
${renderTrustSection(r, t)}
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
