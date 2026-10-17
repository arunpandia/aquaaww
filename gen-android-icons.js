// Renders the Android launcher + notification icons into mobile/android/.../res  (npx electron gen-android-icons.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs'), path = require('path'), os = require('os');
const RES = 'mobile/android/app/src/main/res';
const D = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const jobs = [];
for (const [d, k] of Object.entries(D)) {
  jobs.push(['adaptive-fg-blue.svg', `${RES}/mipmap-${d}/ic_launcher_foreground.png`, Math.round(108 * k)]);
  jobs.push(['android-icon.svg', `${RES}/mipmap-${d}/ic_launcher.png`, Math.round(48 * k), true]);
  jobs.push(['android-icon.svg', `${RES}/mipmap-${d}/ic_launcher_round.png`, Math.round(48 * k), true]);
}
jobs.push(['status-icon.svg', `${RES}/drawable/ic_stat_drop.png`, 96]);
jobs.push(['splash-drop.svg', `${RES}/drawable/splash_drop.png`, 576]);
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  for (const [svg, out, px, crop] of jobs) {
    const src = fs.readFileSync(path.join('assets', svg), 'utf8').replace('<svg ', '<svg width="100%" height="100%" ');
    const win = new BrowserWindow({ width: 512, height: 512, show: false, transparent: true, frame: false });
    const f = path.join(os.tmpdir(), 'ga-' + path.basename(out) + '.html');
    fs.writeFileSync(f, `<body style="margin:0;background:transparent;width:512px;height:512px;overflow:hidden">${crop ? '<div style="width:512px;height:512px;transform:scale(1.25)">' : '<div style="width:512px;height:512px">'}${src}</div></body>`);
    await win.loadFile(f); await new Promise(r => setTimeout(r, 250));
    const img = (await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 })).resize({ width: px, height: px, quality: 'best' });
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, img.toPNG()); win.destroy();
  }
  app.quit();
});
