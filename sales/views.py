from decimal import Decimal

from django.contrib import messages
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from reportlab.pdfgen import canvas

from accounting.models import CashBook, Journal, Ledger
from .forms import SaleForm, SaleItemFormSet
from .models import Sale, SaleItem
from .services import (
    restore_stock,
    reduce_stock,
    calculate_total,
    create_accounting_entries,
    update_accounting_entries,
    delete_accounting_entries,
)


def sale_list(request):

    query = request.GET.get("q", "")

    sales = Sale.objects.select_related(
        "customer"
    )

    if query:

        sales = sales.filter(

            Q(invoice_number__icontains=query)

            |

            Q(customer__name__icontains=query)

        )

    sales = sales.order_by("-sale_date")

    paginator = Paginator(
        sales,
        10
    )

    page_number = request.GET.get("page")

    sales = paginator.get_page(page_number)

    return render(

        request,

        "sales/sale_list.html",

        {

            "sales": sales,

            "query": query,

        },

    )
def sale_invoice(request, pk):

    sale = get_object_or_404(
        Sale.objects.select_related("customer"),
        pk=pk,
    )

    items = SaleItem.objects.select_related(
        "product"
    ).filter(
        sale=sale
    )

    return render(

        request,

        "sales/sale_invoice.html",

        {

            "sale": sale,

            "items": items,

        },

    )
def sale_invoice_pdf(request, pk):

    sale = get_object_or_404(
        Sale,
        pk=pk
    )

    items = SaleItem.objects.filter(
        sale=sale
    )

    response = HttpResponse(
        content_type="application/pdf"
    )

    response["Content-Disposition"] = (
        f'attachment; filename="Invoice_{sale.invoice_number}.pdf"'
    )

    pdf = canvas.Canvas(response)

    y = 800

    pdf.setFont("Helvetica-Bold", 18)

    pdf.drawString(
        180,
        y,
        "Business Accounting ERP"
    )

    y -= 40

    pdf.setFont("Helvetica", 12)

    pdf.drawString(
        50,
        y,
        f"Invoice : {sale.invoice_number}"
    )

    y -= 20

    pdf.drawString(
        50,
        y,
        f"Customer : {sale.customer.name}"
    )

    y -= 20

    pdf.drawString(
        50,
        y,
        f"Date : {sale.sale_date}"
    )

    y -= 40

    pdf.setFont("Helvetica-Bold", 12)

    pdf.drawString(50, y, "Product")

    pdf.drawString(250, y, "Qty")

    pdf.drawString(330, y, "Price")

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
            250,
            y,
            str(item.quantity)
        )

        pdf.drawString(
            330,
            y,
            f"{item.selling_price}"
        )

        pdf.drawString(
            430,
            y,
            f"{item.subtotal}"
        )

        y -= 20

    y -= 20

    pdf.line(50, y, 550, y)

    y -= 30

    pdf.setFont("Helvetica-Bold", 14)

    pdf.drawString(
        320,
        y,
        f"Grand Total : ₹ {sale.total_amount}"
    )

    y -= 50

    pdf.setFont("Helvetica", 12)

    pdf.drawString(
        50,
        y,
        "Authorized Signature"
    )

    pdf.showPage()

    pdf.save()

    return response

def view_sale(request, pk):

    sale = get_object_or_404(
        Sale.objects.select_related("customer"),
        pk=pk,
    )

    items = SaleItem.objects.select_related(
        "product"
    ).filter(
        sale=sale
    )

    return render(

        request,

        "sales/view_sale.html",

        {

            "sale": sale,

            "items": items,

        },

    )

@transaction.atomic
def delete_sale(request, pk):

    sale = get_object_or_404(
        Sale,
        pk=pk
    )

    items = SaleItem.objects.filter(
        sale=sale
    )

    for item in items:

        product = item.product

        product.stock_quantity += item.quantity

        product.save()

    Ledger.objects.filter(
        reference=sale.invoice_number
    ).delete()

    Journal.objects.filter(
        reference=sale.invoice_number
    ).delete()

    CashBook.objects.filter(
        reference=sale.invoice_number
    ).delete()

    sale.delete()

    messages.success(
        request,
        "Sale deleted successfully."
    )

    return redirect("sale_list")

