from django.shortcuts import render
from sales.models import Sale
from purchases.models import Purchase
from expenses.models import Expense
from django.db.models import Sum
from accounting.models import Ledger
from inventory.models import Product
from decimal import Decimal
from django.utils.dateparse import parse_date
from django.db.models.functions import TruncMonth
from collections import defaultdict
from datetime import datetime

def reports_home(request):

    sales = Sale.objects.filter(owner=request.user)

    purchases = Purchase.objects.filter(owner=request.user)

    expenses = Expense.objects.filter(owner=request.user)

    total_sales = sum(s.total_amount for s in sales)

    total_purchases = sum(p.total_amount for p in purchases)

    total_expenses = sum(e.amount for e in expenses)

    profit = (
        total_sales
        - total_purchases
        - total_expenses
    )

    # ---------------- Sales ----------------

    sales_data = (
        Sale.objects.filter(
            owner=request.user
        )
        .annotate(month=TruncMonth("sale_date"))
        .values("month")
        .annotate(total=Sum("total_amount"))
    )

    # ---------------- Purchases ----------------

    purchase_data = (
        Purchase.objects.filter(
            owner=request.user
        )
        .annotate(month=TruncMonth("purchase_date"))
        .values("month")
        .annotate(total=Sum("total_amount"))
    )

    # ---------------- Expenses ----------------

    expense_data = (
        Expense.objects.filter(
            owner=request.user
        )
        .annotate(month=TruncMonth("expense_date"))
        .values("month")
        .annotate(total=Sum("amount"))
    )

    chart = defaultdict(lambda: {
        "sales": 0,
        "purchases": 0,
        "expenses": 0,
    })

    for row in sales_data:
        chart[row["month"]]["sales"] = float(row["total"])

    for row in purchase_data:
        chart[row["month"]]["purchases"] = float(row["total"])

    for row in expense_data:
        chart[row["month"]]["expenses"] = float(row["total"])

    months = []
    sales_totals = []
    purchase_totals = []
    expense_totals = []

    for month in sorted(chart.keys()):

        months.append(month.strftime("%b %Y"))

        sales_totals.append(chart[month]["sales"])

        purchase_totals.append(chart[month]["purchases"])

        expense_totals.append(chart[month]["expenses"])
    context = {

        "sales": sales,

        "purchases": purchases,

        "expenses": expenses,

        "total_sales": total_sales,

        "total_purchases": total_purchases,

        "total_expenses": total_expenses,

        "profit": profit,

        "months": months,

        "sales_totals": sales_totals,

        "purchase_totals": purchase_totals,

        "expense_totals": expense_totals,

    }

    return render(
        request,
        "reports/reports_home.html",
        context
    )
