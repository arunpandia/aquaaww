"""Phone layout for /aquaaww/ (under 700px wide), built 1:1 from the Figma frame "iPhone 16 & 17 Pro - 5" (402 x 874).
The frame is converted like the desktop one (website-tools/aquaaww-figma/convert_m.mjs) and scaled to the screen width with JS zoom.
The FAQ card at the end is not in the design; it is drawn upright in the same style."""
import re

I = "/aquaaww/img/"
CSS_RAW = """
#mob{display:none}
@media (max-width:699PX){
:root{--u:calc(min(100vw,560PX) / 402)}
#stage,#sun,#bgfit{display:none}
html,body{background:#fff;min-height:0}
#mob{display:block;position:relative}
#bgl{position:fixed;left:50%;top:0;width:402px;margin-left:-201px;height:100%;overflow:hidden;z-index:0;pointer-events:none}
#bgl i{position:absolute;display:block;background-size:cover;background-position:center}
#bgl img{position:absolute;display:block;max-width:none}
#mstage{position:relative;z-index:1;width:402PX;margin:0 auto;padding:117PX 36PX 40PX;overflow-x:clip}
#mstage .col{height:auto}
#mstage .s40{margin-top:0}
#mstage .s38{margin-top:-12PX}
#mstage .s36{margin-top:-14.5PX}
#mstage .sfeat{margin-top:-1.5PX}
#mstage .p36{left:0!important;width:331PX!important}
#mstage .p36 img{left:0!important;top:0!important;width:100%!important;height:100%!important;object-fit:cover;object-position:100% 50%}
.mfaq{position:relative;isolation:isolate;width:331PX;border:1PX solid #000;border-radius:0 0 28PX 28PX;background:#fcfbf6;padding:26PX 22PX 22PX;overflow:hidden}
.mfaq::before{content:"";position:absolute;inset:0;background:url(/flipbook/img/bg.webp) center/cover;opacity:.5;z-index:-1}
.mfaq h2{font:400 14PX/18PX "JetBrains Mono",ui-monospace,monospace}
.mfaq .fq-list{width:auto;margin-top:22PX}
.mfaq .fq h3{font-size:16PX}
.mfaq .fq-a{font-size:13PX;line-height:1.4}
.mfaq .fq.q1[open]{min-height:0}
.mfaq .fq-nav{margin-top:0;padding-top:22PX}
}
"""

def conv(s):
    return re.sub(r'(?<![\w.#-])(-?\d*\.?\d+)px', lambda m: f'calc(var(--u)*{m.group(1)})', s)

CSS = conv(CSS_RAW).replace("PX", "px")

def faq_items(FAQ, h3cls="ad"):
    out = []
    for i, (q, a) in enumerate(FAQ):
        o = ' q1" open' if i == 0 else '"'
        out.append(f'<details class="fq{o}><summary class="fq-s"><h3 class="{h3cls}">{q}</h3></summary><p class="fq-a ad">{a}</p></details>')
        if i < len(FAQ) - 1: out.append('<div class="fq-sep" aria-hidden="true"></div>')
    return "".join(out)

def nav(GH):
    return ('<nav class="fq-nav ff-jb jb" aria-label="More about AquaAww"><a href="/aquaaww/water-reminder-app-for-android/">Android</a><a href="/aquaaww/water-reminder-app-for-windows/">Windows</a>'
            f'<a href="/aquaaww/water-reminder-app-for-mac/">Mac</a><a href="/guides/">Guides</a><a href="{GH}">GitHub</a><a href="/terms/">Terms</a><a href="/privacy/">Privacy</a></nav>')

def faq_desktop(FAQ, GH):
    return (f'<section id="faq" class="faq" aria-labelledby="faq-h"><h2 id="faq-h" class="fq-l ff-jb">Questions</h2><div class="fq-list">{faq_items(FAQ, "ff-ad")}</div>{nav(GH)}</section>')

