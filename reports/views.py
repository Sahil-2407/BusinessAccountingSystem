from django.shortcuts import render
from sales.models import Sale
from purchases.models import Purchase
from expenses.models import Expense


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