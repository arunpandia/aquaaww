// GET /api/products -> [{ id, name, type, priceInr, description, image, inStock, left }]. Public; never includes download links.
const { catalog, stockOf } = require('./_shop');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try {
    const list = catalog.products.filter(p => p.active !== false);
    const stock = await stockOf(list.map(p => p.id));
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    return res.status(200).json({
      shipping: { flatInr: catalog.shipping.flatInr, freeAboveInr: catalog.shipping.freeAboveInr, country: 'IN' },
      products: list.map(p => ({
        id: p.id, name: p.name, type: p.type, priceInr: p.priceInr, description: p.description || '', image: p.image || '',
        inStock: p.id in stock ? stock[p.id] > 0 : true, left: p.id in stock ? Math.max(0, stock[p.id]) : null,
      })),
    });
  } catch (e) {
    console.error('products failed:', e.message);
    return res.status(503).json({ error: 'The shop is not available right now.' });
  }
};
