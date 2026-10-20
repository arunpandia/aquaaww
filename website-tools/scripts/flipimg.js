const sharp=require('sharp'),fs=require('fs'),R=process.argv[2]+'/site/flipbook/';
const max={bg:1700,paper02:1000,torn13:1000,torn14:1000,screen:1000,box:420,couple:800,food:800};
(async()=>{for(const f of fs.readdirSync(R+'raw').filter(f=>/\.png$/.test(f))){const n=f.replace('.png','');
 const i=await sharp(R+'raw/'+f).resize({width:max[n]||760,withoutEnlargement:true}).webp({quality:n==='bg'?72:82,alphaQuality:90,effort:5}).toFile(R+'img/'+n+'.webp');console.log(n,i.width+'x'+i.height,Math.round(i.size/1024)+'KB')}})();
