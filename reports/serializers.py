from rest_framework import serializers


class ProfitLossSerializer(serializers.Serializer):
    sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    purchases = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    gross_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2)


class BalanceSheetSerializer(serializers.Serializer):
    cash = serializers.DecimalField(max_digits=12, decimal_places=2)
    inventory = serializers.DecimalField(max_digits=12, decimal_places=2)
    assets = serializers.DecimalField(max_digits=12, decimal_places=2)
    liabilities = serializers.DecimalField(max_digits=12, decimal_places=2)
    capital = serializers.DecimalField(max_digits=12, decimal_places=2)


class MonthlyReportSerializer(serializers.Serializer):
    month = serializers.CharField(allow_null=True)
    sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    purchases = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit = serializers.DecimalField(max_digits=12, decimal_places=2)


class YearlyReportSerializer(serializers.Serializer):
    year = serializers.CharField(allow_null=True)
    sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    purchases = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit = serializers.DecimalField(max_digits=12, decimal_places=2)


class DateRangeReportSerializer(serializers.Serializer):
    from_date = serializers.CharField(allow_null=True)
    to_date = serializers.CharField(allow_null=True)
    sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    purchases = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit = serializers.DecimalField(max_digits=12, decimal_places=2)


class TrialBalanceEntrySerializer(serializers.Serializer):
    particulars = serializers.CharField()
    total_debit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        allow_null=True
    )
    total_credit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        allow_null=True
    )


class TrialBalanceSerializer(serializers.Serializer):
    ledger_entries = TrialBalanceEntrySerializer(many=True)
    total_debit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    total_credit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    search = serializers.CharField(allow_blank=True)


class ReportsHomeSerializer(serializers.Serializer):
    total_sales = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    total_purchases = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    total_expenses = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    profit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    months = serializers.ListField(
        child=serializers.CharField()
    )

    sales_totals = serializers.ListField(
        child=serializers.FloatField()
    )

    purchase_totals = serializers.ListField(
        child=serializers.FloatField()
    )

    expense_totals = serializers.ListField(
        child=serializers.FloatField()
    )