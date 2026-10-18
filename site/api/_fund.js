// Shared helpers for the "feeling lucky" fund (the one-time Google Play Console fee).
// The goal is kept in rupees so it matches the Razorpay Payment Page (goal 2,500). Rupee payments are summed exactly in paise,
// dollar payments in cents and converted at INR_PER_USD only when added to the rupee total.
const { redis } = require('./_lib');

const KEY = process.env.FUND_KEY || 'fund2';              // a new key = a fresh start (the old "fund" key is left untouched)
const GOAL_INR = +process.env.FUND_GOAL_INR || 2500;      // keep equal to the goal on the Razorpay Payment Page
const INR_PER_USD = +process.env.INR_PER_USD || 88;       // rough rate for dollar payments
const SEED_INR = (+process.env.FUND_SEED_INR || 0) + (+process.env.FUND_SEED_USD || 0) * INR_PER_USD;   // already raised before this went live
const LINKS = () => ({ INR: process.env.PAYLINK_INR || '', USD: process.env.PAYLINK_USD || '' });        // Razorpay Payment Page / Link urls
const READY = () => !!(LINKS().INR || LINKS().USD);
const round2 = n => Math.round(n * 100) / 100;

async function snapshot() {
  const r = await redis([['HMGET', KEY, 'inr', 'usd', 'count']]);
  const [inr, usd, n] = (r[0] && r[0].result) || [];
  const raisedInr = round2(SEED_INR + (+inr || 0) / 100 + (+usd || 0) / 100 * INR_PER_USD);
  const percent = Math.min(100, Math.round(1000 * raisedInr / GOAL_INR) / 10);
  return {
    goalInr: GOAL_INR, raisedInr, goalUsd: round2(GOAL_INR / INR_PER_USD), raisedUsd: round2(raisedInr / INR_PER_USD),
    percent, supporters: +n || 0, ready: READY(),
  };
}

// add one payment (minor units: paise or cents)
const addPayment = (currency, minor) => [
  ['HINCRBY', KEY, currency === 'USD' ? 'usd' : 'inr', minor],
  ['HINCRBY', KEY, 'count', 1],
];

module.exports = { GOAL_INR, READY, LINKS, snapshot, addPayment };
