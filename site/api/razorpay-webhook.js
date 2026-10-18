// POST /api/razorpay-webhook  (set this url in Razorpay: Account & Settings > Webhooks, event "payment_link.paid")
// Verifies Razorpay's signature over the raw body, keeps only payments made through our own Payment Links, and moves the progress bar.
const crypto = require('crypto');
const { redis } = require('./_lib');
const { LINKS, toUsdCents } = require('./_fund');

const norm = u => String(u || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
const readRaw = req => new Promise((ok, no) => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); req.on('error', no); });

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).end();
  let raw;
  try { raw = await readRaw(req); } catch { return res.status(400).end(); }
  const got = String(req.headers['x-razorpay-signature'] || '');
  const want = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return res.status(400).end();

  let body; try { body = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).end(); }
  if (body.event !== 'payment_link.paid') return res.status(200).json({ ignored: true });
  const pl = body.payload && body.payload.payment_link && body.payload.payment_link.entity;
  const pay = body.payload && body.payload.payment && body.payload.payment.entity;
  if (!pl || !pay || !/^pay_[A-Za-z0-9]+$/.test(pay.id || '')) return res.status(200).json({ ignored: true });
  const ours = [LINKS().INR, LINKS().USD].filter(Boolean).map(norm);
  if (!ours.includes(norm(pl.short_url))) return res.status(200).json({ ignored: true });   // payments on your other Razorpay products are not ours
  if (!['INR', 'USD'].includes(pay.currency) || !(pay.amount > 0)) return res.status(200).json({ ignored: true });

  try {
    const [first] = (await redis([['SET', 'fund:paid:' + pay.id, '1', 'NX', 'EX', 7776000]])).map(x => x.result);
    if (first === 'OK') {
      await redis([
        ['HINCRBY', 'fund', 'cents', toUsdCents(pay.currency, pay.amount)],
        ['HINCRBY', 'fund', 'count', 1],
        ['LPUSH', 'fund:log', JSON.stringify({ t: new Date().toISOString(), currency: pay.currency, minor: pay.amount, pay: pay.id })],
        ['LTRIM', 'fund:log', 0, 499],
      ]);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook failed:', e.message);
    return res.status(500).end();          // Razorpay will retry
  }
};
