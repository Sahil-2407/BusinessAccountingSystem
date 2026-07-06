from django.shortcuts import render, redirect
from customers.models import Customer
from inventory.models import Product
from .models import Sale


def sale_list(request):

    sales = Sale.objects.all().order_by("-sale_date")

    return render(
        request,
        "sales/sale_list.html",
        {
            "sales": sales
        }
    )


def add_sale(request):

    return render(
        request,
        "sales/sale_form.html",
        {
            "customers": Customer.objects.all(),
            "products": Product.objects.all(),
        }
    )