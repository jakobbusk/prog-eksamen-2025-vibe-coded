const API_BASE = '/api';

async function apiRequest(method, path, body = null) {
  const token = localStorage.getItem('token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, opts);
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
};

function fmt(num, decimals = 2) {
  if (num === null || num === undefined) return '—';
  return parseFloat(num).toLocaleString('da-DK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(num, currency = 'DKK') {
  if (num === null || num === undefined) return '—';
  return parseFloat(num).toLocaleString('da-DK', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('da-DK');
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('da-DK');
}

function showAlert(containerId, message, type = 'error') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="alert alert-${type}">${escHtml(message)}</div>`;
  setTimeout(() => { if (container) container.innerHTML = ''; }, 5000);
}

function escHtml(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch { return {}; }
}

function setupNavUser() {
  const el = document.getElementById('nav-username');
  if (el) el.textContent = getUser().username || '';
}

function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      try { await api.post('/auth/logout'); } catch {}
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/index.html';
    });
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Close modals when clicking overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// Tab switching
function setupTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = container.querySelector(`#${target}`);
      if (panel) panel.classList.add('active');
    });
  });
}
