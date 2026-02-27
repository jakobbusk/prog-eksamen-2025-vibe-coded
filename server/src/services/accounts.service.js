const accountRepo = require('../repositories/account.repository');

async function getAccounts(userId) {
  return accountRepo.findByUserId(userId);
}

async function getAccount(accountId, userId) {
  const account = await accountRepo.findById(accountId);
  if (!account) throw { status: 404, message: 'Account not found' };
  if (account.user_id !== userId) throw { status: 403, message: 'Forbidden' };
  return account;
}

async function createAccount(userId, { bankId, name, currency }) {
  if (!name) throw { status: 400, message: 'Account name is required' };
  return accountRepo.create({ userId, bankId, name, currency });
}

async function updateAccount(accountId, userId, { name, bankId }) {
  const account = await getAccount(accountId, userId);
  if (!name) throw { status: 400, message: 'Name is required' };
  return accountRepo.update(accountId, { name, bankId });
}

async function closeAccount(accountId, userId) {
  const account = await getAccount(accountId, userId);
  if (!account.is_active) throw { status: 400, message: 'Account is already closed' };
  await accountRepo.close(accountId);
}

async function reopenAccount(accountId, userId) {
  const account = await getAccount(accountId, userId);
  if (account.is_active) throw { status: 400, message: 'Account is already active' };
  await accountRepo.reopen(accountId);
}

async function deposit(accountId, userId, { amount, description }) {
  if (!amount || amount <= 0) throw { status: 400, message: 'Amount must be positive' };
  const account = await getAccount(accountId, userId);
  if (!account.is_active) throw { status: 400, message: 'Account is closed' };

  const newBalance = parseFloat(account.balance) + parseFloat(amount);
  await accountRepo.updateBalance(accountId, newBalance);
  await accountRepo.createTransaction({
    accountId, type: 'deposit', amount, balanceAfter: newBalance,
    description: description || 'Deposit',
  });
  return { balance: newBalance };
}

async function withdraw(accountId, userId, { amount, description }) {
  if (!amount || amount <= 0) throw { status: 400, message: 'Amount must be positive' };
  const account = await getAccount(accountId, userId);
  if (!account.is_active) throw { status: 400, message: 'Account is closed' };
  if (parseFloat(account.balance) < parseFloat(amount)) throw { status: 400, message: 'Insufficient balance' };

  const newBalance = parseFloat(account.balance) - parseFloat(amount);
  await accountRepo.updateBalance(accountId, newBalance);
  await accountRepo.createTransaction({
    accountId, type: 'withdrawal', amount, balanceAfter: newBalance,
    description: description || 'Withdrawal',
  });
  return { balance: newBalance };
}

async function getTransactions(accountId, userId) {
  await getAccount(accountId, userId);
  return accountRepo.getTransactions(accountId);
}

async function getBanks() {
  return accountRepo.getBanks();
}

module.exports = { getAccounts, getAccount, createAccount, updateAccount, closeAccount, reopenAccount, deposit, withdraw, getTransactions, getBanks };
