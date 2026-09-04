/**
 * Sentence-length measurement over rendered HTML.
 *
 * WHY THIS EXISTS. The plain-language pass is the whole promise of this site:
 * a reader who has never read a SLSA spec has to be able to follow it. That
 * promise was made page by page, by hand, and it silently missed the
 * methodology page — measured at a 13.2-word mean and a 70-word monster while
 * every other page sat near 8. Nothing caught it, because nothing measured it.
 *
 * HOW IT MEASURES. Block-level OWN text: for each block element, only the text
 * that belongs to that element directly, with the text of nested block children
 * removed. Without that subtraction a wrapper `<div>` re-counts every sentence
 * inside it, and a page's numbers become a function of its div nesting rather
 * than its prose.
 *
 * WHAT IS EXCLUDED, and why each exclusion is honest rather than convenient:
 *   - `<script>`, `<style>`, `<svg>` — not prose.
 *   - `<code>`, `<pre>`, `<kbd>` — a command line is not a sentence, and
 *     wrapping one in prose rules would push us to shorten commands.
 *   - fragments under MIN_WORDS (4) — headings, badges, nav items. A two-word
 *     heading is not a readable-prose datapoint. The floor is deliberately low:
 *     a high floor would drop the short sentences that a good page is mostly
 *     made of, flattering the mean.
 *
 * THE LIST-OF-LABELS RULE. A block whose text comes ENTIRELY from its child
 * elements, with no direct text of its own, is a row of labels — nine taxonomy
 * chips, two footer spans, a pair of buttons — not a sentence. Joining those
 * produced a fake 43-word "sentence" on the home page reading "A1 Poisoned
 * commit A2 Stolen publisher identity A3 …", which is not prose anybody wrote
 * and would have sent this pass off chasing a defect that does not exist. So:
 * a block with direct text of its own joins everything (an inline `<a>` inside
 * a sentence must never split that sentence and let its length hide); a block
 * with none treats each child's text as its own fragment.
 */

/** Fragments shorter than this are labels, not sentences. */
export const MIN_WORDS = 4;

const DROP_TAGS = ["script", "style", "svg", "code", "pre", "kbd", "textarea"];
const BLOCK =
  /^(p|li|h1|h2|h3|h4|h5|h6|td|th|dd|dt|figcaption|caption|blockquote|summary|option|label|div|section|article|aside|header|footer|main|nav|details|form|tr|table|ul|ol|dl)$/i;

/** One measured sentence and where it came from. */
export interface Sentence {
  text: string;
  words: number;
}

export interface Readability {
  sentences: Sentence[];
  count: number;
  mean: number;
  median: number;
  max: number;
  /** The longest sentences, longest first — what a failure message should name. */
  longest: Sentence[];
}

function stripDropped(html: string): string {
  let out = html;
  for (const t of DROP_TAGS) {
    out = out.replace(new RegExp(`<${t}\\b[^>]*>[\\s\\S]*?</${t}>`, "gi"), " ");
    out = out.replace(new RegExp(`<${t}\\b[^>]*/?>`, "gi"), " ");
  }
  // HTML comments carry rationale, not page copy.
  return out.replace(/<!--[\s\S]*?-->/g, " ");
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&rarr;/g, "→")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#\d+;/g, " ");
}

/**
 * Split a block's own text into sentences.
 *
 * Terminators are `.`, `!`, `?`, `:` and `;` — a colon-led clause reads as its
 * own sentence to a reader, and treating it as one is the honest measure: a
 * writer cannot dodge the threshold by swapping a full stop for a semicolon.
 * A period inside a version number, an abbreviation, a domain or an ellipsis is
 * not a terminator.
 */
