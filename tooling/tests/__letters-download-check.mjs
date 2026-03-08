import path from 'path';
import { pathToFileURL } from 'url';
import { chromium } from 'playwright';

const pagePath = path.resolve('..', 'app', 'pages', 'letters.html');
const url = pathToFileURL(pagePath).href;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ acceptDownloads: true });

page.on('console', (msg) => {
  console.log(`[console:${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (error) => {
  console.log(`[pageerror] ${error.stack || error.message}`);
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    document.cookie = 'isAuthenticated=true; path=/';
    document.getElementById('password-overlay').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    await initializeApp();
  });
  await page.waitForTimeout(500);

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await page.click('button[onclick="downloadPDF()"]');
  await page.waitForTimeout(3000);
  const download = await downloadPromise;

  if (download) {
    console.log(JSON.stringify({ ok: true, suggestedFilename: download.suggestedFilename() }, null, 2));
  } else {
    console.log(JSON.stringify({ ok: false, reason: 'No download event observed' }, null, 2));
  }
} finally {
  await browser.close();
}
