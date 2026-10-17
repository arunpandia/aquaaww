// GET /api/leads  (header: Authorization: Bearer <LEADS_TOKEN>)  ->  CSV of subscribers who have NOT unsubscribed.
// Disabled (404) until you set LEADS_TOKEN in Vercel. Use ?all=1 to include unsubscribed rows.
const crypto = require('crypto');
const { redis } = require('./_lib');

module.exports = async (req, res) => {
  const want = process.env.LEADS_TOKEN;
  if (!want) return res.status(404).end();
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(got), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).end();
  try {
    const [{ result }] = await redis([['HGETALL', 'leads']]);
    const rows = [];
    for (let i = 0; i < result.length; i += 2) rows.push(JSON.parse(result[i + 1]));
    const all = req.query && req.query.all === '1';
    const q = v => '"' + String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"';
    const csv = ['name,email,platforms,first_seen,last_seen,downloads,unsubscribed']
      .concat(rows.filter(r => all || !r.unsubscribed).map(r => [q(r.name), q(r.email), q(r.platforms.join(' ')), r.first, r.last, r.downloads, !!r.unsubscribed].join(','))).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  } catch (e) { return res.status(503).end(); }
};
