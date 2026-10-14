import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });
  const cards = await page.$$('[data-testid="event-card"]');
  for (let i = 0; i < 2; i++) {
    const info = await cards[i].evaluate(el => {
      const getH = sel => {
        const n = el.querySelector(sel);
        return n ? { h: n.offsetHeight, m: getComputedStyle(n).marginBottom } : null;
      };
      return {
        badge: getH('.compact-badges-row'),
        title: getH('.compact-title-serif'),
        meta: getH('.compact-meta-line'),
        desc: getH('.compact-description'),
        btn: getH('.compact-action-row'),
        pad: getComputedStyle(el.querySelector('.compact-content-area')).padding
      };
    });
    console.log(`Card ${i}:`, info);
  }
  await browser.close();
})();
