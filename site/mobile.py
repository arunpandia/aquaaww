"""Static mobile home page, built 1:1 from the Figma frame "iPhone 16 & 17 Pro - 4" (402 x 874).
Every size is written in Figma pixels and converted to calc(var(--u) * n), where --u is 1/402 of the page width,
so the whole layout scales with the screen. No JavaScript is needed to lay it out."""
import re, json

F = "/flipbook/img/"      # images shared with the desktop book
M = "/m/img/"             # images drawn for the phone frame

def fx(l, t, w, h, inner, iw=None, ih=None, rot=None, flip=False, extra="", inner_extra=""):
    tr = []
    if rot is not None: tr.append(f"rotate({rot}deg)")
    if flip: tr.append("scaleX(-1)")
    st = f"width:{iw}px;" if iw else ""
    st += f"height:{ih}px;" if ih else ""
    if tr: st += "transform:" + " ".join(tr) + ";"
    return (f'<div class="fx" style="left:{l}px;top:{t}px;width:{w}px;height:{h}px{extra}">'
            f'<div class="in" style="{st}{inner_extra}">{inner}</div></div>')

def img(src, cls="cover", style="", alt="", lazy=True, w=None, h=None):
    dim = f' width="{w}" height="{h}"' if w else ""
    ld = ' loading="lazy" decoding="async"' if lazy else ""
    return f'<img class="{cls}" alt="{alt}" src="{src}"{dim}{ld} style="{style}">'

