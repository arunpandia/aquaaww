const sharp=require('sharp');
(async()=>{const m=await sharp('/private/tmp/site_work/d_shot.png').metadata(); console.log(m.width,m.height);
const k=m.width/1280; await sharp('/private/tmp/site_work/d_shot.png').extract({left:Math.round(730*k),top:Math.round(640*k),width:Math.round(330*k),height:Math.round(70*k)}).resize({width:990}).png().toFile('/private/tmp/site_work/lap.png')})();
