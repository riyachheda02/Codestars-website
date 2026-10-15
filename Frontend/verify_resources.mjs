import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ARNAV KOTHAVADE\\.gemini\\antigravity-ide\\brain\\24794b10-4dc1-4edd-aa38-eee6cdc02c28';

async function testViewport(page, width, height) {
  console.log(`\n========================================`);
  console.log(`Testing viewport: ${width}x${height}`);
  console.log(`========================================`);
  await page.setViewport({ width, height });
  await page.goto('http://localhost:5173/#resources', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const evaluation = await page.evaluate((vw, vh) => {
    // a) Check texts and animations
    const bodyText = document.body ? document.body.innerText || '' : '';
    const hasCuratedPill = bodyText.includes('CURATED FOR CODESTARS');
    const hasVisibleResourcesFound = Array.from(document.querySelectorAll('body *:not(.sr-only)'))
      .some(el => el.children.length === 0 && (el.innerText || '').includes('resources found'));
    const hasMarqueeText = bodyText.includes('LEETCODE . FREECODECAMP');

    // Check animations
    const allAnimations = document.getAnimations();
    const hasInfiniteMarquee = allAnimations.some(anim => {
      const keyframes = anim.effect?.getKeyframes?.() || [];
      const hasTranslateX = keyframes.some(kf => kf.transform && kf.transform.includes('translateX'));
      const isInfinite = anim.effect?.getTiming?.()?.iterations === Infinity;
      return hasTranslateX && isInfinite;
    });

    // Bounding boxes
    const title = document.querySelector('.res-hero-title');
    const sub = document.querySelector('.res-hero-sub');
    const search = document.querySelector('.res-search-wrap');
    const chipsWrap = document.querySelector('.res-category-wrap');
    const header = document.querySelector('.res-header');
    const headerInner = document.querySelector('.res-header-inner');
    const firstCard = document.querySelector('.res-card');
    const navbarPill = document.querySelector('.codestars-navbar-pill');

    const titleRect = title ? title.getBoundingClientRect() : null;
    const subRect = sub ? sub.getBoundingClientRect() : null;
    const searchRect = search ? search.getBoundingClientRect() : null;
    const chipsRect = chipsWrap ? chipsWrap.getBoundingClientRect() : null;
    const headerRect = header ? header.getBoundingClientRect() : null;
    const firstCardRect = firstCard ? firstCard.getBoundingClientRect() : null;
    const navRect = navbarPill ? navbarPill.getBoundingClientRect() : null;

    // Centering offsets
    const pageCenter = vw / 2;
    const titleCenter = titleRect ? titleRect.left + titleRect.width / 2 : 0;
    const subCenter = subRect ? subRect.left + subRect.width / 2 : 0;
    const searchCenter = searchRect ? searchRect.left + searchRect.width / 2 : 0;
    const chipsCenter = chipsRect ? chipsRect.left + chipsRect.width / 2 : 0;

    const titleCenterOffset = Math.abs(titleCenter - pageCenter);
    const subCenterOffset = Math.abs(subCenter - pageCenter);
    const searchCenterOffset = Math.abs(searchCenter - pageCenter);
    const chipsCenterOffset = Math.abs(chipsCenter - pageCenter);

    // Vertical spacing
    const topSpaceTitle = titleRect ? titleRect.top : 0;
    const titleToSub = (subRect && titleRect) ? subRect.top - titleRect.bottom : 0;
    const subToSearch = (searchRect && subRect) ? searchRect.top - subRect.bottom : 0;
    const searchToChips = (chipsRect && searchRect) ? chipsRect.top - searchRect.bottom : 0;
    const chipsToCards = (firstCardRect && chipsRect) ? firstCardRect.top - chipsRect.bottom : 0;

    // Overflow check
    const rootOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    const headerOverflow = header ? header.scrollWidth > header.clientWidth : false;
    const chipsOverflow = chipsWrap ? chipsWrap.scrollWidth > chipsWrap.clientWidth : false;

    // aria-live
    const ariaLiveEl = document.querySelector('[aria-live="polite"]');
    const ariaLiveText = ariaLiveEl ? ariaLiveEl.innerText : null;

    // Header bottom relative to page top (scrollY is 0)
    const headerBottom = chipsRect ? chipsRect.bottom : (headerRect ? headerRect.bottom : 0);
    const firstCardTop = firstCardRect ? firstCardRect.top : 0;

    return {
      hasCuratedPill,
      hasVisibleResourcesFound,
      hasMarqueeText,
      hasInfiniteMarquee,
      titleCenterOffset,
      subCenterOffset,
      searchCenterOffset,
      chipsCenterOffset,
      topSpaceTitle,
      titleToSub,
      subToSearch,
      searchToChips,
      chipsToCards,
      rootOverflow,
      headerOverflow,
      chipsOverflow,
      ariaLiveText,
      headerBottom,
      firstCardTop,
      navBottom: navRect ? navRect.bottom : 0,
    };
  }, width, height);

  console.log(`- Removals check:`);
  console.log(`  "CURATED FOR CODESTARS" present: ${evaluation.hasCuratedPill} (Expect false)`);
  console.log(`  Visible "resources found" present: ${evaluation.hasVisibleResourcesFound} (Expect false)`);
  console.log(`  Marquee text present: ${evaluation.hasMarqueeText} (Expect false)`);
  console.log(`  Infinite marquee animation running: ${evaluation.hasInfiniteMarquee} (Expect false)`);

  console.log(`- Centering measurements (offsets from viewport center):`);
  console.log(`  Title center offset: ${evaluation.titleCenterOffset.toFixed(2)}px (Expect <= 2px)`);
  console.log(`  Subtitle center offset: ${evaluation.subCenterOffset.toFixed(2)}px (Expect <= 2px)`);
  console.log(`  Search center offset: ${evaluation.searchCenterOffset.toFixed(2)}px (Expect <= 2px)`);
  console.log(`  Chips center offset: ${evaluation.chipsCenterOffset.toFixed(2)}px (Expect <= 2px)`);

  console.log(`- Spacing & Rhythm:`);
  console.log(`  Top space to title: ${evaluation.topSpaceTitle.toFixed(1)}px (Desktop >= 120px, Mobile >= 96px)`);
  console.log(`  Title to Subtitle: ${evaluation.titleToSub.toFixed(1)}px (Target 12px)`);
  console.log(`  Subtitle to Search: ${evaluation.subToSearch.toFixed(1)}px (Target 32px)`);
  console.log(`  Search to Chips: ${evaluation.searchToChips.toFixed(1)}px (Target 20px)`);
  console.log(`  Chips to First Card: ${evaluation.chipsToCards.toFixed(1)}px (Target 32px)`);

  console.log(`- Overflow & Height:`);
  console.log(`  Root overflow: ${evaluation.rootOverflow} (Expect false)`);
  console.log(`  Chips overflow: ${evaluation.chipsOverflow} (Expect false)`);
  console.log(`  Header bottom ends at: ${evaluation.headerBottom.toFixed(1)}px (At 1440x900 expect <= 520px)`);
  console.log(`  First card top: ${evaluation.firstCardTop.toFixed(1)}px (Below header, visible above fold)`);
  console.log(`  Navbar bottom: ${evaluation.navBottom.toFixed(1)}px (Title top ${evaluation.topSpaceTitle.toFixed(1)}px > navBottom)`);
  console.log(`  Screen reader announcement: "${evaluation.ariaLiveText}"`);

  // Screenshot top of page
  const screenshotPath = path.join(ARTIFACT_DIR, `resources_top_${width}x${height}.png`);
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  return evaluation;
}

async function testInteractions(page) {
  console.log(`\n========================================`);
  console.log(`Testing Interactions (Search, Filter, Empty state, Reset)`);
  console.log(`========================================`);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#resources', { waitUntil: 'networkidle0' });

  // 1. Search for non-existent item
  console.log(`Testing empty state on non-matching query...`);
  await page.type('.res-search-input', 'xyznonexistent123');
  await new Promise(r => setTimeout(r, 200));

  let countText = await page.evaluate(() => document.querySelector('[aria-live="polite"]').innerText);
  let emptyStateVisible = await page.evaluate(() => !!document.querySelector('.res-empty'));
  console.log(`  aria-live announcement: "${countText}"`);
  console.log(`  Empty state displayed: ${emptyStateVisible} (Expect true)`);

  // 2. Click reset button
  console.log(`Testing reset button...`);
  await page.click('.res-reset-btn');
  await new Promise(r => setTimeout(r, 200));
  countText = await page.evaluate(() => document.querySelector('[aria-live="polite"]').innerText);
  let cardCount = await page.evaluate(() => document.querySelectorAll('.res-card').length);
  console.log(`  After reset, cards shown: ${cardCount}, aria-live: "${countText}"`);

  // 3. Category filter
  console.log(`Testing category filter 'Web Development'...`);
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.res-cat-pill'));
    const webPill = pills.find(p => p.innerText.includes('Web Development'));
    if (webPill) webPill.click();
  });
  await new Promise(r => setTimeout(r, 200));
  countText = await page.evaluate(() => document.querySelector('[aria-live="polite"]').innerText);
  cardCount = await page.evaluate(() => document.querySelectorAll('.res-card').length);
  console.log(`  Web Development cards shown: ${cardCount}, aria-live: "${countText}"`);

  // 4. Test Navbar auto-hide on scroll
  console.log(`Testing navbar auto-hide on scroll down past 120px...`);
  await page.evaluate(() => window.scrollTo(0, 300));
  await new Promise(r => setTimeout(r, 400));
  const isNavHidden = await page.evaluate(() => {
    const nav = document.querySelector('.codestars-navbar-pill');
    return nav ? nav.classList.contains('is-nav-scroll-hidden') : false;
  });
  console.log(`  Navbar has is-nav-scroll-hidden class on scroll: ${isNavHidden} (Expect true)`);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test standard viewports
  await testViewport(page, 1440, 900);
  await testViewport(page, 1024, 768);
  await testViewport(page, 390, 844);

  // Test interactions
  await testInteractions(page);

  await browser.close();
  console.log('\nAll tests complete.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
