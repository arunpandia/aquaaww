// Shared helpers for the shop: catalog lookups, order storage, payment confirmation, signed links.
// Everything is in rupees on the way in and in paise inside orders (Razorpay's unit).
const crypto = require('crypto');
const { redis } = require('../../api/_lib');
const catalog = require('./catalog');
const stats = require('../portal/stats');
const notify = require('../portal/notify');

const MAX_QTY = 10, MAX_LINES = 10, MAX_TOTAL_PAISE = 500000 * 100;
const DOWNLOAD_DAYS = 60, DOWNLOAD_LIMIT = 10;

const find = id => catalog.products.find(p => p.id === id && p.active !== false);
const secret = () => process.env.SHOP_TOKEN_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '';
const sign = s => crypto.createHmac('sha256', secret()).update(s).digest('hex').slice(0, 32);
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const newId = () => 'DT' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
const paise = rupees => Math.round(rupees * 100);

const first = async cmd => (await redis([cmd]))[0].result;
async function getOrder(id) { const raw = /^DT[A-Z0-9]{6,20}$/.test(id || '') ? await first(['GET', 'shop:order:' + id]) : null; return raw ? JSON.parse(raw) : null; }
const saveOrder = o => first(['SET', 'shop:order:' + o.id, JSON.stringify(o)]);

// remaining stock for products that track it (null = unlimited)
async function stockOf(ids) {
  const tracked = ids.filter(id => Number.isFinite(find(id) && find(id).stock));
  const out = {};
  if (tracked.length) {
    const vals = (await redis([['HMGET', 'shop:stock', ...tracked]]))[0].result || [];
    tracked.forEach((id, i) => { out[id] = vals[i] === null || vals[i] === undefined ? find(id).stock : +vals[i]; });
  }
  return out;
}

// at most `n` calls per `sec` seconds for this visitor and action
async function limited(req, action, n, sec) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const k = 'shop:rl:' + action + ':' + ip;
  const r = await redis([['INCR', k], ['EXPIRE', k, sec, 'NX']]);
  return r[0].result > n;
}

// Turns a payment into a paid order exactly once, whichever of the browser or the webhook reports it first.
async function markPaid(id, payId) {
  const o = await getOrder(id);
  if (!o) return null;
  if (o.status !== 'created') return o;
  const win = await first(['SET', 'shop:paidorder:' + id, payId, 'NX']);
  if (win !== 'OK') return (await getOrder(id)) || o;
  o.status = 'paid'; o.paidAt = new Date().toISOString(); o.paymentId = payId;
  o.events = [...(o.events || []), { t: o.paidAt, type: 'paid' }];
  await saveOrder(o);
  for (const l of o.lines) {
    const p = find(l.id);
    if (p && Number.isFinite(p.stock)) {
      await redis([['HSETNX', 'shop:stock', l.id, p.stock], ['HINCRBY', 'shop:stock', l.id, -l.qty]]);
    }
  }
  try { await stats.recordPaid(o); await require('../portal/analytics').bumpEvent('order_paid'); } catch (e) { console.error('stats failed:', e.message); }
  await notify.orderPaid(o, downloadsOf(o));
  return o;
}

// where a buyer can follow the parcel: an address you set, a known courier, or a search that works for any courier
const COURIERS = { delhivery: n => 'https://www.delhivery.com/track/package/' + encodeURIComponent(n), shiprocket: n => 'https://shiprocket.co/tracking/' + encodeURIComponent(n) };
function trackingUrlOf(o) {
  if (o.trackingUrl) return o.trackingUrl;
  if (!o.tracking) return '';
  const k = String(o.carrier || '').toLowerCase().replace(/[^a-z]/g, '');
  return COURIERS[k] ? COURIERS[k](o.tracking) : 'https://www.google.com/search?q=' + encodeURIComponent((o.carrier || 'courier') + ' tracking ' + o.tracking);
}

const downloadUrl = (o, i) => `/api/download?o=${o.id}&i=${i}&t=${sign('d:' + o.id + ':' + i)}`;
const orderKey = o => sign('o:' + o.id);
const downloadsOf = o => o.status === 'paid' ? o.lines.map((l, i) => l.type === 'digital' ? { name: l.name, url: downloadUrl(o, i) } : null).filter(Boolean) : [];

module.exports = { trackingUrlOf, catalog, find, sign, same, newId, paise, getOrder, saveOrder, stockOf, limited, markPaid, downloadUrl, orderKey, downloadsOf, MAX_QTY, MAX_LINES, MAX_TOTAL_PAISE, DOWNLOAD_DAYS, DOWNLOAD_LIMIT };
