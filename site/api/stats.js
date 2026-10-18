// GET /api/stats  (header: Authorization: Bearer <LEADS_TOKEN>)  ->  funnel totals and per-day numbers as JSON.
const crypto = require('crypto');
const { redis } = require('./_lib');

module.exports = async (req, res) => {
  const want = process.env.LEADS_TOKEN;
  if (!want) return res.status(404).end();
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(got), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).end();
  try {
    const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
    const out = await redis([['HGETALL', 'stats:funnel'], ...days.map(d => ['HGETALL', 'stats:day:' + d])]);
    const obj = r => { const o = {}; for (let i = 0; i < (r || []).length; i += 2) o[r[i]] = +r[i + 1]; return o; };
    const sum = o => {
      const s = { opened: 0, completed: 0, left: 0, demoTaps: 0, demoIDrank: 0 };
      for (const k in o) { if (k.startsWith('open:')) s.opened += o[k]; if (k.startsWith('done:')) s.completed += o[k]; if (k.startsWith('demo:')) s.demoTaps += o[k]; if (k.startsWith('demoOk:')) s.demoIDrank += o[k]; }
      s.left = Math.max(0, s.opened - s.completed);
      s.leftPercent = s.opened ? Math.round(100 * s.left / s.opened) : 0;
      return s;
    };
    const total = obj(out[0].result);
    const perDay = {}; days.forEach((d, i) => { const o = obj(out[i + 1].result); if (Object.keys(o).length) perDay[d] = { ...o, ...sum(o) }; });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ summary: sum(total), byPlatform: total, last30Days: perDay });
  } catch (e) { return res.status(503).end(); }
};
