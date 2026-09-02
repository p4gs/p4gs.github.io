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
 * three provenance states, and each detail page gets the record itself (and
 * its Sigstore bundle, when signed) published beside it, byte-identical, so
 * anyone can re-run `cosign verify-blob` against what the site shows.
 */
import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { BASE_PATH } from "./config";
import { DEFAULT_DESIGN, DESIGNS } from "./designs/registry";
import { repoSlugPath } from "./designs/ledger/directory";
import { renderLanding } from "./designs/ledger/landing";
import type { Design, DesignCtx } from "./designs/types";
import { validateScanRecord, type ScanRecord } from "./schema";
import { trustFilename, trustKeyOf, validateTrustInfo, type TrustInfo } from "./trust";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "data", "repos");
const TRUST = join(ROOT, "data", "trust");
const DIST = join(ROOT, "dist");
const PUBLIC = join(ROOT, "public");

interface Loaded {
  /** Source filename under data/repos — the exact bytes we republish. */
  file: string;
  record: ScanRecord;
}

async function loadRecords(): Promise<Loaded[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DATA)).filter((f) => f.endsWith(".json"));
  } catch {
    return []; // no data dir yet — an empty directory is a valid launch state
  }
  const out: Loaded[] = [];
  for (const f of files.sort()) {
    const raw = await Bun.file(join(DATA, f)).json();
    try {
      out.push({ file: f, record: validateScanRecord(raw) });
    } catch (e) {
      throw new Error(`${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

/**
 * Trust sidecars, keyed like records (`owner--name`). A sidecar that fails
 * validation breaks the build for the same reason a bad record does: the
 * site must never render a provenance claim it cannot stand behind.
 */
async function loadTrust(records: ScanRecord[]): Promise<Map<string, TrustInfo>> {
  const out = new Map<string, TrustInfo>();
  for (const r of records) {
    const f = trustFilename(r.repo.owner, r.repo.name);
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

function prefixFor(d: Design): string {
  return d.id === DEFAULT_DESIGN.id ? BASE_PATH : `${BASE_PATH}_d/${d.id}/`;
}

/**
 * The cross-design switcher for one page. Pure links (equivalent subpath in
 * every design) + a small script: remember the chosen design, and on the
 * default tree redirect once to a remembered alternate (`?stay` opts out).
 */
function switcherFor(current: Design, subpath: string): string {
  const links = DESIGNS.map((d) => {
    const target = `${prefixFor(d)}${subpath}`;
    const cls = d.id === current.id ? ' aria-current="true"' : "";
    return `<a data-design="${d.id}" href="${target}"${cls}>${d.label}</a>`;
  }).join("");
  return `<nav class="design-switcher" aria-label="Design variant">
<span class="ds-label">Design</span>${links}
</nav>
<script>(function(){
  var KEY="sscsb-design";
  try{
    var here="${current.id}", def="${DEFAULT_DESIGN.id}", base="${BASE_PATH}", sub="${subpath}";
    if(here!==def){localStorage.setItem(KEY,here);}
    else{
      var want=localStorage.getItem(KEY);
      if(want&&want!==def&&location.search.indexOf("stay")===-1){
        var el=document.querySelector('.design-switcher a[data-design="'+want+'"]');
        if(el){location.replace(el.getAttribute("href"));}
      }
    }
    var links=document.querySelectorAll(".design-switcher a");
    for(var i=0;i<links.length;i++){links[i].addEventListener("click",function(){
      try{localStorage.setItem(KEY,this.getAttribute("data-design"));}catch(e){}
    });}
  }catch(e){}
})();</script>`;
}

async function write(path: string, html: string): Promise<void> {
  const full = join(DIST, path);
  await mkdir(join(full, ".."), { recursive: true });
  await Bun.write(full, html);
}

export async function build(): Promise<{ pages: number; repos: number; designs: number }> {
  const loaded = await loadRecords();
  const records = loaded.map((l) => l.record);
  const trust = await loadTrust(records);
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
      trust,
    });

    await write(join("sscsb", tree, "style.css"), design.css ?? defaultCss);
    await write(join("sscsb", tree, "filter.js"), filterJs);
    await write(
      join("sscsb", tree, "index.html"),
      design.renderHome(records.length, ctxFor("home", "")),
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
    for (const { file, record: r } of loaded) {
      const sub = repoSlugPath(r);
      await write(
        join("sscsb", tree, sub, "index.html"),
        design.renderRepoDetail(r, ctxFor("directory", sub)),
      );
      pages += 1;
      // Publish the record itself (byte-identical — a re-serialized copy would
      // no longer match its signature) and, when signed, the bundle beside it,
      // so anyone can re-run `cosign verify-blob` against what the site shows.
      const dir = join(DIST, "sscsb", tree, sub);
      await cp(join(DATA, file), join(dir, "scan-record.json"));
      const t = trust.get(trustKeyOf(r));
      if (t?.bundle) {
        await cp(join(TRUST, t.bundle), join(dir, "scan-record.json.sigstore.json"));
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
