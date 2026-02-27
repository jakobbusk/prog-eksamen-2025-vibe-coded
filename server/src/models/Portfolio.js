class Portfolio {
  constructor({ id, account_id, name, created_at }) {
    this.id = id;
    this.accountId = account_id;
    this.name = name;
    this.createdAt = created_at;
  }
}

module.exports = Portfolio;
