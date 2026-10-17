# TwoToTango website: publish it properly

Everything is in `site/` (390 KB total, plain HTML + CSS, no framework, no build server).
The three big installers are too large for the website host, so they live on **GitHub Releases** (free, up to 2 GB per file) and the site buttons link to them.

```
GitHub repo  ──push──▶  Cloudflare Pages (hosts site/, free, global CDN, HTTPS)
GitHub Releases  ◀── apk / exe / dmg  (the 3 buttons point here)
Your domain  ──▶  Cloudflare (DNS + analytics)
```

## 0. What to sign up for (all free except the domain)
1. GitHub account
2. Cloudflare account
3. A domain (about $10 a year). Easiest: buy it inside Cloudflare (Registrar, sold at cost). Namecheap or GoDaddy also work.

## 1. Put the code on GitHub
```bash
cd ~/Documents/TwoToTango
git init -b main
git add .
git commit -m "TwoToTango"
```
Create an empty repo called `twototango` on github.com (Public), then:
```bash
git remote add origin https://github.com/YOUR-USERNAME/twototango.git
git push -u origin main
```
`.gitignore` already keeps out the installers, `node_modules` and the third-party character videos.

Also replace `OWNER` in `package.json` (3 places) with your username. The desktop "Check for updates" menu reads releases from that repo.

## 2. Upload the three downloads (GitHub Releases)
Repo page, Releases, Draft a new release, tag `v1.0.0`. Drag in these files from the `release/` folder **with exactly these names** (the site links depend on them):
- `TwoToTango.apk`
- `TwoToTango-Setup.exe`
- `TwoToTango-arm64.dmg`
- `SHA256SUMS.txt` (optional, lets people verify downloads)

Publish. The links `…/releases/latest/download/TwoToTango.apk` now always serve the newest release. For every new version, publish a new release with the same file names and the site needs no change.
GitHub also counts downloads per file (shown on the release page), which is your free download analytics.

## 3. Host the site on Cloudflare Pages
1. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git, choose `twototango`.
2. Framework preset: None. Build command: leave empty. Build output directory: `site`.
3. Save and Deploy. You get `twototango.pages.dev` within a minute.
Every `git push` to `main` redeploys automatically.

## 4. Connect your domain
1. Pages project, Custom domains, Set up a domain, enter `twototango.com` (use yours).
2. Domain bought at Cloudflare: it connects in one click.
   Domain bought elsewhere: Cloudflare gives two nameservers. Paste them at your registrar (Nameservers setting). Propagation takes minutes to a few hours.
3. Add `www.twototango.com` the same way, then Rules, Redirect Rules, send `www` to the bare domain so search engines see one address.
4. HTTPS certificate is automatic. In SSL/TLS set mode to Full (strict) and turn on Always Use HTTPS.

## 5. Tell the site its real address and repo
Open `site/build.py`, edit the `CONFIG` block at the top:
```python
domain="https://yourdomain.com",
gh="https://github.com/YOUR-USERNAME/twototango",
cf_token="",          # fill in step 6
```
Then:
```bash
cd site && python3 build.py && cd .. && git add -A && git commit -m "site config" && git push
```
This rewrites the canonical URLs, sitemap, share image links and the three download buttons.

## 6. Analytics (no cookie banner needed)
- **Cloudflare Web Analytics**: dashboard, Analytics & Logs, Web Analytics, Add a site. Copy the token into `cf_token` in `build.py`, rebuild and push. It shows visitors, countries, devices and page speed without cookies.
- **Downloads**: GitHub release page counts per file.
- **Google Search Console** (search.google.com/search-console): add your domain, verify with the DNS TXT record Cloudflare lets you add in one click, then submit `https://yourdomain.com/sitemap.xml`. Do the same at Bing Webmaster Tools. This is how you see which searches find you.

## 7. SEO, what is already done
- One clear `h1`, descriptive `title` and meta description, canonical URL, `robots.txt`, `sitemap.xml`
- Open Graph and Twitter share image (`assets/og.png`, 1200x630)
- Structured data: SoftwareApplication and FAQ (FAQ answers are real page text)
- About 390 KB per full page load, WebP images, self-hosted WOFF2 fonts, immutable caching via `_headers`, explicit image sizes so nothing jumps while loading
- Mobile-first layout, keyboard focus styles, reduced-motion support

What only you can do: get links from other sites (Product Hunt, Reddit, a launch post), and check the score at pagespeed.web.dev once the domain is live.

## 8. Before you make it public
- **Character artwork.** The sticker buddies and the preset videos come from third-party characters. Fine for a private gift, risky on a public site and in an app store. Swap them for your own artwork, or just your own videos, before promoting it. They are already excluded from Git (videos) but the site images in `site/assets/buddy-*.webp` and `sticker-*.webp` are not.
- **Install warnings.** The Mac build is not notarized (Apple Developer Program, $99 a year) and the Windows installer is not code-signed, so both show a warning. The FAQ explains the workaround. Signing removes it.
- **Privacy page** says contact via GitHub issues. Add an email if you prefer.
- Google Play needs a signed AAB and this privacy page URL (`/privacy/`).

## 9. Updating later
Edit files in `site/`, run `python3 build.py` if you changed copy in it, `git push`. Cloudflare publishes in about a minute.
