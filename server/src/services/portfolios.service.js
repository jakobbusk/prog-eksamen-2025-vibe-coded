const portfolioRepo = require('../repositories/portfolio.repository');
const tradeRepo = require('../repositories/trade.repository');
const accountRepo = require('../repositories/account.repository');
const priceRepo = require('../repositories/price.repository');

async function getUserAccountIds(userId) {
  const accounts = await accountRepo.findByUserId(userId);
  return accounts.map(a => a.id);
}

async function getPortfolios(userId) {
  const accountIds = await getUserAccountIds(userId);
  return portfolioRepo.findByAccountIds(accountIds);
}

async function getPortfolio(portfolioId, userId) {
  const portfolio = await portfolioRepo.findById(portfolioId);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found' };
  const accountIds = await getUserAccountIds(userId);
  if (!accountIds.includes(portfolio.account_id)) throw { status: 403, message: 'Forbidden' };
  return portfolio;
}

async function createPortfolio(userId, { accountId, name }) {
  if (!accountId || !name) throw { status: 400, message: 'accountId and name are required' };
  const accountIds = await getUserAccountIds(userId);
  if (!accountIds.includes(parseInt(accountId))) throw { status: 403, message: 'Account not found' };
  return portfolioRepo.create({ accountId, name });
}

async function deletePortfolio(portfolioId, userId) {
  await getPortfolio(portfolioId, userId);
  await portfolioRepo.remove(portfolioId);
}

function calculateGAK(trades) {
  // Calculate GAK (Gennemsnitlig Anskaffelseskurs - average acquisition cost)
  const holdings = {};
  for (const trade of trades) {
    const sid = trade.security_id;
    if (!holdings[sid]) holdings[sid] = { quantity: 0, totalCost: 0 };
    if (trade.type === 'buy') {
      holdings[sid].quantity += parseFloat(trade.quantity);
      holdings[sid].totalCost += parseFloat(trade.total_price);
    } else {
      const gak = holdings[sid].quantity > 0 ? holdings[sid].totalCost / holdings[sid].quantity : 0;
      holdings[sid].quantity -= parseFloat(trade.quantity);
      holdings[sid].totalCost -= gak * parseFloat(trade.quantity);
    }
  }
  return holdings;
}

async function getPortfolioOverview(portfolioId, userId) {
  await getPortfolio(portfolioId, userId);
  const holdings = await tradeRepo.getHoldings(portfolioId);
  const trades = await tradeRepo.findByPortfolioId(portfolioId);
  const gakMap = calculateGAK(trades);

  const positions = await Promise.all(holdings.map(async (h) => {
    const latestPrice = await priceRepo.getLatestPrice(h.security_id);
    const currentPrice = latestPrice ? parseFloat(latestPrice.price) : null;
    const quantity = parseFloat(h.net_quantity);
    const gak = h.total_buy_quantity > 0 ? parseFloat(h.total_buy_cost) / parseFloat(h.total_buy_quantity) : 0;
    const marketValue = currentPrice !== null ? currentPrice * quantity : null;
    const unrealizedGain = marketValue !== null ? marketValue - gak * quantity : null;

    return {
      securityId: h.security_id,
      ticker: h.ticker,
      name: h.security_name,
      currency: h.security_currency,
      quantity,
      gak,
      currentPrice,
      marketValue,
      unrealizedGain,
      unrealizedGainPct: gak > 0 && unrealizedGain !== null ? (unrealizedGain / (gak * quantity)) * 100 : null,
      lastPriceDate: latestPrice ? latestPrice.price_date : null,
    };
  }));

  const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);
  const totalUnrealizedGain = positions.reduce((sum, p) => sum + (p.unrealizedGain || 0), 0);

  return { portfolioId, positions, totalMarketValue, totalUnrealizedGain };
}

module.exports = { getPortfolios, getPortfolio, createPortfolio, deletePortfolio, getPortfolioOverview, calculateGAK };
