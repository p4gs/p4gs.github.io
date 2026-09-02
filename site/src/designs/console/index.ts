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
import { CSS } from "./styles";

export const consoleDesign: Design = {
  id: "console",
  label: "Console",
  head: FONTS_HEAD,
  css: CSS,
  renderHome,
  renderDirectory,
  renderRepoDetail,
  renderMethodology,
};
