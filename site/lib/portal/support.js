// Support tickets, shared by customers and the admin desk.
//   customer:  GET /api/support/tickets            POST /api/support/tickets { subject, message, orderId? }
//              GET /api/support/ticket?id=TK...    POST /api/support/ticket { id, message }  (a reply)
//   admin:     see admin.js (/api/admin/tickets, /api/admin/ticket, /api/admin/ticket-reply, /api/admin/ticket-status)
// Bug reports with a screenshot can simply be sent to the support email; attachments are not stored here.
const crypto = require('crypto');
const C = require('./core');
const notify = require('./notify');
const S = require('../shop/core');

const MAX_OPEN = 5, MAX_MESSAGES = 100;
const newId = () => 'TK' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
const getTicket = async id => { const r = /^TK[A-Z0-9]{6,20}$/.test(id || '') ? await C.first(['GET', 'tk:' + id]) : null; return r ? JSON.parse(r) : null; };
const saveTicket = t => C.first(['SET', 'tk:' + t.id, JSON.stringify(t)]);
const brief = t => ({ id: t.id, subject: t.subject, status: t.status, orderId: t.orderId || '', createdAt: t.createdAt, updatedAt: t.updatedAt, messages: t.messages.length, email: t.email });
const full = t => ({ ...brief(t), messages: t.messages.map(m => ({ from: m.from, text: m.text, at: m.at })) });

async function ticketsOf(email) {
  const ids = (await C.redis([['LRANGE', 'tk:u:' + email, 0, 99]]))[0].result || [];
  const raws = ids.length ? (await C.redis([['MGET', ...ids.map(i => 'tk:' + i)]]))[0].result || [] : [];
  return raws.filter(Boolean).map(r => JSON.parse(r));
}

async function create(email, b) {
  const subject = C.clean(b.subject, 120), message = C.clean(b.message, 3000);
  if (subject.length < 3) return { error: 'Please add a short subject.' };
  if (message.length < 5) return { error: 'Please describe what you need help with.' };
  let orderId = '';
  if (b.orderId) {
    const o = await S.getOrder(String(b.orderId));
    if (!o || o.customer.email !== email) return { error: 'We could not find that order on your account.' };
    orderId = o.id;
  }
  if ((await ticketsOf(email)).filter(t => t.status !== 'closed').length >= MAX_OPEN) return { error: 'You already have ' + MAX_OPEN + ' open tickets. Please wait for a reply or close one first.' };
  const now = new Date().toISOString(), t = { id: newId(), email, subject, orderId, status: 'open', createdAt: now, updatedAt: now, messages: [{ from: 'user', text: message, at: now }] };
  await saveTicket(t);
  await C.redis([['LPUSH', 'tk:all', t.id], ['LPUSH', 'tk:u:' + email, t.id]]);
  await notify.ticketNew(t);
  return { ticket: t };
}

exports.tickets = async (req, res) => {
  const s = await C.requireUser(req, res); if (!s) return;
  try {
    if (req.method === 'POST') {
      if (await C.limited('ticket', s.e, 10, 86400)) return C.send(res, 429, { ok: false, error: 'Too many tickets today. Please try again tomorrow.' });
      const r = await create(s.e, C.readBody(req));
      return r.error ? C.send(res, 400, { ok: false, error: r.error }) : C.send(res, 200, { ok: true, ticket: full(r.ticket) });
    }
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    return C.send(res, 200, { ok: true, tickets: (await ticketsOf(s.e)).map(brief) });
  } catch (e) { return C.send(res, 503, { ok: false }); }
};

exports.ticket = async (req, res) => {
  const s = await C.requireUser(req, res); if (!s) return;
  try {
    const b = req.method === 'POST' ? C.readBody(req) : req.query, t = await getTicket(String(b.id || ''));
    if (!t || t.email !== s.e) return C.send(res, 404, { ok: false, error: 'No such ticket.' });
    if (req.method === 'POST') {
      const text = C.clean(b.message, 3000);
      if (text.length < 2) return C.send(res, 400, { ok: false, error: 'Please write a message.' });
      if (t.messages.length >= MAX_MESSAGES) return C.send(res, 400, { ok: false, error: 'This ticket is full. Please open a new one.' });
      if (await C.limited('ticket-reply', s.e, 30, 3600)) return C.send(res, 429, { ok: false, error: 'Slow down a little.' });
      t.messages.push({ from: 'user', text, at: new Date().toISOString() }); t.status = 'open'; t.updatedAt = t.messages[t.messages.length - 1].at;
      await saveTicket(t);
    } else if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    return C.send(res, 200, { ok: true, ticket: full(t) });
  } catch (e) { return C.send(res, 503, { ok: false }); }
};

module.exports.getTicket = getTicket;
module.exports.saveTicket = saveTicket;
module.exports.brief = brief;
module.exports.full = full;
module.exports.ticketsOf = ticketsOf;
