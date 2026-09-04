/** Manual — the Field Manual design: editorial, light single-theme, print register. */
import type { Design } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD } from "./layout";
import { renderMethodology } from "./methodology";
import { sharedComponentCss } from "../shared-css";
import { CSS } from "./styles";

/** Manual's palette, mapped onto the shared components' bridge tokens. */
const SHARED = sharedComponentCss({
  surface: "var(--card)",
  ground: "var(--paper)",
  ink: "var(--ink)",
  dim: "var(--dim)",
  muted: "var(--dim)",
  line: "var(--line)",
  lineStrong: "var(--ink)",
  accent: "var(--rust)",
  pass: "var(--pass)",
  fail: "var(--fail)",
  warn: "var(--warn)",
  hatch: "var(--hatch)",
  mono: "var(--mono)",
  display: "var(--serif)",
  radius: "2px",
  cardShadow: "none",
});

export const manual: Design = {
  id: "manual",
  label: "Manual",
  head: FONTS_HEAD,
  css: CSS + SHARED,
  renderHome,
  renderDirectory,
  renderRepoDetail,
  renderMethodology,
};
