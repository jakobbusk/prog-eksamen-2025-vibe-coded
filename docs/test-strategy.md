# Test Strategy

## Overview

The server-side unit tests cover the core business logic of the Stock Portfolio Manager without requiring a database connection. All database calls are mocked using Jest's module mocking system.

## Test Suites

### 1. GAK Calculation (`tests/gak.test.js`)

Tests the **Gennemsnitlig Anskaffelseskurs** (Average Acquisition Cost) calculation in `portfolios.service.js`.

**What is GAK?**
GAK is the Danish term for the weighted average cost of a security holding. It is updated on every buy and adjusted proportionally on every sell.

**Test Cases:**
| Test | Description |
|------|-------------|
| Simple buy | Buying 10 units at 1000 total → quantity=10, cost=1000 |
| Two buys at different prices | Accumulated quantity and cost are summed correctly |
| Sell reduces quantity | After buying 10 and selling 5, quantity=5 and cost=500 |
| Multiple securities | Each security tracked independently |
| Empty trades | Returns empty holdings object |

**Coverage:** Pure function — no mocks needed. Tests the GAK algorithm directly.

---

### 2. Trade Validation (`tests/validation.test.js`)

Tests input validation and business rules in `trades.service.js`.

**Mocked modules:**
- `account.repository`
- `portfolio.repository`
- `security.repository`
- `trade.repository`
- `db/connection`

**Test Cases:**
| Test | Expected Error |
|------|---------------|
| Missing required fields | 400 Bad Request |
| Buy with insufficient account balance | 400 Insufficient balance |
| Sell with insufficient holdings | 400 Insufficient holdings |
| Trade on closed account | 400 Account is closed |
| Invalid trade type (not buy/sell) | 400 Type must be buy or sell |

---

### 3. Balance Operations (`tests/balance.test.js`)

Tests deposit and withdrawal logic in `accounts.service.js`.

**Mocked modules:**
- `account.repository`
- `db/connection`

**Test Cases:**
| Test | Description |
|------|-------------|
| Deposit increases balance | Balance goes from 1000 → 1500 after 500 deposit |
| Withdrawal decreases balance | Balance goes from 1000 → 700 after 300 withdrawal |
| Reject overdraft | Withdrawal of 2000 from balance of 1000 → 400 error |
| Reject negative deposit | Deposit of -100 → 400 error |
| Reject deposit on closed account | Closed account → 400 error |
| Transaction record on deposit | `createTransaction` called with type=deposit |
| Transaction record on withdrawal | `createTransaction` called with type=withdrawal |

---

## Running Tests

```bash
cd server
npm test
```

Or inside Docker:
```bash
docker compose exec server npm test
```

## Test Design Principles

1. **No database required**: All external dependencies are mocked, so tests run instantly without a live SQL Server connection.
2. **Isolation**: Each test resets mocks with `jest.clearAllMocks()` to prevent state leakage.
3. **Business logic focus**: Tests validate the behaviour of service-layer functions, not the repository layer.
4. **Error contract**: All error cases validate both the `status` code and that the promise rejects.

## Future Test Coverage

- Integration tests against a test SQL Server instance
- API endpoint tests with supertest
- Frontend E2E tests with Playwright
- Price fetching with mocked Axios responses
