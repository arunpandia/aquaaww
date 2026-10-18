// GET /api/pay -> what to show this visitor: { currency, symbol, amount, url, ready }.
// India gets the rupee Payment Link (48 unless PAYLINK_INR_AMOUNT says otherwise), everyone else the dollar one (1). The links are Razorpay Payment Links set in the Vercel environment
// as PAYLINK_INR and PAYLINK_USD (a Payment Page url such as https://pages.razorpay.com/... can be paid many times). Payments are counted by /api/razorpay-webhook, not here.
const { LINKS } = require('./_fund');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const inr = String(req.headers['x-vercel-ip-country'] || '').toUpperCase() === 'IN';
  const url = inr ? LINKS().INR : LINKS().USD;
  const plan = inr ? { currency: 'INR', symbol: '\u20b9', amount: +process.env.PAYLINK_INR_AMOUNT || 48 } : { currency: 'USD', symbol: '$', amount: +process.env.PAYLINK_USD_AMOUNT || 1 };
  const ok = /^https:\/\/(rzp\.io|razorpay\.com|pages\.razorpay\.com)\//.test(url);
  return res.status(200).json({ ...plan, url: ok ? url : '', ready: ok, reason: ok ? '' : inr ? 'off' : 'region' });
};
