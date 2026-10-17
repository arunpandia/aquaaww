// Cut "DRINK WATER" lettering out of its cream background -> assets/title.png  (npx electron gen-title.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path'), os = require('os');
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { webSecurity: false } });
  const f = path.join(os.tmpdir(), 'gt.html'); fs.writeFileSync(f, '<canvas id=c></canvas>'); await win.loadFile(f);
  const src = 'file://' + path.resolve('assets/title-src.webp');
  const url = await win.webContents.executeJavaScript(`new Promise(res => {
    const im = new Image(); im.onload = () => {
      const CX = 130, CY = 262, CW = 790, CH = 500;                       // crop to the lettering block
      const c = document.getElementById('c'); c.width = CW; c.height = CH;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, CX, CY, CW, CH, 0, 0, CW, CH);
      const id = x.getImageData(0, 0, CW, CH), d = id.data, W = CW, H = CH;
      const px = i => [d[i*4], d[i*4+1], d[i*4+2]];
      const bg = [248, 241, 222];
      const near = i => { const p = px(i); return Math.hypot(p[0]-bg[0], p[1]-bg[1], p[2]-bg[2]) < 38; };
      // wipe the pink flag doodle that pokes into the top-left corner of the crop
      for (let y = 0; y < 60; y++) for (let x2 = 0; x2 < 95; x2++) { const p = px(y*W + x2); if (p[0] > 200 && p[2] > 140 && p[1] < 190) { d[(y*W+x2)*4] = bg[0]; d[(y*W+x2)*4+1] = bg[1]; d[(y*W+x2)*4+2] = bg[2]; } }
      const seen = new Uint8Array(W*H), st = [];
      for (let i = 0; i < W; i++) st.push(i, (H-1)*W + i); for (let j = 0; j < H; j++) st.push(j*W, j*W + W-1);
      while (st.length) { const i = st.pop(); if (seen[i] || !near(i)) continue; seen[i] = 1;
        const x0 = i % W, y0 = (i / W) | 0;
        if (x0 > 0) st.push(i-1); if (x0 < W-1) st.push(i+1); if (y0 > 0) st.push(i-W); if (y0 < H-1) st.push(i+W); }
      for (let i = 0; i < W*H; i++) if (!seen[i] && near(i)) seen[i] = 1;   // enclosed cream pockets too
      const a = new Float32Array(W*H).fill(1); for (let i = 0; i < W*H; i++) if (seen[i]) a[i] = 0;
      // keep only the largest connected opaque component (drops stray icon bits)
      const lab = new Int32Array(W*H), sizes = [0]; let L = 0;
      for (let i = 0; i < W*H; i++) if (a[i] && !lab[i]) { L++; let n = 0; const s2 = [i]; lab[i] = L;
        while (s2.length) { const k = s2.pop(); n++; const x0 = k % W, y0 = (k / W) | 0;
          for (const nb of [x0>0?k-1:-1, x0<W-1?k+1:-1, y0>0?k-W:-1, y0<H-1?k+W:-1]) if (nb >= 0 && a[nb] && !lab[nb]) { lab[nb] = L; s2.push(nb); } }
        sizes[L] = n; }
      let best = 1; for (let l = 1; l <= L; l++) if (sizes[l] > sizes[best]) best = l;
      for (let i = 0; i < W*H; i++) if (lab[i] !== best) a[i] = 0;
      const out = new Float32Array(a);
      for (let y = 1; y < H-1; y++) for (let x2 = 1; x2 < W-1; x2++) { const i = y*W + x2;
        if (a[i]) { let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m += a[i + dy*W + dx]; out[i] = Math.min(1, Math.max(0, (m/9 - .3) / .6)); } }
      for (let i = 0; i < W*H; i++) d[i*4+3] = out[i] * 255;
      x.putImageData(id, 0, 0);
      let x1 = W, y1 = H, xb = 0, yb = 0;
      for (let y = 0; y < H; y++) for (let x3 = 0; x3 < W; x3++) if (d[(y*W+x3)*4+3] > 20) { if (x3<x1) x1=x3; if (x3>xb) xb=x3; if (y<y1) y1=y; if (y>yb) yb=y; }
      const TW = ${+process.env.TW || 420}, sc = TW / (xb-x1+1), o = document.createElement('canvas'); o.width = TW; o.height = Math.round((yb-y1+1) * sc);
      const ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(c, x1, y1, xb-x1+1, yb-y1+1, 0, 0, o.width, o.height);
      res(o.toDataURL('image/png'));
    }; im.src = ${JSON.stringify(src)}; })`);
  fs.writeFileSync(process.env.OUT || 'assets/title.png', Buffer.from(url.split(',')[1], 'base64'));
  app.quit();
});
