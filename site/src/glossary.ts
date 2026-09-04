/**
 * Plain-language contract for the terms this site cannot avoid.
 *
 * The discipline is scorecard.dev's, measured: 18 check descriptions, mean 8.7
 * words, every one a yes/no question, and jargon defined by explaining it at
 * first use rather than in a glossary nobody scrolls to.
 *
 * Two rules follow from that, and both are enforced by tests:
 *
 *  1. The HOME page uses none of these terms. A first-time visitor should not
 *     have to learn a vocabulary to understand what the site does. Where a
 *     term carried real meaning, `PLAIN` gives the replacement that keeps it.
 *  2. Anywhere else a term IS used — the directory and the methodology, where
 *     precision is the product — its plain-English definition appears on the
 *     same page, marked with `data-defines`. Deleting the definition breaks
 *     the build's test suite, not just the reader's understanding.
 *
 * What this is NOT: an instruction to be vaguer. The claims stay exactly as
 * precise. The sentences get shorter and the terms get defined.
 */

export interface GlossaryEntry {
  /** The term as it appears in copy. */
  term: string;
  /** One sentence, no jargon of its own, under about 20 words. */
  plain: string;
}

/**
 * Terms that must carry a definition wherever they appear.
 *
 * Keys are the machine-checkable slug used in `data-defines`; `term` is what
 * the sentence actually says.
 */
export const GLOSSARY: Readonly<Record<string, GlossaryEntry>> = Object.freeze({
  coverage: {
    term: "evidence coverage",
    plain: "how many of the checks produced a yes-or-no answer at all",
  },
  provisional: {
    term: "provisional",
    plain: "the grade stands, but too much went unchecked to treat it as settled",
  },
  unverified: {
    term: "unverified",
    plain: "nobody could answer this check — which is not the same as failing it",
  },
  lane: {
    term: "evidence source",
    plain: "who ran the scan, and therefore how much of the project they could see",
  },
  attestation: {
    term: "attestation",
    plain: "a signed receipt saying which build produced which file",
  },
  keyless: {
    term: "keyless signing",
    plain: "signing with a short-lived certificate tied to the build, so there is no long-lived key to steal",
  },
  anchor: {
    term: "signer list",
    plain: "the file a project commits naming the keys it accepts scans from",
  },
  countable: {
    term: "answered checks",
    plain: "the checks that produced a pass, a fail, or a missing-defence result",
  },
  gap: {
    term: "gap",
    plain: "the defence was looked for and not found",
  },
});

/** The plain-English replacement for a term the home page must not use. */
export const PLAIN: Readonly<Record<string, string>> = Object.freeze({
  coverage: "how many checks could be answered",
  provisional: "not the whole picture",
  unverified: "nobody could check this",
  lane: "who ran the scan",
  attestation: "a signed build receipt",
  keyless: "short-lived signing certificates",
  anchor: "the project's own list of accepted signers",
  countable: "answered checks",
});

/**
 * Terms the home page may not contain, in any design.
 *
 * Every one is on the current site's home page today, undefined. Each either
 * has a `PLAIN` replacement above or was deleted with the sentence around it.
 * `site/test/home.test.ts` fails if one comes back.
 */
export const RETIRED_ON_HOME: readonly string[] = Object.freeze([
  "provisional",
  "coverage",
  "countable",
  "denominator",
  "attestation",
  "keyless",
  "SSHSIG",
  "allowed_signers",
  "egress",
  "OpenGrep",
  "VEX",
  "SLSA",
  "SBOM",
  "SAST",
  "harden-runner",
  "trufflehog",
  "gitleaks",
]);

/**
 * The inline definition, marked so a test can prove it is on the page.
 *
 * Rendered as an ordinary parenthetical rather than a tooltip: a `title`
 * attribute is invisible on a phone, and the phone is where most first
 * readings happen.
 */
export function define(key: string): string {
  const e = GLOSSARY[key];
  if (!e) throw new Error(`glossary: no entry for "${key}"`);
  return `<span class="term-def" data-defines="${key}">— ${e.plain}</span>`;
}

/** The term itself, marked as the point of first use, with its definition. */
export function defineTerm(key: string): string {
  const e = GLOSSARY[key];
  if (!e) throw new Error(`glossary: no entry for "${key}"`);
  return `<strong class="term">${e.term}</strong> ${define(key)}`;
}
