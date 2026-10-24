// Business numbers, kept as running counters (cheap to read, no scanning of orders). Money is in paise; a "day" is an India (IST) calendar day.
//   st:d:<day>   orders, revenue, items, physical, digital, shipping, newcust, signups, refunds, refund_n
//   st:all       the same, for all time          st:dp:<day>  <productId>:u (units) and :r (revenue)
//   cust:<email> orders, spent, first, last     cust:idx    customers ordered by their latest order
const { redis, istDay, lastDays } = require('./core');

const FIELDS = ['orders', 'revenue', 'items', 'physical', 'digital', 'shipping', 'newcust', 'repeatcust', 'signups', 'refunds', 'refund_n', 'checkouts'];
const obj = r => { const o = {}; for (let i = 0; i < (r || []).length; i += 2) o[r[i]] = +r[i + 1]; return o; };
const bumpCmds = (fields, day) => Object.entries(fields).flatMap(([k, v]) => [['HINCRBY', 'st:d:' + day, k, v], ['HINCRBY', 'st:all', k, v]]);

// add to today's and the all-time counters, e.g. bump({ signups: 1 })
async function bump(fields, day = istDay()) {
  const cmds = bumpCmds(fields, day);
  if (cmds.length) await redis([...cmds, ['EXPIRE', 'st:d:' + day, 800 * 86400, 'NX']]);
}

// called exactly once per paid order (from markPaid)
async function recordPaid(o) {
  const day = istDay(new Date(o.paidAt || Date.now()));
  const phys = o.lines.some(l => l.type === 'physical');
  const items = o.lines.reduce((t, l) => t + l.qty, 0);
  const f = { orders: 1, revenue: o.total, items, shipping: o.shipping || 0 };
  if (phys) f.physical = 1; if (o.lines.some(l => l.type === 'digital')) f.digital = 1;
  const email = o.customer.email;
  const n = (await redis([['HINCRBY', 'cust:' + email, 'orders', 1]]))[0].result;
  if (n === 1) f.newcust = 1; else if (n === 2) f.repeatcust = 1;
  const cmds = bumpCmds(f, day);
  for (const l of o.lines) { cmds.push(['HINCRBY', 'st:dp:' + day, l.id + ':u', l.qty], ['HINCRBY', 'st:dp:' + day, l.id + ':r', l.unit * l.qty]); }
  cmds.push(['HINCRBY', 'cust:' + email, 'spent', o.total], ['HSETNX', 'cust:' + email, 'first', o.paidAt], ['HSET', 'cust:' + email, 'last', o.paidAt, 'name', o.customer.name],
    ['ZADD', 'cust:idx', Date.parse(o.paidAt) || Date.now(), email], ['EXPIRE', 'st:d:' + day, 800 * 86400, 'NX'], ['EXPIRE', 'st:dp:' + day, 800 * 86400, 'NX']);
  await redis(cmds);
}

// a refund you made in Razorpay, written down here so net revenue is right
async function recordRefund(amountPaise) { await bump({ refunds: amountPaise, refund_n: 1 }); }

const sum = list => { const t = {}; for (const o of list) for (const k in o) t[k] = (t[k] || 0) + o[k]; return t; };
const money = p => Math.round((p || 0)) / 100;
const shape = t => {
  const orders = t.orders || 0, revenue = t.revenue || 0, refunds = t.refunds || 0;
  return { orders, revenueInr: money(revenue), refundsInr: money(refunds), netRevenueInr: money(revenue - refunds), avgOrderInr: orders ? money(revenue / orders) : 0, items: t.items || 0,
    physicalOrders: t.physical || 0, digitalOrders: t.digital || 0, shippingCollectedInr: money(t.shipping), newCustomers: t.newcust || 0, repeatCustomers: t.repeatcust || 0,
    signups: t.signups || 0, checkoutsStarted: t.checkouts || 0, refundCount: t.refund_n || 0 };
};

async function summary(days) {
  const ds = lastDays(days);
  const r = await redis([['HGETALL', 'st:all'], ...ds.map(d => ['HGETALL', 'st:d:' + d]), ...ds.map(d => ['HGETALL', 'st:dp:' + d]), ['ZCARD', 'cust:idx']]);
  const per = ds.map((d, i) => obj(r[1 + i].result));
  const prod = {};
  ds.forEach((d, i) => { const o = obj(r[1 + ds.length + i].result); for (const k in o) { const [id, kind] = k.split(':'); (prod[id] = prod[id] || { id, units: 0, revenue: 0 }); if (kind === 'u') prod[id].units += o[k]; else prod[id].revenue += o[k]; } });
  return {
    range: { days, from: ds[ds.length - 1], to: ds[0] },
    allTime: shape(obj(r[0].result)),
    period: shape(sum(per)),
    daily: ds.map((d, i) => ({ day: d, ...shape(per[i]) })).reverse(),
    byProduct: Object.values(prod).map(p => ({ id: p.id, units: p.units, revenueInr: money(p.revenue) })).sort((a, b) => b.revenueInr - a.revenueInr),
    customersTotal: r[r.length - 1].result || 0,
  };
}

module.exports = { bump, recordPaid, recordRefund, summary, obj, money, istDay };
