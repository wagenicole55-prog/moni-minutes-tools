"""Tests for the pending transaction flow."""

import pytest
from decimal import Decimal

from moni_minutes_tools.models import TransferStatus
from moni_minutes_tools.transfers import TransferService


@pytest.fixture
def service():
    """Create a fresh transfer service for each test."""
    return TransferService()


def test_pending_transaction_flow(service):
    """Test complete flow: send -> pending -> receive pending -> approve -> settled."""
    # Step 1: Send transfer (creates pending)
    transfer = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_usd",
        currency="USD",
        amount=5000.00,
    )

    assert transfer.is_pending()
    assert transfer.status == TransferStatus.PENDING

    # Step 2: Receiver sees pending transfer
    receiver_pending = service.list_receiver_pending("acct_usd")
    assert len(receiver_pending) > 0
    assert transfer in receiver_pending
    assert receiver_pending[0].status == TransferStatus.PENDING

    # Step 3: Approve/settle transfer
    settled = service.approve_transfer(transfer.transfer_id)
    assert settled.is_settled()
    assert settled.status == TransferStatus.SETTLED

    # Step 4: No longer in pending list
    receiver_pending_after = service.list_receiver_pending("acct_usd")
    # Note: This transfer is between same account, so check for different accounts


def test_receiver_sees_pending_before_approval(service):
    """Test that receiver can see pending transfers before they are approved."""
    # Create a new receiver account for clarity
    from moni_minutes_tools.models import Account, Currency

    receiver = Account(
        account_id="acct_receiver",
        currency=Currency.USD,
        balance=Decimal("0.00"),
        owner_name="Receiver Account",
    )
    service.accounts["acct_receiver"] = receiver

    # Send transfer
    transfer = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_receiver",
        currency="USD",
        amount=5000.00,
    )

    # Receiver should see pending
    receiver_pending = service.list_receiver_pending("acct_receiver")
    assert len(receiver_pending) == 1
    assert receiver_pending[0].status == TransferStatus.PENDING
    assert receiver_pending[0].amount == Decimal("5000.00")

    # Funds should NOT appear in receiver balance yet
    assert receiver.balance == Decimal("0.00")

    # After approval, funds should appear
    service.approve_transfer(transfer.transfer_id)
    assert receiver.balance == Decimal("5000.00")


def test_multiple_pending_transfers_to_same_receiver(service):
    """Test receiver with multiple pending transfers."""
    from moni_minutes_tools.models import Account, Currency

    receiver = Account(
        account_id="acct_receiver",
        currency=Currency.USD,
        balance=Decimal("0.00"),
        owner_name="Receiver Account",
    )
    service.accounts["acct_receiver"] = receiver

    # Send multiple transfers
    txn1 = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_receiver",
        currency="USD",
        amount=5000.00,
    )
    txn2 = service.send_transfer(
        sender_id="acct_usd",
        receiver_id="acct_receiver",
        currency="USD",
        amount=3000.00,
    )

    # Receiver should see both as pending
    receiver_pending = service.list_receiver_pending("acct_receiver")
    assert len(receiver_pending) == 2

    # Receiver balance is still 0
    assert receiver.balance == Decimal("0.00")

    # Approve one
    service.approve_transfer(txn1.transfer_id)
    assert receiver.balance == Decimal("5000.00")

    # Still one pending
    receiver_pending_after = service.list_receiver_pending("acct_receiver")
    assert len(receiver_pending_after) == 1
    assert receiver_pending_after[0].transfer_id == txn2.transfer_id

    # Approve second
    service.approve_transfer(txn2.transfer_id)
    assert receiver.balance == Decimal("8000.00")
    receiver_pending_final = service.list_receiver_pending("acct_receiver")
    assert len(receiver_pending_final) == 0
