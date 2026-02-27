// Mock dependencies before requiring service
jest.mock('../src/repositories/account.repository');
jest.mock('../src/repositories/portfolio.repository');
jest.mock('../src/repositories/security.repository');
jest.mock('../src/repositories/trade.repository');
jest.mock('../src/db/connection', () => ({
  getPool: jest.fn().mockResolvedValue({
    request: () => ({ query: jest.fn(), input: () => ({ query: jest.fn() }) }),
  }),
  sql: { Transaction: jest.fn(), Int: 'Int', NVarChar: 'NVarChar', Decimal: jest.fn() },
}));

const accountRepo = require('../src/repositories/account.repository');
const portfolioRepo = require('../src/repositories/portfolio.repository');
const securityRepo = require('../src/repositories/security.repository');
const tradeRepo = require('../src/repositories/trade.repository');
const tradesService = require('../src/services/trades.service');

describe('Trade Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    accountRepo.findByUserId.mockResolvedValue([{ id: 1 }]);
    accountRepo.findById.mockResolvedValue({ id: 1, user_id: 1, balance: 1000, is_active: true });
    portfolioRepo.findById.mockResolvedValue({ id: 1, account_id: 1 });
    securityRepo.findById.mockResolvedValue({ id: 1, ticker: 'AAPL', name: 'Apple', currency: 'USD' });
    tradeRepo.getHoldings.mockResolvedValue([{ security_id: 1, net_quantity: '10' }]);
    tradeRepo.create.mockResolvedValue({ id: 1, type: 'buy', quantity: 5, total_price: 500 });
    accountRepo.updateBalance.mockResolvedValue();
    accountRepo.createTransaction.mockResolvedValue();
  });

  test('should reject trade with missing fields', async () => {
    await expect(tradesService.executeTrade(1, {})).rejects.toMatchObject({ status: 400 });
  });

  test('should reject buy with insufficient balance', async () => {
    accountRepo.findById.mockResolvedValue({ id: 1, user_id: 1, balance: 10, is_active: true });
    await expect(tradesService.executeTrade(1, {
      portfolioId: 1, accountId: 1, securityId: 1, type: 'buy', quantity: 5, totalPrice: 500
    })).rejects.toMatchObject({ status: 400 });
  });

  test('should reject sell with insufficient holdings', async () => {
    tradeRepo.getHoldings.mockResolvedValue([{ security_id: 1, net_quantity: '3' }]);
    await expect(tradesService.executeTrade(1, {
      portfolioId: 1, accountId: 1, securityId: 1, type: 'sell', quantity: 5, totalPrice: 400
    })).rejects.toMatchObject({ status: 400 });
  });

  test('should reject trade on closed account', async () => {
    accountRepo.findById.mockResolvedValue({ id: 1, user_id: 1, balance: 1000, is_active: false });
    await expect(tradesService.executeTrade(1, {
      portfolioId: 1, accountId: 1, securityId: 1, type: 'buy', quantity: 5, totalPrice: 500
    })).rejects.toMatchObject({ status: 400 });
  });

  test('should reject invalid trade type', async () => {
    await expect(tradesService.executeTrade(1, {
      portfolioId: 1, accountId: 1, securityId: 1, type: 'invalid', quantity: 5, totalPrice: 500
    })).rejects.toMatchObject({ status: 400 });
  });
});
