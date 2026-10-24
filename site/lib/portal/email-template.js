// The sign-in email, laid out like the Figma design (".store-Draft", frame "website"): torn-paper collage with the logo, and a grid-paper card.
// The collage is one image (assets/email/signin-bg.jpg, the card area left empty); every word is live text on top, so the code can be copied and read aloud.
// Email clients are picky, so: tables not flex, inline styles, a cream fallback when images are blocked, VML for Outlook, and a plain stacked card on narrow phones.
const BASE = process.env.EMAIL_ASSET_BASE || 'https://dusktillus.store';
const BG = BASE + '/assets/email/signin-bg.jpg', LOGO = BASE + '/assets/email/logo.png';
const HAND = "'Architects Daughter','Segoe Print','Bradley Hand','Marker Felt','Chalkboard SE','Comic Sans MS',cursive";
const MONO = "'JetBrains Mono',SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

function signInEmail(code) {
  const c = String(code).replace(/\D/g, '').slice(0, 6);
  const subject = 'Your Dusktillus sign-in code: ' + c;
  const text = `Your sign-in code is ${c}.\n\nIt works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.\n\ndusktillus.store`;
  const html = `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${subject}</title>
<style>
@font-face{font-family:'Architects Daughter';src:url(${BASE}/flipbook/fonts/ArchitectsDaughter.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';src:url(${BASE}/flipbook/fonts/JetBrainsMono.woff2) format('woff2')}
body{margin:0;padding:0;background:#f3f0e8;-webkit-text-size-adjust:100%}
@media (max-width:620px){
  .bgcell{background-image:none!important;height:auto!important;width:100%!important;min-width:0!important}
  .sp{height:auto!important;padding:20px 20px 14px!important}
  .mlogo{display:block!important}
  .card{border:1.5px solid #000!important;border-radius:22px!important;background:#f3f2ee!important;padding:22px 20px!important}
  .wrap{padding:14px!important}
  .h{font-size:23px!important;line-height:29px!important}
}
</style></head>
<body style="margin:0;padding:0;background:#f3f0e8">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">Your sign-in code is ${c}. It works for 10 minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f0e8"><tr><td class="wrap" align="center" style="padding:18px 8px">
<!--[if gte mso 9]><v:rect fill="true" stroke="false" style="width:600px;height:462px"><v:fill type="frame" src="${BG}" color="#f3f0e8"/><v:textbox inset="0,0,0,0"><![endif]-->
<table role="presentation" class="bgcell" width="600" cellpadding="0" cellspacing="0" border="0" background="${BG}" bgcolor="#f3f0e8" style="width:600px;max-width:100%;height:462px;background-color:#f3f0e8;background-image:url(${BG});background-repeat:no-repeat;background-position:center top;background-size:600px 462px">
<tr><td class="sp" height="196" valign="top" style="height:196px;padding:0;font-size:0;line-height:0">
<img class="mlogo" src="${LOGO}" width="48" alt="Dusktillus" style="display:none;border:0;outline:none;height:auto">
</td></tr>
<tr><td class="card" valign="top" style="padding:0 75px 0 89px">
<div style="font-family:${MONO};font-size:9px;line-height:12px;color:#9a9896;letter-spacing:.2px">Insta ID -</div>
<div style="font-family:${MONO};font-size:15px;line-height:20px;color:#000">dusktillus.store</div>
<div style="height:24px;line-height:24px;font-size:0">&nbsp;</div>
<div class="h" style="font-family:${HAND};font-size:26px;line-height:32px;color:#000">Your sign-in code is <span style="color:#e83328;text-decoration:underline;text-decoration-style:wavy;text-decoration-color:#e83328">${c}</span></div>
<div style="height:22px;line-height:22px;font-size:0">&nbsp;</div>
<div style="font-family:${HAND};font-size:14px;line-height:20px;color:#7199cc">It works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.</div>
</td></tr>
</table>
<!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

module.exports = { signInEmail };
