import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright is not installed. Install with: npm i -D playwright');
  process.exit(2);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const fixturesPath = path.join(__dirname, 'note-fixtures.json');
const templatesPath = path.join(repoRoot, 'Templates.html');

const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8')).fixtures;
const fileUrl = pathToFileURL(templatesPath).href;

function printResult(ok, label, detail = '') {
  const tag = ok ? '[PASS]' : '[FAIL]';
  const suffix = detail ? ` - ${detail}` : '';
  console.log(`${tag} ${label}${suffix}`);
}

async function setElementValue(page, selector, value) {
  await page.$eval(selector, (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function setElementChecked(page, selector, checked) {
  await page.$eval(selector, (el, val) => {
    el.checked = Boolean(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, checked);
}

async function runFixture(browser, fixture) {
  const page = await browser.newPage();
  try {
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#staff-type-select', { timeout: 10000 });

    await setElementValue(page, '#staff-type-select', fixture.staffRole);
    await setElementValue(page, '#note-type-select', fixture.noteType);

    if (Array.isArray(fixture.steps)) {
      for (const step of fixture.steps) {
        if (step.action === 'setValue') {
          await page.waitForSelector(step.selector, { timeout: 3000 });
          await setElementValue(page, step.selector, step.value);
        } else if (step.action === 'setChecked') {
          await page.waitForSelector(step.selector, { timeout: 3000 });
          await setElementChecked(page, step.selector, step.value);
        }
      }
    }

    await page.waitForTimeout(40);

    if (fixture.mode === 'single') {
      const singleVisible = await page.$eval('#single-note-copy-area', (el) => getComputedStyle(el).display !== 'none');
      if (!singleVisible) {
        return { ok: false, detail: 'single copy area not visible' };
      }
      const text = await page.$eval('#final-note-copy', (el) => (el.value || '').trim());
      if (!text.length) {
        return { ok: false, detail: 'final-note-copy is empty' };
      }
      return { ok: true };
    }

    if (fixture.mode === 'dtc') {
      const dtcVisible = await page.$eval('#dtc-dual-copy-area', (el) => getComputedStyle(el).display !== 'none');
      if (!dtcVisible) {
        return { ok: false, detail: 'dtc dual copy area not visible' };
      }
      const progress = await page.$eval('#dtc-progress-note-copy', (el) => (el.value || '').trim());
      const court = await page.$eval('#dtc-court-note-copy', (el) => (el.value || '').trim());
      if (!progress.length || !court.length) {
        return { ok: false, detail: 'one or both DTC copy areas are empty' };
      }
      return { ok: true };
    }

    if (fixture.mode === 'toc') {
      const tocVisible = await page.$eval('#toc-copy-button', (el) => getComputedStyle(el).display !== 'none');
      if (!tocVisible) {
        return { ok: false, detail: 'TOC copy button not visible' };
      }
      return { ok: true };
    }

    return { ok: false, detail: `unknown fixture mode: ${fixture.mode}` };
  } catch (error) {
    return { ok: false, detail: error.message };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
let failed = 0;
for (const fixture of fixtures) {
  const label = `${fixture.noteType} (${fixture.staffRole})`;
  const result = await runFixture(browser, fixture);
  printResult(result.ok, label, result.detail || '');
  if (!result.ok) failed++;
}
await browser.close();

if (failed > 0) {
  console.error(`\nFixture run failed: ${failed} fixture(s).`);
  process.exit(1);
}

console.log('\nAll runtime fixtures passed.');
process.exit(0);
