import path from 'path';
import { pathToFileURL } from 'url';
import { chromium } from 'playwright';

const pagePath = path.resolve('..', 'app', 'pages', 'letters.html');
const url = pathToFileURL(pagePath).href;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', (msg) => console.log(`[console:${msg.type()}] ${msg.text()}`));
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const localLogoUrl = new URL('../../assets/images/logo.png', window.location.href).toString();
    try {
      const response = await fetch(localLogoUrl);
      return {
        ok: response.ok,
        status: response.status,
        url: localLogoUrl,
        contentType: response.headers.get('content-type'),
        size: (await response.blob()).size,
      };
    } catch (error) {
      return {
        ok: false,
        url: localLogoUrl,
        error: error.message,
      };
    }
  });
  await import('fs').then(({ writeFileSync }) => writeFileSync('./tests/__letters-local-fetch-result.json', JSON.stringify(result, null, 2)));
} finally {
  await browser.close();
}
