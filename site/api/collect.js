// POST /api/t  -> website analytics beacon (see lib/portal/analytics.js). Answers 204 to everything so the page never waits or breaks.
module.exports = (req, res) => require('../lib/portal/analytics').collect(req, res);
