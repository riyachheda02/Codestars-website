import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\ARNAV KOTHAVADE\\.gemini\\antigravity-ide\\brain\\f8b3c58d-a3f4-4873-8966-82b9f602c4ec';

async function captureRestStates() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // 1. Desktop 1440x900
    const page1 = await browser.newPage();
    await page1.setViewport({ width: 1440, height: 900 });
    await page1.evaluateOnNewDocument(() => {
      sessionStorage.setItem('codestars_intro_played', 'true');
    });
    await page1.goto(APP_URL, { waitUntil: 'networkidle2' });
    await page1.evaluate(() => {
      document.getElementById('featured-events').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 1200));
    console.log('Capturing events_rest_1440x900.png...');
    await page1.screenshot({ path: path.join(ARTIFACT_DIR, 'events_rest_1440x900.png') });
    await page1.close();

    // 2. Mobile 390x844
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 390, height: 844, isMobile: true });
    await page2.evaluateOnNewDocument(() => {
      sessionStorage.setItem('codestars_intro_played', 'true');
    });
    await page2.goto(APP_URL, { waitUntil: 'networkidle2' });
    await page2.evaluate(() => {
      document.getElementById('featured-events').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 1200));
    console.log('Capturing events_rest_390x844.png...');
    await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'events_rest_390x844.png') });
    await page2.close();

    console.log('Rest screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

captureRestStates().catch(console.error);
