from django.shortcuts import render, redirect, get_object_or_404

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

            return redirect("expense_list")

    else:

        form = ExpenseForm()

    return render(
        request,
        "expenses/expense_form.html",
        {
            "form": form,
            "title": "Add Expense"
        }
    )


def edit_expense(request, pk):

    expense = get_object_or_404(
        Expense,
        pk=pk
    )

    if request.method == "POST":

        form = ExpenseForm(
            request.POST,
            instance=expense
        )

        if form.is_valid():

            form.save()

            return redirect("expense_list")

    else:

        form = ExpenseForm(instance=expense)

    return render(
        request,
        "expenses/expense_form.html",
        {
            "form": form,
            "title": "Edit Expense"
        }
    )


def delete_expense(request, pk):

    expense = get_object_or_404(
        Expense,
        pk=pk
    )

    expense.delete()

    return redirect("expense_list")