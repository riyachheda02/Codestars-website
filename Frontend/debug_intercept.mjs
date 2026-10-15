import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });

  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(300);

  const opt2025 = (await page.$$('.filter-year-option'))[2];
  const box = await opt2025.boundingBox();
  console.log('2025 option bounding box:', box);

  const topElement = await page.evaluate((pos) => {
    const el = document.elementFromPoint(pos.x, pos.y);
    return {
      tagName: el?.tagName,
      className: el?.className,
      outerHTML: el?.outerHTML?.slice(0, 100),
      closestCard: el?.closest('.compact-event-card')?.getAttribute('data-slug')
    };
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });

  console.log('Element at point of option 2025:', topElement);

  await browser.close();
})();
