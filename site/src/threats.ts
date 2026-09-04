/**
 * The attack-class taxonomy — nine plain-English classes (A1–A9) that say what
 * an attacker actually DID, mapped to the sscsb controls that defend against
 * each one.
 *
 * Lineage: SLSA v1.0's lettered threat model, the CNCF/OpenSSF TAG-Security
 * catalog of supply-chain compromises, and MITRE ATT&CK T1195. It sits UNDER
 * the tool's own T1–T7 stage model (README.md): T1–T7 answers "where in the
 * lifecycle", A1–A9 answers "what was done".
 *
 * ── The honesty contract, which every renderer inherits ──────────────────
 *
 * A failing control is a MISSING DEFENCE, not a demonstrated weakness. The
 * scan looks for defences; it never looks for, and cannot see, an attack. So:
 *
 *  - Never "this repository is vulnerable to X" / "exposed to X" /
 *    "unprotected against X". Those assert a property of the repository that
 *    was never measured. Say "no defence found against", which is a statement
 *    about the evidence and is true exactly when the evidence says so.
 *  - Never count `unverified` as a missing defence. That is the project's own
 *    doctrine inverted (scoring.ts: "an unperformed check is never a verdict")
 *    and it would fire on nearly every listing, because A3 and A6 are defended
 *    almost entirely by controls only the maintainer's machine can see.
 *  - Never attach an incident to a repository. Incidents describe the CLASS.
 *    They live in their own block, never inside a sentence about this repo.
 *  - Never rank classes by severity or colour them by risk. The scan measures
 *    whether controls are present, not how likely or costly an attack is.
 *  - "Evidenced" means every sscsb control mapped to this class passed. It
 *    does not mean the project is safe from the class — nine classes and 44
 *    controls do not exhaust the space.
 *
 * ── Fail-closed ─────────────────────────────────────────────────────────
 *
 * Like `reclassify.ts`'s registry: a control id with no entry is an error,
 * never a guess. The five posture-disclosure controls map to the explicit
 * sentinel `[]` — they declare posture rather than block a technique, and
 * saying so is more honest than inventing an attack for them. `assertParity()`
 * is called by the test suite so control #45 cannot silently defend nothing.
 */

import { CONTROL_REGISTRY } from "./reclassify";
import type { ScanRecord } from "./schema";

export type AttackClassId =
  | "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8" | "A9";

/**
 * How well-sourced an incident is.
 *
 * `primary` — this site opened the CVE record, the CISA alert, or the affected
 * project's own write-up. `reported` — consistent across multiple accounts,
 * but the primary document has not been opened here, and the page says so.
 * A directory whose premise is evidence over assertion cannot quietly cite
 * journalism as fact.
 */
export type SourceTier = "primary" | "reported";

/**
 * Every URL a `primary` mark rests on, with what was actually read from it.
 *
 * WHY THIS LIST EXISTS. `sourced: "primary"` is a claim about US — that this
 * site opened the document, not that the document exists. One incident carried
 * the mark on a source nobody here had opened: Apache Struts CVE-2017-5638,
 * added alongside Log4Shell because both are first-party bugs, and marked
 * `primary` by pattern-match rather than by anybody fetching the record. Ten of
 * eleven were genuine; that one was an assertion wearing evidence's clothes,
 * on a page whose entire argument is the difference between the two.
 *
 * The record has since been fetched (see the Struts entry) and the mark now
 * stands on the same footing as the rest. `test/threats.test.ts` fails if a
 * `primary` incident cites a URL that is not on this list, so the next one
 * cannot be added by pattern-match either.
 */
