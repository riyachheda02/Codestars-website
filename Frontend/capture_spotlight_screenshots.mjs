import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:\\Users\\ARNAV KOTHAVADE\\.gemini\\antigravity-ide\\brain\\2847c3d4-a5eb-4745-b2d0-a4187e0f4822';

async function captureScreenshots() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  // 1. Desktop 1440x900 - State: "not-open" (clock: 2026-10-11)
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
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(outDir, 'spotlight_not_open_1440.png'),
      fullPage: false,
    });
    console.log('Saved spotlight_not_open_1440.png');

    // 2. Desktop 1440x900 - Calendar Popover Open
    const calBtn = page.locator('.nextup-calendar-dropdown-wrap button.nextup-btn-ghost');
    await calBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(outDir, 'spotlight_calendar_popover_1440.png'),
      fullPage: false,
    });
    console.log('Saved spotlight_calendar_popover_1440.png');

    await context.close();
  }

  // 3. Desktop 1440x900 - State: "open" (clock: 2026-10-20)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fixedTime = new Date('2026-10-20T10:00:00+05:30').getTime();
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
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(outDir, 'spotlight_open_1440.png'),
      fullPage: false,
    });
    console.log('Saved spotlight_open_1440.png');

    await context.close();
  }

  // 4. Desktop 1440x900 - State: "live" (clock: 2026-11-20T12:00:00+05:30)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fixedTime = new Date('2026-11-20T12:00:00+05:30').getTime();
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
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(outDir, 'spotlight_live_1440.png'),
      fullPage: false,
    });
    console.log('Saved spotlight_live_1440.png');

    await context.close();
  }

  // 5. Mobile Layout 390x844 (clock: 2026-10-11)
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
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
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(outDir, 'spotlight_mobile_390.png'),
      fullPage: false,
    });
    console.log('Saved spotlight_mobile_390.png');

    await context.close();
  }

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureScreenshots().catch(console.error);
