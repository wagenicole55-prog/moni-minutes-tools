"""Data models for accounts and transfers."""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum


class Currency(str, Enum):
    """Supported currencies."""
    USD = "USD"
    NGN = "NGN"


class TransferStatus(str, Enum):
    """Transfer status lifecycle."""
    PENDING = "pending"
    APPROVED = "approved"
    SETTLED = "settled"
    FAILED = "failed"


@dataclass
class Account:
    """Represents a user account with currency and balance."""
    account_id: str
    currency: Currency
    balance: Decimal
    owner_name: str = "Account Owner"
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        """Validate account data."""
        if isinstance(self.currency, str):
            self.currency = Currency(self.currency)
        if not isinstance(self.balance, Decimal):
            self.balance = Decimal(str(self.balance))
        if self.balance < 0:
            raise ValueError("Balance cannot be negative")

    def can_transfer(self, amount: Decimal) -> bool:
        """Check if account has sufficient balance."""
        return self.balance >= amount

    def withdraw(self, amount: Decimal) -> None:
        """Withdraw from account."""
        if not self.can_transfer(amount):
            raise ValueError(f"Insufficient balance. Available: {self.balance}")
        self.balance -= amount

    def deposit(self, amount: Decimal) -> None:
        """Deposit to account."""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.balance += amount


@dataclass
class Transfer:
    """Represents a fund transfer between accounts."""
    transfer_id: str
    sender_account_id: str
    receiver_account_id: str
    currency: Currency
    amount: Decimal
    status: TransferStatus = TransferStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    description: str = ""

    def __post_init__(self):
        """Validate transfer data."""
        if isinstance(self.currency, str):
            self.currency = Currency(self.currency)
        if isinstance(self.status, str):
            self.status = TransferStatus(self.status)
        if not isinstance(self.amount, Decimal):
            self.amount = Decimal(str(self.amount))
        if self.amount <= 0:
            raise ValueError("Transfer amount must be positive")

    def is_pending(self) -> bool:
        """Check if transfer is pending."""
        return self.status == TransferStatus.PENDING

    def is_settled(self) -> bool:
        """Check if transfer is settled."""
        return self.status == TransferStatus.SETTLED

    def to_dict(self) -> dict:
        """Convert transfer to dictionary."""
        return {
            "transfer_id": self.transfer_id,
            "sender_account_id": self.sender_account_id,
            "receiver_account_id": self.receiver_account_id,
            "currency": self.currency.value,
            "amount": str(self.amount),
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "description": self.description,
        }
