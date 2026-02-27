const { getPool, sql } = require('../db/connection');

async function findByUserId(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .query(`SELECT a.*, b.name as bank_name FROM accounts a
            LEFT JOIN banks b ON a.bank_id = b.id
            WHERE a.user_id = @user_id ORDER BY a.created_at DESC`);
  return result.recordset;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT a.*, b.name as bank_name FROM accounts a
            LEFT JOIN banks b ON a.bank_id = b.id
            WHERE a.id = @id`);
  return result.recordset[0] || null;
}

async function create({ userId, bankId, name, currency }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .input('bank_id', sql.Int, bankId || null)
    .input('name', sql.NVarChar, name)
    .input('currency', sql.NVarChar, currency || 'DKK')
    .query(`INSERT INTO accounts (user_id, bank_id, name, currency)
            OUTPUT INSERTED.*
            VALUES (@user_id, @bank_id, @name, @currency)`);
  return result.recordset[0];
}

async function update(id, { name, bankId }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar, name)
    .input('bank_id', sql.Int, bankId || null)
    .query(`UPDATE accounts SET name = @name, bank_id = @bank_id
            OUTPUT INSERTED.* WHERE id = @id`);
  return result.recordset[0];
}

async function close(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE accounts SET is_active = 0, closed_at = GETUTCDATE() WHERE id = @id`);
}

async function reopen(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE accounts SET is_active = 1, closed_at = NULL WHERE id = @id`);
}

async function updateBalance(id, newBalance, transaction) {
  const req = transaction
    ? transaction.request()
    : (await getPool()).request();
  await req
    .input('id', sql.Int, id)
    .input('balance', sql.Decimal(18, 4), newBalance)
    .query(`UPDATE accounts SET balance = @balance WHERE id = @id`);
}

async function getTransactions(accountId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('account_id', sql.Int, accountId)
    .query(`SELECT * FROM account_transactions WHERE account_id = @account_id ORDER BY created_at DESC`);
  return result.recordset;
}

async function createTransaction({ accountId, type, amount, balanceAfter, description, tradeId }, transaction) {
  const req = transaction
    ? transaction.request()
    : (await getPool()).request();
  const result = await req
    .input('account_id', sql.Int, accountId)
    .input('type', sql.NVarChar, type)
    .input('amount', sql.Decimal(18, 4), amount)
    .input('balance_after', sql.Decimal(18, 4), balanceAfter)
    .input('description', sql.NVarChar, description || null)
    .input('trade_id', sql.Int, tradeId || null)
    .query(`INSERT INTO account_transactions (account_id, type, amount, balance_after, description, trade_id)
            OUTPUT INSERTED.*
            VALUES (@account_id, @type, @amount, @balance_after, @description, @trade_id)`);
  return result.recordset[0];
}

async function getBanks() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM banks ORDER BY name');
  return result.recordset;
}

module.exports = { findByUserId, findById, create, update, close, reopen, updateBalance, getTransactions, createTransaction, getBanks };
