/**
 * HTML → text, through a real HTML parser.
 *
 * WHY THIS FILE EXISTS. Four places in this suite pulled text out of rendered
 * HTML with regular expressions, and every one of them was wrong in the same
 * family of ways:
 *
 *   - `/<script\b[^>]*>[\s\S]*?<\/script>/g` — no `i` flag, so `<SCRIPT>` and
 *     `</SCRIPT>` sailed straight through and their contents were measured as
 *     page prose. A design that shouted its tag name would have had its
 *     JavaScript scanned for banned vocabulary.
 *   - `/<script>([\s\S]*?)<\/script>/` — matches only a bare start tag, so
 *     `<script defer>` or `<SCRIPT>` yields "switcherFor emitted no script".
 *   - `/<[^>]+>/g` — a tag is "`<`, then anything, then `>`", which is not what
 *     a tag is. `<a title="a>b">` ends at the `>` inside the quoted attribute,
 *     leaking `b">` into the text; a trailing `<script` with no `>` is left in
 *     the output verbatim, which is the reappearing-sequence defect CodeQL's
 *     js/incomplete-multi-character-sanitization names.
 *   - a chain of `.replace()` calls that unescaped `&amp;` before `&lt;`, so
 *     the four literal characters `&lt;` — written in the page as `&amp;lt;` —
 *     came back as a single `<` that was never in the document.
 *
 * All four are the same mistake: HTML is not a regular language, so a regex
 * that "strips tags" is a guess about the parse. The fix is not a better guess.
 * `HTMLRewriter` is a real streaming HTML parser (lol-html), built into Bun,
 * with no dependency to add — it agrees with a browser about uppercase tags,
 * `>` inside attribute values, `</script foo="bar">` end tags, unclosed tags
 * and comment forms, because it implements the same tokenizer. Every helper
 * below is measurement code: it answers "what does a reader see on this page",
 * and a parser answers that question more accurately as well as more safely.
 *
 * These helpers are test-only. Nothing here ever runs in a visitor's browser.
 */

/**
 * The named character references the site actually emits, plus the handful any
 * hand-written page tends to reach for.
 *
 * A full HTML5 entity table is 2231 entries; this is not one, and unknown names
 * deliberately collapse to the `unknown` string rather than being guessed at.
 */
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  // A non-breaking space is a space to every measurement here — word counts,
  // sentence splits and phrase matching all want it to behave like one.
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rarr: "→",
  larr: "←",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  times: "×",
  middot: "·",
};

/**
 * Decode HTML character references in ONE pass.
 *
 * WHY ONE PASS, AND NOT A REORDERED CHAIN. The bug this replaces was a chain of
 * `.replace()` calls that turned `&amp;` into `&` first:
 *
 *     s.replace(/&amp;/g, "&").replace(/&lt;/g, "<")     // WRONG
 *
 * The output of the first replacement is the input of the second, so the page
 * text `&amp;lt;` — which means the four visible characters `&lt;` — decodes to
 * `&lt;` and then to `<`. A character appears that the document never
 * contained. Moving the ampersand to the end of the chain fixes that one
 * ordering while leaving the shape that caused it: any future entity added
 * above the ampersand reintroduces it silently.
 *
 * A single pass cannot have the defect at all. Each reference is consumed
 * exactly once, and text produced by a replacement is never rescanned, so
 * `&amp;lt;` decodes to `&lt;` and stops — there is no second pass to turn it
 * into `<`. That is the property CodeQL's js/double-escaping asks for, and it
 * is also simply the correct decoding.
 *
 * @param unknown what an unrecognised reference becomes. A space keeps word
 *   counts honest: an entity nobody decoded is one glyph, never part of a word.
 */
export function decodeEntities(html: string, unknown = " "): string {
  return html.replace(
    /&(#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g,
    (_match, body: string) => {
      if (body.charAt(0) === "#") {
        const hex = body.charAt(1) === "x" || body.charAt(1) === "X";
        const code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
        // Lone surrogates and out-of-range code points are not characters;
        // String.fromCodePoint throws on them rather than returning a glyph.
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return unknown;
        if (code >= 0xd800 && code <= 0xdfff) return unknown;
        return String.fromCodePoint(code);
      }
      const named = NAMED[body.toLowerCase()];
      return named === undefined ? unknown : named;
    },
  );
}

/**
 * The document with every element matching `selector` — and its contents —
 * removed.
 *
 * Selector syntax is CSS, so `"code,script,style"` drops all three. Matching is
 * the parser's, which means it is tag matching rather than text matching:
 * `<SCRIPT>`, `<script defer>` and `</script foo="bar">` are all recognised,
 * and a `>` inside an attribute value does not end the tag.
 */
export function withoutElements(html: string, selector: string): string {
  return new HTMLRewriter()
    .on(selector, {
      element(e) {
        e.remove();
      },
    })
    .transform(html);
}

/**
 * All text a reader would see, in document order.
 *
 * Text runs are joined with a single space, which is what the tag-stripping
 * regex this replaces did (it substituted `" "` for every tag), so a phrase
 * broken across an inline `<a>` still reads as a phrase. Comments and doctypes
 * are not text and do not appear.
 *
 * @param drop elements whose subtree is not page copy. The default drops the
 *   two that are never prose in any document; callers add `code` and friends.
 */
export function textFrom(html: string, drop: string[] = ["script", "style"]): string {
  const cleaned = drop.length ? withoutElements(html, drop.join(",")) : html;
  const runs: string[] = [];
  new HTMLRewriter()
    .onDocument({
      text(t) {
        if (t.text) runs.push(t.text);
      },
    })
    .transform(cleaned);
  return decodeEntities(runs.join(" "));
}

/**
 * The text of each element matching `selector`, one string per element, in
 * document order — including the text of its descendants.
 *
 * @param decode false for raw-text elements (`<script>`, `<style>`), whose
 *   contents are not entity-decoded by an HTML parser and must not be here
 *   either: `&amp;&amp;` inside a script is the JavaScript operator `&&`
 *   written by a nervous templating layer, not an escaped ampersand.
 */
export function textOfEach(html: string, selector: string, decode = true): string[] {
  const out: string[] = [];
  let open: string[] | null = null;
  new HTMLRewriter()
    .on(selector, {
      element(e) {
        const buf: string[] = [];
        open = buf;
        e.onEndTag(() => {
          out.push(decode ? decodeEntities(buf.join("")) : buf.join(""));
          open = null;
        });
      },
    })
    .onDocument({
      text(t) {
        if (open && t.text) open.push(t.text);
      },
    })
    .transform(html);
  return out;
}
