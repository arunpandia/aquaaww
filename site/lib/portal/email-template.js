// The sign-in email, laid out like the Figma design (".store-Draft", frame "website"): torn-paper collage with the logo, and a grid-paper card.
// The banners and the card are real elements and every word is live text, so the code can be copied and read aloud.
const BASE = process.env.EMAIL_ASSET_BASE || 'https://dusktillus.store';
const TOP = BASE + '/assets/email/email-top.jpg', MID = BASE + '/assets/email/email-mid.jpg', BOTTOM = BASE + '/assets/email/email-bottom.jpg', GRID = BASE + '/assets/email/grid.png';
const HAND = "'Architects Daughter','Segoe Print','Bradley Hand','Marker Felt','Chalkboard SE','Comic Sans MS',cursive";
const MONO = "'JetBrains Mono',SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

function signInEmail(code) {
  const c = String(code).replace(/\D/g, '').slice(0, 6);
  const subject = 'Your Dusktillus sign-in code: ' + c;
  const text = `Your sign-in code is ${c}.\n\nIt works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.\n\ndusktillus.store`;
  // Three stacked bands, each a plain element every mail app understands: a top banner image (collage + logo), the card (live text), a bottom banner image.
  // The strip behind the card (the collage showing at its left and right) is a bonus background that is dropped on narrow screens.
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${subject}</title>
<style>
@font-face{font-family:'Architects Daughter';src:url(${BASE}/flipbook/fonts/ArchitectsDaughter.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';src:url(${BASE}/flipbook/fonts/JetBrainsMono.woff2) format('woff2')}
body{margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
@media (max-width:620px){.midbg{background-image:none!important}}
</style></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">Your sign-in code is ${c}. It works for 10 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"><tr><td align="center" style="padding:12px 8px">
<table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;margin:0 auto">
<tr><td style="padding:0;font-size:0;line-height:0"><a href="${BASE}/" style="text-decoration:none"><img src="${TOP}" width="600" alt="Dusktillus" style="display:block;width:100%;max-width:600px;height:auto"></a></td></tr>
<tr><td class="midbg" valign="top" bgcolor="#ffffff" background="${MID}" style="padding:4px 51px;padding:4px 8.5%;background-color:#ffffff;background-image:url(${MID});background-repeat:no-repeat;background-position:left top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f2ee" background="${GRID}" style="width:100%;background-color:#f3f2ee;background-image:url(${GRID});border:2px solid #000000;border-radius:30px"><tr><td valign="top" height="165" style="padding:30px 34px 28px 38px;height:165px">
<div style="font-family:${MONO};font-size:9px;line-height:12px;color:#8f8d8a;letter-spacing:.2px">Insta ID -</div>
<div style="font-family:${MONO};font-size:15px;line-height:20px;color:#000000">dusktillus.store</div>
<div style="height:21px;line-height:21px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:26px;line-height:32px;color:#000000">Your sign-in code is <span style="color:#e83328;text-decoration:underline;text-decoration-style:wavy;text-decoration-color:#e83328">${c}</span></div>
<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:14px;line-height:20px;color:#6f98cc">It works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.</div>
</td></tr></table>
</td></tr>
<tr><td style="padding:0;font-size:0;line-height:0"><img src="${BOTTOM}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

module.exports = { signInEmail };
