# Dusktillus + AquaAww website

Live: https://dusktillus.store (hub for all products) and https://dusktillus.store/aquaaww/ (this app)
Code: https://github.com/arunpandia/aquaaww (website is the `site/` folder, deployed by Vercel on every push)
Downloads: GitHub Releases. Leads: Upstash Redis through Vercel.

## The home page is the Dusktillus flipbook
`dusktillus.store/` is the flipbook built from your Figma frame (source: `site/flipbook/index.html`, built into `site/index.html` by `build.py`). AquaAww lives at `/aquaaww/`. `/flipbook/` redirects to `/`. The simpler text hub page is still available by setting `hub_live=True` in `build.py`.

## Site map (add future products the same way)
```
/                      Dusktillus hub: what you make, list of apps
/aquaaww/           AquaAww landing page + download pop-up
/aquaaww/water-reminder-app-for-{android,windows,mac}/
/terms/ /privacy/ /unsubscribe/   shared by every product
/api/subscribe  /api/unsubscribe  /api/leads
```
To add a second product: add an entry to `PRODUCTS` in `site/build.py` (it appears on the hub and in the sitemap list when you add its URLs to `urls`), create its pages under `/<product>/`, run `python3 build.py`, push. One domain keeps all search authority together.

## What is switched on
- HTTPS everywhere, certificate auto-renewed by Vercel. `http://` and `www.` redirect to `https://dusktillus.store`, and the old `twototango-plum.vercel.app` address redirects permanently too.
- Security headers: HSTS, CSP (only your own files), no framing, no camera/mic/location, same-origin isolation.
- Vercel Web Analytics enabled (free, no cookies). View it in the project's Analytics tab.
- IndexNow ping sent to Bing/Yandex for all pages. Sitemap: https://dusktillus.store/sitemap.xml

## Google Search Console (needs your Google login, I could not do this part)
1. Open https://search.google.com/search-console and sign in with the Google account you want to own the site.
2. Add property > **Domain** > `dusktillus.store`. Google shows a TXT record.
3. Vercel > Domains > dusktillus.store > DNS Records > Add: Type TXT, Name `@`, Value = the string Google gave, then press Verify in Search Console (can take a few minutes).
4. Sitemaps > add `sitemap.xml` > Submit.
5. URL Inspection: paste `https://dusktillus.store/`, `/aquaaww/` and the three platform URLs, press Request indexing on each.
6. Later check Pages (indexing problems), Performance (searches), Core Web Vitals.
Bing: https://www.bing.com/webmasters > Import from Google Search Console.

## Email for hello@dusktillus.store
The Terms and Privacy pages show this address, so make it real. Easiest free route: ImprovMX (improvmx.com), add `dusktillus.store`, forward to your inbox, then add the MX and SPF TXT records it shows in Vercel > Domains > DNS Records. For sending marketing mail later use Resend or Brevo, which will ask for DKIM/SPF records in the same place.

## Getting more downloads
- Product Hunt launch, Show HN, Reddit (r/productivity, r/macapps, r/Android), friends sharing the link. The share preview image is set.
- Publish 3 to 5 helpful pages over time (for example "how much water should I drink", "best water reminder apps"), each under `/aquaaww/` or a `/blog/` section.
- Put the link in the GitHub repo description and README, and in every social bio.
- Replace the third-party characters with your own art; it also makes the page more shareable.
- Watch Analytics > Referrers and Search Console > Performance, and improve the pages that nearly rank.

## How a download works
1. Visitor taps Android, Windows or Mac. A pop-up asks for name and email, with a small line linking to /terms/.
2. `site/api/subscribe.js` validates it, saves the lead in Redis, and returns the download link. The file then downloads.
3. Every push to `main` on GitHub redeploys the site in about 20 seconds.

## Drop-off: how many open the pop-up and leave without downloading
Every time the pop-up opens it counts as `open:<platform>`; closing it without finishing counts `close:<platform>`; a completed download counts `done:<platform>`. Left without downloading = opened minus completed. Numbers live in Redis (`stats:funnel` totals, `stats:day:YYYY-MM-DD` per day). With `LEADS_TOKEN` set you can read a summary: `curl -H "Authorization: Bearer YOUR_TOKEN" https://dusktillus.store/api/stats`. These are event counts, not unique people; one person opening twice counts twice.

## See your sign-ups
- Upstash console: Vercel project > Storage > your database > Open in Upstash > Data Browser. Leads are in the hash `leads` (key = email). Download counts per platform are in `stats:downloads`.
- CSV export for mailing: in Vercel > Settings > Environment Variables add `LEADS_TOKEN` (any long random string). Then
  `curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR-DOMAIN/api/leads > leads.csv`
  It skips people who unsubscribed (`?all=1` includes them).
