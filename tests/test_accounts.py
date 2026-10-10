"""Tests for account models and operations."""

import pytest
from decimal import Decimal

from moni_minutes_tools.models import Account, Currency


def test_usd_account_initialization():
    """Test USD account creation with correct balance."""
    account = Account(
        account_id="acct_usd",
        currency=Currency.USD,
        balance=Decimal("200000.00"),
    )
    assert account.balance == Decimal("200000.00")
    assert account.currency == Currency.USD
    assert account.account_id == "acct_usd"


def test_ngn_account_initialization():
    """Test NGN account creation with correct balance."""
    account = Account(
        account_id="acct_ngn",
        currency=Currency.NGN,
        balance=Decimal("10000000.00"),
    )
    assert account.balance == Decimal("10000000.00")
    assert account.currency == Currency.NGN


def test_account_can_transfer():
    """Test balance checking for transfers."""
    account = Account(
        account_id="test",
        currency=Currency.USD,
        balance=Decimal("1000.00"),
    )
    assert account.can_transfer(Decimal("500.00")) is True
    assert account.can_transfer(Decimal("1000.00")) is True
    assert account.can_transfer(Decimal("1001.00")) is False


def test_account_withdraw():
    """Test account withdrawal."""
    account = Account(
        account_id="test",
        currency=Currency.USD,
        balance=Decimal("1000.00"),
    )
    account.withdraw(Decimal("500.00"))
    assert account.balance == Decimal("500.00")


def test_account_withdraw_insufficient_funds():
    """Test withdrawal with insufficient funds raises error."""
    account = Account(
        account_id="test",
        currency=Currency.USD,
        balance=Decimal("100.00"),
    )
    with pytest.raises(ValueError, match="Insufficient balance"):
        account.withdraw(Decimal("200.00"))


def test_account_deposit():
    """Test account deposit."""
    account = Account(
        account_id="test",
        currency=Currency.USD,
        balance=Decimal("1000.00"),
    )
    account.deposit(Decimal("500.00"))
    assert account.balance == Decimal("1500.00")


def test_account_deposit_negative_amount():
    """Test deposit with negative amount raises error."""
    account = Account(
        account_id="test",
        currency=Currency.USD,
        balance=Decimal("1000.00"),
    )
    with pytest.raises(ValueError, match="positive"):
        account.deposit(Decimal("-100.00"))


def test_account_negative_balance_initialization():
    """Test that negative balance raises error on init."""
    with pytest.raises(ValueError, match="negative"):
        Account(
            account_id="test",
            currency=Currency.USD,
            balance=Decimal("-1000.00"),
        )
