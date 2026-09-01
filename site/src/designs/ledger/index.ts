/** Ledger — the Attestation Ledger design, adapted to the four-up interface. */
import type { Design, DesignCtx } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD, setCtx } from "./layout";
import { renderMethodology } from "./methodology";

const withCtx = <A extends unknown[], R>(fn: (...a: A) => R) =>
  (ctx: DesignCtx, ...a: A): R => {
    setCtx(ctx);
    return fn(...a);
  };

const home = withCtx(renderHome);
const dir = withCtx(renderDirectory);
const detail = withCtx(renderRepoDetail);
const method = withCtx(renderMethodology);

export const ledger: Design = {
  id: "ledger",
  label: "Ledger",
  head: FONTS_HEAD,
  // css omitted: the build copies site/public/style.css into this tree.
  renderHome: (n, ctx) => home(ctx, n),
  renderDirectory: (rs, ctx) => dir(ctx, rs),
  renderRepoDetail: (r, ctx) => detail(ctx, r),
  renderMethodology: (ctx) => method(ctx),
};
