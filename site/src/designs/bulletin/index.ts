/**
 * Bulletin — the broadsheet design: Swiss/brutalist poster grid, ink on warm
 * off-white, one hot accent reserved for state that matters, hard 2px rules,
 * oversized grotesk numerals, and tables set like a newspaper's results page.
 *
 * Ctx-native: every renderer takes the DesignCtx directly, so nothing is
 * threaded through module state.
 */
import type { Design } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD } from "./layout";
import { renderMethodology } from "./methodology";
import { sharedComponentCss } from "../shared-css";
import { CSS, OVERRIDES } from "./styles";

/**
 * Bulletin's palette on the shared components' bridge tokens.
 *
 * Two mappings are the register rather than an accident: `pass` is INK, not a
 * green — a passing check is the page's ordinary state and gets the page's
 * ordinary colour — and `fail` is the single hot accent, which is the whole
 * reason the accent exists. `warn` is a darker tint of that same hue, never a
 * second one. Radius is `0` and the card shadow is `none`: no rounded-corner
 * card soup, no drop shadows.
 */
const SHARED = sharedComponentCss({
  surface: "var(--paper-2)",
  ground: "var(--paper)",
  ink: "var(--ink)",
  dim: "var(--ink-2)",
  muted: "var(--ink-3)",
  line: "var(--hair)",
  lineStrong: "var(--rule)",
  accent: "var(--hot)",
  pass: "var(--ink)",
  fail: "var(--hot)",
  warn: "var(--rust)",
  hatch: "var(--hatch)",
  mono: "var(--mono)",
  display: "var(--display)",
  radius: "0",
  cardShadow: "none",
});

export const bulletin: Design = {
  id: "bulletin",
  label: "Bulletin",
  head: FONTS_HEAD,
  css: CSS + SHARED + OVERRIDES,
  renderHome,
  renderDirectory,
  renderRepoDetail,
  renderMethodology,
};
