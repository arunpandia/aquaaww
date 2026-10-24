// POST /api/checkout-verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Called by the browser after Razorpay Checkout succeeds. Checks Razorpay's signature with the secret key, then marks the order paid.
// If the browser never gets here (closed tab, lost signal), /api/razorpay-webhook does the same from Razorpay's side.
const crypto = require('crypto');
const { redis, sameOrigin } = require('../../api/_lib');
const S = require('./core');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!sameOrigin(req)) return res.status(403).end();
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ ok: false });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b && typeof b === 'object' ? b : {};
  const rzp = String(b.razorpay_order_id || ''), pay = String(b.razorpay_payment_id || ''), sig = String(b.razorpay_signature || '');
  if (!/^order_[A-Za-z0-9]+$/.test(rzp) || !/^pay_[A-Za-z0-9]+$/.test(pay) || !/^[a-f0-9]{64}$/.test(sig)) return res.status(400).json({ ok: false });
  const want = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(rzp + '|' + pay).digest('hex');
  if (!S.same(want, sig)) return res.status(400).json({ ok: false, error: 'Could not verify the payment.' });
  try {
    const id = (await redis([['GET', 'shop:rzp:' + rzp]]))[0].result;
    const o = id && await S.markPaid(id, pay);
    if (!o) return res.status(404).json({ ok: false, error: 'Unknown order.' });
    return res.status(200).json({ ok: true, orderId: o.id, status: o.status, key: S.orderKey(o), downloads: S.downloadsOf(o) });
  } catch (e) {
    console.error('verify failed:', e.message);
    return res.status(503).json({ ok: false, error: 'Paid, but we could not record it yet. Your order will update shortly; write to us with payment id ' + pay + ' if it does not.' });
  }
};
