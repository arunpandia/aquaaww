// GET  /api/pay            -> what to show this visitor: { currency, symbol, amount, min, max, keyId, ready } (rupees 50 in India, dollars 1 elsewhere)
// POST /api/pay { amount } -> creates a Razorpay order and returns { orderId, amount, currency, keyId }
// Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the Vercel environment. Test keys (rzp_test_...) work for a dry run.
const { redis, sameOrigin } = require('./_lib');
const { READY } = require('./_fund');

const PLANS = {
  INR: { currency: 'INR', symbol: '₹', amount: 50, min: 10, max: 50000 },
  USD: { currency: 'USD', symbol: '$', amount: 1, min: 1, max: 500 },
};
const planFor = req => String(req.headers['x-vercel-ip-country'] || '').toUpperCase() === 'IN' ? PLANS.INR : PLANS.USD;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const plan = planFor(req);
  if (req.method === 'GET') return res.status(200).json({ ...plan, keyId: READY() ? process.env.RAZORPAY_KEY_ID : '', ready: READY() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
  if (!sameOrigin(req)) return res.status(403).end();
  if (!READY()) return res.status(503).json({ ok: false, error: 'Payments are not switched on yet.' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const amount = Number(b && b.amount);
  if (!isFinite(amount) || amount < plan.min || amount > plan.max) return res.status(400).json({ ok: false, error: `Please enter between ${plan.symbol}${plan.min} and ${plan.symbol}${plan.max}.` });
  const minor = Math.round(amount * 100);

  try {
    const auth = Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: minor, currency: plan.currency, receipt: 'fund_' + Date.now().toString(36), notes: { purpose: 'AquaAww Google Play fee' } }),
    });
    const o = await r.json();
    if (!r.ok || !o.id) { console.error('razorpay order failed:', r.status, JSON.stringify(o).slice(0, 300)); return res.status(502).json({ ok: false, error: 'Could not start the payment. Please try again.' }); }
    await redis([['SET', 'fund:order:' + o.id, JSON.stringify({ minor, currency: plan.currency }), 'EX', 86400]]);
    return res.status(200).json({ ok: true, orderId: o.id, amount: minor, currency: plan.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    console.error('pay failed:', e.message);
    return res.status(503).json({ ok: false, error: 'Could not start the payment. Please try again.' });
  }
};