export const PRIMARY_SOURCES: Readonly<Record<string, string>> = Object.freeze({
  "https://www.cve.org/CVERecord?id=CVE-2024-3094":
    "xz/liblzma. Published 2024-03-29, CVSS 10.0. 'the liblzma build process extracts a prebuilt object file from a disguised test file'.",
  "https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident":
    "event-stream. flatmap-stream added 2018-09-09 in event-stream 3.3.6; payload targeted Copay 5.0.2-5.1.0.",
  "https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem":
    "Shai-Hulud. CISA alert 2025-09-23: 'over 500 packages'; authenticates to npm as the compromised developer; targets PATs and cloud credentials.",
  "https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/":
    "Ultralytics. GitHub Actions cache poisoning; then 'an unused PyPI API token … a hold-over from before the project adopted Trusted Publishing'; second wave had no publish attestations.",
  "https://pytorch.org/blog/compromised-nightly-dependency/":
    "torchtriton. 'PyPI index takes precedence'; binary exfiltrated /etc/passwd, ~/.ssh/* and ~/.gitconfig, Dec 25-30 2022.",
  "https://arxiv.org/abs/2406.10279":
    "Slopsquatting. Spracklen et al., USENIX Security 2025: 576,000 samples, 205,474 unique hallucinated package names.",
  "https://www.cve.org/CVERecord?id=CVE-2021-44228":
    "Log4Shell. Published 2021-12-10: 'An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers when message lookup substitution is enabled.'",
  "https://www.cve.org/CVERecord?id=CVE-2025-30066":
    "tj-actions/changed-files. Published 2025-03-15, CVSS 8.6: 'allows remote attackers to discover secrets by reading actions logs'.",
  "https://jfrog.com/blog/data-scientists-targeted-by-malicious-hugging-face-ml-models-with-silent-backdoor/":
    "Hugging Face models. Published 2024-02-27, 'around 100 instances', pickle __reduce__ on load.",
  "https://www.cve.org/CVERecord?id=CVE-2017-5638":
    "Apache Struts. Record published 2017-03-11: the Jakarta Multipart parser 'has incorrect exception handling and error-message generation during file-upload attempts, which allows remote attackers to execute arbitrary commands via a crafted Content-Type, Content-Disposition, or Content-Length HTTP header, as exploited in the wild in March 2017'.",
});

export interface Incident {
  /** Short name, as a reader would search for it. */
  title: string;
  /** ISO-ish date or month the event is dated to. */
  when: string;
  /** One sentence: what happened. No losses, no counts of victims. */
  what: string;
  url: string;
  sourced: SourceTier;
}

export interface AttackClass {
  id: AttackClassId;
  /** Plain-English name — no framework letters, no acronyms. */
  name: string;
  /** One line a non-expert gets. Under 20 words. */
  line: string;
  /** Which frameworks this class is drawn from. Shown once, small. */
  lineage: string;
  incidents: readonly Incident[];
}

/**
 * The nine classes, in stable order. Names are deliberately ordinary English:
 * the point is that somebody who has never read a SLSA spec can tell which
 * ones matter to them.
 */
