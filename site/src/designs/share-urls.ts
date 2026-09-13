/**
 * Absolute, off-site URLs the designs paste into text a human will read
 * somewhere else — the prefilled issue bodies that nudge a repository to
 * publish a scan. Everything else on the site is a relative href built from
 * `ctx.prefix`; these are the exception, because the reader is on github.com.
 *
 * Written once so the designs cannot disagree, and derived from SITE_ORIGIN +
 * BASE_PATH so moving the site moves them. They were four fully-hardcoded
 * absolute literals per design — origin, base path and all — which is how a
 * domain migration silently ships text pointing at the old host.
 *
 * Always the DEFAULT tree, never `ctx.prefix`: a URL shared into someone
 * else's issue tracker should land on the site's canonical page, not on
 * whichever alternate design the maintainer happened to be reading.
 */
import { BASE_PATH, SITE_ORIGIN } from "../config";

/** `path` is relative to BASE_PATH, exactly like `ctx.h()` takes it. */
export function shareUrl(path: string): string {
  return `${SITE_ORIGIN}${BASE_PATH}${path.replace(/^\//, "")}`;
}

/** The detail page for `owner/name`, as a listing slug path. */
export function listingShareUrl(owner: string, name: string): string {
  return shareUrl(`directory/${owner.toLowerCase()}--${name.toLowerCase()}/`);
}

/** The published scoring methodology. */
export const METHODOLOGY_SHARE_URL = shareUrl("methodology/");

/** The local-lane section of the methodology. */
export const LOCAL_METHODOLOGY_SHARE_URL = shareUrl("methodology/#local");
