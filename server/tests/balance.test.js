jest.mock('../src/repositories/account.repository');
jest.mock('../src/db/connection', () => ({
  getPool: jest.fn(),
  sql: {},
}));

const accountRepo = require('../src/repositories/account.repository');
const accountsService = require('../src/services/accounts.service');

describe('Balance Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    accountRepo.findByUserId.mockResolvedValue([{ id: 1, user_id: 1 }]);
    accountRepo.findById.mockResolvedValue({ id: 1, user_id: 1, balance: 1000, is_active: true });
    accountRepo.updateBalance.mockResolvedValue();
    accountRepo.createTransaction.mockResolvedValue({});
  });

  test('should increase balance on deposit', async () => {
    const result = await accountsService.deposit(1, 1, { amount: 500 });
    expect(result.balance).toBe(1500);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(1, 1500);
  });

  test('should decrease balance on withdrawal', async () => {
    const result = await accountsService.withdraw(1, 1, { amount: 300 });
    expect(result.balance).toBe(700);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(1, 700);
  });

  test('should reject withdrawal exceeding balance', async () => {
    await expect(accountsService.withdraw(1, 1, { amount: 2000 })).rejects.toMatchObject({ status: 400 });
  });

  test('should reject deposit of negative amount', async () => {
    await expect(accountsService.deposit(1, 1, { amount: -100 })).rejects.toMatchObject({ status: 400 });
  });

  test('should reject deposit on closed account', async () => {
    accountRepo.findById.mockResolvedValue({ id: 1, user_id: 1, balance: 1000, is_active: false });
    await expect(accountsService.deposit(1, 1, { amount: 100 })).rejects.toMatchObject({ status: 400 });
  });

  test('should create transaction record on deposit', async () => {
    await accountsService.deposit(1, 1, { amount: 200, description: 'Test deposit' });
    expect(accountRepo.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'deposit', amount: 200 })
    );
  });

  test('should create transaction record on withdrawal', async () => {
    await accountsService.withdraw(1, 1, { amount: 100 });
    expect(accountRepo.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'withdrawal', amount: 100 })
    );
  });
});
