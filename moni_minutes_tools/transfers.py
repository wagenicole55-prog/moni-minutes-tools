"""Transfer service for managing fund transfers between accounts."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional

from moni_minutes_tools.models import Account, Currency, Transfer, TransferStatus


class TransferService:
    """Service for handling transfers between accounts."""

    def __init__(self):
        """Initialize transfer service with default accounts."""
        self.accounts: Dict[str, Account] = self._init_default_accounts()
        self.transfers: Dict[str, Transfer] = {}
        self.ledger: List[Dict] = []

    @staticmethod
    def _init_default_accounts() -> Dict[str, Account]:
        """Initialize default USD and NGN accounts."""
        return {
            "acct_usd": Account(
                account_id="acct_usd",
                currency=Currency.USD,
                balance=Decimal("200000.00"),
                owner_name="USD Treasury Account",
            ),
            "acct_ngn": Account(
                account_id="acct_ngn",
                currency=Currency.NGN,
                balance=Decimal("10000000.00"),
                owner_name="NGN Treasury Account",
            ),
        }

    def get_account(self, account_id: str) -> Optional[Account]:
        """Retrieve an account by ID."""
        return self.accounts.get(account_id)

    def get_account_balance(self, account_id: str) -> Dict[str, str]:
        """Get balance for an account."""
        account = self.get_account(account_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")
        return {
            "account_id": account.account_id,
            "owner_name": account.owner_name,
            "currency": account.currency.value,
            "balance": str(account.balance),
        }

    def send_transfer(
        self,
        sender_id: str,
        receiver_id: str,
        currency: str,
        amount: float,
        description: str = "",
    ) -> Transfer:
        """Send a transfer from one account to another.

        Args:
            sender_id: ID of the sending account
            receiver_id: ID of the receiving account
            currency: Currency code (USD or NGN)
            amount: Amount to transfer
            description: Optional transfer description

        Returns:
            Created Transfer object with status=pending

        Raises:
            ValueError: If validation fails
        """
        # Validate accounts
        sender = self.get_account(sender_id)
        if not sender:
            raise ValueError(f"Sender account {sender_id} not found")

        receiver = self.get_account(receiver_id)
        if not receiver:
            raise ValueError(f"Receiver account {receiver_id} not found")

        # Validate currency
        try:
            currency_enum = Currency(currency.upper())
        except ValueError:
            raise ValueError(f"Unsupported currency: {currency}. Supported: USD, NGN")

        # Validate amount
        amount_decimal = Decimal(str(amount))
        if amount_decimal <= 0:
            raise ValueError("Transfer amount must be greater than zero")

        # Check sender has correct currency
        if sender.currency != currency_enum:
            raise ValueError(
                f"Sender currency ({sender.currency.value}) does not match transfer currency ({currency})"
            )

        # Check receiver has correct currency
        if receiver.currency != currency_enum:
            raise ValueError(
                f"Receiver currency ({receiver.currency.value}) does not match transfer currency ({currency})"
            )

        # Check balance
        if not sender.can_transfer(amount_decimal):
            raise ValueError(
                f"Insufficient funds. Available: {sender.balance} {currency}, Requested: {amount_decimal}"
            )

        # Create transfer with pending status
        transfer_id = f"txn_{uuid.uuid4().hex[:12]}"
        transfer = Transfer(
            transfer_id=transfer_id,
            sender_account_id=sender_id,
            receiver_account_id=receiver_id,
            currency=currency_enum,
            amount=amount_decimal,
            status=TransferStatus.PENDING,
            description=description,
        )

        self.transfers[transfer_id] = transfer

        # Record in ledger
        self.ledger.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "event": "transfer_created",
                "transfer_id": transfer_id,
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "amount": str(amount_decimal),
                "currency": currency,
                "status": "pending",
            }
        )

        return transfer

    def get_transfer(self, transfer_id: str) -> Optional[Transfer]:
        """Retrieve a transfer by ID."""
        return self.transfers.get(transfer_id)

    def list_pending_transfers(self) -> List[Transfer]:
        """List all pending transfers."""
        return [
            t for t in self.transfers.values() if t.status == TransferStatus.PENDING
        ]

    def list_receiver_pending(self, receiver_id: str) -> List[Transfer]:
        """List all pending transfers for a receiver."""
        return [
            t
            for t in self.transfers.values()
            if t.receiver_account_id == receiver_id and t.status == TransferStatus.PENDING
        ]

    def approve_transfer(self, transfer_id: str) -> Transfer:
        """Approve and settle a pending transfer.

        Args:
            transfer_id: ID of the transfer to approve

        Returns:
            Updated Transfer object with status=settled

        Raises:
            ValueError: If transfer not found or not pending
        """
        transfer = self.get_transfer(transfer_id)
        if not transfer:
            raise ValueError(f"Transfer {transfer_id} not found")

        if not transfer.is_pending():
            raise ValueError(
                f"Transfer {transfer_id} is already {transfer.status.value}, cannot approve"
            )

        sender = self.get_account(transfer.sender_account_id)
        receiver = self.get_account(transfer.receiver_account_id)

        # Perform the actual transfer
        sender.withdraw(transfer.amount)
        receiver.deposit(transfer.amount)

        # Update transfer status
        transfer.status = TransferStatus.SETTLED
        transfer.updated_at = datetime.utcnow()

        # Record in ledger
        self.ledger.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "event": "transfer_settled",
                "transfer_id": transfer_id,
                "sender_id": transfer.sender_account_id,
                "receiver_id": transfer.receiver_account_id,
                "amount": str(transfer.amount),
                "currency": transfer.currency.value,
                "status": "settled",
            }
        )

        return transfer

    def reject_transfer(self, transfer_id: str, reason: str = "") -> Transfer:
        """Reject a pending transfer.

        Args:
            transfer_id: ID of the transfer to reject
            reason: Optional rejection reason

        Returns:
            Updated Transfer object with status=failed
        """
        transfer = self.get_transfer(transfer_id)
        if not transfer:
            raise ValueError(f"Transfer {transfer_id} not found")

        if not transfer.is_pending():
            raise ValueError(
                f"Transfer {transfer_id} is already {transfer.status.value}, cannot reject"
            )

        transfer.status = TransferStatus.FAILED
        transfer.updated_at = datetime.utcnow()
        if reason:
            transfer.description = f"Rejected: {reason}"

        self.ledger.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "event": "transfer_rejected",
                "transfer_id": transfer_id,
                "reason": reason,
                "status": "failed",
            }
        )

        return transfer

    def get_ledger(self) -> List[Dict]:
        """Get the transaction ledger."""
        return self.ledger
