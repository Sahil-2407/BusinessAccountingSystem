from django.shortcuts import render, redirect
from django.db import transaction

from .models import Purchase
from .forms import PurchaseForm, PurchaseItemFormSet
from decimal import Decimal
from django.db import transaction
from inventory.models import Product


def purchase_list(request):

    purchases = Purchase.objects.all().order_by("-purchase_date")

    return render(
        request,
        "purchase_list.html",
        {
            "purchases": purchases
        }
    )


def add_purchase(request):

    if request.method == "POST":

        form = PurchaseForm(request.POST)
        formset = PurchaseItemFormSet(request.POST)

        if form.is_valid() and formset.is_valid():

            with transaction.atomic():

                purchase = form.save(commit=False)

                purchase.total_amount = Decimal("0.00")

                purchase.save()

                total = Decimal("0.00")

                for item_form in formset:

                    if item_form.cleaned_data:

                        item = item_form.save(commit=False)

                        item.purchase = purchase

                        item.subtotal = (
                            item.quantity *
                            item.purchase_price
                        )

                        total += item.subtotal

                        item.save()

# -------- Update Product Stock --------

                        product = item.product

                        product.stock_quantity += item.quantity

                        product.save()

                purchase.total_amount = total

                purchase.save()

            return redirect("purchase_list")

    else:

        form = PurchaseForm()
        formset = PurchaseItemFormSet()

    return render(
    request,
    "purchase_form.html",
    {
        "form": form,
        "products": Product.objects.all(),
    }
)