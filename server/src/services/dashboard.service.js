const accountRepo = require('../repositories/account.repository');
const portfolioRepo = require('../repositories/portfolio.repository');
const tradeRepo = require('../repositories/trade.repository');
const priceRepo = require('../repositories/price.repository');

async function getDashboard(userId) {
  const accounts = await accountRepo.findByUserId(userId);
  const accountIds = accounts.map(a => a.id);

  const portfolios = await portfolioRepo.findByAccountIds(accountIds);
  const portfolioIds = portfolios.map(p => p.id);

  const allTrades = await tradeRepo.findByPortfolioIds(portfolioIds);

  const totalBalance = accounts
    .filter(a => a.is_active)
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const recentTrades = allTrades.slice(0, 10);

  const holdingsByPortfolio = {};
  for (const portfolio of portfolios) {
    const holdings = await tradeRepo.getHoldings(portfolio.id);
    let portfolioValue = 0;
    for (const h of holdings) {
      const latestPrice = await priceRepo.getLatestPrice(h.security_id);
      if (latestPrice) {
        portfolioValue += parseFloat(latestPrice.price) * parseFloat(h.net_quantity);
      }
    }
    holdingsByPortfolio[portfolio.id] = { portfolio, value: portfolioValue };
  }

  const totalPortfolioValue = Object.values(holdingsByPortfolio).reduce((sum, p) => sum + p.value, 0);

  return {
    totalBalance,
    totalPortfolioValue,
    totalNetWorth: totalBalance + totalPortfolioValue,
    activeAccounts: accounts.filter(a => a.is_active).length,
    totalAccounts: accounts.length,
    totalPortfolios: portfolios.length,
    recentTrades,
    portfolioSummary: Object.values(holdingsByPortfolio),
  };
}

module.exports = { getDashboard };
