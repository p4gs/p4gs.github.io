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
 * - Provenance honesty: lane markers come from ctx.trust (+ ctx.localTrust)
 *   through trust.ts resolveTrustKind — verified / unsigned action / local /
 *   external. A design never shows a verified mark without a verified sidecar,
 *   and the local badge must always read as WEAKER than the action lane.
 * - Coverage honesty: a listing below the coverage floor says WHY (which
 *   controls are unverified) and what the one-line fix is. The facts come from
 *   coverage.ts; the sentence is the design's own. The "fixable by a local
 *   scan" claim is only made when a local scan could actually clear the floor.
 * - Contradiction honesty: where sources disagree the row is a gap AND the
 *   disagreement is named (ctx.facts), on the listing and on the detail page.
 */
import type { ListingFacts } from "../listing";
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
  /**
   * LOCAL-lane sidecars, same keying. Present only for listings that carry a
   * verified maintainer-signed workstation record; its `resolved` list is the
   * class-C control ids that record actually contributed.
   */
  localTrust?: ReadonlyMap<string, TrustInfo>;
  /**
   * What the evidence merge actually did for each listing, keyed the same way:
   * which rows the local lane resolved on its own, which rows CONTRADICTED
   * across sources (each scored a gap), which local assertions are held back
   * awaiting independent observation, and whether a local record describes a
   * different commit than its base.
   *
   * A design MUST surface a contradiction — on the listing row and on the
   * detail page. Scoring a disagreement as a gap and saying nothing would hide
   * the most interesting fact the directory holds about that repository.
   */
  facts?: ReadonlyMap<string, ListingFacts>;
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
