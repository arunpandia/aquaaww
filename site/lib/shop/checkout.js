// POST /api/checkout { items: [{ id, qty }], customer: { name, email, phone }, shipping: { line1, line2, city, state, pin } }
// Prices, shipping and the total are worked out here from the catalog (never from the browser), a Razorpay order is created for exactly that
// amount, and the order is saved as "created". The browser then opens Razorpay Checkout with { keyId, rzpOrderId, amount, currency }.
// Physical items ship inside India only. Digital items need no address.
const { EMAIL_RE, clean, sameOrigin } = require('../../api/_lib');
const S = require('./core');

const bad = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!sameOrigin(req)) return bad(res, 'Request blocked.', 403);
  const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return bad(res, 'Payments are not set up yet.', 503);
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b && typeof b === 'object' ? b : {};

  try {
    if (await S.limited(req, 'checkout', 20, 600)) return bad(res, 'Too many attempts. Please wait a few minutes.', 429);

    // items
    const want = Array.isArray(b.items) ? b.items : [];
    if (!want.length || want.length > S.MAX_LINES) return bad(res, 'Your cart is empty.');
    const seen = new Set(), lines = [];
    for (const it of want) {
      const p = S.find(it && it.id), qty = Number(it && it.qty);
      if (!p) return bad(res, 'One of the items is no longer available.');
      if (!Number.isInteger(qty) || qty < 1 || qty > S.MAX_QTY) return bad(res, 'Pick a quantity between 1 and ' + S.MAX_QTY + '.');
      if (seen.has(p.id)) return bad(res, 'Each item can appear once in the cart.');
      seen.add(p.id);
      lines.push({ id: p.id, name: p.name, type: p.type === 'digital' ? 'digital' : 'physical', unit: S.paise(p.priceInr), qty });
    }
    const stock = await S.stockOf(lines.map(l => l.id));
    for (const l of lines) if (l.id in stock && stock[l.id] < l.qty) return bad(res, l.name + (stock[l.id] > 0 ? ' has only ' + stock[l.id] + ' left.' : ' is out of stock.'));

    // customer
    const c = b.customer || {}, name = clean(c.name, 80), email = clean(c.email, 254).toLowerCase();
    if (!name) return bad(res, 'Please tell us your name.');
    if (!EMAIL_RE.test(email)) return bad(res, 'That email address does not look right.');
    const phone = String(c.phone || '').replace(/[\s()-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
    const physical = lines.some(l => l.type === 'physical');
    if (physical ? !/^[6-9]\d{9}$/.test(phone) : phone && !/^[6-9]\d{9}$/.test(phone)) return bad(res, 'Please enter a valid 10-digit Indian mobile number.');

    // shipping address (physical items only, India only)
    let shipTo = null;
    if (physical) {
      const s = b.shipping || {};
      shipTo = { line1: clean(s.line1, 120), line2: clean(s.line2, 120), city: clean(s.city, 60), state: clean(s.state, 60), pin: String(s.pin || '').replace(/\s/g, ''), country: 'IN' };
      if (shipTo.line1.length < 5 || shipTo.city.length < 2 || shipTo.state.length < 2) return bad(res, 'Please fill in your full delivery address.');
      if (!/^[1-9]\d{5}$/.test(shipTo.pin)) return bad(res, 'Please enter a valid 6-digit PIN code.');
    }

    // money, in paise
    const subtotal = lines.reduce((t, l) => t + l.unit * l.qty, 0);
    const physicalSub = lines.filter(l => l.type === 'physical').reduce((t, l) => t + l.unit * l.qty, 0);
    const ship = physical && physicalSub < S.paise(S.catalog.shipping.freeAboveInr) ? S.paise(S.catalog.shipping.flatInr) : 0;
    const total = subtotal + ship;
    if (!(total >= 100) || total > S.MAX_TOTAL_PAISE) return bad(res, 'This order total is not allowed.');

    const id = S.newId();
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, currency: 'INR', receipt: id, notes: { order: id } }),
      signal: AbortSignal.timeout(10000),
    });
    const rz = await r.json().catch(() => ({}));
    if (!r.ok || !rz.id) { console.error('razorpay order failed:', r.status, rz && rz.error && rz.error.description); return bad(res, 'Could not start the payment. Please try again.', 502); }

    const order = { id, status: 'created', createdAt: new Date().toISOString(), rzpOrderId: rz.id, currency: 'INR', lines, subtotal, shipping: ship, total, customer: { name, email, phone }, shipTo, physical, fulfil: physical ? 'pending' : 'na', events: [{ t: new Date().toISOString(), type: 'created' }] };
    await S.saveOrder(order);
    const { redis } = require('../../api/_lib');
    await redis([['SET', 'shop:rzp:' + rz.id, id, 'EX', 7776000], ['LPUSH', 'shop:orders', id], ['LPUSH', 'shop:uo:' + email, id], ['LTRIM', 'shop:uo:' + email, 0, 199]]);
    try { await require('../portal/stats').bump({ checkouts: 1 }); await require('../portal/analytics').bumpEvent('checkout_created'); } catch (e) { console.error('stats failed:', e.message); }
    return res.status(200).json({ ok: true, orderId: id, key: S.orderKey(order), keyId, rzpOrderId: rz.id, amount: total, currency: 'INR', prefill: { name, email, contact: phone } });
  } catch (e) {
    console.error('checkout failed:', e.message);
    return bad(res, 'Something went wrong. Please try again.', 503);
  }
};
