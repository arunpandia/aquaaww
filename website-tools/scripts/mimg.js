const sharp=require('sharp'),R=process.argv[2]+'/site/';
(async()=>{for(const [n,s] of [['couple',520],['food',520]]){const i=await sharp('/private/tmp/site_work/flip_raw/'+n+'.png').resize({width:s}).webp({quality:76,effort:6}).toFile(R+'m/img/'+n+'-m.webp');console.log(n,i.width,i.height,i.size)}})();
