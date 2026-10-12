import sqlite3 from 'sqlite3';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database at:', config.dbPath);
  }
});

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Accounts table
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id TEXT UNIQUE NOT NULL,
      currency TEXT NOT NULL,
      balance TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Transfers table
  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id TEXT UNIQUE NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      currency TEXT NOT NULL,
      amount TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  // Ledger table
  db.run(`
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      event TEXT NOT NULL,
      transfer_id TEXT,
      user_id INTEGER,
      amount TEXT,
      currency TEXT,
      status TEXT,
      reason TEXT
    )
  `);

  // Seed demo data
  const adminEmail = 'admin@moniminutes.local';
  const userEmail = 'demo@moniminutes.local';

  db.get('SELECT email FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      // Hash passwords (in production, use bcrypt)
      const hashedAdminPass = 'Admin@12345'; // In production, use bcrypt
      const hashedUserPass = 'Demo@12345';

      db.run(
        'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
        [adminEmail, hashedAdminPass, 'Admin User', 'admin']
      );

      db.run(
        'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
        [userEmail, hashedUserPass, 'Demo User', 'user'],
        function() {
          // Insert demo accounts
          db.run(
            'INSERT INTO accounts (user_id, account_id, currency, balance) VALUES (?, ?, ?, ?)',
            [2, 'acct_user_usd', 'USD', '50000.00']
          );

          db.run(
            'INSERT INTO accounts (user_id, account_id, currency, balance) VALUES (?, ?, ?, ?)',
            [2, 'acct_user_ngn', 'NGN', '2500000.00']
          );
        }
      );
    }
  });
});

export default db;
