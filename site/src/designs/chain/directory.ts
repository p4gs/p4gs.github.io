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
import type { ScanRecord } from "../../schema";
import { resolveTrustKind, trustKeyOf, type TrustInfo, type TrustKind } from "../../trust";
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
import { escapeHtml, href, page } from "./layout";

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
    default:
      return `<span class="lane lane-ext" title="Outside-in scan by the directory; GitHub-side checks ran with public-only visibility">external</span>`;
  }
}

function metaLine(r: ScanRecord): string {
  const overall =
    r.score.overall_percent === null ? "no evidence" : `${r.score.overall_percent}%`;
  const prov = r.score.provisional ? ` · <em class="prov">provisional</em>` : "";
  return `${overall} overall · ${r.score.evidence_coverage_percent}% coverage${prov}`;
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
  const cards = sorted
    .map((r) => {
      const slug = `${r.repo.owner}/${r.repo.name}`;
      const kind = resolveTrustKind(r, trust.get(trustKeyOf(r)));
      const desc = r.repo.description
        ? `<p class="rc-desc">${escapeHtml(r.repo.description)}</p>`
        : `<p class="rc-desc rc-desc-empty">No description published.</p>`;
      return `<tr class="repo-card" data-name="${escapeHtml(slug.toLowerCase())}" data-grade="${escapeHtml(r.score.grade)}" data-lane="${kind}">
<td class="repo-card-in">
  <div class="rc-head">
    <a class="repo-link" href="${href(repoSlugPath(r))}">${escapeHtml(slug)}</a>
    ${gradePill(r.score.grade)}
  </div>
  ${desc}
  ${miniChain(r.score)}
  <div class="rc-meta">${metaLine(r)}</div>
  <div class="rc-foot">${laneChip(kind)}<span class="rc-date mono">${escapeHtml(r.scanned_at.slice(0, 10))}</span></div>
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

function improveCard(r: ScanRecord, t: TrustInfo | undefined, kind: TrustKind): string {
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

export function renderRepoDetail(r: ScanRecord, t?: TrustInfo): string {
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const kind = resolveTrustKind(r, t);
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
  ${laneChip(kind)}
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
${improveCard(r, t, kind)}
${CHAIN_SCRIPT}`;
  return page({ title: `${slug} — Scan`, body, active: "directory" });
}
