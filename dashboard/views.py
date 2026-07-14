from django.shortcuts import render
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from expenses.models import Expense
from inventory.models import Category
from customers.models import Customer
from suppliers.models import Supplier
from inventory.models import Product
from purchases.models import Purchase
from sales.models import Sale


def dashboard(request):

    # Dashboard Counts
    customers = Customer.objects.count()
    suppliers = Supplier.objects.count()
    products = Product.objects.count()

    low_stock_products = Product.objects.filter(
        stock_quantity__lte=10
    )

    # Totals
    total_sales = (
        Sale.objects.aggregate(total=Sum("total_amount"))["total"] or 0
    )

    total_purchases = (
        Purchase.objects.aggregate(total=Sum("total_amount"))["total"] or 0
    )

    # Recent Records
    recent_sales = Sale.objects.order_by("-sale_date")[:5]

    recent_purchases = Purchase.objects.order_by("-purchase_date")[:5]

    # -------------------------
    # Monthly Sales
    # -------------------------

    sales_chart = (
        Sale.objects
        .annotate(month=TruncMonth("sale_date"))
        .values("month")
        .annotate(total=Sum("total_amount"))
        .order_by("month")
    )

    purchase_chart = (
        Purchase.objects
        .annotate(month=TruncMonth("purchase_date"))
        .values("month")
        .annotate(total=Sum("total_amount"))
        .order_by("month")
    )

    sales_months = []
    sales_totals = []

    for row in sales_chart:

        sales_months.append(
            row["month"].strftime("%b %Y")
        )

        sales_totals.append(
            float(row["total"])
        )

    purchase_dict = {}

    for row in purchase_chart:

        purchase_dict[
            row["month"].strftime("%b %Y")
        ] = float(row["total"])

    purchase_totals = []

    for month in sales_months:

        purchase_totals.append(
            purchase_dict.get(month, 0)
        )

    context = {

        "customers": customers,

        "suppliers": suppliers,

        "products": products,

        "sales": total_sales,

        "purchases": total_purchases,

        "low_stock": low_stock_products,

        "recent_sales": recent_sales,

        "recent_purchases": recent_purchases,

        "sales_months": sales_months,

        "sales_totals": sales_totals,

        "purchase_totals": purchase_totals,

    }

    return render(
        request,
        "dashboard/dashboard.html",
        context,
    )