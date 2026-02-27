# ER Diagram — Stock Portfolio Manager

## Entity-Relationship Overview

```
users (1) ──────────────── (N) accounts
                                  │
              banks (1) ──── (N) accounts
                                  │
              accounts (1) ── (N) account_transactions
                                  │
              accounts (1) ── (N) portfolios
                                  │
              portfolios (1) ─ (N) trades
                                  │
              securities (1) ─ (N) trades
                                  │
              securities (1) ─ (N) prices
```

## Tables

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| username | NVARCHAR(50) UNIQUE | Login username |
| email | NVARCHAR(100) UNIQUE | User email |
| password_hash | NVARCHAR(255) | bcrypt hash |
| created_at | DATETIME2 | Registration timestamp |

### `banks`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| name | NVARCHAR(100) | Bank name (e.g. Nordea) |
| country | NVARCHAR(50) | Country of bank |

### `accounts`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| user_id | INT FK → users | Owner |
| bank_id | INT FK → banks | Associated bank (nullable) |
| name | NVARCHAR(100) | Account label |
| currency | NVARCHAR(10) | Default DKK |
| balance | DECIMAL(18,4) | Current cash balance |
| created_at | DATETIME2 | Creation timestamp |
| closed_at | DATETIME2 | Closure timestamp (null if open) |
| is_active | BIT | 1 = open, 0 = closed |

### `portfolios`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| account_id | INT FK → accounts | Funding account |
| name | NVARCHAR(100) | Portfolio label |
| created_at | DATETIME2 | Creation timestamp |

### `securities`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| ticker | NVARCHAR(20) UNIQUE | Ticker symbol (e.g. AAPL) |
| name | NVARCHAR(200) | Full name |
| type | NVARCHAR(20) | stock / bond / crypto / currency |
| currency | NVARCHAR(10) | Trading currency |
| exchange | NVARCHAR(50) | Exchange (e.g. NASDAQ) |

### `trades`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| portfolio_id | INT FK → portfolios | Portfolio |
| account_id | INT FK → accounts | Linked account |
| security_id | INT FK → securities | Traded security |
| type | NVARCHAR(10) | buy or sell |
| quantity | DECIMAL(18,6) | Units traded |
| total_price | DECIMAL(18,4) | Total amount |
| fee | DECIMAL(18,4) | Broker fee |
| traded_at | DATETIME2 | Trade execution time |

### `account_transactions`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| account_id | INT FK → accounts | Account |
| type | NVARCHAR(20) | deposit / withdrawal / trade_buy / trade_sell |
| amount | DECIMAL(18,4) | Transaction amount |
| balance_after | DECIMAL(18,4) | Balance after transaction |
| description | NVARCHAR(255) | Human-readable note |
| trade_id | INT FK → trades | Related trade (nullable) |
| created_at | DATETIME2 | Transaction timestamp |

### `prices`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment primary key |
| security_id | INT FK → securities | Security |
| price | DECIMAL(18,4) | Closing price |
| price_date | DATE | Trading date |
| fetched_at | DATETIME2 | When data was fetched |

## Key Relationships

- **User → Accounts**: One user may have many accounts in different banks and currencies.
- **Account → Portfolios**: An account funds one or more portfolios. Trades debit/credit the account balance.
- **Portfolio → Trades**: Trades belong to one portfolio. Buying adds to holdings, selling reduces them.
- **Security → Prices**: Historical prices are stored per security per date for P&L calculation.
- **Trade → AccountTransaction**: Each trade creates a corresponding account transaction (trade_buy or trade_sell).

## GAK (Gennemsnitlig Anskaffelseskurs)
The average acquisition cost is recalculated on each trade:
- **Buy**: `newGAK = (oldCost + tradeCost) / (oldQty + tradeQty)`
- **Sell**: Cost basis reduced proportionally; realised gain = salePrice - GAK × qty
