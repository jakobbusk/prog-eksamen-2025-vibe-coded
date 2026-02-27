USE PortfolioDB;
GO

-- Banks
IF NOT EXISTS (SELECT 1 FROM banks WHERE name = 'Nordea')
BEGIN
  INSERT INTO banks (name, country) VALUES 
    ('Nordea', 'Denmark'),
    ('Danske Bank', 'Denmark'),
    ('Saxo Bank', 'Denmark');
END
GO

-- Demo user (password: demo1234)
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo')
BEGIN
  INSERT INTO users (username, email, password_hash) VALUES
    ('demo', 'demo@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
END
GO

-- Securities
IF NOT EXISTS (SELECT 1 FROM securities WHERE ticker = 'AAPL')
BEGIN
  INSERT INTO securities (ticker, name, type, currency, exchange) VALUES
    ('AAPL', 'Apple Inc.', 'stock', 'USD', 'NASDAQ'),
    ('MSFT', 'Microsoft Corporation', 'stock', 'USD', 'NASDAQ'),
    ('TSLA', 'Tesla Inc.', 'stock', 'USD', 'NASDAQ'),
    ('NOVO-B.CO', 'Novo Nordisk', 'stock', 'DKK', 'CPH'),
    ('BTC-USD', 'Bitcoin', 'crypto', 'USD', 'CRYPTO');
END
GO
