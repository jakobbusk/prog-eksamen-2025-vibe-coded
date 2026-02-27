if (!requireAuth()) throw new Error('Not authenticated');
setupNavUser();
setupLogout();

let portfolios = [];
let selectedPortfolioId = null;
let selectedSecurity = null;
let searchTimeout = null;

async function loadPortfolios() {
  try {
    const res = await api.get('/portfolios');
    portfolios = res.data;
    const sel = document.getElementById('portfolio-select');
    sel.innerHTML = portfolios.length
      ? portfolios.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')
      : '<option value="">No portfolios — create one first</option>';

    if (portfolios.length) {
      selectedPortfolioId = portfolios[0].id;
      await loadTrades();
    }
  } catch (err) {
    showAlert('trades-error', err.message);
  }
}

document.getElementById('portfolio-select').addEventListener('change', async (e) => {
  selectedPortfolioId = parseInt(e.target.value) || null;
  if (selectedPortfolioId) await loadTrades();
});

async function loadTrades() {
  if (!selectedPortfolioId) return;
  document.getElementById('trades-table-body').innerHTML =
    '<tr><td colspan="7"><div class="loading-overlay"><div class="spinner"></div> Loading…</div></td></tr>';
  try {
    const res = await api.get(`/trades?portfolio_id=${selectedPortfolioId}`);
    renderTrades(res.data);
  } catch (err) {
    showAlert('trades-error', err.message);
  }
}

function renderTrades(trades) {
  const tbody = document.getElementById('trades-table-body');
  if (!trades.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:24px">No trades in this portfolio</td></tr>';
    return;
  }
  tbody.innerHTML = trades.map(t => `
    <tr>
      <td>${fmtDateTime(t.traded_at)}</td>
      <td><span class="badge ${t.type === 'buy' ? 'badge-success' : 'badge-danger'}">${t.type.toUpperCase()}</span></td>
      <td><strong>${escHtml(t.ticker)}</strong><br><small class="text-muted">${escHtml(t.security_name)}</small></td>
      <td class="text-right font-mono">${fmt(t.quantity, 4)}</td>
      <td class="text-right font-mono">${t.quantity > 0 ? fmt(t.total_price / t.quantity) : '—'}</td>
      <td class="text-right font-mono">${fmt(t.total_price)}</td>
      <td class="text-right font-mono">${fmt(t.fee)}</td>
    </tr>
  `).join('');
}

// Security search
const searchInput = document.getElementById('security-search');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (q.length < 2) { searchResults.innerHTML = ''; searchResults.classList.add('hidden'); return; }
  searchTimeout = setTimeout(() => doSearch(q), 300);
});

async function doSearch(q) {
  try {
    const res = await api.get(`/trades/search?q=${encodeURIComponent(q)}`);
    const items = res.data;
    if (!items.length) {
      searchResults.innerHTML = '<div class="search-result-item text-muted">No results found</div>';
    } else {
      searchResults.innerHTML = items.map(s => `
        <div class="search-result-item" data-id="${s.id}" data-ticker="${escHtml(s.ticker)}" data-name="${escHtml(s.name)}" data-currency="${escHtml(s.currency)}">
          <div><strong>${escHtml(s.ticker)}</strong> — ${escHtml(s.name)}</div>
          <span class="badge badge-muted">${escHtml(s.currency)}</span>
        </div>
      `).join('');
    }
    searchResults.classList.remove('hidden');
  } catch (err) {
    searchResults.innerHTML = `<div class="search-result-item text-muted">${escHtml(err.message)}</div>`;
    searchResults.classList.remove('hidden');
  }
}

searchResults.addEventListener('click', (e) => {
  const item = e.target.closest('.search-result-item[data-id]');
  if (!item) return;
  selectedSecurity = {
    id: parseInt(item.dataset.id),
    ticker: item.dataset.ticker,
    name: item.dataset.name,
    currency: item.dataset.currency,
  };
  searchInput.value = `${selectedSecurity.ticker} — ${selectedSecurity.name}`;
  searchResults.innerHTML = '';
  searchResults.classList.add('hidden');
  document.getElementById('selected-security').textContent = `${selectedSecurity.ticker} (${selectedSecurity.currency})`;
  document.getElementById('selected-security').classList.remove('hidden');
  updateTotalPrice();
});

document.addEventListener('click', (e) => {
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.classList.add('hidden');
  }
});

// Auto-calculate total price
document.getElementById('trade-quantity').addEventListener('input', updateTotalPrice);
document.getElementById('trade-price').addEventListener('input', updateTotalPrice);

function updateTotalPrice() {
  const qty = parseFloat(document.getElementById('trade-quantity').value) || 0;
  const price = parseFloat(document.getElementById('trade-price').value) || 0;
  document.getElementById('trade-total').value = (qty * price).toFixed(4);
}

// Trade form submit
document.getElementById('trade-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedPortfolioId) { showAlert('trade-error', 'Select a portfolio first'); return; }
  if (!selectedSecurity) { showAlert('trade-error', 'Select a security first'); return; }

  const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
  if (!portfolio) { showAlert('trade-error', 'Portfolio not found'); return; }

  const type = document.getElementById('trade-type').value;
  const quantity = parseFloat(document.getElementById('trade-quantity').value);
  const totalPrice = parseFloat(document.getElementById('trade-total').value);
  const fee = parseFloat(document.getElementById('trade-fee').value) || 0;

  if (!quantity || quantity <= 0) { showAlert('trade-error', 'Invalid quantity'); return; }
  if (!totalPrice || totalPrice <= 0) { showAlert('trade-error', 'Invalid total price'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Executing…';

  try {
    await api.post('/trades', {
      portfolioId: selectedPortfolioId,
      accountId: portfolio.account_id,
      securityId: selectedSecurity.id,
      type,
      quantity,
      totalPrice,
      fee,
    });
    e.target.reset();
    const sec = selectedSecurity;
    selectedSecurity = null;
    document.getElementById('selected-security').classList.add('hidden');
    document.getElementById('selected-security').textContent = '';
    searchInput.value = '';
    showAlert('trades-error', `Trade executed: ${type.toUpperCase()} ${quantity} x ${sec?.ticker || 'security'}`, 'success');
    await loadTrades();
  } catch (err) {
    showAlert('trade-error', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Execute Trade';
  }
});

loadPortfolios();
