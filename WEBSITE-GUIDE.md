# TwoToTango website: how it is set up and what you do next

Live address: https://twototango-plum.vercel.app
Code: https://github.com/arunpandia/twototango (the `site/` folder is the website)
Downloads: https://github.com/arunpandia/twototango/releases (the three buttons)

```
Visitor ─▶ Vercel (site/ + api/ functions) ─▶ Upstash Redis (name + email leads)
                                          └─▶ GitHub Releases (apk / exe / dmg)
```

## How a download works
1. Visitor taps Android, Windows or Mac. A pop-up asks for name and email, with a small line linking to /terms/.
2. `site/api/subscribe.js` validates it, saves the lead in Redis, and returns the download link. The file then downloads.
3. Every push to `main` on GitHub redeploys the site in about 20 seconds.

## See your sign-ups
- Upstash console: Vercel project > Storage > your database > Open in Upstash > Data Browser. Leads are in the hash `leads` (key = email). Download counts per platform are in `stats:downloads`.
- CSV export for mailing: in Vercel > Settings > Environment Variables add `LEADS_TOKEN` (any long random string). Then
  `curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR-DOMAIN/api/leads > leads.csv`
  It skips people who unsubscribed (`?all=1` includes them).
- A test row `deploy-check@example.com` (already unsubscribed) was created while testing. Delete it in the Data Browser.

## Sending the marketing emails
The site only collects consent and addresses. Send from a mailing tool (Resend, Brevo, Mailchimp, MailerLite): import the CSV. Every email must carry a working unsubscribe link (`/unsubscribe/` on your site works, and update the list from the CSV regularly) and your postal or contact details. Edit `CONFIG["contact"]` in `site/build.py` to an address you read.

## Connect your own domain
1. Buy a domain (Cloudflare Registrar, Namecheap, GoDaddy, Google Domains successors).
2. Vercel project > Settings > Domains > Add. Follow the DNS record it shows at your registrar (A record for the bare domain, CNAME for www).
3. In `site/build.py` change `CONFIG["domain"]` to your domain, then
   `cd site && python3 build.py && cd .. && git add -A && git commit -m "domain" && git push`
   This updates the canonical links, share image links and sitemap.
Until then the address ends in vercel.app. Note: `twototango.vercel.app` belongs to someone else; you can rename the project in Settings for a different free name.

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
- **Email address** on the Terms page is a placeholder (`hello@twototango.app`). Set a real one.

## Updating
- Copy changes: edit `site/build.py`, run `python3 build.py` inside `site/`, commit, push.
- New app version: publish a new GitHub release with the same three file names. The buttons always serve the latest.
- The CI release workflow was kept as `docs/release.yml.example` (pushing workflow files needs extra GitHub permission). Copy it to `.github/workflows/release.yml` in the GitHub web editor if you want automatic builds.
