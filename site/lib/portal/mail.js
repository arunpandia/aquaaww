// Sends plain emails through Resend (https://resend.com). Set RESEND_API_KEY and, once the domain is verified in Resend, MAIL_FROM
// (for example "Dusktillus <contact@dusktillus.store>"). MAIL_NOTIFY is where new orders and support tickets are announced (default: the contact address).
// Without a key nothing is sent: sign-in codes then fail with "not set up yet", and the best-effort notifications are skipped.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const configured = () => !!process.env.RESEND_API_KEY;
const from = () => process.env.MAIL_FROM || 'Dusktillus <contact@dusktillus.store>';
const notifyTo = () => process.env.MAIL_NOTIFY || 'contact@dusktillus.store';

async function sendMail({ to, subject, text, replyTo }) {
  if (!configured()) throw new Error('mail-not-configured');
  const html = '<div style="font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111">' + String(text).split('\n\n').map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('') + '</div>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: from(), to: [to], subject, text, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) { let why = ''; try { why = String((await r.json()).message || '').slice(0, 200); } catch { /* no body */ } throw new Error('mail-' + r.status + (why ? ': ' + why : '')); }   // the reason goes to the server log only
}

// notifications that must never break the thing that triggered them
const quiet = async (fn) => { try { if (configured()) await fn(); } catch (e) { console.error('mail failed:', e.message); } };

module.exports = { sendMail, quiet, configured, notifyTo };
