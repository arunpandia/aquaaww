// One serverless function for sign-in, customer accounts, support and the admin desk (Vercel's free plan allows 12 functions).
// vercel.json rewrites /api/auth/*, /api/account/*, /api/support/*, /api/admin/* onto it as /api/portal?r=<area>&a=<action>. Only the listed actions are reachable.
const ROUTES = {
  auth: ['request', 'verify', 'logout', 'me'],
  account: ['profile', 'orders', 'order'],
  support: ['tickets', 'ticket'],
  admin: ['stats', 'orders', 'order', 'refund', 'customers', 'customer', 'tickets', 'ticket', 'ticket-reply', 'ticket-status', 'analytics', 'heatmap'],
};

module.exports = (req, res) => {
  const r = String((req.query && req.query.r) || ''), a = String((req.query && req.query.a) || '');
  if (!Object.prototype.hasOwnProperty.call(ROUTES, r) || !ROUTES[r].includes(a)) return res.status(404).end();
  return require('../lib/portal/' + r)[a](req, res);
};
