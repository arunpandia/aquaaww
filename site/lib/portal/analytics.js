// First-party website analytics: no third party, no IP address stored, no cookies (the browser script keeps a random id in localStorage).
// Collects page views, visitors (new vs returning), sessions, referrers/UTM, country, device, clicks (for the heatmap), scroll depth, time on page,
// page-to-page flow and named events (view_product, add_to_cart, begin_checkout, ... plus checkout_created and order_paid from the server).
//   an:d:<day>         hash of counters for the day        uv:<day>  HyperLogLog of visitor ids       vid:<id>  first-seen marker
//   ses:<sid>          page views in this session (30 min) hm:<device>:<path>  click grid for the heatmap   hm:idx:<device>  pages that have clicks
const crypto = require('crypto');
const { redis, istDay, lastDays } = require('./core');

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|node-fetch|axios|pingdom|uptime/i;
const PATH_RE = /^\/[A-Za-z0-9/_.\-]{0,150}$/, NAME_RE = /^[a-z][a-z0-9_]{1,29}$/, ID_RE = /^[A-Za-z0-9-]{8,40}$/;
const pathOk = p => PATH_RE.test(p) && !p.includes('..') && !p.includes('//');
const GRID_X = 20, GRID_Y = 40;                                  // heatmap cell: 2% of the page width x 40px of height
const KEEP = 400 * 86400;
const cut = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f|]/g, ' ').trim().slice(0, n);
const num = (v, lo, hi) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null; };

const deviceOf = (w, ua) => /iPad|Tablet/i.test(ua) ? 'tablet' : w && w < 768 ? 'mobile' : w && w < 1100 ? 'tablet' : 'desktop';
const browserOf = ua => /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
const osOf = ua => /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
const hostOf = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };

// one beacon = { v: visitorId, s: sessionId, nv: 1 when the browser had no id yet, w: viewport width, r: referrer url, u: {source,medium,campaign}, p: previous page, ev: [events] }
async function collect(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT.test(ua) || req.headers.dnt === '1') return res.status(204).end();
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object' || JSON.stringify(b).length > 12000) return res.status(204).end();
  const vid = String(b.v || ''), sid = String(b.s || '');
  if (!ID_RE.test(vid) || !ID_RE.test(sid) || !Array.isArray(b.ev) || !b.ev.length) return res.status(204).end();
  try {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x', rk = 'rl:t:' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 20);
    const day = istDay(), d = 'an:d:' + day, w = num(b.w, 200, 5000), device = deviceOf(w, ua);
    const evs = b.ev.slice(0, 40);
    const hasPv = evs.some(e => e && e.t === 'pv');
    const pre = [['INCR', rk], ['EXPIRE', rk, 60, 'NX']];
    if (hasPv) pre.push(['SET', 'vid:' + vid, day, 'NX', 'EX', KEEP], ['INCR', 'ses:' + sid], ['EXPIRE', 'ses:' + sid, 1800], ['PFADD', 'uv:' + day, vid], ['EXPIRE', 'uv:' + day, KEEP, 'NX']);
    const r = await redis(pre);
    if (r[0].result > 120) return res.status(204).end();                             // 120 beacons a minute from one address is not a person
    const isNewVisitor = hasPv && r[2].result === 'OK', sesN = hasPv ? r[3].result : 0;

    const c = [];                                                                    // counters to add to today's hash
    const add = (f, n = 1) => c.push(['HINCRBY', d, f, n]);
    if (hasPv) {
      add('pv');
      if (sesN === 1) {                                                              // first page of a session: record who and from where
        add('sess'); add(isNewVisitor ? 'newv' : 'retv'); add('dev:' + device); add('br:' + browserOf(ua)); add('os:' + osOf(ua));
        const cty = cut(req.headers['x-vercel-ip-country'], 2).toUpperCase(); if (/^[A-Z]{2}$/.test(cty)) add('cty:' + cty);
        const rh = hostOf(b.r); add('ref:' + (rh && rh !== String(req.headers.host).replace(/^www\./, '') ? cut(rh, 60) : '(direct)'));
        const u = b.u && typeof b.u === 'object' ? b.u : null;
        if (u && u.source) add('utm:' + cut(u.source, 40) + '|' + cut(u.medium, 40) + '|' + cut(u.campaign, 60));
      } else if (sesN === 2) add('s2');                                              // a session with 2+ pages is not a bounce
    }
    const hm = [];
    for (const e of evs) {
      if (!e || typeof e !== 'object') continue;
      const p = cut(e.p, 160); if (e.t !== 'ev' && !pathOk(p)) continue;   // named events need no page
      if (e.t === 'pv') {
        add('p:' + p);
        if (sesN === 1) add('e:' + p);
        const from = cut(b.p, 160); if (pathOk(from) && from !== p) add('flow:' + from + '>' + p);
      } else if (e.t === 'click') {
        const x = num(e.x, 0, 999), y = num(e.y, 0, 30000); if (x === null || y === null) continue;
        const cell = Math.floor(x / GRID_X) + ':' + Math.floor(y / GRID_Y);
        hm.push(['HINCRBY', 'hm:' + device + ':' + p, cell, 1], ['ZINCRBY', 'hm:idx:' + device, 1, p], ['EXPIRE', 'hm:' + device + ':' + p, KEEP, 'NX']);
        const l = cut(e.l, 70); if (l) add('ck:' + p + '|' + l);
        add('clicks');
      } else if (e.t === 'scroll') { const s = num(e.d, 0, 100); if (s !== null && s % 25 === 0 && s > 0) add('sc:' + p + ':' + s); }
      else if (e.t === 'time') { const s = num(e.s, 1, 1800); if (s !== null) { add('tm:' + p, s); add('tmn:' + p); } }
      else if (e.t === 'ev' && NAME_RE.test(String(e.n))) add('ev:' + e.n);
    }
    if (c.length || hm.length) await redis([...c, ...hm, ['EXPIRE', d, KEEP, 'NX']]);
  } catch (e) { console.error('collect failed:', e.message); }
  return res.status(204).end();
}

