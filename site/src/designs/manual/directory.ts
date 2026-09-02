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
import { ACTION_REPO_URL, SCAN_API_URL, SITE_REPO_URL, SUBMIT_URL } from "../../config";
import type { ScanRecord } from "../../schema";
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
 * Which lane produced the record. Authenticated scans run in the target
 * repository's own CI, so their workflow_run_url lives outside this site's
 * repo; external scans run in this repo's directory-scan workflow.
 */
function scanLane(r: ScanRecord): "auth" | "external" {
  return r.scanner.workflow_run_url.startsWith(`${SITE_REPO_URL}/`) ? "external" : "auth";
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}% overall`;
  const prov = r.score.provisional ? ` · <em>provisional</em>` : "";
  return `${overall} · coverage ${r.score.evidence_coverage_percent}%${prov} · scanned ${escapeHtml(
    r.scanned_at.slice(0, 10),
  )} · sscsb ${escapeHtml(r.scanner.sscsb_version)}`;
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
      const lane =
        scanLane(r) === "auth"
          ? `<span class="entry-lane entry-lane-auth">authenticated</span>`
          : `<span class="entry-lane">external scan</span>`;
      const desc = r.repo.description
        ? `<p class="entry-desc">${escapeHtml(r.repo.description)}</p>`
        : "";
      return `<tr data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}">
  <td class="entry-main">
    <div class="entry-head">
      <a class="entry-name" href="${ctx.h(repoSlugPath(r))}">${escapeHtml(slug)}</a>
      ${lane}
    </div>
    ${desc}
    <p class="entry-meta">${metaLine(r)}</p>
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
  grades A+–F per the methodology, <em>NA</em> = insufficient evidence, <em>provisional</em> = coverage under 75%.</p>
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

/** The closing editorial note: honest about the lane the record came from. */
function closingNote(r: ScanRecord): string {
  if (scanLane(r) === "external") {
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
  return `<section class="note">
  <h2 class="note-title">About this record</h2>
  <p class="note-copy">This is an <strong>authenticated</strong> scan — published from the
  repository's own CI by the <a href="${ACTION_REPO_URL}">sscsb-action</a>, through the
  same reviewed gate as every listing. Controls still marked unverified live in the
  development environment, which no CI scan can observe; that is a limit of the
  method, stated rather than hidden.</p>
  <div class="btn-row">
    <a class="btn-fill" href="${escapeHtml(r.scanner.workflow_run_url)}">View the scan run</a>
    <a class="btn-line" href="${ACTION_REPO_URL}">About the action</a>
  </div>
</section>`;
}

export function renderRepoDetail(r: ScanRecord, ctx: DesignCtx): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
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
${closingNote(r)}`;
  return page(ctx, { title: `${slug} — Scan`, body });
}
