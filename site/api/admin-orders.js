// Order management for you, not for visitors. Needs  Authorization: Bearer <SHOP_ADMIN_TOKEN>  (set a long random string in Vercel).
//   GET  /api/admin-orders?status=paid&limit=100          -> JSON list, newest first (status: created | paid | all)
//   GET  /api/admin-orders?status=paid&format=csv         -> the same as a CSV for a spreadsheet
//   POST /api/admin-orders { id, fulfil, carrier, tracking } -> fulfil: pending | packed | shipped | delivered | cancelled
const { redis } = require('./_lib');
const S = require('./_shop');

const FULFIL = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';   // CSV-safe, no spreadsheet formulas

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const t = process.env.SHOP_ADMIN_TOKEN || '';
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (t.length < 16 || !S.same(got, t)) return res.status(401).end();
  try {
    if (req.method === 'POST') {
      let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
      b = b || {};
      const o = await S.getOrder(String(b.id || ''));
      if (!o) return res.status(404).json({ ok: false, error: 'No such order.' });
      if (b.fulfil !== undefined) { if (!FULFIL.includes(b.fulfil)) return res.status(400).json({ ok: false, error: 'fulfil must be one of ' + FULFIL.join(', ') }); o.fulfil = b.fulfil; }
      if (b.carrier !== undefined) o.carrier = String(b.carrier).slice(0, 60);
      if (b.tracking !== undefined) o.tracking = String(b.tracking).slice(0, 80);
      o.updatedAt = new Date().toISOString();
      await S.saveOrder(o);
      return res.status(200).json({ ok: true, order: o });
    }
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100)), status = String(req.query.status || 'paid');
    const ids = (await redis([['LRANGE', 'shop:orders', 0, 999]]))[0].result || [];
    const raws = ids.length ? (await redis([['MGET', ...ids.map(i => 'shop:order:' + i)]]))[0].result : [];
    const orders = raws.filter(Boolean).map(r => JSON.parse(r)).filter(o => status === 'all' || o.status === status).slice(0, limit);
    if (req.query.format === 'csv') {
      const head = ['id', 'created', 'paid', 'status', 'fulfil', 'total_inr', 'items', 'name', 'email', 'phone', 'address', 'city', 'state', 'pin', 'carrier', 'tracking', 'payment_id'];
      const rows = orders.map(o => [o.id, o.createdAt, o.paidAt, o.status, o.fulfil, o.total / 100, o.lines.map(l => l.qty + ' x ' + l.name).join('; '), o.customer.name, o.customer.email, o.customer.phone,
        o.shipTo ? [o.shipTo.line1, o.shipTo.line2].filter(Boolean).join(', ') : '', o.shipTo && o.shipTo.city, o.shipTo && o.shipTo.state, o.shipTo && o.shipTo.pin, o.carrier, o.tracking, o.paymentId].map(q).join(','));
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.status(200).send([head.join(','), ...rows].join('\n'));
    }
    return res.status(200).json({ ok: true, count: orders.length, orders });
  } catch (e) {
    console.error('admin failed:', e.message);
    return res.status(503).json({ ok: false });
  }
};