def profit_loss(request):

    total_sales = (
        Sale.objects.filter(
            owner=request.user
        ).aggregate(
            total=Sum("total_amount")
        )["total"] or 0
    )

    total_purchases = (
        Purchase.objects.filter(
            owner=request.user
        ).aggregate(
            total=Sum("total_amount")
        )["total"] or 0
    )

    total_expenses = (
        Expense.objects.filter(
            owner=request.user
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    gross_profit = total_sales - total_purchases

    net_profit = gross_profit - total_expenses

    return render(
        request,
        "reports/profit_loss.html",
        {
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "gross_profit": gross_profit,
            "net_profit": net_profit,
        }
    )

def trial_balance(request):

    search = request.GET.get("search", "")

    ledger_entries = (
        Ledger.objects.filter(
            owner=request.user
        )
        .values("particulars")
        .annotate(
            total_debit=Sum("debit"),
            total_credit=Sum("credit")
        )
        .order_by("particulars")
    )

    if search:
        ledger_entries = ledger_entries.filter(
            particulars__icontains=search
        )

    total_debit = sum(
        row["total_debit"] or 0
        for row in ledger_entries
    )

    total_credit = sum(
        row["total_credit"] or 0
        for row in ledger_entries
    )

    context = {
        "ledger_entries": ledger_entries,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "search": search,
    }

    return render(
        request,
        "reports/trial_balance.html",
        context,
    )

def balance_sheet(request):

    # Inventory Value
    inventory_value = Decimal("0.00")

    products = Product.objects.filter(
        owner=request.user
    )

    for product in products:

        inventory_value += (
            product.purchase_price *
            product.stock_quantity
        )

    # Cash Balance
    cash = (
        Ledger.objects.filter(
            owner=request.user
        ).aggregate(
            debit=Sum("debit"),
            credit=Sum("credit")
        )
    )

    total_debit = cash["debit"] or Decimal("0.00")
    total_credit = cash["credit"] or Decimal("0.00")

    cash_balance = total_debit - total_credit

    total_assets = cash_balance + inventory_value

    liabilities = Decimal("0.00")

    capital = total_assets - liabilities

    context = {

        "cash": cash_balance,

        "inventory": inventory_value,

        "assets": total_assets,

        "liabilities": liabilities,

        "capital": capital,

    }

    return render(
        request,
        "reports/balance_sheet.html",
        context,
    )

def monthly_report(request):

    month = request.GET.get("month")

    sales = Sale.objects.filter(owner=request.user)
    purchases = Purchase.objects.filter(owner=request.user)
    expenses = Expense.objects.filter(owner=request.user)

    if month:

        sales = sales.filter(
            sale_date__month=month
        )

        purchases = purchases.filter(
            purchase_date__month=month
        )

        expenses = expenses.filter(
            expense_date__month=month
        )

    total_sales = (
        sales.aggregate(
            total=Sum("total_amount")
        )["total"] or Decimal("0.00")
    )

    total_purchases = (
        purchases.aggregate(
            total=Sum("total_amount")
        )["total"] or Decimal("0.00")
    )

    total_expenses = (
        expenses.aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
    )

    profit = (
        total_sales
        - total_purchases
        - total_expenses
    )

    return render(
        request,
        "reports/monthly_report.html",
        {
            "month": month,
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": profit,
        }
    )

def yearly_report(request):

    year = request.GET.get("year")

    sales = Sale.objects.filter(owner=request.user)
    purchases = Purchase.objects.filter(owner=request.user)
    expenses = Expense.objects.filter(owner=request.user)

    if year:

        sales = sales.filter(
            sale_date__year=year
        )

        purchases = purchases.filter(
            purchase_date__year=year
        )

        expenses = expenses.filter(
            expense_date__year=year
        )

    total_sales = (
        sales.aggregate(
            total=Sum("total_amount")
        )["total"] or Decimal("0.00")
    )

    total_purchases = (
        purchases.aggregate(
            total=Sum("total_amount")
        )["total"] or Decimal("0.00")
    )

    total_expenses = (
        expenses.aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")
    )

    profit = (
        total_sales
        - total_purchases
        - total_expenses
    )

    return render(
        request,
        "reports/yearly_report.html",
        {
            "year": year,
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": profit,
        }
    )

def date_range_report(request):

    from_date = request.GET.get("from_date")
    to_date = request.GET.get("to_date")

    sales = Sale.objects.filter(owner=request.user)
    purchases = Purchase.objects.filter(owner=request.user)
    expenses = Expense.objects.filter(owner=request.user)

    if from_date and to_date:

        sales = sales.filter(
            sale_date__range=[from_date, to_date]
        )

        purchases = purchases.filter(
            purchase_date__range=[from_date, to_date]
        )

        expenses = expenses.filter(
            expense_date__range=[from_date, to_date]
        )

    total_sales = (
        sales.aggregate(
            total=Sum("total_amount")
        )["total"] or 0
    )

    total_purchases = (
        purchases.aggregate(
            total=Sum("total_amount")
        )["total"] or 0
    )

    total_expenses = (
        expenses.aggregate(
            total=Sum("amount")
        )["total"] or 0
    )

    profit = (
        total_sales
        - total_purchases
        - total_expenses
    )

    return render(
        request,
        "reports/date_range_report.html",
        {
            "from_date": from_date,
            "to_date": to_date,
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": profit,
        }
    )