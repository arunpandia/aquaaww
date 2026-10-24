/* Dusktillus first-party analytics. Invisible: it changes nothing on the page.
   Sends page views, clicks, scroll depth and time on page to /api/t. Skipped when the visitor has Do Not Track or Global Privacy Control on.
   Keeps one random id in localStorage (no cookies). Never reads what you type, never sends your IP address, never loads another site's script.
   Pages can also report their own steps: window.dtTrack('add_to_cart'). */
(function () {
  var nav = navigator, W = window, D = document;
  if (nav.doNotTrack === '1' || W.doNotTrack === '1' || nav.globalPrivacyControl || nav.msDoNotTrack === '1') { W.dtTrack = function () {}; return; }
  var rnd = function () { try { var a = new Uint8Array(12); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } catch (e) { return String(Math.random()).slice(2) + String(Date.now()); } };
  var store = function (s, k) { try { var v = s.getItem(k); if (!v) { v = rnd(); s.setItem(k, v); return [v, 1]; } return [v, 0]; } catch (e) { return [rnd(), 0]; } };
  var v = store(localStorage, 'dt_v'), s = store(sessionStorage, 'dt_s');
  var path = function () { return (location.pathname || '/').replace(/[^A-Za-z0-9/_.\-]/g, '').slice(0, 150) || '/'; };
  var q = [], first = true, sent = {}, shown = 0, t0 = Date.now(), hidden = D.visibilityState === 'hidden', maxScroll = 0;
  var width = Math.max(D.documentElement.clientWidth || 0, W.innerWidth || 0);
  function flush(final) {
    if (!q.length) return;
    var body = { v: v[0], s: s[0], nv: v[1], w: width, ev: q.splice(0, 40) };
    if (first) {
      var p = new URLSearchParams(location.search);
      body.r = D.referrer || '';
      if (p.get('utm_source')) body.u = { source: p.get('utm_source'), medium: p.get('utm_medium') || '', campaign: p.get('utm_campaign') || '' };
      try { var rf = new URL(D.referrer); if (rf.host === location.host) body.p = rf.pathname.replace(/[^A-Za-z0-9/_.\-]/g, '').slice(0, 150); } catch (e) {}
      first = false;
    }
    var data = JSON.stringify(body);
    try { if (nav.sendBeacon && nav.sendBeacon('/api/t', new Blob([data], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch('/api/t', { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  }
  function push(e) { e.p = path(); q.push(e); if (q.length >= 15) flush(); }
  push({ t: 'pv' }); flush();

  // what was clicked: a short label from buttons and links only, never from form fields
  function label(el) {
    var n = el.closest && el.closest('a,button,[role=button],summary,[data-track]'); if (!n) return '';
    var t = n.getAttribute('data-track') || n.id || (n.innerText || n.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
    var h = n.tagName === 'A' ? n.getAttribute('href') || '' : '';
    if (/^https?:/.test(h)) { try { h = new URL(h).host; } catch (e) { h = ''; } }
    return (n.tagName.toLowerCase() + ':' + (t || h || '?')).slice(0, 70);
  }
  D.addEventListener('click', function (e) {
    var de = D.documentElement, w = Math.max(de.scrollWidth, de.clientWidth, 1), x = Math.round((e.pageX / w) * 1000), y = Math.round(e.pageY);
    var el = e.target && e.target.nodeType === 1 ? e.target : null;
    push({ t: 'click', x: Math.min(999, Math.max(0, x)), y: Math.max(0, y), l: el && !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) ? label(el) : '' });
  }, true);
  function onScroll() {
    var de = D.documentElement, h = Math.max(de.scrollHeight - de.clientHeight, 1), pct = Math.min(100, Math.round(((W.pageYOffset || de.scrollTop) / h) * 100));
    if (pct > maxScroll) maxScroll = pct;
    [25, 50, 75, 100].forEach(function (m) { if (maxScroll >= m && !sent[m]) { sent[m] = 1; push({ t: 'scroll', d: m }); } });
  }
  W.addEventListener('scroll', onScroll, { passive: true });
  function leave() {
    if (!hidden) { shown += Date.now() - t0; hidden = true; }
    var sec = Math.round(shown / 1000); if (sec >= 1) push({ t: 'time', s: Math.min(sec, 1800) }); shown = 0; flush(true);
  }
  D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') leave(); else { hidden = false; t0 = Date.now(); } });
  W.addEventListener('pagehide', leave);
  setInterval(function () { flush(); }, 10000);
  W.dtTrack = function (name) { if (/^[a-z][a-z0-9_]{1,29}$/.test(String(name))) { push({ t: 'ev', n: name }); flush(); } };
})();
