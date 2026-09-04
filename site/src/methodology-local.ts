/**
 * The published spec for the LOCAL lane — one canonical text, rendered by all
 * four designs inside their own section chrome.
 *
 * This is deliberately NOT copied per design the way the evidence-class blurbs
 * are: it states what a signature does and does not prove, and four drifting
 * copies of a security claim is exactly the failure mode the directory exists
 * to argue against. Designs vary the shell (headings, rails, framing); the
 * claim is identical everywhere.
 *
 * It opens with the CONTRACT BLOCK, verbatim, because that block is the only
 * normative statement of the lane and it is mirrored byte-for-byte from the
 * tool's own `docs/local-scan.md`. A reader who wants to check the directory's
 * arithmetic against the tool's output needs the same twelve lines both
 * programs were built against, not a paraphrase of them.
 */

import { LOCAL_SCAN_COMMAND } from "./coverage";
import {
  CONTRACT_TEXT,
  LOCAL_ANCHOR_PATH,
  LOCAL_RECORD_PATH,
  LOCAL_SIGNATURE_PATH,
} from "./local-contract";
import { COVERAGE_FLOOR_PROVISIONAL } from "./scoring";
import { LOCAL_SIGNATURE_NAMESPACE } from "./trust";

/** Section anchor every design uses, so cross-links from listings stay valid. */
export const LOCAL_SECTION_ID = "local";

export const LOCAL_TITLE = "Local records: the third lane";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * The body, as `<p>`/`<ol>`/`<pre>` blocks.
 *
 * `h` is the design's internal-link helper — every href must carry BASE_PATH
 * (the link-integrity test enforces it), so bare `#fragment` links are not an
 * option. `codeClass` lets a design attach its own class to the code blocks
 * (e.g. `inkblock mono`) without rewriting the text.
 */
