/**
 * Factory home — the aperture, five black beats, and four white chapters.
 *
 * The order is the reference's: a full-viewport opening panel whose doors close
 * as you scroll, running straight into a black block that reads as the same
 * surface (so the white→black edge is never seen as a cut), then a hard cut
 * back to white under a sticky pill nav, then the chapters.
 *
 * PLAIN LANGUAGE IS A CONTRACT HERE. The home page uses none of the site's
 * vocabulary — not one of the seventeen retired terms — and `test/home.test.ts`
 * fails if one comes back. Every control id it shows sits inside `<code>`,
 * which is both correct (it IS code) and what keeps `sast`, `sbom` and
 * `harden-runner` out of the page's prose.
 *
 * THE APERTURE'S TIMING IS A LAYOUT FACT. Its progress equals
 * `scrollY / innerHeight` only while the opening panel is exactly one viewport
 * minus the header. Nothing may be added above it, and nothing may push it
 * taller — which is why the search control sits INSIDE the panel rather than
 * in a band of its own.
 */
import type { ScanRecord } from "../../schema";
import { exemplarPanels, searchControl, threatStrip } from "../home-shared";
import { CONTROL_COUNT, CONTROL_REGISTRY } from "../../reclassify";
import { PHASES } from "../../scoring";
import { ATTACK_CLASSES, EXPOSURE_CAVEAT } from "../../threats";
import { ACTION_REPO_URL } from "../../config";
import type { DesignCtx } from "../types";
import {
  attackList,
  barChart,
  chapterNav,
  explorer,
  loopFigure,
  mazeFigure,
  metric,
  nestedDiagram,
  overviewDiagram,
  triangleFigure,
  type Chapter,
} from "./components";
import { escapeHtml, page } from "./layout";

const CHAPTERS: readonly Chapter[] = [
  { id: "ch-record", no: "01", label: "The record" },
  { id: "ch-loop", no: "02", label: "The loop" },
  { id: "ch-checks", no: "03", label: "Every check" },
  { id: "ch-yours", no: "04", label: "Scan your own" },
];

/**
 * The hero's search control, with the "already listed" chips taken off it.
 *
 * The opening panel holds ONE control on the page axis — kicker, headline, one
 * context line, one pill input, the arrow — because that is the reference's
 * grammar and because the chips were measured doing real damage: at 1440 they
 * wrapped to a second row and pushed the panel 13px over one viewport (which
 * moves the whole aperture range down the page), and at 390 they descended as a
 * three-step staircase, flush left under a centred headline.
 *
 * The chips are not lost. Every repository they linked is on the directory, and
 * chapter 01's three exemplar panels read the same listings off the same data.
 * Stripping them from the shared control's OUTPUT rather than re-implementing
 * the control keeps `home-shared.ts` the single source of the ids `filter.js`
 * binds — `#dir-filter`, `#dir-found`, `#dir-scan`, `#dir-index` — which is the
 * one part of this markup a design may not get creative with.
 */
function heroSearch(h: (p: string) => string, records: ScanRecord[]): string {
  const full = searchControl(h, records, {
    label: "Find a repository — or ask for one to be scanned",
    placeholder: "owner/repo",
    scanCopy:
      "Not listed yet. Ask for a scan — a person reviews every result before it appears.",
  });
  const stripped = full.replace(/\n?\s*<p class="hp-chips">[\s\S]*?<\/p>/, "");
  // Fail loudly rather than silently shipping the chips if the shared control's
  // markup moves under us. Only meaningful when there is a listing to chip.
  if (records.length > 0 && stripped === full) {
    throw new Error("factory: the hero search control no longer carries an hp-chips block");
  }
  return stripped;
}

/** The hero. One viewport of white, one of black, and the doors between them. */
function aperture(records: ScanRecord[], ctx: DesignCtx): string {
  return `<section class="fy-aperture" aria-label="What this directory is">
  <div class="fy-track" data-window-mode="scroll" data-window-driver="css" data-window-in-view="true">
    <div class="fy-stage">
      <div class="fy-opening">
        <div class="fy-opening-in">
          <p class="fy-kicker">Supply-chain security &middot; scanned in public</p>
          <!-- THE SPACE BEFORE THE BREAK IS LOAD-BEARING. At >=768 the <br> sets
               the two-line headline the reference uses; at <=767 the stylesheet
               hides it and the two text nodes close up — measured at 390 as
               "repositorycan". A trailing space is trimmed at the end of a
               wrapped line, so it costs nothing on desktop and is the whole word
               boundary on a phone. -->
          <h1 class="fy-headline">What each repository <br>can prove</h1>
          <p class="fy-context">Every listing here is a public record of one scan of one commit.</p>
          ${heroSearch(ctx.h, records)}
          <p class="fy-controls"><a class="fy-continue" href="#evidence" aria-label="Read on">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true" focusable="false"><path d="M12 5v14M6 13l6 6 6-6"></path></svg>
          </a></p>
        </div>
      </div>
      <div class="fy-response">
        <div class="fy-response-left">
          <p class="fy-response-headline">&mdash; and what nobody could check.</p>
          <p class="fy-response-line">An unperformed check is never a verdict. It is shown,
          and never counted.</p>
        </div>
        <div class="fy-response-right" aria-hidden="true">
          <p class="fy-response-headline">&mdash; and what nobody could check.</p>
          <p class="fy-response-line">An unperformed check is never a verdict. It is shown,
          and never counted.</p>
        </div>
      </div>
      <div class="fy-bars" aria-hidden="true">
        <div class="fy-bar-left"></div>
        <div class="fy-bar-right"></div>
      </div>
    </div>
  </div>
</section>`;
}

