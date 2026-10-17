const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, screen, nativeImage, shell, powerMonitor, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

app.commandLine.appendSwitch('log-level', '3');   // silence harmless Chromium decoder notices ("Unsupported pixel format: -1")
process.on('uncaughtException', e => console.error('uncaught:', e));   // a stray error must never take the tray down

const IS_MAC = process.platform === 'darwin', IS_WIN = process.platform === 'win32';
const APP_ICON = nativeImage.createFromPath(path.join(__dirname, 'assets', 'app-icon.png'));   // our logo in every dialog
const alertBox = (message, detail = '', buttons = ['OK'], type = 'info') =>
  dialog.showMessageBox({ type, icon: APP_ICON, message, detail, buttons, defaultId: 0 });

const DEFAULTS = {
  videoPath: '',
  keyed: true,            // true = remove white background, false = show video as is
  keyMode: '',            // 'white' | 'green' | 'raw' (overrides keyed when set)
  preset: '',             // name of a bundled preset (empty = uploaded video)
  intervalMin: 45,
  snoozeMin: 15,
  message: 'Time to drink some water',
  size: 200,              // character box (px)
  anchor: 'bottom-right', // bottom-right | bottom-left | top-right | top-left | custom
  keyLow: 30,             // white-key: below this "whiteness distance" => transparent
  keyHigh: 90,            // above this => fully opaque
  sound: false,
  activeFrom: '09:00',
  activeTo: '19:00',
  limitHours: false,
  paused: false,
  loginAsked: false,
  stats: {}               // { 'YYYY-MM-DD': count }  (local dates)
};

let settings = { ...DEFAULTS };
let tray, overlayWin, nextAt = 0;
const BUBBLE_H = 158, WIN_W = 200, MARGIN = 0;

const cfgFile = () => path.join(app.getPath('userData'), 'settings.json');
const today = () => new Date().toLocaleDateString('en-CA');   // local YYYY-MM-DD (UTC would roll the day over at the wrong hour)

function migrateFromWaterBuddy() {       // the app used to be called "Water Buddy": carry over settings and uploaded video
  try {
    const old = path.join(app.getPath('appData'), 'water-buddy');
    if (fs.existsSync(cfgFile()) || !fs.existsSync(path.join(old, 'settings.json'))) return;
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    const s = JSON.parse(fs.readFileSync(path.join(old, 'settings.json'), 'utf8'));
    if (s.videoPath && s.videoPath.startsWith(old) && fs.existsSync(s.videoPath)) {
      const dest = path.join(app.getPath('userData'), path.basename(s.videoPath));
      fs.copyFileSync(s.videoPath, dest); s.videoPath = dest;
    }
    fs.writeFileSync(cfgFile(), JSON.stringify(s, null, 2));
  } catch (e) { console.error('migration failed', e); }
}
function load() {
  migrateFromWaterBuddy();
  try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(cfgFile(), 'utf8')) }; } catch {}
  if (settings.preset) { settings.videoPath = path.join(PRESET_DIR, settings.preset + '.mp4'); const km = PRESET_MODES[settings.preset] || 'white'; settings.keyMode = km; settings.keyed = km === 'white'; }   // bundled presets move with the app
}
function save() {
  try {
    fs.mkdirSync(path.dirname(cfgFile()), { recursive: true });
    const tmp = cfgFile() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
    fs.renameSync(tmp, cfgFile());                             // atomic: a crash can't leave half a file
  } catch (e) { console.error('save failed', e); }
}
function set(patch, resched) { settings = { ...settings, ...patch }; save(); if (resched) schedule(settings.intervalMin); else updateTray(); }

/* ---------- scheduling ----------
   One wall-clock deadline (nextAt) checked by a heartbeat. A single long setTimeout drifts or stalls after the
   laptop sleeps, which made reminders "sometimes not show". */
