/**
 * Vercel Node.js serverless function: POST /api/scan-request
 *
 * Thin adapter only — all behavior (CORS, validation, GitHub App auth, dedup,
 * queue cap, issue creation) lives in ../lib.ts where `bun test` covers it
 * with an injected fetch. Deploy with Vercel Root Directory = relay.
 */

import { handleScanRequest } from "../lib.js";

/** Structural subset of Vercel's request/response — keeps relay/ zero-dep. */
interface NodeRequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface NodeResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
}

export default async function handler(req: NodeRequestLike, res: NodeResponseLike): Promise<void> {
  const rawOrigin = req.headers["origin"];
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;

  const out = await handleScanRequest(
    {
      method: (req.method ?? "GET").toUpperCase(),
      origin,
      body: req.body,
    },
    process.env,
    fetch,
  );

  for (const [name, value] of Object.entries(out.headers)) res.setHeader(name, value);
  res.statusCode = out.status;
  res.end(out.body === null ? undefined : JSON.stringify(out.body));
}
