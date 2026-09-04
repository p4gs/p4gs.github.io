/**
 * Static site build: site/data/repos/*.json (+ site/data/trust/*.json
 * sidecars) + the design registry → site/dist/.
 *
 * Four-up design trial: the DEFAULT design serves at BASE_PATH; every other
 * registered design serves the same complete page tree under
 * BASE_PATH + `_d/<id>/`, and every page carries a floating switcher linking
 * to its equivalent in each design. A visitor's choice persists in
 * localStorage; the default tree honors a stored choice with one client-side
 * redirect (escape hatch: `?stay`). Fails loudly on an invalid record — a bad
 * record must break the build, never publish a page it can't stand behind.
 *
 * Trust sidecars ride along in the DesignCtx so every design renders the same
 * provenance states, and each detail page gets the record itself (and its
 * Sigstore bundle, when signed) published beside it, byte-identical, so
 * anyone can re-run `cosign verify-blob` against what the site shows.
 *
 * The LOCAL lane adds a second, smaller input: site/data/local/*.json holds a
 * maintainer-signed workstation record, site/data/trust/*.local.json its
 * verified sidecar, and site/data/trust/*.local.sig the detached SSH
 * signature. The build folds it in through `mergeEvidence` — every source votes
 * on every control, disagreement scores a gap with a named contradiction, and a
 * local assertion about a control a repository scan could observe is held back
 * until something independent agrees with it — and republishes the local record
 * and its signature byte-identically beside the listing so anyone can re-run
 * `ssh-keygen -Y verify` against what the site shows.
 *
 * `DIST` is cleared first. It is a build OUTPUT, not an accumulator: leaving it
 * in place kept the artifacts of a listing that had since been removed, so a
 * delisted repository stayed reachable by URL after the rebuild that dropped it.
 */
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { BASE_PATH, SITE_ORIGIN, STAY_PARAM } from "./config";
import { DEFAULT_DESIGN, DESIGNS } from "./designs/registry";
import { repoSlugPath } from "./designs/ledger/directory";
import { renderLanding } from "./designs/ledger/landing";
import type { Design, DesignCtx } from "./designs/types";
import type { ListingFacts } from "./listing";
import { mergeEvidence, type EvidenceSource } from "./reclassify";
import { validateScanRecord, type ScanRecord } from "./schema";
import {
  LOCAL_RECORD_PUBLISHED,
  LOCAL_SIGNATURE_PUBLISHED,
  localTrustFilename,
  scanLaneOf,
  trustFilename,
  trustKeyOf,
  validateTrustInfo,
  type TrustInfo,
} from "./trust";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "data", "repos");
const LOCAL = join(ROOT, "data", "local");
const TRUST = join(ROOT, "data", "trust");
const DIST = join(ROOT, "dist");
const PUBLIC = join(ROOT, "public");

interface Loaded {
  /** Source filename under data/repos — the exact bytes we republish. */
  file: string;
  record: ScanRecord;
}

