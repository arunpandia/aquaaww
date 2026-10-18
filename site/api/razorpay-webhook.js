// POST /api/razorpay-webhook  (set this url in Razorpay: Account & Settings > Webhooks, events "payment_page.paid" and "payment_link.paid")
// Verifies Razorpay's signature over the raw body, keeps only payments made through our own Payment Page or Link, and moves the progress bar.
// A Payment Page can be paid again and again; a single Payment Link can only be paid once.
const crypto = require('crypto');
const { redis } = require('./_lib');
const { LINKS, toUsdCents } = require('./_fund');

const norm = u => String(u || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
// rzp.io short links redirect to the real page (pages.razorpay.com/pl_...), which is what Razorpay's event names; resolve once and remember
const resolved = new Map();
async function expand(u) {
  if (!u) return [];
  if (!resolved.has(u)) {
    let loc = '';
    try { const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(3000) }); loc = r.headers.get('location') || ''; } catch { /* keep what we have */ }
    resolved.set(u, loc);
  }
  return [u, resolved.get(u)].filter(Boolean);
}
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
  if (body.event !== 'payment_page.paid' && body.event !== 'payment_link.paid') return res.status(200).json({ ignored: true });
  const p = body.payload || {};
  const src = (p.payment_page && p.payment_page.entity) || (p.payment_link && p.payment_link.entity);
  const pay = p.payment && p.payment.entity;
  if (!src || !pay || !/^pay_[A-Za-z0-9]+$/.test(pay.id || '')) return res.status(200).json({ ignored: true });
  const ours = (await Promise.all([LINKS().INR, LINKS().USD].map(expand))).flat().map(norm);
  const seen = [src.url, src.short_url].filter(Boolean).map(norm);
  const mine = ours.some(o => seen.includes(o) || (src.id && o.includes(String(src.id).toLowerCase())) || (src.slug && o.endsWith('/' + String(src.slug).toLowerCase())));
  if (!mine) return res.status(200).json({ ignored: true });   // payments on your other Razorpay products are not ours
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
