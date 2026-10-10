const token = localStorage.getItem('moniMinutesToken');
const page = window.location.pathname;

const api = async (url, options = {}) => {
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

const setAuthState = (user) => {
  if (user && user.id) {
    localStorage.setItem('moniMinutesUser', JSON.stringify(user));
  }
};

const redirectIfLoggedIn = () => {
  if (page === '/' || page === '/login') {
    const user = localStorage.getItem('moniMinutesUser');
    const savedToken = localStorage.getItem('moniMinutesToken');
    if (savedToken && user) {
      window.location.href = '/dashboard';
    }
  }
};

const logout = () => {
  localStorage.removeItem('moniMinutesToken');
  localStorage.removeItem('moniMinutesUser');
  window.location.href = '/';
};

const setupAuth = () => {
  redirectIfLoggedIn();

  const loginToggle = document.getElementById('loginToggle');
  const registerToggle = document.getElementById('registerToggle');
  const authTitle = document.getElementById('authTitle');
  const authSubmit = document.getElementById('authSubmit');
  const registerFields = document.getElementById('registerFields');
  const authForm = document.getElementById('authForm');

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
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await result.json();
      if (!result.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('moniMinutesToken', data.token);
      setAuthState(data.user);
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

const renderAdminMetrics = (metrics) => {
  const root = document.getElementById('adminMetrics');
  if (!root) return;

  const cards = [
    { label: 'USD volume', value: formatMoney(metrics.totalBalanceUsd, 'USD'), tone: 'green' },
    { label: 'NGN volume', value: formatMoney(metrics.totalBalanceNgn, 'NGN'), tone: 'blue' },
    { label: 'Pending', value: metrics.pendingCount, tone: 'amber' },
    { label: 'Settled', value: metrics.settledCount, tone: 'green' },
    { label: 'Users', value: metrics.users ? metrics.users.length : 0, tone: 'red' },
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

const renderUser = async () => {
  const badge = document.getElementById('userBadge');
  if (!badge) return;

  try {
    const user = await api('/api/auth/me');
    setAuthState(user);
    badge.textContent = `${user.firstName} ${user.lastName} · ${user.role}`;
  } catch (error) {
    logout();
  }
};

const loadDashboard = async () => {
  try {
    const summary = await api('/api/dashboard');
    renderMetrics(summary.metrics);
    renderAccounts(summary.accounts);
    renderTransactions(summary.recentTransactions);
    await renderUser();
  } catch (error) {
    alert(error.message);
  }
};

const loadAdmin = async () => {
  try {
    const summary = await api('/api/admin/summary');
    renderAdminMetrics(summary.metrics);
    renderTransactions(summary.recentTransactions);
    await renderUser();
  } catch (error) {
    alert(error.message);
  }
};

const setupDashboard = async () => {
  const tokenValue = localStorage.getItem('moniMinutesToken');
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
          document.getElementById('transferForm').reset();
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

  await loadDashboard();
};

const setupAdmin = async () => {
  const tokenValue = localStorage.getItem('moniMinutesToken');
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

if (page === '/' || page === '/login') {
  const storedUser = localStorage.getItem('moniMinutesUser');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role === 'admin') {
        document.getElementById('authTitle').textContent = 'Welcome admin';
      }
    } catch (error) {}
  }
}
