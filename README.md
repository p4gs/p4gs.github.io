# tools.sensiblesecurity.xyz

Router + site repo for Sensible Security's open-source tools.

- **`/`** — tools landing page
- **`/sscsb/`** — [SSCS Bootstrapper](https://github.com/p4gs/sscs-bootstrapper)
  homepage + the public scan directory (submit any public repo for an
  external sscsb scan, or publish an authenticated one with
  [sscsb-action](https://github.com/p4gs/sscsb-action))

The site is a bun + TypeScript static build (`site/`), deployed by
`.github/workflows/pages.yml`. Scan records live in `site/data/repos/`;
every record lands via a maintainer-reviewed PR. Scoring is documented at
[/sscsb/methodology/](https://tools.sensiblesecurity.xyz/sscsb/methodology/).

Authenticated records that arrive **signed** (sscsb-action with `id-token:
write`) are verified at ingest against the producing repository's workflow
identity — `OWNER/REPO/.github/workflows/sscsb-scan.yml` on its live default
branch — and listed as ✓ verified, with the Sigstore bundle published beside
the record (`site/data/trust/`) so anyone can re-verify. Unsigned
authenticated records are listed as unverified claims. Trust model:
[/sscsb/methodology/#trust](https://tools.sensiblesecurity.xyz/sscsb/methodology/#trust).

Repositories that run `sscsb-scan.yml` can skip the cross-repo submission
token entirely: add `owner/repo` to `site/data/registry.json` by PR and
`directory-collect.yml` polls the run, files the submission issue with this
repo's own token, and dispatches ingest.
