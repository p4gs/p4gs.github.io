/**
 * The four-up design trial: every design implements this interface, and the
 * build emits a complete page tree per design — the default at BASE_PATH,
 * the alternates under BASE_PATH + `_d/<id>/` — so each can be used for real,
 * end to end, and switched live.
 *
 * Contract for implementations:
 * - Every internal href goes through ctx.h(path) so links stay INSIDE the
 *   design's own tree (leaving it silently would corrupt the trial).
 * - Every page includes ctx.switcher immediately before </body> — the build
 *   computes equivalent-page links across designs; the design only styles the
 *   container via its own CSS (class names in shared.ts SWITCHER_* docs).
 * - `css` is the design's complete stylesheet (emitted as style.css in its
 *   tree); `head` is its font links. A design may commit to a single theme
 *   (paint explicit backgrounds) or ship both via prefers-color-scheme.
 * - Copy honesty: unverified is a visible third state, never counted; A+ is
 *   exactly 100%; provisional tags stay.
 * - Provenance honesty: lane markers come from ctx.trust through
 *   trust.ts resolveTrustKind — verified / unsigned action / external. A
 *   design never shows a verified mark without a verified sidecar.
 */
import type { ScanRecord } from "../schema";
import type { TrustInfo } from "../trust";

export type DesignId = "ledger" | "console" | "manual" | "chain";

export interface DesignCtx {
  /** BASE_PATH for the default design; BASE_PATH + `_d/<id>/` otherwise. */
  prefix: string;
  /** Internal link helper: h("directory/") → `${prefix}directory/`. */
  h(path: string): string;
  /** The cross-design switcher block for THIS page; include before </body>. */
  switcher: string;
  /** Which nav item is active: "home" | "directory" | "methodology". */
  active: string;
  /** Trust sidecars keyed by `owner--name` (trust.ts trustKeyOf); absent = none loaded. */
  trust?: ReadonlyMap<string, TrustInfo>;
}

export interface Design {
  id: DesignId;
  label: string;
  /** Google Fonts <link> lines (with preconnect) for this design. */
  head: string;
  /** Complete stylesheet for this design's tree; omitted = public/style.css. */
  css?: string;
  renderHome(repoCount: number, ctx: DesignCtx): string;
  renderDirectory(records: ScanRecord[], ctx: DesignCtx): string;
  renderRepoDetail(r: ScanRecord, ctx: DesignCtx): string;
  renderMethodology(ctx: DesignCtx): string;
}
