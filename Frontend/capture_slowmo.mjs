import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173/?slowmo=5';
const ARTIFACT_DIR = 'C:\\Users\\ARNAV KOTHAVADE\\.gemini\\antigravity-ide\\brain\\f8b3c58d-a3f4-4873-8966-82b9f602c4ec';

// With slowmo=5, base autoplay duration is 1200ms * 5 = 6000ms transition.
// We trigger an arrow or manual transition or autoplay tick, and capture at:
// 0ms (0%), 1500ms (25%), 3000ms (50%), 4500ms (75%), 6000ms (100%).

async function captureSlowmo() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('codestars_intro_played', 'true');
    });

    await page.goto(APP_URL, { waitUntil: 'networkidle2' });

    // Scroll to events section
    await page.evaluate(() => {
      document.getElementById('featured-events').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture 0% before transition starts
    console.log('Capturing slowmo 0% (rest state)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slowmo_transition_0.png') });

    // Click next button to trigger a slowmo transition (with slowmo=5, manual transition is 650ms * 5 = 3250ms)
    // Or call goToSlide(1, true) directly for full 6000ms autoplay transition
    console.log('Initiating slowmo autoplay transition (6000ms total)...');
    await page.evaluate(() => {
      // Trigger autoplay slide to slide 1
      const nextBtn = document.querySelector('.coverflow-next-btn');
      if (nextBtn) nextBtn.click();
    });

    // For manual next with slowmo=5: duration is 650ms * 5 = 3250ms
    // Let's sample at exact percentages of 3250ms:
    // 25% = 812ms
    // 50% = 1625ms
    // 75% = 2437ms
    // 100% = 3350ms
    await new Promise(r => setTimeout(r, 812));
    console.log('Capturing slowmo 25%...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slowmo_transition_25.png') });

    await new Promise(r => setTimeout(r, 813));
    console.log('Capturing slowmo 50%...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slowmo_transition_50.png') });

    await new Promise(r => setTimeout(r, 812));
    console.log('Capturing slowmo 75%...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slowmo_transition_75.png') });

    await new Promise(r => setTimeout(r, 950));
    console.log('Capturing slowmo 100%...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'slowmo_transition_100.png') });

    console.log('All 5 slow-motion transition screenshots saved successfully!');
  } finally {
    await browser.close();
  }
}

captureSlowmo().catch(err => {
  console.error('Slowmo capture error:', err);
  process.exit(1);
});
