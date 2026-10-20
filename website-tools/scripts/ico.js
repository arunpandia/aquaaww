const sharp=require('sharp'),fs=require('fs'),pngToIco=(m=>m.default||m)(require('png-to-ico'));
const R=process.argv[2]+'/';
const src=fs.readFileSync('/private/tmp/site_work/logo/awwlogo.svg','utf8');
const mk=(s)=>{const h=Math.round(s*.92),w=h*250/306,x=(s-w)/2,y=(s-h)/2;const sc=h/306;return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><g transform="translate(${x} ${y}) scale(${sc})">${src.replace(/<svg[^>]*>|<\/svg>/g,'')}</g></svg>`)};
(async()=>{const bufs=[];for(const s of [16,24,32,48,64,128,256])bufs.push(await sharp(mk(s),{density:400}).resize(s,s).png().toBuffer());
fs.writeFileSync(R+'build/icon.ico',await pngToIco(bufs));console.log('ico',fs.statSync(R+'build/icon.ico').size)})();
