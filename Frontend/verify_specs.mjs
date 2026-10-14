import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== VERIFYING REVISED EVENTS TIMELINE & CARDS ===');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle' });

  // Expand all events
  const expandBtn = await page.$('.timeline-year-expander-btn');
  if (expandBtn) await expandBtn.click();
  await page.waitForTimeout(600);

  const container = await page.$('.events-timeline-container');
  const containerBox = await container.boundingBox();
  console.log('REVISED TOTAL TIMELINE HEIGHT:', containerBox.height);
  const beforeHeight = 3470.359375;
  const ratio = (containerBox.height / beforeHeight) * 100;
  console.log(`HEIGHT RATIO: ${ratio.toFixed(2)}% (Target: <= 55%)`);

  const cards = await page.$$('[data-testid="event-card"]');
  console.log('CARD COUNT:', cards.length);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    const aspect = box.width / box.height;
    const slug = await card.getAttribute('data-slug');
    console.log(`Card ${i} (${slug}): w=${box.width.toFixed(1)}, h=${box.height.toFixed(1)}, aspect=${aspect.toFixed(2)}`);

    // Check poster
    const poster = await card.$('.compact-poster-wrapper');
    const posterBox = await poster.boundingBox();
    const posterRelLeft = posterBox.x - box.x;
    console.log(`   Poster w=${posterBox.width.toFixed(1)}, h=${posterBox.height.toFixed(1)}, relLeft=${posterRelLeft.toFixed(1)}`);

    // Check inner text clipping
    const clipping = await card.evaluate((el) => {
      const title = el.querySelector('.compact-title-serif');
      const meta = el.querySelector('.compact-meta-line');
      const desc = el.querySelector('.compact-description');
      const btn = el.querySelector('.compact-explore-btn');
      const cardRect = el.getBoundingClientRect();
      const btnRect = btn ? btn.getBoundingClientRect() : null;

      return {
        titleScroll: title ? { scrollH: title.scrollHeight, clientH: title.clientHeight } : null,
        metaScroll: meta ? { scrollH: meta.scrollHeight, clientH: meta.clientHeight } : null,
        descScroll: desc ? { scrollH: desc.scrollHeight, clientH: desc.clientHeight } : null,
        btnFullyInside: btnRect ? (btnRect.bottom <= cardRect.bottom + 1 && btnRect.top >= cardRect.top) : false
      };
    });
    console.log(`   Clipping check:`, JSON.stringify(clipping));
  }

  // Check alternating sides relative to spine
  const spine = await page.$('.timeline-spine-track');
  const spineBox = await spine.boundingBox();
  const spineCenter = spineBox.x + spineBox.width / 2;
  console.log('Spine center X:', spineCenter);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    const isLeft = i % 2 === 0;
    if (isLeft) {
      const cardRight = box.x + box.width;
      const dist = spineCenter - cardRight;
      console.log(`Card ${i} is LEFT: dist to spine=${dist.toFixed(1)}px (expected >= 28px)`);
    } else {
      const dist = box.x - spineCenter;
      console.log(`Card ${i} is RIGHT: dist to spine=${dist.toFixed(1)}px (expected >= 28px)`);
    }
  }

  // Check responsive widths: 1024, 768, 390, 360
  for (const w of [1024, 768, 390, 360]) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.waitForTimeout(400);

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const hasHorizontalOverflow = docScrollWidth > windowWidth;

    const cardsCount = await page.$$eval('[data-testid="event-card"]', els => els.length);
    console.log(`Viewport ${w}px: overflow=${hasHorizontalOverflow} (scrollW=${docScrollWidth}, winW=${windowWidth}), cards=${cardsCount}`);
  }

  await browser.close();
})();
