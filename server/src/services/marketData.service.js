const axios = require('axios');
const securityRepo = require('../repositories/security.repository');
const priceRepo = require('../repositories/price.repository');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;

async function searchSecurity(query) {
  // First search local DB
  const localResults = await securityRepo.search(query);
  if (localResults.length > 0) return localResults;

  // Then try Finnhub if API key exists
  if (FINNHUB_API_KEY) {
    try {
      const res = await axios.get(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`, { timeout: 5000 });
      const results = (res.data.result || []).slice(0, 10).map(r => ({
        ticker: r.symbol,
        name: r.description,
        type: 'stock',
        currency: 'USD',
        exchange: r.primaryExchange,
      }));
      return results;
    } catch (err) {
      console.warn('Finnhub search failed:', err.message);
    }
  }
  return [];
}

async function getQuote(ticker) {
  const security = await securityRepo.findByTicker(ticker);
  if (!security) throw { status: 404, message: 'Security not found' };

  // Check cache
  const cached = await priceRepo.getLatestPrice(security.id);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (cached && new Date(cached.fetched_at) > oneHourAgo) {
    return { ticker, price: parseFloat(cached.price), currency: security.currency, cached: true, priceDate: cached.price_date };
  }

  // Try Finnhub
  if (FINNHUB_API_KEY) {
    try {
      const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`, { timeout: 5000 });
      const price = res.data.c;
      if (price && price > 0) {
        const today = new Date().toISOString().split('T')[0];
        await priceRepo.upsertPrice({ securityId: security.id, price, priceDate: today });
        return { ticker, price, currency: security.currency, cached: false, priceDate: today };
      }
    } catch (err) {
      console.warn('Finnhub quote failed:', err.message);
    }
  }

  // Return cached if available
  if (cached) return { ticker, price: parseFloat(cached.price), currency: security.currency, cached: true, priceDate: cached.price_date };
  throw { status: 503, message: 'Price not available' };
}

async function getHistoricalPrices(ticker) {
  const security = await securityRepo.findByTicker(ticker);
  if (!security) throw { status: 404, message: 'Security not found' };

  // Try Alpha Vantage
  if (ALPHA_VANTAGE_API_KEY) {
    try {
      const res = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`,
        { timeout: 15000 }
      );
      const timeSeries = res.data['Time Series (Daily)'];
      if (timeSeries) {
        const entries = Object.entries(timeSeries).slice(0, 365);
        for (const [date, values] of entries) {
          await priceRepo.upsertPrice({ securityId: security.id, price: parseFloat(values['4. close']), priceDate: date });
        }
      }
    } catch (err) {
      console.warn('Alpha Vantage failed:', err.message);
    }
  }

  return priceRepo.getHistory(security.id, 365);
}

async function refreshQuote(ticker) {
  const security = await securityRepo.findByTicker(ticker);
  if (!security) throw { status: 404, message: 'Security not found' };

  if (!FINNHUB_API_KEY) throw { status: 503, message: 'No API key configured' };

  const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`, { timeout: 5000 });
  const price = res.data.c;
  if (!price || price <= 0) throw { status: 503, message: 'Could not fetch price' };

  const today = new Date().toISOString().split('T')[0];
  await priceRepo.upsertPrice({ securityId: security.id, price, priceDate: today });
  return { ticker, price, currency: security.currency, priceDate: today };
}

async function convertCurrency(from, to, amount) {
  if (from === to) return { from, to, amount, converted: amount, rate: 1 };

  if (EXCHANGERATE_API_KEY) {
    try {
      const res = await axios.get(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/pair/${from}/${to}`, { timeout: 5000 });
      const rate = res.data.conversion_rate;
      return { from, to, amount, converted: amount * rate, rate };
    } catch (err) {
      console.warn('ExchangeRate API failed:', err.message);
    }
  }

  // Fallback approximate rates
  const approxRates = { 'USD_DKK': 6.9, 'DKK_USD': 0.145, 'EUR_DKK': 7.46, 'DKK_EUR': 0.134 };
  const key = `${from}_${to}`;
  const rate = approxRates[key] || 1;
  return { from, to, amount, converted: amount * rate, rate, approximate: true };
}

module.exports = { searchSecurity, getQuote, getHistoricalPrices, refreshQuote, convertCurrency };