def build(D, hub_ld, GH):
    sr = ('<div class="sr"><h1>Dusktillus, our digital garage</h1><p>Dusktillus makes little apps that look after you. Our first app, AquaAww, is a water reminder '
          'that comes as someone you love, free for Android, Windows and Mac.</p><nav aria-label="Site"><a href="/aquaaww/">AquaAww water reminder app</a> '
          '<a href="/guides/">Water and hydration guides</a> <a href="/terms/">Terms and Conditions</a> <a href="/privacy/">Privacy</a> '
          '<a href="/unsubscribe/">Unsubscribe</a></nav></div>')

    # ---------- top page (331 x 503.28) ----------
    top = []
    top.append('<div class="tex tr"><img class="cover" alt="" src="' + M + 'bg-m.webp" decoding="async" style="opacity:.5"></div>')
    top.append('<p class="a jb nw" style="left:24.72px;top:16.75px;font-size:6.381px;color:#7e7e7b">Insta ID - </p>')
    top.append('<p class="a jb nw" style="left:24.72px;top:24.72px;font-size:11.166px;color:#000">dusktillus</p>')
    top.append('<div class="a" style="left:165.9px;top:167.89px;width:168.292px;height:0;transform:translate(-50%,-50%) rotate(-90deg)"><img alt="" src="' + M + 'line21.svg" style="position:absolute;left:0;top:-.8px;width:168.292px;height:.8px"></div>')
    top.append('<div class="a" style="left:165.9px;top:252.04px;width:280.752px;height:0;transform:translate(-50%,-50%) rotate(180deg)"><img alt="" src="' + M + 'line22.svg" style="position:absolute;left:0;top:-.8px;width:280.752px;height:.8px"></div>')
    top.append(fx(106.28, 30.19, 61.433, 59.041, img(F + "cal.webp", lazy=False), 60.757, 58.337, rot=0.67))
    top.append(fx(125.99, 54.02, 17.139, 19.513, img(F + "heart.webp", lazy=False), 16.323, 18.809, rot=-2.54))
    top.append(fx(22.33, 88.53, 125.245, 28.886, '<p class="ad" style="width:124.254px">Our digital garage,</p>', rot=-5.99))
    top.append('<div class="fx" style="left:39.08px;top:126.82px;width:121.847px;height:48.171px"><div class="in ad" style="width:121.779px;transform:rotate(-.08deg);white-space:pre-wrap"><p>—feel free to </p><p>hang out and try everything</p></div></div>')
    top.append(fx(39.08, 192.22, 116.072, 17.163, '<p class="ad" style="width:116.049px;font-size:12.417px">its so so cool,</p>', rot=-0.08))
    top.append(fx(39.08, 217.74, 116.072, 17.163, '<p class="ad" style="width:116.049px;font-size:12.417px">*wipes tear*</p>', rot=-0.08))
    top.append(fx(179.46, 308.67, 100.192, 80.141, '<p class="ad" style="width:100.08px">Current goal is to raise 25$ for Google Play Console one-time registration fee</p>', rot=-0.08))
    top.append('<div class="a" style="left:179.46px;top:318.21px;width:54.236px;height:20.737px"><img alt="" src="' + M + 'highlight.svg" style="position:absolute;left:-4.41%;top:0;width:104.41%;height:107.69%"></div>')
    top.append('<div class="a" style="left:179.46px;top:401.99px;width:98.104px;height:12.761px"><img alt="" src="' + M + 'slider.svg" style="position:absolute;inset:0;width:100%;height:100%"></div>')
    top.append(f'<a class="a pm nw link" href="{GH}" style="left:179.46px;top:422.72px;font-size:8.758px;color:#000">Learn more -&gt;</a>')
    # strip of paper on the inner (right) edge, drawn flipped as in the design
    top.append('<div class="a" style="right:0;top:0;width:51.046px;height:501.684px;transform:scaleX(-1);border-top-right-radius:22.33px;overflow:hidden"><div class="tex" style="border-top-right-radius:22.33px"><img class="cover" alt="" src="' + M + 'bg-m.webp" decoding="async" style="opacity:.5"></div></div>')
    # torn paper along the bottom of the page
    top.append('<div class="fx" style="left:calc(50% + 2.04px);top:405.2px;width:571.075px;height:571.075px;transform:translateX(-50%)"><div class="in" style="width:571.075px;height:571.075px;transform:rotate(-90deg)"><img class="cover" alt="" src="' + F + 'paper02.webp" decoding="async" style="opacity:.5"></div></div>')
    top = [top[0], '<div class="pi">' + "".join(top[1:]) + '</div>', '<div class="bd tr"></div>']

    # ---------- things that sit over the top page ----------
    ex = []
    ex.append('<p class="a jb nw" style="left:25.52px;top:264px;font-size:11.166px;color:#000">Cardboard box:</p>')
    ex.append(fx(20.107, 283.94, 136.243, 203.137, img(F + "box.webp", style="border-top-right-radius:22.33px"), 135.423, 202.588, rot=179.77))
    ex.append(fx(43.067, 356.52, 90.273, 43.238, img(F + "gplay.webp", style="border-top-right-radius:22.33px"), 86.688, 27.032, rot=-11.12))
    ex.append(f'<img class="a" alt="" src="{F}notebook.webp" loading="lazy" decoding="async" style="left:51.041px;top:373.27px;width:99.699px;height:99.699px;object-fit:cover;border-top-right-radius:22.33px">')
    ex.append(f'<img class="a" alt="" src="{F}camera.webp" loading="lazy" decoding="async" style="left:69.392px;top:304.68px;width:73.378px;height:73.378px;object-fit:cover;border-top-right-radius:22.33px">')
    ex.append(f'<img class="a" alt="" src="{F}keys.webp" loading="lazy" decoding="async" style="left:34.297px;top:316.64px;width:48.653px;height:48.653px;object-fit:cover;border-top-right-radius:22.33px">')
    # collage
    ex.append(fx(158.45, 64.6, 167.447, 146.235, f'<div class="clip" style="border-top-right-radius:22.33px"><img alt="" src="{F}polaroid.webp" decoding="async" style="position:absolute;left:0;top:0;height:100%;width:108.55%"></div>', 146.501, 119.275, rot=11.57))
    ex.append(fx(181.76, 89.39, 133.248, 105.806, f'<div class="clip"><img alt="" src="{M}couple-m.webp" decoding="async" style="position:absolute;left:-.02%;top:-94.9%;height:208.66%;width:110.22%"></div>', 118.925, 83.757, rot=11.51))
    ex.append(fx(155.23, 139.2, 124.17, 87.29, f'<div class="clip" style="border-top-right-radius:22.33px"><img alt="" src="{M}food-m.webp" decoding="async" style="position:absolute;left:-38.09%;top:-15.02%;height:161.38%;width:143.13%"></div>', 118.866, 79.067, rot=-4.06))
    ex.append(fx(133.99, 118.26, 163.839, 125.762, img(F + "polaroid.webp", lazy=False, style="border-top-right-radius:22.33px"), 159.034, 119.275, rot=-2.37))
    ex.append(fx(203.85, 156.17, 120.671, 114.852, f'<div class="clip" style="border-top-right-radius:22.33px"><img alt="" src="{F}sunflowers.webp" decoding="async" style="position:absolute;left:0;top:0;height:100%;width:115.64%"></div>', 102.481, 94.806, rot=-12.58))

    # ---------- bottom page (built mirrored, like the design) ----------
    b = []
    b.append('<div class="tex br"><img class="cover" alt="" src="' + M + 'bg-m.webp" loading="lazy" decoding="async" style="opacity:.5"></div>')
    b.append('<div class="fx" style="left:-143.57px;top:-95.715px;width:571.075px;height:571.075px"><div class="in" style="width:571.075px;height:571.075px;transform:rotate(-90deg) scaleY(-1)"><img class="cover" alt="" src="' + F + 'paper02.webp" loading="lazy" decoding="async" style="opacity:.5"></div></div>')
    b.append('<div class="a" style="left:330.2px;top:252.44px;width:503.28px;height:0;transform:translate(-50%,-50%) rotate(-90deg) scaleY(-1)"><img alt="" src="' + M + 'line23.svg" style="position:absolute;left:0;top:-.8px;width:503.28px;height:.8px"></div>')
    b.append('<div class="fx" style="left:28.148px;top:64.6px;width:219.102px;height:160.308px"><div class="in" style="width:218.877px;transform:rotate(-179.92deg) scaleY(-1)"><div class="ad" style="text-align:right;white-space:pre-wrap"><p style="white-space:nowrap">I built <span style="color:#e83328"> </span>'
             f'<a href="/aquaaww/" style="color:#e83328;text-decoration:underline wavy;text-decoration-thickness:10.5%;text-decoration-skip-ink:none">AquaAww</a> because I can’t always be<br>there to say “have some water.”</p>'
             '<p style="margin-bottom:0"><br>So I made something small that sits quietly on your screen and says it for me, with a smile.<br>Every sip is me looking out for you, even when I’m not in the room.</p><p>​</p><p style="color:#7199cc">_  for my loving wife</p></div></div></div>')
    b.append('<div class="fx" style="left:252.45px;top:24.72px"><div class="in flip"><p class="jb nw" style="font-size:11.166px;color:#000">recently:</p></div></div>')
    # laptop
    b.append('<div class="a" style="left:-56.28px;top:462.82px;width:293.385px;height:3.242px"><img alt="" src="' + M + 'shadow.svg" loading="lazy" style="position:absolute;left:-4.86%;top:-440%;width:109.72%;height:980%"></div>')
    b.append('<div class="a" style="left:-41.37px;top:278.36px;width:264.532px;height:179.597px;background:#1a202c;border:.648px solid #4a5568;border-radius:9.077px 9.077px 1.297px 1.297px"></div>')
    b.append('<div class="a" style="left:-39.75px;top:279.98px;width:261.291px;height:171.168px;background:#000;border-radius:7.132px 7.132px 0 0"></div>')
    b.append('<div class="fx" style="left:-34.24px;top:285.26px;width:249.944px;height:162.549px"><div class="in flip" style="width:249.944px;height:162.549px;background:#fff;overflow:hidden"><img alt="" src="' + F + 'screen.webp" loading="lazy" decoding="async" style="position:absolute;left:0;top:0;width:100%;height:100%"></div></div>')
    b.append('<p class="a nw" style="left:90.28px;top:451.47px;transform:translateX(-50%);font-family:Inter,system-ui,sans-serif;font-weight:600;font-size:4.214px;line-height:.9;color:#a0aec0;text-align:center">Macbook Air</p>')
    b.append('<img class="a" alt="" src="' + M + 'bottom.svg" loading="lazy" style="left:-73.14px;top:456.66px;width:326.775px;height:5.836px">')
    b.append('<img class="a" alt="" src="' + F + 'phone.webp" loading="lazy" decoding="async" style="left:153.49px;top:329.95px;width:60.789px;height:117.922px;object-fit:cover">')
    b.append('<div class="fx" style="left:155.06px;top:329.95px;width:60.803px;height:56.197px"><div class="in flip" style="width:60.803px;height:56.197px;overflow:hidden"><img alt="" src="' + F + 'phone.webp" loading="lazy" decoding="async" style="position:absolute;left:0;top:-.02%;width:100%;height:209.89%"></div></div>')
    b.append('<div class="fx" style="left:173.08px;top:165.9px;width:79.759px;height:79.759px"><div class="in flip" style="width:79.759px;height:79.759px;overflow:hidden"><div class="a" style="inset:24.71% .79% 25.29% 0"><img alt="" src="' + M + 'smile.svg" style="position:absolute;inset:0;width:100%;height:100%"></div></div></div>')
    b.append('<div class="fx" style="left:24.27px;top:24.72px"><div class="in flip"><a class="pm nw link" href="/aquaaww/" style="font-size:11.47px;color:#e83328">Learn more -&gt;</a></div></div>')
    b = [b[0], '<div class="pi">' + "".join(b[1:]) + '</div>', '<div class="bd br"></div>']

    css = """
:root{--u:calc(min(100vw,560px) / 402)}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:#fff;color:#000;font-family:"JetBrains Mono",ui-monospace,monospace;overflow-x:hidden}
img{display:block;max-width:none;-webkit-user-drag:none;user-select:none;-webkit-touch-callout:none}
a{color:inherit;text-decoration:none}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
#st{position:relative;width:402px;height:1146px;margin:0 auto;overflow:hidden;background:#fff}
.a{position:absolute}
.fx{position:absolute;display:flex;align-items:center;justify-content:center}
.in{flex:none;position:relative}
.cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.clip{position:absolute;inset:0;overflow:hidden}
.clip img{max-width:none}
.nw{white-space:nowrap}
.ad{font-family:"Architects Daughter",cursive;font-size:11.166px;line-height:normal;color:#000}
.pm{font-family:"Permanent Marker",cursive;line-height:normal}
.jb{font-family:"JetBrains Mono",monospace;line-height:normal}
.flip{transform:scaleX(-1)}
#pg{position:absolute;left:36px;top:117px;width:331px;height:1005.28px}
#tp{position:absolute;left:0;top:0;width:331px;height:503.28px;overflow:hidden;border-radius:22.333px 22.33px 0 0}
#bt{position:absolute;left:0;top:502px;width:331px;height:503.28px;transform:scaleX(-1)}
#bp{position:absolute;inset:0;overflow:hidden;border-radius:0 0 22.333px 22.333px}
.tex{position:absolute;inset:0;background:#fcfbf6}
.pi{position:absolute;inset:.798px}
.tex.tr{border-radius:22.333px 22.33px 0 0}.tex.br{border-radius:0 0 22.333px 22.333px}
.bd{position:absolute;inset:0;pointer-events:none;border:.798px solid #000}
.bd.tr{border-radius:22.333px 22.33px 0 0}.bd.br{border-radius:0 0 22.333px 22.333px}
#tx{position:absolute;inset:0;pointer-events:none}
#tx *{pointer-events:auto}
.link:active{opacity:.7}
"""
    # px -> calc(var(--u) * n)  (Figma pixels become fractions of the page width)
    def conv(s):
        return re.sub(r'(?<![\w.#-])(-?\d*\.?\d+)px', lambda m: f'calc(var(--u)*{m.group(1)})', s)
    css_c = conv(css.replace(":root{--u:calc(min(100vw,560px) / 402)}", "@@ROOT@@")).replace("@@ROOT@@", ":root{--u:calc(min(100vw,560px) / 402)}")
    body = (sr + '<div id="st">'
            '<div class="a" style="left:132px;top:194px;width:970px;height:851px;transform:scaleX(-1)"><img class="cover" alt="" src="' + F + 'torn14.webp" decoding="async"></div>'
            '<img class="a" alt="" src="' + F + 'torn13.webp" decoding="async" style="left:-443px;top:63px;width:720px;height:888px;object-fit:cover">'
            '<img class="a" alt="Dusktillus" src="' + M + 'sun.svg" width="84" height="84" fetchpriority="high" style="left:50%;top:14px;width:84px;height:84px;transform:translateX(-50%)">'
            '<div id="pg"><div id="tp">' + "".join(top) + '</div><div id="tx">' + "".join(ex) + '</div>'
            '<div id="bt"><div id="bp">' + "".join(b) + '</div></div></div></div>')
    body = conv(body)
    fonts = ("@font-face{font-family:'JetBrains Mono';src:url(/flipbook/fonts/JetBrainsMono.woff2) format('woff2');font-display:swap}"
             "@font-face{font-family:'Architects Daughter';src:url(/flipbook/fonts/ArchitectsDaughter.woff2) format('woff2');font-display:swap}"
             "@font-face{font-family:'Permanent Marker';src:url(/flipbook/fonts/PermanentMarker-Regular.woff2) format('woff2');font-display:swap}")
    guard = '<script>document.addEventListener("dragstart",function(e){if(e.target&&e.target.tagName==="IMG")e.preventDefault()});</script>'
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Dusktillus – our digital garage</title>
<meta name="description" content="Dusktillus is our digital garage. Flip through what we are building, starting with AquaAww, a water reminder that comes as someone you love.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{D}/">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon-v2.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Dusktillus"><meta property="og:title" content="Dusktillus: our digital garage">
<meta property="og:description" content="Little apps that look after you. Start with AquaAww, a water reminder that comes as someone you love.">
<meta property="og:url" content="{D}/"><meta property="og:image" content="{D}/assets/og-dusktillus.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{D}/assets/og-dusktillus.png">
<link rel="preload" href="/flipbook/fonts/ArchitectsDaughter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/flipbook/fonts/JetBrainsMono.woff2" as="font" type="font/woff2" crossorigin>
<style>{fonts}{css_c}</style>
<script type="application/ld+json">{json.dumps(hub_ld, separators=(",", ":"))}</script>
<script defer src="/_vercel/insights/script.js"></script>
{guard}
</head><body>{body}<script>if(innerWidth>=700&&!/Mobi|iPhone|iPod/i.test(navigator.userAgent))location.replace("/");</script></body></html>'''
