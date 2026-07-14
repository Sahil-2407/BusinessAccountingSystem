from django.shortcuts import render, redirect
from django.db import transaction
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Purchase
from .forms import PurchaseForm, PurchaseItemFormSet
from decimal import Decimal
from django.db import transaction
from inventory.models import Product
from django.shortcuts import get_object_or_404
from django.contrib import messages
from accounting.models import Ledger, Journal, CashBook
from .models import PurchaseItem


def purchase_list(request):

    query = request.GET.get("q", "")

    purchases = Purchase.objects.select_related(
        "supplier"
    )

    if query:

        purchases = purchases.filter(

            Q(invoice_number__icontains=query)

            |

            Q(supplier__name__icontains=query)

        )

    purchases = purchases.order_by("-purchase_date")

    paginator = Paginator(
        purchases,
        10
    )

    page = request.GET.get("page")

    purchases = paginator.get_page(page)

    return render(
        request,
        "purchase_list.html",
        {
            "purchases": purchases,
            "query": query,
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
        "formset": formset,
    }
)

@transaction.atomic
def edit_purchase(request, pk):

    purchase = get_object_or_404(Purchase, pk=pk)

    if request.method == "POST":

        form = PurchaseForm(request.POST, instance=purchase)
        formset = PurchaseItemFormSet(
            request.POST,
            instance=purchase
        )

        if form.is_valid() and formset.is_valid():

            # Restore previous stock
            for old_item in PurchaseItem.objects.filter(purchase=purchase):

                product = old_item.product
                product.stock_quantity -= old_item.quantity
                product.save()

            # Delete previous purchase items
            PurchaseItem.objects.filter(
                purchase=purchase
            ).delete()

            purchase = form.save(commit=False)

            total = Decimal("0.00")

            for item_form in formset:

                if not item_form.cleaned_data:
                    continue

                if item_form.cleaned_data.get("DELETE"):
                    continue

                item = item_form.save(commit=False)

                item.purchase = purchase

                product = item.product

                # Increase stock
                product.stock_quantity += item.quantity
                product.save()

                item.subtotal = (
                    item.quantity *
                    item.purchase_price
                )

                total += item.subtotal

                item.save()

            purchase.total_amount = total
            purchase.save()

            # Update Ledger
            Ledger.objects.filter(
                reference=purchase.invoice_number
            ).update(
                date=purchase.purchase_date,
                debit=total,
                balance=total,
                particulars=f"Purchase Invoice {purchase.invoice_number}",
            )

            # Update Journal
            Journal.objects.filter(
                reference=purchase.invoice_number
            ).update(
                date=purchase.purchase_date,
                amount=total,
                debit_account="Purchases",
                credit_account="Cash",
                description=f"Purchase Invoice {purchase.invoice_number}",
            )

            # Update Cash Book
            CashBook.objects.filter(
                reference=purchase.invoice_number
            ).update(
                date=purchase.purchase_date,
                payment=total,
                receipt=0,
                balance=total,
                remarks=f"Purchase Invoice {purchase.invoice_number}",
            )

            messages.success(
                request,
                "Purchase updated successfully."
            )

            return redirect("purchase_list")

    else:

        form = PurchaseForm(instance=purchase)
        formset = PurchaseItemFormSet(instance=purchase)

    return render(
        request,
        "edit_purchase.html",
        {
            "form": form,
            "formset": formset,
        }
    )