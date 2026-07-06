from django.shortcuts import render
from .models import Expense
from .forms import ExpenseForm


def expense_list(request):

    expenses = Expense.objects.all().order_by("-expense_date")

    return render(
        request,
        "expenses/expense_list.html",
        {
            "expenses": expenses
        }
    )


def add_expense(request):

    if request.method == "POST":

        form = ExpenseForm(request.POST)

        if form.is_valid():

            form.save()

    else:

        form = ExpenseForm()

    return render(
        request,
        "expenses/expense_form.html",
        {
            "form": form
        }
    )