// events the server itself sees (checkout started, order paid)
async function bumpEvent(name) { await redis([['HINCRBY', 'an:d:' + istDay(), 'ev:' + name, 1], ['EXPIRE', 'an:d:' + istDay(), KEEP, 'NX']]); }

const obj = r => { const o = {}; for (let i = 0; i < (r || []).length; i += 2) o[r[i]] = +r[i + 1]; return o; };
const top = (o, prefix, n = 10) => Object.entries(o).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]).sort((a, b) => b[1] - a[1]).slice(0, n);

async function report(days) {
  const ds = lastDays(days);
  const r = await redis([...ds.map(d => ['HGETALL', 'an:d:' + d]), ...ds.map(d => ['PFCOUNT', 'uv:' + d]), ['PFCOUNT', ...ds.map(d => 'uv:' + d)]]);
  const per = ds.map((d, i) => obj(r[i].result)), uvDay = ds.map((d, i) => +r[ds.length + i].result || 0), visitors = +r[2 * ds.length].result || 0;
  const t = {}; for (const o of per) for (const k in o) t[k] = (t[k] || 0) + o[k];
  const pages = new Map();
  for (const [k, v] of Object.entries(t)) { if (!k.startsWith('p:')) continue; const p = k.slice(2); pages.set(p, { path: p, views: v, entries: t['e:' + p] || 0, avgSeconds: t['tmn:' + p] ? Math.round(t['tm:' + p] / t['tmn:' + p]) : 0,
    scroll: { 25: t['sc:' + p + ':25'] || 0, 50: t['sc:' + p + ':50'] || 0, 75: t['sc:' + p + ':75'] || 0, 100: t['sc:' + p + ':100'] || 0 } }); }
  const sessions = t.sess || 0;
  const evs = Object.fromEntries(top(t, 'ev:', 50));
  const funnel = ['view_product', 'add_to_cart', 'begin_checkout', 'checkout_created', 'order_paid'].map(n => ({ step: n, count: evs[n] || 0 }));
  return {
    range: { days, from: ds[ds.length - 1], to: ds[0] },
    totals: { pageviews: t.pv || 0, sessions, visitors, newVisitors: t.newv || 0, returningVisitors: t.retv || 0, clicks: t.clicks || 0,
      pagesPerSession: sessions ? +((t.pv || 0) / sessions).toFixed(2) : 0, bounceRate: sessions ? +(1 - (t.s2 || 0) / sessions).toFixed(3) : 0 },
    daily: ds.map((d, i) => ({ day: d, pageviews: per[i].pv || 0, sessions: per[i].sess || 0, visitors: uvDay[i], newVisitors: per[i].newv || 0 })).reverse(),
    pages: [...pages.values()].sort((a, b) => b.views - a.views).slice(0, 30),
    referrers: top(t, 'ref:', 15).map(([name, sessions]) => ({ name, sessions })),
    campaigns: top(t, 'utm:', 15).map(([k, sessions]) => { const [source, medium, campaign] = k.split('|'); return { source, medium, campaign, sessions }; }),
    countries: top(t, 'cty:', 15).map(([name, sessions]) => ({ name, sessions })),
    devices: top(t, 'dev:').map(([name, sessions]) => ({ name, sessions })),
    browsers: top(t, 'br:').map(([name, sessions]) => ({ name, sessions })),
    systems: top(t, 'os:').map(([name, sessions]) => ({ name, sessions })),
    flow: top(t, 'flow:', 20).map(([k, count]) => { const [from, to] = k.split('>'); return { from, to, count }; }),
    topClicks: top(t, 'ck:', 25).map(([k, count]) => { const i = k.indexOf('|'); return { page: k.slice(0, i), element: k.slice(i + 1), count }; }),
    events: Object.entries(evs).map(([name, count]) => ({ name, count })),
    funnel,
  };
}

// click density for one page: cells of 2% width x 40px height with their click counts, plus the grid size so a picture can be drawn later
async function heatmap(path, device) {
  if (!pathOk(path) || !['mobile', 'tablet', 'desktop'].includes(device)) return null;
  const [cells, idx] = (await redis([['HGETALL', 'hm:' + device + ':' + path], ['ZREVRANGE', 'hm:idx:' + device, 0, 49, 'WITHSCORES']])).map(x => x.result);
  const o = obj(cells), list = Object.entries(o).map(([k, n]) => { const [cx, cy] = k.split(':').map(Number); return { x: cx * GRID_X / 10, y: cy * GRID_Y, clicks: n }; }).sort((a, b) => b.clicks - a.clicks);
  const max = list.length ? list[0].clicks : 0, pages = []; for (let i = 0; i < (idx || []).length; i += 2) pages.push({ path: idx[i], clicks: +idx[i + 1] });
  return { path, device, cellWidthPercent: GRID_X / 10, cellHeightPx: GRID_Y, totalClicks: list.reduce((t, c) => t + c.clicks, 0), maxCell: max, cells: list.slice(0, 2000), pagesWithClicks: pages };
}

module.exports = { collect, bumpEvent, report, heatmap };
