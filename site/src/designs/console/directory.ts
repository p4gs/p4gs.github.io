/** Console directory listing + per-repo telemetry detail pages. */
import { ACTION_REPO_URL, SCAN_API_URL, SUBMIT_URL } from "../../config";
import type { ScanRecord } from "../../schema";
import { lookupTrust, resolveTrustKind, type TrustInfo, type TrustKind } from "../../trust";
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
  external: `<span class="lane lane-ext" title="Outside-in scan by the directory; GitHub-side checks ran with public-only visibility">external</span>`,
};

function laneChip(kind: TrustKind): string {
  return LANE_CHIP[kind];
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const prov = r.score.provisional ? ` · <em class="prov-flag">provisional</em>` : "";
  return `${overall} · coverage ${r.score.evidence_coverage_percent}%${prov}`;
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
      const kind = resolveTrustKind(r, lookupTrust(ctx.trust, r));
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}">
  <td class="grade-cell">${gradeBadge(r.score, "sm")}</td>
  <td class="repo-cell"><a class="repo-name" href="${ctx.h(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      <span class="desc">${escapeHtml(r.repo.description)}</span>
      <span class="meta-line">${metaLine(r)}</span></td>
  <td class="bars-cell">${compactMeters(r.score)}</td>
  <td class="lane-cell">${laneChip(kind)}</td>
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

/** Provenance panel: which lane, and what was proven. One block per state. */
function provenance(r: ScanRecord, t: TrustInfo | undefined, kind: TrustKind, ctx: DesignCtx): string {
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
  const kind = resolveTrustKind(r, t);
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
  ${laneChip(kind)}
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
${provenance(r, t, kind, ctx)}
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
