# Security Policy

## Reporting a Vulnerability

Please report vulnerabilities privately via
[GitHub Security Advisories](https://github.com/p4gs/p4gs.github.io/security/advisories/new)
on this repository. Do not open a public issue for security reports.

You can expect an acknowledgement within 7 days. There is no bug bounty.

## Scope

This repository holds a static site (GitHub Pages) and its scan-directory
pipeline. Reports about the site content, the build/publish workflows, or the
supply-chain controls configured under `.sscsb/` are all in scope.

## Supply-chain posture

Machine-readable posture lives in [`security-insights.yml`](security-insights.yml)
(OpenSSF Security Insights v2). Controls are managed by
[sscs-bootstrapper](https://github.com/p4gs/sscs-bootstrapper); run
`sscsb status` in a clone to see them.
