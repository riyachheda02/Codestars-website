import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });

  console.log('Testing year dropdown click...');
  const yearBtn = await page.$('.filter-year-dropdown-btn');
  console.log('Year button text before click:', await yearBtn?.innerText());

  await yearBtn?.click();
  await page.waitForTimeout(300);

  const listbox = await page.$('.filter-year-listbox');
  console.log('Listbox visible?', !!listbox);

  const options = await page.$$('.filter-year-option');
  console.log('Options count:', options.length);
  for (const opt of options) {
    console.log('Option text:', await opt.innerText());
  }

  // Click '2025'
  const opt2025 = options[2]; // index 0 is All years, 1 is 2026, 2 is 2025
  console.log('Clicking option:', await opt2025.innerText());
  await opt2025.click();
  await page.waitForTimeout(400);

  console.log('Year button text after click:', await yearBtn?.innerText());
  console.log('URL hash after click:', await page.evaluate(() => window.location.hash));

  await browser.close();
})();
