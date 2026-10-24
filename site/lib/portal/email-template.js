// The sign-in email, laid out like the Figma design (".store-Draft", frame "website"): torn-paper collage with the logo, and a grid-paper card.
// The logo and the card are real elements and every word is live text, so the code can be copied and read aloud. The collage (assets/email/signin-bg-v2.jpg) is a bonus behind them.
const BASE = process.env.EMAIL_ASSET_BASE || 'https://dusktillus.store';
const BG = BASE + '/assets/email/signin-bg-v2.jpg', LOGO = BASE + '/assets/email/logo.png', GRID = BASE + '/assets/email/grid.png';
const HAND = "'Architects Daughter','Segoe Print','Bradley Hand','Marker Felt','Chalkboard SE','Comic Sans MS',cursive";
const MONO = "'JetBrains Mono',SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

function signInEmail(code) {
  const c = String(code).replace(/\D/g, '').slice(0, 6);
  const subject = 'Your Dusktillus sign-in code: ' + c;
  const text = `Your sign-in code is ${c}.\n\nIt works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.\n\ndusktillus.store`;
  // Built so it still works where mail apps are limited: the logo and the card are plain <img>/table elements (no CSS tricks, no media queries, no fixed positions).
  // The collage is only a bonus behind them: where an app drops background images you simply get the cream card on a cream page.
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${subject}</title>
<style>
@font-face{font-family:'Architects Daughter';src:url(${BASE}/flipbook/fonts/ArchitectsDaughter.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';src:url(${BASE}/flipbook/fonts/JetBrainsMono.woff2) format('woff2')}
body{margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%}
@media (max-width:620px){.bgt{background-image:none!important}}
img{border:0;outline:none;text-decoration:none}
</style></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">Your sign-in code is ${c}. It works for 10 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" class="bgt" align="center" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" background="${BG}" style="width:100%;max-width:600px;margin:0 auto;background-color:#ffffff;background-image:url(${BG});background-repeat:no-repeat;background-position:left top">
<tr><td align="left" valign="top" style="padding:44px 56px 38px 56px;padding:44px 9.3% 38px 9.3%">
<a href="${BASE}/" style="text-decoration:none"><img src="${LOGO}" width="56" height="78" alt="Dusktillus" style="display:block;width:56px;height:78px;border:0"></a>
</td></tr>
<tr><td valign="top" style="padding:0 51px 40px 51px;padding:0 8.5% 40px 8.5%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f2ee" background="${GRID}" style="width:100%;background-color:#f3f2ee;background-image:url(${GRID});border:2px solid #000000;border-radius:30px"><tr><td style="padding:32px 34px 38px 38px">
<div style="font-family:${MONO};font-size:9px;line-height:12px;color:#8f8d8a;letter-spacing:.2px">Insta ID -</div>
<div style="font-family:${MONO};font-size:15px;line-height:20px;color:#000000">dusktillus.store</div>
<div style="height:24px;line-height:24px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:26px;line-height:32px;color:#000000">Your sign-in code is <span style="color:#e83328;text-decoration:underline;text-decoration-style:wavy;text-decoration-color:#e83328">${c}</span></div>
<div style="height:22px;line-height:22px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:14px;line-height:20px;color:#6f98cc">It works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.</div>
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

module.exports = { signInEmail };
