# Notes App Handoff Guide

This document is for the next developer taking ownership of this repository. It is based on the current repository layout and code paths in `index.html`, `app/pages/*`, `app/src/*`, `assets/*`, and `tooling/*`.

It is intentionally practical. The goal is to help a new maintainer answer four questions quickly:

1. What is actually running in production today?
2. Where should I make changes?
3. How do I test safely?
4. What parts of the repo are actively used versus secondary?

## Executive Summary

This project is a static HTML/CSS/JavaScript internal toolset for Delphi Rise. The live app is composed of standalone HTML pages under `app/pages/`, with `index.html` acting as the dashboard shell that loads those tools in iframes.

There is also a modular application under `app/src/` with feature modules, shared state, and JSON-driven content. That code exists in the repo, but based on the current entry points and tooling, it is not the main day-to-day application surface. Treat it as additional code in the repository, not as the currently deployed replacement for `app/pages/*`.

If you are making changes needed by staff today, the safest default is:

- Landing/dashboard behavior: update [index.html](C:/Users/nhighland/Notes/notes/index.html)
- Letter generator: update [app/pages/letters.html](C:/Users/nhighland/Notes/notes/app/pages/letters.html)
- Clinical note templates: update [app/pages/Templates.html](C:/Users/nhighland/Notes/notes/app/pages/Templates.html) and [app/src/templates.js](C:/Users/nhighland/Notes/notes/app/src/templates.js)
- Shared assets: update files in [assets](C:/Users/nhighland/Notes/notes/assets)

## Current Architecture

### 1. Current production path

The current main dashboard is [index.html](C:/Users/nhighland/Notes/notes/index.html).

It contains:

- Top-level tab UI
- Inline JavaScript for tab behavior
- Embedded iframes that load standalone tools from `app/pages/`

The smoke test in [tooling/tests/run-index-smoke.mjs](C:/Users/nhighland/Notes/notes/tooling/tests/run-index-smoke.mjs) confirms this model. It explicitly clicks tabs in `index.html` and asserts that the iframes point to:

- `Templates.html`
- `SUD_Diagnostic_Tool.html`
- `DSMDx.html`
- `Treatment_Planner.html`
- `letters.html`
- `safetyplan.html`

This is the strongest indicator of the currently supported user-facing path.

### 2. Additional modular app code in the repo

There is a second architecture under [app/src](C:/Users/nhighland/Notes/notes/app/src):

