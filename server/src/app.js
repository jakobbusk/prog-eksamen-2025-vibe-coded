require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getPool } = require('./db/connection');
const errorMiddleware = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const accountsRoutes = require('./routes/accounts.routes');
const portfoliosRoutes = require('./routes/portfolios.routes');
const tradesRoutes = require('./routes/trades.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const marketRoutes = require('./routes/market.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../../frontend')));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/accounts', apiLimiter, accountsRoutes);
app.use('/api/portfolios', apiLimiter, portfoliosRoutes);
app.use('/api/trades', apiLimiter, tradesRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/market', apiLimiter, marketRoutes);

// SPA fallback - serve index.html for non-API routes
app.get('*', apiLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, '../../../frontend/index.html'));
});

app.use(errorMiddleware);

async function waitForDB(retries = 30, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = await getPool();
      await pool.request().query('SELECT 1');
      console.log('[DB] Connected successfully');
      return;
    } catch (err) {
      console.log(`[DB] Waiting for database... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Could not connect to database after retries');
}

async function start() {
  try {
    await waitForDB();
    const { startPriceUpdater } = require('./schedulers/priceUpdater');
    startPriceUpdater();
    app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
