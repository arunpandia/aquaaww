// Admin endpoints. Sign in at /api/auth/request + /api/auth/verify with portal "admin" using an address listed in ADMIN_EMAILS.
//   GET  /api/admin/stats?days=30        orders, revenue, products, customers, shipping queue, support queue, low stock
//   GET  /api/admin/orders?status=paid&fulfil=pending&q=&limit=50&offset=0     GET /api/admin/order?id=   POST /api/admin/order { id, fulfil, carrier, tracking, trackingUrl, note, notePublic }
//   POST /api/admin/refund { id, amountInr, note }   writes down a refund you made in Razorpay (so net revenue is right); it does not move money
//   GET  /api/admin/customers            GET /api/admin/customer?email=
//   GET  /api/admin/tickets?status=open  GET /api/admin/ticket?id=   POST /api/admin/ticket-reply { id, message }   POST /api/admin/ticket-status { id, status }
//   GET  /api/admin/analytics?days=30    GET /api/admin/heatmap?path=/aquaaww/&device=desktop
const C = require('./core');
const S = require('../shop/core');
const stats = require('./stats');
const analytics = require('./analytics');
const support = require('./support');
const account = require('./account');
const notify = require('./notify');

const FULFIL = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
const days = req => Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
const getOnly = (req, res) => { if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.status(405).end(); return false; } return true; };
const guard = async (req, res) => { try { return await C.requireAdmin(req, res); } catch (e) { C.send(res, 503, { ok: false }); return null; } };
const fail = (res, e, what) => { console.error(what + ' failed:', e.message); return C.send(res, 503, { ok: false }); };

async function recentOrders(n = 1000) {
  const ids = (await C.redis([['LRANGE', 'shop:orders', 0, n - 1]]))[0].result || [];
  if (!ids.length) return [];
  return ((await C.redis([['MGET', ...ids.map(i => 'shop:order:' + i)]]))[0].result || []).filter(Boolean).map(r => JSON.parse(r));
}
const adminView = o => ({ id: o.id, status: o.status, fulfil: o.fulfil, createdAt: o.createdAt, paidAt: o.paidAt || null, total: o.total / 100, shipping: o.shipping / 100, physical: !!o.physical,
  items: o.lines.map(l => ({ id: l.id, name: l.name, type: l.type, qty: l.qty, price: l.unit / 100 })), customer: o.customer, shipTo: o.shipTo || null,
  carrier: o.carrier || '', tracking: o.tracking || '', trackingUrl: S.trackingUrlOf(o), paymentId: o.paymentId || '', refunded: (o.refunded || 0) / 100, events: o.events || [] });

exports.stats = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try {
    const [summary, orders, open] = await Promise.all([stats.summary(days(req)), recentOrders(), C.redis([['LRANGE', 'tk:all', 0, 199]])]);
    const paid = orders.filter(o => o.status === 'paid'), phys = paid.filter(o => o.physical);
    const byFulfil = {}; for (const o of phys) byFulfil[o.fulfil] = (byFulfil[o.fulfil] || 0) + 1;
    const tkIds = open[0].result || [], tks = tkIds.length ? ((await C.redis([['MGET', ...tkIds.map(i => 'tk:' + i)]]))[0].result || []).filter(Boolean).map(r => JSON.parse(r)) : [];
    const stock = await S.stockOf(S.catalog.products.filter(p => p.active !== false).map(p => p.id));
    return C.send(res, 200, { ok: true, ...summary,
      shipping: { awaitingDispatch: (byFulfil.pending || 0) + (byFulfil.packed || 0), pending: byFulfil.pending || 0, packed: byFulfil.packed || 0, shipped: byFulfil.shipped || 0, delivered: byFulfil.delivered || 0, cancelled: byFulfil.cancelled || 0 },
      abandonedCheckouts: orders.filter(o => o.status === 'created' && Date.now() - Date.parse(o.createdAt) > 3600e3 && Date.now() - Date.parse(o.createdAt) < 7 * 864e5).length,
      support: { open: tks.filter(t => t.status === 'open').length, answered: tks.filter(t => t.status === 'answered').length, closed: tks.filter(t => t.status === 'closed').length },
      lowStock: Object.entries(stock).filter(([, n]) => n <= 5).map(([id, left]) => ({ id, left })),
      recentOrders: paid.slice(0, 10).map(adminView) });
  } catch (e) { return fail(res, e, 'admin stats'); }
};

