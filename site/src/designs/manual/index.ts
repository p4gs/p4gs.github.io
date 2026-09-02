/** Manual — the Field Manual design: editorial, light single-theme, print register. */
import type { Design } from "../types";
import { renderDirectory, renderRepoDetail } from "./directory";
import { renderHome } from "./home";
import { FONTS_HEAD } from "./layout";
import { renderMethodology } from "./methodology";
import { CSS } from "./styles";

export const manual: Design = {
  id: "manual",
  label: "Manual",
  head: FONTS_HEAD,
  css: CSS,
  renderHome,
  renderDirectory,
  renderRepoDetail,
  renderMethodology,
};
