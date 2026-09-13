/**
 * Site-wide constants. BASE_PATH is the path prefix every internal href must
 * start with (enforced by the link-integrity test). The site serves at the
 * ROOT of sscsb.dev, so the prefix is "/" — it is still spelled as a constant,
 * and still used everywhere, because the alternate design trees hang off it
 * and because a future move back under a subpath must stay a one-line change.
 */
export const BASE_PATH = "/";

/**
 * Where the site actually serves. Used for the canonical URL only — every
 * internal href stays relative to BASE_PATH. The alternate design trees are a
 * design trial, not four separate publications, so each of their pages points
 * its canonical at the DEFAULT design's equivalent page: a crawler indexing
 * this site sees one copy of each page, the Ledger one.
 */
export const SITE_ORIGIN = "https://sscsb.dev";

/**
 * The query parameter that opts out of the remembered-design redirect AND
 * forgets the remembered design. `/?stay` is a shareable "always give me
 * the default design" link, and the switcher's default-design link carries it.
 */
export const STAY_PARAM = "stay";

/**
 * How the site names ITSELF in body text — the footer colophon on every
 * design. Derived from SITE_ORIGIN + BASE_PATH rather than typed out, because
 * a hand-typed host is how a domain move ships a page that footers the old
 * address: the five designs each had their own literal, and three of them
 * disagreed with the other two after the move to sscsb.dev.
 *
 * The origin loses its scheme (a footer is a label, not a link) and the base
 * path is appended without its trailing slash, so "/" yields a bare host and a
 * future move back under a subpath yields `host/subpath` with no edit here.
 */
export const SITE_HOST_LABEL = `${SITE_ORIGIN.replace(/^https?:\/\//, "")}${BASE_PATH.replace(
  /\/$/,
  "",
)}`;

export const SITE_NAME = "SSCS Bootstrapper";
export const REPO_URL = "https://github.com/p4gs/sscs-bootstrapper";
export const SITE_REPO_URL = "https://github.com/p4gs/p4gs.github.io";
export const ACTION_REPO_URL = "https://github.com/p4gs/sscsb-action";
export const SUBMIT_URL = `${SITE_REPO_URL}/issues/new?template=scan-request.yml`;
/** Scan-intake relay (Vercel). Empty string disables the single-click path;
 * filter.js then falls back to the pre-filled issue form in a popup. */
export const SCAN_API_URL = "https://sscsb-scan-intake.vercel.app/api/scan-request";

/** Bumped when the scoring rules change; displayed on every repo page. */
export const METHODOLOGY_VERSION = 2;

/** The scan-record schema this site build understands. */
export const SCHEMA_VERSION = 1;
