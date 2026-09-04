/**
 * The HTML-to-text helpers, and specifically the four defects that made this
 * file necessary.
 *
 * Every test below fails against the regexes it replaced. They are grouped by
 * the defect they pin rather than by the function they call, because the same
 * mistake appeared in four different places and the point is that the shape is
 * gone, not that one call site was patched.
 */
import { describe, expect, test } from "bun:test";
import { decodeEntities, textFrom, textOfEach, withoutElements } from "./html-text";
import { measure } from "./readability";

/**
 * DEFECT: a filter that strips `<script` but not `<SCRIPT`.
 *
 * `/<script\b[^>]*>[\s\S]*?<\/script>/g` — the home page's prose extractor —
 * and `/<script>[\s\S]*?<\/script>/` — the switcher's — both carried no `i`
 * flag. HTML tag names are case-insensitive, so a shouted tag went straight
 * through both, and its contents were then measured as page copy or asserted
 * over as markup. The end anchors were as narrow as the start ones: a browser
 * closes a script at `</script foo="bar">` too.
 */
describe("script filtering is case- and syntax-insensitive, like a browser", () => {
  test("an upper-case SCRIPT element is removed", () => {
    expect(withoutElements("<p>keep</p><SCRIPT>secret()</SCRIPT>", "script")).toBe(
      "<p>keep</p>",
    );
  });

  test("a mixed-case ScRiPt element is removed", () => {
    expect(withoutElements("<p>keep</p><ScRiPt>secret()</ScRiPt>", "script")).toBe(
      "<p>keep</p>",
    );
  });

  test("a start tag with attributes is still a start tag", () => {
    expect(
      withoutElements('<p>keep</p><script type="module" defer>secret()</script>', "script"),
    ).toBe("<p>keep</p>");
  });

  test("an end tag with attributes still ends the script", () => {
    // Browsers accept `</script foo="bar">`; a regex anchored on `</script>`
    // reads everything after it as script and swallows real markup.
    expect(
      withoutElements('<p>a</p><script>x()</script foo="bar"><p>b</p>', "script"),
    ).toBe("<p>a</p><p>b</p>");
  });

  test("script contents never reach the prose", () => {
    const html = "<p>visible</p><SCRIPT>var retired = 'attestation';</SCRIPT>";
    expect(textFrom(html)).toContain("visible");
    expect(textFrom(html)).not.toContain("attestation");
  });

  test("an upper-case script is still readable as a script when that is the job", () => {
    // The switcher test extracts the script to execute it. A regex that only
    // matched `<script>` reported "no script" on a page that had one.
    expect(textOfEach("<SCRIPT>run()</SCRIPT>", "script", false)).toEqual(["run()"]);
    expect(textOfEach('<script defer>run()</script>', "script", false)).toEqual(["run()"]);
  });

  test("script text is handed back raw, because a script element is raw text", () => {
    // `&&` inside a script is the JavaScript operator. Decoding entities here
    // would corrupt code on its way to execution.
    expect(textOfEach("<script>a && b;</script>", "script", false)).toEqual(["a && b;"]);
  });
});

/**
 * DEFECT: a single-pass replace that leaves the forbidden sequence behind.
 *
 * `/<[^>]+>/g` defines a tag as "`<`, then anything, then `>`", which is not
 * what a tag is. Two consequences, both of which this pins: a `<` with no `>`
 * after it is copied through untouched, so `<script` survives the "sanitizer";
 * and a `>` inside a quoted attribute value ends the match early, leaking the
 * rest of the attribute into the text.
 */
describe("tag stripping leaves no tag behind, and takes no text with it", () => {
  test("a truncated script tag does not survive into the text", () => {
    // `"<div>x<script".replace(/<[^>]+>/g, "")` === "x<script".
    expect(textFrom("<div>x<script")).not.toContain("<script");
  });

  test("a sequence that reassembles itself does not reassemble", () => {
    // The classic reconstruction case: removing the inner `<x>` from
    // `<scr<x>ipt>` with a naive rule glues `<scr` to `ipt>`.
    expect(textFrom("<div>a<scr<x>ipt>b</div>")).not.toContain("<script");
    expect(textFrom("<div>a<<scriptscript>>b</div>")).not.toContain("<script");
  });

  test("a `>` inside an attribute value does not leak into the text", () => {
    // `'<a title="a>b">text</a>'.replace(/<[^>]+>/g, "")` === 'b">text'.
    const text = textFrom('<a title="a>b">text</a>');
    expect(text).not.toContain('b">');
    expect(text.trim()).toBe("text");
  });

  test("per-element text is the element's, attributes and all excluded", () => {
    const rows = textOfEach(
      '<div class="receipt-body">' +
        '<div><code><span>$</span> sscsb verify</code></div>' +
        '<div title="a>b">second &amp; last</div>' +
        "</div>",
      "div.receipt-body > div",
    );
    expect(rows).toEqual(["$ sscsb verify", "second & last"]);
  });

  test("comments and doctypes are not text", () => {
    expect(textFrom("<!doctype html><p>a</p><!-- hidden --><p>b</p>").trim()).toBe("a b");
  });
});

/**
 * DEFECT: double unescaping.
 *
 * The old decoder was a chain of `.replace()` calls with `&amp;` second, so
 * every later rule ran over text the ampersand rule had just produced. A page
 * that writes `&amp;lt;` means the four visible characters `&lt;`; the chain
 * turned it into a single `<` that the document never contained.
 */
describe("entities decode exactly once", () => {
  test("&amp;lt; is the four characters &lt;, not a less-than sign", () => {
    expect(decodeEntities("a &amp;lt; b")).toBe("a &lt; b");
    expect(decodeEntities("&amp;amp;")).toBe("&amp;");
  });

  test("a real &lt; is still a less-than sign", () => {
    expect(decodeEntities("a &lt; b &gt; c")).toBe("a < b > c");
  });

  test("&amp;#39; does not become an apostrophe", () => {
    expect(decodeEntities("&amp;#39;")).toBe("&#39;");
    expect(decodeEntities("&#39;")).toBe("'");
  });

  test("numeric and hex references decode to their character", () => {
    expect(decodeEntities("&#8212;&#x2014;")).toBe("——");
  });

  test("an unknown reference becomes the placeholder, not a guess", () => {
    expect(decodeEntities("a &clubsuit; b")).toBe("a   b");
    expect(decodeEntities("a &clubsuit; b", "?")).toBe("a ? b");
  });

  test("a lone ampersand is left alone", () => {
    expect(decodeEntities("Ben & Jerry & co")).toBe("Ben & Jerry & co");
  });

  test("out-of-range and surrogate code points do not throw", () => {
    expect(() => decodeEntities("&#xD800;&#1114112;&#0;")).not.toThrow();
    expect(decodeEntities("&#xD800;")).toBe(" ");
  });

  test("the readability measurement sees the page's own characters", () => {
    // Through the public surface: a sentence written with `&amp;lt;` must be
    // measured as containing `&lt;`. The old chain measured `<`.
    const html = "<p>The tag is written as &amp;lt;script&amp;gt; in the copy.</p>";
    const text = measure(html).sentences.map((s) => s.text).join(" ");
    expect(text).toContain("&lt;script&gt;");
    expect(text).not.toContain("<script>");
  });
});
