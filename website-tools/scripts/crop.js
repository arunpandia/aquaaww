const sharp=require('sharp');
(async()=>{const r={left:290,top:380,width:500,height:380};
const a=await sharp('/private/tmp/site_work/mfig.png').flatten({background:'#fff'}).resize(804,1748).extract(r).toBuffer();
const b=await sharp('/private/tmp/site_work/m_shot.png').extract(r).toBuffer();
await sharp({create:{width:1050,height:380,channels:3,background:'#888'}}).composite([{input:a,left:0,top:0},{input:b,left:530,top:0}]).png().toFile('/private/tmp/site_work/crop.png')})();
