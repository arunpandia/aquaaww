const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2];let raised=6.25;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.mp4':'video/mp4'};
http.createServer((req,res)=>{
  const u=req.url.split('?')[0];
  const j=o=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(o))};
  if(u==='/api/fund')return j({goal:25,raised,percent:Math.round(raised/25*1000)/10,supporters:3,ready:true});
  if(u==='/__bump'){raised+=0.57;return j({ok:1})}
  if(u==='/api/pay')return j({currency:'INR',symbol:'₹',amount:50,url:'https://rzp.io/rzp/abc',ready:true});
  if(u==='/api/pay'){let b='';req.on('data',c=>b+=c);req.on('end',()=>j({ok:true,orderId:'order_X',amount:JSON.parse(b).amount*100,currency:'INR',keyId:'rzp_test_x'}));return}
  if(u==='/api/pay-verify'){raised+=0.57;return j({ok:true,goal:25,raised,percent:Math.round(raised/25*1000)/10,supporters:4,ready:true})}
  let p=path.join(root,u);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(!fs.existsSync(p)){res.statusCode=404;return res.end('nf')}
  res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));
}).listen(8766);
