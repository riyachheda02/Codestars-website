import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function extractStarEmblem() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const imgPath = path.resolve('src/assets/djs_codestarsLogo.jpeg').replace(/\\/g, '/');
  const fileUrl = 'file:///' + imgPath;
  
  await page.goto(fileUrl);
  
  const pngBase64 = await page.evaluate(async () => {
    const img = document.querySelector('img');
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const idata = ctx.getImageData(0, 0, c.width, c.height);
    const data = idata.data;
    
    // We want the STAR EMBLEM on transparent background:
    // Notice:
    // Navy blue star pixels have: r is low (< 60), b is moderate/high (~80-150), g is low-mid (~30-80).
    // The orange background has: r is high (~240), g is mid-high (~150-180), b is low (< 30).
    // The gold letters "DJS" have: r is high, g is high, b is low.
    //
    // Let's inspect pixel colors:
    // If a pixel is the yellow/orange background, turn it transparent!
    // Yellow/orange background: r > 180 && g > 110 && b < 70
    // White outside: r > 220 && g > 220 && b > 220
    
    let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
    
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Is it the background (either the outside white/grey, or the orange circle)?
        const isWhite = (r > 220 && g > 220 && b > 220);
        // Orange circle: r > 170 && g > 100 && b < 80
        // Also subtle grey border ring
        const isOrange = (r > 165 && g > 95 && b < 85 && (r - b) > 100);
        
        if (isWhite || isOrange) {
          data[idx + 3] = 0; // Transparent
        } else {
          // It's the star (navy) or the letters / outer dark line
          // If it's the thin dark outline of the circle at the very perimeter, we can filter by distance from center if needed, or see if it's part of the star.
          // Let's check distance from center
          const cx = c.width / 2;
          const cy = c.height / 2;
          const dist = Math.hypot(x - cx, y - cy);
          if (dist > c.width * 0.46) {
            data[idx + 3] = 0; // outside border circle
          } else {
            // Keep!
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
    }
    
    const cropW = Math.max(1, maxX - minX + 1);
    const cropH = Math.max(1, maxY - minY + 1);
    ctx.putImageData(idata, 0, 0);
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    
    return cropCanvas.toDataURL('image/png').split(',')[1];
  });
  
  fs.writeFileSync('src/assets/logo-star-isolated.png', Buffer.from(pngBase64, 'base64'));
  console.log('Saved src/assets/logo-star-isolated.png');
  await browser.close();
}

extractStarEmblem();
