const sharp=require('sharp'),A=process.argv[2]+'/site/assets/';
(async()=>{
  
  const W=1200,H=630, bg={create:{width:W,height:H,channels:4,background:'#F9F0E3'}};
  const frame=await sharp(A+'frame.svg',{density:300}).resize(420,431).png().toBuffer();
  const cat=await sharp(A+'buddy-cat.webp').resize(215).png().toBuffer();
  const logo=await sharp(A+'aquaaww-logo.svg',{density:300}).resize({height:130}).png().toBuffer();
  const note=await sharp(A+'note-timing.webp').resize(130).rotate(-5,{background:'#0000'}).png().toBuffer();
  const card=await sharp(A+'card-floating.webp').resize(120).rotate(3,{background:'#0000'}).png().toBuffer();
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><style>text{font-family:"Marker Felt","Permanent Marker","Chalkduster",cursive}</style>
  <text x="230" y="140" font-size="76" fill="#1B44A9">AquaAww</text>
  <text x="80" y="330" font-size="64" fill="#342725">The water reminder</text>
  <text x="80" y="410" font-size="64" fill="#FF6F59">that comes as</text>
  <text x="80" y="490" font-size="64" fill="#342725">someone you love.</text></svg>`;
  await sharp(bg).composite([
    {input:logo,left:80,top:50},
    {input:Buffer.from(svg),left:0,top:0},
    {input:frame,left:700,top:100},{input:cat,left:795,top:175},
    {input:note,left:1040,top:110},{input:card,left:1030,top:300}
  ]).png({compressionLevel:9,palette:true}).toFile(A+'og-aquaaww.png');
  console.log('ok');
})();
