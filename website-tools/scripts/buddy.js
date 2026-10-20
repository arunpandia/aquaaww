const sharp=require('sharp'),R=process.argv[2];
(async()=>{
 for(const n of ['cat','frog','duck']){
  const i=await sharp('/private/tmp/site_work/fr/'+n+'.png').trim({threshold:2}).resize({width:360,height:360,fit:'inside'}).webp({quality:82,alphaQuality:90,effort:6}).toFile(R+'/site/assets/buddy-'+n+'.webp');
  console.log(n,i.width,i.height,i.size);
 }
 const c=await sharp('/private/tmp/site_work/fr/cat.png').flatten({background:'#F9F0E3'}).resize(360).png().toFile('/private/tmp/site_work/fr/cat_flat.png');
})();
