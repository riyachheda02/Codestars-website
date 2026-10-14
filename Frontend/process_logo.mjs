import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function processLogo() {
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
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r > 230 && g > 230 && b > 230) {
          data[idx + 3] = 0;
        } else {
          const brightness = (r + g + b) / 3;
          if (brightness > 215) {
            const alpha = Math.max(0, 255 - (brightness - 215) * (255 / (230 - 215)));
            data[idx + 3] = Math.round(alpha);
          }
          if (data[idx + 3] > 10) {
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
  
  fs.writeFileSync('src/assets/logo-mark.png', Buffer.from(pngBase64, 'base64'));
  console.log('Saved src/assets/logo-mark.png successfully!');
  await browser.close();
}

processLogo();
