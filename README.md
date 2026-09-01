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
