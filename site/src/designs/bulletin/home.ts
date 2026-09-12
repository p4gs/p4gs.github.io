/**
 * Bulletin home — a broadsheet front page.
 *
 * The lead is a poster: a banner headline across seven columns, the search
 * control under it, and the day's lead listing set as a score slab in the
 * remaining five. Under the fold: a band of oversized figures, the three
 * shared exemplar panels, the attack-class strip, and the three ways a scan
 * gets run, set as ruled columns.
 *
 * PLAIN LANGUAGE IS A CONTRACT HERE. The home page uses none of the site's
 * vocabulary — no "coverage", no "provisional", no tool names. A first-time
 * reader should not have to learn a glossary to read the front page, and
 * `test/home.test.ts` fails if one of those words comes back.
 */
import { ACTION_REPO_URL } from "../../config";
import type { ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import { figure, gradeSlab, phaseRules } from "./components";
import { escapeHtml, page } from "./layout";
import type { DesignCtx } from "../types";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

/** The band of figures. Numbers the reader can hold, captions in plain words. */
const FIGURES = [
  figure("54", "checks, run in six phases"),
  figure("3", "ways a scan can be run"),
  figure("A+", "means every answered check passed", true),
  figure("0", "unanswered checks are counted against anyone"),
].join("\n  ");

/** The lead listing: best grade, then the most checks answered. */
function leadRecord(records: readonly ScanRecord[]): ScanRecord | undefined {
  return [...records].sort((a, b) => {
    const g = (GRADE_ORDER[a.score.grade] ?? 9) - (GRADE_ORDER[b.score.grade] ?? 9);
    if (g !== 0) return g;
    return b.score.evidence_coverage_percent - a.score.evidence_coverage_percent;
  })[0];
}

/**
 * The score slab — the one thing on this page a reader remembers. An oversized
 * grade letter flush against a 2px rule, the two numbers stacked in mono
 * beneath it, and the phase rules under that. Both numbers are named in plain
 * words: what passed, and how much could be answered at all.
 */
function slab(r: ScanRecord | undefined, ctx: DesignCtx): string {
  if (!r) {
    return `<aside class="poster-slab" aria-label="The lead listing">
  <p class="slab-kicker">Nothing scanned yet</p>
  <div class="slab-head">${gradeSlab("NA", "xl")}</div>
  <p class="slab-line">The board is empty. Ask for the first scan above.</p>
</aside>`;
  }
  const slug = `${r.repo.owner}/${r.repo.name}`;
  const path = `directory/${r.repo.owner.toLowerCase()}--${r.repo.name.toLowerCase()}/`;
  const passed =
    r.score.overall_percent === null ? "—" : `${r.score.overall_percent}%`;
  return `<aside class="poster-slab" aria-label="The lead listing">
  <p class="slab-kicker">On the board</p>
  <div class="slab-head">
    ${gradeSlab(r.score.grade, "xl")}
    <a class="slab-repo" href="${ctx.h(path)}">${escapeHtml(slug)}</a>
  </div>
  <dl class="slab-nums">
    <div><dt>Passed</dt><dd>${escapeHtml(passed)}</dd></div>
    <div><dt>Answered</dt><dd>${r.score.evidence_coverage_percent}%</dd></div>
  </dl>
  ${phaseRules(r.score.phases, { short: true })}
  <p class="slab-foot">Scanned ${escapeHtml(r.scanned_at.slice(0, 10))} ·
  <a href="${ctx.h(path)}">read the full record</a></p>
</aside>`;
}

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const n = records.length;
  const body = `
<section class="poster">
  <div class="poster-lead">
    <p class="kicker">The public record</p>
    <!-- The space after <br> is load-bearing: the phone stylesheet hides the
         break, and without it the two clauses render as "not runis not". -->
    <h1 class="banner">A check that could not run<br> is not a pass.</h1>
    <p class="standfirst">Every listing here says what the scan saw, what it could not
    see, and who ran it. A check nobody could answer is shown, and counted for nobody.</p>
    ${searchControl(ctx.h, records, {
      label: "Find a repository — or ask for one to be scanned",
      placeholder: "owner/repo",
      scanCopy:
        "Not on the board yet. Ask for a scan — a person reviews every result before it appears.",
    })}
    <p class="hero-count">${n} ${n === 1 ? "repository" : "repositories"} on the board ·
    <a href="${ctx.h("directory/")}">open the directory</a></p>
  </div>
  ${slab(leadRecord(records), ctx)}
</section>

<section class="figband" aria-label="The board in figures">
  ${FIGURES}
</section>

<div class="hp-panels">
${exemplarPanels(ctx.h, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(ctx.h)}

<section class="lanes" aria-labelledby="lanes-h">
  <h2 class="section-head" id="lanes-h">Three ways a scan gets run</h2>
  <div class="lane-cols">
    <div class="lane-col">
      <p class="lane-num" aria-hidden="true">01</p>
      <h3>From outside</h3>
      <p class="body-copy">Anyone can ask for any public repository to be scanned. The scan
      sees only what anyone can see. It says which checks it could not answer.</p>
      <a class="rule-link" href="${ctx.h("methodology/")}">How scoring works</a>
    </div>
    <div class="lane-col">
      <p class="lane-num" aria-hidden="true">02</p>
      <h3>From your build</h3>
      <p class="body-copy">Run sscsb in your own build and it sees settings an outside scan
      cannot. It then signs the result, so the signature proves where it came from.</p>
      <a class="rule-link rule-link-hot" href="${ACTION_REPO_URL}">Install the Action</a>
    </div>
    <div class="lane-col">
      <p class="lane-num" aria-hidden="true">03</p>
      <h3>From your machine</h3>
      <p class="body-copy">About a dozen checks describe a developer's own laptop. No scan
      reaches there. A maintainer answers them by running the scan and signing it.</p>
      <a class="rule-link" href="${ctx.h("methodology/#local")}">How that is checked</a>
    </div>
  </div>
</section>`;
  return page(ctx, { title: "SSCS Bootstrapper", body });
}
