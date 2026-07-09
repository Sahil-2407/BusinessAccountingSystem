from django.urls import path
from . import views

urlpatterns = [

    # Ledger
    path("", views.ledger_list, name="ledger_list"),
    path("ledger/add/", views.add_ledger, name="add_ledger"),

    # Journal
    path("journal/", views.journal_list, name="journal_list"),
    path("journal/add/", views.add_journal, name="add_journal"),

    # Cash Book
    path("cashbook/", views.cashbook_list, name="cashbook_list"),
    path("cashbook/add/", views.add_cashbook, name="add_cashbook"),

]