import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844, isMobile: true },
];

async function runLayoutTests() {
  console.log('=== RUNNING TESTS a, b, c, d, e, f (LAYOUT AT REST ACROSS VIEWPORTS) ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile || false });

      await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('codestars_intro_played', 'true');
      });

      await page.goto(APP_URL, { waitUntil: 'networkidle2' });

      // Scroll events section into view
      await page.evaluate(() => {
        document.getElementById('featured-events').scrollIntoView();
      });

      // Wait 1.2s for entrance transitions to settle completely
      await new Promise(r => setTimeout(r, 1200));

      const res = await page.evaluate(() => {
        const head = document.querySelector('#featured-events .section-head-display');
        const title = document.querySelector('#featured-events .section-display-title');
        const stage = document.querySelector('#featured-events .coverflow-stage');
        const centerCard = document.querySelector('#featured-events .coverflow-card.is-center');
        const cards = Array.from(document.querySelectorAll('#featured-events .coverflow-card'));
        const controls = document.querySelector('#featured-events .coverflow-controls-row');

        const hr = head.getBoundingClientRect();
        const tr = title.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        const cr = centerCard.getBoundingClientRect();
        const ctr = controls.getBoundingClientRect();

        // a) element at title center
        const elAtTitle = document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2);
        const titleComputedOpacity = parseFloat(window.getComputedStyle(title).opacity);

        // b) stage top vs head bottom
        const gap = sr.top - hr.bottom;

        // c) center card width
        const centerWidth = cr.width;
        const centerHeight = cr.height;

        // d) symmetry
        const cardRects = cards.map((c, i) => {
          const r = c.getBoundingClientRect();
          const op = parseFloat(window.getComputedStyle(c).opacity);
          const vis = window.getComputedStyle(c).visibility;
          return { i, left: r.left, right: r.right, width: r.width, op, vis };
        });

        // e) opacities
        const cardsAbove95 = cardRects.filter(c => c.op > 0.95);
        const cardsOffset3OrBeyond = [cardRects[3]]; // index 3 is offset 3 / -3 for activeIndex 0

        // f) scrollWidth
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const controlsBelowStage = ctr.top >= sr.bottom;

        return {
          titleVisible: elAtTitle ? (elAtTitle === title || title.contains(elAtTitle) || elAtTitle.contains(title)) : false,
          elAtTitleTag: elAtTitle ? elAtTitle.className : null,
          titleComputedOpacity,
          gap,
          centerWidth,
          centerHeight,
          cardRects,
          cardsAbove95Count: cardsAbove95.length,
          card3Opacity: cardRects[3].op,
          card3Vis: cardRects[3].vis,
          scrollW,
          innerW,
          controlsBelowStage,
        };
      });

      console.log(`\n--- Viewport ${vp.name} ---`);

      // a) Heading visible check
      console.log(`a) Title element visible: ${res.titleVisible} (el: ${res.elAtTitleTag}), opacity: ${res.titleComputedOpacity}`);
      if (!res.titleVisible || res.titleComputedOpacity < 0.9) {
        throw new Error(`Test a FAILED on ${vp.name}: Heading is not clearly visible!`);
      }

      // b) Stage top vs head bottom gap
      console.log(`b) Gap between heading bottom and stage top: ${res.gap.toFixed(1)}px (req >= 24px)`);
      if (res.gap < 24) {
        throw new Error(`Test b FAILED on ${vp.name}: Gap is ${res.gap}px (< 24px)!`);
      }

      // c) Center card width check
      console.log(`c) Center card width: ${res.centerWidth.toFixed(1)}px, height: ${res.centerHeight.toFixed(1)}px`);
      if (vp.width === 1440) {
        const expected = 530;
        const diffPercent = Math.abs(res.centerWidth - expected) / expected;
        console.log(`   Diff from 530px: ${(diffPercent * 100).toFixed(2)}% (req <= 3%)`);
        if (diffPercent > 0.03) {
          throw new Error(`Test c FAILED on 1440px: width ${res.centerWidth} exceeds 3% margin from 530px!`);
        }
      }

      // d) Symmetry check
      const centerCenterX = (res.cardRects[0].left + res.cardRects[0].right) / 2;
      const dist1 = (res.cardRects[1].left + res.cardRects[1].right) / 2 - centerCenterX;
      const distMinus1 = centerCenterX - (res.cardRects[5].left + res.cardRects[5].right) / 2;
      const symDiff1 = Math.abs(dist1 - distMinus1);

      const dist2 = (res.cardRects[2].left + res.cardRects[2].right) / 2 - centerCenterX;
      const distMinus2 = centerCenterX - (res.cardRects[4].left + res.cardRects[4].right) / 2;
      const symDiff2 = Math.abs(dist2 - distMinus2);

      console.log(`d) Symmetry offset 1 diff: ${symDiff1.toFixed(2)}px (req <= 3px)`);
      console.log(`   Symmetry offset 2 diff: ${symDiff2.toFixed(2)}px (req <= 3px)`);
      if (symDiff1 > 3 || symDiff2 > 3) {
        throw new Error(`Test d FAILED on ${vp.name}: Asymmetric cards!`);
      }

      // e) Opacity check
      console.log(`e) Exactly 5 cards opacity > 0.95: count=${res.cardsAbove95Count}, offset 3 opacity=${res.card3Opacity}, vis=${res.card3Vis}`);
      if (res.cardsAbove95Count !== 5 || res.card3Opacity > 0.05) {
        throw new Error(`Test e FAILED on ${vp.name}: Opacity criteria not met!`);
      }

      // f) No horizontal scroll & controls row below carousel
      console.log(`f) scrollWidth (${res.scrollW}) === innerWidth (${res.innerW}): ${res.scrollW === res.innerW}, controls below stage: ${res.controlsBelowStage}`);
      if (res.scrollW !== res.innerW || !res.controlsBelowStage) {
        throw new Error(`Test f FAILED on ${vp.name}: Horizontal scroll or misplaced controls!`);
      }

      await page.close();
    }

    console.log('\n[PASS] All layout tests a, b, c, d, e, f passed across all viewports!');
  } finally {
    await browser.close();
  }
}

