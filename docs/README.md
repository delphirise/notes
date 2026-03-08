# Notes App (Reworked)

This repository contains a full static implementation of a suite of internal tools used by Delphi Rise for generating clinical letters, templates, and documentation.

It is built as a simple HTML/CSS/JS project with the following goals:

-  **Run without a bundler** (static pages that work under an HTTP server)
-  **Keep tooling minimal** (Tailwind build + a small smoke-test suite)
-  **Be easy to maintain and hand off** (clear structure + documentation)

---

##  Repository Layout

### `index.html`
The main entry point: a landing page that links to the individual tool pages.

### `app/`
The runtime application content.

- `app/pages/` — each standalone tool (letters, diagnostics, templates, etc.) lives here.
- `app/src/` — shared JS utilities used by multiple pages.
- `app/vendor/` — third-party library bundles (jsPDF, html2canvas, pdf-lib, etc.).
- `app/dist/` — generated Tailwind CSS output (`output.css`).

### `assets/`
Shared assets that can be referenced from any page.

- `assets/images/` — logos and icons.
- `assets/documents/` — PDFs used by the app (e.g., `Referrals.pdf`).
- `assets/contacts/` — vCards, contact files.

### `tooling/`
Build and test tooling.

- `package.json` and `node_modules`
- Tailwind build config (`postcss.config.js`, `tailwind.config.js`)
- Smoke-check scripts and Playwright tests.

### `docs/`
Documentation for maintainers.

- `docs/README.md` — this file
- `docs/HANDOFF.md` — detailed handoff guide for new maintainers

---

##  Running Locally (Recommended)

### 1) Install dependencies
```bash
npm --prefix tooling install
```

### 2) Serve the site locally
```bash
npm --prefix tooling run serve
```

Open the app in your browser:
- `http://localhost:8080/index.html`

> Using a local server avoids `file://` CORS failures (important for PDF export / remote asset loading).

---

## 🛠 Building Tailwind CSS

Tailwind is built from `app/src/input.css` into `app/dist/output.css`.

Run:
```bash
npm --prefix tooling run build
```

---

##  Smoke Tests + Validation

### Full smoke test suite
```bash
npm --prefix tooling run smoke
```

### Runtime template fixtures
```bash
npm --prefix tooling run fixtures
```

### Main index smoke check
```bash
npm --prefix tooling run index:smoke
```

These scripts use Playwright to ensure pages load without JS errors and key functions run.

---

##  What’s Included

### Tool pages
- `app/pages/letters.html` (Letter generator)
- `app/pages/SUD_Diagnostic_Tool.html`
- `app/pages/Templates.html`
- `app/pages/DSMDx.html`
- `app/pages/Treatment_Planner.html`
- `app/pages/safetyplan.html`
- `app/pages/CSSRS.html`
- `app/pages/qr.html`

### Shared runtime code
- `app/src/templates.js`

### Shared assets
- `assets/images/logo.png`
- `assets/documents/Referrals.pdf`
- `assets/contacts/delphi-rise-contact.vcf`

---

##  Need More Detail?

A full maintenance/handoff guide is provided here:
- `docs/HANDOFF.md`

It explains where the key pieces live, how to edit the letter generator, how to add new pages, and how to troubleshoot common issues.

---

##  Quick Tips for Maintainers

- If styling looks wrong, rebuild Tailwind (`npm --prefix tooling run build`).
- If a tool page fails to load, check that it references `../dist/output.css` and that vendor scripts are referenced via `../vendor/...`.
- If PDFs or remote assets fail under `file://`, switch to the local server (`npm run serve`).

---

If you need a guided walk-through of any page (especially `letters.html`), just ask—this repo is designed to be handoff-friendly.

