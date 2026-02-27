class Account {
  constructor({ id, user_id, bank_id, name, currency, balance, created_at, closed_at, is_active }) {
    this.id = id;
    this.userId = user_id;
    this.bankId = bank_id;
    this.name = name;
    this.currency = currency;
    this.balance = parseFloat(balance);
    this.createdAt = created_at;
    this.closedAt = closed_at;
    this.isActive = is_active === true || is_active === 1;
  }
}

module.exports = Account;
