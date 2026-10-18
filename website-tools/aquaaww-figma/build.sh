set -e
cd /private/tmp/site_work/tw
node convert.mjs
node convert_m.mjs
npx tailwindcss -i input.css -o tw.css --minify 2>&1 | tail -2
cat tw.css page.css > aquaaww.css
wc -c body.html body_m.html tw.css page.css aquaaww.css
