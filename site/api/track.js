// POST /api/track { e: "open" | "close" | "demo" | "demoOk", os }  ->  204. Counts how many people open the download pop-up and leave without downloading,
// and how many tap "Show how it works" (demo) and "I drank" inside it (demoOk); for demo events os is "desktop" or "phone".
const { redis, DL, sameOrigin } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!sameOrigin(req)) return res.status(204).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b && typeof b === 'object' ? b : {};
  const demo = b.e === 'demo' || b.e === 'demoOk';
  if (!(demo ? ['desktop', 'phone'].includes(b.os) : ['open', 'close'].includes(b.e) && DL[b.os])) return res.status(204).end();
  const day = new Date().toISOString().slice(0, 10), f = b.e + ':' + b.os;
  try { await redis([['HINCRBY', 'stats:funnel', f, 1], ['HINCRBY', 'stats:day:' + day, f, 1]]); } catch (e) { console.error('track failed:', e.message); }
  return res.status(204).end();
};
