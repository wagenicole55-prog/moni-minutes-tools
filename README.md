const page = window.location.pathname;

const getStoredToken = () => localStorage.getItem('moniMinutesToken');
const setStoredToken = (token) => localStorage.setItem('moniMinutesToken', token);
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('moniMinutesUser') || 'null');
  } catch {
    return null;
  }
};

const api = async (url, options = {}) => {
  const token = getStoredToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

const formatMoney = (value, currency) => {
  const number = Number(value || 0);
  if (currency === 'USD') {
    return `$${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'NGN') {
    return `₦${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `${number.toLocaleString()}`;
};

const logout = () => {
  localStorage.removeItem('moniMinutesToken');
  localStorage.removeItem('moniMinutesUser');
  window.location.href = '/';
};

const redirectIfLoggedIn = () => {
  if ((page === '/' || page === '/login') && getStoredToken() && getStoredUser()) {
    window.location.href = '/dashboard';
  }
};

const setupAuth = () => {
  redirectIfLoggedIn();

  const loginToggle = document.getElementById('loginToggle');
  const registerToggle = document.getElementById('registerToggle');
  const authTitle = document.getElementById('authTitle');
  const authSubmit = document.getElementById('authSubmit');
  const registerFields = document.getElementById('registerFields');
  const authForm = document.getElementById('authForm');
  const resetRequestForm = document.getElementById('resetRequestForm');

  if (resetRequestForm) {
    resetRequestForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('resetEmail').value;
      try {
        const response = await fetch('/api/auth/password-reset-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to process request');
        alert(`Reset link generated: ${data.resetUrl}`);
      } catch (error) {
        alert(error.message);
      }
    });
  }

  if (!loginToggle || !registerToggle || !authForm) return;

  let mode = 'login';
  const setMode = (nextMode) => {
    mode = nextMode;
    const isRegister = mode === 'register';
    authTitle.textContent = isRegister ? 'Create account' : 'Sign in';
    authSubmit.textContent = isRegister ? 'Create account' : 'Login';
    registerFields.classList.toggle('hidden', !isRegister);
    loginToggle.classList.toggle('active', !isRegister);
    registerToggle.classList.toggle('active', isRegister);
  };

  loginToggle.addEventListener('click', () => setMode('login'));
  registerToggle.addEventListener('click', () => setMode('register'));

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
    };

    if (mode === 'register') {
      payload.firstName = document.getElementById('firstName').value;
      payload.lastName = document.getElementById('lastName').value;
    }

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setStoredToken(data.token);
      localStorage.setItem('moniMinutesUser', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      alert(error.message);
    }
  });
};

const renderMetrics = (metrics) => {
  const root = document.getElementById('metrics');
  if (!root) return;

  const cards = [
    { label: 'USD balance', value: formatMoney(metrics.totalBalanceUsd, 'USD'), tone: 'green' },
    { label: 'NGN balance', value: formatMoney(metrics.totalBalanceNgn, 'NGN'), tone: 'blue' },
    { label: 'Pending', value: metrics.pendingCount, tone: 'amber' },
    { label: 'Settled', value: metrics.settledCount, tone: 'green' },
    { label: 'Transactions', value: metrics.totalTransactions, tone: 'red' },
  ];

  root.innerHTML = cards.map((card) => `
    <div class="metric-card ${card.tone}">
      <span class="label">${card.label}</span>
      <div class="value">${card.value}</div>
      <div class="meta">Live values</div>
    </div>
  `).join('');
};

const renderAdminMetrics = (metrics, users) => {
  const root = document.getElementById('adminMetrics');
  if (!root) return;

  const cards = [
    { label: 'USD volume', value: formatMoney(metrics.totalBalanceUsd, 'USD'), tone: 'green' },
    { label: 'NGN volume', value: formatMoney(metrics.totalBalanceNgn, 'NGN'), tone: 'blue' },
    { label: 'Pending', value: metrics.pendingCount, tone: 'amber' },
    { label: 'Settled', value: metrics.settledCount, tone: 'green' },
    { label: 'Users', value: users ? users.length : 0, tone: 'red' },
  ];

  root.innerHTML = cards.map((card) => `
    <div class="metric-card ${card.tone}">
      <span class="label">${card.label}</span>
      <div class="value">${card.value}</div>
      <div class="meta">Admin summary</div>
    </div>
  `).join('');
};

const renderAccounts = (accounts) => {
  const root = document.getElementById('accountList');
  const senderSelect = document.getElementById('senderId');
  const receiverSelect = document.getElementById('receiverId');

  if (!root) return;

  root.innerHTML = accounts.map((account) => `
    <article class="account-item">
      <span class="title">${account.name}</span>
      <div class="small">${account.currency} · ${account.type}</div>
      <div class="balance">${formatMoney(account.balance, account.currency)}</div>
    </article>
  `).join('');

  if (senderSelect && receiverSelect) {
    senderSelect.innerHTML = accounts.map((account) => `
      <option value="${account.id}">${account.name} (${account.currency})</option>
    `).join('');

    receiverSelect.innerHTML = accounts.map((account) => `
      <option value="${account.id}">${account.name} (${account.currency})</option>
    `).join('');

    if (accounts.length > 1) {
      senderSelect.value = accounts[0].id;
      receiverSelect.value = accounts[1].id;
    }
  }
};

