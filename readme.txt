The completed tool combines all html files into a tabbed layout, and can be found in index.html.  Each tab is also saved as its own HTML file for ease of editing and access.

Quick regression checklist (Templates):
1) Open Templates and choose Medical Staff > Injections.
	- Select each injection type (Vivitrol, Sublocade, Brixadi).
	- Confirm the copy area populates immediately.
	- Change a date field and confirm copy text updates.

2) Choose Counseling Staff > Discharge Plan.
	- Confirm the single copy area is hidden for this template.
	- Add at least one medication row and verify summary updates.
	- Toggle "patient is not currently using medications" and verify medication inputs disable.
	- Click Copy on "Other needs identified..." and confirm clipboard text is populated.

3) Choose Counseling Staff > Drug Treatment Court Report.
	- Confirm dual copy areas appear (Complex Coordination + Court Note).
	- Enter sample values and confirm both text areas populate.
	- Use both copy buttons and confirm each copies the expected section.

4) Sanity checks:
	- Switching note types should not leave stale text from another template.
	- No console/runtime errors while switching between Injections, Discharge Plan, and DTC.

Run smoke checks:
- npm run smoke
- If script execution is blocked, use: powershell -ExecutionPolicy Bypass -File .\smoke-check.ps1
- Windows quick launch: double-click run-smoke-check.cmd

Run runtime fixture checks (all configured note types):
- Prerequisite (one-time): npm i -D playwright
- Browser install (one-time): npx playwright install chromium
- Auto-add missing fixture stubs for new note types: npm run fixtures:sync
- Run from script: npm run fixtures
- Windows quick launch: double-click run-note-fixtures.cmd
	(this launcher auto-falls back to C:\nodejs\node.exe if Node is not on PATH)

The smoke check validates all configured note types by ensuring each note type has:
- a matching container in Templates.html
- a matching generator branch in src/templates.js
- plus key integrity checks for high-risk paths (Injections, Discharge Plan, DTC).

The runtime fixture check opens Templates.html headlessly, applies fixture steps from tests/note-fixtures.json,
and verifies expected output behavior for single-copy, DTC dual-copy, and TOC modes.
