import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\ARNAV KOTHAVADE\\.gemini\\antigravity-ide\\brain\\f8b3c58d-a3f4-4873-8966-82b9f602c4ec';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });

    // Wait for initial fade in
    await new Promise(r => setTimeout(r, 2200));

    // 1. Hero at rest
    console.log('Capturing Hero at rest...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hero_at_rest.png') });

    // 2. Hero on hover
    console.log('Capturing Hero on hover...');
    await page.mouse.move(720, 420);
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hero_hover.png') });

    // 3. "What we are" section
    console.log('Capturing What we are...');
    await page.evaluate(() => document.getElementById('what-we-are').scrollIntoView());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'what_we_are.png') });

    // 4. Featured events mid-transition
    console.log('Capturing Events section...');
    await page.evaluate(() => document.getElementById('featured-events').scrollIntoView());
    await new Promise(r => setTimeout(r, 500));
    await page.click('.coverflow-next-btn');
    await new Promise(r => setTimeout(r, 250)); // capture mid-transition
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'events_transition.png') });

    // 5. Announcements section & card hover
    console.log('Capturing Announcements...');
    await page.evaluate(() => document.getElementById('announcements').scrollIntoView());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'announcements.png') });

    // Announcement card hover with cursor spotlight
    const card = await page.$('.announcement-item-card');
    if (card) {
      const box = await card.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'announcement_card_hover.png') });
      }
    }

    // 6. Footer at desktop width (1440px)
    console.log('Capturing Footer...');
    await page.evaluate(() => document.querySelector('.codestars-footer').scrollIntoView());
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'footer_desktop.png') });

    console.log('All screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
