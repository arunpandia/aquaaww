const sharp=require('sharp'),R=process.argv[2]+'/site/';
(async()=>{const i=await sharp('/private/tmp/site_work/flip_raw/bg.png').resize({width:700}).webp({quality:68,effort:6}).toFile(R+'m/img/bg-m.webp');console.log(i.size)})();
