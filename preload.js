const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wb', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: patch => ipcRenderer.invoke('settings:save', patch),
  pickVideo: () => ipcRenderer.invoke('video:pick'),
  onSettings: cb => ipcRenderer.on('settings:update', (_e, s) => cb(s)),
  testReminder: () => ipcRenderer.send('overlay:test'),
  editPosition: () => ipcRenderer.send('overlay:edit'),
  resetPosition: () => ipcRenderer.send('overlay:resetPos'),
  // overlay
  onShow: cb => ipcRenderer.on('overlay:show', (_e, p) => cb(p)),
  onStop: cb => ipcRenderer.on('overlay:stop', () => cb()),
  previewDone: () => ipcRenderer.send('overlay:previewDone'),
  ready: aspect => ipcRenderer.send('overlay:ready', aspect),
  interactive: on => ipcRenderer.send('overlay:interactive', !!on),
  drank: () => ipcRenderer.send('overlay:drank'),
  snooze: () => ipcRenderer.send('overlay:snooze'),
  savePos: () => ipcRenderer.send('overlay:savePos')
});
