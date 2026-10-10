"""Tests for transfer service and transfer operations."""

import pytest
from decimal import Decimal

from moni_minutes_tools.models import Currency, TransferStatus
from moni_minutes_tools.transfers import TransferService


@pytest.fixture
def service():
    """Create a fresh transfer service for each test."""
    return TransferService()


def test_service_initialization(service):
    """Test that service initializes with correct accounts."""
    assert len(service.accounts) == 2
    assert "acct_usd" in service.accounts
    assert "acct_ngn" in service.accounts


def test_usd_account_balance(service):
    """Test USD account starts with $200,000."""
    balance_info = service.get_account_balance("acct_usd")
    assert Decimal(balance_info["balance"]) == Decimal("200000.00")
    assert balance_info["currency"] == "USD"


def test_ngn_account_balance(service):
    """Test NGN account starts with ₦10,000,000."""
    balance_info = service.get_account_balance("acct_ngn")
    assert Decimal(balance_info["balance"]) == Decimal("10000000.00")
    assert balance_info["currency"] == "NGN"


def test_send_usd_transfer(service):
    """Test sending a USD transfer creates pending transaction."""
    transfer = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=5000.00,
    )
    assert transfer.status == TransferStatus.PENDING
    assert transfer.amount == Decimal("5000.00")
    assert transfer.currency == Currency.USD
    assert transfer.sender_account_id == "acct_usd"


def test_send_ngn_transfer(service):
    """Test sending a NGN transfer creates pending transaction."""
    transfer = service.send_transfer(
        sender_id="acct_ngn",
        receiver_id="acct_ngn",
        currency="NGN",
        amount=100000.00,
    )
    assert transfer.status == TransferStatus.PENDING
    assert transfer.amount == Decimal("100000.00")
    assert transfer.currency == Currency.NGN


def test_send_transfer_insufficient_balance(service):
    """Test transfer with insufficient balance raises error."""
    with pytest.raises(ValueError, match="Insufficient funds"):
        service.send_transfer(
            sender_id="acct_usd",
            receiver_id="acct_usd",
            currency="USD",
            amount=300000.00,  # More than $200,000
        )


def test_send_transfer_invalid_currency(service):
    """Test transfer with invalid currency raises error."""
    with pytest.raises(ValueError, match="Unsupported currency"):
        service.send_transfer(
            sender_id="acct_usd",
            receiver_id="acct_usd",
            currency="EUR",
            amount=1000.00,
        )


def test_send_transfer_invalid_sender(service):
    """Test transfer from non-existent account raises error."""
    with pytest.raises(ValueError, match="not found"):
        service.send_transfer(
            sender_id="invalid_account",
            receiver_id="acct_usd",
            currency="USD",
            amount=1000.00,
        )


def test_send_transfer_currency_mismatch(service):
    """Test transfer with mismatched currency raises error."""
    with pytest.raises(ValueError, match="does not match"):
        service.send_transfer(
            sender_id="acct_usd",
            receiver_id="acct_usd",
            currency="NGN",
            amount=1000.00,
        )


def test_send_transfer_negative_amount(service):
    """Test transfer with negative amount raises error."""
    with pytest.raises(ValueError, match="must be greater than zero"):
        service.send_transfer(
            sender_id="acct_usd",
            receiver_id="acct_usd",
            currency="USD",
            amount=-1000.00,
        )


def test_approve_transfer(service):
    """Test approving a pending transfer settles it and updates balances."""
    # Send transfer
    transfer = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=5000.00,
    )

    # Get initial balances
    sender_before = service.get_account("acct_usd").balance

    # Approve transfer
    approved = service.approve_transfer(transfer.transfer_id)

    assert approved.status == TransferStatus.SETTLED


def test_approve_transfer_not_found(service):
    """Test approving non-existent transfer raises error."""
    with pytest.raises(ValueError, match="not found"):
        service.approve_transfer("invalid_txn_id")


def test_reject_transfer(service):
    """Test rejecting a pending transfer."""
    # Send transfer
    transfer = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=5000.00,
    )

    # Reject transfer
    rejected = service.reject_transfer(transfer.transfer_id, "User requested cancellation")

    assert rejected.status == TransferStatus.FAILED


def test_list_pending_transfers(service):
    """Test listing pending transfers."""
    # Send multiple transfers
    transfer1 = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=5000.00,
    )
    transfer2 = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=3000.00,
    )

    pending = service.list_pending_transfers()
    assert len(pending) == 2
    assert transfer1 in pending
    assert transfer2 in pending


def test_ledger_records_events(service):
    """Test that ledger records transfer events."""
    # Send transfer
    service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=5000.00,
    )

    ledger = service.get_ledger()
    assert len(ledger) >= 1
    assert ledger[0]["event"] == "transfer_created"
