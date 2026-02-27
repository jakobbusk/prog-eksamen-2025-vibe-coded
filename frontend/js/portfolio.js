if (!requireAuth()) throw new Error('Not authenticated');
setupNavUser();
setupLogout();

let portfolios = [];
let accounts = [];
let holdingsChart = null;

async function loadData() {
  try {
    const [portRes, accRes] = await Promise.all([
      api.get('/portfolios'),
      api.get('/accounts'),
    ]);
    portfolios = portRes.data;
    accounts = accRes.data.accounts.filter(a => a.is_active);
    renderPortfolios();
    populateAccountSelect();
  } catch (err) {
    showAlert('portfolio-error', err.message);
  }
}

function renderPortfolios() {
  const container = document.getElementById('portfolios-grid');
  if (!portfolios.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📁</div>
      <h3>No portfolios yet</h3>
      <p>Create a portfolio to start tracking your investments.</p>
    </div>`;
    return;
  }
  container.innerHTML = portfolios.map(p => `
    <div class="portfolio-card">
      <div class="d-flex justify-between align-center mb-1">
        <div style="font-weight:600;font-size:1rem">${escHtml(p.name)}</div>
        <button class="btn btn-sm btn-danger" onclick="deletePortfolioAction(${p.id})">Delete</button>
      </div>
      <div class="text-muted" style="font-size:0.8rem">Created ${fmtDate(p.created_at)}</div>
      <div class="account-actions">
        <button class="btn btn-sm btn-primary" onclick="viewOverview(${p.id})">View Holdings</button>
      </div>
    </div>
  `).join('');
}

function populateAccountSelect() {
  const sel = document.getElementById('portfolio-account');
  sel.innerHTML = accounts.length
    ? accounts.map(a => `<option value="${a.id}">${escHtml(a.name)} (${escHtml(a.currency)})</option>`).join('')
    : '<option value="">No active accounts</option>';
}

document.getElementById('create-portfolio-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api.post('/portfolios', {
      name: document.getElementById('portfolio-name').value.trim(),
      accountId: parseInt(document.getElementById('portfolio-account').value),
    });
    closeModal('create-portfolio-modal');
    e.target.reset();
    await loadData();
    showAlert('portfolio-error', 'Portfolio created!', 'success');
  } catch (err) {
    showAlert('create-portfolio-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

async function deletePortfolioAction(id) {
  if (!confirm('Delete this portfolio? This cannot be undone.')) return;
  try {
    await api.delete(`/portfolios/${id}`);
    await loadData();
    showAlert('portfolio-error', 'Portfolio deleted.', 'success');
  } catch (err) {
    showAlert('portfolio-error', err.message);
  }
}

async function viewOverview(id) {
  const portfolio = portfolios.find(p => p.id === id);
  document.getElementById('overview-title').textContent = portfolio ? portfolio.name : 'Portfolio';
  document.getElementById('overview-body').innerHTML = '<div class="loading-overlay"><div class="spinner"></div> Loading…</div>';
  document.getElementById('overview-total').textContent = '—';
  document.getElementById('overview-gain').textContent = '—';
  if (holdingsChart) { holdingsChart.destroy(); holdingsChart = null; }
  openModal('overview-modal');

  try {
    const res = await api.get(`/portfolios/${id}/overview`);
    const data = res.data;
    document.getElementById('overview-total').textContent = fmt(data.totalMarketValue);
    const gainEl = document.getElementById('overview-gain');
    gainEl.textContent = fmt(data.totalUnrealizedGain);
    gainEl.className = data.totalUnrealizedGain >= 0 ? 'stat-value positive' : 'stat-value negative';

    if (!data.positions.length) {
      document.getElementById('overview-body').innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No holdings in this portfolio yet.</p></div>';
      return;
    }

    document.getElementById('overview-body').innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Security</th><th>Qty</th><th>GAK</th><th>Price</th><th>Value</th><th>Gain/Loss</th><th>%</th>
          </tr></thead>
          <tbody>${data.positions.map(p => `
            <tr>
              <td><strong>${escHtml(p.ticker)}</strong><br><small class="text-muted">${escHtml(p.name)}</small></td>
              <td class="font-mono">${fmt(p.quantity, 4)}</td>
              <td class="font-mono">${fmt(p.gak)}</td>
              <td class="font-mono">${p.currentPrice !== null ? fmt(p.currentPrice) : '<span class="text-muted">N/A</span>'}</td>
              <td class="font-mono">${p.marketValue !== null ? fmt(p.marketValue) : '—'}</td>
              <td class="font-mono ${p.unrealizedGain >= 0 ? 'positive' : 'negative'}">${p.unrealizedGain !== null ? fmt(p.unrealizedGain) : '—'}</td>
              <td class="font-mono ${p.unrealizedGainPct >= 0 ? 'positive' : 'negative'}">${p.unrealizedGainPct !== null ? fmt(p.unrealizedGainPct) + '%' : '—'}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    `;

    // Render pie chart
    const canvas = document.getElementById('holdings-chart');
    if (canvas && data.positions.some(p => p.marketValue > 0)) {
      const posWithValue = data.positions.filter(p => p.marketValue > 0);
      holdingsChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: posWithValue.map(p => p.ticker),
          datasets: [{
            data: posWithValue.map(p => p.marketValue),
            backgroundColor: ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#059669'],
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }
  } catch (err) {
    document.getElementById('overview-body').innerHTML = `<div class="alert alert-error">${escHtml(err.message)}</div>`;
  }
}

loadData();
