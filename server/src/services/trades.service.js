const tradeRepo = require('../repositories/trade.repository');
const accountRepo = require('../repositories/account.repository');
const portfolioRepo = require('../repositories/portfolio.repository');
const securityRepo = require('../repositories/security.repository');
const { getPool, sql } = require('../db/connection');

async function getUserAccountIds(userId) {
  const accounts = await accountRepo.findByUserId(userId);
  return accounts.map(a => a.id);
}

async function getTrades(portfolioId, userId) {
  const portfolio = await portfolioRepo.findById(portfolioId);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found' };
  const accountIds = await getUserAccountIds(userId);
  if (!accountIds.includes(portfolio.account_id)) throw { status: 403, message: 'Forbidden' };
  return tradeRepo.findByPortfolioId(portfolioId);
}

async function executeTrade(userId, { portfolioId, accountId, securityId, type, quantity, totalPrice, fee }) {
  if (!portfolioId || !accountId || !securityId || !type || !quantity || !totalPrice) {
    throw { status: 400, message: 'Missing required fields' };
  }
  if (!['buy', 'sell'].includes(type)) throw { status: 400, message: 'Type must be buy or sell' };
  if (quantity <= 0) throw { status: 400, message: 'Quantity must be positive' };
  if (totalPrice <= 0) throw { status: 400, message: 'Total price must be positive' };

  const accountIds = await getUserAccountIds(userId);
  if (!accountIds.includes(parseInt(accountId))) throw { status: 403, message: 'Account not found' };

  const account = await accountRepo.findById(accountId);
  if (!account) throw { status: 404, message: 'Account not found' };
  if (!account.is_active) throw { status: 400, message: 'Account is closed' };

  const portfolio = await portfolioRepo.findById(portfolioId);
  if (!portfolio) throw { status: 404, message: 'Portfolio not found' };
  if (portfolio.account_id !== parseInt(accountId)) throw { status: 400, message: 'Portfolio does not belong to account' };

  const security = await securityRepo.findById(securityId);
  if (!security) throw { status: 404, message: 'Security not found' };

  const feeAmount = parseFloat(fee || 0);
  const totalCost = parseFloat(totalPrice) + (type === 'buy' ? feeAmount : 0);
  const totalCredit = parseFloat(totalPrice) - (type === 'sell' ? feeAmount : 0);

  if (type === 'buy') {
    if (parseFloat(account.balance) < totalCost) {
      throw { status: 400, message: 'Insufficient balance' };
    }
  } else {
    const holdings = await tradeRepo.getHoldings(portfolioId);
    const holding = holdings.find(h => h.security_id === parseInt(securityId));
    if (!holding || parseFloat(holding.net_quantity) < parseFloat(quantity)) {
      throw { status: 400, message: 'Insufficient holdings' };
    }
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const trade = await tradeRepo.create({ portfolioId, accountId, securityId, type, quantity, totalPrice, fee: feeAmount }, transaction);

    let newBalance;
    if (type === 'buy') {
      newBalance = parseFloat(account.balance) - totalCost;
    } else {
      newBalance = parseFloat(account.balance) + totalCredit;
    }

    await accountRepo.updateBalance(accountId, newBalance, transaction);
    await accountRepo.createTransaction({
      accountId,
      type: type === 'buy' ? 'trade_buy' : 'trade_sell',
      amount: type === 'buy' ? -totalCost : totalCredit,
      balanceAfter: newBalance,
      description: `${type.toUpperCase()} ${quantity} x ${security.ticker}`,
      tradeId: trade.id,
    }, transaction);

    await transaction.commit();
    return trade;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function searchSecurities(query) {
  return securityRepo.search(query);
}

module.exports = { getTrades, executeTrade, searchSecurities };
