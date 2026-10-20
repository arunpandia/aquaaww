const sharp = require('sharp'), fs = require('fs'), path = require('path'), wawoff = require('wawoff2');
const R = process.argv[2], D = R + '/mobile/www/img/design', O = R + '/site/assets', F = R + '/site/fonts';
const jobs = [
  ['drink-water.png','drink-water.webp',340],
  ['card-floating-buddy.png','card-floating.webp',260],
  ['note-settings.png','note-timing.webp',280],
  ['stamp-done-today.png','stamp-done.webp',260],
  ['sticker-cat.png','sticker-cat.webp',340],
  ['sticker-frog.png','sticker-frog.webp',340],
  ['sticker-duck.png','sticker-duck.webp',340],
];
(async () => {
  for (const [src, out, w] of jobs) {
    const info = await sharp(`${D}/${src}`).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(`${O}/${out}`);
    console.log(out, info.width + 'x' + info.height, info.size);
  }
  for (const f of ['PermanentMarker-Regular','SpecialElite-Regular']) {
    const buf = fs.readFileSync(`${R}/mobile/www/fonts/${f}.ttf`);
    const w2 = await wawoff.compress(buf);
    fs.writeFileSync(`${F}/${f}.woff2`, w2);
    console.log(f, buf.length, '->', w2.length);
  }
})();
