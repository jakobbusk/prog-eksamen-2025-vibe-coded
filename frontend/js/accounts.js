if (!requireAuth()) throw new Error('Not authenticated');
setupNavUser();
setupLogout();

let accounts = [];
let banks = [];
let selectedAccountId = null;

async function loadAccounts() {
  try {
    const res = await api.get('/accounts');
    accounts = res.data.accounts;
    banks = res.data.banks;
    renderAccounts();
    populateBankSelect();
  } catch (err) {
    showAlert('accounts-error', err.message);
  }
}

function renderAccounts() {
  const container = document.getElementById('accounts-grid');
  if (!accounts.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🏦</div>
      <h3>No accounts yet</h3>
      <p>Create your first investment account to get started.</p>
    </div>`;
    return;
  }
  container.innerHTML = accounts.map(a => `
    <div class="account-card ${!a.is_active ? 'closed' : ''}">
      <div class="d-flex justify-between align-center mb-1">
        <div class="account-name">${escHtml(a.name)}</div>
        <span class="badge ${a.is_active ? 'badge-success' : 'badge-muted'}">${a.is_active ? 'Active' : 'Closed'}</span>
      </div>
      <div class="text-muted" style="font-size:0.8rem">${escHtml(a.bank_name || 'No bank')} &bull; ${escHtml(a.currency)}</div>
      <div class="account-balance mt-1">${fmt(a.balance)} <span style="font-size:1rem;font-weight:400">${escHtml(a.currency)}</span></div>
      <div class="account-actions">
        ${a.is_active ? `
          <button class="btn btn-sm btn-primary" onclick="openDepositModal(${a.id})">Deposit</button>
          <button class="btn btn-sm btn-outline" onclick="openWithdrawModal(${a.id})">Withdraw</button>
          <button class="btn btn-sm btn-ghost" onclick="openTransactionsModal(${a.id})">Transactions</button>
          <button class="btn btn-sm btn-ghost" onclick="closeAccountAction(${a.id})">Close</button>
        ` : `
          <button class="btn btn-sm btn-ghost" onclick="reopenAccountAction(${a.id})">Reopen</button>
          <button class="btn btn-sm btn-ghost" onclick="openTransactionsModal(${a.id})">Transactions</button>
        `}
      </div>
    </div>
  `).join('');
}

function populateBankSelect() {
  const sel = document.getElementById('account-bank');
  sel.innerHTML = '<option value="">No bank</option>' +
    banks.map(b => `<option value="${b.id}">${escHtml(b.name)}</option>`).join('');
}

document.getElementById('create-account-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api.post('/accounts', {
      name: document.getElementById('account-name').value.trim(),
      bankId: document.getElementById('account-bank').value || null,
      currency: document.getElementById('account-currency').value,
    });
    closeModal('create-account-modal');
    e.target.reset();
    await loadAccounts();
    showAlert('accounts-error', 'Account created!', 'success');
  } catch (err) {
    showAlert('create-account-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

function openDepositModal(id) {
  selectedAccountId = id;
  const acc = accounts.find(a => a.id === id);
  document.getElementById('deposit-account-name').textContent = acc ? acc.name : '';
  document.getElementById('deposit-form').reset();
  document.getElementById('deposit-error').innerHTML = '';
  openModal('deposit-modal');
}

document.getElementById('deposit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api.post(`/accounts/${selectedAccountId}/deposit`, {
      amount: parseFloat(document.getElementById('deposit-amount').value),
      description: document.getElementById('deposit-description').value,
    });
    closeModal('deposit-modal');
    await loadAccounts();
    showAlert('accounts-error', 'Deposit successful!', 'success');
  } catch (err) {
    showAlert('deposit-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

function openWithdrawModal(id) {
  selectedAccountId = id;
  const acc = accounts.find(a => a.id === id);
  document.getElementById('withdraw-account-name').textContent = acc ? acc.name : '';
  document.getElementById('withdraw-form').reset();
  document.getElementById('withdraw-error').innerHTML = '';
  openModal('withdraw-modal');
}

document.getElementById('withdraw-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    await api.post(`/accounts/${selectedAccountId}/withdraw`, {
      amount: parseFloat(document.getElementById('withdraw-amount').value),
      description: document.getElementById('withdraw-description').value,
    });
    closeModal('withdraw-modal');
    await loadAccounts();
    showAlert('accounts-error', 'Withdrawal successful!', 'success');
  } catch (err) {
    showAlert('withdraw-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

async function openTransactionsModal(id) {
  selectedAccountId = id;
  const acc = accounts.find(a => a.id === id);
  document.getElementById('tx-account-name').textContent = acc ? acc.name : '';
  document.getElementById('tx-body').innerHTML = '<tr><td colspan="5"><div class="loading-overlay"><div class="spinner"></div> Loading…</div></td></tr>';
  openModal('transactions-modal');
  try {
    const res = await api.get(`/accounts/${id}/transactions`);
    const txs = res.data;
    if (!txs.length) {
      document.getElementById('tx-body').innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">No transactions</td></tr>';
      return;
    }
    document.getElementById('tx-body').innerHTML = txs.map(tx => `
      <tr>
        <td>${fmtDateTime(tx.created_at)}</td>
        <td><span class="badge ${tx.type.includes('buy') ? 'badge-danger' : tx.type.includes('sell') ? 'badge-success' : tx.amount > 0 ? 'badge-success' : 'badge-warning'}">${tx.type}</span></td>
        <td>${escHtml(tx.description || '—')}</td>
        <td class="text-right font-mono ${tx.amount >= 0 ? 'positive' : 'negative'}">${fmt(tx.amount)}</td>
        <td class="text-right font-mono">${fmt(tx.balance_after)}</td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('tx-body').innerHTML = `<tr><td colspan="5" class="text-center"><div class="alert alert-error">${escHtml(err.message)}</div></td></tr>`;
  }
}

async function closeAccountAction(id) {
  if (!confirm('Close this account?')) return;
  try {
    await api.post(`/accounts/${id}/close`);
    await loadAccounts();
    showAlert('accounts-error', 'Account closed.', 'success');
  } catch (err) {
    showAlert('accounts-error', err.message);
  }
}

async function reopenAccountAction(id) {
  try {
    await api.post(`/accounts/${id}/reopen`);
    await loadAccounts();
    showAlert('accounts-error', 'Account reopened.', 'success');
  } catch (err) {
    showAlert('accounts-error', err.message);
  }
}

loadAccounts();
