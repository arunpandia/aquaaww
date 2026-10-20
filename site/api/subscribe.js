// POST /api/subscribe  { name, email, os }  ->  stores the lead, returns the download URL.
// Works with fetch (JSON reply) and with a plain HTML form post (303 redirect to the file).
const crypto = require('crypto');
const { redis, DL, EMAIL_RE, clean, sameOrigin } = require('./_lib');
const { isDisposable } = require('./_disposable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const fail = (code, msg) => {
    if (wantsJson) return res.status(code).json({ ok: false, error: msg });
    res.setHeader('Location', '/aquaaww/?error=' + encodeURIComponent(msg));
    return res.status(303).end();
  };
  const done = (url) => {
    if (wantsJson) return res.status(200).json({ ok: true, url });
    res.setHeader('Location', url);
    return res.status(303).end();
  };

  if (!sameOrigin(req)) return fail(403, 'Request blocked.');
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const os = DL[b.os] ? b.os : null;
  if (!os) return fail(400, 'Pick Android, Windows or Mac.');
  if (b.company) return done(DL[os]); // honeypot: bots fill this, people never see it

  const name = clean(b.name, 80);
  const email = clean(b.email, 254).toLowerCase();
  if (name.length < 1) return fail(400, 'Please tell us your name.');
  if (!EMAIL_RE.test(email)) return fail(400, 'That email address does not look right.');
  if (isDisposable(email)) return fail(400, 'Please use a permanent email address, not a temporary one.');

  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const h = crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'tango')).digest('hex').slice(0, 24);
    const rk = 'rl:' + h;
    const [count, , prev] = (await redis([['INCR', rk], ['EXPIRE', rk, 3600, 'NX'], ['HGET', 'leads', email]])).map(r => r.result);
    if (count > 12) return fail(429, 'Too many tries. Please wait a little and try again.');

    const old = prev ? JSON.parse(prev) : null;
    const now = new Date().toISOString();
    const rec = {
      name, email,
      platforms: Array.from(new Set([...(old ? old.platforms : []), os])),
      first: old ? old.first : now,
      last: now,
      downloads: (old ? old.downloads : 0) + 1,
      unsubscribed: old ? !!old.unsubscribed : false,
      consent: { terms: true, marketing: true, at: old && old.consent ? old.consent.at : now, version: '2026-10' },
    };
    const day = now.slice(0, 10);
    await redis([['HSET', 'leads', email, JSON.stringify(rec)], ['HINCRBY', 'stats:downloads', os, 1], ['HINCRBY', 'stats:funnel', 'done:' + os, 1], ['HINCRBY', 'stats:day:' + day, 'done:' + os, 1]]);
  } catch (e) {
    // the database is down: never keep someone from the app they asked for. The lead is lost, the log says so.
    console.error('subscribe failed (download still given):', e.message, email);
  }
  return done(DL[os]);
};
