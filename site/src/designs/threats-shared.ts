/**
 * Rendering for the attack-class taxonomy — the full explainer on the
 * methodology page, and the per-repository "what defences were found" panel.
 *
 * Written once for four designs because this is where the honesty rules bite
 * hardest. Every sentence about a repository here is a statement about the
 * EVIDENCE ("no defence found"), never about the repository ("vulnerable to"),
 * and every incident sits in its own block, never inside a sentence about the
 * project being read. See the contract at the top of `src/threats.ts`.
 */

import { CHECK_QUESTIONS } from "../checks";
import { CONTROL_REGISTRY } from "../reclassify";
import {
  ATTACK_CLASSES,
  controlsDefending,
  EXPOSURE_CAVEAT,
  exposureFor,
  exposureLine,
  POSTURE_DISCLOSURE_CONTROLS,
  POSTURE_DISCLOSURE_LINE,
  threatsFor,
  type ClassExposure,
} from "../threats";
import type { ScanRecord } from "../schema";
import type { Href } from "./home-shared";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** The classes a control defends, read through the fail-closed lookup. */
const CONTROL_THREATS_FOR = (id: string): readonly string[] => threatsFor(id);

export const THREATS_SECTION_ID = "threats";
export const THREATS_TITLE = "What the checks are for";

/**
 * The full nine-class explainer.
 *
 * Each class carries: the plain line, the checks that defend it, and — in a
 * visually separate block — real incidents of that shape. The incident block
 * is separate on purpose: "SolarWinds had no build receipts; this project has
 * no build receipts" is a syllogism a reader finishes as a prediction, and the
 * scan measured nothing that would support it.
 */
export function threatsSection(h: Href): string {
  const classes = ATTACK_CLASSES.map((c) => {
    const defenders = controlsDefending(c.id)
      .map((id) => `<code>${esc(id)}</code>`)
      .join(", ");
    const incidents = c.incidents
      .map(
        (i) => `<li class="tx-incident">
        <a href="${esc(i.url)}">${esc(i.title)}</a>
        <span class="tx-incident-when">${esc(i.when)}</span>${
          i.sourced === "reported"
            ? `<span class="tx-reported" title="Widely reported. Unlike the others on this page, this site has not opened the primary document.">reported</span>`
            : ""
        }
        <span class="tx-incident-what">${esc(i.what)}</span>
      </li>`,
      )
      .join("\n");
    return `<div class="tx-class" id="threat-${c.id.toLowerCase()}">
    <h3 class="tx-class-title"><span class="tx-chip-id">${c.id}</span> ${esc(c.name)}</h3>
    <p class="tx-class-line">${esc(c.line)}</p>
    <p class="tx-class-controls"><span class="tx-label">Checks that defend it</span> ${defenders}</p>
    <details class="tx-details">
      <summary>What this looks like when it happens</summary>
      <ul class="tx-incidents">
${incidents}
      </ul>
    </details>
    <p class="tx-lineage">${esc(c.lineage)}</p>
  </div>`;
  }).join("\n  ");

  const posture = POSTURE_DISCLOSURE_CONTROLS.map((id) => `<code>${esc(id)}</code>`).join(", ");
  const questions = Object.keys(CONTROL_REGISTRY)
    .map((id) => {
      const groups = (CONTROL_THREATS_FOR(id) ?? []).join(" ") || "—";
      return `<tr><td><code>${esc(id)}</code></td><td>${esc(
        CHECK_QUESTIONS[id] ?? "",
      )}</td><td class="tx-q-groups">${esc(groups)}</td></tr>`;
    })
    .join("\n");

  return `<section class="method-section prose tx-section" id="${THREATS_SECTION_ID}">
  <h2>${THREATS_TITLE}</h2>
  <p>Nine groups, drawn from the SLSA threat model, the CNCF supply-chain
  compromise catalog, and MITRE ATT&amp;CK T1195. They answer "what did the
  attacker do". That is a different question from "where in the lifecycle", which the
  tool's own T1–T7 model answers.</p>
  <p><strong>Read the groups carefully.</strong> ${esc(EXPOSURE_CAVEAT)}</p>
  <p class="tx-sourcing">Every incident below links to a primary source — a CVE record, a
  government alert, or the affected project's own write-up. The one exception is marked
  <span class="tx-reported">reported</span>.</p>
  <div class="tx-classes">
  ${classes}
  </div>
  <div class="tx-questions" id="every-check">
    <h3 class="tx-class-title">Every check, as a question</h3>
    <p class="tx-class-line">All 44, in the order they run, with the groups each one
    defends. A blank group means the check tells outsiders what a project does rather
    than stopping an attack.</p>
    <div class="table-scroll">
    <table class="method-table tx-q-table">
    <thead><tr><th>Check</th><th>The question it answers</th><th>Groups</th></tr></thead>
    <tbody>
${questions}
    </tbody>
    </table>
    </div>
  </div>

  <div class="tx-class tx-class-posture" id="threat-posture">
    <h3 class="tx-class-title">And five checks that defend against none of them</h3>
    <p class="tx-class-line">${esc(POSTURE_DISCLOSURE_LINE)}</p>
    <p class="tx-class-controls"><span class="tx-label">These checks</span> ${posture}</p>
    <p>They are not weak checks. They are a different kind of thing, and saying so is
    more honest than inventing an attack for them. Three of the five currently move the
    grade; that is a scoring question, recorded here because publishing this map is what
    made it visible. See <a href="${h("methodology/#formula")}">the formula</a>.</p>
  </div>
</section>`;
}

