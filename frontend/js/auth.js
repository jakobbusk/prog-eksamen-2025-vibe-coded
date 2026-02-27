// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

setupTabs('.auth-body');

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Logging in…';
  try {
    const res = await api.post('/auth/login', {
      username: document.getElementById('login-username').value.trim(),
      password: document.getElementById('login-password').value,
    });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert('login-error', err.message);
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (password !== confirm) {
    showAlert('register-error', 'Passwords do not match');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  try {
    const res = await api.post('/auth/register', {
      username: document.getElementById('reg-username').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      password,
    });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert('register-error', err.message);
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});
