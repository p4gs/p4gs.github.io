/**
 * Factory — the sixth design: white paper, one editorial serif, an aperture
 * that closes as you scroll, and diagrams that are rendered from the data
 * rather than drawn beside it.
 *
 * Ctx-native, the shape `bulletin/` uses: every renderer takes the DesignCtx
 * directly, so nothing is threaded through module state and the test suite can
 * render every design in one process without one render leaking into the next.
 *
 * The stylesheet is assembled in one place and in one order, and the order is
 * load-bearing: the shared component layer arrives after the design's own base
 * so its accessibility floors are the last word on form controls and tap
 * targets; `MOTION_CSS` arrives after that so the motion branches can settle
 * what the shared layer leaves open; and `OVERRIDES` is last because it is
 * the reskin of the shared layer and nothing else.
 */
import type { Design } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD } from "./layout";
import { renderMethodology } from "./methodology";
import { MOTION_CSS } from "./motion";
import { sharedComponentCss } from "../shared-css";
import { CSS, OVERRIDES, PAGES_CSS, RESPONSIVE_CSS } from "./styles";

/**
 * Factory's palette on the shared components' bridge tokens.
 *
 * `accent` is the LINK blue, not the diagram blue: the shared layer spends its
 * accent on links, hover borders and panel eyebrows, and the diagram accent has
 * one job on this site — emphasis inside a figure. Letting the two swap places
 * is how a page ends up saying two things with one colour.
 *
 * `pass` / `fail` / `warn` are SSCSB's verdicts, and neither blue is any of
 * them.
 */
const SHARED = sharedComponentCss({
  surface: "var(--fy-ground)",
  ground: "var(--fy-ground)",
  ink: "var(--fy-ink)",
  dim: "var(--fy-quiet)",
  muted: "var(--fy-muted)",
  line: "var(--fy-hair)",
  lineStrong: "var(--fy-line)",
  accent: "var(--fy-link)",
  pass: "var(--fy-pass)",
  fail: "var(--fy-fail)",
  warn: "var(--fy-warn)",
  hatch: "var(--fy-hatch)",
  mono: "var(--fy-mono)",
  display: "var(--fy-display)",
  radius: "8px",
  cardShadow: "none",
});

export const factory: Design = {
  id: "factory",
  label: "Factory",
  head: FONTS_HEAD,
  css: CSS + PAGES_CSS + RESPONSIVE_CSS + SHARED + MOTION_CSS + OVERRIDES,
  renderHome,
  renderDirectory,
  renderRepoDetail,
  renderMethodology,
};