/**
 * The five black beats.
 *
 * Static, hard cuts, 128px of air between them — except the first, which opens
 * at 80 because the aperture's black end state is already on screen above it.
 * Nothing here fades in on scroll. Two of the five carry a scroll-drawn figure,
 * and that is the whole motion budget for this block.
 */
function blackBlock(records: ScanRecord[], ctx: DesignCtx): string {
  const localOnly = Object.values(CONTROL_REGISTRY).filter((m) => m.cls === "C").length;
  const n = records.length;
  return `<div class="fy-dark">
  <section class="fy-beat fy-beat-first" id="evidence" aria-labelledby="evidence-h">
    <div class="fy-wrapper">
      <h2 id="evidence-h">A check that could not run is never a pass.</h2>
      <p class="fy-beat-body">Every listing says what the scan saw, what it could not see,
      and who ran it. The second list is the one nobody usually publishes.</p>
      <blockquote class="fy-pullquote">${escapeHtml(EXPOSURE_CAVEAT)}</blockquote>
      <div class="fy-metrics">
        ${metric(String(CONTROL_COUNT), "checks in the standard set")}
        ${metric(String(localOnly), "of them only a maintainer's own machine can answer")}
        ${metric(String(n), n === 1 ? "repository on the board" : "repositories on the board")}
        ${metric(String(PHASES.length), `phases the ${CONTROL_COUNT} checks are grouped into`)}
        ${metric(String(ATTACK_CLASSES.length), "attack groups the checks are written against")}
      </div>
    </div>
  </section>

  <section class="fy-beat" id="discovery" aria-label="Checks per attack group">
    <div class="fy-wrapper">
      ${barChart()}
    </div>
  </section>

  <section class="fy-beat" id="chaining" aria-labelledby="chaining-h">
    <div class="fy-wrapper">
      <div class="fy-trace-grid">
        <div class="fy-trace-copy">
          <h2 id="chaining-h">One record covers the whole lifecycle.</h2>
          <p class="fy-beat-body">Code moves from a commit to a published package. The
          ${CONTROL_COUNT} checks sit along that road in ${PHASES.length} groups, and one scan
          reads all ${PHASES.length} at once &mdash; including the ones it could not answer.
          (The tool's own stage model is T1&ndash;T7; this site groups the checks into
          ${PHASES.length} phases.)</p>
        </div>
        ${mazeFigure()}
      </div>
    </div>
  </section>

  <section class="fy-beat" id="lanes" aria-labelledby="lanes-h">
    <div class="fy-wrapper">
      <div class="fy-trace-grid">
        ${triangleFigure()}
        <div class="fy-trace-copy">
          <h2 id="lanes-h">Three ways a scan gets run &mdash; and the third is
          the one only you can do.</h2>
          <p class="fy-beat-body">Two of the three read things anyone can read. The third reads
          a developer's own machine. No scan from outside reaches there, so a maintainer answers
          those checks by running the scan and signing it.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="fy-beat fy-beat-centred" id="ways-in" aria-labelledby="ways-in-h">
    <div class="fy-wrapper">
      <h2 id="ways-in-h">Nine ways in</h2>
      <p class="fy-beat-body">Each group below is a thing attackers have actually done. Open one
      to see which checks defend it, and one time it happened.</p>
      ${attackList(ctx.h)}
    </div>
  </section>
</div>`;
}

