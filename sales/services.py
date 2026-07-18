from decimal import Decimal

from django.db import transaction

from accounting.models import Ledger, Journal, CashBook

from .models import SaleItem


@transaction.atomic
def restore_stock(sale):
    """
    Restore stock for all items in a sale.
    """

    items = SaleItem.objects.filter(sale=sale)

    for item in items:

        product = item.product

        product.stock_quantity += item.quantity

        product.save()


@transaction.atomic
def reduce_stock(items):
    """
    Reduce stock for sale items.
    """

    for item in items:

        product = item.product

        if product.stock_quantity < item.quantity:

            raise ValueError(
                f"Insufficient stock for {product.name}"
            )

        product.stock_quantity -= item.quantity

        product.save()


def calculate_total(items):

    total = Decimal("0.00")

    for item in items:

        item.subtotal = (
            item.quantity *
            item.selling_price
        )

        total += item.subtotal

    return total

def create_accounting_entries(sale):

    Ledger.objects.create(

        owner=sale.owner,

        date=sale.sale_date,

        particulars=f"Sale Invoice {sale.invoice_number}",

        debit=sale.total_amount,

        credit=0,

        balance=sale.total_amount,

        reference=sale.invoice_number

    )

    Journal.objects.create(

        owner=sale.owner,

        date=sale.sale_date,

        description=f"Sale Invoice {sale.invoice_number}",

        debit_account="Cash",

        credit_account="Sales",

        amount=sale.total_amount,

        reference=sale.invoice_number

    )

    CashBook.objects.create(

        owner=sale.owner,

        date=sale.sale_date,

        receipt=sale.total_amount,

        payment=0,

        balance=sale.total_amount,

        remarks=f"Sale Invoice {sale.invoice_number}",

        reference=sale.invoice_number

    )


def update_accounting_entries(sale):

    Ledger.objects.filter(

        owner=sale.owner,

        reference=sale.invoice_number

    ).update(

        date=sale.sale_date,

        debit=sale.total_amount,

        balance=sale.total_amount,

        particulars=f"Sale Invoice {sale.invoice_number}"

    )

    Journal.objects.filter(

        owner=sale.owner,

        reference=sale.invoice_number

    ).update(

        date=sale.sale_date,

        amount=sale.total_amount,

        description=f"Sale Invoice {sale.invoice_number}"

    )

    CashBook.objects.filter(

        owner=sale.owner,

        reference=sale.invoice_number

    ).update(

        date=sale.sale_date,

        receipt=sale.total_amount,

        balance=sale.total_amount,

        remarks=f"Sale Invoice {sale.invoice_number}"

    )


def delete_accounting_entries(sale):

    Ledger.objects.filter(
        owner=sale.owner,
        reference=sale.invoice_number
    ).delete()

    Journal.objects.filter(
        owner=sale.owner,
        reference=sale.invoice_number
    ).delete()

    CashBook.objects.filter(
        owner=sale.owner,
        reference=sale.invoice_number
    ).delete()