function inActiveHours() {
  if (!settings.limitHours) return true;
  const now = new Date(), m = now.getHours() * 60 + now.getMinutes();
  const p = s => { const [h, mm] = s.split(':').map(Number); return h * 60 + mm; };
  const a = p(settings.activeFrom), b = p(settings.activeTo);
  return a <= b ? (m >= a && m <= b) : (m >= a || m <= b);
}
function schedule(minutes) {
  if (settings.paused) nextAt = 0;
  else nextAt = Date.now() + Math.max(0.05, minutes) * 60000;
  updateTray();
}
function fireIfDue() {
  if (!nextAt || settings.paused || Date.now() < nextAt) return;
  nextAt = Date.now() + settings.intervalMin * 60000;           // re-arm first: an ignored reminder never stalls the schedule
  if (inActiveHours() && settings.videoPath) showOverlay();
  updateTray();
}
let beats = 0;
function heartbeat() {
  fireIfDue();
  if (++beats % 12 === 0) updateTray();                          // refresh the "Next:" label about once a minute
}

/* ---------- overlay ---------- */
function targetDisplay() {
  const c = settings.custom;
  if (settings.anchor === 'custom' && c) { const d = screen.getAllDisplays().find(d => d.id === c.display); if (d) return d; }
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());   // whichever screen you are looking at
}
function overlaySize(aspect = 1) {
  const charW = Math.round(aspect >= 1 ? settings.size : settings.size * aspect);
  const charH = Math.round(aspect >= 1 ? settings.size / aspect : settings.size);
  return { w: Math.max(WIN_W, charW), h: BUBBLE_H + charH };
}
function overlayPos(w, h) {
  const d = targetDisplay(), wa = d.workArea, c = settings.custom;
  switch (settings.anchor) {
    case 'bottom-left': return { x: wa.x + MARGIN, y: wa.y + wa.height - h - MARGIN };
    case 'top-right': return { x: wa.x + wa.width - w - MARGIN, y: wa.y + MARGIN };
    case 'top-left': return { x: wa.x + MARGIN, y: wa.y + MARGIN };
    case 'custom': {   // stored as distance from the nearest screen corner, so it survives size changes
      if (!c) break;
      const a = d.bounds;
      return { x: c.h === 'right' ? a.x + a.width - w - c.dx : a.x + c.dx, y: c.v === 'bottom' ? a.y + a.height - h - c.dy : a.y + c.dy };
    }
  }
  return { x: wa.x + wa.width - w - MARGIN, y: wa.y + wa.height - h - MARGIN };
}
// Float above everything, including other apps' full-screen Spaces (macOS) and full-screen windows (Windows)
function floatOverEverything(win) {
  win.setAlwaysOnTop(true, 'screen-saver', 1);
  if (IS_MAC) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  win.setFullScreenable(false);
}
function createOverlay() {
  if (overlayWin && !overlayWin.isDestroyed()) return overlayWin;
  overlayWin = new BrowserWindow({
    width: WIN_W, height: BUBBLE_H + settings.size, show: false,
    transparent: true, frame: false, hasShadow: false, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: true, enableLargerThanScreen: true, roundedCorners: false,
    ...(IS_MAC ? { type: 'panel' } : {}),     // NSPanel: the only window kind macOS lets sit over full-screen apps without stealing focus
    webPreferences: { preload: path.join(__dirname, 'preload.js'), webSecurity: false, backgroundThrottling: false }
  });
  floatOverEverything(overlayWin);
  overlayWin.loadFile('renderer/overlay.html');
  overlayWin.webContents.on('render-process-gone', () => { try { overlayWin.destroy(); } catch {} overlayWin = null; });   // rebuilt on next show
  overlayWin.on('closed', () => { overlayWin = null; });
  return overlayWin;
}
function showOverlay(edit = false, preview = false) {
  if (settings.videoPath && !fs.existsSync(settings.videoPath)) {   // video went missing: fall back to a preset
    const p = listPresets()[0]; if (p) set({ videoPath: path.join(PRESET_DIR, p + '.mp4'), keyed: true, preset: p }, false);
  }
  const win = createOverlay();
  const payload = {
    video: settings.videoPath ? pathToFileURL(settings.videoPath).href : '',
    message: edit ? 'Drag me where you want me, then press Save position.' : settings.message,
    snoozeMin: settings.snoozeMin, size: settings.size, sound: settings.sound,
    keyLow: settings.keyLow, keyHigh: settings.keyHigh, key: settings.keyed !== false, keyMode: settings.keyMode || (settings.keyed !== false ? 'white' : 'raw'), edit, preview
  };
  const send = () => win.webContents.send('overlay:show', payload);
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send); else send();
}
ipcMain.on('overlay:ready', (_e, aspect) => {   // renderer has a real frame: size + place + reveal
  if (!overlayWin || overlayWin.isDestroyed()) return;
  const { w, h } = overlaySize(aspect);
  const { x, y } = overlayPos(w, h);
  overlayWin.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h });
  floatOverEverything(overlayWin);               // re-assert every time: Spaces/fullscreen changes can drop the level
  overlayWin.showInactive();
  overlayWin.moveTop();
});
function hideOverlay() {
  if (overlayWin && !overlayWin.isDestroyed()) { overlayWin.webContents.send('overlay:stop'); overlayWin.hide(); }
}
ipcMain.on('overlay:previewDone', hideOverlay);
ipcMain.on('overlay:drank', () => {
  hideOverlay();
  settings.stats[today()] = (settings.stats[today()] || 0) + 1;
  save(); schedule(settings.intervalMin);
});
ipcMain.on('overlay:snooze', () => { hideOverlay(); schedule(settings.snoozeMin); });
ipcMain.on('overlay:savePos', () => {
  if (overlayWin && !overlayWin.isDestroyed()) {
    const b = overlayWin.getBounds(), d = screen.getDisplayMatching(b), a = d.bounds;
    const h = b.x + b.width / 2 > a.x + a.width / 2 ? 'right' : 'left', v = b.y + b.height / 2 > a.y + a.height / 2 ? 'bottom' : 'top';
    let dx = h === 'right' ? a.x + a.width - (b.x + b.width) : b.x - a.x, dy = v === 'bottom' ? a.y + a.height - (b.y + b.height) : b.y - a.y;
    if (Math.abs(dx) < 14) dx = 0;
    if (Math.abs(dy) < 14) dy = 0;     // snap to the very edge
    settings.anchor = 'custom'; settings.custom = { display: d.id, h, v, dx, dy }; save();
  }
  hideOverlay(); updateTray();
});

