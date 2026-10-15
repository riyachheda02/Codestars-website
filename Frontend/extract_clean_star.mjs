import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function extractCleanStarEmblem() {
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
    
    // We want the clean star emblem:
    // Navy star body: #0B1020 or original dark navy (#002244)
    // Inner text / star highlights: #FFD36B
    // Let's identify the star pixels and remove background and artifacts
    let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
    
    const cx = c.width / 2;
    const cy = c.height / 2;
    
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const dist = Math.hypot(x - cx, y - cy);
        // Exclude the circle perimeter completely
        if (dist > c.width * 0.445) {
          data[idx + 3] = 0;
          continue;
        }
        
        const isWhite = (r > 210 && g > 210 && b > 210);
        const isOrange = (r > 155 && g > 90 && b < 95 && (r - b) > 80);
        
        if (isWhite || isOrange) {
          data[idx + 3] = 0;
        } else {
          // It's the star or the lettering!
          // Make dark navy pixels crisp #0B1020
          // If it's the gold text or inner star border (bright):
          const isGold = (r > 130 && g > 100 && b < 80);
          if (isGold) {
            data[idx] = 255;
            data[idx + 1] = 211;
            data[idx + 2] = 107; // #FFD36B
            data[idx + 3] = 255;
          } else {
            // Dark navy: #0B1020
            data[idx] = 11;
            data[idx + 1] = 16;
            data[idx + 2] = 32;
            data[idx + 3] = 255;
          }
          
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Smooth edges with simple 1px alpha softening or clean crop
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
  
  fs.writeFileSync('src/assets/logo-mark.png', Buffer.from(pngBase64, 'base64'));
  console.log('Saved clean src/assets/logo-mark.png');
  await browser.close();
}

extractCleanStarEmblem();
