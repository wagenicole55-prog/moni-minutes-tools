"""Command-line interface for Moni Minutes Tools."""

import argparse
import json
import sys
from decimal import Decimal

from moni_minutes_tools.transfers import TransferService


def format_currency(amount: str, currency: str) -> str:
    """Format currency value for display."""
    if currency == "USD":
        return f"${float(amount):,.2f}"
    elif currency == "NGN":
        return f"₦{float(amount):,.0f}"
    return f"{amount} {currency}"


def print_transfer(transfer, sender_name="", receiver_name=""):
    """Pretty print a transfer."""
    print(f"\n  Transfer ID: {transfer.transfer_id}")
    print(f"  From: {transfer.sender_account_id} ({sender_name})")
    print(f"  To: {transfer.receiver_account_id} ({receiver_name})")
    print(f"  Amount: {format_currency(str(transfer.amount), transfer.currency.value)}")
    print(f"  Status: {transfer.status.value.upper()}")
    print(f"  Created: {transfer.created_at.isoformat()}")
    if transfer.description:
        print(f"  Description: {transfer.description}")
    print()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Moni Minutes Tools - Multi-currency fund transfer system"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Balance command
    balance_parser = subparsers.add_parser(
        "balance", help="Check account balance"
    )
    balance_parser.add_argument(
        "--account",
        default="all",
        help="Account ID to check (default: all)",
    )

    # Send command
    send_parser = subparsers.add_parser(
        "send", help="Send funds (creates pending transfer)"
    )
    send_parser.add_argument(
        "--currency",
        required=True,
        choices=["USD", "NGN"],
        help="Currency (USD or NGN)",
    )
    send_parser.add_argument(
        "--amount", required=True, type=float, help="Amount to transfer"
    )
    send_parser.add_argument(
        "--sender", required=True, help="Sender account ID"
    )
    send_parser.add_argument(
        "--receiver", required=True, help="Receiver account ID"
    )
    send_parser.add_argument(
        "--description", default="", help="Optional transfer description"
    )

    # Pending command
    pending_parser = subparsers.add_parser(
        "pending", help="List all pending transfers"
    )
    pending_parser.add_argument(
        "--receiver",
        default="",
        help="Filter by receiver account ID",
    )

    # Approve command
    approve_parser = subparsers.add_parser(
        "approve", help="Approve and settle a pending transfer"
    )
    approve_parser.add_argument(
        "--transfer-id", required=True, help="Transfer ID to approve"
    )

    # Reject command
    reject_parser = subparsers.add_parser(
        "reject", help="Reject a pending transfer"
    )
    reject_parser.add_argument(
        "--transfer-id", required=True, help="Transfer ID to reject"
    )
    reject_parser.add_argument(
        "--reason", default="", help="Reason for rejection"
    )

    # Get transfer command
    get_parser = subparsers.add_parser(
        "get", help="Get transfer details"
    )
    get_parser.add_argument(
        "--transfer-id", required=True, help="Transfer ID"
    )

    # Ledger command
    ledger_parser = subparsers.add_parser(
        "ledger", help="View transaction ledger"
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    service = TransferService()

    try:
        if args.command == "balance":
            if args.account == "all":
                print("\n📊 Account Balances:\n")
                for account_id, account in service.accounts.items():
                    balance_info = service.get_account_balance(account_id)
                    print(f"  {account_id} ({balance_info['owner_name']})")
                    print(
                        f"    Balance: {format_currency(balance_info['balance'], balance_info['currency'])}"
                    )
                    print()
            else:
                balance_info = service.get_account_balance(args.account)
                print(f"\n💰 {args.account} Balance:\n")
                print(f"  Owner: {balance_info['owner_name']}")
                print(
                    f"  Balance: {format_currency(balance_info['balance'], balance_info['currency'])}"
                )
                print()

        elif args.command == "send":
            print(f"\n📤 Sending {args.currency} Transfer...\n")
            transfer = service.send_transfer(
                sender_id=args.sender,
                receiver_id=args.receiver,
                currency=args.currency,
                amount=args.amount,
                description=args.description,
            )
            sender = service.get_account(args.sender)
            receiver = service.get_account(args.receiver)
            print_transfer(transfer, sender.owner_name, receiver.owner_name)
            print(
                f"✅ Transfer created with status: PENDING\n"
                f"   Transfer ID: {transfer.transfer_id}\n"
                f"   The receiver will see this as a pending transaction."
            )
            print()

        elif args.command == "pending":
            if args.receiver:
                transfers = service.list_receiver_pending(args.receiver)
                print(f"\n⏳ Pending Transfers for {args.receiver}:\n")
            else:
                transfers = service.list_pending_transfers()
                print("\n⏳ All Pending Transfers:\n")

            if transfers:
                for transfer in transfers:
                    sender = service.get_account(transfer.sender_account_id)
                    receiver = service.get_account(transfer.receiver_account_id)
                    print_transfer(
                        transfer, sender.owner_name, receiver.owner_name
                    )
            else:
                print("  No pending transfers.\n")

        elif args.command == "approve":
            print(f"\n✅ Approving Transfer {args.transfer_id}...\n")
            transfer = service.approve_transfer(args.transfer_id)
            sender = service.get_account(transfer.sender_account_id)
            receiver = service.get_account(transfer.receiver_account_id)
            print_transfer(transfer, sender.owner_name, receiver.owner_name)
            print(f"✅ Transfer settled successfully!\n")
            print(
                f"   Sender ({sender.account_id}) new balance: {format_currency(str(sender.balance), sender.currency.value)}"
            )
            print(
                f"   Receiver ({receiver.account_id}) new balance: {format_currency(str(receiver.balance), receiver.currency.value)}"
            )
            print()

        elif args.command == "reject":
            print(f"\n❌ Rejecting Transfer {args.transfer_id}...\n")
            transfer = service.reject_transfer(args.transfer_id, args.reason)
            sender = service.get_account(transfer.sender_account_id)
            receiver = service.get_account(transfer.receiver_account_id)
            print_transfer(transfer, sender.owner_name, receiver.owner_name)
            print(f"✅ Transfer rejected.\n")

        elif args.command == "get":
            transfer = service.get_transfer(args.transfer_id)
            if transfer:
                print(f"\n📋 Transfer Details:\n")
                sender = service.get_account(transfer.sender_account_id)
                receiver = service.get_account(transfer.receiver_account_id)
                print_transfer(
                    transfer, sender.owner_name, receiver.owner_name
                )
            else:
                print(f"❌ Transfer {args.transfer_id} not found.\n")

        elif args.command == "ledger":
            ledger = service.get_ledger()
            print("\n📜 Transaction Ledger:\n")
            if ledger:
                for entry in ledger:
                    print(f"  [{entry['timestamp']}] {entry['event'].upper()}")
                    for key, value in entry.items():
                        if key not in ["timestamp", "event"]:
                            print(f"    {key}: {value}")
                    print()
            else:
                print("  No transactions yet.\n")

    except ValueError as e:
        print(f"\n❌ Error: {e}\n", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}\n", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
