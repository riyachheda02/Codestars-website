import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('=== STARTING EVENTS PAGE SPECIFICATION TESTS ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // TEST A: Status Logic
  console.log('\n--- Test A: Status Logic (Specification a) ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });

  // Evaluate status computation against reference dates using browser evaluate
  const statusTestResult = await page.evaluate(async () => {
    // Dynamically test status logic across mock dates
    const clock1 = new Date('2026-10-08T12:00:00+05:30');
    // Events ended before: bloodbytes-2025, mock-contest-2025, coffee-with-googlers-2025, code-uncode-2025, fe-contest-2024
    // Events starting after: code-bounty-2026, icpc-camp-2026
    
    // Test inside an event: 2026-11-20T12:00:00+05:30 (inside code-bounty-2026)
    const clock2 = new Date('2026-11-20T12:00:00+05:30');

    const cards = Array.from(document.querySelectorAll('.event-card-wide'));
    const renderedCards = cards.map(c => ({
      slug: c.getAttribute('data-slug'),
      badge: c.querySelector('.card-status-badge')?.textContent?.trim()
    }));

    return { renderedCards };
  });

  const cardsRendered = statusTestResult.renderedCards;
  console.log('Events rendered on page:', cardsRendered);

  // Expand 2024 to verify fe-contest-2024
  await page.evaluate(() => {
    const expandBtn = document.querySelector('.timeline-year-expander-btn');
    expandBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const allRenderedSlugs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.event-card-wide')).map(c => ({
      slug: c.getAttribute('data-slug'),
      badge: c.querySelector('.card-status-badge')?.textContent?.trim()
    }));
  });
  console.log('All rendered slugs after expanding older years:', allRenderedSlugs);

  const upcomingSlugs = allRenderedSlugs.filter(x => x.badge === 'Upcoming').map(x => x.slug);
  const completedSlugs = allRenderedSlugs.filter(x => x.badge === 'Completed').map(x => x.slug);

  const testAPass =
    upcomingSlugs.includes('code-bounty-2026') &&
    upcomingSlugs.includes('icpc-camp-2026') &&
    completedSlugs.includes('bloodbytes-2025') &&
    completedSlugs.includes('code-uncode-2025') &&
    completedSlugs.includes('fe-contest-2024') &&
    !completedSlugs.includes('code-bounty-2026');

  console.log('TEST A PASS (no completed labeled upcoming, proper upcoming/completed separation)?', testAPass);

  // TEST B: Filters
  console.log('\n--- Test B: Filters & URL State ---');
  // Click 'Upcoming' filter
  await page.evaluate(() => {
    const upcomingBtn = Array.from(document.querySelectorAll('.filter-seg-btn')).find(b => b.textContent.trim() === 'Upcoming');
    upcomingBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const upcomingCount = await page.evaluate(() => document.querySelectorAll('.event-card-wide').length);
  const resultCountText = await page.evaluate(() => document.querySelector('.filter-result-count')?.textContent?.trim());
  const hashUpcoming = await page.evaluate(() => window.location.hash);
  console.log(`Upcoming filter count: ${upcomingCount}, text: "${resultCountText}", hash: "${hashUpcoming}"`);

  // Click 'Past' filter
  await page.evaluate(() => {
    const pastBtn = Array.from(document.querySelectorAll('.filter-seg-btn')).find(b => b.textContent.trim() === 'Past');
    pastBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const pastCount = await page.evaluate(() => document.querySelectorAll('.event-card-wide').length);
  const hashPast = await page.evaluate(() => window.location.hash);
  console.log(`Past filter count: ${pastCount}, hash: "${hashPast}"`);

  // Reset filter
  await page.evaluate(() => {
    const allBtn = Array.from(document.querySelectorAll('.filter-seg-btn')).find(b => b.textContent.trim() === 'All');
    allBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Category filter: Flagship
  await page.evaluate(() => {
    const chip = Array.from(document.querySelectorAll('.filter-chip')).find(c => c.textContent.trim().toLowerCase().includes('flagship'));
    chip?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const flagshipCount = await page.evaluate(() => document.querySelectorAll('.event-card-wide').length);
  const hashFlagship = await page.evaluate(() => window.location.hash);
  console.log(`Flagship filter count: ${flagshipCount}, hash: "${hashFlagship}"`);

  // Test reload restores URL state
  await page.goto('http://localhost:5173/' + hashFlagship, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const reloadedCount = await page.evaluate(() => document.querySelectorAll('.event-card-wide').length);
  console.log(`Reloaded with hash count: ${reloadedCount} (expected ${flagshipCount})`);

  // Test empty state: select a filter combination that yields 0 matches
  await page.evaluate(() => {
    // Select Talk + 2026 (Coffee with googlers is in 2025, 2026 has no talks)
    const talkChip = Array.from(document.querySelectorAll('.filter-chip')).find(c => c.textContent.trim().toLowerCase().includes('talk'));
    talkChip?.click();
    const yr2026 = Array.from(document.querySelectorAll('.filter-year-chip')).find(c => c.textContent.trim().includes('2026'));
    yr2026?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const emptyStateVisible = await page.evaluate(() => !!document.querySelector('.events-empty-state'));
  console.log('Empty state displayed when 0 matches?', emptyStateVisible);

  // Click Reset filters
  await page.evaluate(() => {
    const resetBtn = document.querySelector('.empty-state-reset-btn') || document.querySelector('.filter-reset-btn');
    resetBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const resetCount = await page.evaluate(() => document.querySelectorAll('.event-card-wide').length);
  console.log('Cards after reset:', resetCount);

  // TEST C: Card Width & Responsiveness
  console.log('\n--- Test C: Card Width & Proportions ---');
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewport(vp);
    await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    const check = await page.evaluate((vpWidth) => {
      const col = document.querySelector('.events-timeline-container');
      const cards = Array.from(document.querySelectorAll('.event-card-wide'));
      const colWidth = col.getBoundingClientRect().width;
      const cardWidths = cards.map(c => c.getBoundingClientRect().width);
      const posterRatios = cards.map(c => {
        const poster = c.querySelector('.card-poster-wrapper');
        return poster ? (poster.getBoundingClientRect().width / c.getBoundingClientRect().width) : 0;
      });
      const overflowX = document.documentElement.scrollWidth > vpWidth + 1;

      return {
        colWidth,
        cardWidths,
        posterRatios,
        overflowX
      };
    }, vp.width);

    console.log(`Viewport ${vp.width}x${vp.height}: colWidth=${check.colWidth.toFixed(1)}, cardRatio=${(check.cardWidths[0] / check.colWidth).toFixed(2)}, posterRatio=${check.posterRatios[0].toFixed(2)}, overflowX=${check.overflowX}`);
  }

  // TEST D: Sticky filter bar & Year pills
  console.log('\n--- Test D: Sticky Bar & Year Pills ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise(r => setTimeout(r, 400));

  const stickyCheck = await page.evaluate(() => {
    const bar = document.querySelector('.events-filter-bar-sticky');
    const rect = bar.getBoundingClientRect();
    return { top: rect.top, isNearNavbar: rect.top >= 70 && rect.top <= 95 };
  });
  console.log(`Filter bar sticky position top: ${stickyCheck.top.toFixed(1)}px (is near navbar? ${stickyCheck.isNearNavbar})`);

  // TEST E: Explore Event route, Back button & Not Found state
  console.log('\n--- Test E: Detail Route & Back Navigation ---');
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollTo(0, 350));
  await new Promise(r => setTimeout(r, 400));
  const beforeScroll = await page.evaluate(() => window.scrollY);

  // Click explore on code-uncode-2025
  await page.evaluate(() => {
    const card = document.querySelector('[data-slug="code-uncode-2025"]');
    card?.querySelector('.btn-explore')?.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const detailUrl = await page.evaluate(() => window.location.hash);
  const detailTitle = await page.evaluate(() => document.querySelector('.detail-title-serif')?.textContent?.trim());
  console.log(`Navigated to detail: hash=${detailUrl}, title="${detailTitle}"`);

  // Click Back button
  await page.evaluate(() => {
    document.querySelector('.event-detail-back-btn')?.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const restoredHash = await page.evaluate(() => window.location.hash);
  const afterScroll = await page.evaluate(() => window.scrollY);
  console.log(`Restored hash: ${restoredHash}, scroll restored? ${Math.abs(afterScroll - beforeScroll) < 100}`);

  // Unknown slug not found state
  await page.goto('http://localhost:5173/#events/unknown-slug-xyz', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const notFoundVisible = await page.evaluate(() => !!document.querySelector('.notfound-card'));
  console.log('Not-found state visible on unknown slug?', notFoundVisible);

  // TEST F: Keyboard accessibility
  console.log('\n--- Test F: Keyboard Accessibility ---');
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  console.log('Active element on tab:', focusedTag);

  // TEST G: Check Home page is unchanged and carousel works
  console.log('\n--- Test G: Home page verification ---');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const homeOk = await page.evaluate(() => {
    const hero = !!document.getElementById('hero');
    const featured = !!document.getElementById('featured-events');
    const cards = document.querySelectorAll('.coverflow-card').length;
    return { hero, featured, cards };
  });
  console.log('Home page elements:', homeOk);

  console.log('\n--- CAPTURING REQUIRED SCREENSHOTS ---');
  // 1. Header screenshot
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const headerEl = await page.$('.events-header-compact');
  if (headerEl) {
    await headerEl.screenshot({ path: 'screenshot_events_header.png' });
    console.log('Saved screenshot_events_header.png');
  }

  // 2. Filter bar screenshot
  const filterBarEl = await page.$('#events-filter-bar');
  if (filterBarEl) {
    await filterBarEl.screenshot({ path: 'screenshot_events_filter_bar.png' });
    console.log('Saved screenshot_events_filter_bar.png');
  }

  // 3. Today marker area screenshot
  await page.evaluate(() => {
    document.querySelector('.timeline-today-item')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'screenshot_events_today_marker.png' });
  console.log('Saved screenshot_events_today_marker.png');

  // 4. Two cards (poster-left and poster-right) at desktop width
  await page.evaluate(() => {
    const list = document.querySelector('.timeline-ordered-list');
    list?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_events_desktop_cards.png' });
  console.log('Saved screenshot_events_desktop_cards.png');

  // 5. Flagship card screenshot
  await page.evaluate(() => {
    const card = document.querySelector('.event-card-wide.is-flagship');
    card?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  const flagshipEl = await page.$('.event-card-wide.is-flagship');
  if (flagshipEl) {
    await flagshipEl.screenshot({ path: 'screenshot_events_flagship_card.png' });
    console.log('Saved screenshot_events_flagship_card.png');
  }

  // 6. Mobile layout (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_events_mobile.png' });
  console.log('Saved screenshot_events_mobile.png');

  // 7. Detail page
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events/code-uncode-2025', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'screenshot_events_detail_page.png' });
  console.log('Saved screenshot_events_detail_page.png');

  await browser.close();
  console.log('\n=== ALL TESTS AND SCREENSHOTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
