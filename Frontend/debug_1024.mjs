import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });
  const expandBtn = await page.$('.timeline-year-expander-btn');
  if (expandBtn) await expandBtn.click();
  await page.waitForTimeout(400);

  const res = await page.$$eval('[data-testid="event-card"]', els => els.map((el, idx) => {
    const btn = el.querySelector('.compact-explore-btn');
    const cardRect = el.getBoundingClientRect();
    const btnRect = btn ? btn.getBoundingClientRect() : null;
    return {
      idx,
      cardH: cardRect.height,
      btnBottom: btnRect ? btnRect.bottom : null,
      cardBottom: cardRect.bottom,
      diff: btnRect ? btnRect.bottom - cardRect.bottom : null
    };
  }));
  console.log('1024px details:', JSON.stringify(res, null, 2));
  await browser.close();
})();
