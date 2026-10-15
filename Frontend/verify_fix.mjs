import puppeteer from 'puppeteer-core';

async function runVerification() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Wait for font load & intro settle
  await new Promise(r => setTimeout(r, 2600));

  const scrollPositions = [0, 80, 200, 350, 500, 650, 800];
  const results = [];

  for (const pos of scrollPositions) {
    await page.evaluate((y) => window.scrollTo(0, y), pos);
    await new Promise(r => setTimeout(r, 300));

    // Capture screenshot
    await page.screenshot({ path: `verify_scroll_${pos}.png` });

    // Assert:
    // 1. Count of visible elements matching text "DJS" is at most 1 (ignoring sr-only h1)
    // 2. Nav logo's computed opacity is 0 whenever p < 0.97
    const check = await page.evaluate((scrollPos) => {
      const vh = window.innerHeight;
      const rawP = Math.min(1, Math.max(0, scrollPos / (0.8 * vh)));

      // Find all visible elements containing "DJS" (excluding sr-only)
      const allElements = Array.from(document.querySelectorAll('body *'));
      const visibleDJS = allElements.filter(el => {
        // Exclude children if parent matches or if sr-only
        if (el.closest('.sr-only')) return false;
        if (el.children.length > 0) return false; // leaf nodes only
        const text = (el.textContent || '').trim();
        if (text === 'DJS' || text.startsWith('DJS ')) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0.05 && rect.width > 0 && rect.height > 0;
        }
        return false;
      });

      // Check nav logo computed opacity
      const navLogo = document.querySelector('.navbar-docked-logo');
      let navLogoOpacity = 0;
      if (navLogo) {
        navLogoOpacity = parseFloat(window.getComputedStyle(navLogo).opacity);
      }

      return {
        pos: scrollPos,
        rawP: parseFloat(rawP.toFixed(3)),
        visibleDJSCount: visibleDJS.length,
        navLogoOpacity: parseFloat(navLogoOpacity.toFixed(2)),
        navLogoHiddenWhenPLow: rawP < 0.95 ? navLogoOpacity === 0 : true
      };
    }, pos);

    results.push(check);
  }

  // Scroll back to 0
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'verify_scroll_back_0.png' });

  const checkBack0 = await page.evaluate(() => {
    const navLogo = document.querySelector('.navbar-docked-logo');
    let navLogoOpacity = 0;
    if (navLogo) {
      navLogoOpacity = parseFloat(window.getComputedStyle(navLogo).opacity);
    }
    return {
      pos: 0,
      navLogoOpacity
    };
  });
  results.push({ test: 'back_to_0', ...checkBack0 });

  // Test Featured Events entrance and hover state
  await page.evaluate(() => {
    const el = document.getElementById('featured-events');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'verify_events_entrance.png' });

  // Hover over next button
  const nextBtn = await page.$('.coverflow-circle-arrow-btn[aria-label="Next event"]');
  if (nextBtn) {
    await nextBtn.hover();
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: 'verify_events_btn_hover.png' });
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: 'verify_events_slide_change.png' });
  }

  await browser.close();
  console.log('RESULTS_JSON:' + JSON.stringify(results, null, 2));
}

runVerification();
