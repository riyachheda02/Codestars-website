import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testTransitions() {
  console.log('Starting Playwright/Puppeteer transition verification test (1440x900)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('codestars_intro_played', 'true'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // Helper to measure opacities and bounding boxes
  const measureFrame = async () => {
    return await page.evaluate(() => {
      const wordmarkEl = document.querySelector('.hero-wordmark-fixed-layer');
      const cardsEl = document.querySelector('.what-we-are-content-wrap');
      const rootEl = document.querySelector('.codestars-homepage-root');

      let wordmarkOpacity = 0;
      let wordmarkRect = null;
      if (wordmarkEl) {
        const style = window.getComputedStyle(wordmarkEl);
        if (style.visibility !== 'hidden' && style.display !== 'none') {
          wordmarkOpacity = parseFloat(style.opacity || '0');
        }
        wordmarkRect = wordmarkEl.getBoundingClientRect();
      }

      let cardsOpacity = 0;
      let cardsRect = null;
      if (cardsEl) {
        const style = window.getComputedStyle(cardsEl);
        if (style.visibility !== 'hidden' && style.display !== 'none') {
          cardsOpacity = parseFloat(style.opacity || '0');
        }
        cardsRect = cardsEl.getBoundingClientRect();
      }

      const intersects = (r1, r2) => {
        if (!r1 || !r2) return false;
        return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
      };

      const overlapConflict = (wordmarkOpacity > 0.15 && cardsOpacity > 0.02) ||
                              (cardsOpacity > 0.15 && wordmarkOpacity > 0.02);

      const boxIntersectionConflict = (wordmarkOpacity > 0.15 && cardsOpacity > 0.15 && intersects(wordmarkRect, cardsRect));

      return {
        wordmarkOpacity,
        cardsOpacity,
        heroState: rootEl?.getAttribute('data-hero-state'),
        overlapConflict,
        boxIntersectionConflict,
        viewportBrightness: Math.max(wordmarkOpacity, cardsOpacity),
        scrollY: window.scrollY
      };
    });
  };

  // --- TEST A & D: FORWARD TRANSITION (hero -> merged) ---
  console.log('\n--- 1. Testing Forward Transition (Sampling every 33ms) ---');
  // Trigger forward scroll
  await page.mouse.wheel({ deltaY: 100 });

  const forwardFrames = [];
  const forwardScreenshots = [];
  const forwardStart = Date.now();
  let forwardShotCount = 0;

  while (Date.now() - forwardStart < 1200) {
    const frame = await measureFrame();
    forwardFrames.push(frame);

    // Capture 6 evenly spaced screenshots
    const elapsed = Date.now() - forwardStart;
    if (elapsed >= forwardShotCount * 180 && forwardShotCount < 6) {
      const shotPath = `forward_shot_${forwardShotCount + 1}.png`;
      await page.screenshot({ path: shotPath });
      forwardScreenshots.push(shotPath);
      forwardShotCount++;
    }
    await new Promise(r => setTimeout(r, 33));
  }

  // --- TEST B & D: REVERSE TRANSITION (merged -> hero) ---
  console.log('\n--- 2. Testing Reverse Transition (Sampling every 33ms) ---');
  // First ensure we are at top in merged state
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 200));

  // Trigger upward scroll
  await page.mouse.wheel({ deltaY: -100 });

  const reverseFrames = [];
  const reverseScreenshots = [];
  const reverseStart = Date.now();
  let reverseShotCount = 0;

  while (Date.now() - reverseStart < 1200) {
    const frame = await measureFrame();
    reverseFrames.push(frame);

    const elapsed = Date.now() - reverseStart;
    if (elapsed >= reverseShotCount * 180 && reverseShotCount < 6) {
      const shotPath = `reverse_shot_${reverseShotCount + 1}.png`;
      await page.screenshot({ path: shotPath });
      reverseScreenshots.push(shotPath);
      reverseShotCount++;
    }
    await new Promise(r => setTimeout(r, 33));
  }

  // Check metrics for Forward
  const forwardOverlapViolations = forwardFrames.filter(f => f.overlapConflict);
  const forwardBoxViolations = forwardFrames.filter(f => f.boxIntersectionConflict);

  // Check metrics for Reverse
  const reverseOverlapViolations = reverseFrames.filter(f => f.overlapConflict);
  const reverseBoxViolations = reverseFrames.filter(f => f.boxIntersectionConflict);

  // Viewport empty gap check (brightness < 0.3 should be short)
  const emptyForwardFrames = forwardFrames.filter(f => f.viewportBrightness < 0.3);
  const emptyReverseFrames = reverseFrames.filter(f => f.viewportBrightness < 0.3);

  console.log(`Forward Frames: ${forwardFrames.length}`);
  console.log(`Forward Overlap Violations (H>0.15 & S>0.02 or S>0.15 & H>0.02): ${forwardOverlapViolations.length}`);
  console.log(`Forward Box Intersection Violations (both >0.15): ${forwardBoxViolations.length}`);
  console.log(`Forward Frames with brightness < 0.3: ${emptyForwardFrames.length} (~${emptyForwardFrames.length * 33}ms)`);

  console.log(`\nReverse Frames: ${reverseFrames.length}`);
  console.log(`Reverse Overlap Violations (H>0.15 & S>0.02 or S>0.15 & H>0.02): ${reverseOverlapViolations.length}`);
  console.log(`Reverse Box Intersection Violations (both >0.15): ${reverseBoxViolations.length}`);
  console.log(`Reverse Frames with brightness < 0.3: ${emptyReverseFrames.length} (~${emptyReverseFrames.length * 33}ms)`);

  // --- TEST C: 10 BACK-TO-BACK CYCLES ---
  console.log('\n--- 3. Running 10 Forward-Reverse Cycles Back-To-Back ---');
  let cycleSuccess = true;
  for (let c = 1; c <= 10; c++) {
    // Forward
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise(r => setTimeout(r, 1000));
    const mergedState = await page.evaluate(() => ({
      state: document.querySelector('.codestars-homepage-root')?.getAttribute('data-hero-state'),
      hasInlineOpacities: !!document.querySelector('.what-we-are-content-wrap')?.style.opacity
    }));

    // Reverse
    await page.mouse.wheel({ deltaY: -100 });
    await new Promise(r => setTimeout(r, 1050));
    const heroFinalState = await page.evaluate(() => ({
      state: document.querySelector('.codestars-homepage-root')?.getAttribute('data-hero-state'),
      hasInlineOpacities: !!document.querySelector('.what-we-are-content-wrap')?.style.opacity,
      scrollY: window.scrollY
    }));

    if (heroFinalState.state !== 'hero' || heroFinalState.hasInlineOpacities || heroFinalState.scrollY !== 0) {
      console.error(`Cycle ${c} failed to settle cleanly:`, heroFinalState);
      cycleSuccess = false;
    }
  }
  console.log(`10 Cycles completed. Settled Cleanly: ${cycleSuccess}`);

  // --- TEST C: 3 INTERRUPT CYCLES ---
  console.log('\n--- 4. Running 3 Interrupt Cycles (Anchor jump & reload mid-transition) ---');
  let interruptSuccess = true;

  // Interrupt 1: Anchor click mid forward transition
  await page.mouse.wheel({ deltaY: 100 });
  await new Promise(r => setTimeout(r, 200)); // mid-transition
  await page.evaluate(() => window.location.hash = '#events');
  await new Promise(r => setTimeout(r, 500));
  const int1 = await page.evaluate(() => window.__isHeroAnimating);

  // Return to home
  await page.evaluate(() => window.location.hash = '#home');
  await new Promise(r => setTimeout(r, 500));

  // Interrupt 2: Reload mid reverse transition
  await page.mouse.wheel({ deltaY: 100 });
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.wheel({ deltaY: -100 });
  await new Promise(r => setTimeout(r, 150)); // mid-reverse
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  const int2 = await page.evaluate(() => ({
    state: document.querySelector('.codestars-homepage-root')?.getAttribute('data-hero-state'),
    scrollY: window.scrollY,
    animating: window.__isHeroAnimating
  }));

  // Interrupt 3: Scrollbar jump to 200px mid-reverse transition
  await page.mouse.wheel({ deltaY: 100 });
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.wheel({ deltaY: -100 });
  await new Promise(r => setTimeout(r, 150)); // mid-reverse
  await page.evaluate(() => window.scrollTo(0, 300));
  await new Promise(r => setTimeout(r, 400));
  const int3 = await page.evaluate(() => ({
    state: document.querySelector('.codestars-homepage-root')?.getAttribute('data-hero-state'),
    animating: window.__isHeroAnimating
  }));

  console.log('Interrupt 1 resolved:', !int1);
  console.log('Interrupt 2 resolved (reload cleanly settled):', int2.state === 'hero' && !int2.animating);
  console.log('Interrupt 3 resolved (scrollbar jump snapped):', int3.state === 'merged' && !int3.animating);

  // --- TEST E: REDUCED MOTION ---
  console.log('\n--- 5. Testing Reduced Motion Mode ---');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.wheel({ deltaY: 100 });
  await new Promise(r => setTimeout(r, 300));
  const redMotionForward = await page.evaluate(() => document.querySelector('.codestars-homepage-root')?.getAttribute('data-hero-state'));
  await page.mouse.wheel({ deltaY: -100 });
  await new Promise(r => setTimeout(r, 300));
  const redMotionReverse = await page.evaluate(() => document.querySelector('.codestars-homepage-root')?.getAttribute('data-hero-state'));
  console.log(`Reduced motion forward state: ${redMotionForward}, reverse state: ${redMotionReverse}`);

  await browser.close();

  const results = {
    forwardFramesCount: forwardFrames.length,
    forwardOverlapViolations: forwardOverlapViolations.length,
    forwardBoxViolations: forwardBoxViolations.length,
    reverseFramesCount: reverseFrames.length,
    reverseOverlapViolations: reverseOverlapViolations.length,
    reverseBoxViolations: reverseBoxViolations.length,
    cycleSuccess,
    interruptSuccess: !int1 && int2.state === 'hero' && int3.state === 'merged',
    consoleErrorsCount: consoleErrors.length,
    consoleErrors
  };

  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
  console.log('\nTest completed successfully! Results written to test_results.json');
}

testTransitions();