async function loadDir(dir: string, label: string): Promise<Loaded[]> {
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    return []; // no data dir yet — an empty directory is a valid launch state
  }
  const out: Loaded[] = [];
  for (const f of files.sort()) {
    const raw = await Bun.file(join(dir, f)).json();
    try {
      out.push({ file: f, record: validateScanRecord(raw) });
    } catch (e) {
      throw new Error(`${label}/${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

/**
 * Trust sidecars, keyed like records (`owner--name`). A sidecar that fails
 * validation breaks the build for the same reason a bad record does: the
 * site must never render a provenance claim it cannot stand behind.
 */
async function loadTrust(
  records: ScanRecord[],
  filenameOf: (owner: string, name: string) => string,
): Promise<Map<string, TrustInfo>> {
  const out = new Map<string, TrustInfo>();
  for (const r of records) {
    const f = filenameOf(r.repo.owner, r.repo.name);
    const file = Bun.file(join(TRUST, f));
    if (!(await file.exists())) continue;
    try {
      out.set(trustKeyOf(r), validateTrustInfo(await file.json()));
    } catch (e) {
      throw new Error(`trust/${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

/** One published listing: the effective record plus the raw files behind it. */
interface Listing {
  /** The record every design renders (the merge of every evidence source). */
  record: ScanRecord;
  /** Path of the base record's source file, republished byte-identically. */
  baseFile: string | null;
  /** Path of the local record's source file, republished byte-identically. */
  localFile: string | null;
}

/**
 * Fold every evidence source into one listing per repository.
 *
 * A local record with no verified sidecar is REFUSED — the same fail-closed
 * rule the action lane has: an unverifiable provenance claim never reaches a
 * page.
 *
 * The merge itself is `mergeEvidence` (reclassify.ts): every source votes on
 * every control, disagreement scores a gap with a named contradiction, and a
 * local assertion about an independently-observable control is held back until
 * something independent agrees with it.
 */
async function loadListings(): Promise<{
  listings: Listing[];
  trust: Map<string, TrustInfo>;
  localTrust: Map<string, TrustInfo>;
  facts: Map<string, ListingFacts>;
}> {
  const base = await loadDir(DATA, "repos");
  const local = await loadDir(LOCAL, "local");
  const trust = await loadTrust(base.map((l) => l.record), trustFilename);
  const localTrust = await loadTrust(local.map((l) => l.record), localTrustFilename);

  const keyOf = (r: ScanRecord) => trustKeyOf(r);
  const localByKey = new Map(local.map((l) => [keyOf(l.record), l]));

  for (const l of local) {
    const key = keyOf(l.record);
    const t = localTrust.get(key);
    if (!t) {
      throw new Error(
        `local/${l.file}: no verified trust sidecar at data/trust/${localTrustFilename(
          l.record.repo.owner,
          l.record.repo.name,
        )} — a local record is evidence ONLY through its verified SSH signature; refusing to publish it`,
      );
    }
    if (t.lane !== "local") {
      throw new Error(`local/${l.file}: sidecar lane is "${t.lane}", expected "local"`);
    }
    if (t.commit !== l.record.repo.commit) {
      throw new Error(
        `local/${l.file}: sidecar verified commit ${t.commit} but the record claims ` +
          `${l.record.repo.commit} — refusing to publish a signature bound to different bytes`,
      );
    }
  }

  const listings: Listing[] = [];
  const facts = new Map<string, ListingFacts>();
  const seen = new Set<string>();

  const publish = (
    key: string,
    sources: EvidenceSource[],
    baseFile: string | null,
    localFile: string | null,
    baseCommit: string | null,
    localCommit: string | null,
  ) => {
    const merged = mergeEvidence(sources);
    listings.push({ record: merged.record, baseFile, localFile });
    // The local record's OWN score block, captured before the merge replaced
    // it. The signed bytes are republished verbatim beside the listing, so a
    // reader can fetch a grade the directory never awarded; every design says
    // which number is whose. Taken from the source record, never from the
    // merged one — the merged score IS the directory's answer.
    const localSource = sources.find((s) => s.lane === "local")?.record;
    facts.set(key, {
      resolvedByLocal: merged.resolvedByLocal,
      contradictions: merged.contradictions,
      awaitingIndependent: merged.awaitingIndependent,
      localOnly: merged.localOnly,
      selfReported: localSource
        ? {
            grade: localSource.score.grade,
            provisional: localSource.score.provisional,
            overall_percent: localSource.score.overall_percent,
            evidence_coverage_percent: localSource.score.evidence_coverage_percent,
          }
        : null,
      // Compare the local record against the BASE's commit, not against its
      // own sidecar: the sidecar is bound to the same commit by construction,
      // so that comparison can never disagree and proves nothing. A stale
      // local record silently filling holes in a much newer base is exactly
      // what this catches.
      staleAgainstBase:
        baseCommit && localCommit && baseCommit !== localCommit
          ? { local: localCommit, base: baseCommit }
          : null,
    });
    const lt = localTrust.get(key);
    if (lt) localTrust.set(key, { ...lt, resolved: merged.resolvedByLocal });
  };

  for (const b of base) {
    const key = keyOf(b.record);
    seen.add(key);
    const l = localByKey.get(key);
    const sources: EvidenceSource[] = [
      { lane: scanLaneOf(b.record), record: b.record },
    ];
    if (l) sources.push({ lane: "local", record: l.record });
    publish(
      key,
      sources,
      b.file,
      l?.file ?? null,
      b.record.repo.commit,
      l?.record.repo.commit ?? null,
    );
  }
  for (const [key, l] of localByKey) {
    if (seen.has(key)) continue;
    publish(key, [{ lane: "local", record: l.record }], null, l.file, null, null);
  }

  listings.sort((a, b) =>
    `${a.record.repo.owner}/${a.record.repo.name}`.toLowerCase() <
    `${b.record.repo.owner}/${b.record.repo.name}`.toLowerCase()
      ? -1
      : 1,
  );
  return { listings, trust, localTrust, facts };
}

function prefixFor(d: Design): string {
  return d.id === DEFAULT_DESIGN.id ? BASE_PATH : `${BASE_PATH}_d/${d.id}/`;
}

/**
 * The cross-design switcher for one page. Pure links (equivalent subpath in
 * every design) + a small script that remembers a CHOSEN design.
 *
 * THE BUG THIS SHAPE EXISTS TO PREVENT. The remembering used to happen on
 * LOAD: `if (here !== def) localStorage.setItem(KEY, here)`. So merely viewing
 * one alternate page once — following a link, opening a shared URL, landing
 * from a search result — silently made that design permanent, and every later
 * visit to the canonical `/sscsb/` redirected away from the default the site
 * had chosen. A visit is not a choice. Only a click on the switcher is, so
 * only a click writes.
 *
 * Escape hatches, because a sticky redirect that cannot be undone is the same
 * bug wearing a hat:
 *   - clicking the DEFAULT design's link FORGETS the preference outright;
 *   - that link also carries `?${STAY_PARAM}`, so it is a shareable
 *     "always give me the default" URL, and arriving with it clears the
 *     stored value and suppresses the redirect for that load;
 *   - a stored value naming a design that no longer exists is ignored (and
 *     cleared) rather than redirecting into a 404.
 *
 * A first-time visitor has nothing stored, so no redirect happens. A crawler
 * runs no script and gets the default tree; every alternate page also points
 * its canonical at the default page, so the trial is not four publications.
 */
export function switcherFor(current: Design, subpath: string): string {
  const links = DESIGNS.map((d) => {
    const isDefault = d.id === DEFAULT_DESIGN.id;
    // The default link doubles as the reset: it clears the stored choice, and
    // carries the opt-out parameter so even a stale write cannot bounce it.
    const target = `${prefixFor(d)}${subpath}${isDefault ? `?${STAY_PARAM}` : ""}`;
    const cls = d.id === current.id ? ' aria-current="true"' : "";
    return `<a data-design="${d.id}" href="${target}"${cls}>${d.label}</a>`;
  }).join("");
  const ids = JSON.stringify(DESIGNS.map((d) => d.id));
  return `<nav class="design-switcher" aria-label="Design variant">
<span class="ds-label">Design</span>${links}
</nav>
<script>(function(){
  var KEY="sscsb-design";
  var DEF=${JSON.stringify(DEFAULT_DESIGN.id)}, KNOWN=${ids};
  var HERE=${JSON.stringify(current.id)};
  function known(v){for(var i=0;i<KNOWN.length;i++){if(KNOWN[i]===v)return true;}return false;}
  function stay(){
    // An exact parameter match. Substring matching on the query string made
    // any URL containing the letters "stay" opt out by accident.
    var q=(location.search||"").replace(/^\\?/,"").split("&");
    for(var i=0;i<q.length;i++){
      var k=q[i].split("=")[0];
      if(k===${JSON.stringify(STAY_PARAM)})return true;
    }
    return false;
  }
  try{
    var opted=stay();
    if(opted){try{localStorage.removeItem(KEY);}catch(e){}}
    // NOTE: nothing is written here from the page's own identity. Viewing a
    // page is not choosing it.
    if(HERE===DEF&&!opted){
      var want=null;
      try{want=localStorage.getItem(KEY);}catch(e){}
      if(want&&want!==DEF){
        if(!known(want)){try{localStorage.removeItem(KEY);}catch(e){}}
        else{
          var el=document.querySelector('.design-switcher a[data-design="'+want+'"]');
          if(el){location.replace(el.getAttribute("href"));return;}
        }
      }
    }
    var links=document.querySelectorAll(".design-switcher a");
    for(var i=0;i<links.length;i++){links[i].addEventListener("click",function(){
      var id=this.getAttribute("data-design");
      try{
        if(id===DEF){localStorage.removeItem(KEY);}
        else{localStorage.setItem(KEY,id);}
      }catch(e){}
    });}
    // The switcher is position:fixed, so it sits OVER whatever is at the
    // bottom of the viewport — which, scrolled to the end of the page, is the
    // footer. A static bottom padding on <main> could never fix that: the
    // footer is outside main. And the height is not a constant to hard-code —
    // measured live it is 56px at 390px wide and 102px at 320px, where the
    // links wrap onto three rows. So it measures itself and reserves exactly
    // that much at the end of the document. The CSS fallback covers no-JS.
    var nav=document.querySelector(".design-switcher");
    if(nav){
      var reserve=function(){
        var r=nav.getBoundingClientRect();
        var gap=(window.innerHeight-r.bottom); // its own inset-block-end
        document.documentElement.style.setProperty(
          "--switcher-clearance",Math.ceil(r.height+(gap>0?gap:10)+12)+"px");
      };
      reserve();
      window.addEventListener("resize",reserve);
      window.addEventListener("orientationchange",reserve);
      if(window.ResizeObserver){new ResizeObserver(reserve).observe(nav);}
    }
  }catch(e){}
})();</script>`;
}

async function write(path: string, html: string): Promise<void> {
  const full = join(DIST, path);
  await mkdir(join(full, ".."), { recursive: true });
  await Bun.write(full, html);
}

export async function build(): Promise<{ pages: number; repos: number; designs: number }> {
  const { listings, trust, localTrust, facts } = await loadListings();
  const records = listings.map((l) => l.record);
  // Clear the output tree first. `dist/` is a build OUTPUT, and mkdir-without-
  // clearing quietly made it an ACCUMULATOR: a listing removed from
  // site/data/repos/ kept its rendered page, its republished scan-record.json
  // and its signature bundle, all still served at their old URLs by a build
  // that no longer knows they exist. Delisting a repository has to actually
  // delist it — and the same rule catches a design that is retired, a page
  // that is renamed, and a stale artifact from a half-finished run.
  //
  // Every byte under here is regenerated below from site/data and site/public,
  // so there is nothing to preserve; the only input that lives in dist/ between
  // runs is nothing.
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  const defaultCss = await Bun.file(join(PUBLIC, "style.css")).text();
  const filterJs = await Bun.file(join(PUBLIC, "filter.js")).text();

  let pages = 0;
  for (const design of DESIGNS) {
    const prefix = prefixFor(design);
    const tree = prefix.slice(BASE_PATH.length); // "" or "_d/<id>/"
    const ctxFor = (active: string, subpath: string): DesignCtx => ({
      prefix,
      h: (p: string) => `${prefix}${p.replace(/^\//, "")}`,
      switcher: switcherFor(design, subpath),
      active,
      // Always the DEFAULT design's URL for this page, in every tree.
      canonical: `${SITE_ORIGIN}${BASE_PATH}${subpath}`,
      trust,
      localTrust,
      facts,
    });

    await write(join("sscsb", tree, "style.css"), design.css ?? defaultCss);
    await write(join("sscsb", tree, "filter.js"), filterJs);
    await write(
      join("sscsb", tree, "index.html"),
      design.renderHome(records, ctxFor("home", "")),
    );
    await write(
      join("sscsb", tree, "directory/index.html"),
      design.renderDirectory(records, ctxFor("directory", "directory/")),
    );
    await write(
      join("sscsb", tree, "methodology/index.html"),
      design.renderMethodology(ctxFor("methodology", "methodology/")),
    );
    pages += 3;
    for (const { baseFile, localFile, record: r } of listings) {
      const sub = repoSlugPath(r);
      await write(
        join("sscsb", tree, sub, "index.html"),
        design.renderRepoDetail(r, ctxFor("directory", sub)),
      );
      pages += 1;
      // Publish the records themselves (byte-identical — a re-serialized copy
      // would no longer match its signature) and, when signed, the signature
      // beside each, so anyone can re-run `cosign verify-blob` (action lane) or
      // `ssh-keygen -Y verify` (local lane) against what the site shows.
      const dir = join(DIST, "sscsb", tree, sub);
      if (baseFile) await cp(join(DATA, baseFile), join(dir, "scan-record.json"));
      const t = trust.get(trustKeyOf(r));
      if (t?.bundle) {
        await cp(join(TRUST, t.bundle), join(dir, "scan-record.json.sigstore.json"));
      }
      if (localFile) {
        await cp(join(LOCAL, localFile), join(dir, LOCAL_RECORD_PUBLISHED));
        const lt = localTrust.get(trustKeyOf(r));
        if (lt?.signature_file) {
          await cp(join(TRUST, lt.signature_file), join(dir, LOCAL_SIGNATURE_PUBLISHED));
        }
      }
    }
  }

  // Domain-root landing: single, default-design chrome, no switcher.
  await write("index.html", renderLanding(records.length));
  pages += 1;
  const cname = join(ROOT, "..", "CNAME");
  if (await Bun.file(cname).exists()) await cp(cname, join(DIST, "CNAME"));

  return { pages, repos: records.length, designs: DESIGNS.length };
}

if (import.meta.main) {
  const { pages, repos, designs } = await build();
  console.log(`built ${pages} pages (${repos} repo records × ${designs} designs) → site/dist/`);
}
