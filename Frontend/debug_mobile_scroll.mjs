import puppeteer from 'puppeteer-core';

async function testMobileScroll() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const info = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
  }));
  console.log('Mobile Page scroll metrics:', info);

  // Scroll down smoothly or stepped to trigger real scroll deltas
  await page.evaluate(() => {
    window.scrollBy(0, 300);
  });
  await new Promise((r) => setTimeout(r, 400));
  const afterDown = await page.evaluate(() => ({
    scrollY: window.scrollY,
    dockClasses: document.querySelector('.codestars-mobile-dock')?.className,
    navClasses: document.querySelector('.codestars-navbar-pill')?.className,
  }));
  console.log('After scroll down:', afterDown);

  await page.evaluate(() => {
    window.scrollBy(0, -150);
  });
  await new Promise((r) => setTimeout(r, 400));
  const afterUp = await page.evaluate(() => ({
    scrollY: window.scrollY,
    dockClasses: document.querySelector('.codestars-mobile-dock')?.className,
  }));
  console.log('After scroll up:', afterUp);

  await browser.close();
}

testMobileScroll().catch(console.error);
