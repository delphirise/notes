import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const indexUrl = process.env.NOTES_BASE_URL || pathToFileURL(path.join(repoRoot, 'index.html')).href;

async function assertFrameLoaded(page, tabButtonSelector, frameSelector, expectedFileName, options = {}) {
  if (options.beforeEvaluate) {
    await page.evaluate(options.beforeEvaluate);
  }

  if (options.beforeClickSelector) {
    await page.click(options.beforeClickSelector);
  }

  await page.click(tabButtonSelector);
  await page.waitForFunction(
    ({ selector, fileName }) => {
      const frame = document.querySelector(selector);
      if (!frame || !(frame instanceof HTMLIFrameElement)) {
        return false;
      }

      const declaredSource = frame.getAttribute('src') || '';
      if (declaredSource.includes(fileName)) {
        return true;
      }

      try {
        const loadedSource = frame.contentWindow?.location?.href || '';
        return loadedSource.includes(fileName);
      } catch {
        return false;
      }
    },
    { selector: frameSelector, fileName: expectedFileName },
  );
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#defaultOpen', { timeout: 10000 });

  await assertFrameLoaded(
    page,
    "button[onclick=\"openTab(event, 'NoteTemplates')\"]",
    '#NoteTemplates iframe',
    'Templates.html',
  );

  await assertFrameLoaded(
    page,
    "button[onclick=\"openTab(event, 'SUD')\"]",
    '#SUD iframe',
    'SUD_Diagnostic_Tool.html',
    { beforeEvaluate: () => window.showSudDropdown() },
  );

  await assertFrameLoaded(
    page,
    "button[onclick=\"openTab(event, 'DSMDx')\"]",
    '#DSMDx iframe',
    'DSMDx.html',
    { beforeEvaluate: () => window.showSudDropdown() },
  );

  await assertFrameLoaded(
    page,
    "button[onclick=\"openTab(event, 'Planner')\"]",
    '#Planner iframe',
    'Treatment_Planner.html',
  );

  await assertFrameLoaded(
    page,
    "button[onclick=\"openTab(event, 'Letters')\"]",
    '#Letters iframe',
    'letters.html',
  );

  await assertFrameLoaded(
    page,
    "button[onclick=\"openTab(event, 'SafetyPlan')\"]",
    '#SafetyPlan iframe',
    'safetyplan.html',
  );

  console.log('[PASS] index.html local iframe tabs resolved successfully.');
} finally {
  await browser.close();
}
