const { app, BrowserWindow } = require('electron');
const fs = require('fs');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const [url, prefix] = process.argv.slice(-2);
  const win = new BrowserWindow({ width: 1280, height: 832, show: false, useContentSize: true });
  await win.loadURL(url); await new Promise(r => setTimeout(r, 2500));
  const snap = async n => { const img = await win.webContents.capturePage(); fs.writeFileSync(prefix + n + '.png', img.toPNG()); };
  await win.webContents.executeJavaScript(`dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));1`);
  await new Promise(r => setTimeout(r, 380)); await snap('_mid');
  await new Promise(r => setTimeout(r, 1600)); await snap('_end');
  console.log(await win.webContents.executeJavaScript(`JSON.stringify({pg:document.body.dataset.pg,hint:document.getElementById('hint').dataset.p,lw:getComputedStyle(document.getElementById('lw')).visibility})`));
  await win.webContents.executeJavaScript(`dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft'}));1`);
  await new Promise(r => setTimeout(r, 2300)); await snap('_back');
  console.log(await win.webContents.executeJavaScript(`JSON.stringify({pg:document.body.dataset.pg,lw:getComputedStyle(document.getElementById('lw')).visibility})`));
  app.quit();
});
