#!/usr/bin/env python3
"""Generates the static pages. Edit CONFIG, run `python3 build.py`, deploy the folder."""
import os, json, html, datetime
CONFIG = dict(
    domain="https://dusktillus.store",         # your real domain, no trailing slash
    gh="https://github.com/arunpandia/aquaaww",
    contact="contact@dusktillus.store",          # shown on the Terms and Privacy pages: set up forwarding for this address
    updated="October 2026",
    hub_live=False,                           # False: the domain root shows AquaAww. Set True (and remove the "/" rewrite in vercel.json) when the Dusktillus hub should go live
    google_verification="",                   # paste the token from Search Console if you verify with an HTML tag
)
D = CONFIG["domain"]; GH = CONFIG["gh"]; REL = GH + "/releases/latest/download/"


FAQ = [
 ("Is AquaAww free?", "Yes. It is free, has no ads and needs no account. The code is open source on GitHub."),
 ("What does it actually do?", "You upload a short video of someone you love. At the interval you choose, that video pops up on your screen, floating over whatever you are doing, with two buttons: I drank, or remind me later."),
 ("Do my videos leave my device?", "No. Videos, settings and your daily count stay on your phone or computer. AquaAww has no account system and no tracking inside the app."),
 ("Why does it ask to display over other apps?", "That permission lets your buddy appear on top of Instagram, YouTube or any other app. It is optional. Without it you still get a notification with the same two buttons."),
 ("Why are notifications required on Android?", "A reminder that cannot reach you is useless. Notifications carry the I drank and Later buttons, so the app asks for them on first launch."),
 ("Can I use any video?", "Yes, up to 30 MB. Choose white background removal, keep it as it is, or let the app cut the person out of any background, all on your device."),
 ("My Mac says it cannot verify the app. What now?", "The Mac build is not notarized yet. Open System Settings, go to Privacy and Security, and choose Open Anyway for AquaAww. You only do this once. The Mac build is for Apple Silicon."),
 ("Windows shows a SmartScreen warning.", "Choose More info, then Run anyway. The installer is not code-signed yet, which is why Windows is cautious."),
 ("Android blocks the install.", "Allow your browser or file manager to install unknown apps when Android asks, then open the downloaded file again."),
 ("Found a bug? Report it.", "Email a screenshot (or a short screen recording) and a line about what happened to " + CONFIG["contact"] + ". Tell us which device you use and which AquaAww version, if you know it."),
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
def head(title, desc, path, extra="", noindex=False, css=None, og="/assets/og-aquaaww.png", fonts=True, theme="#F9F0E3", site="AquaAww"):
    url = D + path
    an = '<script defer src="/_vercel/insights/script.js"></script>'
    gv = f'<meta name="google-site-verification" content="{CONFIG["google_verification"]}">' if CONFIG.get('google_verification') else ''
    return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
{'<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="{theme}">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"><link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/assets/apple-touch-icon-v3.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="{site}">
<meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{D}{og}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{D}{og}">
{'<link rel="preload" href="/fonts/PermanentMarker-Regular.woff2" as="font" type="font/woff2" crossorigin>' if fonts else ""}
<style>{css or CSS}</style>
{gv}{extra}{an}
<script>document.addEventListener("dragstart",function(e){{if(e.target&&e.target.tagName==="IMG")e.preventDefault()}});</script>
</head>'''

def btn(os_, label, aria):
    return f'<button class="dl" type="button" data-os="{os_}" aria-label="{aria}"><span>{label}</span></button>'

jsonld = {
 "@context":"https://schema.org","@graph":[
  {"@type":"SoftwareApplication","name":"AquaAww","url":D+"/aquaaww/","publisher":{"@type":"Organization","name":"Dusktillus","url":D+"/"},"applicationCategory":"HealthApplication",
   "operatingSystem":"Android, Windows, macOS","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
   "description":"A water reminder that comes as a video of someone you love. Floats over your apps with I drank and Later buttons.",
   "image":D+"/assets/og-aquaaww.png","downloadUrl":D+"/aquaaww/#download"},
  {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]}]}

import aquaaww_m, paper
AQ_CSS = open("aquaaww.css").read() + aquaaww_m.CSS + aquaaww_m.EXTRA_CSS
AQ_BODY = open("aquaaww_body.html").read().replace("<!--FAQ-->", aquaaww_m.faq_desktop(FAQ, GH))
jsonld["@graph"][0]["downloadUrl"] = D+"/aquaaww/#download"
jsonld["@graph"].append({"@type":"WebPage","@id":D+"/aquaaww/","url":D+"/aquaaww/","name":"AquaAww – a water reminder that comes as someone you love","isPartOf":{"@type":"WebSite","name":"Dusktillus","url":D+"/"},
  "about":{"@type":"SoftwareApplication","name":"AquaAww"},"primaryImageOfPage":{"@type":"ImageObject","url":D+"/assets/og-aquaaww.png"}})
PRE = '<link rel="preload" href="/flipbook/fonts/ArchitectsDaughter.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/flipbook/fonts/PermanentMarker-Regular.woff2" as="font" type="font/woff2" crossorigin>'
index = head("AquaAww – a water reminder that comes as someone you love",
  "Upload a video of someone you love and it pops up on your screen to remind you to drink water. Free for Android, Windows and Mac.", "/aquaaww/",
  css=AQ_CSS, fonts=False,
  extra=PRE+aquaaww_m.FUND_BOOT+'<script type="application/ld+json">'+json.dumps(jsonld,separators=(",",":"))+'</script>') + f'''
<body>
<div id="bgfit" aria-hidden="true"><div id="bgst"><i id="b0"></i><i id="b1"></i><i id="b2"></i></div></div>
<img id="sun" src="/aquaaww/img/863bd.svg" width="83" height="101" alt="AquaAww logo">
<main id="stage">{AQ_BODY}</main>
{aquaaww_m.build(D, FAQ, GH)}
{aquaaww_m.DEMO_HTML}
{aquaaww_m.FUND_HTML}
<dialog id="dlg" aria-labelledby="dt">
  <form id="signup" method="post" action="/api/subscribe" novalidate>
    <button class="x" type="button" id="dx" aria-label="Close"><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg></button>
    <h2 id="dt">Almost there</h2>
    <p class="sub">Tell us who to thank and your <b id="osn">Mac</b> download starts.</p>
    <input type="hidden" name="os" id="os" value="">
    <label class="sr" for="nm">Your name</label>
    <input id="nm" name="name" type="text" placeholder="Your name" autocomplete="name" maxlength="80" required>
    <label class="sr" for="em">Your email</label>
    <input id="em" name="email" type="email" inputmode="email" placeholder="Your email" autocomplete="email" maxlength="254" required>
    <input class="hp" name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
    <p class="msg" id="msg" role="status" aria-live="polite"></p>
    <button class="go" type="submit" id="go">Download free</button>
    <p class="terms">By downloading you agree to our <a href="/terms/">Terms &amp; Conditions</a>. Now and then we will share something new from the garage.</p>
  </form>
</dialog>
<script>
(function(){{
  var st=document.getElementById("stage"),sun=document.getElementById("sun"),bg=document.getElementById("bgst");
  function size(){{
    var w=innerWidth,h=innerHeight,s=w>=1280?w/1280:Math.min(1,w/880),c=Math.max(w/1280,h/832)*1.05,k=Math.min(w/880,h/832);
    st.style.zoom=s;
    var ms=document.getElementById("mstage");ms.style.zoom=w<700?Math.min(w,700)/402:"";
    if(w>=700)sun.style.cssText="right:"+(51*k)+"px;top:"+(42*k)+"px;width:"+(83*k)+"px;height:"+(101.48*k)+"px";else sun.style.cssText="";
    bg.style.transform="translate("+(-640*c)+"px,"+(-416*c)+"px) scale("+c+")";
  }}
  size();addEventListener("resize",size);
{aquaaww_m.DEMO_JS}{aquaaww_m.GOAL_JS}{aquaaww_m.FUND_JS}
  var d=document.getElementById("dlg"),f=document.getElementById("signup"),m=document.getElementById("msg"),nm=document.getElementById("nm"),em=document.getElementById("em"),go=document.getElementById("go"),osf=document.getElementById("os"),osn=document.getElementById("osn");
  var NAMES={{android:"Android",windows:"Windows",mac:"Mac"}};
  var u=navigator.userAgent,my=/Android/i.test(u)?"android":/Win/i.test(u)?"windows":/Mac/i.test(u)&&!/iPhone|iPad/.test(u)?"mac":"";
  try{{nm.value=localStorage.getItem("tt_name")||"";em.value=localStorage.getItem("tt_email")||""}}catch(e){{}}
  function say(t,bad){{m.textContent=t;m.className="msg"+(bad?" bad":" ok")}}
  function ping(e,os){{try{{navigator.sendBeacon("/api/track",new Blob([JSON.stringify({{e:e,os:os}})],{{type:"application/json"}}))}}catch(x){{}}}}
  var done=false;
  function open(os){{
    done=false;ping("open",os);
    osf.value=os;osn.textContent=NAMES[os];say("");go.disabled=false;go.textContent="Download free";
    if(d.showModal){{d.showModal()}}else{{d.setAttribute("open","")}}
    (nm.value?em:nm).focus();
  }}
  document.querySelectorAll("a.dl").forEach(function(b){{b.addEventListener("click",function(e){{e.preventDefault();open(b.dataset.os)}})}});
  d.addEventListener("close",function(){{if(!done)ping("close",osf.value)}});
  document.getElementById("dx").addEventListener("click",function(){{d.close()}});
  d.addEventListener("click",function(e){{if(e.target===d)d.close()}});
  var q=new URLSearchParams(location.search).get("error");if(q){{open(my||"android");say(q,1)}}
  f.addEventListener("submit",function(e){{
    if(!window.fetch)return;e.preventDefault();
    if(!nm.value.trim()){{say("Please tell us your name.",1);nm.focus();return}}
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{{2,}}$/.test(em.value.trim())){{say("That email address does not look right.",1);em.focus();return}}
    go.disabled=true;say("One moment…");
    fetch("/api/subscribe",{{method:"POST",headers:{{"Content-Type":"application/json",Accept:"application/json"}},
      body:JSON.stringify({{name:nm.value,email:em.value,os:osf.value,company:f.company.value}})}})
    .then(function(r){{return r.json().catch(function(){{return{{ok:false}}}})}})
    .then(function(r){{
      if(!r.ok){{go.disabled=false;say(r.error||"Something went wrong. Please try again.",1);return}}
      try{{localStorage.setItem("tt_name",nm.value.trim());localStorage.setItem("tt_email",em.value.trim())}}catch(e){{}}
      say("Thank you, "+nm.value.trim().split(" ")[0]+". Your download is starting.");go.textContent="Done";done=true;
      location.href=r.url;setTimeout(function(){{d.close()}},2500);
    }}).catch(function(){{go.disabled=false;say("No connection. Please try again.",1)}});
  }});
}})();
</script>
</body></html>'''


def nav_footer():
    return ('<footer class="end"><p><a href="/">Dusktillus</a> · <a href="/aquaaww/">AquaAww</a> · <a href="/guides/">Guides</a> · <a href="/aquaaww/water-reminder-app-for-android/">Android</a> · <a href="/aquaaww/water-reminder-app-for-windows/">Windows</a> · <a href="/aquaaww/water-reminder-app-for-mac/">Mac</a></p>'
            '<p><a href="/terms/">Terms &amp; Conditions</a> · <a href="/privacy/">Privacy</a> · <a href="/unsubscribe/">Unsubscribe</a></p></footer>')

def crumbs(items):
    return '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":i+1,"name":n,"item":D+p} for i,(n,p) in enumerate(items)]}, separators=(",",":")) + '</script>'

def simple(title, desc, path, body, noindex=False, extra="", product=True, back="/aquaaww/"):
    return head(title, desc, path, extra=extra+paper.PRELOAD, noindex=noindex, css=paper.CSS, fonts=False) + paper.body(body, back)

C = CONFIG["contact"]; U = CONFIG["updated"]

terms = simple("Terms & Conditions – Dusktillus", "The terms for downloading and using AquaAww, including how we use your name and email and how to stop emails.", "/terms/", f"""
<h1>Terms &amp; Conditions</h1>
<p class="meta">Last updated {U}</p>
<p>These terms apply when you download or use any Dusktillus product, including AquaAww (the app for Android, Windows and Mac), or this website. By downloading, you agree to them.</p>
<h2>1. What you get</h2>
<p>AquaAww is free. It reminds you to drink water by showing a video you choose on your screen. It is open source; the code is on <a href="{GH}">GitHub</a> under its own licence.</p>
<h2>2. What we ask for, and why</h2>
<p>To download, we ask for your <strong>name</strong> and <strong>email address</strong>. We also record which platform you chose and when. We use this to send you the download, to tell you about updates, new features and related products from Dusktillus, and to count how many people use it.</p>
<h2>3. Marketing emails</h2>
<p>By downloading you agree that we may email you about Dusktillus and AquaAww from time to time. We will not sell your details or share them with anyone to market their own products. Every email can be stopped: use the unsubscribe link, or go to <a href="/unsubscribe/">the unsubscribe page</a>, or write to <a href="mailto:{C}">{C}</a>. We stop within a few days.</p>
<h2>4. Your videos stay with you</h2>
<p>The app keeps your videos, settings and daily count on your own device. It does not upload them to us and has no accounts or tracking inside it.</p>
<h2>5. Not medical advice</h2>
<p>AquaAww is a friendly reminder. It is not medical advice. If you have a health condition, follow what your doctor tells you about how much to drink.</p>
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
<p><a href="mailto:{C}">{C}</a></p>""", extra=crumbs([("Dusktillus","/"),("Terms","/terms/")]), product=False)

privacy = simple("Privacy – Dusktillus", "What AquaAww collects, why, and how to remove your details.", "/privacy/", f"""
<h1>Privacy</h1>
<p class="meta">Last updated {U}</p>
<p>AquaAww is built to stay out of your way, and out of your data.</p>
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
<p>We measure how the website is used so we can improve it. Vercel Web Analytics gives cookie-free page-view counts. In addition, a small script of our own records page views, which buttons and links are clicked and where on the page (for heatmaps), how far down a page people scroll, how long they stay, which site they came from, your country, and the type of device and browser. It keeps one random visitor id in your browser's local storage (not a cookie) so we can tell new visitors from returning ones. It does not record your IP address, anything you type, or your name, and we do not sell this data. If your browser sends Do Not Track or Global Privacy Control, the script does nothing. Clearing your browser's site data resets the id.</p>
<h2>Accounts, orders and support</h2>
<p>If you sign in, we ask for your email address and send you a one-time code; there are no passwords. When you buy something we keep your name, email, phone number, delivery address (for physical orders), what you bought and the payment status. Payments are handled by Razorpay and we never see your card details. We use this to deliver your order, show you its tracking, answer support requests and keep our accounting records. Support messages are stored with your ticket. Write to <a href="mailto:{C}">{C}</a> to have your account deleted; we may keep order records where the law requires it.</p>
<h2>Where it is stored</h2>
<p>Sign-up, account and order details are kept in a managed database (Upstash Redis through Vercel). The website runs on Vercel. Downloads are served from GitHub. Sign-in codes and order emails are sent through Resend. Payments are processed by Razorpay.</p>""", extra=crumbs([("Dusktillus","/"),("Privacy","/privacy/")]), product=False)

refund = simple("Refund & Cancellation Policy – Dusktillus", "How cancellations, returns and refunds work for Dusktillus shop orders, physical and digital.", "/refund-policy/", f"""
<h1>Refund &amp; Cancellation Policy</h1>
<p class="meta">Last updated {U}</p>
<p>This policy covers products bought from Dusktillus, both physical items and digital downloads. AquaAww itself is free, so nothing about it is refundable.</p>
<h2>1. Cancelling an order</h2>
<p>You can cancel a physical order any time before we dispatch it. Write to <a href="mailto:{C}">{C}</a> with your order number and we will cancel it and refund you in full. Once an order is dispatched it can no longer be cancelled, but you can still return it under section 3.</p>
<h2>2. Digital products</h2>
<p>A digital product is delivered as a download link as soon as payment is confirmed. Because it can be used straight away, we cannot take it back. We will refund you in full if the file is damaged, does not open, is not what was described, or the download link does not reach you within 7 days of payment. Tell us at <a href="mailto:{C}">{C}</a> with your order number.</p>
<h2>3. Physical products: returns and replacements</h2>
<p>If your item arrives damaged, defective or different from what you ordered, write to <a href="mailto:{C}">{C}</a> within 7 days of delivery with your order number and clear photos of the item and its packaging. We will send a replacement or refund you, whichever you prefer, and we will pay the return shipping if it is needed. Items that are used, or damaged after delivery, cannot be returned.</p>
<h2>4. How refunds are paid</h2>
<p>Refunds go back to the original payment method through Razorpay. After we approve a refund, it usually reaches you within 5 to 7 working days, depending on your bank or card issuer.</p>
<h2>5. Contact</h2>
<p>Questions about a refund? Write to <a href="mailto:{C}">{C}</a> and include your order number.</p>""", extra=crumbs([("Dusktillus","/"),("Refund & Cancellation","/refund-policy/")]), product=False)

shipping = simple("Shipping Policy – Dusktillus", "Where Dusktillus ships physical orders, how long delivery takes, what it costs, and how digital products are delivered.", "/shipping-policy/", f"""
<h1>Shipping Policy</h1>
<p class="meta">Last updated {U}</p>
<h2>1. Where we ship</h2>
<p>Physical products ship only inside India, to any valid 6-digit PIN code we can deliver to. We do not ship physical products outside India at the moment. Digital products can be bought from anywhere.</p>
<h2>2. Dispatch and delivery time</h2>
<p>We dispatch paid orders within 2 to 4 working days. Delivery usually takes a further 4 to 10 working days depending on your location. These are estimates, not promises, and delays can happen around festivals and in remote areas.</p>
<h2>3. Shipping charges</h2>
<p>Shipping is a flat fee per order, shown at checkout before you pay. Orders above the free-shipping amount shown at checkout ship free. Digital products have no shipping charge.</p>
<h2>4. Tracking</h2>
<p>When your order is dispatched we record the courier and tracking number against your order. Write to <a href="mailto:{C}">{C}</a> with your order number if you would like them.</p>
<h2>5. Digital products</h2>
<p>Digital products are not shipped. Right after payment is confirmed you get a download link on the order confirmation. Each link works for a limited number of downloads and for 60 days, so please save the file once you have it.</p>
<h2>6. Wrong address or failed delivery</h2>
<p>Please check your address and mobile number before paying, because the courier will call it. If a delivery fails because of a wrong or incomplete address, we can try again once; extra shipping may be charged. Write to <a href="mailto:{C}">{C}</a> as soon as you notice a problem.</p>
<h2>7. Damaged in transit</h2>
<p>If your parcel looks damaged when it arrives, take a photo before opening it and follow the steps in our <a href="/refund-policy/">Refund &amp; Cancellation Policy</a>.</p>""", extra=crumbs([("Dusktillus","/"),("Shipping","/shipping-policy/")]), product=False)

contact = simple("Contact Dusktillus", "How to reach Dusktillus for orders, refunds, bug reports and anything else.", "/contact/", f"""
<h1>Contact us</h1>
<p>The quickest way to reach us is email. We read everything that comes in and reply within 2 working days.</p>
<p><a href="mailto:{C}">{C}</a></p>
<h2>What to include</h2>
<ul><li>For an order: your order number and the email address you used.</li>
<li>For a bug in AquaAww: a screenshot, your device, and the app version if you know it.</li>
<li>For a refund or cancellation: see our <a href="/refund-policy/">Refund &amp; Cancellation Policy</a>.</li></ul>
<h2>More</h2>
<p><a href="/shipping-policy/">Shipping Policy</a> · <a href="/terms/">Terms &amp; Conditions</a> · <a href="/privacy/">Privacy</a></p>""", extra=crumbs([("Dusktillus","/"),("Contact","/contact/")]), product=False)

unsub = simple("Unsubscribe – Dusktillus", "Stop AquaAww emails.", "/unsubscribe/", """
<h1>Unsubscribe</h1>
<p>Enter the email address you used to download AquaAww and we will stop emailing you.</p>
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
</script>""", noindex=True, product=False)

PLAT = {
 "android": dict(slug="water-reminder-app-for-android", name="Android", h1="Water reminder app for Android",
   title="Water Reminder App for Android – Floating Video Buddy | AquaAww",
   desc="Free Android drink-water reminder that shows a video of someone you love over your apps, with I drank and Later buttons. APK download, no account.",
   intro="AquaAww turns the usual water-reminder beep into a short video of someone you love. On Android it floats over whatever you are doing, so a reminder in the middle of Instagram or YouTube is hard to miss, and it also sends a notification with the same two buttons.",
   req=["Android 5.1 or newer","About 20 MB of space","Notifications allowed (the app asks on first launch)","Optional: permission to display over other apps for the floating buddy"],
   steps=["Fill in your name and email on the AquaAww page and tap Android. The file AquaAww.apk downloads.","Open the file. If Android blocks it, allow your browser or file manager to install unknown apps, then open the file again.","Open AquaAww. Allow notifications when asked, then allow display over other apps if you want the floating buddy.","Upload a short video, choose how often and which hours, and you are done."],
   tips=["Keep the video under 30 MB and about 3 to 6 seconds long.","If reminders stop on some phones, set battery use for AquaAww to Unrestricted in Android settings.","Use Test reminder in the app to see exactly what you will get."]),
 "windows": dict(slug="water-reminder-app-for-windows", name="Windows", h1="Water reminder app for Windows",
   title="Water Reminder App for Windows – Video Pop-up Buddy | AquaAww",
   desc="Free Windows 10 and 11 drink-water reminder that pops a video of someone you love onto your screen. Tray app, custom position, no account.",
   intro="AquaAww lives in your system tray and, at the interval you choose, pops up a short video of someone you love in the corner of your screen you prefer, with I drank and Later buttons. It stays out of the way until it is time.",
   req=["Windows 10 or 11, 64-bit","About 300 MB of disk space","No account and no internet needed after the download"],
   steps=["Fill in your name and email on the AquaAww page and click Windows. The installer downloads.","Run AquaAww-Setup.exe. If SmartScreen appears, choose More info, then Run anyway. The installer is not code-signed yet.","Find the AquaAww icon near the clock. Right-click it to pick your video, interval, active hours and screen position.","Choose Remind me now to see how it looks."],
   tips=["Turn on Launch at login so it is always there.","Drag the reminder to any spot on any monitor with Set position.","Use snooze when you are in a meeting."]),
 "mac": dict(slug="water-reminder-app-for-mac", name="Mac", h1="Water reminder app for Mac",
   title="Water Reminder App for Mac – Menu Bar Video Buddy | AquaAww",
   desc="Free Mac menu-bar drink-water reminder that plays a video of someone you love over your desktop, even in full-screen apps. Apple Silicon, no account.",
   intro="AquaAww sits quietly in your menu bar. When it is time, a short video of someone you love appears on your screen, even over full-screen apps, with I drank and Later buttons. Pick the interval, active hours and the exact spot on screen.",
   req=["A Mac with Apple Silicon (M1 or newer)","macOS 11 or newer","About 350 MB of disk space"],
   steps=["Fill in your name and email on the AquaAww page and click Mac. A .dmg file downloads.","Open it and drag AquaAww into Applications.","The first time, macOS may say it cannot verify the app. Open System Settings, go to Privacy and Security, and choose Open Anyway.","Click the drop icon in the menu bar to choose your video, interval and position."],
   tips=["Turn on Launch at login from the menu bar icon.","Use a square video; the app crops to the centre.","Intel Macs are not supported yet."]),
}
def platform_page(k):
    p = PLAT[k]; li = lambda a: "".join(f"<li>{html.escape(x)}</li>" for x in a)
    body = f"""<h1>{p['h1']}</h1>
<p class="lead">{p['intro']}</p>
<p><a class="cta" href="/aquaaww/#download">Download free for {p['name']}</a></p>
<h2>What you need</h2><ul>{li(p['req'])}</ul>
<h2>How to install on {p['name']}</h2><ol>{li(p['steps'])}</ol>
<h2>Tips</h2><ul>{li(p['tips'])}</ul>
<h2>Also available on</h2><p>{" · ".join(f'<a href="/aquaaww/{PLAT[o]["slug"]}/">{PLAT[o]["name"]}</a>' for o in PLAT if o != k)}</p>"""
    ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"SoftwareApplication","name":"AquaAww for "+p['name'],"operatingSystem":p['name'],
        "applicationCategory":"HealthApplication","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"description":p['desc'],"url":D+"/aquaaww/"+p['slug']+"/"}, separators=(",",":")) + '</script>' + crumbs([("Dusktillus","/"),("AquaAww","/aquaaww/"),(p['name'],"/aquaaww/"+p['slug']+"/")])
    return simple(p['title'], p['desc'], "/aquaaww/"+p['slug']+"/", body, extra=ld)

os.makedirs("privacy", exist_ok=True); os.makedirs("terms", exist_ok=True); os.makedirs("unsubscribe", exist_ok=True)
os.makedirs("aquaaww", exist_ok=True); open("aquaaww/index.html","w").write(index); open("privacy/index.html","w").write(privacy); open("terms/index.html","w").write(terms)
open("unsubscribe/index.html","w").write(unsub)
for _d,_p in (("refund-policy",refund),("shipping-policy",shipping),("contact",contact)):
    os.makedirs(_d, exist_ok=True); open(_d+"/index.html","w").write(_p)
nf = simple("Page not found – AquaAww", "This page does not exist.", "/404.html", '<h1>Not found</h1><p>That page wandered off. <a href="/">Back to Dusktillus.</a></p>', noindex=True)
open("404.html","w").write(nf)
urls = [("/",1.0),("/aquaaww/",1.0),("/aquaaww/water-reminder-app-for-android/",.8),("/aquaaww/water-reminder-app-for-windows/",.8),("/aquaaww/water-reminder-app-for-mac/",.8),("/terms/",.3),("/privacy/",.3),("/refund-policy/",.3),("/shipping-policy/",.3),("/contact/",.3)]
INDEXNOW_KEY="46e38df86886c2acf8c947a8ecbe50db"
for k in PLAT:
    d="aquaaww/"+PLAT[k]["slug"]; os.makedirs(d, exist_ok=True); open(d+"/index.html","w").write(platform_page(k))

# ---------------- Guides (content that people search for) ----------------
from guides import ARTICLES
_today = datetime.date.today().isoformat()
def article_page(a):
    others = [x for x in ARTICLES if x["slug"] != a["slug"]]
    rel = "".join(f'<li><a href="/guides/{x["slug"]}/">{html.escape(x["h1"])}</a></li>' for x in others[:3])
    faq = a.get("faq", [])
    body = f"""<p class="meta">Updated {U} · {a['read']} read</p><h1>{html.escape(a['h1'])}</h1>{a['body']}
<div class="pcta"><h2>Never forget again</h2><p>AquaAww pops up a short video of someone you love to remind you to drink water. Free for Android, Windows and Mac.</p><p><a class="cta" href="/aquaaww/#download">Download free</a></p></div>
<h2>More guides</h2><ul>{rel}</ul>"""
    ld = {"@context":"https://schema.org","@graph":[
      {"@type":"Article","headline":a["title"],"description":a["desc"],"datePublished":_today,"dateModified":_today,
       "mainEntityOfPage":D+"/guides/"+a["slug"]+"/","image":D+"/assets/og-aquaaww.png",
       "author":{"@type":"Organization","name":"Dusktillus","url":D+"/"},"publisher":{"@type":"Organization","name":"Dusktillus","logo":{"@type":"ImageObject","url":D+"/assets/logo-512.png"}}}]}
    if faq: ld["@graph"].append({"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":t}} for q,t in faq]})
    extra = '<script type="application/ld+json">'+json.dumps(ld,separators=(",",":"))+'</script>'+crumbs([("Dusktillus","/"),("Guides","/guides/"),(a["h1"],"/guides/"+a["slug"]+"/")])
    return simple(a["title"], a["desc"], "/guides/"+a["slug"]+"/", body, extra=extra, back="/guides/")
os.makedirs("guides", exist_ok=True)
for a in ARTICLES:
    os.makedirs("guides/"+a["slug"], exist_ok=True); open("guides/"+a["slug"]+"/index.html","w").write(article_page(a))
gl = "".join(f'<li><a href="/guides/{a["slug"]}/"><b>{html.escape(a["h1"])}</b><span>{html.escape(a["desc"])}</span></a></li>' for a in ARTICLES)
open("guides/index.html","w").write(simple("Water & Hydration Guides – Dusktillus","Simple, practical guides on how much water to drink, how to remember to drink it, and how to help someone you love stay hydrated.","/guides/",
  f'<h1>Water and hydration guides</h1><p class="lead">Plain answers on drinking enough water, and how to make it a habit.</p><ul class="glist">{gl}</ul>',
  extra=crumbs([("Dusktillus","/"),("Guides","/guides/")])))
urls += [("/guides/",.7)] + [("/guides/"+a["slug"]+"/",.7) for a in ARTICLES]
open("robots.txt","w").write(f"User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: {D}/sitemap.xml\n")
import datetime; today = datetime.date.today().isoformat()
open("sitemap.xml","w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{D}{u}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>\n" for u,pr in urls) + '</urlset>\n')

# ---------------- Dusktillus hub (home of all products) ----------------
HUBCSS = open("hub.css").read()
PRODUCTS = [
  dict(name="AquaAww", path="/aquaaww/", img="/assets/drink-water.webp", w=340, h=212,
       blurb="A water reminder that comes as someone you love. Floats over your apps with I drank and Later buttons.",
       tags=["Android","Windows","Mac","Free"]),
]
hub_ld = {"@context":"https://schema.org","@graph":[
  {"@type":"Organization","@id":D+"/#org","name":"Dusktillus","url":D+"/","logo":D+"/assets/logo-512.png","sameAs":[GH.rsplit("/",1)[0],"https://www.instagram.com/dusktillus/"]},
  {"@type":"WebSite","@id":D+"/#site","url":D+"/","name":"Dusktillus","publisher":{"@id":D+"/#org"}},
  {"@type":"ItemList","name":"Dusktillus apps","itemListElement":[{"@type":"ListItem","position":i+1,"url":D+p["path"],"name":p["name"]} for i,p in enumerate(PRODUCTS)]}]}
cards = "".join(f'<a class="card app" href="{p["path"]}"><img src="{p["img"]}" width="{p["w"]}" height="{p["h"]}" alt="" loading="lazy"><h3>{p["name"]}</h3><p>{html.escape(p["blurb"])}</p><div class="tags">{"".join(f"<span>{t}</span>" for t in p["tags"])}</div><span class="go">Get {p["name"]} &rarr;</span></a>' for p in PRODUCTS)
hub = head("Dusktillus – little apps that look after you",
  "Dusktillus makes small, friendly apps for everyday life. Free to start, private by default. Start with AquaAww, a water reminder that comes as someone you love.",
  "/", extra='<script type="application/ld+json">'+json.dumps(hub_ld,separators=(",",":"))+'</script>',
  css=HUBCSS, og="/assets/og-dusktillus.png", fonts=False, theme="#15132b", site="Dusktillus") + f'''
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="sky">
  <div class="wrap">
    <header class="nav"><a class="wm" href="/" aria-label="Dusktillus home"><svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true"><use href="/assets/dusk.svg#m"/></svg><span>Dusktillus</span></a>
      <nav aria-label="Main"><a href="#apps">Apps</a><a href="#about">About</a></nav></header>
    <div class="hero">
      <p class="eyebrow">Dusktillus</p>
      <h1>Little apps that look after you.</h1>
      <p class="lead">We make small, friendly tools for everyday life. Free to start, private by default, and built with care from dusk till the next morning.</p>
      <div class="btnrow"><a class="btn" href="#apps">See our apps</a><a class="btn ghost" href="/aquaaww/">Try AquaAww</a></div>
    </div>
  </div>
</div>
<main id="main">
<section id="apps" class="sec wrap"><h2>Our apps</h2><p class="sub">One small thing, done well. New apps will appear here.</p>
  <div class="grid">{cards}<div class="card soon"><h3>The next one</h3><p>Another small app is in the workshop. Follow along on <a href="{GH.rsplit("/",1)[0]}">GitHub</a>.</p></div></div></section>
<section id="about" class="sec wrap"><h2>How we build</h2>
  <div class="why"><div><h3>Private by default</h3><p>Your content stays on your device. No accounts inside the apps, no ads, no tracking.</p></div>
  <div><h3>Free to start</h3><p>Every app can be downloaded free. We ask for a name and email so we can say thank you and tell you what is new.</p></div>
  <div><h3>Open and honest</h3><p>Our code is public. We say plainly what each app does and what it needs.</p></div></div></section>
</main>
<footer class="foot"><div class="wrap"><span>&copy; {datetime.date.today().year} Dusktillus</span>
<nav aria-label="Footer"><a href="/aquaaww/">AquaAww</a><a href="/terms/">Terms &amp; Conditions</a><a href="/privacy/">Privacy</a><a href="/unsubscribe/">Unsubscribe</a><a href="mailto:{C}">{C}</a></nav></div></footer>
</body></html>'''
if CONFIG["hub_live"]:
    open("index.html","w").write(hub)
else:
    # the home page is the flipbook (source in flipbook/index.html); give it real SEO tags
    fb = open("flipbook/index.html").read()
    fb = fb.replace('<meta name="robots" content="noindex">','<meta name="robots" content="index,follow,max-image-preview:large">')
    fb = fb.replace('<link rel="canonical" href="https://dusktillus.store/flipbook/">','<link rel="canonical" href="'+D+'/">')
    og = (f'<meta property="og:type" content="website"><meta property="og:site_name" content="Dusktillus"><meta property="og:title" content="Dusktillus: our digital garage">'
          f'<meta property="og:description" content="Little apps that look after you. Start with AquaAww, a water reminder that comes as someone you love.">'
          f'<meta property="og:url" content="{D}/"><meta property="og:image" content="{D}/assets/og-dusktillus.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
          f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{D}/assets/og-dusktillus.png">'
          '<script type="application/ld+json">'+json.dumps(hub_ld,separators=(",",":"))+'</script>'
          '<script defer src="/_vercel/insights/script.js"></script>')
    fb = fb.replace('</head>', og+'</head>',1)
    import mobile
    nav = mobile.home_sr(envelope=True)
    fb = fb.replace('<div id="fit">', nav+'<div id="fit">',1)
    open("index.html","w").write(fb)
import mobile
os.makedirs("m", exist_ok=True); open("m/index.html","w").write(mobile.build(D, hub_ld, GH))
print("built", len(index), "app bytes,", len(hub), "hub bytes")

# ---------------- first-party analytics tag (t.js) on every page; it is invisible and does nothing for visitors who opt out ----------------
_TAG = '<script defer src="/t.js"></script>'
for _root, _dirs, _files in os.walk("."):
    if _root.startswith(("./api", "./lib", "./fonts", "./assets", "./node_modules", "./.")) and _root != ".": continue
    for _f in _files:
        if _f.endswith(".html"):
            _p = os.path.join(_root, _f); _s = open(_p).read()
            if "/t.js" not in _s and "</head>" in _s: open(_p, "w").write(_s.replace("</head>", _TAG + "</head>", 1))
