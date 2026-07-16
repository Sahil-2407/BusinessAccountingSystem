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

    path(
        "monthly-report/",
        views.monthly_report,
        name="monthly_report"
    ),

    path(
        "yearly-report/",
        views.yearly_report,
        name="yearly_report"
    ),

    path(
        "date-range/",
        views.date_range_report,
        name="date_range_report"
    ),
]