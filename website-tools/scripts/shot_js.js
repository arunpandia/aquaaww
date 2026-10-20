const { app, BrowserWindow } = require('electron');
const fs = require('fs');
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.whenReady().then(async () => {
  const [url, out, w, h, js] = process.argv.slice(-5);
  const win = new BrowserWindow({ width: +w, height: +h, show: false, useContentSize: true });
  await win.loadURL(url); await new Promise(r => setTimeout(r, 2500));
  if (js) { const r = await win.webContents.executeJavaScript(js); console.log(JSON.stringify(r)); }
  await new Promise(r => setTimeout(r, 2500));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG()); app.quit();
});