exports.orders = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try {
    const status = String(req.query.status || 'paid'), fulfil = String(req.query.fulfil || ''), q = String(req.query.q || '').toLowerCase().trim();
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50)), offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    let list = (await recentOrders()).filter(o => status === 'all' || o.status === status).filter(o => !fulfil || o.fulfil === fulfil)
      .filter(o => !q || o.id.toLowerCase().includes(q) || o.customer.email.includes(q) || o.customer.name.toLowerCase().includes(q) || (o.tracking || '').toLowerCase().includes(q));
    return C.send(res, 200, { ok: true, total: list.length, orders: list.slice(offset, offset + limit).map(adminView) });
  } catch (e) { return fail(res, e, 'admin orders'); }
};

exports.order = async (req, res) => {
  const s = await guard(req, res); if (!s) return;
  try {
    const b = req.method === 'POST' ? C.readBody(req) : req.query, o = await S.getOrder(String(b.id || ''));
    if (!o) return C.send(res, 404, { ok: false, error: 'No such order.' });
    if (req.method === 'POST') {
      const before = o.fulfil, now = new Date().toISOString();
      if (b.fulfil !== undefined) {
        if (!FULFIL.includes(b.fulfil)) return C.send(res, 400, { ok: false, error: 'fulfil must be one of ' + FULFIL.join(', ') });
        if (b.fulfil !== 'pending' && o.status !== 'paid') return C.send(res, 400, { ok: false, error: 'Only a paid order can be packed or shipped.' });
        if (b.fulfil !== o.fulfil) { o.fulfil = b.fulfil; o.events = [...(o.events || []), { t: now, type: b.fulfil === 'pending' ? 'note' : b.fulfil }]; }
      }
      if (b.carrier !== undefined) o.carrier = C.clean(b.carrier, 60);
      if (b.tracking !== undefined) o.tracking = C.clean(b.tracking, 80);
      if (b.trackingUrl !== undefined) { if (b.trackingUrl && !/^https:\/\/[^\s]+$/.test(b.trackingUrl)) return C.send(res, 400, { ok: false, error: 'trackingUrl must start with https://' }); o.trackingUrl = String(b.trackingUrl).slice(0, 300); }
      if (b.note) o.events = [...(o.events || []), { t: now, type: 'note', note: C.clean(b.note, 300), public: !!b.notePublic }];
      o.updatedAt = now;
      await S.saveOrder(o);
      if (o.fulfil === 'shipped' && before !== 'shipped') await notify.shipped({ ...o, trackingUrl: S.trackingUrlOf(o) });
    } else if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
    return C.send(res, 200, { ok: true, order: adminView(o) });
  } catch (e) { return fail(res, e, 'admin order'); }
};

exports.refund = async (req, res) => {
  const s = await guard(req, res); if (!s) return;
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try {
    const b = C.readBody(req), o = await S.getOrder(String(b.id || '')), amount = Math.round(Number(b.amountInr) * 100);
    if (!o || o.status !== 'paid') return C.send(res, 404, { ok: false, error: 'No such paid order.' });
    if (!(amount > 0) || amount + (o.refunded || 0) > o.total) return C.send(res, 400, { ok: false, error: 'The refund must be more than 0 and not more than what is left of the order total.' });
    o.refunded = (o.refunded || 0) + amount;
    o.events = [...(o.events || []), { t: new Date().toISOString(), type: 'refund', note: C.clean(b.note, 200) || undefined, public: true }];
    await S.saveOrder(o); await stats.recordRefund(amount);
    return C.send(res, 200, { ok: true, order: adminView(o) });
  } catch (e) { return fail(res, e, 'admin refund'); }
};

exports.customers = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50)), emails = (await C.redis([['ZREVRANGE', 'cust:idx', 0, limit - 1]]))[0].result || [];
    const hs = emails.length ? await C.redis(emails.map(e => ['HGETALL', 'cust:' + e])) : [];
    return C.send(res, 200, { ok: true, customers: emails.map((email, i) => { const h = stats.obj(hs[i].result), raw = hs[i].result || []; const name = raw[raw.indexOf('name') + 1] || '';
      return { email, name, orders: h.orders || 0, spentInr: stats.money(h.spent), firstOrder: raw[raw.indexOf('first') + 1] || null, lastOrder: raw[raw.indexOf('last') + 1] || null }; }) });
  } catch (e) { return fail(res, e, 'admin customers'); }
};

