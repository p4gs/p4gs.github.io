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
import { validateScanRecord, type ScanRecord } from "./schema";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "data", "repos");
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

async function write(path: string, html: string): Promise<void> {
  const full = join(DIST, path);
  await mkdir(join(full, ".."), { recursive: true });
  await Bun.write(full, html);
}

export async function build(): Promise<{ pages: number; repos: number }> {
  const records = await loadRecords();
  await mkdir(DIST, { recursive: true });
  await cp(PUBLIC, join(DIST, "sscsb"), { recursive: true });
  // Domain-root landing routes to each tool; the sscsb site lives at /sscsb/.
  await write("index.html", renderLanding(records.length));
  await write("sscsb/index.html", renderHome(records.length));
  await write("sscsb/directory/index.html", renderDirectory(records));
  await write("sscsb/methodology/index.html", renderMethodology());
  for (const r of records) {
    await write(join("sscsb", repoSlugPath(r), "index.html"), renderRepoDetail(r));
  }
  const cname = join(ROOT, "..", "CNAME");
  if (await Bun.file(cname).exists()) await cp(cname, join(DIST, "CNAME"));
  return { pages: 4 + records.length, repos: records.length };
}

if (import.meta.main) {
  const { pages, repos } = await build();
  console.log(`built ${pages} pages (${repos} repo records) → site/dist/`);
}
