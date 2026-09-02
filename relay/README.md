# sscsb scan-intake relay

A single Vercel serverless function (`POST /api/scan-request`) that lets an
anonymous visitor on the directory site queue a scan with one click. It
validates the submitted repository, then creates the `scan-request` issue on
`p4gs/p4gs.github.io` server-side via a GitHub App — the visitor never needs a
GitHub account or token.

Zero runtime dependencies: GitHub App auth is a hand-rolled RS256 JWT via
`node:crypto`. All logic lives in [`lib.ts`](lib.ts); the function in
[`api/scan-request.ts`](api/scan-request.ts) is a thin adapter.

## GitHub App requirements

Create a GitHub App (Settings → Developer settings → GitHub Apps) with:

- **Repository permissions:** Issues — Read and write. Nothing else.
- **Webhook:** disabled (uncheck "Active"); no webhook URL needed.
- **Where installed:** only on `p4gs/p4gs.github.io` (select "Only select
  repositories"). The relay resolves its installation from that repo, so a
  broader install grants nothing but risk.

Generate a key from the App's settings page. GitHub downloads it in PKCS#1
PEM format; convert it to PKCS8 for the env var:

```sh
openssl pkcs8 -topk8 -nocrypt -in downloaded-key.pem -out scan-intake-pkcs8.pem
```

## Environment variables

| Name | Value |
|------|-------|
| `SCAN_INTAKE_APP_ID` | The GitHub App's numeric App ID |
| `SCAN_INTAKE_APP_KEY` | The App's signing key, PKCS8 PEM (paste the whole file; literal `\n` escapes are also tolerated) |

If either is missing the endpoint answers `503 {"error":"scan intake not configured"}`.

## Vercel project setup

1. Import this repository into Vercel.
2. Project Settings → General → **Root Directory = `relay`** (functions
   auto-detect from `api/`; no build command, no output directory).
3. Project Settings → Environment Variables → add the two variables above
   (Production; Preview optional).
4. Deploy. The endpoint is `https://<project>.vercel.app/api/scan-request`.

Allowed browser origins (reflected via CORS): `https://tools.sensiblesecurity.xyz`,
`https://p4gs.github.io`, `http://localhost:4173`, `http://localhost:8080`.
Edit `ALLOWED_ORIGINS` in `lib.ts` to change.

## Behavior

`POST` a JSON body `{"repo":"owner/repo"}` (full `https://github.com/owner/repo`
URLs also accepted). Responses:

| Status | Body | Meaning |
|--------|------|---------|
| 201 | `{"state":"queued","issue_url":…}` | scan-request issue created |
| 200 | `{"state":"existing","issue_url":…}` | an open request for that repo already exists |
| 400 | `{"error":…}` | malformed body or invalid `owner/repo` |
| 404 | `{"error":…}` | repository does not exist or is not visible |
| 422 | `{"error":…}` | repository is private / archived / disabled / over the size cap |
| 429 | `{"error":"scan queue is full"}` | 25+ open scan-request issues |
| 503 | `{"error":"scan intake not configured"}` | env vars missing |
| 502 | `{"error":"github api error"}` | upstream GitHub failure (details never leaked) |

## Tests

```sh
cd relay && bun test
```

Pure logic only — no network; GitHub is stubbed via an injected `fetch`.

## Curl smoke test

```sh
curl -sS -X POST \
  -H 'content-type: application/json' \
  -H 'origin: https://tools.sensiblesecurity.xyz' \
  -d '{"repo":"p4gs/sscs-bootstrapper"}' \
  https://<project>.vercel.app/api/scan-request | jq .
```

Expect `{"state":"queued","issue_url":"…"}` (or `"existing"` on a repeat), and
a new `[scan] p4gs/sscs-bootstrapper` issue labeled `scan-request` on
`p4gs/p4gs.github.io`. A preflight check:

```sh
curl -sSi -X OPTIONS \
  -H 'origin: https://tools.sensiblesecurity.xyz' \
  -H 'access-control-request-method: POST' \
  https://<project>.vercel.app/api/scan-request | head -n 10
```

should return `204` with `access-control-allow-origin` reflected.
