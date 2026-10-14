import { chromium } from 'playwright';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 1. Check exactly one Starfield canvas
  const starfields = await page.$$('.global-starfield-canvas');
  console.log(`Global starfield canvases found: ${starfields.length}`);

  // Screenshot hero expanded
  await page.screenshot({ path: 'test_hero_expanded.png' });

  // 2. Perform ONE wheel gesture down (deltaY 100)
  console.log('Dispatching one wheel scroll down (deltaY: 100)...');
  await page.mouse.wheel(0, 100);

  // Wait for 950ms animation to complete
  await page.waitForTimeout(1100);
  const scrollYAfterOne = await page.evaluate(() => window.scrollY);
  console.log(`scrollY after single wheel gesture: ${scrollYAfterOne}px`);
  await page.screenshot({ path: 'test_hero_merged_one_scroll.png' });

  // 3. Perform ONE wheel gesture up (deltaY: -100)
  console.log('Dispatching one wheel scroll up (deltaY: -100)...');
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(900);
  const scrollYAfterReverse = await page.evaluate(() => window.scrollY);
  console.log(`scrollY after reverse gesture: ${scrollYAfterReverse}px`);

  // Scroll to featured events
  await page.evaluate(() => {
    document.getElementById('featured-events')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(400);

  // Check card aspect ratios
  const cardBox = await page.evaluate(() => {
    const card = document.querySelector('.coverflow-card.is-center');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { width: r.width, height: r.height, ratio: r.width / r.height };
  });
  console.log('Center card dimensions:', cardBox);
  await page.screenshot({ path: 'test_carousel_portrait.png' });

  // Scroll to footer
  await page.evaluate(() => {
    document.querySelector('.codestars-footer')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(400);

  // Check map iframe and attributes
  const mapInfo = await page.evaluate(() => {
    const iframe = document.querySelector('.footer-map-iframe');
    const link = document.querySelector('.footer-map-link');
    const addressInList = document.querySelector('.footer-contact-list .footer-address-text');
    return {
      hasIframe: !!iframe,
      iframeTitle: iframe ? iframe.getAttribute('title') : null,
      iframeSrc: iframe ? iframe.getAttribute('src') : null,
      hasLink: !!link,
      linkTarget: link ? link.getAttribute('target') : null,
      hasOldRawAddress: !!addressInList,
    };
  });
  console.log('Footer Map Verification:', mapInfo);
  await page.screenshot({ path: 'test_footer_map.png' });

  // Mobile viewport check (390x844)
  console.log('Testing mobile viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.getElementById('featured-events')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  const mobileCardBox = await page.evaluate(() => {
    const card = document.querySelector('.coverflow-card.is-center');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { width: r.width, height: r.height, ratio: r.width / r.height };
  });
  console.log('Mobile center card dimensions:', mobileCardBox);
  await page.screenshot({ path: 'test_mobile_carousel.png' });

  await page.evaluate(() => {
    document.querySelector('.codestars-footer')?.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test_mobile_footer.png' });

  console.log('Console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) console.log('Errors:', consoleErrors);

  await browser.close();
}

run().catch(console.error);
