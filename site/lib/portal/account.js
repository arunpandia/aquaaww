// Signed-in customer endpoints (session cookie from /api/auth/verify). A customer only ever sees orders placed with their own verified email.
//   GET  /api/account/profile            POST /api/account/profile { name, phone }
//   GET  /api/account/orders             all their paid orders, newest first, with status and tracking
//   GET  /api/account/order?id=DT...     one order: items, address, status timeline, tracking link, downloads
const C = require('./core');
const S = require('../shop/core');

const phoneOk = p => /^[6-9]\d{9}$/.test(p);
const TIMELINE = { created: 'Order placed', paid: 'Payment received', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refund: 'Refund recorded', note: 'Update' };

// what a customer may see of an order (never the Razorpay ids)
function view(o, detail) {
  const base = { id: o.id, status: o.status, fulfil: o.fulfil, createdAt: o.createdAt, paidAt: o.paidAt || null, total: o.total / 100, currency: o.currency,
    items: o.lines.map(l => ({ name: l.name, type: l.type, qty: l.qty, price: l.unit / 100 })), physical: !!o.physical,
    carrier: o.carrier || '', tracking: o.tracking || '', trackingUrl: o.status === 'paid' ? S.trackingUrlOf(o) : '' };
  if (!detail) return base;
  return { ...base, subtotal: o.subtotal / 100, shipping: o.shipping / 100, shipTo: o.shipTo || null, refunded: (o.refunded || 0) / 100,
    timeline: (o.events || []).filter(e => e.type !== 'note' || e.public).map(e => ({ at: e.t, type: e.type, label: TIMELINE[e.type] || e.type, note: e.public ? e.note : undefined })),
    downloads: S.downloadsOf(o) };
}

exports.profile = async (req, res) => {
  const s = await C.requireUser(req, res); if (!s) return;
  try {
    const u = (await C.getUser(s.e)) || { email: s.e, createdAt: new Date().toISOString() };
    if (req.method === 'POST') {
      const b = C.readBody(req), name = C.clean(b.name, 80), phone = String(b.phone || '').replace(/[\s()-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
      if (b.phone !== undefined && phone && !phoneOk(phone)) return C.send(res, 400, { ok: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
      if (b.name !== undefined) u.name = name;
      if (b.phone !== undefined) u.phone = phone;
      await C.saveUser(u);
    } else if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    return C.send(res, 200, { ok: true, profile: { email: u.email, name: u.name || '', phone: u.phone || '', memberSince: u.createdAt } });
  } catch (e) { return C.send(res, 503, { ok: false }); }
};

async function ordersOf(email) {
  const ids = (await C.redis([['LRANGE', 'shop:uo:' + email, 0, 99]]))[0].result || [];
  if (!ids.length) return [];
  const raws = (await C.redis([['MGET', ...ids.map(i => 'shop:order:' + i)]]))[0].result || [];
  return raws.filter(Boolean).map(r => JSON.parse(r)).filter(o => o.customer.email === email);
}

exports.orders = async (req, res) => {
  const s = await C.requireUser(req, res); if (!s) return;
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try { return C.send(res, 200, { ok: true, orders: (await ordersOf(s.e)).filter(o => o.status === 'paid').map(o => view(o, false)) }); }
  catch (e) { return C.send(res, 503, { ok: false }); }
};

exports.order = async (req, res) => {
  const s = await C.requireUser(req, res); if (!s) return;
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try {
    const o = await S.getOrder(String(req.query.id || ''));
    if (!o || o.customer.email !== s.e || o.status !== 'paid') return C.send(res, 404, { ok: false, error: 'No such order.' });
    return C.send(res, 200, { ok: true, order: view(o, true) });
  } catch (e) { return C.send(res, 503, { ok: false }); }
};

module.exports.view = view;
module.exports.ordersOf = ordersOf;
