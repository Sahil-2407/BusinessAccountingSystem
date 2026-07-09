from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.reports_home,
        name="reports_home"
    ),

    path(
    "profit-loss/",
    views.profit_loss,
    name="profit_loss"
    ),

    path(
        "trial-balance/",
        views.trial_balance,
        name="trial_balance"
    ),

    path(
        "balance-sheet/",
        views.balance_sheet,
        name="balance_sheet"
    ),

]