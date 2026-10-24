// Email one-time-code sign-in. One flow for registering and for signing in, for customers and for admins:
//   POST /api/auth/request { email, portal?: "admin" }   -> emails a 6-digit code (valid 10 minutes). Always answers the same, whoever the address is.
//   POST /api/auth/verify  { email, code, portal?, name? } -> checks the code, creates the account on first use, sets the session cookie.
//   POST /api/auth/logout                                  -> ends the session.     GET /api/auth/me -> who is signed in.
// A code is needed every time: there are no passwords. Admins are the addresses listed in ADMIN_EMAILS (Vercel), nobody else can get an admin session.
const crypto = require('crypto');
const C = require('./core');
const { sendMail, configured } = require('./mail');
const { isDisposable } = require('../../api/_disposable');
const stats = require('./stats');

const OTP_TTL = 600, MAX_TRIES = 5;
const otpKey = (email, portal) => 'otp:' + C.hmac(email + '|' + portal);

exports.request = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!C.sameSite(req) && req.headers.origin) return C.send(res, 403, { ok: false, error: 'Request blocked.' });
  if (!C.secret()) return C.send(res, 503, { ok: false, error: 'Sign-in is not set up yet.' });
  const b = C.readBody(req), email = C.normEmail(b.email), portal = b.portal === 'admin' ? 'admin' : 'user';
  if (!C.emailOk(email)) return C.send(res, 400, { ok: false, error: 'That email address does not look right.' });
  const generic = { ok: true, message: 'If this address can sign in, a 6-digit code is on its way. It works for 10 minutes.' };
  try {
    if (await C.limited('otp-email', email, 5, 3600) || await C.limited('otp-ip', C.ipOf(req), 20, 3600)) return C.send(res, 429, { ok: false, error: 'Too many codes requested. Please wait a while and try again.' });
    if (portal === 'admin' && !C.isAdminEmail(email)) return C.send(res, 200, generic);          // same answer, nothing sent
    if (portal === 'user' && isDisposable(email)) return C.send(res, 400, { ok: false, error: 'Please use a real email address, not a temporary one.' });
    if (!configured()) return C.send(res, 503, { ok: false, error: 'Email sign-in is not set up yet.' });
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await C.redis([['SET', otpKey(email, portal), C.hmac(email + ':' + code), 'EX', OTP_TTL], ['DEL', otpKey(email, portal) + ':n']]);
    await sendMail({ to: email, subject: 'Your Dusktillus sign-in code: ' + code,
      text: `Your sign-in code is ${code}.\n\nIt works for 10 minutes and can be used once. If you did not ask for it, you can ignore this email; nobody can sign in without the code.` });
    return C.send(res, 200, generic);
  } catch (e) {
    console.error('otp request failed:', e.message);
    return C.send(res, 503, { ok: false, error: 'Could not send the code right now. Please try again.' });
  }
};

exports.verify = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!C.sameSite(req) && req.headers.origin) return C.send(res, 403, { ok: false, error: 'Request blocked.' });
  const b = C.readBody(req), email = C.normEmail(b.email), portal = b.portal === 'admin' ? 'admin' : 'user', code = String(b.code || '').replace(/\s/g, '');
  const bad = () => C.send(res, 400, { ok: false, error: 'That code is not right or has expired. Request a new one.' });
  if (!C.emailOk(email) || !/^\d{6}$/.test(code)) return bad();
  try {
    if (await C.limited('otp-verify-ip', C.ipOf(req), 30, 600)) return C.send(res, 429, { ok: false, error: 'Too many attempts. Please wait a few minutes.' });
    const k = otpKey(email, portal);
    const [want, tries] = (await C.redis([['GET', k], ['INCR', k + ':n'], ['EXPIRE', k + ':n', OTP_TTL, 'NX']])).map(x => x.result);
    if (!want) return bad();
    if (tries > MAX_TRIES) { await C.redis([['DEL', k], ['DEL', k + ':n']]); return bad(); }
    if (!C.same(want, C.hmac(email + ':' + code))) return bad();
    await C.redis([['DEL', k], ['DEL', k + ':n']]);                                   // a code works once

    if (portal === 'admin' && !C.isAdminEmail(email)) return bad();
    let u = await C.getUser(email), isNew = false;
    if (!u) { isNew = true; u = { email, name: C.clean(b.name, 80), phone: '', createdAt: new Date().toISOString() }; }
    else if (!u.name && b.name) u.name = C.clean(b.name, 80);
    u.lastLoginAt = new Date().toISOString();
    await C.saveUser(u);
    if (isNew && portal === 'user') await stats.bump({ signups: 1 });       // admins are not customer sign-ups
    await C.createSession(res, email, portal);
    return C.send(res, 200, { ok: true, role: portal === 'admin' ? 'admin' : 'user', isNew, user: { email: u.email, name: u.name, phone: u.phone } });
  } catch (e) {
    console.error('otp verify failed:', e.message);
    return C.send(res, 503, { ok: false, error: 'Something went wrong. Please try again.' });
  }
};

exports.logout = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!C.sameSite(req)) return C.send(res, 403, { ok: false });
  try { await C.endSession(req, res); } catch { /* the cookie is cleared anyway */ }
  return C.send(res, 200, { ok: true });
};

exports.me = async (req, res) => {
  try {
    const s = await C.getSession(req);
    if (!s) return C.send(res, 401, { ok: false });
    const u = await C.getUser(s.e);
    return C.send(res, 200, { ok: true, role: s.r, user: { email: s.e, name: (u && u.name) || '', phone: (u && u.phone) || '' } });
  } catch { return C.send(res, 503, { ok: false }); }
};
