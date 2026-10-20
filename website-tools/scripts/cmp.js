const sharp=require('sharp');
(async()=>{
 const a=await sharp('/private/tmp/site_work/mfig.png').flatten({background:'#fff'}).resize(804,1748).png().toBuffer();
 const b=await sharp('/private/tmp/site_work/m_shot.png').png().toBuffer();
 await sharp({create:{width:1608+10,height:1748,channels:3,background:'#888'}}).composite([{input:a,left:0,top:0},{input:b,left:814,top:0}]).png().toFile('/private/tmp/site_work/side.png');
 // 50% blend overlay for alignment
 await sharp(a).composite([{input:await sharp(b).ensureAlpha(0.5).toBuffer(),blend:'over'}]).png().toFile('/private/tmp/site_work/overlay.png');
 const {data:da}=await sharp(a).raw().toBuffer({resolveWithObject:true}); const {data:db}=await sharp(b).raw().toBuffer({resolveWithObject:true});
 let s=0;for(let i=0;i<da.length;i++){s+=Math.abs(da[i]-db[i])} console.log('mean abs diff',(s/da.length).toFixed(2));
})();
