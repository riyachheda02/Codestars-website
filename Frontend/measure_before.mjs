import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });
  const expandBtn = await page.$('.timeline-year-expander-btn');
  if (expandBtn) await expandBtn.click();
  await page.waitForTimeout(600);
  const container = await page.$('.events-timeline-container');
  const box = await container.boundingBox();
  console.log('BEFORE TOTAL TIMELINE HEIGHT:', box.height);
  const cards = await page.$$('[data-testid="event-card"]');
  console.log('CARDS COUNT:', cards.length);
  for (let i = 0; i < cards.length; i++) {
    const b = await cards[i].boundingBox();
    console.log(`Card ${i} height: ${b.height}, width: ${b.width}`);
  }
  await browser.close();
})();
