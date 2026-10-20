const sharp=require('sharp'),R=process.argv[2]+'/site/flipbook/img/';
(async()=>{const i=await sharp('/private/tmp/site_work/widget.png').resize({width:333,withoutEnlargement:true}).webp({quality:85,alphaQuality:90,effort:6}).toFile(R+'widget.webp');console.log(i.width,i.height,i.size)})();
