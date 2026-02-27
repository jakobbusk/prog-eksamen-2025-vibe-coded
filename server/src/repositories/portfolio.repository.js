const { getPool, sql } = require('../db/connection');

async function findByAccountIds(accountIds) {
  if (!accountIds || accountIds.length === 0) return [];
  const pool = await getPool();
  const idList = accountIds.join(',');
  const result = await pool.request()
    .query(`SELECT * FROM portfolios WHERE account_id IN (${idList}) ORDER BY created_at DESC`);
  return result.recordset;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM portfolios WHERE id = @id');
  return result.recordset[0] || null;
}

async function create({ accountId, name }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('account_id', sql.Int, accountId)
    .input('name', sql.NVarChar, name)
    .query(`INSERT INTO portfolios (account_id, name) OUTPUT INSERTED.* VALUES (@account_id, @name)`);
  return result.recordset[0];
}

async function remove(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM portfolios WHERE id = @id');
}

module.exports = { findByAccountIds, findById, create, remove };
