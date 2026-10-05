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
import { CONTROL_COUNT } from "../../reclassify";
import { incompleteNoteFor, recentlyScanned, topRated } from "../../exemplars";

const GRADE_ORDER: Readonly<Record<string, number>> = {
  "A+": 0, A: 1, B: 2, C: 3, D: 4, F: 5, NA: 6,
};

/** The band of figures. Numbers the reader can hold, captions in plain words. */
const FIGURES = [
  figure(String(CONTROL_COUNT), "checks, each answered or left unanswered"),
  figure("3", "ways a scan can be run"),
  // NOT hot. The design's own grade scale makes A+ ink and reserves the accent
  // for F, so a red A+ here and an ink A+ on the slab beside it read as two
  // different states — and it spends the one accent on a definition.
  figure("A+", "means every answered check passed"),
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
  // A grade set this large without its provisional line is the strongest claim
  // on the page making the weakest one silently.
  const incomplete = incompleteNoteFor(r.score);
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
  <!-- The board's six bars have visibly hatched tails beside the number 100%,
       and the home page printed no key at all — the directory and the repo
       sheet both print one. A first-time reader met a one-fifth-striped bar
       labelled 100% with nothing on screen to decode it. Plain words only:
       this page may not use the site's vocabulary. -->
  <p class="slab-key">
    <span class="key-item"><span class="key-swatch key-pass"></span>passed</span>
    <span class="key-item"><span class="key-swatch key-fail"></span>did not pass</span>
    <span class="key-item"><span class="key-swatch key-unv"></span>nobody could check this</span>
  </p>
  ${incomplete ? `<p class="slab-line">${escapeHtml(incomplete)}</p>` : ""}
  <p class="slab-foot">Scanned ${escapeHtml(r.scanned_at.slice(0, 10))} ·
  <a href="${ctx.h(path)}">read the full record</a></p>
</aside>`;
}

/**
 * ONE PANEL ON A PHONE, AND IT IS A REAL PANEL.
 *
 * When the board is too small for BOTH "Top rated" and "Recently scanned",
 * they render as two dashed waiting boxes back to back. At desk width they sit
 * side by side under one band and read as a composed pair. On a phone they
 * stacked into ~530px saying "not enough data yet" twice: two eyebrows, two
 * Anton headings, two dashed boxes, two identical "Browse every listing" links.
 *
 * The previous fix was a stylesheet one — clip-path the second panel's eyebrow
 * and heading away and weld the boxes together. It made the two widths disagree
 * about what the page CONTAINS: a sighted phone reader got one heading followed
 * by two unrelated paragraphs, the second of them ("…ordering them by date
 * would be ordering noise") sitting under the heading TOP RATED, where it is a
 * non-sequitur; a screen-reader user got the correct two-section structure. The
 * stylesheet's own comment conceded that visually hiding the apparatus was all
 * CSS could do about it, and that suppressing the panel was the template's call.
 *
 * This is the template making that call. Below 760px the pair is replaced by a
 * SINGLE honest panel: one eyebrow, one heading that says the real thing, both
 * waiting sentences — they name different real counts, so neither is dropped —
 * and one way out. Exactly one of the two structures is in the document at any
 * width (`display: none` removes the other from the accessibility tree too), so
 * what a phone shows and what a screen reader hears are the same page.
 *
 * It renders only when BOTH panels are waiting, because that is the only state
 * in which the duplication exists. As soon as either has content the pair is a
 * pair again and the desktop arrangement is right at every width.
 */
function mergedWaitingPanel(records: ScanRecord[], ctx: DesignCtx): string {
  const a = topRated(records, ctx.trust, ctx.localTrust);
  const b = recentlyScanned(records, ctx.trust, ctx.localTrust);
  if (a.ready || b.ready) return "";
  return `<section class="hp-panel hp-panel-merged" id="board-so-far" aria-labelledby="board-so-far-h">
  <p class="hp-panel-eyebrow">The board so far</p>
  <h2 class="hp-panel-title" id="board-so-far-h">Not enough listings yet</h2>
  <div class="hp-waiting">
    <p class="hp-waiting-copy">${escapeHtml(a.waitingFor)}</p>
    <p class="hp-waiting-copy">${escapeHtml(b.waitingFor)}</p>
    <a class="hp-waiting-link" href="${ctx.h("directory/")}">Browse every listing →</a>
  </div>
</section>`;
}

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const n = records.length;
  const body = `
<section class="poster">
  <div class="poster-lead">
    <p class="kicker">The public record</p>
    <!-- No hard break: a 13ch measure plus text-wrap:balance breaks this where
         the clause breaks at every width. The <br> set it as a two-word second
         line at desk width and orphaned "PASS." on a phone. -->
    <h1 class="banner">A check that could not run is not a pass.</h1>
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
${mergedWaitingPanel(records, ctx)}
${exemplarPanels(ctx.h, records, ctx.trust, ctx.localTrust)}
</div>

${threatStrip(ctx.h)}

<section class="lanes" aria-labelledby="lanes-h">
  <p class="kicker">Who runs it</p>
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
