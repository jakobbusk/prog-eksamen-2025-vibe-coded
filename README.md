# Stock Portfolio Manager

A full-stack web application for managing investment portfolios, tracking trades, and monitoring account balances — built with Node.js, Express, Microsoft SQL Server, and vanilla JavaScript.

## Features

- **User authentication** — Register, login, JWT-based sessions
- **Account management** — Create investment accounts, deposit/withdraw cash, view transaction history
- **Portfolio management** — Create multiple portfolios per account, track holdings
- **Trade execution** — Buy and sell securities with automatic balance deduction
- **GAK calculation** — Gennemsnitlig Anskaffelseskurs (average acquisition cost) per security
- **Market data** — Optional real-time quotes via Finnhub and Alpha Vantage APIs
- **Dashboard** — Overview of net worth, portfolio breakdown chart, recent trades

## Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD and optionally add API keys
```

### 2. Start the application

```bash
docker compose up --build
```

### 3. Open in browser

```
http://localhost:3000
```

### Demo account

| Field | Value |
|-------|-------|
| Username | `demo` |
| Password | `demo1234` |

## Run Tests

```bash
# Inside the running container
docker compose exec server npm test

# Or locally (requires Node.js installed in server/)
cd server && npm install && npm test
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | ✅ | SQL Server SA password |
| `DB_NAME` | No | Database name (default: PortfolioDB) |
| `JWT_SECRET` | No | JWT signing secret (change in production!) |
| `FINNHUB_API_KEY` | No | Real-time stock quotes ([finnhub.io](https://finnhub.io)) |
| `ALPHA_VANTAGE_API_KEY` | No | Historical prices ([alphavantage.co](https://www.alphavantage.co)) |
| `EXCHANGERATE_API_KEY` | No | Currency conversion ([exchangerate-api.com](https://www.exchangerate-api.com)) |

## Project Structure

```
├── db/
│   └── init/
│       ├── 01_schema.sql       # Database schema
│       └── 02_seed.sql         # Demo data
├── server/
│   ├── src/
│   │   ├── app.js              # Express entry point
│   │   ├── db/connection.js    # MSSQL connection pool
│   │   ├── middleware/         # Auth + error middleware
│   │   ├── models/             # Data models
│   │   ├── repositories/       # Database access layer
│   │   ├── services/           # Business logic
│   │   ├── controllers/        # Route handlers
│   │   ├── routes/             # Express routers
│   │   └── schedulers/         # Price updater cron job
│   ├── tests/                  # Jest unit tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── css/styles.css          # Complete stylesheet
│   ├── js/
│   │   ├── api.js              # Fetch wrapper + utilities
│   │   ├── auth.js             # Login/register
│   │   ├── dashboard.js        # Dashboard page
│   │   ├── accounts.js         # Accounts page
│   │   ├── portfolio.js        # Portfolio page
│   │   └── trades.js           # Trades page
│   ├── index.html              # Login/Register
│   ├── dashboard.html          # Dashboard
│   ├── accounts.html           # Accounts
│   ├── portfolio.html          # Portfolios
│   └── trades.html             # Trade entry
├── docs/
│   ├── er-diagram.md           # Database ER diagram
│   └── test-strategy.md        # Test documentation
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/accounts` | List accounts |
| POST | `/api/accounts` | Create account |
| POST | `/api/accounts/:id/deposit` | Deposit cash |
| POST | `/api/accounts/:id/withdraw` | Withdraw cash |
| GET | `/api/portfolios` | List portfolios |
| POST | `/api/portfolios` | Create portfolio |
| GET | `/api/portfolios/:id/overview` | Holdings + P&L |
| GET | `/api/trades` | List trades for portfolio |
| POST | `/api/trades` | Execute a trade |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/market/quote/:ticker` | Get price quote |