from django.urls import path

from .api_views import (
    ReportsHomeAPIView,
    ProfitLossAPIView,
    TrialBalanceAPIView,
    BalanceSheetAPIView,
    MonthlyReportAPIView,
    YearlyReportAPIView,
    DateRangeReportAPIView,
)

urlpatterns = [

    path(
        "reports/",
        ReportsHomeAPIView.as_view(),
        name="api_reports_home"
    ),

    path(
        "reports/profit-loss/",
        ProfitLossAPIView.as_view(),
        name="api_profit_loss"
    ),

    path(
        "reports/trial-balance/",
        TrialBalanceAPIView.as_view(),
        name="api_trial_balance"
    ),

    path(
        "reports/balance-sheet/",
        BalanceSheetAPIView.as_view(),
        name="api_balance_sheet"
    ),

    path(
        "reports/monthly-report/",
        MonthlyReportAPIView.as_view(),
        name="api_monthly_report"
    ),

    path(
        "reports/yearly-report/",
        YearlyReportAPIView.as_view(),
        name="api_yearly_report"
    ),

    path(
        "reports/date-range/",
        DateRangeReportAPIView.as_view(),
        name="api_date_range_report"
    ),
]