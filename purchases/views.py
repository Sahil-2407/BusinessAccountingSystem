from .services import (
    calculate_total,
    increase_stock,
    restore_stock,
    create_accounting_entries,
    update_accounting_entries,
    delete_accounting_entries,
)
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from django.db import transaction
from django.core.paginator import Paginator
from django.db.models import Q
from .forms import PurchaseForm, PurchaseItemFormSet
from decimal import Decimal
from django.db import transaction
from inventory.models import Product
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from accounting.models import Ledger, Journal, CashBook
from .models import Purchase, PurchaseItem
from suppliers.models import Supplier


def purchase_list(request):

    query = request.GET.get("q", "")

    purchases = Purchase.objects.select_related(
        "supplier"
    ).filter(
        owner=request.user
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
        form.fields["supplier"].queryset = Supplier.objects.filter(
            owner=request.user
        )
        formset = PurchaseItemFormSet(request.POST)
        for item_form in formset:
            item_form.fields["product"].queryset = Product.objects.filter(
            owner=request.user
            )

        if form.is_valid() and formset.is_valid():

            with transaction.atomic():

                purchase = form.save(commit=False)

                purchase.owner = request.user

                purchase.total_amount = Decimal("0.00")

                purchase.save()

                items = formset.save(commit=False)

                # Ignore deleted forms
                items = [
                    item for item in items
                    if item is not None
                ]

                # Calculate subtotal & total
                total = calculate_total(items)

                # Save purchase items
                for item in items:

                    item.purchase = purchase

                    item.save()

                # Increase stock
                increase_stock(items)

                # Save total
                purchase.total_amount = total

                purchase.save()

                # Create accounting entries
                create_accounting_entries(purchase)

                messages.success(
                    request,
                    "Purchase created successfully."
                )

                return redirect("purchase_list")

    else:

        form = PurchaseForm()

        form.fields["supplier"].queryset = Supplier.objects.filter(
            owner=request.user
        )

        formset = PurchaseItemFormSet()

        for item_form in formset:
            item_form.fields["product"].queryset = Product.objects.filter(
                owner=request.user
            )
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

    purchase = get_object_or_404(
        Purchase,
        pk=pk,
        owner=request.user
    )

    if request.method == "POST":

        form = PurchaseForm(
            request.POST,
            instance=purchase
        )

        form.fields["supplier"].queryset = Supplier.objects.filter(
            owner=request.user
        )

        formset = PurchaseItemFormSet(
            request.POST,
            instance=purchase
        )

        for item_form in formset:
            item_form.fields["product"].queryset = Product.objects.filter(
                owner=request.user
            )

        if form.is_valid() and formset.is_valid():

            # Restore stock from previous purchase
            restore_stock(purchase)

            # Save purchase details
            purchase = form.save(commit=False)

            # Remove old purchase items
            PurchaseItem.objects.filter(
                purchase=purchase
            ).delete()

            total = Decimal("0.00")

            # Save every form in the formset
            for item_form in formset:

                if not item_form.cleaned_data:
                    continue

                if item_form.cleaned_data.get("DELETE"):
                    continue

                item = item_form.save(commit=False)

                item.purchase = purchase

                item.subtotal = (
                    item.quantity *
                    item.purchase_price
                )

                total += item.subtotal

                # Increase stock
                product = item.product

                product.stock_quantity += item.quantity

                product.save()

                item.save()

            purchase.total_amount = total

            purchase.save()

            update_accounting_entries(purchase)

            messages.success(
                request,
                "Purchase updated successfully."
            )

            return redirect("purchase_list")

    else:

        form = PurchaseForm(instance=purchase)

        form.fields["supplier"].queryset = Supplier.objects.filter(
            owner=request.user
        )

        formset = PurchaseItemFormSet(instance=purchase)

        for item_form in formset:
            item_form.fields["product"].queryset = Product.objects.filter(
                owner=request.user
            )
    return render(
        request,
        "edit_purchase.html",
        {
            "form": form,
            "formset": formset,
        }
    )
def purchase_invoice(request, pk):

    purchase = get_object_or_404(
        Purchase.objects.select_related("supplier"),
        pk=pk,
        owner=request.user
    )

    items = PurchaseItem.objects.select_related(
        "product"
    ).filter(
        purchase=purchase
    )

    return render(
        request,
        "purchase_invoice.html",
        {
            "purchase": purchase,
            "items": items,
        }
    )
def purchase_invoice_pdf(request, pk):

    purchase = get_object_or_404(
        Purchase,
        pk=pk,
        owner=request.user
    )

    items = PurchaseItem.objects.filter(
        purchase=purchase
    )

    response = HttpResponse(
        content_type="application/pdf"
    )

    response["Content-Disposition"] = (
        f'attachment; filename="Purchase_{purchase.invoice_number}.pdf"'
    )

    pdf = canvas.Canvas(response)

    y = 800

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(
        170,
        y,
        "Business Accounting ERP"
    )

    y -= 40

    pdf.setFont("Helvetica", 12)

    pdf.drawString(
        50,
        y,
        f"Purchase Invoice : {purchase.invoice_number}"
    )

    y -= 20

    pdf.drawString(
        50,
        y,
        f"Supplier : {purchase.supplier}"
    )

    y -= 20

    pdf.drawString(
        50,
        y,
        f"Date : {purchase.purchase_date}"
    )

    y -= 40

    pdf.setFont("Helvetica-Bold", 12)

    pdf.drawString(50, y, "Product")
    pdf.drawString(240, y, "Qty")
    pdf.drawString(320, y, "Price")
    pdf.drawString(430, y, "Subtotal")

    y -= 20

    pdf.line(50, y, 550, y)

    y -= 20

    pdf.setFont("Helvetica", 11)

    for item in items:

        pdf.drawString(
            50,
            y,
            item.product.name
        )

        pdf.drawString(
            240,
            y,
            str(item.quantity)
        )

        pdf.drawString(
            320,
            y,
            str(item.purchase_price)
        )

        pdf.drawString(
            430,
            y,
            str(item.subtotal)
        )

        y -= 20

    y -= 20

    pdf.line(50, y, 550, y)

    y -= 30

    pdf.setFont("Helvetica-Bold", 14)

    pdf.drawString(
        300,
        y,
        f"Grand Total : ₹ {purchase.total_amount}"
    )

    y -= 60

    pdf.setFont("Helvetica", 12)

    pdf.drawString(
        50,
        y,
        "Authorized Signature"
    )

    pdf.showPage()

    pdf.save()

    return response
@transaction.atomic
def delete_purchase(request, pk):

    purchase = get_object_or_404(
        Purchase,
        pk=pk,
        owner=request.user
    )

    # Restore Stock
    items = PurchaseItem.objects.filter(
        purchase=purchase
    )

    for item in items:

        product = item.product

        product.stock_quantity -= item.quantity

        product.save()

    # Delete Accounting Entries
    delete_accounting_entries(purchase)

    # Delete Purchase Items
    items.delete()

    # Delete Purchase
    purchase.delete()

    messages.success(
        request,
        "Purchase deleted successfully."
    )

    return redirect("purchase_list")