/* ---------- check for updates (GitHub Releases) ---------- */
const PKG = require('./package.json');
const REPO = ((PKG.repository && (PKG.repository.url || PKG.repository)) || '').toString().replace(/^git\+/, '').replace(/\.git$/, '').replace(/^https?:\/\/github\.com\//, '');
const newer = (a, b) => {
  const p = v => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0), [x, y] = [p(a), p(b)];
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
};
async function checkForUpdates() {
  app.focus({ steal: true });
  if (!/^[\w.-]+\/[\w.-]+$/.test(REPO) || /^OWNER\//.test(REPO)) return alertBox('Updates are not set up', 'Set the "repository" field in package.json to your GitHub repo (owner/name) to enable update checks.');
  try {
    const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { 'User-Agent': 'twototango', Accept: 'application/vnd.github+json' } });
    if (res.status === 404) return alertBox('No releases yet', `Nothing has been published at github.com/${REPO}/releases.`);
    if (!res.ok) throw new Error('GitHub answered ' + res.status);
    const rel = await res.json(), latest = rel.tag_name || '';
    if (!newer(latest, app.getVersion())) return alertBox('You are up to date', `TwoToTango ${app.getVersion()} is the latest version.`);
    const r = await alertBox(`TwoToTango ${latest.replace(/^v/, '')} is available`, `You have ${app.getVersion()}.` + (rel.name ? `\n\n${rel.name}` : ''), ['Download', 'Later']);
    if (r.response === 0) shell.openExternal(rel.html_url);
  } catch (e) {
    alertBox('Could not check for updates', String(e && e.message || e), ['OK'], 'error');
  }
}

