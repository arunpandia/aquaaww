#!/usr/bin/env python3
"""Generates the static pages. Edit CONFIG, run `python3 build.py`, deploy the folder."""
import os, json, html
CONFIG = dict(
    domain="https://twototango-plum.vercel.app",   # your real domain, no trailing slash (change when you connect one)
    gh="https://github.com/arunpandia/twototango",
    contact="hello@twototango.app",           # shown on the Terms and Privacy pages: put an address you read
    updated="October 2026",
)
D = CONFIG["domain"]; GH = CONFIG["gh"]; REL = GH + "/releases/latest/download/"


FAQ = [
 ("Is TwoToTango free?", "Yes. It is free, has no ads and needs no account. The code is open source on GitHub."),
 ("What does it actually do?", "You upload a short video of someone you love. At the interval you choose, that video pops up on your screen, floating over whatever you are doing, with two buttons: I drank, or remind me later."),
 ("Do my videos leave my device?", "No. Videos, settings and your daily count stay on your phone or computer. TwoToTango has no account system and no tracking inside the app."),
 ("Why does it ask to display over other apps?", "That permission lets your buddy appear on top of Instagram, YouTube or any other app. It is optional. Without it you still get a notification with the same two buttons."),
 ("Why are notifications required on Android?", "A reminder that cannot reach you is useless. Notifications carry the I drank and Later buttons, so the app asks for them on first launch."),
 ("Can I use any video?", "Yes, up to 30 MB. Choose white background removal, keep it as it is, or let the app cut the person out of any background, all on your device."),
 ("My Mac says it cannot verify the app. What now?", "The Mac build is not notarized yet. Open System Settings, go to Privacy and Security, and choose Open Anyway for TwoToTango. You only do this once. The Mac build is for Apple Silicon."),
 ("Windows shows a SmartScreen warning.", "Choose More info, then Run anyway. The installer is not code-signed yet, which is why Windows is cautious."),
 ("Android blocks the install.", "Allow your browser or file manager to install unknown apps when Android asks, then open the downloaded file again."),
]
STEPS = [
 ("Upload a video", "Pick a short clip of someone you love. Any background works."),
 ("Pick the rhythm", "Choose how often, which hours, and where on the screen they appear."),
 ("Drink, tap, done", "They pop up with a smile. Tap I drank, or ask for a nudge in 15 minutes."),
]
FEATURES = [
 ("Floats over your apps", "Shows up on top of whatever you are doing, even Instagram or YouTube."),
 ("Any background, cut out", "Remove white, keep it as it is, or cut the person out. All on device."),
 ("Real notifications", "I drank and Later buttons right in the notification shade."),
 ("Your count, every day", "A small stamp keeps the glasses you finished today."),
 ("Ready-made buddies", "Not ready to record? Start with a sticker buddy from the presets."),
 ("Private and open source", "No account, no ads, no tracking. Read every line on GitHub."),
]
CSS = open("site.css").read()
def head(title, desc, path, extra="", noindex=False):
    url = D + path
    an = '<script defer src="/_vercel/insights/script.js"></script>' 
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
{'<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="#F9F0E3">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="TwoToTango">
<meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{D}/assets/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{D}/assets/og.png">
<link rel="preload" href="/fonts/PermanentMarker-Regular.woff2" as="font" type="font/woff2" crossorigin>
<style>{CSS}</style>
{extra}{an}
</head>'''

def btn(os_, label, aria):
    return f'<button class="dl" type="submit" name="os" value="{os_}" aria-label="{aria}"><span>{label}</span></button>'

jsonld = {
 "@context":"https://schema.org","@graph":[
  {"@type":"SoftwareApplication","name":"TwoToTango","url":D+"/","applicationCategory":"HealthApplication",
   "operatingSystem":"Android, Windows, macOS","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
   "description":"A water reminder that comes as a video of someone you love. Floats over your apps with I drank and Later buttons.",
   "image":D+"/assets/og.png","downloadUrl":D+"/#download"},
  {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]}]}

index = head("TwoToTango – a water reminder that comes as someone you love",
  "Upload a video of someone you love and it pops up on your screen to remind you to drink water. Free for Android, Windows and Mac.", "/",
  extra='<script type="application/ld+json">'+json.dumps(jsonld,separators=(",",":"))+'</script>') + f'''
<body>
<a class="skip" href="#main">Skip to content</a>
<section class="hero">
  <header class="top">
    <a class="brand" href="/" aria-label="TwoToTango home"><img src="/assets/drink-water.webp" width="115" height="72" alt="Drink water"></a>
    <p class="tag">Where your loved ones come to remind you</p>
  </header>
  <main id="main" class="stage">
    <div class="letter">
      <img class="drop" src="/assets/logo.svg" width="38" height="55" alt="TwoToTango logo">
      <h1 class="sr">TwoToTango, the water reminder that comes as someone you love</h1>
      <p>I built TwoToTango because I can’t always be there to say “have some water.”</p>
      <p>So I made something small that sits quietly on your screen and says it for me, with a smile.<br>Every sip is me looking out for you, even when I’m not in the room.</p>
      <p class="sig">–for my loving wife</p>
    </div>
    <div class="get" id="download">
      <div class="frameWrap">
        <img class="frame" src="/assets/frame.svg" width="254" height="261" alt="">
        <div class="buddy" aria-hidden="true">
          <img src="/assets/buddy-cat.webp" width="311" height="360" alt="" fetchpriority="high">
          <img src="/assets/buddy-frog.webp" width="360" height="341" alt="" loading="lazy">
          <img src="/assets/buddy-duck.webp" width="293" height="360" alt="" loading="lazy">
        </div>
        <a class="note" href="#how"><img src="/assets/note-timing.webp" width="280" height="330" alt="Settings for change timing"></a>
        <a class="card" href="#faq"><img src="/assets/card-floating.webp" width="260" height="361" alt="Floating buddy"></a>
      </div>
      <form class="signup" id="signup" method="post" action="/api/subscribe" novalidate>
        <div class="fields">
          <label class="sr" for="nm">Your name</label>
          <input id="nm" name="name" type="text" placeholder="Your name" autocomplete="name" maxlength="80" required>
          <label class="sr" for="em">Your email</label>
          <input id="em" name="email" type="email" inputmode="email" placeholder="Your email" autocomplete="email" maxlength="254" required>
          <input class="hp" name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
        </div>
        <div class="dls" role="group" aria-label="Download TwoToTango, free">
          {btn("android","Android","Download TwoToTango for Android")}
          {btn("windows","Windows","Download TwoToTango for Windows")}
          {btn("mac","Mac","Download TwoToTango for Mac")}
        </div>
        <p class="msg" id="msg" role="status" aria-live="polite"></p>
        <p class="terms">By downloading you agree to our <a href="/terms/">Terms &amp; Conditions</a>, including occasional emails from TwoToTango. Unsubscribe any time.</p>
      </form>
      <p class="fine">Free · no payment · Android 5.1+, Windows 10+, Mac (Apple Silicon)</p>
    </div>
  </main>
  <footer class="low">
    <a class="presets" href="#features" aria-label="See the ready-made buddies">
      <img class="p1" src="/assets/sticker-cat.webp" width="340" height="380" alt="" loading="lazy">
      <img class="p3" src="/assets/sticker-duck.webp" width="340" height="393" alt="" loading="lazy">
      <img class="p2" src="/assets/sticker-frog.webp" width="340" height="331" alt="" loading="lazy">
      <span>{{Presets}}</span>
    </a>
    <button class="stamp" type="button" id="stamp" aria-label="Done today"><img src="/assets/stamp-done.webp" width="260" height="366" alt="" loading="lazy"><b>Done<br>today</b><i id="n">––</i></button>
  </footer>
</section>

<div class="more">
<section id="how" class="sec"><h2>How it works</h2>
  <ol class="steps">{"".join(f"<li><h3>{h}</h3><p>{p}</p></li>" for h,p in STEPS)}</ol></section>
<section id="features" class="sec"><h2>Small on purpose</h2>
  <ul class="feat">{"".join(f"<li><h3>{h}</h3><p>{p}</p></li>" for h,p in FEATURES)}</ul></section>
<section id="faq" class="sec"><h2>Questions</h2>
  {"".join(f"<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>" for q,a in FAQ)}</section>
<footer class="end"><p>Made with love, one glass at a time.</p>
  <p><a href="/water-reminder-app-for-android/">Android</a> · <a href="/water-reminder-app-for-windows/">Windows</a> · <a href="/water-reminder-app-for-mac/">Mac</a></p>
  <p><a href="{GH}">Source on GitHub</a> · <a href="/terms/">Terms &amp; Conditions</a> · <a href="/privacy/">Privacy</a> · <a href="/unsubscribe/">Unsubscribe</a></p></footer>
</div>
<script>
(function(){{
  var f=document.getElementById("signup"),m=document.getElementById("msg"),nm=document.getElementById("nm"),em=document.getElementById("em");
  var u=navigator.userAgent,os=/Android/i.test(u)?"android":/Win/i.test(u)?"windows":/Mac/i.test(u)&&!/iPhone|iPad/.test(u)?"mac":"";
  if(os){{var b=f.querySelector('.dl[value="'+os+'"]');if(b)b.classList.add("pick")}}
  try{{nm.value=localStorage.getItem("tt_name")||"";em.value=localStorage.getItem("tt_email")||""}}catch(e){{}}
  var q=new URLSearchParams(location.search).get("error");if(q)say(q,1);
  function say(t,bad){{m.textContent=t;m.className="msg"+(bad?" bad":" ok")}}
  f.addEventListener("submit",function(e){{
    var btn=e.submitter;if(!btn||!window.fetch)return;e.preventDefault();
    if(!nm.value.trim()){{say("Please tell us your name.",1);nm.focus();return}}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{{2,}}$/.test(em.value.trim())){{say("That email address does not look right.",1);em.focus();return}}
    var all=f.querySelectorAll(".dl");all.forEach(function(x){{x.disabled=true}});say("One moment…");
    fetch("/api/subscribe",{{method:"POST",headers:{{"Content-Type":"application/json",Accept:"application/json"}},
      body:JSON.stringify({{name:nm.value,email:em.value,os:btn.value,company:f.company.value}})}})
    .then(function(r){{return r.json().catch(function(){{return{{ok:false}}}})}})
    .then(function(d){{
      all.forEach(function(x){{x.disabled=false}});
      if(!d.ok){{say(d.error||"Something went wrong. Please try again.",1);return}}
      try{{localStorage.setItem("tt_name",nm.value.trim());localStorage.setItem("tt_email",em.value.trim())}}catch(e){{}}
      say("Thank you, "+nm.value.trim().split(" ")[0]+". Your download is starting.");
      location.href=d.url;
    }}).catch(function(){{all.forEach(function(x){{x.disabled=false}});say("No connection. Please try again.",1)}});
  }});
  var s=document.getElementById("stamp"),n=document.getElementById("n"),c=0;
  s.addEventListener("click",function(){{c=(c+1)%100;n.textContent=(c<10?"0":"")+c}});
}})();
</script>
</body></html>'''


def nav_footer():
    return ('<footer class="end"><p><a href="/">Home</a> · <a href="/water-reminder-app-for-android/">Android</a> · <a href="/water-reminder-app-for-windows/">Windows</a> · <a href="/water-reminder-app-for-mac/">Mac</a></p>'
            '<p><a href="/terms/">Terms &amp; Conditions</a> · <a href="/privacy/">Privacy</a> · <a href="/unsubscribe/">Unsubscribe</a></p></footer>')

def crumbs(items):
    return '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":i+1,"name":n,"item":D+p} for i,(n,p) in enumerate(items)]}, separators=(",",":")) + '</script>'

def simple(title, desc, path, body, noindex=False, extra=""):
    return head(title, desc, path, extra=extra, noindex=noindex) + f'<body class="doc"><header class="docTop"><a href="/" class="brand"><img src="/assets/drink-water.webp" width="86" height="54" alt="TwoToTango"></a></header><main class="docBody">{body}</main>{nav_footer()}</body></html>'

C = CONFIG["contact"]; U = CONFIG["updated"]

terms = simple("Terms & Conditions – TwoToTango", "The terms for downloading and using TwoToTango, including how we use your name and email and how to stop emails.", "/terms/", f"""
<h1>Terms &amp; Conditions</h1>
<p class="meta">Last updated {U}</p>
<p>These terms apply when you download or use TwoToTango (the app for Android, Windows and Mac) or this website. By downloading, you agree to them.</p>
<h2>1. What you get</h2>
<p>TwoToTango is free. It reminds you to drink water by showing a video you choose on your screen. It is open source; the code is on <a href="{GH}">GitHub</a> under its own licence.</p>
<h2>2. What we ask for, and why</h2>
<p>To download, we ask for your <strong>name</strong> and <strong>email address</strong>. We also record which platform you chose and when. We use this to send you the download, to tell you about updates, new features and related products from TwoToTango, and to count how many people use it.</p>
<h2>3. Marketing emails</h2>
<p>By downloading you agree that we may email you about TwoToTango from time to time. We will not sell your details or share them with anyone to market their own products. Every email can be stopped: use the unsubscribe link, or go to <a href="/unsubscribe/">the unsubscribe page</a>, or write to <a href="mailto:{C}">{C}</a>. We stop within a few days.</p>
<h2>4. Your videos stay with you</h2>
<p>The app keeps your videos, settings and daily count on your own device. It does not upload them to us and has no accounts or tracking inside it.</p>
<h2>5. Not medical advice</h2>
<p>TwoToTango is a friendly reminder. It is not medical advice. If you have a health condition, follow what your doctor tells you about how much to drink.</p>
<h2>6. Your content and other people</h2>
<p>Only use videos you have the right to use, and only of people who are happy for you to use them. You are responsible for what you upload to the app on your own device.</p>
<h2>7. No warranty</h2>
<p>The app and website are provided as they are. We do not promise they will always work, run without errors, or suit your device. To the extent the law allows, we are not liable for losses from using them. Nothing here limits rights you have by law that cannot be limited.</p>
<h2>8. Third-party services</h2>
<p>This website is hosted on Vercel, your details are stored with a database provider acting for us, and downloads are served from GitHub. Their own terms apply to their services.</p>
<h2>9. Your data rights</h2>
<p>You can ask to see, correct or delete the details we hold about you at any time by writing to <a href="mailto:{C}">{C}</a>. We keep your name and email until you ask us to delete them or two years after your last download, whichever comes first.</p>
<h2>10. Changes and law</h2>
<p>We may update these terms. The date at the top shows the latest version. These terms are governed by the laws of India, and courts in Chennai have jurisdiction, unless your local consumer law says otherwise.</p>
<h2>11. Contact</h2>
<p><a href="mailto:{C}">{C}</a></p>""", extra=crumbs([("Home","/"),("Terms","/terms/")]))

privacy = simple("Privacy – TwoToTango", "What TwoToTango collects, why, and how to remove your details.", "/privacy/", f"""
<h1>Privacy</h1>
<p class="meta">Last updated {U}</p>
<p>TwoToTango is built to stay out of your way, and out of your data.</p>
<h2>In the app</h2>
<ul><li>Your videos, settings and daily count are stored on your phone or computer only.</li>
<li>There are no accounts, no ads and no analytics inside the app.</li>
<li>Person cut-out runs on your device. Nothing is uploaded.</li>
<li>Android permissions are used only for notifications and, if you allow it, to show your buddy over other apps.</li></ul>
<h2>When you download from this website</h2>
<ul><li>We collect your name, email address, the platform you picked, and the time.</li>
<li>We keep a one-way scrambled form of your network address for a short time to stop automated abuse. It is not linked to your name.</li>
<li>We use your details to send the download, product updates and occasional emails, as set out in the <a href="/terms/">Terms &amp; Conditions</a>.</li>
<li>We do not sell your details. You can unsubscribe from emails or ask us to delete everything at <a href="mailto:{C}">{C}</a>.</li></ul>
<h2>Website statistics</h2>
<p>We use cookie-free page-view statistics (Vercel Web Analytics) to see how many people visit and which pages they read. No personal profile is built.</p>
<h2>Where it is stored</h2>
<p>Sign-up details are kept in a managed database (Upstash Redis through Vercel). The website runs on Vercel. Downloads are served from GitHub.</p>""", extra=crumbs([("Home","/"),("Privacy","/privacy/")]))

unsub = simple("Unsubscribe – TwoToTango", "Stop TwoToTango emails.", "/unsubscribe/", """
<h1>Unsubscribe</h1>
<p>Enter the email address you used to download TwoToTango and we will stop emailing you.</p>
<form id="uf" method="post" action="/api/unsubscribe" class="uform">
  <label class="sr" for="ue">Email address</label>
  <input id="ue" name="email" type="email" placeholder="Your email" autocomplete="email" required maxlength="254">
  <button class="dl" type="submit"><span>Unsubscribe</span></button>
</form>
<p class="msg" id="um" role="status" aria-live="polite"></p>
<script>
(function(){var u=new URLSearchParams(location.search).get("done"),m=document.getElementById("um");
if(u==="1"){m.textContent="Done. You will not get any more emails from us.";m.className="msg ok"}
if(u==="0"){m.textContent="That did not work. Please check the address and try again.";m.className="msg bad"}})();
</script>""", noindex=True)

PLAT = {
 "android": dict(slug="water-reminder-app-for-android", name="Android", h1="Water reminder app for Android",
   title="Water Reminder App for Android – Floating Video Buddy | TwoToTango",
   desc="Free Android drink-water reminder that shows a video of someone you love over your apps, with I drank and Later buttons. APK download, no account.",
   intro="TwoToTango turns the usual water-reminder beep into a short video of someone you love. On Android it floats over whatever you are doing, so a reminder in the middle of Instagram or YouTube is hard to miss, and it also sends a notification with the same two buttons.",
   req=["Android 5.1 or newer","About 20 MB of space","Notifications allowed (the app asks on first launch)","Optional: permission to display over other apps for the floating buddy"],
   steps=["Fill in your name and email on the home page and tap Android. The file TwoToTango.apk downloads.","Open the file. If Android blocks it, allow your browser or file manager to install unknown apps, then open the file again.","Open TwoToTango. Allow notifications when asked, then allow display over other apps if you want the floating buddy.","Upload a short video, choose how often and which hours, and you are done."],
   tips=["Keep the video under 30 MB and about 3 to 6 seconds long.","If reminders stop on some phones, set battery use for TwoToTango to Unrestricted in Android settings.","Use Test reminder in the app to see exactly what you will get."]),
 "windows": dict(slug="water-reminder-app-for-windows", name="Windows", h1="Water reminder app for Windows",
   title="Water Reminder App for Windows – Video Pop-up Buddy | TwoToTango",
   desc="Free Windows 10 and 11 drink-water reminder that pops a video of someone you love onto your screen. Tray app, custom position, no account.",
   intro="TwoToTango lives in your system tray and, at the interval you choose, pops up a short video of someone you love in the corner of your screen you prefer, with I drank and Later buttons. It stays out of the way until it is time.",
   req=["Windows 10 or 11, 64-bit","About 300 MB of disk space","No account and no internet needed after the download"],
   steps=["Fill in your name and email on the home page and click Windows. The installer downloads.","Run TwoToTango-Setup.exe. If SmartScreen appears, choose More info, then Run anyway. The installer is not code-signed yet.","Find the TwoToTango icon near the clock. Right-click it to pick your video, interval, active hours and screen position.","Choose Remind me now to see how it looks."],
   tips=["Turn on Launch at login so it is always there.","Drag the reminder to any spot on any monitor with Set position.","Use snooze when you are in a meeting."]),
 "mac": dict(slug="water-reminder-app-for-mac", name="Mac", h1="Water reminder app for Mac",
   title="Water Reminder App for Mac – Menu Bar Video Buddy | TwoToTango",
   desc="Free Mac menu-bar drink-water reminder that plays a video of someone you love over your desktop, even in full-screen apps. Apple Silicon, no account.",
   intro="TwoToTango sits quietly in your menu bar. When it is time, a short video of someone you love appears on your screen, even over full-screen apps, with I drank and Later buttons. Pick the interval, active hours and the exact spot on screen.",
   req=["A Mac with Apple Silicon (M1 or newer)","macOS 11 or newer","About 350 MB of disk space"],
   steps=["Fill in your name and email on the home page and click Mac. A .dmg file downloads.","Open it and drag TwoToTango into Applications.","The first time, macOS may say it cannot verify the app. Open System Settings, go to Privacy and Security, and choose Open Anyway.","Click the drop icon in the menu bar to choose your video, interval and position."],
   tips=["Turn on Launch at login from the menu bar icon.","Use a square video; the app crops to the centre.","Intel Macs are not supported yet."]),
}
def platform_page(k):
    p = PLAT[k]; li = lambda a: "".join(f"<li>{html.escape(x)}</li>" for x in a)
    body = f"""<h1>{p['h1']}</h1>
<p class="lead">{p['intro']}</p>
<p><a class="cta" href="/#download">Download free for {p['name']}</a></p>
<h2>What you need</h2><ul>{li(p['req'])}</ul>
<h2>How to install on {p['name']}</h2><ol>{li(p['steps'])}</ol>
<h2>Tips</h2><ul>{li(p['tips'])}</ul>
<h2>Also available on</h2><p>{" · ".join(f'<a href="/{PLAT[o]["slug"]}/">{PLAT[o]["name"]}</a>' for o in PLAT if o != k)}</p>"""
    ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"SoftwareApplication","name":"TwoToTango for "+p['name'],"operatingSystem":p['name'],
        "applicationCategory":"HealthApplication","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"description":p['desc'],"url":D+"/"+p['slug']+"/"}, separators=(",",":")) + '</script>' + crumbs([("Home","/"),(p['name'],"/"+p['slug']+"/")])
    return simple(p['title'], p['desc'], "/"+p['slug']+"/", body, extra=ld)

os.makedirs("privacy", exist_ok=True); os.makedirs("terms", exist_ok=True); os.makedirs("unsubscribe", exist_ok=True)
open("index.html","w").write(index); open("privacy/index.html","w").write(privacy); open("terms/index.html","w").write(terms)
open("unsubscribe/index.html","w").write(unsub)
nf = simple("Page not found – TwoToTango", "This page does not exist.", "/404.html", '<h1>Not found</h1><p>That page wandered off. <a href="/">Back to the reminder.</a></p>', noindex=True)
open("404.html","w").write(nf)
urls = [("/",1.0),("/water-reminder-app-for-android/",.8),("/water-reminder-app-for-windows/",.8),("/water-reminder-app-for-mac/",.8),("/terms/",.3),("/privacy/",.3)]
for k in PLAT:
    os.makedirs(PLAT[k]["slug"], exist_ok=True); open(PLAT[k]["slug"]+"/index.html","w").write(platform_page(k))
open("robots.txt","w").write(f"User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {D}/sitemap.xml\n")
import datetime; today = datetime.date.today().isoformat()
open("sitemap.xml","w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{D}{u}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>\n" for u,pr in urls) + '</urlset>\n')
print("built", len(index), "bytes index")
