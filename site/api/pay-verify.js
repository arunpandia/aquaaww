// POST /api/pay-verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Checks Razorpay's signature, then moves the progress bar by the amount of the order we created (never by a number the browser sends).
const crypto = require('crypto');
const { redis, sameOrigin } = require('./_lib');
const { READY, snapshot, toUsdCents } = require('./_fund');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!sameOrigin(req)) return res.status(403).end();
  if (!READY()) return res.status(503).json({ ok: false });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b && typeof b === 'object' ? b : {};
  const order = String(b.razorpay_order_id || ''), pay = String(b.razorpay_payment_id || ''), sig = String(b.razorpay_signature || '');
  if (!/^order_[A-Za-z0-9]+$/.test(order) || !/^pay_[A-Za-z0-9]+$/.test(pay) || !/^[a-f0-9]{64}$/.test(sig)) return res.status(400).json({ ok: false });

  const want = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(order + '|' + pay).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return res.status(400).json({ ok: false, error: 'Could not verify the payment.' });

  try {
    const [o, fresh] = (await redis([['GET', 'fund:order:' + order], ['SET', 'fund:paid:' + pay, '1', 'NX', 'EX', 7776000]])).map(x => x.result);
    const info = o ? JSON.parse(o) : null;
    if (!info) return res.status(400).json({ ok: false, error: 'Unknown order.' });
    if (fresh === 'OK') {
      await redis([
        ['HINCRBY', 'fund', 'cents', toUsdCents(info.currency, info.minor)],
        ['HINCRBY', 'fund', 'count', 1],
        ['LPUSH', 'fund:log', JSON.stringify({ t: new Date().toISOString(), currency: info.currency, minor: info.minor, pay })],
        ['LTRIM', 'fund:log', 0, 499],
      ]);
    }
    return res.status(200).json({ ok: true, ...(await snapshot()) });
  } catch (e) {
    console.error('verify failed:', e.message);
    return res.status(503).json({ ok: false, error: 'Paid, but we could not record it. Please write to us with your payment id: ' + pay });
  }
};
