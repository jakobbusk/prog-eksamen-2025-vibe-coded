const { getPool, sql } = require('../db/connection');

async function findByPortfolioId(portfolioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('portfolio_id', sql.Int, portfolioId)
    .query(`SELECT t.*, s.ticker, s.name as security_name, s.currency as security_currency
            FROM trades t
            JOIN securities s ON t.security_id = s.id
            WHERE t.portfolio_id = @portfolio_id
            ORDER BY t.traded_at DESC`);
  return result.recordset;
}

async function findByPortfolioIds(portfolioIds) {
  if (!Array.isArray(portfolioIds) || portfolioIds.length === 0) return [];
  const pool = await getPool();
  const req = pool.request();
  const params = portfolioIds.map((id, i) => {
    req.input(`pid${i}`, sql.Int, id);
    return `@pid${i}`;
  });
  const result = await req.query(
    `SELECT t.*, s.ticker, s.name as security_name, s.currency as security_currency
            FROM trades t
            JOIN securities s ON t.security_id = s.id
            WHERE t.portfolio_id IN (${params.join(',')})
            ORDER BY t.traded_at DESC`
  );
  return result.recordset;
}

async function create({ portfolioId, accountId, securityId, type, quantity, totalPrice, fee }, transaction) {
  const req = transaction
    ? transaction.request()
    : (await getPool()).request();
  const result = await req
    .input('portfolio_id', sql.Int, portfolioId)
    .input('account_id', sql.Int, accountId)
    .input('security_id', sql.Int, securityId)
    .input('type', sql.NVarChar, type)
    .input('quantity', sql.Decimal(18, 6), quantity)
    .input('total_price', sql.Decimal(18, 4), totalPrice)
    .input('fee', sql.Decimal(18, 4), fee || 0)
    .query(`INSERT INTO trades (portfolio_id, account_id, security_id, type, quantity, total_price, fee)
            OUTPUT INSERTED.*
            VALUES (@portfolio_id, @account_id, @security_id, @type, @quantity, @total_price, @fee)`);
  return result.recordset[0];
}

async function getHoldings(portfolioId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('portfolio_id', sql.Int, portfolioId)
    .query(`SELECT
              s.id as security_id,
              s.ticker,
              s.name as security_name,
              s.currency as security_currency,
              SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as net_quantity,
              SUM(CASE WHEN t.type = 'buy' THEN t.total_price ELSE 0 END) as total_buy_cost,
              SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE 0 END) as total_buy_quantity
            FROM trades t
            JOIN securities s ON t.security_id = s.id
            WHERE t.portfolio_id = @portfolio_id
            GROUP BY s.id, s.ticker, s.name, s.currency
            HAVING SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) > 0`);
  return result.recordset;
}

module.exports = { findByPortfolioId, findByPortfolioIds, create, getHoldings };
