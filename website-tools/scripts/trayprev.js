const sharp=require('sharp'),R=process.argv[2]+'/assets/';
(async()=>{
 const bg=(c,w,h)=>({create:{width:w,height:h,channels:4,background:c}});
 const t=await sharp(R+'trayTemplate@2x.png').resize({height:108}).toBuffer(), w=await sharp(R+'tray-white.png').resize({height:108}).toBuffer();
 await sharp(bg('#f2f2f2',400,160)).composite([{input:t,left:40,top:26},{input:await sharp(R+'trayTemplate@2x.png').negate({alpha:false}).resize({height:108}).toBuffer(),left:0,top:0,blend:'dest-over'}]).png().toFile('/private/tmp/site_work/tray_light.png');
 await sharp(bg('#222',400,160)).composite([{input:w,left:40,top:26}]).png().toFile('/private/tmp/site_work/tray_dark.png');
})();
