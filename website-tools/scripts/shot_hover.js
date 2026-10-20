const { app, BrowserWindow } = require('electron');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const [url, w, h, sel] = process.argv.slice(-4);
  const win = new BrowserWindow({ width: +w, height: +h, show: false, useContentSize: true });
  await win.loadURL(url); await new Promise(r => setTimeout(r, 2500));
  const c = await win.webContents.executeJavaScript(`(function(){var e=document.querySelector(${JSON.stringify(sel)}).firstElementChild;var r=e.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  const before = await win.webContents.executeJavaScript(`getComputedStyle(document.querySelector(${JSON.stringify(sel)}).firstElementChild).transform`);
  win.webContents.sendInputEvent({ type: 'mouseMove', x: c.x, y: c.y });
  await new Promise(r => setTimeout(r, 600));
  const after = await win.webContents.executeJavaScript(`getComputedStyle(document.querySelector(${JSON.stringify(sel)}).firstElementChild).transform`);
  console.log(JSON.stringify({ c, before, after })); app.quit();
});
