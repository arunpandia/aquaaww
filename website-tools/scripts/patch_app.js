const { app, BrowserWindow } = require('electron');
const fs = require('fs');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 900, height: 1700, show: false, webPreferences: { webSecurity: false } });
  const src = 'file:///private/tmp/site_work/aq_assets/45da9.png';
  const font = 'file:///Users/arunpandiank/Library/Application%20Support/Claude/scratch-workspaces/6e1b52f3-19f8-4e1a-8499-bee5d92676bf/b4cfe1f5-70f3-4db0-9e94-d5b839153d39/scratch-2026-10-16-3d2e9a/mobile/www/fonts/';
  await win.loadURL('data:text/html,<body></body>');
  const out = await win.webContents.executeJavaScript(`(async()=>{
    const f=new FontFace('PM','url(${font}PermanentMarker-Regular.ttf)');await f.load();document.fonts.add(f);
    const img=new Image();img.src='${src}';await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
    const S=img.width/420, X0=211, X1=592, Y0=408, Y1=433;
    // sample bg just left of the word
    const px=x.getImageData(650,420,1,1).data;
    x.fillStyle='rgb('+px[0]+','+px[1]+','+px[2]+')';x.fillRect(X0,Y0,X1-X0,Y1-Y0);
    x.fillStyle='#262626';x.font=(11.5*S)+'px PM';x.textBaseline='alphabetic';
    x.fillText('AquaAww because I can\u2019t always be',X0+1,Y1-6);
    return {url:c.toDataURL('image/png'),box:[X0,Y0,X1,Y1],w:img.width,h:img.height};
  })()`);
  fs.writeFileSync('/private/tmp/site_work/aq_assets/45da9_patched.png', Buffer.from(out.url.split(',')[1], 'base64'));
  console.log(JSON.stringify({box: out.box, w: out.w, h: out.h})); app.quit();
});
