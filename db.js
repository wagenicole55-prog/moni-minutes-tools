const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  initializeDatabase,
  getUserByEmail,
  createUser,
  getUserById,
  getAccountsForUser,
  getUserDashboard,
  getAllTransactionsForAdmin,
  createTransaction,
  approveTransaction,
  rejectTransaction,
  getUserByIdWithRoles,
  getAdminSummary,
  getUserTransactions,
  getAccountById,
  getAccountBalanceByUser,
  getUsers,
  seedData
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'moni-minutes-secret-key';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

initializeDatabase();
seedData();

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Moni Minutes API' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'user'
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts', requireAuth, async (req, res) => {
  try {
    const accounts = await getAccountsForUser(req.user.userId, req.user.role);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const summary = await getUserDashboard(req.user.userId, req.user.role);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/summary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const summary = await getAdminSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/transactions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const transactions = await getAllTransactionsForAdmin();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const rows = req.user.role === 'admin'
      ? await getAllTransactionsForAdmin()
      : await getUserTransactions(req.user.userId);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { senderId, receiverId, currency, amount, description } = req.body;

    if (!senderId || !receiverId || !currency || amount === undefined) {
      return res.status(400).json({ error: 'senderId, receiverId, currency, and amount are required.' });
    }

    const sender = await getAccountById(senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender account not found.' });
    }

    const receiver = await getAccountById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver account not found.' });
    }

    if (req.user.role !== 'admin' && sender.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only transfer from your own account.' });
    }

    const transaction = await createTransaction({
      senderId,
      receiverId,
      currency,
      amount,
      description,
      userId: req.user.userId
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transactions/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const transaction = await approveTransaction(req.params.id);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transactions/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reason = req.body.reason || 'Rejected by admin';
    const transaction = await rejectTransaction(req.params.id, reason);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  const pageMap = {
    '/': 'index.html',
    '/login': 'index.html',
    '/dashboard': 'dashboard.html',
    '/admin': 'admin.html',
  };

  const file = pageMap[req.path] || 'index.html';
  res.sendFile(path.join(__dirname, 'public', file));
});

app.listen(PORT, () => {
  console.log(`Moni Minutes app running on http://localhost:${PORT}`);
});
