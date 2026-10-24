// GET /api/order?o=<orderId>&k=<key>  -> the buyer's view of an order (status, tracking, download links). The key comes from checkout and in emails.
const S = require('./core');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try {
    const o = await S.getOrder(String(req.query.o || ''));
    if (!o || !S.same(S.orderKey(o), String(req.query.k || ''))) return res.status(404).json({ ok: false });
    return res.status(200).json({
      ok: true, id: o.id, status: o.status, fulfil: o.fulfil, carrier: o.carrier || '', tracking: o.tracking || '', total: o.total / 100, currency: o.currency,
      lines: o.lines.map(l => ({ name: l.name, type: l.type, qty: l.qty, price: l.unit / 100 })), shipping: o.shipping / 100, downloads: S.downloadsOf(o),
    });
  } catch (e) { return res.status(503).json({ ok: false }); }
};
