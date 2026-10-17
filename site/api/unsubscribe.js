// POST /api/unsubscribe { email } -> marks the address as unsubscribed. Always answers the same, so addresses cannot be probed.
const { redis, EMAIL_RE, clean, sameOrigin } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const reply = (code, ok, msg) => {
    if (wantsJson) return res.status(code).json({ ok, message: msg });
    res.setHeader('Location', '/unsubscribe/?done=' + (ok ? '1' : '0'));
    return res.status(303).end();
  };
  if (!sameOrigin(req)) return reply(403, false, 'Request blocked.');
  const email = clean(req.body && req.body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return reply(400, false, 'That email address does not look right.');
  try {
    const [prev] = (await redis([['HGET', 'leads', email]])).map(r => r.result);
    if (prev) {
      const rec = JSON.parse(prev);
      rec.unsubscribed = true; rec.unsubscribedAt = new Date().toISOString();
      await redis([['HSET', 'leads', email, JSON.stringify(rec)]]);
    }
  } catch (e) { console.error('unsubscribe failed:', e.message); return reply(503, false, 'Please try again in a minute.'); }
  return reply(200, true, 'You are unsubscribed.');
};
