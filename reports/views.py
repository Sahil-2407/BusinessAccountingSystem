from django.shortcuts import render
from sales.models import Sale
from purchases.models import Purchase
from expenses.models import Expense
from django.db.models import Sum
from accounting.models import Ledger
from inventory.models import Product


def reports_home(request):

    sales = Sale.objects.all()

    purchases = Purchase.objects.all()

    expenses = Expense.objects.all()

    total_sales = sum(s.total_amount for s in sales)

    total_purchases = sum(p.total_amount for p in purchases)

    total_expenses = sum(e.amount for e in expenses)

    profit = (
        total_sales
        - total_purchases
        - total_expenses
    )

    context = {

        "sales": sales,

        "purchases": purchases,

        "expenses": expenses,

        "total_sales": total_sales,

        "total_purchases": total_purchases,

        "total_expenses": total_expenses,

        "profit": profit,

    }

    return render(
        request,
        "reports/reports_home.html",
        context
    )
def profit_loss(request):

    total_sales = (
        Sale.objects.aggregate(
            total=Sum("total_amount")
        )["total"] or 0
    )

    total_purchases = (
        Purchase.objects.aggregate(
            total=Sum("total_amount")
        )["total"] or 0
    )

    total_expenses = (
        Expense.objects.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    net_profit = (
        total_sales
        - total_purchases
        - total_expenses
    )

    return render(
        request,
        "reports/profit_loss.html",
        {
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": net_profit,
        }
    )

def trial_balance(request):

    ledger_entries = (
        Ledger.objects
        .values("particulars")
        .annotate(
            total_debit=Sum("debit"),
            total_credit=Sum("credit")
        )
        .order_by("particulars")
    )

    total_debit = sum(
        row["total_debit"] or 0
        for row in ledger_entries
    )

    total_credit = sum(
        row["total_credit"] or 0
        for row in ledger_entries
    )

    return render(
        request,
        "reports/trial_balance.html",
        {
            "ledger_entries": ledger_entries,
            "total_debit": total_debit,
            "total_credit": total_credit,
        }
    )

def balance_sheet(request):

    total_inventory = 0

    products = Product.objects.all()

    for product in products:
        total_inventory += (
            product.purchase_price *
            product.stock_quantity
        )

    cash = 0

    cash_entries = Ledger.objects.all()

    for entry in cash_entries:
        cash += (entry.debit - entry.credit)

    total_assets = cash + total_inventory

    liabilities = 0

    capital = total_assets - liabilities

    return render(
        request,
        "reports/balance_sheet.html",
        {
            "cash": cash,
            "inventory": total_inventory,
            "assets": total_assets,
            "liabilities": liabilities,
            "capital": capital,
        }
    )