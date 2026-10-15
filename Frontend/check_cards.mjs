import puppeteer from 'puppeteer-core';

async function checkCardDimensions() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#events', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const cards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.compact-event-card')).map((c) => ({
      title: c.querySelector('h3')?.innerText,
      width: Math.round(c.getBoundingClientRect().width),
      height: Math.round(c.getBoundingClientRect().height),
      posterH: Math.round(c.querySelector('.compact-poster-wrapper')?.getBoundingClientRect().height),
      contentH: Math.round(c.querySelector('.compact-content-area')?.getBoundingClientRect().height),
    }));
  });

  console.log('Cards dimensions at 1440x900:', JSON.stringify(cards, null, 2));
  await browser.close();
}

checkCardDimensions().catch(console.error);
