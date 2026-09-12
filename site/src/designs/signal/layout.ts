/**
 * Signal — shared page chrome.
 *
 * The design's one piece of motion lives here: the header pill morph, taken
 * from cocoindex.io and measured rather than remembered. At rest a full-bleed
 * bar carries the glass and the hairline; past 24px of scroll the bar goes
 * transparent and the INNER element becomes a floating pill that takes the
 * glass, the border and a long-throw shadow with it. Nothing fades — it is one
 * continuous geometric morph of a single element, driven by a class toggle
 * over a CSS transition.
 *
 * Two deliberate departures from the reference:
 *
 *  1. **The header never dissolves.** Xirp evaporates its chrome at ~100px,
 *     which is fine for a five-section landing page and hostile on a page with
 *     a 200-row table: it removes search and navigation exactly when a reader
 *     scrolling the directory needs them. The pill condenses and stays, at
 *     every width. There is no hamburger at any breakpoint.
 *  2. **Reduced motion is honoured.** The morph is a transition, so the shared
 *     `prefers-reduced-motion` block already flattens it to an instant state
 *     change; the class toggle still happens, so the geometry is still correct.
 *
 * All hrefs are ctx-scoped by construction: the build sets the render context
 * per page via setCtx(); outside the build (tests, direct calls) the default
 * keeps BASE_PATH-rooted, switcherless behaviour.
 */
import { ACTION_REPO_URL, BASE_PATH, METHODOLOGY_VERSION, REPO_URL, SITE_HOST_LABEL } from "../../config";
import { lookupFacts, type ListingFacts } from "../../listing";
import type { DesignCtx } from "../types";

let ctx: DesignCtx = {
  prefix: BASE_PATH,
  h: (p: string) => `${BASE_PATH}${p.replace(/^\//, "")}`,
  switcher: "",
  active: "",
};

