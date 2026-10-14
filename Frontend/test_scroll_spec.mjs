import puppeteer from 'puppeteer-core';

async function runScrollTests() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  // Clear sessionStorage so we control the test cleanly
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('codestars_intro_played', 'true');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const vh = 1000;
  const pThreshold25 = 0.25 * (0.8 * vh); // 200px

  const failures = [];
  const testSteps = [];

  // 1. Scroll forward from 0 to 900 in 25px steps
  for (let y = 0; y <= 900; y += 25) {
    await page.evaluate(pos => window.scrollTo(0, pos), y);
    await new Promise(r => setTimeout(r, 40));

    const metrics = await page.evaluate((pos, pThresh) => {
      const fixedLayer = document.querySelector('.hero-wordmark-fixed-layer');
      const navLogo = document.querySelector('.navbar-docked-logo');
      const tagline = document.querySelector('.hero-tagline-wrap');

      const fixedOpacity = fixedLayer ? parseFloat(window.getComputedStyle(fixedLayer).opacity) : 0;
      const navOpacity = navLogo ? parseFloat(window.getComputedStyle(navLogo).opacity) : 0;
      const taglineOpacity = tagline ? parseFloat(window.getComputedStyle(tagline).opacity) : 0;

      const vh = window.innerHeight;
      const rawP = Math.min(1, Math.max(0, pos / (0.8 * vh)));

      const sumOpacity = fixedOpacity + navOpacity;

      // Between p = 0.88 and 1.0, crossfade occurs
      const isCrossfading = rawP >= 0.87 && rawP <= 1.0;
      let dominantValid = true;
      if (!isCrossfading) {
        if (rawP < 0.87) {
          dominantValid = fixedOpacity > 0.95 && navOpacity < 0.05;
        } else if (rawP >= 1.0) {
          dominantValid = navOpacity > 0.95 && fixedOpacity < 0.05;
        }
      }

      const taglineHiddenAbove25 = pos > pThresh ? taglineOpacity < 0.01 : true;

      return {
        pos,
        rawP: parseFloat(rawP.toFixed(3)),
        fixedOpacity: parseFloat(fixedOpacity.toFixed(3)),
        navOpacity: parseFloat(navOpacity.toFixed(3)),
        sumOpacity: parseFloat(sumOpacity.toFixed(3)),
        taglineOpacity: parseFloat(taglineOpacity.toFixed(3)),
        isCrossfading,
        sumPassed: sumOpacity >= 0.95,
        dominantValid,
        taglineHiddenAbove25
      };
    }, y, pThreshold25);

    testSteps.push(metrics);
    if (!metrics.sumPassed) {
      failures.push(`Forward y=${y} (rawP=${metrics.rawP}): sumOpacity=${metrics.sumOpacity} < 0.95 (fixed=${metrics.fixedOpacity}, nav=${metrics.navOpacity})`);
    }
    if (!metrics.dominantValid) {
      failures.push(`Forward y=${y} (rawP=${metrics.rawP}): Dominance failed outside crossfade (fixed=${metrics.fixedOpacity}, nav=${metrics.navOpacity})`);
    }
    if (!metrics.taglineHiddenAbove25) {
      failures.push(`Forward y=${y}: taglineOpacity=${metrics.taglineOpacity} is not 0 above threshold`);
    }
  }

  // 2. Scroll backward from 900 down to 0 in 25px steps
  for (let y = 900; y >= 0; y -= 25) {
    await page.evaluate(pos => window.scrollTo(0, pos), y);
    await new Promise(r => setTimeout(r, 40));

    const metrics = await page.evaluate((pos, pThresh) => {
      const fixedLayer = document.querySelector('.hero-wordmark-fixed-layer');
      const navLogo = document.querySelector('.navbar-docked-logo');
      const tagline = document.querySelector('.hero-tagline-wrap');

      const fixedOpacity = fixedLayer ? parseFloat(window.getComputedStyle(fixedLayer).opacity) : 0;
      const navOpacity = navLogo ? parseFloat(window.getComputedStyle(navLogo).opacity) : 0;
      const taglineOpacity = tagline ? parseFloat(window.getComputedStyle(tagline).opacity) : 0;

      const vh = window.innerHeight;
      const rawP = Math.min(1, Math.max(0, pos / (0.8 * vh)));

      const sumOpacity = fixedOpacity + navOpacity;
      const isCrossfading = rawP >= 0.87 && rawP <= 1.0;
      let dominantValid = true;
      if (!isCrossfading) {
        if (rawP < 0.87) {
          dominantValid = fixedOpacity > 0.95 && navOpacity < 0.05;
        } else if (rawP >= 1.0) {
          dominantValid = navOpacity > 0.95 && fixedOpacity < 0.05;
        }
      }

      const taglineHiddenAbove25 = pos > pThresh ? taglineOpacity < 0.01 : true;

      return {
        pos,
        rawP: parseFloat(rawP.toFixed(3)),
        fixedOpacity: parseFloat(fixedOpacity.toFixed(3)),
        navOpacity: parseFloat(navOpacity.toFixed(3)),
        sumOpacity: parseFloat(sumOpacity.toFixed(3)),
        taglineOpacity: parseFloat(taglineOpacity.toFixed(3)),
        isCrossfading,
        sumPassed: sumOpacity >= 0.95,
        dominantValid,
        taglineHiddenAbove25
      };
    }, y, pThreshold25);

    if (!metrics.sumPassed) {
      failures.push(`Backward y=${y} (rawP=${metrics.rawP}): sumOpacity=${metrics.sumOpacity} < 0.95 (fixed=${metrics.fixedOpacity}, nav=${metrics.navOpacity})`);
    }
    if (!metrics.dominantValid) {
      failures.push(`Backward y=${y} (rawP=${metrics.rawP}): Dominance failed outside crossfade (fixed=${metrics.fixedOpacity}, nav=${metrics.navOpacity})`);
    }
    if (!metrics.taglineHiddenAbove25) {
      failures.push(`Backward y=${y}: taglineOpacity=${metrics.taglineOpacity} is not 0 above threshold`);
    }
  }

  console.log(`TOTAL_STEPS_TESTED: ${testSteps.length * 2}`);
  console.log(`FAILURES_COUNT: ${failures.length}`);
  if (failures.length > 0) {
    console.error('FAILURES:', JSON.stringify(failures, null, 2));
  } else {
    console.log('ALL SCROLL MERGE AND TAGLINE OPACITY ASSERTIONS PASSED PERFECTLY!');
  }

  // Crossfade slice inspect
  const crossfadeSteps = testSteps.filter(s => s.pos >= 675 && s.pos <= 825);
  console.log('CROSSFADE_STEPS_SAMPLE:', JSON.stringify(crossfadeSteps, null, 2));

  await browser.close();
}

runScrollTests();
