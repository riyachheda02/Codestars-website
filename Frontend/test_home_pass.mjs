import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844, isMobile: true },
];

async function runSection0Tests() {
  console.log('--- TEST 0: HERO WORDMARK VS TAGLINE RECT AT SCROLLY = 0 ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile || false });
      await page.goto(APP_URL, { waitUntil: 'networkidle2' });

      // Ensure scrollY is 0
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 600));

      const rects = await page.evaluate(() => {
        const anchor = document.getElementById('hero-wordmark-anchor');
        const tagline = document.querySelector('.hero-tagline-wrap');
        const fixedLayer = document.querySelector('.hero-wordmark-fixed-layer');
        const djsLine = document.querySelector('.solid-djs-line');
        const codeStarsLine = document.querySelector('.solid-codestars-line');

        const getBox = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
        };

        return {
          anchorRect: getBox(anchor),
          taglineRect: getBox(tagline),
          fixedRect: getBox(fixedLayer),
          csRect: getBox(codeStarsLine),
          scrollY: window.scrollY
        };
      });

      const wordmarkBottom = Math.max(rects.anchorRect?.bottom || 0, rects.csRect?.bottom || 0);
      const taglineTop = rects.taglineRect?.top || 0;
      const gap = taglineTop - wordmarkBottom;

      console.log(`Viewport ${vp.name}:`);
      console.log(`  Wordmark Bottom: ${wordmarkBottom.toFixed(1)}px`);
      console.log(`  Tagline Top:     ${taglineTop.toFixed(1)}px`);
      console.log(`  Gap (must be >= 24px): ${gap.toFixed(1)}px`);

      if (gap < 24) {
        throw new Error(`FAILURE on ${vp.name}: Tagline gap is ${gap.toFixed(1)}px (< 24px required)`);
      } else {
        console.log(`  [PASS] Gap is ${gap.toFixed(1)}px >= 24px`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }
}

