/**
 * Every `#fragment` a design links to must exist on the page it points at.
 *
 * A dead fragment is the quietest broken link there is: the browser loads the
 * right page and simply does not scroll, so it looks like the anchor "did
 * nothing" rather than like a 404, and nothing in a build log ever mentions it.
 * That is exactly how one shipped — Bulletin's directory carries the shared
 * `directoryTermsNote`, whose "how that is checked" link goes to
 * `methodology/#trust`, and Bulletin's methodology had no element with that id
 * at all. The link that explains the site's own provenance rules landed a
 * reader at the top of the page and left them to find it.
 *
 * Run for ALL registered designs, off the registry rather than a list: a
 * design added later gets this guarantee without anyone remembering to ask
 * for it, which is the whole reason the fragment above went missing — Bulletin
 * inherited a shared component that assumed an anchor its own page never had.
 */
import { describe, expect, test } from "bun:test";
import { DESIGNS } from "../src/designs/registry";
import { RECORDS, ctxFor } from "./fixtures";
import { attrOfEach } from "./html-text";

/** The slug path the directory publishes a listing under. */
function slugPath(owner: string, name: string): string {
  return `directory/${owner.toLowerCase()}--${name.toLowerCase()}/`;
}

for (const design of DESIGNS) {
  describe(`${design.id}: internal fragment links resolve`, () => {
    const ctx = ctxFor(design.id);

    /**
     * Every page this design renders, keyed by its path RELATIVE to the
     * design's own prefix — which is how an href is read back below. Detail
     * pages are rendered for every fixture record, not just the first, so a
     * cross-listing link is checked against the page it actually opens.
     */
    const pages = new Map<string, string>([
      ["", design.renderHome(RECORDS, ctx)],
      ["directory/", design.renderDirectory(RECORDS, ctx)],
      ["methodology/", design.renderMethodology(ctx)],
      ...RECORDS.map(
        (r) =>
          [slugPath(r.repo.owner, r.repo.name), design.renderRepoDetail(r, ctx)] as [
            string,
            string,
          ],
      ),
    ]);

    /** Every id present on a page — the set a fragment has to land in. */
    const idsOf = (html: string) => new Set(attrOfEach(html, "*", "id"));

    for (const [from, html] of pages) {
      /**
       * Fragment-bearing internal links only. An off-site URL is somebody
       * else's page to keep anchored, and a link with no `#` is the
       * link-integrity test's business, not this one's.
       */
      const links = attrOfEach(html, "a[href]", "href")
        .filter((h) => h.includes("#"))
        .filter((h) => !/^[a-z][a-z0-9+.-]*:/i.test(h));

      test(`${from === "" ? "home" : from} — ${links.length} fragment link(s)`, () => {
        for (const link of links) {
          const hash = link.indexOf("#");
          const rawPath = link.slice(0, hash);
          const fragment = link.slice(hash + 1);
          // `href="#main"` is a link into the page doing the linking.
          const target =
            rawPath === ""
              ? from
              : (() => {
                  expect(rawPath.startsWith(ctx.prefix)).toBe(true);
                  return rawPath.slice(ctx.prefix.length);
                })();

          const page = pages.get(target);
          // A fragment into a page this suite does not render is not a pass:
          // it is a link nobody can check, which is how the last one survived.
          expect({ link, target, rendered: page !== undefined }).toEqual({
            link,
            target,
            rendered: true,
          });
          // Reported as an object so a failure names the link and the page it
          // could not land on, rather than only printing `false`.
          expect({ link, on: target, fragmentExists: idsOf(page!).has(fragment) }).toEqual({
            link,
            on: target,
            fragmentExists: true,
          });
        }
      });
    }

    /**
     * The specific link that was broken, pinned by name rather than only by
     * the sweep above: `directoryTermsNote` is shared by every design, so the
     * `#trust` anchor is a contract each design's methodology owes the others'
     * components, not an incidental id one page happens to have.
     */
    test("the methodology answers the shared directory note's #trust link", () => {
      expect(idsOf(pages.get("methodology/")!).has("trust")).toBe(true);
    });
  });
}