export function setCtx(next: DesignCtx): void {
  ctx = next;
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Internal link helper — the only sanctioned way to build an internal href. */
export function href(path: string): string {
  return ctx.h(path);
}

/**
 * `<link rel="canonical">` for this page: always the DEFAULT design's URL. The
 * alternate trees publish the same pages, so a crawler should index one copy.
 */
export function canonicalLink(): string {
  return ctx.canonical
    ? `\n<link rel="canonical" href="${escapeHtml(ctx.canonical)}">`
    : "";
}

/**
 * What the evidence merge did for one listing — contradictions, a stale local
 * record, assertions held back awaiting independent observation.
 */
export function factsFor(r: Parameters<typeof lookupFacts>[1]): ListingFacts {
  return lookupFacts(ctx.facts, r);
}

/**
 * Google Fonts: Inter Tight (display), Inter (body and tables), JetBrains Mono
 * (data and identifiers). All three are licensed and on Google Fonts; the
 * proprietary faces the reference sites use are deliberately not attempted.
 */
export const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">`;

/** The wordmark glyph: a signal rising through a hairline baseline. */
const MARK = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 14.5h16"></path><path d="M4.5 11.5V13"></path><path d="M8 7.5V13"></path><path d="M11.5 4V13"></path><path d="M15 9V13"></path></svg>`;

const GITHUB_GLYPH = `<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path></svg>`;

export type ActivePage = "home" | "directory" | "methodology";

/**
 * The pill morph, verbatim in mechanism: a single threshold at `scrollY > 24`
 * with no hysteresis, the class toggled inside `requestAnimationFrame`, and a
 * `{passive:true}` listener so scroll handling never blocks. Everything the
 * eye sees is a CSS transition on that one class.
 */
const NAV_SCRIPT = `<script>(function(){
  var h=document.querySelector("header.sg-head");
  if(!h)return;
  var queued=false;
  var apply=function(){h.classList.toggle("is-floating",window.scrollY>24);queued=false;};
  window.addEventListener("scroll",function(){if(!queued){requestAnimationFrame(apply);queued=true;}},{passive:true});
  apply();
})();</script>`;

/**
 * The numbered chapter rail's scroll-spy.
 *
 * Marking the section you are reading is not decoration on a page this long:
 * the rail is the only persistent map of a repo-detail or methodology page,
 * and a rail that never moves is a map with no "you are here". On a phone the
 * rail scrolls horizontally and the active pill is brought into view by
 * setting `scrollLeft` directly — `scrollIntoView` would scroll the PAGE as
 * well, which on a sticky element means the document jumps under the reader.
 */
const RAIL_SCRIPT = `<script>(function(){
  // WIRE UP AFTER PARSING, not inline. The rail is emitted near the TOP of the
  // page and the sections it points at come after it, so at inline-execution
  // time every getElementById returns null, the pair list is empty and the
  // script quietly does nothing — measured live as an active pill that never
  // left chapter 01 no matter where the page was scrolled.
  var boot=function(){
  var rail=document.querySelector(".sg-rail");
  if(!rail)return;
  var links=Array.prototype.slice.call(rail.querySelectorAll("a[data-target]"));
  var pairs=[];
  links.forEach(function(a){
    var el=document.getElementById(a.getAttribute("data-target"));
    if(el)pairs.push({a:a,el:el});
  });
  if(!pairs.length)return;
  var current=null;
  var mark=function(a){
    if(a===current)return;
    links.forEach(function(l){l.removeAttribute("aria-current");});
    a.setAttribute("aria-current","true");
    current=a;
    var r=a.getBoundingClientRect(),c=rail.getBoundingClientRect();
    if(r.left<c.left){rail.scrollLeft-=(c.left-r.left)+16;}
    else if(r.right>c.right){rail.scrollLeft+=(r.right-c.right)+16;}
  };
  // A READING LINE, not an intersection ratio. IntersectionObserver reports
  // intersected-area / ELEMENT-area, so a tall section that fills the screen
  // scores LOWER than a short one merely peeking in — measured live, the
  // active pill never left chapter 01 on a page where every chapter had been
  // scrolled through. The section you are reading is simply the last one whose
  // top has passed a line just under the chrome, which is exact and cheap.
  // Just BELOW the anchor landing point. Sections carry
  // scroll-margin-block-start: chrome + 72px = 136px, so a reading line at 130
  // sat 6px above where a clicked anchor actually lands and the rail marked the
  // PREVIOUS chapter — measured: clicking 05 Scoring lit 04 Evidence.
  var LINE=150;
  var queued=false;
  var apply=function(){
    queued=false;
    var pick=pairs[0].a;
    for(var i=0;i<pairs.length;i++){
      if(pairs[i].el.getBoundingClientRect().top<=LINE)pick=pairs[i].a;
    }
    // At the very bottom the last chapter may never reach the line.
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4){
      pick=pairs[pairs.length-1].a;
    }
    mark(pick);
  };
  window.addEventListener("scroll",function(){if(!queued){requestAnimationFrame(apply);queued=true;}},{passive:true});
  window.addEventListener("resize",function(){if(!queued){requestAnimationFrame(apply);queued=true;}},{passive:true});
  links.forEach(function(a){a.addEventListener("click",function(){mark(a);});});
  apply();
  };
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot);}
  else{boot();}
})();</script>`;

/** One numbered chapter pill. */
export interface Chapter {
  id: string;
  label: string;
}

/**
 * OpenAI's numbered chapter pills, adapted: a sticky rail of 999px-radius
 * items, numbered so the page reads as a document with chapters. On a phone it
 * scrolls horizontally and keeps its full 44px tap height — it never collapses
 * into a menu, because for three to six chapters a scrolling rail is strictly
 * better than hiding the map behind a button.
 */
export function chapterRail(chapters: readonly Chapter[]): string {
  if (chapters.length === 0) return "";
  const items = chapters
    .map(
      (c, i) => `<a href="#${escapeHtml(c.id)}" data-target="${escapeHtml(c.id)}"${
        i === 0 ? ' aria-current="true"' : ""
      }><span class="sg-rail-n">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(
        c.label,
      )}</a>`,
    )
    .join("");
  return `<nav class="sg-rail" aria-label="Sections"><div class="sg-rail-in">${items}</div></nav>
${RAIL_SCRIPT}`;
}

export function page(opts: {
  title: string;
  body: string;
  active?: ActivePage;
}): string {
  const active = opts.active ?? ctx.active;
  const nav = (target: ActivePage, label: string, path: string) =>
    `<a href="${href(path)}"${
      active === target ? ' class="is-on" aria-current="page"' : ""
    }>${label}</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Signal commits to one light theme (see styles.ts). Without this the UA
     paints native form controls — the directory's search box and order select —
     from a dark system preference, on a page that is painted light throughout. -->
<meta name="color-scheme" content="light">
<title>${escapeHtml(opts.title)}</title>${canonicalLink()}
${FONTS_HEAD}
<link rel="stylesheet" href="${href("style.css")}">
</head>
<body>
<a class="sg-skip" href="#main">Skip to content</a>
<header class="sg-head">
  <div class="sg-head-in">
    <a class="sg-mark" href="${href("")}">${MARK}<span>sscsb</span></a>
    <nav class="sg-nav" aria-label="Site">
      ${nav("directory", "Directory", "directory/")}
      ${nav("methodology", "Methodology", "methodology/")}
      <a class="sg-nav-ext" href="${ACTION_REPO_URL}">Action</a>
      <a class="sg-nav-icon" href="${REPO_URL}" aria-label="Source on GitHub">${GITHUB_GLYPH}</a>
    </nav>
  </div>
</header>
<main id="main">
${opts.body}
</main>
<footer class="sg-foot">
  <div class="sg-foot-in">
    <span class="mono">${SITE_HOST_LABEL}</span>
    <span>Open source · Apache-2.0 · methodology v${METHODOLOGY_VERSION}</span>
  </div>
</footer>
${NAV_SCRIPT}
${ctx.switcher}
</body>
</html>`;
}
