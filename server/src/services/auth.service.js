const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repository');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

async function register({ username, email, password }) {
  if (!username || !email || !password) throw { status: 400, message: 'All fields are required' };
  if (password.length < 6) throw { status: 400, message: 'Password must be at least 6 characters' };

  const existing = await userRepo.findByUsername(username);
  if (existing) throw { status: 409, message: 'Username already taken' };

  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw { status: 409, message: 'Email already registered' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.create({ username, email, passwordHash });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
}

async function login({ username, password }) {
  if (!username || !password) throw { status: 400, message: 'Username and password are required' };
  const user = await userRepo.findByUsername(username);
  if (!user) throw { status: 401, message: 'Invalid credentials' };
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw { status: 401, message: 'Invalid credentials' };
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) throw { status: 400, message: 'Both passwords required' };
  if (newPassword.length < 6) throw { status: 400, message: 'New password must be at least 6 characters' };
  const user = await userRepo.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) throw { status: 401, message: 'Current password is incorrect' };
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepo.updatePassword(userId, newHash);
}

module.exports = { register, login, changePassword };
