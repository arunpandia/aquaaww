// Remove a plain background from an image (flood fill from the edges) -> PNG with real transparency
// usage: SRC=in.png OUT=out.png TOL=40 npx electron gen-cutout.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path'), os = require('os');
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { webSecurity: false } });
  const f = path.join(os.tmpdir(), 'gc.html'); fs.writeFileSync(f, '<canvas id=c></canvas>'); await win.loadFile(f);
  const src = 'file://' + path.resolve(process.env.SRC), TOL = +process.env.TOL || 40;
  const url = await win.webContents.executeJavaScript(`new Promise(res => {
    const im = new Image(); im.onload = () => {
      const W = im.width, H = im.height, c = document.getElementById('c'); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const id = x.getImageData(0, 0, W, H), d = id.data;
      const px = i => [d[i*4], d[i*4+1], d[i*4+2], d[i*4+3]];
      const cs = [px(0), px(W-1), px((H-1)*W), px(H*W-1), px((H>>1)*W), px((H>>1)*W+W-1), px(W>>1), px((H-1)*W+(W>>1))];
      const bg = [0,1,2].map(k => cs.reduce((s, p) => s + p[k], 0) / cs.length);
      const near = i => { const p = px(i); return p[3] < 12 || Math.hypot(p[0]-bg[0], p[1]-bg[1], p[2]-bg[2]) < ${TOL}; };
      const seen = new Uint8Array(W*H), st = [];
      for (let i = 0; i < W; i++) st.push(i, (H-1)*W + i); for (let j = 0; j < H; j++) st.push(j*W, j*W + W-1);
      while (st.length) { const i = st.pop(); if (seen[i] || !near(i)) continue; seen[i] = 1;
        const x0 = i % W, y0 = (i / W) | 0;
        if (x0 > 0) st.push(i-1); if (x0 < W-1) st.push(i+1); if (y0 > 0) st.push(i-W); if (y0 < H-1) st.push(i+W); }
      const a = new Float32Array(W*H).fill(1); for (let i = 0; i < W*H; i++) if (seen[i]) a[i] = 0;
      const out = new Float32Array(a);
      for (let y = 1; y < H-1; y++) for (let x2 = 1; x2 < W-1; x2++) { const i = y*W + x2;
        if (a[i]) { let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m += a[i + dy*W + dx]; out[i] = Math.min(1, Math.max(0, (m/9 - .3) / .6)); } }
      for (let i = 0; i < W*H; i++) d[i*4+3] = Math.min(d[i*4+3], out[i] * 255);
      x.putImageData(id, 0, 0);
      res(c.toDataURL('image/png') + '|' + bg.map(Math.round).join(','));
    }; im.src = ${JSON.stringify(src)}; })`);
  const [data, bgs] = url.split('|');
  fs.writeFileSync(process.env.OUT, Buffer.from(data.split(',')[1], 'base64'));
  console.log('CUTOUT bg=' + bgs);
  app.quit();
});
