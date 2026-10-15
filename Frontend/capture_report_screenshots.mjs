import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();

  // Desktop 1440x900
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });

  // Expand all events
  const expandBtn = await page.$('.timeline-year-expander-btn');
  if (expandBtn) await expandBtn.click();
  await page.waitForTimeout(600);

  // 1. Two consecutive alternating cards with stars (one left, one right)
  const rows = await page.$$('.timeline-row-grid');
  if (rows.length >= 2) {
    // Scroll row 0 into view
    await rows[0].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const clip = await page.evaluate(() => {
      const r0 = document.querySelectorAll('.timeline-row-grid')[0].getBoundingClientRect();
      const r1 = document.querySelectorAll('.timeline-row-grid')[1].getBoundingClientRect();
      return {
        x: 0,
        y: Math.max(0, r0.top + window.scrollY - 20),
        width: 1440,
        height: (r1.bottom - r0.top) + 40
      };
    });

    await page.screenshot({
      path: 'screenshot_alternating_cards_1440.png',
      clip
    });
    console.log('Saved screenshot_alternating_cards_1440.png');
  }

  // 2. A flagship card (Code Bounty 2026)
  const flagshipRow = await page.$('.timeline-row-grid[data-slug="code-bounty-2026"]');
  if (flagshipRow) {
    await flagshipRow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await flagshipRow.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'screenshot_events_flagship_card.png',
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 15),
          width: Math.min(1440, box.width + 40),
          height: box.height + 30
        }
      });
      console.log('Saved screenshot_events_flagship_card.png');
    }
  }

  // 3. A card with a contain-fit logo poster (ICPC Camp 2026)
  const containRow = await page.$('.timeline-row-grid[data-slug="icpc-camp-2026"]');
  if (containRow) {
    await containRow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await containRow.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'screenshot_contain_fit_card.png',
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 15),
          width: Math.min(1440, box.width + 40),
          height: box.height + 30
        }
      });
      console.log('Saved screenshot_contain_fit_card.png');
    }
  }

  // 4. Mobile layout at 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });
  const expandBtnMobile = await page.$('.timeline-year-expander-btn');
  if (expandBtnMobile) await expandBtnMobile.click();
  await page.waitForTimeout(600);

  // Scroll down so the cards and spine are nicely framed
  await page.evaluate(() => {
    const firstRow = document.querySelector('.timeline-row-grid');
    if (firstRow) firstRow.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);

  await page.screenshot({
    path: 'screenshot_mobile_390x844.png',
    fullPage: false
  });
  console.log('Saved screenshot_mobile_390x844.png');

  await browser.close();
})();
