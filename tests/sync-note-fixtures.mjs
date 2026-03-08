import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const templatesScriptPath = path.join(repoRoot, 'src', 'templates.js');
const fixturesPath = path.join(__dirname, 'note-fixtures.json');

const scriptText = fs.readFileSync(templatesScriptPath, 'utf8');
const fixturesData = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

const roleBlocks = [...scriptText.matchAll(/(counseling|medical|psychiatric):\s*\[(.*?)\]/gs)];
const configuredPairs = [];
for (const block of roleBlocks) {
  const role = block[1];
  const body = block[2];
  const values = [...body.matchAll(/\{\s*value:\s*'([^']+)'\s*,\s*label:/g)].map((m) => m[1]);
  for (const noteType of values) {
    configuredPairs.push({ staffRole: role, noteType });
  }
}

const configuredKeySet = new Set(configuredPairs.map((pair) => `${pair.staffRole}::${pair.noteType}`));
const existingFixtures = Array.isArray(fixturesData.fixtures) ? fixturesData.fixtures : [];

const existingByKey = new Map();
for (const fixture of existingFixtures) {
  if (!fixture?.staffRole || !fixture?.noteType) continue;
  const key = `${fixture.staffRole}::${fixture.noteType}`;
  if (!existingByKey.has(key)) {
    existingByKey.set(key, fixture);
  }
}

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function getExemplarByNoteType(noteType) {
  const exemplar = existingFixtures.find((fixture) => fixture?.noteType === noteType && fixture?.mode);
  if (!exemplar) return null;
  const payload = {
    mode: exemplar.mode || 'single'
  };
  if (Array.isArray(exemplar.steps) && exemplar.steps.length > 0) {
    payload.steps = cloneValue(exemplar.steps);
  }
  return payload;
}

let addedCount = 0;
for (const pair of configuredPairs) {
  const key = `${pair.staffRole}::${pair.noteType}`;
  if (!existingByKey.has(key)) {
    const exemplar = getExemplarByNoteType(pair.noteType);
    existingByKey.set(key, {
      staffRole: pair.staffRole,
      noteType: pair.noteType,
      mode: exemplar?.mode || 'single',
      ...(exemplar?.steps ? { steps: exemplar.steps } : {})
    });
    addedCount += 1;
  }
}

let hydratedCount = 0;
for (const [key, fixture] of existingByKey.entries()) {
  const hasDefaultShape = fixture?.mode === 'single' && (!Array.isArray(fixture.steps) || fixture.steps.length === 0);
  if (!hasDefaultShape) continue;

  const exemplar = getExemplarByNoteType(fixture.noteType);
  if (!exemplar) continue;

  const shouldHydrate = exemplar.mode !== 'single' || (Array.isArray(exemplar.steps) && exemplar.steps.length > 0);
  if (!shouldHydrate) continue;

  existingByKey.set(key, {
    ...fixture,
    mode: exemplar.mode || fixture.mode,
    ...(exemplar.steps ? { steps: exemplar.steps } : {})
  });
  hydratedCount += 1;
}

const filteredFixtures = [...existingByKey.values()].filter((fixture) => {
  const key = `${fixture.staffRole}::${fixture.noteType}`;
  return configuredKeySet.has(key);
});

const roleOrder = { counseling: 0, medical: 1, psychiatric: 2 };
filteredFixtures.sort((a, b) => {
  const roleDiff = (roleOrder[a.staffRole] ?? 99) - (roleOrder[b.staffRole] ?? 99);
  if (roleDiff !== 0) return roleDiff;
  return a.noteType.localeCompare(b.noteType);
});

const nextData = { fixtures: filteredFixtures };
fs.writeFileSync(fixturesPath, JSON.stringify(nextData, null, 2) + '\n', 'utf8');

console.log(`Fixture sync complete. Added ${addedCount} missing fixture(s). Hydrated ${hydratedCount} fixture(s). Total fixtures: ${filteredFixtures.length}.`);
