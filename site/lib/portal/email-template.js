// The sign-in email, laid out like the Figma design (".store-Draft", frame "website"): torn-paper collage with the logo, and a grid-paper card.
// The banners and the card are real elements and every word is live text, so the code can be copied and read aloud.
const BASE = process.env.EMAIL_ASSET_BASE || 'https://dusktillus.store';
const A = n => BASE + '/assets/email/' + n;
const HAND = "'Architects Daughter','Segoe Print','Bradley Hand','Marker Felt','Chalkboard SE','Comic Sans MS',cursive";
const MONO = "'JetBrains Mono',SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

// One layout for every screen. The collage (assets/email/collage.png, from Figma frame "website" node 2986:828, its #1C1C1E backdrop made transparent) is the background
// of the whole block, anchored at the bottom so the rocks and meadow always show under the card, even when the text wraps on a phone. The logo is a real image, the card is
// a real table, and every word is live text, so the code can be copied and read aloud. Where an app drops background images you simply get the logo and the card on plain white.
function signInEmail(code) {
  const c = String(code).replace(/\D/g, '').slice(0, 6);
  const subject = 'Your Dusktillus sign-in code: ' + c;
  const text = `Your sign-in code is ${c}.\n\nIt works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.\n\ndusktillus.store`;
  const code6 = `<span style="color:#e83328;background-image:url(${A('wave.png')});background-repeat:repeat-x;background-position:left bottom;padding-bottom:3px">${c}</span>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${subject}</title>
<style>
@font-face{font-family:'Architects Daughter';src:url(${BASE}/flipbook/fonts/ArchitectsDaughter.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';src:url(${BASE}/flipbook/fonts/JetBrainsMono.woff2) format('woff2')}
body{margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
</style></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">Your sign-in code is ${c}. It works for 10 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"><tr><td align="center" style="padding:12px 8px">
<table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0" background="${A('collage.png')}" style="width:100%;max-width:600px;margin:0 auto;background-image:url(${A('collage.png')});background-repeat:no-repeat;background-position:center bottom">
<tr><td valign="top" align="left" style="padding:44px 56px 0 56px;padding:44px 9.3% 0 9.3%;font-size:0;line-height:0"><a href="${BASE}/" style="text-decoration:none"><img src="${A('logo.png')}" width="56" height="78" alt="Dusktillus" style="display:block;width:56px;height:78px"></a></td></tr>
<tr><td valign="top" style="padding:38px 51px 0 51px;padding:38px 8.5% 0 8.5%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f2ee" background="${A('grid.png')}" style="width:100%;background-color:#f3f2ee;background-image:url(${A('grid.png')});border:2px solid #000000;border-radius:30px"><tr><td valign="top" style="padding:30px 34px 34px 36px">
<div style="font-family:${MONO};font-size:9px;line-height:12px;color:#8f8d8a;letter-spacing:.2px">Insta ID -</div>
<div style="font-family:${MONO};font-size:15px;line-height:20px;color:#000000">dusktillus.store</div>
<div style="height:22px;line-height:22px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:26px;line-height:34px;color:#000000">Your sign-in code is ${code6}</div>
<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:14px;line-height:21px;color:#6f98cc">It works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.</div>
</td></tr></table>
</td></tr>
<tr><td style="padding:0;height:76px;font-size:0;line-height:0">&nbsp;</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

module.exports = { signInEmail };