/* ---------- video import ---------- */
const ffmpegPath = () => path.join(path.dirname(require.resolve('ffmpeg-static')), IS_WIN ? 'ffmpeg.exe' : 'ffmpeg').replace('app.asar', 'app.asar.unpacked');

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;   // uploads over 30 MB are refused
// Normalise ANY video (mov/HEVC/HDR/screen recording/...) to a small 1:1 H.264 mp4 that always plays
function convertVideo(src, dest) {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', src, '-map', '0:v:0', '-map', '0:a:0?',
      '-vf', "crop='min(iw,ih)':'min(iw,ih)',scale=720:720:flags=lanczos,format=yuv420p",
      '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', dest];
    const p = spawn(ffmpegPath(), args); let err = '';
    p.stderr.on('data', d => { err = (err + d).slice(-600); });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve() : reject(new Error('Could not convert this video.\n' + err)));
  });
}
const PRESET_DIR = path.join(__dirname, 'assets', 'presets').replace('app.asar', 'app.asar.unpacked');
const listPresets = () => { try { return fs.readdirSync(PRESET_DIR).filter(f => /\.mp4$/i.test(f)).map(f => f.replace(/\.mp4$/i, '')).sort(); } catch { return []; } };
const PRESET_MODES = { 'yours truly': 'green' };   // presets filmed on a green screen
const defaultPreset = () => { const l = listPresets(); return l.includes('yours truly') ? 'yours truly' : l[0]; };   // same video as the Android app
function usePreset(name, show = true) {
  const km = PRESET_MODES[name] || 'white';
  set({ videoPath: path.join(PRESET_DIR, name + '.mp4'), keyed: km === 'white', keyMode: km, preset: name }, true);
  if (show) showOverlay(false, true);
}
let converting = false;
async function loadVideoFile(src, mode = 'white') {
  if (converting) { alertBox('Please wait', 'A video is still being prepared.'); return; }
  converting = true;
  const dest = path.join(app.getPath('userData'), 'buddy-' + Date.now() + '.mp4');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (tray) { tray.setToolTip('TwoToTango - preparing video...'); if (IS_MAC) tray.setTitle(' Preparing...'); }
  try { await convertVideo(src, dest); }
  catch (e) { fs.unlink(dest, () => {}); throw e; }
  finally { converting = false; if (tray && IS_MAC) tray.setTitle(''); updateTray(); }
  const old = settings.videoPath;
  set({ videoPath: dest, keyed: mode === 'white', keyMode: mode, preset: '' }, true);
  if (old && old !== dest && old.startsWith(app.getPath('userData'))) fs.unlink(old, () => {});   // never delete presets
  showOverlay(false, true);
}
async function pickVideo(mode = 'white') {
  try {
    hideOverlay();
    app.focus({ steal: true });   // menu-bar apps have no dock icon; bring the dialog to the front
    const r = await dialog.showOpenDialog({
      title: { white: 'Choose your video (white background will be removed)', green: 'Choose your video (green screen will be removed)', raw: 'Choose your video (shown as is)' }[mode],
      filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'webm', 'm4v'] }], properties: ['openFile']
    });
    if (r.canceled || !r.filePaths[0]) return;
    const size = fs.statSync(r.filePaths[0]).size;
    if (size > MAX_UPLOAD_BYTES) { alertBox('Video is too large', `That file is ${(size / 1048576).toFixed(1)} MB. Please choose a video under 30 MB.`, ['OK'], 'error'); return; }
    await loadVideoFile(r.filePaths[0], mode);
  } catch (e) {
    alertBox('Could not load video', String(e && e.message || e), ['OK'], 'error');
  }
}