export function localLaneBody(h: (path: string) => string, codeClass = ""): string {
  const pre = codeClass ? `<pre class="${codeClass}">` : "<pre>";
  return `
    <p>Ten or eleven controls per repository are <a href="${h('methodology/#evidence-classes')}">class C</a>:
    they describe the <em>development environment</em> — commit signing configuration,
    AI-assistant trailers, dependency gates, package-trust hooks. No repository scan
    can observe them, from inside CI or out, so they score <strong>unverified</strong>
    and sit outside every denominator. For a repository that has actually adopted them,
    that is a permanent ceiling on evidence coverage. It is why a well-run repository
    can still read <em>provisional</em>.</p>

    <p>The local lane closes exactly that gap. A maintainer runs</p>
    ${pre}<code>${LOCAL_SCAN_COMMAND}</code></pre>
    <p>which scans the working tree, writes a record, and signs it with the maintainer's
    <strong>git signing key</strong>. That is the same <code>user.signingkey</code> /
    <code>gpg.format=ssh</code> / <code>gpg.ssh.program</code> configuration git itself
    uses, so a 1Password- or hardware-backed key works untouched.</p>

    <h3 id="local-contract">The contract</h3>
    <p>The tool and this directory are two programs that have to agree exactly — down to
    a namespace string and a file path. Otherwise every submission fails in a way neither
    side can see. So the agreement is written down once, in the tool's
    <code>docs/local-scan.md</code>, and mirrored here byte for byte. Both trees test
    their own copy against these values, and both pin the same digest over the block.
    An edit on one side that the other does not mirror fails a test, instead of shipping
    a lane that does not work.</p>
    ${pre}<code>${esc(CONTRACT_TEXT)}</code></pre>
    <p>Two lines carry most of the weight. <code>record-path</code> and
    <code>signature-path</code> are <strong>committed</strong> paths. The submission is a
    <em>pointer</em>: the directory reads the record, the signature and the trust anchor
    out of the public repository. Nothing a submitter types reaches the bytes that get
    verified. And <code>record-shape</code> is <code>ScanRecord</code> — the
    directory's own schema, the same one every other lane produces, with every required
    field including <code>methodology_version</code>. A signature makes bytes
    unreshapeable, so the shape has to be right at signing time.</p>

    <h3>The trust anchor</h3>
    <p>A local scan has no OIDC identity: there is no CI run to issue a certificate
    against. What it does have is a file the repository <em>already commits</em>.
    <code>${LOCAL_ANCHOR_PATH}</code> — generated from
    <code>.sscsb/policy/signers.toml</code> — is the anchor the commit-signing control
    itself uses. So ingest verifies the record with</p>
    ${pre}<code>ssh-keygen -Y verify -f allowed_signers \\
  -I "&lt;signer&gt;" -n ${LOCAL_SIGNATURE_NAMESPACE} \\
  -s ${LOCAL_SIGNATURE_PATH} &lt; ${LOCAL_RECORD_PATH}</code></pre>
    <p>against an <code>allowed_signers</code> fetched <strong>from the public repository
    at the scanned commit</strong>. That is committed content, read through the GitHub
    contents API at that ref, never anything the submitter hands us. A record whose
    signature does not verify is refused outright — exactly as a Sigstore bundle that
    fails <code>cosign verify-blob</code> is refused.</p>

    <h3 id="local-human-only">Only a human-class approved signer may assert a local record</h3>
    <p><code>sscsb</code> grants the <code>${LOCAL_SIGNATURE_NAMESPACE}</code> namespace to
    <code>class = "human"</code> signers <strong>only</strong>. A <code>ci</code> or
    <code>ai</code> entry in <code>.sscsb/policy/signers.toml</code> keeps
    <code>namespaces="git"</code> and nothing else, so its commits still verify and its
    scan records cannot.</p>
    <p>Three reasons, none of them tidiness. A local record is <em>a person's attested
    word</em> about a machine nobody can inspect. It is the one lane whose
    local-environment verdicts count with no corroboration. What makes that acceptable is
    that a named human put their key behind it. CI does not need the grant:
    it has the authenticated lane, which proves strictly more. And an AI-class signer asserting one
    would contradict the invariant the signing policy is built on: an agent may draft
    anything and signs nothing.</p>
    <p>The refusal is <strong>structural, not advisory</strong>. Because the namespace is
    simply absent from the anchor line, the <code>ssh-keygen -Y verify</code> above fails:
    the tool refuses to produce the record, and this directory refuses to ingest one,
    without either of them re-implementing the rule.</p>
    <p>The same fact has a consequence. A repository anchored before this lane existed
    cannot submit yet. A listing in that state is told to regenerate and commit its
    anchor <em>first</em>, rather than promised a one-line fix that would refuse.</p>

    <h3>What this proves — and what it does not</h3>
    <p><strong>Proves:</strong> a holder of a key this repository commits as an approved
    signer asserts this result at commit X. That is attributable, auditable, and
    re-checkable by anyone: the directory publishes the local record and its signature
    beside the listing, and the command above is the whole verification.</p>
    <p><strong>Does not prove:</strong> that the scan ran on a clean machine, that the
    tools were the ones claimed, or that the working tree matched the commit. Nobody
    can check a workstation. This is <em>weaker</em> than the authenticated
    lane, which proves the repository's own CI produced the record under an identity
    GitHub's OIDC issuer burned in. It never earns the ✓ verified mark.</p>

    <h3 id="local-scoring">The scoring rule</h3>
    <p>A repository's grade takes account of its GitHub Actions-emitted results
    <em>and</em> its local scan-emitted results. These are not mutually exclusive lanes,
    and neither one is a second-class citizen. For each control the directory collects a
    verdict from <strong>every evidence source</strong> it holds. There are three of
    them: the newest action-lane record whose signature verified, the newest local-lane
    record whose signature verified, and the external record the directory produced
    itself. Then:</p>
    <ol>
    <li><strong>Two or more sources give different countable verdicts</strong> (pass,
    fail or gap) → the control scores <strong>gap</strong>. It also carries a
    <strong>contradiction flag</strong> naming each source and the verdict it gave. The
    flag appears on the record, on the listing row and on the detail page. Scoring a
    disagreement down while saying nothing about it would hide the most interesting fact
    the directory holds about that repository.</li>
    <li><strong>Exactly one distinct countable verdict</strong> across sources → that
    verdict, whichever lane produced it. A local <code>pass</code> counts; so does a
    local <code>fail</code>.</li>
    <li><strong>No countable verdict</strong> → <code>unverified</code> or
    <code>info</code>, outside every denominator, exactly as before.</li>
    </ol>
    <p>A contradiction therefore <strong>costs</strong> the repository — a gap sits in
    the denominator without passing. That is deliberate. Erring on the side of caution
    removes any incentive to submit a flattering local scan: the flattering answer never
    wins, it only ever converts a row into a gap.</p>

    <h3 id="local-lane-discipline">…and where a lane could not have looked, its verdict is not evidence</h3>
    <p>The same principle runs backwards. A repository-observable lane cannot observe class
    C: the development environment is not in the checkout. So a class-C verdict carried by
    an action-lane or external record is <strong>dropped before anything is counted</strong>,
    whatever it says. It is not countable evidence. It does not satisfy the independence
    requirement above for other rows. And it cannot contradict a genuine local verdict into
    a gap. A verdict a source could not have made is not a verdict.</p>

    <h3 id="local-self-report">The record's own score is the submitter's, not ours</h3>
    <p>A local record is a complete, self-describing <code>ScanRecord</code>, so it carries a
    top-level <code>score</code> block: a grade, a percentage, a coverage figure. Those were
    computed on the maintainer's machine, over the controls that machine had in scope. This
    directory republishes the record <strong>byte for byte</strong>. The signature covers
    those exact bytes, and rewriting them would destroy the only thing that makes the record
    evidence.</p>
    <p>So two scores can be reached from one listing, and only one of them is ours. The grade
    on the listing and on the detail page is the <strong>directory's</strong>, computed here
    from every evidence source under the published methodology. The number inside
    <code>${LOCAL_RECORD_PATH.split("/").pop()}</code> is the <strong>submitter's
    self-report</strong>. Every listing carrying a local record says which is which, in both
    places, and names both numbers. Quoting the embedded grade as a directory grade should
    take work, not inattention.</p>

    <h3 id="local-observability">Where someone else could have checked, we require that someone else</h3>
    <p>One requirement makes that union safe, and it is not "local counts less".</p>
    <p>Classes A, A′ and B are <em>by definition</em> observable from a repository
    scan — a committed artifact, a committed workflow, a live GitHub setting. For those
    rows a maintainer's self-report <strong>alone</strong> is not countable. With no
    independent source the control stays <code>unverified</code>, outside the
    denominator. It becomes countable the moment a CI or external record exists to agree
    or disagree with it.</p>
    <p>Class C is <em>by definition</em> not independently observable — it lives on the
    workstation and nowhere else. There the maintainer's signed word is the best evidence
    that can exist, and it counts on its own.</p>
    <p>The practical consequence, and the reason the requirement exists: a repository
    whose <strong>only</strong> evidence is a local record publishes with its class-C
    rows scored and everything else <code>unverified</code>. Its evidence coverage is
    low, so it reads <em>NA — insufficient evidence</em>, never A+. A local record lifts
    a real score only alongside a scan somebody else could run. The scope such a listing
    is measured against is the <strong>directory's</strong> control set, not the
    record's: a record cannot shrink its own denominator by declining to mention a
    control.</p>

    <h3>Gates</h3>
    <p>A local submission passes through everything an authenticated one does. The
    record must be a valid v1 <code>ScanRecord</code> for the repository the request
    names. The signature must verify against the repository's own committed
    <code>allowed_signers</code>. And a maintainer must still apply the
    <code>publish</code> label. The authenticated lane's auto-publish gate is not
    available to it. A listing that used the local lane says so, on the listing and on
    the detail page. It names the controls the local record actually resolved. It says so
    again when that record describes a <strong>different commit</strong> than the
    repository scan it sits beside. A local record has no expiry. A stale one quietly
    filling holes in a much newer scan is something a reader has to be told about.</p>

    <p>Coverage below ${COVERAGE_FLOOR_PROVISIONAL}% still reads <em>provisional</em>
    after a local scan if the remaining holes are elsewhere. Where that is the case the
    listing says so rather than promising a fix the command cannot deliver.</p>`;
}
