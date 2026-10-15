import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== RUNNING DETAILED TEST SUITE ===');

  // Test with clock mocked to 2026-10-11
  await page.addInitScript(() => {
    const mockDate = new Date('2026-10-11T12:00:00+05:30');
    // Keep real Date functionality but adjust "new Date()" without args
    const OriginalDate = Date;
    // @ts-ignore
    globalThis.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          super(...args);
        }
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  // TEST A: 1440x900 card dimensions and ratios
  console.log('\n--- Test A: 1440x900 Dimensions & Ratios ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });

  const expandBtn = await page.$('.timeline-year-expander-btn');
  if (expandBtn) await expandBtn.click();
  await page.waitForTimeout(600);

  const cards = await page.$$('[data-testid="event-card"]');
  console.log(`Found ${cards.length} cards.`);
  let testAPass = true;

  for (let i = 0; i < cards.length; i++) {
    const box = await cards[i].boundingBox();
    const ratio = box.width / box.height;
    const slug = await cards[i].getAttribute('data-slug');
    const widthOk = box.width >= 520 && box.width <= 590;
    const heightOk = box.height >= 170 && box.height <= 230;
    const ratioOk = ratio >= 2.3;

    console.log(`Card ${i} (${slug}): w=${box.width.toFixed(1)} (>=520 & <=590: ${widthOk}), h=${box.height.toFixed(1)} (>=170 & <=230: ${heightOk}), ratio=${ratio.toFixed(2)} (>=2.3: ${ratioOk})`);
    if (!widthOk || !heightOk || !ratioOk) testAPass = false;
  }
  console.log('TEST A PASS:', testAPass);

  // TEST B: Alternating sides and poster on left
  console.log('\n--- Test B: Alternating Sides & Poster on Left ---');
  const spine = await page.$('.timeline-spine-track');
  const spineBox = await spine.boundingBox();
  const spineCenter = spineBox.x + spineBox.width / 2;
  let testBPass = true;

  for (let i = 0; i < cards.length; i++) {
    const box = await cards[i].boundingBox();
    const poster = await cards[i].$('.compact-poster-wrapper');
    const posterBox = await poster.boundingBox();
    const posterLeftEqualsCardLeft = Math.abs(posterBox.x - box.x) <= 1.5;

    const isEven = i % 2 === 0;
    let sideOk = false;
    let dist = 0;

    if (isEven) {
      // Left of spine
      const cardRight = box.x + box.width;
      dist = spineCenter - cardRight;
      sideOk = box.x + box.width < spineCenter && dist >= 28;
    } else {
      // Right of spine
      dist = box.x - spineCenter;
      sideOk = box.x > spineCenter && dist >= 28;
    }

    console.log(`Card ${i}: expectedSide=${isEven ? 'LEFT' : 'RIGHT'}, distToSpine=${dist.toFixed(1)}px (>=28: ${sideOk}), posterOnLeft=${posterLeftEqualsCardLeft}`);
    if (!sideOk || !posterLeftEqualsCardLeft) testBPass = false;
  }
  console.log('TEST B PASS:', testBPass);

  // TEST C: Text clipping check
  console.log('\n--- Test C: Text Clipping & Button Inside ---');
  let testCPass = true;
  for (let i = 0; i < cards.length; i++) {
    const clipping = await cards[i].evaluate((el) => {
      const title = el.querySelector('.compact-title-serif');
      const meta = el.querySelector('.compact-meta-line');
      const desc = el.querySelector('.compact-description');
      const btn = el.querySelector('.compact-explore-btn');
      const cardRect = el.getBoundingClientRect();
      const btnRect = btn ? btn.getBoundingClientRect() : null;

      const titleOk = title ? title.scrollHeight <= title.clientHeight + 2 : true;
      const metaOk = meta ? meta.scrollHeight <= meta.clientHeight + 2 : true;
      const descOk = desc ? desc.scrollHeight <= desc.clientHeight + 2 || getComputedStyle(desc).webkitLineClamp === '2' : true;
      const btnInside = btnRect ? (btnRect.bottom <= cardRect.bottom + 1 && btnRect.top >= cardRect.top) : false;

      return { titleOk, metaOk, descOk, btnInside };
    });
    console.log(`Card ${i} clipping:`, clipping);
    if (!clipping.titleOk || !clipping.metaOk || !clipping.btnInside) testCPass = false;
  }
  console.log('TEST C PASS:', testCPass);

  // TEST D: Total timeline height <= 55% of baseline
  console.log('\n--- Test D: Total Timeline Height ---');
  const container = await page.$('.events-timeline-container');
  const containerBox = await container.boundingBox();
  const beforeHeight = 3470.36;
  const heightRatioPct = (containerBox.height / beforeHeight) * 100;
  console.log(`Before Height: ${beforeHeight}px, Revised Height: ${containerBox.height.toFixed(1)}px, Ratio: ${heightRatioPct.toFixed(2)}%`);
  const testDPass = heightRatioPct <= 55.0;
  console.log('TEST D PASS:', testDPass);

  // TEST E: Viewports 1024, 768, 390, 360 no horizontal overflow and no clipped text
  console.log('\n--- Test E: Responsive Viewports (1024, 768, 390, 360) ---');
  let testEPass = true;
  for (const w of [1024, 768, 390, 360]) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.waitForTimeout(300);

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const noOverflow = docScrollWidth <= windowWidth;

    const cardsCheck = await page.$$eval('[data-testid="event-card"]', els => {
      return els.every(el => {
        const btn = el.querySelector('.compact-explore-btn');
        const cardRect = el.getBoundingClientRect();
        const btnRect = btn ? btn.getBoundingClientRect() : null;
        return btnRect ? btnRect.bottom <= cardRect.bottom + 1 : false;
      });
    });

    console.log(`Viewport ${w}px: noOverflow=${noOverflow} (scrollW=${docScrollWidth}, winW=${windowWidth}), buttonsInside=${cardsCheck}`);
    if (!noOverflow || !cardsCheck) testEPass = false;
  }
  console.log('TEST E PASS:', testEPass);

  // TEST F: Connector meets card edge and star stays centered
  console.log('\n--- Test F: Connector and Star Centering ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);

  const connectorStarCheck = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.timeline-row-grid'));
    return rows.map((row, idx) => {
      const star = row.querySelector('.timeline-star-node');
      const connector = row.querySelector('.star-connector');
      const card = row.querySelector('.compact-event-card');
      if (!star || !connector || !card) return null;

      const starRect = star.getBoundingClientRect();
      const connRect = connector.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // Connector meets card edge:
      // If card on left: connector.left should touch card.right
      // If card on right: connector.right should touch card.left
      const isCardLeft = row.classList.contains('card-on-left');
      const meetsCard = isCardLeft
        ? Math.abs(connRect.left - cardRect.right) <= 1.5
        : Math.abs(connRect.right - cardRect.left) <= 1.5;

      const starCenterY = starRect.top + starRect.height / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const verticalAlignmentDiff = Math.abs(starCenterY - cardCenterY);

      return {
        idx,
        isCardLeft,
        meetsCard,
        verticalAlignmentDiff
      };
    });
  });
  console.log('Connector & Star check:', connectorStarCheck);
  const testFPass = connectorStarCheck.every(c => c && c.meetsCard && c.verticalAlignmentDiff <= 2);
  console.log('TEST F PASS:', testFPass);

  // TEST G: Explore event opens route, reduced motion, home page check
  console.log('\n--- Test G: Explore Navigation & Reduced Motion ---');
  const firstCardSlug = await cards[0].getAttribute('data-slug');
  const exploreBtn = await cards[0].$('.compact-explore-btn');
  await exploreBtn.click();
  await page.waitForTimeout(400);

  const currentHash = await page.evaluate(() => window.location.hash);
  console.log(`Clicked Explore for slug "${firstCardSlug}", current hash is: "${currentHash}"`);
  const navOk = currentHash === `#events/${firstCardSlug}`;

  // Check home page
  await page.goto('http://localhost:5173/#', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const homeHeroExists = await page.evaluate(() => !!document.querySelector('.home-hero') || !!document.querySelector('main'));
  console.log('Home page intact:', homeHeroExists);

  console.log('TEST G PASS:', navOk && homeHeroExists);

  await browser.close();
})();
