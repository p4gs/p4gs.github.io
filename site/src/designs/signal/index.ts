/**
 * Signal — warm paper, hairline structure, glassy pill chrome.
 *
 * The design in one line: a *record of evidence* rather than a product page.
 * Cream-warm paper and near-black ink carry the page; ONE cool accent (blue)
 * carries the brand — deliberately outside the status range, because on this
 * site green, amber and red mean pass, gap and fail, and an accent that could
 * be mistaken for a verdict would teach the eye the wrong lesson in the first
 * three seconds.
 *
 * Its three borrowed mechanisms, each measured before it was copied:
 *   - the cocoindex header morph (bar → floating pill at `scrollY > 24`),
 *     with the header kept rather than dissolved;
 *   - Paperclip's fill-less hairline grid, hardened into a real table;
 *   - OpenAI's numbered sticky chapter pills, scrolling sideways on a phone.
 */
import { lookupLocalTrust, lookupTrust } from "../../trust";
import { sharedComponentCss } from "../shared-css";
import type { Design, DesignCtx } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD, setCtx } from "./layout";
import { renderMethodology } from "./methodology";
import { CSS, CSS_AFTER } from "./styles";

/**
 * Signal's palette, mapped onto the shared components' bridge tokens.
 *
 * `warn` is the degraded/gap hue rather than the brand accent: the shared
 * components use it on coverage notes and partial-evidence rows, which ARE
 * status, and routing them through the accent would put brand blue on a
 * verdict.
 */
const SHARED = sharedComponentCss({
  surface: "var(--surface)",
  ground: "var(--paper)",
  ink: "var(--ink)",
  dim: "var(--ink-2)",
  muted: "var(--ink-3)",
  line: "var(--hairline-2)",
  lineStrong: "var(--hairline)",
  accent: "var(--accent)",
  pass: "var(--pass)",
  fail: "var(--fail)",
  warn: "var(--degraded)",
  hatch: "repeating-linear-gradient(45deg, #7A736A 0 2px, #EFEDE8 2px 4px)",
  mono: "var(--mono)",
  display: "var(--display)",
  radius: "12px",
  cardShadow: "none",
});

const withCtx = <A extends unknown[], R>(fn: (...a: A) => R) =>
  (ctx: DesignCtx, ...a: A): R => {
    setCtx(ctx);
    return fn(...a);
  };

const home = withCtx(renderHome);
const dir = withCtx(renderDirectory);
const detail = withCtx(renderRepoDetail);
const method = withCtx(renderMethodology);

export const signal: Design = {
  id: "signal",
  label: "Signal",
  head: FONTS_HEAD,
  // Order matters: the shared block sits between the design's own rules and
  // the handful of skin overrides that must win over it. Its accessibility
  // floors (16px form controls, 44px targets, the measured switcher
  // clearance) are never among the things overridden.
  css: CSS + SHARED + CSS_AFTER,
  renderHome: (records, ctx) => home(ctx, records, ctx),
  renderDirectory: (rs, ctx) => dir(ctx, rs, ctx.trust ?? new Map(), ctx.localTrust ?? new Map()),
  renderRepoDetail: (r, ctx) =>
    detail(ctx, r, lookupTrust(ctx.trust, r), lookupLocalTrust(ctx.localTrust, r)),
  renderMethodology: (ctx) => method(ctx),
};
