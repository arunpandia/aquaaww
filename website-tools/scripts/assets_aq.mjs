import sharp from "sharp";
import fs from "node:fs";
const A="/private/tmp/site_work/aq_assets/", O=process.argv[2]+"/";
const map={ // out: [src, resize opts, webp opts]
 "grid":["3c739.png",{width:1200},{quality:60}],
 "screen":["3231c.png",{width:1000},{quality:78}],
 "widget":["c6dae.png",{},{quality:88}],
 "base":["47d48.png",{},{lossless:true}],
 "phone-shot":["9ff9d.png",{},{quality:86}],
 "iphone":["e5b42.png",{width:700},{quality:86}],
 "app-a":["de5d6.png",{width:420},{quality:80}],
 "app-b":["45da9.png",{width:420},{quality:82}],
 "paper39":["57c1d.png",{width:1660},{quality:76}],
 "lucky":["694a8.png",{},{quality:86}],
 "paper32":["0de2c.png",{height:420},{quality:80}],
 "paper27":["124d1.png",{width:480},{quality:80}],
 "paper18":["d04a3.png",{width:480},{quality:80}],
 "paper10":["9d265.png",{},{quality:82}],
 "paper08":["92bf0.png",{height:540},{quality:80}],
 "paper07":["5cd7e.png",{},{quality:82}],
};
for(const [out,[src,rs,wo]] of Object.entries(map)){
  const r=await sharp(A+src).resize(rs.width||rs.height?rs:undefined).webp({alphaQuality:92,effort:5,...wo}).toFile(O+out+".webp");
  console.log(out,r.width+"x"+r.height,Math.round(r.size/1024)+"KB");
}
for(const f of fs.readdirSync(A).filter(f=>f.endsWith(".svg"))) fs.copyFileSync(A+f,O+f);
