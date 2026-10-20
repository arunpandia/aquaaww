const sharp=require('sharp'),fs=require('fs'),path=require('path');
const R=process.argv[2]+'/';
const src=fs.readFileSync('/private/tmp/site_work/logo/awwlogo.svg','utf8');
const paths=[...src.matchAll(/<path d="([^"]+)" fill="(#[0-9A-Fa-f]+)"\/>/g)].map(m=>({d:m[1],f:m[2]}));
const W=250,H=306;
const glass=(blue='#1B44A9',red='#CF2E27')=>`<path d="${paths[0].d}" fill="${blue}"/><path d="${paths[1].d}" fill="${red}"/>`;
const mono=c=>`<path d="${paths[0].d}" fill="${c}"/><path d="${paths[1].d}" fill="${c}"/>`;
// svg canvas w x h with the logo centred and `hh` tall; optional background
function place(cw,ch,hh,body,bg){const s=hh/H,w=W*s,x=(cw-w)/2,y=(ch-hh)/2;return `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">${bg||''}<g transform="translate(${x} ${y}) scale(${s})">${body}</g></svg>`}
const png=async(svg,out,px,py)=>{fs.mkdirSync(path.dirname(out),{recursive:true});await sharp(Buffer.from(svg),{density:300}).resize(px,py||px).png().toFile(out)};
const cream='#F9F0E3';
(async()=>{
  // logos as files
  fs.writeFileSync(R+'site/assets/aquaaww-logo.svg',src.replace(/<svg /,'<svg ').trim());
  fs.writeFileSync(R+'mobile/www/img/design/logo.svg',src.trim());
  // favicon: glass on cream tile
  fs.writeFileSync(R+'site/favicon.svg',place(64,64,46,glass(),`<rect width="64" height="64" rx="14" fill="${cream}"/>`));
  await png(place(180,180,128,glass(),`<rect width="180" height="180" fill="${cream}"/>`),R+'site/assets/apple-touch-icon-v2.png',180);
  // desktop icons
  const tile=`<rect x="100" y="100" width="824" height="824" rx="185" fill="${cream}"/>`;
  await png(place(1024,1024,560,glass(),tile),R+'build/icon.png',1024);
  await png(place(1024,1024,560,glass(),tile),R+'assets/app-icon.png',512);
  fs.writeFileSync(R+'assets/app-icon.svg',place(1024,1024,560,glass(),tile));
  fs.writeFileSync(R+'assets/logo.svg',src.trim());
  await png(place(15,18,18,mono('#000')),R+'assets/trayTemplate.png',15,18);
  await png(place(30,36,36,mono('#000')),R+'assets/trayTemplate@2x.png',30,36);
  await png(place(30,36,36,mono('#fff')),R+'assets/tray-white.png',30,36);
  // android
  const RES=R+'mobile/android/app/src/main/res';
  const D={mdpi:1,hdpi:1.5,xhdpi:2,xxhdpi:3,xxxhdpi:4};
  for(const [d,k] of Object.entries(D)){
    const a=Math.round(108*k), l=Math.round(48*k);
    await png(place(108,108,52,glass()),`${RES}/mipmap-${d}/ic_launcher_foreground.png`,a);
    await png(place(48,48,32,glass(),`<rect width="48" height="48" rx="9" fill="${cream}"/>`),`${RES}/mipmap-${d}/ic_launcher.png`,l);
    await png(place(48,48,30,glass(),`<circle cx="24" cy="24" r="24" fill="${cream}"/>`),`${RES}/mipmap-${d}/ic_launcher_round.png`,l);
  }
  await png(place(96,96,80,mono('#fff')),`${RES}/drawable/ic_stat_drop.png`,96);
  await png(place(288,288,160,glass()),`${RES}/drawable/splash_drop.png`,576);
  // web: dusk mark for company pages, org logo
  fs.writeFileSync(R+'site/assets/dusk.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style="color:#f4eee4"><rect width="64" height="64" rx="14" fill="#15132b"/><g id="m"><path d="M12 42a20 20 0 0 1 40 0z" fill="#f2a65a"/><rect x="8" y="46" width="48" height="3.5" rx="1.75" fill="currentColor"/><rect x="18" y="52.5" width="28" height="3.5" rx="1.75" fill="currentColor" opacity=".55"/></g></svg>`);
  await sharp(R+'site/flipbook/img/sun.svg',{density:300}).resize(512,512,{fit:'contain',background:'#0000'}).png().toFile(R+'site/assets/logo-512.png');
  console.log('logos ok');
})();