async function runSection2AutoplayTests() {
  console.log('\n--- TEST 2: AUTOPLAY STATE MACHINE TESTS (a, b, c, d, e) ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Set fast config for autoplay tests so they run in ~8-12 seconds instead of minutes
    // interval: 1500ms, pause: 3000ms
    await page.evaluateOnNewDocument(() => {
      window.__COVERFLOW_CONFIG__ = { interval: 1200, pause: 2500 };
    });

    await page.goto(APP_URL, { waitUntil: 'networkidle2' });

    // Scroll events into view so IntersectionObserver sets isSectionVisible
    await page.evaluate(() => {
      document.getElementById('featured-events').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    // Helper to get active slide index and active pill class
    const getCoverflowState = async () => {
      return await page.evaluate(() => {
        const activeDot = document.querySelector('.coverflow-dot.is-active-pill');
        const dots = Array.from(document.querySelectorAll('.coverflow-dot'));
        const activeIdx = dots.indexOf(activeDot);
        const isRunning = activeDot ? activeDot.classList.contains('is-running') : false;
        const isPaused = activeDot ? activeDot.classList.contains('is-paused') : false;
        return { activeIdx, isRunning, isPaused };
      });
    };

    // --- Sub-test a: No interaction advances slide on cadence ---
    console.log('Sub-test a: No interaction advances slide');
    const stateA1 = await getCoverflowState();
    console.log(`  Initial active slide: ${stateA1.activeIdx}, running: ${stateA1.isRunning}`);
    await new Promise(r => setTimeout(r, 1600));
    const stateA2 = await getCoverflowState();
    console.log(`  After 1600ms active slide: ${stateA2.activeIdx}, running: ${stateA2.isRunning}`);
    if (stateA2.activeIdx === stateA1.activeIdx) {
      throw new Error(`Sub-test a FAILED: carousel did not advance on schedule!`);
    }
    console.log('  [PASS] Carousel auto-advanced without interaction.');

    // --- Sub-test b: Arrow click pauses for pause duration ---
    console.log('Sub-test b: Arrow click pauses autoplay');
    const stateB1 = await getCoverflowState();
    await page.click('.coverflow-next-btn');
    await new Promise(r => setTimeout(r, 100)); // wait for click handler
    const stateB2 = await getCoverflowState();
    console.log(`  After next arrow click: slide=${stateB2.activeIdx}, isPaused=${stateB2.isPaused}`);
    if (!stateB2.isPaused) {
      throw new Error(`Sub-test b FAILED: active pill did not enter is-paused state on arrow click!`);
    }
    // Wait halfway through pause duration (1200ms of 2500ms pause) - should stay on same slide
    await new Promise(r => setTimeout(r, 1200));
    const stateB3 = await getCoverflowState();
    if (stateB3.activeIdx !== stateB2.activeIdx) {
      throw new Error(`Sub-test b FAILED: carousel advanced prematurely during pause window!`);
    }
    console.log('  [PASS] Carousel stayed paused during pause window.');
    // Wait for pause to expire + advance
    await new Promise(r => setTimeout(r, 1600));
    const stateB4 = await getCoverflowState();
    console.log(`  After pause expiry: slide=${stateB4.activeIdx}, isRunning=${stateB4.isRunning}`);
    if (!stateB4.isRunning) {
      throw new Error(`Sub-test b FAILED: carousel did not resume running after pause expired!`);
    }
    console.log('  [PASS] Carousel resumed running after pause duration.');

    // --- Sub-test c: Consecutive arrow clicks reset pause countdown ---
    console.log('Sub-test c: Consecutive arrow clicks reset pause window');
    await page.click('.coverflow-next-btn');
    await new Promise(r => setTimeout(r, 1000)); // 1s into 2.5s pause
    await page.click('.coverflow-next-btn'); // click again: resets 2.5s countdown
    const stateC1 = await getCoverflowState();
    console.log(`  Clicked arrow again at 1s, new slide: ${stateC1.activeIdx}`);
    await new Promise(r => setTimeout(r, 1500)); // would have expired old pause if not reset
    const stateC2 = await getCoverflowState();
    if (stateC2.activeIdx !== stateC1.activeIdx) {
      throw new Error(`Sub-test c FAILED: second arrow click did not reset pause countdown!`);
    }
    console.log('  [PASS] Consecutive arrow click reset pause countdown.');

    // Wait out pause
    await new Promise(r => setTimeout(r, 1500));

    // --- Sub-test d: Pagination dot click does NOT pause (keeps running) ---
    console.log('Sub-test d: Pagination dot click maintains running mode');
    await page.click('.coverflow-dot:nth-child(2)');
    await new Promise(r => setTimeout(r, 100));
    const stateD1 = await getCoverflowState();
    console.log(`  After dot 2 click: slide=${stateD1.activeIdx}, isRunning=${stateD1.isRunning}, isPaused=${stateD1.isPaused}`);
    if (stateD1.isPaused || !stateD1.isRunning) {
      throw new Error(`Sub-test d FAILED: dot click unexpectedly triggered paused state!`);
    }
    console.log('  [PASS] Dot click keeps carousel in running state.');

    // --- Sub-test e: Tab visibility change / offscreen pauses and resumes safely ---
    console.log('Sub-test e: Visibility change handles pause/resume without burst');
    const stateE1 = await getCoverflowState();
    // Simulate tab hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // Wait for 3 seconds while hidden (more than 2 normal interval cycles)
    await new Promise(r => setTimeout(r, 3000));
    const stateE2 = await getCoverflowState();
    console.log(`  While hidden for 3000ms: slide before=${stateE1.activeIdx}, slide after=${stateE2.activeIdx}`);
    if (stateE2.activeIdx !== stateE1.activeIdx) {
      throw new Error(`Sub-test e FAILED: carousel advanced while tab was hidden!`);
    }
    // Restore visibility
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await new Promise(r => setTimeout(r, 1600));
    const stateE3 = await getCoverflowState();
    console.log(`  After returning visible: slide advanced to ${stateE3.activeIdx}`);
    if (stateE3.activeIdx === stateE2.activeIdx) {
      throw new Error(`Sub-test e FAILED: carousel did not resume after tab became visible!`);
    }
    console.log('  [PASS] Tab hidden prevented advances; resumed cleanly on visible.');

    await page.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await runSection0Tests();
    await runSection2AutoplayTests();
    console.log('\n====================================');
    console.log('ALL SECTION 0 & SECTION 2 TESTS PASSED!');
    console.log('====================================');
  } catch (err) {
    console.error('\nTEST ERROR:', err);
    process.exit(1);
  }
}

main();
