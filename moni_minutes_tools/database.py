"""SQLite database module for persisting accounts and transfers."""

import sqlite3
import os
from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Optional, Tuple

DB_PATH = os.path.expanduser("~/.moni_minutes/transfers.db")


def ensure_db_directory():
    """Create the database directory if it doesn't exist."""
    db_dir = os.path.dirname(DB_PATH)
    os.makedirs(db_dir, exist_ok=True)


def get_connection():
    """Get a database connection."""
    ensure_db_directory()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    """Create database schema if it doesn't exist."""
    ensure_db_directory()
    conn = get_connection()
    cursor = conn.cursor()

    # Create accounts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            account_id TEXT PRIMARY KEY,
            currency TEXT NOT NULL,
            balance TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Create transfers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transfers (
            transfer_id TEXT PRIMARY KEY,
            sender_account_id TEXT NOT NULL,
            receiver_account_id TEXT NOT NULL,
            currency TEXT NOT NULL,
            amount TEXT NOT NULL,
            status TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (sender_account_id) REFERENCES accounts(account_id),
            FOREIGN KEY (receiver_account_id) REFERENCES accounts(account_id)
        )
    """)

    # Create ledger table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event TEXT NOT NULL,
            transfer_id TEXT,
            sender_id TEXT,
            receiver_id TEXT,
            amount TEXT,
            currency TEXT,
            status TEXT,
            reason TEXT
        )
    """)

    conn.commit()
    conn.close()


def insert_account(account_id: str, currency: str, balance: str, owner_name: str, created_at: str):
    """Insert or update an account in the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO accounts (account_id, currency, balance, owner_name, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (account_id, currency, balance, owner_name, created_at))

    conn.commit()
    conn.close()


def get_account(account_id: str) -> Optional[Dict]:
    """Retrieve an account from the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts WHERE account_id = ?", (account_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def update_account_balance(account_id: str, balance: str):
    """Update an account balance in the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE accounts SET balance = ? WHERE account_id = ?
    """, (balance, account_id))

    conn.commit()
    conn.close()


def insert_transfer(transfer_id: str, sender_id: str, receiver_id: str, currency: str,
                   amount: str, status: str, description: str, created_at: str, updated_at: str):
    """Insert a transfer into the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO transfers (transfer_id, sender_account_id, receiver_account_id, currency,
                              amount, status, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (transfer_id, sender_id, receiver_id, currency, amount, status, description, created_at, updated_at))

    conn.commit()
    conn.close()


def get_transfer(transfer_id: str) -> Optional[Dict]:
    """Retrieve a transfer from the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM transfers WHERE transfer_id = ?", (transfer_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def update_transfer_status(transfer_id: str, status: str, updated_at: str):
    """Update a transfer status in the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE transfers SET status = ?, updated_at = ? WHERE transfer_id = ?
    """, (status, updated_at, transfer_id))

    conn.commit()
    conn.close()


def get_all_transfers() -> List[Dict]:
    """Get all transfers from the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM transfers ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_pending_transfers() -> List[Dict]:
    """Get all pending transfers."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM transfers WHERE status = 'pending' ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_receiver_pending_transfers(receiver_id: str) -> List[Dict]:
    """Get pending transfers for a specific receiver."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM transfers
        WHERE receiver_account_id = ? AND status = 'pending'
        ORDER BY created_at DESC
    """, (receiver_id,))
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def insert_ledger_entry(timestamp: str, event: str, transfer_id: Optional[str] = None,
                       sender_id: Optional[str] = None, receiver_id: Optional[str] = None,
                       amount: Optional[str] = None, currency: Optional[str] = None,
                       status: Optional[str] = None, reason: Optional[str] = None):
    """Insert a ledger entry into the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO ledger (timestamp, event, transfer_id, sender_id, receiver_id, amount, currency, status, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (timestamp, event, transfer_id, sender_id, receiver_id, amount, currency, status, reason))

    conn.commit()
    conn.close()


def get_ledger() -> List[Dict]:
    """Get all ledger entries."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM ledger ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def clear_all_data():
    """Clear all data from the database (for testing purposes)."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM ledger")
    cursor.execute("DELETE FROM transfers")
    cursor.execute("DELETE FROM accounts")

    conn.commit()
    conn.close()
