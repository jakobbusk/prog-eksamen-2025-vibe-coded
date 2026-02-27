const { getPool, sql } = require('../db/connection');

async function getLatestPrice(securityId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('security_id', sql.Int, securityId)
    .query(`SELECT TOP 1 * FROM prices WHERE security_id = @security_id ORDER BY price_date DESC`);
  return result.recordset[0] || null;
}

async function getHistory(securityId, days = 365) {
  const pool = await getPool();
  const result = await pool.request()
    .input('security_id', sql.Int, securityId)
    .input('days', sql.Int, days)
    .query(`SELECT * FROM prices
            WHERE security_id = @security_id
            AND price_date >= DATEADD(day, -@days, GETUTCDATE())
            ORDER BY price_date ASC`);
  return result.recordset;
}

async function upsertPrice({ securityId, price, priceDate }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('security_id', sql.Int, securityId)
    .input('price', sql.Decimal(18, 4), price)
    .input('price_date', sql.Date, priceDate)
    .query(`MERGE prices AS target
            USING (SELECT @security_id AS security_id, @price_date AS price_date) AS source
              ON target.security_id = source.security_id AND target.price_date = source.price_date
            WHEN MATCHED THEN UPDATE SET price = @price, fetched_at = GETUTCDATE()
            WHEN NOT MATCHED THEN INSERT (security_id, price, price_date) VALUES (@security_id, @price, @price_date)
            OUTPUT INSERTED.*;`);
  return result.recordset[0];
}

module.exports = { getLatestPrice, getHistory, upsertPrice };
