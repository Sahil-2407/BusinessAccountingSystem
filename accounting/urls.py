from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.accounting_dashboard,
        name="accounting_dashboard"
    ),

    path(
        "ledger/",
        views.ledger_list,
        name="ledger_list"
    ),

    path(
        "ledger/add/",
        views.add_ledger,
        name="add_ledger"
    ),

    path(
        "journal/",
        views.journal_list,
        name="journal_list"
    ),

    path(
        "journal/add/",
        views.add_journal,
        name="add_journal"
    ),

    path(
        "cashbook/",
        views.cashbook_list,
        name="cashbook_list"
    ),

    path(
        "cashbook/add/",
        views.add_cashbook,
        name="add_cashbook"
    ),

]