"""Phone layout for /aquaaww/ (under 700px wide). The desktop page is a rotated Figma frame that cannot reflow, so phones get
this static stack instead. Sizes are written in design pixels of a 402px frame and converted to calc(var(--u)*n)."""
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
.mw{position:relative;z-index:1;width:402px;margin:0 auto;padding:12px 16px 40PX}
.mtop{position:relative;height:56px}
.mback{position:absolute;left:10px;top:12px;font:400 14px "Permanent Marker",cursive;color:#000}
.mlogo{position:absolute;right:4px;top:2px;width:44px;height:54px}
.mc{position:relative;border:1PX solid #000;border-radius:22px;background:#fcfbf6;overflow:hidden;margin-bottom:10px;isolation:isolate}
.mc::before{content:"";position:absolute;inset:0;background:url(/m/img/bg-m.webp) center/cover;opacity:.5;z-index:-1}
.ad{font-family:"Architects Daughter",cursive}
.pm{font-family:"Permanent Marker",cursive}
.jb{font-family:"JetBrains Mono",ui-monospace,monospace}
.sa{padding:30px 0 0 22px}
.sa .st{padding-right:22px;font-size:16px;line-height:1.42;color:#000}
.sa .st p+p{margin-top:12px}
.sa .st a{text-decoration:underline wavy #000;text-decoration-thickness:10.5%;text-decoration-skip-ink:none;text-underline-offset:2px}
.wrow{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 0 0}
.wife{font-size:16px;color:#7199cc;white-space:nowrap}
.lap{display:block;width:300px;height:auto;margin:0 0 0 auto}
.b3{position:relative;display:inline-block;padding:7px 14px 6px;font:400 14px/1.2 "Permanent Marker",cursive;color:#000;isolation:isolate;margin:0 0 0 7px;white-space:nowrap}
.b3::before{content:"";position:absolute;left:-7px;top:5px;right:6px;bottom:-5px;background:#E9B24E;border:1.3PX solid #1d1d1d;z-index:-2}
.b3::after{content:"";position:absolute;inset:0;background:#fff;border:1.3PX solid #1d1d1d;z-index:-1}
.b3:active{transform:translate(-3px,3px)}
.sb{display:flex;flex-wrap:wrap;align-items:flex-start;gap:12px 16px;padding:26px 20px 26px 20px}
.sb img.ph{width:118px;height:auto;flex:none}
.sb .tx{flex:1;min-width:0;font-size:15px;line-height:1.4;color:#000}
.sb .tx h1{font-weight:400;font-size:15px;line-height:1.4}
.sb .tx p+p{margin-top:10px}
.av{flex-basis:100%;display:flex;flex-wrap:wrap;align-items:center;gap:14px 0;font-size:13px;color:#000}
.av .fr{font:400 16px "Permanent Marker",cursive;color:#e83328;margin:0 6px;transform:rotate(-3deg)}
.av .b3{margin-left:14px}
.lk{position:relative;margin:0 -6px 12px;padding:50px 34px 44px;background:url(/aquaaww/img/paper39.webp) center/cover no-repeat;text-align:center}
.lk .shot{position:relative;width:286px;max-width:100%;margin:0 auto}
.lk .shot img.s{width:100%;height:auto;mix-blend-mode:darken}
.lk .shot img.hl{position:absolute;left:43.7%;top:64%;width:23.8%;height:29.2%}
.lk .pk{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0 4px;font:400 17px "Permanent Marker",cursive;color:#000}
.lk .pk img{width:15px;height:15px}
.lk .rd{margin-top:10px;font-size:16px;line-height:1.4;color:#e83328;text-align:right}
.sh{padding:22px 16px 26px}
.sh h2{font:400 13px/1.3 "JetBrains Mono",ui-monospace,monospace;margin:0 0 16px 6px}
.nt{position:relative;display:block;margin:0 0 6px}
.nt:nth-of-type(even){margin-left:auto}
.nt img{position:absolute;inset:0;width:100%;height:100%}
.nt .t{position:absolute;font-size:16px;line-height:1.28;color:#000}
.nt.w .t{color:#fff}
.nt .t p+p{margin-top:8px}
.n1{width:228px;height:156px}.n1 .t{left:13.9%;top:16.6%;width:77.7%}
.n2{width:220px;height:224px}.n2 .t{left:33.4%;top:13%;width:48%}
.n3{width:270px;height:155px}.n3 .t{left:15%;top:26%;width:73.5%}
.n4{width:229px;height:260px}.n4 .t{left:17.6%;top:19.9%;width:64.4%}
.n5{width:222px;height:222px}.n5 .t{left:22.2%;top:23%;width:60.5%}
.n6{width:296px;height:170px}.n6 .t{left:5%;top:21.9%;width:87%;text-align:right}
.qa{padding:26px 22px 22px}
.qa h2{font:400 13px/1.3 "JetBrains Mono",ui-monospace,monospace}
.qa .fq-list{margin-top:22px;width:auto}
.qa .fq h3{font-size:17px}
.qa .fq-a{font-size:14px;line-height:1.4}
.qa .fq.q1[open]{min-height:0}
.qa .fq-nav{padding-top:22px;margin-top:0}
}
"""

def conv(s):
    return re.sub(r'(?<![\w.#-])(-?\d*\.?\d+)px', lambda m: f'calc(var(--u)*{m.group(1)})', s)

# 1px at 2dp inside media query are written as 1PX/1.3PX so they stay real pixels
CSS = conv(CSS_RAW).replace("PX", "px")

def build(D, FAQ, GH):
    mk = '<i class="fq-m pm" aria-hidden="true">_</i>'
    def item(i, q, a):
        o = ' q1" open' if i == 0 else '"'
        return (f'<details class="fq{o}><summary class="fq-s"><h3 class="ad">{q}</h3>{mk if i == 0 else ""}</summary><p class="fq-a ad">{a}</p></details>'
                + ('<div class="fq-sep" aria-hidden="true"></div>' if i < len(FAQ) - 1 else ""))
    faq = "".join(item(i, q, a) for i, (q, a) in enumerate(FAQ))
    def note(cls, img, paras, white=False):
        return (f'<div class="nt {cls}{" w" if white else ""}"><img src="{I}{img}.webp" alt="" loading="lazy" decoding="async">'
                f'<div class="t ad">{"".join(f"<p>{p}</p>" for p in paras)}</div></div>')
    notes = (
        note("n1", "paper32r", ["Shows up on top of whatever you are doing, even Instagram or YouTube."]) +
        note("n2", "paper07", ["Remove white, keep it as it is, or cut the person out. All on device."], True) +
        note("n3", "paper18", ["I drank and Later buttons right in the notification shade"]) +
        note("n4", "paper27", ["Your count, every day", "A small stamp keeps the glasses you finished today"]) +
        note("n5", "paper10", ["Not ready to record? Start with a sticker buddy from the presets"]) +
        note("n6", "paper08r", ["Private and<br>open source<br>No account, no ads,<br>no tracking.<br>Read every line on GitHub"], True))
    pf = lambda os, name: (f'<a class="dl b3" href="/aquaaww/water-reminder-app-for-{os}/" data-os="{os}" aria-label="Download AquaAww for {name}">{name}</a>')
    html = f'''<div id="mob">
<div id="bgl" aria-hidden="true"><i style="left:132px;top:194px;width:970px;height:851px;transform:scaleX(-1);background-image:url(/flipbook/img/torn14.webp)"></i><i style="left:-443px;top:63px;width:720px;height:888px;background-image:url(/flipbook/img/torn13.webp)"></i></div>
<div class="mw">
<header class="mtop"><a class="mback" href="/" aria-label="Back to Dusktillus home">&lt;- GO BACK</a><img class="mlogo" src="{I}863bd.svg" width="44" height="54" alt="AquaAww logo"></header>
<section class="mc sa" aria-label="Why AquaAww exists"><div class="st ad"><p>I built <a href="#m-download">AquaAww</a> because I can’t always be there to say “have some water.”</p><p>So I made something small that sits quietly on your screen and says it for me, with a smile.<br>Every sip is me looking out for you, even when I’m not in the room.</p></div>
<div class="wrow"><a class="b3" href="#m-how">Show how it works</a><span class="wife ad">_ for my loving wife</span></div>
<img class="lap" src="{I}laptop-m.webp" width="673" height="625" alt="AquaAww popping up on a Mac screen with a smile and a Drink water note" loading="lazy" decoding="async"></section>
<section class="mc sb" id="m-download"><img class="ph" src="{I}phone-m.webp" width="280" height="567" alt="AquaAww water reminder app on an iPhone" loading="lazy" decoding="async">
<div class="tx ad"><h1>AquaAww is a water reminder that comes as a person you love, not a beep.</h1><p>Upload a short video of your loved ones and it pops up on your screen with a smile, right when you need it.</p><p>Tap “I drank,” and it feels like they were there to look after you</p></div>
<div class="av jb"><span>Available</span><b class="fr">FREE</b><span>on</span></div>
<div class="av">{pf("android","Android")}{pf("windows","Windows")}{pf("mac","Mac Os")}</div></section>
<div class="lk"><div class="shot"><img class="s" src="{I}lucky.webp" width="744" height="232" alt="Feeling lucky" loading="lazy" decoding="async"><img class="hl" src="{I}7b5d9.svg" alt="" loading="lazy"></div>
<p class="pk"><img src="{I}a91a6.svg" alt="" loading="lazy">feeling lucky<img src="{I}092c9.svg" alt="" loading="lazy"></p><p class="rd ad">like to see the app on playstore,,<br>share - post / story / reel</p></div>
<section class="mc sh" id="m-how" aria-labelledby="m-how-h"><h2 id="m-how-h">what makes AquaAww special?</h2>{notes}</section>
<section class="mc qa" aria-labelledby="m-faq-h"><h2 id="m-faq-h">Questions</h2><div class="fq-list">{faq}</div>
<nav class="fq-nav jb" aria-label="More about AquaAww"><a href="/aquaaww/water-reminder-app-for-android/">Android</a><a href="/aquaaww/water-reminder-app-for-windows/">Windows</a><a href="/aquaaww/water-reminder-app-for-mac/">Mac</a><a href="/guides/">Guides</a><a href="{GH}">GitHub</a><a href="/terms/">Terms</a><a href="/privacy/">Privacy</a><a href="/unsubscribe/">Unsubscribe</a></nav></section>
</div></div>'''
    return html
