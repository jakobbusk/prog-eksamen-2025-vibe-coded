const { getPool, sql } = require('../db/connection');

async function findByTicker(ticker) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ticker', sql.NVarChar, ticker)
    .query('SELECT * FROM securities WHERE ticker = @ticker');
  return result.recordset[0] || null;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM securities WHERE id = @id');
  return result.recordset[0] || null;
}

async function search(query) {
  const pool = await getPool();
  const result = await pool.request()
    .input('query', sql.NVarChar, `%${query}%`)
    .query(`SELECT * FROM securities WHERE ticker LIKE @query OR name LIKE @query ORDER BY ticker`);
  return result.recordset;
}

async function upsert({ ticker, name, type, currency, exchange }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ticker', sql.NVarChar, ticker)
    .input('name', sql.NVarChar, name)
    .input('type', sql.NVarChar, type || 'stock')
    .input('currency', sql.NVarChar, currency || 'USD')
    .input('exchange', sql.NVarChar, exchange || null)
    .query(`MERGE securities AS target
            USING (SELECT @ticker AS ticker) AS source ON target.ticker = source.ticker
            WHEN MATCHED THEN UPDATE SET name=@name, type=@type, currency=@currency, exchange=@exchange
            WHEN NOT MATCHED THEN INSERT (ticker, name, type, currency, exchange) VALUES (@ticker, @name, @type, @currency, @exchange)
            OUTPUT INSERTED.*;`);
  return result.recordset[0];
}

module.exports = { findByTicker, findById, search, upsert };
