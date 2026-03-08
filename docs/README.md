# Notes Reworked

`notes-reworked` is a parity-focused static reorganization of the current notes app with a minimal root.

The repo now keeps only `index.html` at the top level and groups the rest by purpose:

- `app/`: runtime pages, shared source, built CSS, and vendor libraries
- `assets/`: logos, downloadable PDFs, and contact files consumed by the app
- `tooling/`: package manifest, build config, smoke scripts, and Playwright tests
- `docs/`: repository documentation

## What changed

- The broken Vite scaffold entry point was replaced with a working static `index.html`.
- Remote iframe references were replaced with local page paths.
- The moved pages were patched to resolve shared CSS, scripts, vendor files, and static assets from the new layout.
- `DSMDx.html` was cleaned up to remove dead saved-page asset references.
- Existing smoke checks and template fixtures were updated to the new `pages/` structure.
- A reusable `index:smoke` Playwright check was added for the main page.

## Parity coverage

Included in this repo:

- Main shell: `index.html`
- Standalone tools: `app/pages/Templates.html`, `app/pages/SUD_Diagnostic_Tool.html`, `app/pages/DSMDx.html`, `app/pages/Treatment_Planner.html`, `app/pages/letters.html`, `app/pages/safetyplan.html`, `app/pages/CSSRS.html`, and `app/pages/qr.html`
- Shared source: `app/src/templates.js`
- Shared runtime assets: `assets/images/logo.png`, `assets/documents/Referrals.pdf`, and `assets/contacts/delphi-rise-contact.vcf` with its source image `assets/contacts/contact-image.png`

## Commands

Install dependencies:

```bash
npm --prefix tooling install
```

Rebuild Tailwind output:

```bash
npm --prefix tooling run build
```

Run structural smoke checks:

```bash
npm --prefix tooling run smoke
```

Run runtime template fixtures:

```bash
npm --prefix tooling run fixtures
```

Run the main-page smoke test:

```bash
npm --prefix tooling run index:smoke
```

Serve the repo locally over HTTP:

```bash
npm --prefix tooling run serve
```

## Validation status

The reworked repo has been validated with:

- `npm --prefix tooling run build`
- `npm --prefix tooling run smoke`
- `npm --prefix tooling run fixtures`
- `npm --prefix tooling run index:smoke`

Both the template runtime fixtures and the root `index.html` smoke checks pass in the new structure.
