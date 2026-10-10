const express = require('express');
const path = require('path');
const { initializeDatabase, getAccounts, getDashboardSummary, getTransactions, createTransaction, approveTransaction, rejectTransaction } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

initializeDatabase();

app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const summary = await getDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await getTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { senderId, receiverId, currency, amount, description } = req.body;

    if (!senderId || !receiverId || !currency || amount === undefined) {
      return res.status(400).json({ error: 'senderId, receiverId, currency, and amount are required.' });
    }

    const transaction = await createTransaction({ senderId, receiverId, currency, amount, description });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transactions/:id/approve', async (req, res) => {
  try {
    const transaction = await approveTransaction(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transactions/:id/reject', async (req, res) => {
  try {
    const transaction = await rejectTransaction(req.params.id, req.body.reason || 'Rejected by admin');
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Moni Minutes API running on http://localhost:${PORT}`);
});
