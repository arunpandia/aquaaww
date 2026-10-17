// Shared helpers for the serverless functions. Files starting with "_" are not exposed as routes.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmds) {
  if (!URL_ || !TOKEN) throw new Error('storage-not-configured');
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('storage-' + r.status);
  return r.json();
}

const REL = process.env.DOWNLOAD_BASE || 'https://github.com/arunpandia/twototango/releases/latest/download/';
const DL = {
  android: REL + 'TwoToTango.apk',
  windows: REL + 'TwoToTango-Setup.exe',
  mac: REL + 'TwoToTango-arm64.dmg',
};

const EMAIL_RE = /^[^\s@<>"'`;,]+@[^\s@<>"'`;,]+\.[^\s@<>"'`;,]{2,}$/;
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);

function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

module.exports = { redis, DL, EMAIL_RE, clean, sameOrigin };
