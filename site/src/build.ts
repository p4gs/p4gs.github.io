/**
 * Static site build: site/data/repos/*.json + templates → site/dist/.
 * Fails loudly on an invalid or wrong-schema record — a bad record must break
 * the build, never publish a page it can't stand behind.
 */
import { mkdir, readdir, cp } from "node:fs/promises";
import { join } from "node:path";
import { renderDirectory, renderRepoDetail, repoSlugPath } from "./render/directory";
import { renderHome } from "./render/home";
import { renderLanding } from "./render/landing";
import { renderMethodology } from "./render/methodology";
import { recordFilename, validateScanRecord, type ScanRecord } from "./schema";
import { trustFilename, validateTrustInfo, type TrustInfo } from "./trust";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "data", "repos");
const TRUST = join(ROOT, "data", "trust");
const DIST = join(ROOT, "dist");
const PUBLIC = join(ROOT, "public");

async function loadRecords(): Promise<ScanRecord[]> {
  let files: string[] = [];
  try {
    files = (await readdir(DATA)).filter((f) => f.endsWith(".json"));
  } catch {
    return []; // no data dir yet — an empty directory is a valid launch state
  }
  const records: ScanRecord[] = [];
  for (const f of files.sort()) {
    const raw = await Bun.file(join(DATA, f)).json();
    try {
      records.push(validateScanRecord(raw));
    } catch (e) {
      throw new Error(`${f}: ${(e as Error).message}`);
    }
  }
  return records;
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
      out.set(f.replace(/\.json$/, ""), validateTrustInfo(await file.json()));
    } catch (e) {
      throw new Error(`trust/${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

function recordKey(r: ScanRecord): string {
  return recordFilename(r.repo.owner, r.repo.name).replace(/\.json$/, "");
}

async function write(path: string, html: string): Promise<void> {
  const full = join(DIST, path);
  await mkdir(join(full, ".."), { recursive: true });
  await Bun.write(full, html);
}

export async function build(): Promise<{ pages: number; repos: number }> {
  const records = await loadRecords();
  const trust = await loadTrust(records);
  await mkdir(DIST, { recursive: true });
  await cp(PUBLIC, join(DIST, "sscsb"), { recursive: true });
  // Domain-root landing routes to each tool; the sscsb site lives at /sscsb/.
  await write("index.html", renderLanding(records.length));
  await write("sscsb/index.html", renderHome(records.length));
  await write("sscsb/directory/index.html", renderDirectory(records, trust));
  await write("sscsb/methodology/index.html", renderMethodology());
  for (const r of records) {
    const key = recordKey(r);
    const t = trust.get(key);
    const dir = join("sscsb", repoSlugPath(r));
    await write(join(dir, "index.html"), renderRepoDetail(r, t));
    // Publish the record itself (byte-identical — a re-serialized copy would
    // no longer match its signature) and, when signed, the bundle beside it,
    // so anyone can re-run `cosign verify-blob` against what the site shows.
    await cp(join(DATA, `${key}.json`), join(DIST, dir, "scan-record.json"));
    if (t?.bundle) {
      await cp(join(TRUST, t.bundle), join(DIST, dir, "scan-record.json.sigstore.json"));
    }
  }
  const cname = join(ROOT, "..", "CNAME");
  if (await Bun.file(cname).exists()) await cp(cname, join(DIST, "CNAME"));
  return { pages: 4 + records.length, repos: records.length };
}

if (import.meta.main) {
  const { pages, repos } = await build();
  console.log(`built ${pages} pages (${repos} repo records) → site/dist/`);
}