exports.customer = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try {
    const email = C.normEmail(req.query.email);
    if (!C.emailOk(email)) return C.send(res, 400, { ok: false });
    const [u, orders, tickets] = await Promise.all([C.getUser(email), account.ordersOf(email), support.ticketsOf(email)]);
    if (!u && !orders.length) return C.send(res, 404, { ok: false, error: 'No such customer.' });
    const paid = orders.filter(o => o.status === 'paid');
    return C.send(res, 200, { ok: true, profile: u && { email: u.email, name: u.name || '', phone: u.phone || '', memberSince: u.createdAt, lastLoginAt: u.lastLoginAt || null },
      orderCount: paid.length, spentInr: paid.reduce((t, o) => t + o.total, 0) / 100, orders: paid.map(adminView), tickets: tickets.map(support.brief) });
  } catch (e) { return fail(res, e, 'admin customer'); }
};

exports.tickets = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try {
    const status = String(req.query.status || 'open'), limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const ids = (await C.redis([['LRANGE', 'tk:all', 0, 299]]))[0].result || [];
    const list = ids.length ? ((await C.redis([['MGET', ...ids.map(i => 'tk:' + i)]]))[0].result || []).filter(Boolean).map(r => JSON.parse(r)) : [];
    return C.send(res, 200, { ok: true, tickets: list.filter(t => status === 'all' || t.status === status).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit).map(support.brief) });
  } catch (e) { return fail(res, e, 'admin tickets'); }
};

exports.ticket = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try { const t = await support.getTicket(String(req.query.id || '')); return t ? C.send(res, 200, { ok: true, ticket: support.full(t) }) : C.send(res, 404, { ok: false }); }
  catch (e) { return fail(res, e, 'admin ticket'); }
};

exports['ticket-reply'] = async (req, res) => {
  const s = await guard(req, res); if (!s) return;
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try {
    const b = C.readBody(req), t = await support.getTicket(String(b.id || '')), text = C.clean(b.message, 3000);
    if (!t) return C.send(res, 404, { ok: false });
    if (text.length < 2) return C.send(res, 400, { ok: false, error: 'Please write a message.' });
    const now = new Date().toISOString(); t.messages.push({ from: 'admin', text, at: now }); t.status = 'answered'; t.updatedAt = now;
    await support.saveTicket(t); await notify.ticketReplied(t, text);
    return C.send(res, 200, { ok: true, ticket: support.full(t) });
  } catch (e) { return fail(res, e, 'admin ticket reply'); }
};

exports['ticket-status'] = async (req, res) => {
  const s = await guard(req, res); if (!s) return;
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try {
    const b = C.readBody(req), t = await support.getTicket(String(b.id || ''));
    if (!t) return C.send(res, 404, { ok: false });
    if (!['open', 'answered', 'closed'].includes(b.status)) return C.send(res, 400, { ok: false, error: 'status must be open, answered or closed' });
    t.status = b.status; t.updatedAt = new Date().toISOString(); await support.saveTicket(t);
    return C.send(res, 200, { ok: true, ticket: support.brief(t) });
  } catch (e) { return fail(res, e, 'admin ticket status'); }
};

exports.analytics = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try { return C.send(res, 200, { ok: true, ...(await analytics.report(Math.min(90, days(req)))) }); } catch (e) { return fail(res, e, 'admin analytics'); }
};

exports.heatmap = async (req, res) => {
  const s = await guard(req, res); if (!s || !getOnly(req, res)) return;
  try {
    const h = await analytics.heatmap(String(req.query.path || '/'), String(req.query.device || 'desktop'));
    return h ? C.send(res, 200, { ok: true, ...h }) : C.send(res, 400, { ok: false, error: 'Give a path like /aquaaww/ and a device of mobile, tablet or desktop.' });
  } catch (e) { return fail(res, e, 'admin heatmap'); }
};
