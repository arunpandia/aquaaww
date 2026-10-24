// Shared helpers for sign-in, sessions and request checks. Everything stateful lives in Redis; nothing here touches the UI.
const crypto = require('crypto');
const { redis, EMAIL_RE, clean } = require('../../api/_lib');

const secret = () => process.env.AUTH_SECRET || process.env.SHOP_TOKEN_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '';
const hmac = s => crypto.createHmac('sha256', secret()).update(String(s)).digest('hex');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const adminEmails = () => (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const isAdminEmail = e => adminEmails().includes(String(e).toLowerCase());
const normEmail = e => clean(e, 254).toLowerCase();
const emailOk = e => EMAIL_RE.test(e);

const ipOf = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
const first = async cmd => (await redis([cmd]))[0].result;
const readBody = req => { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } return b && typeof b === 'object' ? b : {}; };
const send = (res, code, obj) => { res.setHeader('Cache-Control', 'no-store'); return res.status(code).json(obj); };

// India Standard Time calendar day (YYYY-MM-DD): the day an order or visit belongs to for the business
const istDay = (d = new Date()) => new Date(d.getTime() + 19800000).toISOString().slice(0, 10);
const lastDays = n => Array.from({ length: n }, (_, i) => istDay(new Date(Date.now() - i * 864e5)));

// true when this visitor has used up `n` calls per `sec` seconds for this action
async function limited(action, key, n, sec) {
  const k = 'rl:' + action + ':' + sha(key).slice(0, 24);
  const r = await redis([['INCR', k], ['EXPIRE', k, sec, 'NX']]);
  return r[0].result > n;
}

// A cookie-carrying request that changes something must come from our own pages: same Origin, or a header a foreign site cannot add without our consent.
const sameSite = req => {
  const sf = req.headers['sec-fetch-site'], o = req.headers.origin;
  if (sf && !['same-origin', 'none'].includes(sf)) return false;
  if (o) { try { return new URL(o).host === req.headers.host; } catch { return false; } }
  return sf === 'same-origin' || !!req.headers['x-requested-with'];
};

const SESSION_DAYS = 30, ADMIN_HOURS = 12;
const cookieToken = req => { const m = /(?:^|;\s*)dt_session=([A-Za-z0-9_-]{43})/.exec(req.headers.cookie || ''); return m && m[1]; };
const setCookie = (res, token, maxAge) => res.setHeader('Set-Cookie', `dt_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);

async function createSession(res, email, role) {
  const token = crypto.randomBytes(32).toString('base64url');
  const ttl = role === 'admin' ? ADMIN_HOURS * 3600 : SESSION_DAYS * 86400;
  await first(['SET', 'sess:' + sha(token), JSON.stringify({ e: email, r: role, iat: Date.now() }), 'EX', ttl]);
  setCookie(res, token, ttl);
}
async function getSession(req) {
  const t = cookieToken(req);
  if (!t) return null;
  const raw = await first(['GET', 'sess:' + sha(t)]);
  if (!raw) return null;
  const s = JSON.parse(raw);
  if (s.r === 'admin' && !isAdminEmail(s.e)) return null;      // removed from ADMIN_EMAILS: the session stops working at once
  return s;
}
async function endSession(req, res) {
  const t = cookieToken(req);
  if (t) await first(['DEL', 'sess:' + sha(t)]);
  setCookie(res, '', 0);
}

// guards: return the session, or answer 401/403 and return null
async function requireUser(req, res) {
  const s = await getSession(req);
  if (!s) { send(res, 401, { ok: false, error: 'Please sign in.' }); return null; }
  if (req.method !== 'GET' && !sameSite(req)) { send(res, 403, { ok: false, error: 'Request blocked.' }); return null; }
  return s;
}
async function requireAdmin(req, res) {
  const s = await requireUser(req, res);
  if (!s) return null;
  if (s.r !== 'admin') { send(res, 403, { ok: false, error: 'Admins only.' }); return null; }
  return s;
}

const getUser = async email => { const r = await first(['GET', 'user:' + email]); return r ? JSON.parse(r) : null; };
const saveUser = u => first(['SET', 'user:' + u.email, JSON.stringify(u)]);

module.exports = { redis, clean, secret, hmac, sha, same, adminEmails, isAdminEmail, normEmail, emailOk, ipOf, first, readBody, send, istDay, lastDays, limited, sameSite,
  createSession, getSession, endSession, requireUser, requireAdmin, getUser, saveUser };
