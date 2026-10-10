const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
  getAdminSummary,
  getUserTransactions,
  getAccountById,
  getUsers,
  seedData,
  createPasswordResetToken,
  getPasswordResetToken,
  clearPasswordResetToken,
  updateUserPassword,
  getUserByResetToken,
  getRolePermissions,
  getAccountBalanceForUser,
  getTransactionsCSV,
  getBalanceHistory,
  getTransactionSummary,
  setUserRole,
  getUserRole,
  getUserProfile,
  createAuditLog,
  getAuditLogs
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'moni-minutes-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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

function requirePermission(permission) {
  return (req, res, next) => {
    const rolePermissions = getRolePermissions(req.user.role);
    if (!rolePermissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied.' });
    }
    next();
  };
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

    await createAuditLog({ userId: user.id, action: 'user_registered', details: 'New user registered' });

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

    await createAuditLog({ userId: user.id, action: 'user_login', details: 'User logged in' });

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

app.post('/api/auth/password-reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No user found for this email.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await createPasswordResetToken({ userId: user.id, token, expiresAt });

    return res.json({
      message: 'Password reset token created.',
      resetUrl: `${FRONTEND_URL}/reset-password?token=${token}`,
      token
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const resetRequest = await getPasswordResetToken(token);
    if (!resetRequest || new Date(resetRequest.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const user = await getUserByResetToken(token);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUserPassword(user.id, hashedPassword);
    await clearPasswordResetToken(token);

    await createAuditLog({ userId: user.id, action: 'password_reset', details: 'Password reset completed' });

    res.json({ message: 'Password reset successful.' });
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

app.get('/api/accounts/:id/balance', requireAuth, async (req, res) => {
  try {
    const account = await getAccountBalanceForUser(req.user.userId, req.params.id, req.user.role);
    res.json(account);
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

app.get('/api/analytics/balance-history', requireAuth, async (req, res) => {
  try {
    const history = await getBalanceHistory(req.user.userId, req.user.role);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/summary', requireAuth, async (req, res) => {
  try {
    const summary = await getTransactionSummary(req.user.userId, req.user.role);
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

app.get('/api/transactions/export.csv', requireAuth, async (req, res) => {
  try {
    const csv = await getTransactionsCSV(req.user.userId, req.user.role);
    res.header('Content-Type', 'text/csv');
    res.attachment('moni_minutes_transactions.csv');
    res.send(csv);
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

    await createAuditLog({ userId: req.user.userId, action: 'transaction_created', details: `Pending transfer ${transaction.id} created` });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transactions/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const transaction = await approveTransaction(req.params.id);
    await createAuditLog({ userId: req.user.userId, action: 'transaction_approved', details: `Approved transfer ${transaction.id}` });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/transactions/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reason = req.body.reason || 'Rejected by admin';
    const transaction = await rejectTransaction(req.params.id, reason);
    await createAuditLog({ userId: req.user.userId, action: 'transaction_rejected', details: `Rejected transfer ${transaction.id}: ${reason}` });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users', requireAuth, requirePermission('view_users'), async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/users/:id/role', requireAuth, requirePermission('manage_roles'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required: user or admin.' });
    }

    const updatedUser = await setUserRole(req.params.id, role);
    await createAuditLog({ userId: req.user.userId, action: 'role_updated', details: `Updated user ${req.params.id} to role ${role}` });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/audit-logs', requireAuth, requirePermission('view_audit_logs'), async (req, res) => {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  const pageMap = {
    '/': 'index.html',
    '/login': 'index.html',
    '/reset-password': 'reset-password.html',
    '/dashboard': 'dashboard.html',
    '/admin': 'admin.html',
  };

  const file = pageMap[req.path] || 'index.html';
  res.sendFile(path.join(__dirname, 'public', file));
});

app.listen(PORT, () => {
  console.log(`Moni Minutes app running on http://localhost:${PORT}`);
});
