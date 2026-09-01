/** Directory listing + per-repo detail pages. */
import { ACTION_REPO_URL, SUBMIT_URL } from "../config";
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
    title: "Authenticated-lane record submitted without a signature — an unverified claim",
  },
  external: {
    text: "external",
    title: "Outside-in scan by the directory; GitHub-side checks ran with public-only visibility",
  },
};

/** Small lane marker used in the listing and detail header. */
export function laneBadge(t: TrustInfo | undefined): string {
  const kind = trustKind(t);
  const l = LANE_LABEL[kind];
  return `<span class="lane lane-${kind}" title="${escapeHtml(l.title)}">${escapeHtml(l.text)}</span>`;
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
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${escapeHtml(trustKind(t))}">
  <td><a href="${href(repoSlugPath(r))}">${escapeHtml(slug)}</a><br>
      <span class="desc">${escapeHtml(r.repo.description)}</span></td>
  <td class="grade-cell">${gradeBadge(r.score)}</td>
  <td class="bars-cell">${phaseBars(r.score)}</td>
  <td class="lane-cell">${laneBadge(t)}</td>
  <td class="date-cell">${escapeHtml(r.scanned_at.slice(0, 10))}</td>
</tr>`;
    })
    .join("\n");
  const body = `
<h1>Directory</h1>
<p>Public repositories scanned with sscsb, scored per the
<a href="${href("methodology/")}">published methodology</a>.
<a href="${SUBMIT_URL}">Submit a repository</a> — scans run automatically; a
maintainer reviews every listing before it appears here. <strong>✓ verified</strong>
listings were produced in the repository's own CI and cryptographically
verified against its workflow identity (<a href="${href("methodology/#trust")}">how</a>).</p>
<div class="dir-controls">
  <input type="search" id="dir-filter" placeholder="Filter by owner/repo…" aria-label="Filter repositories">
</div>
<table class="directory">
  <thead><tr><th>Repository</th><th>Grade</th><th>Phase coverage</th><th>Lane</th><th>Scanned</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
<script src="${href("filter.js")}" defer></script>`;
  return page({ title: "Scan Directory", body });
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
  const kind = trustKind(t);
  if (kind === "verified" && t) {
    const bundleHref = href(`${repoSlugPath(r)}scan-record.json.sigstore.json`);
    const recordHref = href(`${repoSlugPath(r)}scan-record.json`);
    return `<section class="trust trust-verified">
  <h2>Authenticated scan — signature verified</h2>
  <p>This record was produced in the repository's <strong>own CI</strong> and
  keyless-signed there. Before listing it, the directory verified the Sigstore
  bundle against the certificate identity
  <code>${escapeHtml(t.identity ?? "")}</code>${
    t.commit ? ` bound to commit <code>${escapeHtml(t.commit.slice(0, 12))}</code>` : ""
  }${t.verified_at ? ` on ${escapeHtml(t.verified_at.slice(0, 10))}` : ""} — the
  repository, workflow path, and default branch are burned into that certificate
  by GitHub's OIDC issuer, not asserted by the record.</p>
  <p>Re-verify it yourself: <a href="${recordHref}">scan-record.json</a> ·
  <a href="${bundleHref}">signature bundle</a></p>
  <pre><code>cosign verify-blob scan-record.json --bundle scan-record.json.sigstore.json \\
  --certificate-identity "${escapeHtml(t.identity ?? "")}" \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com</code></pre>
</section>`;
  }
  if (kind === "unsigned-action") {
    return `<section class="trust trust-unsigned">
  <h2>Authenticated scan — unsigned</h2>
  <p>This record was submitted from the repository's own CI but carried
  <strong>no signature</strong>, so the directory can only list it as an
  unverified claim. Granting the scan job <code>id-token: write</code> lets
  <a href="${ACTION_REPO_URL}#signed-records">sscsb-action</a> sign the next
  record under the workflow's own identity; no secret is involved.</p>
</section>`;
  }
  return `<section class="nudge">
  <h2>Improve this score</h2>
  <p>This is an <strong>external</strong> scan — controls that live in the
  development environment show as unverified, and GitHub-side checks ran with
  public-only visibility. Repo maintainers can publish an <strong>authenticated</strong>
  scan by running the <a href="${ACTION_REPO_URL}">sscsb-action</a> in their own CI.</p>
  <p>
    <a class="btn" href="${escapeHtml(nudgeIssueUrl(r))}">Suggest it to the maintainers</a>
    <a class="btn btn-secondary" href="${ACTION_REPO_URL}#quickstart">Install it yourself (PR)</a>
  </p>
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
<h1>${escapeHtml(slug)} ${gradeBadge(r.score)} ${laneBadge(t)}</h1>
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
    r.score.provisional ? " · <em>provisional</em>" : ""
  }</p>
${phaseBars(r.score)}
${renderTrustSection(r, t)}
<h2>All controls</h2>
<p class="transparency-note">Raw sscsb verdicts and every reclassification are shown —
transparency about what was and wasn't verifiable is the product.
Phases: ${Object.entries(PHASE_NAMES)
    .map(([n, name]) => `${n} = ${escapeHtml(name)}`)
    .join(", ")}.</p>
<table class="controls">
  <thead><tr><th>Phase</th><th>Control</th><th>Verdict</th><th>Detail</th></tr></thead>
  <tbody>
${controlRows}
  </tbody>
</table>`;
  return page({ title: `${slug} — Scan`, body });
}
