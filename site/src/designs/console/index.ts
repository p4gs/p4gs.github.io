/**
 * Console — the Control Room design: dark instrument panel, dot-grid ground,
 * glassy telemetry panels, luminous three-state meters, glow discipline
 * (accent glow only on live/status elements). Ctx-native: every renderer
 * takes the DesignCtx directly. Exported as `consoleDesign` to avoid the
 * global `console` clash; the design id stays "console".
 */
import type { Design } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD } from "./layout";
import { renderMethodology } from "./methodology";
import { sharedComponentCss } from "../shared-css";
import { CSS } from "./styles";

/** Console's palette, mapped onto the shared components' bridge tokens. */
const SHARED = sharedComponentCss({
  surface: "var(--panel-solid)",
  ground: "var(--ground-0)",
  ink: "var(--bright)",
  dim: "var(--dim)",
  muted: "var(--faint)",
  line: "var(--line-soft)",
  lineStrong: "var(--line)",
  accent: "var(--accent)",
  pass: "var(--pass)",
  fail: "var(--fail)",
  warn: "var(--warn)",
  hatch: "var(--hatch)",
  mono: "var(--mono)",
  display: "var(--sans)",
  radius: "var(--radius)",
  cardShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
});

export const consoleDesign: Design = {
  id: "console",
  label: "Console",
  head: FONTS_HEAD,
  css: CSS + SHARED,
  renderHome,
  renderDirectory,
  renderRepoDetail,
  renderMethodology,
};
