from decimal import Decimal

from accounting.models import Ledger, Journal, CashBook
from .models import PurchaseItem


def calculate_total(items):
    total = Decimal("0.00")

    for item in items:
        item.subtotal = item.quantity * item.purchase_price
        total += item.subtotal

    return total


def increase_stock(items):

    for item in items:

        product = item.product

        product.stock_quantity += item.quantity

        product.save()


def restore_stock(purchase):

    items = PurchaseItem.objects.filter(
        purchase=purchase
    )

    for item in items:

        product = item.product

        product.stock_quantity -= item.quantity

        product.save()


def create_accounting_entries(purchase):

    Ledger.objects.create(
        owner=purchase.owner,
        date=purchase.purchase_date,
        particulars=f"Purchase Invoice {purchase.invoice_number}",
        debit=purchase.total_amount,
        credit=0,
        balance=purchase.total_amount,
        reference=purchase.invoice_number,
    )

    Journal.objects.create(
        owner=purchase.owner,
        date=purchase.purchase_date,
        description=f"Purchase Invoice {purchase.invoice_number}",
        debit_account="Purchases",
        credit_account="Cash",
        amount=purchase.total_amount,
        reference=purchase.invoice_number,
    )

    CashBook.objects.create(
        owner=purchase.owner,
        date=purchase.purchase_date,
        receipt=0,
        payment=purchase.total_amount,
        balance=purchase.total_amount,
        remarks=f"Purchase Invoice {purchase.invoice_number}",
        reference=purchase.invoice_number,
    )

def update_accounting_entries(purchase):

    Ledger.objects.filter(
        owner=purchase.owner,
        reference=purchase.invoice_number
    ).update(
        date=purchase.purchase_date,
        debit=purchase.total_amount,
        balance=purchase.total_amount,
    )

    Journal.objects.filter(
        owner=purchase.owner,
        reference=purchase.invoice_number
    ).update(
        date=purchase.purchase_date,
        amount=purchase.total_amount,
    )

    CashBook.objects.filter(
        owner=purchase.owner,
        reference=purchase.invoice_number
    ).update(
        date=purchase.purchase_date,
        payment=purchase.total_amount,
        balance=purchase.total_amount,
    )


def delete_accounting_entries(purchase):

    Ledger.objects.filter(
        owner=purchase.owner,
        reference=purchase.invoice_number
    ).delete()

    Journal.objects.filter(
        owner=purchase.owner,
        reference=purchase.invoice_number
    ).delete()

    CashBook.objects.filter(
        owner=purchase.owner,
        reference=purchase.invoice_number
    ).delete()