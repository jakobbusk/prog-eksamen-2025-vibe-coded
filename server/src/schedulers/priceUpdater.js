const cron = require('node-cron');
const marketDataService = require('../services/marketData.service');

function startPriceUpdater() {
  // Run every hour during market hours (Mon-Fri, 9-17)
  cron.schedule('0 9-17 * * 1-5', async () => {
    console.log('[PriceUpdater] Running scheduled price update...');
    try {
      const { getPool } = require('../db/connection');
      const p = await getPool();
      const result = await p.request().query('SELECT ticker FROM securities');
      for (const row of result.recordset) {
        try {
          await marketDataService.getQuote(row.ticker);
        } catch (e) {
          // ignore individual failures
        }
      }
    } catch (err) {
      console.error('[PriceUpdater] Error:', err.message);
    }
  });
  console.log('[PriceUpdater] Scheduled price updater started');
}

module.exports = { startPriceUpdater };