/** Chapter 01 — what one listing holds, as two diagrams and three panels. */
function chapterRecord(records: ScanRecord[], ctx: DesignCtx): string {
  return `<section class="fy-chapter" id="ch-record" aria-labelledby="ch-record-h">
  <div class="fy-wrapper">
    <div class="fy-chapter-head">
      <p class="fy-chapter-num">01 &mdash; The record</p>
      <h2 id="ch-record-h">What a listing holds</h2>
      <p class="fy-chapter-lead">One scan, one commit, one date. Every check it ran, every check
      it could not, and the evidence behind both.</p>
    </div>
  </div>
  <div class="fy-wrapper">
    <h3 class="fy-section-sub fy-vh">Who can see what</h3>
    ${overviewDiagram(ctx.h)}
  </div>
  <div class="fy-mediaframe" style="margin-top:56px">
    ${nestedDiagram({
      scope: "home",
      href: ctx.h("methodology/#every-check"),
      title: "What one scan checks",
      titleTip:
        "The standard set, grouped by the phase it belongs to. Each chip is one check; open it to read the question it answers.",
    })}
  </div>
  <div class="fy-wrapper">
${exemplarPanels(ctx.h, records, ctx.trust, ctx.localTrust)}
  </div>
</section>`;
}

/** Chapter 02 — the loop that produces a listing and keeps it current. */
function chapterLoop(ctx: DesignCtx): string {
  return `<section class="fy-chapter" id="ch-loop" aria-labelledby="ch-loop-h">
  <div class="fy-wrapper">
    <div class="fy-chapter-head">
      <p class="fy-chapter-num">02 &mdash; The loop</p>
      <h2 id="ch-loop-h">How a listing is made</h2>
      <p class="fy-chapter-lead">Five steps, and one record in the middle of them &mdash; signed
      when the lane can sign it. A scan is a snapshot, so the loop runs again rather than editing
      what it said last time.</p>
    </div>
    ${loopFigure()}
    <p class="fy-body" style="margin-inline:auto;text-align:center">Nobody has to wait for us.
    <a href="${ACTION_REPO_URL}">Run it in your own build</a>, or
    <a href="${ctx.h("methodology/#local")}">on your own machine</a>, and sign the result.</p>
  </div>
</section>`;
}

/** Chapter 03 — every check, by phase. */
function chapterChecks(ctx: DesignCtx): string {
  return `<section class="fy-chapter" id="ch-checks" aria-labelledby="ch-checks-h">
  <div class="fy-wrapper">
    <div class="fy-chapter-head">
      <p class="fy-chapter-num">03 &mdash; Every check</p>
      <h2 id="ch-checks-h">All ${CONTROL_COUNT}, as questions</h2>
      <p class="fy-chapter-lead">Pick a phase. Every check in it is a card, and every card is a
      question you can answer yes or no.</p>
    </div>
  </div>
  <!-- THE FLOW TAKES THE MEDIA FRAME, not the prose wrap. The reference's own
       viewport is 1376 wide, and at 1120 the checks column is too narrow to
       hold two card columns — which makes the middle band twice as tall as it
       needs to be and pushes the Inputs and Record columns, which centre
       against it, far down the page. -->
  <div class="fy-mediaframe">
    ${explorer(ctx.h)}
  </div>
</section>`;
}

/** Chapter 04 — the three ways to get a listing of your own. */
function chapterYours(ctx: DesignCtx): string {
  return `<section class="fy-chapter" id="ch-yours" aria-labelledby="ch-yours-h">
  <div class="fy-wrapper">
    <div class="fy-chapter-head">
      <p class="fy-chapter-num">04 &mdash; Scan your own</p>
      <h2 id="ch-yours-h">Three ways to start</h2>
      <p class="fy-chapter-lead">They see different amounts, and the page always says which one
      produced a listing.</p>
    </div>
    <div class="fy-ov-group" style="margin-top:40px">
      <div class="fy-ov-panel">
        <h4>Run it in your build</h4>
        <p>The scan runs in your own CI and signs the record there. The signature proves which
        build made it.</p>
        <p><a class="fy-arrow-link" href="${ACTION_REPO_URL}#quickstart">Install the Action &rarr;</a></p>
      </div>
      <div class="fy-ov-panel">
        <h4>Run it on your machine</h4>
        <p>Some checks describe a developer's laptop. You are the only one who can answer those.
        Sign the result and send it in.</p>
        <p><a class="fy-arrow-link" href="${ctx.h("methodology/#local")}">How that is checked &rarr;</a></p>
      </div>
      <div class="fy-ov-panel">
        <h4>Ask for a scan</h4>
        <p>Anyone can ask for any public repository to be read from outside. A person reviews
        the result before it appears.</p>
        <p><a class="fy-arrow-link" href="${ctx.h("directory/#dir-filter")}">Search, or request one &rarr;</a></p>
      </div>
    </div>
  </div>
</section>`;
}

export function renderHome(records: ScanRecord[], ctx: DesignCtx): string {
  const body = `${aperture(records, ctx)}
${blackBlock(records, ctx)}
${chapterNav(CHAPTERS)}
${chapterRecord(records, ctx)}
${chapterLoop(ctx)}
${chapterChecks(ctx)}
${chapterYours(ctx)}
<div class="fy-wrapper">
${threatStrip(ctx.h)}
</div>`;
  return page(ctx, { title: "SSCS Bootstrapper", body, flush: true });
}