- A test row `deploy-check@example.com` (already unsubscribed) was created while testing. Delete it in the Data Browser.

## Sending the marketing emails
The site only collects consent and addresses. Send from a mailing tool (Resend, Brevo, Mailchimp, MailerLite): import the CSV. Every email must carry a working unsubscribe link (`/unsubscribe/` on your site works, and update the list from the CSV regularly) and your postal or contact details. Edit `CONFIG["contact"]` in `site/build.py` to an address you read.

## Analytics
- Vercel Web Analytics: project > Analytics tab > Enable. The site already loads the script, so numbers appear within minutes. No cookies. Optional: enable Speed Insights too.
- Download numbers: GitHub release page counts per file, and Redis `stats:downloads` counts sign-ups per platform.
- Search: add the site to Google Search Console (search.google.com/search-console) and Bing Webmaster Tools. Verify with the DNS record they give or the HTML tag method, submit `/sitemap.xml`, then use URL Inspection > Request indexing for the home page and the three platform pages.

## SEO, what is already in place
- Unique title, description, canonical and share image on every page; one `h1` per page
- Pages people search for: `/water-reminder-app-for-android/`, `/-windows/`, `/-mac/`, plus terms, privacy, unsubscribe
- Structured data: SoftwareApplication, FAQPage (home), BreadcrumbList (inner pages)
- `robots.txt` (blocks /api/), `sitemap.xml` with dates, 404 page marked noindex
- Speed: about 400 KB total, no frameworks, WebP images, self-hosted WOFF2 fonts, one-year caching for assets
- Mobile-first layout, keyboard focus, reduced-motion support

To rank: get links from other sites (Product Hunt, Reddit, Hacker News Show, a blog post), add a few helpful articles over time (for example "how much water should I drink a day"), keep titles unique, and check PageSpeed Insights once a domain is attached.

## Before you promote it
- **Third-party artwork.** The sticker buddies (`site/assets/buddy-*.webp`, `sticker-*.webp`) and the app's preset videos use characters you do not own. Replace them with your own artwork before promoting. The repo is public.
- **Legal text.** The terms and privacy pages are a sensible starting draft, not legal advice. They assume India law. Pre-agreed marketing consent by clicking Download is thin under GDPR and similar laws; adding a tick-box for marketing mail is safer for EU visitors.
- **Install warnings.** Mac is not notarized and Windows is not code-signed, so both warn on first open. The platform pages explain the workaround.
- **Vercel Hobby plan** is meant for personal, non-commercial use. If you start selling, move to Pro.
- **Email address** on the Terms page is a placeholder (`hello@aquaaww.app`). Set a real one.

## Updating
- Copy changes: edit `site/build.py`, run `python3 build.py` inside `site/`, commit, push.
- New app version: publish a new GitHub release with the same three file names. The buttons always serve the latest.
- The CI release workflow was kept as `docs/release.yml.example` (pushing workflow files needs extra GitHub permission). Copy it to `.github/workflows/release.yml` in the GitHub web editor if you want automatic builds.

## "Feeling lucky" fund (Razorpay Payment Links)

The "feeling lucky" strip on /aquaaww/ opens a pop-up with a button to a Razorpay Payment Link: ₹50 for visitors in India, $1 for everyone else.
The progress bars (AquaAww page and the home page) read `/api/fund`. They move only when Razorpay calls `/api/razorpay-webhook` after a successful payment.

1. Razorpay > Payment Links: create one link for ₹50 and one for $1 (the dollar one needs International Payments enabled). Copy the two links (`https://rzp.io/...`).
2. Razorpay > Account & Settings > Webhooks > Add: url `https://dusktillus.store/api/razorpay-webhook`, event `payment_link.paid`, and a secret you invent.
3. Vercel environment variables, then redeploy:

| Name | Required | Meaning |
|---|---|---|
| `PAYLINK_INR` | yes | the ₹50 Payment Link url |
| `PAYLINK_USD` | yes | the $1 Payment Link url |
| `RAZORPAY_WEBHOOK_SECRET` | yes | the webhook secret from step 2 |
| `FUND_GOAL_USD` | no | goal in dollars, default 25 |
| `FUND_SEED_USD` | no | dollars already raised before this went live, default 0 |
| `INR_PER_USD` | no | rate used to move the bar for rupee payments, default 88 |

Payments from your other Razorpay products are ignored (only the two links above are counted). Each payment is counted once.
The last 500 payments are kept in Redis under `fund:log`.
