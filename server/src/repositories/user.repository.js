const { getPool, sql } = require('../db/connection');

async function findByUsername(username) {
  const pool = await getPool();
  const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .query('SELECT * FROM users WHERE username = @username');
  return result.recordset[0] || null;
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar, email)
    .query('SELECT * FROM users WHERE email = @email');
  return result.recordset[0] || null;
}

async function findById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM users WHERE id = @id');
  return result.recordset[0] || null;
}

async function create({ username, email, passwordHash }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .input('email', sql.NVarChar, email)
    .input('password_hash', sql.NVarChar, passwordHash)
    .query('INSERT INTO users (username, email, password_hash) OUTPUT INSERTED.* VALUES (@username, @email, @password_hash)');
  return result.recordset[0];
}

async function updatePassword(id, passwordHash) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .input('password_hash', sql.NVarChar, passwordHash)
    .query('UPDATE users SET password_hash = @password_hash WHERE id = @id');
}

module.exports = { findByUsername, findByEmail, findById, create, updatePassword };
