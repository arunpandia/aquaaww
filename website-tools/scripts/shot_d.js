const { app, BrowserWindow } = require('electron');
const fs = require('fs');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const [url, out, w, h] = process.argv.slice(-4);
  const win = new BrowserWindow({ width: +w, height: +h, show: false, useContentSize: true, webPreferences: { offscreen: false } });
  await win.loadURL(url); await new Promise(r => setTimeout(r, 3500));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG()); app.quit();
});
