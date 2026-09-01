/**
 * Publish-gate revalidation: the downloaded artifact must be a valid v1
 * record AND describe the same repository the triggering issue requested —
 * an artifact swapped between issues fails here.
 */
import { extractSlug } from "./parse-request";
import { validateScanRecord } from "../schema";

if (import.meta.main) {
  const record = validateScanRecord(
    await Bun.file(process.env.RECORD_PATH ?? "scan-record.json").json(),
  );
  const body = process.env.ISSUE_BODY ?? "";
  const parsed = extractSlug(body);
  if ("error" in parsed) {
    console.error(`issue body no longer parses: ${parsed.error}`);
    process.exit(1);
  }
  const want = `${parsed.owner}/${parsed.name}`.toLowerCase();
  const got = `${record.repo.owner}/${record.repo.name}`.toLowerCase();
  if (want !== got) {
    console.error(`record is for ${got} but the issue requests ${want} — refusing`);
    process.exit(1);
  }
  console.log(`record validated: ${got}, grade ${record.score.grade}`);
}
