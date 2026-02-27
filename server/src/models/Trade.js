class Trade {
  constructor({ id, portfolio_id, account_id, security_id, type, quantity, total_price, fee, traded_at }) {
    this.id = id;
    this.portfolioId = portfolio_id;
    this.accountId = account_id;
    this.securityId = security_id;
    this.type = type;
    this.quantity = parseFloat(quantity);
    this.totalPrice = parseFloat(total_price);
    this.fee = parseFloat(fee || 0);
    this.tradedAt = traded_at;
  }
}

module.exports = Trade;
