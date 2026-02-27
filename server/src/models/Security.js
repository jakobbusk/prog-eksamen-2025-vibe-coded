class Security {
  constructor({ id, ticker, name, type, currency, exchange }) {
    this.id = id;
    this.ticker = ticker;
    this.name = name;
    this.type = type;
    this.currency = currency;
    this.exchange = exchange;
  }
}

module.exports = Security;