const STATE_LABEL: Readonly<Record<ClassExposure["state"], string>> = {
  "none-found": "No defence found",
  partial: "Some defences found",
  "not-observed": "Not observed",
  evidenced: "All answered checks passed",
};

/**
 * The per-repository panel: which groups this scan found defences for.
 *
 * Ordered by evidence — nothing found, then partly found, then not looked at,
 * then fully evidenced. Never by severity: the scan measured whether checks
 * are present, not how likely or costly an attack would be, so it has no basis
 * for calling one group scarier than another and no business colouring one red.
 */
export function exposurePanel(h: Href, r: ScanRecord): string {
  const rows = exposureFor(r)
    .map((e) => {
      const missing = [...e.broken, ...e.absent];
      const detail: string[] = [];
      if (e.broken.length) {
        detail.push(
          `<span class="ex-detail"><span class="ex-detail-label">Broken</span> ${e.broken
            .map((id) => `<code>${esc(id)}</code>`)
            .join(", ")} — the defence is there and it is not working.</span>`,
        );
      }
      if (e.absent.length) {
        detail.push(
          `<span class="ex-detail"><span class="ex-detail-label">Not found</span> ${e.absent
            .map((id) => `<code>${esc(id)}</code>`)
            .join(", ")}</span>`,
        );
      }
      if (e.notObserved.length) {
        detail.push(
          `<span class="ex-detail ex-detail-quiet"><span class="ex-detail-label">No answer</span> ${e.notObserved
            .map((id) => `<code>${esc(id)}</code>`)
            .join(", ")}${
            e.localOnly.length
              ? ` — ${e.localOnly.length === e.notObserved.length ? "all" : `${e.localOnly.length}`} of these only a maintainer's own machine can answer`
              : ""
          }</span>`,
        );
      }
      return `<li class="ex-row ex-${e.state}">
    <span class="ex-head">
      <a class="ex-name" href="${h(`methodology/#threat-${e.cls.id.toLowerCase()}`)}"><span class="tx-chip-id">${
        e.cls.id
      }</span> ${esc(e.cls.name)}</a>
      <span class="ex-state">${esc(STATE_LABEL[e.state])}</span>
    </span>
    <span class="ex-line">${esc(exposureLine(e))}</span>
    ${detail.join("\n    ")}
    ${
      missing.length === 0 && e.state === "evidenced"
        ? `<span class="ex-detail ex-detail-quiet">Every sscsb check here that produced an answer passed. That is not the same as being safe from this group.</span>`
        : ""
    }
  </li>`;
    })
    .join("\n");
  return `<section class="exposure" id="exposure">
  <h2 class="nudge-title">Defences found, by attack group</h2>
  <p class="body-copy">${esc(EXPOSURE_CAVEAT)}
  <a href="${h(`methodology/#${THREATS_SECTION_ID}`)}">What the nine groups are →</a></p>
  <ul class="ex-list">
${rows}
  </ul>
  <p class="ex-foot">${esc(POSTURE_DISCLOSURE_LINE)} They are not in the list above:
  ${POSTURE_DISCLOSURE_CONTROLS.map((id) => `<code>${esc(id)}</code>`).join(", ")}.</p>
</section>`;
}
