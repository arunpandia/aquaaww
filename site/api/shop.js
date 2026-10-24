// One serverless function for the whole shop (Vercel's free plan allows 12 functions). vercel.json rewrites the clean urls onto it:
//   /api/products  /api/checkout  /api/checkout-verify  /api/order  /api/download  /api/admin-orders   ->   /api/shop?a=<name>
// The handlers live in site/lib/shop/.
const routes = { products: 'products', checkout: 'checkout', 'checkout-verify': 'checkout-verify', order: 'order', download: 'download', 'admin-orders': 'admin-orders' };

module.exports = (req, res) => {
  const a = String((req.query && req.query.a) || '');
  if (!Object.prototype.hasOwnProperty.call(routes, a)) return res.status(404).end();
  return require('../lib/shop/' + routes[a])(req, res);
};
