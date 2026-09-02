/**
 * Site-wide constants. BASE_PATH is the project-Pages prefix — every internal
 * href must start with it (enforced by the link-integrity test), because the
 * site serves at tools.sensiblesecurity.xyz/sscsb/, never at /.
 */
export const BASE_PATH = "/sscsb/";

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
