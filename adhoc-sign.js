// afterPack hook: ship only the ffmpeg binary for the target OS, then ad-hoc sign the macOS app
// (an unsigned arm64 app is refused by macOS; this is not notarization)
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

exports.default = async function (ctx) {
  const plat = ctx.electronPlatformName;
  const resources = plat === 'darwin'
    ? path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.app', 'Contents', 'Resources')
    : path.join(ctx.appOutDir, 'resources');
  const ff = path.join(resources, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static');
  const drop = plat === 'win32' ? ['ffmpeg', 'ffmpeg.LICENSE', 'ffmpeg.README'] : ['ffmpeg.exe', 'ffmpeg.exe.LICENSE', 'ffmpeg.exe.README'];
  for (const f of drop) fs.rmSync(path.join(ff, f), { force: true });

  if (plat === 'darwin') {
    const app = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.app');
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  }
};