/* ---------- menu-bar menu (the whole UI) ---------- */
const HOURS = [['Always', null], ['9 AM – 6 PM', ['09:00', '18:00']], ['9 AM – 9 PM', ['09:00', '21:00']], ['8 AM – 8 PM', ['08:00', '20:00']], ['10 AM – 10 PM', ['10:00', '22:00']]];
function updateTray() {
  if (!tray) return;
  const when = settings.paused ? 'paused' : nextAt ? new Date(nextAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  const radio = (label, key, val, resched) => ({ label, type: 'radio', checked: settings[key] === val, click: () => set({ [key]: val }, resched) });
  const hoursChecked = h => h ? settings.limitHours && settings.activeFrom === h[0] && settings.activeTo === h[1] : !settings.limitHours;
  tray.setToolTip(`TwoToTango - next: ${when}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `Next: ${when}`, enabled: false },
    { label: `Done today: ${settings.stats[today()] || 0}`, enabled: false },
    { type: 'separator' },
    { label: 'Remind me now', click: () => settings.videoPath ? showOverlay() : (defaultPreset() ? usePreset(defaultPreset()) : pickVideo('white')) },
    { label: settings.paused ? 'Resume reminders' : 'Pause reminders', click: () => set({ paused: !settings.paused }, true) },
    { type: 'separator' },
    { label: 'Video', submenu: [
        { label: 'Upload (remove white background)…', click: () => pickVideo('white') },
        { label: 'Upload (show as is)…', click: () => pickVideo('raw') },
        { type: 'separator' },
        { label: 'Presets', enabled: false },
        ...listPresets().map(n => ({ label: n, type: 'radio', checked: settings.preset === n, click: () => usePreset(n) }))
      ] },
    { label: 'Remind every', submenu: [15, 30, 45, 60, 90].map(m => radio(m + ' minutes', 'intervalMin', m, true)) },
    { label: 'Snooze for', submenu: [5, 10, 15, 30].map(m => radio(m + ' minutes', 'snoozeMin', m, false)) },
    { label: 'Active hours', submenu: HOURS.map(([label, h]) => ({ label, type: 'radio', checked: hoursChecked(h),
        click: () => set(h ? { limitHours: true, activeFrom: h[0], activeTo: h[1] } : { limitHours: false }, false) })) },
    { label: 'Size', submenu: [['Small', 150], ['Medium', 200], ['Large', 280]].map(([l, v]) => radio(l, 'size', v, false)) },
    { label: 'Position', submenu: [
        ...[['Bottom right', 'bottom-right'], ['Bottom left', 'bottom-left'], ['Top right', 'top-right'], ['Top left', 'top-left']].map(([l, v]) => radio(l, 'anchor', v, false)),
        { label: settings.anchor === 'custom' ? 'Custom (saved)' : 'Custom', type: 'radio', checked: settings.anchor === 'custom', click: () => showOverlay(true) },
        { label: 'Drag to place…', click: () => showOverlay(true) }
      ] },
    { label: 'Play sound', type: 'checkbox', checked: settings.sound, click: m => set({ sound: m.checked }, false) },
    { label: 'Launch at login', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: m => app.setLoginItemSettings({ openAtLogin: m.checked }) },
    { type: 'separator' },
    { label: `Check for updates… (v${app.getVersion()})`, click: checkForUpdates },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));
}
function createTray() {
  // macOS: template image (system tints it white on dark bars). Windows: white drop.
  const dir = path.join(__dirname, 'assets');
  let img;
  if (IS_MAC) {
    img = nativeImage.createFromBuffer(fs.readFileSync(path.join(dir, 'trayTemplate@2x.png')), { scaleFactor: 64 / 18 });   // 18 px tall, crisp on Retina
    img.setTemplateImage(true);
  } else {
    img = nativeImage.createFromPath(path.join(dir, 'tray-white.png')).resize({ height: 18 });
  }
  tray = new Tray(img);
  if (IS_WIN) tray.on('click', () => tray.popUpContextMenu());   // Windows: left-click opens the menu too
  updateTray();
}

/* ---------- lifecycle ---------- */
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => {});
  app.whenReady().then(() => {
    if (IS_MAC) { app.setActivationPolicy('accessory'); app.dock.hide(); }   // menu-bar agent: needed to float over full-screen apps
    load();
    if (app.isPackaged && !settings.loginAsked) { app.setLoginItemSettings({ openAtLogin: true }); settings.loginAsked = true; save(); }   // default on, user can switch it off in the menu
    try { for (const f of fs.readdirSync(app.getPath('userData'))) if (/^buddy-.*\.(mp4|mov)$/.test(f) && path.join(app.getPath('userData'), f) !== settings.videoPath) fs.unlinkSync(path.join(app.getPath('userData'), f)); } catch {}
    createTray();
    if (!settings.videoPath && defaultPreset()) usePreset(defaultPreset(), false);
    else schedule(settings.intervalMin);
    setInterval(heartbeat, 5000);
    for (const ev of ['resume', 'unlock-screen']) powerMonitor.on(ev, () => setTimeout(fireIfDue, 1500));   // laptop woke up: catch up on anything that came due
    screen.on('display-removed', () => { if (overlayWin && !overlayWin.isDestroyed() && overlayWin.isVisible()) showOverlay(); });   // keep it on a screen that still exists
  });
  app.on('window-all-closed', e => e.preventDefault()); // stay alive in the tray
}
