import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('=== TEST SUITE: EVENTS YEAR FILTER ===');

  // Clock: 2026-10-11
  await page.addInitScript(() => {
    const mockDate = new Date('2026-10-11T12:00:00+05:30');
    const OriginalDate = Date;
    // @ts-ignore
    globalThis.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(mockDate.getTime());
        else super(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

  // TEST a) Click year button, choose 2025: label reads "2025", URL contains year=2025, every visible card in 2025, count matches data
  console.log('\n--- Test (a): Select 2025 ---');
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);

  // Click 2025 option
  const opt2025 = page.locator('.filter-year-option', { hasText: '2025' });
  await opt2025.click();
  await page.waitForTimeout(300);

  const labelAfter2025 = await page.innerText('.filter-year-dropdown-btn span');
  const hashAfter2025 = await page.evaluate(() => window.location.hash);
  const cards2025 = await page.$$('[data-testid="event-card"]');
  const cardSlugs2025 = await page.$$eval('[data-testid="event-card"]', els => els.map(e => e.getAttribute('data-slug')));
  const srText2025 = await page.innerText('.sr-only');

  console.log(`Label: "${labelAfter2025}" (Expected: "2025")`);
  console.log(`URL Hash: "${hashAfter2025}" (Expected includes "year=2025")`);
  console.log(`Visible cards count: ${cards2025.length} (Expected 4: bloodbytes, mock, cfg, code-uncode)`);
  console.log(`Slugs:`, cardSlugs2025);
  console.log(`Aria-live text: "${srText2025}" (Expected: "4 events shown")`);

  const testAPass =
    labelAfter2025 === '2025' &&
    hashAfter2025.includes('year=2025') &&
    cards2025.length === 4 &&
    cardSlugs2025.includes('bloodbytes-2025') &&
    cardSlugs2025.includes('mock-contest-2025') &&
    cardSlugs2025.includes('coffee-with-googlers-2025') &&
    cardSlugs2025.includes('code-uncode-2025') &&
    srText2025 === '4 events shown';

  console.log('TEST (a) PASS:', testAPass);

  // TEST b) Choose 2026, then 2024, then All years: each one filters correctly, last restores full list
  console.log('\n--- Test (b): Select 2026, 2024, All years ---');
  // Choose 2026
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);
  await page.locator('.filter-year-option', { hasText: '2026' }).click();
  await page.waitForTimeout(300);
  const count2026 = await page.$$eval('[data-testid="event-card"]', els => els.length);
  const hash2026 = await page.evaluate(() => window.location.hash);
  console.log(`2026 -> count: ${count2026} (Expected 2), hash: "${hash2026}"`);

  // Choose 2024
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);
  await page.locator('.filter-year-option', { hasText: '2024' }).click();
  await page.waitForTimeout(300);
  const count2024 = await page.$$eval('[data-testid="event-card"]', els => els.length);
  const hash2024 = await page.evaluate(() => window.location.hash);
  console.log(`2024 -> count: ${count2024} (Expected 1), hash: "${hash2024}"`);

  // Choose All years
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);
  await page.locator('.filter-year-option', { hasText: 'All years' }).click();
  await page.waitForTimeout(300);
  const labelAllYears = await page.innerText('.filter-year-dropdown-btn span');
  const hashAllYears = await page.evaluate(() => window.location.hash);
  // Expand older years to see all
  const expBtn = await page.$('.timeline-year-expander-btn');
  if (expBtn) await expBtn.click();
  await page.waitForTimeout(300);
  const countAll = await page.$$eval('[data-testid="event-card"]', els => els.length);
  console.log(`All years -> label: "${labelAllYears}", count: ${countAll} (Expected 7), hash: "${hashAllYears}"`);

  const testBPass =
    count2026 === 2 &&
    hash2026.includes('year=2026') &&
    count2024 === 1 &&
    hash2024.includes('year=2024') &&
    labelAllYears === 'All years' &&
    !hashAllYears.includes('year=') &&
    countAll === 7;
  console.log('TEST (b) PASS:', testBPass);

  // TEST c) Past + 2025 gives only completed 2025 events; Upcoming + 2024 gives empty state, Reset restores
  console.log('\n--- Test (c): Combined Status + Year, Empty state & Reset ---');
  // Past + 2025
  await page.click('.filter-seg-option:has-text("Past")');
  await page.waitForTimeout(200);
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);
  await page.locator('.filter-year-option', { hasText: '2025' }).click();
  await page.waitForTimeout(300);
  const countPast2025 = await page.$$eval('[data-testid="event-card"]', els => els.length);
  const hashPast2025 = await page.evaluate(() => window.location.hash);
  console.log(`Past + 2025 -> count: ${countPast2025} (Expected 4), hash: "${hashPast2025}"`);

  // Upcoming + 2024
  await page.click('.filter-seg-option:has-text("Upcoming")');
  await page.waitForTimeout(200);
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);
  await page.locator('.filter-year-option', { hasText: '2024' }).click();
  await page.waitForTimeout(300);

  const emptyStateVisible = await page.isVisible('.events-empty-state');
  const emptyStateTitle = await page.innerText('.empty-state-title');
  const hashUpcoming2024 = await page.evaluate(() => window.location.hash);
  console.log(`Upcoming + 2024 -> empty state visible: ${emptyStateVisible}, title: "${emptyStateTitle}", hash: "${hashUpcoming2024}"`);

  // Click Reset filters
  await page.click('.empty-state-reset-btn');
  await page.waitForTimeout(300);
  const labelReset = await page.innerText('.filter-year-dropdown-btn span');
  const statusReset = await page.evaluate(() => document.querySelector('.filter-seg-option.is-active')?.textContent?.trim());
  const hashReset = await page.evaluate(() => window.location.hash);
  console.log(`Reset -> year label: "${labelReset}", status active: "${statusReset}", hash: "${hashReset}"`);

  const testCPass =
    countPast2025 === 4 &&
    hashPast2025.includes('status=past') &&
    hashPast2025.includes('year=2025') &&
    emptyStateVisible &&
    labelReset === 'All years' &&
    statusReset === 'All' &&
    hashReset === '#events';
  console.log('TEST (c) PASS:', testCPass);

  // TEST d) Reload and Back-navigation restore state, Keyboard path, Clicking outside closes
  console.log('\n--- Test (d): Reload, Back-nav, Keyboard path, Click outside ---');
  // Navigate to deep link with filters: #events?status=past&year=2025
  await page.goto('http://127.0.0.1:5173/#events?status=past&year=2025', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const reloadStatusActive = await page.evaluate(() => document.querySelector('.filter-seg-option.is-active')?.textContent?.trim());
  const reloadYearLabel = await page.innerText('.filter-year-dropdown-btn span');
  const reloadCardCount = await page.$$eval('[data-testid="event-card"]', els => els.length);
  console.log(`Direct load #events?status=past&year=2025 -> status: "${reloadStatusActive}", year: "${reloadYearLabel}", cards: ${reloadCardCount}`);

  // Test Back-navigation from detail page
  const firstCard = (await page.$$('[data-testid="event-card"]'))[0];
  const firstSlug = await firstCard.getAttribute('data-slug');
  await page.click(`[data-slug="${firstSlug}"] .compact-explore-btn`);
  await page.waitForTimeout(400);
  const detailHash = await page.evaluate(() => window.location.hash);
  console.log(`Navigated to detail: "${detailHash}"`);

  // Click back button on detail page
  await page.click('.event-detail-back-btn');
  await page.waitForTimeout(400);
  const backStatusActive = await page.evaluate(() => document.querySelector('.filter-seg-option.is-active')?.textContent?.trim());
  const backYearLabel = await page.innerText('.filter-year-dropdown-btn span');
  const backCardCount = await page.$$eval('[data-testid="event-card"]', els => els.length);
  const backHash = await page.evaluate(() => window.location.hash);
  console.log(`Back to list -> status: "${backStatusActive}", year: "${backYearLabel}", cards: ${backCardCount}, hash: "${backHash}"`);

  // Keyboard navigation on dropdown
  await page.focus('.filter-year-dropdown-btn');
  await page.keyboard.press('Enter'); // Opens dropdown
  await page.waitForTimeout(200);
  let kbDropdownOpen = await page.isVisible('.filter-year-listbox');
  console.log(`Keyboard Enter opened dropdown: ${kbDropdownOpen}`);

  await page.keyboard.press('ArrowDown'); // Focus first or next option
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape'); // Closes dropdown and returns focus to button
  await page.waitForTimeout(200);
  let kbDropdownClosed = !(await page.isVisible('.filter-year-listbox'));
  const activeTag = await page.evaluate(() => document.activeElement?.className);
  console.log(`Keyboard Escape closed dropdown: ${kbDropdownClosed}, focus on: "${activeTag}"`);

  // Click outside closes dropdown without changing selection
  await page.click('.filter-year-dropdown-btn');
  await page.waitForTimeout(200);
  console.log('Opened dropdown for click outside test...');
  await page.mouse.click(100, 100); // Click top-left of page outside
  await page.waitForTimeout(200);
  let outsideClosed = !(await page.isVisible('.filter-year-listbox'));
  const currentYearAfterOutside = await page.innerText('.filter-year-dropdown-btn span');
  console.log(`Click outside closed listbox: ${outsideClosed}, selection unchanged: "${currentYearAfterOutside}"`);

  const testDPass =
    reloadStatusActive === 'Past' &&
    reloadYearLabel === '2025' &&
    reloadCardCount === 4 &&
    backStatusActive === 'Past' &&
    backYearLabel === '2025' &&
    backCardCount === 4 &&
    kbDropdownOpen &&
    kbDropdownClosed &&
    outsideClosed &&
    currentYearAfterOutside === '2025';
  console.log('TEST (d) PASS:', testDPass);

  // TEST e) Regression check: Alternation restarts from left card, Today marker, stars, clean console
  console.log('\n--- Test (e): Regression Check (Alternation, Markers, Console) ---');
  // In 2025 filtered list (4 cards)
  const rows = await page.$$('.timeline-row-grid');
  let alternationOk = true;
  for (let i = 0; i < rows.length; i++) {
    const isLeft = await rows[i].evaluate(el => el.classList.contains('card-on-left'));
    const isRight = await rows[i].evaluate(el => el.classList.contains('card-on-right'));
    const expectedLeft = i % 2 === 0;
    if (expectedLeft ? !isLeft : !isRight) alternationOk = false;
  }
  console.log(`Alternation in filtered list starts from left and alternates correctly: ${alternationOk}`);

  // Today marker check: when only past events are shown, Today marker should NOT render
  const todayMarkerPast = await page.$('.timeline-today-item');
  console.log(`Today marker rendered when only past events shown? ${!!todayMarkerPast} (Expected false)`);

  // Switch to All + All years: Today marker SHOULD render
  await page.click('.filter-seg-option:has-text("All")');
  await page.click('.filter-year-dropdown-btn');
  await page.locator('.filter-year-option', { hasText: 'All years' }).click();
  await page.waitForTimeout(300);
  const todayMarkerAll = await page.$('.timeline-today-item');
  console.log(`Today marker rendered when both upcoming and completed exist? ${!!todayMarkerAll} (Expected true)`);

  // Check console errors
  console.log('Console errors recorded:', consoleErrors);

  const testEPass = alternationOk && !todayMarkerPast && !!todayMarkerAll && consoleErrors.length === 0;
  console.log('TEST (e) PASS:', testEPass);

  await browser.close();
})();