const renderTransactions = (transactions) => {
  const root = document.getElementById('transactionTable');
  if (!root) return;

  if (!transactions || !transactions.length) {
    root.innerHTML = '<div class="empty-state">No transactions available.</div>';
    return;
  }

  root.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Sender</th>
          <th>Receiver</th>
          <th>Amount</th>
          <th>Currency</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((row) => `
          <tr>
            <td>${row.id}</td>
            <td>${row.sender_name || row.sender_id}</td>
            <td>${row.receiver_name || row.receiver_id}</td>
            <td>${formatMoney(row.amount, row.currency)}</td>
            <td>${row.currency}</td>
            <td><span class="status-pill status-${row.status}">${row.status}</span></td>
            <td>
              ${row.status === 'pending' ? `
                <div class="action-row">
                  <button class="small-btn approve" data-action="approve" data-id="${row.id}">Approve</button>
                  <button class="small-btn reject" data-action="reject" data-id="${row.id}">Reject</button>
                </div>
              ` : '-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('[data-action="approve"]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/api/transactions/${button.dataset.id}/approve`, { method: 'POST' });
        await loadDashboard();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll('[data-action="reject"]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/api/transactions/${button.dataset.id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason: 'Rejected in dashboard' })
        });
        await loadDashboard();
      } catch (error) {
        alert(error.message);
      }
    });
  });
};

const renderUserBadge = async () => {
  const badge = document.getElementById('userBadge');
  if (!badge) return;

  try {
    const user = await api('/api/auth/me');
    localStorage.setItem('moniMinutesUser', JSON.stringify(user));
    badge.textContent = `${user.firstName} ${user.lastName} · ${user.role}`;
  } catch (error) {
    logout();
  }
};

const renderCharts = async () => {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas) return;

  try {
    const history = await api('/api/analytics/balance-history');
    const ctx = canvas.getContext('2d');
    const labels = history.map((item) => item.label);
    const values = history.map((item) => Number(item.value));

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Balance overview',
          data: values,
          backgroundColor: ['#4ac5ff', '#5a7cff', '#7c6cff', '#2ad6a3'],
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: false } }
      }
    });
  } catch (error) {
    console.error('Chart failed', error);
  }
};

const loadDashboard = async () => {
  try {
    const summary = await api('/api/dashboard');
    renderMetrics(summary.metrics);
    renderAccounts(summary.accounts);
    renderTransactions(summary.recentTransactions);
    await renderUserBadge();
    await renderCharts();
  } catch (error) {
    alert(error.message);
  }
};

const loadAdmin = async () => {
  try {
    const summary = await api('/api/admin/summary');
    renderAdminMetrics(summary.metrics, summary.users);
    renderTransactions(summary.recentTransactions);
    await renderUserBadge();
  } catch (error) {
    alert(error.message);
  }
};

const setupDashboard = async () => {
  const tokenValue = getStoredToken();
  if (!tokenValue) {
    window.location.href = '/';
    return;
  }

  const transferForm = document.getElementById('transferForm');
  if (transferForm) {
    try {
      const accounts = await api('/api/accounts');
      renderAccounts(accounts);
      transferForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
          senderId: document.getElementById('senderId').value,
          receiverId: document.getElementById('receiverId').value,
          currency: document.getElementById('currency').value,
          amount: document.getElementById('amount').value,
          description: document.getElementById('description').value,
        };

        try {
          await api('/api/transactions', { method: 'POST', body: JSON.stringify(payload) });
          transferForm.reset();
          await loadDashboard();
          alert('Transfer created and marked as pending.');
        } catch (error) {
          alert(error.message);
        }
      });
    } catch (error) {
      alert(error.message);
    }
  }

  if (document.getElementById('exportCsvBtn')) {
    document.getElementById('exportCsvBtn').addEventListener('click', async () => {
      window.location.href = '/api/transactions/export.csv';
    });
  }

  await loadDashboard();
};

const setupAdmin = async () => {
  const tokenValue = getStoredToken();
  if (!tokenValue) {
    window.location.href = '/';
    return;
  }

  try {
    const me = await api('/api/auth/me');
    if (me.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
  } catch (error) {
    logout();
    return;
  }

  await loadAdmin();
};

const setupResetPassword = () => {
  const form = document.getElementById('resetPasswordForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = document.getElementById('resetToken').value;
    const password = document.getElementById('newPassword').value;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');
      alert('Password reset successful. Redirecting to login.');
      window.location.href = '/';
    } catch (error) {
      alert(error.message);
    }
  });
};

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (event) => {
    event.preventDefault();
    logout();
  });
}

if (page === '/' || page === '/login') {
  setupAuth();
}

if (page === '/dashboard') {
  setupDashboard();
}

if (page === '/admin') {
  setupAdmin();
}

if (page === '/reset-password') {
  setupResetPassword();
}
