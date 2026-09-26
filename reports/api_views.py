from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import TruncMonth

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from collections import defaultdict

from sales.models import Sale
from purchases.models import Purchase
from expenses.models import Expense
from accounting.models import Ledger
from inventory.models import Product

from .serializers import (
    ReportsHomeSerializer,
    ProfitLossSerializer,
    TrialBalanceSerializer,
    BalanceSheetSerializer,
    MonthlyReportSerializer,
    YearlyReportSerializer,
    DateRangeReportSerializer,
)


class ReportsHomeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        sales = Sale.objects.filter(owner=request.user)
        purchases = Purchase.objects.filter(owner=request.user)
        expenses = Expense.objects.filter(owner=request.user)

        total_sales = sum(
            (s.total_amount for s in sales),
            Decimal("0.00")
        )

        total_purchases = sum(
            (p.total_amount for p in purchases),
            Decimal("0.00")
        )

        total_expenses = sum(
            (e.amount for e in expenses),
            Decimal("0.00")
        )

        profit = (
            total_sales
            - total_purchases
            - total_expenses
        )

        # ---------------- SALES ----------------

        sales_data = (
            Sale.objects
            .filter(owner=request.user)
            .annotate(month=TruncMonth("sale_date"))
            .values("month")
            .annotate(total=Sum("total_amount"))
        )

        # ---------------- PURCHASES ----------------

        purchase_data = (
            Purchase.objects
            .filter(owner=request.user)
            .annotate(month=TruncMonth("purchase_date"))
            .values("month")
            .annotate(total=Sum("total_amount"))
        )

        # ---------------- EXPENSES ----------------

        expense_data = (
            Expense.objects
            .filter(owner=request.user)
            .annotate(month=TruncMonth("expense_date"))
            .values("month")
            .annotate(total=Sum("amount"))
        )

        chart = defaultdict(
            lambda: {
                "sales": 0,
                "purchases": 0,
                "expenses": 0,
            }
        )

        for row in sales_data:
            chart[row["month"]]["sales"] = float(
                row["total"] or 0
            )

        for row in purchase_data:
            chart[row["month"]]["purchases"] = float(
                row["total"] or 0
            )

        for row in expense_data:
            chart[row["month"]]["expenses"] = float(
                row["total"] or 0
            )

        months = []
        sales_totals = []
        purchase_totals = []
        expense_totals = []

        for month in sorted(chart.keys()):

            months.append(
                month.strftime("%b %Y")
            )

            sales_totals.append(
                chart[month]["sales"]
            )

            purchase_totals.append(
                chart[month]["purchases"]
            )

            expense_totals.append(
                chart[month]["expenses"]
            )

        data = {
            "total_sales": total_sales,
            "total_purchases": total_purchases,
            "total_expenses": total_expenses,
            "profit": profit,
            "months": months,
            "sales_totals": sales_totals,
            "purchase_totals": purchase_totals,
            "expense_totals": expense_totals,
        }

        serializer = ReportsHomeSerializer(data)

        return Response(serializer.data)


class ProfitLossAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        total_sales = (
            Sale.objects
            .filter(owner=request.user)
            .aggregate(total=Sum("total_amount"))["total"]
            or Decimal("0.00")
        )

        total_purchases = (
            Purchase.objects
            .filter(owner=request.user)
            .aggregate(total=Sum("total_amount"))["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            Expense.objects
            .filter(owner=request.user)
            .aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        gross_profit = total_sales - total_purchases

        net_profit = gross_profit - total_expenses

        data = {
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "gross_profit": gross_profit,
            "net_profit": net_profit,
        }

        serializer = ProfitLossSerializer(data)

        return Response(serializer.data)


class TrialBalanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        search = request.GET.get("search", "")

        ledger_entries = (
            Ledger.objects
            .filter(owner=request.user)
            .values("particulars")
            .annotate(
                total_debit=Sum("debit"),
                total_credit=Sum("credit"),
            )
            .order_by("particulars")
        )

        if search:
            ledger_entries = ledger_entries.filter(
                particulars__icontains=search
            )

        entries = list(ledger_entries)

        total_debit = sum(
            (
                row["total_debit"] or Decimal("0.00")
                for row in entries
            ),
            Decimal("0.00")
        )

        total_credit = sum(
            (
                row["total_credit"] or Decimal("0.00")
                for row in entries
            ),
            Decimal("0.00")
        )

        data = {
            "ledger_entries": entries,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "search": search,
        }

        serializer = TrialBalanceSerializer(data)

        return Response(serializer.data)


class BalanceSheetAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        inventory_value = Decimal("0.00")

        products = Product.objects.filter(
            owner=request.user
        )

        for product in products:

            inventory_value += (
                product.purchase_price
                * product.stock_quantity
            )

        cash = (
            Ledger.objects
            .filter(owner=request.user)
            .aggregate(
                debit=Sum("debit"),
                credit=Sum("credit"),
            )
        )

        total_debit = (
            cash["debit"]
            or Decimal("0.00")
        )

        total_credit = (
            cash["credit"]
            or Decimal("0.00")
        )

        cash_balance = (
            total_debit
            - total_credit
        )

        total_assets = (
            cash_balance
            + inventory_value
        )

        liabilities = Decimal("0.00")

        capital = (
            total_assets
            - liabilities
        )

        data = {
            "cash": cash_balance,
            "inventory": inventory_value,
            "assets": total_assets,
            "liabilities": liabilities,
            "capital": capital,
        }

        serializer = BalanceSheetSerializer(data)

        return Response(serializer.data)


class MonthlyReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        month = request.GET.get("month")

        sales = Sale.objects.filter(
            owner=request.user
        )

        purchases = Purchase.objects.filter(
            owner=request.user
        )

        expenses = Expense.objects.filter(
            owner=request.user
        )

        if month:

            sales = sales.filter(
                sale_date__month=month
            )

            purchases = purchases.filter(
                purchase_date__month=month
            )

            expenses = expenses.filter(
                expense_date__month=month
            )

        total_sales = (
            sales.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_purchases = (
            purchases.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            expenses.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        profit = (
            total_sales
            - total_purchases
            - total_expenses
        )

        data = {
            "month": month,
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": profit,
        }

        serializer = MonthlyReportSerializer(data)

        return Response(serializer.data)


class YearlyReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        year = request.GET.get("year")

        sales = Sale.objects.filter(
            owner=request.user
        )

        purchases = Purchase.objects.filter(
            owner=request.user
        )

        expenses = Expense.objects.filter(
            owner=request.user
        )

        if year:

            sales = sales.filter(
                sale_date__year=year
            )

            purchases = purchases.filter(
                purchase_date__year=year
            )

            expenses = expenses.filter(
                expense_date__year=year
            )

        total_sales = (
            sales.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_purchases = (
            purchases.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            expenses.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        profit = (
            total_sales
            - total_purchases
            - total_expenses
        )

        data = {
            "year": year,
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": profit,
        }

        serializer = YearlyReportSerializer(data)

        return Response(serializer.data)


class DateRangeReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        from_date = request.GET.get("from_date")
        to_date = request.GET.get("to_date")

        sales = Sale.objects.filter(
            owner=request.user
        )

        purchases = Purchase.objects.filter(
            owner=request.user
        )

        expenses = Expense.objects.filter(
            owner=request.user
        )

        if from_date and to_date:

            sales = sales.filter(
                sale_date__range=[
                    from_date,
                    to_date
                ]
            )

            purchases = purchases.filter(
                purchase_date__range=[
                    from_date,
                    to_date
                ]
            )

            expenses = expenses.filter(
                expense_date__range=[
                    from_date,
                    to_date
                ]
            )

        total_sales = (
            sales.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_purchases = (
            purchases.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            expenses.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        profit = (
            total_sales
            - total_purchases
            - total_expenses
        )

        data = {
            "from_date": from_date,
            "to_date": to_date,
            "sales": total_sales,
            "purchases": total_purchases,
            "expenses": total_expenses,
            "profit": profit,
        }

        serializer = DateRangeReportSerializer(data)

        return Response(serializer.data)