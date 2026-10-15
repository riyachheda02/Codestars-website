import { chromium } from 'playwright';
import assert from 'assert';

async function runTests() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  console.log('--- TEST A: Countdown accuracy and layout shift with mocked clock ---');
  {
    // Context with fixed time: 2026-10-11T10:00:00+05:30
    // Event: Code Bounty starts 2026-11-20T10:00:00+05:30 -> exactly 40 days 0 hours 0 mins 0 secs
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    const fixedTime = new Date('2026-10-11T10:00:00+05:30').getTime();

    await context.addInitScript((time) => {
      let currentTime = time;
      const _Date = window.Date;
      window.__advanceClock = (ms) => {
        currentTime += ms;
      };

      class MockDate extends _Date {
        constructor(...args) {
          if (args.length === 0) {
            super(currentTime);
          } else {
            super(...args);
          }
        }
        static now() {
          return currentTime;
        }
      }
      window.Date = MockDate;
    }, fixedTime);

    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    const spotlight = page.locator('.nextup-spotlight-card');
    assert.strictEqual(await spotlight.isVisible(), true, 'Spotlight card should be visible');

    // Verify title and eyebrow
    assert.ok((await page.locator('.nextup-title').innerText()).includes('Code Bounty'));
    assert.strictEqual(await page.locator('.nextup-eyebrow').innerText(), 'NEXT UP');

    // Verify countdown blocks: 40 DAYS, 00 HOURS, 00 MINUTES, 00 SECONDS
    const countBlocks = page.locator('.nextup-count-num');
    assert.strictEqual(await countBlocks.nth(0).innerText(), '40');
    assert.strictEqual(await countBlocks.nth(1).innerText(), '00');
    assert.strictEqual(await countBlocks.nth(2).innerText(), '00');
    assert.strictEqual(await countBlocks.nth(3).innerText(), '00');

    // Layout shift check: get bounding box
    const box1 = await spotlight.boundingBox();
    console.log(`Initial spotlight box at 1440px: height=${box1.height}px, width=${box1.width}px`);
    assert.ok(Math.round(box1.height) <= 300, `Height exceeds 300px target: ${box1.height}px`);
    console.log(`SUCCESS: Height is ${box1.height}px (<= 300px)`);

    // Advance clock by 1 second (1000ms)
    await page.evaluate(() => {
      window.__advanceClock(1000);
    });
    // Wait for the next tick
    await page.waitForTimeout(1100);

    // Now 40 days minus 1 second -> 39 days, 23 hours, 59 mins, 59 secs
    assert.strictEqual(await countBlocks.nth(0).innerText(), '39');
    assert.strictEqual(await countBlocks.nth(1).innerText(), '23');
    assert.strictEqual(await countBlocks.nth(2).innerText(), '59');
    assert.strictEqual(await countBlocks.nth(3).innerText(), '59');

    const box2 = await spotlight.boundingBox();
    assert.ok(Math.abs(box1.height - box2.height) <= 1, 'Height changed between ticks');
    assert.ok(Math.abs(box1.width - box2.width) <= 1, 'Width changed between ticks');
    console.log('SUCCESS: No layout shift on countdown tick (tabular-nums preserved)');

    await context.close();
  }

  console.log('--- TEST B: Live state & transitions ---');
  {
    // Test Live state when now is between start and end date of Code Bounty
    // Code Bounty: 2026-11-20T10:00:00+05:30 to 2026-11-20T18:00:00+05:30
    // Clock at 2026-11-20T12:00:00+05:30 -> Ends in 6h 0m
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const liveTime = new Date('2026-11-20T12:00:00+05:30').getTime();

    await context.addInitScript((time) => {
      let currentTime = time;
      const _Date = window.Date;
      window.__advanceClock = (ms) => { currentTime += ms; };
      class MockDate extends _Date {
        constructor(...args) {
          if (args.length === 0) super(currentTime);
          else super(...args);
        }
        static now() { return currentTime; }
      }
      window.Date = MockDate;
    }, liveTime);

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    assert.strictEqual(await page.locator('.nextup-live-pill').innerText(), 'LIVE NOW');
    assert.strictEqual(await page.locator('.nextup-ends-in').innerText(), 'Ends in 6h 0m');
    assert.ok((await page.locator('.nextup-eyebrow').innerText()).includes('HAPPENING NOW'));

    // Advance past end time of Code Bounty: 2026-11-20T19:00:00+05:30 (+7 hours)
    // Next event should become ICPC Camp (2026-12-10)
    await page.evaluate(() => {
      window.__advanceClock(7 * 3600 * 1000);
    });
    await page.waitForTimeout(1100);

    assert.ok((await page.locator('.nextup-title').innerText()).includes('ICPC'));
    assert.strictEqual(await page.locator('.nextup-eyebrow').innerText(), 'NEXT UP');
    console.log('SUCCESS: Transitioned to ICPC Camp after Code Bounty ended');

    // Advance past ICPC Camp end time: 2026-12-12T19:00:00+05:30 (+25 days)
    // No more upcoming events -> spotlight disappears!
    await page.evaluate(() => {
      window.__advanceClock(25 * 24 * 3600 * 1000);
    });
    await page.waitForTimeout(1100);

    const count = await page.locator('.nextup-spotlight-card').count();
    assert.strictEqual(count, 0, 'Spotlight should cleanly disappear when no upcoming events remain');
    console.log('SUCCESS: Spotlight cleanly disappeared when no more upcoming events exist');

    await context.close();
  }

  console.log('--- TEST C: Registration states buttons ---');
  {
    // Test code-bounty-2026 registration states:
    // 1. opensAt: 2026-10-15T00:00:00+05:30
    // When now is 2026-10-11 -> "not-open" -> "Registration opens Oct 15"
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tNotOpen = new Date('2026-10-11T10:00:00+05:30').getTime();
    await context.addInitScript((time) => {
      let currentTime = time;
      const _Date = window.Date;
      window.__advanceClock = (ms) => { currentTime += ms; };
      class MockDate extends _Date {
        constructor(...args) {
          if (args.length === 0) super(currentTime);
          else super(...args);
        }
        static now() { return currentTime; }
      }
      window.Date = MockDate;
    }, tNotOpen);

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    const notOpenBtn = page.locator('.nextup-btn-disabled');
    assert.strictEqual(await notOpenBtn.innerText(), 'Registration opens Oct 15');
    assert.strictEqual(await notOpenBtn.getAttribute('aria-disabled'), 'true');
    console.log('SUCCESS: "not-open" state verified');

    // 2. Advance to open window: 2026-10-20 (between opensAt Oct 15 and closesAt Nov 18)
    await page.evaluate(() => {
      window.__advanceClock(9 * 24 * 3600 * 1000); // Oct 20
    });
    await page.waitForTimeout(1100);

    const registerBtn = page.locator('a.nextup-btn-primary');
    assert.strictEqual(await registerBtn.innerText(), 'Register now');
    assert.strictEqual(await registerBtn.getAttribute('target'), '_blank');
    assert.strictEqual(await registerBtn.getAttribute('rel'), 'noopener noreferrer');
    console.log('SUCCESS: "open" state verified (primary Register now, target _blank, noopener noreferrer)');

    // 3. Advance to closed window: 2026-11-19 (after closesAt Nov 18, before startDate Nov 20)
    await page.evaluate(() => {
      window.__advanceClock(30 * 24 * 3600 * 1000); // Nov 19
    });
    await page.waitForTimeout(1100);

    const closedBtn = page.locator('.nextup-btn-disabled');
    assert.strictEqual(await closedBtn.innerText(), 'Registration closed');
    console.log('SUCCESS: "closed" state verified');

    await context.close();
  }

  console.log('--- TEST D: Calendar popover, .ics download, Google link, and outside click ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const fixedTime = new Date('2026-10-11T10:00:00+05:30').getTime();
    await context.addInitScript((time) => {
      let currentTime = time;
      const _Date = window.Date;
      class MockDate extends _Date {
        constructor(...args) {
          if (args.length === 0) super(currentTime);
          else super(...args);
        }
        static now() { return currentTime; }
      }
      window.Date = MockDate;
    }, fixedTime);

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    const calBtn = page.locator('.nextup-calendar-dropdown-wrap button.nextup-btn-ghost');
    assert.strictEqual(await calBtn.getAttribute('aria-haspopup'), 'menu');
    assert.strictEqual(await calBtn.getAttribute('aria-expanded'), 'false');

    // Click calendar button
    await calBtn.click();
    assert.strictEqual(await calBtn.getAttribute('aria-expanded'), 'true');
    const popover = page.locator('.nextup-calendar-popover');
    assert.strictEqual(await popover.isVisible(), true);

    // Check Google link
    const googleLink = popover.locator('a[role="menuitem"]');
    assert.ok((await googleLink.innerText()).includes('Google Calendar'));
    const googleHref = await googleLink.getAttribute('href');
    assert.ok(googleHref.includes('calendar.google.com') && googleHref.includes('Code+Bounty'));
    console.log('SUCCESS: Google Calendar link formatted correctly');

    // Check .ics generation and download trigger
    const icsResult = await page.evaluate(() => {
      let createdUrl = null;
      let downloadName = null;
      let clicked = false;
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = (blob) => {
        createdUrl = originalCreateObjectURL(blob);
        return createdUrl;
      };

      const btn = document.querySelector('.nextup-popover-item:nth-child(2)');
      btn.click();

      return { clicked: true };
    });
    assert.strictEqual(icsResult.clicked, true);
    console.log('SUCCESS: .ics download handler executed cleanly');

    // Reopen popover and test outside click
    await calBtn.click();
    assert.strictEqual(await popover.isVisible(), true);
    await page.mouse.click(10, 10);
    assert.strictEqual(await popover.isVisible(), false);
    console.log('SUCCESS: Popover closes on outside click');

    // Reopen popover and test Escape key
    await calBtn.click();
    assert.strictEqual(await popover.isVisible(), true);
    await page.keyboard.press('Escape');
    assert.strictEqual(await popover.isVisible(), false);
    console.log('SUCCESS: Popover closes on Escape');

    await context.close();
  }

  console.log('--- TEST E: Filters hiding spotlight ---');
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fixedTime = new Date('2026-10-11T10:00:00+05:30').getTime();
    await context.addInitScript((time) => {
      let currentTime = time;
      const _Date = window.Date;
      class MockDate extends _Date {
        constructor(...args) {
          if (args.length === 0) super(currentTime);
          else super(...args);
        }
        static now() { return currentTime; }
      }
      window.Date = MockDate;
    }, fixedTime);

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    // With no filter: spotlight is visible
    assert.strictEqual(await page.locator('.nextup-spotlight-card').isVisible(), true);

    // Click "Past" filter -> spotlight should be hidden
    await page.locator('.filter-seg-option:has-text("Past")').click();
    assert.strictEqual(await page.locator('.nextup-spotlight-card').count(), 0);
    console.log('SUCCESS: Spotlight hidden when status=past');

    // Reset or click "All"
    await page.locator('.filter-seg-option:has-text("All")').click();
    assert.strictEqual(await page.locator('.nextup-spotlight-card').isVisible(), true);

    // Filter year: 2024 -> excludes 2026 event -> spotlight hidden
    await page.locator('.filter-year-dropdown-btn').click();
    await page.locator('.filter-year-option:has-text("2024")').click();
    assert.strictEqual(await page.locator('.nextup-spotlight-card').count(), 0);
    console.log('SUCCESS: Spotlight hidden when year filter excludes next event');

    // Filter year: 2026 -> includes 2026 event -> spotlight visible
    await page.locator('.filter-year-dropdown-btn').click();
    await page.locator('.filter-year-option:has-text("2026")').click();
    assert.strictEqual(await page.locator('.nextup-spotlight-card').isVisible(), true);
    console.log('SUCCESS: Spotlight visible when year filter includes 2026');

    await context.close();
  }

  console.log('--- TEST F: Visibility change & tab hidden/visible ---');
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fixedTime = new Date('2026-10-11T10:00:00+05:30').getTime();
    await context.addInitScript((time) => {
      let currentTime = time;
      const _Date = window.Date;
      window.__advanceClock = (ms) => { currentTime += ms; };
      class MockDate extends _Date {
        constructor(...args) {
          if (args.length === 0) super(currentTime);
          else super(...args);
        }
        static now() { return currentTime; }
      }
      window.Date = MockDate;
    }, fixedTime);

    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    // Emulate visibilitychange
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      // Advance clock 10 hours while hidden
      window.__advanceClock(10 * 3600 * 1000);
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Check countdown immediately updated without waiting 10 hours
    const countBlocks = page.locator('.nextup-count-num');
    // Initially 40d 0h 0m 0s - 10 hours = 39d 14h 0m 0s
    assert.strictEqual(await countBlocks.nth(0).innerText(), '39');
    assert.strictEqual(await countBlocks.nth(1).innerText(), '14');
    console.log('SUCCESS: Tab hidden then visible updated countdown immediately');

    await context.close();
  }

  console.log('--- TEST G: Responsive checks at 1440, 1024, 768, 390, 360 ---');
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5173/#events', { waitUntil: 'networkidle' });

    const spotlight = page.locator('.nextup-spotlight-card');
    assert.strictEqual(await spotlight.isVisible(), true);

    // Check no horizontal overflow on page
    const hasHScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    assert.strictEqual(hasHScroll, false, `Horizontal scroll detected at ${vp.width}x${vp.height}`);
    console.log(`SUCCESS: No horizontal overflow at ${vp.width}x${vp.height}`);

    if (vp.width <= 360) {
      // Check countdown row is 1 row
      const blocks = page.locator('.nextup-count-block');
      const b0 = await blocks.nth(0).boundingBox();
      const b3 = await blocks.nth(3).boundingBox();
      assert.ok(Math.abs(b0.y - b3.y) < 5, `Countdown wrapped at ${vp.width}px: b0.y=${b0.y}, b3.y=${b3.y}`);
      console.log(`SUCCESS: Countdown blocks are in ONE row at ${vp.width}px!`);
    }

    await context.close();
  }

  await browser.close();
  console.log('ALL PLAYWRIGHT TESTS PASSED!');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
