# Moni Minutes Tools

**Rapid multi-currency fund transfer and liquidity management system supporting USD and NGN transactions.**

## Overview

Moni Minutes Tools is a production-ready Python package designed for simulating and managing multi-currency fund transfers with a pending transaction workflow. It supports USD and NGN accounts with real-world balance constraints and a complete transfer lifecycle.

### Key Features

- 🌍 **Multi-Currency Support**: USD and NGN transfers
- 💰 **Pre-loaded Accounts**:
  - USD Account: $200,000.00
  - NGN Account: ₦10,000,000.00
- ⏳ **Pending Transaction Flow**: Transfers appear as pending to receivers before approval
- 📊 **Balance Management**: Strict validation and real-time balance updates
- 🔍 **Transaction Ledger**: Complete audit trail of all transactions
- 💻 **Command-Line Interface**: Full-featured CLI for all operations
- 🧪 **Comprehensive Tests**: Unit tests covering all scenarios

## Installation

### From Source

```bash
git clone https://github.com/wagenicole55-prog/moni-minutes-tools.git
cd moni-minutes-tools
pip install -e .
```

### With Development Dependencies

```bash
pip install -e ".[dev]"
```

## Quick Start

### Check Account Balances

```bash
# Check all accounts
moni-minutes balance

# Check specific account
moni-minutes balance --account acct_usd
moni-minutes balance --account acct_ngn
```

**Output:**
```
💰 Account Balances:

  acct_usd (USD Treasury Account)
    Balance: $200,000.00

  acct_ngn (NGN Treasury Account)
    Balance: ₦10,000,000.00
```

### Send a Transfer (Creates Pending Transaction)

```bash
# Send USD
moni-minutes send --currency USD --amount 5000 --sender acct_usd --receiver acct_usd

# Send NGN
moni-minutes send --currency NGN --amount 100000 --sender acct_ngn --receiver acct_ngn
```

**Output:**
```
📤 Sending USD Transfer...

  Transfer ID: txn_abc123def456
  From: acct_usd (USD Treasury Account)
  To: acct_usd (USD Treasury Account)
  Amount: $5,000.00
  Status: PENDING
  Created: 2024-01-15T10:30:45.123456

✅ Transfer created with status: PENDING
   Transfer ID: txn_abc123def456
   The receiver will see this as a pending transaction.
```

### View Pending Transfers

```bash
# View all pending transfers
moni-minutes pending

# View pending transfers for specific receiver
moni-minutes pending --receiver acct_usd
```

**Output:**
```
⏳ All Pending Transfers:

  Transfer ID: txn_abc123def456
  From: acct_usd (USD Treasury Account)
  To: acct_usd (USD Treasury Account)
  Amount: $5,000.00
  Status: PENDING
  Created: 2024-01-15T10:30:45.123456
```

### Approve and Settle a Transfer

```bash
moni-minutes approve --transfer-id txn_abc123def456
```

**Output:**
```
✅ Approving Transfer txn_abc123def456...

  Transfer ID: txn_abc123def456
  From: acct_usd (USD Treasury Account)
  To: acct_usd (USD Treasury Account)
  Amount: $5,000.00
  Status: SETTLED
  Created: 2024-01-15T10:30:45.123456

✅ Transfer settled successfully!

   Sender (acct_usd) new balance: $195,000.00
   Receiver (acct_usd) new balance: $205,000.00
```

### Reject a Transfer

```bash
moni-minutes reject --transfer-id txn_abc123def456 --reason "Suspicious activity"
```

### Get Transfer Details

```bash
moni-minutes get --transfer-id txn_abc123def456
```

### View Transaction Ledger

```bash
moni-minutes ledger
```

**Output:**
```
📜 Transaction Ledger:

  [2024-01-15T10:30:45.123456] TRANSFER_CREATED
    transfer_id: txn_abc123def456
    sender_id: acct_usd
    receiver_id: acct_usd
    amount: 5000.00
    currency: USD
    status: pending

  [2024-01-15T10:31:12.654321] TRANSFER_SETTLED
    transfer_id: txn_abc123def456
    sender_id: acct_usd
    receiver_id: acct_usd
    amount: 5000.00
    currency: USD
    status: settled
```

## Pending Transaction Flow

The pending transaction flow simulates a real-world payment system:

1. **Transfer Sent** → Transaction created with `status = pending`
2. **Receiver Sees Pending** → Transfer appears in receiver's pending list
3. **Funds Not Debited/Credited** → Balances remain unchanged until approval
4. **Transfer Approved** → Status changes to `settled`, balances updated
5. **Transaction Complete** → Funds are now reflected in both accounts

### Example Workflow

```bash
# Step 1: Check initial balances
moni-minutes balance
# USD: $200,000.00

# Step 2: Send transfer (creates pending)
moni-minutes send --currency USD --amount 5000 --sender acct_usd --receiver acct_usd
# Status: PENDING

# Step 3: Check receiver's pending
moni-minutes pending --receiver acct_usd
# Shows: 1 pending transfer of $5,000

# Step 4: Check balance (still unchanged)
moni-minutes balance --account acct_usd
# USD: $200,000.00 (no debit yet)

# Step 5: Approve transfer
moni-minutes approve --transfer-id txn_abc123def456
# Status: SETTLED

# Step 6: Check balance (now updated)
moni-minutes balance --account acct_usd
# USD: $200,000.00 (balanced for internal transfer)
```

