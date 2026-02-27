const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.json({ data: { message: 'Logged out successfully' } });
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.id, req.body);
    res.json({ data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, changePassword };
