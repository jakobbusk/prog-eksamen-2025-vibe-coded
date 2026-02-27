-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'PortfolioDB')
BEGIN
    CREATE DATABASE PortfolioDB;
END
GO

USE PortfolioDB;
GO

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(50) UNIQUE NOT NULL,
  email NVARCHAR(100) UNIQUE NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  created_at DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- Banks
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'banks')
BEGIN
CREATE TABLE banks (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  country NVARCHAR(50)
);
END
GO

-- Accounts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accounts')
BEGIN
CREATE TABLE accounts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  bank_id INT REFERENCES banks(id),
  name NVARCHAR(100) NOT NULL,
  currency NVARCHAR(10) NOT NULL DEFAULT 'DKK',
  balance DECIMAL(18,4) NOT NULL DEFAULT 0,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  closed_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1
);
END
GO

-- Trades (before account_transactions due to FK)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'trades')
BEGIN
CREATE TABLE trades (
  id INT IDENTITY(1,1) PRIMARY KEY,
  portfolio_id INT NOT NULL,
  account_id INT NOT NULL REFERENCES accounts(id),
  security_id INT NOT NULL,
  type NVARCHAR(10) NOT NULL CHECK (type IN ('buy','sell')),
  quantity DECIMAL(18,6) NOT NULL,
  total_price DECIMAL(18,4) NOT NULL,
  fee DECIMAL(18,4) NULL DEFAULT 0,
  traded_at DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- Account Transactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'account_transactions')
BEGIN
CREATE TABLE account_transactions (
  id INT IDENTITY(1,1) PRIMARY KEY,
  account_id INT NOT NULL REFERENCES accounts(id),
  type NVARCHAR(20) NOT NULL CHECK (type IN ('deposit','withdrawal','trade_buy','trade_sell')),
  amount DECIMAL(18,4) NOT NULL,
  balance_after DECIMAL(18,4) NOT NULL,
  description NVARCHAR(255),
  trade_id INT NULL REFERENCES trades(id),
  created_at DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- Portfolios
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'portfolios')
BEGIN
CREATE TABLE portfolios (
  id INT IDENTITY(1,1) PRIMARY KEY,
  account_id INT NOT NULL REFERENCES accounts(id),
  name NVARCHAR(100) NOT NULL,
  created_at DATETIME2 DEFAULT GETUTCDATE()
);
END
GO

-- Securities
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'securities')
BEGIN
CREATE TABLE securities (
  id INT IDENTITY(1,1) PRIMARY KEY,
  ticker NVARCHAR(20) NOT NULL UNIQUE,
  name NVARCHAR(200) NOT NULL,
  type NVARCHAR(20) NOT NULL CHECK (type IN ('stock','bond','crypto','currency')),
  currency NVARCHAR(10) NOT NULL DEFAULT 'USD',
  exchange NVARCHAR(50)
);
END
GO

-- Prices (historical)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'prices')
BEGIN
CREATE TABLE prices (
  id INT IDENTITY(1,1) PRIMARY KEY,
  security_id INT NOT NULL REFERENCES securities(id),
  price DECIMAL(18,4) NOT NULL,
  price_date DATE NOT NULL,
  fetched_at DATETIME2 DEFAULT GETUTCDATE(),
  CONSTRAINT uq_security_date UNIQUE (security_id, price_date)
);
END
GO

-- Add portfolio_id and security_id FKs to trades after portfolios/securities exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_trade_portfolio')
BEGIN
  ALTER TABLE trades ADD CONSTRAINT fk_trade_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_trade_security')
BEGIN
  ALTER TABLE trades ADD CONSTRAINT fk_trade_security FOREIGN KEY (security_id) REFERENCES securities(id);
END
GO

-- Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_prices_security_date')
  CREATE INDEX idx_prices_security_date ON prices(security_id, price_date DESC);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_trades_portfolio')
  CREATE INDEX idx_trades_portfolio ON trades(portfolio_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_account_transactions_account')
  CREATE INDEX idx_account_transactions_account ON account_transactions(account_id);
GO
