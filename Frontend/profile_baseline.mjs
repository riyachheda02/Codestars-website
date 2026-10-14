import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';

async function profile(throttled = false) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const client = await page.target().createCDPSession();
    if (throttled) {
      console.log('Enabling 4x CPU throttling...');
      await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }

    // Set fast interval for profiling 5 transitions
    await page.evaluateOnNewDocument(() => {
      window.__COVERFLOW_CONFIG__ = { interval: 1400, pause: 10000 };
    });

    await page.goto(APP_URL, { waitUntil: 'networkidle2' });

    // Scroll to events
    await page.evaluate(() => {
      document.getElementById('featured-events').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    // Install frame recorder and PerformanceObserver for longtask
    const result = await page.evaluate(async () => {
      const frameDeltas = [];
      const longTasks = [];
      let lastTime = performance.now();
      let recording = true;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
            name: entry.name,
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });

      function onFrame(now) {
        if (!recording) return;
        const delta = now - lastTime;
        lastTime = now;
        frameDeltas.push(delta);
        requestAnimationFrame(onFrame);
      }
      requestAnimationFrame(onFrame);

      // Record across 5 transitions (approx 5 * 1400ms = 7000ms)
      await new Promise(r => setTimeout(r, 7500));
      recording = false;
      observer.disconnect();

      frameDeltas.shift(); // Drop initial warmup frame

      frameDeltas.sort((a, b) => a - b);
      const p95Idx = Math.floor(frameDeltas.length * 0.95);
      const p95 = frameDeltas[p95Idx] || 0;
      const max = frameDeltas[frameDeltas.length - 1] || 0;
      const avg = frameDeltas.reduce((s, v) => s + v, 0) / (frameDeltas.length || 1);

      return {
        totalFrames: frameDeltas.length,
        p95: p95.toFixed(2),
        max: max.toFixed(2),
        avg: avg.toFixed(2),
        longTaskCount: longTasks.length,
        longTasks,
      };
    });

    console.log(`Results (${throttled ? '4x Throttled' : 'Unthrottled'}):`, JSON.stringify(result, null, 2));
    return result;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== PROFILING CURRENT CAROUSEL ===');
  console.log('\n--- 1. Unthrottled ---');
  const unthrottled = await profile(false);
  console.log('\n--- 2. 4x CPU Throttled ---');
  const throttled = await profile(true);
}

main().catch(console.error);