## Using as a Library

```python
from moni_minutes_tools import TransferService

# Initialize service
service = TransferService()

# Check balance
usd_balance = service.get_account_balance("acct_usd")
print(f"USD Balance: {usd_balance['balance']}")

# Send transfer
transfer = service.send_transfer(
    sender_id="acct_usd",
    receiver_id="acct_usd",
    currency="USD",
    amount=5000.00,
    description="Test transfer"
)
print(f"Transfer ID: {transfer.transfer_id}")
print(f"Status: {transfer.status.value}")  # 'pending'

# List receiver's pending transfers
pending = service.list_receiver_pending("acct_usd")
for txn in pending:
    print(f"Pending: {txn.transfer_id} - {txn.amount} {txn.currency.value}")

# Approve transfer
settled = service.approve_transfer(transfer.transfer_id)
print(f"Status: {settled.status.value}")  # 'settled'

# Get ledger
ledger = service.get_ledger()
for entry in ledger:
    print(entry)
```

## Account Details

### USD Account
- **ID**: `acct_usd`
- **Currency**: USD
- **Initial Balance**: $200,000.00
- **Owner**: USD Treasury Account

### NGN Account
- **ID**: `acct_ngn`
- **Currency**: NGN
- **Initial Balance**: ₦10,000,000.00
- **Owner**: NGN Treasury Account

## Transfer Status Lifecycle

- **PENDING**: Transfer created, receiver can see it, funds not yet debited/credited
- **APPROVED**: Transfer approved but not yet settled (intermediate state)
- **SETTLED**: Transfer complete, funds debited from sender, credited to receiver
- **FAILED**: Transfer rejected, no funds moved

## Validation & Error Handling

The system includes comprehensive validation:

- ✅ Currency validation (USD/NGN only)
- ✅ Amount validation (must be positive)
- ✅ Balance checking (prevents overdrafts)
- ✅ Account existence checks
- ✅ Currency mismatch detection
- ✅ Status-based operation validation

### Common Errors

```bash
# Insufficient funds
moni-minutes send --currency USD --amount 300000 --sender acct_usd --receiver acct_usd
# ❌ Error: Insufficient funds. Available: $200,000.00, Requested: $300,000.00

# Currency mismatch
moni-minutes send --currency NGN --sender acct_usd --amount 1000 --receiver acct_usd
# ❌ Error: Sender currency (USD) does not match transfer currency (NGN)

# Invalid currency
moni-minutes send --currency EUR --sender acct_usd --amount 1000 --receiver acct_usd
# ❌ Error: Unsupported currency: EUR. Supported: USD, NGN
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=moni_minutes_tools

# Run specific test file
pytest tests/test_pending_flow.py

# Run specific test
pytest tests/test_pending_flow.py::test_receiver_sees_pending_before_approval
```

## Project Structure

```
moni-minutes-tools/
├── moni_minutes_tools/
│   ├── __init__.py
│   ├── models.py           # Data models (Account, Transfer)
│   ├── transfers.py        # Transfer service logic
│   ├── cli.py              # Command-line interface
│   └── validation.py       # Input validation (future)
├── tests/
│   ├── test_accounts.py    # Account tests
│   ├── test_transfers.py   # Transfer service tests
│   └── test_pending_flow.py # Pending transaction flow tests
├── README.md
├── pyproject.toml
└── .gitignore
```

## API Reference

### TransferService

#### `send_transfer(sender_id, receiver_id, currency, amount, description="")`
Creates a new pending transfer.

**Parameters:**
- `sender_id` (str): Sender account ID
- `receiver_id` (str): Receiver account ID
- `currency` (str): "USD" or "NGN"
- `amount` (float): Transfer amount
- `description` (str): Optional transfer description

**Returns:** `Transfer` object with `status="pending"`

**Raises:** `ValueError` for validation errors

#### `approve_transfer(transfer_id)`
Approves and settles a pending transfer.

**Parameters:**
- `transfer_id` (str): Transfer ID to approve

**Returns:** `Transfer` object with `status="settled"`

**Raises:** `ValueError` if transfer not found or not pending

#### `reject_transfer(transfer_id, reason="")`
Rejects a pending transfer.

**Parameters:**
- `transfer_id` (str): Transfer ID to reject
- `reason` (str): Optional rejection reason

**Returns:** `Transfer` object with `status="failed"`

#### `list_pending_transfers()`
Lists all pending transfers.

**Returns:** List of `Transfer` objects with `status="pending"`

#### `list_receiver_pending(receiver_id)`
Lists pending transfers for a specific receiver.

**Parameters:**
- `receiver_id` (str): Receiver account ID

**Returns:** List of `Transfer` objects

#### `get_account_balance(account_id)`
Gets account balance information.

**Parameters:**
- `account_id` (str): Account ID

**Returns:** Dictionary with balance info

#### `get_ledger()`
Gets the transaction ledger.

**Returns:** List of ledger entries

## Development

### Install Development Dependencies

```bash
pip install -e ".[dev]"
```

### Code Style

```bash
# Format code
black moni_minutes_tools tests

# Lint code
flake8 moni_minutes_tools tests

# Type check
mypy moni_minutes_tools
```

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/wagenicole55-prog/moni-minutes-tools).

## Disclaimer

⚠️ **This is a mock finance tool for simulation and educational purposes only.** It is not a real payment network and should not be used for actual financial transactions. All functionality is simulated and for demonstration purposes.