@transaction.atomic
def edit_sale(request, pk):

    sale = get_object_or_404(Sale, pk=pk)

    if request.method == "POST":

        form = SaleForm(request.POST, instance=sale)
        formset = SaleItemFormSet(request.POST, instance=sale)

        if form.is_valid() and formset.is_valid():

            # Restore previous stock
            for old_item in SaleItem.objects.filter(sale=sale):

                product = old_item.product
                product.stock_quantity += old_item.quantity
                product.save()

            # Delete previous SaleItems
            SaleItem.objects.filter(sale=sale).delete()

            # Save updated sale
            sale = form.save(commit=False)

            total = Decimal("0.00")

            # Save new SaleItems
            for form_item in formset:

                if not form_item.cleaned_data:
                    continue

                if form_item.cleaned_data.get("DELETE"):
                    continue

                item = form_item.save(commit=False)

                item.sale = sale

                product = item.product

                # Check stock
                if product.stock_quantity < item.quantity:

                    messages.error(
                        request,
                        f"Insufficient stock for {product.name}"
                    )

                    return render(
                        request,
                        "sales/edit_sale.html",
                        {
                            "form": form,
                            "formset": formset,
                        }
                    )

                # Reduce stock
                product.stock_quantity -= item.quantity
                product.save()

                # Calculate subtotal
                item.subtotal = (
                    item.quantity *
                    item.selling_price
                )

                total += item.subtotal

                item.save()

            # Update total
            sale.total_amount = total
            sale.save()

            # Update Ledger
            Ledger.objects.filter(
                reference=sale.invoice_number
            ).update(
                date=sale.sale_date,
                debit=total,
                credit=0,
                balance=total,
                particulars=f"Sale Invoice {sale.invoice_number}",
            )

            # Update Journal
            Journal.objects.filter(
                reference=sale.invoice_number
            ).update(
                date=sale.sale_date,
                amount=total,
                debit_account="Cash",
                credit_account="Sales",
                description=f"Sale Invoice {sale.invoice_number}",
            )

            # Update CashBook
            CashBook.objects.filter(
                reference=sale.invoice_number
            ).update(
                date=sale.sale_date,
                receipt=total,
                payment=0,
                balance=total,
                remarks=f"Sale Invoice {sale.invoice_number}",
            )

            messages.success(
                request,
                "Sale updated successfully."
            )

            return redirect("sale_list")

        else:

            messages.error(
                request,
                "Please correct the errors below."
            )

    else:

        form = SaleForm(instance=sale)
        formset = SaleItemFormSet(instance=sale)

    return render(
        request,
        "sales/edit_sale.html",
        {
            "form": form,
            "formset": formset,
        }
    )
from decimal import Decimal

@transaction.atomic
def add_sale(request):

    if request.method == "POST":

        form = SaleForm(request.POST)
        formset = SaleItemFormSet(request.POST)

        if form.is_valid() and formset.is_valid():

            sale = form.save(commit=False)
            sale.total_amount = Decimal("0.00")
            sale.save()

            items = formset.save(commit=False)

            try:

                # Validate and reduce stock
                reduce_stock(items)

                # Calculate total
                total = calculate_total(items)

                # Save Sale Items
                for item in items:

                    item.sale = sale
                    item.save()

                # Update Sale Total
                sale.total_amount = total
                sale.save()

                # Create Accounting Entries
                create_accounting_entries(sale)

                messages.success(
                    request,
                    "Sale created successfully."
                )

                return redirect("sale_list")

            except ValueError as e:

                sale.delete()

                messages.error(
                    request,
                    str(e)
                )

    else:

        form = SaleForm()
        formset = SaleItemFormSet()

    return render(
        request,
        "sales/sale_form.html",
        {
            "form": form,
            "formset": formset,
        }
    )