- [app/src/app/shell.js](C:/Users/nhighland/Notes/notes/app/src/app/shell.js)
- [app/src/app/page-registry.js](C:/Users/nhighland/Notes/notes/app/src/app/page-registry.js)
- [app/src/features/*](C:/Users/nhighland/Notes/notes/app/src/features)
- [app/src/services/*](C:/Users/nhighland/Notes/notes/app/src/services)
- [app/src/state/store.js](C:/Users/nhighland/Notes/notes/app/src/state/store.js)

This implementation is data-driven and uses:

- route-based feature loading
- persisted app state via `localStorage`
- reusable rendering services
- JSON data sources for templates, letters, planner goals, etc.

Important limitation: the repository does not currently expose a clearly supported build pipeline for this modular app beyond static committed assets already in `app/dist/assets/`. There is no obvious active bundler config in `tooling/package.json` for rebuilding those modules. Because of that:

- do not assume `app/src` is the active source of truth for the pages staff use every day
- do not remove or bypass `app/pages/*` based on the presence of `app/src`
- do not move production workflows away from `app/pages/*` unless that is an intentional project decision

## Repository Map

### Root

- [index.html](C:/Users/nhighland/Notes/notes/index.html)
  Legacy dashboard shell. Most users likely enter here.

- [HANDOFF.md](C:/Users/nhighland/Notes/notes/HANDOFF.md)
  This document.

### Runtime app

- [app/pages](C:/Users/nhighland/Notes/notes/app/pages)
  Standalone tools. These are high-value maintenance targets.

- [app/src](C:/Users/nhighland/Notes/notes/app/src)
  Shared JS, services, and the modular app implementation that also exists in the repository.

- [app/vendor](C:/Users/nhighland/Notes/notes/app/vendor)
  Third-party browser libraries committed directly into the repo.

- [app/dist](C:/Users/nhighland/Notes/notes/app/dist)
  Built CSS and committed compiled assets.

### Shared assets

- [assets/images](C:/Users/nhighland/Notes/notes/assets/images)
- [assets/documents](C:/Users/nhighland/Notes/notes/assets/documents)
- [assets/contacts](C:/Users/nhighland/Notes/notes/assets/contacts)

### Tooling and tests

- [tooling/package.json](C:/Users/nhighland/Notes/notes/tooling/package.json)
- [tooling/smoke-check.ps1](C:/Users/nhighland/Notes/notes/tooling/smoke-check.ps1)
- [tooling/tests](C:/Users/nhighland/Notes/notes/tooling/tests)

## Core Pages and What Owns Them

### Letters

Files:

- [app/pages/letters.html](C:/Users/nhighland/Notes/notes/app/pages/letters.html)

Characteristics:

- self-contained page
- complex inline JavaScript
- localStorage-backed signature persistence
- password gate (simple base64 encoded gate providing only basic protection, required to avoid broadly sharing the letters we use with any clients who might discover this tool).
- PDF generation
- letter-specific field toggling and text generation

What to know:

- This file is long and behavior-heavy.
- Most letter changes require editing both form markup and one generator function.
- IDs must stay synchronized with generator functions.
- New letter types require:
  1. new option in the letter type selector
  2. new `...Fields` section
  3. new branch in `generateReport()`
  4. new filename branch in PDF export logic if needed

### Note templates

Files:

- [app/pages/Templates.html](C:/Users/nhighland/Notes/notes/app/pages/Templates.html)
- [app/src/templates.js](C:/Users/nhighland/Notes/notes/app/src/templates.js)
- [app/src/templates.css](C:/Users/nhighland/Notes/notes/app/src/templates.css)

Characteristics:

- HTML form surface lives in `Templates.html`
- generation logic lives in `templates.js`
- this is the most important split-page architecture in the repo

What to know:

- `Templates.html` defines note containers and input IDs
- `templates.js` contains `updateFinalNote()` and the note-type routing
- if you add or rename a field ID in HTML, check every reference in JS
- if you add a note type, update:
  - staff-role note catalog in `templates.js`
  - HTML container
  - generation branch
  - relevant tests or fixtures

### Diagnostics, planner, safety plan, other standalone tools

Files include:

- [app/pages/SUD_Diagnostic_Tool.html](C:/Users/nhighland/Notes/notes/app/pages/SUD_Diagnostic_Tool.html)
- [app/pages/DSMDx.html](C:/Users/nhighland/Notes/notes/app/pages/DSMDx.html)
- [app/pages/Treatment_Planner.html](C:/Users/nhighland/Notes/notes/app/pages/Treatment_Planner.html)
- [app/pages/safetyplan.html](C:/Users/nhighland/Notes/notes/app/pages/safetyplan.html)
- [app/pages/pdfeditor.html](C:/Users/nhighland/Notes/notes/app/pages/pdfeditor.html)
- [app/pages/CSSRS.html](C:/Users/nhighland/Notes/notes/app/pages/CSSRS.html)

These are mostly standalone and should be treated as independent browser apps unless you confirm shared dependencies.

## Setup and Local Development

### Requirements

Expected tooling from the repo:

- Node.js
- npm
- PowerShell on Windows

I did not verify tool availability from this environment during handoff, so confirm local setup on the new machine.

### Install

```bash
npm --prefix tooling install
```

### Run locally

```bash
npm --prefix tooling run serve
```

Then open:

- `http://localhost:8080/index.html`

Serving over HTTP matters. Some functionality will behave poorly under `file://`, especially:

- PDF append/fetch logic
- iframe loading
- browser security around assets

### Build CSS

```bash
npm --prefix tooling run build
```

This compiles:

- [app/src/input.css](C:/Users/nhighland/Notes/notes/app/src/input.css)
- to [app/dist/output.css](C:/Users/nhighland/Notes/notes/app/dist/output.css)

Tailwind build config lives in:

- [tooling/tailwind.config.js](C:/Users/nhighland/Notes/notes/tooling/tailwind.config.js)
- [tooling/postcss.config.js](C:/Users/nhighland/Notes/notes/tooling/postcss.config.js)

## Testing and Validation

### Primary validation commands

Run all smoke checks:

```bash
npm --prefix tooling run smoke
```

Run index smoke:

```bash
npm --prefix tooling run index:smoke
```

Run note fixtures:

```bash
npm --prefix tooling run fixtures
```

### What each test actually checks

- `smoke`
  PowerShell-based structural checks for `Templates.html`, `templates.js`, fixture coverage, and note-branch integrity.

- `index:smoke`
  Playwright browser smoke test for `index.html` iframe navigation.

- `fixtures`
  Runtime note fixture validation for note generation flows.

### When to run which

- After editing `letters.html`: at least manually test the changed letter and run `index:smoke` if the dashboard path changed.
- After editing `Templates.html` or `templates.js`: run `smoke` and `fixtures`.
- After changing dashboard tab/iframe wiring in `index.html`: run `index:smoke`.
- After Tailwind changes: run `build` and check affected pages visually.

## How to Safely Make Changes

### For the main standalone pages

Treat each page as an application, not a partial.

Typical workflow:

1. Find the page entry in `app/pages/`.
2. Identify whether behavior is inline or delegated to `app/src/`.
3. Update the form markup first.
4. Update generator or event logic second.
5. Verify output text and PDF/export behavior if applicable.
6. Re-run the relevant smoke tests.

### For `Templates.html` plus `templates.js`

Rules:

- keep IDs stable
- prefer additive changes over renaming unless you update all references
- if you create dynamic rows, make sure remove/add logic updates generated output
- if you change note-type options, update all role catalogs and fixtures

### For `letters.html`

Rules:

- keep each letter generator self-contained
- use shared salutation/signature helpers where possible
- if adding a new letter:
  - add form
  - add route branch in `generateReport()`
  - add filename branch in PDF export
  - test copy output
  - test PDF output if the change affects layout

## Known Patterns in the Codebase

### Pattern: hidden sections keyed by select value

This is used heavily in `letters.html` and `Templates.html`.

Typical shape:

- a `<select>`
- a `toggle...()` function
- one or more `<div class="hidden">` sections
- a generator function that expects the same IDs

### Pattern: text generators write into a single textarea

The majority of tools build a final note or letter into a single output textarea.

This means:

- generated text is often the main contract
- regressions are usually visible in output text first
- fixture tests are useful because output content matters more than component abstraction

### Pattern: direct browser persistence

The modular app under `app/src` uses:

- [app/src/services/storage.js](C:/Users/nhighland/Notes/notes/app/src/services/storage.js)

The standalone pages often use direct `localStorage` access inline.

Do not assume a single persistence system across the repo.

## Risks and Technical Debt

### 1. Dual architecture

The biggest project-level risk is the coexistence of:

- the actively used standalone pages under `app/pages/*`
- a modular app under `app/src`

This creates ambiguity about ownership boundaries inside the repo. The handoff assumption for now should be that `app/pages/*` is the supported application surface unless the owner explicitly says otherwise.

### 2. Large monolithic HTML pages

Files like `letters.html` are operationally useful but hard to reason about. Risks include:

- ID drift
- duplicated business logic
- breakage from small markup edits
- hard-to-test edge cases

### 3. Committed generated artifacts

The repo includes committed built assets in `app/dist/`, including compiled CSS and bundled JS/CSS assets for the modular app path.

That is convenient operationally but can make it unclear what must be rebuilt and what can be edited directly.

### 4. Browser-only dependencies

Libraries in `app/vendor/` are committed directly. This is stable for deployment, but the upgrade path is manual and easy to forget.

## Recommended Working Agreement for the New Developer

### Short term

Use this rule:

- If the requested change is visible in the tools staff use today, update the standalone pages under `app/pages/*`.
- If the requested change is specifically about the modular app code under `app/src`, update that path separately and confirm where it is used.

### Medium term

I recommend clarifying the intended role of `app/src` with the owner, but without treating the current standalone pages as temporary. The pages under `app/pages/*` are in active use and should be maintained as real application code, not as throwaway compatibility layers.

## Suggested First Tasks for the New Developer

These are high-value onboarding tasks:

1. Run the local server and open every top-level tool from `index.html`.
2. Run `npm --prefix tooling run smoke`.
3. Run `npm --prefix tooling run index:smoke`.
4. Read:
   - [app/pages/letters.html](C:/Users/nhighland/Notes/notes/app/pages/letters.html)
   - [app/pages/Templates.html](C:/Users/nhighland/Notes/notes/app/pages/Templates.html)
   - [app/src/templates.js](C:/Users/nhighland/Notes/notes/app/src/templates.js)
   - [tooling/smoke-check.ps1](C:/Users/nhighland/Notes/notes/tooling/smoke-check.ps1)
5. Confirm with the owner what role `app/src` should play going forward, without assuming it replaces `app/pages/*`.

## Practical Troubleshooting

### Styling looks wrong

- rebuild CSS with `npm --prefix tooling run build`
- confirm the page links to `../dist/output.css` or `./app/dist/output.css`

### A note generator stopped updating

- inspect field IDs in `Templates.html`
- inspect listeners and generator branches in `templates.js`
- run `smoke` and `fixtures`

### A letter renders but exports the wrong content

- inspect the corresponding `generate...Report()` function in `letters.html`
- inspect PDF filename branches near export logic
- confirm subject/salutation helper paths still match the form fields

### Dashboard tab opens blank content

- inspect iframe source wiring in `index.html`
- run `index:smoke`
- confirm the page file still exists under `app/pages`

## Final Notes

This repo is maintainable, but only if the next developer understands that the standalone pages under `app/pages/*` are the current operational surface. The modular app code under `app/src` is present in the repo, but it should not be treated as an automatic replacement for those pages without an explicit product decision.

If you are making urgent production fixes, optimize for correctness in:

- [index.html](C:/Users/nhighland/Notes/notes/index.html)
- [app/pages/letters.html](C:/Users/nhighland/Notes/notes/app/pages/letters.html)
- [app/pages/Templates.html](C:/Users/nhighland/Notes/notes/app/pages/Templates.html)
- [app/src/templates.js](C:/Users/nhighland/Notes/notes/app/src/templates.js)

Those files carry most of the operational weight.