export const ATTACK_CLASSES: readonly AttackClass[] = Object.freeze([
  {
    id: "A1",
    name: "Poisoned commit",
    line: "Code nobody authorised or reviewed lands in the source.",
    lineage: "SLSA A/B · CNCF source code, malicious maintainer",
    incidents: [
      {
        title: "xz / liblzma backdoor",
        when: "2024-03-29",
        what: "A contributor spent about two years earning maintainer trust, then hid a prebuilt object file inside a disguised test file so the build patched a backdoor into the shipped library.",
        url: "https://www.cve.org/CVERecord?id=CVE-2024-3094",
        sourced: "primary",
      },
      {
        title: "event-stream",
        when: "2018-09",
        what: "A new maintainer, handed the package by its worn-out original author, added a dependency whose payload only decrypted itself inside one bitcoin wallet.",
        url: "https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A2",
    name: "Stolen publisher identity",
    line: "The account or key that ships releases is used by someone who should not have it.",
    lineage: "SLSA F · CNCF phishing, trust and signing",
    incidents: [
      {
        title: "Shai-Hulud npm worm",
        when: "2025-09",
        what: "The worm authenticated to the registry as each developer it had compromised and republished their other packages as them.",
        url: "https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem",
        sourced: "primary",
      },
      {
        title: "Ultralytics",
        when: "2024-12",
        what: "A second malicious release went out on an unused API token left over from before the project moved to short-lived publishing credentials.",
        url: "https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A3",
    name: "Look-alike or invented package",
    line: "You install something that is not what you meant — a typo, a name collision, or a name an AI made up.",
    lineage: "SLSA D · ATT&CK T1195.001",
    incidents: [
      {
        title: "PyTorch torchtriton",
        when: "2022-12",
        what: "Someone registered the same name on the public index, which takes precedence, and the resulting binary shipped the developer's SSH keys and git config off the machine.",
        url: "https://pytorch.org/blog/compromised-nightly-dependency/",
        sourced: "primary",
      },
      {
        title: "Package names invented by AI models",
        when: "2025",
        what: "Across 576,000 generated code samples, models named packages that do not exist 205,474 distinct times — every one of them a name an attacker can simply register.",
        url: "https://arxiv.org/abs/2406.10279",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A4",
    name: "A real dependency turns hostile, or stays broken",
    line: "The genuine package you depend on ships malware, or a known hole in it is left open.",
    lineage: "SLSA D/H · CNCF outdated dependencies",
    incidents: [
      {
        title: "Shai-Hulud npm worm",
        when: "2025-09",
        what: "The first self-replicating supply-chain worm reached more than 500 packages, spreading itself through each one it reached.",
        url: "https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem",
        sourced: "primary",
      },
      {
        title: "Log4Shell",
        when: "2021-12-10",
        what: "One bug in a logging library became an emergency for every project that shipped it.",
        url: "https://www.cve.org/CVERecord?id=CVE-2021-44228",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A5",
    name: "Hijacked build pipeline",
    line: "The build system becomes the attacker's build machine, or hands over its credentials.",
    lineage: "SLSA E · CNCF dev tooling, publishing infrastructure",
    incidents: [
      {
        title: "tj-actions/changed-files",
        when: "2025-03-15",
        what: "A widely used build step's tags were repointed at malicious code that dumped every caller's secrets into logs anyone could read.",
        url: "https://www.cve.org/CVERecord?id=CVE-2025-30066",
        sourced: "primary",
      },
      {
        title: "Ultralytics",
        when: "2024-12",
        what: "A fork's branch name poisoned the build cache; the project's own legitimate publish job then restored that cache and built a wheel containing a crypto miner.",
        url: "https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A6",
    name: "Compromised developer environment",
    line: "The laptop, the editor extension, or the coding agent is the way in.",
    lineage: "CNCF dev tooling · ATT&CK T1195.001",
    incidents: [
      {
        title: "Malicious models on Hugging Face",
        when: "2024-02-27",
        what: "Around 100 models were built so that merely loading one opened a shell on the data scientist's own workstation.",
        url: "https://jfrog.com/blog/data-scientists-targeted-by-malicious-hugging-face-ml-models-with-silent-backdoor/",
        sourced: "primary",
      },
      {
        title: "Shai-Hulud npm worm",
        when: "2025-09",
        what: "The worm installed a secret-scanning tool on the victim's own machine and used it to find the credentials it then spread with.",
        url: "https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A7",
    name: "Leaked credential",
    line: "A key in the repository, the logs, or the build environment becomes the front door.",
    lineage: "ATT&CK T1552.001 · CNCF negligence",
    incidents: [
      {
        title: "tj-actions/changed-files",
        when: "2025-03-15",
        what: "The record's own words: it let remote attackers discover secrets by reading build logs. No repository access needed.",
        url: "https://www.cve.org/CVERecord?id=CVE-2025-30066",
        sourced: "primary",
      },
      {
        title: "Shai-Hulud npm worm",
        when: "2025-09",
        what: "What it harvested was other people's keys — code-hosting tokens and cloud credentials from every machine it reached.",
        url: "https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A8",
    name: "A flaw in the code you wrote",
    line: "The hole is yours, and you ship it to everyone downstream.",
    lineage: "CNCF negligence · the upstream half of SLSA D",
    incidents: [
      {
        title: "Log4Shell",
        when: "2021-12-10",
        what: "The same event as A4, seen from the other end: one project's own bug, everybody else's dependency crisis.",
        url: "https://www.cve.org/CVERecord?id=CVE-2021-44228",
        sourced: "primary",
      },
      {
        title: "Apache Struts remote code execution",
        when: "2017-03-11",
        // Rewritten from the record itself rather than from memory of it. The
        // old line ("patched the day it was published") was a paraphrase of a
        // document nobody here had opened, and the date it carried was the
        // vendor advisory's, not the record's.
        what: "A file-upload parser mishandled its own error messages, so a crafted header ran commands on the server. The record says it was already being exploited in the wild.",
        url: "https://www.cve.org/CVERecord?id=CVE-2017-5638",
        sourced: "primary",
      },
    ],
  },
  {
    id: "A9",
    name: "Untrustworthy delivery",
    line: "What people download cannot be tied back to what you built.",
    lineage: "SLSA F/G/H · CNCF trust and signing, publishing infrastructure",
    incidents: [
      {
        title: "Ultralytics",
        when: "2024-12",
        what: "The second malicious release carried no build receipts at all — which is how it was spotted.",
        url: "https://blog.pypi.org/posts/2024-12-11-ultralytics-attack-analysis/",
        sourced: "primary",
      },
      {
        title: "polyfill.io",
        when: "2024-06",
        what: "The domain that served a script to more than 100,000 sites changed hands, and then served something else. The code was never in anyone's repository.",
        url: "https://sansec.io/research/polyfill-supply-chain-attack",
        sourced: "reported",
      },
    ],
  },
]);

export const ATTACK_CLASS_BY_ID: ReadonlyMap<AttackClassId, AttackClass> = new Map(
  ATTACK_CLASSES.map((c) => [c.id, c]),
);

/**
 * Every control sscsb v1 can emit → the attack classes it defends against,
 * most-relevant first.
 *
 * `[]` is a real value, not a hole: those controls describe posture to an
 * outsider rather than blocking a technique. They render in their own group
 * with no exposure claim attached.
 */
export const CONTROL_THREATS: Readonly<Record<string, readonly AttackClassId[]>> =
  Object.freeze({
    // Phase 1 — local source integrity
    secrets: ["A7", "A5"],
    "commit-signing": ["A1", "A2"],
    "agent-signing": ["A1", "A2", "A6"],
    "signing-model": ["A1", "A2", "A6"],
    "branch-protection": ["A1", "A2"],
    "actions-audit": ["A5", "A4"],
    gittuf: ["A1", "A2"],
    "ai-trailers": ["A1", "A6"],
    "ai-dep-gate": ["A3", "A4", "A6"],
    "pr-template": ["A1", "A6"],
    "ai-receipts": ["A1", "A6"],
    // Phase 2 — dependency & vulnerability visibility
    sbom: ["A4", "A9"],
    "vuln-scan": ["A4", "A7", "A8"],
    scorecard: ["A4", "A1", "A5"],
    renovate: ["A4", "A5"],
    "package-trust": ["A3", "A4"],
    bumblebee: ["A6", "A4"],
    grype: ["A4"],
    "socket-firewall": ["A3", "A4", "A6"],
    // Phase 3 — provenance, signing & credential federation
    "sigstore-signing": ["A9", "A2"],
    "slsa-provenance": ["A9", "A5"],
    "github-attestations": ["A9", "A5"],
    "sbom-attestation": ["A9", "A4"],
    "model-signing": ["A9", "A4"],
    "provenance-verify": ["A9", "A5", "A2"],
    "release-immutability": ["A9", "A2"],
    "octo-sts": ["A7", "A5", "A2"],
    "harden-runner": ["A5", "A7"],
    witness: ["A5", "A9"],
    // Phase 4 — deeper code security & CI hardening
    sast: ["A8"],
    sighthound: ["A8"],
    codeql: ["A8"],
    fuzzing: ["A8"],
    "workflow-audit-extended": ["A5", "A7"],
    "secure-repo": [], // onboarding accelerator, not a check
    "wait-for-secrets": ["A7", "A5"],
    // Phase 5 — observability & governance
    "dependency-track": ["A4"],
    guac: ["A4", "A9"],
    openvex: ["A4"],
    oras: ["A9", "A4"],
    "security-insights": [], // posture disclosure
    "best-practices-badge": [], // posture disclosure
    "osps-baseline": [], // posture disclosure
    "compliance-map": [], // posture disclosure
  });

/**
 * The controls that map to no attack class. They are not weak controls — they
 * are a different kind of thing: they make a project's posture legible to an
 * outsider, which is worth doing and is not a defence against a technique.
 */
export const POSTURE_DISCLOSURE_CONTROLS: readonly string[] = Object.freeze(
  Object.keys(CONTROL_THREATS)
    .filter((id) => CONTROL_THREATS[id]!.length === 0)
    .sort(),
);

/** Fail-closed lookup: an unmapped control id is an error, never a guess. */
export function threatsFor(controlId: string): readonly AttackClassId[] {
  const t = CONTROL_THREATS[controlId];
  if (!t) {
    throw new Error(
      `control "${controlId}" has no attack-class mapping — add it to CONTROL_THREATS ` +
        `(use [] for a posture-disclosure control), never leave it to a guess`,
    );
  }
  return t;
}

/**
 * Drift guard between this table, the evidence registry, and the class list.
 * Called by the test suite. Without it a 45th control defends nothing and the
 * exposure panel silently under-reports with no error anywhere.
 */
export function assertParity(): void {
  const registry = Object.keys(CONTROL_REGISTRY).sort();
  const mapped = Object.keys(CONTROL_THREATS).sort();
  const missing = registry.filter((id) => !CONTROL_THREATS[id]);
  const extra = mapped.filter((id) => !(id in CONTROL_REGISTRY));
  if (missing.length) {
    throw new Error(`controls with no attack-class mapping: ${missing.join(", ")}`);
  }
  if (extra.length) {
    throw new Error(`attack-class mappings for unknown controls: ${extra.join(", ")}`);
  }
  const known = new Set(ATTACK_CLASSES.map((c) => c.id as string));
  for (const [id, classes] of Object.entries(CONTROL_THREATS)) {
    for (const c of classes) {
      if (!known.has(c)) throw new Error(`control ${id} maps to unknown class ${c}`);
    }
  }
  for (const c of ATTACK_CLASSES) {
    const defenders = Object.entries(CONTROL_THREATS).filter(([, cs]) => cs.includes(c.id));
    if (defenders.length === 0) throw new Error(`class ${c.id} has no controls mapped to it`);
    if (c.incidents.length === 0) throw new Error(`class ${c.id} has no incidents`);
  }
}

/** Every control mapped to a class, in registry order. */
export function controlsDefending(cls: AttackClassId): readonly string[] {
  return Object.keys(CONTROL_REGISTRY).filter((id) =>
    (CONTROL_THREATS[id] ?? []).includes(cls),
  );
}

/**
 * What a scan of one repository can say about one class.
 *
 * `none-found` — countable controls exist here and none of them passed.
 * `partial`    — some passed, some are missing or broken.
 * `evidenced`  — every countable control passed. NOT "safe from this class".
 * `not-observed` — nothing in this class carried a verdict at all.
 */
export type ExposureState = "none-found" | "partial" | "not-observed" | "evidenced";

export interface ClassExposure {
  cls: AttackClass;
  state: ExposureState;
  /** Control ids that passed. */
  passed: readonly string[];
  /** Control ids scored `gap` — the defence was not found. */
  absent: readonly string[];
  /** Control ids scored `fail` — a defence is there and it is broken. */
  broken: readonly string[];
  /** Control ids with no verdict (`unverified` / `info`). */
  notObserved: readonly string[];
  /** Of `notObserved`, the ones only the maintainer's own machine can see. */
  localOnly: readonly string[];
}

const LOCAL_ONLY_CLASS = "C";

/**
 * Derive the exposure view for one record. Reads only `in_scope` controls and
 * only the outcome vocabulary already in `schema.ts` — no sixth state.
 *
 * Sort order is by EVIDENCE, never by drama: what has nothing, then what has
 * something, then what nobody looked at, then what is fully evidenced. The
 * scan has no data with which to rank one class as scarier than another.
 */
const STATE_ORDER: Readonly<Record<ExposureState, number>> = {
  "none-found": 0,
  partial: 1,
  "not-observed": 2,
  evidenced: 3,
};

export function exposureFor(record: ScanRecord): ClassExposure[] {
  const byId = new Map(record.controls.filter((c) => c.in_scope).map((c) => [c.id, c]));
  const out: ClassExposure[] = [];
  for (const cls of ATTACK_CLASSES) {
    const passed: string[] = [];
    const absent: string[] = [];
    const broken: string[] = [];
    const notObserved: string[] = [];
    const localOnly: string[] = [];
    for (const id of controlsDefending(cls.id)) {
      const c = byId.get(id);
      if (!c) continue; // not in this record's scope at all
      if (c.scan_outcome === "pass") passed.push(id);
      else if (c.scan_outcome === "gap") absent.push(id);
      else if (c.scan_outcome === "fail") broken.push(id);
      else {
        notObserved.push(id);
        if (CONTROL_REGISTRY[id]?.cls === LOCAL_ONLY_CLASS) localOnly.push(id);
      }
    }
    const countable = passed.length + absent.length + broken.length;
    let state: ExposureState;
    if (countable === 0) state = "not-observed";
    else if (absent.length + broken.length === 0) state = "evidenced";
    else if (passed.length === 0) state = "none-found";
    else state = "partial";
    out.push({ cls, state, passed, absent, broken, notObserved, localOnly });
  }
  out.sort((a, b) => {
    const s = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    return s !== 0 ? s : a.cls.id < b.cls.id ? -1 : 1;
  });
  return out;
}

/**
 * The one-line verdict for a class, in the site's third-person register.
 *
 * Every one of these is a claim about the EVIDENCE, never about the
 * repository. "No defence found" survives the objection that a project may
 * defend a class in a way sscsb cannot see; "unprotected against" does not.
 */
export function exposureLine(e: ClassExposure): string {
  const found = e.passed.length;
  const countable = found + e.absent.length + e.broken.length;
  switch (e.state) {
    case "none-found":
      return `No defence found — 0 of ${countable} checks passed.`;
    case "partial":
      return `Some defences found — ${found} of ${countable} checks passed.`;
    case "evidenced":
      // "Every check passed" would overstate it: a class can be fully
      // evidenced on its countable controls while several others in the same
      // class produced no answer at all.
      return e.notObserved.length === 0
        ? `Every check passed — ${found} of ${found}.`
        : `Every answered check passed — ${found} of ${found}. ` +
          `${e.notObserved.length} more produced no answer.`;
    case "not-observed":
      if (e.notObserved.length > 0 && e.localOnly.length === e.notObserved.length) {
        return "Not observed — every check here runs on the maintainer's own machine.";
      }
      if (e.localOnly.length > 0) {
        return (
          `Not observed — nothing here produced an answer, and ${e.localOnly.length} of ` +
          `${e.notObserved.length} can only be answered on the maintainer's own machine.`
        );
      }
      return "Not observed — no check in this group produced an answer.";
  }
}

/** The standing caveat that must appear wherever exposure is rendered. */
export const EXPOSURE_CAVEAT =
  "This lists defences the scan found, not weaknesses it found. " +
  "A missing defence is not a break-in, and a full set of checks is not safety: " +
  "nine groups and 44 checks do not cover everything.";

/** The one-line explainer for the posture-disclosure group. */
export const POSTURE_DISCLOSURE_LINE =
  "These checks do not stop an attack. They let an outsider tell what a project " +
  "already does, and where to report a problem.";
