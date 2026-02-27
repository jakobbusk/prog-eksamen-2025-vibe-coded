if (!requireAuth()) throw new Error('Not authenticated');
setupNavUser();
setupLogout();

let portfolioChart = null;

async function loadDashboard() {
  document.getElementById('dashboard-loading').classList.remove('hidden');
  document.getElementById('dashboard-content').classList.add('hidden');
  try {
    const res = await api.get('/dashboard');
    const d = res.data;

    document.getElementById('total-balance').textContent = fmt(d.totalBalance);
    document.getElementById('total-portfolio').textContent = fmt(d.totalPortfolioValue);
    document.getElementById('total-networth').textContent = fmt(d.totalNetWorth);
    document.getElementById('active-accounts').textContent = d.activeAccounts;
    document.getElementById('total-portfolios').textContent = d.totalPortfolios;

    renderRecentTrades(d.recentTrades);
    renderPortfolioChart(d.portfolioSummary);

    document.getElementById('dashboard-loading').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');
  } catch (err) {
    document.getElementById('dashboard-loading').innerHTML =
      `<div class="alert alert-error">${escHtml(err.message)}</div>`;
  }
}

function renderRecentTrades(trades) {
  const tbody = document.getElementById('recent-trades-body');
  if (!trades || trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">No trades yet</td></tr>';
    return;
  }
  tbody.innerHTML = trades.map(t => `
    <tr>
      <td>${fmtDateTime(t.traded_at)}</td>
      <td><span class="badge ${t.type === 'buy' ? 'badge-success' : 'badge-danger'}">${t.type.toUpperCase()}</span></td>
      <td><strong>${escHtml(t.ticker)}</strong> <span class="text-muted">${escHtml(t.security_name)}</span></td>
      <td class="text-right font-mono">${fmt(t.quantity, 4)}</td>
      <td class="text-right font-mono">${fmt(t.total_price)}</td>
    </tr>
  `).join('');
}

function renderPortfolioChart(summaries) {
  const canvas = document.getElementById('portfolio-chart');
  if (!canvas) return;
  const labels = summaries.map(s => s.portfolio.name);
  const values = summaries.map(s => s.value);

  if (portfolioChart) portfolioChart.destroy();

  if (values.every(v => v === 0)) {
    canvas.parentElement.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>No portfolio data yet.<br>Add accounts, portfolios and trades to see your breakdown.</p></div>';
    return;
  }

  portfolioChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed',
          '#0891b2', '#be185d', '#059669', '#ea580c', '#4f46e5',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

loadDashboard();
