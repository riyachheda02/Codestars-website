import puppeteer from 'puppeteer-core';

async function runPass() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Capture intro mid-sequence (terminal typing and test squares)
  console.log('Navigating to home to capture intro mid-sequence...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait ~1500ms (terminal typed, tests filling)
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshot_intro_midway.png' });
  console.log('screenshot_intro_midway.png saved!');

  // 2. Wait for intro to finish (~3.6s total) and capture completed centered hero
  console.log('Waiting for intro to settle into completed centered hero...');
  await new Promise(r => setTimeout(r, 2600));
  await page.screenshot({ path: 'screenshot_hero_completed.png' });
  console.log('screenshot_hero_completed.png saved!');

  // 3. Scroll to ~40% progress (vh = 1000, 0.8 * vh = 800 -> 40% is scrollY ~320px)
  console.log('Scrolling to 40% merge progress...');
  await page.evaluate(() => window.scrollTo(0, 320));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_scroll_40_percent.png' });
  console.log('screenshot_scroll_40_percent.png saved!');

  // 4. Scroll to Featured Events section
  console.log('Scrolling to events section...');
  await page.evaluate(() => {
    document.getElementById('featured-events')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_events_section.png' });
  console.log('screenshot_events_section.png saved!');

  // 5. Scroll to Awards section
  console.log('Scrolling to awards section...');
  await page.evaluate(() => {
    document.getElementById('achievements')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_awards_section.png' });
  console.log('screenshot_awards_section.png saved!');

  // 6. Scroll to Footer section
  console.log('Scrolling to footer...');
  await page.evaluate(() => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_golden_footer.png' });
  console.log('screenshot_golden_footer.png saved!');

  // 7. Capture an inner page (Team)
  console.log('Navigating to Team inner page...');
  await page.goto('http://localhost:5173/#team', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'screenshot_inner_team.png' });
  console.log('screenshot_inner_team.png saved!');

  // 8. Capture an inner page (Events)
  console.log('Navigating to Events inner page...');
  await page.goto('http://localhost:5173/#events', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'screenshot_inner_events.png' });
  console.log('screenshot_inner_events.png saved!');

  await browser.close();
  console.log('CONSOLE_ERRORS_COUNT:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('CONSOLE_ERRORS:', consoleErrors);
  }
}

runPass();