export function splitSentences(text: string): string[] {
  // A sentinel stands in for a period that is NOT a terminator, and is put back
  // afterwards. It is spelled as an escape rather than typed literally: a raw
  // control byte inside a regex literal did not round-trip, which left the
  // sentinel in the measured text and quietly mis-counted words.
  const S = "\u0001";
  const guarded = text
    .replace(/(\d)\.(\d)/g, `$1${S}$2`) // 1.0, v2.5.10
    .replace(/\b([A-Za-z])\.([A-Za-z])\./g, `$1${S}$2${S}`) // e.g., i.e.
    .replace(
      /\.(js|ts|io|com|org|dev|json|yml|yaml|toml|md|sh|lock|rs)\b/gi,
      `${S}$1`,
    )
    .replace(/\.\.\./g, S.repeat(3));
  return guarded
    .split(/(?<=[.!?;:])[\s\u00a0]+/)
    .map((s) => s.split(S).join(".").trim())
    .filter(Boolean);
}

export function wordsIn(sentence: string): number {
  return sentence
    .split(/[\s\u00a0]+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

/** One text run inside a block: `direct` = the block's own words, not a child's. */
interface Run {
  text: string;
  direct: boolean;
}

/**
 * Every block element's own text, with nested block text subtracted, returned
 * as the fragments that block contributes.
 *
 * Implemented by walking the tag stream and attributing each text run to the
 * innermost open block. That is exactly "own text": a run inside a nested
 * block is attributed to the nested block and to nothing above it. Each run
 * also records whether it sat directly in the block or inside an inline child,
 * which is what the list-of-labels rule needs.
 */
function ownTexts(html: string): string[] {
  const src = stripDropped(html);
  const buckets: Run[][] = [];
  const stack: number[] = [];
  /** Inline-element nesting depth, per open block. */
  const inlineDepth: number[] = [];
  const tokenizer = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;

  const push = (raw: string) => {
    const t = decode(raw).replace(/\s+/g, " ").trim();
    if (!t || !/[A-Za-z0-9]/.test(t)) return;
    if (stack.length === 0) return; // text outside any block is chrome, not prose
    const idx = stack[stack.length - 1]!;
    buckets[idx]!.push({ text: t, direct: inlineDepth[stack.length - 1] === 0 });
  };

  while ((m = tokenizer.exec(src)) !== null) {
    push(src.slice(last, m.index));
    last = tokenizer.lastIndex;
    const tag = m[1]!.toLowerCase();
    const closing = m[0]!.startsWith("</");
    const selfClosing = m[2] === "/";
    if (BLOCK.test(tag)) {
      if (closing) {
        stack.pop();
        inlineDepth.pop();
      } else if (!selfClosing) {
        buckets.push([]);
        stack.push(buckets.length - 1);
        inlineDepth.push(0);
      }
      continue;
    }
    // An inline element (a, span, strong, em, button…) inside the open block.
    if (stack.length === 0 || selfClosing || tag === "br" || tag === "img") continue;
    const top = stack.length - 1;
    inlineDepth[top] = Math.max(0, (inlineDepth[top] ?? 0) + (closing ? -1 : 1));
  }
  push(src.slice(last));

  const out: string[] = [];
  for (const runs of buckets) {
    if (!runs.length) continue;
    if (runs.some((r) => r.direct)) {
      out.push(runs.map((r) => r.text).join(" "));
    } else {
      // A block with no words of its own is a row of labels, not a sentence.
      for (const r of runs) out.push(r.text);
    }
  }
  return out;
}

export function measure(html: string): Readability {
  const sentences: Sentence[] = [];
  for (const block of ownTexts(html)) {
    for (const s of splitSentences(block)) {
      const w = wordsIn(s);
      if (w >= MIN_WORDS) sentences.push({ text: s, words: w });
    }
  }
  const lens = sentences.map((s) => s.words).sort((a, b) => a - b);
  const n = lens.length;
  const mean = n ? lens.reduce((a, b) => a + b, 0) / n : 0;
  const median = n ? (n % 2 ? lens[(n - 1) / 2]! : (lens[n / 2 - 1]! + lens[n / 2]!) / 2) : 0;
  return {
    sentences,
    count: n,
    mean: Math.round(mean * 10) / 10,
    median,
    max: n ? lens[n - 1]! : 0,
    longest: sentences.slice().sort((a, b) => b.words - a.words).slice(0, 5),
  };
}
