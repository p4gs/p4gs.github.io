/**
 * Site-wide constants. BASE_PATH is the project-Pages prefix — every internal
 * href must start with it (enforced by the link-integrity test), because the
 * site serves at tools.sensiblesecurity.xyz/sscsb/, never at /.
 */
export const BASE_PATH = "/sscsb/";

/**
 * Where the site actually serves. Used for the canonical URL only — every
 * internal href stays relative to BASE_PATH. The alternate design trees are a
 * design trial, not four separate publications, so each of their pages points
 * its canonical at the DEFAULT design's equivalent page: a crawler indexing
 * this site sees one copy of each page, the Ledger one.
 */
export const SITE_ORIGIN = "https://tools.sensiblesecurity.xyz";

/**
 * The query parameter that opts out of the remembered-design redirect AND
 * forgets the remembered design. `/sscsb/?stay` is a shareable "always give me
 * the default design" link, and the switcher's default-design link carries it.
 */
export const STAY_PARAM = "stay";

export const SITE_NAME = "SSCS Bootstrapper";
export const REPO_URL = "https://github.com/p4gs/sscs-bootstrapper";
export const SITE_REPO_URL = "https://github.com/p4gs/p4gs.github.io";
export const ACTION_REPO_URL = "https://github.com/p4gs/sscsb-action";
export const SUBMIT_URL = `${SITE_REPO_URL}/issues/new?template=scan-request.yml`;
/** Scan-intake relay (Vercel). Empty string disables the single-click path;
 * filter.js then falls back to the pre-filled issue form in a popup. */
export const SCAN_API_URL = "https://sscsb-scan-intake.vercel.app/api/scan-request";

/** Bumped when the scoring rules change; displayed on every repo page. */
export const METHODOLOGY_VERSION = 1;

/** The scan-record schema this site build understands. */
export const SCHEMA_VERSION = 1;
