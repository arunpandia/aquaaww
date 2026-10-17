// Rasterise the SVGs to PNG using Electron itself:  npx electron gen-icons.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path');
const jobs = [
  ['drop-black.svg', 'assets/trayTemplate.png', 12, 16], ['drop-black.svg', 'assets/trayTemplate@2x.png', 24, 32],
  ['drop-white.svg', 'assets/tray-white.png', 24, 32],
  ['app-icon.svg', 'build/icon.png', 512, 512, 'icon']
];
app.on('window-all-closed', () => {});
app.whenReady().then(async () => { try {
  for (const [svg, out, w, h, square] of jobs) {
    const src = fs.readFileSync(path.join('assets', svg), 'utf8');
    const win = new BrowserWindow({ width: w, height: h, show: false, transparent: true, frame: false, });
    const html = `<body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;width:${w}px;height:${h}px;overflow:hidden;">
      <div style="height:100%;aspect-ratio:${square ? '1/1' : '400/560'}">${src.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`;
    const tmp = path.join(require('os').tmpdir(), 'gen-' + path.basename(out) + '.html'); fs.writeFileSync(tmp, html); await win.loadFile(tmp);
    await new Promise(r => setTimeout(r, 300));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(out, img.toPNG()); win.destroy();
  }
  } catch (e) { console.error("GEN ERR", e); } app.quit();
});
