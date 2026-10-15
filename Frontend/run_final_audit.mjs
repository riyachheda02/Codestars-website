import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function runAuditAndScreenshots() {
  console.log('=== STARTING AUDIT AND SPECIFICATION VERIFICATION ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Set browser clock to 2026-10-11
  await page.evaluateOnNewDocument(() => {
    const fixedTime = new Date('2026-10-11T12:00:00+05:30').getTime();
    const OriginalDate = window.Date;
    class MockDate extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedTime);
        } else {
          super(...args);
        }
      }
      static now() {
        return fixedTime;
      }
    }
    window.Date = MockDate;
  });

  const testReport = {};

  // -------------------------------------------------------------
  // Test a: Navbar audit
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Navbar ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Check no "Back to Home" button text anywhere on any route
  const backToHomeExistsEvents = await page.evaluate(() => {
    return document.body.innerText.includes('Back to Home');
  });

  await page.goto('http://localhost:5173/#team', { waitUntil: 'networkidle0' });
  const backToHomeExistsTeam = await page.evaluate(() => {
    return document.body.innerText.includes('Back to Home');
  });

  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  // Scroll Y 0: navbar visible
  const navInitial = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="navbar"]');
    if (!nav) return null;
    const style = window.getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      transform: style.transform,
      top: rect.top,
      bottom: rect.bottom,
      hiddenClass: nav.classList.contains('is-nav-scroll-hidden')
    };
  });
  console.log('Navbar at scrollY 0:', navInitial);

  // Take screenshot: Navbar Visible
  const shotNavVisiblePath = 'screenshot_navbar_visible_1440.png';
  await page.screenshot({ path: shotNavVisiblePath });
  console.log('Saved screenshot:', shotNavVisiblePath);

  // Scroll down 700px
  await page.evaluate(() => {
    window.scrollTo({ top: 700, behavior: 'instant' });
  });
  // Trigger scroll event
  await page.evaluate(() => {
    window.dispatchEvent(new Event('scroll'));
  });
  await new Promise(r => setTimeout(r, 600));

  const navScrolledDown = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="navbar"]');
    if (!nav) return null;
    const style = window.getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      transform: style.transform,
      top: rect.top,
      bottom: rect.bottom,
      hiddenClass: nav.classList.contains('is-nav-scroll-hidden')
    };
  });
  console.log('Navbar after scrolling down 700px:', navScrolledDown);

  // Take screenshot: Navbar Hidden
  const shotNavHiddenPath = 'screenshot_navbar_hidden_1440.png';
  await page.screenshot({ path: shotNavHiddenPath });
  console.log('Saved screenshot:', shotNavHiddenPath);

  // Scroll back up 150px (scrollY = 550)
  await page.evaluate(() => {
    window.scrollTo({ top: 550, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  });
  await new Promise(r => setTimeout(r, 600));

  const navScrolledUp = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="navbar"]');
    const style = window.getComputedStyle(nav);
    return {
      opacity: style.opacity,
      visibility: style.visibility,
      hiddenClass: nav.classList.contains('is-nav-scroll-hidden')
    };
  });
  console.log('Navbar after scrolling back up 150px:', navScrolledUp);

  // Press Tab shows it
  await page.evaluate(() => {
    window.scrollTo({ top: 700, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  });
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 400));
  const navAfterTab = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="navbar"]');
    return !nav.classList.contains('is-nav-scroll-hidden');
  });
  console.log('Navbar visible after Tab key:', navAfterTab);

  // Home route navbar merge remains unchanged, no auto-hide
  await page.goto('http://localhost:5173/#', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    window.scrollTo({ top: 700, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  });
  await new Promise(r => setTimeout(r, 500));
  const homeNavHidden = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="navbar"]');
    return nav.classList.contains('is-nav-scroll-hidden');
  });
  console.log('Home route navbar has auto-hide? (should be false):', homeNavHidden);

  testReport.navbar = {
    backToHomeAbsent: !backToHomeExistsEvents && !backToHomeExistsTeam,
    visibleAt0: navInitial.opacity === '1' && navInitial.visibility === 'visible' && !navInitial.hiddenClass,
    hiddenAt700: navScrolledDown.hiddenClass && (navScrolledDown.visibility === 'hidden' || parseFloat(navScrolledDown.opacity) === 0),
    returnsOnScrollUp: !navScrolledUp.hiddenClass && navScrolledUp.visibility === 'visible',
    returnsOnTab: navAfterTab,
    homeUnchanged: !homeNavHidden
  };

  // -------------------------------------------------------------
  // Test b: Position audit on Events page
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Position Audit ---');
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  const positionAudit = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('.events-page-root *'));
    const fixedOrSticky = [];
    all.forEach(el => {
      const pos = window.getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') {
        fixedOrSticky.push({
          tag: el.tagName,
          className: el.className,
          pos
        });
      }
    });

    const filterBar = document.querySelector('[data-testid="events-filter"]');
    const filterPos = filterBar ? window.getComputedStyle(filterBar).position : null;

    return { fixedOrSticky, filterPos };
  });
  console.log('Fixed or sticky elements found in events page:', positionAudit);
  testReport.positionAudit = {
    onlyNavbarFixedOrSticky: positionAudit.fixedOrSticky.length === 0,
    filterBarPosition: positionAudit.filterPos
  };

  // -------------------------------------------------------------
  // Test c: Header audit
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Header Audit ---');
  const headerAudit = await page.evaluate(() => {
    const header = document.querySelector('.events-header-compact');
    const text = header ? header.innerText : '';
    const hasTotalPrize = text.includes('TOTAL PRIZE POOL') || text.includes('Total Prize Pool');
    const statTileCount = document.querySelectorAll('.events-stat-tile').length;
    const vh = window.innerHeight;
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const heightRatio = headerH / vh;
    return {
      hasTotalPrize,
      statTileCount,
      headerH,
      vh,
      heightRatio
    };
  });
  console.log('Header audit:', headerAudit);
  testReport.header = {
    noStats: !headerAudit.hasTotalPrize && headerAudit.statTileCount === 0,
    heightRatioUnder40vh: headerAudit.heightRatio <= 0.40
  };

  // Screenshot: Header and filter bar
  const shotHeaderFilterPath = 'screenshot_header_and_filter_1440.png';
  await page.screenshot({ path: shotHeaderFilterPath, clip: { x: 0, y: 0, width: 1440, height: 480 } });
  console.log('Saved screenshot:', shotHeaderFilterPath);

  // -------------------------------------------------------------
  // Test d: Filter bar audit
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Filter Bar Audit ---');
  const filterAudit = await page.evaluate(() => {
    const filter = document.querySelector('[data-testid="events-filter"]');
    const statusBtns = Array.from(filter.querySelectorAll('.filter-seg-option')).map(b => b.innerText.trim());
    const yearBtn = filter.querySelector('.filter-year-dropdown-btn')?.innerText.trim();
    const hasCategoryChips = filter.querySelectorAll('.filter-chip').length > 0;
    const hasVYear = filter.innerText.includes('v202') || document.body.innerText.includes('v2026');

    return {
      statusBtns,
      yearBtn,
      hasCategoryChips,
      hasVYear
    };
  });
  console.log('Filter audit:', filterAudit);

  // Check overflow at 1440, 1024, 768, 390
  const widths = [1440, 1024, 768, 390];
  const overflowResults = {};
  for (const w of widths) {
    await page.setViewport({ width: w, height: 800 });
    await new Promise(r => setTimeout(r, 200));
    const ov = await page.evaluate(() => {
      const el = document.querySelector('.events-filter-pill');
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        noOverflow: el.scrollWidth <= el.clientWidth + 1
      };
    });
    overflowResults[w] = ov;
  }
  console.log('Filter bar overflow checks:', overflowResults);

  // Reset viewport to 1440
  await page.setViewport({ width: 1440, height: 900 });

  // Test filter interactions (Upcoming -> 2, Past -> 5)
  await page.evaluate(() => {
    const upcomingBtn = Array.from(document.querySelectorAll('.filter-seg-option')).find(b => b.textContent.trim() === 'Upcoming');
    upcomingBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const upcomingCardsCount = await page.evaluate(() => document.querySelectorAll('[data-testid="event-card"]').length);
  const hashUpcoming = await page.evaluate(() => window.location.hash);

  // Reload page to test URL restore
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const restoredUpcomingCount = await page.evaluate(() => document.querySelectorAll('[data-testid="event-card"]').length);

  // Click Past
  await page.evaluate(() => {
    const pastBtn = Array.from(document.querySelectorAll('.filter-seg-option')).find(b => b.textContent.trim() === 'Past');
    pastBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const pastCardsCount = await page.evaluate(() => document.querySelectorAll('[data-testid="event-card"]').length);

  // Reset filter by selecting All
  await page.evaluate(() => {
    const allBtn = Array.from(document.querySelectorAll('.filter-seg-option')).find(b => b.textContent.trim() === 'All');
    allBtn?.click();
  });
  await new Promise(r => setTimeout(r, 400));
  const allCardsCount = await page.evaluate(() => document.querySelectorAll('[data-testid="event-card"]').length);

  testReport.filter = {
    exactThreeStatus: filterAudit.statusBtns.length === 3 && filterAudit.statusBtns.join(',') === 'All,Upcoming,Past',
    yearDropdownPresent: !!filterAudit.yearBtn,
    noCategoryChips: !filterAudit.hasCategoryChips,
    noVPrefix: !filterAudit.hasVYear,
    overflowPassed: Object.values(overflowResults).every(v => v.noOverflow),
    upcomingCount: upcomingCardsCount,
    restoredUpcomingCount,
    pastCount: pastCardsCount,
    allCount: allCardsCount
  };

  // -------------------------------------------------------------
  // Test e: Alternation at 1440x900
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Alternation at 1440x900 ---');
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const alternationAudit = await page.evaluate(() => {
    const spine = document.querySelector('.timeline-spine-track');
    const spineRect = spine.getBoundingClientRect();
    const spineCenterX = spineRect.left + spineRect.width / 2;

    const rows = Array.from(document.querySelectorAll('.timeline-row-grid'));
    const results = rows.map((row, idx) => {
      const card = row.querySelector('[data-testid="event-card"]');
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const isLeft = cardCenterX < spineCenterX;
      const isRight = cardCenterX > spineCenterX;
      const innerEdgeDist = isLeft
        ? (spineCenterX - cardRect.right)
        : (cardRect.left - spineCenterX);

      return {
        idx,
        isEven: idx % 2 === 0,
        slug: row.getAttribute('data-slug'),
        width: Math.round(cardRect.width),
        height: Math.round(cardRect.height),
        isLeft,
        isRight,
        innerEdgeDist: Math.round(innerEdgeDist)
      };
    });

    return { spineCenterX, results };
  });
  console.log('Alternation audit results:', alternationAudit);

  testReport.alternation = {
    evenOnLeftOddOnRight: alternationAudit.results.every(r => (r.isEven ? r.isLeft : r.isRight)),
    innerEdgeDistance28px: alternationAudit.results.every(r => r.innerEdgeDist >= 28),
    cardWidth440to500: alternationAudit.results.every(r => r.width >= 440 && r.width <= 500),
    cardHeightUnder430: alternationAudit.results.every(r => r.height <= 430)
  };

  // Screenshot: Two consecutive alternating cards with stars
  // Scroll to first two cards
  await page.evaluate(() => {
    const row = document.querySelector('.timeline-row-grid');
    row?.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.scrollBy(0, -60);
  });
  await new Promise(r => setTimeout(r, 400));
  const shotAlternatingCardsPath = 'screenshot_alternating_cards_1440.png';
  await page.screenshot({ path: shotAlternatingCardsPath, clip: { x: 180, y: 200, width: 1080, height: 680 } });
  console.log('Saved screenshot:', shotAlternatingCardsPath);

  // -------------------------------------------------------------
  // Test f: Star Nodes
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Star Nodes ---');
  const starAudit = await page.evaluate(() => {
    const starNodes = Array.from(document.querySelectorAll('[data-testid="timeline-star"]'));
    const allAreSvgStars = starNodes.every(n => n.querySelector('svg.star-svg polygon.star-polygon'));
    const flagshipNode = document.querySelector('.timeline-star-node.is-flagship svg');
    const regularNode = document.querySelector('.timeline-star-node:not(.is-flagship) svg');
    const flagshipSize = flagshipNode ? { w: flagshipNode.getAttribute('width'), h: flagshipNode.getAttribute('height') } : null;
    const regularSize = regularNode ? { w: regularNode.getAttribute('width'), h: regularNode.getAttribute('height') } : null;

    return {
      count: starNodes.length,
      allAreSvgStars,
      flagshipSize,
      regularSize
    };
  });
  console.log('Star node audit:', starAudit);
  testReport.stars = {
    allSvgStars: starAudit.allAreSvgStars,
    flagshipLarger: parseInt(starAudit.flagshipSize?.w || 0) > parseInt(starAudit.regularSize?.w || 0)
  };

  // -------------------------------------------------------------
  // Test g: Year markers & Today marker placement
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Year Markers & Today Marker Placement ---');
  const markerAudit = await page.evaluate(() => {
    const yearMarkers = Array.from(document.querySelectorAll('[data-testid="year-marker"]')).map(m => m.innerText.trim());
    const todayMarker = document.querySelector('[data-testid="today-marker"]');
    const todayText = todayMarker ? todayMarker.innerText.trim() : null;

    // Check DOM order of upcoming events, today marker, and 2025 year marker
    const order = [];
    const elements = document.querySelectorAll('.timeline-year-section, [data-testid="today-marker"], [data-testid="year-marker"], .timeline-row-grid');
    elements.forEach(el => {
      if (el.matches('[data-testid="today-marker"]')) {
        order.push('TODAY_MARKER');
      } else if (el.matches('[data-testid="year-marker"]')) {
        order.push(`YEAR_${el.innerText.trim()}`);
      } else if (el.matches('.timeline-row-grid')) {
        order.push(`EVENT_${el.getAttribute('data-slug')}`);
      }
    });

    return { yearMarkers, todayText, order };
  });
  console.log('Marker audit order:', markerAudit);

  testReport.markers = {
    plainYears: markerAudit.yearMarkers.every(y => !y.includes('v') && !y.includes('(')),
    todayMarkerPresent: markerAudit.todayText === 'TODAY',
    todayBeforeCompleted: markerAudit.order.indexOf('TODAY_MARKER') > markerAudit.order.indexOf('EVENT_icpc-camp-2026') &&
                          markerAudit.order.indexOf('TODAY_MARKER') < markerAudit.order.indexOf('YEAR_2025')
  };

  // Screenshot: Today marker area
  await page.evaluate(() => {
    const today = document.querySelector('[data-testid="today-marker"]');
    today?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  const shotTodayMarkerPath = 'screenshot_today_marker_area_1440.png';
  await page.screenshot({ path: shotTodayMarkerPath, clip: { x: 180, y: 150, width: 1080, height: 600 } });
  console.log('Saved screenshot:', shotTodayMarkerPath);

  // -------------------------------------------------------------
  // Test h: Mobile layout at 390x844
  // -------------------------------------------------------------
  console.log('\n--- 8. Testing Mobile Layout at 390x844 ---');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const mobileAudit = await page.evaluate(() => {
    const spine = document.querySelector('.timeline-spine-track');
    const spineLeft = spine ? window.getComputedStyle(spine).left : null;
    const bodyScrollWidth = document.body.scrollWidth;
    const windowInnerWidth = window.innerWidth;
    const noHScroll = bodyScrollWidth <= windowInnerWidth;

    const card = document.querySelector('[data-testid="event-card"]');
    const cardRect = card.getBoundingClientRect();

    const dock = document.querySelector('.codestars-mobile-dock');
    const dockDisplay = dock ? window.getComputedStyle(dock).display : null;

    return {
      spineLeft,
      noHScroll,
      bodyScrollWidth,
      windowInnerWidth,
      cardWidth: cardRect.width,
      dockDisplay
    };
  });
  console.log('Mobile audit:', mobileAudit);

  // Mobile scroll down: dock hides
  await page.evaluate(() => {
    window.scrollBy(0, 300);
  });
  await new Promise(r => setTimeout(r, 500));
  const dockHidden = await page.evaluate(() => {
    const dock = document.querySelector('.codestars-mobile-dock');
    return dock.classList.contains('is-dock-scroll-hidden');
  });

  // Mobile scroll up: dock returns
  await page.evaluate(() => {
    window.scrollBy(0, -150);
  });
  await new Promise(r => setTimeout(r, 500));
  const dockReturned = await page.evaluate(() => {
    const dock = document.querySelector('.codestars-mobile-dock');
    return !dock.classList.contains('is-dock-scroll-hidden');
  });

  // Screenshot: Mobile layout at 390x844
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  const shotMobilePath = 'screenshot_mobile_390x844.png';
  await page.screenshot({ path: shotMobilePath });
  console.log('Saved screenshot:', shotMobilePath);

  testReport.mobile = {
    spineAtLeft: mobileAudit.spineLeft === '20px',
    noHorizontalOverflow: mobileAudit.noHScroll,
    dockHidesOnScrollDown: dockHidden,
    dockReturnsOnScrollUp: dockReturned
  };

  // -------------------------------------------------------------
  // Test i: Explore event navigation & Back restoration
  // -------------------------------------------------------------
  console.log('\n--- 9. Testing Explore Event and Back Button ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const btn = document.querySelector('.compact-explore-btn');
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const detailHash = await page.evaluate(() => window.location.hash);
  const isDetailPage = await page.evaluate(() => !!document.querySelector('.event-detail-page'));

  // Click back button on detail page
  await page.evaluate(() => {
    const backBtn = document.querySelector('.event-detail-back-btn');
    backBtn?.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const restoredHash = await page.evaluate(() => window.location.hash);
  const backToEvents = await page.evaluate(() => !!document.querySelector('.events-page-root'));

  testReport.navigation = {
    detailHash,
    isDetailPage,
    restoredHash,
    backToEvents
  };

  console.log('\n====================================');
  console.log('FULL TEST REPORT:');
  console.log(JSON.stringify(testReport, null, 2));
  console.log('====================================');

  await browser.close();
}

runAuditAndScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
