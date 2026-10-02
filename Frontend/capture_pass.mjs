import puppeteer from 'puppeteer-core';

async function runPass() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  // 1. Capture /font-test page
  console.log('Navigating to font-test on localhost...');
  await page.goto('http://localhost:5173/#font-test', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2200));
  await page.screenshot({ path: 'font_test_page.png', fullPage: true });
  console.log('font_test_page.png saved!');

  // 2. Clear session storage and reload home to capture intro mid-way
  console.log('Navigating to home...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => {
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Wait ~900ms (mid-way through rain & left-to-right convergence)
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: 'intro_midway.png' });
  console.log('intro_midway.png saved!');

  // 3. Wait for intro to complete (~2.8s) and capture completed wordmark at rest
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'wordmark_at_rest.png' });
  console.log('wordmark_at_rest.png saved!');

  // 4. Scroll to ~40% progress (vh = 1000, 0.8 * vh = 800 -> 40% is scrollY ~320px)
  await page.evaluate(() => window.scrollTo(0, 320));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'scroll_40_percent.png' });
  console.log('scroll_40_percent.png saved!');

  // 5. Scroll to 800px (full merge)
  await page.evaluate(() => window.scrollTo(0, 800));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'scroll_full_dock.png' });
  console.log('scroll_full_dock.png saved!');

  await browser.close();
  console.log('All capture passes successful!');
}

runPass();