EXTRA_CSS = """
.fq-a{font-family:"Architects Daughter",cursive}
.fq summary::after{content:"+";position:absolute;right:0;top:-1px;font:400 22px/1 "Permanent Marker",cursive;color:#e83328;opacity:0;transition:opacity .15s}
.fq summary:hover::after,.fq summary:focus-visible::after{opacity:1}
.fq[open] summary::after{content:"_";top:3px;font-size:16.936px;opacity:1}
@media (hover:none){.fq:not([open]) summary::after{opacity:.55}}
#demo{position:fixed;left:16px;bottom:16px;z-index:30;width:230px;height:330px;pointer-events:none;animation:dmpop .3s cubic-bezier(.3,1.4,.5,1)}
#demo[hidden]{display:none}
#demo>*{pointer-events:auto}
#demo canvas{position:absolute;left:0;bottom:0;width:230px;height:230px}
#demo video{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.dm-note{position:absolute;left:4px;top:0;width:104px;transform:rotate(-3deg)}
.dm-note img{width:100%;height:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}
.dm-ok{position:absolute;left:25%;top:62%;width:55%;height:15%;border:0;background:none;cursor:pointer;border-radius:4px}
.dm-ok:hover,.dm-ok:focus-visible{outline:2px solid #e83328}
.dm-x{position:absolute;right:4px;top:6px;width:28px;height:28px;border:1px solid #000;border-radius:50%;background:#fcfbf6;color:#000;display:grid;place-items:center;padding:0;cursor:pointer;z-index:2}
.dm-cap{position:absolute;left:0;bottom:-2px;margin:0;font:11px/1.2 "JetBrains Mono",monospace;color:rgba(0,0,0,.55);display:none}
@keyframes dmpop{from{transform:translateY(60px) scale(.85);opacity:0}to{transform:none;opacity:1}}
@media (max-width:699px){#demo{width:176px;height:252px;left:10px;bottom:10px}#demo canvas{width:176px;height:176px}.dm-note{width:84px}.dm-x{top:6px}}
@media (prefers-reduced-motion:reduce){#demo{animation:none}}
"""

DEMO_HTML = """<aside id="demo" role="dialog" aria-label="AquaAww demo" hidden><div class="dm-note"><img src="/aquaaww/img/demo-note.webp" width="175" height="205" alt="Drink water note with I drank and later buttons"><button class="dm-ok" type="button" aria-label="I drank"></button></div><button class="dm-x" type="button" aria-label="Close demo"><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg></button><canvas id="dmc" width="320" height="320" aria-label="A short video of someone you love reminding you to drink water"></canvas><video id="dmv" muted playsinline loop preload="none"></video></aside>"""

DEMO_JS = """
  var dm=document.getElementById("demo"),dv=document.getElementById("dmv"),dc=document.getElementById("dmc"),dx=dc.getContext("2d",{willReadFrequently:true}),dOn=false,dRaf=0,W=320;
  function dFrame(){
    if(!dOn)return;
    if(dv.readyState>=2&&dv.videoWidth){
      var s=Math.min(dv.videoWidth,dv.videoHeight);
      dx.drawImage(dv,(dv.videoWidth-s)/2,(dv.videoHeight-s)/2,s,s,0,0,W,W);
      var im=dx.getImageData(0,0,W,W),a=im.data;
      for(var i=0;i<a.length;i+=4){var m=a[i]>a[i+2]?a[i]:a[i+2],al=1-(a[i+1]-m-35)/65;al=al<=0?0:al>=1?1:al*al*(3-2*al);if(al<1&&a[i+1]>m)a[i+1]=m;a[i+3]=al*255}
      dx.putImageData(im,0,0);
    }
    dRaf=dv.requestVideoFrameCallback?dv.requestVideoFrameCallback(dFrame):requestAnimationFrame(dFrame);
  }
  function dOpen(){
    if(!dv.getAttribute("src"))dv.src="/aquaaww/demo.mp4";
    dm.hidden=false;dOn=true;dv.currentTime=0;
    var p=dv.play();if(p&&p.catch)p.catch(function(){});
    dFrame();
  }
  function dClose(){dOn=false;if(dv.cancelVideoFrameCallback)dv.cancelVideoFrameCallback(dRaf);cancelAnimationFrame(dRaf);dv.pause();dm.hidden=true}
  document.querySelectorAll("[data-demo]").forEach(function(b){b.addEventListener("click",function(e){e.preventDefault();dm.hidden?dOpen():dClose()})});
  dm.querySelector(".dm-x").addEventListener("click",dClose);
  dm.querySelector(".dm-ok").addEventListener("click",dClose);
  addEventListener("keydown",function(e){if(e.key==="Escape"&&!dm.hidden)dClose()});
"""

def build(D, FAQ, GH):
    faq = (f'<section id="m-faq" class="mfaq" aria-labelledby="m-faq-h"><h2 id="m-faq-h">Questions</h2><div class="fq-list">{faq_items(FAQ, "ff-ad")}</div>{nav(GH)}</section>')
    body = open("aquaaww_body_m.html").read().replace("<!--MFAQ-->", faq)
    bg = ('<div id="bgl" aria-hidden="true"><i style="left:132px;top:194px;width:970px;height:851px;transform:scaleX(-1);background-image:url(/flipbook/img/torn14.webp)"></i>'
          '<i style="left:-443px;top:63px;width:720px;height:888px;background-image:url(/flipbook/img/torn13.webp)"></i>'
          f'<img src="{I}f950a.svg" alt="" width="54" height="66" style="left:304px;top:26px;width:53.8516px;height:65.8419px"></div>')
    return '<div id="mob">' + conv(bg) + '<div id="mstage">' + body + '</div></div>'
