import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function extractCleanSmoothStarEmblem() {
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
    
    let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
    const cx = c.width / 2;
    const cy = c.height / 2;
    
    // First pass: mark foreground mask
    // 0 = bg, 1 = star navy, 2 = gold text/accent
    const mask = new Uint8Array(c.width * c.height);
    
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const pIndex = y * c.width + x;
        
        const dist = Math.hypot(x - cx, y - cy);
        if (dist > c.width * 0.442) {
          continue; // outside
        }
        
        const isWhite = (r > 205 && g > 205 && b > 205);
        const isOrange = (r > 155 && g > 85 && b < 100 && (r - b) > 75);
        
        if (!isWhite && !isOrange) {
          const isGold = (r > 125 && g > 95 && b < 85);
          mask[pIndex] = isGold ? 2 : 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Now construct antialiased RGBA:
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        const pIndex = y * c.width + x;
        const m = mask[pIndex];
        
        if (m === 0) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else if (m === 2) {
          // Gold text/inner line: #FFD36B
          data[idx] = 255;
          data[idx + 1] = 211;
          data[idx + 2] = 107;
          data[idx + 3] = 255;
        } else {
          // Dark navy: #0B1020
          data[idx] = 11;
          data[idx + 1] = 16;
          data[idx + 2] = 32;
          data[idx + 3] = 255;
        }
      }
    }
    
    // 2x supersampled smooth canvas
    const cropW = Math.max(1, maxX - minX + 1);
    const cropH = Math.max(1, maxY - minY + 1);
    ctx.putImageData(idata, 0, 0);
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.imageSmoothingEnabled = true;
    cropCtx.imageSmoothingQuality = 'high';
    cropCtx.drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    
    return cropCanvas.toDataURL('image/png').split(',')[1];
  });
  
  fs.writeFileSync('src/assets/logo-mark.png', Buffer.from(pngBase64, 'base64'));
  console.log('Saved refined src/assets/logo-mark.png');
  await browser.close();
}

extractCleanSmoothStarEmblem();
