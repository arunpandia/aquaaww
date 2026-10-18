// GET /api/fund -> { goalInr, raisedInr, goalUsd, raisedUsd, percent, supporters, ready }. The progress bar reads this. Same for everyone, so it can be cached briefly.
const { snapshot, GOAL_INR, READY } = require('./_fund');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try {
    const s = await snapshot();
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=120');
    return res.status(200).json(s);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ goalInr: GOAL_INR, raisedInr: 0, goalUsd: 0, raisedUsd: 0, percent: 0, supporters: 0, ready: READY() });
  }
};
