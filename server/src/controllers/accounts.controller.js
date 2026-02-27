const accountsService = require('../services/accounts.service');

async function getAccounts(req, res, next) {
  try {
    const accounts = await accountsService.getAccounts(req.user.id);
    const banks = await accountsService.getBanks();
    res.json({ data: { accounts, banks } });
  } catch (err) { next(err); }
}

async function getAccount(req, res, next) {
  try {
    const account = await accountsService.getAccount(parseInt(req.params.id), req.user.id);
    res.json({ data: account });
  } catch (err) { next(err); }
}

async function createAccount(req, res, next) {
  try {
    const account = await accountsService.createAccount(req.user.id, req.body);
    res.status(201).json({ data: account });
  } catch (err) { next(err); }
}

async function updateAccount(req, res, next) {
  try {
    const account = await accountsService.updateAccount(parseInt(req.params.id), req.user.id, req.body);
    res.json({ data: account });
  } catch (err) { next(err); }
}

async function closeAccount(req, res, next) {
  try {
    await accountsService.closeAccount(parseInt(req.params.id), req.user.id);
    res.json({ data: { message: 'Account closed' } });
  } catch (err) { next(err); }
}

async function reopenAccount(req, res, next) {
  try {
    await accountsService.reopenAccount(parseInt(req.params.id), req.user.id);
    res.json({ data: { message: 'Account reopened' } });
  } catch (err) { next(err); }
}

async function deposit(req, res, next) {
  try {
    const result = await accountsService.deposit(parseInt(req.params.id), req.user.id, req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
}

async function withdraw(req, res, next) {
  try {
    const result = await accountsService.withdraw(parseInt(req.params.id), req.user.id, req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
}

async function getTransactions(req, res, next) {
  try {
    const transactions = await accountsService.getTransactions(parseInt(req.params.id), req.user.id);
    res.json({ data: transactions });
  } catch (err) { next(err); }
}

module.exports = { getAccounts, getAccount, createAccount, updateAccount, closeAccount, reopenAccount, deposit, withdraw, getTransactions };
