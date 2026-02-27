const marketDataService = require('../services/marketData.service');

async function searchSecurity(req, res, next) {
  try {
    const results = await marketDataService.searchSecurity(req.query.q || '');
    res.json({ data: results });
  } catch (err) { next(err); }
}

async function getQuote(req, res, next) {
  try {
    const quote = await marketDataService.getQuote(req.params.ticker);
    res.json({ data: quote });
  } catch (err) { next(err); }
}

async function getHistory(req, res, next) {
  try {
    const history = await marketDataService.getHistoricalPrices(req.params.ticker);
    res.json({ data: history });
  } catch (err) { next(err); }
}

async function refreshQuote(req, res, next) {
  try {
    const quote = await marketDataService.refreshQuote(req.params.ticker);
    res.json({ data: quote });
  } catch (err) { next(err); }
}

module.exports = { searchSecurity, getQuote, getHistory, refreshQuote };
