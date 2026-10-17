// Remove thin outline boxes, haze and specks around a sticker: keep only the big solid shapes.
// usage: SRC=in.png OUT=out.png R=4 npx electron gen-cleanup.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path'), os = require('os');
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { webSecurity: false } });
  const f = path.join(os.tmpdir(), 'gcl.html'); fs.writeFileSync(f, '<canvas id=c></canvas>'); await win.loadFile(f);
  const R = +process.env.R || 4;
  const url = await win.webContents.executeJavaScript(`new Promise(res => { const im = new Image(); im.onload = () => {
    const W = im.width, H = im.height, c = document.getElementById('c'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const id = x.getImageData(0, 0, W, H), d = id.data, R = ${R};
    let m = new Uint8Array(W*H); for (let i = 0; i < W*H; i++) m[i] = d[i*4+3] > 70 ? 1 : 0;      // solid pixels only (drops haze)
    const pass = (src, horiz, minmode) => { const o = new Uint8Array(W*H);
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { let v = minmode ? 1 : 0;
        for (let k = -R; k <= R; k++) { const px = horiz ? xx + k : xx, py = horiz ? y : y + k; const s = (px < 0 || py < 0 || px >= W || py >= H) ? 0 : src[py*W+px];
          if (minmode) { if (!s) { v = 0; break; } } else if (s) { v = 1; break; } }
        o[y*W+xx] = v; } return o; };
    const er = pass(pass(m, true, true), false, true);                                              // erode: thin lines vanish
    const lab = new Int32Array(W*H), sizes = [0]; let L = 0;
    for (let i = 0; i < W*H; i++) if (er[i] && !lab[i]) { L++; let n = 0; const st = [i]; lab[i] = L;
      while (st.length) { const k = st.pop(); n++; const x0 = k % W, y0 = (k / W) | 0;
        for (const nb of [x0>0?k-1:-1, x0<W-1?k+1:-1, y0>0?k-W:-1, y0<H-1?k+W:-1]) if (nb >= 0 && er[nb] && !lab[nb]) { lab[nb] = L; st.push(nb); } }
      sizes[L] = n; }
    const keep = new Uint8Array(W*H); for (let i = 0; i < W*H; i++) if (lab[i] && sizes[lab[i]] > 600) keep[i] = 1;   // big shapes only
    const grown = pass(pass(keep, true, false), false, false);                                      // dilate back
    for (let i = 0; i < W*H; i++) { if (!(grown[i] && m[i])) d[i*4+3] = 0; }
    x.putImageData(id, 0, 0); res(c.toDataURL('image/png')); }; im.src = ${JSON.stringify('file://' + path.resolve(process.env.SRC))}; })`);
  fs.writeFileSync(process.env.OUT, Buffer.from(url.split(',')[1], 'base64'));
  console.log('CLEANED');
  app.quit();
});
