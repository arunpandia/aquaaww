// Cut the paper+tape out of its cream background -> assets/paper.png  (npx electron gen-paper.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path');
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { webSecurity: false } });
  const html = `<canvas id=c></canvas>`;
  fs.writeFileSync(path.join(require('os').tmpdir(), 'gp.html'), html);
  await win.loadFile(path.join(require('os').tmpdir(), 'gp.html'));
  const src = 'file://' + path.resolve('assets/paper-src.webp');
  const dataUrl = await win.webContents.executeJavaScript(`new Promise(res => {
    const im = new Image(); im.onload = () => {
      const c = document.getElementById('c'); c.width = im.width; c.height = im.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const id = x.getImageData(0, 0, c.width, c.height), d = id.data, W = c.width, H = c.height;
      // background colour = average of the four corners
      const px = (i) => [d[i*4], d[i*4+1], d[i*4+2]];
      const cs = [px(0), px(W-1), px((H-1)*W), px(H*W-1)];
      const bg = [0,1,2].map(k => cs.reduce((s, p) => s + p[k], 0) / 4);
      const near = (i) => { const p = px(i); return Math.hypot(p[0]-bg[0], p[1]-bg[1], p[2]-bg[2]) < 34; };
      const seen = new Uint8Array(W*H), st = [];
      for (let i = 0; i < W; i++) { st.push(i, (H-1)*W + i); }
      for (let j = 0; j < H; j++) { st.push(j*W, j*W + W-1); }
      while (st.length) { const i = st.pop(); if (seen[i] || !near(i)) continue; seen[i] = 1;
        const x0 = i % W, y0 = (i / W) | 0;
        if (x0 > 0) st.push(i-1); if (x0 < W-1) st.push(i+1); if (y0 > 0) st.push(i-W); if (y0 < H-1) st.push(i+W); }
      // alpha: 0 where background; soften 2px edge by dilating the bg mask
      const a = new Float32Array(W*H).fill(1); for (let i = 0; i < W*H; i++) if (seen[i]) a[i] = 0;
      const out = new Float32Array(a);
      for (let y = 2; y < H-2; y++) for (let x2 = 2; x2 < W-2; x2++) { const i = y*W + x2;
        if (a[i]) { let m = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m += a[i + dy*W + dx];
          out[i] = Math.min(1, Math.max(0, (m / 25 - 0.35) / 0.5)); } }
      for (let i = 0; i < W*H; i++) d[i*4+3] = out[i] * 255;
      x.putImageData(id, 0, 0);
      // crop to bounding box of opaque pixels
      let x1 = W, y1 = H, x2b = 0, y2b = 0;
      for (let y = 0; y < H; y++) for (let x3 = 0; x3 < W; x3++) if (d[(y*W+x3)*4+3] > 20) { if (x3<x1) x1=x3; if (x3>x2b) x2b=x3; if (y<y1) y1=y; if (y>y2b) y2b=y; }
      const o = document.createElement('canvas'); o.width = x2b-x1+1; o.height = y2b-y1+1;
      o.getContext('2d').drawImage(c, x1, y1, o.width, o.height, 0, 0, o.width, o.height);
      res(o.toDataURL('image/png'));
    }; im.src = ${JSON.stringify('file://')} + ${JSON.stringify(path.resolve('assets/paper-src.webp'))}; })`);
  fs.writeFileSync('assets/paper.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  app.quit();
});
