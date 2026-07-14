from django.shortcuts import render, redirect

from .models import Ledger, Journal, CashBook
from .forms import LedgerForm, JournalForm, CashBookForm


# ---------------- Ledger ----------------

def ledger_list(request):

    ledger = Ledger.objects.all().order_by("-date")

    return render(
        request,
        "accounting/ledger_list.html",
        {
            "ledger": ledger
        }
    )

def accounting_dashboard(request):

    return render(
        request,
        "accounting/accounting_dashboard.html"
    )

def add_ledger(request):

    if request.method == "POST":

        form = LedgerForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect("ledger_list")

    else:

        form = LedgerForm()

    return render(
        request,
        "accounting/ledger_form.html",
        {
            "form": form
        }
    )


# ---------------- Journal ----------------

def journal_list(request):

    journals = Journal.objects.all().order_by("-date")

    return render(
        request,
        "accounting/journal_list.html",
        {
            "journals": journals
        }
    )


def add_journal(request):

    if request.method == "POST":

        form = JournalForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect("journal_list")

    else:

        form = JournalForm()

    return render(
        request,
        "accounting/journal_form.html",
        {
            "form": form
        }
    )


# ---------------- Cash Book ----------------

def cashbook_list(request):

    cashbooks = CashBook.objects.all().order_by("-date")

    return render(
        request,
        "accounting/cashbook_list.html",
        {
            "cashbooks": cashbooks
        }
    )


def add_cashbook(request):

    if request.method == "POST":

        form = CashBookForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect("cashbook_list")

    else:

        form = CashBookForm()

    return render(
        request,
        "accounting/cashbook_form.html",
        {
            "form": form
        }
    )