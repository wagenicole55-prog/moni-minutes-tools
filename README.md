const metricsRoot = document.getElementById('metrics');
const accountList = document.getElementById('accountList');
const transactionTable = document.getElementById('transactionTable');
const transferForm = document.getElementById('transferForm');
const senderIdSelect = document.getElementById('senderId');
const receiverIdSelect = document.getElementById('receiverId');
const currencySelect = document.getElementById('currency');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');

const formatMoney = (value, currency) => {
  const number = Number(value || 0);
  if (currency === 'USD') return `$${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'NGN') return `₦${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `${number.toLocaleString()}`;
};

const renderMetrics = (summary) => {
  const { totalBalanceUsd, totalBalanceNgn, pendingCount, settledCount, failedCount, totalTransactions } = summary.metrics;

  const cards = [
    { label: 'USD balance', value: formatMoney(totalBalanceUsd, 'USD'), meta: 'Total in USD', tone: 'green' },
    { label: 'NGN balance', value: formatMoney(totalBalanceNgn, 'NGN'), meta: 'Total in NGN', tone: 'blue' },
    { label: 'Pending', value: pendingCount, meta: 'Awaiting approval', tone: 'amber' },
    { label: 'Settled', value: settledCount, meta: 'Completed transfers', tone: 'green' },
    { label: 'Failed', value: failedCount, meta: 'Rejected movement', tone: 'red' }
  ];

  metricsRoot.innerHTML = cards.map((card) => `
    <div class="card ${card.tone}">
      <span class="label">${card.label}</span>
      <div class="value">${card.value}</div>
      <div class="meta">${card.meta}</div>
    </div>
  `).join('');

  const totalCard = document.createElement('div');
  totalCard.className = 'card';
  totalCard.innerHTML = `
    <span class="label">Transactions</span>
    <div class="value">${totalTransactions}</div>
    <div class="meta">Logged in database</div>
  `;
  metricsRoot.appendChild(totalCard);
};

const renderAccounts = (accounts) => {
  accountList.innerHTML = accounts.map((account) => `
    <article class="account-item">
      <span class="name">${account.name}</span>
      <div class="meta">${account.currency} · ${account.id}</div>
      <div class="balance">${formatMoney(account.balance, account.currency)}</div>
    </article>
  `).join('');

  const options = accounts.map((account) => `<option value="${account.id}">${account.name} (${account.currency})</option>`).join('');
  senderIdSelect.innerHTML = options;
  receiverIdSelect.innerHTML = options;

  if (accounts.length > 1) {
    senderIdSelect.value = accounts[0].id;
    receiverIdSelect.value = accounts[1].id;
  }
};

const renderTransactions = (transactions) => {
  if (!transactions.length) {
    transactionTable.innerHTML = '<div class="empty-state">No transactions available.</div>';
    return;
  }

  const rows = transactions.map((row) => {
    const statusClass = `status-${row.status}`;
    const statusLabel = row.status.toUpperCase();

    const actionButtons = row.status === 'pending'
      ? `
        <button class="btn-inline approve" data-action="approve" data-id="${row.id}">Approve</button>
        <button class="btn-inline reject" data-action="reject" data-id="${row.id}">Reject</button>
      `
      : '<span class="status-pill status-settled">Closed</span>';

    return `
      <tr>
        <td>${row.id}</td>
        <td>${row.sender_name}</td>
        <td>${row.receiver_name}</td>
        <td>${formatMoney(row.amount, row.currency)}</td>
        <td>${row.currency}</td>
        <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
        <td>${actionButtons}</td>
      </tr>
    `;
  }).join('');

  transactionTable.innerHTML = `
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
      <tbody>${rows}</tbody>
    </table>
  `;

  document.querySelectorAll('[data-action="approve"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await fetch(`/api/transactions/${id}/approve`, { method: 'POST' });
      await loadDashboard();
    });
  });

  document.querySelectorAll('[data-action="reject"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await fetch(`/api/transactions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected from dashboard' })
      });
      await loadDashboard();
    });
  });
};

const loadDashboard = async () => {
  const response = await fetch('/api/dashboard');
  const summary = await response.json();
  renderMetrics(summary);
  renderAccounts(summary.accounts);
  renderTransactions(summary.recentTransactions);
};

transferForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    senderId: senderIdSelect.value,
    receiverId: receiverIdSelect.value,
    currency: currencySelect.value,
    amount: amountInput.value,
    description: descriptionInput.value.trim()
  };

  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.error || 'Transfer failed');
    return;
  }

  transferForm.reset();
  await loadDashboard();
  alert('Transfer created successfully with pending status.');
});

document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
document.getElementById('toggleFormBtn').addEventListener('click', () => {
  transferForm.classList.toggle('hidden');
});

loadDashboard();
