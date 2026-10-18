// Shared helpers for the "feeling lucky" fund (the one-time Google Play Console fee).
const { redis } = require('./_lib');

const GOAL = +process.env.FUND_GOAL_USD || 25;          // dollars to raise
const SEED = +process.env.FUND_SEED_USD || 0;           // dollars already raised before this went live
const INR_PER_USD = +process.env.INR_PER_USD || 88;     // rough rate, only used to move the bar for rupee payments
const READY = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

async function snapshot() {
  const r = await redis([['HMGET', 'fund', 'cents', 'count']]);
  const [c, n] = (r[0] && r[0].result) || [];
  const raised = Math.round((SEED + (+c || 0) / 100) * 100) / 100;
  return { goal: GOAL, raised, percent: Math.min(100, Math.round(1000 * raised / GOAL) / 10), supporters: +n || 0, ready: READY() };
}

// minor units (paise or cents) -> US cents
const toUsdCents = (currency, minor) => currency === 'USD' ? minor : Math.round(minor / INR_PER_USD);

module.exports = { GOAL, READY, snapshot, toUsdCents };
