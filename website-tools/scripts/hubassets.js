const sharp=require('sharp'),R=process.argv[2]+'/site/';
(async()=>{
  const svg=require('fs').readFileSync(R+'favicon.svg');
  await sharp(svg,{density:600}).resize(180,180).png().toFile(R+'assets/apple-touch-icon.png');
  await sharp(svg,{density:600}).resize(512,512).png().toFile(R+'assets/logo-512.png');
  const W=1200,H=630;
  const og=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15132b"/><stop offset=".5" stop-color="#271f4d"/><stop offset=".8" stop-color="#5a3a62"/><stop offset="1" stop-color="#b85f55"/></linearGradient><radialGradient id="s" cx=".5" cy=".4"><stop offset="0" stop-color="#ffd08a"/><stop offset=".5" stop-color="#f2a65a"/><stop offset="1" stop-color="#e0794f"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/><circle cx="1020" cy="640" r="300" fill="url(#s)"/>
  <text x="80" y="150" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" font-weight="700" fill="#f4eee4">Dusktillus</text>
  <text x="80" y="330" font-family="Helvetica Neue, Arial, sans-serif" font-size="92" font-weight="800" fill="#f4eee4">Little apps that</text>
  <text x="80" y="430" font-family="Helvetica Neue, Arial, sans-serif" font-size="92" font-weight="800" fill="#f4eee4">look after you.</text>
  <text x="80" y="510" font-family="Helvetica Neue, Arial, sans-serif" font-size="34" fill="#f2a65a">Free to start. Private by default.</text></svg>`;
  await sharp(Buffer.from(og)).png({compressionLevel:9,palette:true}).toFile(R+'assets/og-dusktillus.png');
  console.log('ok');
})();
