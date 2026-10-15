import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Screenshot of dropdown open
  await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(300);

  // Capture area around header & filter bar with dropdown open
  await page.screenshot({
    path: 'screenshot_year_dropdown_open.png',
    clip: {
      x: 200,
      y: 180,
      width: 1040,
      height: 380
    }
  });
  console.log('Saved screenshot_year_dropdown_open.png');

  // 2. Screenshot of filtered list after choosing 2025
  await page.locator('.filter-year-option', { hasText: '2025' }).click();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'screenshot_filtered_year_2025.png',
    clip: {
      x: 100,
      y: 220,
      width: 1240,
      height: 650
    }
  });
  console.log('Saved screenshot_filtered_year_2025.png');

  await browser.close();
})();
