const sharp=require('sharp');
(async()=>{await sharp('/private/tmp/site_work/logo/awwlogo.svg',{density:200}).resize(500).flatten({background:'#F9F0E3'}).png().toFile('/private/tmp/site_work/logo/prev.png')})();
