// GET /api/download?o=<orderId>&i=<line>&t=<token> -> redirects a buyer of a PAID digital item to the file. The link is signed, only works for paid orders,
// stops after DOWNLOAD_LIMIT uses or DOWNLOAD_DAYS days, and the real file address is never shown on any page.
const { redis } = require('../../api/_lib');
const S = require('./core');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const i = Number(req.query.i);
  try {
    const o = await S.getOrder(String(req.query.o || ''));
    const line = o && Number.isInteger(i) && o.lines[i];
    if (!line || line.type !== 'digital' || !S.same(S.sign('d:' + o.id + ':' + i), String(req.query.t || ''))) return res.status(404).end();
    if (o.status !== 'paid') return res.status(402).end();
    if (Date.now() - Date.parse(o.paidAt) > S.DOWNLOAD_DAYS * 86400000) return res.status(410).end();
    const p = S.find(line.id);
    if (!p || !/^https:\/\//.test(p.file || '')) return res.status(404).end();
    const used = (await redis([['INCR', `shop:dl:${o.id}:${i}`]]))[0].result;
    if (used > S.DOWNLOAD_LIMIT) return res.status(429).end();
    res.setHeader('Location', p.file);
    return res.status(302).end();
  } catch (e) { return res.status(503).end(); }
};