async function runAutoplayTests() {
  console.log('\n=== RUNNING AUTOPLAY TESTS g, h, i (4S CADENCE & ARROW PAUSE) ===');
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

    await page.evaluate(() => {
      document.getElementById('featured-events').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    const getIdx = async () => {
      return await page.evaluate(() => {
        const dot = document.querySelector('.coverflow-dot.is-active-pill');
        const dots = Array.from(document.querySelectorAll('.coverflow-dot'));
        return {
          idx: dots.indexOf(dot),
          isRunning: dot ? dot.classList.contains('is-running') : false,
          isPaused: dot ? dot.classList.contains('is-paused') : false,
        };
      });
    };

    // g) With no interaction, advances every ~4s
    console.log('Test g: Verifying 4s autoplay cadence and navbar hover independence...');
    const s0 = await getIdx();
    console.log(`  Initial slide: ${s0.idx}`);

    // Hover over navbar items to confirm it does not interfere
    await page.mouse.move(720, 30);
    await new Promise(r => setTimeout(r, 4500));
    const s1 = await getIdx();
    console.log(`  After 4.5s (with navbar hover): slide=${s1.idx}`);
    if (s1.idx === s0.idx) {
      throw new Error(`Test g FAILED: slide did not advance after 4.5s!`);
    }
    console.log('  [PASS] 4s cadence advanced as expected.');

    // h) Arrow click pauses 10s and resumes
    console.log('Test h: Click NEXT once, verify 10s pause and resumption...');
    const prevSlide = (await getIdx()).idx;
    await page.click('.coverflow-next-btn');
    await new Promise(r => setTimeout(r, 200));
    const afterClick = await getIdx();
    console.log(`  After click: slide=${afterClick.idx}, isPaused=${afterClick.isPaused}`);
    if (!afterClick.isPaused) {
      throw new Error(`Test h FAILED: did not enter is-paused state on arrow click!`);
    }
    // Check halfway through pause (5s into 10s pause) - should stay on same slide
    await new Promise(r => setTimeout(r, 5000));
    const midPause = await getIdx();
    console.log(`  At 5.2s into pause: slide=${midPause.idx}`);
    if (midPause.idx !== afterClick.idx) {
      throw new Error(`Test h FAILED: advanced prematurely during 10s pause window!`);
    }

    // Wait until 11s total from click (pause ends, next transition begins)
    await new Promise(r => setTimeout(r, 6000));
    const afterResume = await getIdx();
    console.log(`  At 11.2s: slide=${afterResume.idx}, isRunning=${afterResume.isRunning}`);
    if (!afterResume.isRunning) {
      throw new Error(`Test h FAILED: did not resume running after 10s pause!`);
    }
    console.log('  [PASS] 10s arrow pause and resumption passed.');

    // i) Dots do not pause
    console.log('Test i: Pagination dot click preserves running state...');
    await page.click('.coverflow-dot:nth-child(3)');
    await new Promise(r => setTimeout(r, 200));
    const dotState = await getIdx();
    console.log(`  After dot click: slide=${dotState.idx}, isRunning=${dotState.isRunning}, isPaused=${dotState.isPaused}`);
    if (dotState.isPaused || !dotState.isRunning) {
      throw new Error(`Test i FAILED: dot click triggered pause!`);
    }
    console.log('  [PASS] Dots click keeps carousel running.');

    await page.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  await runLayoutTests();
  await runAutoplayTests();
  console.log('\n=======================================');
  console.log('ALL SECTION TESTS a, b, c, d, e, f, g, h, i PASSED!');
  console.log('=======================================');
}

main().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
