/** Chain — the Chain of Custody design, adapted to the four-up interface. */
import { lookupLocalTrust, lookupTrust } from "../../trust";
import type { Design, DesignCtx } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD, setCtx } from "./layout";
import { renderMethodology } from "./methodology";
import { sharedComponentCss } from "../shared-css";
import { CSS } from "./styles";

/** Chain's palette, mapped onto the shared components' bridge tokens. */
const SHARED = sharedComponentCss({
  surface: "var(--card)",
  ground: "var(--ground1)",
  ink: "var(--ink)",
  dim: "var(--dim)",
  muted: "var(--none)",
  line: "var(--line)",
  lineStrong: "var(--line)",
  accent: "var(--accent)",
  pass: "var(--accent)",
  fail: "var(--fail)",
  warn: "var(--warn)",
  hatch: "var(--hatch)",
  mono: "var(--font-mono)",
  display: "var(--font-display)",
  radius: "var(--r-tile)",
  cardShadow: "var(--shadow)",
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

export const chain: Design = {
  id: "chain",
  label: "Chain",
  head: FONTS_HEAD,
  css: CSS + SHARED,
  renderHome: (records, ctx) => home(ctx, records, ctx),
  renderDirectory: (rs, ctx) => dir(ctx, rs, ctx.trust ?? new Map(), ctx.localTrust ?? new Map()),
  renderRepoDetail: (r, ctx) =>
    detail(ctx, r, lookupTrust(ctx.trust, r), lookupLocalTrust(ctx.localTrust, r)),
  renderMethodology: (ctx) => method(ctx),
};
