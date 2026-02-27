const tradesService = require('../services/trades.service');

async function getTrades(req, res, next) {
  try {
    const { portfolio_id } = req.query;
    if (!portfolio_id) return res.status(400).json({ error: 'portfolio_id required' });
    const trades = await tradesService.getTrades(parseInt(portfolio_id), req.user.id);
    res.json({ data: trades });
  } catch (err) { next(err); }
}

async function createTrade(req, res, next) {
  try {
    const trade = await tradesService.executeTrade(req.user.id, req.body);
    res.status(201).json({ data: trade });
  } catch (err) { next(err); }
}

async function searchSecurities(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });
    const results = await tradesService.searchSecurities(q);
    res.json({ data: results });
  } catch (err) { next(err); }
}

module.exports = { getTrades, createTrade, searchSecurities };
